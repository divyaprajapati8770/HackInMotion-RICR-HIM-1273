<<<<<<< HEAD
# AI-Powered Inventory & Demand Forecasting System

A web-based platform for retail/e-commerce businesses to manage product inventory and get intelligent, data-driven predictions on future product demand — helping store owners make smarter restocking decisions.

**Team:** RICR-HIM-1273
**Team members:** Divya Prajapati, Mayank Singh Bhati, Vivek Chauhan, Abdul Arham Jamal
**Theme:** E-Commerce & Retail
**Hackathon:** HackInMotion

---

## Table of Contents
- [Problem Statement](#problem-statement)

---

## Problem Statement

Most small and mid-sized retailers still manage inventory using guesswork or basic spreadsheets rather than real data-driven predictions. Ordering too little leads to stockouts and lost sales; ordering too much ties up money in unsold inventory. This project builds a full-stack application that lets a business:

- Manage product inventory
- Upload or generate historical sales data
- Generate AI/ML- or statistics-driven demand forecasts
- Receive automated low-stock / overstock alerts
- View everything through a clear, actionable dashboard
=======
# Stockwise — AI-Powered Inventory & Demand Forecasting System

> "Because empty shelves lose sales, and overstocked shelves lose money."

A full-stack, working web application for retail/e-commerce businesses to manage inventory, ingest sales history, and get AI-driven demand forecasts, restocking alerts, and what-if simulations — built for the HackInMotion hackathon problem statement.

![Architecture](./architecture-diagram.png)

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, GSAP, Recharts, Phosphor Icons |
| Backend | Java 21, Spring Boot 3, Spring Security (JWT), Spring Data JPA, springdoc-openapi (Swagger) |
| Forecasting | Python 3.12, FastAPI, statsmodels (Holt-Winters), pandas, numpy |
| Database | MySQL 8 |
| Orchestration | Docker Compose |

## Why four services instead of one?

The forecasting engine is intentionally a separate Python microservice rather than bolted into the Java backend, because:

1. It lets the actual data-science code (statsmodels, pandas) live in the language best suited for it, while the backend stays a clean, typed Spring Boot API.
2. It can be swapped for a heavier model (Prophet, LSTM, a hosted AI API) later without touching a single Java file — only the `/forecast` HTTP contract matters.
3. It demonstrates graceful degradation: if the ML service is down, slow, or still starting up, the Spring Boot backend automatically falls back to an equivalent **Java-native statistical model** (`LocalForecastEngine`) so forecasts and the dashboard never hard-fail (problem statement requirement #9).

>>>>>>> a5aea27 (Landing page UI)
