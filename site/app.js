const flavors=[
{id:'speculaas',name:'Speculaas',category:'classic',image:'1672670113055.jpg',tag:'Een kruidige klassieker',description:'Speculaas in twee texturen. Een zachte witte chocoladeganache met speculaas rondom een hart van speculaaspasta.',shell:'#e3d4b7',filling:'#b88d67',core:'#95603c',crumbs:'#b58a59',layers:[['De vulling','Witte chocoladeganache met speculaas'],['De kern','Speculaaspasta']]},
{id:'red-velvet',name:'Red Velvet',category:'dessert',image:'1672670113066.jpg',tag:'Zacht met karakter',description:'Een rode cacao-macaron met een zachte Macarpone-botercreme.',shell:'#ad3444',filling:'#f3e7d4',layers:[['De vulling','Macarpone-botercreme']]},
{id:'creme-brulee',name:'Crème Brûlée',category:'dessert classic',image:'1672670113076.jpg',tag:'Vanille, karamel & gebrande suiker',description:'Alles wat je zo graag proeft in crème brûlée, gevangen in één macaron.',shell:'#e6bb74',filling:'#f7e7bf',core:'#b16a28',burnt:true,layers:[['De afwerking','Gebrand met vanillesuiker'],['De vulling','Franse vanillebotercrème'],['De kern','Karamel']]},
{id:'hazelnoot',name:'Salty Sweet Hazel',category:'classic chocolate',image:'1672670113086.jpg',fillingImage:'hazelnoot-v2.png',materialImage:'hazelnoot-v2.webp',tag:'Rond, zacht & nootachtig',description:'Groene schelpen met hazelnoot-melkchocoladeganache rondom een hart van salted caramel. Voor wie van een nootje houdt.',shell:'#a9bd90',filling:'#a16c4a',core:'#b16a28',crumbs:'#ae8049',layers:[['De vulling','Hazelnoot-melkchocoladeganache'],['De kern','Salted caramel']]},
{id:'bounty',name:'Bounty',category:'chocolate',image:'bounty.png',tag:'Melkchocolade ontmoet kokos',description:'Zachte melkchocoladeganache rondom een kern van kokos.',shell:'#ddcab1',filling:'#98674d',core:'#f4e9d7',dipped:true,crumbs:'#f4e9d7',layers:[['De vulling','Melkchocoladeganache'],['De kern','Kokos']]},
{id:'lion',name:"The 'Lion'",category:'chocolate dessert',image:'lion.jpg',tag:'Melkchocolade, karamel & crunch',description:'Oranje schelpen met zachte melkchocoladeganache en een karamelkern. De bovenkant is gedipt in melkchocolade en besprenkeld met gepofte rijstkorrels.',shell:'#ed8c39',filling:'#bba083',core:'#b16f39',layers:[['De vulling','Melkchocoladeganache'],['De kern','Karamel'],['De afwerking','Bovenkant gedipt in melkchocolade met gepofte rijstkorrels']]},
{id:'pecan-pie',name:'Pecan Pie',category:'chocolate dessert',image:'photos/pecan-pie-isolated-v2.webp',ownPhotoContext:'Pecan Pie',ownPhotoAlt:'Pecan Pie-macaron met gekaramelliseerde pecannoot.',tag:'Melkchocolade, karamel & pecan',description:'Bleke schelpen met donkere melkchocoladeganache rondom een kern van karamel, samen gebrand met pecannoten. Bovenop ligt een halve pecannoot met een glad laagje gekaramelliseerde suiker.',shell:'#f1e5ce',filling:'#805039',core:'#713716',layers:[['De vulling','Melkchocoladeganache'],['De kern','Karamel, samen gebrand met pecannoten'],['De afwerking','Een halve pecannoot, gekaramelliseerd in suiker']]},
{id:'oreo',name:"The 'Oreo'",category:'chocolate dessert',image:'oreo.jpg',tag:'Oreo, botercrème & chocolade',description:'Bruin-grijze schelpen met Oreo-botercrème. Afgewerkt met een chocoladetop en Oreo-crumble.',shell:'#9d928c',filling:'#e2d9c7',crumbs:'#302522',layers:[['De vulling','Oreo-botercrème'],['De afwerking','Chocoladetop met Oreo-crumble']]},
{id:'brownie',name:'Fondant',category:'chocolate dessert',image:'m4.jpeg',tag:'Pure chocoladeverleiding',description:'Fondantganache tussen twee macaronschelpen, gedipt in fondantchocolade.',shell:'#d98484',filling:'#6d4132',dipped:true,crumbs:'#63412c',layers:[['De ganache','Fondantganache'],['De afwerking','Gedipt in fondantchocolade']]},
{id:'brownie-original',name:'Brownie',category:'chocolate dessert',image:'brownie.png',tag:'De originele chocoladeverleiding',description:'Bruine schelpen met chocoladedrizzle, fondantganache en een kern van brownie. De originele, ongedipte uitvoering.',shell:'#b58872',filling:'#6d4132',core:'#4d3028',crumbs:'#63412c',layers:[['De vulling','Fondantganache'],['De kern','Brownie'],['De afwerking','Chocoladedrizzle op bruine schelpen']]},
{id:'chunky-monkey',name:'Chunky Monkey',category:'classic chocolate',image:'chunky-monkey.png',fillingImage:'chunky-monkey-v2.png',tag:'Banaan, chocolade & walnoot',description:'Witte chocoladeganache met banaan en stukjes walnoot rondom een kern van fondant chocoladeganache.',shell:'#dacb87',filling:'#eddaa1',core:'#4d3028',chunks:true,crumbs:'#a47a4b',layers:[['De vulling','Witte chocoladeganache met banaan'],['De kern','Fondant chocoladeganache'],['De extra bite','Stukjes walnoot']]},
{id:'tiramisu',name:'Tiramisu',category:'dessert',image:'tiramisu.png',tag:'Een Italiaanse knipoog',description:'Mascarpone met een kern van boudoir, gedrenkt in koffie.',shell:'#d8b88b',filling:'#f2e3c8',core:'#97704a',crumbs:'#754c36',layers:[['De vulling','Mascarpone'],['De kern','Boudoir in koffie gedrenkt']]},
{id:'aardbei',name:'Aardbei',category:'classic',image:'m5.jpeg',tag:'Een fruitig moment',description:'Een macaron met witte chocoladeganache met aardbei, gedipt in witte aardbeichocolade en afgewerkt met gevriesdroogde aardbeistukjes. Zacht en fruitig tot de laatste hap.',shell:'#e4a99b',filling:'#eed0bb',dipped:true,crumbs:'#c96866',layers:[['De vulling','Witte chocoladeganache met aardbei'],['De afwerking','Gedipt in witte aardbeichocolade met gevriesdroogde aardbeistukjes']]},
{id:'citroen',name:'Citroen',category:'classic chocolate',image:'citroen.jpg',tag:'Fris met witte chocolade',description:'Een zonnige macaron met witte chocoladeganache met citroen. Zacht, romig en fris.',shell:'#f3d65d',filling:'#f7e4a4',crumbs:'#eac332',layers:[['De vulling','Witte chocoladeganache met citroen'],['De afwerking','Witte drizzle en citroenzeste']]},
{id:'pistache',name:'Pistache',category:'classic',image:'m3.jpeg',tag:'Een verfijnde notensmaak',description:'Een macaron gevuld met witte chocoladeganache met pistache.',shell:'#c4d0ab',filling:'#e5dfbb',crumbs:'#af9d69',layers:[['De vulling','Witte chocoladeganache met pistache']]},
{id:'dubai-pistache',name:'Dubai Pistache',category:'chocolate dessert',image:'m2.jpeg',tag:'Fondant & Dubai pistache',description:'Fondantganache rondom een vulling van Dubai pistache. Dusted with gold, darling.',shell:'#bbcb9f',filling:'#704432',core:'#b3ad6b',gold:true,layers:[['De vulling','Fondantganache'],['De kern','Dubai pistache'],['De afwerking','Subtiele gouden glans']]}];
const favoriteIds=['creme-brulee','brownie-original','tiramisu'];
const $=s=>document.querySelector(s);
const grid=$('#product-grid'),select=$('#flavor-select'),canvas=$('#macaron-canvas');
flavors.forEach((f,i)=>{const card=document.createElement('button');card.className='product';card.type='button';card.dataset.category=f.category;card.dataset.flavor=f.id;card.setAttribute('aria-label',`Ontdek ${f.name}`);card.innerHTML=`<div class="product-photo"><img src="assets/products/${f.id}.webp" alt="${f.name} macaron" width="600" height="650" loading="lazy">${favoriteIds.includes(f.id)?'<span class="product-badge">EEN FAVORIET</span>':''}</div><div class="product-caption"><h3>${f.name}</h3><p>${f.tag}</p></div>`;card.addEventListener('click',()=>{choose(f.id);$('#ontdek').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});$('#view-art').focus({preventScroll:true});});grid.append(card);select.add(new Option(f.name,f.id));});
$('[data-filter="all"] span').textContent=String(flavors.length).padStart(2,'0');
let viewer;
function sync(){if(!viewer)return;['#open-macaron','#rotate-left','#rotate-right','#tilt','#reset-view'].forEach(s=>$(s).disabled=!viewer.supported);$('#open-macaron').setAttribute('aria-pressed',String(viewer.open));$('#open-macaron').innerHTML=viewer.open?'Sluit de macaron <span>−</span>':'Ontdek de vulling <span>＋</span>';$('#tilt').value=Math.round(viewer.pitch*180/Math.PI);}
viewer=new MacaronViewer(canvas,sync);
const ownPhotoExtras={'creme-brulee':'creme-brulee-filling','hazelnoot':'hazelnoot-filling','dubai-pistache':'dubai-pistache','chunky-monkey':'chunky-monkey'};
const ownPhotoOverrides={'pecan-pie':'pecan-pie-isolated-v2','citroen':'citroen-filled-v2','pistache':'pistache-round-v2','dubai-pistache':'dubai-pistache-closed','chunky-monkey':'chunky-monkey-closed'};
const ownPhotoLabel=document.createElement('span');ownPhotoLabel.className='own-photo-label';ownPhotoLabel.textContent='Macaron';ownPhotoLabel.hidden=true;
const ownPhotoExtra=document.createElement('figure');ownPhotoExtra.className='own-photo-extra';ownPhotoExtra.hidden=true;
const ownPhotoExtraImage=document.createElement('img');ownPhotoExtraImage.width=1200;ownPhotoExtraImage.height=1000;ownPhotoExtraImage.src='assets/photos/creme-brulee-filling.webp';
const ownPhotoExtraCaption=document.createElement('figcaption');ownPhotoExtraCaption.textContent='Vulling';ownPhotoExtra.append(ownPhotoExtraImage,ownPhotoExtraCaption);

$('.canvas-wrap').append(ownPhotoLabel,ownPhotoExtra);
const fillingLabel=document.createElement('span');fillingLabel.className='filling-label';fillingLabel.textContent='Zonder bovenste schelp';fillingLabel.hidden=true;
const cutFigure=document.createElement('figure');cutFigure.className='section-photo';cutFigure.hidden=true;
const cutImage=document.createElement('img');cutImage.width=900;cutImage.height=600;cutImage.src='assets/sections/creme-brulee.webp';cutImage.alt='Dwarsdoorsnede van Crème Brûlée';
const cutCaption=document.createElement('figcaption');cutCaption.textContent='Dwarsdoorsnede';
cutFigure.append(cutImage,cutCaption);
$('.canvas-wrap').append(fillingLabel,cutFigure);
const modelShadow=document.createElement('div');modelShadow.className='model-shadow';modelShadow.setAttribute('aria-hidden','true');modelShadow.hidden=true;$('.canvas-wrap').prepend(modelShadow);

function photoMode(mode){
  const photo=mode!==false,art=mode==='art',f=flavors.find(x=>x.id===select.value)||flavors[2];
  const filling=mode==='filling'&&Boolean(f.core||f.chunks);

  canvas.hidden=photo;
  $('.canvas-wrap').classList.toggle('filling-pair',filling);
  $('.canvas-wrap').classList.toggle('is-model',!photo);
  fillingLabel.hidden=!filling;cutFigure.hidden=!filling;modelShadow.hidden=photo;
  if(filling){cutImage.src='assets/sections/'+f.id+'.webp';cutImage.alt=f.name+' verticaal doorgesneden met beide schelpen, '+f.layers.filter(x=>x[0]!=='De afwerking').map(x=>x[1]).join(' en ');}

  if(viewer.fallback)viewer.fallback.hidden=photo||viewer.supported;
  $('#reference-photo').hidden=!photo;$('#model-controls').hidden=photo;$('#drag-hint').hidden=photo;
  $('#view-model').setAttribute('aria-pressed',String(!photo));
  $('#view-photo').setAttribute('aria-pressed',String(mode===true));
  $('#view-art').setAttribute('aria-pressed',String(art));
  $('#view-filling').setAttribute('aria-pressed',String(filling));
  const extra=mode===true&&ownPhotoExtras[f.id];
  $('.canvas-wrap').classList.toggle('own-photo-pair',Boolean(extra));ownPhotoExtra.hidden=!extra;ownPhotoLabel.hidden=!extra;
  if(extra){ownPhotoExtraImage.src='assets/photos/'+extra+'.webp';ownPhotoExtraImage.alt='Open product: '+f.name+' met zichtbare vulling';}
  $('#reference-photo').src=filling?'assets/fillings/'+(f.fillingImage||f.id+'.png'):art?'assets/products/'+f.id+'.webp':'assets/photos/'+(ownPhotoOverrides[f.id]||f.id)+'.webp';
  $('#reference-photo').alt=(filling?'Voorstelling zonder bovenste schelp, met zichtbare vulling van ':art?'Voorstelling van ':'Product: ')+f.name;
  if(mode===true&&f.ownPhotoContext){$('#reference-photo').alt=f.ownPhotoAlt||f.ownPhotoContext;ownPhotoLabel.textContent=f.ownPhotoContext;ownPhotoLabel.hidden=false;}else ownPhotoLabel.textContent='Macaron';
  if(!photo)viewer.draw();
}
function choose(id){const f=flavors.find(x=>x.id===id)||flavors[2];select.value=f.id;$('#flavor-name').textContent=f.name;$('#flavor-family').textContent=favoriteIds.includes(f.id)?'Onze dessertfavoriet':'Homemade macaron';$('#flavor-description').textContent=f.description;$('#viewer-index').textContent=`${String(flavors.indexOf(f)+1).padStart(2,'0')} / ${flavors.length}`;$('#reference-photo').src=`assets/${f.image}`;$('#reference-photo').alt=`Echte productfoto van ${f.name}`;$('#filling-details').innerHTML=f.layers.map(([name,detail],i)=>`<div class="filling-row"><span class="layer-number">0${i+1}</span><div><strong>${name}</strong><p>${detail}</p></div></div>`).join('');canvas.setAttribute('aria-label',`${f.name}, draaibaar 3D-model. Pijltjestoetsen draaien; Enter opent de macaron. Vulling: ${f.layers.map(x=>x[1]).join(', ')}.`);$('#view-filling').hidden=!(f.core||f.chunks);viewer.setFlavor(f);photoMode('art');}
select.addEventListener('change',()=>choose(select.value));$('#view-model').addEventListener('click',()=>photoMode(false));$('#view-photo').addEventListener('click',()=>photoMode(true));$('#open-macaron').addEventListener('click',()=>viewer.toggle());$('#rotate-left').addEventListener('click',()=>viewer.rotate(-Math.PI/6));$('#rotate-right').addEventListener('click',()=>viewer.rotate(Math.PI/6));$('#reset-view').addEventListener('click',()=>viewer.reset());$('#tilt').addEventListener('input',e=>{viewer.pitch=Number(e.target.value)*Math.PI/180;viewer.draw();});
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});let count=0;grid.querySelectorAll('.product').forEach(card=>{const visible=button.dataset.filter==='all'||card.dataset.category.split(' ').includes(button.dataset.filter);card.hidden=!visible;if(visible)count++;});$('#filter-status').textContent=`${count} smaken zichtbaar`; }));
const menu=$('.menu-toggle'),nav=$('#navigation');function closeMenu(){menu.setAttribute('aria-expanded','false');nav.classList.remove('open');}menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){closeMenu();menu.focus();}});document.addEventListener('click',e=>{if(!e.target.closest('.header'))closeMenu();});
$('#year').textContent=new Date().getFullYear();choose('creme-brulee');

$('#view-art').addEventListener('click',()=>photoMode('art'));
$('#view-filling').addEventListener('click',()=>photoMode('filling'));


