"""
Pydantic schemas for the ML forecasting microservice.

Field names use snake_case on the Python side while the API
automatically accepts/returns camelCase names for compatibility
with the Spring Boot backend.
"""

from __future__ import annotations

from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict


# -------------------------------------------------------------------
# CamelCase conversion
# -------------------------------------------------------------------

def to_camel(string: str) -> str:
    parts = string.split("_")

    return (
        parts[0]
        + "".join(
            word.capitalize()
            for word in parts[1:]
        )
    )


# -------------------------------------------------------------------
# Base model
# -------------------------------------------------------------------

class CamelModel(BaseModel):
    """
    Allows Python code to use snake_case while the API can use
    camelCase field names.
    """

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


# -------------------------------------------------------------------
# Sales history
# -------------------------------------------------------------------

class SalesPoint(CamelModel):
    date: date

    units: int = Field(
        ge=0,
        description="Number of units sold on this date.",
    )


# -------------------------------------------------------------------
# Forecast request
# -------------------------------------------------------------------

class ForecastRequest(CamelModel):
    history: List[SalesPoint] = Field(
        default_factory=list,
        description="Historical daily sales data.",
    )

    horizon_days: int = Field(
        default=30,
        ge=1,
        le=365,
        description="Number of future days to forecast.",
    )

    lead_time_days: int = Field(
        default=7,
        ge=0,
        le=365,
        description="Number of days required to receive a reorder.",
    )

    current_stock: int = Field(
        default=0,
        ge=0,
        description="Current inventory quantity.",
    )

    safety_stock: int = Field(
        default=0,
        ge=0,
        description="Extra inventory kept as a safety buffer.",
    )

    demand_change_percent: float = Field(
        default=0.0,
        ge=-100.0,
        description=(
            "Percentage change applied to predicted demand "
            "for what-if simulation."
        ),
    )


# -------------------------------------------------------------------
# Daily forecast point
# -------------------------------------------------------------------

class DailyPoint(CamelModel):
    date: str

    predicted: float = Field(
        ge=0,
    )

    lower: float = Field(
        ge=0,
    )

    upper: float = Field(
        ge=0,
    )

    actual: Optional[float] = Field(
        default=None,
        ge=0,
    )


# -------------------------------------------------------------------
# Forecast response
# -------------------------------------------------------------------

class ForecastResponse(CamelModel):
    method: str

    predicted_units_next7: float = Field(
        ge=0,
    )

    predicted_units_next30: float = Field(
        ge=0,
    )

    trend: str

    trend_strength: float

    seasonality_index: float = Field(
        ge=0,
    )

    confidence: float = Field(
        ge=0,
        le=100,
    )

    days_until_stockout: Optional[int] = Field(
        default=None,
        ge=0,
    )

    recommended_reorder_qty: int = Field(
        ge=0,
    )

    recommended_reorder_by: Optional[str] = None

    daily_forecast: List[DailyPoint]