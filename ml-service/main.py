"""
AI-Powered Inventory & Demand Forecasting System — ML microservice.

FastAPI service called by the Spring Boot backend to generate
inventory demand forecasts.
"""

from __future__ import annotations

import os

# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware

from forecasting import generate_forecast
from models import ForecastRequest, ForecastResponse


# -------------------------------------------------------------------
# FastAPI application
# -------------------------------------------------------------------

app = FastAPI(
    title="Inventory Forecasting ML Service",
    description=(
        "Statistical demand forecasting for the "
        "AI-Powered Inventory & Demand Forecasting System."
    ),
    version="1.0.0",
)


# -------------------------------------------------------------------
# CORS
# -------------------------------------------------------------------

# Keep this open during local development.
# Restrict it to your actual frontend origin before deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# -------------------------------------------------------------------
# Health check
# -------------------------------------------------------------------

@app.get(
    "/health",
    tags=["System"],
)
def health():
    """
    Check whether the ML service is running.
    """

    return {
        "status": "ok",
        "service": "inventory-forecasting-ml",
    }


# -------------------------------------------------------------------
# Forecast endpoint
# -------------------------------------------------------------------

@app.post(
    "/forecast",
    response_model=ForecastResponse,
    tags=["Forecasting"],
)
def forecast(
    request: ForecastRequest,
):
    """
    Generate an inventory demand forecast.
    """

    try:

        return generate_forecast(
            history=request.history,

            # Prevent excessively large forecast requests.
            horizon_days=min(
                request.horizon_days,
                180,
            ),

            lead_time_days=request.lead_time_days,

            current_stock=request.current_stock,

            safety_stock=request.safety_stock,

            demand_change_percent=(
                request.demand_change_percent
            ),
        )

    except ValueError as exc:

        # Client/data-related forecasting error.
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except Exception as exc:

        # Unexpected ML/service error.
        raise HTTPException(
            status_code=500,
            detail=(
                "Could not generate forecast. "
                "Please check the ML service logs."
            ),
        ) from exc


# -------------------------------------------------------------------
# Run locally
# -------------------------------------------------------------------

if __name__ == "__main__":

    import uvicorn

    host = os.getenv(
        "HOST",
        "0.0.0.0",
    )

    port = int(
        os.getenv(
            "PORT",
            "8000",
        )
    )

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
    )