// Reading order is editorial guidance. Shared membership is never a prerequisite.
// Links come from the same graph the reading-priority engine scores, so the
// suggestions on a book page always match its preparation criterion.
import { displayTitle } from './translation.js';
import { readingGraphFor } from './ranking/readingGraph.ts';

const byIdCache=new WeakMap();
const booksById=catalog=>{
 let map=byIdCache.get(catalog);
 if(!map){map=Object.fromEntries(catalog.books.map(b=>[b.id,b]));byIdCache.set(catalog,map)}
 return map;
};

export function readingGuide(book,catalog) {
 const data=catalog.readingGuides;
 const routes=book.categories.map(id=>data.routes.find(r=>r.category===id)).filter(Boolean);
 const route=routes.find(r=>r.books.includes(book.id))||routes[0];
 const title=displayTitle(book);
 const tailored=data.purposes[book.id];
 const sourceNote=book.notes.find(n=>n.text.length>70&&!/listeye ek değil|şu anda okunuyor/i.test(n.text));
 const purpose=tailored||sourceNote?.text||`“${title}” için önerilen okuma amacı: ${route.goal}`;
 const kind=tailored?'Kitaba özel okuma amacı':sourceNote?'Kaynak notundan okuma amacı':'Konuya göre okuma amacı';
 const byId=booksById(catalog);
 const goalFor=id=>data.purposes[id]||`“${displayTitle(byId[id])}” ile aynı konuya farklı bir açıdan yaklaşabilirsin.`;
 const fallback=(link,phase)=>{
  if(link.source==='route')return `“${link.route?.heading||'Konu'}” rotasında bu kitaptan ${phase==='before'?'hemen önce':'hemen sonra'} gelir. ${goalFor(link.id)}`;
  if(phase==='before')return `Bu kitaba hazırlık olarak önerilen eser. ${goalFor(link.id)}`;
  if(phase==='after')return `Bu kitabın ardından okunması önerilen eser. ${goalFor(link.id)}`;
  return `Bu kitapla birlikte veya karşılaştırmalı okunabilir. ${goalFor(link.id)}`;
 };
 const explain=phase=>link=>({id:link.id,source:link.source,reason:link.reason||fallback(link,phase)});
 const relations=readingGraphFor(catalog).relations(book.id);
 return {purpose,kind,before:relations.before.map(explain('before')),after:relations.after.map(explain('after')),companions:relations.companions.map(explain('companion')),route,sources:data.sources[book.id]||[]};
}
export function relatedBooks(book,catalog,scope,states={}) {
 const [type,id]=scope.split('|');
 if(!['category','collection'].includes(type))return [];
 const suggested=readingGraphFor(catalog).relations(book.id);
 const preferred=[...suggested.after,...suggested.before,...suggested.companions].map(x=>x.id);
 return catalog.books.filter(b=>b.id!==book.id&&(type==='category'?b.categories.includes(id):b.collectionIds.includes(id)))
 .map(b=>({book:b,score:(preferred.includes(b.id)?20:0)+b.groupIds.filter(id=>book.groupIds.includes(id)&&!id.endsWith(':cross')).length*4+b.categories.filter(id=>book.categories.includes(id)).length*2+Number(!!b.cover)}))
 .sort((a,b)=>b.score-a.score||displayTitle(a.book).localeCompare(displayTitle(b.book),'tr')).map(x=>x.book);
}
export function clampPage(page,total) {return Math.max(1,Math.min(Math.max(1,total),Math.floor(Number(page)||1)));}
