"""Merge the three supplied datasets, preserving source records and memberships."""
from pathlib import Path
import json,re,unicodedata,hashlib
from translation_availability import validate_manifest
ROOT=Path(__file__).resolve().parents[1]
def read(p):return json.loads((ROOT/p).read_text())
atlas=read('data/sources/atlas-v1.json'); local=read('data/sources/okuma-kumeleri.json'); kitaps=read('data/sources/kitaps.json'); entrepreneurship=read('data/sources/entrepreneurship-curriculum.json'); foundations=read('data/foundational-reading.json'); preparation=read('data/preparatory-reading-tr.json'); preparation_covers=read('data/preparatory-reading-covers.json')
def norm(s):
 s=''.join(c for c in unicodedata.normalize('NFKD',s.lower().replace('ı','i')) if not unicodedata.combining(c)).replace('&','and')
 s=re.sub(r'\s*\([A-Z]\d+\)\s*$','',s,flags=re.I)
 return re.sub(r'[^\w]','',re.sub(r'^(the|a|an)\s+','',s))
aliases={'guerillamarketing':'guerrillamarketing','7habitsofhighlyeffectivepeople':'sevenhabitsofhighlyeffectivepeople','トヨタ生産方式toyotaproductionsystem':'toyotaproductionsystem','ταειςεαυτονmeditations':'meditations', 'miyamotomusashisbookoffiveringsacompletelynewtranslation':'五輪書gorinnosho','bookoffiveringsshambhalakodansha':'五輪書gorinnosho','bookoffiveringsclearycevirisi':'五輪書gorinnosho','bookoffiveringsharriscevirisi':'五輪書gorinnosho'}
def key(s):return aliases.get(norm(s),norm(s))
books={}; index={}; collections=[]; groups=[]; mapping={}; reports=[]
categoryNames={'strategy':'Strateji ve rekabet','management':'Yönetim ve liderlik','enterprise':'Girişimcilik','marketing':'Pazarlama ve satış','communication':'İletişim ve müzakere','psychology':'Psikoloji ve davranış','productivity':'Üretkenlik ve alışkanlıklar','systems':'Sistemler ve operasyon','finance':'Finans ve yatırım','economy':'Ekonomi ve toplum','technology':'Teknoloji ve yapay zekâ','innovation':'Yenilik ve tasarım','history':'Tarih','biography':'Biyografi ve anı','politics':'Siyaset ve jeopolitik','ethics':'Etik ve kurumsal sorumluluk','climate':'İklim ve sürdürülebilirlik','literature':'Edebiyat','philosophy':'Felsefe','children':'Çocuk','science':'Bilim ve öğrenme'}
def addcat(b,*cats):
 for c in cats:
  assert c in categoryNames,c
  if c not in b['categories']:b['categories'].append(c)
def getbook(title,author,origin,legacy=None,extraTitles=(),canonical=None):
 k=canonical or key(title)
 if not k:raise ValueError('Missing book title: '+str((title,author,origin)))
 # Two unrelated books can share a title; preserve their authors as a discriminator.
 collision=k in ['abundance','elonmusk','boom','whatworks']
 if collision:k+='-'+key(author).replace('ve','')
 candidates=index.get(k,[])
 b=books[candidates[0]] if candidates else None
 if not b and ':' in title:
  candidates=index.get(key(title.split(':')[0]),[])
  if len(candidates)==1:
   candidate=books[candidates[0]]
   surname=key(re.split(r'[,;&]| ve ',author)[0].split('(')[0].strip().split(' ')[-1])
   if surname and surname in key(candidate['author']):b=candidate
 if not b:
  bid=k or hashlib.sha1((title+author).encode()).hexdigest()[:12]
  b={'id':bid,'title':title,'titleTr':'','author':author,'aliases':[],'years':[],'categories':[],'memberships':[],'notes':[],'editions':[],'origins':[],'legacyKeys':[],'tags':[]}
  books[bid]=b
 if origin not in b['origins']:b['origins'].append(origin)
 if legacy and legacy not in b['legacyKeys']:b['legacyKeys'].append(legacy)
 for t in [title,*extraTitles]:
  if t and t!=b['title'] and t not in b['aliases']:b['aliases'].append(t)
 for t in [title,*extraTitles,canonical or '']:
  if t:
   tk=key(t)
   if collision:tk=k
   index.setdefault(tk,[])
   if b['id'] not in index[tk]:index[tk].append(b['id'])
 return b

def note(b,text,source):
 if text and not any(n['text']==text for n in b['notes']):b['notes'].append({'text':text,'source':source})
def member(b,cid,gid,**kwargs):
 old=next((m for m in b['memberships'] if m['collectionId']==cid and m['groupId']==gid),None)
 if old:
  for k,v in kwargs.items():
   if v and not old.get(k):old[k]=v
 else:b['memberships'].append({'collectionId':cid,'groupId':gid,**kwargs})

groupCats={
'İş kurma':['enterprise'],'Değer yaratma ve test etme':['enterprise','innovation'],'Pazarlama':['marketing'],'Satış':['marketing','communication'],'Değer sunma':['systems'],'Finans ve muhasebe':['finance'],'İnsan zihni':['psychology'],'Üretkenlik ve etkililik':['productivity'],'Problem çözme':['psychology','systems'],'Davranış değişikliği':['psychology','productivity'],'Karar verme':['psychology','strategy'],'İletişim':['communication'],'Etki ve ikna':['communication','psychology'],'Müzakere':['communication'],'Yönetim':['management'],'Liderlik':['management'],'Proje yönetimi':['management','systems'],'Sistemler':['systems'],'Analiz':['systems'],'Kurumsal beceriler':['management'],'Kurumsal strateji':['strategy'],'Yaratıcılık ve yenilik':['innovation'],'Tasarım':['innovation'],'Danışmanlık':['management','communication'],'Kişisel finans':['finance'],'Kişisel gelişim':['productivity'],'Kişisel etkililik':['productivity'],'Strateji':['strategy'],'Satış ve pazarlama':['marketing'],'Ekonomi ve ölçüm':['economy'],'Biyografiler':['biography'],'Girişimcilik':['enterprise'],'İş dünyası anlatıları':['biography','economy'],'Yenilik ve yaratıcılık':['innovation'],'Büyük fikirler':[],'Sistemi anlamak':['systems'],'Doğru yönü seçmek':['strategy'],'O yönde iş çıkarmak':['management']}
for c in atlas['collections']:
 collections.append({k:v for k,v in c.items() if k not in ['groups','guide','count'] }|{'origin':'atlas','originalCount':c['count']})
 for n,g in enumerate(c['groups']):
  gid=f"{c['id']}:{n}";groups.append({k:v for k,v in g.items() if k!='books'}|{'id':gid,'collectionId':c['id']})
  for old in g['books']:
   b=getbook(old['title'],old['author'],'atlas',extraTitles=[old.get('tr','')],canonical=old['key']);mapping['atlas:'+old['key']]=b['id']
   if old.get('tr'):b['titleTr']=old['tr']
   note(b,old.get('note'),c['short'])
   member(b,c['id'],gid,source=old.get('source',c.get('source')),award=old.get('status'),awardYear=int(g['title']) if c['id']=='ft' else None)
   if c['id']=='mit':addcat(b,'strategy')
   if c['id']=='time':addcat(b,'management')
   addcat(b,*groupCats.get(g['title'],[]))
 if c.get('guide'):
  guide=c['guide'];b=getbook(guide['title'],guide['author'],'atlas');addcat(b,'management')
  gid=c['id']+':guide';groups.append({'id':gid,'collectionId':c['id'],'title':'Başlangıç rehberi','guide':True});member(b,c['id'],gid,source=guide['source'],guide=True)
localmap={'time25':'time','personal-mba':'pmba','five-books':'five','ft-archive':'ft','hundred-best':'hundred','mit-sloan':'mit','core12':'core','near-term':'next'}
localbooks={}
for old in local['books']:
 b=getbook(old['title'],', '.join(old['authors']),'local',extraTitles=[old.get('titleTr','')]);localbooks[old['id']]=b
 if not b['titleTr']:b['titleTr']=old.get('titleTr','')
 if old.get('year') and old['year'] not in b['years']:b['years'].append(old['year'])
 note(b,old.get('note'),'Okuma Kümeleri')
for lc in local['collections']:
 cid=localmap[lc['id']];c=next(c for c in collections if c['id']==cid)
 c['context']={k:v for k,v in lc.items() if k not in ['items','subsets']}
 for sub in lc.get('subsets',[{'items':lc['items'],'name':''}]):
  for item in sub['items']:
   b=localbooks[item['bookId']];note(b,item.get('note'),lc['name'])
   for t in item.get('tags',[]):
    if t not in b['tags']:b['tags'].append(t)
   if not any(m['collectionId']==cid for m in b['memberships']):
    gid=cid+':local'
    if not any(g['id']==gid for g in groups):groups.append({'id':gid,'collectionId':cid,'title':'Metinde ayrıca anılanlar'})
    member(b,cid,gid,source=lc.get('sourceUrl'),note=item.get('note'))
 # Source membership annotations are kept separate from personal reading state.
 c['roles']=[r['role'] for r in local['roles'] if r['setId']==lc['id']]
sectionCats={'A':['strategy'],'B':['strategy'],'C':['psychology'],'D':['systems','management'],'E':['children'],'F':[],'G':['literature'],'H':['biography','history'],'K':['strategy','philosophy'],'M':[],'N':[],'P':['children'],'R':['children']}
for sec in kitaps['sections']:
 cid='kitaps-'+sec['key'];collections.append({'id':cid,'title':sec['label'],'short':sec['label'],'description':'Kitaps okuma listesinden; çeviri, yayınevi ve baskı notlarıyla.','origin':'kitaps','source':'https://karacaismail.github.io/kitaps/','mark':sec['key'],'tag':'Kişisel kitaplık','note':'Künye ve değerlendirme notları verilen Kitaps kaynağından aktarıldı. Güven puanları kaynağın kendi notlarından türetilmiştir.'})
for old in kitaps['books']:
 b=getbook(old['original'] or old['turkish'],old['author'],'kitaps',legacy=old['key'],extraTitles=[old['turkish']])
 mapping['kitaps:'+old['id']]=b['id'];mapping['kitaps:'+old['section']+':'+old['id']]=b['id']
 if old['turkish'] and not b['titleTr']:b['titleTr']=old['turkish']
 b['editions'].append(old)
 for sec in list(dict.fromkeys([old['section'],*old.get('alsoIn',[])])):
  cid='kitaps-'+sec;gid=cid+':'+(old.get('sub') or 'liste')
  if not any(g['id']==gid for g in groups):groups.append({'id':gid,'collectionId':cid,'title':old.get('sub') or 'Kitap listesi'})
  member(b,cid,gid,source='https://karacaismail.github.io/kitaps/',note=old['note'])
  addcat(b,*sectionCats.get(sec,[]))
# Preserve every translation from two standalone studies omitted by the old parser.
extras=[('I','Oscar Wilde · Reading Zindanı Baladı','The Ballad of Reading Gaol','Reading Zindanı Baladı',1898,[('Oğuz Baykara','Everest Yayınları (2017)','İngilizce aslından; kaynak notunda şiirsel okuma için öneriliyor.'),('Piyale Perver','Dedalus Kitap (2014)','İngilizce-Türkçe karşılaştırmalı basım.'),('Özdemir Asaf','Yuvarlak Masa / Kırmızı Yayınları (1968)','Fransızca üzerinden çeviri; kaynaktaki baskı uyarısına bakın.'),('Tozan Alkan','Bordo Siyah (2003) / Artshop (2006)','Kaynak dil ve güncel bulunurluk kaynakta kesinleştirilmemiş.')]),('L','Oscar Wilde · Dorian Gray','The Picture of Dorian Gray','Dorian Gray’in Portresi',1891,[('Nihal Yeğinobalı','Can Yayınları (2003)','Kaynakta edebî okuma için öneriliyor.'),('Didar Zeynep Batumlu','Türkiye İş Bankası Kültür Yayınları','Hasan Âli Yücel Klasikler Dizisi.'),('Ferit Burak Aydar','','Yayınevi kaynakta doğrulanmamış.'),('İlknur Özdemir','','Yayınevi kaynakta doğrulanmamış.')])]
for sec,label,title,tr,year,editions in extras:
 b=getbook(title,'Oscar Wilde','kitaps',extraTitles=[tr]);b['titleTr']=tr;b['years'].append(year);addcat(b,'literature')
 cid='kitaps-'+sec;collections.append({'id':cid,'title':label,'short':label,'origin':'kitaps','description':'Kaynak dosyadaki ayrıntılı çeviri karşılaştırması.','mark':sec,'tag':'Çeviri karşılaştırması','source':'https://karacaismail.github.io/kitaps/','note':'Kitaps kaynak dosyasındaki bağımsız kitap incelemesi.'});gid=cid+':liste';groups.append({'id':gid,'collectionId':cid,'title':'Çeviri karşılaştırması'});member(b,cid,gid,source='https://github.com/karacaismail/kitaps/blob/main/data/kitaplar.md')
 for translator,publisher,nt in editions:b['editions'].append({'id':sec,'translator':translator,'publisher':publisher,'note':nt,'status':['unverified'] if not publisher else [],'trust':None,'alt':None})
# Specific subjects take priority over mixed-purpose section headings.
recordCats={
'F1':['literature','biography'],'F2':['literature','philosophy'],'F3':['biography','history'],'F4':['history'],'F5':['literature'],'F6':['literature'],'F7':['history'],'F8':['history','literature'],'F9':['literature'],'F10':['literature'],
'C3':['philosophy','politics'],'A2':['politics','philosophy'],'A6':['economy','politics'],'B1':['history'],'B2':['history','economy'],'M1':['psychology','finance'],'M2':['strategy','management'],'M3':['strategy','innovation'],'M4':['management'],'M5':['economy','politics'],'M6':['philosophy','productivity'],
'N1':['psychology'],'N2':['psychology','management'],'N3':['philosophy'],'N4':['productivity','psychology'],'N5':['communication','psychology'],'N6':['communication'],'N7':['communication'],'N8':['communication','management'],'N9':['management','communication'],'N10':['communication'],
'R-164':['history','science'],'R-165':['science','literature'],'R-166':['science'],'R-167':['science'],'R-168':['philosophy'],'R-169':['climate'],'K9':['literature'],
}
for record,cats in recordCats.items():addcat(books[mapping['kitaps:'+record]],*cats)
# Cross-references in narrative tables also represent collection memberships.
cross={'M':['A3','A7','A8','A9','B9'],'N':['A8','B5','B3','A9','M3','M2','M1','M6','A4','K8','A5']}
for sec,ids in cross.items():
 gid='kitaps-'+sec+':cross';groups.append({'id':gid,'collectionId':'kitaps-'+sec,'title':'Notlarda ilişkilendirilen kitaplar'})
 for oldid in ids:
  b=books[mapping['kitaps:'+oldid]];member(b,'kitaps-'+sec,gid,source='https://github.com/karacaismail/kitaps/blob/main/data/kitaplar.md',note='Bu kitap, kaynak notlarında bu okuma hattıyla da ilişkilendirilmiştir.');addcat(b,*sectionCats[sec])
# Editorial topic assignments, independent from source collection membership.
ftcats=read('data/ft-categories.json')
for g in next(c for c in atlas['collections'] if c['id']=='ft')['groups']:
 tags=ftcats[g['title']];assert len(tags)==len(g['books']),(g['title'],len(tags),len(g['books']))
 for old,cats in zip(g['books'],tags):addcat(books[mapping['atlas:'+old['key']]],*cats.split(','))
# Explicit topics for the original route and titles which span fields.
overrides={'Thinking in Systems':['systems'],'The Goal':['systems'],'Out of the Crisis':['systems'],'Information Rules':['technology','economy','strategy'],'The Halo Effect':['psychology','management'],'Superforecasting':['psychology'],'How Brands Grow':['marketing'],'High Output Management':['management','productivity'],'The Effective Executive':['management','productivity'],'The Innovator’s Dilemma':['innovation','strategy'],'Competitive Advantage':['strategy'],'Co-opetition':['strategy'],'The Discoverers':['history','science'],'Syrup':['literature','marketing'],'The Republic of Tea':['enterprise','marketing'],'New Rules for the New Economy':['technology','economy'],'The Personal MBA':['management'],'The Power of Habit':['productivity','psychology'],'Atomic Habits':['productivity','psychology'],'Musashi':['literature','biography'],'Meditations':['philosophy'],'Antifragile':['psychology','finance'],'Nonviolent Communication':['communication'],'Drive':['psychology','management']}
for title,cats in overrides.items():
 for bid in index.get(key(title),[]):addcat(books[bid],*cats)
# Mechanism-based entrepreneurship route assembled from the supplied
# recommendations and two independent research passes.
collections.append({k:v for k,v in entrepreneurship.items() if k!='groups'}|{'mark':'G','tag':'Editoryal rota','note':'Liste 100 kitaba doldurulmadı; yalnızca araştırmayla gerekçelendirilen eserler alındı.'})
for group in entrepreneurship['groups']:
 gid=entrepreneurship['id']+':'+group['id'];groups.append({'id':gid,'collectionId':entrepreneurship['id'],'title':group['title']})
 for item in group['books']:
  b=books.get(item.get('existingId')) if item.get('existingId') else None
  if not b:b=getbook(item['title'],item['author'],'entrepreneurship',extraTitles=[item.get('titleTr','')])
  elif 'entrepreneurship' not in b['origins']:b['origins'].append('entrepreneurship')
  if item.get('year') and item['year'] not in b['years']:b['years'].append(item['year'])
  if item.get('titleTr'):
   b['titleTr']=item['titleTr']
   source_type='publisher' if any(domain in item['translationSource'] for domain in ['timas.com.tr','pegasusyayinlari.com']) else 'retailer'
   b['verifiedEdition']={'title':item['titleTr'],'isbn':item['isbnTr'],'publisher':item['publisherTr'],'translators':[item['translator']],'sourceUrl':item['translationSource'],'sourceType':source_type}
  note(b,item['reason'],'Girişimcilik rotası')
  member(b,entrepreneurship['id'],gid,source=item['sourceUrl'],note=item['reason'])
  mapping['entrepreneurship:'+key(item['title'])]=b['id'];addcat(b,'enterprise')
# Foundational books are maintained as a separate editorial dataset. Their
# unlock relationships are guidance, not hard prerequisites or fixed scores.
collections.append({k:v for k,v in foundations.items() if k!='groups'}|{'origin':'foundations','mark':'T','tag':'Küme anahtarı','note':'Belirli katalog kitaplarını daha verimli okumayı sağlayan temel ve eşlik kitapları.'})
foundation_links=[]
for group in foundations['groups']:
 gid=foundations['id']+':'+group['id'];groups.append({'id':gid,'collectionId':foundations['id'],'title':group['title']})
 for item in group['books']:
  b=getbook(item['title'],item['author'],'foundations',extraTitles=[item.get('titleTr','')])
  b['originalTitle']=item['title']
  if item.get('titleTr') and not b['titleTr']:b['titleTr']=item['titleTr']
  if item.get('year') and item['year'] not in b['years']:b['years'].append(item['year'])
  addcat(b,*item['categories']);note(b,item['reason'],'Temel okumalar araştırması')
  member(b,foundations['id'],gid,source=item['sourceUrl'],note=item['reason'])
  if item.get('cover'):b['cover']=item['cover']
  else:b['sourceIssue']={'note':'Eser katalogda korunuyor; güvenilir ve baskıyla eşleşen kapak henüz doğrulanmadı.'}
  foundation_links.append((b['id'],item.get('unlocks',[]),item.get('companions',[]),item['reason'],item['sourceUrl']))
  mapping['foundations:'+key(item['title'])]=b['id']
covers={**(read('data/international-covers.json') if (ROOT/'data/international-covers.json').exists() else {}),**read('data/turkish-covers.json')}
for bid,cover in covers.items():
 assert bid in books,bid
 books[bid]['cover']=cover
 if cover['language']=='tr':
  previous=books[bid]['titleTr']
  if previous and previous!=cover['title'] and previous not in books[bid]['aliases']:books[bid]['aliases'].append(previous)
  books[bid]['titleTr']=cover['title']
for bid,edition in read('data/edition-verification.json').items():
 assert bid in books,bid
 books[bid]['verifiedEdition']=edition
 if not books[bid]['titleTr']:books[bid]['titleTr']=edition['title']
for bid,issue in read('data/source-issues.json').items():
 assert bid in books,bid
 books[bid]['sourceIssue']=issue
# This source contains ten ordered recommendations. Two already exist in the
# foundational collection, so membership is merged instead of duplicating the
# work. The supplied order remains editorial metadata, never a fixed score.
collections.append({'id':'preparation','title':'Ön hazırlık okuma rotası','short':'Ön hazırlık','description':'Temel okuma, düşünme, sayısal hazırlık ve alan bağlamı için doğrulanmış Türkçe baskılar.','origin':'preparation','source':'https://github.com/karacaismail/kitaps','mark':'Ö','tag':'Başlangıç rafı','note':'Okuma sırası danışmanlık önerisidir; zorunlu önkoşul veya doğrudan puan değildir.'})
preparation_groups={}
preparation_categories={
 'hazirlik-01':['science'],'hazirlik-02':['philosophy','psychology'],'hazirlik-03':['science'],'hazirlik-04':['economy'],
 'hazirlik-05':['history'],'hazirlik-06':['philosophy'],'hazirlik-07':['psychology'],'hazirlik-08':['science','history'],
 'hazirlik-09':['science','productivity'],'hazirlik-10':['science','finance']
}
preparation_links=[]
for item in preparation['books']:
 stage=str(item['asama']).split('—',1)[0].strip();gid='preparation:'+stage
 if gid not in preparation_groups:
  preparation_groups[gid]=True;groups.append({'id':gid,'collectionId':'preparation','title':item['asama']})
 alternatives=[entry.get('ad') for entry in item.get('digerDillerdekiAdlar',[]) if entry.get('ad')]
 source_title=item.get('orijinalAdi') or (alternatives[0] if alternatives else item['turkceAdi'])
 author=' and '.join(item.get('orijinalYazarlar') or [])
 b=getbook(source_title,author,'preparation',extraTitles=[item['turkceAdi'],*alternatives])
 if not b.get('originalTitle') and item.get('orijinalAdi'):b['originalTitle']=item['orijinalAdi']
 b['titleTr']=item['turkceAdi'];b['cover']=preparation_covers[item['id']];b.pop('sourceIssue',None)
 original_turkish=item.get('orijinalAdi')==item['turkceAdi'] and not item.get('onerilenCevirmenler')
 b['verifiedEdition']={'title':item['turkceAdi'],'isbn':item['turkceBaskiISBN13'],'publisher':item['turkiyeYayinevi'],'translators':item.get('onerilenCevirmenler',[]),'sourceUrl':item['bibliyografikKaynaklar'][0],'sourceType':'publisher' if any(domain in item['bibliyografikKaynaklar'][0] for domain in ['bilgiyayinevi.com.tr','timas.com.tr','tubitak.gov.tr','remzi.com.tr','buzdagiyayinevi.com']) else 'retailer',**({'originalLanguage':'tr'} if original_turkish else {})}
 b['preparation']={'order':item['okumaSirasi'],'stage':item['asama'],'readingMethod':item['onerilenOkumaBicimi'],'concepts':item['calisilmasiOnerilenKavramlar'],'relation':item['iliskininNiteligi'],'verifiedAt':item['dogrulamaTarihi'],'verificationNote':item['dogrulamaNotu']}
 addcat(b,*preparation_categories[item['id']]);note(b,item['onerilmeNedeni'],'Ön hazırlık araştırması')
 member(b,'preparation',gid,source=item['bibliyografikKaynaklar'][0],note=item['onerilmeNedeni'],order=item['okumaSirasi'])
 preparation_links.append((b['id'],item['ornekHedefEserler'],item['onerilmeNedeni']))
 mapping['preparation:'+item['id']]=b['id']
for b in books.values():
 if any(origin in b['origins'] for origin in ['entrepreneurship','foundations']) and not b.get('cover') and not b.get('sourceIssue'):
  b['sourceIssue']={'note':'Kapak görseli eser ve baskı kimliğiyle birlikte henüz yerel kataloğa alınmadı; doğrulanmış bibliyografik kayıt görünür tutuluyor.'}
translation_records=validate_manifest(read('data/translation-availability.json'),set(books))
for bid,research in translation_records.items():
 books[bid]['translationResearch']=research
for b in books.values():
 if not b['categories']:addcat(b,'management')
 b['collectionIds']=list(dict.fromkeys(m['collectionId'] for m in b['memberships']));b['groupIds']=list(dict.fromkeys(m['groupId'] for m in b['memberships']))
for c in collections:
 c['count']=sum(c['id'] in b['collectionIds'] for b in books.values());c['groupIds']=[g['id'] for g in groups if g['collectionId']==c['id']]
for g in groups:g['count']=sum(g['id'] in b['groupIds'] for b in books.values())
readingGuides=read('data/reading-guides.json')
for foundation_id,target_ids,companion_ids,reason,source_url in foundation_links:
 readingGuides['sources'].setdefault(foundation_id,[]).append({'label':'Bibliyografik kayıt · Open Library','url':source_url})
 foundation_override=readingGuides['overrides'].setdefault(foundation_id,{'before':[],'after':[]})
 for target_id in target_ids:
  if target_id not in books:continue
  target_override=readingGuides['overrides'].setdefault(target_id,{'before':[],'after':[]})
  before={'id':foundation_id,'reason':reason}
  after={'id':target_id,'reason':'Bu temel okumadaki çerçeveyi katalogdaki bu eser üzerinde uygulayarak derinleştirebilirsin.'}
  if not any(item['id']==foundation_id for item in target_override['before']):target_override['before'].append(before)
  if not any(item['id']==target_id for item in foundation_override['after']):foundation_override['after'].append(after)
 for companion_id in companion_ids:
  if companion_id not in books:continue
  companion_override=readingGuides['overrides'].setdefault(companion_id,{'before':[],'after':[]})
  foundation_companions=foundation_override.setdefault('companions',[])
  target_companions=companion_override.setdefault('companions',[])
  link_to_target={'id':companion_id,'reason':reason}
  link_to_foundation={'id':foundation_id,'reason':reason}
  if not any(item['id']==companion_id for item in foundation_companions):foundation_companions.append(link_to_target)
  if not any(item['id']==foundation_id for item in target_companions):target_companions.append(link_to_foundation)
for preparation_id,target_titles,reason in preparation_links:
 source_override=readingGuides['overrides'].setdefault(preparation_id,{'before':[],'after':[]})
 for title in target_titles:
  wanted=key(title)
  candidates=[b['id'] for b in books.values() if wanted in {key(value) for value in [b['title'],b.get('titleTr',''),*b.get('aliases',[]),b.get('cover',{}).get('title','')] if value}]
  assert len(candidates)==1,(title,candidates)
  target_id=candidates[0];target_override=readingGuides['overrides'].setdefault(target_id,{'before':[],'after':[]})
  if not any(item['id']==preparation_id for item in target_override['before']):target_override['before'].append({'id':preparation_id,'reason':reason})
  if not any(item['id']==target_id for item in source_override['after']):source_override['after'].append({'id':target_id,'reason':'Bu hazırlıkta çalışılan kavramları katalogdaki bu eser üzerinde uygulayabilirsin.'})
result={'updated':'28 Eylül 2026','readingGuides':readingGuides,'books':list(books.values()),'collections':collections,'groups':groups,'categories':[{'id':k,'label':v,'count':sum(k in b['categories'] for b in books.values())} for k,v in categoryNames.items()],'sourceTags':local['tags'],'mapping':mapping,'sourceCounts':{'atlasEntries':sum(len(g['books']) for c in atlas['collections'] for g in c['groups']),'localBooks':len(local['books']),'kitapsRecords':len(kitaps['books']),'foundationalBooks':sum(len(group['books']) for group in foundations['groups']),'preparationRecommendations':len(preparation['books'])}}
(ROOT/'src/catalog.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(len(books),'books',len(collections),'collections',len(groups),'groups')
print('Edition records',sum(len(b['editions']) for b in books.values()))
