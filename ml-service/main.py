"""
AI-Powered Inventory & Demand Forecasting System — ML microservice.

FastAPI service called by the Spring Boot backend to generate
inventory demand forecasts.
"""

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from forecasting import generate_forecast
from models import ForecastRequest, ForecastResponse


app = FastAPI(
    title="Inventory Forecasting ML Service",
    description=(
        "Statistical demand forecasting for the "
        "AI-Powered Inventory & Demand Forecasting System."
    ),
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System"])
def health():
    return {
        "status": "ok",
        "service": "inventory-forecasting-ml",
    }


@app.post(
    "/forecast",
    response_model=ForecastResponse,
    tags=["Forecasting"],
)
def forecast(request: ForecastRequest):
    try:
        return generate_forecast(
            history=request.history,
            horizon_days=max(1, min(request.horizon_days, 180)),
            lead_time_days=max(0, request.lead_time_days),
            current_stock=max(0, request.current_stock),
            safety_stock=max(0, request.safety_stock),
            demand_change_percent=request.demand_change_percent,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Could not generate a forecast: {exc}",
        ) from exc


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
    )