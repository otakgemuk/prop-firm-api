import json
import csv
import time
import os
import re
import requests
from datetime import datetime, timezone
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; MightyOxScraper/1.0; +https://github.com/otakgemuk/prop-firm-api)",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
}

DELAY_SECONDS = 3


def load_firms(path="firms.json"):
    with open(path, "r") as f:
        return json.load(f)


def fetch(url, retries=2):
    for attempt in range(retries + 1):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            resp.raise_for_status()
            return resp.text
        except requests.RequestException as e:
            print(f"  ⚠ Attempt {attempt+1} failed for {url}: {e}")
            if attempt < retries:
                time.sleep(5)
    return None


def parse_table(html, table_selector=None):
    soup = BeautifulSoup(html, "html.parser")
    if table_selector:
        table = soup.select_one(table_selector)
    else:
        table = soup.find("table")
    if not table:
        return []

    rows = table.find_all("tr")
    if len(rows) < 2:
        return []

    headers = [th.get_text(strip=True) for th in rows[0].find_all(["th", "td"])]
    data = []
    for row in rows[1:]:
        cells = [td.get_text(strip=True) for td in row.find_all(["td", "th"])]
        if len(cells) == len(headers):
            data.append(dict(zip(headers, cells)))
    return data


def normalize(row, firm_name):
    def g(key, *aliases):
        for alias in [key] + list(aliases):
            for k, v in row.items():
                if alias.lower() in k.lower():
                    return v
        return ""

    def money(val):
        if not val:
            return ""
        nums = re.findall(r'[\d,.]+', val.replace(",", ""))
        return nums[0] if nums else val

    def pct(val):
        if not val:
            return ""
        nums = re.findall(r'[\d.]+', val)
        return nums[0] if nums else val

    return {
        "firm":                firm_name,
        "plan":                g("plan", "eval", "type", "tier"),
        "account_size":        g("account size", "size", "balance"),
        "drawdown_type":       g("drawdown type", "trailing", "static"),
        "retail_price":        money(g("retail", "price", "original", "full price")),
        "discounted_price":    money(g("discounted", "sale", "promo price", "your price")),
        "promo_code":          g("promo", "code", "coupon"),
        "discount_pct":        pct(g("discount %", "discount", "off")),
        "activation_fee":      money(g("activation", "setup fee")),
        "total_to_funded":     money(g("total to funded", "total", "all-in")),
        "profit_target":       money(g("profit target", "target")),
        "max_drawdown":        money(g("max drawdown", "drawdown", "trailing drawdown")),
        "daily_loss_limit":    money(g("daily loss", "daily limit", "daily drawdown")),
        "min_trading_days":    g("min trading", "minimum days", "trading days"),
        "consistency_rule":    g("consistency", "consistency rule"),
        "profit_split":        g("profit split", "split", "payout split"),
        "fee_model":           g("fee model", "monthly", "one-time", "reset"),
    }


def scrape_firm(firm):
    name = firm["name"]
    url = firm["url"]
    selector = firm.get("selector")
    print(f"🔍 Scraping {name} → {url}")

    html = fetch(url)
    if not html:
        print(f"  ✗ Failed to fetch {name}")
        return []

    raw_rows = parse_table(html, selector)
    print(f"  ✓ Found {len(raw_rows)} rows")

    if firm.get("raw_only"):
        return raw_rows

    return [normalize(row, name) for row in raw_rows]


def main():
    firms = load_firms()
    all_records = []
    timestamp = datetime.now(timezone.utc).isoformat()

    for i, firm in enumerate(firms):
        records = scrape_firm(firm)
        for r in records:
            r["scraped_at"] = timestamp
        all_records.extend(records)
        if i < len(firms) - 1:
            print(f"  ⏳ Waiting {DELAY_SECONDS}s...")
            time.sleep(DELAY_SECONDS)

    os.makedirs("data", exist_ok=True)

    json_path = "data/firms.json"
    with open(json_path, "w") as f:
        json.dump({
            "updated": timestamp,
            "count": len(all_records),
            "records": all_records,
        }, f, indent=2)
    print(f"\n✅ Saved {len(all_records)} records → {json_path}")

    if all_records:
        csv_path = "data/firms.csv"
        keys = all_records[0].keys()
        with open(csv_path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            writer.writerows(all_records)
        print(f"✅ Saved CSV → {csv_path}")


if __name__ == "__main__":
    main()
