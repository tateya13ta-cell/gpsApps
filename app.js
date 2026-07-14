const STORAGE_KEY='chaojaosamut-market-costing-v2';
const LEGACY_KEY='chawchaosamut-competitor-intelligence-v1';

const sampleCompetitors=[
  {id:'c1',brand:'ทาโร',product:'ปลาสวรรค์ รสเข้มข้น',channel:'Big C',type:'หมวดเดียวกัน',weight:30,normalPrice:30,promoPrice:0,packScore:5,productScore:4,diffScore:4,shelf:'ออนไลน์',sellingPoint:'แบรนด์ใหญ่ ราคาเข้าใจง่าย',note:'รูปแบบเป็นปลาเส้นทั่วไป',url:'',photo:'',createdAt:Date.now()-600000},
  {id:'c2',brand:'เบนโตะ',product:'หมึกบด เจแปนนีสซอยซอส',channel:'Big C',type:'หมวดเดียวกัน',weight:18,normalPrice:20,promoPrice:0,packScore:5,productScore:4,diffScore:4,shelf:'ออนไลน์',sellingPoint:'รสเข้มข้น แบรนด์เป็นที่รู้จัก',note:'ไม่ใช่ปลาหวานโดยตรง',url:'',photo:'',createdAt:Date.now()-500000},
  {id:'c3',brand:'ตราเรือ',product:'ปลาหวานแผ่นปรุงรส',channel:'All Online',type:'คู่แข่งตรง',weight:120,normalPrice:37.33,promoPrice:0,packScore:3,productScore:4,diffScore:3,shelf:'ออนไลน์',sellingPoint:'ปลาหวานตรงหมวด ราคาต่อกรัมต่ำ',note:'แพ็กค่อนข้างดั้งเดิม',url:'',photo:'',createdAt:Date.now()-400000}
];

const defaultCosting={
  batchName:'ปลาหวานเสียบไม้ รสดั้งเดิม',batchYield:50,productWeight:40,productionWastePct:2,
  packagingPerUnit:2,laborBatch:100,utilitiesBatch:35,logisticsBatch:40,overheadBatch:25,
  ingredients:[
    {id:'i1',name:'เนื้อปลา',purchaseQty:1000,purchasePrice:120,usageQty:500,wastePct:5},
    {id:'i2',name:'น้ำตาล',purchaseQty:1000,purchasePrice:35,usageQty:120,wastePct:0},
    {id:'i3',name:'เครื่องปรุงรวม',purchaseQty:500,purchasePrice:80,usageQty:50,wastePct:0}
  ]
};
const defaultTrade={promoPct:8,retailerMarginPct:30,vatPct:7,targetGmPct:35,positionPct:0};

let state=loadState();
let editingId=null;
let workingPhoto='';

const qs=s=>document.querySelector(s);
const qsa=s=>[...document.querySelectorAll(s)];
const num=v=>Number(v)||0;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const money=v=>'฿'+num(v).toLocaleString('th-TH',{minimumFractionDigits:num(v)%1?2:0,maximumFractionDigits:2});
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function loadState(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(saved?.competitors) return normalizeState(saved);
    const legacy=JSON.parse(localStorage.getItem(LEGACY_KEY));
    if(legacy?.competitors){
      const migrated={competitors:legacy.competitors,costing:{...defaultCosting,productWeight:legacy.pricing?.productWeight||40},trade:{...defaultTrade,...legacy.pricing}};
      return normalizeState(migrated);
    }
  }catch(e){}
  return normalizeState({competitors:sampleCompetitors,costing:defaultCosting,trade:defaultTrade});
}
function normalizeState(data){
  return {
    competitors:(data.competitors||[]).map(c=>({...c,photo:c.photo||'',createdAt:c.createdAt||Date.now()})),
    costing:{...defaultCosting,...data.costing,ingredients:(data.costing?.ingredients||defaultCosting.ingredients).map(i=>({...i,id:i.id||'i'+Math.random().toString(36).slice(2)}))},
    trade:{...defaultTrade,...data.trade}
  };
}
function saveState(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));return true}
  catch(e){toast('พื้นที่บันทึกรูปเต็ม กรุณาส่งออกข้อมูลแล้วลบรูปเก่าบางส่วน');return false}
}

function usedPrice(c){return num(c.promoPrice)>0?num(c.promoPrice):num(c.normalPrice)}
function pricePerGram(c){return num(c.weight)>0?usedPrice(c)/num(c.weight):0}
function normalizedPrice(c){return pricePerGram(c)*num(state.costing.productWeight)}
function avg(arr){return arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:0}
function median(arr){if(!arr.length)return 0;const s=[...arr].sort((a,b)=>a-b),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2}
function priceLadder(v){const ladder=[15,20,25,29,30,35,39,40,45,49,50,59,69,79,89,99,119,129,149,169,199,249,299];return ladder.find(x=>x>=v)||Math.ceil((v+1)/10)*10-1}
function validCompetitors(){return state.competitors.filter(c=>num(c.weight)>0&&usedPrice(c)>0)}
function positionName(c){const all=validCompetitors(),market=avg(all.map(normalizedPrice)),v=normalizedPrice(c);if(!market)return ['ตลาด',''];if(v<market*.9)return ['ประหยัด','value'];if(v>market*1.1)return ['พรีเมียม','premium'];return ['กลาง','']}

function ingredientCost(i){
  const unitCost=num(i.purchaseQty)>0?num(i.purchasePrice)/num(i.purchaseQty):0;
  const waste=clamp(num(i.wastePct)/100,0,.95);
  return num(i.usageQty)*unitCost/(1-waste);
}
function calculateCosting(){
  const c=state.costing;
  const ingredientTotal=c.ingredients.reduce((sum,i)=>sum+ingredientCost(i),0);
  const batchOther=num(c.laborBatch)+num(c.utilitiesBatch)+num(c.logisticsBatch)+num(c.overheadBatch);
  const batchBeforePackaging=ingredientTotal+batchOther;
  const perUnitBeforeLoss=num(c.batchYield)>0?batchBeforePackaging/num(c.batchYield)+num(c.packagingPerUnit):0;
  const productionWaste=clamp(num(c.productionWastePct)/100,0,.95);
  const costPerUnit=perUnitBeforeLoss/(1-productionWaste);
  return {ingredientTotal,batchOther,batchBeforePackaging,perUnitBeforeLoss,costPerUnit};
}
function calculatePricing(positionOverride=null){
  const cost=calculateCosting();
  const t=state.trade;
  const promo=clamp(num(t.promoPct)/100,0,.95),margin=clamp(num(t.retailerMarginPct)/100,0,.95),vat=num(t.vatPct)/100,gm=clamp(num(t.targetGmPct)/100,0,.95);
  const netNeeded=cost.costPerUnit/(1-gm);
  const wholesaleNeeded=netNeeded/(1-promo);
  const floorRetail=wholesaleNeeded/(1-margin)*(1+vat);
  const comps=validCompetitors();
  const benchmark=avg(comps.map(pricePerGram))*num(state.costing.productWeight);
  const position=(positionOverride===null?num(t.positionPct):positionOverride)/100;
  const marketTarget=benchmark*(1+position);
  const rawRecommended=Math.max(floorRetail,marketTarget||0);
  const recommended=priceLadder(rawRecommended);
  const wholesale=recommended/(1+vat)*(1-margin);
  const netRevenue=wholesale*(1-promo);
  const profit=netRevenue-cost.costPerUnit;
  const actualGm=netRevenue?profit/netRevenue:0;
  return {...cost,floorRetail,benchmark,marketTarget,rawRecommended,recommended,wholesale,netRevenue,profit,actualGm};
}

const pageMeta={
  dashboard:['ภาพรวมธุรกิจ','เห็นคู่แข่ง ต้นทุน และราคาที่ควรขายในหน้าเดียว'],
  competitors:['สำรวจคู่แข่ง','ถ่ายรูป เก็บราคา และเปรียบเทียบกับสินค้าของเรา'],
  costing:['ต้นทุนและราคาขาย','คำนวณจากสูตรวัตถุดิบจริงต่อรอบการผลิต']
};
function switchPage(page){
  qsa('.page').forEach(p=>p.classList.remove('active'));
  qs('#'+page+'Page').classList.add('active');
  qsa('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
  qs('#pageTitle').textContent=pageMeta[page][0];qs('#pageSubtitle').textContent=pageMeta[page][1];
  window.scrollTo({top:0,behavior:'smooth'});
  renderAll();
}
qsa('[data-page]').forEach(b=>b.addEventListener('click',()=>switchPage(b.dataset.page)));
qsa('[data-go]').forEach(b=>b.addEventListener('click',()=>switchPage(b.dataset.go)));

function renderDashboard(){
  const comps=validCompetitors(),cost=calculateCosting(),pricing=calculatePricing(),norms=comps.map(normalizedPrice),prices=comps.map(usedPrice);
  const direct=comps.filter(c=>c.type==='คู่แข่งตรง').length;
  const kpis=[
    ['คู่แข่งที่บันทึก',comps.length+' รายการ',direct+' คู่แข่งตรง',''],
    ['ราคาตลาดเฉลี่ย',money(avg(prices)),'ราคากลาง '+money(median(prices)),''],
    ['ต้นทุนต่อแพ็ก',money(cost.costPerUnit),'จากสูตร '+num(state.costing.batchYield)+' แพ็ก',''],
    ['ราคาแนะนำ',money(pricing.recommended),'ราคาต่ำสุด '+money(pricing.floorRetail),'emphasis']
  ];
  qs('#kpiCards').innerHTML=kpis.map(k=>`<div class="kpi-card ${k[3]}"><div class="label">${k[0]}</div><div class="value">${k[1]}</div><div class="note">${k[2]}</div></div>`).join('');
  qs('#chartWeight').textContent=num(state.costing.productWeight)+' กรัม';renderChart(comps);
  const market=avg(norms),gap=pricing.recommended-pricing.floorRetail;
  const insights=[];
  if(comps.filter(c=>c.photo).length<comps.length) insights.push(['เก็บรูปเพิ่ม','คู่แข่งบางรายการยังไม่มีรูป การถ่ายชั้นวางจะช่วยดูแพ็กเกจ ตำแหน่ง และโปรโมชั่นได้แม่นขึ้น']);
  if(state.costing.ingredients.length<3) insights.push(['เติมสูตรวัตถุดิบ','ใส่วัตถุดิบให้ครบทุกตัวก่อนใช้ราคานี้คุยกับ Buyer']);
  insights.push(['ตำแหน่งราคา',market?`ตลาดเฉลี่ยเมื่อเทียบ ${state.costing.productWeight} กรัมอยู่ที่ ${money(market)} ราคาของเราแนะนำ ${money(pricing.recommended)}`:'เพิ่มข้อมูลคู่แข่งเพื่อสร้างราคาตลาดอ้างอิง']);
  insights.push(['พื้นที่ทำโปร',gap>3?`มีพื้นที่ประมาณ ${money(gap)} ระหว่างราคาขั้นต่ำกับราคาแนะนำ`:'พื้นที่ทำโปรโมชั่นน้อย ควรลดต้นทุนหรือปรับขนาดแพ็ก']);
  qs('#dashboardInsights').innerHTML=insights.slice(0,4).map(insightHtml).join('');
  const recent=[...state.competitors].sort((a,b)=>num(b.createdAt)-num(a.createdAt)).slice(0,3);
  qs('#recentCompetitors').innerHTML=recent.length?recent.map(c=>`<div class="recent-item">${c.photo?`<img class="recent-thumb" src="${c.photo}" alt="${escapeHtml(c.brand)}">`:`<div class="recent-thumb recent-placeholder">◉</div>`}<div class="recent-info"><b>${escapeHtml(c.brand)}</b><span>${escapeHtml(c.product)} · ${escapeHtml(c.channel)}</span></div><div class="recent-price">${money(usedPrice(c))}</div></div>`).join(''):'<div class="empty-state"><span>◉</span>ยังไม่มีข้อมูลคู่แข่ง</div>';
}
function renderChart(comps){
  const el=qs('#priceChart');if(!comps.length){el.innerHTML='<div class="empty-state"><span>⌁</span>เพิ่มคู่แข่งเพื่อดูกราฟราคา</div>';return}
  const data=[...comps].sort((a,b)=>normalizedPrice(b)-normalizedPrice(a)).slice(0,7),max=Math.max(...data.map(normalizedPrice),1),W=760,H=270,left=105,right=50,top=15,bottom=30,innerW=W-left-right,rowH=(H-top-bottom)/data.length;
  let grid='';for(let i=0;i<=4;i++){const x=left+innerW*i/4;grid+=`<line class="chart-grid" x1="${x}" y1="${top}" x2="${x}" y2="${H-bottom}"/><text class="chart-label" x="${x}" y="${H-7}" text-anchor="middle">${Math.round(max*i/4)}</text>`}
  const bars=data.map((c,i)=>{const y=top+i*rowH+5,h=Math.max(rowH-10,11),w=innerW*normalizedPrice(c)/max;return `<text class="chart-label" x="${left-8}" y="${y+h/2+4}" text-anchor="end">${escapeHtml(c.brand).slice(0,14)}</text><rect class="chart-bar" x="${left}" y="${y}" width="${w}" height="${h}"><title>${escapeHtml(c.brand)} ${money(normalizedPrice(c))}</title></rect><text class="chart-label" x="${left+w+7}" y="${y+h/2+4}">${money(normalizedPrice(c))}</text>`}).join('');
  el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${grid}${bars}</svg>`;
}
function insightHtml([title,text]){return `<div class="insight"><span class="dot"></span><div><b>${title}</b><p>${text}</p></div></div>`}

function filteredCompetitors(){
  const q=qs('#searchInput').value.trim().toLowerCase(),channel=qs('#channelFilter').value,type=qs('#typeFilter').value;
  return state.competitors.filter(c=>(!q||[c.brand,c.product,c.channel,c.sellingPoint,c.note].join(' ').toLowerCase().includes(q))&&(!channel||c.channel===channel)&&(!type||c.type===type));
}
function renderCompetitors(){
  const rows=filteredCompetitors();
  qs('#competitorGrid').innerHTML=rows.length?rows.map(c=>{
    const [position,cls]=positionName(c),score=num(c.packScore)+num(c.productScore)+num(c.diffScore);
    return `<article class="competitor-card">
      <div class="competitor-photo" ${c.photo?`onclick="openLightbox('${c.id}')"`:''}>
        ${c.photo?`<img src="${c.photo}" alt="${escapeHtml(c.brand)}">`:`<div class="photo-empty"><div><span>▣</span>ยังไม่มีรูปหน้าร้าน</div></div>`}
        <span class="type-chip">${escapeHtml(c.type)}</span>
      </div>
      <div class="competitor-body">
        <div class="competitor-title"><div><h4>${escapeHtml(c.brand)}</h4><p>${escapeHtml(c.product)} · ${escapeHtml(c.channel)}</p></div><span class="position-chip ${cls}">${position}</span></div>
        <div class="competitor-stats"><div class="competitor-stat"><span>ราคาที่ใช้</span><b>${money(usedPrice(c))}</b></div><div class="competitor-stat"><span>บาท/กรัม</span><b>${money(pricePerGram(c))}</b></div><div class="competitor-stat"><span>เทียบ ${state.costing.productWeight}g</span><b>${money(normalizedPrice(c))}</b></div></div>
        <div class="competitor-note"><b>${escapeHtml(c.sellingPoint||'ยังไม่ได้บันทึกจุดขาย')}</b><br>${escapeHtml(c.note||'')}</div>
        <div class="competitor-actions"><button class="btn secondary" onclick="openCompetitorModal('${c.id}')">แก้ไข · ${score}/15</button><button class="danger-link" onclick="deleteCompetitor('${c.id}')">ลบ</button></div>
      </div>
    </article>`
  }).join(''):'<div class="empty-state"><span>◉</span><b>ยังไม่พบข้อมูล</b><br>กด “เพิ่มคู่แข่ง” เพื่อถ่ายรูปและบันทึกสินค้า</div>';
  const channels=[...new Set(state.competitors.map(c=>c.channel).filter(Boolean))].sort(),current=qs('#channelFilter').value;
  qs('#channelFilter').innerHTML='<option value="">ทุกช่องทาง</option>'+channels.map(c=>`<option ${c===current?'selected':''}>${escapeHtml(c)}</option>`).join('');
}

const batchFields=[
  ['batchName','ชื่อสูตร / สินค้า','', 'text'],['batchYield','จำนวนที่ผลิตได้ต่อรอบ','แพ็ก','number'],['productWeight','น้ำหนักสุทธิต่อแพ็ก','กรัม','number']
];
const otherCostFields=[
  ['packagingPerUnit','แพ็กเกจต่อแพ็ก','บาท','number'],['laborBatch','ค่าแรงต่อรอบ','บาท','number'],['utilitiesBatch','ค่าน้ำ/ไฟ/แก๊สต่อรอบ','บาท','number'],['logisticsBatch','ขนส่ง/คลังต่อรอบ','บาท','number'],['overheadBatch','ค่าใช้จ่ายอื่นต่อรอบ','บาท','number'],['productionWastePct','ของเสียจากการผลิต','%','number']
];
const tradeFields=[
  ['retailerMarginPct','Margin ห้าง','%'],['promoPct','งบโปรโมชั่น','%'],['targetGmPct','กำไรขั้นต้นเป้าหมาย','%'],['vatPct','VAT','%'],['positionPct','ตำแหน่งเทียบตลาด','%']
];
function fieldHtml([key,label,suffix,type='number'],scope){
  const value=scope==='trade'?state.trade[key]:state.costing[key];
  return `<label><span>${label}</span><div class="input-wrap"><input data-scope="${scope}" data-key="${key}" type="${type}" ${type==='number'?'step="0.01"':''} value="${escapeHtml(value)}">${suffix?`<em>${suffix}</em>`:''}</div></label>`;
}
function renderCostingForms(){
  qs('#batchForm').innerHTML=batchFields.map(f=>fieldHtml(f,'costing')).join('');
  qs('#otherCostForm').innerHTML=otherCostFields.map(f=>fieldHtml(f,'costing')).join('');
  qs('#tradeForm').innerHTML=tradeFields.map(f=>fieldHtml(f,'trade')).join('');
  qsa('[data-scope]').forEach(input=>input.addEventListener('input',e=>{
    const scope=e.target.dataset.scope,key=e.target.dataset.key,value=e.target.type==='number'?num(e.target.value):e.target.value;
    state[scope][key]=value;saveState();renderCostingResults();renderDashboard();renderCompetitors();
  }));
  renderIngredients();renderCostingResults();
}
function renderIngredients(){
  qs('#ingredientList').innerHTML=state.costing.ingredients.map(i=>`<div class="ingredient-row" data-id="${i.id}">
    <input class="ingredient-name" data-key="name" value="${escapeHtml(i.name)}" placeholder="ชื่อวัตถุดิบ">
    <input data-key="purchaseQty" type="number" step="0.01" value="${num(i.purchaseQty)}" title="ปริมาณที่ซื้อ">
    <input data-key="purchasePrice" type="number" step="0.01" value="${num(i.purchasePrice)}" title="ราคาที่ซื้อ">
    <input data-key="usageQty" type="number" step="0.01" value="${num(i.usageQty)}" title="ปริมาณที่ใช้">
    <input data-key="wastePct" type="number" step="0.01" value="${num(i.wastePct)}" title="สูญเสีย %">
    <div class="ingredient-cost">${money(ingredientCost(i))}</div>
    <button class="remove-row" type="button" onclick="removeIngredient('${i.id}')">×</button>
  </div>`).join('');
  qsa('.ingredient-row input').forEach(input=>input.addEventListener('input',e=>{
    const row=e.target.closest('.ingredient-row'),item=state.costing.ingredients.find(i=>i.id===row.dataset.id),key=e.target.dataset.key;
    item[key]=e.target.type==='number'?num(e.target.value):e.target.value;saveState();
    row.querySelector('.ingredient-cost').textContent=money(ingredientCost(item));renderCostingResults();renderDashboard();
  }));
}
function addIngredient(){state.costing.ingredients.push({id:'i'+Date.now(),name:'',purchaseQty:1000,purchasePrice:0,usageQty:0,wastePct:0});saveState();renderIngredients();renderCostingResults();setTimeout(()=>qs('.ingredient-row:last-child .ingredient-name')?.focus(),0)}
function removeIngredient(id){if(state.costing.ingredients.length<=1){toast('สูตรต้องมีวัตถุดิบอย่างน้อย 1 รายการ');return}state.costing.ingredients=state.costing.ingredients.filter(i=>i.id!==id);saveState();renderIngredients();renderCostingResults();renderDashboard()}
window.removeIngredient=removeIngredient;
function renderCostingResults(){
  const cost=calculateCosting(),pricing=calculatePricing();
  qs('#costPerPack').textContent=money(cost.costPerUnit);
  qs('#costBreakdown').innerHTML=[['วัตถุดิบต่อรอบ',cost.ingredientTotal],['ค่าใช้จ่ายอื่นต่อรอบ',cost.batchOther],['แพ็กเกจต่อแพ็ก',state.costing.packagingPerUnit],['ผลิตได้',state.costing.batchYield+' แพ็ก']].map(([l,v])=>`<div class="cost-line"><span>${l}</span><b>${typeof v==='number'?money(v):v}</b></div>`).join('');
  qs('#recommendedPrice').textContent=money(pricing.recommended);
  qs('#priceContext').innerHTML=`<span>ต่ำสุด ${money(pricing.floorRetail)}</span><span>ตลาด ${money(pricing.benchmark)}</span><span>GM ${(pricing.actualGm*100).toFixed(1)}%</span>`;
  const scenarios=[['ประหยัด',-10],['แข่งขันตรง',0],['พรีเมียม',10]];
  qs('#scenarioList').innerHTML=scenarios.map(([name,pos])=>{const p=calculatePricing(pos);return `<div class="scenario-card ${pos===num(state.trade.positionPct)?'recommended':''}"><div><div class="name">${name}</div><div class="price">${money(p.recommended)}</div></div><span class="position-chip">${pos>0?'+'+pos:pos}% ตลาด</span><div class="metrics"><span>รายรับสุทธิ<b>${money(p.netRevenue)}</b></span><span>กำไร/แพ็ก<b>${money(p.profit)}</b></span><span>GM<b>${(p.actualGm*100).toFixed(1)}%</b></span></div></div>`}).join('');
  const advice=[
    ['เส้นแดงในการต่อรอง',`ราคาปลีกไม่ควรต่ำกว่า ${money(pricing.floorRetail)} ภายใต้เงื่อนไขปัจจุบัน`],
    ['ต้นทุนหลัก',cost.ingredientTotal>cost.batchOther?'วัตถุดิบเป็นต้นทุนก้อนใหญ่ที่สุด ควรต่อรองราคาซื้อและคุมการสูญเสีย':'ค่าแรงและค่าใช้จ่ายต่อรอบสูง ควรเพิ่มจำนวนผลิตต่อรอบ'],
    ['ราคาตลาด',pricing.benchmark?`คู่แข่งเฉลี่ยตามน้ำหนัก ${state.costing.productWeight} กรัมอยู่ที่ ${money(pricing.benchmark)}`:'ยังไม่มีข้อมูลคู่แข่งเพียงพอสำหรับ Benchmark']
  ];
  qs('#pricingAdvice').innerHTML=advice.map(insightHtml).join('');
}

function openCompetitorModal(id=null){
  editingId=id;const c=id?state.competitors.find(x=>x.id===id):null;workingPhoto=c?.photo||'';
  qs('#modalTitle').textContent=id?'แก้ไขข้อมูลคู่แข่ง':'เพิ่มคู่แข่งใหม่';
  const form=qs('#competitorForm');form.reset();
  if(c){Object.entries(c).forEach(([key,value])=>{const el=form.elements[key];if(el&&el.type!=='radio')el.value=value??''});}
  renderRatings(c||{});renderPhotoPreview();qs('#competitorModal').classList.add('open');document.body.style.overflow='hidden';
}
function closeCompetitorModal(){qs('#competitorModal').classList.remove('open');document.body.style.overflow='';editingId=null;workingPhoto=''}
function renderRatings(c){
  const fields=[['packScore','แพ็กเกจ',c.packScore||3],['productScore','ความน่าซื้อ',c.productScore||3],['diffScore','ความแตกต่าง',c.diffScore||3]];
  qs('#ratingGrid').innerHTML=fields.map(([key,label,current])=>`<div class="rating-field"><span>${label}</span><div class="rating-options">${[1,2,3,4,5].map(v=>`<label><input type="radio" name="${key}" value="${v}" ${num(current)===v?'checked':''}><b>${v}</b></label>`).join('')}</div></div>`).join('');
}
function renderPhotoPreview(){
  qs('#photoPreview').innerHTML=workingPhoto?`<img src="${workingPhoto}" alt="ตัวอย่างรูปคู่แข่ง">`:'<div class="photo-placeholder"><span>▣</span><b>ถ่ายรูปสินค้าหรือชั้นวาง</b><small>กดเพื่อเปิดกล้อง หรือเลือกรูปจากเครื่อง</small></div>';
  qs('#removePhotoBtn').classList.toggle('hidden',!workingPhoto);
}
async function handlePhoto(file){
  if(!file)return;try{workingPhoto=await compressImage(file,1100,.72);renderPhotoPreview();toast('เพิ่มรูปแล้ว')}catch(e){toast('ไม่สามารถอ่านรูปนี้ได้')}
}
function compressImage(file,maxSize=1100,quality=.72){
  return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=reject;reader.onload=()=>{const img=new Image();img.onerror=reject;img.onload=()=>{let w=img.width,h=img.height;if(Math.max(w,h)>maxSize){const r=maxSize/Math.max(w,h);w=Math.round(w*r);h=Math.round(h*r)}const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.getContext('2d').drawImage(img,0,0,w,h);resolve(canvas.toDataURL('image/jpeg',quality))};img.src=reader.result};reader.readAsDataURL(file)})
}
function deleteCompetitor(id){if(!confirm('ลบข้อมูลคู่แข่งรายการนี้หรือไม่?'))return;state.competitors=state.competitors.filter(c=>c.id!==id);saveState();renderAll();toast('ลบข้อมูลแล้ว')}
window.openCompetitorModal=openCompetitorModal;window.deleteCompetitor=deleteCompetitor;
function openLightbox(id){const c=state.competitors.find(x=>x.id===id);if(!c?.photo)return;qs('#lightboxImage').src=c.photo;qs('#imageLightbox').classList.add('open')}
window.openLightbox=openLightbox;

qs('#competitorForm').addEventListener('submit',e=>{
  e.preventDefault();const obj=Object.fromEntries(new FormData(e.target).entries());
  ['weight','normalPrice','promoPrice','packScore','productScore','diffScore'].forEach(k=>obj[k]=num(obj[k]));
  if(!obj.brand||!obj.product||!obj.channel||!obj.weight||!obj.normalPrice){toast('กรอกข้อมูลที่มีเครื่องหมาย * ให้ครบ');return}
  obj.photo=workingPhoto;obj.createdAt=Date.now();
  if(editingId){const idx=state.competitors.findIndex(c=>c.id===editingId);state.competitors[idx]={...state.competitors[idx],...obj}}
  else state.competitors.unshift({id:'c'+Date.now(),...obj});
  if(saveState()){closeCompetitorModal();renderAll();toast('บันทึกคู่แข่งแล้ว')}
});

function exportData(){download('ชเจ้าสมุทร-ข้อมูลคู่แข่งและต้นทุน.json',JSON.stringify(state,null,2),'application/json')}
function exportCsv(){const header=['แบรนด์','สินค้า','ช่องทาง','ประเภท','น้ำหนัก','ราคาปกติ','ราคาโปร','ราคาที่ใช้','บาทต่อกรัม','ราคาเทียบน้ำหนักเรา','จุดขาย','ข้อสังเกต'];const rows=state.competitors.map(c=>[c.brand,c.product,c.channel,c.type,c.weight,c.normalPrice,c.promoPrice,usedPrice(c),pricePerGram(c).toFixed(2),normalizedPrice(c).toFixed(2),c.sellingPoint,c.note]);download('ชเจ้าสมุทร-สำรวจคู่แข่ง.csv','\ufeff'+[header,...rows].map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n'),'text/csv')}
function download(name,content,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),700)}
function toast(text){const el=qs('#toast');el.textContent=text;el.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.classList.remove('show'),2300)}

function renderAll(){renderDashboard();renderCompetitors();renderCostingResults()}

qs('#quickAddCompetitor').addEventListener('click',()=>{switchPage('competitors');openCompetitorModal()});
qs('#addCompetitorBtn').addEventListener('click',()=>openCompetitorModal());
qs('#closeModal').addEventListener('click',closeCompetitorModal);qs('#cancelModal').addEventListener('click',closeCompetitorModal);
qs('#competitorModal').addEventListener('click',e=>{if(e.target===qs('#competitorModal'))closeCompetitorModal()});
qs('#takePhotoBtn').addEventListener('click',()=>qs('#photoInput').click());qs('#photoPreview').addEventListener('click',()=>qs('#photoInput').click());
qs('#photoInput').addEventListener('change',e=>{handlePhoto(e.target.files?.[0]);e.target.value=''});
qs('#removePhotoBtn').addEventListener('click',()=>{workingPhoto='';renderPhotoPreview()});
qs('#closeLightbox').addEventListener('click',()=>qs('#imageLightbox').classList.remove('open'));qs('#imageLightbox').addEventListener('click',e=>{if(e.target===qs('#imageLightbox'))qs('#imageLightbox').classList.remove('open')});
['searchInput','channelFilter','typeFilter'].forEach(id=>qs('#'+id).addEventListener(id==='searchInput'?'input':'change',renderCompetitors));
qs('#addIngredientBtn').addEventListener('click',addIngredient);
qs('#resetCostingBtn').addEventListener('click',()=>{if(!confirm('เริ่มสูตรใหม่และล้างข้อมูลต้นทุนปัจจุบันหรือไม่?'))return;state.costing=JSON.parse(JSON.stringify(defaultCosting));state.trade={...defaultTrade};saveState();renderCostingForms();renderDashboard();toast('เริ่มสูตรใหม่แล้ว')});
qs('#exportBtn').addEventListener('click',exportData);qs('#csvBtn').addEventListener('click',exportCsv);
qs('#importBtn').addEventListener('click',()=>qs('#importFile').click());
qs('#importFile').addEventListener('change',async e=>{try{const data=JSON.parse(await e.target.files[0].text());state=normalizeState(data);saveState();renderCostingForms();renderAll();toast('นำเข้าข้อมูลสำเร็จ')}catch(err){toast('ไฟล์ข้อมูลไม่ถูกต้อง')}e.target.value=''});

document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeCompetitorModal();qs('#imageLightbox').classList.remove('open')}});
renderCostingForms();renderAll();switchPage('dashboard');