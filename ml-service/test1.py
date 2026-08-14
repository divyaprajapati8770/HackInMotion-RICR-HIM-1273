from forecasting import generate_forecast
from models import SalesPoint


# Test 1: Normal forecasting
# 28 days of historical sales
# Expected model: Holt-Winters


history = [
    SalesPoint(date="2026-07-01", units=20),
    SalesPoint(date="2026-07-02", units=24),
    SalesPoint(date="2026-07-03", units=28),
    SalesPoint(date="2026-07-04", units=35),
    SalesPoint(date="2026-07-05", units=40),
    SalesPoint(date="2026-07-06", units=25),
    SalesPoint(date="2026-07-07", units=22),

    SalesPoint(date="2026-07-08", units=21),
    SalesPoint(date="2026-07-09", units=26),
    SalesPoint(date="2026-07-10", units=30),
    SalesPoint(date="2026-07-11", units=37),
    SalesPoint(date="2026-07-12", units=43),
    SalesPoint(date="2026-07-13", units=27),
    SalesPoint(date="2026-07-14", units=23),

    SalesPoint(date="2026-07-15", units=23),
    SalesPoint(date="2026-07-16", units=27),
    SalesPoint(date="2026-07-17", units=32),
    SalesPoint(date="2026-07-18", units=39),
    SalesPoint(date="2026-07-19", units=45),
    SalesPoint(date="2026-07-20", units=29),
    SalesPoint(date="2026-07-21", units=24),

    SalesPoint(date="2026-07-22", units=25),
    SalesPoint(date="2026-07-23", units=29),
    SalesPoint(date="2026-07-24", units=34),
    SalesPoint(date="2026-07-25", units=42),
    SalesPoint(date="2026-07-26", units=48),
    SalesPoint(date="2026-07-27", units=31),
    SalesPoint(date="2026-07-28", units=26),
]


result = generate_forecast(
    history=history,
    horizon_days=30,
    lead_time_days=7,
    current_stock=300,
    safety_stock=50,
    demand_change_percent=0,
)


print("=" * 60)
print("TEST 1 - NORMAL FORECASTING")
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