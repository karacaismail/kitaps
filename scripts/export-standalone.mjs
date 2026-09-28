import { readFileSync, writeFileSync } from 'node:fs';
const base = new URL('../', import.meta.url);
const readJSON=path=>JSON.parse(readFileSync(new URL(path,base),'utf8'));
const catalog=readJSON('src/catalog.json');
const covers = Object.fromEntries(catalog.books.filter(b=>b.cover).map(b=>[b.id,b.cover]));
const images = Object.fromEntries(Object.values(covers).map(cover=>[cover.src,`data:image/${cover.src.endsWith('.webp')?'webp':cover.src.endsWith('.png')?'png':'jpeg'};base64,${readFileSync(new URL('public/'+cover.src,base)).toString('base64')}`]));
// The standalone build (vite --mode standalone) inlines every script into one file.
let html=readFileSync(new URL('dist-standalone/index.html',base),'utf8');
html=html.replace('<head>',`<head><script>globalThis.__KITAP_COVERS__=${JSON.stringify(images)};</script>`);
writeFileSync(new URL('../kitaps.html',base),html);
writeFileSync(new URL('../kitaplik-tum-veri.json',base),JSON.stringify({catalog,sources:{atlas:readJSON('data/sources/atlas-v1.json'),okumaKumeleri:readJSON('data/sources/okuma-kumeleri.json'),kitaps:readJSON('data/sources/kitaps.json'),kitapsCovers:readJSON('data/sources/kitaps-covers.json'),entrepreneurship:readJSON('data/sources/entrepreneurship-curriculum.json'),foundations:readJSON('data/foundational-reading.json'),preparation:readJSON('data/preparatory-reading-tr.json'),kitapsNotes:readFileSync(new URL('data/sources/kitaplar.md',base),'utf8')}},null,2)+'\n');
console.log(`Standalone HTML: ${(Buffer.byteLength(html)/1024/1024).toFixed(1)} MB, ${Object.keys(images).length} embedded covers`);
