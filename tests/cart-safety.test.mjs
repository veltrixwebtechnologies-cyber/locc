import test from 'node:test';
import assert from 'node:assert/strict';
import { sourceLoader } from './load-source.mjs';
const {cartStore, sanitizeCart} = await sourceLoader(process.cwd())('src/modules/shopper/services/cart-store.ts');
const product = {id:'p1',name:'Rice',unit:'1 kg',price:70,stock:4};
test('corrupt persisted carts cannot crash consumers or cross seller boundaries',()=>{
  for(const value of [null,[],{}, {storeId:'s',lines:'broken'}, {storeId:'s',lines:[null]}])
    assert.deepEqual(sanitizeCart(value).lines,[]);
  const line={productId:'p1',storeId:'s',name:'Rice',unit:'kg',price:70,qty:2};
  assert.equal(sanitizeCart({storeId:'s',lines:[line,line,{...line,storeId:'other'}]}).lines.length,1);
  for(const qty of [NaN,Infinity,0,-1,1.5]) assert.equal(sanitizeCart({storeId:'s',lines:[{...line,qty}]}).lines.length,0);
});
test('cart rejects invalid quantities and prices, caps stock and clears last sold-out item',()=>{
  cartStore.clear();cartStore.add('s','Shop',product);
  for(const qty of [NaN,Infinity,1.5]) cartStore.setQty('p1',qty);
  assert.equal(cartStore.getSnapshot().lines[0].qty,1);
  cartStore.setQty('p1',20);
  assert.equal(cartStore.getSnapshot().lines[0].qty,4);
  assert.equal(cartStore.reconcileStock({p1:0}),true);
  assert.deepEqual(cartStore.getSnapshot(),{storeId:null,storeName:null,lines:[]});
  cartStore.add('s','Shop',{...product,price:NaN});
  assert.equal(cartStore.getSnapshot().lines.length,0);
});
test('cart stays usable when browser storage is blocked',()=>{
  globalThis.window={localStorage:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}}};
  try {assert.doesNotThrow(()=>cartStore.add('s','Shop',product));assert.equal(cartStore.getSnapshot().lines.length,1);}
  finally {delete globalThis.window;cartStore.clear();}
});
