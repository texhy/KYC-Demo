"""Verbose, colorized logging for the pipeline — visible in the uvicorn terminal."""

import logging
import sys

_CONFIGURED = False


def setup_logging() -> None:
    global _CONFIGURED
    if _CONFIGURED:
        return
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter("%(asctime)s | %(levelname)-5s | %(name)s | %(message)s", "%H:%M:%S")
    )
    root = logging.getLogger("kyc")
    root.setLevel(logging.INFO)
    root.handlers = [handler]
    root.propagate = False
    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    setup_logging()
    return logging.getLogger(f"kyc.{name}")
