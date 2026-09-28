import fs from 'node:fs';
import { bookSlug } from '../src/library.js';

const root=new URL('../',import.meta.url);
const catalog=JSON.parse(fs.readFileSync(new URL('src/catalog.json',root),'utf8'));
const base='https://karacaismail.github.io/kitaps/';
const urls=new Set([base]);
for(let page=2;page<=Math.ceil(catalog.books.length/24);page++)urls.add(`${base}?page=${page}`);
for(const item of catalog.categories)urls.add(`${base}?category=${encodeURIComponent(item.id)}`);
for(const item of catalog.collections)urls.add(`${base}?collection=${encodeURIComponent(item.id)}`);
for(const item of catalog.groups||[])urls.add(`${base}?group=${encodeURIComponent(item.id)}`);
for(const book of catalog.books)urls.add(`${base}?book=${encodeURIComponent(bookSlug(book))}`);
const escape=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const body=[...urls].map(url=>`  <url><loc>${escape(url)}</loc></url>`).join('\n');
fs.writeFileSync(new URL('public/sitemap.xml',root),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
console.log(`sitemap.xml: ${urls.size} public URL`);
