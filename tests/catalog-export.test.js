import test from 'node:test';
import assert from 'node:assert/strict';
import catalog from '../src/catalog.json' with {type:'json'};
import {createBooksExport,exportBookRecord} from '../src/catalogExport.js';

test('catalog export contains every book and only the requested bibliographic fields',()=>{
 const result=createBooksExport(catalog,'2026-09-28T12:00:00.000Z');
 assert.equal(result.count,catalog.books.length);
 assert.equal(result.books.length,catalog.books.length);
 assert.deepEqual(Object.keys(result.books[0]),['turkceAdi','orijinalAdi','orijinalYayinevi','orijinalYazarlar','onerilenCevirmenler','turkiyeYayinevi']);
 assert.ok(result.books.every(book=>book.orijinalAdi&&Array.isArray(book.orijinalYazarlar)&&Array.isArray(book.onerilenCevirmenler)));
 assert.doesNotMatch(JSON.stringify(result),/"searchText"/);
});

test('verified Turkish edition supplies its title, translators and Turkish publisher',()=>{
 const book=catalog.books.find(item=>item.id==='competitivestrategy');
 assert.deepEqual(exportBookRecord(book),{
  turkceAdi:'Rekabet Stratejisi',
  orijinalAdi:'Competitive Strategy: Techniques for Analyzing Industries and Competitors',
  orijinalYayinevi:null,
  orijinalYazarlar:['Michael E. Porter'],
  onerilenCevirmenler:['Gülen Ulubilgen'],
  turkiyeYayinevi:'Aura Kitapları',
 });
});

test('an international record without a verified translation keeps Turkish edition fields empty',()=>{
 const book=catalog.books.find(item=>item.id==='ageofunreason');
 assert.deepEqual(exportBookRecord(book),{
  turkceAdi:null,
  orijinalAdi:'The Age of Unreason',
  orijinalYayinevi:'Harvard Business Review Press',
  orijinalYazarlar:['Charles Handy'],
  onerilenCevirmenler:[],
  turkiyeYayinevi:null,
 });
});
