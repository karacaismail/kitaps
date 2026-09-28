import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bookSlug } from '../src/library.js';
import { displayTitle } from '../src/translation.js';

const projectRoot=fileURLToPath(new URL('../',import.meta.url));
const catalog=JSON.parse(fs.readFileSync(path.join(projectRoot,'src/catalog.json'),'utf8'));
const outputRoot=path.resolve(process.argv[2]||path.join(projectRoot,'dist'));
if(path.basename(outputRoot)!=='dist')throw new Error(`Static SEO output must be a dist directory: ${outputRoot}`);
const catalogRoot=path.join(outputRoot,'catalog');
const publicBase='https://karacaismail.github.io/kitaps/catalog/';
const appBase='https://karacaismail.github.io/kitaps/';
const pageSize=24;
const collator=new Intl.Collator('tr',{sensitivity:'base',numeric:true});
const byTitle=[...catalog.books].sort((a,b)=>collator.compare(displayTitle(a),displayTitle(b))||collator.compare(a.author,b.author));

export const escapeHtml=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const json=value=>JSON.stringify(value).replaceAll('<','\\u003c');
const pagePath=(prefix,page)=>`${prefix}${page>1?`page/${page}/`:''}`;
const canonicalFor=(prefix,page)=>`${publicBase}${pagePath(prefix,page)}`;
const interactiveFor=({category,collection,group,book}={})=>{
 const query=new URLSearchParams();
 if(category)query.set('category',category);
 if(collection)query.set('collection',collection);
 if(group)query.set('group',group);
 if(book)query.set('book',bookSlug(book));
 return `${appBase}${query.size?`?${query}`:''}`;
};

function documentShell({title,description,canonical,type='website',structured,body,prev='',next=''}) {
 return `<!doctype html>
<html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index,follow">
<link rel="canonical" href="${escapeHtml(canonical)}">${prev?`<link rel="prev" href="${escapeHtml(prev)}">`:''}${next?`<link rel="next" href="${escapeHtml(next)}">`:''}
<meta property="og:type" content="${type}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(canonical)}"><meta name="twitter:card" content="summary">
<script type="application/ld+json">${json(structured)}</script>
<style>:root{color-scheme:light dark;font-family:system-ui,sans-serif}body{max-width:52rem;margin:0 auto;padding:2rem 1rem;line-height:1.6}a{color:inherit;text-underline-offset:.2em}li{margin:.65rem 0}.meta{opacity:.75}.actions{display:flex;gap:1rem;flex-wrap:wrap;margin:1.5rem 0}.pagination{display:flex;justify-content:space-between;margin-top:2rem}</style></head><body>${body}</body></html>\n`;
}

function write(relative,html) {
 const directory=path.join(catalogRoot,relative);
 fs.mkdirSync(directory,{recursive:true});
 fs.writeFileSync(path.join(directory,'index.html'),html);
}

function renderListing({prefix='',heading='Tüm kitaplar',description='Araştırılmış seçkiler, konu rotaları, çeviri, çevirmen ve baskı bilgileriyle kitap kataloğu.',books=byTitle,interactive=interactiveFor()}) {
 const pages=Math.max(1,Math.ceil(books.length/pageSize));
 for(let page=1;page<=pages;page++){
  const canonical=canonicalFor(prefix,page);
  const shown=books.slice((page-1)*pageSize,page*pageSize);
  const title=`${heading}${page>1?` — Sayfa ${page}`:''} | Kitaplık`;
  const pageDescription=`${heading}: ${books.length} kitap; ${((page-1)*pageSize)+1}–${Math.min(page*pageSize,books.length)} arası eserler. Başlığa göre kararlı katalog sırası.`;
  const structured={'@context':'https://schema.org','@type':'CollectionPage',name:heading,description:pageDescription,url:canonical,mainEntity:{'@type':'ItemList',numberOfItems:books.length,itemListElement:shown.map((book,index)=>({'@type':'ListItem',position:(page-1)*pageSize+index+1,url:`${publicBase}books/${encodeURIComponent(bookSlug(book))}/`,name:displayTitle(book)}))}};
  const items=shown.map(book=>`<li><a href="${publicBase}books/${encodeURIComponent(bookSlug(book))}/">${escapeHtml(displayTitle(book))}</a><span class="meta"> — ${escapeHtml(book.author)}</span></li>`).join('');
  const prev=page>1?canonicalFor(prefix,page-1):'';
  const next=page<pages?canonicalFor(prefix,page+1):'';
  const body=`<header><a href="${publicBase}">Kitaplık</a><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(description)}</p><p class="meta">${books.length} eser · başlığa göre sıralı · sayfa ${page}/${pages}</p><p class="actions"><a href="${escapeHtml(interactive)}">Etkileşimli katalogda aç</a></p></header><main><ol start="${(page-1)*pageSize+1}">${items}</ol><nav class="pagination" aria-label="Sayfalar">${prev?`<a rel="prev" href="${prev}">Önceki sayfa</a>`:'<span></span>'}${next?`<a rel="next" href="${next}">Sonraki sayfa</a>`:''}</nav></main>`;
  write(pagePath(prefix,page),documentShell({title,description:pageDescription,canonical,structured,body,prev,next}));
 }
}

function renderBook(book) {
 const slug=bookSlug(book);
 const canonical=`${publicBase}books/${encodeURIComponent(slug)}/`;
 const title=`${displayTitle(book)} — ${book.author} | Kitaplık`;
 const description=`${displayTitle(book)}, ${book.author}. Türkçe baskı, çeviri, yayınevi, kaynak kümeleri ve okuma rotası bilgileri.`;
 const edition=book.verifiedEdition||book.cover;
 const structured={'@context':'https://schema.org','@type':'Book',name:displayTitle(book),author:{'@type':'Person',name:book.author},inLanguage:book.cover?.language||undefined,isbn:edition?.isbn||undefined,url:canonical};
 const categories=book.categories.map(id=>catalog.categories.find(item=>item.id===id)?.label).filter(Boolean);
 const facts=[book.years.length?`İlk yayın: ${book.years.join(' / ')}`:'',edition?.publisher?`Yayınevi: ${edition.publisher}`:'',edition?.isbn?`ISBN: ${edition.isbn}`:'',categories.length?`Konular: ${categories.join(', ')}`:''].filter(Boolean).map(item=>`<li>${escapeHtml(item)}</li>`).join('');
 const body=`<header><a href="${publicBase}">Kitaplık</a><h1>${escapeHtml(displayTitle(book))}</h1><p>${escapeHtml(book.author)}</p></header><main>${facts?`<ul>${facts}</ul>`:''}<p class="actions"><a href="${escapeHtml(interactiveFor({book}))}">Kitabı etkileşimli katalogda aç</a></p></main>`;
 write(`books/${slug}/`,documentShell({title,description,canonical,type:'book',structured,body}));
}

fs.rmSync(catalogRoot,{recursive:true,force:true});
renderListing({});
for(const item of catalog.categories)renderListing({prefix:`category/${item.id}/`,heading:item.label,books:byTitle.filter(book=>book.categories.includes(item.id)),interactive:interactiveFor({category:item.id})});
for(const item of catalog.collections)renderListing({prefix:`collection/${item.id}/`,heading:item.title,description:item.description,books:byTitle.filter(book=>book.collectionIds.includes(item.id)),interactive:interactiveFor({collection:item.id})});
for(const item of catalog.groups||[])renderListing({prefix:`group/${item.id}/`,heading:item.title,books:byTitle.filter(book=>book.groupIds.includes(item.id)),interactive:interactiveFor({group:item.id})});
for(const book of catalog.books)renderBook(book);
console.log(`static SEO: ${catalog.books.length} book pages and stable catalog listings`);
