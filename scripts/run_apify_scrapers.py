#!/usr/bin/env python3
"""
Run Apify actors for prop firms not covered by MCP
"""

import os
import json
import time
import requests
from datetime import datetime
from typing import Dict, Any, List, Optional

# Configuration
APIFY_API_TOKEN = os.environ.get('APIFY_API_TOKEN')
APIFY_API_BASE = "https://api.apify.com/v2"

# List of target prop firms to scrape (not covered by MCP)
CUSTOM_FIRMS = [
    {
        "name": "apex_trader_funding",
        "actor_id": "YOUR_USERNAME~apex-scraper",  # Replace after deployment
        "pricing_url": "https://www.apextraderfunding.com/pricing"
    },
    {
        "name": "takeprofit_trader",
        "actor_id": "YOUR_USERNAME~takeprofit-scraper",
        "pricing_url": "https://takeprofittrader.com/pricing"
    },
    # Add more firms as needed
]

def run_apify_actor(actor_id: str, input_data: Dict[str, Any]) -> Optional[str]:
    """Run an Apify actor and return the run ID"""
    if not APIFY_API_TOKEN:
        print("⚠️ APIFY_API_TOKEN not set, skipping Apify runs")
        return None
    
    url = f"{APIFY_API_BASE}/acts/{actor_id}/runs"
    headers = {"Authorization": f"Bearer {APIFY_API_TOKEN}"}
    
    try:
        response = requests.post(url, json=input_data, headers=headers)
        response.raise_for_status()
        run_data = response.json()
        run_id = run_data.get('data', {}).get('id')
        print(f"✅ Started actor {actor_id}, run ID: {run_id}")
        return run_id
    except Exception as e:
        print(f"❌ Failed to run actor {actor_id}: {e}")
        return None

def get_run_status(run_id: str) -> Dict[str, Any]:
    """Get the status of an actor run"""
    url = f"{APIFY_API_BASE}/actor-runs/{run_id}"
    headers = {"Authorization": f"Bearer {APIFY_API_TOKEN}"}
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json().get('data', {})
    except Exception as e:
        print(f"❌ Failed to get run status: {e}")
        return {}

def wait_for_completion(run_id: str, timeout: int = 300, interval: int = 10) -> bool:
    """Wait for actor run to complete"""
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        status_data = get_run_status(run_id)
        status = status_data.get('status')
        
        if status == 'SUCCEEDED':
            print(f"✅ Run {run_id} completed successfully")
            return True
        elif status in ['FAILED', 'TIMED-OUT', 'ABORTED']:
            print(f"❌ Run {run_id} failed with status: {status}")
            return False
        
        print(f"⏳ Run {run_id} status: {status}, waiting...")
        time.sleep(interval)
    
    print(f"⏰ Run {run_id} timed out after {timeout} seconds")
    return False

def fetch_run_results(run_id: str) -> Optional[List[Dict]]:
    """Fetch results from a completed actor run"""
    url = f"{APIFY_API_BASE}/actor-runs/{run_id}/dataset/items"
    headers = {"Authorization": f"Bearer {APIFY_API_TOKEN}"}
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"❌ Failed to fetch results: {e}")
        return None

def save_scraped_data(firm_name: str, data: List[Dict]) -> str:
    """Save scraped data to file"""
    os.makedirs("data/scraped", exist_ok=True)
    filepath = f"data/scraped/{firm_name}_{datetime.now().strftime('%Y%m%d')}.json"
    
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump({
            "firm": firm_name,
            "scraped_at": datetime.now().isoformat(),
            "data": data
        }, f, indent=2)
    
    print(f"✅ Saved scraped data for {firm_name} to {filepath}")
    return filepath

def main():
    if not APIFY_API_TOKEN:
        print("⚠️ APIFY_API_TOKEN not set. Skipping Apify scrapers.")
        print("To enable scraping, add APIFY_API_TOKEN to your environment or GitHub secrets.")
        return
    
    print("🚀 Starting Apify scrapers for custom firms...")
    
    results = {}
    
    for firm in CUSTOM_FIRMS:
        print(f"\n📊 Processing {firm['name']}...")
        
        # Run the actor
        run_id = run_apify_actor(firm['actor_id'], {
            "startUrls": [{"url": firm['pricing_url']}],
            "maxDepth": 1
        })
        
        if run_id:
            # Wait for completion
            if wait_for_completion(run_id):
                # Fetch results
                data = fetch_run_results(run_id)
                if data:
                    filepath = save_scraped_data(firm['name'], data)
                    results[firm['name']] = {"success": True, "file": filepath, "records": len(data)}
                else:
                    results[firm['name']] = {"success": False, "error": "No data returned"}
            else:
                results[firm['name']] = {"success": False, "error": "Run failed or timed out"}
        else:
            results[firm['name']] = {"success": False, "error": "Failed to start actor"}
    
    # Save summary
    summary_path = "data/scraped/summary.json"
    with open(summary_path, "w") as f:
        json.dump({
            "last_run": datetime.now().isoformat(),
            "results": results
        }, f, indent=2)
    
    print(f"\n📊 Scraping complete. Summary saved to {summary_path}")
    return results

if __name__ == "__main__":
    main()