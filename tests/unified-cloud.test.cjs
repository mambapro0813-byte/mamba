const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const window={};vm.runInNewContext(fs.readFileSync('unified_cloud_layer.js','utf8'),{window});
test('quote identity survives missing model; price ranges remain unparsed; contacts deduplicate',()=>{
 const result=window.AITRADE_UNIFIED.normalized({aitrade_full59_v1:{quotes:[{id:'Q1',status:'approved'}]},aitrade_decision_makers_v2:{people:[{company:'A',name:'B'},{company:'A',name:'B'}]}},[{model:'Q105',price:'35–40',cost:32}]);
 assert.equal(result.ai_trade_approvals[0].entity_type,'quote');
 assert.equal(result.ai_trade_approvals[0].status,'approved');
 assert.equal(result.ai_trade_contacts.length,1);
 assert.equal(result.ai_trade_products[0].price,null);
 assert.equal(result.ai_trade_products[0].cost,32);
});
test('activity without stable identity blocks sync',()=>{
 assert.throws(()=>window.AITRADE_UNIFIED.normalized({aitrade_full59_v1:{signals:[{type:'RFQ'}]}},[]),/稳定标识/);
});
