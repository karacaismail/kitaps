import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ReadingPriorityEngine } from '../src/ranking/ReadingPriorityEngine.ts';

const catalog=JSON.parse(fs.readFileSync(new URL('../src/catalog.json',import.meta.url)));
const emptyContext=()=>({states:{},queue:[],reading:{}});
const byId=ranked=>Object.fromEntries(ranked.map(item=>[item.bookId,item]));
const fixtureBook=(id,overrides={})=>({
 id,
 title:'Aynı test kitabı',
 author:'Test Yazarı',
 years:[2020],
 categories:['strategy'],
 collectionIds:['test-list'],
 groupIds:['test-list:0'],
 memberships:[{collectionId:'test-list',groupId:'test-list:0',source:'https://example.com/list'}],
 editions:[],
 notes:[],
 origins:['test'],
 tags:[],
 cover:{
  title:'Aynı test kitabı',author:'Test Yazarı',publisher:'Test Publisher',isbn:'9780000000002',
  sourceUrl:'https://example.com/book',imageUrl:'https://example.com/book.jpg',src:'covers/test.jpg',language:'en'
 },
 ...overrides
});
const fixtureCatalog=books=>({books,readingGuides:{routes:[],overrides:{}}});

test('reading priority scores every catalog book once and assigns dense unique ranks',()=>{
 const ranked=new ReadingPriorityEngine(catalog).rank(emptyContext());
 assert.equal(catalog.books.length,736,'catalog fixture changed; update the expected audited total deliberately');
 assert.equal(ranked.length,catalog.books.length);
 assert.equal(new Set(ranked.map(item=>item.bookId)).size,catalog.books.length);
 assert.deepEqual([...ranked.map(item=>item.rank)].sort((a,b)=>a-b),Array.from({length:catalog.books.length},(_,index)=>index+1));
 assert.deepEqual(new Set(ranked.map(item=>item.bookId)),new Set(catalog.books.map(book=>book.id)));
});

test('ranking is deterministic, including across catalog and context insertion order',()=>{
 const ids=catalog.books.slice(0,5).map(book=>book.id);
 const context={
  states:{[ids[0]]:['alindi'],[ids[1]]:['okunuyor','alindi'],[ids[2]]:['okundu']},
  queue:[ids[3],ids[0]],
  reading:{[ids[1]]:{startedAt:'2026-09-28',page:12,totalPages:200}}
 };
 const first=new ReadingPriorityEngine(catalog).rank(context);
 const reorderedContext={
  states:Object.fromEntries(Object.entries(context.states).reverse()),
  queue:[...context.queue],
  reading:Object.fromEntries(Object.entries(context.reading).reverse())
 };
 assert.deepEqual(new ReadingPriorityEngine(catalog).rank(reorderedContext),first);
 assert.deepEqual(new ReadingPriorityEngine({...catalog,books:[...catalog.books].reverse()}).rank(reorderedContext),first);
});

test('adding and removing a strong outlier recomputes normalization and ranks',()=>{
 const baseBooks=[
  fixtureBook('steady-a'),
  fixtureBook('steady-b',{collectionIds:['test-list','second-list'],groupIds:['test-list:0','second-list:0']})
 ];
 const baseContext={states:{'steady-a':['alindi'],'steady-b':['alindi']},queue:[],reading:{}};
 const baseline=new ReadingPriorityEngine(fixtureCatalog(baseBooks)).rank(baseContext);
 const outlier=fixtureBook('new-outlier',{
  collectionIds:Array.from({length:24},(_,index)=>`list-${index}`),
  groupIds:Array.from({length:24},(_,index)=>`list-${index}:0`),
  categories:['strategy','management','productivity'],
  verifiedEdition:{title:'Aynı test kitabı',publisher:'Test Publisher',isbn:'9780000000002',sourceUrl:'https://example.com/verified',translators:[],sourceType:'publisher'}
 });
 const expandedContext={...baseContext,states:{...baseContext.states,'new-outlier':['alindi','okunuyor']},queue:['new-outlier'],reading:{'new-outlier':{startedAt:'2026-09-28'}}};
 const expanded=new ReadingPriorityEngine(fixtureCatalog([...baseBooks,outlier])).rank(expandedContext);
 const before=byId(baseline);const after=byId(expanded);
 const normalizedChanged=baseBooks.some(book=>{
  const oldCriteria=Object.fromEntries(before[book.id].criteria.map(item=>[item.id,item.normalized]));
  return after[book.id].criteria.some(item=>item.normalized!==oldCriteria[item.id]);
 });
 assert.ok(normalizedChanged,'adding an outlier must recompute at least one catalog-relative normalization');
 assert.ok(baseBooks.some(book=>before[book.id].score!==after[book.id].score),'adding an outlier must recompute a catalog-relative score');
 assert.ok(baseBooks.some(book=>before[book.id].rank!==after[book.id].rank),'the added high-priority book must affect at least one retained rank');
 assert.deepEqual(
  new ReadingPriorityEngine(fixtureCatalog(baseBooks)).rank(baseContext),
  baseline,
  'removing the outlier must restore the original normalization and ranks'
 );
});

test('an owned unread book outranks an otherwise identical unavailable and unowned clone',()=>{
 const owned=fixtureBook('owned-unread');
 const unavailable=fixtureBook('unavailable-unowned');
 const ranked=byId(new ReadingPriorityEngine(fixtureCatalog([owned,unavailable])).rank({
  states:{'owned-unread':['alindi']},queue:[],reading:{}
 }));
 assert.ok(ranked['owned-unread'].score>ranked['unavailable-unowned'].score);
 assert.ok(ranked['owned-unread'].rank<ranked['unavailable-unowned'].rank);
});

test('a completed but unowned book is deprioritized against an identical unread candidate',()=>{
 const completed=fixtureBook('completed-unowned');
 const unread=fixtureBook('unread-unowned');
 const ranked=byId(new ReadingPriorityEngine(fixtureCatalog([completed,unread])).rank({
  states:{'completed-unowned':['okundu']},queue:[],reading:{}
 }));
 assert.ok(ranked['completed-unowned'].score<ranked['unread-unowned'].score);
 assert.ok(ranked['completed-unowned'].rank>ranked['unread-unowned'].rank);
});

test('current reading and an explicit queue produce a sensible continuation order',()=>{
 const current=fixtureBook('current');
 const queued=fixtureBook('queued');
 const plain=fixtureBook('plain');
 const ranked=byId(new ReadingPriorityEngine(fixtureCatalog([current,queued,plain])).rank({
  states:{current:['alindi','okunuyor'],queued:['alindi'],plain:['alindi']},
  queue:['queued'],
  reading:{current:{startedAt:'2026-09-20',page:40,totalPages:200}}
 }));
 assert.ok(ranked.current.score>ranked.queued.score,'continue a book already in progress before starting a queued book');
 assert.ok(ranked.queued.score>ranked.plain.score,'respect an explicit queue over an otherwise identical owned book');
 assert.ok(ranked.current.rank<ranked.queued.rank&&ranked.queued.rank<ranked.plain.rank);
});

test('every reading score is explained, mature enough to display, and numerically safe',()=>{
 const ids=catalog.books.slice(0,4).map(book=>book.id);
 const ranked=new ReadingPriorityEngine(catalog).rank({
  states:{[ids[0]]:['alindi'],[ids[1]]:['alindi','okunuyor'],[ids[2]]:['okundu']},
  queue:[ids[3]],
  reading:{[ids[1]]:{startedAt:'2026-09-20',page:40,totalPages:200}}
 });
 for(const item of ranked){
  assert.equal(typeof item.bookId,'string');
  assert.ok(Number.isInteger(item.rank)&&item.rank>=1&&item.rank<=catalog.books.length,item.bookId);
  assert.ok(Number.isFinite(item.score)&&item.score>=0&&item.score<=100,item.bookId);
  assert.ok(Number.isFinite(item.confidence)&&item.confidence>=0&&item.confidence<=100,item.bookId);
  assert.ok(Number.isInteger(item.maturity)&&item.maturity>=1&&item.maturity<=5,item.bookId);
  assert.ok(typeof item.maturityLabel==='string'&&item.maturityLabel.trim().length>0,item.bookId);
  assert.ok(typeof item.policyVersion==='string'&&item.policyVersion.trim().length>0,item.bookId);
  assert.ok(Array.isArray(item.criteria)&&item.criteria.length>=2,item.bookId);
  assert.ok(Array.isArray(item.reasons)&&item.reasons.length>=2,item.bookId);
  for(const criterion of item.criteria){
   assert.ok(typeof criterion.id==='string'&&criterion.id,item.bookId);
   assert.ok(typeof criterion.label==='string'&&criterion.label,item.bookId);
   assert.ok(typeof criterion.evidence==='string'&&criterion.evidence.trim().length>0,item.bookId);
   assert.ok(Number.isFinite(criterion.raw)&&criterion.raw>=0&&criterion.raw<=1,`${item.bookId}:${criterion.id}:raw`);
   assert.ok(Number.isFinite(criterion.normalized)&&criterion.normalized>=0&&criterion.normalized<=1,`${item.bookId}:${criterion.id}:normalized`);
   assert.ok(Number.isFinite(criterion.weight)&&criterion.weight>=0&&criterion.weight<=1,`${item.bookId}:${criterion.id}:weight`);
   assert.ok(Number.isFinite(criterion.points)&&criterion.points>=0&&criterion.points<=100,`${item.bookId}:${criterion.id}:points`);
  }
 }
});
