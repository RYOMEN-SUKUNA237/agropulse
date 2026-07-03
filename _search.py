import os, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='ignore')
os.environ['KAGGLE_CONFIG_DIR'] = os.getcwd()
from kaggle.api.kaggle_api_extended import KaggleApi
api = KaggleApi(); api.authenticate()

queries = [
    "coffee leaf disease",
    "cocoa leaf disease",
    "cacao disease classification",
    "maize leaf disease",
    "corn disease classification",
    "banana leaf disease",
]
for q in queries:
    print("\n" + "="*70)
    print("SEARCH:", q)
    try:
        res = api.dataset_list(search=q, sort_by="hottest", max_size=None)
        for d in res[:10]:
            ref = getattr(d, 'ref', str(d))
            size = getattr(d, 'totalBytes', getattr(d, 'size', 0)) or 0
            title = getattr(d, 'title', '')
            print(f"   {ref:60s} | {title[:40]:40s} | {round(size/1e6,1)}MB")
    except Exception as e:
        print("   ERROR:", repr(e)[:160])
