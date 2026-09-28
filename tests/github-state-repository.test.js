import test from 'node:test';
import assert from 'node:assert/strict';
import {GitHubStateBatcher,GitHubStateRepository,GitHubStateRepositoryError,MIN_GITHUB_SYNC_DELAY_MS,applyStateDocumentPatches,assertStateDocument,buildInitialMigrationPatches,emptyStateDocument,mergeStateDocuments,projectPublicState} from '../src/state/index.ts';

const timestamp=second=>`2026-09-28T10:00:${String(second).padStart(2,'0')}.000Z`;
const document=(books={},updatedAt=timestamp(0))=>({schemaVersion:1,updatedAt,books});
const record=(second,value)=>({updatedAt:timestamp(second),value});
const storage=()=>{const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key),values};};
const base64=value=>Buffer.from(value,'utf8').toString('base64');
const contents=(value,sha='remote-sha')=>new Response(JSON.stringify({sha,encoding:'base64',content:base64(JSON.stringify(value))}),{status:200,headers:{'content-type':'application/json'}});

test('per-book merge is last-write-wins, preserves tombstones and is deterministic on ties',()=>{
 const left=document({a:record(1,{states:['onemli']}),b:record(5,{states:['okundu']}),c:record(7,null)},timestamp(7));
 const right=document({a:record(2,{states:['alindi']}),b:record(3,{states:['okunuyor']}),c:record(6,{states:['alinacak']})},timestamp(6));
 const merged=mergeStateDocuments(left,right);
 assert.deepEqual(merged.books.a,right.books.a);assert.deepEqual(merged.books.b,left.books.b);assert.equal(merged.books.c.value,null);assert.equal(merged.updatedAt,timestamp(7));
 const tieA=document({a:record(2,{states:['alindi']})},timestamp(2)),tieB=document({a:record(2,{states:['onemli']})},timestamp(2));
 assert.deepEqual(mergeStateDocuments(tieA,tieB),mergeStateDocuments(tieB,tieA));
});

test('public load is anonymous, bypasses caches and preserves public reading data',async()=>{
 let request;
 const remote=document({kitap:record(1,{reading:{why:'Türkçe not'}})},timestamp(1));
 const repository=new GitHubStateRepository({fetch:async(url,init)=>{request={url,init};return contents(remote);},storage:storage()});
 assert.deepEqual(await repository.load(),remote);
 assert.match(request.url,/karacaismail\/kitaps-state\/contents\/state\.json/);
 assert.equal(request.init.headers.Authorization,undefined);
 assert.equal(request.init.headers['Cache-Control'],'no-cache');assert.equal(request.init.cache,'no-store');
});

test('save requires a token, merges remote state and sends sha without exposing token in body',async()=>{
 const localStorage=storage();
 const repositoryWithoutToken=new GitHubStateRepository({storage:localStorage,fetch:async()=>contents(emptyStateDocument())});
 await assert.rejects(()=>repositoryWithoutToken.save(emptyStateDocument()),error=>error instanceof GitHubStateRepositoryError&&error.code==='unauthorized');

 repositoryWithoutToken.setToken('secret-token');
 const requests=[];
 const repository=new GitHubStateRepository({storage:localStorage,fetch:async(url,init)=>{
  requests.push({url,init});
  if(init.method==='PUT')return new Response('{}',{status:200});
  return contents(document({remote:record(1,{states:['onemli']})},timestamp(1)));
 }});
 const saved=await repository.save(document({local:record(2,{states:['alindi']})},timestamp(2)));
 assert.deepEqual(Object.keys(saved.books).sort(),['local','remote']);
 const put=requests.find(item=>item.init.method==='PUT');const body=JSON.parse(put.init.body);
 assert.equal(put.init.headers.Authorization,'Bearer secret-token');assert.equal(body.sha,'remote-sha');assert.ok(!put.init.body.includes('secret-token'));
 const uploaded=JSON.parse(Buffer.from(body.content,'base64').toString('utf8'));assert.deepEqual(uploaded,saved);
 repository.clearToken();assert.equal(localStorage.getItem(GitHubStateRepository.TOKEN_KEY),null);
});

test('pending queue survives locally and clears only after a successful save',async()=>{
 const localStorage=storage();localStorage.setItem(GitHubStateRepository.TOKEN_KEY,'token');
 const repository=new GitHubStateRepository({storage:localStorage,clock:()=>new Date(timestamp(4)),fetch:async(url,init)=>init.method==='PUT'?new Response('{}',{status:200}):contents(emptyStateDocument())});
 repository.queueBookState('book-a',{states:['okunuyor']});assert.equal(repository.getPendingCount(),1);
 const saved=await repository.flushPending();assert.deepEqual(saved.books['book-a'].value,{states:['okunuyor']});assert.equal(repository.getPendingCount(),0);
});

test('401, 404 and repeated 409 responses become typed errors',async()=>{
 for(const [status,code] of [[401,'unauthorized'],[404,'not-found']]){
  const repository=new GitHubStateRepository({storage:storage(),fetch:async()=>new Response('',{status})});
  await assert.rejects(()=>repository.load(),error=>error instanceof GitHubStateRepositoryError&&error.code===code&&error.status===status);
 }
 const localStorage=storage();localStorage.setItem(GitHubStateRepository.TOKEN_KEY,'token');let puts=0;
 const repository=new GitHubStateRepository({storage:localStorage,maxConflictRetries:1,fetch:async(url,init)=>{if(init.method==='PUT'){puts++;return new Response('',{status:409});}return contents(emptyStateDocument(),`sha-${puts}`);}});
 await assert.rejects(()=>repository.save(emptyStateDocument(timestamp(1))),error=>error instanceof GitHubStateRepositoryError&&error.code==='conflict'&&error.status===409);
 assert.equal(puts,2);
});

test('batcher persists immediately, waits at least 120 seconds and combines changes into one flush',async()=>{
 const localStorage=storage();
 const repository=new GitHubStateRepository({storage:localStorage,fetch:async()=>contents(emptyStateDocument())});
 const timers=new Map();let nextTimer=0,flushes=0;
 const batcher=new GitHubStateBatcher(repository,async()=>{flushes++;return emptyStateDocument();},{
  delayMs:100,
  setTimeout:(callback,delay)=>{const id=++nextTimer;timers.set(id,{callback,delay});return id;},
  clearTimeout:id=>timers.delete(id),
 });
 batcher.queueBookState('favorite',{states:['onemli']},timestamp(1));
 assert.equal(repository.getPendingCount(),1,'the unload-safe queue is written synchronously');
 assert.equal([...timers.values()][0].delay,MIN_GITHUB_SYNC_DELAY_MS);
 batcher.queueBookState('library',{states:['alindi']},timestamp(2));
 batcher.queueBookState('reading',{states:['okunuyor'],reading:{page:42}},timestamp(3));
 batcher.queueBookState('queue',{states:[],queuePosition:0},timestamp(4));
 assert.equal(repository.getPendingCount(),4);
 assert.equal(timers.size,1,'debounce resets to a single scheduled flush');
 assert.equal(flushes,0,'nothing is sent before the full debounce window');
 const [{callback}]=timers.values();callback();await Promise.resolve();
 assert.equal(flushes,1,'the batch results in one remote flush/commit request');
});

test('disposing the batcher leaves pending changes in local storage',()=>{
 const localStorage=storage();
 const repository=new GitHubStateRepository({storage:localStorage,fetch:async()=>contents(emptyStateDocument())});
 const timers=new Map();let nextTimer=0;
 const batcher=new GitHubStateBatcher(repository,async()=>emptyStateDocument(),{
  setTimeout:callback=>{const id=++nextTimer;timers.set(id,callback);return id;},
  clearTimeout:id=>timers.delete(id),
 });
 batcher.queueBookState('book-a',{states:['onemli']},timestamp(1));
 const persisted=localStorage.getItem(GitHubStateRepository.PENDING_KEY);
 batcher.dispose();
 assert.equal(timers.size,0);
 assert.equal(localStorage.getItem(GitHubStateRepository.PENDING_KEY),persisted);
 assert.equal(repository.getPendingCount(),1);
});

test('pending mutations coalesce public reading fields per book',()=>{
 const localStorage=storage();
 const repository=new GitHubStateRepository({storage:localStorage,fetch:async()=>contents(emptyStateDocument())});
 repository.queueBookState('book-a',{states:['onemli'],reading:{why:'özel not',page:12}},timestamp(1));
 repository.queueBookState('book-a',{queuePosition:0,reading:{startedAt:'2026-01-01'}},timestamp(2));
 assert.equal(repository.getPendingCount(),1);
 const [pending]=JSON.parse(localStorage.getItem(GitHubStateRepository.PENDING_KEY));
 assert.deepEqual(pending.value,{states:['onemli'],reading:{startedAt:'2026-01-01'},queuePosition:0});
});

test('loading pending sparse patches preserves untouched remote fields',async()=>{
 const localStorage=storage();
 const remote=document({book:record(1,{states:['onemli'],reading:{why:'Uzak not',page:17},queuePosition:null})},timestamp(1));
 const repository=new GitHubStateRepository({storage:localStorage,clock:()=>new Date(timestamp(2)),fetch:async()=>contents(remote)});
 repository.queueBookState('book',{queuePosition:0});
 const loaded=await repository.loadWithPending();
 assert.deepEqual(loaded.books.book.value,{states:['onemli'],reading:{why:'Uzak not',page:17},queuePosition:0});
});

test('a newer mutation queued during a flush remains pending and wins in returned state',async()=>{
 const localStorage=storage();localStorage.setItem(GitHubStateRepository.TOKEN_KEY,'token');
 let releasePut;const putFinished=new Promise(resolve=>{releasePut=resolve});
 const repository=new GitHubStateRepository({storage:localStorage,fetch:async(url,init)=>{
  if(init.method==='PUT'){await putFinished;return new Response('{}',{status:200});}
  return contents(emptyStateDocument());
 }});
 repository.queueBookState('book-a',{states:['onemli']},timestamp(1));
 const flushing=repository.flushPending();await new Promise(resolve=>setImmediate(resolve));
 repository.queueBookState('book-a',{states:['okundu']},timestamp(2));releasePut();
 const result=await flushing;
 assert.deepEqual(result.books['book-a'].value,{states:['okundu']});
 assert.equal(repository.getPendingCount(),1);
});

test('sparse field patches preserve concurrent state and queue edits despite clock skew',()=>{
 const remote=document({a:record(40,{states:['onemli'],queuePosition:null})},timestamp(40));
 const olderDevicePatch=document({a:record(2,{queuePosition:0})},timestamp(2));
 const merged=applyStateDocumentPatches(remote,olderDevicePatch);
 assert.deepEqual(merged.books.a.value,{states:['onemli'],queuePosition:0});
});

test('empty remote queue and tombstones project as explicit clears',()=>{
 const remote=document({a:record(1,null),b:record(2,{states:['alindi'],queuePosition:null})},timestamp(2));
 const view=projectPublicState(remote,['a','b']);
 assert.deepEqual(view.queue,[]);assert.deepEqual(view.records.a,{states:[],reading:null,queuePosition:null});
});

test('public projection carries reading dates, progress and notes across devices',()=>{
 const reading={startedAt:'2026-09-01',finishedAt:'2026-09-20',page:240,totalPages:240,why:'Temeli öğren',apply:'Bir deney yap'};
 const remote=document({a:record(1,{states:['okundu'],reading,queuePosition:null})},timestamp(1));
 const view=projectPublicState(remote,['a']);
 assert.deepEqual(view.records.a,{states:['okundu'],reading,queuePosition:null});
});

test('first sync migrates non-empty local records and preserves an explicit local queue',()=>{
 const local=new Map([
  ['a',{states:['onemli'],reading:{why:'Yerel not'},queuePosition:0}],
  ['b',{states:[],reading:null,queuePosition:null}],
 ]);
 const remote={records:{a:{states:['alindi'],reading:null,queuePosition:null},c:{states:[],reading:null,queuePosition:0}},queue:['c']};
 assert.deepEqual(Object.fromEntries(buildInitialMigrationPatches(local,['a'],remote)),{
  a:{states:['onemli'],reading:{why:'Yerel not'},queuePosition:0},
  c:{queuePosition:null},
 });
});

test('schema validation rejects malformed nested fields and unknown data',()=>{
 for(const invalid of [
  {...document(),extra:true},
  document({a:record(1,{states:['bilinmeyen']})}),
  document({a:record(1,{states:['onemli','onemli']})}),
  document({a:record(1,{queuePosition:-1})}),
  document({a:record(1,{queuePosition:5})}),
  document({a:record(1,{reading:{page:'12'}})}),
  document({a:{...record(1,{}),extra:true}}),
 ])assert.throws(()=>assertStateDocument(invalid),TypeError);
});

test('corrupt pending storage is quarantined and storage quota failures are typed',()=>{
 const localStorage=storage();localStorage.setItem(GitHubStateRepository.PENDING_KEY,'{broken');
 const repository=new GitHubStateRepository({storage:localStorage,fetch:async()=>contents(emptyStateDocument())});
 assert.equal(repository.getPendingCount(),0);assert.equal(localStorage.getItem(GitHubStateRepository.PENDING_KEY),null);
 const full={getItem:()=>null,removeItem:()=>{},setItem:()=>{throw new DOMException('full','QuotaExceededError')}};
 const unavailable=new GitHubStateRepository({storage:full,fetch:async()=>contents(emptyStateDocument())});
 assert.throws(()=>unavailable.queueBookState('a',{states:['onemli']}),error=>error instanceof GitHubStateRepositoryError&&error.code==='storage');
});

test('422 conflicts re-read and retry like 409 conflicts',async()=>{
 const localStorage=storage();localStorage.setItem(GitHubStateRepository.TOKEN_KEY,'token');let puts=0,gets=0;
 const repository=new GitHubStateRepository({storage:localStorage,maxConflictRetries:1,fetch:async(url,init)=>{
  if(init.method==='PUT'){puts++;return new Response('{}',{status:puts===1?422:200});}
  gets++;return contents(emptyStateDocument(),`sha-${gets}`);
 }});
 await repository.save(document({a:record(1,{states:['alindi']})},timestamp(1)));
 assert.equal(puts,2);assert.equal(gets,2);
});

test('batch window starts with the first mutation and bounded retries back off',async()=>{
 const localStorage=storage();
 const repository=new GitHubStateRepository({storage:localStorage,fetch:async()=>contents(emptyStateDocument())});
 const timers=new Map();let timerId=0,attempts=0;
 const batcher=new GitHubStateBatcher(repository,async()=>{attempts++;if(attempts<3)throw new Error('offline');},{
  setTimeout:(callback,delay)=>{const id=++timerId;timers.set(id,{callback,delay});return id;},clearTimeout:id=>timers.delete(id),retryDelaysMs:[10,20],
 });
 batcher.queueBookState('a',{states:['onemli']},timestamp(1));const firstId=[...timers.keys()][0];
 batcher.queueBookState('b',{states:['alindi']},timestamp(2));
 assert.equal([...timers.keys()][0],firstId);assert.equal(timers.get(firstId).delay,MIN_GITHUB_SYNC_DELAY_MS);
 const runNext=async()=>{const [id,timer]=timers.entries().next().value;timers.delete(id);timer.callback();await new Promise(resolve=>setImmediate(resolve));};
 await runNext();assert.equal([...timers.values()][0].delay,10);
 await runNext();assert.equal([...timers.values()][0].delay,20);
 await runNext();assert.equal(attempts,3);assert.equal(timers.size,0);
});

test('token validation happens remotely before callers persist it',async()=>{
 const localStorage=storage();let authorization;
 const repository=new GitHubStateRepository({storage:localStorage,fetch:async(url,init)=>{authorization=init.headers.Authorization;return contents(emptyStateDocument())}});
 await repository.validateToken('candidate');assert.equal(authorization,'Bearer candidate');assert.equal(repository.hasToken(),false);
 repository.setToken('candidate');assert.equal(repository.hasToken(),true);
});

test('initial local-state migration marker persists only when explicitly completed',()=>{
 const localStorage=storage();
 const repository=new GitHubStateRepository({storage:localStorage,fetch:async()=>contents(emptyStateDocument())});
 assert.equal(repository.hasCompletedInitialMigration(),false);
 repository.markInitialMigrationComplete();
 assert.equal(repository.hasCompletedInitialMigration(),true);
 assert.equal(localStorage.getItem(GitHubStateRepository.MIGRATION_KEY),'1');
});

test('generated mutation times remain monotonic when the device clock moves backward',()=>{
 const localStorage=storage();let now=5;
 const repository=new GitHubStateRepository({storage:localStorage,clock:()=>new Date(timestamp(now--)),fetch:async()=>contents(emptyStateDocument())});
 const first=repository.queueBookState('a',{states:['onemli']});
 const second=repository.queueBookState('b',{states:['alindi']});
 assert.ok(Date.parse(second.updatedAt)>Date.parse(first.updatedAt));
});
