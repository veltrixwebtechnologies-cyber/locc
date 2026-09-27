import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sourceLoader} from './load-source.mjs';
const {validatePaymentItems,assertCapturedPayment} = await sourceLoader(process.cwd())('src/lib/payment-validation.ts');
const item={product_id:'50bfc641-663c-22d9-5e71-7c72f6a6888c',qty:1};
test('payment rejects negative, fractional, missing and duplicate items',()=>{
 assert.doesNotThrow(()=>validatePaymentItems([item]));
 for(const items of [null,[],[item,item],[{...item,qty:0}],[{...item,qty:-2}],[{...item,qty:1.5}],[{...item,qty:NaN}],[{...item,product_id:'fake'}]])
   assert.throws(()=>validatePaymentItems(items));
});
test('payment must be captured for the exact provider order, currency and amount',()=>{
 const expected={paymentId:'pay_1',orderId:'order_1',amountPaise:2500};
 const payment={id:'pay_1',order_id:'order_1',status:'captured',currency:'INR',amount:2500};
 assert.doesNotThrow(()=>assertCapturedPayment(payment,expected));
 for(const change of [{status:'authorized'},{amount:100},{currency:'USD'},{order_id:'order_2'},{id:'pay_2'}])
  assert.throws(()=>assertCapturedPayment({...payment,...change},expected));
});
test('payment entrypoints require authentication and use the saved cart at verification',()=>{
 const source=fs.readFileSync('src/lib/razorpay.functions.ts','utf8');
 assert.equal(source.match(/\.middleware\(\[requireSupabaseAuth\]\)/g).length,2);
 assert.match(source,/p_items: saved\.items/);
 assert.match(source,/eq\("user_id", context\.userId\)/);
 assert.match(source,/if \(finalizeError\) throw/);
 assert.match(source,/const request_id = attempt\.id/);
});
