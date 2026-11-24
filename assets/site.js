(function(){
"use strict";
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var GB=window.GB||{lang:"fr",faq:[]};

/* menu mobile */
var bg=$(".burger"),menu=$("#menu");
if(bg&&menu)bg.addEventListener("click",function(){var o=menu.classList.toggle("open");bg.setAttribute("aria-expanded",o)});

/* barre de réservation : dates par défaut + envoi */
$$(".bookbar").forEach(function(f){
  var i=f.elements["in"],o=f.elements.out,d=new Date(),t=function(x){return x.toISOString().slice(0,10)};
  i.min=t(d);var d1=new Date(d.getTime()+864e5),d2=new Date(d.getTime()+2*864e5);i.value=t(d1);o.value=t(d2);o.min=t(d1);
  i.addEventListener("change",function(){var n=new Date(i.value);n.setDate(n.getDate()+1);o.min=t(n);if(o.value<=i.value)o.value=t(n)});
  f.addEventListener("submit",function(e){e.preventDefault();var u=f.dataset.book,q="?checkIn="+i.value+"&checkOut="+o.value+"&guests="+f.elements.g.value;
    location.href=u?u+(u.indexOf("?")>-1?"&"+q.slice(1):q):f.dataset.fallback+q+"#devis"});
});

/* formulaire contact : préremplit depuis l'URL, ouvre la messagerie */
var cf=$(".cform");
if(cf){var p=new URLSearchParams(location.search);if(p.get("checkIn"))cf.elements.d.value=p.get("checkIn")+" → "+p.get("checkOut")+" · "+p.get("guests");
  cf.addEventListener("submit",function(e){e.preventDefault();var el=cf.elements,b=el.m.value+"\n\n"+el.n.value+" — "+el.e.value+"\n"+el.d.value;
    location.href="mailto:"+cf.dataset.mail+"?subject="+encodeURIComponent("Le Green de Bellême — "+el.n.value)+"&body="+encodeURIComponent(b);
    var ok=$(".ok",cf);ok.textContent=cf.dataset.ok;ok.hidden=false});}

/* galerie logement */
var g=$(".gallery");
if(g){var step=function(k){g.scrollBy({left:k*g.clientWidth,behavior:"smooth"})};
  $(".gal-nav .prev").addEventListener("click",function(){step(-1)});$(".gal-nav .next").addEventListener("click",function(){step(1)});
  g.addEventListener("keydown",function(e){if(e.key==="ArrowRight")step(1);if(e.key==="ArrowLeft")step(-1)});}

/* plan + géolocalisation */
var mapEl=$("#map");
function initMap(){
  if(!window.L||!mapEl)return;
  var pts=JSON.parse(mapEl.dataset.pts),names=JSON.parse(mapEl.dataset.names),markers={},cur=null,meM=null,meP=null;
  var map=L.map(mapEl,{scrollWheelZoom:false,zoomControl:true}).setView([48.3691,0.5568],17);
  L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{maxZoom:19,attribution:"Esri, Maxar"}).addTo(map);
  L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",{maxZoom:19}).addTo(map);
  Object.keys(names).forEach(function(k){if(!pts[k])return;
    var ic=L.divIcon({className:"",html:'<div class="pin'+(k==="entree"?" me":"")+'"></div>',iconSize:[18,18],iconAnchor:[9,9]});
    markers[k]=L.marker(pts[k],{icon:ic,title:names[k]}).addTo(map).bindTooltip(names[k],{direction:"top",offset:[0,-8]});
    markers[k].on("click",function(){pick(k)});});
  var route=$("#route"),dist=$("#dist");
  function pick(k){cur=k;$$("#pick .chip").forEach(function(c){c.setAttribute("aria-pressed",c.dataset.pt===k)});
    Object.keys(markers).forEach(function(m){var el=markers[m].getElement();if(el)el.firstChild.classList.toggle("on",m===k)});
    map.flyTo(pts[k],19,{duration:.6});markers[k].openTooltip();
    route.href="https://www.google.com/maps/dir/?api=1&travelmode=walking&destination="+pts[k][0]+","+pts[k][1];
    try{history.replaceState(null,"","#"+k)}catch(e){} upd();}
  $$("#pick .chip").forEach(function(c){c.addEventListener("click",function(){pick(c.dataset.pt)})});
  function hav(a,b){var R=6371e3,r=Math.PI/180,x=(b[0]-a[0])*r,y=(b[1]-a[1])*r,h=Math.sin(x/2)*Math.sin(x/2)+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(y/2)*Math.sin(y/2);return 2*R*Math.asin(Math.sqrt(h))}
  function brg(a,b){var r=Math.PI/180,y=Math.sin((b[1]-a[1])*r)*Math.cos(b[0]*r),x=Math.cos(a[0]*r)*Math.sin(b[0]*r)-Math.sin(a[0]*r)*Math.cos(b[0]*r)*Math.cos((b[1]-a[1])*r);return (Math.atan2(y,x)/r+360)%360}
  var arrows=["↑","↗","→","↘","↓","↙","←","↖"];
  function upd(){if(!meP||!cur)return;var m=hav(meP,pts[cur]),d=m<1000?Math.round(m)+" m":(m/1000).toFixed(1)+" km";
    dist.textContent=dist.dataset.t1+" "+d+" "+arrows[Math.round(brg(meP,pts[cur])/45)%8]+" "+dist.dataset.t2;}
  $("#me").addEventListener("click",function(){
    if(!navigator.geolocation){dist.textContent=dist.dataset.no;return}
    navigator.geolocation.watchPosition(function(p){meP=[p.coords.latitude,p.coords.longitude];
      if(!meM){meM=L.circleMarker(meP,{radius:8,color:"#fff",weight:3,fillColor:"#2a7de1",fillOpacity:1}).addTo(map);map.setView(meP,18)}else meM.setLatLng(meP);
      if(!cur)dist.textContent="";upd();},function(){dist.textContent=dist.dataset.no},{enableHighAccuracy:true,maximumAge:5000});});
  var h=location.hash.slice(1);if(h&&pts[h])pick(h);
}
if(mapEl){if(window.L)initMap();else window.addEventListener("load",initMap);}

/* assistant : moteur de réponse local, multilingue */
var open=$(".ai-open"),box=$("#ai"),log=$(".ai-log"),form=$(".ai-form");
function norm(s){return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/ё/g,"е").replace(/[^a-z0-9а-я\s-]/g," ")}
var idx=GB.faq.map(function(f){return {f:f,k:norm(f.k).split(/\s+/).filter(function(w){return w.length>2})}});
function answer(q){var w=norm(q).split(/\s+/).filter(function(x){return x.length>2}),best=null,bs=0;
  idx.forEach(function(it){var s=0;w.forEach(function(x){it.k.forEach(function(k){if(k===x)s+=3;else if(k.length>3&&x.length>3&&(k.indexOf(x.slice(0,5))===0||x.indexOf(k.slice(0,5))===0))s+=1.5})});if(s>bs){bs=s;best=it.f}});
  var lg=/[а-яё]/i.test(q)?"ru":/\b(the|is|are|can|what|how|do|my|when|where|i|we|pets?|dog|time|price)\b/i.test(q)?"en":/\b(le|la|les|est|quel|quelle|comment|je|nous|chien|heure|prix)\b/i.test(q)?"fr":GB.lang;
  return bs>=1.5?best.a[lg]:GB.fallback[lg];}
function say(t,who){var d=document.createElement("div");d.className="msg "+who;d.textContent=t;log.appendChild(d);log.scrollTop=log.scrollHeight}
function ask(q){if(!q.trim())return;say(q,"u");setTimeout(function(){say(answer(q),"b")},220)}
if(open&&box){
  open.addEventListener("click",function(){box.hidden=false;open.hidden=true;open.setAttribute("aria-expanded","true");if(!log.children.length)say(GB.hello,"b");form.elements.q.focus()});
  $(".ai-close").addEventListener("click",function(){box.hidden=true;open.hidden=false;open.setAttribute("aria-expanded","false");open.focus()});
  form.addEventListener("submit",function(e){e.preventDefault();ask(form.elements.q.value);form.elements.q.value=""});
  $$(".chip",box).forEach(function(c){c.addEventListener("click",function(){ask(c.textContent)})});
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!box.hidden)$(".ai-close").click()});
}

/* bandeau vivant : heure, soleil, météo à Bellême */
var live=$("#live");
if(live&&GB.c){var C=GB.c,LAT=48.3691,LNG=0.5568,loc={fr:"fr-FR",en:"en-GB",ru:"ru-RU"}[GB.lang];
  function sun(d,rise){var r=Math.PI/180,N=Math.floor((d-new Date(d.getFullYear(),0,0))/864e5),lh=LNG/15,t=N+((rise?6:18)-lh)/24,M=.9856*t-3.289,
    L=(M+1.916*Math.sin(M*r)+.020*Math.sin(2*M*r)+282.634+360)%360,RA=(Math.atan(.91764*Math.tan(L*r))/r+360)%360;
    RA=(RA+(Math.floor(L/90)-Math.floor(RA/90))*90)/15;var sd=.39782*Math.sin(L*r),cd=Math.cos(Math.asin(sd)),
    ch=(Math.cos(90.833*r)-sd*Math.sin(LAT*r))/(cd*Math.cos(LAT*r));if(ch>1||ch<-1)return null;
    var H=(rise?360-Math.acos(ch)/r:Math.acos(ch)/r)/15,T=H+RA-.06571*t-6.622,UT=((T-lh)%24+24)%24;
    var o=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));o.setUTCMinutes(Math.round(UT*60));return o}
  var fmt=function(x){return x.toLocaleTimeString(loc,{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Paris"})};
  var W={fr:["ciel clair","éclaircies","nuageux","brouillard","bruine","pluie","neige","averses","orage"],en:["clear sky","sunny spells","cloudy","fog","drizzle","rain","snow","showers","thunderstorm"],ru:["ясно","переменная облачность","облачно","туман","морось","дождь","снег","ливни","гроза"]}[GB.lang];
  function wc(c){return c===0?0:c<3?1:c<4?2:c<50?3:c<60?4:c<70?5:c<80?6:c<90?7:8}
  var wx="";
  function draw(){var n=new Date(),sr=sun(n,1),ss=sun(n,0),night=ss&&sr&&(n>ss||n<sr);
    document.querySelector(".hero").classList.toggle("night",!!night);
    live.innerHTML="";var add=function(t,b){var s=document.createElement("span");if(b){var e=document.createElement("b");e.textContent=b;s.appendChild(e);s.appendChild(document.createTextNode(" "))}s.appendChild(document.createTextNode(t));live.appendChild(s)};
    add(fmt(n),C.live_at);if(wx)add(wx);
    if(ss&&sr)add(night?C.live_sunrise+" "+fmt(sr):C.live_sunset+" "+fmt(ss));}
  draw();setInterval(draw,30000);
  try{fetch("https://api.open-meteo.com/v1/forecast?latitude="+LAT+"&longitude="+LNG+"&current=temperature_2m,weather_code&timezone=Europe%2FParis").then(function(r){return r.json()}).then(function(d){wx=Math.round(d.current.temperature_2m)+" °C, "+W[wc(d.current.weather_code)];draw()}).catch(function(){})}catch(e){}
}

/* composeur de séjour */
var cf2=$("#cform"),out=$("#cout");
if(cf2&&out&&GB.units){var C=GB.c,U=GB.units,up=document.body.dataset.lang==="fr"?"":"../";
  var fr=function(s,o){return s.replace(/\{(\w+)\}/g,function(_,k){return o[k]})};
  var eur=function(v){return Math.round(v).toLocaleString(GB.lang==="en"?"en-GB":"fr-FR")+" €"};
  var tday=new Date(),iso=function(x){return x.toISOString().slice(0,10)};var d0=new Date(tday.getTime()+7*864e5);cf2.elements.d.value=iso(d0);cf2.elements.d.min=iso(tday);
  $$(".sp button",cf2).forEach(function(b){b.addEventListener("click",function(){var i=b.parentNode.querySelector("input"),v=+i.value+ +b.dataset.d;i.value=Math.max(+i.min,Math.min(+i.max,v));calc()})});
  cf2.addEventListener("input",calc);cf2.addEventListener("change",calc);
  var pinned=null;
  function quote(u,n,date,who,dog){var lines=[],m=date.getMonth(),winter=(m>=10||m<=2),golf=who==="golf"&&winter&&n>=3;
    var base=(golf?u.golf:u.price)*n;lines.push([fr(C.c_nightsx,{n:n,p:golf?u.golf:u.price}),eur(base)]);if(golf)lines.push([C.c_golf,""]);
    var pct=0,lab="";if(!golf){if(n>=28){pct=40;lab=C.c_discm}else if(n>=7&&winter){pct=30;lab=C.c_discw}else if(n>=3&&winter){pct=10;lab=C.c_disc3}
      if(who==="pro"&&n>=2&&pct<10){pct=10;lab=C.c_discp}}
    var tot=base;if(pct){var dd=base*pct/100;tot-=dd;lines.push([lab,"−"+eur(dd),"minus"])}
    if(dog&&u.kind==="apt"){tot+=15*n;lines.push([fr(C.c_dogl,{n:n}),eur(15*n)])}
    return {tot:tot,lines:lines,golf:golf,winter:winter}}
  function card(u,q,g,n,who,alts){var gifts=[];if(u.kind==="apt"&&n>=2)gifts.push(C.c_cider);gifts.push(C.c_late);
    var notes=[];if(u.id==="spacieuse"&&n<2)notes.push(C.c_min2);if(who==="golf"&&!q.golf)notes.push(q.winter?C.c_golfmin:C.c_golfoff);if(who==="mariage")notes.push(C.c_wedding);
    var ci=cf2.elements.d.value,co=new Date(new Date(ci).getTime()+n*864e5);
    var bq="?checkIn="+ci+"&checkOut="+iso(co)+"&guests="+g,bk=GB.book?GB.book+(GB.book.indexOf("?")>-1?"&"+bq.slice(1):bq):"contact.html"+bq+"#devis";
    var PICS={deluxe:[1,3,2],spacieuse:[1,2,3],fairway:[1,2,4],ecuyers:[1,2,4],percheron:[1,2,3]},pics=PICS[u.id].map(function(i){return u.id+"-"+i});
    if(who==="golf")pics=["golfsunset"].concat(pics.slice(0,2));if(who==="mariage")pics=["fleurs"].concat(pics.slice(0,2));
    var src=function(k,w){return up+"assets/img/"+k+"-"+w+".webp"};
    var h='<article class="reco"><div class="media"><img class="main" src="'+src(pics[0],1600)+'" srcset="'+src(pics[0],800)+' 800w, '+src(pics[0],1600)+' 1600w" sizes="(max-width:900px) 92vw, 30vw" alt=""><div class="thumbs">'+pics.map(function(k,i){return '<button type="button" data-k="'+k+'"'+(i?'':' aria-pressed="true"')+'><img src="'+src(k,800)+'" alt=""></button>'}).join("")+'</div></div><div class="rb"><span class="tag"></span><h3></h3><p class="small"></p><ul class="lines"></ul><div class="tot"><span></span><b></b></div><p class="note pp"></p><p><a class="btn wide"></a></p><p class="note est"></p></div></article>';
    var w=document.createElement("div");w.innerHTML=h;var a=w.firstChild;
    $$(".thumbs button",a).forEach(function(b){b.addEventListener("click",function(){var m=$(".main",a),k=b.dataset.k;m.src=src(k,1600);m.srcset=src(k,800)+" 800w, "+src(k,1600)+" 1600w";$$(".thumbs button",a).forEach(function(x){x.setAttribute("aria-pressed",x===b)})})});
    $(".main",a).alt=u.name;$(".tag",a).textContent=C.c_reco;$("h3",a).textContent=u.name;$(".small",a).textContent=u.guests+" "+C.c_people+" · "+u.beds+" "+C.c_bed;
    var ul=$(".lines",a);q.lines.forEach(function(l){var li=document.createElement("li");if(l[2])li.className=l[2];var s1=document.createElement("span"),s2=document.createElement("span");s1.textContent=l[0];s2.textContent=l[1];li.appendChild(s1);li.appendChild(s2);ul.appendChild(li)});
    gifts.forEach(function(gf){var li=document.createElement("li");li.className="gift";li.textContent="✓ "+gf;ul.appendChild(li)});
    $(".tot span",a).textContent=C.c_total;$(".tot b",a).textContent=eur(q.tot);$(".pp",a).textContent=fr(C.c_pp,{x:Math.round(q.tot/n/Math.max(1,g))});
    var bt=$(".btn",a);bt.textContent=who==="mariage"?C.c_quote:C.c_book;bt.href=who==="mariage"?"groupes.html#mariage":bk;
    $(".est",a).textContent=notes.concat([C.c_est]).join(" ");
    out.innerHTML="";out.appendChild(a);
    if(alts.length){var p=document.createElement("p");p.className="note";p.textContent=C.c_alt;out.appendChild(p);var box=document.createElement("div");box.className="alts";
      alts.forEach(function(o){var b=document.createElement("button");b.type="button";b.className="alt";b.textContent=o.name+" · "+eur(quote(o,n,new Date(cf2.elements.d.value),who,cf2.elements.dog.checked).tot);b.addEventListener("click",function(){pinned=o.id;calc()});box.appendChild(b)});out.appendChild(box)}}
  function calc(){var f=cf2.elements,who=(cf2.querySelector("input[name=who]:checked")||{}).value,g=Math.max(1,+f.g.value||1),n=Math.max(1,+f.n.value||1),dog=f.dog.checked,date=new Date(f.d.value||iso(d0));
    var fit=U.filter(function(u){return u.guests>=g&&(!dog||u.kind==="apt")});
    if(!fit.length){ /* plusieurs logements */
      var pool=U.filter(function(u){return !dog||u.kind==="apt"}).slice().sort(function(a,b){return b.guests-a.guests}),pick=[],cap=0;
      for(var i=0;i<pool.length&&cap<g;i++){pick.push(pool[i]);cap+=pool[i].guests}
      if(cap<g&&!dog){U.filter(function(u){return u.kind==="room"}).forEach(function(u){[0,1].forEach(function(){if(cap<g){pick.push(u);cap+=u.guests}})})}
      out.innerHTML="";var p=document.createElement("p");p.textContent=fr(C.c_combo,{g:g});out.appendChild(p);var box=document.createElement("div");box.className="combo";var tot=0;
      pick.forEach(function(u){var q=quote(u,n,date,who,dog);tot+=q.tot;var d=document.createElement("div"),a=document.createElement("span"),b=document.createElement("b");a.textContent=u.name+" · "+u.guests+" "+C.c_people;b.textContent=eur(q.tot);d.appendChild(a);d.appendChild(b);box.appendChild(d)});
      out.appendChild(box);var t=document.createElement("div");t.className="tot";t.innerHTML="<span></span><b></b>";t.firstChild.textContent=C.c_total;t.lastChild.textContent=eur(tot);out.appendChild(t);
      var a2=document.createElement("a");a2.className="btn";a2.href=who==="mariage"?"groupes.html#mariage":"contact.html#devis";a2.textContent=C.c_quote;out.appendChild(a2);
      var e=document.createElement("p");e.className="note";e.textContent=(who==="mariage"?C.c_wedding+" ":"")+C.c_est;out.appendChild(e);return}
    var order=fit.slice().sort(function(a,b){return a.price-b.price});
    if((who==="famille"||who==="amis")&&g>=3)order.sort(function(a,b){return (b.kind==="apt")-(a.kind==="apt")||(g>=5?b.beds-a.beds:a.price-b.price)});
    if(who==="couple"&&n>=2&&g<=2){var sp=order.filter(function(u){return u.id==="spacieuse"})[0];if(sp)order=[sp].concat(order.filter(function(u){return u!==sp}))}
    if(who==="golf"&&g<=2&&n>=3){var fw=order.filter(function(u){return u.id==="fairway"})[0];if(fw)order=[fw].concat(order.filter(function(u){return u!==fw}))}
    var best=order[0];if(pinned){var pu=order.filter(function(u){return u.id===pinned})[0];if(pu)best=pu}
    card(best,quote(best,n,date,who,dog),g,n,who,order.filter(function(u){return u!==best}).slice(0,3))}
  $$("input[name=who]",cf2).forEach(function(r){r.addEventListener("change",function(){pinned=null;if(r.value==="mariage"&&+cf2.elements.g.value<8)cf2.elements.g.value=12;if(r.value==="couple")cf2.elements.g.value=2;if(r.value==="famille"&&+cf2.elements.g.value<3)cf2.elements.g.value=4;calc()})});
  cf2.elements.g.addEventListener("input",function(){pinned=null});
  calc();
}
})();