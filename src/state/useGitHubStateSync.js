import {useCallback,useEffect,useRef,useState} from 'react';
import {GitHubStateRepository} from './GitHubStateRepository.ts';
import {GitHubStateBatcher} from './GitHubStateBatcher.ts';

const recordPayload=(id,states,personal)=>({states:states[id]||[],reading:personal.reading[id],queuePosition:personal.queue.indexOf(id)>=0?personal.queue.indexOf(id):null});
const signature=value=>JSON.stringify(value);
const isEmptyPayload=value=>value.states.length===0&&!value.reading&&value.queuePosition===null;

export function useGitHubStateSync({bookIds,states,setStates,personal,setPersonal}){
 const repository=useRef(new GitHubStateRepository()).current;
 const known=useRef(new Map());
 const hydrated=useRef(false);
 const flushLatest=useRef(async()=>{});
 const batcher=useRef();
 const [sync,setSync]=useState({status:'loading',message:'GitHub durumu okunuyor.',pending:repository.getPendingCount(),hasToken:Boolean(localStorage.getItem(GitHubStateRepository.TOKEN_KEY))});
 const applyDocument=useCallback(document=>{
  const ids=new Set(bookIds),nextStates={},reading={},queue=[];
  for(const [id,record] of Object.entries(document.books)){if(!ids.has(id)||!record.value)continue;const value=record.value;nextStates[id]=value.states||[];if(value.reading)reading[id]=value.reading;if(Number.isInteger(value.queuePosition))queue.push([value.queuePosition,id]);known.current.set(id,signature(value));}
  setStates(previous=>({...previous,...nextStates}));
  setPersonal(previous=>({...previous,reading:{...previous.reading,...reading},queue:queue.length?queue.sort((a,b)=>a[0]-b[0]).map(item=>item[1]):previous.queue}));
 },[bookIds,setPersonal,setStates]);
 const load=useCallback(async()=>{setSync(value=>({...value,status:'loading',message:'GitHub durumu okunuyor.'}));try{const document=await repository.loadWithPending();applyDocument(document);hydrated.current=true;setSync(value=>({...value,status:'ready',message:'GitHub durumu güncel.',pending:repository.getPendingCount()}));}catch(error){hydrated.current=true;setSync(value=>({...value,status:'error',message:error.code==='not-found'?'Durum deposu henüz hazırlanmadı.':'GitHub durumu okunamadı.',pending:repository.getPendingCount()}));}},[applyDocument,repository]);
 const flush=useCallback(async()=>{batcher.current?.cancel();setSync(value=>({...value,status:'saving',message:'Değişiklikler GitHub’a yazılıyor.'}));try{const document=await repository.flushPending();applyDocument(document);setSync(value=>({...value,status:'ready',message:'GitHub ile eşitlendi.',pending:repository.getPendingCount()}));return document;}catch(error){setSync(value=>({...value,status:'error',message:error.code==='unauthorized'?'Yazmak için geçerli bir GitHub anahtarı gerekiyor.':'Eşitleme tamamlanamadı; değişiklikler cihazda kuyrukta.',pending:repository.getPendingCount()}));return undefined;}},[applyDocument,repository]);
 flushLatest.current=flush;
 if(!batcher.current)batcher.current=new GitHubStateBatcher(repository,()=>flushLatest.current());
 const saveToken=useCallback(async token=>{repository.setToken(token);setSync(value=>({...value,hasToken:true,message:'Anahtar kaydedildi; değişiklikler toplu olarak eşitlenecek.'}));},[repository]);
 const clearToken=useCallback(()=>{repository.clearToken();setSync(value=>({...value,hasToken:false,message:'Yazma anahtarı bu cihazdan kaldırıldı.'}));},[repository]);
 useEffect(()=>{load()},[load]);
 useEffect(()=>{if(!hydrated.current)return;for(const id of bookIds){const payload=recordPayload(id,states,personal),current=signature(payload);if(known.current.get(id)===current)continue;if(!known.current.has(id)&&isEmptyPayload(payload)){known.current.set(id,current);continue}known.current.set(id,current);batcher.current.queueBookState(id,payload,undefined,sync.hasToken);}const pending=repository.getPendingCount();setSync(value=>pending?{...value,status:'queued',message:sync.hasToken?'Değişiklikler cihazda güvende; toplu gönderim için iki dakika bekleniyor.':'Değişiklikler cihazda kuyrukta; GitHub’a göndermek için bu cihazı bağla.',pending}:{...value,pending});if(sync.hasToken&&pending)batcher.current.schedule();else batcher.current.cancel();return()=>batcher.current.cancel()},[bookIds,states,personal,repository,sync.hasToken]);
 useEffect(()=>()=>batcher.current?.dispose(),[]);
 return {...sync,load,flush,saveToken,clearToken};
}
