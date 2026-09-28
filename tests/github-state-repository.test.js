import test from 'node:test';
import assert from 'node:assert/strict';
import {GitHubStateBatcher,GitHubStateRepository,GitHubStateRepositoryError,MIN_GITHUB_SYNC_DELAY_MS,emptyStateDocument,mergeStateDocuments} from '../src/state/index.ts';

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

test('public load is anonymous and decodes UTF-8 state',async()=>{
 let request;
 const remote=document({kitap:record(1,{reading:{why:'Türkçe not'}})},timestamp(1));
 const repository=new GitHubStateRepository({fetch:async(url,init)=>{request={url,init};return contents(remote);},storage:storage()});
 assert.deepEqual(await repository.load(),remote);
 assert.match(request.url,/karacaismail\/kitaps-state\/contents\/state\.json/);
 assert.equal(request.init.headers.Authorization,undefined);
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
