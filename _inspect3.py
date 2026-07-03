import os, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='ignore')
os.environ['KAGGLE_CONFIG_DIR'] = os.getcwd()
from kaggle.api.kaggle_api_extended import KaggleApi
from collections import Counter
api = KaggleApi(); api.authenticate()

datasets = [
    "badasstechie/coffee-leaf-diseases",
    "biniyamyoseph/ethiopian-coffee-leaf-disease",
    "asaahmanasseh/crop-care-dataset-v2",
    "smaranjitghose/corn-or-maize-leaf-disease-dataset",
    "shifatearman/bananalsd",
]

def all_dirs(slug, max_pages=40):
    dirs = Counter(); token=None; pages=0
    while pages < max_pages:
        res = api.dataset_list_files(slug, page_token=token, page_size=500)
        files = getattr(res, 'files', []) or []
        for f in files:
            parts = str(f).split('/')
            d = '/'.join(parts[:-1]) if len(parts) > 1 else '<ROOT>'
            dirs[d]+=1
        token = getattr(res,'nextPageToken',None) or getattr(res,'next_page_token',None)
        pages+=1
        if not token or not files: break
    return dirs

for slug in datasets:
    print("\n"+"="*70); print("DATASET:", slug)
    try:
        for d,c in sorted(all_dirs(slug).items()):
            print(f"   {c:6d}  {d}")
    except Exception as e:
        print("   ERROR:", repr(e)[:160])
