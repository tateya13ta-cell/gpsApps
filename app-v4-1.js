const KEY='chaojaosamut-market-costing-v2',LEGACY='chawchaosamut-competitor-intelligence-v1';
const defaults={
  competitors:[
    {id:'c1',brand:'ทาโร',product:'ปลาสวรรค์ รสเข้มข้น',channel:'Big C',type:'หมวดเดียวกัน',weight:30,normalPrice:30,promoPrice:0,packScore:5,productScore:4,diffScore:4,shelf:'ออนไลน์',sellingPoint:'แบรนด์ใหญ่ ราคาเข้าใจง่าย',note:'รูปแบบเป็นปลาเส้นทั่วไป',url:'',photo:'',createdAt:Date.now()-3000},
    {id:'c2',brand:'เบนโตะ',product:'หมึกบด รสซอยซอส',channel:'Big C',type:'หมวดเดียวกัน',weight:18,normalPrice:20,promoPrice:0,packScore:5,productScore:4,diffScore:4,shelf:'ออนไลน์',sellingPoint:'รสเข้มข้น แบรนด์เป็นที่รู้จัก',note:'ไม่ใช่ปลาหวานโดยตรง',url:'',photo:'',createdAt:Date.now()-2000},
    {id:'c3',brand:'ตราเรือ',product:'ปลาหวานแผ่นปรุงรส',channel:'All Online',type:'คู่แข่งตรง',weight:120,normalPrice:37.33,promoPrice:0,packScore:3,productScore:4,diffScore:3,shelf:'ออนไลน์',sellingPoint:'ปลาหวานตรงหมวด ราคาต่อกรัมต่ำ',note:'แพ็กค่อนข้างดั้งเดิม',url:'',photo:'',createdAt:Date.now()-1000}
  ],
  costing:{batchName:'ปลาหวานเสียบไม้ รสดั้งเดิม',batchYield:50,productWeight:40,productionWastePct:2,packagingPerUnit:2,laborBatch:100,utilitiesBatch:35,logisticsBatch:40,overheadBatch:25,ingredients:[{id:'i1',name:'เนื้อปลา',purchaseQty:1000,purchasePrice:120,usageQty:500,wastePct:5},{id:'i2',name:'น้ำตาล',purchaseQty:1000,purchasePrice:35,usageQty:120,wastePct:0},{id:'i3',name:'เครื่องปรุงรวม',purchaseQty:500,purchasePrice:80,usageQty:50,wastePct:0}]},
  trade:{
    retailerMarginPct:30,
    promoPct:8,
    distributionPct:0,
    rebatePct:0,
    marketingPct:0,
    returnReservePct:0,
    adminPct:0,
    fixedFeePerUnit:0,
    listingFeeTotal:0,
    listingAmortUnits:1000,
    creditDays:0,
    financeRatePct:0,
    vatPct:7,
    targetGmPct:35,
    positionPct:0
  }
};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],num=v=>Number(v)||0,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const money=v=>'฿'+num(v).toLocaleString('th-TH',{maximumFractionDigits:2,minimumFractionDigits:num(v)%1?2:0});
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function clone(x){return JSON.parse(JSON.stringify(x))}
function normalize(d){return{competitors:(d.competitors||[]).map(c=>({...c,photo:c.photo||'',createdAt:c.createdAt||Date.now()})),costing:{...defaults.costing,...d.costing,ingredients:(d.costing?.ingredients||defaults.costing.ingredients).map(i=>({...i,id:i.id||'i'+Math.random()}))},trade:{...defaults.trade,...d.trade}}}
function load(){try{const x=JSON.parse(localStorage.getItem(KEY));if(x?.competitors)return normalize(x);const l=JSON.parse(localStorage.getItem(LEGACY));if(l?.competitors)return normalize({competitors:l.competitors,costing:{...defaults.costing,productWeight:l.pricing?.productWeight||40},trade:l.pricing})}catch(e){}return clone(defaults)}
let state=load(),editing=null,workingPhoto='';
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch(e){toast('พื้นที่รูปเต็ม กรุณาส่งออกข้อมูลและลบรูปเก่า');return false}}
function used(c){return num(c.promoPrice)>0?num(c.promoPrice):num(c.normalPrice)}
function ppg(c){return num(c.weight)?used(c)/num(c.weight):0}
function norm(c){return ppg(c)*num(state.costing.productWeight)}
function avg(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:0}
function median(a){if(!a.length)return 0;const s=[...a].sort((a,b)=>a-b),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2}
function comps(){return state.competitors.filter(c=>num(c.weight)&&used(c))}
function ingredientCost(i){const unit=num(i.purchaseQty)?num(i.purchasePrice)/num(i.purchaseQty):0;return num(i.usageQty)*unit/(1-clamp(num(i.wastePct)/100,0,.95))}
function calcCost(){const ing=state.costing.ingredients.reduce((s,i)=>s+ingredientCost(i),0),other=num(state.costing.laborBatch)+num(state.costing.utilitiesBatch)+num(state.costing.logisticsBatch)+num(state.costing.overheadBatch),yieldN=num(state.costing.batchYield),pre=yieldN?(ing+other)/yieldN+num(state.costing.packagingPerUnit):0,cost=pre/(1-clamp(num(state.costing.productionWastePct)/100,0,.95));return{ing,other,cost}}
function ladder(v){const a=[15,20,25,29,30,35,39,40,45,49,50,59,69,79,89,99,119,129,149,169,199,249,299];return a.find(x=>x>=v)||Math.ceil((v+1)/10)*10-1}
function calcPrice(pos=null){
  const c=calcCost(),t=state.trade;
  const margin=clamp(num(t.retailerMarginPct)/100,0,.95),vat=num(t.vatPct)/100,gm=clamp(num(t.targetGmPct)/100,0,.95);
  const variablePct=clamp((num(t.promoPct)+num(t.distributionPct)+num(t.rebatePct)+num(t.marketingPct)+num(t.returnReservePct)+num(t.adminPct))/100,0,.95);
  const financePct=clamp(num(t.financeRatePct)/100*num(t.creditDays)/365,0,.95);
  const listingPerUnit=num(t.listingAmortUnits)>0?num(t.listingFeeTotal)/num(t.listingAmortUnits):0;
  const fixedPerUnit=num(t.fixedFeePerUnit)+listingPerUnit;
  const collectionFactor=Math.max(.01,1-variablePct-financePct);
  const requiredNet=c.cost/(1-gm);
  const floor=((requiredNet+fixedPerUnit)/collectionFactor)/(1-margin)*(1+vat);
  const benchmark=avg(comps().map(ppg))*num(state.costing.productWeight);
  const market=benchmark*(1+(pos===null?num(t.positionPct):pos)/100);
  const recommended=ladder(Math.max(floor,market||0));
  const wholesale=recommended/(1+vat)*(1-margin);
  const financeCost=wholesale*financePct;
  const variableDeductions=wholesale*variablePct;
  const net=Math.max(0,wholesale-variableDeductions-financeCost-fixedPerUnit);
  const profit=net-c.cost,actual=net?profit/net:0;
  return{...c,floor,benchmark,recommended,wholesale,net,profit,actual,variablePct,financePct,listingPerUnit,fixedPerUnit,variableDeductions,financeCost,collectionFactor};
}
const meta={dashboard:['ภาพรวมธุรกิจและการตั้งราคา','เครื่องมือสำรวจคู่แข่ง วิเคราะห์ต้นทุน และแนะนำราคา'],competitors:['สำรวจคู่แข่ง','ถ่ายรูป เก็บราคา และเปรียบเทียบกับสินค้าของเรา'],costing:['ต้นทุนวัตถุดิบและราคาขาย','คำนวณต้นทุนจริง รวมค่าหักจาก Modern Trade']};
function go(p){$$('.page').forEach(x=>x.classList.remove('active'));$('#'+p+'Page').classList.add('active');$$('[data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page===p));$('#pageTitle').textContent=meta[p][0];$('#pageSub').textContent=meta[p][1];window.scrollTo(0,0);renderAll()}
$$('[data-page]').forEach(b=>b.onclick=()=>go(b.dataset.page));$$('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));