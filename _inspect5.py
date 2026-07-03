import os, sys, io, time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='ignore')
os.environ['KAGGLE_CONFIG_DIR'] = os.getcwd()
from kaggle.api.kaggle_api_extended import KaggleApi
from collections import Counter
api = KaggleApi(); api.authenticate()

slug = "asaahmanasseh/crop-care-dataset-v2"
dirs = Counter(); token=None; pages=0
while pages < 200:
    for _ in range(4):
        try:
            res = api.dataset_list_files(slug, page_token=token, page_size=500); break
        except Exception: time.sleep(3)
    files = getattr(res,'files',[]) or []
    for f in files:
        parts=str(f).split('/'); d='/'.join(parts[:-1]) if len(parts)>1 else '<ROOT>'
        dirs[d]+=1
    token=getattr(res,'nextPageToken',None) or getattr(res,'next_page_token',None)
    pages+=1
    if not token or not files: break
for d,c in sorted(dirs.items()):
    low=d.lower()
    if 'cashew' not in low and 'cassava' not in low:
        print(f"   {c:6d}  {d}")
print("TOTAL FOLDERS:", len(dirs))
