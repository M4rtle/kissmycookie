/* Photo-textured WebGL viewer. All assets stay local; draw only on interaction. */
class MacaronViewer {
  constructor(canvas,onChange){
    this.canvas=canvas;this.onChange=onChange;this.yaw=-.25;this.pitch=24*Math.PI/180;this.open=false;this.progress=0;this.frame=0;this.loadVersion=0;this.mesh=[];
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)');
    this.gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:true});
    this.supported=!!this.gl;
    if(this.gl)this.init();else this.showFallback();
    this.observer=new ResizeObserver(()=>this.draw());this.observer.observe(canvas.parentElement);
    let pointer=null,x=0,y=0,distance=0;
    canvas.addEventListener('pointerdown',e=>{if(e.button!==0||pointer!==null||!this.supported)return;pointer=e.pointerId;x=e.clientX;y=e.clientY;distance=0;canvas.setPointerCapture(pointer);});
    canvas.addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;const dx=e.clientX-x,dy=e.clientY-y;distance+=Math.abs(dx)+Math.abs(dy);this.yaw+=dx*.012;this.pitch=Math.max(-1.13,Math.min(1.13,this.pitch+dy*.007));x=e.clientX;y=e.clientY;this.draw();this.onChange?.();});
    canvas.addEventListener('pointerup',e=>{if(pointer!==e.pointerId)return;pointer=null;if(distance<6)this.toggle();});
    canvas.addEventListener('pointercancel',()=>pointer=null);canvas.addEventListener('lostpointercapture',()=>pointer=null);
    canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(e.key))return;e.preventDefault();if(e.key==='Enter'||e.key===' ')this.toggle();else{if(e.key==='ArrowLeft')this.yaw-=.25;if(e.key==='ArrowRight')this.yaw+=.25;if(e.key==='ArrowUp')this.pitch=Math.min(1.13,this.pitch+.12);if(e.key==='ArrowDown')this.pitch=Math.max(-1.13,this.pitch-.12);this.draw();this.onChange?.();}});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.supported=false;this.showFallback();this.onChange?.();});
    canvas.addEventListener('webglcontextrestored',()=>{this.supported=true;this.init();if(this.flavor)this.setFlavor(this.flavor);});
    this.reduced.addEventListener('change',()=>{if(this.reduced.matches){cancelAnimationFrame(this.frame);this.progress=this.open?1:0;this.draw();}});
  }
  init(){
    const gl=this.gl;
    const vertex=`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec2 aUv;attribute float aMaterial;
    uniform vec2 uRotation;uniform vec2 uScale;uniform float uOpen;uniform float uPart;uniform float uDipped;uniform vec2 uDipDirection;
    varying vec3 vNormal;varying vec3 vLocalNormal;varying vec3 vWorld;varying vec2 vUv;varying float vMaterial;
    void main(){vec3 p=aPosition;vec3 n=aNormal;
    if(uDipped>.5&&dot(p.xz,uDipDirection)>.015&&((aMaterial<1.5&&(length(p.xz)>.87||abs(p.y)>.30))||(aMaterial>3.5&&aMaterial<5.5)||(aMaterial>1.5&&aMaterial<2.5&&abs(n.y)<.65)))p+=n*.008;
    if(uPart<.5){float t=-uOpen*.10;mat2 turn=mat2(cos(t),sin(t),-sin(t),cos(t));p.xy=turn*p.xy;n.xy=turn*n.xy;p.y+=uOpen*.86;}
    float a=uRotation.x,b=uRotation.y;mat3 ry=mat3(cos(a),0.,-sin(a),0.,1.,0.,sin(a),0.,cos(a));mat3 rx=mat3(1.,0.,0.,0.,cos(b),sin(b),0.,-sin(b),cos(b));
    vec3 pos=rx*ry*p;vNormal=rx*ry*n;vLocalNormal=aNormal;vWorld=aPosition;vUv=aUv;vMaterial=aMaterial;
    pos.y-=uOpen*.31;float d=5.-pos.z;gl_Position=vec4(pos.x*uScale.x*5.,pos.y*uScale.y*5.,d*1.01005-.201005,d);}`;
    const fragment=`precision highp float;
    uniform sampler2D uTexture;uniform sampler2D uSmoothShell;uniform vec3 uShell;uniform vec3 uFilling;uniform vec3 uCore;uniform vec3 uCrumb;uniform vec3 uDipColor;uniform vec2 uDipDirection;uniform vec3 uPearl0;uniform vec3 uPearl1;uniform vec3 uPearl2;uniform float uLoaded;uniform float uDipped;uniform float uVanilla;uniform float uGold;uniform float uPhoto;uniform float uCreme;uniform float uMarble;uniform float uCocoa;uniform float uPart;
    varying vec3 vNormal;varying vec3 vLocalNormal;varying vec3 vWorld;varying vec2 vUv;varying float vMaterial;
    float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
    float footRandom(vec2 cell,float seed){float h=mod(cell.x*17.+cell.y*131.+seed*37.,251.);return mod(h*h*13.+h*17.,251.)/251.;}
    float footPore(vec2 uv){
      vec2 cell=floor(uv);float pore=0.;
      for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
        vec2 c=cell+vec2(float(i),float(j));vec2 key=vec2(mod(c.x,96.),c.y);
        vec2 center=c+.12+.76*vec2(footRandom(key,17.+uPart*9.),footRandom(key,31.+uPart*9.));
        vec2 d=(uv-center)*vec2(1.7,1.);
        float size=mix(9.,20.,footRandom(key,57.+uPart*9.));
        pore=max(pore,exp(-dot(d,d)*size)*step(.18,footRandom(key,73.+uPart*9.)));
      }
      return pore;
    }
    vec3 patch(vec2 p,vec2 corner){return texture2D(uTexture,corner+vec2(.02)+fract(p)*.46).rgb;}
    vec3 triplanar(vec2 corner,float frequency){vec3 weights=pow(abs(normalize(vLocalNormal)),vec3(6.));weights/=max(.001,weights.x+weights.y+weights.z);return patch(vWorld.yz*frequency+.23,corner)*weights.x+patch(vWorld.xz*frequency+.31,corner)*weights.y+patch(vWorld.xy*frequency+.41,corner)*weights.z;}
    // The photo atlas separates the airy feet from the smooth shell and cream.
    vec3 photoPatch(vec2 p,vec2 origin,vec2 extent){return texture2D(uTexture,origin+vec2(.006)+fract(p)*(extent-vec2(.012))).rgb;}
    vec3 photoSurface(vec3 p,float m){
      // Chunky Monkey has a smooth fondant chocolate center.
      if(m>2.5&&m<3.5&&uMarble>.5&&uMarble<1.5)return uCore;
      if(m>5.5){
        if(m<6.5)return vec3(.19,.075,.037);
        if(m<7.5)return vec3(.35,.17,.085);
        if(m<8.5)return vec3(.99,.94,.78);
        if(m<9.5)return uCrumb*(.82+fract(m)*.9)*(.91+.09*hash(floor(p*260.)));
        if(m<12.5)return vec3(.66,.36,.14);
        if(m<13.5)return vec3(1.,.97,.89);
        if(m<14.5)return vec3(.61,.39,.19);
        float groove=1.-smoothstep(.004,.018,abs((p.x-.22)*.94+(p.y+.01)*.34));
        return mix(vec3(.23,.095,.045),vec3(.065,.023,.012),groove*.80);
      }
      vec3 w=pow(abs(normalize(vLocalNormal)),vec3(6.));w/=max(.001,w.x+w.y+w.z);
      vec2 origin=vec2(.5,0.),extent=vec2(.5,.37);
      if(m>2.5&&m<3.5){origin=uCreme>.5?vec2(0.,.66):vec2(.5,.5);extent=uCreme>.5?vec2(.5,.34):vec2(.5,.5);}
      vec3 shell=photoPatch(p.yz*1.1+.23,origin,extent)*w.x+photoPatch(p.xz*1.1+.31,origin,extent)*w.y+photoPatch(p.xy*1.1+.41,origin,extent)*w.z;
      if(m<1.5){shell=texture2D(uSmoothShell,fract(p.yz*.75+.23)).rgb*w.x+texture2D(uSmoothShell,fract(p.xz*.75+.31)).rgb*w.y+texture2D(uSmoothShell,fract(p.xy*.75+.41)).rgb*w.z;if(uCreme<.5)shell=uShell*pow(clamp(dot(shell,vec3(.333))/.90,.86,1.07),.7);}
      float angle=atan(p.z,p.x)/6.2831853+.5;
      // Use the foot's own UVs so its pores keep their proportions on the thin rim.
      if(m>3.5&&m<5.5){
        // Shadows follow the recessed geometry rather than flat patches in a photo.
        float pore=m>4.5?0.:footPore(vUv);
        float micro=hash(floor(p*530.));
        // Warm baked butter-yellow, with amber shadows rather than grey cavities.
        vec3 foot=uCreme>.5?vec3(.98,.85,.57):uShell*1.04;
        return foot*(vec3(1.)-vec3(.16,.25,.38)*pore)*(.984+.016*micro);
      }
      if(m>1.5&&m<2.5){
        if(uCreme<.5)return uFilling;
        // Smooth vanilla cream with sparse, fixed seeds; no photographed piping strokes.
        vec2 surface=abs(vLocalNormal.y)>.6?p.xz*20.:vec2(angle*120.,p.y*20.);
        vec2 cell=floor(surface),local=fract(surface);
        float chance=hash(vec3(cell,13.));
        vec2 seed=vec2(.22)+vec2(hash(vec3(cell,27.)),hash(vec3(cell,41.)))*.56;
        float radius=mix(.09,.14,hash(vec3(cell,63.)));
        float spot=(1.-smoothstep(radius*.65,radius,length((local-seed)*vec2(1.,1.4))))*step(.89,chance);
        return mix(vec3(1.,.92,.73),vec3(.23,.14,.075),spot*.86);
      }
      if(m<.5){
        if(uCreme>.5){vec3 cap=texture2D(uTexture,vec2(.25,.188)+p.xz*vec2(.19,.177)).rgb;return mix(shell,cap,smoothstep(.275,.375,p.y));}
        if(uMarble>.5&&uMarble<1.5){vec3 marble=texture2D(uTexture,vec2(.25)+p.xz*.223).rgb;return mix(shell,marble,smoothstep(.275,.375,p.y));}
        if(uCocoa>.5){vec3 powder=texture2D(uTexture,vec2(.25)+p.xz*.223).rgb;return mix(shell,powder,smoothstep(.32,.44,p.y));}
        if(uGold>.5){vec3 dust=texture2D(uTexture,vec2(.25)+p.xz*.223).rgb;return mix(shell,dust,smoothstep(.32,.44,p.y));}
      }
      if(uMarble>1.5&&m<1.5)shell=triplanar(vec2(0.,.5),.45);
      return shell;
    }
    void main(){float m=vMaterial;vec2 uv=vUv;vec3 base=uShell;
    if(m>1.5&&m<2.5)base=uFilling;if(m>2.5&&m<3.5)base=uCore;
    vec3 tex=texture2D(uTexture,uv).rgb;
    if(m<.5)tex=mix(triplanar(vec2(0.,.5),1.35),tex,smoothstep(.22,.34,vWorld.y));
    if((m>.5&&m<1.5)||m>3.5)tex=triplanar(vec2(0.,.5),1.35);
    if(m>1.5&&m<2.5)tex=triplanar(vec2(.5,0.),.55);
    if(uPhoto>.5)tex=photoSurface(vWorld,m);
    base=mix(base,tex,uLoaded);
    vec3 n=normalize(vNormal);float grain=hash(floor(vWorld*460.));float fine=hash(floor(vWorld*120.));
    float rough=(m>1.5&&m<3.5)?.025:.045;if(uPhoto>.5&&m>.5&&m<1.5)rough=.009; n=normalize(n+vec3(grain-.5,fine-.5,hash(floor(vWorld.zxy*320.))-.5)*rough);
    vec3 light=normalize(vec3(-.5,.85,1.3));float diffuse=max(0.,dot(n,light));
    float edge=pow(1.-abs(n.z),2.);float spec=pow(max(0.,dot(n,normalize(light+vec3(0.,0.,1.)))),m<.5?48.:28.);
    float gloss=(m<.5?.18:.06);if(m>2.5&&m<3.5)gloss=.20;
    float occlusion=1.;if(m>1.5&&m<2.5)occlusion=.83+.17*(1.-pow(abs(vWorld.y)/.16,2.));
    vec3 color=base*(.74+.30*diffuse)*occlusion*(.982+.025*grain)+spec*gloss;
    color+=vec3(.05,.032,.015)*edge;if(uGold>.5&&m<.5)color+=spec*vec3(.19,.13,.015);
    if(uPhoto>.5){
      // Texture luminance gives the pores fine relief under moving studio light.
      vec3 dx=photoSurface(vWorld+vec3(.002,0.,0.),m)-tex;
      vec3 dz=photoSurface(vWorld+vec3(0.,0.,.002),m)-tex;
      float reliefStrength=(m>1.5&&m<2.5)||m>3.5?0.:(m>.5&&m<1.5?.08:.65);
      n=normalize(n+vec3(dot(dx,vec3(.333)),grain*.012,dot(dz,vec3(.333)))*reliefStrength);
      diffuse=max(0.,dot(n,light));
      float broad=pow(max(0.,dot(n,normalize(light+vec3(0.,0.,1.)))),32.);
      float sheen=(m<.5||m>2.5&&m<3.5)?.09:(m>1.5&&m<2.5?.055:.012);
      float contact=1.;if(m>1.5&&m<2.5)contact=.84+.16*(1.-smoothstep(.07,.18,abs(vWorld.y)));
      color=base*(.70+.31*diffuse)*contact+vec3(1.,.94,.82)*broad*sheen;
      if(m>3.5&&m<5.5)color=base*(.76+.29*diffuse)+vec3(1.,.94,.82)*broad*sheen;
      if(m>5.5){float shiny=(m<8.5||m>11.5&&m<12.5||m>15.5)? .22:.015;color=base*(.64+.40*diffuse)+vec3(1.,.94,.82)*broad*shiny;}
      if(uGold>.5&&m<.5)color+=broad*vec3(.20,.14,.015);
      bool coated=(m<1.5&&(length(vWorld.xz)>.87||abs(vWorld.y)>.30))||(m>3.5&&m<5.5)||(m>1.5&&m<2.5&&abs(vLocalNormal.y)<.65);
      if(uDipped>.5&&coated){float dip=smoothstep(.005,.025,dot(vWorld.xz,uDipDirection));float reflection=pow(max(0.,dot(n,normalize(light+vec3(0.,0.,1.)))),20.);vec3 chocolate=uDipColor*(.65+.36*diffuse)+vec3(1.,.92,.82)*reflection*.42;color=mix(color,chocolate,dip);}
      if(m<.5&&uPart<.5){
        float shadow=0.;
        if(uPearl0.z>0.)shadow=max(shadow,1.-smoothstep(uPearl0.z*.45,uPearl0.z*1.65,length(vWorld.xz-uPearl0.xy-vec2(.022,-.032))));
        if(uPearl1.z>0.)shadow=max(shadow,1.-smoothstep(uPearl1.z*.45,uPearl1.z*1.65,length(vWorld.xz-uPearl1.xy-vec2(.022,-.032))));
        if(uPearl2.z>0.)shadow=max(shadow,1.-smoothstep(uPearl2.z*.45,uPearl2.z*1.65,length(vWorld.xz-uPearl2.xy-vec2(.022,-.032))));
        color*=1.-shadow*.22;
      }
      color+=base*pow(max(0.,dot(n,normalize(vec3(.65,.25,-1.)))),2.)*.065;
    }
    gl_FragColor=vec4(clamp(color,0.,1.),1.);}`;
    const shader=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
    this.program=gl.createProgram();const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);gl.attachShader(this.program,vs);gl.attachShader(this.program,fs);gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));gl.deleteShader(vs);gl.deleteShader(fs);
    gl.useProgram(this.program);this.attrs={};for(const key of ['aPosition','aNormal','aUv','aMaterial'])this.attrs[key]=gl.getAttribLocation(this.program,key);
    this.uniforms={};for(const key of ['uRotation','uScale','uOpen','uPart','uTexture','uSmoothShell','uShell','uFilling','uCore','uLoaded','uDipped','uVanilla','uGold','uPhoto','uCreme','uMarble','uCocoa','uCrumb','uDipColor','uDipDirection','uPearl0','uPearl1','uPearl2'])this.uniforms[key]=gl.getUniformLocation(this.program,key);
    this.texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,235,205,255]));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);
    this.smoothTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.smoothTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,235,205,255]));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  }
  showFallback(){if(!this.fallback){this.fallback=document.createElement('img');this.fallback.className='webgl-fallback';this.fallback.alt='Productvoorstelling. Draaien is niet beschikbaar in deze browser.';this.canvas.after(this.fallback);}if(this.flavor)this.fallback.src='assets/products/'+this.flavor.id+'.webp';this.fallback.hidden=false;}
  color(hex){return hex.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16)/255);}
  setFlavor(flavor){cancelAnimationFrame(this.frame);this.flavor=flavor;this.open=false;this.progress=0;this.yaw=-.25;this.pitch=24*Math.PI/180;this.loaded=false;this.canvas.dataset.ready='loading';
    if(!this.supported){this.showFallback();this.onChange?.();return;}
    if(this.fallback)this.fallback.hidden=true;this.build();this.draw();const version=++this.loadVersion;
    const load=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});
    const inputs=[load('assets/materials/'+(flavor.materialImage||(flavor.id==='creme-brulee'?'creme-brulee-photo-v2':flavor.id)+'.webp'))];
    inputs.push(load('assets/materials/creme-brulee-smooth-shell-v3.webp'));
    Promise.all(inputs).then(images=>{if(version!==this.loadVersion||!this.supported)return;const gl=this.gl;images.forEach((image,index)=>{gl.activeTexture(index?gl.TEXTURE1:gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,index?this.smoothTexture:this.texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);});this.loaded=true;this.canvas.dataset.ready='true';this.draw();}).catch(()=>{if(version===this.loadVersion){this.canvas.dataset.ready='fallback';this.showFallback();}});this.onChange?.();
  }
  build(){
    const gl=this.gl;this.mesh.forEach(m=>gl.deleteBuffer(m.buffer));this.mesh=[];const arrays=[[],[],[],[]];
    const random=(x,y,seed)=>{const h=((x*17+y*131+seed*37)%251+251)%251;return (h*h*13+h*17)%251/251;};
    const poreAt=(s,t,part)=>{let pore=0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const cx=Math.floor(s)+i,cy=Math.floor(t)+j,key=(cx%96+96)%96;const dx=(s-cx-.12-.76*random(key,cy,17+part*9))*1.7,dy=t-cy-.12-.76*random(key,cy,31+part*9);if(random(key,cy,73+part*9)<.18)continue;const size=9+11*random(key,cy,57+part*9);pore=Math.max(pore,Math.exp(-(dx*dx+dy*dy)*size));}return pore;};
    const addSurface=(part,material,profile,rough=0)=>{const isPhotoFoot=material===4;const count=isPhotoFoot?576:144,rings=profile.length,points=[];
      for(let j=0;j<rings;j++)for(let i=0;i<=count;i++){const a=i/count*Math.PI*2;let [r,y]=profile[j];const t=j/(rings-1);
        if(isPhotoFoot){const pore=poreAt(i/count*96,t*2.8,part),envelope=Math.pow(Math.sin(t*Math.PI),.45);r+=envelope*(.006*Math.sin(a*71+t*9)*Math.sin(a*113-t*7)-.026*pore);y+=.004*Math.sin(a*39+part*7)+.003*Math.sin(a*83-t*3+part*11);}
        else{const wav=Math.sin(a*53+j*1.91)*Math.sin(a*79-j*.87);r+=rough*(.6+wav)*Math.min(1,r*10);y+=rough*.4*Math.sin(a*91+j*.91);}
        const x=r*Math.cos(a),z=r*Math.sin(a);let uv;
        if(isPhotoFoot)uv=[i/count*96,t*2.8];else if(material===0)uv=[.25+x*.223,.25+z*.223];else if(material===1||material===4)uv=[.02+.46*(.5+.46*Math.sin(a*1.0)),.52+.46*(.1+Math.abs(y)*1.8)% .46];else if(material===2)uv=[.52+.46*(.5+.47*Math.sin(a)),.02+.46*(.5+y*2.7)];else uv=[.75+x*.7,.75+z*.7];
        const fullerCream=true;
        const radiusScale=part===2?(fullerCream?1.09:1.045):1;const separation=fullerCream?.035:0;
        const layerY=part===0?y+.032+separation:part===1?y-.032-separation:y*(fullerCream?1.50:1.25);points.push({p:[x*radiusScale,layerY,z*radiusScale],n:[0,0,0],uv});
      }
      const indices=[];for(let j=0;j<rings-1;j++)for(let i=0;i<count;i++){const a=j*(count+1)+i,b=a+1,c=a+count+1,d=c+1;indices.push(a,c,b,b,c,d);}
      for(let i=0;i<indices.length;i+=3){const a=points[indices[i]].p,b=points[indices[i+1]].p,c=points[indices[i+2]].p,u=b.map((x,k)=>x-a[k]),v=c.map((x,k)=>x-a[k]);let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];const center=a.map((x,k)=>(x+b[k]+c[k])/3);if(n[0]*center[0]+n[2]*center[2]+n[1]*center[1]<0)n=n.map(x=>-x);for(const ix of indices.slice(i,i+3))points[ix].n=points[ix].n.map((x,k)=>x+n[k]);}
      for(const ix of indices){const v=points[ix],len=Math.hypot(...v.n)||1;arrays[part].push(...v.p,...v.n.map(x=>x/len),...v.uv,material);}
    };
    const photo=true;
    const top=[];for(let j=0;j<=38;j++){const t=j/38*Math.PI/2;top.push([Math.sin(t)*.98,(photo?.19:.165)+(photo?.30:.32)*Math.pow(Math.max(0,Math.cos(t)),photo?.62:.40)]);}addSurface(0,0,top,.0014);
    const bottom=top.map(([r,y])=>[r,-y]);
    addSurface(1,1,bottom,photo?.00045:.0016);
    // Fine irregular feet rather than broad polygonal rings.
    const foot=[];const footRings=photo?36:18;for(let j=0;j<=footRings;j++){const t=j/footRings;foot.push([.975+.014*Math.sin(t*Math.PI),(photo?.194:.17)-t*(photo?.097:.073)]);}addSurface(0,4,foot,photo?.014:.010);addSurface(1,4,foot.map(([r,y])=>[r,-y]),photo?.014:.010);
    // Small attached crumb flakes break up the rim silhouette and catch real light.
    if(photo)for(const part of [0,1])for(let k=0;k<160;k++){
      const a=(k+.15+.7*random(k,part,101))/160*Math.PI*2,t=.05+.9*random(k,part,109),sign=part===0?1:-1;
      const r=.979+.014*Math.sin(t*Math.PI)-.018*poreAt(a/(Math.PI*2)*96,t*2.8,part);
      const center=[r*Math.cos(a),sign*(.194-.097*t+.067),r*Math.sin(a)];
      const scales=[.006+.008*random(k,part,127),.005+.008*random(k,part,139),.008+.011*random(k,part,149)];
      const point=(u,v)=>{const theta=u*Math.PI*2,phi=v*Math.PI;const n=[Math.sin(phi)*Math.cos(theta),Math.cos(phi),Math.sin(phi)*Math.sin(theta)];const q=n.map((x,i)=>x*scales[i]);const p=[center[0]+q[0]*Math.cos(a)-q[2]*Math.sin(a),center[1]+q[1],center[2]+q[0]*Math.sin(a)+q[2]*Math.cos(a)];const nn=n.map((x,i)=>x/scales[i]);const normal=[nn[0]*Math.cos(a)-nn[2]*Math.sin(a),nn[1],nn[0]*Math.sin(a)+nn[2]*Math.cos(a)];const len=Math.hypot(...normal);return [...p,...normal.map(x=>x/len),a/(Math.PI*2)*96,t*2.8,5];};
      for(let j=0;j<5;j++)for(let i=0;i<8;i++){const v0=point(i/8,j/5),v1=point((i+1)/8,j/5),v2=point(i/8,(j+1)/5),v3=point((i+1)/8,(j+1)/5);arrays[part].push(...v0,...v2,...v1,...v1,...v2,...v3);}
    }
    addSurface(0,1,[[0,.101],[.25,.101],[.6,.102],[.97,.103]]);addSurface(1,1,[[0,-.101],[.25,-.101],[.6,-.102],[.97,-.103]]);
    const profile=this.flavor.core?[[.235,.09],[.29,.12],[.44,.142],[.64,.14],[.79,.115],[.865,.065],[.89,0],[.86,-.06],[.78,-.102],[.6,-.108],[.235,-.105],[.235,.09]]:[[0,.13],[.30,.14],[.60,.137],[.79,.11],[.865,.06],[.89,0],[.86,-.06],[.78,-.102],[0,-.105]];
    const smooth=[];for(let i=0;i<profile.length-1;i++){const a=profile[Math.max(0,i-1)],b=profile[i],c=profile[i+1],d=profile[Math.min(profile.length-1,i+2)];for(let k=0;k<5;k++){const t=k/5;smooth.push(b.map((x,n)=>.5*(2*x+(-a[n]+c[n])*t+(2*a[n]-5*x+4*c[n]-d[n])*t*t+(-a[n]+3*x-3*c[n]+d[n])*t*t*t)));}}smooth.push(profile[profile.length-1]);addSurface(2,2,smooth,.001);
    if(this.flavor.core)addSurface(3,3,[[0,.10],[.07,.106],[.14,.104],[.21,.096],[.24,.078],[.24,-.09],[0,-.09]],.0006);
    this.decorationCounts=window.addMacaronFinishes(arrays,this.flavor,random);
    for(let part=0;part<arrays.length;part++){if(!arrays[part].length)continue;const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arrays[part]),gl.STATIC_DRAW);this.mesh.push({buffer,count:arrays[part].length/9,part});}
  }
  toggle(){if(!this.supported)return;this.open=!this.open;this.animate();this.onChange?.();}
  animate(){cancelAnimationFrame(this.frame);const start=this.progress,target=this.open?1:0,time=performance.now();const tick=now=>{const t=this.reduced.matches?1:Math.min(1,(now-time)/750);this.progress=start+(target-start)*(1-Math.pow(1-t,3));this.draw();if(t<1)this.frame=requestAnimationFrame(tick);};this.frame=requestAnimationFrame(tick);}
  reset(){cancelAnimationFrame(this.frame);this.open=false;this.progress=0;this.yaw=-.25;this.pitch=24*Math.PI/180;this.draw();this.onChange?.();}
  rotate(delta){this.yaw+=delta;this.draw();this.onChange?.();}
  draw(){
    if(!this.supported||!this.flavor||this.canvas.hidden)return;const box=this.canvas.getBoundingClientRect();if(!box.width||!box.height)return;
    const gl=this.gl,dpr=Math.min(devicePixelRatio||1,2),w=box.width,h=box.height;if(this.canvas.width!==Math.round(w*dpr)||this.canvas.height!==Math.round(h*dpr)){this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);}gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.program);
    const scale=Math.min(w*.40,h*.43)*(1-.14*this.progress);gl.uniform2f(this.uniforms.uScale,2*scale/w,2*scale/h);gl.uniform2f(this.uniforms.uRotation,this.yaw,this.pitch);gl.uniform1f(this.uniforms.uOpen,this.progress);gl.uniform1f(this.uniforms.uLoaded,this.loaded?1:0);gl.uniform1f(this.uniforms.uDipped,this.flavor.dipped?1:0);gl.uniform1f(this.uniforms.uGold,this.flavor.gold?1:0);gl.uniform1f(this.uniforms.uPhoto,1);gl.uniform1f(this.uniforms.uCreme,this.flavor.id==='creme-brulee'?1:0);const finish=window.MacaronFinishes[this.flavor.id]||{};for(let i=0;i<3;i++){const pearl=finish.pearls?.[i];const radius=this.flavor.id==='hazelnoot'?.060:this.flavor.id==='brownie'?.096:.079;gl.uniform3fv(this.uniforms['uPearl'+i],pearl?[pearl[0],pearl[1],radius]:[0,0,0]);}gl.uniform1f(this.uniforms.uMarble,finish.marble||0);gl.uniform1f(this.uniforms.uCocoa,finish.cocoa?1:0);gl.uniform3fv(this.uniforms.uCrumb,this.color(finish.crumbColor||this.flavor.crumbs||'#b58a59'));gl.uniform2fv(this.uniforms.uDipDirection,finish.dip||[-1,0]);gl.uniform3fv(this.uniforms.uDipColor,this.color(finish.dipColor||'#482315'));gl.uniform3fv(this.uniforms.uShell,this.color(finish.shell||this.flavor.shell));gl.uniform3fv(this.uniforms.uFilling,this.color(finish.filling||this.flavor.filling));gl.uniform3fv(this.uniforms.uCore,this.color(this.flavor.core||this.flavor.filling));gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.uniform1i(this.uniforms.uTexture,0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.smoothTexture);gl.uniform1i(this.uniforms.uSmoothShell,1);
    for(const m of this.mesh){gl.bindBuffer(gl.ARRAY_BUFFER,m.buffer);let offset=0;for(const [name,size] of [['aPosition',3],['aNormal',3],['aUv',2],['aMaterial',1]]){const loc=this.attrs[name];gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,36,offset*4);offset+=size;}gl.uniform1f(this.uniforms.uPart,m.part);gl.drawArrays(gl.TRIANGLES,0,m.count);}
    this.canvas.dataset.rotation=String(this.yaw);this.canvas.dataset.open=String(this.open);
  }
}
window.MacaronViewer=MacaronViewer;
