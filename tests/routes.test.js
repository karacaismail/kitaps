import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { emptyFilters,encodeRoute,decodeRoute,bookSlug } from '../src/library.js';
import { displayTitle,translationStatus,turkishMeaning } from '../src/translation.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../src/catalog.json',import.meta.url)));
test('readable English query parameters survive reload and retain legacy hashes',()=>{
 const route={view:'books',sort:'shared',book:null,filters:{...emptyFilters(),categories:['strategy']}};
 assert.equal(encodeRoute(route),'category=strategy');
 assert.deepEqual(decodeRoute('?category=strategy',catalog),route);
 assert.deepEqual(decodeRoute('#f=%7B%22categories%22%3A%5B%22strategy%22%5D%7D',catalog),route);
 const all={...route,view:'owned',book:'goal',sort:'newest',filters:{...emptyFilters(),states:['okunuyor'],awards:['Kazanan'],authors:['Chip and Dan Heath'],awardYears:['2025'],categories:['management','systems'],categoryMode:'all',yearMin:1980,yearMax:2026,shared:true,hasEdition:true}};
 const url=encodeRoute(all,catalog);assert.ok(url.includes('view=library'));assert.ok(url.includes('status=reading'));assert.ok(url.includes('award=winner'));assert.ok(!url.includes('%7B'));
 assert.deepEqual(decodeRoute('?'+url,catalog),all);
 assert.deepEqual(decodeRoute('?category=unknown&year-from=no',catalog).filters,emptyFilters());
});
test('readable book URLs resolve every title without collisions',()=>{
 const slugs=catalog.books.map(bookSlug);assert.equal(new Set(slugs).size,catalog.books.length);
 for(const b of catalog.books)assert.equal(decodeRoute('?book='+bookSlug(b),catalog).book,b.id);
});
test('translation absence is never inferred from an original cover or translated title',()=>{
 assert.equal(translationStatus({titleTr:'Türkçe bir ad',cover:{language:'en'}}).status,'unverified');
 assert.equal(translationStatus({cover:{language:'tr'}}).status,'available');
 assert.equal(translationStatus({verifiedEdition:{sourceUrl:'https://example.com'}}).status,'available');
 assert.equal(translationStatus({translationResearch:{status:'unavailable'}}).status,'unverified');
 assert.equal(translationStatus({translationResearch:{status:'unavailable',scopeNote:'İki aşamada bulunamadı.',stage1:{sources:[{url:'https://example.com/evidence'}]}}}).status,'unavailable');
 assert.equal(translationStatus({translationResearch:{status:'original',stage1:{sources:[{url:'https://example.com/original'}]}}}).status,'original');
});
test('unverified and unavailable works keep their original title while preserving a Turkish meaning',()=>{
 const unverified={title:'Çocuklar İçin Yunan Mitolojisi',titleTr:'',cover:{language:'en',title:'Orchard Greek Myths'},editions:[{turkish:'Çocuklar İçin Yunan Mitolojisi'}]};
 assert.equal(displayTitle(unverified),'Orchard Greek Myths');
 assert.equal(turkishMeaning(unverified),'Çocuklar İçin Yunan Mitolojisi');
 const imported={title:'Çocuklar İçin Yunan Mitolojisi',titleTr:'',cover:{language:'en',title:'Orchard Greek Myths'},editions:[{turkish:''}]};
 assert.equal(turkishMeaning(imported),'Çocuklar İçin Yunan Mitolojisi');
 const available={title:'The Mom Test',titleTr:'Anne Testi',cover:{language:'tr',title:'Anne Testi'}};
 assert.equal(displayTitle(available),'Anne Testi');
 assert.equal(turkishMeaning(available),'');
});
