from forecasting import generate_forecast
from models import SalesPoint


# Test 2: Limited historical data
# Only 7 days of history.
# Expected model: Weighted Moving Average + Trend + Seasonality

history = [
    SalesPoint(date="2026-08-01", units=20),
    SalesPoint(date="2026-08-02", units=25),
    SalesPoint(date="2026-08-03", units=30),
    SalesPoint(date="2026-08-04", units=28),
    SalesPoint(date="2026-08-05", units=35),
    SalesPoint(date="2026-08-06", units=40),
    SalesPoint(date="2026-08-07", units=45),
]


result = generate_forecast(
    history=history,
    horizon_days=30,
    lead_time_days=7,
    current_stock=200,
    safety_stock=30,
    demand_change_percent=0,
)


print("=" * 60)
print("TEST 2 - LIMITED HISTORY / FALLBACK MODEL")
print("=" * 60)

print("Model Used:", result.method)
print("Next 7 Days Demand:", result.predicted_units_next7)
print("Next 30 Days Demand:", result.predicted_units_next30)
print("Trend:", result.trend)
print("Trend Strength:", result.trend_strength)
print("Seasonality Index:", result.seasonality_index)
print("Confidence:", result.confidence, "%")
print("Days Until Stockout:", result.days_until_stockout)
print("Recommended Reorder Quantity:", result.recommended_reorder_qty)
print("Recommended Reorder By:", result.recommended_reorder_by)

print("\nFirst 7 Days Forecast:")
print("-" * 60)

for point in result.daily_forecast[:7]:
    print(
        point.date,
        "| Predicted:", point.predicted,
        "| Range:", point.lower, "-", point.upper
    )

print("=" * 60)