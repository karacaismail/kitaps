"""Collect matching Turkish edition covers from public Kitapsepeti product metadata.
Run manually with requests and beautifulsoup4 installed. Never used by the build.
A cache avoids repeated requests; unmatched/ambiguous editions are left empty.
"""
from pathlib import Path
from urllib.parse import quote, urljoin
from concurrent.futures import ThreadPoolExecutor
from difflib import SequenceMatcher
import argparse, hashlib, json, re, time, unicodedata
import requests
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--cache',required=True);args=parser.parse_args()
cache=Path(args.cache);cache.mkdir(parents=True,exist_ok=True)
BASE='https://www.kitapsepeti.com'
books=json.loads((ROOT/'src/catalog.json').read_text())['books']
manifestpath=ROOT/'data/turkish-covers.json'
manifest=json.loads(manifestpath.read_text()) if manifestpath.exists() else {}
def norm(s):
 s=s.lower().replace('ı','i');s=''.join(c for c in unicodedata.normalize('NFKD',s) if not unicodedata.combining(c))
 return re.sub(r'[^a-z0-9]','',s)
def get(url):
 path=cache/(hashlib.sha256(url.encode()).hexdigest()+'.html')
 if path.exists():return path.read_text()
 time.sleep(.3)
 r=requests.get(url,timeout=25);r.raise_for_status();path.write_text(r.text);return r.text
def clean(t):return re.sub(r'\s*\([^)]*\)\s*',' ',t).strip().replace(' / ',' ')
def score(a,b):
 a,b=norm(clean(a)),norm(clean(b))
 if set(re.findall(r'\d+',a))!=set(re.findall(r'\d+',b)):return 0
 if a==b:return 1
 if min(len(a),len(b))>=7 and (a.startswith(b) or b.startswith(a)):return .94
 return SequenceMatcher(None,a,b).ratio()
def author_match(a,b):
 ta={norm(t) for t in re.split(r'[\s,.()&]+',a) if len(norm(t))>3}
 tb={norm(t) for t in re.split(r'[\s,.()&]+',b) if len(norm(t))>3}
 return bool(ta & tb) or norm(a) in norm(b) or norm(b) in norm(a)
def fetch(b):
 expected=b.get('verifiedEdition',{}).get('isbn') if b.get('verifiedEdition',{}).get('sourceType')=='publisher' else None
 if manifest.get(b['id'],{}).get('matchMethod')=='manual-source-review':return b['id'],manifest[b['id']]
 if b['id'] in manifest and (not expected or manifest[b['id']]['isbn']==expected) and max(score(t,manifest[b['id']]['title']) for t in [b['titleTr'] or b['title'],*b['aliases']])>=.83:return b['id'],manifest[b['id']]
 manifest.pop(b['id'],None)
 query=expected or clean(b['titleTr'] or b['title'])
 try:
  soup=BeautifulSoup(get(BASE+'/arama?q='+quote(query)),'html.parser')
  surname=re.split(r'[,;&]| and | ve ',b['author'])[0].split('(')[0].strip().split(' ')[-1]
  if surname and len(surname)>2:
   soup=BeautifulSoup(str(soup)+get(BASE+'/arama?q='+quote(surname)),'html.parser')
  titles=[b['titleTr'] or b['title'],*b['aliases']]
  candidates=[]
  publishers=' '.join(e.get('publisher','') for e in b['editions'])
  for item in soup.select('.product-item'):
   title=item.select_one('.product-title');author=item.select_one('.model-title');publisher=item.select_one('.brand-title')
   if not title or not author or not publisher:continue
   sim=max(score(t,title.get_text(' ',strip=True)) for t in titles)
   if sim<.83 or not author_match(b['author'],author.get_text(' ',strip=True)):continue
   pub=publisher.get_text(' ',strip=True)
   preferred=bool(norm(pub) in norm(publishers))
   candidates.append((sim+(.03 if preferred else 0),urljoin(BASE,title['href'])))
  candidates.sort(reverse=True)
  for _,url in candidates[:3]:
   page=BeautifulSoup(get(url),'html.parser');product=None
   for ld in page.select('script[type="application/ld+json"]'):
    try:
     data=json.loads(ld.string or ld.get_text());nodes=data.get('@graph',[data])
     product=next((p for p in nodes if 'Book' in p.get('@type',[]) or 'Product' in p.get('@type',[])),None)
     if product:break
    except (ValueError,AttributeError):pass
   if not product or str(product.get('inLanguage','')).lower() not in ['turkish','tr','türkçe']:continue
   ptitle=product.get('name','');pauthor=product.get('author',{}).get('name','')
   if not author_match(b['author'],pauthor) or max(score(t,ptitle) for t in titles)<.83:continue
   image=product.get('image',[]);image=image[0] if isinstance(image,list) and image else image
   isbn=product.get('isbn','')
   if expected and isbn!=expected:continue
   if not image or not isbn or not image.startswith('https://asset.kitapsepeti.com/'):continue
   # Series/adaptations need manual edition selection, not a generic same-title match.
   if re.search(r'uyarlama|serisi|\(seri\)|graphic novel|complete musashi|way of the warrior',b['title'],re.I):continue
   ext='.webp' if '.webp' in image else '.jpg' if '.jpg' in image else '.png'
   filename=hashlib.sha256(b['id'].encode()).hexdigest()[:16]+ext
   path=ROOT/'public/covers'/filename
   if not path.exists():
    r=requests.get(image,timeout=25);r.raise_for_status()
    if not r.headers.get('content-type','').startswith('image/'):continue
    path.write_bytes(r.content)
   return b['id'],{'src':'covers/'+filename,'imageUrl':image,'sourceUrl':url,'sourceName':'Kitapsepeti','title':ptitle,'author':pauthor,'publisher':product.get('publisher',{}).get('name',''),'isbn':isbn,'language':'tr','checkedAt':'2026-09-28'}
  return b['id'],None
 except Exception as e:return b['id'],{'error':str(e)}
targets=[b for b in books if b['titleTr'] or b['editions']]
failed=[]
with ThreadPoolExecutor(max_workers=2) as pool:
 for i,(bid,result) in enumerate(pool.map(fetch,targets)):
  if result and 'error' not in result:manifest[bid]=result
  else:failed.append({'id':bid,'reason':result})
  manifestpath.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
  if (i+1)%15==0:print(i+1,'/',len(targets),'covers',len(manifest),flush=True)
(cache/'unmatched.json').write_text(json.dumps(failed,ensure_ascii=False,indent=2))
print('DONE',len(manifest),'covers;',len(failed),'unmatched',flush=True)
