#!/usr/bin/env python3
"""
Utility functions for the pricing updater
"""

import json
import logging
import os
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Configure logging
LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO').upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('data/updater.log')
    ]
)

logger = logging.getLogger(__name__)

def ensure_directories():
    """Ensure all required directories exist"""
    directories = ['data', 'data/scraped', 'logs', 'backups']
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
    logger.info("Directory structure verified")

def backup_database(db_path: str = "data/database.db") -> Optional[str]:
    """Create a backup of the database"""
    if not os.path.exists(db_path):
        logger.warning(f"Database {db_path} not found, skipping backup")
        return None
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = f"backups/database_{timestamp}.db"
    
    try:
        import shutil
        shutil.copy2(db_path, backup_path)
        logger.info(f"Database backed up to {backup_path}")
        return backup_path
    except Exception as e:
        logger.error(f"Failed to backup database: {e}")
        return None

def send_alert(message: str, level: str = "info"):
    """Send alert (can be extended to email, Slack, etc.)"""
    # For now, just log
    log_func = getattr(logger, level.lower(), logger.info)
    log_func(f"ALERT: {message}")
    
    # TODO: Add webhook integration for Slack/Discord
    # webhook_url = os.environ.get('ALERT_WEBHOOK_URL')
    # if webhook_url:
    #     send_webhook(webhook_url, message)

def validate_pricing_data(data: Dict[str, Any]) -> bool:
    """Validate pricing data structure"""
    required_fields = ['last_updated', 'deals']
    
    for field in required_fields:
        if field not in data:
            logger.error(f"Missing required field: {field}")
            return False
    
    if not data.get('deals'):
        logger.warning("Deals data is empty")
        return False
    
    return True

def load_config(config_path: str = "config.json") -> Dict[str, Any]:
    """Load configuration from JSON file"""
    default_config = {
        "mcp_url": "http://localhost:3000/mcp",
        "retry_count": 3,
        "retry_delay": 2,
        "update_interval_hours": 24,
        "firms_to_track": [
            "apex", "topstep", "bulenox", "tradeify", 
            "mffu", "lucid", "takeprofit", "earn2trade"
        ]
    }
    
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            config = json.load(f)
            default_config.update(config)
        logger.info(f"Loaded config from {config_path}")
    else:
        logger.info("Using default configuration")
    
    return default_config