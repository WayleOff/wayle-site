/* Wayle – personnalisation de l'affichage (visiteurs). Aucune donnée envoyée : tout reste dans le navigateur. */
(function(){
  var KEY="wayle-perso",D={amb:"wayle",size:0,simple:0,contrast:0,calm:0},S={};
  var AMB={
    wayle:{n:"Wayle",c:["#E8501E","#6A2BD0"]},
    ocean:{n:"Océan",c:["#22B8D8","#3B5BDB"]},
    foret:{n:"Forêt",c:["#3DBE7A","#1E6B5C"]},
    rose:{n:"Aurore",c:["#FF5E8A","#8A3FD0"]}
  };
  function load(){try{var j=JSON.parse(localStorage.getItem(KEY)||"{}");for(var k in D)S[k]=(j&&k in j)?j[k]:D[k]}catch(e){for(var k in D)S[k]=D[k]}
    try{if(matchMedia("(prefers-reduced-motion:reduce)").matches&&!localStorage.getItem(KEY))S.calm=1}catch(e){}}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
  function apply(){
    var h=document.documentElement;
    h.setAttribute("data-amb",S.amb);h.setAttribute("data-size",S.size);
    S.simple?h.setAttribute("data-simple","1"):h.removeAttribute("data-simple");
    S.contrast?h.setAttribute("data-contrast","1"):h.removeAttribute("data-contrast");
    S.calm?h.setAttribute("data-calm","1"):h.removeAttribute("data-calm");
    if(document.readyState!=="loading")media();
  }
  function media(){
    [].forEach.call(document.querySelectorAll("video"),function(v){
      if(S.calm){if(!v.hasAttribute("data-was-auto")){v.setAttribute("data-was-auto",v.autoplay?"1":"0")}v.autoplay=false;try{v.pause()}catch(e){}}
      else if(v.getAttribute("data-was-auto")==="1"){v.autoplay=true;var p=v.play&&v.play();if(p&&p.catch)p.catch(function(){})}
    });
  }
  function css(){
    var c=document.createElement("style");c.id="perso-css";
    var a="",k;
    var G={
      wayle:null,
      ocean:"radial-gradient(60% 50% at 80% 6%,rgba(30,70,190,.9),transparent 70%),radial-gradient(75% 60% at 22% 30%,rgba(20,150,200,.72),transparent 68%),radial-gradient(55% 45% at 88% 48%,rgba(40,120,220,.5),transparent 70%),radial-gradient(85% 55% at 45% 102%,rgba(40,60,200,.95),transparent 70%),radial-gradient(50% 40% at 4% 96%,rgba(90,200,220,.5),transparent 70%),#0B1B3A",
      foret:"radial-gradient(60% 50% at 80% 6%,rgba(20,90,80,.9),transparent 70%),radial-gradient(75% 60% at 22% 30%,rgba(40,170,110,.65),transparent 68%),radial-gradient(55% 45% at 88% 48%,rgba(60,150,90,.5),transparent 70%),radial-gradient(85% 55% at 45% 102%,rgba(20,100,90,.95),transparent 70%),radial-gradient(50% 40% at 4% 96%,rgba(160,210,110,.45),transparent 70%),#0A2420",
      rose:"radial-gradient(60% 50% at 80% 6%,rgba(120,50,190,.9),transparent 70%),radial-gradient(75% 60% at 22% 30%,rgba(255,80,130,.68),transparent 68%),radial-gradient(55% 45% at 88% 48%,rgba(230,70,120,.5),transparent 70%),radial-gradient(85% 55% at 45% 102%,rgba(110,50,200,.95),transparent 70%),radial-gradient(50% 40% at 4% 96%,rgba(255,150,120,.5),transparent 70%),#26103A"
    };
    for(k in AMB){if(k==="wayle")continue;
      a+='html[data-amb="'+k+'"]:not([data-theme="light"]){--orange:'+AMB[k].c[0]+';--violet:'+AMB[k].c[1]+'}';
      a+='html[data-amb="'+k+'"] body::before{background:'+G[k]+'!important}';
      a+='html[data-amb="'+k+'"]:not([data-theme="light"]){--bg:#'+G[k].split(",#").pop()+'}';
    }
    a+='html[data-size="1"]{font-size:112.5%}html[data-size="2"]{font-size:125%}';
    a+='html[data-simple] body,html[data-simple] h1,html[data-simple] h2,html[data-simple] h3,html[data-simple] button,html[data-simple] input,html[data-simple] select,html[data-simple] textarea,html[data-simple] .price,html[data-simple] dt{font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif!important;letter-spacing:0!important}';
    a+='html[data-contrast]:not([data-theme="light"]){--mid:#fff;--line:rgba(255,255,255,.6);--surface:rgba(10,5,25,.72)}html[data-contrast] body::after{display:none}html[data-contrast] a{text-decoration:underline;text-underline-offset:3px}';
    a+='html[data-calm] *,html[data-calm] *::before,html[data-calm] *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}';
    /* panneau */
    a+='.pz-btn{position:fixed;left:1rem;bottom:calc(1rem + env(safe-area-inset-bottom,0px));z-index:80;width:2.9rem;height:2.9rem;border-radius:50%;border:1px solid rgba(255,255,255,.45);background:rgba(30,16,56,.78);color:#fff;display:grid;place-items:center;cursor:pointer;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);box-shadow:0 8px 24px -8px rgba(0,0,0,.6)}';
    a+='.pz-btn:hover{background:rgba(30,16,56,.95)}.pz-btn:focus-visible{outline:3px solid #fff;outline-offset:3px}.pz-btn svg{width:1.4rem;height:1.4rem}';
    a+='@media (max-width:900px){.pz-btn{bottom:calc(5.5rem + env(safe-area-inset-bottom,0px))}}';
    a+='.pz{position:fixed;left:1rem;bottom:calc(4.4rem + env(safe-area-inset-bottom,0px));z-index:81;width:min(21rem,calc(100vw - 2rem));max-height:calc(100vh - 7rem);overflow:auto;background:rgba(24,12,46,.94);color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:22px;padding:1.1rem 1.2rem 1.2rem;-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);box-shadow:0 24px 60px -12px rgba(0,0,0,.7);font:400 .95rem/1.4 system-ui,-apple-system,"Segoe UI",Arial,sans-serif}';
    a+='@media (max-width:900px){.pz{bottom:calc(9rem + env(safe-area-inset-bottom,0px))}}';
    a+='.pz[hidden]{display:none}.pz h2{font-family:inherit;font-size:1.05rem;font-weight:700;line-height:1.2;margin:0 0 .15rem;max-width:none;letter-spacing:0}.pz p.s{margin:0 0 .8rem;color:rgba(255,255,255,.7);font-size:.85rem}';
    a+='.pz .fs{margin:1.1rem 0 0}.pz .seg{margin-bottom:.3rem}.pz .lg{font-weight:600;font-size:.85rem;color:rgba(255,255,255,.75);margin-bottom:.45rem}';
    a+='.pz .amb{display:grid;grid-template-columns:repeat(4,1fr);gap:.4rem}.pz .amb label{display:grid;justify-items:center;gap:.3rem;font-size:.75rem;cursor:pointer;font-weight:500}';
    a+='.pz .amb input{position:absolute;opacity:0;width:1px;height:1px}.pz .amb i{display:block;width:2.4rem;height:2.4rem;border-radius:50%;border:2px solid transparent;box-shadow:0 0 0 1px rgba(255,255,255,.3)}';
    a+='.pz .amb input:checked+i{border-color:#fff;box-shadow:0 0 0 3px rgba(255,255,255,.35)}.pz .amb input:focus-visible+i{outline:3px solid #fff;outline-offset:2px}';
    a+='.pz .seg{display:grid;grid-template-columns:repeat(3,1fr);gap:.35rem}.pz .seg label{cursor:pointer}.pz .seg input{position:absolute;opacity:0;width:1px;height:1px}';
    a+='.pz .seg span{display:block;text-align:center;padding:.45rem .2rem;border:1px solid rgba(255,255,255,.35);border-radius:12px;font-weight:600}.pz .seg input:checked+span{background:#fff;color:#1E1038;border-color:#fff}.pz .seg input:focus-visible+span{outline:3px solid #fff;outline-offset:2px}';
    a+='.pz .tg{display:flex;justify-content:space-between;align-items:center;gap:.8rem;padding:.55rem 0;border-top:1px solid rgba(255,255,255,.14);cursor:pointer}.pz .tg:first-of-type{border-top:0}.pz .tg small{display:block;color:rgba(255,255,255,.65);font-size:.78rem}';
    a+='.pz .tg input{position:absolute;opacity:0;width:1px;height:1px}.pz .sw{flex:none;width:2.6rem;height:1.5rem;border-radius:999px;background:rgba(255,255,255,.25);position:relative;transition:background .15s}.pz .sw::after{content:"";position:absolute;top:.15rem;left:.15rem;width:1.2rem;height:1.2rem;border-radius:50%;background:#fff;transition:transform .15s}';
    a+='.pz .tg input:checked+.sw{background:#5ED08F}.pz .tg input:checked+.sw::after{transform:translateX(1.1rem)}.pz .tg input:focus-visible+.sw{outline:3px solid #fff;outline-offset:2px}';
    a+='.pz .rst{margin-top:.9rem;background:none;border:1px solid rgba(255,255,255,.4);color:#fff;border-radius:999px;padding:.5rem 1rem;font:inherit;font-weight:600;cursor:pointer;width:100%}.pz .rst:hover{background:rgba(255,255,255,.12)}';
    c.textContent=a;document.head.appendChild(c);
  }
  function tg(id,t,d,on){return '<label class="tg"><span>'+t+'<small>'+d+'</small></span><input type="checkbox" id="'+id+'"'+(on?' checked':'')+'><span class="sw" aria-hidden="true"></span></label>'}
  function ui(){
    var b=document.createElement("button");b.type="button";b.className="pz-btn";b.setAttribute("aria-label","Personnaliser l’affichage du site");b.setAttribute("aria-expanded","false");b.setAttribute("aria-controls","pz-panel");
    b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg>';
    var p=document.createElement("div");p.className="pz";p.id="pz-panel";p.hidden=true;p.setAttribute("role","dialog");p.setAttribute("aria-label","Personnaliser l’affichage");
    var amb="";for(var k in AMB)amb+='<label><input type="radio" name="pz-amb" value="'+k+'"'+(S.amb===k?' checked':'')+'><i style="background:linear-gradient(135deg,'+AMB[k].c[0]+','+AMB[k].c[1]+')"></i>'+AMB[k].n+'</label>';
    var sz="";[["A","Normal"],["A+","Grand"],["A++","Très grand"]].forEach(function(x,i){sz+='<label><input type="radio" name="pz-size" value="'+i+'"'+(S.size==i?' checked':'')+' aria-label="'+x[1]+'"><span>'+x[0]+'</span></label>'});
    p.innerHTML='<h2>Personnaliser l’affichage</h2><p class="s">Vos choix sont gardés sur cet appareil.</p>'
      +'<div class="fs" role="group" aria-label="Ambiance de couleurs"><div class="lg">Ambiance de couleurs</div><div class="amb">'+amb+'</div></div>'
      +'<div class="fs" role="group" aria-label="Taille du texte"><div class="lg">Taille du texte</div><div class="seg">'+sz+'</div></div>'
      +'<div class="fs" role="group" aria-label="Confort de lecture"><div class="lg">Confort de lecture</div>'
      +tg("pz-simple","Police simple","Caractères plus classiques",S.simple)
      +tg("pz-contrast","Contraste renforcé","Textes plus lisibles, fond adouci",S.contrast)
      +tg("pz-calm","Mode calme","Sans animations, vidéos en pause",S.calm)+'</div>'
      +'<button type="button" class="rst">Rétablir les réglages d’origine</button>';
    document.body.appendChild(p);document.body.appendChild(b);
    function open(o){p.hidden=!o;b.setAttribute("aria-expanded",o?"true":"false");if(o){var f=p.querySelector("input:checked,input");f&&f.focus()}else b.focus()}
    b.addEventListener("click",function(){open(p.hidden)});
    document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!p.hidden)open(false)});
    document.addEventListener("click",function(e){if(!p.hidden&&!p.contains(e.target)&&!b.contains(e.target))open(false)});
    p.addEventListener("change",function(e){var t=e.target;
      if(t.name==="pz-amb")S.amb=t.value;
      else if(t.name==="pz-size")S.size=+t.value;
      else if(t.id==="pz-simple")S.simple=t.checked?1:0;
      else if(t.id==="pz-contrast")S.contrast=t.checked?1:0;
      else if(t.id==="pz-calm")S.calm=t.checked?1:0;
      save();apply()});
    p.querySelector(".rst").addEventListener("click",function(){for(var k in D)S[k]=D[k];save();apply();
      [].forEach.call(p.querySelectorAll("input"),function(i){if(i.type==="radio")i.checked=(i.name==="pz-amb"?i.value===D.amb:i.value==String(D.size));else i.checked=false})});
  }
  load();apply();
  function init(){css();ui();media()}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
