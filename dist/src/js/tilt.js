// F>F card tilt — mouse/trackpad only ((hover: hover)), transform-only,
// off for prefers-reduced-motion. Tilts the card under the cursor toward it.
(function(){
  const hoverMq=window.matchMedia('(hover: hover)');
  const rm=window.matchMedia('(prefers-reduced-motion: reduce)');
  if(!hoverMq.matches||rm.matches) return;
  const els=Array.from(document.querySelectorAll('[data-tilt]'));
  if(!els.length) return;
  let raf;
  function loop(){
    raf=requestAnimationFrame(loop);
    els.forEach(el=>{
      const rx=parseFloat(el.dataset.tiltRx||0), ry=parseFloat(el.dataset.tiltRy||0);
      if(rx||ry) el.style.transform='rotateX('+rx+'deg) rotateY('+ry+'deg)';
      else el.style.transform='';
    });
  }
  loop();
  document.addEventListener('mousemove',e=>{
    let under=null;
    for(const el of els){
      const r=el.getBoundingClientRect();
      if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom){ under=el; break; }
    }
    for(const el of els){
      if(el!==under){ el.dataset.tiltRx=0; el.dataset.tiltRy=0; continue; }
      const r=el.getBoundingClientRect();
      const dx=(e.clientX-(r.left+r.width/2))/(r.width/2);
      const dy=(e.clientY-(r.top+r.height/2))/(r.height/2);
      el.dataset.tiltRx=String(Math.max(-8,Math.min(8,-dy*8)));
      el.dataset.tiltRy=String(Math.max(-12,Math.min(12,dx*12)));
    }
  },{passive:true});
  document.addEventListener('mouseleave',()=>{ els.forEach(el=>{ el.dataset.tiltRx=0; el.dataset.tiltRy=0; }); });
  els.forEach(el=>{ el.addEventListener('mouseleave',()=>{ el.dataset.tiltRx=0; el.dataset.tiltRy=0; }); });
  hoverMq.addEventListener('change',()=>{ if(!hoverMq.matches){ els.forEach(el=>{ el.dataset.tiltRx=0; el.dataset.tiltRy=0; el.style.transform=''; }); if(raf) cancelAnimationFrame(raf); } });
})();
