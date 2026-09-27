export const PERSONAL_KEY = 'kitapatlasi:personal:v1';
export const emptyReading = () => ({ startedAt:'', finishedAt:'', page:'', totalPages:'', why:'', apply:'' });
const validDate = value => typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value ? value : '';
const pageNumber = value => (typeof value==='number'||typeof value==='string')&&String(value).trim()!==''&&Number.isFinite(Number(value))&&Number(value)>=0 ? Math.min(999999,Math.floor(Number(value))) : '';
export function cleanReading(value) {
 const v=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 return {startedAt:validDate(v.startedAt),finishedAt:validDate(v.finishedAt),page:pageNumber(v.page),totalPages:pageNumber(v.totalPages),why:typeof v.why==='string'?v.why:'',apply:typeof v.apply==='string'?v.apply:''};
}
export function cleanPersonal(input, bookIds) {
 const ids=new Set(bookIds);const value=input&&typeof input==='object'?input:{};
 return {
  queue:Array.isArray(value.queue)?[...new Set(value.queue.filter(id=>ids.has(id)))].slice(0,5):[],
  reading:Object.fromEntries(Object.entries(value.reading&&typeof value.reading==='object'&&!Array.isArray(value.reading)?value.reading:{}).filter(([id])=>ids.has(id)).map(([id,r])=>[id,cleanReading(r)]))
 };
}
export function addToQueue(queue,id) {return queue.includes(id)||queue.length>=5?queue:[...queue,id];}
export function moveInQueue(queue,id,direction) {
 const index=queue.indexOf(id),target=index+direction;
 if(index<0||target<0||target>=queue.length||![-1,1].includes(direction))return queue;
 const next=[...queue];[next[index],next[target]]=[next[target],next[index]];return next;
}
export function progressPercent(record) {
 const r=cleanReading(record);return r.totalPages>0&&r.page!==''?Math.min(100,Math.round(r.page/r.totalPages*100)):null;
}
export function readingErrors(record) {
 const r=cleanReading(record);return {
  pages:r.totalPages!==''&&r.totalPages>0&&r.page>r.totalPages?'Kaldığın sayfa, toplam sayfadan büyük.':r.totalPages===0?'Toplam sayfa en az 1 olmalı.':null,
  dates:r.startedAt&&r.finishedAt&&r.finishedAt<r.startedAt?'Bitiş tarihi, başlama tarihinden önce olamaz.':null
 };
}
export function todayLocal(date=new Date()) {return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function restorePersonal(current,input,bookIds) {
 const clean=cleanPersonal(input,bookIds);
 return {queue:Array.isArray(input?.queue)?clean.queue:current.queue,reading:{...current.reading,...clean.reading}};
}
