import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
const badge=fs.readFileSync(new URL('../src/components/ReadingPriorityBadge.jsx',import.meta.url),'utf8');
const card=fs.readFileSync(new URL('../src/components/ReadingPriorityCard.jsx',import.meta.url),'utf8');

test('primary tabs always render a matching panel and Notes is outside the tabset',()=>{
 for(const value of ['books','queue','collections'])assert.match(app,new RegExp(`<Tabs\\.Panel value="${value}">`));
 assert.match(app,/const activeTab=.*\?view:null;/);
 assert.match(app,/<section aria-labelledby="notes-heading">/);
});

test('personal sections keep one semantic h1 without restoring intro copy',()=>{
 assert.match(app,/<Title order=\{1\} className="visually-hidden">\{view==='owned'\?'Kitaplığım':'Favorilerim'\}<\/Title>/);
 for(const heading of ['Okuma sıram','Kitap kümeleri','Kaynaklar ve notlar'])assert.match(app,new RegExp(`order=\\{1\\} className="visually-hidden">${heading}`));
});

test('footer Notes navigation writes browser history through navigate',()=>{
 assert.match(app,/onClick=\{\(\)=>\{navigate\(\{\.\.\.route,view:'notes',book:null,page:1\}\)/);
});

test('footer exports every catalog book as a self-describing JSON file',()=>{
 assert.match(app,/const exportAllBooks=\(\)=>download\('kitaplik-tum-kitaplar\.json',createBooksExport\(catalog\)\)/);
 assert.match(app,/onClick=\{exportAllBooks\}>Kitapları JSON indir<\/Button>/);
});

test('footer shows creation and catalog update dates separately',()=>{
 assert.match(app,/Yaratılış · 27 Eylül ’26/);
 assert.match(app,/Güncelleme · \{catalog\.updated\}/);
});

test('priority summaries expose full text and labelled progress values',()=>{
 assert.match(badge,/className="visually-hidden">Okuma önceliği:/);
 assert.match(badge,/aria-hidden="true"/);
 assert.match(card,/aria-label=\{`\$\{item\.label\}: yüzde/);
});

test('removed card category component stays unused',()=>{
 assert.equal(fs.existsSync(new URL('../src/components/CardCategories.jsx',import.meta.url)),false);
 assert.doesNotMatch(app,/CardCategories/);
 const bookCard=app.slice(app.indexOf('function BookCard('),app.indexOf('function BookDetail('));
 assert.doesNotMatch(bookCard,/CategoryPill|card-categories|category-more/);
});
