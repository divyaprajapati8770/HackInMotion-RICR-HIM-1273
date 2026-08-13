"""
Demand forecasting engine.

Approach (documented per the problem statement's requirement to explain
"which approach you used, why, and how it's integrated" in the README):

1. Build a dense daily time series from the uploaded/seeded sales history,
   filling any gap days with 0 units sold.
2. If there's enough history (>= 14 days spanning at least 2 weekly
   cycles), fit a Holt-Winters (triple exponential smoothing) model with
   an additive trend and an additive weekly (period=7) seasonal
   component via statsmodels. This captures both the overall trend
   (growing/declining product) and weekly seasonality (e.g. weekend
   spikes) without needing a full year of data.
3. If there isn't enough history, or the model fails to converge, fall
   back to a weighted moving average with a linear trend line and a
   day-of-week seasonality index computed directly from the data. This
   mirrors the Java-side fallback in the Spring Boot backend so the two
   never wildly disagree, and guarantees the endpoint always returns a
   sensible forecast instead of an error.
4. A simple broad-season multiplier (Oct/Nov "festival season", June
   "mid-year sale") is layered on top when at least 90 days of history
   are available, giving a lightweight answer to the "seasonal & festival
   trend detection" stretch goal without requiring a full year of data
   to learn it purely statistically.
5. The forecast is walked forward day-by-day against current stock to
   find the projected stockout date, from which a recommended reorder
   quantity and reorder-by date are derived (lead time + safety stock).
"""
from __future__ import annotations

import warnings
from datetime import date, timedelta
from typing import List, Optional

import numpy as np
import pandas as pd

from models import DailyPoint, ForecastResponse, SalesPoint

warnings.filterwarnings("ignore")  # statsmodels convergence warnings are expected on sparse data

FESTIVAL_MONTHS = {10: 1.6, 11: 1.6, 6: 1.3, 1: 0.85}


def _build_daily_series(history: List[SalesPoint]) -> pd.Series:
    if not history:
        return pd.Series(dtype=float)

    df = pd.DataFrame([{"date": pd.Timestamp(h.date), "units": h.units} for h in history])
    df = df.groupby("date")["units"].sum()

    full_index = pd.date_range(df.index.min(), df.index.max(), freq="D")
    series = df.reindex(full_index, fill_value=0).astype(float)
    return series


def _festival_multiplier(target_date: pd.Timestamp) -> float:
    return FESTIVAL_MONTHS.get(target_date.month, 1.0)


def _holt_winters_forecast(series: pd.Series, horizon_days: int) -> Optional[dict]:
    """Try a seasonal Holt-Winters model. Returns None if data is too sparse or it fails."""
    if len(series) < 14 or series.sum() == 0:
        return None

    try:
        from statsmodels.tsa.holtwinters import ExponentialSmoothing

        seasonal_periods = 7 if len(series) >= 14 else None
        model = ExponentialSmoothing(
            series,
            trend="add",
            damped_trend=True,
            seasonal="add" if seasonal_periods else None,
            seasonal_periods=seasonal_periods,
            initialization_method="estimated",
        )
        fit = model.fit(optimized=True)
        forecast_values = fit.forecast(horizon_days)
        forecast_values = forecast_values.clip(lower=0)

        residuals = fit.resid
        resid_std = float(np.std(residuals)) if len(residuals) > 1 else float(series.std() or 1.0)

        # Trend: compare the fitted level's slope over the last ~2 weeks.
        fitted = fit.fittedvalues
        tail = fitted.tail(min(14, len(fitted)))
        if len(tail) >= 2:
            x = np.arange(len(tail))
            slope = float(np.polyfit(x, tail.values, 1)[0])
        else:
            slope = 0.0

        seasonal_component = getattr(fit, "season", None)
        if seasonal_component is not None and len(seasonal_component) > 0:
            seasonality_index = float(np.mean(np.abs(seasonal_component)) / max(series.mean(), 1e-6))
        else:
            seasonality_index = 0.0

        return {
            "method": "HOLT_WINTERS_TRIPLE_EXPONENTIAL_SMOOTHING",
            "forecast": forecast_values,
            "resid_std": resid_std,
            "slope": slope,
            "seasonality_index": round(min(seasonality_index, 3.0), 3),
            "data_points": len(series),
        }
    except Exception:
        return None


def _fallback_forecast(series: pd.Series, horizon_days: int) -> dict:
    """Weighted moving average + linear trend + day-of-week index. Mirrors the Java fallback."""
    if len(series) == 0:
        last_date = pd.Timestamp(date.today())
        empty = pd.Series([0.0] * horizon_days,
                           index=pd.date_range(last_date + timedelta(days=1), periods=horizon_days))
        return {"method": "WEIGHTED_MOVING_AVERAGE_TREND_SEASONALITY", "forecast": empty,
                "resid_std": 0.0, "slope": 0.0, "seasonality_index": 0.0, "data_points": 0}

    window = min(28, len(series))
    recent = series.tail(window)
    weights = np.arange(1, window + 1)
    baseline = float(np.average(recent.values, weights=weights))

    x = np.arange(window)
    slope = float(np.polyfit(x, recent.values, 1)[0]) if window >= 2 else 0.0

    dow_means = series.groupby(series.index.dayofweek).mean()
    overall_mean = max(series.mean(), 1e-6)
    dow_index = (dow_means / overall_mean).to_dict()

    last_date = series.index.max()
    future_dates = pd.date_range(last_date + timedelta(days=1), periods=horizon_days)
    values = []
    for i, d in enumerate(future_dates, start=1):
        trended = baseline + slope * i
        seasonal = trended * dow_index.get(d.dayofweek, 1.0)
        values.append(max(0.0, seasonal))

    forecast = pd.Series(values, index=future_dates)
    seasonality_index = float(np.std(list(dow_index.values())))

    return {
        "method": "WEIGHTED_MOVING_AVERAGE_TREND_SEASONALITY",
        "forecast": forecast,
        "resid_std": float(series.std() or baseline * 0.25),
        "slope": slope,
        "seasonality_index": round(seasonality_index, 3),
        "data_points": len(series),
    }


def generate_forecast(
    history: List[SalesPoint],
    horizon_days: int,
    lead_time_days: int,
    current_stock: int,
    safety_stock: int,
    demand_change_percent: float,
) -> ForecastResponse:
    series = _build_daily_series(history)

    result = _holt_winters_forecast(series, horizon_days)
    if result is None:
        result = _fallback_forecast(series, horizon_days)

    forecast: pd.Series = result["forecast"]
    demand_multiplier = 1.0 + (demand_change_percent / 100.0)

    apply_festival = result["data_points"] >= 90

    daily_points: List[DailyPoint] = []
    running_stock = float(current_stock)
    days_until_stockout: Optional[int] = None
    cumulative_7 = 0.0
    cumulative_30 = 0.0

    for i, (ts, predicted_raw) in enumerate(forecast.items(), start=1):
        festival_mult = _festival_multiplier(ts) if apply_festival else 1.0
        predicted = max(0.0, float(predicted_raw) * demand_multiplier * festival_mult)
        band = max(result["resid_std"], predicted * 0.15)

        daily_points.append(DailyPoint(
            date=ts.strftime("%Y-%m-%d"),
            predicted=round(predicted, 2),
            lower=round(max(0.0, predicted - band), 2),
            upper=round(predicted + band, 2),
            actual=None,
        ))

        if i <= 7:
            cumulative_7 += predicted
        if i <= 30:
            cumulative_30 += predicted

        running_stock -= predicted
        if days_until_stockout is None and running_stock <= 0:
            days_until_stockout = i

    mean_daily = (cumulative_30 / min(30, len(daily_points))) if daily_points else 0.0
    reorder_qty = max(0, round((mean_daily * (lead_time_days + 7)) - current_stock + safety_stock))

    reorder_by: Optional[str] = None
    if days_until_stockout is not None:
        reorder_in_days = max(0, days_until_stockout - lead_time_days)
        base_date = series.index.max().to_pydatetime().date() if len(series) else date.today()
        reorder_by = (base_date + timedelta(days=reorder_in_days)).strftime("%Y-%m-%d")

    trend_threshold = 0.02 * max(mean_daily, 1.0)
    if result["slope"] > trend_threshold:
        trend_label = "UP"
    elif result["slope"] < -trend_threshold:
        trend_label = "DOWN"
    else:
        trend_label = "STABLE"

    data_points = result["data_points"]
    confidence = min(92.0, max(30.0, 40.0 + min(data_points, 150) * 0.4))

    return ForecastResponse(
        method=result["method"],
        predicted_units_next7=round(cumulative_7, 2),
        predicted_units_next30=round(cumulative_30, 2),
        trend=trend_label,
        trend_strength=round(result["slope"], 3),
        seasonality_index=round(result["seasonality_index"], 3),
        confidence=round(confidence, 2),
        days_until_stockout=days_until_stockout,
        recommended_reorder_qty=int(reorder_qty),
        recommended_reorder_by=reorder_by,
        daily_forecast=daily_points,
    )
