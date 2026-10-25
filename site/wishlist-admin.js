(() => {
  'use strict';
  const q = selector => document.querySelector(selector), t = (value,params) => I18n.t(value,params);
  const storageKey = 'kissmycookie.wishlist.admin';
  const statusNames = {planned:'Gepland',baking:'Aan het bakken',stock:'Bakken klaar / voorraadverkoop',closed:'Afgesloten',ended:'Bakperiode afgelopen'};
  let key, data, busy = false, updated, selectedRound, dirtyMode = null;
  let draft = new Set(), stockDraft = new Map(), stockSnapshot = '';
  const fragment = new URLSearchParams(location.hash.slice(1));
  if (fragment.has('key')) {
    key = fragment.get('key'); history.replaceState(null,'',location.pathname);
    try { localStorage.setItem(storageKey,key); } catch { /* Works until closed. */ }
  } else { try { key = localStorage.getItem(storageKey); } catch { /* Access message below. */ } }
  const current = () => data?.rounds.find(r=>r.id === data.selected);
  const editingStatus = round => round?.state === 'ended' ? round.status : round?.state || 'planned';
  const message = value => { q('#admin-status').textContent = t(value); };
  function lock(value = busy) {
    busy = value;
    const round = current();
    q('#refresh').disabled = busy || Boolean(dirtyMode);
    q('#round-select').disabled = busy || Boolean(dirtyMode);
    q('#round-fields').disabled = busy || !round || Boolean(dirtyMode && dirtyMode !== 'round');
    q('#selection-fields').disabled = busy || !round || !['planned','baking'].includes(round.state) || Boolean(dirtyMode && dirtyMode !== 'selection');
    q('#stock-fields').disabled = busy || !round || round.status === 'closed' || Boolean(dirtyMode && dirtyMode !== 'stock');
    q('#create-round-fields').disabled = busy || Boolean(dirtyMode);
    for (const mode of ['round','selection','stock']) {
      q('#save-'+mode).disabled = busy || dirtyMode !== mode;
      q('#discard-'+mode).disabled = busy || dirtyMode !== mode;
    }
  }
  async function api(path,options = {}) {
    const response = await fetch('/api/wishlist/' + path,{...options,cache:'no-store',headers:{'Authorization':'Bearer ' + key,...options.headers}});
    if (response.status === 401) throw new Error('Deze toegangslink is ongeldig of vervangen. Open je geldige persoonlijke link.');
    if (response.status === 409) throw new Error('De bakronde of voorraad is intussen gewijzigd. Annuleer je wijzigingen en probeer opnieuw.');
    if (response.status === 400) throw new Error('Controleer de datums en aantallen. De einddatum mag niet vóór de begindatum liggen.');
    if (!response.ok) throw new Error('Het overzicht is even niet beschikbaar. Probeer opnieuw.');
    return response.json();
  }
  function stockItems() { return [...stockDraft.values()]; }
  function stockSummary() {
    const items = stockItems(), known = items.reduce((sum,item)=>sum+(item.quantity || 0),0);
    const unknown = items.filter(item=>item.available && item.quantity === null).length;
    q('#stock-summary').textContent = t('Bekende voorraad: {count}. Producten beschikbaar zonder telling: {unknown}.',{count:known,unknown}) + (dirtyMode === 'stock' ? ' '+t('Nog niet opgeslagen') : '');
  }
  function selectionState() {
    q('#selection-state').textContent = t(dirtyMode === 'selection' ? 'Nog niet gepubliceerd' : data.selection.products.length ? 'Selectie bepaald' : 'Selectie nog niet bepaald');
  }
  function render() {
    if (!data) return;
    const chosen = q('#round-select'); chosen.replaceChildren();
    data.rounds.forEach(round=>chosen.add(new Option(round.name + ' · ' + t(statusNames[round.state]) + (round.start_date ? ' · '+round.start_date : ''),round.id)));
    chosen.value = data.selected || '';
    const round = current();
    q('#round-state').textContent = round ? t(statusNames[round.state]) + (round.start_date ? ' · '+round.start_date+' – '+round.end_date : '') : t('Plan je eerste bakronde.');
    q('#visitor-count').textContent = data.visitors;
    q('#vote-count').textContent = data.counts.reduce((total,item)=>total+item.count,0);
    q('#updated').textContent = t('Laatst bijgewerkt') + ': ' + updated.toLocaleTimeString(I18n.language);
    selectionState();
    const counts = new Map(data.counts.map(item=>[item.product_id,item.count]));
    const rows = [...KMCWishlistProducts].sort((a,b)=>(counts.get(b[0])||0)-(counts.get(a[0])||0)||t(a[1]).localeCompare(t(b[1])));
    const max = Math.max(1,...counts.values()); q('#results').replaceChildren();
    for (const [id,name] of rows) {
      const tr = document.createElement('tr'), label = document.createElement('td'), value = document.createElement('td');
      label.textContent = t(name); const kind = document.createElement('small'); kind.textContent = id.startsWith('macaron:')?'Macaron':t('Cookies & sweets'); label.append(kind);
      const count = counts.get(id)||0; value.textContent = count;
      const bar = document.createElement('span'); bar.className = 'admin-meter'; bar.style.setProperty('--bar',count/max*100+'%'); bar.setAttribute('aria-hidden','true'); label.append(bar);
      const choice = document.createElement('td'), input = document.createElement('input');
      input.type = 'checkbox'; input.checked = draft.has(id);
      input.setAttribute('aria-label',t('In deze bakronde') + ': ' + t(name) + ' (' + kind.textContent + ')');
      input.addEventListener('change',()=>{
        if (input.checked) draft.add(id); else draft.delete(id);
        dirtyMode = draft.size !== data.selection.products.length || data.selection.products.some(id=>!draft.has(id)) ? 'selection' : null;
        selectionState(); lock();
      });
      choice.append(input); tr.append(label,value,choice); q('#results').append(tr);
    }
    q('#stock-results').replaceChildren();
    for (const [id,name] of KMCWishlistProducts) {
      if (!stockDraft.has(id)) continue;
      const item = stockDraft.get(id), row = document.createElement('div'); row.className = 'admin-stock-row';
      const label = document.createElement('div'); label.textContent = t(name);
      const kind = document.createElement('small'); kind.textContent = id.startsWith('macaron:')?'Macaron':t('Cookies & sweets'); label.append(kind);
      const availableLabel = document.createElement('label'), available = document.createElement('input'); available.type='checkbox'; available.checked=item.available;
      const caption = document.createElement('span'); caption.textContent=t('Gebakken en beschikbaar'); availableLabel.append(available,caption);
      available.setAttribute('aria-label',t('Gebakken en beschikbaar')+': '+t(name)+' ('+kind.textContent+')');
      const quantityLabel = document.createElement('label'), quantityCaption = document.createElement('span'), quantity = document.createElement('input');
      quantityCaption.textContent=t('Aantal (optioneel)'); quantity.type='number'; quantity.min='0'; quantity.max='100000'; quantity.step='1'; quantity.inputMode='numeric'; quantity.value=item.quantity ?? '';
      quantity.setAttribute('aria-label',t('Aantal (optioneel)')+': '+t(name)+' ('+kind.textContent+')'); quantityLabel.append(quantityCaption,quantity);
      available.addEventListener('change',()=>{item.available=available.checked;if(item.available && item.quantity===0)item.quantity=null;quantity.value=item.quantity ?? '';changed();});
      quantity.addEventListener('input',()=>{item.quantity=quantity.value==='' ? null : quantity.valueAsNumber;if(item.quantity===0)item.available=false;available.checked=item.available;changed();});
      function changed(){dirtyMode=JSON.stringify(stockItems())!==stockSnapshot?'stock':null;stockSummary();lock();}
      row.append(label,availableLabel,quantityLabel);q('#stock-results').append(row);
    }
    if (!stockDraft.size) {const note=document.createElement('p');note.textContent=t('Publiceer eerst de productselectie om voorraad in te voeren.');q('#stock-results').append(note);}
    stockSummary();q('#admin-content').hidden=false;lock();
  }
  function fillDrafts() {
    const round=current();draft=new Set(data.selection.products);
    stockDraft=new Map(data.stock.items.map(item=>[item.product,{...item}]));
    for(const id of data.selection.products)if(!stockDraft.has(id))stockDraft.set(id,{product:id,available:false,quantity:null});
    stockSnapshot=JSON.stringify(stockItems());
    q('#edit-round-name').value=round?.name || '';q('#edit-start').value=round?.start_date || '';q('#edit-end').value=round?.end_date || '';q('#edit-status').value=editingStatus(round);
  }
  async function load(round=selectedRound) {
    if(busy || dirtyMode)return;
    lock(true);
    try {data=await api('admin'+(round?'?round='+encodeURIComponent(round):''));selectedRound=data.selected;updated=new Date();fillDrafts();render();message('');}
    catch(error){message(error.message);}
    finally{lock(false);}
  }
  async function save(path,body,success) {
    if(busy)return;lock(true);let saved=false;
    try{await api(path,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});dirtyMode=null;saved=true;}
    catch(error){message(error.message);}
    finally{lock(false);}
    if(saved){await load();message(success);}
  }
  function schedule(prefix){return {name:q(prefix==='edit'?'#edit-round-name':'#round-name').value.trim(),startDate:q('#'+prefix+'-start').value,endDate:q('#'+prefix+'-end').value};}
  q('#round-fields').addEventListener('input',()=>{
    const r=current(),s=schedule('edit');dirtyMode=s.name!==r.name || s.startDate!==(r.start_date || '') || s.endDate!==(r.end_date || '') || q('#edit-status').value!==editingStatus(r)?'round':null;lock();
  });
  q('#round-form').addEventListener('submit',event=>{
    event.preventDefault();if(dirtyMode!=='round')return;
    if(q('#edit-status').value==='closed' && !confirm(t('Deze ronde definitief afsluiten? De voorraad verdwijnt van de website. De gegevens blijven bewaard.')))return;
    save('rounds',{...schedule('edit'),round:data.selected,revision:current().revision,status:q('#edit-status').value},'De bakronde is opgeslagen.');
  });
  q('#save-selection').addEventListener('click',()=>{if(dirtyMode==='selection')save('selection',{round:data.selected,revision:data.selection.revision,products:[...draft]},'De selectie is gepubliceerd op de website.');});
  q('#save-stock').addEventListener('click',()=>{
    if(dirtyMode!=='stock')return;
    if(!q('#stock-fields').reportValidity())return;
    if(stockItems().some(i=>i.quantity!==null && (!Number.isSafeInteger(i.quantity)||i.quantity<0||i.quantity>100000))){message('Controleer de datums en aantallen. De einddatum mag niet vóór de begindatum liggen.');return;}
    save('stock',{round:data.selected,revision:data.stock.revision,roundRevision:current().revision,items:stockItems()},'De voorraad is opgeslagen.');
  });
  for(const mode of ['round','selection','stock'])q('#discard-'+mode).addEventListener('click',()=>{dirtyMode=null;fillDrafts();render();load();});
  q('#round-select').addEventListener('change',event=>load(event.target.value));q('#refresh').addEventListener('click',()=>load());
  q('#create-round-form').addEventListener('submit',async event=>{
    event.preventDefault();if(busy || dirtyMode)return;lock(true);let next;
    try{next=await api('rounds',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(schedule('new'))});q('#create-round-form').reset();}
    catch(error){message(error.message);}finally{lock(false);}
    if(next)await load(next.id);
  });
  q('#copy-link').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.origin+'/opvolging#key='+encodeURIComponent(key));message('Persoonlijke link gekopieerd. Bewaar hem privé.');}catch{message('Kopiëren is niet gelukt. Gebruik je oorspronkelijke persoonlijke link.');}});
  window.addEventListener('beforeunload',event=>{if(dirtyMode){event.preventDefault();event.returnValue='';}});
  document.addEventListener('languagechange',render);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden && key)load();});
  setInterval(()=>{if(!document.hidden && key)load();},60000);
  lock(false);
  if(/^[A-Za-z0-9_-]{43,128}$/.test(key || ''))load();else message('Open je persoonlijke toegangslink om deze module op dit toestel te activeren.');
})();
