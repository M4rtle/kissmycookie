/* Decorations are geometry attached to the correct shell, not painted into a photo. */
window.MacaronFinishes={
  speculaas:{shell:'#efdbb1',filling:'#bd874b',drizzle:6,lines:3,crumbs:55,crumbColor:'#bb8645',cluster:'center'},
  'red-velvet':{shell:'#d44550',filling:'#f5e7c9',drizzle:8,lines:6,pearls:[[-.13,.08,8],[.04,.01,8],[-.07,-.12,8]]},
  hazelnoot:{drizzle:7,lines:4,crumbs:65,crumbColor:'#c29a62',cluster:'diagonal',pearls:[[-.36,.20,12],[.26,-.24,12],[.05,.36,12]]},
  bounty:{shell:'#f0e9d6',dip:[1,0],dipColor:'#623c26',marble:2,coconut:95},
  brownie:{shell:'#f28289',dip:[-1,0],dipColor:'#482315',pearls:[[-.43,-.14,6],[-.65,.01,6],[-.40,.13,6]]},
  'brownie-original':{drizzle:6,lines:5,pearls:[[-.15,.05,6],[.015,-.015,8],[-.10,-.12,6]]},
  'chunky-monkey':{marble:1,walnuts:28},
  tiramisu:{cocoa:true,bean:true,shell:'#eee0bd'},
  aardbei:{crumbs:38,crumbColor:'#d65f63',cluster:'center'},
  pistache:{glaze:true,crumbs:65,crumbColor:'#a8a252',cluster:'stripe'},
  'dubai-pistache':{},
  'creme-brulee':{}
};
window.addMacaronFinishes=(arrays,flavor,random)=>{
  const finish=window.MacaronFinishes[flavor.id]||{},counts={pearls:0,crumbs:0,drizzles:0,coconut:0,walnuts:0,bean:0};
  const cap=(x,z)=>.257+.30*Math.pow(Math.max(0,1-(x*x+z*z)/(.98*.98)),.31);
  const push=(part,p,n,material)=>{const len=Math.hypot(...n)||1;arrays[part].push(...p,...n.map(x=>x/len),0,0,material);};
  const ellipsoid=(part,center,scale,material,seed=0,rough=0,rotation=0,lean=0)=>{
    const slices=rough?7:18,rings=rough?5:12;
    const point=(i,j)=>{const a=i/slices*Math.PI*2,b=j/rings*Math.PI,n=[Math.sin(b)*Math.cos(a),Math.cos(b),Math.sin(b)*Math.sin(a)];
      const wobble=1+rough*(random(i%slices,j,seed)-.5),q=n.map((v,k)=>v*scale[k]*wobble),nn=n.map((v,k)=>v/scale[k]);
      const c=Math.cos(rotation),s=Math.sin(rotation),lc=Math.cos(lean),ls=Math.sin(lean),qx=q[0]*c-q[2]*s,nx=nn[0]*c-nn[2]*s;return {p:[center[0]+qx*lc-q[1]*ls,center[1]+qx*ls+q[1]*lc,center[2]+q[0]*s+q[2]*c],n:[nx*lc-nn[1]*ls,nx*ls+nn[1]*lc,nn[0]*s+nn[2]*c]};};
    for(let j=0;j<rings;j++)for(let i=0;i<slices;i++){const a=point(i,j),b=point(i+1,j),c=point(i,j+1),d=point(i+1,j+1);for(const v of [a,c,b,b,c,d])push(part,v.p,v.n,material);}
  };
  const tube=(path,radius,material)=>{
    const sides=8,points=path.map((p,i)=>{const a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)],t=b.map((v,k)=>v-a[k]),tl=Math.hypot(...t);for(let k=0;k<3;k++)t[k]/=tl||1;
      let n=[-t[2],0,t[0]],nl=Math.hypot(...n);n=n.map(x=>x/(nl||1));const bin=[t[1]*n[2]-t[2]*n[1],t[2]*n[0]-t[0]*n[2],t[0]*n[1]-t[1]*n[0]];
      return Array.from({length:sides},(_,j)=>{const angle=j/sides*Math.PI*2,normal=n.map((x,k)=>x*Math.cos(angle)+bin[k]*Math.sin(angle));return {p:p.map((x,k)=>x+normal[k]*radius),n:normal};});});
    for(let i=0;i<points.length-1;i++)for(let j=0;j<sides;j++){const k=(j+1)%sides;for(const v of [points[i][j],points[i+1][j],points[i][k],points[i][k],points[i+1][j],points[i+1][k]])push(0,v.p,v.n,material);}
  };
  if(finish.drizzle)for(let line=0;line<finish.lines;line++){
    const offset=(line-(finish.lines-1)/2)*(finish.lines===3?.30:.24),path=[];
    for(let j=0;j<=140;j++){const z=-.98+j/140*1.96,x=offset+.44*z+.018*Math.sin(z*7+line);if(x*x+z*z>.975*.975)continue;path.push([x,cap(x,z)+.011,z]);}
    if(path.length>1){tube(path,finish.drizzle===8?.011:.016,finish.drizzle);counts.drizzles++;}
  }
  for(const [x,z,material] of finish.pearls||[]){const radius=flavor.id==='hazelnoot'?.060:flavor.id==='brownie'?.096:.079;ellipsoid(0,[x,cap(x,z)+radius*.79,z],[radius,radius,radius],material);counts.pearls++;}
  if(finish.glaze){
    const segments=70,width=.21;
    const vertex=(i,side)=>{const z=-.90+i/segments*1.80,limit=Math.sqrt(Math.max(0,.97*.97-z*z)),x=Math.max(-limit,Math.min(limit,-.28+.32*z+side*width+.012*Math.sin(z*13)));return [x,cap(x,z)+.009,z];};
    for(let i=0;i<segments;i++){const a=vertex(i,-1),b=vertex(i,1),c=vertex(i+1,-1),d=vertex(i+1,1);for(const p of [a,c,b,b,c,d])push(0,p,[0,1,0],8);}
  }
  for(let i=0;i<(finish.crumbs||0);i++){
    let x,z;const angle=random(i,3,41)*Math.PI*2,r=Math.sqrt(random(i,4,47));
    if(finish.cluster==='diagonal'){z=(random(i,5,53)-.5)*1.4;x=.35*z+(random(i,6,59)-.5)*.40;}
    else if(finish.cluster==='stripe'){z=(random(i,5,53)-.5)*1.25;x=-.28+.32*z+(random(i,6,59)-.5)*.28;}
    else{x=r*Math.cos(angle)*.36;z=r*Math.sin(angle)*.32;}
    const size=.012+Math.pow(random(i,7,67),2)*.044,material=9+random(i,8,71)*.20;
    ellipsoid(0,[x,cap(x,z)+size*.52,z],[size,size*.65,size*.83],material,i+19,.60,angle);counts.crumbs++;
  }
  for(let i=0;i<(finish.coconut||0);i++){
    const angle=random(i,10,79)*Math.PI*2,r=Math.sqrt(random(i,11,83))*.86,x=Math.abs(r*Math.cos(angle))+.07,z=r*Math.sin(angle);if(x*x+z*z>.91*.91)continue;
    ellipsoid(0,[x,cap(x,z)+.009,z],[.0035,.005,.017+random(i,12,89)*.016],13,i,.28,angle);counts.coconut++;
  }
  for(let i=0;i<(finish.walnuts||0);i++){
    const angle=(i+.6*random(i,13,97))/(finish.walnuts||1)*Math.PI*2,y=(random(i,14,101)-.5)*.15,r=.958;
    ellipsoid(2,[r*Math.cos(angle),y,r*Math.sin(angle)],[.018,.025,.014],14,i,.5,angle);counts.walnuts++;
  }
  if(finish.bean){
    ellipsoid(2,[.22,-.01,.952],[.15,.095,.048],16,0,0,0,.35);counts.bean=1;
  }
  return counts;
};
