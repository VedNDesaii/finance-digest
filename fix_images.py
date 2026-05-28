from supabase import create_client
from dotenv import load_dotenv
import os
import requests
import uuid
from urllib.parse import urlparse

load_dotenv()

sb = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
    )
}

BUCKET = "article-images"
SUPABASE_URL = os.getenv("SUPABASE_URL")

FALLBACK_IMAGE = (
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3"
    "?q=80&w=1200&auto=format&fit=crop"
)

articles = (
    sb.table("processed_articles")
    .select("id, image_url")
    .execute()
)

fixed = 0

for a in articles.data:

    article_id = a.get("id")
    url = a.get("image_url")

    # Skip empty URLs
    if not url:
        print("Missing image URL")
        continue

    # Skip already-fixed images
    if "supabase" in url:
        print("Already fixed")
        continue

    try:

        print(f"\nFetching: {url}")

        r = requests.get(
            url,
            headers=HEADERS,
            timeout=12,
            stream=True
        )

        # Failed request
        if r.status_code != 200:
            print(f"Bad status: {r.status_code}")

            sb.table("processed_articles").update({
                "image_url": FALLBACK_IMAGE
            }).eq("id", article_id).execute()

            continue

        content_type = r.headers.get(
            "Content-Type",
            "image/jpeg"
        )

        # Not actually an image
        if "image" not in content_type:
            print("Not image content")

            sb.table("processed_articles").update({
                "image_url": FALLBACK_IMAGE
            }).eq("id", article_id).execute()

            continue

        # Extension handling
        if "png" in content_type:
            ext = "png"
        elif "webp" in content_type:
            ext = "webp"
        else:
            ext = "jpg"

        filename = f"{uuid.uuid4().hex}.{ext}"

        # Upload to Supabase Storage
        upload = (
            sb.storage
            .from_(BUCKET)
            .upload(
                filename,
                r.content,
                {
                    "content-type": content_type,
                    "x-upsert": "true"
                }
            )
        )

        # Generate public URL
        new_url = (
            f"{SUPABASE_URL}"
            f"/storage/v1/object/public/"
            f"{BUCKET}/{filename}"
        )

        # Save into DB
        sb.table("processed_articles").update({
            "image_url": new_url
        }).eq("id", article_id).execute()

        fixed += 1

        print(f"Fixed {fixed}: {filename}")

    except Exception as e:

        print(f"Failed: {e}")

        # Save fallback image
        try:
            sb.table("processed_articles").update({
                "image_url": FALLBACK_IMAGE
            }).eq("id", article_id).execute()
        except:
            pass

print(f"\nDone. Fixed {fixed} images.")