import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const root=new URL('..',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('../data/translation-availability.json',import.meta.url)));
const catalogIds=JSON.parse(readFileSync(new URL('../src/catalog.json',import.meta.url))).books.map(book=>book.id);
const validate=(input,ids=['sample'])=>spawnSync('python3',['-c',`import json,sys
from scripts.translation_availability import validate_manifest
try:
 validate_manifest(json.loads(sys.argv[1]), set(json.loads(sys.argv[2])))
except ValueError as error:
 print(error)
 sys.exit(1)`,JSON.stringify(input),JSON.stringify(ids)],{cwd:root,encoding:'utf8'});
const source=(url,type='publisher')=>({url,type});
const stages=status=>({
 stage1:{decision:status,reviewer:'araştırmacı-a',checkedAt:'2026-09-28',sources:[source('https://example.com/a')]},
 stage2:{decision:status,reviewer:'araştırmacı-b',checkedAt:'2026-09-28',sources:[source('https://example.org/b','bibliographic')]},
});

test('translation availability manifest declares its decision and evidence policy',()=>{
 assert.equal(manifest.schemaVersion,1);
 assert.deepEqual(Object.keys(manifest.decisionPolicy.statuses),['available','unavailable','original']);
 assert.ok(Object.keys(manifest.records).length>0,'researched records are present');
 const result=validate(manifest,catalogIds);
 assert.equal(result.status,0,result.stdout);
});

test('available, unavailable and original decisions require matching independent review',()=>{
 const validRecords={
  sample:{status:'available',...stages('available'),edition:{title:'Örnek Kitap',publisher:'Örnek Yayınları',isbn:'9780000000002'}},
 };
 assert.equal(validate({schemaVersion:1,records:validRecords}).status,0);
 assert.equal(validate({schemaVersion:1,records:{sample:{status:'unavailable',...stages('unavailable'),scopeNote:'İki ulusal katalog ve hak sahibi kataloğu tarandı.'}}}).status,0);
 assert.equal(validate({schemaVersion:1,records:{sample:{status:'original',...stages('original'),originalLanguage:'tr'}}}).status,0);

 const cases=[
  [{...validRecords.sample,stage2:{...validRecords.sample.stage2,decision:'unavailable'}},'decision must equal'],
  [{...validRecords.sample,stage2:{...validRecords.sample.stage2,reviewer:'araştırmacı-a'}},'independent reviewers'],
  [{...validRecords.sample,stage2:{...validRecords.sample.stage2,sources:[]}},'must contain evidence'],
  [{...validRecords.sample,stage2:{...validRecords.sample.stage2,sources:[source('https://example.com/a')]}},'independent source evidence'],
  [{status:'original',...stages('original')},'originalLanguage must be tr'],
  [{status:'unavailable',...stages('unavailable')},'scopeNote is required'],
 ];
 for(const [record,message] of cases){
  const result=validate({schemaVersion:1,records:{sample:record}});
  assert.notEqual(result.status,0);
  assert.match(result.stdout,new RegExp(message));
 }
});
