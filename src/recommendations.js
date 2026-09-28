// Reading order is editorial guidance. Shared membership is never a prerequisite.
import { displayTitle } from './translation.js';

export function readingGuide(book,catalog) {
 const data=catalog.readingGuides;
 const routes=book.categories.map(id=>data.routes.find(r=>r.category===id)).filter(Boolean);
 const route=routes.find(r=>r.books.includes(book.id))||routes[0];
 const title=displayTitle(book);
 const tailored=data.purposes[book.id];
 const sourceNote=book.notes.find(n=>n.text.length>70&&!/listeye ek değil|şu anda okunuyor/i.test(n.text));
 const purpose=tailored||sourceNote?.text||`“${title}” için önerilen okuma amacı: ${route.goal}`;
 const kind=tailored?'Kitaba özel okuma amacı':sourceNote?'Kaynak notundan okuma amacı':'Konuya göre okuma amacı';
 const index=route.books.indexOf(book.id);
 const previous=index>=0?route.books.slice(Math.max(0,index-1),index):route.books.slice(0,1);
 const following=index>=0?route.books.slice(index+1,index+3):route.books.slice(-1);
 const byId=Object.fromEntries(catalog.books.map(b=>[b.id,b]));
 const goalFor=id=>data.purposes[id]||`“${displayTitle(byId[id])}” ile aynı konuya farklı bir açıdan yaklaşabilirsin.`;
 const defaultLinks=(ids,phase)=>ids.filter(id=>id!==book.id).map(id=>({id,reason:phase==='before'?`Konuya yeniysen önce bu kitapla bir çerçeve kurabilirsin. ${goalFor(id)}`:`Okumanın ardından bu bakış açısıyla karşılaştırma yapabilirsin. ${goalFor(id)}`}));
 const chosen=data.overrides[book.id]||{};
 const before=(chosen.before??defaultLinks(previous,'before')).filter(x=>byId[x.id]&&x.id!==book.id);
 const after=(chosen.after??defaultLinks(following,'after')).filter(x=>byId[x.id]&&x.id!==book.id&&!before.some(p=>p.id===x.id));
 const companions=(chosen.companions??[]).filter(x=>byId[x.id]&&x.id!==book.id&&!before.some(p=>p.id===x.id)&&!after.some(p=>p.id===x.id));
 return {purpose,kind,before,after,companions,route,sources:data.sources[book.id]||[]};
}
export function relatedBooks(book,catalog,scope,states={}) {
 const [type,id]=scope.split('|');
 if(!['category','collection'].includes(type))return [];
 const suggested=catalog.readingGuides.overrides[book.id];
 const preferred=[...(suggested?.after||[]),...(suggested?.before||[]),...(suggested?.companions||[])].map(x=>x.id);
 return catalog.books.filter(b=>b.id!==book.id&&(type==='category'?b.categories.includes(id):b.collectionIds.includes(id)))
 .map(b=>({book:b,score:(preferred.includes(b.id)?20:0)+b.groupIds.filter(id=>book.groupIds.includes(id)&&!id.endsWith(':cross')).length*4+b.categories.filter(id=>book.categories.includes(id)).length*2+Number(!!b.cover)}))
 .sort((a,b)=>b.score-a.score||displayTitle(a.book).localeCompare(displayTitle(b.book),'tr')).map(x=>x.book);
}
export function clampPage(page,total) {return Math.max(1,Math.min(Math.max(1,total),Math.floor(Number(page)||1)));}
