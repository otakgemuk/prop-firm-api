#!/usr/bin/env python3
"""
Update plans.json with latest pricing data from MCP
"""

import json
import re
from datetime import datetime

def parse_mcp_text(mcp_text):
    """Parse the MCP deals text into structured firm data"""
    firms_data = {}
    
    # Split by firm sections (look for firm names)
    lines = mcp_text.split('\n')
    current_firm = None
    
    # Patterns to match
    firm_pattern = r'^\*{0,2}([A-Za-z0-9\s]+)(?:\*{0,2}:|$)'
    price_pattern = r'\$(\d+\.?\d*)'
    size_pattern = r'(\d+)[kK]'
    discount_pattern = r'(\d+)%'

    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Check if line starts with a firm name (simplified)
        if line[0].isupper() and ':' in line:
            parts = line.split(':', 1)
            current_firm = parts[0].strip().lower()
            if current_firm not in firms_data:
                firms_data[current_firm] = {}
        
        # Extract pricing info
        if current_firm:
            prices = re.findall(price_pattern, line)
            if prices and 'price' not in firms_data[current_firm]:
                firms_data[current_firm]['price'] = float(prices[0])
            
            sizes = re.findall(size_pattern, line)
            if sizes and 'size' not in firms_data[current_firm]:
                firms_data[current_firm]['size'] = int(sizes[0]) * 1000
            
            discounts = re.findall(discount_pattern, line)
            if discounts and 'discount' not in firms_data[current_firm]:
                firms_data[current_firm]['discount'] = int(discounts[0])
    
    return firms_data

def update_plan(plan, firm_data):
    """Update a single plan's pricing fields"""
    firm_name_lower = plan.get('firm_name', '').lower()
    
    # Find matching firm data
    for mcp_firm, data in firm_data.items():
        if mcp_firm in firm_name_lower or firm_name_lower in mcp_firm:
            # Update pricing fields
            if 'price' in data:
                new_eval_fee = data['price']
                old_eval_fee = plan.get('eval_fee', 0)
                
                if abs(new_eval_fee - old_eval_fee) > 0.01:
                    print(f"  Updating {plan.get('firm_name')} {plan.get('plan_label')}: ${old_eval_fee} → ${new_eval_fee}")
                    plan['eval_fee'] = new_eval_fee
                    
                    # Recalculate total cost
                    plan['total_cost_to_funded'] = plan['eval_fee'] + plan.get('activation_fee', 0)
                    
                    # Apply discount if present
                    if 'discount' in data and data['discount'] > 0:
                        plan['active_discount_pct'] = data['discount']
                        discounted_total = plan['total_cost_to_funded'] * (1 - data['discount'] / 100)
                        plan['total_cost_to_funded'] = round(discounted_total, 2)
            
            return True
    
    return False

def main():
    print("📝 Loading existing plans.json...")
    
    # Load existing plans
    with open('data/plans.json', 'r') as f:
        plans = json.load(f)
    
    print(f"   Loaded {len(plans)} plans")
    
    # Load fresh MCP data
    try:
        with open('data/raw_mcp_deals.json', 'r') as f:
            mcp_data = json.load(f)
        
        deals_text = mcp_data.get('deals_text', '')
        firm_data = parse_mcp_text(deals_text)
        print(f"   Found {len(firm_data)} firms in MCP data")
        
        # Update each plan
        updated_count = 0
        for plan in plans:
            if update_plan(plan, firm_data):
                updated_count += 1
        
        print(f"✅ Updated {updated_count} plans with new pricing")
        
        # Save updated plans.json
        with open('data/plans.json', 'w') as f:
            json.dump(plans, f, indent=2)
        
        print("✅ Saved updated plans.json")
        
    except FileNotFoundError:
        print("⚠️ No raw MCP data found. Run fetch_mcp_deals.py first.")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()