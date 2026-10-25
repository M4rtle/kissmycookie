/* The dashboard is the source for dates, lifecycle, selection and remaining stock. */
(() => {
  'use strict';
  const card = document.querySelector('#bake-round');
  if (!card) return;
  const status = card.querySelector('.bake-round-status'), countdown = card.querySelector('.bake-countdown');
  const date = card.querySelector('.bake-round-date'), title = card.querySelector('h2');
  const description = card.querySelector('.bake-round-description'), buttonText = card.querySelector('.bake-round-button-text');
  const selection = card.querySelector('.bake-round-selection'), orderIntro = document.querySelector('#order-round-intro');
  const stockNote = document.createElement('p');stockNote.className='bake-stock-note';stockNote.hidden=true;card.querySelector('.bake-round-action').append(stockNote);
  const t = (source,parameters={}) => window.I18n ? I18n.t(source,parameters) : source.replace(/\{(\w+)\}/g,(match,key)=>parameters[key] ?? match);
  let renderedCopy = '';
  function update() {
    const data=window.KMCBakeSelection,round=data?.round;
    const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Brussels',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    let state=!data ? 'loading' : !data.available ? 'unavailable' : !round ? 'ended' : round.status==='stock' || (round.end_date && round.end_date<today) ? 'stock' : round.status==='baking' || (round.start_date && round.start_date<=today) ? 'active' : 'upcoming';
    const dates=round?.start_date && round?.end_date ? new Intl.DateTimeFormat(I18n.language,{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Brussels'}).formatRange(new Date(round.start_date+'T12:00:00Z'),new Date(round.end_date+'T12:00:00Z')) : '';
    const hasStock=Boolean(data?.stock?.length);
    const copyKey=JSON.stringify([state,round,dates,today,hasStock,data?.confirmed,I18n.language]);
    if(copyKey===renderedCopy)return;
    renderedCopy=copyKey;card.dataset.state=state;
    card.closest('.bake-round-wrap').hidden=!['upcoming','active','stock'].includes(state);
    title.textContent=round?.name || t(state==='loading'?'Bakronde laden…':state==='unavailable'?'Bakrondegegevens even niet beschikbaar':'Zin in de volgende bakronde?');
    description.textContent=t(state==='stock'?'Deze producten zijn gebakken en nog beschikbaar.':state==='ended'?'Ontdek de nieuwe datums en het aanbod via WhatsApp.':'Een week vol handgemaakte macarons & sweets.');
    status.textContent=t(state==='upcoming'?'We starten over':state==='active'?'De bakronde is bezig!':state==='stock'?'Nog voorraad beschikbaar':state==='loading'?'Even geduld':state==='unavailable'?'Probeer later opnieuw':'Blijf op de hoogte');
    buttonText.textContent=t(state==='stock'?'Vraag naar de voorraad':state==='upcoming'||state==='active'?'Ik doe mee':'Houd me op de hoogte');
    date.hidden=!dates || !['upcoming','active'].includes(state);
    if(dates){const time=date.querySelector('time');time.textContent=dates;time.dateTime=round.start_date;}
    countdown.hidden=state!=='upcoming' || !round?.start_date;
    if(!countdown.hidden){const days=Math.max(1,Math.round((Date.parse(round.start_date)-Date.parse(today))/86400000));card.querySelector('[data-count=days]').textContent=String(days);card.querySelector('[data-i18n=bakeDays]').textContent=t(days===1?'dag':'dagen');}
    if(selection){
      selection.hidden=!['upcoming','active','stock'].includes(state);
      selection.querySelector('.bake-selection-status').textContent=t(state==='stock'?'De bakronde is beëindigd':data?.confirmed?'Selectie bepaald':'Selectie nog niet bepaald');
      const link=selection.querySelector('a');link.hidden=false;link.removeAttribute('data-i18n');link.textContent=t(state==='stock'?'Bekijk de beschikbare producten →':data?.confirmed?'Bekijk de bakrondeselectie →':'Stem via de wishlist →');
    }
    stockNote.hidden=!hasStock || state==='stock';stockNote.textContent=t('Er is ook nog voorraad uit een bakronde beschikbaar.');
    if(orderIntro){
      const first=state==='upcoming'?t('De volgende bakronde: {dates}.',{dates:dates || round.name}):state==='active'?t('We zijn aan het bakken! Deze bakronde: {dates}.',{dates:dates || round.name}):state==='stock'?t('De bakronde is beëindigd. Er is nog voorraad beschikbaar.'):state==='unavailable'?t('Bakrondegegevens even niet beschikbaar'):state==='loading'?t('Bakronde laden…'):t('Er is momenteel geen bakronde aangekondigd of bezig.');
      const second=t(hasStock?'Vraag via WhatsApp welke producten nog beschikbaar zijn.':'Het menu, de prijzen en hoe je bestelt? Dat delen we in onze WhatsApp-groep.');
      orderIntro.replaceChildren(document.createTextNode(first),document.createElement('br'),document.createTextNode(second));
    }
  }
  update();setInterval(update,1000);
  document.addEventListener('languagechange',update);document.addEventListener('bakeselectionchange',update);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
})();
