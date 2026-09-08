"""Data extraction from the operational PostgreSQL database for ML training."""

import logging
from datetime import date, datetime, timedelta

import numpy as np
import pandas as pd
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine

logger = logging.getLogger(__name__)


def extract_wait_time_training_data(
    days: int = 90, center_id: int | None = None
) -> pd.DataFrame:
    """Build a training DataFrame from historical token/procurement records.

    Each row represents a completed procurement with the time the farmer
    waited (the target) and the features observable at the time of booking.

    Query uses the tokens and procurement tables defined in the master schema.
    Falls back to generating synthetic data when the DB is unavailable/empty
    so the model can be demonstrated before real data accumulates.
    """
    sql = text(
        """
        SELECT
            t.center_id,
            t.slot_id,
            t.farmer_id,
            t.status,
            t.queue_position,
            t.booked_at,
            t.called_at,
            t.completed_at,
            p.commodity,
            p.quantity,
            p.quality_status,
            DATE_PART('dow', t.booked_at)::int AS day_of_week,
            EXTRACT(HOUR FROM t.booked_at AT TIME ZONE 'Asia/Kolkata')::int AS hour,
            c.daily_capacity,
            c.latitude,
            c.longitude,
            (SELECT COUNT(*)
             FROM tokens t2
             WHERE t2.center_id = t.center_id
               AND t2.slot_id = t.slot_id
               AND t2.booked_at <= t.booked_at) AS cumulative_queue,
            (SELECT COUNT(*)
             FROM tokens t3
             WHERE t3.center_id = t.center_id
               AND DATE(t3.booked_at) = DATE(t.booked_at)
               AND t3.booked_at <= t.booked_at) AS day_queue_position
        FROM tokens t
        JOIN procurement p ON p.token_id = t.id
        JOIN procurement_centers c ON c.id = t.center_id
        WHERE t.completed_at IS NOT NULL
          AND t.booked_at >= :start_date
          AND (:center_id IS NULL OR t.center_id = :center_id)
        """
    )

    start_date = datetime.utcnow() - timedelta(days=days)

    try:
        with engine.connect() as conn:
            df = pd.read_sql(
                sql,
                conn,
                params={
                    "start_date": start_date,
                    "center_id": center_id,
                },
            )
        logger.info("Extracted %d historical records.", len(df))
    except Exception as exc:  # DB not ready -> synthetic fallback
        logger.warning("DB extraction failed (%s). Using synthetic training data.", exc)
        df = _synthetic_wait_time_data(n=3000)

    if df.empty:
        logger.warning("No historical records found. Using synthetic data.")
        df = _synthetic_wait_time_data(n=3000)

    return build_features(df)


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Feature engineering: derive ML-ready feature columns + target.

    When called with raw DB data (has booked_at, called_at, cumulative_queue etc.)
    we derive features.  When called with synthetic data that already has all feature
    columns we only ensure they exist and compute the target if missing.
    """
    out = df.copy()
    has_raw_db_cols = "called_at" in out.columns and "booked_at" in out.columns

    # --- Target ---------------------------------------------------------------
    if has_raw_db_cols:
        out["called_at"] = pd.to_datetime(out["called_at"], errors="coerce")
        out["booked_at"] = pd.to_datetime(out["booked_at"], errors="coerce")
        out["wait_minutes"] = (
            (out["called_at"].fillna(out.get("completed_at")) - out["booked_at"]).dt.total_seconds() / 60.0
        ).fillna(0)
    elif "wait_minutes" not in out.columns:
        out["wait_minutes"] = 0.0

    out["wait_minutes"] = out["wait_minutes"].clip(lower=0)

    # --- Features (only overwrite when building from raw DB rows) -------------
    if has_raw_db_cols:
        out["queue_length"] = out.get("cumulative_queue", pd.Series(0, index=out.index)).fillna(0).astype(float)
        out["active_counters"] = 1.0
        out["avg_processing_minutes"] = 15.0
        out["hour"] = out.get("hour", 10).fillna(10).astype(int)
        out["day_of_week"] = out.get("day_of_week", 0).fillna(0).astype(int)

    # Ensure defaults for any missing feature columns
    if "active_counters" not in out.columns:
        out["active_counters"] = 1.0
    if "avg_processing_minutes" not in out.columns:
        out["avg_processing_minutes"] = 15.0
    if "hour" not in out.columns:
        out["hour"] = 10
    if "day_of_week" not in out.columns:
        out["day_of_week"] = 0

    out["queue_length"] = out.get("queue_length", pd.Series(0.0, index=out.index)).astype(float)
    out["active_counters"] = out["active_counters"].astype(float)
    out["avg_processing_minutes"] = out["avg_processing_minutes"].astype(float)
    out["hour"] = out["hour"].fillna(10).astype(int)
    out["day_of_week"] = out["day_of_week"].fillna(0).astype(int)

    peak = out["hour"].apply(_is_peak_hour)
    out["is_peak_hour"] = peak.astype(int)

    capacity = out.get("daily_capacity", pd.Series(100, index=out.index)).fillna(100)
    load = out["queue_length"] / capacity.replace(0, 1)
    out["center_load_ratio"] = load.clip(upper=1.0).astype(float)

    if "commodity" in out.columns:
        commodity = out["commodity"].fillna("general")
    elif "commodity_encoded" in out.columns:
        commodity = out["commodity_encoded"]
    else:
        commodity = pd.Series("general", index=out.index)
    out["commodity_encoded"] = commodity.astype(str)

    return out


def extract_center_data() -> pd.DataFrame:
    """Extract current center state for live recommendation."""
    sql = text(
        """
        SELECT
            c.id AS center_id,
            c.name,
            c.latitude,
            c.longitude,
            c.status AS is_open,
            c.daily_capacity,
            COALESCE((
                SELECT COUNT(*)
                FROM tokens t
                WHERE t.center_id = c.id
                  AND t.status IN ('BOOKED','WAITING')
            ), 0) AS current_queue_length,
            COALESCE((
                SELECT AVG(EXTRACT(EPOCH FROM (t.completed_at - t.booked_at))/60.0)
                FROM tokens t
                WHERE t.center_id = c.id AND t.completed_at IS NOT NULL
            ), 15.0) AS avg_processing_minutes
        FROM procurement_centers c
        WHERE c.status = 'active'
        """
    )
    try:
        with engine.connect() as conn:
            df = pd.read_sql(sql, conn)
        logger.info("Extracted %d centers.", len(df))
    except Exception as exc:
        logger.warning("Center extraction failed (%s). Returning empty.", exc)
        df = pd.DataFrame()
    return df


def _is_peak_hour(hour) -> bool:
    h = int(hour) if pd.notna(hour) else 10
    return (8 <= h <= 11) or (16 <= h <= 18)


def _synthetic_wait_time_data(n: int = 3000) -> pd.DataFrame:
    """Generate realistic synthetic data to demonstrate/verify the model end-to-end."""
    rng = np.random.default_rng(42)

    queue = rng.integers(0, 60, n).astype(float)
    active_counters = rng.integers(1, 5, n).astype(float)
    hour = rng.integers(6, 20, n)
    day_of_week = rng.integers(0, 7, n)
    avg_process = rng.uniform(10, 25, n).astype(float)
    capacity = rng.integers(80, 250, n).astype(float)

    peak = np.array([_is_peak_hour(h) for h in hour]).astype(int)

    # True wait time follows the baseline formula + noise + peak effect
    base = (queue * avg_process) / np.maximum(active_counters, 1)
    noise = rng.normal(0, 5, n)
    wait = base + peak * 8.0 + noise
    wait = np.maximum(wait, 0)

    df = pd.DataFrame(
        {
            "queue_length": queue,
            "active_counters": active_counters,
            "avg_processing_minutes": avg_process,
            "hour": hour,
            "day_of_week": day_of_week,
            "is_peak_hour": peak,
            "center_load_ratio": (queue / capacity).clip(0, 1),
            "commodity_encoded": rng.choice(["wheat", "rice", "vegetables", "cotton", "sugarcane"], n),
            "wait_minutes": wait,
        }
    )
    return df
