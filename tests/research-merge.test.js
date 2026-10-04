import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=new URL('..',import.meta.url).pathname;
const evidence=(url,sourceType)=>({url,sourceType,claim:'Örnek kanıt.',accessedAt:'2026-10-04'});

// Runs the research merge in report-only mode against a temporary research folder.
function mergeReport(stage1,stage2,id='atomichabits',checkedAt='2026-10-04'){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kitaps-research-'));
 try{
  for(const [folder,data] of [['input',{batchId:'t-1',records:[{id}]}],['stage1',stage1],['stage2',stage2]]){
   fs.mkdirSync(path.join(dir,folder));
   fs.writeFileSync(path.join(dir,folder,'t-1.json'),JSON.stringify(data));
  }
  const report=path.join(dir,'report.json');
  const result=spawnSync('python3',['scripts/merge-bibliographic-research.py','--research',dir,'--report',report,'--checked-at',checkedAt],{cwd:root,encoding:'utf8'});
  if(result.status!==0)return {error:result.stderr};
  return JSON.parse(fs.readFileSync(report,'utf8'));
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
}

test('a later review never silently drops facts an earlier review accepted',()=>{
 // Atomic Habits already has an accepted year and language; a review of the publisher alone must not erase them.
 const {summary,manualReview}=mergeReport(
  {records:[{id:'atomichabits',original:{firstPublisher:'Avery',evidence:[evidence('https://example.com/a','publisher')],confidence:'high'}}]},
  {records:[{id:'atomichabits',original:{fields:{firstPublisher:'accept'},evidence:[evidence('https://example.org/b','library-catalog')],confidence:'high'}}]},
 );
 assert.deepEqual(summary.factsAccepted,{});
 assert.ok(manualReview.some(item=>item.id==='atomichabits'&&/would drop accepted firstPublicationYear, originalLanguage/.test(item.problem)),JSON.stringify(manualReview));
});

test('a review that keeps every accepted fact is accepted',()=>{
 // Repeat whatever the catalog already holds for the book, so the review drops nothing.
 const facts=JSON.parse(fs.readFileSync(new URL('../data/bibliographic-facts.json',import.meta.url))).records.atomichabits;
 const fields=Object.fromEntries(Object.entries(facts).filter(([key])=>!key.startsWith('stage')));
 const {summary,manualReview}=mergeReport(
  {records:[{id:'atomichabits',original:{...fields,evidence:[evidence('https://example.com/a','publisher')],confidence:'high'}}]},
  {records:[{id:'atomichabits',original:{fields:Object.fromEntries(Object.keys(fields).map(key=>[key,'accept'])),evidence:[evidence('https://example.org/b','library-catalog')],confidence:'high'}}]},
 );
 assert.deepEqual(manualReview,[]);
 assert.deepEqual(summary.factsAccepted,Object.fromEntries(Object.keys(fields).sort().map(key=>[key,1])));
});

test('a later Turkish edition review never silently drops an accepted translator',()=>{
 const translations=JSON.parse(fs.readFileSync(new URL('../data/translation-availability.json',import.meta.url))).records;
 const [id,earlier]=Object.entries(translations).find(([,record])=>record.status==='available'&&record.edition?.translators?.length&&record.edition.isbn);
 const {summary,manualReview}=mergeReport(
  {records:[{id,turkish:{decision:'available',turkishTitle:earlier.edition.title,publisher:earlier.edition.publisher,isbn:earlier.edition.isbn,translatorNames:[],evidence:[evidence('https://example.com/a','publisher')],confidence:'high'}}]},
  {records:[{id,turkish:{verdict:'accept',finalDecision:'available',evidence:[evidence('https://example.org/b','library-catalog')],confidence:'high'}}]},
  id,
 );
 assert.deepEqual(summary.turkishAccepted,{});
 assert.ok(manualReview.some(item=>item.id===id&&/translators/.test(item.problem)&&item.earlier&&item.proposed),JSON.stringify(manualReview));
});

test('the check date must be a real day that has already come',()=>{
 for(const bad of ['2026-02-30','20261004','2999-01-01']){
  const {error}=mergeReport({records:[]},{records:[]},'atomichabits',bad);
  assert.match(error||'',/YYYY-MM-DD/,bad);
 }
});
