"""
Demand forecasting engine.

Approach:
1. Build a dense daily time series from sales history.
2. If enough history is available, use Holt-Winters
   triple exponential smoothing with weekly seasonality.
3. If Holt-Winters cannot be used, fall back to:
   weighted moving average + linear trend + day-of-week seasonality.
4. Evaluate the forecasting model on recent historical data
   using sMAPE to get a more meaningful confidence score.
5. Apply business-defined seasonal/festival adjustments when
   at least 90 days of history are available.
6. Use the forecast to estimate stockout date and reorder quantity.
"""

from __future__ import annotations

import warnings
from datetime import date, timedelta
from typing import List, Optional

import numpy as np
import pandas as pd

from models import DailyPoint, ForecastResponse, SalesPoint


# -------------------------------------------------------------------
# Configuration
# -------------------------------------------------------------------

warnings.filterwarnings("ignore")

# These are BUSINESS RULE multipliers, not values learned by ML.
# They can be changed later according to actual business data.
FESTIVAL_MONTHS = {
    10: 1.6,   # October
    11: 1.6,   # November
    6: 1.3,    # June
    1: 0.85,   # January
}

SEASONAL_PERIOD = 7
MIN_HISTORY_FOR_HOLT_WINTERS = 14
MIN_HISTORY_FOR_FESTIVAL_ADJUSTMENT = 90

FALLBACK_WINDOW = 28
EVALUATION_HORIZON = 7

REORDER_REVIEW_PERIOD_DAYS = 7


# -------------------------------------------------------------------
# Build daily time series
# -------------------------------------------------------------------

def _build_daily_series(history: List[SalesPoint]) -> pd.Series:
    """
    Convert sales history into a continuous daily time series.

    If there are missing dates, they are filled with 0 sales.
    If multiple records exist for the same date, their units are summed.
    """

    if not history:
        return pd.Series(dtype=float)

    df = pd.DataFrame(
        [
            {
                "date": pd.Timestamp(h.date),
                "units": h.units,
            }
            for h in history
        ]
    )

    # Combine multiple sales records from the same day.
    df = df.groupby("date")["units"].sum()

    # Create every date between first and last sale.
    full_index = pd.date_range(
        df.index.min(),
        df.index.max(),
        freq="D",
    )

    # Missing days = zero sales.
    series = df.reindex(
        full_index,
        fill_value=0,
    ).astype(float)

    return series


# -------------------------------------------------------------------
# Festival / seasonal business rule
# -------------------------------------------------------------------

def _festival_multiplier(target_date: pd.Timestamp) -> float:
    """
    Return a manually defined seasonal/festival multiplier.

    This is a business rule, not a machine-learning prediction.
    """

    return FESTIVAL_MONTHS.get(target_date.month, 1.0)


# -------------------------------------------------------------------
# Holt-Winters forecasting
# -------------------------------------------------------------------

def _holt_winters_forecast(
    series: pd.Series,
    horizon_days: int,
) -> Optional[dict]:
    """
    Forecast using Holt-Winters triple exponential smoothing.

    Uses:
        - additive trend
        - damped trend
        - additive weekly seasonality

    Returns None if:
        - history is too short
        - all sales are zero
        - model fitting fails
    """

    if len(series) < MIN_HISTORY_FOR_HOLT_WINTERS:
        return None

    if series.sum() == 0:
        return None

    try:
        from statsmodels.tsa.holtwinters import ExponentialSmoothing

        model = ExponentialSmoothing(
            series,
            trend="add",
            damped_trend=True,
            seasonal="add",
            seasonal_periods=SEASONAL_PERIOD,
            initialization_method="estimated",
        )

        fit = model.fit(
            optimized=True,
        )

        forecast_values = fit.forecast(
            horizon_days
        )

        # Sales cannot be negative.
        forecast_values = forecast_values.clip(
            lower=0
        )

        # -----------------------------------------------------------
        # Residual error
        # -----------------------------------------------------------

        residuals = fit.resid

        if len(residuals) > 1:
            resid_std = float(
                np.std(residuals)
            )
        else:
            resid_std = float(
                series.std() or 1.0
            )

        # -----------------------------------------------------------
        # Trend
        # -----------------------------------------------------------

        fitted = fit.fittedvalues

        tail = fitted.tail(
            min(14, len(fitted))
        )

        if len(tail) >= 2:
            x = np.arange(len(tail))

            slope = float(
                np.polyfit(
                    x,
                    tail.values,
                    1,
                )[0]
            )
        else:
            slope = 0.0

        # -----------------------------------------------------------
        # Seasonality strength
        # -----------------------------------------------------------

        seasonal_component = getattr(
            fit,
            "season",
            None,
        )

        if (
            seasonal_component is not None
            and len(seasonal_component) > 0
        ):
            seasonality_index = float(
                np.mean(
                    np.abs(
                        seasonal_component
                    )
                )
                / max(series.mean(), 1e-6)
            )
        else:
            seasonality_index = 0.0

        return {
            "method": (
                "HOLT_WINTERS_"
                "TRIPLE_EXPONENTIAL_SMOOTHING"
            ),
            "forecast": forecast_values,
            "resid_std": resid_std,
            "slope": slope,
            "seasonality_index": round(
                min(seasonality_index, 3.0),
                3,
            ),
            "data_points": len(series),
        }

    except Exception:
        return None


# -------------------------------------------------------------------
# Fallback forecasting model
# -------------------------------------------------------------------

def _fallback_forecast(
    series: pd.Series,
    horizon_days: int,
) -> dict:
    """
    Fallback forecasting method.

    Components:
        1. Weighted moving average
        2. Linear trend
        3. Day-of-week seasonality
    """

    # ---------------------------------------------------------------
    # No historical data
    # ---------------------------------------------------------------

    if len(series) == 0:

        last_date = pd.Timestamp(
            date.today()
        )

        empty = pd.Series(
            [0.0] * horizon_days,
            index=pd.date_range(
                last_date + timedelta(days=1),
                periods=horizon_days,
            ),
        )

        return {
            "method": (
                "WEIGHTED_MOVING_AVERAGE_"
                "TREND_SEASONALITY"
            ),
            "forecast": empty,
            "resid_std": 0.0,
            "slope": 0.0,
            "seasonality_index": 0.0,
            "data_points": 0,
        }

    # ---------------------------------------------------------------
    # Use recent data
    # ---------------------------------------------------------------

    window = min(
        FALLBACK_WINDOW,
        len(series),
    )

    recent = series.tail(
        window
    )

    # More recent days receive higher weights.
    weights = np.arange(
        1,
        window + 1,
    )

    baseline = float(
        np.average(
            recent.values,
            weights=weights,
        )
    )

    # ---------------------------------------------------------------
    # Linear trend
    # ---------------------------------------------------------------

    if window >= 2:

        x = np.arange(
            window
        )

        slope = float(
            np.polyfit(
                x,
                recent.values,
                1,
            )[0]
        )

    else:
        slope = 0.0

    # ---------------------------------------------------------------
    # Day-of-week seasonality
    # ---------------------------------------------------------------

    # Use recent data for consistency with the baseline/trend.
    dow_means = (
        recent
        .groupby(
            recent.index.dayofweek
        )
        .mean()
    )

    overall_mean = max(
        recent.mean(),
        1e-6,
    )

    dow_index = (
        dow_means / overall_mean
    ).to_dict()

    # ---------------------------------------------------------------
    # Generate future dates
    # ---------------------------------------------------------------

    last_date = series.index.max()

    future_dates = pd.date_range(
        last_date + timedelta(days=1),
        periods=horizon_days,
    )

    values = []

    for i, current_date in enumerate(
        future_dates,
        start=1,
    ):

        # Trend component.
        trended = (
            baseline
            + slope * i
        )

        # Day-of-week component.
        seasonal = (
            trended
            * dow_index.get(
                current_date.dayofweek,
                1.0,
            )
        )

        values.append(
            max(
                0.0,
                seasonal,
            )
        )

    forecast = pd.Series(
        values,
        index=future_dates,
    )

    # Measure variation between weekday factors.
    if dow_index:
        seasonality_index = float(
            np.std(
                list(
                    dow_index.values()
                )
            )
        )
    else:
        seasonality_index = 0.0

    return {
        "method": (
            "WEIGHTED_MOVING_AVERAGE_"
            "TREND_SEASONALITY"
        ),
        "forecast": forecast,
        "resid_std": float(
            series.std()
            or baseline * 0.25
        ),
        "slope": slope,
        "seasonality_index": round(
            seasonality_index,
            3,
        ),
        "data_points": len(series),
    }


# -------------------------------------------------------------------
# sMAPE evaluation
# -------------------------------------------------------------------

def _calculate_smape(
    actual: pd.Series,
    predicted: pd.Series,
) -> float:
    """
    Calculate symmetric Mean Absolute Percentage Error.

    sMAPE is useful here because normal MAPE can behave badly
    when actual sales contain zeros.
    """

    actual_values = np.asarray(
        actual,
        dtype=float,
    )

    predicted_values = np.asarray(
        predicted,
        dtype=float,
    )

    denominator = (
        np.abs(actual_values)
        + np.abs(predicted_values)
    )

    numerator = np.abs(
        actual_values
        - predicted_values
    )

    # Avoid division by zero.
    valid = denominator > 1e-8

    if not np.any(valid):
        return 0.0

    smape = np.mean(
        2.0
        * numerator[valid]
        / denominator[valid]
    )

    # Convert to percentage.
    return float(
        smape * 100
    )


# -------------------------------------------------------------------
# Model evaluation
# -------------------------------------------------------------------

def _evaluate_forecast_model(
    series: pd.Series,
    method: str,
) -> Optional[float]:
    """
    Evaluate a forecasting method on the most recent
    historical days.

    Returns sMAPE percentage.
    """

    if len(series) <= EVALUATION_HORIZON:
        return None

    train = series.iloc[
        :-EVALUATION_HORIZON
    ]

    test = series.iloc[
        -EVALUATION_HORIZON:
    ]

    if len(train) < 7:
        return None

    try:

        if method == "holt_winters":

            result = _holt_winters_forecast(
                train,
                EVALUATION_HORIZON,
            )

        else:

            result = _fallback_forecast(
                train,
                EVALUATION_HORIZON,
            )

        if result is None:
            return None

        predicted = result[
            "forecast"
        ]

        predicted = predicted.clip(
            lower=0
        )

        # Align indexes to avoid accidental
        # date mismatches.
        predicted_values = np.asarray(
            predicted.values,
            dtype=float,
        )

        actual_values = np.asarray(
            test.values,
            dtype=float,
        )

        return _calculate_smape(
            actual_values,
            predicted_values,
        )

    except Exception:
        return None


# -------------------------------------------------------------------
# Confidence calculation
# -------------------------------------------------------------------

def _calculate_confidence(
    smape: Optional[float],
    data_points: int,
) -> float:
    """
    Convert validation error into a simple confidence score.

    Lower sMAPE = higher confidence.

    When validation isn't possible, confidence is conservative.
    """

    # ---------------------------------------------------------------
    # No validation available
    # ---------------------------------------------------------------

    if smape is None:

        if data_points == 0:
            return 30.0

        # Conservative score based only on data availability.
        confidence = (
            40.0
            + min(
                data_points,
                150,
            ) * 0.2
        )

        return round(
            min(
                confidence,
                70.0,
            ),
            2,
        )

    # ---------------------------------------------------------------
    # Validation-based confidence
    # ---------------------------------------------------------------

    # sMAPE:
    # 0%   -> excellent
    # 20%  -> good
    # 40%  -> moderate
    # 70%+ -> weak
    #
    # Convert error into confidence.
    confidence = 100.0 - smape

    # Prevent unrealistically high/low values.
    confidence = max(
        30.0,
        min(
            95.0,
            confidence,
        ),
    )

    return round(
        confidence,
        2,
    )


# -------------------------------------------------------------------
# Main forecasting function
# -------------------------------------------------------------------

def generate_forecast(
    history: List[SalesPoint],
    horizon_days: int,
    lead_time_days: int,
    current_stock: int,
    safety_stock: int,
    demand_change_percent: float,
) -> ForecastResponse:

    # ---------------------------------------------------------------
    # Validate inputs
    # ---------------------------------------------------------------

    horizon_days = max(
        1,
        int(horizon_days),
    )

    lead_time_days = max(
        0,
        int(lead_time_days),
    )

    current_stock = max(
        0,
        int(current_stock),
    )

    safety_stock = max(
        0,
        int(safety_stock),
    )

    # ---------------------------------------------------------------
    # Build daily series
    # ---------------------------------------------------------------

    series = _build_daily_series(
        history
    )

    # ---------------------------------------------------------------
    # Select forecasting model
    # ---------------------------------------------------------------

    holt_result = _holt_winters_forecast(
        series,
        horizon_days,
    )

    if holt_result is not None:

        result = holt_result

        selected_method = (
            "holt_winters"
        )

    else:

        result = _fallback_forecast(
            series,
            horizon_days,
        )

        selected_method = (
            "fallback"
        )

    # ---------------------------------------------------------------
    # Evaluate selected model
    # ---------------------------------------------------------------

    smape = _evaluate_forecast_model(
        series,
        selected_method,
    )

    confidence = _calculate_confidence(
        smape,
        result["data_points"],
    )

    # ---------------------------------------------------------------
    # Apply user demand change
    # ---------------------------------------------------------------

    demand_multiplier = (
        1.0
        + (
            demand_change_percent
            / 100.0
        )
    )

    # Prevent negative demand.
    demand_multiplier = max(
        0.0,
        demand_multiplier,
    )

    # ---------------------------------------------------------------
    # Festival adjustment
    # ---------------------------------------------------------------

    apply_festival = (
        result["data_points"]
        >= MIN_HISTORY_FOR_FESTIVAL_ADJUSTMENT
    )

    # ---------------------------------------------------------------
    # Generate daily forecast
    # ---------------------------------------------------------------

    forecast: pd.Series = result[
        "forecast"
    ]

    daily_points: List[
        DailyPoint
    ] = []

    running_stock = float(
        current_stock
    )

    days_until_stockout: Optional[
        int
    ] = None

    cumulative_7 = 0.0
    cumulative_30 = 0.0

    for i, (
        ts,
        predicted_raw,
    ) in enumerate(
        forecast.items(),
        start=1,
    ):

        # -----------------------------------------------------------
        # Festival/business-rule adjustment
        # -----------------------------------------------------------

        if apply_festival:

            festival_mult = (
                _festival_multiplier(ts)
            )

        else:

            festival_mult = 1.0

        # -----------------------------------------------------------
        # Final predicted demand
        # -----------------------------------------------------------

        predicted = (
            float(predicted_raw)
            * demand_multiplier
            * festival_mult
        )

        predicted = max(
            0.0,
            predicted,
        )

        # -----------------------------------------------------------
        # Prediction interval
        # -----------------------------------------------------------

        band = max(
            result["resid_std"],
            predicted * 0.15,
        )

        daily_points.append(
            DailyPoint(
                date=ts.strftime(
                    "%Y-%m-%d"
                ),
                predicted=round(
                    predicted,
                    2,
                ),
                lower=round(
                    max(
                        0.0,
                        predicted - band,
                    ),
                    2,
                ),
                upper=round(
                    predicted + band,
                    2,
                ),
                actual=None,
            )
        )

        # -----------------------------------------------------------
        # 7-day and 30-day demand
        # -----------------------------------------------------------

        if i <= 7:
            cumulative_7 += predicted

        if i <= 30:
            cumulative_30 += predicted

        # -----------------------------------------------------------
        # Stockout calculation
        # -----------------------------------------------------------

        running_stock -= predicted

        if (
            days_until_stockout is None
            and running_stock <= 0
        ):
            days_until_stockout = i

    # ---------------------------------------------------------------
    # Average daily demand
    # ---------------------------------------------------------------

    if daily_points:

        mean_daily = (
            cumulative_30
            / min(
                30,
                len(daily_points),
            )
        )

    else:

        mean_daily = 0.0

    # ---------------------------------------------------------------
    # Reorder quantity
    # ---------------------------------------------------------------

    required_days = (
        lead_time_days
        + REORDER_REVIEW_PERIOD_DAYS
    )

    reorder_qty = max(
        0,
        round(
            (
                mean_daily
                * required_days
            )
            - current_stock
            + safety_stock
        ),
    )

    # ---------------------------------------------------------------
    # Reorder-by date
    # ---------------------------------------------------------------

    reorder_by: Optional[
        str
    ] = None

    if days_until_stockout is not None:

        reorder_in_days = max(
            0,
            days_until_stockout
            - lead_time_days,
        )

        if len(series):

            base_date = (
                series.index.max()
                .to_pydatetime()
                .date()
            )

        else:

            base_date = date.today()

        reorder_by = (
            base_date
            + timedelta(
                days=reorder_in_days
            )
        ).strftime(
            "%Y-%m-%d"
        )

    # ---------------------------------------------------------------
    # Trend detection
    # ---------------------------------------------------------------

    trend_threshold = (
        0.02
        * max(
            mean_daily,
            1.0,
        )
    )

    if (
        result["slope"]
        > trend_threshold
    ):

        trend_label = "UP"

    elif (
        result["slope"]
        < -trend_threshold
    ):

        trend_label = "DOWN"

    else:

        trend_label = "STABLE"

    # ---------------------------------------------------------------
    # Return final response
    # ---------------------------------------------------------------

    return ForecastResponse(
        method=result["method"],

        predicted_units_next7=round(
            cumulative_7,
            2,
        ),

        predicted_units_next30=round(
            cumulative_30,
            2,
        ),

        trend=trend_label,

        trend_strength=round(
            result["slope"],
            3,
        ),

        seasonality_index=round(
            result["seasonality_index"],
            3,
        ),

        confidence=confidence,

        days_until_stockout=(
            days_until_stockout
        ),

        recommended_reorder_qty=int(
            reorder_qty
        ),

        recommended_reorder_by=(
            reorder_by
        ),

        daily_forecast=daily_points,
    )