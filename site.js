/* Wayle – réglages du site gérés depuis l'espace admin (couleurs, favicon, menu, textes). */
(function(){
  var CK="wayle-site-cache";
  function hex(h){h=String(h||"").replace("#","");if(h.length===3)h=h.replace(/./g,"$&$&");if(!/^[0-9a-f]{6}$/i.test(h))return null;return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]}
  function mix(a,b,t){return[0,1,2].map(function(i){return Math.round(a[i]+(b[i]-a[i])*t)})}
  function css(c,a){return a===undefined?"rgb("+c.join(",")+")":"rgba("+c.join(",")+","+a+")"}
  function theme(cfg){
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
  function norm(s){return String(s||"").replace(/\s+/g," ").trim()}
  function texts(content){
    if(!content)return;
    [].forEach.call(document.querySelectorAll("[data-k]"),function(el){
      var e=content[el.getAttribute("data-k")];
      if(e&&typeof e.v==="string"&&e.d===norm(el.textContent))el.textContent=e.v;
    });
  }
  /* 1. couleurs et favicon tout de suite (mémorisés), sans attendre le réseau */
  try{var c0=JSON.parse(localStorage.getItem(CK)||"null");if(c0){theme(c0.config);favicon(c0.config)}}catch(e){}
  /* 2. réglages à jour */
  var ready=new Promise(function(r){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",r);else r()});
  fetch("/api/site",{credentials:"same-origin"}).then(function(r){return r.ok?r.json():null}).catch(function(){return null}).then(function(j){
    if(!j)return;
    try{localStorage.setItem(CK,JSON.stringify({config:j.config||{}}))}catch(e){}
    theme(j.config);favicon(j.config);
    ready.then(function(){nav(j.pages);texts(j.content)});
  });
})();
