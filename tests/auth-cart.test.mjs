import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceLoader} from './load-source.mjs';
test('initial guest auth preserves cart; explicit logout clears; stale reads cannot overwrite login',async()=>{
 let callback,resolveSession,clears=0;
 globalThis.__authAudit={onChange(fn){callback=fn;},session(){return new Promise(resolve=>{resolveSession=resolve;});},clear(){clears++;}};
 globalThis.window={};
 try {
  const {authStore}=await sourceLoader(process.cwd(),{
   '@/integrations/supabase/client':'export const supabase={auth:{onAuthStateChange:fn=>globalThis.__authAudit.onChange(fn),getSession:()=>globalThis.__authAudit.session()}};',
   '@/lib/cart-store':'export const cartStore={clear:()=>globalThis.__authAudit.clear()};',
  })('src/lib/auth-store.ts');
  authStore.getSnapshot();
  callback('INITIAL_SESSION',null);
  assert.equal(clears,0);
  callback('SIGNED_IN',{user:{id:'buyer-1',email:'buyer@example.test'}});
  resolveSession({data:{session:null}});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(authStore.getSnapshot().id,'buyer-1');
  assert.equal(clears,0);
  callback('SIGNED_OUT',null);
  assert.equal(clears,1);
 }finally{delete globalThis.window;delete globalThis.__authAudit;}
});
