#!/usr/bin/env python3
"""
generate_market_reasoning.py
─────────────────────────────
Run once daily after market close (after 4 PM IST for Indian,
after 1:30 AM IST next day for US).

Usage:
    python generate_market_reasoning.py           # generates both
    python generate_market_reasoning.py --indian  # Indian only
    python generate_market_reasoning.py --us      # US only

Requirements:
    pip install anthropic
    Set ANTHROPIC_API_KEY in .env.local or shell.
"""

import os, json, time, datetime, argparse, anthropic

OUTPUT_PATH = os.path.join(
    os.path.dirname(__file__),
    "frontend", "public", "market-reasoning.json"
)

def ist_now():
    return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30)))

def today_str():
    return ist_now().strftime("%Y-%m-%d")

def yesterday_str():
    return (ist_now() - datetime.timedelta(days=1)).strftime("%Y-%m-%d")

def load_existing():
    if os.path.exists(OUTPUT_PATH):
        with open(OUTPUT_PATH) as f:
            return json.load(f)
    return {}

def save_json(data):
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  ✅ Saved → {OUTPUT_PATH}")

# ── prompts ───────────────────────────────────────────────────────────────────

INDIAN_PROMPT = """You are a friendly Indian stock market analyst writing for everyday people who are NOT finance experts.

Search the web for today's Indian market performance — Sensex, Nifty 50, Bank Nifty closing values, % changes, top sector movers, FII/DII activity, global cues, key news.

Return ONLY valid JSON — no markdown, no backticks, no extra text — exactly this structure:

{
  "marketTime": "Market closed at 3:30 PM IST",
  "updatedAt": "Updated at 4:30 PM IST",
  "verdictSentiment": "positive",
  "verdict": "One italic-style sentence explaining what happened and the single biggest reason why. Max 25 words. Simple language, like explaining to a friend.",
  "watchOut": "One sentence about what to watch tomorrow. Keep it specific.",
  "indices": [
    { "label": "Sensex",     "price": "81,234", "change": "-312", "pct": "-0.38" },
    { "label": "Nifty 50",   "price": "24,678", "change": "-94",  "pct": "-0.38" },
    { "label": "Bank Nifty", "price": "52,110", "change": "+128", "pct": "+0.25" }
  ],
  "factors": [
    { "icon": "🌍", "label": "Global cues",  "value": "Short value", "sub": "Short sub-note", "sentiment": "negative" },
    { "icon": "💵", "label": "FII activity",  "value": "Short value", "sub": "Short sub-note", "sentiment": "negative" },
    { "icon": "🛢️", "label": "Crude oil",   "value": "Short value", "sub": "Short sub-note", "sentiment": "neutral"  }
  ],
  "sectors": [
    { "name": "Banking", "pct": "0.3"  },
    { "name": "IT",      "pct": "-1.1" },
    { "name": "Auto",    "pct": "-0.8" },
    { "name": "FMCG",    "pct": "0.2"  }
  ]
}

Rules:
- verdictSentiment: "positive" or "negative" based on overall market direction
- pct values: positive number as "0.38", negative as "-0.38" (no % sign)
- change: include sign e.g. "+312" or "-94"
- price: use Indian number format e.g. "81,234"
- factor sentiment: "positive", "negative", or "neutral"
- If market was closed: set verdict to "Markets were closed today." and return empty indices/sectors arrays
- Return ONLY the JSON. Nothing else."""

US_PROMPT = """You are a friendly US stock market analyst writing for everyday people who are NOT finance experts.

Search the web for the latest US market performance — S&P 500, Nasdaq, Dow Jones closing values, % changes, top sector movers, key earnings, Fed news, bond yields.

Return ONLY valid JSON — no markdown, no backticks, no extra text — exactly this structure:

{
  "marketTime": "NYSE/NASDAQ close at 1:30 AM IST",
  "updatedAt": "Updated at 2:00 AM IST",
  "verdictSentiment": "positive",
  "verdict": "One italic-style sentence explaining what happened and the single biggest reason why. Max 25 words. Simple language, like explaining to a friend.",
  "watchOut": "One sentence about what to watch next session. Keep it specific.",
  "indices": [
    { "label": "S&P 500",   "price": "5,304",  "change": "+38",  "pct": "+0.72" },
    { "label": "Nasdaq",    "price": "16,780", "change": "+142", "pct": "+0.85" },
    { "label": "Dow Jones", "price": "39,112", "change": "+210", "pct": "+0.54" }
  ],
  "factors": [
    { "icon": "🤖", "label": "Big mover",  "value": "Short value", "sub": "Short sub-note", "sentiment": "positive" },
    { "icon": "📉", "label": "Inflation",   "value": "Short value", "sub": "Short sub-note", "sentiment": "positive" },
    { "icon": "🏦", "label": "10yr yield",  "value": "Short value", "sub": "Short sub-note", "sentiment": "neutral"  }
  ],
  "sectors": [
    { "name": "Tech",       "pct": "1.4"  },
    { "name": "Financials", "pct": "0.7"  },
    { "name": "Healthcare", "pct": "0.3"  },
    { "name": "Energy",     "pct": "-0.5" }
  ]
}

Rules:
- verdictSentiment: "positive" or "negative" based on overall market direction
- pct values: positive as "0.72", negative as "-0.72" (no % sign, no + needed here but change field needs sign)
- change: always include sign e.g. "+38" or "-142"
- factor sentiment: "positive", "negative", or "neutral"
- If market was closed (weekend/holiday): set verdict to "US markets were closed today." and return empty arrays
- Return ONLY the JSON. Nothing else."""

# ── Claude call ───────────────────────────────────────────────────────────────

def call_claude(prompt, label):
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY not set in environment.")

    client = anthropic.Anthropic(api_key=api_key)
    print(f"  → Searching & generating {label} summary...")

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        tools=[{"type": "web_search_20250305", "name": "web_search"}],
        messages=[{"role": "user", "content": prompt}],
    )

    text = "".join(b.text for b in response.content if b.type == "text").strip()
    text = text.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"  ⚠️  JSON parse error: {e}")
        print(f"  Raw: {text[:300]}")
        return {
            "marketTime": "Data unavailable",
            "updatedAt":  "Please update manually",
            "verdictSentiment": "neutral",
            "verdict":    "Could not fetch today's data. Please update the JSON manually.",
            "watchOut":   "",
            "indices": [], "factors": [], "sectors": []
        }

# ── main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate FinanceDigest market reasoning")
    parser.add_argument("--indian", action="store_true", help="Generate Indian markets only")
    parser.add_argument("--us",     action="store_true", help="Generate US markets only")
    args = parser.parse_args()

    do_indian = args.indian or (not args.indian and not args.us)
    do_us     = args.us     or (not args.indian and not args.us)

    print("=" * 55)
    print("  FinanceDigest — Market Reasoning Generator")
    print("=" * 55)
    print(f"  Date    : {today_str()}")
    print(f"  Time IST: {ist_now().strftime('%H:%M')}")
    print(f"  Running : {'Indian + US' if do_indian and do_us else 'Indian only' if do_indian else 'US only'}")
    print()

    existing   = load_existing()
    old_today  = existing.get("today", {})

    # Start building new today block from old (preserve whichever we're not regenerating)
    new_today = {
        "date":    today_str(),
        "readyAt": "16:00",
        "indian":  old_today.get("indian", {}),
        "us":      old_today.get("us", {}),
    }

    # ── Indian ──
    if do_indian:
        print("🇮🇳 Generating Indian market summary...")
        new_today["indian"] = call_claude(INDIAN_PROMPT, "Indian")
        print(f"  ✓ {new_today['indian'].get('verdict','')[:70]}...")
        if do_us:
            time.sleep(2)

    # ── US ──
    if do_us:
        print("\n🇺🇸 Generating US market summary...")
        new_today["us"] = call_claude(US_PROMPT, "US")
        print(f"  ✓ {new_today['us'].get('verdict','')[:70]}...")

    # ── Roll over: old today → yesterday ──
    new_data = {
        "today": new_today,
        "yesterday": {
            "date":   old_today.get("date", yesterday_str()),
            "indian": old_today.get("indian", {}),
            "us":     old_today.get("us", {}),
        }
    }

    print(f"\n💾 Saving...")
    save_json(new_data)

    print()
    print("Done! Run schedule:")
    print("  🇮🇳 Indian → after 4:00 PM IST (Mon–Fri)")
    print("  🇺🇸 US     → after 2:00 AM IST (Tue–Sat)")

if __name__ == "__main__":
    main()