from supabase import create_client
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import os
import requests
import uuid

load_dotenv()

sb          = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
HEADERS     = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
BUCKET      = "article-images"
SUPABASE_URL = os.getenv("SUPABASE_URL")
FALLBACK    = "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop"


def get_og_image(url: str) -> str | None:
    try:
        r    = requests.get(url, headers=HEADERS, timeout=8, allow_redirects=True)
        soup = BeautifulSoup(r.text, "html.parser")
        og   = soup.find("meta", property="og:image")
        if og and og.get("content") and og["content"].startswith("http"):
            return og["content"].strip()
        tw = soup.find("meta", attrs={"name": "twitter:image"})
        if tw and tw.get("content") and tw["content"].startswith("http"):
            return tw["content"].strip()
    except Exception:
        pass
    return None


def upload(image_url: str) -> str | None:
    try:
        r = requests.get(image_url, headers=HEADERS, timeout=10)
        if r.status_code != 200:
            return None
        content_type = r.headers.get("Content-Type", "image/jpeg")
        if "image" not in content_type:
            return None
        ext = "png" if "png" in content_type else "webp" if "webp" in content_type else "jpg"
        filename = f"{uuid.uuid4().hex}.{ext}"
        sb.storage.from_(BUCKET).upload(
            filename, r.content,
            {"content-type": content_type, "x-upsert": "true"}
        )
        return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{filename}"
    except Exception as e:
        print(f"  ⚠️  Upload failed: {e}")
        return None


# ✅ Fetch articles with their source link for og:image scraping
articles = sb.table("processed_articles").select("id, image_url, raw_article_id").execute()
raw_links = {}
if articles.data:
    raw_ids   = [a["raw_article_id"] for a in articles.data if a.get("raw_article_id")]
    for i in range(0, len(raw_ids), 50):
        chunk = raw_ids[i:i+50]
        rows  = sb.table("raw_articles").select("id, link").in_("id", chunk).execute()
        for r in rows.data:
            raw_links[r["id"]] = r["link"]

fixed = 0

for a in articles.data:
    article_id    = a.get("id")
    current_url   = a.get("image_url")
    raw_article_id = a.get("raw_article_id")

    # Already uploaded to Supabase Storage — skip
    if current_url and "supabase" in current_url:
        print(f"  ✅ Already fixed — skip")
        continue

    source_link = raw_links.get(raw_article_id)
    new_url     = None

    # ✅ Try og:image from source article first
    if source_link:
        print(f"\n🔍 Scraping og:image from: {source_link[:60]}")
        og = get_og_image(source_link)
        if og:
            print(f"  ✅ Found og:image")
            new_url = upload(og)

    # Fall back to existing image_url if og:image failed
    if not new_url and current_url:
        print(f"  ♻️  Trying existing URL")
        new_url = upload(current_url)

    # Use fallback if everything failed
    if not new_url:
        print(f"  ⚠️  Using fallback image")
        new_url = FALLBACK

    try:
        sb.table("processed_articles").update({"image_url": new_url}).eq("id", article_id).execute()
        if new_url != FALLBACK:
            fixed += 1
            print(f"  ✅ Fixed ({fixed})")
    except Exception as e:
        print(f"  ❌ DB update failed: {e}")

print(f"\n🎉 Done. Fixed {fixed} images.")