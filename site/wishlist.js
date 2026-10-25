(() => {
  'use strict';
  const t = value => window.I18n.t(value);
  const buttons = [], selected = new Set();
  let bakeProducts = new Set(), stockProducts = new Set();
  let round, visitor, loading = false, ready = false, stored = true;
  const status = document.createElement('p');
  status.className = 'wishlist-status'; status.setAttribute('role','status');
  let statusTimer;
  new MutationObserver(()=>{
    clearTimeout(statusTimer);
    if (status.textContent) statusTimer = setTimeout(()=>{status.textContent = '';},5000);
  }).observe(status,{childList:true});
  const intro = document.createElement('aside'); intro.className = 'wishlist-intro sr-only';
  const heading = document.createElement('h3'), note = document.createElement('p'), summary = document.createElement('p');
  intro.append(heading,note,summary);
  document.querySelector('#collectie .section-heading').after(intro,status);
  const storageKey = 'kissmycookie.wishlist.visitor';
  try { visitor = localStorage.getItem(storageKey); } catch { stored = false; }
  if (!/^[a-f0-9]{64}$/.test(visitor || '')) {
    visitor = Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
  }
  const names = new Map(window.KMCWishlistProducts);
  function render() {
    heading.textContent = t('Wat bakken we de volgende keer?');
    note.textContent = t('Tik op het hartje bij je favorieten. Je geeft je voorkeur door, geen bestelling.');
    const chosen = [...selected].map(id=>t(names.get(id) || id));
    summary.textContent = chosen.length ? t('Jouw wishlist') + ': ' + chosen.join(' · ') : t('Je hebt nog geen producten gekozen.');
    for (const {button,badge,stockBadge,id:source} of buttons) {
      const id = typeof source === 'function' ? source() : source;
      badge.textContent = t(window.KMCBakeSelection?.round?.state === 'baking' ? 'Geselecteerd voor deze bakronde' : 'Geselecteerd voor de volgende bakronde');
      badge.hidden = !bakeProducts.has(id);
      stockBadge.textContent = t('Nog op voorraad');
      stockBadge.hidden = !stockProducts.has(id);
      const active = selected.has(id);
      const label = t(names.get(id) || id) + ': ' + t(active ? 'Van mijn wishlist halen' : 'Op mijn wishlist zetten');
      button.setAttribute('aria-label',label);
      button.title = label;
      button.setAttribute('aria-pressed',String(active));
      button.disabled = !ready || loading;
      const caption = button.querySelector('.wishlist-detail-caption');
      if (caption) caption.textContent = t('Deze wil ik');
    }
  }
  let selectionLoading = false;
  async function loadSelection() {
    if (selectionLoading) return;
    selectionLoading = true;
    try {
      const response = await fetch('/api/wishlist/selection',{cache:'no-store'});
      if (!response.ok) throw new Error('unavailable');
      const data = await response.json();
      const readyInRound = new Set((data.stock || []).find(item=>item.round.id === data.round?.id)?.products || []);
      bakeProducts = new Set(['planned','baking'].includes(data.round?.state) ? data.selection.products.filter(id=>!readyInRound.has(id)) : []);
      stockProducts = new Set((data.stock || []).flatMap(item=>item.products));
      window.KMCBakeSelection = {confirmed:data.selection.products.length > 0,available:true,round:data.round,stock:data.stock || []};
    } catch {
      bakeProducts.clear();
      stockProducts.clear();
      window.KMCBakeSelection = {confirmed:false,available:false};
    } finally {
      selectionLoading = false; render();
      document.dispatchEvent(new Event('bakeselectionchange'));
    }
  }
  async function load() {
    loading = true; render();
    try {
      const response = await fetch('/api/wishlist',{headers:{'X-Visitor-Id':visitor},cache:'no-store'});
      if (!response.ok) throw new Error('unavailable');
      const data = await response.json(); round = data.round;
      selected.clear(); data.selected.forEach(id=>selected.add(id)); ready = Boolean(round);
      status.textContent = stored ? '' : t('Je browser bewaart je keuzes niet na het sluiten.');
    } catch { ready = false; status.textContent = t('De wishlist is even niet beschikbaar. Probeer later opnieuw.'); }
    finally { loading = false; render(); }
  }
  async function toggle(id) {
    if (!ready || loading) return;
    // Persist an identifier only after the visitor chooses to use the wishlist.
    if (stored) try { localStorage.setItem(storageKey,visitor); } catch { stored = false; }
    loading = true; render();
    try {
      const next = !selected.has(id);
      const response = await fetch('/api/wishlist',{method:'PUT',headers:{'Content-Type':'application/json','X-Visitor-Id':visitor},body:JSON.stringify({round:round.id,product:id,selected:next})});
      if (response.status === 409) {
        await load(); status.textContent = t('Er is een nieuwe bakronde gestart. Kies opnieuw je favorieten.'); return;
      }
      if (!response.ok) throw new Error('unavailable');
      if (next) selected.add(id); else selected.delete(id);
      status.textContent = t(next ? 'Je voorkeur is doorgegeven. Dank je!' : 'Je voorkeur is verwijderd.');
    } catch { status.textContent = t('Opslaan is niet gelukt. Probeer opnieuw.'); }
    finally { loading = false; render(); }
  }
  function addButton(container,id) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'wishlist-button';
    button.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
    button.addEventListener('click',()=>toggle(typeof id === 'function' ? id() : id));
    const badge = document.createElement('span'); badge.className = 'bake-product-badge'; badge.hidden = true;
    const stockBadge = document.createElement('span'); stockBadge.className = 'bake-product-badge bake-stock-badge'; stockBadge.hidden = true;
    buttons.push({button,badge,stockBadge,id}); container.append(button,badge,stockBadge);
    return button;
  }
  // Product cards are buttons/links: use sibling controls, never nested interactive elements.
  document.querySelectorAll('#product-grid .product').forEach(card=>{
    const wrap = document.createElement('div'); wrap.className = 'wishlist-product';
    card.before(wrap); wrap.append(card); addButton(wrap,'macaron:' + card.dataset.flavor);
    new MutationObserver(()=>{ wrap.hidden = card.hidden; }).observe(card,{attributes:true,attributeFilter:['hidden']});
  });
  document.querySelectorAll('#sweets [data-sweet]').forEach(card=>{
    const wrap = document.createElement('div'); wrap.className = 'wishlist-product wishlist-sweet';
    card.before(wrap); wrap.append(card); addButton(wrap,'sweet:' + card.dataset.sweet);
  });
  // Detail controls follow both dropdown changes and collection-card navigation.
  for (const [section,select,prefix,name] of [
    ['#ontdek','#flavor-select','macaron:','#flavor-name'],
    ['#sweets-ontdek','#sweet-select','sweet:','#sweet-name']
  ]) {
    const link = document.querySelector(section + ' .flavor-detail a[href="#bestellen"]');
    if (!link) continue;
    const actions = document.createElement('div'); actions.className = 'wishlist-detail-actions';
    link.replaceWith(actions);
    const button = addButton(actions,()=>prefix + document.querySelector(select).value);
    button.classList.add('wishlist-detail-button');
    const caption = document.createElement('span'); caption.className = 'wishlist-detail-caption'; button.prepend(caption);
    document.querySelector(select).addEventListener('change',render);
    new MutationObserver(render).observe(document.querySelector(name),{childList:true,subtree:true,characterData:true});
  }
  document.addEventListener('languagechange',render);
  document.addEventListener('visibilitychange',()=>{if (!document.hidden) {if (!loading) load(); loadSelection();}});
  setInterval(()=>{if (!document.hidden) {loadSelection();if (!loading) load();}},60000);
  window.addEventListener('storage',event=>{if (event.key === storageKey) location.reload();});
  render(); load(); loadSelection();
})();
