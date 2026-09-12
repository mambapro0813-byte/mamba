/* AI TRADE — Pricing Brain 2.0 + AI Quotation 2.0 */
(function(){
 const KEY='ai_trade_pricing_brain_v2';
 const cfg=JSON.parse(localStorage.getItem(KEY)||'null')||{
  currency:'USD',incoterm:'EXW',targetMargin:0.22,warningMargin:0.15,
  tiers:[{qty:1000,discount:0},{qty:3000,discount:.025},{qty:5000,discount:.045},{qty:10000,discount:.065}],
  approval:{belowReference:true,belowWarningMargin:true,paymentTerms:true,exclusive:true,mold:true,customization:true}
 };
 function save(){localStorage.setItem(KEY,JSON.stringify(cfg))}
 function num(v){v=parseFloat(v);return Number.isFinite(v)?v:0}
 function product(model){return (window.products||[]).find(p=>String(p.model||p.sku||'').toLowerCase()===String(model||'').toLowerCase())}
 function basePrice(p){return num(p?.price||p?.usd||p?.referencePrice||p?.refPrice)}
 function tier(q){return [...cfg.tiers].sort((a,b)=>b.qty-a.qty).find(x=>q>=x.qty)||cfg.tiers[0]}
 function calc(input){
  const p=product(input.model), qty=Math.max(1,num(input.qty)), ref=basePrice(p), t=tier(qty);
  const cost=num(input.cost||p?.cost), custom=num(input.customFee), pack=num(input.packFee), freight=num(input.freightPerUnit);
  let unit=num(input.unitPrice)||ref*(1-num(t?.discount));
  const floor=cost?cost/(1-cfg.warningMargin):0, target=cost?cost/(1-cfg.targetMargin):0;
  if(!input.unitPrice && target) unit=Math.max(unit,target);
  const extras=custom+pack+freight, landedUnit=unit+extras, total=landedUnit*qty;
  const margin=cost&&unit?(unit-cost)/unit:null;
  const flags=[];
  if(ref&&unit<ref) flags.push('低于产品参考价');
  if(margin!==null&&margin<cfg.warningMargin) flags.push('毛利低于预警线');
  if(input.paymentTerms&&String(input.paymentTerms).toLowerCase()!=='30% deposit + 70% before shipment') flags.push('特殊付款条件');
  if(input.exclusive) flags.push('独家/区域代理条件');
  if(input.mold) flags.push('模具/开发费用');
  if(custom>0) flags.push('定制费用');
  return {model:input.model,qty,ref,unit,extras,landedUnit,total,cost,margin,target,floor,currency:input.currency||cfg.currency,incoterm:input.incoterm||cfg.incoterm,flags,approvalRequired:flags.length>0,status:flags.length?'待人工审批':'可生成报价'};
 }
 function quotation(input){
  const r=calc(input), c=(window.customers||[]).find(x=>String(x.id)==String(input.customerId));
  return {id:'QT-'+Date.now(),createdAt:new Date().toISOString(),customerId:input.customerId,customer:c?.company||c?.name||input.customer||'',contact:c?.contact||'',...r,validDays:num(input.validDays)||15,paymentTerms:input.paymentTerms||'30% deposit + 70% before shipment',moq:num(input.moq)||1000,notes:input.notes||'',humanApproval:r.approvalRequired?'required':'not_required'};
 }
 window.PricingBrain={cfg,save,calc,quotation,product};
})();