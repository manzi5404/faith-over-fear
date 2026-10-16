# Reference Code for the F>F 3D Redesign

These snippets come from the working demo (`ff_3d_site.html`). They are the visual and 3D reference. Treat them as a starting point to adapt to the real site, not code to paste blindly.

## A. Reference CSS (layout, rail nav, tilt cards, page entrance)

Look especially at: `.rail` (left nav, horizontal text), `.top` (cart), `#ov` (mobile menu), `#hero` and `#gl` (3D canvas), `.card` (tilt), `.pimg` (product image tilt), `.pg` and `@keyframes pin` (page entrance).

```css
:root{--bg:#fff;--fg:#0a0a0a;--mu:#6b6b6b;--ln:#e2e2e2;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0a0a0a;--fg:#f2f2f2;--mu:#8c8c8c;--ln:#262626}}
:root[data-theme="dark"]{--bg:#0a0a0a;--fg:#f2f2f2;--mu:#8c8c8c;--ln:#262626}
html{scroll-padding-top:env(safe-area-inset-top,0px)}
*{box-sizing:border-box;margin:0}[hidden]{display:none!important}
body{background:var(--bg);color:var(--fg);font:400 16px/1.55 "Instrument Sans",system-ui,sans-serif;overflow-x:hidden}
a{color:inherit;text-decoration:none}button{font:inherit;color:inherit;cursor:pointer}
.d{font-family:Anton,Impact,sans-serif;font-weight:400}
.rail{position:fixed;z-index:20;left:0;top:0;bottom:0;width:210px;display:flex;flex-direction:column;padding:calc(26px + env(safe-area-inset-top,0px)) 28px 26px;color:#fff;mix-blend-mode:difference}
.logo{font:400 30px/1 Anton,Impact,sans-serif;letter-spacing:.02em}
.rail nav{display:flex;flex-direction:column;gap:14px;margin-top:56px}
.rail nav a{font-weight:600;font-size:13px;letter-spacing:.14em;text-transform:uppercase;opacity:.65;width:max-content}
.rail nav a.on,.rail nav a:hover{opacity:1}
.rail small{margin-top:auto;font-size:12px;opacity:.6}
#mb{display:none}
.top{position:fixed;z-index:20;right:0;top:0;padding:calc(26px + env(safe-area-inset-top,0px)) 28px 0;color:#fff;mix-blend-mode:difference}
.top a,.top button{background:none;border:0;font-weight:600;font-size:13px;letter-spacing:.14em;text-transform:uppercase}
#ov{position:fixed;inset:0;z-index:25;background:#000;color:#fff;padding:calc(24px + env(safe-area-inset-top,0px)) 24px 24px;display:flex;flex-direction:column;gap:6px}
#ov button{align-self:flex-end;background:none;border:0;color:#fff;font-weight:600;letter-spacing:.14em;text-transform:uppercase;padding:8px 0 20px}
#ov a{font:400 44px/1.15 Anton,Impact,sans-serif;text-transform:uppercase}
:focus-visible{outline:2px solid currentColor;outline-offset:3px}
main{margin-left:210px;min-height:100vh}
.pg{padding:130px 40px 80px;max-width:1300px;animation:pin .55s ease-out}@keyframes pin{from{opacity:0;transform:perspective(900px) rotateX(7deg) translateY(28px)}to{opacity:1;transform:none}}
h1,h2{font:400 clamp(44px,7vw,104px)/.9 Anton,Impact,sans-serif;text-transform:uppercase;margin-bottom:32px}
h3{font:600 14px/1.3 "Instrument Sans";letter-spacing:.14em;text-transform:uppercase;margin:36px 0 12px}
p{color:var(--mu);max-width:60ch;margin-bottom:16px}
#hero{position:relative;height:100vh;height:100svh;min-height:560px;background:#000;overflow:hidden}
#gl{position:absolute;inset:0;width:100%;height:100%;touch-action:pan-y;cursor:grab}
.hl{position:absolute;left:26px;bottom:44px;color:#fff;pointer-events:none;z-index:2}
.hl h1{font-size:clamp(88px,16vw,230px);line-height:.82;margin:0}
.hl p{margin:16px 0 22px;max-width:30ch;color:#bdbdbd}
.btn{display:inline-block;background:var(--fg);color:var(--bg);border:0;font-weight:600;font-size:13px;letter-spacing:.14em;text-transform:uppercase;padding:15px 26px;border-radius:2px;pointer-events:auto}
.hl .btn{background:#fff;color:#000}
.btn.o{background:none;color:var(--fg);border:1px solid var(--fg)}
.hint{position:absolute;right:26px;bottom:44px;color:#8a8a8a;font-size:13px;z-index:2;pointer-events:none}
#tip{position:fixed;z-index:30;pointer-events:none;background:#fff;color:#000;padding:8px 12px;font-size:13px;font-weight:600;border-radius:2px;opacity:0;transition:opacity .15s}
.nogl #hero{background:radial-gradient(circle at 70% 40%,#222,#000 70%)}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
.card{display:block;perspective:900px}
.card .im{aspect-ratio:1;background:#000;overflow:hidden;transition:transform .2s ease-out;transform:rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))}
.card img,.pimg img{width:100%;height:100%;object-fit:cover;display:block}.pimg img{transition:transform .2s ease-out}
.card b{display:block;margin-top:14px;font-weight:600}.card span{color:var(--mu);font-size:14px}
.ban{width:100%;display:block;margin:8px 0 32px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:48px}
.pimg{aspect-ratio:1;background:#000}
.row{display:flex;gap:10px;flex-wrap:wrap;margin:8px 0 22px}
.chip{min-width:46px;height:44px;padding:0 14px;background:none;border:1px solid var(--ln);border-radius:2px}
.chip.on{background:var(--fg);color:var(--bg);border-color:var(--fg)}
.price{font:400 28px Anton,Impact,sans-serif;margin-bottom:12px}
label{display:block;font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;margin:18px 0 6px}
input,textarea{width:100%;font:inherit;color:var(--fg);background:none;border:1px solid var(--ln);border-radius:2px;padding:14px}
ul.l{padding-left:20px;color:var(--mu);margin-bottom:16px}ul.l li{margin-bottom:8px}
.cr{display:flex;justify-content:space-between;gap:16px;padding:16px 0;border-bottom:1px solid var(--ln)}
.note{margin-top:14px;color:var(--mu);font-size:14px;min-height:1.4em}
footer{margin-left:210px;border-top:1px solid var(--ln);padding:40px;display:flex;flex-wrap:wrap;gap:32px 72px;color:var(--mu);font-size:14px}
footer b{display:block;color:var(--fg);margin-bottom:4px}
@media(max-width:760px){
.rail{right:0;width:auto;height:64px;bottom:auto;flex-direction:row;align-items:center;justify-content:space-between;padding:env(safe-area-inset-top,0px) 20px 0}
.rail nav,.rail small{display:none}#mb{display:block;background:none;border:0;color:#fff;font-weight:600;font-size:13px;letter-spacing:.14em;text-transform:uppercase;margin-right:78px}
.top{padding:calc(21px + env(safe-area-inset-top,0px)) 20px 0}
main,footer{margin-left:0}.pg{padding:96px 20px 56px}.grid,.two{grid-template-columns:1fr}.two{gap:24px}
.hl{left:20px;bottom:36px}.hint{display:none}footer{padding:36px 20px 56px}}
@media(prefers-reduced-motion:reduce){.card .im,.pimg img{transition:none}.pg{animation:none}}
```

## B. Reference 3D hero (Three.js r128, the rotating ring of products)

Adapt these three things to the real site:
1. `P` is the products array (`{n: name, p: price}`) and `fm` formats a price. Build the ring from the REAL products and their real image URLs.
2. `$` is just `document.querySelector`.
3. The click handler sets `location.hash`. Replace it with navigation to the real product page URL.

```js
(function(){
const cv=$("#gl"),hero=$("#hero"),tip=$("#tip");
let ren;try{ren=new THREE.WebGLRenderer({canvas:cv,antialias:true})}catch(e){document.body.classList.add("nogl");return}
ren.setPixelRatio(Math.min(devicePixelRatio,2));ren.outputEncoding=THREE.sRGBEncoding;
const sc=new THREE.Scene();sc.fog=new THREE.Fog(0x000000,10,26);
const cam=new THREE.PerspectiveCamera(50,1,.1,60);const ring=new THREE.Group();sc.add(ring);
const R=7,N=9,ld=new THREE.TextureLoader(),ms=[];
const tx=IM.map(s=>{const t=ld.load(s);t.encoding=THREE.sRGBEncoding;return t});
for(let i=0;i<N;i++){const a=i/N*Math.PI*2,m=new THREE.Mesh(new THREE.PlaneGeometry(3.4,3.4),new THREE.MeshBasicMaterial({map:tx[i%3]}));m.position.set(Math.sin(a)*R,0,Math.cos(a)*R);m.rotation.y=a;m.userData.k=i%3;m.userData.s=1;ring.add(m);ms.push(m)}
[-2.4,2.4].forEach(y=>{const p=[];for(let i=0;i<=120;i++){const a=i/120*Math.PI*2;p.push(new THREE.Vector3(Math.sin(a)*R,y,Math.cos(a)*R))}ring.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p),new THREE.LineBasicMaterial({color:0x4a4a4a})))});
const d=[];for(let i=0;i<500;i++)d.push((Math.random()-.5)*34,(Math.random()-.5)*12,(Math.random()-.5)*34);
const dg=new THREE.BufferGeometry();dg.setAttribute("position",new THREE.Float32BufferAttribute(d,3));sc.add(new THREE.Points(dg,new THREE.PointsMaterial({color:0x888888,size:.04})));
const rm=matchMedia("(prefers-reduced-motion:reduce)").matches;
let tgt=0,rot=0,mx=0,my=0,drag=false,lx=0,lastY=scrollY,live=true,hov=null;
const ray=new THREE.Raycaster(),mv=new THREE.Vector2(9,9);
function size(){const w=hero.clientWidth,h=hero.clientHeight;if(!w)return;ren.setSize(w,h,false);cam.aspect=w/h;cam.position.z=w/h<.9?17:12.5;cam.updateProjectionMatrix()}
addEventListener("resize",size);
cv.addEventListener("pointerdown",e=>{drag=true;lx=e.clientX;cv.setPointerCapture(e.pointerId)});
cv.addEventListener("pointerup",()=>drag=false);
cv.addEventListener("pointermove",e=>{const r=cv.getBoundingClientRect();mv.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);mx=mv.x;my=mv.y;if(drag){tgt+=(e.clientX-lx)*.006;lx=e.clientX}tip.style.left=e.clientX+14+"px";tip.style.top=e.clientY+14+"px"});
cv.addEventListener("pointerleave",()=>{mv.set(9,9);hov=null;tip.style.opacity=0});
cv.addEventListener("click",e=>{if(hov&&Math.abs(e.clientX-lx)<4)location.hash="#/product/"+hov.userData.k});
addEventListener("scroll",()=>{tgt+=(scrollY-lastY)*.004;lastY=scrollY},{passive:true});
new IntersectionObserver(e=>live=e[0].isIntersecting).observe(hero);
function loop(){requestAnimationFrame(loop);if(!live)return;
if(!rm&&!drag)tgt+=.0016;rot+=(tgt-rot)*.07;ring.rotation.y=rot;
cam.position.x+=(mx*1.1-cam.position.x)*.05;cam.position.y+=(.3+my*.5-cam.position.y)*.05;cam.lookAt(0,0,0);
ray.setFromCamera(mv,cam);const h=ray.intersectObjects(ms)[0];const nh=h?h.object:null;
if(nh!==hov){hov=nh;if(nh){const t=P[nh.userData.k];tip.textContent=t.n+" | "+fm(t.p);tip.style.opacity=1;cv.style.cursor="pointer"}else{tip.style.opacity=0;cv.style.cursor=""}}
ms.forEach(m=>{const s=m===hov?1.12:1;m.userData.s+=(s-m.userData.s)*.12;m.scale.setScalar(m.userData.s)});
ren.render(sc,cam)}
loop()})();
```

## C. Reference tilt effects

Tilt on product cards (skip on touch screens):

```js
document.querySelectorAll(".card").forEach(c=>{const m=c.querySelector(".im");c.addEventListener("pointermove",e=>{const r=c.getBoundingClientRect();m.style.setProperty("--ry",((e.clientX-r.left)/r.width-.5)*14+"deg");m.style.setProperty("--rx",(.5-(e.clientY-r.top)/r.height)*14+"deg")});c.addEventListener("pointerleave",()=>{m.style.setProperty("--rx","0deg");m.style.setProperty("--ry","0deg")})});
```

Tilt on the product page image:

```js
const pi=$("#pi"),pm=pi.firstChild;pi.onpointermove=e=>{const r=pi.getBoundingClientRect();pm.style.transform=`perspective(900px) rotateY(${((e.clientX-r.left)/r.width-.5)*18}deg) rotateX(${(.5-(e.clientY-r.top)/r.height)*18}deg) scale(1.03)`};pi.onpointerleave=()=>pm.style.transform="";
```
