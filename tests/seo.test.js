import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { emptyFilters } from '../src/library.js';
import { seoState } from '../src/seo.js';

const catalog=JSON.parse(fs.readFileSync(new URL('../src/catalog.json',import.meta.url)));
const route=overrides=>({view:'books',sort:'shared',book:null,page:1,pageSize:24,filters:emptyFilters(),...overrides});

test('public catalog pages have unique canonical, previous and next URLs',()=>{
 const state=seoState({route:route({page:5}),catalog,count:catalog.books.length,currentPage:5,totalPages:31,displayed:catalog.books.slice(96,120)});
 assert.equal(state.robots,'index,follow');
 assert.match(state.title,/Sayfa 5/);
 assert.equal(state.canonical,'https://karacaismail.github.io/kitaps/?page=5');
 assert.equal(state.prev,'https://karacaismail.github.io/kitaps/?page=4');
 assert.equal(state.next,'https://karacaismail.github.io/kitaps/?page=6');
});

test('search and personal result URLs stay out of the index',()=>{
 const search=seoState({route:route({filters:{...emptyFilters(),query:'strateji'}}),catalog,count:3,currentPage:1,totalPages:1,displayed:[]});
 assert.equal(search.robots,'noindex,follow');
 assert.equal(search.canonical,'https://karacaismail.github.io/kitaps/');
 const personal=seoState({route:route({view:'owned'}),catalog,count:4,currentPage:1,totalPages:1,displayed:[]});
 assert.equal(personal.robots,'noindex,follow');
});

test('book pages use one clean canonical URL',()=>{
 const book=catalog.books[0];
 const state=seoState({route:route({book:book.id,page:8}),catalog,count:catalog.books.length,currentPage:8,totalPages:31,displayed:[]});
 assert.equal(state.robots,'index,follow');
 assert.match(state.canonical,/\?book=/);
 assert.doesNotMatch(state.canonical,/page=/);
 assert.equal(state.structured['@type'],'Book');
});
