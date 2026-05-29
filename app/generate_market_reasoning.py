#!/usr/bin/env python3
"""
generate_market_reasoning.py
─────────────────────────────
Run this script once daily after market close (after 4 PM IST).
It uses Claude + web search to write plain-English reasoning for
Nifty 50 and Sensex 30, then saves it to:

    frontend/public/market-reasoning.json

Usage:
    python generate_market_reasoning.py

Requirements:
    pip install anthropic
    Set ANTHROPIC_API_KEY in your .env.local or shell environment.
"""

import os
import json
import time
import datetime
import anthropic

# ─── config ──────────────────────────────────────────────────────────────────

# Path to your Next.js public folder (adjust if your folder structure differs)
OUTPUT_PATH = os.path.join(
    os.path.dirname(__file__),
    "frontend", "public", "market-reasoning.json"
)

# ─── helpers ─────────────────────────────────────────────────────────────────

def ist_now():
    """Return current datetime in IST."""
    ist = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
    return datetime.datetime.now(ist)

def today_str():
    return ist_now().strftime("%Y-%m-%d")

def yesterday_str():
    ist = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
    yesterday = datetime.datetime.now(ist) - datetime.timedelta(days=1)
    return yesterday.strftime("%Y-%m-%d")

def load_existing_json():
    """Load the existing market-reasoning.json if it exists."""
    if os.path.exists(OUTPUT_PATH):
        with open(OUTPUT_PATH, "r") as f:
            return json.load(f)
    return None

def save_json(data):
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"✅ Saved to {OUTPUT_PATH}")

# ─── Claude API call ──────────────────────────────────────────────────────────

def build_prompt(index_name: str, date_str: str) -> str:
    return f"""You are a friendly Indian stock market analyst writing for everyday people who are NOT finance experts.

Search the web for {index_name} performance on {date_str} — closing value, % change, key news, sector moves, FII/DII activity, global cues.

Return ONLY a valid JSON object — no markdown, no backticks, no extra text — exactly like this:

{{
  "verdict": "One clear sentence explaining what the market did and the single biggest reason why. Keep it under 25 words. Simple language, no jargon.",
  "factors": "3 short comma-separated key factors (e.g. FIIs sold ₹2,100 Cr, Crude rose to $84, IT stocks fell 1.2%)"
}}

Rules:
- verdict must feel like a friend explaining it, not a news headline
- Use Indian number format (₹, Cr, Lakh) where relevant
- If market was closed (holiday/weekend), return: {{"verdict": "Market was closed today.", "factors": ""}}
- Return ONLY the JSON. Nothing else."""

def call_claude(prompt: str) -> dict:
    """Call Claude with web search and return parsed JSON."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY not set. Add it to your .env.local or shell.")

    client = anthropic.Anthropic(api_key=api_key)

    print("  → Calling Claude API with web search...")

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=500,
        tools=[{"type": "web_search_20250305", "name": "web_search"}],
        messages=[{"role": "user", "content": prompt}],
    )

    # Extract text from all content blocks
    text = ""
    for block in response.content:
        if block.type == "text":
            text += block.text

    text = text.strip().replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"  ⚠️  Could not parse JSON: {e}")
        print(f"  Raw response: {text[:300]}")
        return {
            "verdict": "Could not fetch today's market reasoning. Please update manually.",
            "factors": ""
        }

# ─── main ─────────────────────────────────────────────────────────────────────

def main():
    print("=" * 55)
    print("  FinanceDigest — Market Reasoning Generator")
    print("=" * 55)
    print(f"  Date    : {today_str()}")
    print(f"  Time IST: {ist_now().strftime('%H:%M')}")
    print()

    # Load existing file so we can preserve/shift data
    existing = load_existing_json() or {}

    # ── Step 1: Generate TODAY's Sensex reasoning ────────────────────────────
    print("📊 Generating Sensex 30 reasoning...")
    sensex_data = call_claude(build_prompt("Sensex 30 (BSE Sensex)", today_str()))
    print(f"  ✓ Verdict: {sensex_data.get('verdict', '')[:80]}...")
    time.sleep(2)  # small pause between API calls

    # ── Step 2: Generate TODAY's Nifty reasoning ─────────────────────────────
    print("\n📈 Generating Nifty 50 reasoning...")
    nifty_data = call_claude(build_prompt("Nifty 50 (NSE)", today_str()))
    print(f"  ✓ Verdict: {nifty_data.get('verdict', '')[:80]}...")

    # ── Step 3: Build the new JSON structure ─────────────────────────────────
    #   - today's data  → becomes new "today"
    #   - old "today"   → becomes new "yesterday"  (automatic rollover!)
    
    old_today = existing.get("today", {})

    new_data = {
        "today": {
            "date": today_str(),
            "readyAt": "16:00",
            "sensex": {
                "verdict": sensex_data.get("verdict", ""),
                "factors": sensex_data.get("factors", "")
            },
            "nifty": {
                "verdict": nifty_data.get("verdict", ""),
                "factors": nifty_data.get("factors", "")
            }
        },
        "yesterday": {
            # Use whatever was "today" in the previous run
            "date": old_today.get("date", yesterday_str()),
            "sensex": old_today.get("sensex", {
                "verdict": "Yesterday's data not available.",
                "factors": ""
            }),
            "nifty": old_today.get("nifty", {
                "verdict": "Yesterday's data not available.",
                "factors": ""
            })
        }
    }

    # ── Step 4: Save ──────────────────────────────────────────────────────────
    print(f"\n💾 Saving to {OUTPUT_PATH}")
    save_json(new_data)

    print()
    print("Done! Run this script every day after 4 PM IST.")
    print("The website will automatically show:")
    print("  • Before 4 PM → yesterday's reasoning")
    print("  • After 4 PM  → today's reasoning")

if __name__ == "__main__":
    main()
