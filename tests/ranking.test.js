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

test('reading priority scores every catalog book once and assigns dense ranks plus stable ordinals',()=>{
 const ranked=new ReadingPriorityEngine(catalog).rank(emptyContext());
 assert.equal(catalog.books.length,794,'catalog fixture changed; update the expected audited total deliberately');
 assert.equal(ranked.length,catalog.books.length);
 assert.equal(new Set(ranked.map(item=>item.bookId)).size,catalog.books.length);
 assert.deepEqual(ranked.map(item=>item.ordinal),Array.from({length:catalog.books.length},(_,index)=>index+1));
 assert.ok(new Set(ranked.map(item=>item.rank)).size<catalog.books.length,'equal priority scores should share a visible rank');
 assert.ok(ranked.every((item,index)=>index===0||item.rank>=ranked[index-1].rank));
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

test('reading statuses, reading records, and personal queue are completely score-neutral',()=>{
 const books=['okundu','okunuyor','araverildi','birakildi','queued','plain'].map(id=>fixtureBook(id));
 const engine=new ReadingPriorityEngine(fixtureCatalog(books));
 const baseline=engine.rank({
  states:Object.fromEntries(books.map(book=>[book.id,['alindi']])),
  queue:[],
  reading:{}
 });
 const personalized=engine.rank({
  states:{
   okundu:['alindi','okundu'],
   okunuyor:['alindi','okunuyor'],
   araverildi:['alindi','araverildi'],
   birakildi:['alindi','birakildi'],
   queued:['alindi'],
   plain:['alindi']
  },
  queue:['queued','okunuyor','okundu'],
  reading:{
   okundu:{startedAt:'2026-09-01',finishedAt:'2026-09-10',page:300,totalPages:300,note:'Bitti'},
   okunuyor:{startedAt:'2026-09-20',page:40,totalPages:200,note:'Devam ediyor'},
   araverildi:{startedAt:'2026-08-20',page:90,totalPages:240},
   birakildi:{startedAt:'2026-07-01',finishedAt:'2026-07-03',page:12,totalPages:400}
  }
 });
 assert.deepEqual(personalized,baseline,'personal reading activity must not alter any score, rank, ordinal, maturity, criterion, signal, reason, or ordering');
});

test('each reading status is independently neutral when ownership is unchanged',()=>{
 const books=[fixtureBook('subject'),fixtureBook('peer')];
 const engine=new ReadingPriorityEngine(fixtureCatalog(books));
 const baseline=engine.rank({states:{subject:['alindi']},queue:[],reading:{}});
 for(const status of ['okundu','okunuyor','araverildi','birakildi']){
  const actual=engine.rank({
   states:{subject:['alindi',status]},
   queue:['subject'],
   reading:{subject:{startedAt:'2026-09-01',finishedAt:'2026-09-28',page:99,totalPages:100,note:status}}
  });
  assert.deepEqual(actual,baseline,`${status} must not change any ranking output`);
 }
});

test('real catalog ranking is invariant under reading states, records, and personal queue',()=>{
 const sample=catalog.books.slice(0,12);
 const ownedIds=new Set(sample.slice(0,6).map(book=>book.id));
 const ownership=Object.fromEntries(sample.map(book=>[book.id,ownedIds.has(book.id)?['alindi']:[]]));
 const engine=new ReadingPriorityEngine(catalog);
 const baseline=engine.rank({states:ownership,queue:[],reading:{}});
 const statuses=['okundu','okunuyor','araverildi','birakildi'];
 const personalizedStates=Object.fromEntries(sample.map((book,index)=>[
  book.id,
  [...ownership[book.id],statuses[index%statuses.length]]
 ]));
 const personalized=engine.rank({
  states:personalizedStates,
  queue:sample.slice().reverse().map(book=>book.id),
  reading:Object.fromEntries(sample.map((book,index)=>[book.id,{
   startedAt:`2026-09-${String(index+1).padStart(2,'0')}`,
   finishedAt:index%2===0?'2026-09-28':null,
   page:index*17,
   totalPages:320,
   note:`Kişisel kayıt ${index+1}`
  }]))
 });
 assert.deepEqual(personalized,baseline,'real-catalog scores and ordering must be device-independent and unaffected by reading activity');
});

test('wishlist state does not change reading priority',()=>{
 const wishlist=fixtureBook('wishlist');
 const neutral=fixtureBook('neutral');
 const ranked=byId(new ReadingPriorityEngine(fixtureCatalog([wishlist,neutral])).rank({
  states:{wishlist:['alinacak']},queue:[],reading:{}
 }));
 assert.equal(ranked.wishlist.score,ranked.neutral.score);
 assert.equal(ranked.wishlist.rank,ranked.neutral.rank);
});

test('collection coverage excludes the evaluated owned book itself',()=>{
 const owned=fixtureBook('owned');
 const candidate=fixtureBook('candidate');
 const ranked=byId(new ReadingPriorityEngine(fixtureCatalog([owned,candidate])).rank({
  states:{owned:['alindi']},queue:[],reading:{}
 }));
 const coverage=item=>item.criteria.find(criterion=>criterion.id==='collectionCoverage');
 assert.equal(coverage(ranked.owned).raw,1);
 assert.equal(coverage(ranked.candidate).raw,0);
});

test('preparation and companion relations affect distinct catalog factors',()=>{
 const prerequisite=fixtureBook('prerequisite');
 const target=fixtureBook('target');
 const companion=fixtureBook('companion');
 const relationCatalog={
  books:[prerequisite,target,companion],
  readingGuides:{routes:[],overrides:{
   prerequisite:{after:[{id:'target'}]},
   target:{before:[{id:'prerequisite'}],companions:[{id:'companion'}]},
   companion:{companions:[{id:'target'}]}
  }}
 };
 const ranked=byId(new ReadingPriorityEngine(relationCatalog).rank(emptyContext()));
 const criterion=(id,name)=>ranked[id].criteria.find(item=>item.id===name);
 assert.ok(criterion('prerequisite','learningLeverage').raw>0,'a prerequisite contributes learning leverage');
 assert.ok(criterion('target','learningLeverage').raw>0,'a companion contributes learning leverage');
 assert.ok(criterion('target','preparationFit').raw<criterion('companion','preparationFit').raw,'only an actual before relation creates preparation load');
 assert.equal(criterion('companion','preparationFit').raw,1,'a companion is not treated as a prerequisite');
});

test('identical books share a dense rank while retaining deterministic ordinals',()=>{
 const books=[fixtureBook('same-c'),fixtureBook('same-a'),fixtureBook('same-b')];
 const ranked=new ReadingPriorityEngine(fixtureCatalog(books)).rank(emptyContext());
 assert.deepEqual(ranked.map(item=>item.bookId),['same-a','same-b','same-c']);
 assert.deepEqual(ranked.map(item=>item.rank),[1,1,1]);
 assert.deepEqual(ranked.map(item=>item.ordinal),[1,2,3]);
});

test('coverage and queue preparation scale linearly with catalog size',()=>{
 const size=2000;
 const books=Array.from({length:size},(_,index)=>fixtureBook(`scale-${index}`,{
  categories:[`category-${index%20}`],
  collectionIds:[`list-${index%7}`]
 }));
 let stateReads=0;
 const rawStates=Object.fromEntries(books.map((book,index)=>[book.id,index%3===0?['alindi']:[]]));
 const states=new Proxy(rawStates,{get(target,key,receiver){stateReads+=1;return Reflect.get(target,key,receiver);}});
 const ranked=new ReadingPriorityEngine(fixtureCatalog(books)).rank({
  states,
  queue:books.map(book=>book.id),
  reading:{}
 });
 assert.equal(ranked.length,size);
 assert.ok(stateReads<=size*3,`expected O(n) state reads, received ${stateReads} for ${size} books`);
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
  assert.ok(Number.isInteger(item.ordinal)&&item.ordinal>=1&&item.ordinal<=catalog.books.length,item.bookId);
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
