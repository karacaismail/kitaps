import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readingGuide, relatedBooks, clampPage } from '../src/recommendations.js';
import { prepareBooks, filterBooks, emptyFilters } from '../src/library.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../src/catalog.json',import.meta.url)));
const byId=Object.fromEntries(catalog.books.map(b=>[b.id,b]));
test('every book has a purpose and valid, non-overlapping before/after recommendations',()=>{
 for(const b of catalog.books){
  const g=readingGuide(b,catalog);assert.ok(g.purpose.length>40,b.id);assert.ok(g.kind);
  const links=[...g.before,...g.after];assert.equal(new Set(links.map(l=>l.id)).size,links.length,b.id);
  for(const l of links){assert.ok(byId[l.id],l.id);assert.notEqual(l.id,b.id);assert.ok(l.reason.length>40,l.id);}
 }
 for(const [id,links] of Object.entries(catalog.readingGuides.overrides)){
  assert.ok(byId[id],id);for(const l of [...(links.before||[]),...(links.after||[])])assert.ok(byId[l.id],l.id);
 }
 for(const r of catalog.readingGuides.routes)for(const id of r.books)assert.ok(byId[id],id);
});
test('Rumelt route has a preparation reason and specific deepening books',()=>{
 const g=readingGuide(byId.goodstrategybadstrategy,catalog);
 assert.equal(g.kind,'Kitaba özel okuma amacı');assert.equal(g.before[0].id,'personalmbamastertheartofbusiness');
 assert.ok(g.after.some(l=>l.id==='competitivestrategy'));assert.match(g.after[0].reason,/beş rekabet güc/);
});
test('similar books follow the chosen category/collection and include purchased works while excluding self',()=>{
 const b=byId.goodstrategybadstrategy;
 for(const scope of ['category|strategy','collection|kitaps-A','collection|core']){
  const original=relatedBooks(b,catalog,scope);assert.ok(original.length);
  const first=original[0];const marked=relatedBooks(b,catalog,scope,{[first.id]:['alindi','onemli']});
  assert.ok(marked.some(x=>x.id===first.id));assert.ok(!marked.some(x=>x.id===b.id));assert.equal(marked.length,original.length);
  for(const x of original)assert.ok(scope.startsWith('category')?x.categories.includes('strategy'):x.collectionIds.includes(scope.split('|')[1]));
 }
 assert.deepEqual(relatedBooks(b,catalog,'invalid|strategy'),[]);
});
test('verified translator records retain exact edition evidence and corrected names are searchable',()=>{
 const editions=catalog.books.filter(b=>b.verifiedEdition);assert.ok(editions.length>=18);
 for(const b of editions){const e=b.verifiedEdition;if(e.isbn)assert.match(e.isbn,/^(\d{13}|\d{9}[\dX])$/);else assert.ok(e.note);assert.ok(e.publisher);assert.equal(new URL(e.sourceUrl).protocol,'https:');assert.ok(Array.isArray(e.translators));}
 assert.deepEqual(byId['идиот'].verifiedEdition.translators,['Mazlum Beyhan']);
 assert.deepEqual(byId['смертьиванаильича'].verifiedEdition.translators,['Mazlum Beyhan']);
 assert.deepEqual(byId.thinkinginsystems.verifiedEdition.translators,[]);
 assert.ok(filterBooks(prepareBooks(catalog.books),{...emptyFilters(),query:'Mazlum Beyhan'}).some(b=>b.id==='идиот'));
});
test('page jumps recover from empty, decimal, out-of-range and invalid input',()=>{
 for(const [value,total,expected] of [['',30,1],['no',30,1],[-10,30,1],[99,30,30],[2.8,30,2],[1,0,1],[30,30,30]])assert.equal(clampPage(value,total),expected);
});
test('preparation routes contain no circular dependencies',()=>{
 const visited=new Set(),active=new Set();
 function visit(id){assert.ok(!active.has(id),`Circular preparation for ${id}`);if(visited.has(id))return;active.add(id);for(const item of readingGuide(byId[id],catalog).before)visit(item.id);active.delete(id);visited.add(id);}
 for(const book of catalog.books)visit(book.id);
});
test('publisher-confirmed translators and displayed covers use the same ISBN',()=>{
 for(const book of catalog.books)if(book.verifiedEdition?.sourceType==='publisher'&&book.cover)assert.equal(book.cover.isbn,book.verifiedEdition.isbn,book.id);
});
