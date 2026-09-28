import {useCallback,useEffect,useRef,useState} from 'react';
import {GitHubStateRepository} from './GitHubStateRepository.ts';
import {GitHubStateBatcher} from './GitHubStateBatcher.ts';
import {buildInitialMigrationPatches,projectPublicState} from './syncModel.ts';

const readingPayload=(personal,id)=>{
 const source=personal.reading[id];if(!source||typeof source!=='object')return null;
 const reading={};
 for(const key of ['startedAt','finishedAt','why','apply'])if(typeof source[key]==='string'&&source[key]!=='' )reading[key]=source[key];
 for(const key of ['page','totalPages'])if(Number.isInteger(source[key])&&source[key]>=0)reading[key]=source[key];
 return Object.keys(reading).length?reading:null;
};
const publicPayload=(id,states,personal)=>({states:states[id]||[],reading:readingPayload(personal,id),queuePosition:personal.queue.indexOf(id)>=0?personal.queue.indexOf(id):null});
const signature=value=>JSON.stringify(value);
const emptyPayload={states:[],reading:null,queuePosition:null};
const modelSnapshot=(bookIds,states,personal)=>new Map(bookIds.map(id=>[id,publicPayload(id,states,personal)]));
const queueSignature=personal=>JSON.stringify(personal.queue);

export function useGitHubStateSync({bookIds,states,setStates,personal,setPersonal}){
 const repository=useRef(new GitHubStateRepository()).current;
 const latest=useRef({states,personal});latest.current={states,personal};
 const known=useRef(new Map());
 const hydrated=useRef(false);
 const flushLatest=useRef(async()=>{});
 const batcher=useRef();
 const pendingCount=()=>{try{return repository.getPendingCount()}catch{return 0}};
 const tokenPresent=()=>{try{return repository.hasToken()}catch{return false}};
 const [sync,setSync]=useState(()=>({status:'loading',message:'GitHub durumu okunuyor.',pending:pendingCount(),hasToken:tokenPresent()}));

 const applyDocument=useCallback((document,baseline,baselineQueue)=>{
  const projected=projectPublicState(document,bookIds),records=new Map(Object.entries(projected.records));
  for(const [id,normalized] of records)known.current.set(id,normalized);
  setStates(previous=>{
   const next={...previous};
   for(const [id,value] of records){
    const changedDuringRequest=baseline&&signature(baseline.get(id)?.states||[])!==signature(previous[id]||[]);
    if(changedDuringRequest)continue;
    if(value.states.length)next[id]=value.states;else delete next[id];
   }
   return next;
  });
  setPersonal(previous=>{
   const nextReading={...previous.reading};
   for(const [id,value] of records){
    const changedDuringRequest=baseline&&signature(baseline.get(id)?.reading??null)!==signature(readingPayload(previous,id));
    if(changedDuringRequest)continue;
    if(value.reading)nextReading[id]=value.reading;else delete nextReading[id];
   }
   const queue=baselineQueue!==undefined&&baselineQueue!==queueSignature(previous)?previous.queue:projected.queue;
   return {...previous,reading:nextReading,queue};
  });
 },[bookIds,setPersonal,setStates]);

 const load=useCallback(async()=>{
  const baseline=modelSnapshot(bookIds,latest.current.states,latest.current.personal),baselineQueue=queueSignature(latest.current.personal);
  setSync(value=>({...value,status:'loading',message:'GitHub durumu okunuyor.'}));
  try{
   let document=await repository.loadWithPending();
   if(!repository.hasCompletedInitialMigration()){
    const remote=projectPublicState(document,bookIds);
    for(const [id,patch] of buildInitialMigrationPatches(baseline,latest.current.personal.queue,remote))repository.queueBookState(id,patch);
    repository.markInitialMigrationComplete();
    document=await repository.loadWithPending();
   }
   applyDocument(document,baseline,baselineQueue);hydrated.current=true;
   const pending=repository.getPendingCount();
   if(repository.hasToken()&&pending)batcher.current?.schedule();
   setSync(value=>({...value,status:pending?'queued':'ready',message:pending?(value.hasToken?'Eski tarayıcı kayıtları korundu; toplu gönderim için iki dakika bekleniyor.':'Eski tarayıcı kayıtları korundu; GitHub’a göndermek için bu cihazı bağla.'):(value.hasToken?'GitHub durumu güncel.':'GitHub durumu salt okunur olarak güncel.'),pending}));
  }catch(error){
   for(const [id,value] of baseline)known.current.set(id,value);
   hydrated.current=true;
   setSync(value=>({...value,status:'error',message:error.code==='not-found'?'Durum deposu henüz hazırlanmadı.':error.code==='invalid-data'?'GitHub durum dosyası güvenli biçimde okunamadı.':'GitHub durumu okunamadı.',pending:pendingCount()}));
  }
 },[applyDocument,bookIds,repository]);

 const flush=useCallback(async({fromBatcher=false}={})=>{
  batcher.current?.cancel();
  const baseline=modelSnapshot(bookIds,latest.current.states,latest.current.personal),baselineQueue=queueSignature(latest.current.personal);
  setSync(value=>({...value,status:'saving',message:'Değişiklikler GitHub’a yazılıyor.'}));
  try{
   const document=await repository.flushPending();applyDocument(document,baseline,baselineQueue);
   setSync(value=>({...value,status:'ready',message:'GitHub ile eşitlendi.',pending:repository.getPendingCount()}));return document;
  }catch(error){
   if(!fromBatcher&&repository.hasToken()&&pendingCount())batcher.current?.schedule();
   setSync(value=>({...value,status:'error',message:error.code==='unauthorized'?'Yazmak için geçerli bir GitHub anahtarı gerekiyor.':error.code==='storage'?'Tarayıcının yerel eşitleme alanına yazılamadı.':'Eşitleme tamamlanamadı; değişiklikler cihazda kuyrukta ve otomatik olarak yeniden denenecek.',pending:pendingCount()}));
   throw error;
  }
 },[applyDocument,bookIds,repository]);
 flushLatest.current=flush;
 if(!batcher.current)batcher.current=new GitHubStateBatcher(repository,()=>flushLatest.current({fromBatcher:true}));

 const saveToken=useCallback(async token=>{
  setSync(value=>({...value,status:'loading',message:'GitHub anahtarı doğrulanıyor.'}));
  try{
   await repository.validateToken(token);repository.setToken(token);const pending=repository.getPendingCount();
   setSync(value=>({...value,status:pending?'queued':'ready',hasToken:true,pending,message:pending?'Anahtar doğrulandı; bekleyen değişiklikler en az iki dakikalık toplu gönderime alındı.':'Anahtar GitHub tarafından doğrulandı.'}));
   if(pending)batcher.current?.schedule();
  }catch(error){setSync(value=>({...value,status:'error',hasToken:false,message:error.code==='storage'?'Anahtar bu tarayıcıya kaydedilemedi.':'GitHub anahtarı doğrulanamadı; anahtar kaydedilmedi.'}));throw error;}
 },[repository]);
 const clearToken=useCallback(()=>{try{repository.clearToken();batcher.current?.cancel();setSync(value=>({...value,status:'ready',hasToken:false,message:'Yazma anahtarı bu cihazdan kaldırıldı; GitHub durumu salt okunur.'}));}catch{setSync(value=>({...value,status:'error',message:'Anahtar tarayıcıdan kaldırılamadı.'}));}},[repository]);

 useEffect(()=>{void load()},[load]);
 useEffect(()=>{
  if(!hydrated.current)return;
  try{
   for(const id of bookIds){
    const payload=publicPayload(id,states,personal),current=signature(payload),previous=known.current.get(id);
    if(previous&&signature(previous)===current)continue;
    if(!previous&&current===signature(emptyPayload)){known.current.set(id,payload);continue;}
    const patch={};
    if(!previous||signature(previous.states||[])!==signature(payload.states))patch.states=payload.states;
    if(!previous||signature(previous.reading??null)!==signature(payload.reading))patch.reading=payload.reading;
    if(!previous||previous.queuePosition!==payload.queuePosition)patch.queuePosition=payload.queuePosition;
    batcher.current.queueBookState(id,patch,undefined,sync.hasToken);known.current.set(id,payload);
   }
   const pending=repository.getPendingCount();
   setSync(value=>pending?{...value,status:'queued',message:sync.hasToken?'Değişiklikler cihazda güvende; toplu gönderim için iki dakika bekleniyor.':'Değişiklikler cihazda kuyrukta; GitHub’a göndermek için bu cihazı bağla.',pending}:{...value,pending});
   if(sync.hasToken&&pending)batcher.current.schedule();else batcher.current.cancel();
  }catch{setSync(value=>({...value,status:'error',message:'Tarayıcının yerel eşitleme alanına yazılamadı.',pending:pendingCount()}));}
 },[bookIds,states,personal.queue,personal.reading,repository,sync.hasToken]);
 useEffect(()=>()=>batcher.current?.dispose(),[]);
 return {...sync,load,flush,saveToken,clearToken};
}
