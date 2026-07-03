import os
import json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")
key = os.getenv("GEMINI_API_KEY", "")

from google import genai
client = genai.Client(api_key=key)

try:
    r = client.models.generate_content(model="gemini-2.0-flash", contents="Reply with only: WORKING")
    txt = r.text.strip()
    Path("error.txt").write_text(f"SUCCESS: {txt}", encoding="utf-8")
except Exception as e:
    ename = type(e).__name__
    emsg = str(e)
    Path("error.txt").write_text(f"FAIL: {ename}\n{emsg}", encoding="utf-8")
