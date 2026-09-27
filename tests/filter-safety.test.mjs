import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceLoader} from './load-source.mjs';
const {parseFilterParams}=await sourceLoader(process.cwd())('src/lib/filter-utils.ts');
test('untrusted filter URL numbers cannot produce NaN/negative offsets or infinite ranges',()=>{
 for(const value of ['NaN','Infinity','-1','1.5','0']) assert.equal(parseFilterParams({page:value}).page,1);
 assert.equal(parseFilterParams({page:'2'}).page,2);
 assert.equal(parseFilterParams({minPrice:'-2',maxDistance:'Infinity'}).minPrice,undefined);
 assert.equal(parseFilterParams({maxDistance:'Infinity'}).maxDistanceKm,undefined);
 assert.equal(parseFilterParams({maxDistance:'7'}).maxDistanceKm,7);
});
