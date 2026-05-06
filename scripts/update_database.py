#!/usr/bin/env python3
"""
Update database with the latest pricing data
"""

import json
import sqlite3
import os
from datetime import datetime
from typing import Dict, Any, List, Optional

DB_PATH = "data/database.db"

def init_database():
    """Initialize SQLite database with schema"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Main pricing table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS firm_pricing (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            firm_name TEXT NOT NULL,
            plan_name TEXT,
            account_size TEXT,
            eval_cost REAL,
            funded_fee REAL,
            total_cost REAL,
            discount_code TEXT,
            discount_percent REAL,
            drawdown_type TEXT,
            target TEXT,
            max_drawdown TEXT,
            min_days INTEGER,
            consistency_rule TEXT,
            last_updated TIMESTAMP,
            UNIQUE(firm_name, plan_name, account_size)
        )
    ''')
    
    # Historical pricing table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pricing_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            firm_name TEXT NOT NULL,
            plan_name TEXT,
            account_size TEXT,
            total_cost REAL,
            discount_code TEXT,
            recorded_at TIMESTAMP
        )
    ''')
    
    # Metadata table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS metadata (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Database initialized")

def parse_mcp_deals(deals_text: str) -> List[Dict]:
    """Parse MCP deals text into structured data"""
    # This is a simplified parser - you'll need to adjust based on actual MCP output format
    deals = []
    
    # Example parsing logic - adapt to your actual data format
    lines = deals_text.split('\n')
    current_deal = {}
    
    for line in lines:
        if 'Firm:' in line:
            if current_deal:
                deals.append(current_deal)
            current_deal = {'firm_name': line.replace('Firm:', '').strip()}
        elif 'Price:' in line:
            current_deal['total_cost'] = float(line.replace('Price: $', '').strip())
        elif 'Code:' in line:
            current_deal['discount_code'] = line.replace('Code:', '').strip()
        elif 'Discount:' in line:
            percent = line.replace('Discount:', '').replace('%', '').strip()
            current_deal['discount_percent'] = float(percent)
    
    if current_deal:
        deals.append(current_deal)
    
    return deals

def update_firm_pricing(conn: sqlite3.Connection, firm_data: Dict):
    """Insert or update firm pricing in database"""
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT OR REPLACE INTO firm_pricing 
        (firm_name, plan_name, account_size, eval_cost, funded_fee, total_cost, 
         discount_code, discount_percent, drawdown_type, target, max_drawdown, 
         min_days, consistency_rule, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        firm_data.get('firm_name'),
        firm_data.get('plan_name', 'Standard'),
        firm_data.get('account_size'),
        firm_data.get('eval_cost'),
        firm_data.get('funded_fee', 0),
        firm_data.get('total_cost'),
        firm_data.get('discount_code'),
        firm_data.get('discount_percent'),
        firm_data.get('drawdown_type', 'EOD'),
        firm_data.get('target'),
        firm_data.get('max_drawdown'),
        firm_data.get('min_days'),
        firm_data.get('consistency_rule'),
        datetime.now().isoformat()
    ))
    
    # Record history
    cursor.execute('''
        INSERT INTO pricing_history (firm_name, plan_name, account_size, total_cost, discount_code, recorded_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        firm_data.get('firm_name'),
        firm_data.get('plan_name', 'Standard'),
        firm_data.get('account_size'),
        firm_data.get('total_cost'),
        firm_data.get('discount_code'),
        datetime.now().isoformat()
    ))

def load_pricing_from_json() -> List[Dict]:
    """Load pricing data from JSON file"""
    json_path = "data/pricing.json"
    
    if not os.path.exists(json_path):
        print(f"⚠️ {json_path} not found, skipping")
        return []
    
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    # Parse MCP deals text
    deals_text = data.get('deals', '')
    if deals_text:
        return parse_mcp_deals(deals_text)
    
    return []

def generate_website_json(conn: sqlite3.Connection):
    """Generate JSON file for website consumption"""
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT firm_name, plan_name, account_size, total_cost, discount_code, 
               discount_percent, drawdown_type, target, max_drawdown, min_days, consistency_rule
        FROM firm_pricing
        ORDER BY total_cost ASC
    ''')
    
    rows = cursor.fetchall()
    
    website_data = {
        "last_updated": datetime.now().isoformat(),
        "total_plans": len(rows),
        "plans": [
            {
                "firm": row[0],
                "plan": row[1],
                "size": row[2],
                "price": row[3],
                "discountCode": row[4],
                "discountPercent": row[5],
                "drawdown": row[6],
                "target": row[7],
                "maxDD": row[8],
                "minDays": row[9],
                "consistency": row[10]
            }
            for row in rows
        ]
    }
    
    # Save for website
    output_path = "data/website_pricing.json"
    with open(output_path, 'w') as f:
        json.dump(website_data, f, indent=2)
    
    print(f"✅ Generated website JSON at {output_path}")
    return website_data

def main():
    print("🚀 Starting database update...")
    
    # Initialize database
    init_database()
    
    # Connect to database
    conn = sqlite3.connect(DB_PATH)
    
    # Load pricing data
    prices = load_pricing_from_json()
    
    if prices:
        for price in prices:
            update_firm_pricing(conn, price)
        print(f"✅ Updated {len(prices)} firm pricing records")
    else:
        print("⚠️ No pricing data found in JSON")
    
    # Generate website JSON
    website_data = generate_website_json(conn)
    
    # Update metadata
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO metadata (key, value, updated_at)
        VALUES (?, ?, ?)
    ''', ('last_full_update', datetime.now().isoformat(), datetime.now().isoformat()))
    
    conn.commit()
    conn.close()
    
    print("✅ Database update complete")
    print(f"📊 Total plans in database: {website_data['total_plans']}")

if __name__ == "__main__":
    main()