"""
Pydantic schemas for the ML forecasting microservice.

Field names use snake_case on the wire (matching typical Python/FastAPI
convention) while the Spring Boot backend's Jackson mapper is configured
to translate to/from its camelCase Java records automatically.
"""
from __future__ import annotations

from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict


def to_camel(string: str) -> str:
    parts = string.split("_")
    return parts[0] + "".join(word.capitalize() for word in parts[1:])


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class SalesPoint(CamelModel):
    date: date
    units: int


class ForecastRequest(CamelModel):
    history: List[SalesPoint] = Field(default_factory=list)
    horizon_days: int = 30
    lead_time_days: int = 7
    current_stock: int = 0
    safety_stock: int = 0
    demand_change_percent: float = 0.0  # used by the what-if simulator; 0 for a normal forecast


class DailyPoint(CamelModel):
    date: str
    predicted: float
    lower: float
    upper: float
    actual: Optional[float] = None


class ForecastResponse(CamelModel):
    method: str
    predicted_units_next7: float
    predicted_units_next30: float
    trend: str
    trend_strength: float
    seasonality_index: float
    confidence: float
    days_until_stockout: Optional[int] = None
    recommended_reorder_qty: int
    recommended_reorder_by: Optional[str] = None
    daily_forecast: List[DailyPoint]
