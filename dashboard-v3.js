(function fixLegacyEncoding(){
  const suspect=/[\u00C2\u00C3\u00E0\u00E2]/;
  function decodeText(value){
    if(!value||!suspect.test(value))return value;
    try{
      const bytes=Uint8Array.from(Array.from(value),ch=>ch.charCodeAt(0)&255);
      const decoded=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
      return /[\u0E00-\u0E7F]/.test(decoded)?decoded:value;
    }catch(e){return value}
  }
  function repair(root=document){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{const v=decodeText(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v});
    (root.querySelectorAll?root.querySelectorAll('*'):[]).forEach(el=>{
      ['title','placeholder','aria-label','alt','value','content'].forEach(name=>{
        if(el.hasAttribute&&el.hasAttribute(name)){const old=el.getAttribute(name),v=decodeText(old);if(v!==old)el.setAttribute(name,v)}
      });
    });
    if(document.title){const v=decodeText(document.title);if(v!==document.title)document.title=v}
  }
  repair(document);
  const observer=new MutationObserver(records=>records.forEach(r=>{
    if(r.type==='characterData'){const v=decodeText(r.target.nodeValue);if(v!==r.target.nodeValue)r.target.nodeValue=v}
    r.addedNodes&&r.addedNodes.forEach(n=>{if(n.nodeType===1)repair(n);else if(n.nodeType===3){const v=decodeText(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v}})
  }));
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});
})();
(function(){
  pageMeta.dashboard=['\u0E20\u0E32\u0E1E\u0E23\u0E27\u0E21\u0E18\u0E38\u0E23\u0E01\u0E34\u0E08\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E23\u0E32\u0E04\u0E32','\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E21\u0E37\u0E2D\u0E2A\u0E33\u0E23\u0E27\u0E08\u0E04\u0E39\u0E48\u0E41\u0E02\u0E48\u0E07 \u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E15\u0E49\u0E19\u0E17\u0E38\u0E19 \u0E41\u0E25\u0E30\u0E41\u0E19\u0E30\u0E19\u0E33\u0E23\u0E32\u0E04\u0E32'];

  const thaiMonths=['\u0E21\u0E01\u0E23\u0E32\u0E04\u0E21','\u0E01\u0E38\u0E21\u0E20\u0E32\u0E1E\u0E31\u0E19\u0E18\u0E4C','\u0E21\u0E35\u0E19\u0E32\u0E04\u0E21','\u0E40\u0E21\u0E29\u0E32\u0E22\u0E19','\u0E1E\u0E24\u0E29\u0E20\u0E32\u0E04\u0E21','\u0E21\u0E34\u0E16\u0E38\u0E19\u0E32\u0E22\u0E19','\u0E01\u0E23\u0E01\u0E0E\u0E32\u0E04\u0E21','\u0E2A\u0E34\u0E07\u0E2B\u0E32\u0E04\u0E21','\u0E01\u0E31\u0E19\u0E22\u0E32\u0E22\u0E19','\u0E15\u0E38\u0E25\u0E32\u0E04\u0E21','\u0E1E\u0E24\u0E28\u0E08\u0E34\u0E01\u0E32\u0E22\u0E19','\u0E18\u0E31\u0E19\u0E27\u0E32\u0E04\u0E21'];
  function setDate(){const d=new Date(),year=d.getFullYear()+543;const el=qs('#currentDate');if(el)el.textContent=`${d.getDate()} ${thaiMonths[d.getMonth()]} ${year}`}
  function cleanMoney(v){return money(v).replace('\u0E3F','')}
  function formatQty(v){return num(v).toLocaleString('th-TH',{maximumFractionDigits:2})}

  window.renderDashboard=function(){
    const comps=validCompetitors(),cost=calculateCosting(),pricing=calculatePricing(),prices=comps.map(usedPrice);
    const previous=Math.max(0,comps.length-3);
    const kpis=[
      ['\u0E04\u0E39\u0E48\u0E41\u0E02\u0E48\u0E07\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14',`${comps.length} \u0E41\u0E1A\u0E23\u0E19\u0E14\u0E4C`,comps.length>previous?`\u2191 ${comps.length-previous} \u0E08\u0E32\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E0A\u0E38\u0E14\u0E01\u0E48\u0E2D\u0E19`:'\u0E40\u0E23\u0E34\u0E48\u0E21\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E04\u0E39\u0E48\u0E41\u0E02\u0E48\u0E07'],
      ['\u0E23\u0E32\u0E04\u0E32\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E15\u0E25\u0E32\u0E14',`${cleanMoney(avg(prices))} \u0E1A\u0E32\u0E17`,`\u0E15\u0E48\u0E2D\u0E41\u0E1E\u0E47\u0E01 (${state.costing.productWeight} \u0E01\u0E23\u0E31\u0E21\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07)`],
      ['\u0E15\u0E49\u0E19\u0E17\u0E38\u0E19\u0E15\u0E48\u0E2D\u0E41\u0E1E\u0E47\u0E01 (\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19)',`${cleanMoney(cost.costPerUnit)} \u0E1A\u0E32\u0E17`,`\u0E15\u0E48\u0E2D\u0E41\u0E1E\u0E47\u0E01 (${state.costing.productWeight} \u0E01\u0E23\u0E31\u0E21)`],
      ['\u0E23\u0E32\u0E04\u0E32\u0E02\u0E32\u0E22\u0E41\u0E19\u0E30\u0E19\u0E33',`${cleanMoney(pricing.recommended)} \u0E1A\u0E32\u0E17`,`\u0E15\u0E48\u0E2D\u0E41\u0E1E\u0E47\u0E01 (${state.costing.productWeight} \u0E01\u0E23\u0E31\u0E21)`]
    ];
    qs('#kpiCards').innerHTML=kpis.map((k,i)=>`<div class="kpi-card ${i===3?'emphasis':''}"><div class="label">${k[0]}</div><div class="value">${k[1]}</div><div class="note">${i===0?'<strong>'+k[2]+'</strong>':k[2]}</div></div>`).join('');

    const recent=[...state.competitors].sort((a,b)=>num(b.createdAt)-num(a.createdAt)).slice(0,3);
    qs('#recentCompetitors').innerHTML=recent.map(c=>{
      const [position,cls]=positionName(c);
      return `<article class="dashboard-product-card"><div class="dashboard-product-image" ${c.photo?`onclick="openLightbox('${c.id}')"`:''}>${c.photo?`<img src="${c.photo}" alt="${escapeHtml(c.brand)}">`:`<div class="dashboard-product-placeholder"><span>\u25A3</span><small>\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E39\u0E1B</small></div>`}</div><div class="dashboard-product-content"><h4>${escapeHtml(c.brand)}</h4><p>${escapeHtml(c.product)}</p><span class="dashboard-channel">${escapeHtml(c.channel)}</span><div class="dashboard-product-price">${cleanMoney(usedPrice(c))} \u0E1A\u0E32\u0E17</div><div class="dashboard-product-weight">${formatQty(c.weight)} \u0E01\u0E23\u0E31\u0E21</div><div class="dashboard-tags"><span class="dashboard-tag ${cls==='premium'?'alt':''}">${position}</span><span class="dashboard-tag alt">${escapeHtml(c.type)}</span></div></div></article>`
    }).join('')+`<article class="dashboard-add-card" id="dashboardPhotoAdd"><div><div class="camera">\u25C9</div><b>\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E04\u0E39\u0E48\u0E41\u0E02\u0E48\u0E07\u0E43\u0E2B\u0E21\u0E48</b><p>\u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E39\u0E1B\u0E20\u0E32\u0E1E<br>\u0E2B\u0E23\u0E37\u0E2D\u0E16\u0E48\u0E32\u0E22\u0E23\u0E39\u0E1B\u0E17\u0E31\u0E19\u0E17\u0E35</p><button class="mini-add">\u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14 / \u0E16\u0E48\u0E32\u0E22\u0E23\u0E39\u0E1B</button></div></article>`;
    qs('#dashboardPhotoAdd')?.addEventListener('click',()=>openCompetitorModal());

    const items=state.costing.ingredients.slice(0,5);
    qs('#dashboardCostRows').innerHTML=items.map(i=>`<tr><td>${escapeHtml(i.name||'\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38')}</td><td>${formatQty(i.purchaseQty)}</td><td>${cleanMoney(i.purchasePrice)}</td><td>${formatQty(i.usageQty)}</td><td>${formatQty(i.wastePct)}%</td><td>${cleanMoney(ingredientCost(i))}</td></tr>`).join('') || '<tr><td colspan="6">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A</td></tr>';
    const perBatch=cost.ingredientTotal+cost.batchOther;
    const otherPerPack=num(state.costing.batchYield)>0?cost.batchOther/num(state.costing.batchYield):0;
    const boxes=[['\u0E15\u0E49\u0E19\u0E17\u0E38\u0E19\u0E15\u0E48\u0E2D batch',perBatch,`\u0E1C\u0E25\u0E34\u0E15\u0E44\u0E14\u0E49 ${state.costing.batchYield} \u0E41\u0E1E\u0E47\u0E01`],['\u0E15\u0E49\u0E19\u0E17\u0E38\u0E19\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A/\u0E41\u0E1E\u0E47\u0E01',num(state.costing.batchYield)>0?cost.ingredientTotal/num(state.costing.batchYield):0,`(${state.costing.productWeight} \u0E01\u0E23\u0E31\u0E21)`],['\u0E15\u0E49\u0E19\u0E17\u0E38\u0E19\u0E1A\u0E23\u0E23\u0E08\u0E38\u0E20\u0E31\u0E13\u0E11\u0E4C',num(state.costing.packagingPerUnit),'\u0E15\u0E48\u0E2D\u0E41\u0E1E\u0E47\u0E01'],['\u0E15\u0E49\u0E19\u0E17\u0E38\u0E19\u0E23\u0E27\u0E21\u0E15\u0E48\u0E2D\u0E41\u0E1E\u0E47\u0E01',cost.costPerUnit,'\u0E2B\u0E25\u0E31\u0E07\u0E02\u0E2D\u0E07\u0E40\u0E2A\u0E35\u0E22']];
    qs('#dashboardCostEquation').innerHTML=boxes.map((b,i)=>`<div class="equation-box ${i===3?'highlight':''}"><span>${b[0]}</span><strong>${cleanMoney(b[1])} \u0E1A\u0E32\u0E17</strong><small>${b[2]}</small></div>`).join('');
    qs('#dashboardCostNote').textContent=`\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38: \u0E04\u0E33\u0E19\u0E27\u0E13\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E1C\u0E25\u0E34\u0E15 ${state.costing.batchYield} \u0E41\u0E1E\u0E47\u0E01 (${state.costing.productWeight} \u0E01\u0E23\u0E31\u0E21/\u0E41\u0E1E\u0E47\u0E01) \u0E04\u0E48\u0E32\u0E43\u0E0A\u0E49\u0E08\u0E48\u0E32\u0E22\u0E2D\u0E37\u0E48\u0E19\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22 ${cleanMoney(otherPerPack)} \u0E1A\u0E32\u0E17\u0E15\u0E48\u0E2D\u0E41\u0E1E\u0E47\u0E01`;

    qs('#dashboardRecommendedPrice').textContent=`${cleanMoney(pricing.recommended)} \u0E1A\u0E32\u0E17`;
    qs('#dashboardPackLabel').textContent=`\u0E15\u0E48\u0E2D\u0E41\u0E1E\u0E47\u0E01 (${state.costing.productWeight} \u0E01\u0E23\u0E31\u0E21)`;
    const details=[['\u0E23\u0E32\u0E04\u0E32\u0E15\u0E49\u0E19\u0E17\u0E38\u0E19\u0E15\u0E48\u0E2D\u0E41\u0E1E\u0E47\u0E01',cost.costPerUnit],['\u0E23\u0E32\u0E04\u0E32\u0E02\u0E31\u0E49\u0E19\u0E15\u0E48\u0E33 (Floor Price)',pricing.floorRetail],['\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22\u0E01\u0E33\u0E44\u0E23',`${state.trade.targetGmPct}%`],['\u0E01\u0E33\u0E44\u0E23\u0E15\u0E48\u0E2D\u0E41\u0E1E\u0E47\u0E01 (\u0E42\u0E14\u0E22\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13)',pricing.profit]];
    qs('#dashboardPriceDetails').innerHTML=details.map(([l,v])=>`<div class="recommendation-row"><span>${l}</span><b>${typeof v==='number'?cleanMoney(v)+' \u0E1A\u0E32\u0E17':v}</b></div>`).join('');
    qs('#chartWeight').textContent=`(\u0E15\u0E48\u0E2D\u0E41\u0E1E\u0E47\u0E01 ${state.costing.productWeight} \u0E01\u0E23\u0E31\u0E21)`;
    renderChart(comps);
  };

  window.renderChart=function(comps){
    const el=qs('#priceChart');if(!el)return;
    const pricing=calculatePricing();
    const data=[...comps].sort((a,b)=>normalizedPrice(a)-normalizedPrice(b)).slice(0,6).map(c=>({name:c.brand,value:normalizedPrice(c),ours:false}));
    data.push({name:'\u0E0A.\u0E40\u0E08\u0E49\u0E32\u0E2A\u0E21\u0E38\u0E17\u0E23\n(\u0E41\u0E19\u0E30\u0E19\u0E33)',value:pricing.recommended,ours:true});
    data.sort((a,b)=>a.value-b.value);
    if(!data.length){el.innerHTML='<div class="empty-state">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25</div>';return}
    const max=Math.max(...data.map(d=>d.value),1)*1.16,W=720,H=235,left=42,right=18,top=20,bottom=48,innerW=W-left-right,innerH=H-top-bottom,barGap=18,barW=Math.max(28,(innerW/data.length)-barGap);
    let grid='';for(let i=0;i<=4;i++){const y=top+innerH-innerH*i/4;grid+=`<line class="chart-grid" x1="${left}" y1="${y}" x2="${W-right}" y2="${y}"/><text class="chart-label" x="${left-8}" y="${y+4}" text-anchor="end">${Math.round(max*i/4)}</text>`}
    const market=avg(comps.map(normalizedPrice));const marketY=top+innerH-(market/max*innerH);if(market)grid+=`<line x1="${left}" y1="${marketY}" x2="${W-right}" y2="${marketY}" stroke="#7d8ca0" stroke-dasharray="5 4"/><text class="chart-label" x="${W-right}" y="${marketY-5}" text-anchor="end">\u0E04\u0E48\u0E32\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E15\u0E25\u0E32\u0E14 ${Math.round(market)}</text>`;
    const bars=data.map((d,i)=>{const x=left+(i+.5)*innerW/data.length-barW/2,h=d.value/max*innerH,y=top+innerH-h;const labels=d.name.split('\n');return `<rect class="chart-bar ${d.ours?'ours':''}" x="${x}" y="${y}" width="${barW}" height="${h}" rx="4"><title>${escapeHtml(d.name)} ${money(d.value)}</title></rect><text class="chart-label" x="${x+barW/2}" y="${y-6}" text-anchor="middle" style="font-weight:700;fill:#233b5e">${Math.round(d.value)}</text>${labels.map((t,j)=>`<text class="chart-label" x="${x+barW/2}" y="${H-28+j*11}" text-anchor="middle">${escapeHtml(t).slice(0,12)}</text>`).join('')}`}).join('');
    el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${grid}${bars}</svg>`;
  };

  qs('#dashboardAddCompetitor')?.addEventListener('click',()=>openCompetitorModal());
  setDate();
  renderDashboard();
})();