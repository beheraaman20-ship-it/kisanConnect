"""Command-line script to train and save the ML models.

Usage:
    python scripts/train.py                      # train from DB (synthetic fallback)
    python scripts/train.py --days 60 --center 3
"""

import argparse
import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

from app.data.pipeline import extract_wait_time_training_data  # noqa: E402
from app.models.center_recommend_model import CenterRecommendModel  # noqa: E402
from app.models.wait_time_model import WaitTimeModel  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description="Train ML models for the procurement system")
    parser.add_argument("--days", type=int, default=90, help="Days of history to use")
    parser.add_argument("--center", type=int, default=None, help="Limit to one center")
    parser.add_argument("--skip-recommend", action="store_true", help="Skip recommend model")
    args = parser.parse_args()

    logging.info("Extracting training data (last %d days)...", args.days)
    df = extract_wait_time_training_data(days=args.days, center_id=args.center)
    logging.info("Training rows: %d", len(df))

    # Wait-time model
    wait_model = WaitTimeModel()
    metrics = wait_model.train(df)
    path = wait_model.save()
    logging.info("Wait-time model saved to %s", path)
    logging.info("Metrics: %s", metrics)

    # Recommend model
    if not args.skip_recommend:
        rec_model = CenterRecommendModel()
        rec_metrics = rec_model.train()
        rec_path = rec_model.save()
        logging.info("Recommend model saved to %s", rec_path)
        logging.info("Metrics: %s", rec_metrics)


if __name__ == "__main__":
    main()
