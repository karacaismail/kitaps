import {useCallback,useEffect,useRef,useState} from 'react';
import {GitHubStateRepository} from './GitHubStateRepository.ts';
import {GitHubStateBatcher} from './GitHubStateBatcher.ts';
import {planFirstSync,projectPublicState} from './syncModel.ts';
import {GITHUB_STATE_BACKUP_KEY} from './types.ts';

const readingPayload=(personal,id)=>{
 const source=personal.reading[id];if(!source||typeof source!=='object')return null;
 const reading={};
 for(const key of ['startedAt','finishedAt','why','apply'])if(typeof source[key]==='string'&&source[key]!=='' )reading[key]=source[key];
 for(const key of ['page','totalPages'])if(Number.isInteger(source[key])&&source[key]>=0)reading[key]=source[key];
 return Object.keys(reading).length?reading:null;
};
const publicPayload=(id,states,personal)=>({states:states[id]||[],reading:readingPayload(personal,id)});
const signature=value=>JSON.stringify(value);
const emptySignature=signature({states:[],reading:null});
const modelSnapshot=(bookIds,states,personal)=>new Map(bookIds.map(id=>[id,publicPayload(id,states,personal)]));
const queueSignature=personal=>JSON.stringify(personal.queue);
const noSkip=()=>({books:new Set(),queue:false});
const SHARED_REFRESH_MS=120_000;

const clock=ms=>new Date(ms).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
const readMessage=error=>error?.code==='rate-limited'?`GitHub istek sınırına ulaşıldı; ${clock(error.retryAt)} sonrasında yeniden denenecek.`:error?.code==='not-found'?'Durum deposu henüz hazırlanmadı.':error?.code==='invalid-data'?'GitHub durum dosyası güvenli biçimde okunamadı.':'GitHub durumu okunamadı.';
const writeMessage=error=>error?.code==='unauthorized'?'Yazmak için bu depoya Contents yazma izni olan geçerli bir anahtar gerekiyor.':error?.code==='storage'?'Tarayıcının yerel eşitleme alanına yazılamadı.':error?.code==='rate-limited'?`GitHub istek sınırına ulaşıldı; değişiklikler kuyrukta, ${clock(error.retryAt)} sonrasında gönderilecek.`:'Eşitleme tamamlanamadı; değişiklikler cihazda kuyrukta ve otomatik olarak yeniden denenecek.';

/** The copy of this device's records taken before a first sync decision. */
export function readSyncBackup(){
 try{return JSON.parse(localStorage.getItem(GITHUB_STATE_BACKUP_KEY)||'null')}catch{return null}
}

export function useGitHubStateSync({bookIds,states,setStates,personal,setPersonal}){
 const repositoryRef=useRef(null);
 if(!repositoryRef.current)repositoryRef.current=new GitHubStateRepository();
 const repository=repositoryRef.current;
 const latest=useRef({states,personal});latest.current={states,personal};
 const known=useRef(new Map());
 const knownQueue=useRef(null);
 const hydrated=useRef(false);
 const loading=useRef(false);
 const lastRefresh=useRef(0);
 const backoffUntil=useRef(0);
 const blocked=useRef(noSkip());
 const firstSyncRemote=useRef(null);
 const flushLatest=useRef(async(_options={})=>undefined);
 const batcher=useRef(null);
 const pendingCount=()=>{try{return repository.getPendingCount()}catch{return 0}};
 const tokenPresent=()=>{try{return repository.hasToken()}catch{return false}};
 const [sync,setSync]=useState(()=>({status:'loading',message:'GitHub durumu okunuyor.',pending:pendingCount(),hasToken:tokenPresent()}));
 const [mergePrompt,setMergePrompt]=useState(null);

 const applyDocument=useCallback((document,baseline,baselineQueue,skip=noSkip())=>{
  const projected=projectPublicState(document,bookIds),records=new Map(Object.entries(projected.records));
  for(const [id,normalized] of records)if(!skip.books.has(id))known.current.set(id,normalized);
  if(!skip.queue)knownQueue.current=signature(projected.queue);
  setStates(previous=>{
   const next={...previous};
   for(const [id,value] of records){
    if(skip.books.has(id))continue;
    const changedDuringRequest=baseline&&signature(baseline.get(id)?.states||[])!==signature(previous[id]||[]);
    if(changedDuringRequest)continue;
    if(value.states.length)next[id]=value.states;else delete next[id];
   }
   return next;
  });
  setPersonal(previous=>{
   const nextReading={...previous.reading};
   for(const [id,value] of records){
    if(skip.books.has(id))continue;
    const changedDuringRequest=baseline&&signature(baseline.get(id)?.reading??null)!==signature(readingPayload(previous,id));
    if(changedDuringRequest)continue;
    if(value.reading)nextReading[id]=value.reading;else delete nextReading[id];
   }
   const keepLocalQueue=skip.queue||(baselineQueue!==undefined&&baselineQueue!==queueSignature(previous));
   return {...previous,reading:nextReading,queue:keepLocalQueue?previous.queue:projected.queue};
  });
 },[bookIds,setPersonal,setStates]);

 const refresh=useCallback(async(silent=false)=>{
  if(loading.current||Date.now()<backoffUntil.current)return;
  loading.current=true;
  const baseline=modelSnapshot(bookIds,latest.current.states,latest.current.personal),baselineQueue=queueSignature(latest.current.personal);
  if(!silent)setSync(value=>({...value,status:'loading',message:'GitHub durumu okunuyor.'}));
  try{
   const remoteDocument=await repository.load();
   lastRefresh.current=Date.now();
   let skip=blocked.current;
   if(!repository.hasCompletedInitialMigration()&&!firstSyncRemote.current){
    // A device that has never synced adds what only it knows. Where both sides
    // disagree, nothing is overwritten until the reader decides.
    const plan=planFirstSync(baseline,latest.current.personal.queue,projectPublicState(remoteDocument,bookIds));
    for(const id of plan.localOnly){const view=baseline.get(id);repository.queueBookState(id,{states:view.states,reading:view.reading});}
    if(plan.queue==='local-only')repository.queueQueueState(latest.current.personal.queue);
    if(plan.conflicts.length||plan.queue==='conflict'){
     try{localStorage.setItem(GITHUB_STATE_BACKUP_KEY,JSON.stringify({version:1,createdAt:new Date().toISOString(),states:latest.current.states,...latest.current.personal}))}catch{/* The dialog still offers both choices. */}
     skip={books:new Set(plan.conflicts),queue:plan.queue==='conflict'};
     blocked.current=skip;firstSyncRemote.current=remoteDocument;
     setMergePrompt({conflicts:plan.conflicts,queueConflict:plan.queue==='conflict'});
    }else repository.markInitialMigrationComplete();
   }
   const document=await repository.loadWithPending(remoteDocument);
   applyDocument(document,baseline,baselineQueue,skip);hydrated.current=true;
   const pending=repository.getPendingCount();
   if(repository.hasToken()&&pending)batcher.current?.schedule();
   setSync(value=>({...value,status:pending?'queued':'ready',message:pending?(value.hasToken?'Değişiklikler cihazda; ilk değişiklikten iki dakika sonra toplu gönderilecek.':'Değişiklikler cihazda kuyrukta; GitHub’a göndermek için bu cihazı bağla.'):(value.hasToken?'GitHub durumu güncel.':'GitHub durumu salt okunur olarak güncel.'),pending}));
  }catch(error){
   if(error.code==='rate-limited')backoffUntil.current=error.retryAt;
   if(!hydrated.current)for(const [id,value] of baseline)known.current.set(id,value);
   if(knownQueue.current===null)knownQueue.current=baselineQueue;
   hydrated.current=true;
   setSync(value=>({...value,status:'error',message:readMessage(error),pending:pendingCount()}));
  }finally{loading.current=false;}
 },[applyDocument,bookIds,repository]);
 const load=useCallback(()=>refresh(false),[refresh]);

 const resolveMerge=useCallback(async choice=>{
  const remote=firstSyncRemote.current;if(!remote)return;
  const decision=blocked.current;
  if(choice==='device'){
   const snapshot=modelSnapshot(bookIds,latest.current.states,latest.current.personal);
   for(const id of decision.books){const view=snapshot.get(id);repository.queueBookState(id,{states:view.states,reading:view.reading});known.current.set(id,view);}
   if(decision.queue){repository.queueQueueState(latest.current.personal.queue);knownQueue.current=queueSignature(latest.current.personal);}
  }
  blocked.current=noSkip();firstSyncRemote.current=null;repository.markInitialMigrationComplete();setMergePrompt(null);
  if(choice!=='device'){repository.discardPendingFor(decision.books,decision.queue);applyDocument(await repository.loadWithPending(remote));}
  const pending=repository.getPendingCount();
  if(repository.hasToken()&&pending)batcher.current?.schedule();
  setSync(value=>({...value,status:pending?'queued':'ready',pending,message:pending?'Seçimin kaydedildi; değişiklikler iki dakikalık pencereyle gönderilecek.':'Seçimin kaydedildi.'}));
 },[applyDocument,bookIds,repository]);

 const flush=useCallback(async({fromBatcher=false}={})=>{
  batcher.current?.cancel();
  const baseline=modelSnapshot(bookIds,latest.current.states,latest.current.personal),baselineQueue=queueSignature(latest.current.personal);
  setSync(value=>({...value,status:'saving',message:'Değişiklikler GitHub’a yazılıyor.'}));
  try{
   const document=await repository.flushPending();applyDocument(document,baseline,baselineQueue,blocked.current);
   lastRefresh.current=Date.now();
   setSync(value=>({...value,status:'ready',message:'GitHub ile eşitlendi.',pending:repository.getPendingCount()}));return document;
  }catch(error){
   if(error.code==='rate-limited')backoffUntil.current=error.retryAt;
   if(!fromBatcher&&repository.hasToken()&&pendingCount())batcher.current?.schedule();
   setSync(value=>({...value,status:'error',message:writeMessage(error),pending:pendingCount()}));
   throw error;
  }
 },[applyDocument,bookIds,repository]);
 flushLatest.current=flush;
 if(!batcher.current)batcher.current=new GitHubStateBatcher(repository,()=>flushLatest.current({fromBatcher:true}));

 const saveToken=useCallback(async token=>{
  setSync(value=>({...value,status:'loading',message:'GitHub anahtarı doğrulanıyor.'}));
  try{
   await repository.validateToken(token);repository.setToken(token);const pending=repository.getPendingCount();
   setSync(value=>({...value,status:pending?'queued':'ready',hasToken:true,pending,message:pending?'Anahtar doğrulandı; bekleyen değişiklikler ilk değişiklikten iki dakika sonra gönderilecek.':'Anahtar GitHub tarafından doğrulandı.'}));
   if(pending)batcher.current?.schedule();
   void refresh(true);
  }catch(error){setSync(value=>({...value,status:'error',hasToken:tokenPresent(),message:error.code==='token-type'?'Yalnız ince ayarlı (fine-grained) ve yalnız karacaismail/kitaps-state deposuna yetkili bir anahtar kabul edilir; anahtar kaydedilmedi.':error.code==='storage'?'Anahtar bu tarayıcıya kaydedilemedi.':error.code==='rate-limited'?readMessage(error):'GitHub anahtarı doğrulanamadı; anahtar kaydedilmedi.'}));throw error;}
 },[refresh,repository]);
 const clearToken=useCallback(()=>{try{repository.clearToken();batcher.current?.cancel();setSync(value=>({...value,status:'ready',hasToken:false,message:'Yazma anahtarı bu cihazdan kaldırıldı; GitHub durumu salt okunur.'}));}catch{setSync(value=>({...value,status:'error',message:'Anahtar tarayıcıdan kaldırılamadı.'}));}},[repository]);

 useEffect(()=>{void load()},[load]);
 useEffect(()=>{
  const refreshIfDue=()=>{if(document.visibilityState==='visible'&&Date.now()-lastRefresh.current>=SHARED_REFRESH_MS)void refresh(true)};
  const interval=window.setInterval(refreshIfDue,SHARED_REFRESH_MS);
  document.addEventListener('visibilitychange',refreshIfDue);
  return()=>{window.clearInterval(interval);document.removeEventListener('visibilitychange',refreshIfDue)};
 },[refresh]);
 useEffect(()=>{
  if(!hydrated.current)return;
  try{
   const skip=blocked.current;
   for(const id of bookIds){
    if(skip.books.has(id))continue;
    const payload=publicPayload(id,states,personal),current=signature(payload),previous=known.current.get(id);
    if(previous&&signature(previous)===current)continue;
    if(!previous&&current===emptySignature){known.current.set(id,payload);continue;}
    const patch={};
    if(!previous||signature(previous.states||[])!==signature(payload.states))patch.states=payload.states;
    if(!previous||signature(previous.reading??null)!==signature(payload.reading))patch.reading=payload.reading;
    batcher.current.queueBookState(id,patch,undefined,false);known.current.set(id,payload);
   }
   const queue=queueSignature(personal);
   if(!skip.queue&&queue!==knownQueue.current){batcher.current.queueQueueState(personal.queue,undefined,false);knownQueue.current=queue;}
   const pending=repository.getPendingCount();
   // Returning the same object when nothing changed keeps this effect from
   // re-rendering the app on every pass.
   setSync(value=>{
    if(!pending)return value.pending===0?value:{...value,pending};
    const message=value.hasToken?'Değişiklikler cihazda; ilk değişiklikten iki dakika sonra toplu gönderilecek.':'Değişiklikler cihazda kuyrukta; GitHub’a göndermek için bu cihazı bağla.';
    return value.status==='queued'&&value.pending===pending&&value.message===message?value:{...value,status:'queued',message,pending};
   });
   if(sync.hasToken&&pending)batcher.current.schedule();else batcher.current.cancel();
  }catch{setSync(value=>({...value,status:'error',message:'Tarayıcının yerel eşitleme alanına yazılamadı.',pending:pendingCount()}));}
 },[bookIds,states,personal,repository,sync.hasToken]);
 useEffect(()=>()=>batcher.current?.dispose(),[]);
 return {...sync,hydrated:hydrated.current,mergePrompt,resolveMerge,load,flush,saveToken,clearToken};
}
