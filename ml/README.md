# ML Service - Smart Farmer Procurement Management System

Python + FastAPI ML service for **Wait-Time Prediction** and **Smart Center Recommendation**.

This service implements the ML/extension section (Section 13) of the master development document.

## Features

- **Wait-Time Prediction** (XGBoost regression): predicts how long a farmer will wait, with confidence bounds. Falls back to the transparent baseline formula when no trained model exists:
  ```
  estimated_wait = (people_ahead × avg_processing_minutes) ÷ active_counters
  ```
- **Smart Center Recommendation** (weighted ranking): ranks centers by distance, queue size, predicted wait, slot availability, and open status.

## Architecture

```
ml/
├── app/
│   ├── main.py              # FastAPI app
│   ├── api/
│   │   ├── routes.py        # prediction endpoints
│   │   └── training_routes.py
│   ├── core/                # config, database, logging
│   ├── data/pipeline.py     # data extraction + feature engineering
│   ├── models/
│   │   ├── wait_time_model.py
│   │   ├── center_recommend_model.py
│   │   └── schemas.py
│   ├── services/            # prediction + training orchestration
│   └── utils/
├── scripts/train.py         # training CLI
├── saved_models/            # persisted model artifacts
├── requirements.txt
├── .env.example
└── Dockerfile
```

## Setup

```bash
cd ml
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt

# Optional: copy env and adjust DB URL
copy .env.example .env
```

## Train

```bash
# Trains from the operational DB (falls back to synthetic data if none exists)
python scripts/train.py --days 90
```

## Run the API

```bash
uvicorn app.main:app --reload --port 8001
# Docs: http://localhost:8001/docs
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/v1/wait-time/predict` | Predict wait time |
| POST | `/api/v1/centers/recommend` | Rank a list of centers |
| GET | `/api/v1/centers/recommendations` | Recommend from live DB state (lat/lng/limit) |
| POST | `/api/v1/admin/ml/train/wait-time` | Retrain wait-time model |
| POST | `/api/v1/admin/ml/train/recommend` | Refresh recommend model |

### Wait-time prediction example

```json
POST /api/v1/wait-time/predict
{
  "center_id": 1,
  "queue_length": 7,
  "active_counters": 2,
  "avg_processing_minutes": 15,
  "time_of_day": "09:00",
  "day_of_week": 2,
  "commodity": "wheat"
}
```

### Center recommendation example

```json
POST /api/v1/centers/recommend
{
  "farmer_lat": 22.5726,
  "farmer_lng": 88.3639,
  "centers": [
    {
      "center_id": 1,
      "name": "Center A",
      "latitude": 22.57,
      "longitude": 88.36,
      "current_queue_length": 45,
      "predicted_wait_minutes": 120,
      "slot_available": true,
      "is_open": true
    },
    {
      "center_id": 2,
      "name": "Center B",
      "latitude": 22.60,
      "longitude": 88.40,
      "current_queue_length": 12,
      "predicted_wait_minutes": 30,
      "slot_available": true,
      "is_open": true
    }
  ]
}
```

## Docker

```bash
docker build -t kisan-ml .
docker run -p 8001:8001 kisan-ml
```

## Notes

Per the master document, a separate ML service is added only when the team has enough operational data. This service is built so it runs with the transparent baseline immediately and is upgraded to the trained model as soon as the `saved_models` artifact exists or training is run.
