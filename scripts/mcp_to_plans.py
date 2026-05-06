#!/usr/bin/env python3
"""
MCP fallback script - converts MCP data to SQLite/plans.json format
Only runs if primary Node.js scraper fails
"""

import json
import sqlite3
import os
import re
from datetime import datetime

DB_PATH = 'scraper/prop_firm_data.db'

def parse_mcp_data(raw_file='data/raw_mcp_deals.json'):
    """Extract firm pricing from MCP response"""
    if not os.path.exists(raw_file):
        print("No MCP data found")
        return []
    
    with open(raw_file, 'r') as f:
        content = f.read()
    
    firms = []
    try:
        data = json.loads(content)
        # Extract text content from MCP response
        for item in data.get('result', {}).get('content', []):
            if item.get('type') == 'text':
                text = item.get('text', '')
                # Parse each line for pricing info
                lines = text.split('\n')
                for line in lines:
                    # Look for firm names and prices
                    firm_match = re.search(r'\*\*([A-Za-z\s]+)\*\*:', line)
                    price_match = re.search(r'\$(\d+(?:\.\d{2})?)', line)
                    if firm_match and price_match:
                        firms.append({
                            'name': firm_match.group(1).strip().lower(),
                            'price': float(price_match.group(1))
                        })
    except json.JSONDecodeError:
        print("Could not parse MCP response as JSON")
    
    return firms

def update_database(firms):
    """Update SQLite database with MCP data"""
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    for firm in firms:
        # Update eval_fee for matching firm
        cursor.execute("""
            UPDATE plans 
            SET eval_fee = ?, 
                total_cost_to_funded = eval_fee + activation_fee,
                updated_at = ?
            WHERE LOWER(firm_name) LIKE ?
        """, (firm['price'], datetime.now().isoformat(), f'%{firm["name"]}%'))
        
        if cursor.rowcount > 0:
            print(f"Updated {cursor.rowcount} plans for {firm['name']}")
    
    conn.commit()
    conn.close()

if __name__ == '__main__':
    print("🔄 Running MCP fallback...")
    firms = parse_mcp_data()
    if firms:
        update_database(firms)
        print("✅ MCP fallback completed")
    else:
        print("⚠️ No firms extracted from MCP data")