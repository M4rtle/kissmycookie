(() => {
  const host=document.querySelector('#label');
  try {
    const token=location.hash.slice(1),key='kmc-label-'+token;
    const payload=JSON.parse(sessionStorage.getItem(key));sessionStorage.removeItem(key);history.replaceState(null,'',location.pathname);
    if(!payload?.order)throw new Error();
    document.documentElement.lang=payload.language;
    const {order,internal,items}=payload;
    const append=(tag,text,cls)=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;host.append(e);return e;};
    if(!internal){const logo=document.createElement('img');logo.src='/assets/logo-2026-transparent.webp';logo.alt='Kiss My Cookie';host.append(logo);append('p','KISS MY COOKIE','brand');}
    append('p','#'+order.number,'number');append('h1',order.customer);
    if(internal)append('p',new Intl.NumberFormat(payload.language,{style:'currency',currency:'EUR'}).format(items.reduce((s,i)=>s+i.quantity*i.unitCents,0)/100),'total');
    else {const ul=append('ul','');for(const item of items){const li=document.createElement('li');li.textContent=item.quantity+' × '+item.name;ul.append(li);}append('p','kissmycookie.be','brand');}
    document.querySelector('#print').addEventListener('click',async()=>{
      await Promise.all([...host.querySelectorAll('img')].map(img=>img.decode().catch(()=>{})));
      const length=Math.max(30,Math.ceil(host.getBoundingClientRect().height*25.4/96)+1);
      document.styleSheets[0].cssRules[0].style.setProperty('size','62mm '+length+'mm');
      window.print();
    });
  }catch{host.textContent='Open het label opnieuw vanuit de order. / Reopen the label from the order.';document.querySelector('#print').disabled=true;}
})();
