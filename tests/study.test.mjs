import test from 'node:test';
import assert from 'node:assert/strict';
import {makeCatalog} from '../src/engine.js';
import {demoPosition} from '../src/study.js';
test('walking demo respects forward direction and board boundaries',()=>{
 const catalog=makeCatalog([{id:'pawn',notation:'fW',original:true}]);
 assert.deepEqual(demoPosition(catalog.pawn,catalog),{from:12,targets:[7]});
});
test('three-square leap uses an alternate origin instead of an empty animation',()=>{
 const catalog=makeCatalog([{id:'jumper',notation:'H',original:true}]);
 const demo=demoPosition(catalog.jumper,catalog);
 assert.notEqual(demo.from,12);assert(demo.targets.length>0);
 for(const to of demo.targets)assert.equal(Math.abs(to%5-demo.from%5)+Math.abs(Math.floor(to/5)-Math.floor(demo.from/5)),3);
});
test('unsupported movement remains explicitly non-animated',()=>{
 const catalog=makeCatalog([{id:'special',notation:'unknown',original:true}]);
 assert.deepEqual(demoPosition(catalog.special,catalog),{from:12,targets:[]});
});
