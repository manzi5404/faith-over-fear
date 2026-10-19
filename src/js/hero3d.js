// F>F 3D hero — home page only. Lazy-loads pinned Three.js (r128) after first paint.
// Builds a rotating product ring from real products (newest first; repeats if < 9).
// Click a piece -> real product page. Hover -> real name + price.
// Performance: pixel-ratio cap, single loop, pause off-screen/hidden, dispose, fallback static grid.
(function(){
  const isHome = /(\/|index\.html)$/.test(window.location.pathname) && !!document.querySelector('#hero');
  if(!isHome) return;

  const API_BASE_URL = (()=>{
    const host=window.location.hostname;
    if(host==='localhost'||host==='127.0.0.1') return 'http://localhost:5000';
    return 'https://fof-backend-production.up.railway.app';
  })();

  const THREE_URL='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

  let ren=null, cam=null, sc=null, ring=null, ms=[], live=true, hov=null, rot=0, tgt=0, mx=0, my=0, disposed=false;
  const tip=document.createElement('div');
  tip.id='tip';
  tip.style.cssText='position:fixed;z-index:30;pointer-events:none;background:var(--fg);color:var(--bg);padding:8px 12px;font-size:13px;font-weight:600;border-radius:2px;opacity:0;transition:opacity .15s;transform:translate(-50%,-100%);';
  document.body.appendChild(tip);

  const hero=document.querySelector('#hero');
  const canvas=document.createElement('canvas');
  canvas.id='gl';
  canvas.setAttribute('aria-label','Rotating 3D gallery of Faith Over Fear pieces. Drag to spin.');
  canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;touch-action:pan-y;cursor:grab;display:block;';
  hero.appendChild(canvas);

  const rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  const lowEnd=navigator.hardwareConcurrency<=4||navigator.deviceMemory<=4;
  const dataSaver=navigator.connection&&navigator.connection.saveData;

  function dispose(){
    if(disposed) return;
    disposed=true;
    try{
      if(ren){ ren.renderLists&&ren.renderLists.dispose(); }
      (ms||[]).forEach(m=>{
        if(m.material){ if(m.material.map){m.material.map.dispose();} m.material.dispose(); }
        if(m.geometry){m.geometry.dispose();}
      });
      if(ring){ ring.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material){ if(o.material.map) o.material.map.dispose(); if(Array.isArray(o.material)) o.material.forEach(mat=>mat.dispose()); else o.material.dispose();} }); }
      if(sc){ sc.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material){ if(o.material.map) o.material.map.dispose(); if(Array.isArray(o.material)) o.material.forEach(mat=>mat.dispose()); else o.material.dispose();} }); }
      if(ren) ren.dispose();
    }catch(e){ console.warn('3D dispose error', e); }
  }

  function stopLoop(){ live=false; dispose(); }

  new IntersectionObserver(es=>{ live=es[0].isIntersecting && !disposed; },{root:null,threshold:0}).observe(hero);
  window.addEventListener('visibilitychange',()=>{ live=!document.hidden && !disposed; });
  window.addEventListener('pagehide',stopLoop);

  function fallbackGrid(products, headline, shopUrl){
    canvas.style.display='none';
    document.body.classList.add('nogl');
    const wrap=document.createElement('div');
    wrap.className='hero-fallback';
    wrap.style.cssText='position:absolute;inset:0;background:#000;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:28px;text-align:center;font-family:Instrument Sans,sans-serif;';
    const h=document.createElement('h2'); h.style.cssText='font-family:Anton,Impact,sans-serif;font-size:clamp(40px,10vw,110px);line-height:.85;margin:0;text-transform:uppercase;'; h.textContent=headline||'Faith Over Fear';
    wrap.appendChild(h);
    const p=document.createElement('p'); p.style.cssText='color:#bdbdbd;max-width:34ch;margin:0;'; p.textContent='Rotate the gallery to explore the drop.'; wrap.appendChild(p);
    const grid=document.createElement('div'); grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:16px;max-width:700px;width:100%;';
    (products||[]).forEach(pr=>{
      const a=document.createElement('a');
      a.href='/product.html?id='+(pr.id||'');
      a.style.cssText='display:block;aspect-ratio:1;background:#111;border:1px solid #262626;overflow:hidden;';
      const img=document.createElement('img'); img.src=pr.img||'/placeholder.jpg'; img.alt=pr.name||'product'; img.style.cssText='width:100%;height:100%;object-fit:cover;display:block;loading="lazy";decoding="async";width="512";height="512";';
      img.setAttribute('width','512'); img.setAttribute('height','512'); img.setAttribute('loading','lazy'); img.setAttribute('decoding','async');
      a.appendChild(img);
      const n=document.createElement('div'); n.style.cssText='margin-top:8px;font-weight:600;font-size:13px;letter-spacing:.14em;text-transform:uppercase;'; n.textContent=pr.name||'';
      const wrapItem=document.createElement('div'); wrapItem.style.cssText='display:flex;flex-direction:column;align-items:center;gap:4px;'; wrapItem.appendChild(a); wrapItem.appendChild(n); grid.appendChild(wrapItem);
    });
    wrap.appendChild(grid);
    const b=document.createElement('a'); b.href=shopUrl||'/shop.html'; b.style.cssText='display:inline-block;background:#fff;color:#000;border:0;font-weight:600;font-size:13px;letter-spacing:.14em;text-transform:uppercase;padding:15px 26px;border-radius:2px;margin-top:16px;text-decoration:none;'; b.textContent='Shop '+((headline&&headline!=='Faith Over Fear')?headline:'The Drop'); wrap.appendChild(b);
    hero.appendChild(wrap);
  }

  function loadThree(){
    const s=document.createElement('script');
    s.src=THREE_URL;
    s.onload=()=>fetchProductsAndInit();
    s.onerror=()=>{ try{ fetchProductsAndInitFallback(); }catch(e){} };
    document.head.appendChild(s);
  }

  async function fetchProductsAndInitFallback(){
    try{
      const res=await fetch(API_BASE_URL+'/api/drops?includeProducts=true&type=new-drop');
      const data=await res.json();
      const drops=data.success&&data.drops?data.drops:[];
      const prods=[];
      drops.forEach(d=>{ if(d.products&&Array.isArray(d.products)) d.products.forEach(p=>prods.push({id:p.id,name:p.name,price:p.price,img:(p.images&&p.images[0])||(p.image||'/placeholder.jpg'),url:'/product.html?id='+p.id})); });
      const headline=(drops[0]&&drops[0].title)||'Faith Over Fear';
      fallbackGrid(prods, headline, '/shop.html');
    }catch(e){ fallbackGrid([],'Faith Over Fear','/shop.html'); }
  }

  async function fetchProductsAndInit(){
    try{
      const res=await fetch(API_BASE_URL+'/api/drops?includeProducts=true&type=new-drop');
      const data=await res.json();
      const drops=data.success&&data.drops?data.drops:[];
      let products=[];
      drops.forEach(d=>{ if(d.products&&Array.isArray(d.products)) d.products.forEach(p=>products.push({id:p.id,name:p.name,price:p.price,img:(p.images&&p.images[0])||(p.image||'/placeholder.jpg'),url:'/product.html?id='+p.id})); });
      // newest first: API order is newest-first; take up to 9, repeat if fewer than 9
      const base=products.slice();
      const items=[];
      if(base.length){ while(items.length<9){ items.push(...base.slice()); } items.length=9; }
      const headline=(drops[0]&&drops[0].title)||'Faith Over Fear';
      buildRing(items, headline);
    }catch(e){
      fetchProductsAndInitFallback();
    }
  }

  function buildRing(items, headline){
    if(disposed||!window.THREE) return;
    const THREE=window.THREE;
    const cv=canvas, heroEl=hero;
    try{ ren=new THREE.WebGLRenderer({canvas:cv,antialias:true}); }catch(e){ document.body.classList.add('nogl'); fetchProductsAndInitFallback(); return; }
    const dpr=Math.min(window.devicePixelRatio||1, (window.innerWidth<=760||rm||lowEnd||dataSaver)?1.5:2);
    ren.setPixelRatio(dpr);
    ren.outputEncoding=THREE.sRGBEncoding;
    sc=new THREE.Scene(); sc.fog=new THREE.Fog(0x000000,10,26);
    cam=new THREE.PerspectiveCamera(50,1,.1,60);
    ring=new THREE.Group(); sc.add(ring);
    const R=7, N=9, ld=new THREE.TextureLoader();
    ld.crossOrigin='anonymous';
    const txs=[];
    const imgs=items.map(it=>it.img);
    imgs.forEach(src=>{ const t=ld.load(src); t.encoding=THREE.sRGBEncoding; txs.push(t); });
    ms=[];
    for(let i=0;i<N;i++){
      const a=i/N*Math.PI*2;
      const m=new THREE.Mesh(new THREE.PlaneGeometry(3.4,3.4), new THREE.MeshBasicMaterial({map:txs[i%txs.length]}));
      m.position.set(Math.sin(a)*R,0,Math.cos(a)*R); m.rotation.y=a;
      m.userData={i:i%items.length, s:1, url:items[i%items.length].url, name:items[i%items.length].name, price:items[i%items.length].price};
      ring.add(m); ms.push(m);
    }
    [-2.4,2.4].forEach(y=>{
      const p=[]; for(let i=0;i<=120;i++){ const a=i/120*Math.PI*2; p.push(new THREE.Vector3(Math.sin(a)*R,y,Math.cos(a)*R)); }
      ring.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), new THREE.LineBasicMaterial({color:0x4a4a4a})));
    });
    const d=[]; for(let i=0;i<500;i++) d.push((Math.random()-.5)*34,(Math.random()-.5)*12,(Math.random()-.5)*34);
    const dg=new THREE.BufferGeometry(); dg.setAttribute('position',new THREE.Float32BufferAttribute(d,3));
    sc.add(new THREE.Points(dg, new THREE.PointsMaterial({color:0x888888,size:.04})));

    function size(){ const w=heroEl.clientWidth, h=heroEl.clientHeight; if(!w) return; ren.setSize(w,h,false); cam.aspect=w/h; cam.position.z=w/h<.9?17:12.5; cam.updateProjectionMatrix(); }
    window.addEventListener('resize',size,{passive:true});
    size();

    const ray=new THREE.Raycaster(), mv=new THREE.Vector2(9,9);
    let drag=false, lx=0, lastY=window.scrollY||0;
    cv.addEventListener('pointerdown',e=>{ drag=true; lx=e.clientX; cv.setPointerCapture(e.pointerId); },{passive:false});
    cv.addEventListener('pointerup',()=>drag=false);
    cv.addEventListener('pointerleave',()=>{ mv.set(9,9); hov=null; tip.style.opacity=0; });
    cv.addEventListener('pointermove',e=>{
      const r=cv.getBoundingClientRect();
      mv.set((e.clientX-r.left)/r.width*2-1, -((e.clientY-r.top)/r.height)*2+1);
      mx=mv.x; my=mv.y;
      tip.style.left=e.clientX+14+'px'; tip.style.top=e.clientY+14+'px';
      if(drag){ tgt+=(e.clientX-lx)*.006; lx=e.clientX; }
    },{passive:false});
    cv.addEventListener('click',e=>{
      if(hov&&Math.abs(e.clientX-lx)<4){ window.location.href=hov.userData.url; }
    });
    window.addEventListener('scroll',()=>{ tgt+=(window.scrollY-lastY)*.004; lastY=window.scrollY; },{passive:true});

    // Headline overlay (real current drop name + shop button)
    const overlay=document.createElement('div');
    overlay.className='hl';
    overlay.style.cssText='position:absolute;left:26px;bottom:44px;color:#fff;pointer-events:none;z-index:2;';
    const h1=document.createElement('h1'); h1.style.cssText='font-size:clamp(88px,16vw,230px);line-height:.82;margin:0;font-family:Anton,Impact,sans-serif;text-transform:uppercase;';
    h1.textContent=headline;
    const p=document.createElement('p'); p.style.cssText='margin:16px 0 22px;max-width:30ch;color:#bdbdbd;font-family:Instrument Sans,sans-serif;'; p.textContent='The new drop. Faith apparel rooted in Scripture, made in Kigali.';
    const btn=document.createElement('a'); btn.href='/shop.html'; btn.className='btn'; btn.style.cssText='background:#fff;color:#000;'; btn.textContent='Shop '+headline;
    overlay.appendChild(h1); overlay.appendChild(p); overlay.appendChild(btn);
    heroEl.appendChild(overlay);
    const hint=document.createElement('div'); hint.className='hint'; hint.textContent='Drag to spin'; hint.style.cssText='position:absolute;right:26px;bottom:44px;color:#8a8a8a;font-size:13px;z-index:2;pointer-events:none;font-family:Instrument Sans,sans-serif;'; heroEl.appendChild(hint);

    function loop(){
      if(disposed) return;
      requestAnimationFrame(loop);
      if(!live) return;
      if(!rm&&!drag) tgt+=.0016;
      rot+=(tgt-rot)*.07; ring.rotation.y=rot;
      cam.position.x+=(mx*1.1-cam.position.x)*.05; cam.position.y+=(.3+my*.5-cam.position.y)*.05; cam.lookAt(0,0,0);
      ray.setFromCamera(mv,cam); const h=ray.intersectObjects(ms)[0]; const nh=h?h.object:null;
      if(nh!==hov){
        hov=nh;
        if(nh){ tip.textContent=nh.userData.name+' | '+(nh.userData.price==null?'Price to be added':nh.userData.price.toLocaleString()+' FRW'); tip.style.opacity=1; cv.style.cursor='pointer'; }
        else{ tip.style.opacity=0; cv.style.cursor=''; }
      }
      ms.forEach(m=>{ const s=m===hov?1.12:1; m.userData.s+=(s-m.userData.s)*.12; m.scale.setScalar(m.userData.s); });
      ren.render(sc,cam);
    }
    loop();
  }

  (window.requestIdleCallback?cb=>window.requestIdleCallback(cb,{timeout:1500}):cb=>setTimeout(cb,0))(loadThree);
})();
