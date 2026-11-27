/* Wayle – réglages du site gérés depuis l'espace admin (couleurs, favicon, menu, textes). */
(function(){
  var CK="wayle-site-cache";
  function hex(h){h=String(h||"").replace("#","");if(h.length===3)h=h.replace(/./g,"$&$&");if(!/^[0-9a-f]{6}$/i.test(h))return null;return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]}
  function mix(a,b,t){return[0,1,2].map(function(i){return Math.round(a[i]+(b[i]-a[i])*t)})}
  function css(c,a){return a===undefined?"rgb("+c.join(",")+")":"rgba("+c.join(",")+","+a+")"}
  function theme(cfg){
    if(window.__tcPreview)return;
    var o=document.getElementById("site-theme");if(o)o.remove();
    var col=(cfg&&cfg.colors)||{},p=hex(col.primary),s=hex(col.secondary),b=hex(col.base);
    if(!p&&!s&&!b)return;
    p=p||[232,80,30];s=s||[106,43,208];b=b||[30,16,56];
    var W=[255,255,255],K=[0,0,0];
    var a1=mix(p,W,.2),a2=mix(s,W,.5);
    var g="radial-gradient(60% 50% at 80% 6%,"+css(mix(s,K,.12),.9)+",transparent 70%),"
      +"radial-gradient(75% 60% at 22% 30%,"+css(p,.72)+",transparent 68%),"
      +"radial-gradient(55% 45% at 88% 48%,"+css(mix(p,K,.08),.5)+",transparent 70%),"
      +"radial-gradient(85% 55% at 45% 102%,"+css(s,.95)+",transparent 70%),"
      +"radial-gradient(50% 40% at 4% 96%,"+css(mix(p,W,.3),.55)+",transparent 70%),"+css(b);
    var st=document.createElement("style");st.id="site-theme";
    st.textContent=':root:not([data-theme="light"]){--bg:'+css(b)+';--orange:'+css(a1)+';--violet:'+css(a2)+'}body::before{background:'+g+'!important}';
    document.head.appendChild(st);
    var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content","#"+b.map(function(x){return("0"+x.toString(16)).slice(-2)}).join(""));
  }
  function identity(id){
    if(!id||typeof id!=="object")return;
    var ok=function(u){return typeof u==="string"&&/^\/api\/media\?id=[A-Za-z0-9_-]{1,64}$/.test(u)};
    if(ok(id.logoLight))[].forEach.call(document.querySelectorAll("img.on-light"),function(i){i.src=id.logoLight;i.removeAttribute("srcset")});
    if(ok(id.logoDark))[].forEach.call(document.querySelectorAll("img.on-dark"),function(i){i.src=id.logoDark;i.removeAttribute("srcset")});
    var meta=function(sel,v){var m=document.querySelector(sel);if(m&&v)m.setAttribute("content",v)};
    if(ok(id.ogImage)){var abs=location.origin+id.ogImage;meta('meta[property="og:image"]',abs);meta('meta[name="twitter:image"]',abs)}
    if(typeof id.siteName==="string"&&id.siteName&&id.siteName.length<=80)meta('meta[property="og:site_name"]',id.siteName);
  }
  function favicon(cfg){
    if(!cfg||!cfg.favicon||!/^[A-Za-z0-9_-]{1,64}$/.test(cfg.favicon))return;
    [].forEach.call(document.querySelectorAll('link[rel~="icon"],link[rel="apple-touch-icon"]'),function(l){l.remove()});
    var u="/api/media?id="+cfg.favicon;
    var l=document.createElement("link");l.rel="icon";l.href=u;document.head.appendChild(l);
    var t=document.createElement("link");t.rel="apple-touch-icon";t.href=u;document.head.appendChild(t);
  }
  function nav(pages){
    var items=(pages||[]).filter(function(p){return p.nav});if(!items.length)return;
    var n=document.querySelector("header nav");
    if(n&&!n.querySelector("[data-site-nav]")){var cta=n.querySelector("a.cta");
      items.forEach(function(p){var a=document.createElement("a");a.href="/p/"+p.slug;a.textContent=p.navLabel||p.title;a.setAttribute("data-site-nav","1");n.insertBefore(a,cta||null)})}
    var f=document.querySelector("footer");
    if(f&&!f.querySelector("[data-site-nav]")){items.forEach(function(p){f.appendChild(document.createTextNode(" · "));var a=document.createElement("a");a.href="/p/"+p.slug;a.textContent=p.navLabel||p.title;a.setAttribute("data-site-nav","1");f.appendChild(a)})}
  }
  /* Menus (en-tête et pied de page) pilotés depuis l'espace admin : config.menus = {header:[{label,href,show}], footer:[…], cta:{label,href,show}} */
  function okHref(h){return typeof h==="string"&&h.length<=300&&/^(\/(?!\/)|#|https:\/\/|mailto:|tel:)/.test(h)}
  function pth(h){try{var u=new URL(h,location.origin);if(u.origin!==location.origin)return null;return{p:u.pathname.replace(/\/index\.html$/,"/").replace(/\.html$/,"").replace(/(.)\/+$/,"$1")||"/",h:u.hash}}catch(e){return null}}
  function here(){return pth(location.pathname).p}
  function mkLink(it,cls){
    var a=document.createElement("a");a.href=it.href;a.textContent=String(it.label||"").slice(0,60);
    if(cls)a.className=cls;if(/^https:/.test(it.href))a.rel="noopener";
    return a}
  function menus(m){
    if(!m||typeof m!=="object")return;
    var cur=here();
    var ok=function(it){return it&&it.show!==false&&it.label&&okHref(it.href)};
    var self=function(it){var q=pth(it.href);return q&&!q.h&&q.p===cur};
    var n=document.querySelector("header nav");
    if(n&&Array.isArray(m.header)){
      while(n.firstChild)n.removeChild(n.firstChild);
      m.header.filter(ok).slice(0,12).forEach(function(it){var a=mkLink(it);if(self(it))a.setAttribute("aria-current","page");n.appendChild(a)});
      if(m.cta&&ok(m.cta))n.appendChild(mkLink(m.cta,"cta"));
    }
    var f=document.querySelector("footer [data-menu=footer]");
    if(f&&Array.isArray(m.footer)){
      while(f.firstChild)f.removeChild(f.firstChild);
      m.footer.filter(ok).filter(function(it){return !self(it)}).slice(0,16).forEach(function(it){f.appendChild(document.createTextNode(" · "));f.appendChild(mkLink(it))});
    }
    window.__wayleMenus=true;
  }
  window.__wayleMenusPreview=menus;
  function hideSelf(){
    var cur=here();
    [].forEach.call(document.querySelectorAll("header nav a:not(.cta)"),function(a){var q=pth(a.getAttribute("href"));if(q&&!q.h&&q.p===cur)a.setAttribute("aria-current","page")});
    [].forEach.call(document.querySelectorAll("footer [data-menu=footer] a"),function(a){
      var q=pth(a.getAttribute("href"));
      if(q&&!q.h&&q.p===cur){var p=a.previousSibling;if(p&&p.nodeType===3)p.parentNode.removeChild(p);a.parentNode.removeChild(a)}
    });
  }
  function norm(s){return String(s||"").replace(/\s+/g," ").trim()}
  function texts(content){
    if(!content)return;
    [].forEach.call(document.querySelectorAll("[data-k]"),function(el){
      var e=content[el.getAttribute("data-k")];
      if(e&&typeof e.v==="string"&&e.d===norm(el.textContent))el.textContent=e.v;
    });
  }
  /* 1. couleurs et favicon tout de suite (mémorisés), sans attendre le réseau */
  try{var c0=JSON.parse(localStorage.getItem(CK)||"null");if(c0){theme(c0.config);favicon(c0.config);identity(c0.identity)}}catch(e){}
  var ready0=new Promise(function(r){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",r);else r()});
  try{if(c0&&c0.config&&c0.config.menus)ready0.then(function(){menus(c0.config.menus)})}catch(e){}
  /* 2. réglages à jour */
  var ready=new Promise(function(r){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",r);else r()});
  fetch("/api/site",{credentials:"same-origin"}).then(function(r){return r.ok?r.json():null}).catch(function(){return null}).then(function(j){
    if(!j)return;
    try{localStorage.setItem(CK,JSON.stringify({config:j.config||{},identity:j.identity||null}))}catch(e){}
    theme(j.config);favicon(j.config);identity(j.identity);
    ready.then(function(){if(j.config&&j.config.menus){if(!window.__menusPreview)menus(j.config.menus)}else if(!window.__menusPreview){nav(j.pages);hideSelf()}texts(j.content)});
  });
})();
;(function(){if(window.parent===window)return;window.addEventListener("message",function(e){if(e.origin!==location.origin)return;if(e.data&&e.data.type==="wayle-menus"&&e.data.menus&&typeof e.data.menus==="object"){window.__menusPreview=true;try{window.__wayleMenusPreview(e.data.menus)}catch(x){}return}var d=e.data;if(!d||d.type!=="wayle-theme"||typeof d.css!=="string"||d.css.length>60000)return;window.__tcPreview=true;var o=document.getElementById("site-theme");if(o)o.remove();var s=document.getElementById("theme-preview");if(!s){s=document.createElement("style");s.id="theme-preview";document.head.appendChild(s)}s.textContent=d.css;if(window.__wayleMode)window.__wayleMode()})})();

/* Barre d'édition : visible uniquement pour l'administrateur connecté (aucun effet pour les visiteurs). */
;(function(){
  if(window.parent!==window)return;
  var flag=false;try{flag=localStorage.getItem("wayle-admin")==="1"}catch(e){}
  if(!flag)return;
  fetch("/api/admin?c=s_config&id=main",{credentials:"same-origin",headers:{"X-Wayle":"1"},redirect:"error",cache:"no-store"})
    .then(function(r){if(r.status===401||r.status===403){try{localStorage.removeItem("wayle-admin")}catch(e){}}return r.ok}).catch(function(){return false})
    .then(function(ok){if(ok)mount()});
  function mount(){
    var path=location.pathname.replace(/\.html$/,"").replace(/\/+$/,"")||"/";
    if(/^\/(admin|gestion|espace-client|api)/.test(path))return;
    var st=document.createElement("style");
    st.textContent="#wadm-edit{position:fixed;right:1rem;bottom:1.25rem;z-index:2147483000;display:inline-flex;align-items:center;gap:.5rem;min-height:44px;padding:.55rem 1.1rem;border-radius:999px;background:#FF7A4D;color:#150E22;font:700 .95rem/1 system-ui,sans-serif;text-decoration:none;box-shadow:0 8px 24px rgba(0,0,0,.35)}#wadm-edit:hover{background:#ff8f68}#wadm-edit:focus-visible{outline:3px solid #fff;outline-offset:3px}@media (max-width:700px){#wadm-edit{bottom:5.5rem}}@media print{#wadm-edit{display:none}}";
    document.head.appendChild(st);
    var a=document.createElement("a");a.id="wadm-edit";var bm=/^\/blog\/([a-z0-9-]+)$/.exec(path);a.href=bm?"/admin#blog/"+bm[1]:"/admin#modifier/"+encodeURIComponent(path)+"/retour";a.textContent=bm?"✎ Modifier cet article":"✎ Modifier cette page";
    document.body.appendChild(a);
  }
})();
