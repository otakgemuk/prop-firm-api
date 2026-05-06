#!/usr/bin/env python3
"""
Fetch prop firm deals from MCP server and save raw data
"""

import json
import os
import subprocess
import sys
import tempfile
from datetime import datetime

def fetch_via_mcp():
    """Use MCP server CLI to fetch deals"""
    # Create a temporary file for output
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as tmp:
        tmp_path = tmp.name
    
    try:
        # Run MCP server and capture output
        # This uses npx to run the MCP server in JSON mode
        result = subprocess.run(
            [
                "npx", "-y", "propfirmdealfinder-mcp-server",
                "--stdio", "--tool", "pfdf_get_deals"
            ],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        # Parse the MCP JSON response
        if result.stdout:
            mcp_response = json.loads(result.stdout)
            
            # Extract the text content from MCP response
            deals_text = ""
            for content in mcp_response.get('result', {}).get('content', []):
                if content.get('type') == 'text':
                    deals_text = content.get('text', '')
                    break
            
            # Save raw data
            os.makedirs('data', exist_ok=True)
            with open('data/raw_mcp_deals.json', 'w') as f:
                json.dump({
                    "last_updated": datetime.now().isoformat(),
                    "raw_response": mcp_response,
                    "deals_text": deals_text
                }, f, indent=2)
            
            print("✅ Fetched MCP deals successfully")
            return True
        else:
            print("❌ No output from MCP server")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ MCP server timed out")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def fetch_alternative():
    """Fallback: Use direct web scraping if MCP fails"""
    print("🔄 MCP failed, attempting alternative fetch...")
    
    # You can implement alternative scraping here
    # For now, just exit gracefully
    return False

if __name__ == "__main__":
    print("🚀 Fetching prop firm deals...")
    
    if fetch_via_mcp():
        print("✅ Data saved to data/raw_mcp_deals.json")
    else:
        print("⚠️ MCP fetch failed, trying alternative...")
        fetch_alternative()