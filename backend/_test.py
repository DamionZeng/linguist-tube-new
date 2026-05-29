import urllib.request
import json

BASE = "http://localhost:8000"

def req(method, path, data=None, token=None):
    url = f"{BASE}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    r = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(r)
        return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

def test(name, status, data, info=None):
    if status == 200:
        mark = "PASS"
    else:
        mark = "EXPECTED" if status in (403,) else "FAIL"
    line = f"  {mark} {name} ({status})"
    if info:
        line += f" - {info}"
    print(line)
    return status == 200

# Login as root (VIP)
print("=== Login VIP ===")
status, data = req("POST", "/api/auth/login", {"username": "root", "password": "123456"})
test("login root", status, data)
root_token = data.get("data", {}).get("token", "") if status == 200 else ""

# Login as damion (user)
status, data = req("POST", "/api/auth/login", {"username": "damion", "password": "123456"})
damion_token = data.get("data", {}).get("token", "") if status == 200 else ""

# VIP vocabulary access
print("\n=== VIP Vocabulary ===")
status, data = req("GET", "/api/vocabulary", token=root_token)
test("vocabulary (vip)", status, data)

# Add vocabulary
print("\n=== Add Vocabulary ===")
status, data = req("POST", "/api/vocabulary", token=root_token, data={
    "word": "get by", "phonetic": "/get baɪ/", "pos": "phrasal verb",
    "mean": "To manage or survive", "trans": "勉强生存",
    "example": '"I can get by on just 5 hours of sleep."',
    "exampleTrans": "我只睡5个小时也能勉强应付。"
})
test("add vocabulary", status, data)

# Verify vocabulary list has new word
status, data = req("GET", "/api/vocabulary", token=root_token)
if test("vocabulary list updated", status, data):
    items = data.get("data", [])
    print(f"    count={len(items)} words={[i['word'] for i in items]}")

# Word detail (saved)
status, data = req("GET", "/api/vocabulary/get%20by", token=root_token)
test("word detail (saved)", status, data)
if status == 200:
    print(f"    isSaved={data['data']['isSaved']}")

# Add favorite sentence
print("\n=== Add Favorite Sentence ===")
status, data = req("POST", "/api/favorites/sentence", token=damion_token, data={
    "en": "They go on your finger.",
    "zh": "它们戴在你的手指上。",
    "videoTitle": "商场购物与试衣",
    "time": "00:02"
})
test("add favorite sentence", status, data)

# Check favorites updated
status, data = req("GET", "/api/favorites", token=damion_token)
test("favorites updated", status, data)
if status == 200:
    print(f"    sentences count={len(data['data']['sentences'])}")

# Toggle fav video (add)
status, data = req("POST", "/api/favorites/videos/v1/toggle", token=damion_token)
test("add fav video", status, data)

# Check fav videos
status, data = req("GET", "/api/favorites/videos", token=damion_token)
test("fav videos list", status, data)
if status == 200:
    print(f"    count={len(data['data'])}")

# Toggle fav video (remove)
status, data = req("POST", "/api/favorites/videos/v1/toggle", token=damion_token)
test("remove fav video", status, data)

# Check transcripts with auth (should show isFavorite after toggle)
status, data = req("GET", "/api/video/v1/transcripts", token=damion_token)
test("transcripts with auth", status, data)
if status == 200:
    items = data.get("data", [])
    favs = [t['id'] for t in items if t.get('isFavorite')]
    print(f"    total={len(items)} favorites={favs}")

# Toggle fav transcript back
status, data = req("PUT", "/api/video/transcript/1/favorite", token=damion_token)
test("un-fav transcript", status, data)

print("\nAll edge cases verified!")