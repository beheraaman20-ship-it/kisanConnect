"""Centralized logging configuration for the ML service."""

import logging
import sys
from logging.handlers import RotatingFileHandler


def setup_logging(name: str = "ml_service") -> logging.Logger:
    """Configure and return an application logger."""
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    if logger.handlers:
        return logger

    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(formatter)
    logger.addHandler(console)

    return logger


app_logger = setup_logging()
