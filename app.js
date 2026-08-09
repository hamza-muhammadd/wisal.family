(function(){
 'use strict';
 try{ document.documentElement.setAttribute('data-build','49'); console.log('Wisal build 49 \u2014 trip details'); }catch(e){}
 var $ = function(s,r){ return (r||document).querySelector(s); };
 var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };

 /* ---- Persistence: localStorage, with in-memory fallback ---- */
 var Store = {
 _m: {},
 get: function(k,fb){ try{ var v=localStorage.getItem(k); return v===null?fb:JSON.parse(v); }catch(e){ return (k in this._m)?this._m[k]:fb; } },
 set: function(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){ this._m[k]=v; } },
 clearAll: function(){ try{ var rm=[]; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); if(k&&k.indexOf('fw.')===0) rm.push(k); } rm.forEach(function(k){ localStorage.removeItem(k); }); }catch(e){} this._m={}; }
 };
 var K = { theme:'fw.theme', family:'fw.family', collapsed:'fw.collapsed', view:'fw.view' };

 var root = document.documentElement, app = $('#app'), backdrop = $('#backdrop');
 var mqDark = window.matchMedia('(prefers-color-scheme: dark)');
 var mqMobile = window.matchMedia('(max-width: 959px)');
 var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');

 /* ---- Theme ---- */
 function effective(pref){ return pref==='system' ? (mqDark.matches?'dark':'light') : pref; }
 function applyTheme(pref){
 var eff = effective(pref);
 root.setAttribute('data-theme', eff);
 var meta = $('meta[name=theme-color]'); if(meta) meta.setAttribute('content', eff==='dark'?'#0A0E1A':'#F3F5FA');
 $$('.seg__btn[data-theme]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-theme')===pref)); });
 }
 var themePref = Store.get(K.theme, 'system');
 applyTheme(themePref);
 mqDark.addEventListener('change', function(){ if(themePref==='system') applyTheme('system'); });
 function setTheme(p){ themePref=p; Store.set(K.theme,p); applyTheme(p); }
 function quickTheme(){ setTheme(effective(themePref)==='dark'?'light':'dark'); }

 /* ---- Collapse (desktop rail) ---- */
 var collapsed = Store.get(K.collapsed, true);
 var _colT=null, _railPeek=false, _railT=null;
 function _deskRail(){ try{ return window.matchMedia('(min-width:960px)').matches; }catch(e){ return true; } }
 function applyCollapsed(){
 app.classList.add('no-anim');
 /* The rail only exists on desktop. On phones the sidebar is a full drawer, so
    is-collapsed must never apply there — it hides the nav group headings. */
 var rail = !!collapsed && _deskRail();
 app.classList.toggle('is-collapsed', rail);
 app.classList.toggle('is-autorail', rail);
 _railPeek=false; clearTimeout(_railT);
 clearTimeout(_colT);
 _colT=setTimeout(function(){ app.classList.remove('no-anim'); }, 260);
 }
 applyCollapsed();
 try{ window.matchMedia('(min-width:960px)').addEventListener('change', function(){ applyCollapsed(); }); }catch(e){}
 function toggleCollapse(){ collapsed=!collapsed; Store.set(K.collapsed,collapsed); applyCollapsed(); }

 /* ---- Hover peek ----------------------------------------------------------
    Opens the rail while the pointer is inside it, closes it again on exit.
    Runs only in auto-rail mode, so a pinned-open sidebar is left alone, and
    hovering never writes to the stored preference. */
 function railPeek(open){
   if(!collapsed || !_deskRail() || !app.classList.contains('is-autorail')) return;
   if(_railPeek===open) return;
   _railPeek=open;
   app.classList.remove('no-anim');
   app.classList.toggle('is-collapsed', !open);
 }
 function railEnter(){ clearTimeout(_railT); _railT=setTimeout(function(){ railPeek(true); }, 80); }
 function railLeave(){ clearTimeout(_railT); _railT=setTimeout(function(){ railPeek(false); }, 220); }
 try{
   var _sbAll=document.getElementById('sidebar');
   if(_sbAll) _sbAll.addEventListener('scroll', function(){ _sbAll.classList.toggle('is-scrolled', _sbAll.scrollTop>4); }, {passive:true});
 }catch(e){}
 try{
   var _sb=document.getElementById('sidebar');
   if(_sb && window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches){
     _sb.addEventListener('mouseenter', railEnter);
     _sb.addEventListener('scroll', function(){ _sb.classList.toggle('is-scrolled', _sb.scrollTop>4); }, {passive:true});
     _sb.addEventListener('mouseleave', railLeave);
     _sb.addEventListener('focusin', function(){ clearTimeout(_railT); railPeek(true); });
     _sb.addEventListener('focusout', function(e){ if(!_sb.contains(e.relatedTarget)) railLeave(); });
   }
 }catch(e){}

 /* ---- Mobile drawer ---- */
 function openDrawer(){ app.classList.add('is-drawer-open'); backdrop.hidden=false; }
 function closeDrawer(){ app.classList.remove('is-drawer-open'); backdrop.hidden=true; }

 /* ---- Routing ---- */
 var TITLES = { home:'Home', dashboard:'Home', ai:'Wisal AI', family:'Family Management', relationship:'Relationship', planning:'Planning', memory:'Memory Vault', vault:'Secure Vault', health:'Health & Medical', fitness:'Fitness', nutrition:'Nutrition', cooking:'Cooking', homemgmt:'Home Management', finance:'Finance', learning:'Learning', journal:'Journal & Memories', travel:'Travel', wellbeing:'Wellbeing & Growth', legacy:'Legacy & Akhirah', settings:'Settings' };
 var VIEWS = Object.keys(TITLES);
 function applyNavGroups(){ var st=Store.get('fw.nav.groups',{})||{}; $$('.nav__group').forEach(function(g){ var k=g.getAttribute('data-group'); g.classList.toggle('is-grpcollapsed', st[k]===true); }); }
 function toggleNavGroup(k){ var st=Store.get('fw.nav.groups',{})||{}; st[k]=!st[k]; Store.set('fw.nav.groups',st); var g=document.querySelector('.nav__group[data-group="'+k+'"]'); if(g) g.classList.toggle('is-grpcollapsed', st[k]===true); }
 function expandGroupOfView(view){ var item=document.querySelector('.nav__item[data-view="'+view+'"]'); if(!item) return; var g=item.closest('.nav__group'); if(g && g.classList.contains('is-grpcollapsed')){ var k=g.getAttribute('data-group'); var st=Store.get('fw.nav.groups',{})||{}; st[k]=false; Store.set('fw.nav.groups',st); g.classList.remove('is-grpcollapsed'); } }
 function markActiveGroup(view){ var item=document.querySelector('.nav__item[data-view="'+view+'"]'); var grp=item?item.closest('.nav__group'):null; $$('.nav__group').forEach(function(g){ g.classList.toggle('is-activegroup', g===grp); }); }
 var currentView='home';
 function navigate(view, push){
    if(view==='dashboard') view='home';  // My Day merged into Home
 if(VIEWS.indexOf(view)===-1) view='home';
 currentView=view;
 $$('.view').forEach(function(v){ v.classList.toggle('active', v.id==='view-'+view); });
 $$('.nav__item').forEach(function(n){
 var on = n.getAttribute('data-view')===view;
 n.classList.toggle('is-active', on);
 n.setAttribute('aria-current', on?'page':'false');
 });
 $('#pageTitle').textContent = TITLES[view];
 var _fab=$('#fabFin'); if(_fab) _fab.style.display=(view==='finance')?'':'none';
 Store.set(K.view, view);
 expandGroupOfView(view);
 markActiveGroup(view);
 if(view==='family'||view==='health'||view==='finance'||view==='journal'||view==='cooking'||view==='homemgmt'||view==='learning'||view==='travel'||view==='fitness'||view==='nutrition'||view==='planning'||view==='relationship'||view==='memory'||view==='wellbeing'||view==='legacy'){ navigateSub(view, Store.get('fw.sub.'+view,'dashboard')); }
 if(push!==false && location.hash!=='#'+view) history.replaceState(null,'','#'+view);
 var c=$('#canvas'); if(c) c.scrollTop=0;
 if(mqMobile.matches) closeDrawer();
 if(view==='home'){ reveal('#view-home'); renderHome(); try{ renderHeroPulse(); }catch(e){} }
 if(view==='settings'){ try{ closeSetPane(); }catch(e){} try{ renderSetIndex(); }catch(e){} }
 if(view==='ai'){ try{ chGate(); chMarkSeen(); }catch(e){} }
 try{ var _cv=document.getElementById('canvas'); if(_cv){ _cv.classList.toggle('canvas--ai', view==='ai'); } }catch(e){}
 if(view==='vault'){ try{ vaultUnlocked=false; vaultMode='unlock'; renderVaultLock(); }catch(e){} }
 if(view==='dashboard') renderMyDay();
 }

 /* ============ HEALTH & MEDICAL ============ */
 var hMember = null;
 var H_HEART='<svg class="ico" viewBox="0 0 24 24"><path d="M12 20s-7-4.25-7-9.1C5 8.2 6.75 6.6 9 6.6c1.45 0 2.65.72 3 1.8.35-1.08 1.55-1.8 3-1.8 2.25 0 4 1.6 4 4.3 0 4.85-7 9.1-7 9.1Z"/></svg>';
 var H_ALERT='<svg class="ico" viewBox="0 0 24 24"><path d="M12 4.6 21 19.4H3L12 4.6Z"/><path d="M12 10.2v4"/><circle cx="12" cy="16.9" r=".8" fill="currentColor" stroke="none"/></svg>';
 var H_PILL='<svg class="ico" viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-45 12 12)"/><path d="M8.3 7.7l8 8"/></svg>';
 var H_PEOPLE='<svg class="ico" viewBox="0 0 24 24"><circle cx="9" cy="8" r="2.7"/><path d="M4.4 19c0-2.85 2.05-4.6 4.6-4.6s4.6 1.75 4.6 4.6"/><circle cx="16.6" cy="9.4" r="2"/><path d="M14.6 19c.15-1.95 1-3.3 2.6-3.3 1.45 0 2.35.95 2.6 2.4"/></svg>';
 var H_NOTE='<svg class="ico" viewBox="0 0 24 24"><path d="M13 3.5H6.5A1.5 1.5 0 0 0 5 5v14a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V9.5L13 3.5Z"/><path d="M13 3.5V9.5h6"/></svg>';
 var H_SHIELD='<svg class="ico" viewBox="0 0 24 24"><path d="M12 3.3 5 5.7v5.1c0 4.3 2.9 7.4 7 8.9 4.1-1.5 7-4.6 7-8.9V5.7L12 3.3Z"/><path d="M9.1 11.7l2 2 3.7-3.9"/></svg>';
 var H_CAL='<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="5.2" width="16" height="14.8" rx="2.2"/><path d="M4 9.4h16"/><path d="M8.2 3.4v3.4M15.8 3.4v3.4"/><path d="M8.8 14.4l2 2 3.6-3.8"/></svg>';
 var APPT_TYPES=['Doctor','Dentist','Specialist','Vaccination','Lab test','Therapy','Check-up','Other'];
 function healthAppts(){ return (FD.data.events||[]).filter(function(e){return e.kind==='appointment';}); }
 function apptTime(d){ var h=d.getHours(),mn=d.getMinutes(),ap=h<12?'AM':'PM',h12=h%12; if(h12===0)h12=12; return h12+':'+(mn<10?'0':'')+mn+' '+ap; }
 function apptWhen(dstr,allDay){ if(!dstr) return ''; var hasT=String(dstr).indexOf('T')>=0; var d=new Date(hasT?dstr:(dstr+'T00:00')); if(isNaN(d.getTime())) return esc(String(dstr)); var dp=d.getDate()+' '+MON[d.getMonth()]; var now=new Date(); if(d.getFullYear()!==now.getFullYear()) dp+=' '+d.getFullYear(); var tp=(!allDay&&hasT)?apptTime(d):''; return '<b>'+dp+'</b>'+(tp?'<span class="appt__time">'+tp+'</span>':''); }
 function hMembers(){ return FD.data.members || []; }
 function hAge(m){ if(!m.birthday) return ''; var b=new Date(m.birthday); if(isNaN(b.getTime())) return ''; var t=new Date(); var a=t.getFullYear()-b.getFullYear(); var mo=t.getMonth()-b.getMonth(); if(mo<0||(mo===0&&t.getDate()<b.getDate())) a--; return a>=0?String(a):''; }
 function hBMI(h){ var cm=parseFloat(h.heightCm), kg=parseFloat(h.weightKg); if(!cm||!kg) return ''; var mt=cm/100; return (Math.round((kg/(mt*mt))*10)/10).toFixed(1); }
 function hStat(label,val,ico,go){
 var inner='<span class="hstat__ic">'+ico+'</span><div class="hstat__n">'+val+'</div><div class="hstat__l">'+label+'</div>';
 if(go) return '<button type="button" class="hstat hstat--go" data-sub="'+go+'">'+inner+'</button>';
 return '<div class="hstat">'+inner+'</div>';
 }
 function hChipDel(mid,key,id){ return '<button class="dchip__x" data-hdel data-mid="'+mid+'" data-key="'+key+'" data-id="'+id+'" aria-label="Remove"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>'; }
 function hRowDel(mid,key,id){ return '<button class="lrow__x" data-hdel data-mid="'+mid+'" data-key="'+key+'" data-id="'+id+'" aria-label="Remove"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>'; }
 function hEmpty(ico,title,desc,btn){ return '<div class="sub-ready"><span class="sub-ready__chip">'+ico+'</span><h2 class="sub-ready__title">'+title+'</h2><p class="sub-ready__desc">'+desc+'</p>'+(btn||'')+'</div>'; }
 function hSec(title,ico,body,modalType,mid){ return '<div class="hcard"><div class="hcard__head"><span class="hcard__ic">'+ico+'</span><h3 class="hcard__title">'+title+'</h3><button class="hadd" data-modal="'+modalType+'" data-mid="'+mid+'" aria-label="Add"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button></div>'+body+'</div>'; }
 function emRow(l,v){ return '<div class="emrow"><span class="emrow__l">'+l+'</span><span class="emrow__v">'+v+'</span></div>'; }

 function renderHealthOverview(){
 var el=$('#hOverview'); if(!el) return;
 var ms=hMembers();
 if(!ms.length){ el.innerHTML=hEmpty(H_HEART,'No members yet','Add your family first, each person\u2019s blood type, allergies, medications and records will gather here.','<button class="btn btn--primary" data-view="family" style="margin-top:4px">Open Family</button>'); return; }
 var nAl=0,nMe=0,nCo=0; ms.forEach(function(m){ nAl+=m.allergies.length; nMe+=m.medications.length; nCo+=m.conditions.length; });
 var stats='<div class="hstats">'+hStat('People',ms.length,H_PEOPLE)+hStat('Allergies',nAl,H_ALERT)+hStat('Medications',nMe,H_PILL)+hStat('Conditions',nCo,H_HEART)+'</div>';
 var alM=ms.filter(function(m){return m.allergies.length;});
 var alerts=alM.length?('<div class="hcard hcard--warn"><div class="hcard__head"><span class="hcard__ic">'+H_ALERT+'</span><h3 class="hcard__title">Allergy alerts</h3></div>'+alM.map(function(m){ return '<div class="harow"><span class="harow__nm">'+esc(m.name)+'</span><div class="chiplist">'+m.allergies.map(function(a){return '<span class="dchip dchip--warn">'+esc(a.text)+'</span>';}).join('')+'</div></div>'; }).join('')+'</div>'):'';
 var cards='<div class="hmgrid">'+ms.map(function(m){
 var age=hAge(m); var sub=[]; if(m.relation) sub.push(esc(m.relation)); if(age) sub.push(age+' yrs');
 var flags=[]; if(m.allergies.length) flags.push(m.allergies.length+(m.allergies.length>1?' allergies':' allergy')); if(m.medications.length) flags.push(m.medications.length+' meds'); if(m.conditions.length) flags.push(m.conditions.length+(m.conditions.length>1?' conditions':' condition'));
 var fl=flags.length?flags.map(function(f){return '<span class="hflag">'+f+'</span>';}).join(''):'<span class="hflag hflag--ok">All clear</span>';
 return '<button class="hmini" data-hgo="'+m.id+'"><span class="hmini__av">'+avatarHTML(m,'hmini__ini')+'</span><div class="hmini__info"><div class="hmini__nm">'+esc(m.name)+'</div><div class="hmini__sub">'+(sub.join(' \u00b7 ')||'Family member')+'</div><div class="hmini__flags">'+roleChip(m)+fl+'</div></div>'+(m.bloodGroup?'<span class="hmini__blood">'+esc(m.bloodGroup)+'</span>':'')+'</button>';
 }).join('')+'</div>';
 var ua=healthAppts().filter(function(e){ if(e.completed) return false; var t=new Date(String(e.date).indexOf('T')>=0?e.date:(e.date+'T00:00')).getTime(); return !isNaN(t)&&t>=Date.now()-3600000; }).sort(function(a,b){return new Date(a.date)-new Date(b.date);}).slice(0,4);
 var apptCard=ua.length?('<div class="hcard"><div class="hcard__head"><span class="hcard__ic">'+H_CAL+'</span><h3 class="hcard__title">Upcoming appointments</h3></div>'+ua.map(function(e){ var m=FD.getMember(e.memberId); var dd=new Date(String(e.date).indexOf('T')>=0?e.date:(e.date+'T00:00')); var s=[]; if(m) s.push(esc(m.name)); if(e.apptType) s.push(esc(e.apptType)); if(!isNaN(dd.getTime())&&String(e.date).indexOf('T')>=0) s.push(apptTime(dd)); return '<button class="happtline" data-apptedit="'+e.id+'"><span class="happtline__d"><b>'+(isNaN(dd.getTime())?'?':dd.getDate())+'</b><span>'+(isNaN(dd.getTime())?'':MON[dd.getMonth()])+'</span></span><div class="happtline__main"><div class="happtline__t">'+esc(e.title)+'</div><div class="happtline__s">'+s.join(' \u00b7 ')+'</div></div><svg class="ico happtline__chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>'; }).join('')+'</div>'):'';
 el.innerHTML=stats+alerts+apptCard+'<div class="hsec-h">Family health</div>'+cards;
 }

 function renderHealthProfiles(){
 var el=$('#hProfiles'); if(!el) return;
 var ms=hMembers();
 if(!ms.length){ el.innerHTML=hEmpty(H_PEOPLE,'No members yet','Add your family members to start building their health profiles.','<button class="btn btn--primary" data-view="family" style="margin-top:4px">Open Family</button>'); return; }
 if(!hMember || !FD.getMember(hMember)) hMember=ms[0].id;
 var pills='<div class="hpills">'+ms.map(function(m){ var on=m.id===hMember; return '<button class="hpill'+(on?' is-on':'')+'" data-hsel="'+m.id+'"><span class="hpill__av">'+avatarHTML(m,'hpill__ini')+'</span><span class="hpill__nm">'+esc(m.name)+'</span></button>'; }).join('')+'</div>';
 var m=FD.getMember(hMember); var h=m.health||{}; var age=hAge(m); var bmi=hBMI(h);
 var heroSub=[]; if(m.relation) heroSub.push(esc(m.relation)); if(age) heroSub.push(age+' yrs');
 var hero='<div class="phero"><span class="phero__av">'+avatarHTML(m,'phero__ini')+'</span><div class="phero__info"><div class="phero__nm">'+esc(m.name)+'</div><div class="phero__sub">'+(heroSub.join(' \u00b7 ')||'Family member')+'</div></div><button class="btn btn--soft hedit" data-modal="healthprofile" data-mid="'+m.id+'"><svg class="ico" viewBox="0 0 24 24"><path d="M5 19h3.5L18 9.5 14.5 6 5 15.5V19Z"/><path d="M13 7.5 16.5 11"/></svg>Edit profile</button></div>';
 var vs='<div class="pstats">'
 +'<div class="pstat"><div class="pstat__l">Blood type</div><div class="pstat__v">'+(m.bloodGroup?esc(m.bloodGroup):'<span class="pmut">Not set</span>')+'</div></div>'
 +'<div class="pstat"><div class="pstat__l">Height</div><div class="pstat__v">'+(h.heightCm?esc(String(h.heightCm))+' cm':'<span class="pmut">\u2014</span>')+'</div></div>'
 +'<div class="pstat"><div class="pstat__l">Weight</div><div class="pstat__v">'+(h.weightKg?esc(String(h.weightKg))+' kg':'<span class="pmut">\u2014</span>')+'</div></div>'
 +'<div class="pstat"><div class="pstat__l">BMI</div><div class="pstat__v">'+(bmi?bmi:'<span class="pmut">\u2014</span>')+'</div></div>'
 +'</div>';
 var em=[];
 if(h.doctor) em.push(emRow('Doctor',esc(h.doctor)+(h.doctorPhone?' \u00b7 '+esc(h.doctorPhone):'')));
 if(h.clinic) em.push(emRow('Clinic',esc(h.clinic)));
 if(h.insurer) em.push(emRow('Insurance',esc(h.insurer)+(h.policyNo?' \u00b7 '+esc(h.policyNo):'')));
 if(h.emergencyName) em.push(emRow('Emergency',esc(h.emergencyName)+(h.emergencyRelation?' ('+esc(h.emergencyRelation)+')':'')+(h.emergencyPhone?' \u00b7 '+esc(h.emergencyPhone):'')));
 if(h.organDonor) em.push(emRow('Organ donor','Yes'));
 if(h.notes) em.push(emRow('Notes',esc(h.notes)));
 var emCard='<div class="hcard hcard--em"><div class="hcard__head"><span class="hcard__ic">'+H_SHIELD+'</span><h3 class="hcard__title">Emergency & care</h3></div>'+(em.length?em.join(''):'<p class="sec__empty">No emergency details yet. Tap \u201cEdit profile\u201d to add a doctor, insurance and emergency contact.</p>')+'</div>';
 var alBody=m.allergies.length?('<div class="chiplist">'+m.allergies.map(function(a){return '<span class="dchip dchip--warn">'+esc(a.text)+hChipDel(m.id,'allergies',a.id)+'</span>';}).join('')+'</div>'):'<p class="sec__empty">No allergies recorded.</p>';
 var coBody=m.conditions.length?('<div class="chiplist">'+m.conditions.map(function(c){return '<span class="dchip">'+esc(c.text)+hChipDel(m.id,'conditions',c.id)+'</span>';}).join('')+'</div>'):'<p class="sec__empty">No conditions recorded.</p>';
 var meBody=m.medications.length?m.medications.map(function(x){return '<div class="lrow"><div class="lrow__main"><div class="lrow__title">'+esc(x.name)+'</div>'+(x.dose?'<div class="lrow__sub">'+esc(x.dose)+'</div>':'')+'</div>'+hRowDel(m.id,'medications',x.id)+'</div>';}).join(''):'<p class="sec__empty">No medications recorded.</p>';
 var reBody=m.records.length?m.records.slice().reverse().map(function(x){var sub=[]; if(x.date) sub.push(ovDate(x.date)); if(x.note) sub.push(esc(x.note)); return '<div class="lrow"><div class="lrow__main"><div class="lrow__title">'+esc(x.title)+'</div>'+(sub.length?'<div class="lrow__sub">'+sub.join(' \u00b7 ')+'</div>':'')+'</div>'+hRowDel(m.id,'records',x.id)+'</div>';}).join(''):'<p class="sec__empty">No records yet.</p>';
 el.innerHTML=pills+hero+vs+emCard+'<div class="hcols">'+hSec('Allergies',H_ALERT,alBody,'allergy',m.id)+hSec('Conditions',H_HEART,coBody,'condition',m.id)+hSec('Medications',H_PILL,meBody,'medication',m.id)+hSec('Records',H_NOTE,reBody,'record',m.id)+'</div>';
 }

 function renderHealthMeds(){
 var el=$('#hMeds'); if(!el) return;
 var withMeds=hMembers().filter(function(m){return m.medications.length;});
 var total=0; hMembers().forEach(function(m){total+=m.medications.length;});
 if(!total){ el.innerHTML=hEmpty(H_PILL,'No medications yet','Medications you add to each profile appear here, gathered for the whole family.', hMembers().length?'<button class="btn btn--primary" data-hgo="'+hMembers()[0].id+'" style="margin-top:4px">Open Profiles</button>':''); return; }
 el.innerHTML='<div class="hsec-h">Medications \u00b7 '+total+'</div>'+withMeds.map(function(m){
 return '<div class="hcard"><button class="hperson" data-hgo="'+m.id+'"><span class="hperson__av">'+avatarHTML(m,'hperson__ini')+'</span><span class="hperson__nm">'+esc(m.name)+'</span><span class="hperson__ct">'+m.medications.length+'</span></button>'+m.medications.map(function(x){return '<div class="lrow"><div class="lrow__main"><div class="lrow__title">'+esc(x.name)+'</div>'+(x.dose?'<div class="lrow__sub">'+esc(x.dose)+'</div>':'')+'</div></div>';}).join('')+'</div>';
 }).join('');
 }

 function renderHealthRecords(){
 var el=$('#hRecords'); if(!el) return;
 var all=[]; hMembers().forEach(function(m){ m.records.forEach(function(x){ all.push({m:m,x:x}); }); });
 if(!all.length){ el.innerHTML=hEmpty(H_NOTE,'No records yet','Records you add to each profile, visits, results, notes, are collected here for the family.', hMembers().length?'<button class="btn btn--primary" data-hgo="'+hMembers()[0].id+'" style="margin-top:4px">Open Profiles</button>':''); return; }
 all.sort(function(a,b){ var da=a.x.date||'', db=b.x.date||''; return db<da?-1:(db>da?1:0); });
 el.innerHTML='<div class="hsec-h">Records \u00b7 '+all.length+'</div><div class="hcard">'+all.map(function(it){ var x=it.x,mm=it.m; var sub=[]; if(x.date) sub.push(ovDate(x.date)); if(x.note) sub.push(esc(x.note)); return '<div class="lrow lrow--rec"><span class="lrow__av">'+avatarHTML(mm,'lrow__ini')+'</span><div class="lrow__main"><div class="lrow__title">'+esc(x.title)+'</div><div class="lrow__sub">'+esc(mm.name)+(sub.length?' \u00b7 '+sub.join(' \u00b7 '):'')+'</div></div></div>'; }).join('')+'</div>';
 }

 function renderHealthAppts(){
 var el=$('#hAppts'); if(!el) return;
 var ms=hMembers();
 if(!ms.length){ el.innerHTML=hEmpty(H_CAL,'No members yet','Add your family members first, then schedule their appointments here.','<button class="btn btn--primary" data-view="family" style="margin-top:4px">Open Family</button>'); return; }
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="appointment"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add appointment</button></div>';
 var appts=healthAppts();
 if(!appts.length){ el.innerHTML=add+hEmpty(H_CAL,'No appointments yet','Schedule a visit, it\u2019ll appear here and on your shared family Calendar, colour-coded for everyone to see.',''); return; }
 var now=Date.now(), up=[], past=[];
 appts.forEach(function(e){ var t=new Date(String(e.date).indexOf('T')>=0?e.date:(e.date+'T00:00')).getTime(); if(isNaN(t))t=0; if(t>=now-3600000 && !e.completed) up.push(e); else past.push(e); });
 up.sort(function(a,b){return new Date(a.date)-new Date(b.date);});
 past.sort(function(a,b){return new Date(b.date)-new Date(a.date);});
 function row(e){ var m=FD.getMember(e.memberId);
 var av=m?('<span class="appt__av">'+avatarHTML(m,'appt__ini')+'</span>'):'<span class="appt__av appt__av--none">?</span>';
 var meta=[]; if(m) meta.push(esc(m.name)); if(e.apptType) meta.push(esc(e.apptType));
 var sub=[]; if(e.doctor) sub.push(esc(e.doctor)); if(e.location) sub.push(esc(e.location));
 return '<div class="appt'+(e.completed?' is-done':'')+'"><button class="appt__open" data-apptedit="'+e.id+'">'+av+'<div class="appt__main"><div class="appt__t">'+esc(e.title)+'</div><div class="appt__meta">'+(meta.join(' \u00b7 ')||'Appointment')+'</div>'+(sub.length?'<div class="appt__sub">'+sub.join(' \u00b7 ')+'</div>':'')+'</div><div class="appt__when">'+apptWhen(e.date,e.allDay)+'</div></button><button class="appt__del" data-apptdel="'+e.id+'" aria-label="Delete"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>'; }
 var html=add;
 if(up.length) html+='<div class="hsec-h">Upcoming \u00b7 '+up.length+'</div>'+up.map(row).join('');
 if(past.length) html+='<div class="hsec-h" style="margin-top:16px">Past \u00b7 '+past.length+'</div><div class="appt-past">'+past.map(row).join('')+'</div>';
 el.innerHTML=html;
 }
 var VITAL_TYPES=[
 {key:'weight',label:'Weight',unit:'kg',color:'#4F9A78',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M5.5 8.5h13l1.3 10.5a1 1 0 0 1-1 1.1H5.2a1 1 0 0 1-1-1.1L5.5 8.5Z"/><path d="M8.7 8.5a3.3 3.3 0 0 1 6.6 0"/><path d="M12 12.4l-1.3 2.3h2.6L12 12.4Z"/></svg>'},
 {key:'bp',label:'Blood pressure',unit:'mmHg',color:'#C75D66',bp:true,icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 19.5s-6.5-3.9-6.5-8.6C5.5 8.3 7.1 6.8 9.1 6.8c1.3 0 2.4.65 2.9 1.65.5-1 1.6-1.65 2.9-1.65 2 0 3.6 1.5 3.6 4.1 0 .5-.08 1-.22 1.45"/><path d="M3.5 13.2H7l1.4-2.8 1.9 4.6 1.3-2.6h2.4"/></svg>'},
 {key:'sugar',label:'Blood sugar',unit:'mg/dL',color:'#BE8E3C',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 3.5s6 6.6 6 10.4A6 6 0 0 1 6 13.9C6 10.1 12 3.5 12 3.5Z"/></svg>'},
 {key:'hr',label:'Heart rate',unit:'bpm',color:'#C2745E',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M3 12.5h3.6l1.7-5 3.4 10 2.3-7 1.4 2H21"/></svg>'},
 {key:'temp',label:'Temperature',unit:'\u00b0C',color:'#3F8DBF',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M10 13.6V5.5a2 2 0 1 1 4 0v8.1a4 4 0 1 1-4 0Z"/><path d="M12 14.4V9"/></svg>'},
 {key:'spo2',label:'Oxygen',unit:'%',color:'#5566C0',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 4v7"/><path d="M12 11c-.5-2-2-3-3.6-3C6.8 8 5.8 9.6 5.8 12c0 3 .6 6.2 3.2 6.2 1.5 0 2.5-1 2.5-3"/><path d="M12 11c.5-2 2-3 3.6-3C17.2 8 18.2 9.6 18.2 12c0 3-.6 6.2-3.2 6.2-1.5 0-2.5-1-2.5-3"/></svg>'}
 ];
 function vitalMeta(k){ for(var i=0;i<VITAL_TYPES.length;i++){ if(VITAL_TYPES[i].key===k) return VITAL_TYPES[i]; } return VITAL_TYPES[0]; }
 function todayStr(){ var d=new Date(),mo=d.getMonth()+1,da=d.getDate(); return d.getFullYear()+'-'+(mo<10?'0':'')+mo+'-'+(da<10?'0':'')+da; }
 function fmtNum(n){ n=Number(n); if(isNaN(n)) return '\u2013'; return (Math.round(n*10)/10).toString(); }
 function vSorted(arr){ return arr.slice().sort(function(a,b){ return String(a.date)<String(b.date)?-1:(String(a.date)>String(b.date)?1:0); }); }
 function sparkline(series,w,h){ w=w||220;h=h||46; var pad=5,all=[]; series.forEach(function(s){ all=all.concat(s.points); }); if(all.length<2) return '<div class="spark spark--mini">Add one more reading to see the trend</div>'; var min=Math.min.apply(null,all),max=Math.max.apply(null,all),range=(max-min)||1; var svg='<svg class="spark" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none">'; series.forEach(function(s){ if(s.points.length<2) return; var step=(w-pad*2)/(s.points.length-1); var d=s.points.map(function(p,i){ var x=pad+i*step,y=h-pad-((p-min)/range)*(h-pad*2); return (i===0?'M':'L')+x.toFixed(1)+' '+y.toFixed(1); }).join(' '); svg+='<path d="'+d+'" fill="none" stroke="'+s.color+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="'+(s.dim?'.4':'1')+'"/>'; var lp=s.points[s.points.length-1],lx=w-pad,ly=h-pad-((lp-min)/range)*(h-pad*2); svg+='<circle cx="'+lx.toFixed(1)+'" cy="'+ly.toFixed(1)+'" r="2.6" fill="'+s.color+'"/>'; }); svg+='</svg>'; return svg; }
 function vitalCard(m,t){
 var rs=vSorted((m.vitals||[]).filter(function(r){return r.type===t.key;}));
 if(!rs.length) return '';
 var latest=rs[rs.length-1], prev=rs.length>1?rs[rs.length-2]:null;
 var valStr=t.bp?(fmtNum(latest.value)+'<span class="vcard__sep">/</span>'+(latest.value2!=null?fmtNum(latest.value2):'\u2013')):fmtNum(latest.value);
 var delta='';
 if(prev && !t.bp){ var diff=Math.round((latest.value-prev.value)*10)/10; if(diff>0) delta='<span class="vdelta vdelta--up">\u2191 '+Math.abs(diff)+'</span>'; else if(diff<0) delta='<span class="vdelta vdelta--down">\u2193 '+Math.abs(diff)+'</span>'; else delta='<span class="vdelta vdelta--same">\u2192 0</span>'; }
 var series=t.bp?[{points:rs.map(function(r){return r.value;}),color:t.color},{points:rs.map(function(r){return r.value2!=null?r.value2:r.value;}),color:t.color,dim:true}]:[{points:rs.map(function(r){return r.value;}),color:t.color}];
 return '<button class="vcard" data-vadd="'+t.key+'" data-mid="'+m.id+'" style="--vc:'+t.color+'"><div class="vcard__top"><span class="vcard__ic">'+t.icon+'</span><span class="vcard__lab">'+esc(t.label)+'</span><span class="vcard__n">'+rs.length+'</span></div><div class="vcard__valrow"><span class="vcard__val">'+valStr+'</span><span class="vcard__unit">'+t.unit+'</span>'+delta+'</div><div class="vcard__spark">'+sparkline(series,220,46)+'</div><div class="vcard__date">Last: '+ovDate(latest.date)+'</div></button>';
 }
 function renderHealthVitals(){
 var el=$('#hVitals'); if(!el) return;
 var ms=hMembers();
 var PULSE='<svg class="ico" viewBox="0 0 24 24"><path d="M3 12.5h3.6l1.7-5 3.4 10 2.3-7 1.4 2H21"/></svg>';
 if(!ms.length){ el.innerHTML=hEmpty(PULSE,'No members yet','Add your family members first, then start tracking their vitals here.','<button class="btn btn--primary" data-view="family" style="margin-top:4px">Open Family</button>'); return; }
 if(!hMember || !FD.getMember(hMember)) hMember=ms[0].id;
 var m=FD.getMember(hMember); var vitals=m.vitals||[];
 var pills='<div class="hpills">'+ms.map(function(x){ var on=x.id===hMember; return '<button class="hpill'+(on?' is-on':'')+'" data-hsel="'+x.id+'"><span class="hpill__av">'+avatarHTML(x,'hpill__ini')+'</span><span class="hpill__nm">'+esc(x.name)+'</span></button>'; }).join('')+'</div>';
 var addBtn='<div class="happt-top"><button class="btn btn--primary" data-modal="vital" data-mid="'+m.id+'"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add reading</button></div>';
 var tracked=VITAL_TYPES.filter(function(t){ return vitals.some(function(r){return r.type===t.key;}); });
 var untracked=VITAL_TYPES.filter(function(t){ return !vitals.some(function(r){return r.type===t.key;}); });
 var cards=tracked.length?('<div class="vgrid">'+tracked.map(function(t){return vitalCard(m,t);}).join('')+'</div>'):'';
 var empty=(!vitals.length)?hEmpty(PULSE,'No readings yet','Pick a measurement below to log the first reading for '+esc(m.name)+'.',''):'';
 var startc=untracked.length?('<div class="vstart"><div class="vstart__lab">'+(vitals.length?'Track something new':'Start tracking')+'</div><div class="vstart__chips">'+untracked.map(function(t){ return '<button class="vchip" data-vadd="'+t.key+'" data-mid="'+m.id+'"><span class="vchip__ic" style="color:'+t.color+'">'+t.icon+'</span>'+esc(t.label)+'</button>'; }).join('')+'</div></div>'):'';
 var hist='';
 if(vitals.length){ var sorted=vitals.slice().sort(function(a,b){ return String(b.date)<String(a.date)?-1:(String(b.date)>String(a.date)?1:0); }); hist='<div class="hsec-h" style="margin-top:18px">History \u00b7 '+vitals.length+'</div><div class="hcard">'+sorted.map(function(r){ var t=vitalMeta(r.type); var val=t.bp?(fmtNum(r.value)+'/'+(r.value2!=null?fmtNum(r.value2):'\u2013')):fmtNum(r.value); return '<div class="lrow"><span class="vrow__ic" style="color:'+t.color+'">'+t.icon+'</span><div class="lrow__main"><div class="lrow__title">'+esc(t.label)+' \u00b7 '+val+' '+t.unit+'</div><div class="lrow__sub">'+ovDate(r.date)+(r.note?' \u00b7 '+esc(r.note):'')+'</div></div><button class="lrow__x" data-vdel="'+r.id+'" data-mid="'+m.id+'" aria-label="Delete"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>'; }).join('')+'</div>'; }
 el.innerHTML=pills+addBtn+cards+empty+startc+hist;
 }

 /* ============ RESPONSIBILITIES ============ */
 var FREQ_LABELS={once:'Once',daily:'Daily',weekly:'Weekly',monthly:'Monthly'};
 function freqLabel(k){ return FREQ_LABELS[k]||'Once'; }
 function agoText(ts){ if(!ts) return ''; var d=Math.floor((Date.now()-ts)/86400000); if(d<=0) return 'today'; if(d===1) return 'yesterday'; if(d<7) return d+' days ago'; if(d<14) return 'last week'; if(d<30) return Math.floor(d/7)+' weeks ago'; var mo=Math.floor(d/30); return mo<=1?'a month ago':mo+' months ago'; }
 var RESP_ICO='<svg class="ico" viewBox="0 0 24 24"><path d="M9.5 6.5H19M9.5 12H19M9.5 17.5H19"/><path d="M4.5 6.3l.9.9 1.6-1.7M4.5 11.8l.9.9 1.6-1.7M4.5 17.3l.9.9 1.6-1.7"/></svg>';
 function respRow(r){ var fk=r.frequency||'once'; var sub=[]; if(r.note) sub.push(esc(r.note)); if(r.done && r.doneAt) sub.push('Done '+agoText(r.doneAt)); var subStr=sub.length?'<span class="rsp__sub">'+sub.join(' \u00b7 ')+'</span>':'';
 return '<div class="rsp'+(r.done?' is-done':'')+'"><button class="rsp__chk'+(r.done?' is-on':'')+'" data-resptoggle="'+r.id+'" aria-label="Mark done"><svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4 4 10-10"/></svg></button><button class="rsp__main" data-respedit="'+r.id+'"><div class="rsp__title">'+esc(r.title)+'</div><div class="rsp__meta"><span class="rfreq rfreq--'+fk+'">'+freqLabel(fk)+'</span>'+subStr+'</div></button><button class="rsp__del" data-respdel="'+r.id+'" aria-label="Delete"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>'; }
 function renderResponsibilities(){
 var el=$('#respWrap'); if(!el) return;
 var ms=FD.data.members, reps=FD.data.responsibilities;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="responsibility"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add responsibility</button></div>';
 if(!reps.length){ el.innerHTML=add+hEmpty(RESP_ICO,'No responsibilities yet','Share the load, add chores and duties and assign them to family members so everyone knows their part.',''); return; }
 var done=reps.filter(function(r){return r.done;}).length, pct=Math.round(done/reps.length*100);
 var ppl={}; reps.forEach(function(r){ if(r.assignee && FD.getMember(r.assignee)) ppl[r.assignee]=1; });
 var stats='<div class="hstats"><div class="hstat"><span class="hstat__ic">'+H_PEOPLE+'</span><div class="hstat__n">'+Object.keys(ppl).length+'</div><div class="hstat__l">Assigned to</div></div><div class="hstat"><span class="hstat__ic">'+RESP_ICO+'</span><div class="hstat__n">'+reps.length+'</div><div class="hstat__l">Duties</div></div><div class="hstat"><span class="hstat__ic"><svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4 4 10-10"/></svg></span><div class="hstat__n">'+done+'</div><div class="hstat__l">Done</div></div></div>';
 var prog='<div class="rprog"><div class="rprog__bar"><span style="width:'+pct+'%"></span></div><div class="rprog__lab">'+pct+'% complete</div></div>';
 var html=add+stats+prog;
 ms.forEach(function(m){ var mine=reps.filter(function(r){return r.assignee===m.id;}); if(!mine.length) return; var d2=mine.filter(function(r){return r.done;}).length; html+='<div class="hcard"><div class="rgrouphd"><span class="rgrouphd__av">'+avatarHTML(m,'rgrouphd__ini')+'</span><span class="rgrouphd__nm">'+esc(m.name)+'</span><span class="rgrouphd__ct">'+d2+'/'+mine.length+'</span></div>'+mine.map(respRow).join('')+'</div>'; });
 var un=reps.filter(function(r){return !r.assignee || !FD.getMember(r.assignee);}); if(un.length){ var d3=un.filter(function(r){return r.done;}).length; html+='<div class="hcard"><div class="rgrouphd"><span class="rgrouphd__av rgrouphd__av--any">'+H_PEOPLE+'</span><span class="rgrouphd__nm">Anyone in the family</span><span class="rgrouphd__ct">'+d3+'/'+un.length+'</span></div>'+un.map(respRow).join('')+'</div>'; }
 el.innerHTML=html;
 }

 /* ============ DOCUMENTS ============ */
 var DOC_CATS=[
 {key:'id',label:'ID & Passport',color:'#3F8DBF',icon:'<svg class="ico" viewBox="0 0 24 24"><rect x="3.5" y="6" width="17" height="12" rx="2"/><circle cx="8.6" cy="11.4" r="1.9"/><path d="M5.8 15.4c.45-1.3 1.4-1.9 2.8-1.9s2.35.6 2.8 1.9"/><path d="M13.6 10h4M13.6 13h4"/></svg>'},
 {key:'insurance',label:'Insurance',color:'#2E86A8',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 3.3 5 5.7v5.1c0 4.3 2.9 7.4 7 8.9 4.1-1.5 7-4.6 7-8.9V5.7L12 3.3Z"/><path d="M9.1 11.7l2 2 3.7-3.9"/></svg>'},
 {key:'medical',label:'Medical',color:'#C75D66',icon:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3.2"/><path d="M12 8.4v7.2M8.4 12h7.2"/></svg>'},
 {key:'financial',label:'Financial',color:'#BE8E3C',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 9.3 12 5l8 4.3"/><path d="M5.6 9.6v7.4M9 9.6v7.4M15 9.6v7.4M18.4 9.6v7.4"/><path d="M4 18.6h16"/></svg>'},
 {key:'education',label:'Education',color:'#5566C0',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M3 9l9-4 9 4-9 4-9-4Z"/><path d="M7 11v4c0 1.1 2.2 2 5 2s5-.9 5-2v-4"/></svg>'},
 {key:'property',label:'Property & Home',color:'#9A7B4F',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 11 12 4.5 20 11"/><path d="M6 10v9.5h12V10"/><path d="M10 19.5v-5h4v5"/></svg>'},
 {key:'vehicle',label:'Vehicle',color:'#79819A',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M3.6 13.4 5 9.2A2 2 0 0 1 6.9 7.8h10.2A2 2 0 0 1 19 9.2l1.4 4.2"/><path d="M3.6 13.4h16.8V17a1 1 0 0 1-1 1h-1.4a1 1 0 0 1-1-1v-.4H7.4V17a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3.6Z"/><circle cx="7.6" cy="15.4" r="1"/><circle cx="16.4" cy="15.4" r="1"/></svg>'},
 {key:'legal',label:'Legal',color:'#956CA6',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 4v15M7 19h10"/><path d="M5.5 8.5h13M8.2 8.5 5.5 13.5h5.4L8.2 8.5Zm7.6 0-2.7 5h5.4l-2.7-5Z"/></svg>'},
 {key:'other',label:'Other',color:'#4F9A78',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M13 3.5H6.5A1.5 1.5 0 0 0 5 5v14a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V9.5L13 3.5Z"/><path d="M13 3.5V9.5h6"/></svg>'}
 ];
 function docCatMeta(k){ for(var i=0;i<DOC_CATS.length;i++){ if(DOC_CATS[i].key===k) return DOC_CATS[i]; } return DOC_CATS[DOC_CATS.length-1]; }
 var DOC_FILE_ICO='<svg class="ico" viewBox="0 0 24 24"><path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"/><path d="M13.5 3.6V8h4.4"/><path d="M9 13h6M9 16.5h4"/></svg>';
 var docSearch='', docCat='all';
 function daysUntil(ds){ if(!ds) return null; var p=String(ds).split('-'); if(p.length<3) return null; var d=new Date(parseInt(p[0],10),parseInt(p[1],10)-1,parseInt(p[2],10)); if(isNaN(d.getTime())) return null; var t=new Date(); t.setHours(0,0,0,0); d.setHours(0,0,0,0); return Math.round((d-t)/86400000); }
 function expiryBadge(ds){ var n=daysUntil(ds); if(n===null) return ''; if(n<0) return '<span class="docexp docexp--red">Expired</span>'; if(n===0) return '<span class="docexp docexp--amber">Expires today</span>'; if(n<=30) return '<span class="docexp docexp--amber">Expires in '+n+' day'+(n>1?'s':'')+'</span>'; return '<span class="docexp">Renews '+ovDate(ds)+'</span>'; }
 function planDueBadge(ds){ var n=daysUntil(ds); if(n===null) return ''; if(n<0) return '<span class="docexp docexp--red">Overdue '+Math.abs(n)+'d</span>'; if(n===0) return '<span class="docexp docexp--amber">Due today</span>'; if(n<=7) return '<span class="docexp docexp--amber">in '+n+'d</span>'; return '<span class="docexp">in '+n+'d</span>'; }
 function docOwnerName(o){ if(!o) return 'Whole family'; var m=FD.getMember(o); return m?m.name:'Whole family'; }
 function docAttsHTML(atts){ if(!atts||!atts.length) return ''; var imgs=atts.filter(function(a){return /^data:image\//.test(a.dataUrl||'');}); var files=atts.filter(function(a){return !/^data:image\//.test(a.dataUrl||'');}); var h=''; if(imgs.length) h+='<div class="docatts__imgs">'+imgs.map(function(a){return '<a class="docatt-img" href="'+a.dataUrl+'" target="_blank" rel="noopener" title="'+esc(a.name)+'"><img src="'+a.dataUrl+'" alt=""></a>';}).join('')+'</div>'; if(files.length) h+='<div class="docatts__files">'+files.map(function(a){return '<a class="docatt-file" href="'+a.dataUrl+'" download="'+esc(a.name)+'"><svg class="ico" viewBox="0 0 24 24"><path d="M13 3.5H6.5A1.5 1.5 0 0 0 5 5v14a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V9.5L13 3.5Z"/><path d="M13 3.5V9.5h6"/></svg><span>'+esc(a.name)+'</span></a>';}).join('')+'</div>'; return '<div class="docatts">'+h+'</div>'; }
 function renderDocuments(){
 var el=$('#docsWrap'); if(!el) return;
 var docs=FD.data.documents;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="document"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add document</button></div>';
 if(!docs.length){ el.innerHTML=add+hEmpty(DOC_FILE_ICO,'No documents yet','Keep important papers in one place, passports, certificates, insurance and more, with a reminder before they expire.',''); return; }
 var exp=0,soon=0; docs.forEach(function(d){ var n=daysUntil(d.expiry); if(n!==null){ if(n<0) exp++; else if(n<=30) soon++; } });
 var stats='<div class="hstats"><div class="hstat"><span class="hstat__ic">'+DOC_FILE_ICO+'</span><div class="hstat__n">'+docs.length+'</div><div class="hstat__l">Documents</div></div><div class="hstat"><span class="hstat__ic" style="color:#D9803D"><svg class="ico" viewBox="0 0 24 24"><path d="M12 7v5l3 2"/><circle cx="12" cy="12" r="8"/></svg></span><div class="hstat__n">'+soon+'</div><div class="hstat__l">Expiring soon</div></div><div class="hstat"><span class="hstat__ic" style="color:#C75D66"><svg class="ico" viewBox="0 0 24 24"><path d="M12 4.6 21 19.4H3L12 4.6Z"/><path d="M12 10.2v4"/><circle cx="12" cy="16.9" r=".8" fill="currentColor" stroke="none"/></svg></span><div class="hstat__n">'+exp+'</div><div class="hstat__l">Expired</div></div></div>';
 var search='<div class="docsearch"><svg class="ico docsearch__ic" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg><input type="text" id="docSearch" placeholder="Search documents\u2026" autocomplete="off"></div>';
 var counts={}; docs.forEach(function(d){ counts[d.category]=(counts[d.category]||0)+1; });
 var chips='<div class="docchips"><button class="docchip'+(docCat==='all'?' is-on':'')+'" data-docchip="all">All <span class="docchip__n">'+docs.length+'</span></button>'+DOC_CATS.filter(function(c){return counts[c.key];}).map(function(c){ return '<button class="docchip'+(docCat===c.key?' is-on':'')+'" data-docchip="'+c.key+'" style="--dc:'+c.color+'"><span class="docchip__dot"></span>'+esc(c.label)+' <span class="docchip__n">'+counts[c.key]+'</span></button>'; }).join('')+'</div>';
 el.innerHTML=add+stats+search+chips+'<div id="docList"></div>';
 var si=$('#docSearch'); if(si){ si.value=docSearch; si.addEventListener('input',function(){ docSearch=this.value; renderDocList(); }); }
 renderDocList();
 }
 function renderDocList(){
 var el=$('#docList'); if(!el) return;
 var q=docSearch.trim().toLowerCase();
 var list=FD.data.documents.filter(function(d){ if(docCat!=='all' && d.category!==docCat) return false; if(q){ var hay=(d.title+' '+(d.note||'')+' '+docOwnerName(d.owner)+' '+docCatMeta(d.category).label).toLowerCase(); if(hay.indexOf(q)<0) return false; } return true; });
 list.sort(function(a,b){ var na=daysUntil(a.expiry),nb=daysUntil(b.expiry); var ka=(na===null?999999:na),kb=(nb===null?999999:nb); if(ka!==kb) return ka-kb; return String(a.title).localeCompare(String(b.title)); });
 if(!list.length){ el.innerHTML='<div class="docempty">No documents match your search.</div>'; return; }
 el.innerHTML=list.map(function(d){ var c=docCatMeta(d.category); return '<div class="doccard" style="--dc:'+c.color+'"><div class="doccard__row"><button class="doccard__open" data-docedit="'+d.id+'"><span class="doccard__ic">'+c.icon+'</span><div class="doccard__main"><div class="doccard__t">'+esc(d.title)+'</div><div class="doccard__meta"><span class="doccard__cat">'+esc(c.label)+'</span><span class="doccard__own">'+esc(docOwnerName(d.owner))+'</span>'+expiryBadge(d.expiry)+'</div>'+(d.note?'<div class="doccard__note">'+esc(d.note)+'</div>':'')+'</div></button><button class="doccard__del" data-docdel="'+d.id+'" aria-label="Delete"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>'+docAttsHTML(d.attachments)+'</div>'; }).join('');
 }

 /* ============ FAMILY TREE ============ */
 var TREE_ICO='<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/><path d="M12 7v3.5M6 17v-2.5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1V17"/></svg>';
 function genOf(rel){ rel=rel||''; if(rel==='Grandparent') return 0; if(rel==='Parent') return 1; if(rel==='Partner'||rel==='Sibling') return 2; if(rel==='Child') return 3; return 4; }
 function renderFamilyTree(){
 var el=$('#treeWrap'); if(!el) return;
 var ms=FD.data.members;
 if(!ms.length){ el.innerHTML=hEmpty(TREE_ICO,'Your family tree is empty','Add family members and set each person\u2019s relation, they\u2019ll bloom here across the generations.','<button class="btn btn--primary" data-modal="member" style="margin-top:4px"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add member</button>'); return; }
 var GENS=['Grandparents','Parents','Your generation','Children','Extended family'];
 var buckets=[[],[],[],[],[]];
 ms.forEach(function(m){ buckets[genOf(m.relation)].push(m); });
 var genCount=buckets.filter(function(b){return b.length;}).length;
 var fam=familyName();
 var hd='<div class="tree-hd"><span class="tree-hd__leaf">'+TREE_ICO+'</span><div class="tree-hd__title">'+(fam?esc(fam):'Our family')+'</div><div class="tree-hd__sub">'+ms.length+' '+(ms.length>1?'people':'person')+' \u00b7 '+genCount+' generation'+(genCount>1?'s':'')+'</div></div>';
 var bands='';
 buckets.forEach(function(b,gi){ if(!b.length) return; bands+='<div class="gen"><span class="gen__label">'+GENS[gi]+'</span><div class="gen__nodes">'+b.map(function(m){ var rel=m.relation?esc(m.relation):'Family'; return '<button class="tnode" data-treemember="'+m.id+'"><span class="tnode__av">'+avatarHTML(m,'tnode__ini')+'</span><span class="tnode__nm">'+esc(m.name)+'</span><span class="tnode__rel">'+rel+'</span></button>'; }).join('')+'</div></div>'; });
 el.innerHTML=hd+'<div class="tree">'+bands+'</div>';
 }

 /* ============ FINANCE ============ */
 var CURRENCIES=[{code:'USD',sym:'$'},{code:'EUR',sym:'\u20ac'},{code:'GBP',sym:'\u00a3'},{code:'EGP',sym:'E\u00a3'},{code:'SAR',sym:'SAR '},{code:'AED',sym:'AED '},{code:'QAR',sym:'QAR '},{code:'KWD',sym:'KWD '},{code:'PKR',sym:'\u20a8'},{code:'INR',sym:'\u20b9'},{code:'BDT',sym:'\u09f3'},{code:'TRY',sym:'\u20ba'},{code:'IDR',sym:'Rp'},{code:'MYR',sym:'RM'},{code:'NGN',sym:'\u20a6'},{code:'ZAR',sym:'R'},{code:'CAD',sym:'C$'},{code:'AUD',sym:'A$'},{code:'JPY',sym:'\u00a5'},{code:'CNY',sym:'CN\u00a5'}];
 var EXP_CATS=[
 {key:'groceries',label:'Groceries',color:'#4F9A78',icon:'<svg class="ico" viewBox="0 0 24 24"><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M3 4h2l2.2 11a1 1 0 0 0 1 .8h8.5a1 1 0 0 0 1-.8L20 7.5H6"/></svg>'},
 {key:'dining',label:'Dining',color:'#D9803D',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10"/><path d="M16 3c-1.4 0-2.4 2-2.4 5s.9 4 2.4 4 2.4-1 2.4-4-1-5-2.4-5Zm0 13v5"/></svg>'},
 {key:'transport',label:'Transport',color:'#3F8DBF',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M3.6 13.4 5 9.2A2 2 0 0 1 6.9 7.8h10.2A2 2 0 0 1 19 9.2l1.4 4.2"/><path d="M3.6 13.4h16.8V17a1 1 0 0 1-1 1h-1.4a1 1 0 0 1-1-1v-.4H7.4V17a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3.6Z"/><circle cx="7.6" cy="15.4" r="1"/><circle cx="16.4" cy="15.4" r="1"/></svg>'},
 {key:'housing',label:'Housing',color:'#9A7B4F',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 11 12 4.5 20 11"/><path d="M6 10v9.5h12V10"/></svg>'},
 {key:'utilities',label:'Utilities',color:'#5566C0',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M13 2.5 5.5 13.2H11l-1 8.3 7.5-10.7H12l1-8.4Z"/></svg>'},
 {key:'health',label:'Health',color:'#C75D66',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 20s-7-4.25-7-9.1C5 8.2 6.75 6.6 9 6.6c1.45 0 2.65.72 3 1.8.35-1.08 1.55-1.8 3-1.8 2.25 0 4 1.6 4 4.3 0 4.85-7 9.1-7 9.1Z"/></svg>'},
 {key:'education',label:'Education',color:'#956CA6',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M3 9l9-4 9 4-9 4-9-4Z"/><path d="M7 11v4c0 1.1 2.2 2 5 2s5-.9 5-2v-4"/></svg>'},
 {key:'shopping',label:'Shopping',color:'#C75D8A',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>'},
 {key:'entertainment',label:'Entertainment',color:'#2E86A8',icon:'<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M10 8.5l5 3.5-5 3.5Z"/></svg>'},
 {key:'bills',label:'Bills',color:'#BE8E3C',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M6 3.5h9l3 3V20l-2-1.2L14 20l-2-1.2L10 20l-2-1.2L6 20V3.5Z"/><path d="M9 8h6M9 11.5h6"/></svg>'},
 {key:'kids',label:'Kids',color:'#E0A93C',icon:'<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="6" r="2"/><path d="M12 8v6M9 11h6M10 20l2-4 2 4"/></svg>'},
 {key:'charity',label:'Charity / Zakat',color:'#4A8FA8',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 21s-6-3.6-6-8.1a3 3 0 0 1 6-1 3 3 0 0 1 6 1C18 17.4 12 21 12 21Z"/></svg>'},
 {key:'travel',label:'Travel',color:'#3FA0B0',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M21 16.5 14 12V6a2 2 0 0 0-4 0v6l-7 4.5V18l7-2v3l-2 1.5V22l4-1 4 1v-1.5L14 19v-3l7 2v-1.5Z"/></svg>'},
 {key:'other',label:'Other',color:'#79819A',icon:'<svg class="ico" viewBox="0 0 24 24"><circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/></svg>'}
 ];
 var INC_CATS=[
 {key:'salary',label:'Salary',color:'#2E86A8',icon:'<svg class="ico" viewBox="0 0 24 24"><rect x="3.5" y="6.5" width="17" height="12" rx="2.5"/><path d="M3.5 10h17"/><circle cx="16.5" cy="14" r="1.4"/></svg>'},
 {key:'business',label:'Business',color:'#BE8E3C',icon:'<svg class="ico" viewBox="0 0 24 24"><rect x="3.5" y="7.5" width="17" height="11" rx="2"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 12h17"/></svg>'},
 {key:'investment',label:'Investment',color:'#5566C0',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 19V5M4 19h16"/><path d="M8 15l3-3 2.5 2.5L19 9"/></svg>'},
 {key:'gift',label:'Gift',color:'#C75D8A',icon:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M4 13h16M12 9v11"/><path d="M12 9c0-3-3-4-4-2s1 2 4 2Zm0 0c0-3 3-4 4-2s-1 2-4 2Z"/></svg>'},
 {key:'other',label:'Other',color:'#79819A',icon:'<svg class="ico" viewBox="0 0 24 24"><circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/></svg>'}
 ];
 var FIN_CUSTOM_ICO='<svg class="ico" viewBox="0 0 24 24"><path d="M4 12.6V6a2 2 0 0 1 2-2h6.6a2 2 0 0 1 1.4.6l5.8 5.8a2 2 0 0 1 0 2.8l-6.6 6.6a2 2 0 0 1-2.8 0L4.6 14a2 2 0 0 1-.6-1.4Z"/><circle cx="8.5" cy="8.5" r="1.3"/></svg>';
 function finCustomCats(){ return (FD.data.finance.customCats||[]).map(function(c){ return {key:c.key,label:c.label,color:c.color,icon:FIN_CUSTOM_ICO,custom:true}; }); }
 function catsFor(type){ return type==='income'?INC_CATS:EXP_CATS.concat(finCustomCats()); }
 function finCatMeta(type,key){ var a=catsFor(type); for(var i=0;i<a.length;i++){ if(a[i].key===key) return a[i]; } for(var j=0;j<a.length;j++){ if(a[j].key==='other') return a[j]; } return a[a.length-1]; }
 var PLAN_FREQ={weekly:'Weekly',monthly:'Monthly',yearly:'Yearly'};
 var PLAN_ICO='<svg class="ico" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v4h-4"/><path d="M12 8v4.5l3 1.7"/></svg>';
 function advanceDate(ds,freq){ var p=String(ds||todayStr()).split('-'); var dt=new Date(parseInt(p[0],10),parseInt(p[1],10)-1,parseInt(p[2],10)); if(isNaN(dt.getTime())) dt=new Date(); if(freq==='weekly'){ dt.setDate(dt.getDate()+7); } else if(freq==='yearly'){ dt.setFullYear(dt.getFullYear()+1); } else { var day=dt.getDate(); dt.setDate(1); dt.setMonth(dt.getMonth()+1); var dim=new Date(dt.getFullYear(),dt.getMonth()+1,0).getDate(); dt.setDate(Math.min(day,dim)); } var mm=dt.getMonth()+1, dd=dt.getDate(); return dt.getFullYear()+'-'+(mm<10?'0':'')+mm+'-'+(dd<10?'0':'')+dd; }
 function monthlyEquiv(p){ var a=Number(p.amount)||0; if(p.frequency==='weekly') return a*52/12; if(p.frequency==='yearly') return a/12; return a; }
 var FIN_ICO='<svg class="ico" viewBox="0 0 24 24"><rect x="3.5" y="6.5" width="17" height="12" rx="2.5"/><path d="M3.5 10h17"/><circle cx="16.5" cy="14" r="1.4"/></svg>';
 var BUDGET_ICO='<svg class="ico" viewBox="0 0 24 24"><path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5"/><path d="M12 3.5V12h8.5"/></svg>';
 var STATS_ICO='<svg class="ico" viewBox="0 0 24 24"><path d="M5 20V10M12 20V4M19 20v-7"/></svg>';
 function curSymbol(){ var c=FD.data.finance.currency; for(var i=0;i<CURRENCIES.length;i++){ if(CURRENCIES[i].code===c) return CURRENCIES[i].sym; } return '$'; }
 function nfmt(n){ n=Math.round((Number(n)||0)*100)/100; var p=n.toFixed(2).split('.'); p[0]=p[0].replace(/\B(?=(\d{3})+(?!\d))/g,','); return p[0]+(p[1]==='00'?'':'.'+p[1]); }
 function fmtMoney(n){ n=Number(n)||0; return (n<0?'-':'')+curSymbol()+nfmt(Math.abs(n)); }
 function ymOf(ds){ return String(ds).slice(0,7); }
 function curYM(){ var d=new Date(),mo=d.getMonth()+1; return d.getFullYear()+'-'+(mo<10?'0':'')+mo; }
 function ymLabel(ym){ var p=String(ym).split('-'); return (MON[parseInt(p[1],10)-1]||'')+' '+p[0]; }
 function ymShift(ym,delta){ var p=String(ym).split('-'); var y=parseInt(p[0],10),m=parseInt(p[1],10)-1+delta; y+=Math.floor(m/12); m=((m%12)+12)%12; return y+'-'+((m+1)<10?'0':'')+(m+1); }
 function txMonth(ym){ return FD.data.finance.transactions.filter(function(t){ return ymOf(t.date)===ym; }); }
 function donut(segs,size){ size=size||168; var sw=Math.round(size*0.2),r=(size-sw)/2,cx=size/2,cy=size/2,circ=2*Math.PI*r; var total=segs.reduce(function(a,s){return a+s.value;},0); if(total<=0) return '<svg class="donut" viewBox="0 0 '+size+' '+size+'"><circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="var(--border)" stroke-width="'+sw+'"/></svg>'; var off=0,cs=''; segs.forEach(function(s){ if(s.value<=0) return; var len=s.value/total*circ; cs+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+s.color+'" stroke-width="'+sw+'" stroke-dasharray="'+len.toFixed(2)+' '+(circ-len).toFixed(2)+'" stroke-dashoffset="'+(-off).toFixed(2)+'" transform="rotate(-90 '+cx+' '+cy+')"/>'; off+=len; }); return '<svg class="donut" viewBox="0 0 '+size+' '+size+'">'+cs+'</svg>'; }
 function txRow(t){ var m=finCatMeta(t.type,t.category); var who=(t.member&&FD.getMember(t.member))?FD.getMember(t.member).name:'Household'; var parts=[ovDate(t.date),who]; if(t.note) parts.push(esc(t.note)); var sign=t.type==='income'?'+':'\u2212'; return '<div class="ftx"><button class="ftx__open" data-txedit="'+t.id+'"><span class="ftx__ic" style="color:'+m.color+'">'+m.icon+'</span><div class="ftx__main"><div class="ftx__t">'+esc(m.label)+'</div><div class="ftx__s">'+parts.join(' \u00b7 ')+'</div></div><div class="ftx__amt ftx__amt--'+t.type+'">'+sign+curSymbol()+nfmt(t.amount)+'</div></button><button class="ftx__del" data-txdel="'+t.id+'" aria-label="Delete"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>'; }
 function hReady(ico,title,desc){ return '<div class="sub-ready"><span class="sub-ready__chip">'+ico+'</span><h2 class="sub-ready__title">'+title+'</h2><p class="sub-ready__desc">'+desc+'</p><span class="ready__badge"><span class="dot"></span> Coming next</span></div>'; }

 function finPulse(){
 var fin=FD.data.finance, ymN=curYM();
 var budgets=fin.budgets||{}, bkeys=Object.keys(budgets), bt;
 if(bkeys.length){ var totB=0,spB=0; bkeys.forEach(function(k){ totB+=budgets[k]; }); txMonth(ymN).forEach(function(t){ if(t.type==='expense'&&budgets[t.category]!=null) spB+=t.amount; }); var bp=totB>0?Math.round(spB/totB*100):0, bc=bp>100?'is-over':(bp>=80?'is-warn':''); bt='<button class="fpulse '+bc+'" data-sub="finance-budget"><span class="fpulse__k">Budget used</span><span class="fpulse__v">'+bp+'%</span><span class="fpulse__sub">'+fmtMoney(spB)+' of '+fmtMoney(totB)+'</span></button>'; }
 else bt='<button class="fpulse fpulse--empty" data-sub="finance-budget"><span class="fpulse__k">Budget</span><span class="fpulse__v">Set</span><span class="fpulse__sub">No budgets yet</span></button>';
 var act=(fin.planned||[]).filter(function(p){return p.active;}), due=act.filter(function(p){ var n=daysUntil(p.nextDue); return n!==null&&n<=14; }), blt;
 if(act.length){ var nx=act.slice().sort(function(a,b){return String(a.nextDue||'9999').localeCompare(String(b.nextDue||'9999'));})[0], nn=nx?daysUntil(nx.nextDue):null; blt='<button class="fpulse'+(due.length?' is-warn':'')+'" data-sub="finance-planned"><span class="fpulse__k">Bills due soon</span><span class="fpulse__v">'+due.length+'</span><span class="fpulse__sub">'+(nx?('next: '+esc(nx.title)+(nn!=null?(nn<0?' \u00b7 overdue':nn===0?' \u00b7 today':' \u00b7 '+nn+'d'):'')):'none scheduled')+'</span></button>'; }
 else blt='<button class="fpulse fpulse--empty" data-sub="finance-planned"><span class="fpulse__k">Bills</span><span class="fpulse__v">Add</span><span class="fpulse__sub">No recurring yet</span></button>';
 var dac=(fin.debts||[]).filter(function(d){return d.paid<d.amount;}), dt;
 if(dac.length){ var ow=0,we=0; dac.forEach(function(d){ var rem=d.amount-d.paid; if(d.direction==='owed_to_us') ow+=rem; else we+=rem; }); var dn=ow-we; dt='<button class="fpulse" data-sub="finance-debts"><span class="fpulse__k">'+(dn>=0?'You\u2019re owed':'You owe')+'</span><span class="fpulse__v" style="color:'+(dn>=0?'#2E86A8':'#C75D66')+'">'+fmtMoney(Math.abs(dn))+'</span><span class="fpulse__sub">'+dac.length+' open</span></button>'; }
 else dt='<button class="fpulse fpulse--empty" data-sub="finance-debts"><span class="fpulse__k">Debts</span><span class="fpulse__v">Track</span><span class="fpulse__sub">All clear</span></button>';
 var sav=(fin.savings||[]), st;
 if(sav.length){ var ts=0,tt=0; sav.forEach(function(g){ ts+=g.saved; tt+=g.target; }); var sp=tt>0?Math.round(ts/tt*100):0; st='<button class="fpulse" data-sub="finance-savings"><span class="fpulse__k">Saved</span><span class="fpulse__v">'+fmtMoney(ts)+'</span><span class="fpulse__sub">'+sp+'% of goals</span></button>'; }
 else st='<button class="fpulse fpulse--empty" data-sub="finance-savings"><span class="fpulse__k">Savings</span><span class="fpulse__v">Start</span><span class="fpulse__sub">No goals yet</span></button>';
 return '<div class="hsec-h" style="margin-top:2px">Snapshot</div><div class="fpulse-grid">'+bt+blt+dt+st+'</div>';
 }
 function renderFinOverview(){
 var el=$('#finOverview'); if(!el) return;
 var ym=curYM(), tx=txMonth(ym), income=0,expense=0;
 tx.forEach(function(t){ if(t.type==='income') income+=t.amount; else expense+=t.amount; });
 var net=income-expense;
 var curSel='<select id="finCurSel" class="fcur" aria-label="Currency">'+CURRENCIES.map(function(c){ return '<option value="'+c.code+'"'+(c.code===FD.data.finance.currency?' selected':'')+'>'+c.code+'</option>'; }).join('')+'</select>';
 var head='<div class="fhead"><div><div class="fhead__mo">'+ymLabel(ym)+'</div><div class="fhead__sub">This month at a glance</div></div>'+curSel+'</div>';
 var cards='<div class="fsum"><div class="fsum__c fsum__c--in"><span class="fsum__lab">Income</span><span class="fsum__val">'+fmtMoney(income)+'</span></div><div class="fsum__c fsum__c--out"><span class="fsum__lab">Expenses</span><span class="fsum__val">'+fmtMoney(expense)+'</span></div><div class="fsum__c fsum__c--net"><span class="fsum__lab">Balance</span><span class="fsum__val'+(net<0?' is-neg':'')+'">'+fmtMoney(net)+'</span></div></div>';
 function wireCur(){ var s=$('#finCurSel'); if(s) s.addEventListener('change',function(){ FD.setCurrency(this.value); renderFinOverview(); }); }
 var pulse=finPulse();
 if(!tx.length){ el.innerHTML=head+cards+pulse+hEmpty(FIN_ICO,'No activity this month','Record the household\u2019s income and expenses to see exactly where the money goes, with live charts and budgets.','<button class="btn btn--primary" data-modal="transaction" style="margin-top:4px"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add transaction</button>'); wireCur(); return; }
 var byCat={}; tx.forEach(function(t){ if(t.type==='expense') byCat[t.category]=(byCat[t.category]||0)+t.amount; });
 var catArr=Object.keys(byCat).map(function(k){ var m=finCatMeta('expense',k); return {label:m.label,color:m.color,value:byCat[k]}; }).sort(function(a,b){return b.value-a.value;});
 var catCard='';
 if(catArr.length){ var legend=catArr.map(function(c){ var pct=expense>0?Math.round(c.value/expense*100):0; return '<div class="fleg"><span class="fleg__dot" style="background:'+c.color+'"></span><span class="fleg__lab">'+esc(c.label)+'</span><span class="fleg__val">'+fmtMoney(c.value)+'</span><span class="fleg__pct">'+pct+'%</span></div>'; }).join('');
 catCard='<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Where it went</h3></div><div class="fdonut-wrap"><div class="fdonut">'+donut(catArr.map(function(c){return {value:c.value,color:c.color};}),168)+'<div class="fdonut__center"><span class="fdonut__lab">Spent</span><span class="fdonut__num">'+fmtMoney(expense)+'</span></div></div><div class="fleg-list">'+legend+'</div></div></div>'; }
 var byMem={}; tx.forEach(function(t){ if(t.type==='expense'){ var k=t.member||'__h'; byMem[k]=(byMem[k]||0)+t.amount; } });
 var memArr=Object.keys(byMem).map(function(k){ var nm=(k!=='__h'&&FD.getMember(k))?FD.getMember(k).name:'Household'; return {label:nm,value:byMem[k]}; }).sort(function(a,b){return b.value-a.value;});
 var memMax=memArr.reduce(function(a,x){return Math.max(a,x.value);},0);
 var memCard=memArr.length?('<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Who spent</h3></div>'+memArr.map(function(it){ var w=memMax>0?Math.round(it.value/memMax*100):0; return '<div class="fbar"><div class="fbar__top"><span class="fbar__lab">'+esc(it.label)+'</span><span class="fbar__val">'+fmtMoney(it.value)+'</span></div><div class="fbar__track"><span class="fbar__fill" style="width:'+w+'%"></span></div></div>'; }).join('')+'</div>'):'';
 var recent=tx.slice().sort(function(a,b){ var c=String(b.date).localeCompare(String(a.date)); return c||(b.createdAt-a.createdAt); }).slice(0,5);
 var recentCard='<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Recent</h3><button class="fcard__link" data-sub="finance-transactions">All transactions</button></div>'+recent.map(txRow).join('')+'</div>';
 el.innerHTML=head+cards+pulse+catCard+memCard+recentCard;
 wireCur();
 }

 var finTxYM=curYM(), finTxFilter='all';
 var finStatsRange=6;
 function renderFinTx(){
 var el=$('#finTx'); if(!el) return;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="transaction"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add transaction</button></div>';
 if(!FD.data.finance.transactions.length){ el.innerHTML=add+hEmpty(FIN_ICO,'No transactions yet','Add your first income or expense, every entry feeds your monthly overview, budgets and statistics.',''); return; }
 var nav='<div class="fmonth"><button class="fmonth__nav" data-finmo="-1" aria-label="Previous month"><svg class="ico" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button><span class="fmonth__lab">'+ymLabel(finTxYM)+'</span><button class="fmonth__nav" data-finmo="1" aria-label="Next month"><svg class="ico" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button></div>';
 var income=0,expense=0; txMonth(finTxYM).forEach(function(t){ if(t.type==='income') income+=t.amount; else expense+=t.amount; });
 var sumBar='<div class="ftxsum"><span class="ftxsum__seg ftxsum__seg--in"><b>'+fmtMoney(income)+'</b><span>Income</span></span><span class="ftxsum__seg ftxsum__seg--out"><b>'+fmtMoney(expense)+'</b><span>Expenses</span></span><span class="ftxsum__seg ftxsum__seg--net"><b class="'+((income-expense)<0?'is-neg':'')+'">'+fmtMoney(income-expense)+'</b><span>Net</span></span></div>';
 var filt='<div class="ffilter"><button class="ffilt'+(finTxFilter==='all'?' is-on':'')+'" data-finfilt="all">All</button><button class="ffilt'+(finTxFilter==='income'?' is-on':'')+'" data-finfilt="income">Income</button><button class="ffilt'+(finTxFilter==='expense'?' is-on':'')+'" data-finfilt="expense">Expenses</button></div>';
 var tx=txMonth(finTxYM).filter(function(t){ return finTxFilter==='all'||t.type===finTxFilter; }).sort(function(a,b){ var c=String(b.date).localeCompare(String(a.date)); return c||(b.createdAt-a.createdAt); });
 var list=tx.length?('<div class="fcard">'+tx.map(txRow).join('')+'</div>'):('<div class="docempty">No '+(finTxFilter==='all'?'transactions':finTxFilter)+' in '+ymLabel(finTxYM)+'.</div>');
 el.innerHTML=add+nav+sumBar+filt+list;
 }
 function renderFinBudget(){
 var el=$('#finBudget'); if(!el) return;
 var ym=curYM(), budgets=FD.data.finance.budgets, cats=Object.keys(budgets);
 var addBtn='<div class="happt-top"><button class="btn btn--primary" data-modal="budget"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Set a budget</button></div>';
 var CUSTOM_CHIP='<button class="bchip bchip--new" data-budgetadd="__new__"><span class="bchip__ic"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span>Custom category</button>';
 var spentByCat={}; txMonth(ym).forEach(function(t){ if(t.type==='expense') spentByCat[t.category]=(spentByCat[t.category]||0)+t.amount; });
 if(!cats.length){
 var chips0=catsFor('expense').filter(function(c){return c.key!=='other';}).map(function(c){ return '<button class="bchip" data-budgetadd="'+c.key+'" style="--cc:'+c.color+'"><span class="bchip__ic">'+c.icon+'</span>'+esc(c.label)+(spentByCat[c.key]?' <span class="bchip__sp">'+fmtMoney(spentByCat[c.key])+'</span>':'')+'</button>'; }).join('')+CUSTOM_CHIP;
 el.innerHTML=addBtn+hEmpty(BUDGET_ICO,'No budgets yet','Set a monthly limit for the categories you want to watch, groceries, dining, bills, and see them fill as the household spends.','')+'<div class="bsetlab">Pick a category to start</div><div class="bchips">'+chips0+'</div>';
 return;
 }
 var totalBudget=0; cats.forEach(function(k){ totalBudget+=budgets[k]; });
 var spentBudgeted=0; cats.forEach(function(k){ spentBudgeted+=(spentByCat[k]||0); });
 var unbudgeted=0; Object.keys(spentByCat).forEach(function(k){ if(cats.indexOf(k)<0) unbudgeted+=spentByCat[k]; });
 var remaining=totalBudget-spentBudgeted, pct=totalBudget>0?Math.round(spentBudgeted/totalBudget*100):0;
 var cls=pct>100?'is-over':(pct>=80?'is-close':'');
 var now=new Date(), dim=new Date(now.getFullYear(),now.getMonth()+1,0).getDate(), daysLeft=dim-now.getDate();
 var hero='<div class="bhero '+cls+'"><div class="bhero__top"><div class="bhero__l"><div class="bhero__lab">Spent in '+ymLabel(ym)+'</div><div class="bhero__spent">'+fmtMoney(spentBudgeted)+'</div><div class="bhero__of">of '+fmtMoney(totalBudget)+' budgeted</div></div><div class="bhero__r"><div class="bhero__rlab">'+(remaining>=0?'Remaining':'Over by')+'</div><div class="bhero__rval">'+fmtMoney(Math.abs(remaining))+'</div></div></div><div class="bbar bbar--lg"><span class="bbar__fill" style="width:'+Math.min(100,pct)+'%"></span></div><div class="bhero__foot"><span>'+pct+'% used</span><span>'+(daysLeft>0?daysLeft+' day'+(daysLeft>1?'s':'')+' left':'last day')+'</span></div>'+(unbudgeted>0?'<div class="bhero__note"><svg class="ico" viewBox="0 0 24 24"><path d="M12 8v5M12 16h.01"/><circle cx="12" cy="12" r="9"/></svg>'+fmtMoney(unbudgeted)+' more spent in categories with no budget</div>':'')+'</div>';
 var arr=cats.map(function(k){ var lim=budgets[k],sp=spentByCat[k]||0; return {key:k,lim:lim,sp:sp,pct:lim>0?sp/lim:0}; }).sort(function(a,b){ return b.pct-a.pct; });
 var catCards=arr.map(function(it){ var cm=finCatMeta('expense',it.key); var p=it.lim>0?Math.round(it.sp/it.lim*100):0; var over=it.sp>it.lim, close=!over&&p>=80; var barColor=over?'#C75D66':(close?'#D9803D':cm.color); var foot=over?('<span class="bcat__rem is-over">Over by '+fmtMoney(it.sp-it.lim)+'</span>'):('<span class="bcat__rem">'+fmtMoney(it.lim-it.sp)+' left</span>');
 return '<div class="bcat'+(over?' is-over':(close?' is-close':''))+'" style="--cc:'+cm.color+'"><button class="bcat__open" data-budgetedit="'+it.key+'"><span class="bcat__ic">'+cm.icon+'</span><div class="bcat__main"><div class="bcat__top"><span class="bcat__nm">'+esc(cm.label)+'</span><span class="bcat__amt">'+fmtMoney(it.sp)+' <span class="bcat__lim">/ '+fmtMoney(it.lim)+'</span></span></div><div class="bbar"><span class="bbar__fill" style="width:'+Math.min(100,p)+'%;background:'+barColor+'"></span></div><div class="bcat__foot"><span class="bcat__pct">'+p+'%</span>'+foot+'</div></div></button><button class="bcat__del" data-budgetdel="'+it.key+'" aria-label="Remove budget"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>';
 }).join('');
 var unbud=catsFor('expense').filter(function(c){ return c.key!=='other' && cats.indexOf(c.key)<0; });
 var addSection='<div class="bsetlab">Set another budget</div><div class="bchips">'+unbud.map(function(c){ return '<button class="bchip'+(spentByCat[c.key]?' bchip--spent':'')+'" data-budgetadd="'+c.key+'" style="--cc:'+c.color+'"><span class="bchip__ic">'+c.icon+'</span>'+esc(c.label)+(spentByCat[c.key]?' <span class="bchip__sp">'+fmtMoney(spentByCat[c.key])+'</span>':'')+'</button>'; }).join('')+CUSTOM_CHIP+'</div>';
 el.innerHTML=addBtn+hero+'<div class="hsec-h" style="margin-top:6px">Category budgets</div>'+catCards+addSection;
 }
 function planRow(p){
 var cm=finCatMeta(p.type,p.category); var d=p.active?daysUntil(p.nextDue):null; var badge,bcls='';
 if(!p.active){ badge='Paused'; bcls='is-paused'; }
 else if(d==null){ badge='\u2014'; }
 else if(d<0){ badge='Overdue '+Math.abs(d)+'d'; bcls='is-over'; }
 else if(d===0){ badge='Due today'; bcls='is-today'; }
 else if(d<=7){ badge='in '+d+'d'; bcls='is-soon'; }
 else { badge='in '+d+'d'; }
 var sign=p.type==='income'?'+':'\u2212'; var memberChip='';
 if(p.member){ var m=FD.getMember(p.member); if(m) memberChip='<span class="prow__dot">\u00b7</span><span class="prow__who">'+esc(m.name)+'</span>'; }
 return '<div class="prow'+(p.active?'':' prow--paused')+'" style="--cc:'+cm.color+'"><span class="prow__ic" style="color:'+cm.color+'">'+cm.icon+'</span><div class="prow__main">'
 +'<div class="prow__top"><span class="prow__nm">'+esc(p.title)+'</span><span class="prow__amt'+(p.type==='income'?' prow__amt--in':'')+'">'+sign+curSymbol()+nfmt(p.amount)+'</span></div>'
 +'<div class="prow__meta"><span class="prow__freq">'+(PLAN_FREQ[p.frequency]||'Monthly')+'</span><span class="prow__dot">\u00b7</span><span class="prow__due">'+(p.nextDue?ovDate(p.nextDue):'no date')+'</span>'+memberChip+'</div>'
 +'<div class="prow__foot"><span class="pbadge '+bcls+'">'+badge+'</span><div class="prow__acts">'
 +(p.active?'<button class="prow__paid" data-planpaid="'+p.id+'">'+(p.type==='income'?'Mark received':'Mark paid')+'</button>':'<button class="prow__paid" data-panpause="'+p.id+'">Resume</button>')
 +'<button class="prow__ico" data-planedit="'+p.id+'" aria-label="Edit"><svg class="ico" viewBox="0 0 24 24"><path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.8-2.8L5 17.2V20Z"/><path d="M13.5 6.5l4 4"/></svg></button>'
 +(p.active?'<button class="prow__ico" data-panpause="'+p.id+'" aria-label="Pause"><svg class="ico" viewBox="0 0 24 24"><path d="M9 5v14M15 5v14"/></svg></button>':'')
 +'<button class="prow__ico prow__ico--del" data-pandel="'+p.id+'" aria-label="Delete"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>'
 +'</div></div></div></div>';
 }
 function renderFinPlanned(){
 var el=$('#finPlanned'); if(!el) return;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="planned"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add planned payment</button></div>';
 var all=FD.data.finance.planned||[];
 if(!all.length){ el.innerHTML=add+hEmpty(PLAN_ICO,'Nothing planned yet','Add your recurring bills, subscriptions and income, rent, Netflix, salary, and never be caught off guard by a due date again.',''); return; }
 var active=all.filter(function(p){return p.active;}), paused=all.filter(function(p){return !p.active;});
 var mInc=0,mExp=0; active.forEach(function(p){ var me=monthlyEquiv(p); if(p.type==='income') mInc+=me; else mExp+=me; });
 var mNet=mInc-mExp, ymNow=curYM();
 var dueThis=active.filter(function(p){ return ymOf(p.nextDue)===ymNow; }).length;
 var fore='<div class="pfore"><div class="pfore__h"><span class="pfore__ttl">Monthly forecast</span><span class="pfore__sub">'+active.length+' active'+(dueThis?' \u00b7 '+dueThis+' due this month':'')+'</span></div><div class="pfore__grid"><div class="pfore__cell"><span class="pfore__k">Income</span><span class="pfore__v pfore__v--in">+'+fmtMoney(mInc)+'</span></div><div class="pfore__cell"><span class="pfore__k">Expenses</span><span class="pfore__v pfore__v--ex">\u2212'+fmtMoney(mExp)+'</span></div><div class="pfore__cell"><span class="pfore__k">Net / mo</span><span class="pfore__v '+(mNet>=0?'pfore__v--in':'pfore__v--ex')+'">'+(mNet>=0?'+':'\u2212')+fmtMoney(Math.abs(mNet))+'</span></div></div></div>';
 var sorted=active.slice().sort(function(a,b){ return String(a.nextDue||'9999').localeCompare(String(b.nextDue||'9999')); });
 var pausedHTML=paused.length?('<div class="bsetlab">Paused</div>'+paused.map(planRow).join('')):'';
 el.innerHTML=add+fore+'<div class="hsec-h" style="margin-top:6px">Scheduled</div>'+sorted.map(planRow).join('')+pausedHTML;
 }
 var DEBT_ICO='<svg class="ico" viewBox="0 0 24 24"><path d="M16 4h4v4M20 4l-6 6"/><path d="M8 20H4v-4M4 20l6-6"/></svg>';
 function byDueOrAmount(a,b){ var ad=a.dueDate||'', bd=b.dueDate||''; if(ad&&bd) return String(ad).localeCompare(String(bd)); if(ad) return -1; if(bd) return 1; return (b.amount-b.paid)-(a.amount-a.paid); }
 function debtCard(d){
 var rem=d.amount-d.paid, isSettled=d.paid>=d.amount, inc=(d.direction==='owed_to_us'), col=inc?'#2E86A8':'#C75D66', pct=d.amount>0?Math.round(d.paid/d.amount*100):0;
 var dueBadge=''; if(!isSettled && d.dueDate){ var n=daysUntil(d.dueDate); if(n!==null){ if(n<0) dueBadge='<span class="docexp docexp--red">Overdue '+Math.abs(n)+'d</span>'; else if(n===0) dueBadge='<span class="docexp docexp--amber">Due today</span>'; else if(n<=14) dueBadge='<span class="docexp docexp--amber">in '+n+'d</span>'; else dueBadge='<span class="docexp">due '+ovDate(d.dueDate)+'</span>'; } }
 var sub=[]; if(d.member){ var m=FD.getMember(d.member); if(m) sub.push(esc(m.name)); } if(d.note) sub.push(esc(d.note)); var subLine=sub.join(' \u00b7 ');
 var dirIcon=inc?'<svg class="ico" viewBox="0 0 24 24"><path d="M19 5 5 19M5 19h9M5 19v-9"/></svg>':'<svg class="ico" viewBox="0 0 24 24"><path d="M5 19 19 5M19 5h-9M19 5v9"/></svg>';
 return '<div class="dcard'+(isSettled?' is-settled':'')+'" style="--cc:'+col+'"><div class="dcard__head"><span class="dcard__ic" style="color:'+col+'">'+dirIcon+'</span><div class="dcard__id"><span class="dcard__who">'+esc(d.person)+'</span>'+(subLine?'<span class="dcard__sub">'+subLine+'</span>':'')+'</div><div class="dcard__amts"><span class="dcard__rem" style="color:'+(isSettled?'var(--text-3)':col)+'">'+fmtMoney(rem)+'</span>'+((d.paid>0&&!isSettled)?'<span class="dcard__of">of '+fmtMoney(d.amount)+'</span>':'')+(isSettled?'<span class="dcard__done">Settled</span>':'')+'</div></div>'+((!isSettled&&d.paid>0)?'<div class="bbar" style="margin-top:11px"><span class="bbar__fill" style="width:'+pct+'%;background:'+col+'"></span></div>':'')+'<div class="dcard__foot">'+(dueBadge||'<span class="dcard__when">'+(d.date?'since '+ovDate(d.date):'')+'</span>')+'<div class="dcard__acts">'+(isSettled?'':'<button class="prow__paid" data-debtsettle="'+d.id+'">Settle up</button><button class="dcard__pay" data-debtpay="'+d.id+'">+ Payment</button>')+'<button class="prow__ico" data-debtedit="'+d.id+'" aria-label="Edit"><svg class="ico" viewBox="0 0 24 24"><path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.8-2.8L5 17.2V20Z"/><path d="M13.5 6.5l4 4"/></svg></button><button class="prow__ico prow__ico--del" data-debtdel="'+d.id+'" aria-label="Delete"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div></div></div>';
 }
 function renderFinDebts(){
 var el=$('#finDebts'); if(!el) return;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="debt"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Record a debt</button></div>';
 var all=FD.data.finance.debts||[];
 if(!all.length){ el.innerHTML=add+hEmpty(DEBT_ICO,'No debts tracked','Keep track of money lent and borrowed, who owes the family, and what the family owes, so nothing slips through.',''); return; }
 var active=all.filter(function(d){return d.paid<d.amount;}), settled=all.filter(function(d){return d.paid>=d.amount;});
 var owedToUs=0,weOwe=0; active.forEach(function(d){ var rem=d.amount-d.paid; if(d.direction==='owed_to_us') owedToUs+=rem; else weOwe+=rem; });
 var net=owedToUs-weOwe, netLabel=net>0?'You\u2019re up':(net<0?'You\u2019re down':'All square');
 var hero='<div class="dnet"><div class="dnet__cells"><div class="dnet__cell"><span class="dnet__k">Owed to you</span><span class="dnet__v dnet__v--in">'+fmtMoney(owedToUs)+'</span></div><div class="dnet__cell"><span class="dnet__k">You owe</span><span class="dnet__v dnet__v--ex">'+fmtMoney(weOwe)+'</span></div></div><div class="dnet__net"><span class="dnet__nlab">'+netLabel+'</span><span class="dnet__nval '+(net>=0?'dnet__nval--in':'dnet__nval--ex')+'">'+(net===0?fmtMoney(0):((net>0?'+':'\u2212')+fmtMoney(Math.abs(net))))+'</span></div></div>';
 var toUs=active.filter(function(d){return d.direction==='owed_to_us';}).sort(byDueOrAmount);
 var weO=active.filter(function(d){return d.direction==='we_owe';}).sort(byDueOrAmount);
 var sections='';
 if(toUs.length) sections+='<div class="bsetlab">Owed to you</div>'+toUs.map(debtCard).join('');
 if(weO.length) sections+='<div class="bsetlab">You owe</div>'+weO.map(debtCard).join('');
 if(!toUs.length && !weO.length) sections='<div class="w-ok" style="margin-bottom:14px"><svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4 4 10-10"/></svg><p>All debts settled, nothing outstanding right now.</p></div>';
 var settledHTML=settled.length?('<div class="bsetlab">Settled</div>'+settled.map(debtCard).join('')):'';
 el.innerHTML=add+hero+sections+settledHTML;
 }
 var SAVE_ICO='<svg class="ico" viewBox="0 0 24 24"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>';
 var SAVE_COLORS=['#1E3A7B','#BE8E3C','#C75D66','#5566C0','#4A8FA8','#C75D8A','#3FA0B0','#D9803D'];
 function savingRing(pct){ var size=62,sw=7,r=(size-sw)/2,c=2*Math.PI*r,p=Math.max(0,Math.min(100,pct)),off=c*(1-p/100); return '<svg class="sring" viewBox="0 0 '+size+' '+size+'"><circle cx="'+(size/2)+'" cy="'+(size/2)+'" r="'+r.toFixed(1)+'" fill="none" stroke="var(--surface-2)" stroke-width="'+sw+'"/><circle cx="'+(size/2)+'" cy="'+(size/2)+'" r="'+r.toFixed(1)+'" fill="none" stroke="var(--cc,var(--brand))" stroke-width="'+sw+'" stroke-linecap="round" stroke-dasharray="'+c.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'" transform="rotate(-90 '+(size/2)+' '+(size/2)+')"/><text x="'+(size/2)+'" y="'+(size/2)+'" text-anchor="middle" dominant-baseline="central" class="sring__t">'+Math.round(p)+'%</text></svg>'; }
 function savingCard(g){
 var pct=g.target>0?(g.saved/g.target*100):0, reached=(g.saved>=g.target && g.target>0), col=g.color||'#1E3A7B', remaining=g.target-g.saved;
 var dueBadge=''; if(!reached && g.targetDate){ var n=daysUntil(g.targetDate); if(n!==null){ if(n<0) dueBadge='<span class="docexp docexp--red">Past target '+Math.abs(n)+'d</span>'; else if(n<=30) dueBadge='<span class="docexp docexp--amber">'+n+'d left</span>'; else dueBadge='<span class="docexp">by '+ovDate(g.targetDate)+'</span>'; } }
 var metaBits=[]; if(g.member){ var m=FD.getMember(g.member); if(m) metaBits.push(esc(m.name)); } if(g.note) metaBits.push(esc(g.note));
 return '<div class="scard'+(reached?' is-reached':'')+'" style="--cc:'+col+'"><div class="scard__top">'+savingRing(pct)+'<div class="scard__info"><div class="scard__title">'+esc(g.title)+(reached?' <span class="scard__chip">Reached</span>':'')+'</div><div class="scard__amt"><span class="scard__saved" style="color:'+col+'">'+fmtMoney(g.saved)+'</span> <span class="scard__target">of '+fmtMoney(g.target)+'</span></div>'+(metaBits.length?'<div class="scard__meta">'+metaBits.join(' \u00b7 ')+'</div>':'')+'</div></div><div class="scard__foot">'+(reached?'<span class="scard__rem scard__rem--done">Goal reached \ud83c\udf89</span>':('<span class="scard__rem">'+fmtMoney(remaining)+' to go</span>'+(dueBadge?' '+dueBadge:'')))+'<div class="scard__acts">'+(reached?'':'<button class="prow__paid" data-savecontrib="'+g.id+'">+ Add</button>')+'<button class="prow__ico" data-saveedit="'+g.id+'" aria-label="Edit"><svg class="ico" viewBox="0 0 24 24"><path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.8-2.8L5 17.2V20Z"/><path d="M13.5 6.5l4 4"/></svg></button><button class="prow__ico prow__ico--del" data-savedel="'+g.id+'" aria-label="Delete"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div></div></div>';
 }
 function renderFinSavings(){
 var el=$('#finSavings'); if(!el) return;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="saving"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>New savings goal</button></div>';
 var all=FD.data.finance.savings||[];
 if(!all.length){ el.innerHTML=add+hEmpty(SAVE_ICO,'No savings goals yet','Set aside money for what matters, an emergency fund, Hajj, a car, a family trip, and watch each goal fill up.',''); return; }
 var totSaved=0,totTarget=0,reached=0; all.forEach(function(g){ totSaved+=g.saved; totTarget+=g.target; if(g.target>0 && g.saved>=g.target) reached++; });
 var pct=totTarget>0?Math.round(totSaved/totTarget*100):0;
 var hero='<div class="shero"><div class="shero__top"><div><div class="shero__lab">Total saved</div><div class="shero__v">'+fmtMoney(totSaved)+'</div><div class="shero__of">of '+fmtMoney(totTarget)+' across '+all.length+' goal'+(all.length>1?'s':'')+'</div></div><div class="shero__pct">'+pct+'%</div></div><div class="bbar bbar--lg"><span class="bbar__fill" style="width:'+Math.min(100,pct)+'%"></span></div>'+(reached?'<div class="shero__note">\ud83c\udf89 '+reached+' goal'+(reached>1?'s':'')+' reached, mubarak!</div>':'')+'</div>';
 var sorted=all.slice().sort(function(a,b){ var ar=(a.target>0&&a.saved>=a.target)?1:0, br=(b.target>0&&b.saved>=b.target)?1:0; if(ar!==br) return ar-br; var ap=a.target>0?a.saved/a.target:0, bp=b.target>0?b.saved/b.target:0; return bp-ap; });
 el.innerHTML=add+hero+sorted.map(savingCard).join('');
 }
 function statBars(rows){
 var W=336,H=158,padL=6,padR=6,padT=12,padB=24,plotH=H-padT-padB,plotW=W-padL-padR;
 var maxV=1; rows.forEach(function(r){ if(r.inc>maxV)maxV=r.inc; if(r.exp>maxV)maxV=r.exp; });
 var n=rows.length||1, groupW=plotW/n, barW=Math.max(5,Math.min(13,(groupW-6)/2)), gap=3, baseY=padT+plotH;
 var grid=''; for(var g=0;g<=3;g++){ var gy=(padT+plotH*g/3).toFixed(1); grid+='<line x1="'+padL+'" y1="'+gy+'" x2="'+(W-padR)+'" y2="'+gy+'" class="sgrid"/>'; }
 var bars=''; rows.forEach(function(r,i){ var cx=padL+groupW*i+groupW/2; var ih=maxV>0?r.inc/maxV*plotH:0, eh=maxV>0?r.exp/maxV*plotH:0; var x1=(cx-barW-gap/2), x2=(cx+gap/2);
 bars+='<rect x="'+x1.toFixed(1)+'" y="'+(baseY-ih).toFixed(1)+'" width="'+barW.toFixed(1)+'" height="'+Math.max(0,ih).toFixed(1)+'" rx="2.5" class="sbar sbar--in"></rect>';
 bars+='<rect x="'+x2.toFixed(1)+'" y="'+(baseY-eh).toFixed(1)+'" width="'+barW.toFixed(1)+'" height="'+Math.max(0,eh).toFixed(1)+'" rx="2.5" class="sbar sbar--ex"></rect>';
 bars+='<text x="'+cx.toFixed(1)+'" y="'+(H-8)+'" class="slbl" text-anchor="middle">'+esc(r.label)+'</text>';
 });
 return '<div class="schartwrap"><svg viewBox="0 0 '+W+' '+H+'" class="schart" preserveAspectRatio="xMidYMid meet">'+grid+bars+'</svg></div>';
 }
 function renderFinStats(){
 var el=$('#finStats'); if(!el) return;
 if(!FD.data.finance.transactions.length){ el.innerHTML=hEmpty(STATS_ICO,'No statistics yet','Add a few transactions and this page comes alive, income vs spending trends, where your money goes, and who spent what.',''); return; }
 var range=finStatsRange||6, cur=curYM();
 var seg='<div class="strng">'+[3,6,12].map(function(nn){ return '<button class="strng__b'+(nn===range?' is-on':'')+'" data-statrange="'+nn+'">'+nn+'M</button>'; }).join('')+'</div>';
 var months=[]; for(var i=range-1;i>=0;i--) months.push(ymShift(cur,-i));
 var rows=months.map(function(ym){ var inc=0,exp=0; FD.data.finance.transactions.forEach(function(t){ if(ymOf(t.date)===ym){ if(t.type==='income') inc+=t.amount; else exp+=t.amount; } }); var mn=parseInt(String(ym).split('-')[1],10); return {ym:ym,label:(range>8?(MON[mn-1]||'').charAt(0):(MON[mn-1]||'').slice(0,3)),inc:inc,exp:exp}; });
 var totInc=0,totExp=0; rows.forEach(function(r){ totInc+=r.inc; totExp+=r.exp; });
 var net=totInc-totExp, saveRate=totInc>0?Math.round(net/totInc*100):0;
 var trend='<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Income vs Expenses</h3><div class="slgnd"><span class="slgnd__i"><i class="slgnd__dot slgnd__dot--in"></i>In</span><span class="slgnd__i"><i class="slgnd__dot slgnd__dot--ex"></i>Out</span></div></div>'+statBars(rows)+'</div>';
 var kpis='<div class="skpi"><div class="skpi__t"><div class="skpi__k">Income</div><div class="skpi__v skpi__v--in">'+fmtMoney(totInc)+'</div></div><div class="skpi__t"><div class="skpi__k">Expenses</div><div class="skpi__v skpi__v--ex">'+fmtMoney(totExp)+'</div></div><div class="skpi__t"><div class="skpi__k">'+(net>=0?'Net saved':'Overspent')+'</div><div class="skpi__v '+(net>=0?'skpi__v--in':'skpi__v--ex')+'">'+fmtMoney(Math.abs(net))+'</div></div><div class="skpi__t"><div class="skpi__k">Savings rate</div><div class="skpi__v">'+saveRate+'%</div></div></div>';
 var lastYM=ymShift(cur,-1), tE=0, lE=0; FD.data.finance.transactions.forEach(function(t){ if(t.type==='expense'){ if(ymOf(t.date)===cur) tE+=t.amount; else if(ymOf(t.date)===lastYM) lE+=t.amount; } });
 var momPct=lE>0?Math.round((tE-lE)/lE*100):(tE>0?100:0), up=tE>=lE, momKnown=(lE>0||tE>0);
 var mom='<div class="fcard smom"><div class="smom__l"><div class="smom__k">This month\u2019s spending</div><div class="smom__v">'+fmtMoney(tE)+'</div><div class="smom__sub">vs '+fmtMoney(lE)+' last month</div></div><div class="smom__badge '+(up?'is-up':'is-down')+'">'+(momKnown?('<svg class="ico" viewBox="0 0 24 24"><path d="'+(up?'M12 19V5M6 11l6-6 6 6':'M12 5v14M6 13l6 6 6-6')+'"/></svg>'+Math.abs(momPct)+'%'):'\u2014')+'</div></div>';
 var catTot={}; FD.data.finance.transactions.forEach(function(t){ if(t.type==='expense'&&months.indexOf(ymOf(t.date))>=0) catTot[t.category]=(catTot[t.category]||0)+t.amount; });
 var catArr=Object.keys(catTot).map(function(k){ return {key:k,val:catTot[k]}; }).sort(function(a,b){ return b.val-a.val; });
 var catMax=catArr.length?catArr[0].val:1;
 var catRows=catArr.length?catArr.map(function(it){ var cm=finCatMeta('expense',it.key); var sh=totExp>0?Math.round(it.val/totExp*100):0; return '<div class="stbar"><span class="stbar__ic" style="color:'+cm.color+'">'+cm.icon+'</span><div class="stbar__main"><div class="stbar__top"><span class="stbar__nm">'+esc(cm.label)+'</span><span class="stbar__amt">'+fmtMoney(it.val)+' <span class="stbar__pct">'+sh+'%</span></span></div><div class="stbar__track"><span class="stbar__fill" style="width:'+Math.max(4,Math.round(it.val/catMax*100))+'%;background:'+cm.color+'"></span></div></div></div>'; }).join(''):'<p class="sec__empty">No spending in this period.</p>';
 var catCard='<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Where money went</h3></div>'+catRows+'</div>';
 var memTot={}; FD.data.finance.transactions.forEach(function(t){ if(t.type==='expense'&&months.indexOf(ymOf(t.date))>=0){ var mk=t.member||'__hh'; memTot[mk]=(memTot[mk]||0)+t.amount; } });
 var memArr=Object.keys(memTot).map(function(k){ return {key:k,val:memTot[k]}; }).sort(function(a,b){ return b.val-a.val; });
 var memMax=memArr.length?memArr[0].val:1;
 var memRows=memArr.length?memArr.map(function(it){ var nm,av; if(it.key==='__hh'){ nm='Whole household'; av='<span class="stbar__av stbar__av--hh"><svg class="ico" viewBox="0 0 24 24"><path d="M4 11 12 4.5 20 11M6 10v9.5h12V10"/></svg></span>'; } else { var m=FD.getMember(it.key); if(!m) return ''; nm=m.name; av='<span class="stbar__av">'+avatarHTML(m,'stbar__ini')+'</span>'; } var sh=totExp>0?Math.round(it.val/totExp*100):0; return '<div class="stbar">'+av+'<div class="stbar__main"><div class="stbar__top"><span class="stbar__nm">'+esc(nm)+'</span><span class="stbar__amt">'+fmtMoney(it.val)+' <span class="stbar__pct">'+sh+'%</span></span></div><div class="stbar__track"><span class="stbar__fill" style="width:'+Math.max(4,Math.round(it.val/memMax*100))+'%"></span></div></div></div>'; }).join(''):'<p class="sec__empty">No spending in this period.</p>';
 var memCard='<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Who spent</h3></div>'+memRows+'</div>';
 el.innerHTML=seg+trend+kpis+mom+catCard+memCard;
 }

 function navigateSub(space, sub){
 var key = space+'-'+sub;
 var found = false;
 $$('#view-'+space+' .subtab').forEach(function(t){
 var on = t.getAttribute('data-sub')===key;
 if(on) found = true;
 t.classList.toggle('is-active', on);
 t.setAttribute('aria-selected', on?'true':'false');
 if(on){ try{ t.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'}); }catch(e){} }
 });
 if(!found){ sub='dashboard'; key=space+'-dashboard';
 $$('#view-'+space+' .subtab').forEach(function(t){ var on=t.getAttribute('data-sub')===key; t.classList.toggle('is-active',on); t.setAttribute('aria-selected',on?'true':'false'); });
 }
 $$('#view-'+space+' .subpanel').forEach(function(p){ p.classList.toggle('is-active', p.id==='sub-'+key); });
 Store.set('fw.sub.'+space, sub);
 if(space==='family' && sub==='dashboard') renderDashboard();
 if(space==='family' && sub==='members') showMembersList();
 if(space==='family' && sub==='governance') renderGovernance();
 if(space==='family' && sub==='meetings') showMeetingsList();
 if(space==='family' && sub==='goals') showGoalsList();
 if(space==='family' && sub==='calendar') showCalendar();
 if(space==='family' && sub==='communication') showComm();
 if(space==='family' && sub==='responsibilities') renderResponsibilities();
 if(space==='family' && sub==='documents') renderDocuments();
 if(space==='family' && sub==='familytree') renderFamilyTree();
 if(space==='finance' && sub==='dashboard') renderFinOverview();
 if(space==='finance' && sub==='transactions') renderFinTx();
 if(space==='finance' && sub==='planned') renderFinPlanned();
 if(space==='finance' && sub==='debts') renderFinDebts();
 if(space==='finance' && sub==='budget') renderFinBudget();
 if(space==='finance' && sub==='savings') renderFinSavings();
 if(space==='finance' && sub==='stats') renderFinStats();
 if(space==='health' && sub==='dashboard') renderHealthOverview();
 if(space==='health' && sub==='profiles') renderHealthProfiles();
 if(space==='health' && sub==='medications') renderHealthMeds();
 if(space==='health' && sub==='appointments') renderHealthAppts();
 if(space==='health' && sub==='records') renderHealthRecords();
 if(space==='health' && sub==='vitals') renderHealthVitals();
 if(space==='journal' && sub==='dashboard') renderJournalOverview();
 if(space==='journal' && sub==='entries') renderJournalEntries();
 if(space==='journal' && sub==='gratitude') renderJournalGratitude();
 if(space==='journal' && sub==='milestones') renderJournalMilestones();
 if(space==='cooking' && sub==='dashboard') renderCookingOverview();
 if(space==='cooking' && sub==='recipes') renderCookingRecipes();
 if(space==='cooking' && sub==='meals') renderCookingMeals();
 if(space==='cooking' && sub==='shopping') renderCookingShopping();
 if(space==='homemgmt' && sub==='dashboard') renderHomeOverview();
 if(space==='homemgmt' && sub==='chores') renderHomeChores();
 if(space==='homemgmt' && sub==='maintenance') renderHomeMaint();
 if(space==='homemgmt' && sub==='supplies') renderHomeSupplies();
 if(space==='learning' && sub==='dashboard') renderLearnOverview();
 if(space==='learning' && sub==='courses') renderLearnCourses();
 if(space==='learning' && sub==='books') renderLearnBooks();
 if(space==='learning' && sub==='skills') renderLearnSkills();
 if(space==='travel' && sub==='dashboard') renderTravelOverview();
 if(space==='travel' && sub==='trips') renderTravelTrips();
 if(space==='travel' && sub==='packing') renderTravelPacking();
 if(space==='travel' && sub==='bucket') renderTravelBucket();
 if(space==='fitness' && sub==='dashboard') renderFitOverview();
 if(space==='fitness' && sub==='workouts') renderFitWorkouts();
 if(space==='fitness' && sub==='goals') renderFitGoals();
 if(space==='fitness' && sub==='routines') renderFitRoutines();
 if(space==='nutrition' && sub==='dashboard') renderNutriOverview();
 if(space==='nutrition' && sub==='meals') renderNutriMeals();
 if(space==='nutrition' && sub==='water') renderNutriWater();
 if(space==='nutrition' && sub==='habits') renderNutriHabits();
 if(space==='planning' && sub==='dashboard') renderPlanOverview();
 if(space==='planning' && sub==='tasks') renderPlanTasks();
 if(space==='planning' && sub==='projects') renderPlanProjects();
 if(space==='planning' && sub==='week') renderPlanWeek();
 if(space==='relationship'){ if(rlUnlocked){ if(sub==='dashboard') renderRelUs(); if(sub==='notes') renderRelNotes(); if(sub==='dates') renderRelDates(); if(sub==='plans') renderRelPlans(); } else { renderRelLock(); } }
 if(space==='memory' && sub==='dashboard') renderMemOverview();
 if(space==='memory' && sub==='albums') renderMemAlbums();
 if(space==='memory' && sub==='stories') renderMemStories();
 if(space==='memory' && sub==='capsule') renderMemCapsule();
 if(space==='wellbeing' && sub==='dashboard') renderWbOverview();
 if(space==='wellbeing' && sub==='checkins') renderWbCheckins();
 if(space==='wellbeing' && sub==='selfcare') renderWbCare();
 if(space==='wellbeing' && sub==='growth') renderWbGrowth();
 if(space==='legacy' && sub==='dashboard') renderLegOverview();
 if(space==='legacy' && sub==='duas') renderLegDuas();
 if(space==='legacy' && sub==='deeds') renderLegDeeds();
 if(space==='legacy' && sub==='wisdom') renderLegWisdom();
 }

 /* ---- Family name + greeting ---- */
 function familyName(){ return (Store.get(K.family,'')||'').toString(); }
 function greetWord(){ var h=new Date().getHours(); return (h<5)?'Good evening':(h<12)?'Good morning':(h<18)?'Good afternoon':'Good evening'; }
 /* ===================== LEGACY ===================== */
 var LG_ICO={
 hands:'<svg class="ico" viewBox="0 0 24 24"><path d="M8.5 21c-1-2.5-1-4 0-6M15.5 21c1-2.5 1-4 0-6"/><path d="M12 15c-2.5 0-4.5-2-4.5-4.5C7.5 7 12 3 12 3s4.5 4 4.5 7.5C16.5 13 14.5 15 12 15Z"/></svg>',
 heart:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 4.5c1.6 0 3 .9 3.7 2.2C16.4 5.4 17.8 4.5 19.4 4.5c.9 3-.5 5.8-2.4 7.9-1.6 1.8-3.6 3.3-5 4.6-1.4-1.3-3.4-2.8-5-4.6C5.1 10.3 3.7 7.5 4.6 4.5 6.2 4.5 7.6 5.4 8.3 6.7 9 5.4 10.4 4.5 12 4.5Z"/><path d="M9 19.5h6"/></svg>',
 quote:'<svg class="ico" viewBox="0 0 24 24"><path d="M7 8h10M7 12h7"/><path d="M5 4.5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 3.5V5.5a1 1 0 0 1 1-1Z"/></svg>',
 star:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 3.5l2.2 5.1 5.3.4-4 3.5 1.2 5.2L12 20.4l-4.7 2.7 1.2-5.2-4-3.5 5.3-.4L12 3.5Z"/></svg>',
 moon:'<svg class="ico" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/></svg>',
 plus:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
 x:'<svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>'
 };
 function duaCard(d){
 return '<article class="lgdua"><span class="lgdua__orn">'+LG_ICO.moon+'</span><div class="lgdua__body">'+(d.title?'<div class="lgdua__t">'+esc(d.title)+'</div>':'')+'<div class="lgdua__text">'+esc(d.text||'').replace(/\n/g,'<br>')+'</div>'+(d.note?'<div class="lgdua__note">'+esc(d.note)+'</div>':'')+'</div><div class="lgdua__acts"><button class="ckmeal__b" data-lgded="'+d.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-lgddel="'+d.id+'" aria-label="Delete">'+LG_ICO.x+'</button></div></article>';
 }
 function renderLegDuas(){
 var el=$('#lgDuas'); if(!el) return;
 var arr=FD.data.legacy.duas;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="dua">'+LG_ICO.plus+'Add a du\u2019a</button></div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(LG_ICO.hands,'No du\u2019ās yet','The prayers your family returns to, for each other, for guidance, for those who came before. Keep them close.',''); return; }
 el.innerHTML=add+'<div class="jlist">'+arr.slice().sort(function(a,b){return b.createdAt-a.createdAt;}).map(duaCard).join('')+'</div>';
 }
 function deedRow(x){
 var sub=[jDateLabel(x.date)||'No date']; if(x.member) sub.push(esc(x.member));
 return '<div class="hmrow"><span class="lnskico lnskico--lg">'+LG_ICO.heart+'</span><div class="hmrow__main"><div class="hmrow__t">'+esc(x.what||'A good deed')+'</div><div class="hmrow__s">'+sub.join(' \u00b7 ')+'</div>'+(x.note?'<div class="hmrow__note">'+esc(x.note)+'</div>':'')+'</div><button class="ckmeal__b" data-lgdeed-e="'+x.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-lgdeed-d="'+x.id+'" aria-label="Delete">'+LG_ICO.x+'</button></div>';
 }
 function renderLegDeeds(){
 var el=$('#lgDeeds'); if(!el) return;
 var arr=FD.data.legacy.deeds;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="deed">'+LG_ICO.plus+'Note a good deed</button></div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(LG_ICO.heart,'No deeds noted yet','Sadaqah given, a neighbour helped, a kindness done quietly. Not to boast, to remember what your family stands for.',''); return; }
 var byMonth={};
 arr.slice().sort(function(a,b){ var c=String(b.date).localeCompare(String(a.date)); return c||(b.createdAt-a.createdAt); }).forEach(function(x){ var k=(x.date||'').slice(0,7)||'undated'; (byMonth[k]=byMonth[k]||[]).push(x); });
 var html=add; var MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
 Object.keys(byMonth).forEach(function(k){ var lab=k==='undated'?'No date':(function(){ var p=k.split('-'); return MN[+p[1]-1]+' '+p[0]; })(); html+='<div class="hsec-h">'+lab+' \u00b7 '+byMonth[k].length+'</div><div class="hmlist" style="margin-bottom:14px">'+byMonth[k].map(deedRow).join('')+'</div>'; });
 el.innerHTML=html;
 }
 function wisdomCard(w){
 return '<article class="lgwis"><div class="lgwis__mark">\u201C</div><div class="lgwis__text">'+esc(w.text||'').replace(/\n/g,'<br>')+'</div><div class="lgwis__foot"><span class="lgwis__from">'+(w.from?'\u2014 '+esc(w.from):'\u2014 Family wisdom')+(w.when?' <span class="lgwis__when">'+esc(w.when)+'</span>':'')+'</span><span class="lgwis__acts"><button class="ckmeal__b" data-lgwe="'+w.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-lgwd="'+w.id+'" aria-label="Delete">'+LG_ICO.x+'</button></span></div></article>';
 }
 function renderLegWisdom(){
 var el=$('#lgWisdom'); if(!el) return;
 var arr=FD.data.legacy.wisdom;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="wisdom">'+LG_ICO.plus+'Add wisdom</button></div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(LG_ICO.quote,'No sayings kept yet','The advice grandpa always gave, the phrase your mother lived by. The words worth passing down, written before they fade.',''); return; }
 el.innerHTML=add+'<div class="jlist">'+arr.slice().sort(function(a,b){return b.createdAt-a.createdAt;}).map(wisdomCard).join('')+'</div>';
 }
 function renderLegOverview(){
 var el=$('#lgOverview'); if(!el) return;
 var L=FD.data.legacy;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="deed">'+LG_ICO.plus+'Note a good deed</button><button class="btn btn--soft" data-modal="dua">'+LG_ICO.hands+'Add du\u2019a</button><button class="btn btn--soft" data-modal="wisdom">'+LG_ICO.quote+'Add wisdom</button></div>';
 if(!L.duas.length&&!L.deeds.length&&!L.wisdom.length){ el.innerHTML=add+hEmpty(LG_ICO.star,'What you leave behind','The du\u2019ās, the quiet good deeds, and the family wisdom worth carrying forward, a legacy of the heart.',''); return; }
 var wk=ckWeekDates(0), wset={}; wk.forEach(function(d){wset[d]=1;});
 var deedsWk=L.deeds.filter(function(x){return wset[x.date];}).length;
 var stats='<div class="hstats">'+hStat('Du\u2019ās',L.duas.length,LG_ICO.hands)+hStat('Good deeds',L.deeds.length,LG_ICO.heart)+hStat('This week',deedsWk,LG_ICO.star)+hStat('Sayings',L.wisdom.length,LG_ICO.quote)+'</div>';
 var wisCard='';
 if(L.wisdom.length){ var w=L.wisdom[Math.floor(Math.random()*L.wisdom.length)]; wisCard='<div class="lgquote"><div class="lgquote__mark">\u201C</div><div class="lgquote__text">'+esc((w.text||'').slice(0,200)).replace(/\n/g,'<br>')+((w.text||'').length>200?'\u2026':'')+'</div><div class="lgquote__from">'+(w.from?'\u2014 '+esc(w.from):'\u2014 Family wisdom')+'</div></div>'; }
 var recent=L.deeds.slice().sort(function(a,b){ var c=String(b.date).localeCompare(String(a.date)); return c||(b.createdAt-a.createdAt); }).slice(0,4);
 var deedCard= recent.length? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Recent good deeds</h3><button class="fcard__link" style="color:var(--m-legacy)" data-sub="legacy-deeds">All deeds</button></div>'+recent.map(function(x){ return '<div class="lrow"><span class="vrow__ic" style="color:var(--m-legacy)">'+LG_ICO.heart+'</span><div class="lrow__main"><div class="lrow__title">'+esc(x.what)+'</div><div class="lrow__sub">'+jDateLabel(x.date)+(x.member?' \u00b7 '+esc(x.member):'')+'</div></div></div>'; }).join('')+'</div>' : '';
 var duaCardP= L.duas.length? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Du\u2019ās to return to</h3><button class="fcard__link" style="color:var(--m-legacy)" data-sub="legacy-duas">All du\u2019ās</button></div>'+L.duas.slice(0,3).map(function(d){ return '<div class="lrow"><span class="vrow__ic" style="color:var(--m-legacy)">'+LG_ICO.moon+'</span><div class="lrow__main"><div class="lrow__title">'+esc(d.title||'Du\u2019a')+'</div><div class="lrow__sub">'+esc((d.text||'').slice(0,60))+((d.text||'').length>60?'\u2026':'')+'</div></div></div>'; }).join('')+'</div>' : '';
 el.innerHTML=add+stats+wisCard+deedCard+duaCardP;
 }

 /* ===================== WELLBEING & GROWTH ===================== */
 var WB_ICO={
 sun:'<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M3 12h2M19 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg>',
 heart:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 20.3s-7-4.4-7-9.4A3.8 3.8 0 0 1 12 8.2a3.8 3.8 0 0 1 7 2.7c0 5-7 9.4-7 9.4Z"/></svg>',
 sprout:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 20.5v-7.5"/><path d="M12 13C12 9.5 9.4 7 5.5 7c0 3.7 2.7 6 6.5 6Z"/><path d="M12 11c0-3 2.3-5 5.8-5 0 3.2-2.4 5-5.8 5Z"/></svg>',
 bolt:'<svg class="ico" viewBox="0 0 24 24"><path d="M13 3 5 13.5h5L11 21l8-10.5h-5L13 3Z"/></svg>',
 check:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
 plus:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
 x:'<svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>'
 };
 var WB_ENERGY=['','Drained','Low','Steady','Good','Charged'];
 var WB_STARTERS=['Deep breathing \u00b7 5 min','A walk outside','Call someone you love','Read for pleasure','A proper nap','Duas & dhikr','Digital sunset \u00b7 no screens after 10','Long slow stretch'];
 var WB_AFFIRM=['That counts.','Good for you.','Kind to yourself, well done.','Small things add up.','Your soul says thank you.'];
 var wbGlowId='', wbOpenG={};
 function wbTodayCheckin(name){ var t=todayStr(), hit=null; FD.data.wellbeing.checkins.forEach(function(c){ if(c.date===t&&c.member===name) hit=c; }); return hit; }
 function careWeekCount(c){ var wk=ckWeekDates(0), set={}; wk.forEach(function(d){set[d]=1;}); var n=0; c.log.forEach(function(d){ if(set[d]) n++; }); return n; }
 function careTodayCount(c){ var t=todayStr(), n=0; c.log.forEach(function(d){ if(d===t) n++; }); return n; }
 function wbMoodBars(){
 var days=[]; var d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()-13);
 for(var i=0;i<14;i++){ days.push(d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())); d.setDate(d.getDate()+1); }
 var by={}; FD.data.wellbeing.checkins.forEach(function(c){ if(!by[c.date]) by[c.date]=[]; by[c.date].push(c.mood); });
 var any=false;
 var bars=days.map(function(ds){ var arr=by[ds]; if(!arr||!arr.length) return '<span class="jmbar" title="'+jDateLabel(ds)+'"><span class="jmbar__fill" style="height:0%"></span></span>'; any=true; var avg=arr.reduce(function(a,b){return a+b;},0)/arr.length; var mm=moodMeta(Math.round(avg)); return '<span class="jmbar" title="'+jDateLabel(ds)+' \u00b7 '+(Math.round(avg*10)/10)+'/5"><span class="jmbar__fill" style="height:'+Math.round(avg/5*100)+'%;background:'+(mm?mm.color:'#999')+'"></span></span>'; }).join('');
 return any?bars:'';
 }
 function checkinRow(c){
 var mm=moodMeta(c.mood);
 return '<div class="hmrow"><span class="lnskico" style="background:color-mix(in srgb,var(--m-wellbeing) 12%,var(--surface));color:var(--m-wellbeing)">'+WB_ICO.sun+'</span><div class="hmrow__main"><div class="hmrow__t">'+esc(c.member||'Family')+' <span class="jmood" style="--mc:'+(mm?mm.color:'#999')+'"><span class="jmood__dot"></span>'+JMOOD_LABELS[c.mood]+'</span> <span class="wben">'+WB_ICO.bolt+WB_ENERGY[c.energy]+'</span></div><div class="hmrow__s">'+jDateLabel(c.date)+'</div>'+(c.note?'<div class="hmrow__note">'+esc(c.note)+'</div>':'')+'</div><button class="ckmeal__b" data-wbcedit="'+c.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-wbcdel="'+c.id+'" aria-label="Delete">'+WB_ICO.x+'</button></div>';
 }
 /* ===================== P4 CHART: family mood, last 14 days ===================== */
 function wbMoodVal(m){ if(m==null) return null; var n=+m; if(!isNaN(n)&&n>0) return Math.max(1,Math.min(5,n)); var o=['struggling','low','okay','good','great']; var i=o.indexOf(String(m).toLowerCase()); return i>=0?i+1:null; }
 function wbMoodChart(){
 var cs=FD.data.wellbeing.checkins||[]; if(!cs.length) return '';
 var days=[], t=new Date(); t.setHours(12,0,0,0);
 for(var i=13;i>=0;i--){ var d=new Date(t); d.setDate(d.getDate()-i); days.push(d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())); }
 var sum={},cnt={};
 cs.forEach(function(c){ var v=wbMoodVal(c.mood); if(v==null) return; if(days.indexOf(c.date)<0) return; sum[c.date]=(sum[c.date]||0)+v; cnt[c.date]=(cnt[c.date]||0)+1; });
 var pts=[]; days.forEach(function(dd,ii){ if(cnt[dd]) pts.push({i:ii,d:dd,v:sum[dd]/cnt[dd]}); });
 if(pts.length<2) return '';
 var W=336,H=140,padL=10,padR=10,padT=14,padB=22,plotH=H-padT-padB,plotW=W-padL-padR;
 function X(ii){ return padL+(ii/(days.length-1))*plotW; }
 function Y(v){ return padT+(1-(v-1)/4)*plotH; }
 var today=days[days.length-1];
 var grid=[1,3,5].map(function(v){ var y=Y(v).toFixed(1); return '<line x1="'+padL+'" y1="'+y+'" x2="'+(W-padR)+'" y2="'+y+'" class="mch__g"/>'; }).join('');
 var line='<polyline class="mch__ln" points="'+pts.map(function(p){ return X(p.i).toFixed(1)+','+Y(p.v).toFixed(1); }).join(' ')+'"/>';
 var dots=pts.map(function(p){ var td=(p.d===today); return '<circle class="mch__d'+(td?' mch__d--td':'')+'" cx="'+X(p.i).toFixed(1)+'" cy="'+Y(p.v).toFixed(1)+'" r="'+(td?4:3)+'"/>'; }).join('');
 function dl(ds){ var p=ds.split('-'); return (+p[2])+' '+(MON[+p[1]-1]||'').slice(0,3); }
 var xl='<text x="'+padL+'" y="'+(H-6)+'" class="wch__l" text-anchor="start">'+dl(days[0])+'</text><text x="'+(W-padR)+'" y="'+(H-6)+'" class="wch__l wch__l--td" text-anchor="end">'+dl(today)+'</text>';
 return '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Family mood</h3><span class="wch__meta">last 14 days</span></div>'
 +'<svg class="wch" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Family mood, last 14 days">'+grid+line+dots+xl+'</svg></div>';
 }
 function renderWbCheckins(){
 var el=$('#wbCheckins'); if(!el) return;
 var mems=FD.data.members, cs=FD.data.wellbeing.checkins;
 var html=wbMoodChart();
 if(mems.length){
 var rows=mems.map(function(m){ var tc=wbTodayCheckin(m.name); var mm=tc?moodMeta(tc.mood):null; return '<div class="lrow"><span class="lnav">'+avatarHTML(m,'lnav__t')+'</span><div class="lrow__main"><div class="lrow__title">'+esc(m.name)+'</div><div class="lrow__sub">'+(tc?(JMOOD_LABELS[tc.mood]+' \u00b7 '+WB_ENERGY[tc.energy]):'Not checked in yet today')+'</div></div>'+(tc?'<span class="jmood" style="--mc:'+(mm?mm.color:'#999')+'"><span class="jmood__dot"></span>'+JMOOD_LABELS[tc.mood]+'</span><button class="ckmeal__b" data-wbcedit="'+tc.id+'" aria-label="Edit">'+J_ICO.pen+'</button>':'<button class="lnup" style="color:var(--m-wellbeing);background:color-mix(in srgb,var(--m-wellbeing) 12%,var(--surface));border-color:color-mix(in srgb,var(--m-wellbeing) 30%,transparent)" data-wbadd="'+esc(m.name)+'">Check in</button>')+'</div>'; }).join('');
 html+='<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">How is everyone today?</h3></div>'+rows+'</div>';
 } else {
 html+=hEmpty(WB_ICO.sun,'Add your people first','Check-ins are per person, a ten-second pulse of mood and energy.','<button class="btn btn--primary" data-modal="member" style="margin-top:4px">'+WB_ICO.plus+'Add member</button>');
 }
 var bars=wbMoodBars();
 if(bars) html+='<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Mood \u00b7 last 14 days</h3></div><div class="jmbars">'+bars+'</div></div>';
 var recent=cs.slice().sort(function(a,b){ var c2=String(b.date).localeCompare(String(a.date)); return c2||(b.createdAt-a.createdAt); }).slice(0,6);
 if(recent.length) html+='<div class="hsec-h" style="margin-top:4px">Recent check-ins</div><div class="hmlist">'+recent.map(checkinRow).join('')+'</div>';
 el.innerHTML=html;
 }
 function careCard(c){
 var wk=careWeekCount(c), tot=c.log.length, tdy=careTodayCount(c);
 var last=c.log.length?c.log[c.log.length-1]:'';
 return '<div class="lncard'+(wbGlowId===c.id?' rlglow':'')+'" style="'+(wbGlowId===c.id?'border-color:var(--m-wellbeing);':'')+'"><div class="lncard__top"><div class="lncard__hl"><div class="lncard__t">'+esc(c.title||'Self-care')+(c.member?' <span class="lnwho" style="color:var(--m-wellbeing);background:color-mix(in srgb,var(--m-wellbeing) 12%,var(--surface));border-color:color-mix(in srgb,var(--m-wellbeing) 26%,transparent)">'+esc(c.member)+'</span>':'')+'</div><div class="lncard__s">'+(wk?wk+'\u00d7 this week':'Not yet this week')+' \u00b7 '+tot+' total'+(last?' \u00b7 last '+jDateLabel(last):'')+'</div></div></div><div class="lncard__acts"><button class="wbdid" data-wbdid="'+c.id+'">'+WB_ICO.check+'I did this</button>'+(tdy?'<button class="rllock__link" style="margin:0" data-wbundo="'+c.id+'">Undo today</button>':'')+'<span class="lncard__sp"></span><button class="ckmeal__b" data-wbsedit="'+c.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-wbsdel="'+c.id+'" aria-label="Delete">'+WB_ICO.x+'</button></div></div>';
 }
 function renderWbCare(){
 var el=$('#wbCare'); if(!el) return;
 var arr=FD.data.wellbeing.selfcare;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="selfcare">'+WB_ICO.plus+'Add self-care</button>'+(arr.length>1?'<button class="btn btn--soft" data-wbsuggest="1">'+WB_ICO.heart+'Suggest one</button>':'')+(!arr.length?'<button class="btn btn--soft" data-wbseed="1">'+WB_ICO.heart+'Add starter ideas</button>':'')+'</div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(WB_ICO.heart,'Your self-care menu is empty','The little things that refill you, a walk, a call, quiet dhikr. Keep them here, and tap when you\u2019ve done one.',''); return; }
 var list=arr.slice().sort(function(a,b){ return careWeekCount(b)-careWeekCount(a) || (b.createdAt-a.createdAt); });
 el.innerHTML=add+'<div class="hmlist">'+list.map(careCard).join('')+'</div>';
 }
 function growthCard(g){
 var open=!!wbOpenG[g.id];
 var refl=g.reflections.slice().sort(function(a,b){ var c=String(b.date).localeCompare(String(a.date)); return c||(b.createdAt-a.createdAt); });
 var last=refl.length?refl[0]:null;
 var det='';
 if(open){
 det='<div class="rcard__det">'+(refl.length?refl.map(function(r){ return '<div class="wbref"><div class="wbref__d">'+jDateLabel(r.date)+'<button class="ckmeal__b ckmeal__b--del" data-wbrdel="'+r.id+'" data-gid="'+g.id+'" aria-label="Delete reflection" style="width:22px;height:22px">'+WB_ICO.x+'</button></div><div class="wbref__t">'+esc(r.text).replace(/\n/g,'<br>')+'</div></div>'; }).join(''):'<div class="docempty">No reflections yet, the first one is a gift to your future self.</div>')+'</div>';
 }
 return '<article class="lncard"><div class="lncard__top"><div class="lncard__hl"><div class="lncard__t">'+esc(g.title||'Intention')+(g.member?' <span class="lnwho" style="color:var(--m-wellbeing);background:color-mix(in srgb,var(--m-wellbeing) 12%,var(--surface));border-color:color-mix(in srgb,var(--m-wellbeing) 26%,transparent)">'+esc(g.member)+'</span>':'')+'</div>'+(g.why?'<div class="lncard__s">'+esc(g.why)+'</div>':'')+'<div class="lncard__s" style="margin-top:3px">'+g.reflections.length+' reflection'+(g.reflections.length!==1?'s':'')+(last?' \u00b7 last '+jDateLabel(last.date):'')+'</div></div></div>'+det
 +'<div class="lncard__acts"><button class="wbdid" data-wbref="'+g.id+'">'+WB_ICO.sprout+'Reflect</button><button class="jentry__more" style="margin:0;color:var(--m-wellbeing)" data-wbgexp="'+g.id+'">'+(open?'Hide':'Read reflections')+'</button><span class="lncard__sp"></span><button class="ckmeal__b" data-wbgedit="'+g.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-wbgdel="'+g.id+'" aria-label="Delete">'+WB_ICO.x+'</button></div></article>';
 }
 function renderWbGrowth(){
 var el=$('#wbGrowth'); if(!el) return;
 var arr=FD.data.wellbeing.growth;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="growth">'+WB_ICO.plus+'Add intention</button></div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(WB_ICO.sprout,'No intentions yet','Not goals with deadlines, intentions with roots. \u201cBe more patient in the evenings.\u201d Then reflect, gently, as you grow.',''); return; }
 el.innerHTML=add+'<div class="cklist">'+arr.slice().sort(function(a,b){return b.createdAt-a.createdAt;}).map(growthCard).join('')+'</div>';
 }
 function renderWbOverview(){
 var el=$('#wbOverview'); if(!el) return;
 var W=FD.data.wellbeing, mems=FD.data.members;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="checkin">'+WB_ICO.plus+'Check in</button><button class="btn btn--soft" data-modal="growth">'+WB_ICO.sprout+'Add intention</button></div>';
 if(!W.checkins.length&&!W.selfcare.length&&!W.growth.length){ el.innerHTML=add+hEmpty(WB_ICO.sun,'The quiet heart of the app','Ten-second check-ins, a self-care menu, and intentions that grow through reflection, wellbeing, held gently.',''); return; }
 var t=todayStr();
 var checkedToday=0; mems.forEach(function(m){ if(wbTodayCheckin(m.name)) checkedToday++; });
 var wk=ckWeekDates(0), wset={}; wk.forEach(function(d){wset[d]=1;});
 var last7=[]; var dd=new Date(); dd.setHours(12,0,0,0); for(var i=0;i<7;i++){ last7.push(dd.getFullYear()+'-'+p2(dd.getMonth()+1)+'-'+p2(dd.getDate())); dd.setDate(dd.getDate()-1); }
 var l7set={}; last7.forEach(function(d){l7set[d]=1;});
 var moods=W.checkins.filter(function(c){return l7set[c.date];}).map(function(c){return c.mood;});
 var avgM=moods.length?Math.round(moods.reduce(function(a,b){return a+b;},0)/moods.length):0;
 var careWk=0; W.selfcare.forEach(function(c){ careWk+=careWeekCount(c); });
 var reflN=0; W.growth.forEach(function(g){ reflN+=g.reflections.length; });
 var stats='<div class="hstats">'+hStat('Checked in today',mems.length?checkedToday+'/'+mems.length:W.checkins.filter(function(c){return c.date===t;}).length,WB_ICO.sun)+hStat('Mood \u00b7 7 days',avgM?JMOOD_LABELS[avgM]:'\u2014',WB_ICO.heart)+hStat('Self-care this week',careWk,WB_ICO.check)+hStat('Reflections',reflN,WB_ICO.sprout)+'</div>';
 var pend=mems.filter(function(m){return !wbTodayCheckin(m.name);});
 var quick= pend.length? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Still to check in</h3><button class="fcard__link" style="color:var(--m-wellbeing)" data-sub="wellbeing-checkins">Check-ins</button></div>'+pend.slice(0,4).map(function(m){ return '<div class="lrow"><span class="lnav">'+avatarHTML(m,'lnav__t')+'</span><div class="lrow__main"><div class="lrow__title">'+esc(m.name)+'</div></div><button class="lnup" style="color:var(--m-wellbeing);background:color-mix(in srgb,var(--m-wellbeing) 12%,var(--surface));border-color:color-mix(in srgb,var(--m-wellbeing) 30%,transparent)" data-wbadd="'+esc(m.name)+'">Check in</button></div>'; }).join('')+'</div>' : '';
 var bars=wbMoodBars();
 var moodCard= bars? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Family mood \u00b7 14 days</h3></div><div class="jmbars">'+bars+'</div></div>' : '';
 var ftw=ftWeekStats(null); var wtr=0; mems.forEach(function(m){ wtr+=ntWaterToday(m.name); });
 var grat=FD.data.journal.gratitude.filter(function(g){return wset[g.date];}).length;
 var sig='<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Gentle signals</h3></div>'
 +'<div class="lrow"><span class="vrow__ic" style="color:var(--m-wellbeing)">'+WB_ICO.bolt+'</span><div class="lrow__main"><div class="lrow__title">'+(ftw.minutes?('The family moved '+ftw.minutes+' minutes this week'):'No movement logged yet this week')+'</div></div></div>'
 +'<div class="lrow"><span class="vrow__ic" style="color:var(--m-wellbeing)">'+WB_ICO.heart+'</span><div class="lrow__main"><div class="lrow__title">'+(wtr?(wtr+' glasses of water today'):'No water logged today yet')+'</div></div></div>'
 +'<div class="lrow"><span class="vrow__ic" style="color:var(--m-wellbeing)">'+WB_ICO.sun+'</span><div class="lrow__main"><div class="lrow__title">'+(grat?(grat+' gratitude '+(grat>1?'entries':'entry')+' this week'):'Gratitude is quiet this week, that\u2019s okay')+'</div></div></div>'
 +'</div>';
 var lastRef=null,lastG=null;
 FD.data.wellbeing.growth.forEach(function(g){ g.reflections.forEach(function(r){ if(!lastRef||String(r.date)>String(lastRef.date)||(r.date===lastRef.date&&r.createdAt>lastRef.createdAt)){ lastRef=r; lastG=g; } }); });
 var refCard= lastRef? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Latest reflection</h3><button class="fcard__link" style="color:var(--m-wellbeing)" data-sub="wellbeing-growth">Growth</button></div><div class="wbref"><div class="wbref__d">'+esc(lastG.title)+' \u00b7 '+jDateLabel(lastRef.date)+'</div><div class="wbref__t">'+esc(lastRef.text.slice(0,160)).replace(/\n/g,'<br>')+(lastRef.text.length>160?'\u2026':'')+'</div></div></div>' : '';
 el.innerHTML=add+stats+quick+moodCard+sig+refCard;
 }

 /* ===================== MEMORY (VAULT) ===================== */
 var MM_ICO={
 photo:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="M4.5 16.5 9.5 12l3 2.8 3-2.3 4 3.7"/></svg>',
 album:'<svg class="ico" viewBox="0 0 24 24"><rect x="6" y="3.5" width="14" height="14" rx="2.5"/><path d="M4 7.5v11A2.5 2.5 0 0 0 6.5 21H17"/><circle cx="10.5" cy="8" r="1.4"/><path d="M6.8 14.5 10 11.6l2.5 2.3 2.5-1.9 4 3.5"/></svg>',
 book:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 6.5c-1.6-1.4-3.9-1.9-6.5-1.5v13c2.6-.4 4.9.1 6.5 1.5 1.6-1.4 3.9-1.9 6.5-1.5v-13c-2.6-.4-4.9.1-6.5 1.5Z"/><path d="M12 6.5V20"/></svg>',
 hour:'<svg class="ico" viewBox="0 0 24 24"><path d="M7 4h10M7 20h10M8 4c0 4 3.2 4.6 3.2 8S8 16 8 20M16 4c0 4-3.2 4.6-3.2 8s3.2 4 3.2 8"/></svg>',
 lock:'<svg class="ico" viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>',
 open:'<svg class="ico" viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 6.8-1.2"/></svg>',
 shuf:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 12a7 7 0 0 1 12-4.9M19 12a7 7 0 0 1-12 4.9"/><path d="M17 3.5v4h-4M7 20.5v-4h4"/></svg>',
 back:'<svg class="ico" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',
 plus:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
 x:'<svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>'
 };
 var mmOpenAlbum='', mmOpenS={}, mmVault=null;
 function mmPhotoCount(){ var n=0; FD.data.memory.albums.forEach(function(a){ n+=a.photos.length; }); return n; }
 function capsuleSealed(c){ return !!(c.openOn && c.openOn>todayStr()); }
 function renderMemAlbums(){
 var el=$('#mmAlbums'); if(!el) return;
 var albums=FD.data.memory.albums;
 var alb=mmOpenAlbum?FD.getAlbum(mmOpenAlbum):null;
 if(mmOpenAlbum&&!alb) mmOpenAlbum='';
 if(alb){
 var head='<div class="happt-top"><button class="btn btn--soft" data-mmback="1">'+MM_ICO.back+'Albums</button><button class="btn btn--primary" data-mmphadd="'+alb.id+'">'+MM_ICO.plus+'Add photo</button><span class="lncard__sp"></span><button class="ckmeal__b" data-mmaledit="'+alb.id+'" aria-label="Edit album">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-mmaldel="'+alb.id+'" aria-label="Delete album">'+MM_ICO.x+'</button></div>';
 var title='<div class="hsec-h">'+esc(alb.name||'Album')+' \u00b7 '+alb.photos.length+(alb.note?'<span style="font-weight:500;color:var(--text-3);text-transform:none;letter-spacing:0;margin-left:8px">'+esc(alb.note)+'</span>':'')+'</div>';
 var ph=alb.photos.slice().sort(function(a,b){ var c=String(b.date).localeCompare(String(a.date)); return c||(b.createdAt-a.createdAt); });
 var grid= ph.length? '<div class="mmgrid">'+ph.map(function(p){ return '<figure class="mmph"><a href="'+p.photo+'" target="_blank" rel="noopener"><img src="'+p.photo+'" alt=""></a><span class="mmph__acts"><button class="mmph__b" data-mmphedit="'+p.id+'" data-alb="'+alb.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="mmph__b mmph__b--del" data-mmphdel="'+p.id+'" data-alb="'+alb.id+'" aria-label="Delete">'+MM_ICO.x+'</button></span>'+((p.caption||p.date)?'<figcaption class="mmph__cap">'+(p.caption?esc(p.caption):'')+(p.date?'<span>'+jDateLabel(p.date)+'</span>':'')+'</figcaption>':'')+'</figure>'; }).join('')+'</div>' : hEmpty(MM_ICO.photo,'This album is empty','Add the first photo, a small caption turns it into a memory.','');
 el.innerHTML=head+title+grid;
 return;
 }
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="album">'+MM_ICO.plus+'New album</button></div>';
 if(!albums.length){ el.innerHTML=add+hEmpty(MM_ICO.album,'No albums yet','Make little collections, \u201cEid 2026\u201d, \u201cOur wedding\u201d, \u201cBaby\u2019s first year\u201d, and fill them with captioned photos.',''); return; }
 var cards=albums.slice().sort(function(a,b){return b.createdAt-a.createdAt;}).map(function(a){
 var cov=a.photos.length?('<img src="'+a.photos[0].photo+'" alt="">'):('<span class="mmalb__ph">'+MM_ICO.album+'</span>');
 return '<button class="mmalb" data-mmopen="'+a.id+'"><span class="mmalb__cover">'+cov+'</span><span class="mmalb__body"><span class="mmalb__n">'+esc(a.name||'Album')+'</span><span class="mmalb__c">'+a.photos.length+' photo'+(a.photos.length!==1?'s':'')+'</span></span></button>';
 }).join('');
 el.innerHTML=add+'<div class="cklist">'+cards+'</div>';
 }
 function storyCard(s){
 var open=!!mmOpenS[s.id];
 var meta=[]; if(s.when) meta.push(esc(s.when)); if(s.who) meta.push(esc(s.who));
 var raw=s.body||''; var longish=raw.length>240||(raw.indexOf('\n')>=0&&raw.length>120);
 var body='<div class="jentry__body'+(open||!longish?' is-open':'')+'">'+esc(raw).replace(/\n/g,'<br>')+'</div>'+(longish?'<button class="jentry__more" style="color:var(--m-memory)" data-mmsexp="'+s.id+'">'+(open?'Show less':'Read the story')+'</button>':'');
 var photo=s.photo?'<a class="jentry__photo" href="'+s.photo+'" target="_blank" rel="noopener"><img src="'+s.photo+'" alt=""></a>':'';
 return '<article class="jentry" style="border-left:3px solid var(--m-memory)"><div class="jentry__head"><div class="jentry__hl"><div class="jentry__title">'+esc(s.title||'A family story')+'</div><div class="jentry__meta">'+meta.join(' \u00b7 ')+'</div></div></div>'+photo+body+'<div class="jentry__acts"><button class="jentry__act" data-mmsedit="'+s.id+'">'+J_ICO.pen+'Edit</button><button class="jentry__act jentry__act--del" data-mmsdel="'+s.id+'">'+MM_ICO.x+'Delete</button></div></article>';
 }
 function renderMemStories(){
 var el=$('#mmStories'); if(!el) return;
 var arr=FD.data.memory.stories;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="story">'+MM_ICO.plus+'Keep a story</button></div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(MM_ICO.book,'No stories kept yet','The tales that get told at dinner, how you met, grandpa\u2019s advice, the funny disaster of 2019. Write them down before they fade.',''); return; }
 el.innerHTML=add+'<div class="jlist">'+arr.slice().sort(function(a,b){return b.createdAt-a.createdAt;}).map(storyCard).join('')+'</div>';
 }
 function capsuleCard(c){
 var sealed=capsuleSealed(c);
 var dt=daysTo(c.openOn);
 if(sealed){
 return '<div class="mmcap"><span class="mmcap__ic">'+MM_ICO.lock+'</span><div class="hmrow__main"><div class="hmrow__t">'+esc(c.title||'Sealed letter')+'</div><div class="hmrow__s">Sealed'+(c.from?' by '+esc(c.from):'')+' \u00b7 opens '+jDateLabel(c.openOn)+'</div><div class="mmcap__body">The words inside are waiting.</div></div><span class="rlcount rlcount--sm mmcount">'+(dt===1?'tomorrow':'in '+dt+' days')+'</span><button class="ckmeal__b" data-mmcedit="'+c.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-mmcdel="'+c.id+'" aria-label="Delete">'+MM_ICO.x+'</button></div>';
 }
 return '<div class="mmcap mmcap--open"><span class="mmcap__ic mmcap__ic--open">'+MM_ICO.open+'</span><div class="hmrow__main"><div class="hmrow__t">'+esc(c.title||'A letter from the past')+'</div><div class="hmrow__s">'+(c.from?'From '+esc(c.from)+' \u00b7 ':'')+'opened '+jDateLabel(c.openOn)+'</div><div class="mmcap__body mmcap__body--open">'+esc(c.body||'').replace(/\n/g,'<br>')+'</div></div><button class="ckmeal__b" data-mmcedit="'+c.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-mmcdel="'+c.id+'" aria-label="Delete">'+MM_ICO.x+'</button></div>';
 }
 function renderMemCapsule(){
 var el=$('#mmCapsule'); if(!el) return;
 var arr=FD.data.memory.capsules;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="capsule">'+MM_ICO.plus+'Seal a capsule</button></div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(MM_ICO.hour,'No capsules sealed','Write a letter to the future, to your children, to yourselves next Eid, pick the opening date, and it stays sealed until then.',''); return; }
 var sealed=arr.filter(capsuleSealed).sort(function(a,b){return String(a.openOn).localeCompare(String(b.openOn));});
 var opened=arr.filter(function(c){return !capsuleSealed(c);}).sort(function(a,b){return String(b.openOn).localeCompare(String(a.openOn));});
 var html=add;
 if(sealed.length) html+='<div class="hsec-h">Sealed \u00b7 '+sealed.length+'</div><div class="hmlist" style="margin-bottom:14px">'+sealed.map(capsuleCard).join('')+'</div>';
 if(opened.length) html+='<div class="hsec-h">Ready to read \u00b7 '+opened.length+'</div><div class="hmlist">'+opened.map(capsuleCard).join('')+'</div>';
 el.innerHTML=html;
 }
 function mmVaultPick(force){
 var pool=[];
 FD.data.memory.stories.forEach(function(s){ pool.push({kind:'story',id:s.id}); });
 FD.data.memory.albums.forEach(function(a){ a.photos.forEach(function(p){ pool.push({kind:'photo',id:p.id,albumId:a.id}); }); });
 if(!pool.length){ mmVault=null; return null; }
 var valid=false;
 if(mmVault&&!force){ if(mmVault.kind==='story') valid=!!FD.getStory(mmVault.id); else valid=!!FD.getAlbumPhoto(mmVault.albumId,mmVault.id); }
 if(!valid) mmVault=pool[Math.floor(Math.random()*pool.length)];
 return mmVault;
 }
 function renderMemOverview(){
 var el=$('#mmOverview'); if(!el) return;
 var M=FD.data.memory;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="album">'+MM_ICO.plus+'New album</button><button class="btn btn--soft" data-modal="story">'+MM_ICO.book+'Keep a story</button><button class="btn btn--soft" data-modal="capsule">'+MM_ICO.hour+'Seal a capsule</button></div>';
 if(!M.albums.length&&!M.stories.length&&!M.capsules.length){ el.innerHTML=add+hEmpty(MM_ICO.album,'The family vault','Photo albums, the stories you tell at dinner, and letters sealed for the future, everything worth keeping, kept.',''); return; }
 var sealedN=M.capsules.filter(capsuleSealed).length;
 var stats='<div class="hstats">'+hStat('Photos',mmPhotoCount(),MM_ICO.photo)+hStat('Albums',M.albums.length,MM_ICO.album)+hStat('Stories',M.stories.length,MM_ICO.book)+hStat('Sealed capsules',sealedN,MM_ICO.lock)+'</div>';
 var today=new Date(); var md=p2(today.getMonth()+1)+'-'+p2(today.getDate()); var yr=String(today.getFullYear());
 var ond=[];
 FD.data.journal.entries.forEach(function(e){ if((e.date||'').slice(5)===md&&(e.date||'').slice(0,4)!==yr) ond.push({ico:J_ICO.entry,title:e.title||'Journal entry',date:e.date}); });
 FD.data.journal.milestones.forEach(function(m){ if((m.date||'').slice(5)===md&&(m.date||'').slice(0,4)!==yr) ond.push({ico:J_ICO.mile,title:m.title||'Milestone',date:m.date}); });
 M.albums.forEach(function(a){ a.photos.forEach(function(p){ if((p.date||'').slice(5)===md&&(p.date||'').slice(0,4)!==yr) ond.push({ico:MM_ICO.photo,title:p.caption||('Photo in '+a.name),date:p.date}); }); });
 ond.sort(function(a,b){return String(b.date).localeCompare(String(a.date));});
 var ondCard= ond.length? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">On this day</h3></div>'+ond.slice(0,4).map(function(o){ return '<div class="lrow"><span class="vrow__ic" style="color:var(--m-memory)">'+o.ico+'</span><div class="lrow__main"><div class="lrow__title">'+esc(o.title)+'</div><div class="lrow__sub">'+jDateLabel(o.date)+'</div></div></div>'; }).join('')+'</div>' : '';
 var v=mmVaultPick(false), vaultCard='';
 if(v){
 var inner='';
 if(v.kind==='story'){ var st=FD.getStory(v.id); if(st){ var snip=(st.body||'').replace(/\s+/g,' ').slice(0,140); inner='<div class="hmrow__t">'+esc(st.title||'A family story')+'</div><div class="rsteps" style="margin-top:6px">'+esc(snip)+((st.body||'').length>140?'\u2026':'')+'</div><button class="jentry__more" style="color:var(--m-memory)" data-goto="memory:stories">Read it</button>'; } }
 else { var pp=FD.getAlbumPhoto(v.albumId,v.id); var pa=FD.getAlbum(v.albumId); if(pp){ inner='<a class="jentry__photo" style="margin-top:4px" href="'+pp.photo+'" target="_blank" rel="noopener"><img src="'+pp.photo+'" alt=""></a><div class="hmrow__s" style="margin-top:8px">'+(pp.caption?esc(pp.caption)+' \u00b7 ':'')+(pp.date?jDateLabel(pp.date)+' \u00b7 ':'')+esc(pa?pa.name:'')+'</div>'; } }
 if(inner) vaultCard='<div class="fcard" style="border-color:color-mix(in srgb,var(--m-memory) 32%,var(--border))"><div class="fcard__h"><h3 class="fcard__t">From the vault</h3><button class="fcard__link" style="color:var(--m-memory)" data-mmshuffle="1">Another</button></div>'+inner+'</div>';
 }
 var next=M.capsules.filter(capsuleSealed).sort(function(a,b){return String(a.openOn).localeCompare(String(b.openOn));})[0];
 var capCard= next? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Next capsule opens</h3><button class="fcard__link" style="color:var(--m-memory)" data-sub="memory-capsule">All capsules</button></div><div class="lrow"><span class="vrow__ic" style="color:var(--m-memory)">'+MM_ICO.lock+'</span><div class="lrow__main"><div class="lrow__title">'+esc(next.title||'Sealed letter')+'</div><div class="lrow__sub">'+jDateLabel(next.openOn)+'</div></div><span class="rlcount rlcount--sm mmcount">in '+daysTo(next.openOn)+'d</span></div></div>' : '';
 el.innerHTML=add+stats+vaultCard+ondCard+capCard;
 }

 /* ===================== RELATIONSHIP (PRIVATE) ===================== */
 var RL_ICO={
 heart:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 20.3s-7-4.4-7-9.4A3.8 3.8 0 0 1 12 8.2a3.8 3.8 0 0 1 7 2.7c0 5-7 9.4-7 9.4Z"/></svg>',
 letter:'<svg class="ico" viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M4.5 7l7.5 6 7.5-6"/></svg>',
 calh:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="14" rx="2.5"/><path d="M8 3.8V8M16 3.8V8M4 11h16"/><path d="M12 17.6s-2.8-1.8-2.8-3.8a1.55 1.55 0 0 1 2.8-1 1.55 1.55 0 0 1 2.8 1c0 2-2.8 3.8-2.8 3.8Z"/></svg>',
 spark:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 3.5l2.2 5.1 5.3.4-4 3.5 1.2 5.2L12 20.4l-4.7 2.7 1.2-5.2-4-3.5 5.3-.4L12 3.5Z"/></svg>',
 lock:'<svg class="ico" viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>',
 check:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
 plus:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
 x:'<svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>'
 };
 var rlUnlocked=false, rlMode='unlock', rlSurpriseId='';
 function rlFnv(s){ var h=0x811c9dc5; for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=(h*0x01000193)>>>0; } return ('0000000'+h.toString(16)).slice(-8); }
 function rlRandSalt(){ try{ var a=new Uint8Array(8); crypto.getRandomValues(a); var s=''; for(var i=0;i<a.length;i++){ s+=('0'+a[i].toString(16)).slice(-2); } return s; }catch(e){ return String(Math.random()).slice(2,18); } }
 function rlHash(pin,salt,cb){
 try{
 var enc=new TextEncoder().encode(salt+':'+pin);
 crypto.subtle.digest('SHA-256',enc).then(function(buf){ var a=new Uint8Array(buf),h=''; for(var i=0;i<a.length;i++){ h+=('0'+a[i].toString(16)).slice(-2); } cb('s256:'+h); }).catch(function(){ cb('fnv:'+rlFnv(salt+':'+pin)); });
 }catch(e){ cb('fnv:'+rlFnv(salt+':'+pin)); }
 }
 function rlDaysTogether(){ var s=FD.data.relationship.since; if(!s) return null; var p=s.split('-'); var a=new Date(+p[0],+p[1]-1,+p[2]); var n=new Date(); n.setHours(0,0,0,0); a.setHours(0,0,0,0); return Math.max(0,Math.round((n-a)/86400000)); }
 function rlNextOccur(orig){ if(!orig) return null; var p=orig.split('-'); if(p.length<3) return null; var n=new Date(); n.setHours(0,0,0,0); var yr=n.getFullYear(); var cand=new Date(yr,+p[1]-1,+p[2]); cand.setHours(0,0,0,0); if(cand<n){ cand=new Date(yr+1,+p[1]-1,+p[2]); cand.setHours(0,0,0,0); } var ds=cand.getFullYear()+'-'+p2(cand.getMonth()+1)+'-'+p2(cand.getDate()); return {date:ds,days:Math.round((cand-n)/86400000),years:cand.getFullYear()-(+p[0])}; }
 function rlWirePins(){ ['rlPin','rlPinA','rlPinB','rlCur','rlNewA','rlNewB'].forEach(function(id){ var x=document.getElementById(id); if(x){ x.addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); var b=$('#rlLock [data-rlunlock],#rlLock [data-rlset],#rlLock [data-rlchangesave]'); if(b) b.click(); } }); } }); var f=$('#rlPin')||$('#rlPinA')||$('#rlCur'); if(f) setTimeout(function(){ try{ f.focus(); }catch(e){} },60); }
 function rlErr(msg){ var e=$('#rlErr'); if(e) e.textContent=msg||''; var c=$('#rlLock .rllock__card'); if(c&&msg){ c.classList.remove('is-shake'); void c.offsetWidth; c.classList.add('is-shake'); } }
 function renderRelLock(){
 var lock=$('#rlLock'), priv=$('#rlPrivate'); if(!lock||!priv) return;
 var R=FD.data.relationship;
 if(rlMode!=='change' && rlUnlocked){ lock.innerHTML=''; lock.hidden=true; priv.hidden=false; return; }
 lock.hidden=false; priv.hidden=true;
 var inner='';
 if(rlMode==='change'){
 inner='<div class="rllock__t">Change your PIN</div><div class="rllock__s">Enter the current PIN, then choose a new one.</div>'
 +'<input class="rlpin" id="rlCur" type="password" inputmode="numeric" autocomplete="off" maxlength="8" placeholder="Current PIN">'
 +'<input class="rlpin" id="rlNewA" type="password" inputmode="numeric" autocomplete="off" maxlength="8" placeholder="New PIN (4\u20138 digits)">'
 +'<input class="rlpin" id="rlNewB" type="password" inputmode="numeric" autocomplete="off" maxlength="8" placeholder="Repeat new PIN">'
 +'<div class="rllock__err" id="rlErr"></div>'
 +'<button class="btn btn--primary rllock__go" data-rlchangesave="1">Save new PIN</button>'
 +'<button class="rllock__link" data-rlcancel="1">Cancel</button>';
 } else if(!R.pinHash){
 inner='<div class="rllock__t">A room of your own</div><div class="rllock__s">This space is just for the two of you, love notes, special dates, little plans. Set a PIN so it opens only for you.</div>'
 +'<input class="rlpin" id="rlPinA" type="password" inputmode="numeric" autocomplete="off" maxlength="8" placeholder="Choose a PIN (4\u20138 digits)">'
 +'<input class="rlpin" id="rlPinB" type="password" inputmode="numeric" autocomplete="off" maxlength="8" placeholder="Repeat the PIN">'
 +'<div class="rllock__err" id="rlErr"></div>'
 +'<button class="btn btn--primary rllock__go" data-rlset="1">Create private space</button>'
 +'<div class="rllock__hint">The PIN keeps this room away from curious eyes on a shared device. Remember it, the only way past a forgotten PIN is erasing this space.</div>';
 } else {
 inner='<div class="rllock__t">For the two of you</div><div class="rllock__s">Enter your PIN to open this space.</div>'
 +'<input class="rlpin" id="rlPin" type="password" inputmode="numeric" autocomplete="off" maxlength="8" placeholder="PIN">'
 +'<div class="rllock__err" id="rlErr"></div>'
 +'<button class="btn btn--primary rllock__go" data-rlunlock="1">Unlock</button>'
 +'<button class="rllock__link" data-rlforgot="1">Forgot the PIN?</button>';
 }
 lock.innerHTML='<div class="rllock"><div class="rllock__card"><span class="rlheart">'+RL_ICO.heart+'</span>'+inner+'</div></div>';
 rlWirePins();
 }
 function rlAfterUnlock(){ rlUnlocked=true; rlMode='unlock'; renderRelLock(); navigateSub('relationship', Store.get('fw.sub.relationship','dashboard')); renderRelAll(); }

  /* ===================== SECURE VAULT ===================== */
  var vaultUnlocked=false, vaultMode='unlock';
  function vaultHash(pin,salt,cb){
    try{
      var enc=new TextEncoder().encode(salt+':wisal-vault:'+pin);
      crypto.subtle.digest('SHA-256',enc).then(function(buf){ var a=new Uint8Array(buf),hx=''; for(var i=0;i<a.length;i++){ hx+=('0'+a[i].toString(16)).slice(-2); } cb(hx); });
    }catch(e){ var s=0,str=salt+':'+pin; for(var k=0;k<str.length;k++){ s=(s*31+str.charCodeAt(k))>>>0; } cb('fnv:'+s); }
  }
  function vaultSalt(){ try{ var a=new Uint8Array(16); crypto.getRandomValues(a); var s=''; for(var i=0;i<a.length;i++){ s+=('0'+a[i].toString(16)).slice(-2); } return s; }catch(e){ return String(Date.now())+Math.random(); } }
  function vaultErr(msg){ var e=$('#vaultErr'); if(e) e.textContent=msg||''; }
  function vaultStrength(pw){
    var score=0;
    if(pw.length>=8) score++;
    if(pw.length>=12) score++;
    if(/[a-z]/.test(pw)&&/[A-Z]/.test(pw)) score++;
    if(/[0-9]/.test(pw)) score++;
    if(/[^a-zA-Z0-9]/.test(pw)) score++;
    return score; // 0-5
  }
  function renderVaultLock(){
    var lock=$('#vaultLock'), body=$('#vaultBody'); if(!lock) return;
    var V=FD.data.vault;
    if(vaultUnlocked && vaultMode!=='change'){ lock.innerHTML=''; lock.hidden=true; if(body){ body.hidden=false; } renderVault(); return; }
    if(body) body.hidden=true;
    lock.hidden=false;
    if(!V.pinHash){
      // first-time setup
      lock.innerHTML='<div class="vlock reveal"><div class="vlock__ic"><svg class="ico" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>'
        +'<div class="vlock__ttl">Create your vault password</div>'
        +'<div class="vlock__sub">This is separate from your login. It protects your bank details, documents and keys. Choose something strong and memorable \u2014 if you forget it, the vault cannot be recovered.</div>'
        +'<input id="vaultNewA" class="vlock__in" type="password" placeholder="New vault password" autocomplete="new-password">'
        +'<div id="vaultMeter" class="vlock__meter"><span></span></div>'
        +'<input id="vaultNewB" class="vlock__in" type="password" placeholder="Confirm password" autocomplete="new-password">'
        +'<div class="vlock__err" id="vaultErr"></div>'
        +'<button class="btn btn--primary vlock__go" data-vaultset="1">Create secure vault</button>'
        +'<div class="vlock__note">Tip: use a mix of letters, numbers and symbols. At least 8 characters.</div>'
      +'</div>';
      setTimeout(function(){ var a=$('#vaultNewA'); if(a){ a.addEventListener('input',function(){ var m=$('#vaultMeter'); if(m){ var s=vaultStrength(a.value); m.className='vlock__meter vlock__meter--'+s; } }); a.focus(); } },40);
    } else if(vaultMode==='change'){
      lock.innerHTML='<div class="vlock reveal"><div class="vlock__ic"><svg class="ico" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>'
        +'<div class="vlock__ttl">Change vault password</div>'
        +'<input id="vaultCur" class="vlock__in" type="password" placeholder="Current password" autocomplete="off">'
        +'<input id="vaultNewA" class="vlock__in" type="password" placeholder="New password" autocomplete="new-password">'
        +'<input id="vaultNewB" class="vlock__in" type="password" placeholder="Confirm new password" autocomplete="new-password">'
        +'<div class="vlock__err" id="vaultErr"></div>'
        +'<div class="vlock__row"><button class="btn btn--soft" data-vaultcancelchange="1">Cancel</button><button class="btn btn--primary" data-vaultchange="1">Update</button></div>'
      +'</div>';
      setTimeout(function(){ var a=$('#vaultCur'); if(a) a.focus(); },40);
    } else {
      // unlock
      lock.innerHTML='<div class="vlock reveal"><div class="vlock__ic"><svg class="ico" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.6"/></svg></div>'
        +'<div class="vlock__ttl">Vault locked</div>'
        +'<div class="vlock__sub">Enter your vault password to view your secure documents.</div>'
        +'<input id="vaultPin" class="vlock__in" type="password" placeholder="Vault password" autocomplete="off">'
        +'<div class="vlock__err" id="vaultErr"></div>'
        +'<button class="btn btn--primary vlock__go" data-vaultunlock="1">Unlock</button>'
      +'</div>';
      setTimeout(function(){ var p=$('#vaultPin'); if(p){ p.addEventListener('keydown',function(e){ if(e.key==='Enter'){ var b=document.querySelector('[data-vaultunlock]'); if(b) b.click(); } }); p.focus(); } },40);
    }
  }
  var VAULT_TYPES=[['bank','Bank account'],['card','Card'],['document','Document'],['password','Password / key'],['note','Secure note'],['other','Other']];
  function vaultTypeLabel(t){ for(var i=0;i<VAULT_TYPES.length;i++){ if(VAULT_TYPES[i][0]===t) return VAULT_TYPES[i][1]; } return 'Item'; }
  function vaultTypeIcon(t){
    var m={ bank:'<path d="M4 10h16M5 10 12 4l7 6M6 10v8M18 10v8M4 18h16"/>', card:'<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>', document:'<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/>', password:'<circle cx="8" cy="12" r="4"/><path d="M12 12h8M18 12v3M15 12v2"/>', note:'<path d="M6 3h9l3 3v15H6z"/><path d="M9 9h6M9 13h6M9 17h4"/>', other:'<circle cx="12" cy="12" r="8"/>' };
    return '<svg class="ico" viewBox="0 0 24 24">'+(m[t]||m.other)+'</svg>';
  }
  function renderVault(){
    var body=$('#vaultBody'); if(!body) return;
    var entries=FD.data.vault.entries||[];
    var head='<div class="vbar reveal"><span class="vbar__tag">'+vaultTypeIcon('bank')+' '+entries.length+' item'+(entries.length===1?'':'s')+' secured</span><div class="vbar__acts"><button class="btn btn--soft btn--sm" data-vaultlockbtn="1">Lock</button><button class="btn btn--soft btn--sm" data-vaultchpw="1">Password</button><button class="btn btn--primary btn--sm" data-vaultadd="1">'+"\u002B"+' Add item</button></div></div>';
    var list;
    if(!entries.length){
      list='<div class="vempty"><div class="vempty__ic">'+vaultTypeIcon('document')+'</div><div class="vempty__t">Your vault is empty</div><div class="vempty__s">Add your bank details, documents, passwords or anything sensitive. Everything here stays locked and is never shared with the AI assistant.</div><button class="btn btn--primary" data-vaultadd="1">Add your first item</button></div>';
    } else {
      list='<div class="vlist">'+entries.map(function(en){
        var fields='';
        (en.fields||[]).forEach(function(f){ if(f.label&&f.value){ fields+='<div class="vitem__f"><span class="vitem__fl">'+esc(f.label)+'</span><span class="vitem__fv" data-vaultreveal>'+esc(f.value)+'</span></div>'; } });
        if(en.note) fields+='<div class="vitem__note">'+esc(en.note).replace(/\n/g,'<br>')+'</div>';
        return '<div class="vitem"><div class="vitem__head"><span class="vitem__ic">'+vaultTypeIcon(en.type)+'</span><div class="vitem__ti"><div class="vitem__ttl">'+esc(en.title||vaultTypeLabel(en.type))+'</div><div class="vitem__type">'+vaultTypeLabel(en.type)+'</div></div><button class="vitem__edit" data-vaultedit="'+en.id+'" aria-label="Edit"><svg class="ico" viewBox="0 0 24 24"><path d="M4 20h4L18.5 9.5l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg></button><button class="vitem__del" data-vaultdel="'+en.id+'" aria-label="Delete"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>'+(fields?'<div class="vitem__body">'+fields+'</div>':'')+'</div>';
      }).join('')+'</div>';
    }
    body.innerHTML=head+list;
  }
  function vaultAfterUnlock(){ vaultUnlocked=true; vaultMode='unlock'; renderVaultLock(); }
  function openVaultEntry(id){
    var en=id?(FD.data.vault.entries.filter(function(e){return e.id===id;})[0]):null;
    openModal(en?'vaultEdit':'vaultAdd', {entryId:id});
  }

 function renderRelAll(){ renderRelUs(); renderRelNotes(); renderRelDates(); renderRelPlans(); }
 function relDateCardData(){ return FD.data.relationship.dates.map(function(d){ return {d:d,nx:rlNextOccur(d.date)}; }).filter(function(o){return o.nx;}).sort(function(a,b){ return a.nx.days-b.nx.days; }); }
 function renderRelUs(){
 var el=$('#rlUs'); if(!el||!rlUnlocked) return;
 var R=FD.data.relationship;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="relNote">'+RL_ICO.plus+'Write a note</button><button class="btn btn--soft" data-modal="relPlan">'+RL_ICO.spark+'Plan a date</button></div>';
 var hero='';
 if(!R.since){
 hero='<div class="rlhero rlhero--setup"><span class="rlheart rlheart--big">'+RL_ICO.heart+'</span><div class="rlhero__t">When did your story begin?</div><div class="rlhero__s">Set the date and this room will quietly count every day since.</div><button class="btn btn--primary" style="margin-top:14px" data-rlsince="1">Set our date</button></div>';
 } else {
 var days=rlDaysTogether();
 var nxAll=relDateCardData(); var nx=nxAll.length?nxAll[0]:null;
 hero='<div class="rlhero"><span class="rlheart rlheart--big">'+RL_ICO.heart+'</span>'
 +'<div class="rlhero__n">'+days.toLocaleString('en-US')+'</div><div class="rlhero__l">days of us</div>'
 +'<div class="rlhero__s">since '+jDateLabel(R.since)+' <button class="rlsince-edit" data-rlsince="1" aria-label="Edit date">'+J_ICO.pen+'</button></div>'
 +(nx?'<div class="rlcount" style="margin-top:14px">'+esc(nx.d.title||'Special day')+' \u00b7 '+(nx.nx.days===0?'today':(nx.nx.days===1?'tomorrow':'in '+nx.nx.days+' days'))+'</div>':'')
 +'</div>';
 }
 var notes=R.notes.slice().sort(function(a,b){ var c=String(b.date).localeCompare(String(a.date)); return c||(b.createdAt-a.createdAt); });
 var mem=R.plans.filter(function(p){return p.done;}).length;
 var stats='<div class="hstats">'+hStat('Love notes',R.notes.length,RL_ICO.letter)+hStat('Special dates',R.dates.length,RL_ICO.calh)+hStat('Plans & ideas',R.plans.filter(function(p){return !p.done;}).length,RL_ICO.spark)+hStat('Memories made',mem,RL_ICO.heart)+'</div>';
 var noteCard= notes.length? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Latest note</h3><button class="fcard__link" style="color:var(--m-relationship)" data-sub="relationship-notes">All notes</button></div>'+rlNoteCard(notes[0],true)+'</div>' : '';
 var up=relDateCardData().slice(0,2);
 var upCard= up.length? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Coming up for us</h3><button class="fcard__link" style="color:var(--m-relationship)" data-sub="relationship-dates">All dates</button></div>'+up.map(function(o){ return '<div class="lrow"><span class="vrow__ic" style="color:var(--m-relationship)">'+RL_ICO.calh+'</span><div class="lrow__main"><div class="lrow__title">'+esc(o.d.title||'Special day')+'</div><div class="lrow__sub">'+jDateLabel(o.nx.date)+(o.nx.years>0?' \u00b7 turns '+o.nx.years:'')+'</div></div><span class="rlcount rlcount--sm">'+(o.nx.days===0?'Today':'in '+o.nx.days+'d')+'</span></div>'; }).join('')+'</div>' : '';
 el.innerHTML=add+hero+stats+noteCard+upCard;
 }
 function rlNoteCard(n,preview){
 var meta=[]; if(n.from) meta.push('from '+esc(n.from)); meta.push(jDateLabel(n.date)||'');
 var body=esc(n.body||'').replace(/\n/g,'<br>');
 return '<article class="rlnote">'
 +'<div class="rlnote__meta">'+meta.filter(Boolean).join(' \u00b7 ')+'</div>'
 +(n.title?'<div class="rlnote__t">'+esc(n.title)+'</div>':'')
 +'<div class="rlnote__b">'+body+'</div>'
 +(preview?'':'<div class="rlnote__acts"><button class="ckmeal__b" data-rlnedit="'+n.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-rlndel="'+n.id+'" aria-label="Delete">'+RL_ICO.x+'</button></div>')
 +'</article>';
 }
 function renderRelNotes(){
 var el=$('#rlNotes'); if(!el||!rlUnlocked) return;
 var arr=FD.data.relationship.notes;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="relNote">'+RL_ICO.plus+'Write a note</button></div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(RL_ICO.letter,'No notes yet','Little letters for the one you love, a thank-you, a memory, a line that made you think of them. They\u2019ll wait here, safe.',''); return; }
 var list=arr.slice().sort(function(a,b){ var c=String(b.date).localeCompare(String(a.date)); return c||(b.createdAt-a.createdAt); });
 el.innerHTML=add+'<div class="jlist">'+list.map(function(n){return rlNoteCard(n,false);}).join('')+'</div>';
 }
 function renderRelDates(){
 var el=$('#rlDates'); if(!el||!rlUnlocked) return;
 var arr=FD.data.relationship.dates;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="relDate">'+RL_ICO.plus+'Add special date</button></div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(RL_ICO.calh,'No special dates yet','Anniversaries, birthdays, the day you first met, add them once and this room counts down to each, every year.',''); return; }
 var list=relDateCardData();
 var rows=list.map(function(o){
 var nx=o.nx, d=o.d;
 var big=(nx.days===0)?'Today':(nx.days===1?'Tomorrow':'in '+nx.days+' days');
 return '<div class="hmrow'+(nx.days===0?' rltoday':'')+'"><span class="lnskico lnskico--rl">'+RL_ICO.calh+'</span><div class="hmrow__main"><div class="hmrow__t">'+esc(d.title||'Special day')+(d.type?' <span class="lnwho lnwho--rl">'+esc(d.type)+'</span>':'')+'</div><div class="hmrow__s">since '+jDateLabel(d.date)+(nx.years>0?' \u00b7 turns '+nx.years:'')+'</div>'+(d.note?'<div class="hmrow__note">'+esc(d.note)+'</div>':'')+'</div><span class="rlcount rlcount--sm">'+big+'</span><button class="ckmeal__b" data-rldedit="'+d.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-rlddel="'+d.id+'" aria-label="Delete">'+RL_ICO.x+'</button></div>';
 }).join('');
 el.innerHTML=add+'<div class="hmlist">'+rows+'</div>';
 }
 function rlPlanRow(p){
 var sub=[]; if(p.done) sub.push('done'+(p.doneAt?' '+jDateLabel(p.doneAt):'')); else if(p.when) sub.push(jDateLabel(p.when)); if(p.place) sub.push(esc(p.place));
 return '<div class="hmrow'+(p.done?' is-done':'')+(rlSurpriseId===p.id?' rlglow':'')+'"><button class="hmrow__chk hmrow__chk--rl" data-rlpdone="'+p.id+'" aria-label="We did it">'+RL_ICO.check+'</button><div class="hmrow__main"><div class="hmrow__t">'+esc(p.title||'A little plan')+'</div>'+(sub.length?'<div class="hmrow__s">'+sub.join(' \u00b7 ')+'</div>':'')+(p.note?'<div class="hmrow__note">'+esc(p.note)+'</div>':'')+'</div><button class="ckmeal__b" data-rlpedit="'+p.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-rlpdel="'+p.id+'" aria-label="Delete">'+RL_ICO.x+'</button></div>';
 }
 function renderRelPlans(){
 var el=$('#rlPlans'); if(!el||!rlUnlocked) return;
 var arr=FD.data.relationship.plans;
 var ideas=arr.filter(function(p){return !p.done&&!p.when;});
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="relPlan">'+RL_ICO.plus+'Add idea or plan</button>'+(ideas.length>1?'<button class="btn btn--soft" data-rlsurprise="1">'+RL_ICO.spark+'Surprise me</button>':'')+'</div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(RL_ICO.spark,'The idea jar is empty','Collect little date ideas, a caf\u00e9 to try, a film, a sunset walk. When one happens, tick it and it becomes a memory.',''); return; }
 var planned=arr.filter(function(p){return !p.done&&p.when;}).sort(function(a,b){return String(a.when).localeCompare(String(b.when));});
 var mems=arr.filter(function(p){return p.done;}).sort(function(a,b){return String(b.doneAt||'').localeCompare(String(a.doneAt||''));});
 var html=add;
 if(planned.length) html+='<div class="hsec-h">Planned \u00b7 '+planned.length+'</div><div class="hmlist" style="margin-bottom:14px">'+planned.map(rlPlanRow).join('')+'</div>';
 html+='<div class="hsec-h">Idea jar \u00b7 '+ideas.length+'</div>';
 html+= ideas.length? '<div class="hmlist">'+ideas.map(rlPlanRow).join('')+'</div>' : '<div class="docempty">Jar\u2019s empty, drop an idea in.</div>';
 if(mems.length) html+='<div class="hsec-h" style="margin-top:16px">Memories made \u00b7 '+mems.length+'</div><div class="hmlist">'+mems.map(rlPlanRow).join('')+'</div>';
 el.innerHTML=html;
 }

 /* ===================== PLANNING ===================== */
 var PL_ICO={
 task:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.5 12.2l2.4 2.4 4.6-5"/></svg>',
 folder:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 7.5A2 2 0 0 1 6 5.5h4l2 2.5h6a2 2 0 0 1 2 2V17a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17V7.5Z"/></svg>',
 cal:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="14" rx="2.5"/><path d="M8 3.8V8M16 3.8V8M4 11h16"/></svg>',
 alert:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 4 21 19H3L12 4Z"/><path d="M12 10v4M12 16.8v.4"/></svg>',
 check:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
 plus:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
 x:'<svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>'
 };
 var pltFilter='all', plOpenP={}, plWeekOff=0, plFoldT={};
 function projectName(pid){ var p=FD.getProject(pid); return p?p.name:''; }
 function projectStats(pid){ var t=0,dn=0; FD.data.planning.tasks.forEach(function(x){ if(x.projectId===pid){ t++; if(x.done) dn++; } }); return {total:t,done:dn}; }
 function taskGroup(t){ if(t.done) return 'done'; if(!t.due) return 'nodate'; var td=todayStr(); if(t.due<td) return 'overdue'; if(t.due===td) return 'today'; return 'upcoming'; }
 function plSort(a,b){ var po={high:0,normal:1,low:2}; var c=(po[a.priority]-po[b.priority]); if(c) return c; var da=a.due||'9999',db=b.due||'9999'; c=da.localeCompare(db); return c||(a.createdAt-b.createdAt); }
 function plPrioChip(t){ if(t.priority==='high') return '<span class="plprio plprio--hi">High</span>'; if(t.priority==='low') return '<span class="plprio">Low</span>'; return ''; }
 function subBlock(t){
 if(!(t.subs&&t.subs.length)) return {prog:'',fold:'',body:''};
 var done=t.subs.filter(function(s){return s.done;}).length;
 var open=!!plFoldT[t.id];
 var prog=' <span class="tprog">'+done+'/'+t.subs.length+'</span>';
 var fold='<button type="button" class="tfold'+(open?' is-open':'')+'" data-plfold="'+t.id+'" aria-label="'+(open?'Hide':'Show')+' sub-tasks"><svg class="ico" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>';
 var rows=t.subs.map(function(s,si){return '<button type="button" class="tsub'+(s.done?' is-done':'')+'" data-tsub="'+t.id+'::'+si+'"><span class="tsub__box"></span>'+esc(s.t)+'</button>';}).join('');
 var body='<div class="tsubwrap'+(open?' is-open':'')+'"><div class="tsubwrap__inner"><div class="tsubs">'+rows+'</div></div></div>';
 return {prog:prog,fold:fold,body:body};
 }
 function taskRowFull(t){
 var g=taskGroup(t);
 var sub=[]; 
 if(t.done) sub.push('done'+(t.doneAt?' '+jDateLabel(t.doneAt):''));
 else if(g==='overdue') sub.push('<span class="hmover">Overdue \u00b7 '+jDateLabel(t.due)+'</span>');
 else if(t.due) sub.push('Due '+jDateLabel(t.due));
 else sub.push('No date');
 if(t.member) sub.push(esc(t.member));
 var pj=t.projectId?projectName(t.projectId):'';
 var _sb=subBlock(t);
 return '<div class="hmrow'+(t.done?' is-done':'')+(g==='overdue'?' is-over':'')+'"><button class="hmrow__chk hmrow__chk--pl" data-pltdone="'+t.id+'" aria-label="Toggle done">'+PL_ICO.check+'</button><div class="hmrow__main"><div class="hmrow__t"><button type="button" class="tttl" data-pltopen="'+t.id+'">'+esc(t.title||'Task')+'</button> '+plPrioChip(t)+_sb.prog+_sb.fold+(pj?' <span class="lnwho lnwho--pl">'+esc(pj)+'</span>':'')+'</div><div class="hmrow__s">'+sub.join(' \u00b7 ')+'</div>'+(t.note?'<div class="hmrow__note">'+esc(t.note).replace(/\n/g,'<br>')+'</div>':'')+_sb.body+'</div><button class="ckmeal__b" data-pltedit="'+t.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-pltdel="'+t.id+'" aria-label="Delete">'+PL_ICO.x+'</button></div>';
 }
 function taskRowSlim(t){
 var g=taskGroup(t);
 var sub=t.done?'':(g==='overdue'?'<span class="hmover">Overdue</span>':(t.due?jDateLabel(t.due):''));
 if(t.member) sub+=(sub?' \u00b7 ':'')+esc(t.member);
 var _sb=subBlock(t);
 return '<div class="hmrow hmrow--slim'+(t.done?' is-done':'')+'"><button class="hmrow__chk hmrow__chk--pl" data-pltdone="'+t.id+'" aria-label="Toggle done">'+PL_ICO.check+'</button><div class="hmrow__main"><div class="hmrow__t"><button type="button" class="tttl" data-pltopen="'+t.id+'">'+esc(t.title||'Task')+'</button> '+plPrioChip(t)+_sb.prog+_sb.fold+'</div>'+(sub?'<div class="hmrow__s">'+sub+'</div>':'')+_sb.body+'</div><button class="ckmeal__b" data-pltedit="'+t.id+'" aria-label="Edit">'+J_ICO.pen+'</button></div>';
 }
 /* ============ TASKS PAGE — redesign (v43) ============ */
 var pltQuery='';
 function pltShell(){
  return '<div class="pl-top"><button class="btn btn--primary" data-modal="task">'+PL_ICO.plus+'Add task</button></div>'
   + '<div class="pj-ctrl"><div class="pj-ctrl__row">'
   + '<label class="pj-search" id="pltSearchBox">'+PJ_ICO.search
   + '<input id="pltSearch" type="text" placeholder="Search tasks" autocomplete="off" aria-label="Search tasks">'
   + '<button class="pj-search__x" data-pltclrq="1" type="button" aria-label="Clear search">'+PL_ICO.x+'</button></label>'
   + '</div><div class="pj-chips" id="pltChips"></div></div><div id="pltResults"></div>';
 }
 function pltChipsHTML(){
  var arr=FD.data.planning.tasks, who={};
  arr.forEach(function(x){ var k=x.member||''; who[k]=(who[k]||0)+1; });
  var names=Object.keys(who).filter(function(n){ return n; });
  var out='<button class="pj-chip'+(pltFilter==='all'?' is-on':'')+'" type="button" data-pltfilter="all">All<span class="pj-chip__n">'+arr.length+'</span></button>';
  names.forEach(function(n){
   out+='<button class="pj-chip'+(pltFilter===n?' is-on':'')+'" type="button" data-pltfilter="'+esc(n)+'">'+esc(n)+'<span class="pj-chip__n">'+who[n]+'</span></button>';
  });
  if(who['']) out+='<button class="pj-chip'+(pltFilter==='__none'?' is-on':'')+'" type="button" data-pltfilter="__none">Unassigned<span class="pj-chip__n">'+who['']+'</span></button>';
  return out;
 }
 function pltResultsHTML(){
  var arr=FD.data.planning.tasks;
  if(!arr.length) return hEmpty(PL_ICO.task,'No tasks yet',
   'Everything the family needs to get done, with dates, owners and priorities, lives here.',
   '<button class="btn btn--primary" data-modal="task">'+PL_ICO.plus+'Add your first task</button>');
  var q=pltQuery.trim().toLowerCase();
  var list=arr.slice().filter(function(x){
   if(!lnMatch(x,pltFilter)) return false;
   if(!q) return true;
   return String(x.title||'').toLowerCase().indexOf(q)>-1
       || String(x.note||'').toLowerCase().indexOf(q)>-1
       || String(projectName(x.projectId)||'').toLowerCase().indexOf(q)>-1;
  });
  if(q&&!list.length) return hEmpty(PJ_ICO.search,'No tasks match \u201c'+esc(pltQuery.trim())+'\u201d',
   'Try a different word, or clear the search to see everything.',
   '<button class="btn btn--soft" data-pltclrq="1">Clear search</button>');
  var G={overdue:[],today:[],upcoming:[],nodate:[],done:[]};
  list.forEach(function(t){ G[taskGroup(t)].push(t); });
  ['overdue','today','upcoming','nodate'].forEach(function(k){ G[k].sort(plSort); });
  G.done.sort(function(a,b){ return String(b.doneAt||'').localeCompare(String(a.doneAt||''))||(b.createdAt-a.createdAt); });
  var openN=G.overdue.length+G.today.length+G.upcoming.length+G.nodate.length;
  var html='<div class="plt-strip pl-rise">'
   + '<div class="plt-si plt-si--over"><span class="plt-si__n">'+G.overdue.length+'</span><span class="plt-si__l">Overdue</span></div>'
   + '<div class="plt-si plt-si--today"><span class="plt-si__n">'+G.today.length+'</span><span class="plt-si__l">Due today</span></div>'
   + '<div class="plt-si plt-si--up"><span class="plt-si__n">'+G.upcoming.length+'</span><span class="plt-si__l">Upcoming</span></div>'
   + '<div class="plt-si plt-si--done"><span class="plt-si__n">'+G.done.length+'</span><span class="plt-si__l">Done</span></div></div>';
  var d=0;
  function sec(title,ico,cc,items,mod){
   if(!items.length) return '';
   d+=0.05;
   return '<section class="pj-sec pl-rise'+(mod||'')+'" style="animation-delay:'+d.toFixed(2)+'s"><div class="pj-sec__h">'
    + '<span class="pj-sec__ic" style="--cc:'+cc+'">'+ico+'</span><span class="pj-sec__t">'+title+'</span>'
    + '<span class="pj-sec__n">'+items.length+'</span><span class="pj-sec__ln"></span></div>'
    + '<div class="plt-list">'+items.map(taskRowFull).join('')+'</div></section>';
  }
  html+=sec('Overdue',PL_ICO.alert,'var(--danger)',G.overdue);
  html+=sec('Today',PJ_ICO.cal,'var(--m-planning)',G.today);
  html+=sec('Upcoming',PJ_ICO.clock,'var(--pjc-travel)',G.upcoming);
  html+=sec('Someday \u00b7 no date',PJ_ICO.box,'var(--pjc-archived)',G.nodate);
  if(!openN) html+='<div class="plo-quiet">Nothing open '+(pltFilter!=='all'?'for this filter':'\u2014 clear runway, mashallah')+'.</div>';
  if(G.done.length){
   d+=0.05;
   html+='<section class="pj-sec pl-rise" style="animation-delay:'+d.toFixed(2)+'s"><div class="pj-sec__h">'
    + '<span class="pj-sec__ic" style="--cc:var(--ok)">'+PJ_ICO.check+'</span><span class="pj-sec__t">Done</span>'
    + '<span class="pj-sec__n">'+G.done.length+'</span><span class="pj-sec__ln"></span>'
    + '<button class="plo-link" type="button" data-pltclr="1">Clear</button></div>'
    + '<div class="plt-list">'+G.done.map(taskRowFull).join('')+'</div></section>';
  }
  return html;
 }
 function pltPaint(){
  var c=document.getElementById('pltChips'); if(c) c.innerHTML=pltChipsHTML();
  var r=document.getElementById('pltResults'); if(r) r.innerHTML=pltResultsHTML();
 }
 function renderPlanTasks(){
  var el=$('#plTasks'); if(!el) return;
  if(!document.getElementById('pltResults')){
   el.innerHTML=pltShell();
   var i=document.getElementById('pltSearch');
   if(i) i.addEventListener('input',function(){
    pltQuery=i.value;
    var b=document.getElementById('pltSearchBox'); if(b) b.classList.toggle('has-val',!!i.value);
    pltPaint();
   });
  }
  pltPaint();
 }
 /* ================= PROJECTS PAGE — redesign (v43) ================= */
 var PJ_CATS=['personal','work','health','finance','family','education','travel'];
 var PJ_MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 var pjFilter='all', pjQuery='', pjSort='priority', pjDrawerId='', pjDragEl=null;
 var PJ_ICO={
  personal:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 12.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></svg>',
  work:'<svg class="ico" viewBox="0 0 24 24"><rect x="3.5" y="7.5" width="17" height="12" rx="2.5"/><path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5M3.5 12.5h17"/></svg>',
  health:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-9.4A3.6 3.6 0 0 1 12 8a3.6 3.6 0 0 1 7 2.6C19 15.6 12 20 12 20Z"/></svg>',
  finance:'<svg class="ico" viewBox="0 0 24 24"><rect x="3.5" y="6.5" width="17" height="12" rx="2.5"/><path d="M3.5 10.5h17"/><circle cx="16.5" cy="14.5" r="1.3"/></svg>',
  family:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 20v-6l8-6 8 6v6"/><path d="M9.5 20v-4h5v4"/></svg>',
  education:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 5 2.5 9.5 12 14l9.5-4.5L12 5Z"/><path d="M6.5 11.5V16c0 1 2.5 2.5 5.5 2.5s5.5-1.5 5.5-2.5v-4.5"/></svg>',
  travel:'<svg class="ico" viewBox="0 0 24 24"><path d="M10.5 13.5 3 15l-.5-2.2 6-2.2L7 4.5l2-.5 4 5 5-1.4a1.6 1.6 0 0 1 .8 3.1L14 12l-1 6.5-1.8.5-.7-5.5Z"/></svg>',
  archived:'<svg class="ico" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="4" rx="1.5"/><path d="M5 9v9a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 18V9M10 13h4"/></svg>',
  dots:'<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/></svg>',
  search:'<svg class="ico" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>',
  sort:'<svg class="ico" viewBox="0 0 24 24"><path d="M7 4v16M7 20l-3-3M7 4l3 3M17 20V4M17 4l-3 3M17 20l3-3"/></svg>',
  flag:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 21V4h11l-1.5 4L16 12H5"/></svg>',
  low:'<svg class="ico" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
  clock:'<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></svg>',
  cal:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="14" rx="2.5"/><path d="M8 3.8V8M16 3.8V8M4 11h16"/></svg>',
  arrow:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
  check:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  pin:'<svg class="ico" viewBox="0 0 24 24"><path d="M9 3.5h6l-1 5 3 3v2H8v-2l3-3-2-5Z"/><path d="M12 13.5V21"/></svg>',
  users:'<svg class="ico" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c0-3 2.5-4.6 5.5-4.6s5.5 1.6 5.5 4.6"/><path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M20.5 19c0-2.4-1.4-3.9-3.5-4.4"/></svg>',
  copy:'<svg class="ico" viewBox="0 0 24 24"><rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M5.5 15.5H5a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 5 3.5h9A1.5 1.5 0 0 1 15.5 5v.5"/></svg>',
  move:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 3v18M3 12h18M8 7l4-4 4 4M8 17l4 4 4-4M7 8l-4 4 4 4M17 8l4 4-4 4"/></svg>',
  trash:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 7h14M9 7V5h6v2M6 7l1 12h10l1-12"/></svg>',
  box:'<svg class="ico" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="4" rx="1.5"/><path d="M5 9v9a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 18V9"/></svg>',
  bolt:'<svg class="ico" viewBox="0 0 24 24"><path d="M13 3 4 14h6l-1 7 9-11h-6l1-7Z"/></svg>',
  back:'<svg class="ico" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',
  up:'<svg class="ico" viewBox="0 0 24 24"><path d="M6 15V9a2 2 0 0 1 2-2h9"/><path d="M14 4.5 17.5 7 14 9.5"/></svg>',
  party:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 20l4.5-11 6.5 6.5L4 20Z"/><path d="M14 4.5c1.5 0 2.5 1 2.5 2.5M18.5 8c1 0 1.8.7 1.8 1.8M13 9l1-1M17 12l1.5-.5M19.5 15l.5-1.5"/></svg>',
  userplus:'<svg class="ico" viewBox="0 0 24 24"><circle cx="10" cy="8" r="3.2"/><path d="M4 19c0-3 2.7-4.7 6-4.7 1.1 0 2.1.2 3 .6"/><path d="M17.5 14.5v5M15 17h5"/></svg>',
  abc:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 18l4-11 4 11M5.2 14.5h5.6M14 8h5M14 8l5 8h-5"/></svg>'
 };
  /* ============ HIERARCHY: Vision → Area → Project → Sub-project → Task → Subtask ============
     One field does the heavy lifting: project.parentId.
     A project with a parent is a "phase". Depth is capped at two levels on purpose —
     deeper nesting looks clever and feels lost.                                            */

  /* ---- option lists for the project form ---- */
 function pjParentOpts(selfId){
  var out=['Top level \u2014 a project of its own'];
  pjAllProjects().forEach(function(x){
   if(x.id===selfId || x.status==='archived') return;
   if(!pjCanParent(selfId||'__new__', x.id)) return;
   out.push('Phase of: '+(x.name||'Untitled'));
  });
  return out;
 }
 function pjParentValue(pj){
  var par=pjParent(pj);
  return par ? ('Phase of: '+(par.name||'Untitled')) : 'Top level \u2014 a project of its own';
 }
 function pjParentIdFromLabel(label,selfId){
  label=String(label||'');
  if(label.indexOf('Phase of: ')!==0) return '';
  var nm=label.slice(10), hit='';
  pjAllProjects().some(function(x){
   if(x.id!==selfId && (x.name||'Untitled')===nm && pjCanParent(selfId,x.id)){ hit=x.id; return true; }
   return false;
  });
  return hit;
 }
 function pjGoalOpts(){
  var out=['No goal'];
  (FD.data.goals||[]).forEach(function(g){ if(g.title) out.push(g.title); });
  return out;
 }
 function pjGoalValue(pj){ var g=pjGoal(pj); return (g&&g.title)?g.title:'No goal'; }
 function pjGoalIdFromLabel(label){
  label=String(label||'');
  if(!label || label==='No goal') return '';
  var id='';
  (FD.data.goals||[]).some(function(g){ if(g.title===label){ id=g.id; return true; } return false; });
  return id;
 }
 function pjAllProjects(){ return (FD.data.planning&&FD.data.planning.projects)||[]; }

  /* direct children, in manual order */
  function pjChildren(id){
    if(!id) return [];
    return pjAllProjects().filter(function(x){ return x.parentId===id; })
      .sort(function(a,b){ return (a.order||0)-(b.order||0); });
  }
  function pjParent(p){
    if(!p||!p.parentId) return null;
    return FD.getProject(p.parentId);
  }
  function pjIsSub(p){ return !!(p && p.parentId && FD.getProject(p.parentId)); }
  function pjIsParent(p){ return !!(p && pjChildren(p.id).length); }

  /* may `childId` sit under `parentId`? guards self-reference, cycles and depth */
  function pjCanParent(childId, parentId){
    if(!parentId) return true;                 /* moving to top level is always fine */
    if(childId===parentId) return false;       /* cannot own itself */
    var par=FD.getProject(parentId);
    if(!par) return false;
    if(par.parentId) return false;             /* parent is itself a phase → would be 3 levels */
    if(pjChildren(childId).length) return false; /* child has phases of its own → would be 3 levels */
    /* walk up from the proposed parent; if we meet the child, it is a cycle */
    var seen={}, cur=par, hops=0;
    while(cur && cur.parentId && hops<50){
      if(cur.parentId===childId) return false;
      if(seen[cur.id]) break;
      seen[cur.id]=1; cur=FD.getProject(cur.parentId); hops++;
    }
    return true;
  }
  function pjSetParent(childId, parentId){
    var c=FD.getProject(childId); if(!c) return false;
    if(!pjCanParent(childId, parentId||'')) return false;
    c.parentId=parentId||'';
    FD.save();
    return true;
  }

  /* tasks belonging to a project, optionally including its phases */
  function pjOwnTasks(id){
    return ((FD.data.planning&&FD.data.planning.tasks)||[]).filter(function(t){ return t.projectId===id; });
  }
  function pjTreeTasks(id){
    var out=pjOwnTasks(id);
    pjChildren(id).forEach(function(k){ out=out.concat(pjOwnTasks(k.id)); });
    return out;
  }
  function pjTreeStats(id){
    var all=pjTreeTasks(id), done=0;
    all.forEach(function(t){ if(t.done) done++; });
    return {total:all.length, done:done};
  }

  /* the vision (family goal) a project serves */
  function pjGoal(p){
    if(!p||!p.goalId) return null;
    var g=null;
    (FD.data.goals||[]).some(function(x){ if(x.id===p.goalId){ g=x; return true; } return false; });
    return g;
  }

  /* a project's own deadline, falling back to the earliest open task */
  function pjDeadline(p, inf){
    if(p && p.due) return p.due;
    return (inf && inf.due) || '';
  }
 function pjCat(p){ return PJ_CATS.indexOf(p.cat)>-1?p.cat:'family'; }
 function pjCC(c){ return 'var(--pjc-'+c+')'; }
 function pjLab(c){ return c.charAt(0).toUpperCase()+c.slice(1); }
 function pjRank(p){ return p.prio==='high'?0:(p.prio==='low'?2:1); }
 function pjDue(ds){
  if(!ds) return null;
  var t=todayStr(), q=ds.split('-'), lbl=(+q[2])+' '+PJ_MN[(+q[1])-1];
  if(ds<t) return {over:true,txt:'Overdue \u00b7 '+lbl};
  if(ds===t) return {over:false,txt:'Due today'};
  return {over:false,txt:'Due '+lbl};
 }
 function pjInfo(p){
  var st=pjTreeStats(p.id);
  var ownSt=projectStats(p.id);
  var all=FD.data.planning.tasks.filter(function(t){ return t.projectId===p.id; });
  var open=all.filter(function(t){ return !t.done; }).sort(plSort);
  var due=''; open.forEach(function(t){ if(t.due&&(!due||t.due<due)) due=t.due; });
  var seen={}, mem=[];
  all.forEach(function(t){ if(t.member&&!seen[t.member]){ seen[t.member]=1; mem.push(t.member); } });
  var asg=(Array.isArray(p.members)?p.members.slice():[]);
  return {st:st, pct:st.total?Math.round(st.done/st.total*100):0, next:open.length?open[0]:null,
   due:due, members:(asg.length?asg:mem), assigned:asg, derived:mem, open:open, all:all,
   own:ownSt, kids:pjChildren(p.id), isSub:pjIsSub(p),
   complete:(p.status==='completed')||(st.total>0&&st.done===st.total)};
 }
 function pjBucket(p){ return p.status==='archived'?'archived':(pjInfo(p).complete?'completed':'active'); }
 function pjAvatars(names){
  if(!names.length) return '';
  var out='';
  names.slice(0,3).forEach(function(nm){
   var m=null;
   FD.data.members.some(function(x){ if(x.name===nm){ m=x; return true; } return false; });
   out+= m? avatarHTML(m,'pj-av') : '<span class="pj-av" style="background:var(--text-3)">'+esc(String(nm).slice(0,2).toUpperCase())+'</span>';
  });
  if(names.length>3) out+='<span class="pj-av" style="background:var(--text-3)">+'+(names.length-3)+'</span>';
  return '<span class="pj-avs">'+out+'</span>';
 }
 function pjSortList(a){
  var r=a.slice();
  if(pjSort==='recent') r.sort(function(x,y){ return (y.createdAt||0)-(x.createdAt||0); });
  else if(pjSort==='progress') r.sort(function(x,y){ return pjInfo(y).pct-pjInfo(x).pct; });
  else if(pjSort==='alpha') r.sort(function(x,y){ return String(x.name||'').localeCompare(String(y.name||'')); });
  else if(pjSort==='manual') r.sort(function(x,y){ return (x.order||0)-(y.order||0); });
  else r.sort(function(x,y){ return pjRank(x)-pjRank(y) || (y.createdAt||0)-(x.createdAt||0); });
  return r;
 }

 /* ---------- card ---------- */
 function pjCard(p){
  var c=pjCat(p), inf=pjInfo(p), d=pjDue(inf.due);
  var cls='pj-card'+(p.status==='archived'?' pj-card--arch':(inf.complete?' pj-card--done':''));
  var right = inf.complete ? '<span class="pj-tick">'+PJ_ICO.check+'</span>'
    : (d?'<span class="pj-card__due'+(d.over?' is-over':'')+'">'+d.txt+'</span>':'<span class="pj-card__due">No date</span>');
  var prio = (inf.complete||p.prio==='normal')?'' :
    (p.prio==='high'?'<span class="pj-prio pj-prio--hi">'+PJ_ICO.flag+'High</span>':'<span class="pj-prio pj-prio--lo">'+PJ_ICO.low+'Low</span>');
  return '<article class="'+cls+'" data-cat="'+c+'" style="--cc:'+pjCC(c)+'" data-pjcard="'+p.id+'" draggable="true">'
   + '<div class="pj-card__t"><span class="pj-card__ic">'+PJ_ICO[c]+'</span><span class="pj-card__cat">'+pjLab(c)+'</span>'
   + (inf.kids.length?'<span class="pj-ph">'+inf.kids.length+' phase'+(inf.kids.length>1?'s':'')+'</span>':'')
   + (p.pinned?'<span class="pj-card__pin" title="Pinned">'+PJ_ICO.pin+'</span>':'')
   + '<span class="pj-card__sp"></span>'
   + '<button class="pj-avbtn pj-card__avs" type="button" data-pjassign="'+p.id+'" aria-label="Assign members" title="Assign members">'
   + (inf.members.length?pjAvatars(inf.members):'<span class="pj-assign0">'+PJ_ICO.userplus+'</span>')+'</button>'
   + '<button class="pj-dots" data-pjmenu="'+p.id+'" aria-label="More options">'+PJ_ICO.dots+'</button></div>'
   + '<div class="pj-card__n">'+esc(p.name||'Project')+'</div>'
   + (inf.isSub?'<div class="pj-in">'+PJ_ICO.up+'in '+esc((pjParent(p)||{}).name||'')+'</div>':'')
   + '<div class="pj-card__gr"></div>'
   + '<div class="pj-bar"><span style="width:'+inf.pct+'%"></span><i></i></div>'
   + '<div class="pj-card__m"><span class="pj-card__tk">'+inf.st.done+'/'+inf.st.total+' tasks</span><span class="pj-card__msp"></span>'+prio+right+'</div>'
   + '</article>';
 }
 function pjGrid(a){ return '<div class="pj-grid">'+a.map(pjCard).join('')+'</div>'; }
 function pjSection(title,ico,cc,arr,mod){
  return '<section class="pj-sec'+(mod||'')+'"><div class="pj-sec__h"><span class="pj-sec__ic" style="--cc:'+cc+'">'+ico
   +'</span><span class="pj-sec__t">'+title+'</span><span class="pj-sec__n">'+arr.length+'</span><span class="pj-sec__ln"></span></div>'+pjGrid(arr)+'</section>';
 }

 /* ---------- current focus ---------- */
 function pjFocus(p){
  var c=pjCat(p), inf=pjInfo(p), d=pjDue(inf.due);
  var circ=2*Math.PI*54, off=circ*(1-inf.pct/100);
  return '<div class="pj-focuswrap"><div class="pj-foclab">'+PJ_ICO.pin+'<span>Current focus</span></div>'
   + '<article class="pj-focus" data-cat="'+c+'" style="--cc:'+pjCC(c)+'" data-pjcard="'+p.id+'">'
   + '<div class="pj-ring"><svg width="122" height="122" viewBox="0 0 122 122"><circle class="pj-ring__tr" cx="61" cy="61" r="54" stroke-width="11"/>'
   + '<circle class="pj-ring__fill" cx="61" cy="61" r="54" stroke-width="11" stroke-dasharray="'+circ.toFixed(1)+'" stroke-dashoffset="'+circ.toFixed(1)+'" data-off="'+off.toFixed(1)+'"/></svg>'
   + '<div class="pj-ring__c"><div class="pj-ring__p">'+inf.pct+'%</div><div class="pj-ring__l">'+inf.st.done+'/'+inf.st.total+' done</div></div></div>'
   + '<div class="pj-focus__b"><span class="pj-badge">'+PJ_ICO[c]+pjLab(c)+'</span><div class="pj-focus__n">'+esc(p.name||'Project')+'</div>'
   + (inf.next?'<div class="pj-focus__next">'+PJ_ICO.arrow+'<span>Next up \u00b7 <b>'+esc(inf.next.title||'')+'</b></span></div>':'')
   + '<div class="pj-fmeta">'+(d?'<span class="pj-fm'+(d.over?' is-over':'')+'">'+PJ_ICO.cal+d.txt+'</span>':'')
   + '<span class="pj-fm">'+PJ_ICO.check+inf.st.done+' of '+inf.st.total+' tasks</span>'
   + '<button class="pj-fm pj-avbtn" type="button" data-pjassign="'+p.id+'">'+PJ_ICO.users
   + (inf.members.length?pjAvatars(inf.members):'<span class="pj-assignlbl">Assign</span>')+'</button></div></div>'
   + '<div class="pj-focus__cta"><button class="pj-cont" data-pjcard="'+p.id+'">Continue'+PJ_ICO.arrow+'</button>'
   + '<button class="pj-dots" data-pjmenu="'+p.id+'" aria-label="More options">'+PJ_ICO.dots+'</button></div></article></div>';
 }

 /* ---------- shell / chips / sort ---------- */
 function pjShell(){
  return '<div class="pj-ctrl"><div class="pj-ctrl__row">'
   + '<label class="pj-search" id="pjSearchBox">'+PJ_ICO.search
   + '<input id="pjSearch" type="text" placeholder="Search projects" autocomplete="off" aria-label="Search projects">'
   + '<button class="pj-search__x" data-pjclr="1" type="button" aria-label="Clear search">'+PL_ICO.x+'</button></label>'
   + '<div class="pj-sortwrap"><button class="pj-sortbtn" data-pjsortbtn="1" type="button">'+PJ_ICO.sort
   + 'Sort: <b id="pjSortLbl">Priority</b></button><div class="pj-menu" id="pjSortMenu"></div></div>'
   + '<button class="btn btn--primary pj-new" data-modal="project">'+PL_ICO.plus+'New project</button>'
   + '</div><div class="pj-chips" id="pjChips"></div></div><div id="pjResults"></div>';
 }
 var PJ_SORTS=[['priority','Priority',PJ_ICO.bolt],['recent','Recent',PJ_ICO.clock],['progress','Progress',PJ_ICO.check],['alpha','Alphabetical',PJ_ICO.abc],['manual','Manual',PJ_ICO.move]];
 function pjSortMenu(){
  var m=document.getElementById('pjSortMenu'); if(!m) return;
  m.innerHTML=PJ_SORTS.map(function(s){
   return '<button class="pj-menu__i'+(pjSort===s[0]?' is-sel':'')+'" type="button" data-pjsort="'+s[0]+'" data-pjsortlbl="'+s[1]+'">'
    +s[2]+s[1]+'<span class="pj-menu__sp"></span><span class="pj-menu__ck">'+PJ_ICO.check+'</span></button>';
  }).join('');
 }
 function pjChips(){
  var el=document.getElementById('pjChips'); if(!el) return;
  var all=FD.data.planning.projects;
  var n={all:all.length,active:0,completed:0,archived:0};
  PJ_CATS.forEach(function(c){ n[c]=0; });
  all.forEach(function(p){ var b=pjBucket(p); n[b]=(n[b]||0)+1; if(b!=='archived') n[pjCat(p)]++; });
  var list=[['all','All'],['active','Active'],['completed','Completed']].concat(PJ_CATS.map(function(c){return [c,pjLab(c)];})).concat([['archived','Archived']]);
  el.innerHTML=list.map(function(f){
   return '<button class="pj-chip'+(pjFilter===f[0]?' is-on':'')+'" type="button" data-pjfilter="'+f[0]+'">'+f[1]
    +'<span class="pj-chip__n">'+(n[f[0]]||0)+'</span></button>';
  }).join('');
 }

 /* ---------- results ---------- */
 function pjResultsHTML(){
  var all=FD.data.planning.projects;
  if(!all.length) return hEmpty(PL_ICO.folder,'No projects yet',
   'Bigger undertakings \u2014 a renovation, Eid preparations, admission paperwork \u2014 broken into tasks that tick a progress bar as they\u2019re done.',
   '<button class="btn btn--primary" data-modal="project">'+PL_ICO.plus+'Create your first project</button>');
  var q=pjQuery.trim().toLowerCase();
  if(q){
   var hits=pjSortList(all.filter(function(p){ return String(p.name||'').toLowerCase().indexOf(q)>-1 || String(p.note||'').toLowerCase().indexOf(q)>-1; }));
   if(!hits.length) return hEmpty(PJ_ICO.search,'No projects match \u201c'+esc(pjQuery.trim())+'\u201d',
    'Try a different word, or clear the search to see everything.',
    '<button class="btn btn--soft" data-pjclr="1">Clear search</button>');
   return pjGrid(hits);
  }
  var f=pjFilter;
  if(f==='completed'||f==='archived'){
   var g=pjSortList(all.filter(function(p){ return pjBucket(p)===f; }));
   if(!g.length) return hEmpty(f==='archived'?PJ_ICO.archived:PJ_ICO.check,'Nothing '+f+' yet',
    f==='archived'?'Archive a project from its \u22ef menu to tuck it away without deleting it.':'Finish every task in a project and it will land here on its own.','');
   return pjGrid(g);
  }
  if(PJ_CATS.indexOf(f)>-1){
   var gc=pjSortList(all.filter(function(p){ return pjCat(p)===f && pjBucket(p)!=='archived'; }));
   if(!gc.length) return hEmpty(PJ_ICO[f],'Nothing in '+pjLab(f)+' yet','Projects you tag as '+pjLab(f)+' will gather here.',
    '<button class="btn btn--primary" data-modal="project">'+PL_ICO.plus+'New project</button>');
   return pjGrid(gc);
  }
  var active=all.filter(function(p){ return pjBucket(p)==='active' && !pjIsSub(p); });
  var done=pjSortList(all.filter(function(p){ return pjBucket(p)==='completed' && !pjIsSub(p); }));
  var arch=pjSortList(all.filter(function(p){ return pjBucket(p)==='archived'; }));
  if(!active.length){
   var body=hEmpty(PJ_ICO.party,'All caught up! \ud83c\udf89','Every active project is complete, mashallah. Take a breath \u2014 or start the next one.',
    '<button class="btn btn--primary" data-modal="project">'+PL_ICO.plus+'New project</button>');
   if(f==='all'){
    if(done.length) body+=pjSection('Completed',PJ_ICO.check,'var(--ok)',done,' pj-sec--done');
    if(arch.length) body+=pjSection('Archived',PJ_ICO.archived,'var(--pjc-archived)',arch,' pj-sec--arch');
   }
   if(done.length) pjCelebrate();
   return body;
  }
  var pin=null;
  active.forEach(function(p){ if(p.pinned&&!pin) pin=p; });
  var focus=pin||pjSortList(active).slice().sort(function(x,y){ return pjRank(x)-pjRank(y)||(y.createdAt||0)-(x.createdAt||0); })[0];
  var html=pjFocus(focus);
  var rest=active.filter(function(p){ return p.id!==focus.id; });
  PJ_CATS.forEach(function(c){
   var g=pjSortList(rest.filter(function(p){ return pjCat(p)===c; }));
   if(g.length) html+=pjSection(pjLab(c),PJ_ICO[c],pjCC(c),g,'');
  });
  if(f==='all'){
   if(done.length) html+=pjSection('Completed',PJ_ICO.check,'var(--ok)',done,' pj-sec--done');
   if(arch.length) html+=pjSection('Archived',PJ_ICO.archived,'var(--pjc-archived)',arch,' pj-sec--arch');
  }
  return html;
 }
 function pjPaint(){
  pjChips();
  var r=document.getElementById('pjResults'); if(!r) return;
  r.innerHTML=pjResultsHTML();
  var fr=r.querySelector('.pj-ring__fill');
  if(fr) setTimeout(function(){ try{ fr.style.strokeDashoffset=fr.getAttribute('data-off'); }catch(e){} },60);
  pjBindDrag();
 }
 function renderPlanProjects(){
  var el=$('#plProjects'); if(!el) return;
  if(!document.getElementById('pjResults')){
   el.innerHTML=pjShell();
   var i=document.getElementById('pjSearch');
   if(i) i.addEventListener('input',function(){
    pjQuery=i.value;
    var b=document.getElementById('pjSearchBox'); if(b) b.classList.toggle('has-val',!!i.value);
    pjPaint();
   });
   pjSortMenu();
  }
  pjPaint();
  if(pjDrawerId) pjDrawerFill();
 }

 /* ---------- drag to reorder ---------- */
 function pjBindDrag(){
  $$('#pjResults .pj-grid').forEach(function(grid){
   $$('.pj-card',grid).forEach(function(card){
    card.addEventListener('dragstart',function(e){ pjDragEl=card; card.classList.add('is-drag'); try{ e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('text/plain',card.getAttribute('data-pjcard')); }catch(err){} });
    card.addEventListener('dragend',function(){ card.classList.remove('is-drag'); $$('.pj-card.is-drop').forEach(function(c){ c.classList.remove('is-drop'); }); pjDragEl=null; pjSaveOrder(); });
   });
   grid.addEventListener('dragover',function(e){
    e.preventDefault();
    if(!pjDragEl||!grid.contains(pjDragEl)) return;
    var after=pjAfter(grid,e.clientY);
    $$('.pj-card.is-drop').forEach(function(c){ c.classList.remove('is-drop'); });
    if(!after){ grid.appendChild(pjDragEl); } else { grid.insertBefore(pjDragEl,after); after.classList.add('is-drop'); }
   });
  });
 }
 function pjAfter(grid,y){
  var best=null, bestOff=-Infinity;
  $$('.pj-card:not(.is-drag)',grid).forEach(function(el){
   var b=el.getBoundingClientRect(), off=y-(b.top+b.height/2);
   if(off<0&&off>bestOff){ bestOff=off; best=el; }
  });
  return best;
 }
 function pjSaveOrder(){
  var ids=$$('#pjResults [data-pjcard]').map(function(c){ return c.getAttribute('data-pjcard'); });
  var seen={}, i=0;
  ids.forEach(function(id){ if(seen[id]) return; seen[id]=1; var p=FD.getProject(id); if(p){ p.order=i++; } });
  FD.save();
  if(pjSort!=='manual'){ pjSort='manual'; var l=document.getElementById('pjSortLbl'); if(l) l.textContent='Manual'; pjSortMenu(); flash('Order saved \u00b7 sorting set to Manual'); }
  else flash('Order saved');
 }

 /* ---------- context menu ---------- */
 /* ---- press and hold a project to get its actions (Delete lives there) ---- */
 var pjLPTimer=null, pjLPFired=false, pjLPx=0, pjLPy=0, pjLPEl=null;
 function pjLPCancel(){
  if(pjLPTimer){ clearTimeout(pjLPTimer); pjLPTimer=null; }
  if(pjLPEl){ pjLPEl.classList.remove('is-holding'); pjLPEl=null; }
 }
 function pjLPStart(el, x, y){
  pjLPCancel();
  pjLPFired=false; pjLPx=x; pjLPy=y; pjLPEl=el;
  el.classList.add('is-holding');
  pjLPTimer=setTimeout(function(){
   pjLPTimer=null;
   var id=el.getAttribute('data-pjcard');
   if(!id) return;
   pjLPFired=true;
   el.classList.remove('is-holding');
   try{ if(navigator.vibrate) navigator.vibrate(12); }catch(e){}
   pjOpenMenu(id, el, 'main');
  }, 480);
 }
 document.addEventListener('touchstart', function(e){
  if(!e.target||!e.target.closest) return;
  if(e.target.closest('[data-pjmenu],[data-pjassign],.pj-menu,button')) return;
  var card=e.target.closest('[data-pjcard]');
  if(!card) return;
  var t=e.touches&&e.touches[0]; if(!t) return;
  pjLPStart(card, t.clientX, t.clientY);
 }, {passive:true});
 document.addEventListener('touchmove', function(e){
  if(!pjLPTimer) return;
  var t=e.touches&&e.touches[0]; if(!t) return;
  if(Math.abs(t.clientX-pjLPx)>10 || Math.abs(t.clientY-pjLPy)>10) pjLPCancel();
 }, {passive:true});
 document.addEventListener('touchend', pjLPCancel, {passive:true});
 document.addEventListener('touchcancel', pjLPCancel, {passive:true});
 /* desktop: right-click does the same */
 document.addEventListener('contextmenu', function(e){
  if(!e.target||!e.target.closest) return;
  var card=e.target.closest('[data-pjcard]');
  if(!card) return;
  var id=card.getAttribute('data-pjcard'); if(!id) return;
  e.preventDefault();
  pjOpenMenu(id, card, 'main');
 });
 function pjCloseMenu(){
  pjSheetScrim(false);
  var m=document.getElementById('pjCtx'); if(!m) return;
  m.id=''; m.classList.remove('is-open');
  setTimeout(function(){ if(m.parentNode) m.parentNode.removeChild(m); },220);
 }
 function pjMenuHTML(p,mode){
  var it='';
  if(mode==='prio'){
   it='<button class="pj-menu__i" type="button" data-pjact="menu" data-pjid="'+p.id+'" data-pjval="main">'+PJ_ICO.back+'Back</button><div class="pj-menu__sep"></div><div class="pj-menu__hd">Priority</div>';
   [['high','High'],['normal','Normal'],['low','Low']].forEach(function(o){
    it+='<button class="pj-menu__i'+(p.prio===o[0]?' is-sel':'')+'" type="button" data-pjact="prio" data-pjid="'+p.id+'" data-pjval="'+o[0]+'">'+PJ_ICO.flag+o[1]+'<span class="pj-menu__sp"></span><span class="pj-menu__ck">'+PJ_ICO.check+'</span></button>';
   });
   return it;
  }
  if(mode==='mem'){
   var fam=FD.data.members||[];
   it='<button class="pj-menu__i" type="button" data-pjact="menu" data-pjid="'+p.id+'" data-pjval="main">'+PJ_ICO.back+'Back</button>'
     + '<div class="pj-menu__sep"></div><div class="pj-menu__hd">Assign to</div>';
   if(!fam.length) return it+'<div class="pj-menu__none">No family members yet \u2014 add them in Family.</div>';
   var cur=(Array.isArray(p.members)?p.members:[]);
   fam.forEach(function(m){
    var on=cur.indexOf(m.name)>-1;
    it+='<button class="pj-menu__i'+(on?' is-sel':'')+'" type="button" data-pjact="mem" data-pjid="'+p.id+'" data-pjval="'+esc(m.name)+'">'
     + '<span class="pj-menu__av">'+avatarHTML(m,'pj-av')+'</span>'+esc(m.name)
     + '<span class="pj-menu__sp"></span><span class="pj-menu__ck">'+PJ_ICO.check+'</span></button>';
   });
   return it;
  }
  if(mode==='cat'){
   it='<button class="pj-menu__i" type="button" data-pjact="menu" data-pjid="'+p.id+'" data-pjval="main">'+PJ_ICO.back+'Back</button><div class="pj-menu__sep"></div><div class="pj-menu__hd">Move to category</div>';
   PJ_CATS.forEach(function(c){
    it+='<button class="pj-menu__i'+(pjCat(p)===c?' is-sel':'')+'" type="button" data-pjact="cat" data-pjid="'+p.id+'" data-pjval="'+c+'">'+PJ_ICO[c]+pjLab(c)+'<span class="pj-menu__sp"></span><span class="pj-menu__ck">'+PJ_ICO.check+'</span></button>';
   });
   return it;
  }
  var inf=pjInfo(p);
  it+='<button class="pj-menu__i" type="button" data-pjact="pin" data-pjid="'+p.id+'">'+PJ_ICO.pin+(p.pinned?'Unpin from focus':'Pin to focus')+'</button>';
  it+='<button class="pj-menu__i" type="button" data-pjact="menu" data-pjid="'+p.id+'" data-pjval="mem">'+PJ_ICO.userplus+'Assign members<span class="pj-menu__sp"></span>'+PJ_ICO.arrow+'</button>';
  it+='<button class="pj-menu__i" type="button" data-pjact="rename" data-pjid="'+p.id+'">'+J_ICO.pen+'Rename &amp; edit</button>';
  if(!pjIsSub(p)) it+='<button class="pj-menu__i" type="button" data-pjact="addphase" data-pjid="'+p.id+'">'+PL_ICO.plus+'Add a phase</button>';
  it+='<button class="pj-menu__i" type="button" data-pjact="dup" data-pjid="'+p.id+'">'+PJ_ICO.copy+'Duplicate</button>';
  it+='<div class="pj-menu__sep"></div>';
  it+='<button class="pj-menu__i" type="button" data-pjact="menu" data-pjid="'+p.id+'" data-pjval="prio">'+PJ_ICO.bolt+'Change priority<span class="pj-menu__sp"></span>'+PJ_ICO.arrow+'</button>';
  it+='<button class="pj-menu__i" type="button" data-pjact="menu" data-pjid="'+p.id+'" data-pjval="cat">'+PJ_ICO.move+'Move category<span class="pj-menu__sp"></span>'+PJ_ICO.arrow+'</button>';
  it+='<button class="pj-menu__i" type="button" data-pjact="done" data-pjid="'+p.id+'">'+PJ_ICO.check+(p.status==='completed'?'Reopen project':'Mark complete')+'</button>';
  it+='<div class="pj-menu__sep"></div>';
  it+='<button class="pj-menu__i" type="button" data-pjact="arch" data-pjid="'+p.id+'">'+PJ_ICO.box+(p.status==='archived'?'Restore from archive':'Archive')+'</button>';
  it+='<button class="pj-menu__i is-danger" type="button" data-pjact="del" data-pjid="'+p.id+'">'+PJ_ICO.trash+'Delete</button>';
  return it;
 }
 function pjSheetMode(){ return window.innerWidth<=720; }
 function pjPlaceMenu(m,anchor){
  if(!m) return;
  if(pjSheetMode()){ m.style.left=''; m.style.top=''; m.style.minWidth=''; return; }
  if(!anchor) return;
  var r=anchor.getBoundingClientRect();
  var left=Math.min(r.right-210, window.innerWidth-222); if(left<12) left=12;
  m.style.left=left+'px';
  var top=r.bottom+8, h=m.offsetHeight;
  if(top+h>window.innerHeight-10) top=Math.max(10,r.top-h-8);
  m.style.top=top+'px';
 }
 function pjSheetScrim(on){
  var sc=document.getElementById('pjSheetScrim');
  if(on){
   if(sc) return;
   sc=document.createElement('div');
   sc.className='pj-sheetscrim'; sc.id='pjSheetScrim';
   sc.setAttribute('data-pjmenuclose','1');
   document.body.appendChild(sc);
   setTimeout(function(){ sc.classList.add('is-open'); },10);
  } else if(sc){
   sc.id=''; sc.classList.remove('is-open');
   setTimeout(function(){ if(sc.parentNode) sc.parentNode.removeChild(sc); },220);
  }
 }
 function pjOpenMenu(id,anchor,mode){
  var p=FD.getProject(id); if(!p) return;
  mode=mode||'main';
  var cur=document.getElementById('pjCtx');
  /* same project: swap the panel in place instead of tearing it down */
  if(cur && cur.getAttribute('data-pjanchor')===id){
   cur.classList.add('is-swap');
   setTimeout(function(){
    var c2=document.getElementById('pjCtx'); if(!c2) return;
    c2.innerHTML=pjMenuHTML(p,mode);
    pjPlaceMenu(c2,anchor);
    c2.classList.remove('is-swap');
   },130);
   return;
  }
  pjCloseMenu();
  var m=document.createElement('div');
  m.className='pj-menu'+(pjSheetMode()?' pj-menu--sheet':''); m.id='pjCtx';
  m.style.position='fixed'; m.style.zIndex='210';
  if(!pjSheetMode()) m.style.minWidth='210px';
  if(pjSheetMode()) pjSheetScrim(true);
  m.innerHTML=pjMenuHTML(p,mode);
  m.setAttribute('data-pjanchor',id);
  document.body.appendChild(m);
  pjPlaceMenu(m,anchor);
  if(window.requestAnimationFrame){
   requestAnimationFrame(function(){ requestAnimationFrame(function(){ m.classList.add('is-open'); }); });
  } else { setTimeout(function(){ m.classList.add('is-open'); },16); }
 }
 function pjAction(act,id,val){
  var p=FD.getProject(id); if(!p) return;
  if(act==='menu'){
   var a=document.querySelector('[data-pjmenu="'+id+'"]')||document.querySelector('[data-pjassign="'+id+'"]');
   if(a) pjOpenMenu(id,a,val==='main'?'main':val);
   return;
  }
  if(act==='mem'){
   if(!Array.isArray(p.members)) p.members=[];
   var mi=p.members.indexOf(val);
   if(mi>-1) p.members.splice(mi,1); else p.members.push(val);
   FD.save();
   flash(mi>-1?(val+' removed'):(val+' assigned'));
   renderPlanProjects();
   if($('#plOverview')) renderPlanOverview();
   if(pjDrawerId===id) pjDrawerFill();
   setTimeout(function(){
    var an=document.querySelector('[data-pjassign="'+id+'"]')||document.querySelector('[data-pjmenu="'+id+'"]');
    if(an) pjOpenMenu(id,an,'mem');
   },12);
   return;
  }
  if(act==='pin'){
   if(p.pinned){ p.pinned=false; FD.save(); flash('Unpinned'); }
   else { FD.data.planning.projects.forEach(function(x){ x.pinned=false; }); p.pinned=true; if(p.status!=='active') p.status='active'; FD.save(); flash('Pinned to Current focus'); }
  }
  else if(act==='rename'){ pjCloseMenu(); openModal('editProject',{projectId:id}); return; }
  else if(act==='addphase'){ pjCloseMenu(); openModal('addPhase',{parentId:id}); return; }
  else if(act==='dup'){
   FD.addProject({name:(p.name||'Project')+' (copy)',note:p.note||'',cat:pjCat(p),prio:p.prio||'normal',status:'active',pinned:false,order:(p.order||0)+1});
   flash('Project duplicated');
  }
  else if(act==='prio'){ p.prio=val; FD.save(); flash('Priority \u2192 '+pjLab(val)); }
  else if(act==='cat'){ p.cat=val; FD.save(); flash('Moved to '+pjLab(val)); }
  else if(act==='done'){
   p.status=(p.status==='completed')?'active':'completed';
   if(p.status==='completed') p.pinned=false;
   FD.save(); flash(p.status==='completed'?'Marked complete \ud83c\udf89':'Project reopened');
  }
  else if(act==='arch'){
   p.status=(p.status==='archived')?'active':'archived';
   if(p.status==='archived') p.pinned=false;
   FD.save(); flash(p.status==='archived'?'Archived':'Restored');
  }
  else if(act==='del'){
   pjCloseMenu();
   var _kids=pjChildren(id);
   var _msg=_kids.length
    ? ('Delete \u201c'+(p.name||'this project')+'\u201d? Its '+_kids.length+' phase'+(_kids.length>1?'s':'')+' will become projects of their own, and its tasks will stay.')
    : ('Delete \u201c'+(p.name||'this project')+'\u201d? Its tasks will stay, just without the project label.');
   if(!window.confirm(_msg)) return;
   _kids.forEach(function(k){ k.parentId=''; });
   FD.removeProject(id);
   if(pjDrawerId===id) pjCloseDrawer();
   flash('Project deleted');
  }
  pjCloseMenu();
  renderPlanProjects();
  if($('#plTasks')) renderPlanTasks();
  if($('#plOverview')) renderPlanOverview();
 }

 /* ---------- detail drawer ---------- */
  /* ================= LONG PRESS =================
     Hold a card or a row to reach its actions. The hard part is not the timer —
     it is making sure a scroll never counts as a press, and that the tap which
     follows the release does not also fire.                                     */
  var LP = {
    ms: 480,          /* how long is a "hold" */
    slop: 12,         /* how far a finger may drift before it counts as a scroll */
    timer: null, x: 0, y: 0, el: null, fired: false, armed: false
  };

  function lpBuzz(){
    try{ if(navigator.vibrate) navigator.vibrate(14); }catch(e){}
  }

  /* what did the user press, and what should holding it do? */
  function lpTargetOf(node){
    if(!node || !node.closest) return null;
    /* innermost things first, so a subtask never resolves to its task */
    var sb = node.closest('[data-tsub]');                    /* a subtask */
    if(sb) return {kind:'sub', id:sb.getAttribute('data-tsub'), el:sb};
    var row = node.closest('.hmrow');                        /* a task row */
    if(row){
      var t = row.querySelector('[data-pltopen]');
      if(t) return {kind:'task', id:t.getAttribute('data-pltopen'), el:row};
    }
    var wt = node.closest('.plw-t');                         /* a task in the week calendar */
    if(wt){
      var t2 = wt.querySelector('[data-pltopen]');
      if(t2) return {kind:'task', id:t2.getAttribute('data-pltopen'), el:wt};
    }
    var tt = node.closest('[data-pltopen]');                 /* any bare task title */
    if(tt) return {kind:'task', id:tt.getAttribute('data-pltopen'), el:tt};
    var ph = node.closest('.pj-phr[data-pjcard]');           /* a phase row in the drawer */
    if(ph) return {kind:'project', id:ph.getAttribute('data-pjcard'), el:ph};
    var card = node.closest('[data-pjcard]');                /* a project card */
    if(card) return {kind:'project', id:card.getAttribute('data-pjcard'), el:card};
    return null;
  }

  function lpCancel(){
    if(LP.timer){ clearTimeout(LP.timer); LP.timer=null; }
    if(LP.el) LP.el.classList.remove('is-holding');
    LP.el=null; LP.armed=false;
  }

  function lpFire(target){
    LP.fired = true;
    lpBuzz();
    if(LP.el) LP.el.classList.remove('is-holding');
    if(target.kind==='project') pjOpenMenu(target.id, target.el, 'main');
    else if(target.kind==='sub') lpSubMenu(target.id, target.el);
    else lpTaskMenu(target.id, target.el);
  }

  function lpStart(e){
    if(e.touches && e.touches.length>1) return;             /* pinch, not a press */
    if(e.button!==undefined && e.button!==0) return;        /* right-click has its own menu */
    var pt = e.touches ? e.touches[0] : e;
    var t = lpTargetOf(e.target);
    if(!t) return;
    /* a control still does its own job on a quick tap; only a long hold opens a menu */
    if(e.target.closest && e.target.closest('input,textarea,select')) return;
    LP.x=pt.clientX; LP.y=pt.clientY; LP.el=t.el; LP.fired=false; LP.armed=true;
    t.el.classList.add('is-holding');
    LP.timer = setTimeout(function(){ LP.timer=null; if(LP.armed) lpFire(t); }, LP.ms);
  }

  function lpMove(e){
    if(!LP.armed) return;
    var pt = e.touches ? e.touches[0] : e;
    if(Math.abs(pt.clientX-LP.x) > LP.slop || Math.abs(pt.clientY-LP.y) > LP.slop) lpCancel();
  }

  function lpEnd(){ lpCancel(); }

  document.addEventListener('touchstart', lpStart, {passive:true});
  document.addEventListener('touchmove',  lpMove,  {passive:true});
  document.addEventListener('touchend',   lpEnd,   {passive:true});
  document.addEventListener('touchcancel',lpEnd,   {passive:true});
  document.addEventListener('mousedown',  lpStart);
  document.addEventListener('mousemove',  lpMove);
  document.addEventListener('mouseup',    lpEnd);
  window.addEventListener('scroll', lpCancel, true);
  /* swallow the tap that follows a hold, so nothing opens behind the menu */
  document.addEventListener('click', function(e){
    if(LP.fired){ LP.fired=false; e.stopPropagation(); e.preventDefault(); }
  }, true);
  /* long-press on desktop should not also raise the browser menu */
  document.addEventListener('contextmenu', function(e){
    var t=lpTargetOf(e.target);
    if(!t) return;
    e.preventDefault();
    lpCancel();
    LP.fired=true;
    if(t.kind==='project') pjOpenMenu(t.id, t.el, 'main');
    else if(t.kind==='sub') lpSubMenu(t.id, t.el);
    else lpTaskMenu(t.id, t.el);
  });

  /* ---- the menu a held subtask gets ---- */
  function lpSubMenu(ref, anchor){
    var pr=String(ref||'').split('::'), tk=FD.getTask(pr[0]), ix=+pr[1];
    if(!tk || !tk.subs || !tk.subs[ix]) return;
    var sb=tk.subs[ix];
    pjCloseMenu();
    var m=document.createElement('div');
    m.className='pj-menu'; m.id='pjCtx';
    m.style.position='fixed'; m.style.zIndex='210'; m.style.minWidth='200px';
    m.innerHTML =
        '<div class="pj-menu__hd">'+esc(String(sb.t||'Subtask').slice(0,32))+'</div>'
      + '<button class="pj-menu__i" type="button" data-tsub="'+esc(ref)+'">'+PJ_ICO.check+(sb.done?'Mark not done':'Mark done')+'</button>'
      + '<button class="pj-menu__i" type="button" data-pltedit="'+tk.id+'">'+J_ICO.pen+'Edit the task</button>'
      + '<div class="pj-menu__sep"></div>'
      + '<button class="pj-menu__i is-danger" type="button" data-subdel="'+esc(ref)+'">'+PJ_ICO.trash+'Delete subtask</button>';
    m.setAttribute('data-pjanchor','sub:'+ref);
    document.body.appendChild(m);
    pjPlaceMenu(m, anchor);
    if(window.requestAnimationFrame){
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ m.classList.add('is-open'); }); });
    } else { setTimeout(function(){ m.classList.add('is-open'); },16); }
  }
  /* ---- the small menu a held task gets ---- */
  function lpTaskMenu(id, anchor){
    var t=null;
    ((FD.data.planning&&FD.data.planning.tasks)||[]).some(function(x){ if(x.id===id){ t=x; return true; } return false; });
    if(!t) return;
    pjCloseMenu();
    var m=document.createElement('div');
    m.className='pj-menu'; m.id='pjCtx';
    m.style.position='fixed'; m.style.zIndex='210'; m.style.minWidth='210px';
    m.innerHTML =
        '<div class="pj-menu__hd">'+esc((t.title||'Task').slice(0,34))+'</div>'
      + '<button class="pj-menu__i" type="button" data-pltdone="'+t.id+'">'+PJ_ICO.check+(t.done?'Mark not done':'Mark done')+'</button>'
      + '<button class="pj-menu__i" type="button" data-pltedit="'+t.id+'">'+J_ICO.pen+'Edit</button>'
      + '<div class="pj-menu__sep"></div>'
      + '<button class="pj-menu__i is-danger" type="button" data-pltdel="'+t.id+'">'+PJ_ICO.trash+'Delete</button>';
    m.setAttribute('data-pjanchor','task:'+t.id);
    document.body.appendChild(m);
    pjPlaceMenu(m, anchor);
    if(window.requestAnimationFrame){
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ m.classList.add('is-open'); }); });
    } else { setTimeout(function(){ m.classList.add('is-open'); },16); }
  }
 function pjCloseDrawer(){
  if(pjDrawerId) unlockScroll('drawer');
  pjDrawerId='';
  var s=document.getElementById('pjScrim'), d=document.getElementById('pjDrawer');
  if(s) s.classList.remove('is-open');
  if(d) d.classList.remove('is-open');
  setTimeout(function(){
   var s2=document.getElementById('pjScrim'), d2=document.getElementById('pjDrawer');
   if(s2&&s2.parentNode) s2.parentNode.removeChild(s2);
   if(d2&&d2.parentNode) d2.parentNode.removeChild(d2);
  },320);
 }
 function pjOpenDrawer(id){
  var p=FD.getProject(id); if(!p) return;
  pjCloseMenu();
  var s0=document.getElementById('pjScrim'); if(s0&&s0.parentNode) s0.parentNode.removeChild(s0);
  var d0=document.getElementById('pjDrawer'); if(d0&&d0.parentNode) d0.parentNode.removeChild(d0);
  pjDrawerId=id;
  var s=document.createElement('div'); s.className='pj-scrim'; s.id='pjScrim'; s.setAttribute('data-pjclose','1');
  var d=document.createElement('aside'); d.className='pj-drawer'; d.id='pjDrawer'; d.setAttribute('role','dialog');
  document.body.appendChild(s); document.body.appendChild(d);
  pjDrawerFill();
  lockScroll('drawer');
  setTimeout(function(){ s.classList.add('is-open'); d.classList.add('is-open'); },12);
 }
 function pjDrawerFill(){
  var d=document.getElementById('pjDrawer'); if(!d) return;
  var p=FD.getProject(pjDrawerId); if(!p){ pjCloseDrawer(); return; }
  var c=pjCat(p), inf=pjInfo(p), du=pjDue(inf.due);
  d.style.setProperty('--cc',pjCC(c));
  var doneT=inf.all.filter(function(t){ return t.done; });
  var meta='<div class="pj-fmeta" style="gap:14px">';
  if(du) meta+='<span class="pj-fm'+(du.over?' is-over':'')+'">'+PJ_ICO.cal+du.txt+'</span>';
  var _g=pjGoal(p);
  if(_g) meta+='<span class="pj-fm">'+PJ_ICO.bolt+esc(_g.title||'')+'</span>';
  if(p.prio==='high') meta+='<span class="pj-prio pj-prio--hi">'+PJ_ICO.flag+'High priority</span>';
  if(p.prio==='low') meta+='<span class="pj-prio pj-prio--lo">'+PJ_ICO.low+'Low priority</span>';
  meta+='<button class="pj-fm pj-avbtn" type="button" data-pjassign="'+p.id+'">'+PJ_ICO.users
   + (inf.members.length?pjAvatars(inf.members):'<span class="pj-assignlbl">Assign members</span>')+'</button>';
  meta+='</div>';
  d.innerHTML='<div class="pj-dr__h"><button class="pj-dr__x" type="button" data-pjclose="1" aria-label="Close">'+PL_ICO.x+'</button>'
   + '<span class="pj-badge">'+PJ_ICO[c]+pjLab(c)+(p.pinned?' \u00b7 Pinned':'')+'</span>'
   + '<div class="pj-dr__n">'+esc(p.name||'Project')+'</div>'
   + (p.note?'<div class="pj-dr__note">'+esc(p.note)+'</div>':'')
   + '<div class="pj-dr__prog"><div class="pj-bar"><span style="width:'+inf.pct+'%"></span></div><span class="pj-dr__pct">'+inf.st.done+'/'+inf.st.total+' \u00b7 '+inf.pct+'%</span></div>'
   + meta+'</div>'
   + '<div class="pj-dr__acts">'
   + '<button class="pj-dr__b pj-dr__b--pri" type="button" data-pltadd="'+p.id+'">'+PL_ICO.plus+'Add task</button>'
   + (inf.isSub?'':'<button class="pj-dr__b" type="button" data-pjact="addphase" data-pjid="'+p.id+'">'+PL_ICO.plus+'Add phase</button>')
   + '<button class="pj-dr__b" type="button" data-pjact="rename" data-pjid="'+p.id+'">'+J_ICO.pen+'Edit</button>'
   + '<button class="pj-dr__b" type="button" data-pjact="pin" data-pjid="'+p.id+'">'+PJ_ICO.pin+(p.pinned?'Unpin':'Pin')+'</button>'
   + '<button class="pj-dr__b" type="button" data-pjact="arch" data-pjid="'+p.id+'">'+PJ_ICO.box+(p.status==='archived'?'Restore':'Archive')+'</button>'
   + '<button class="pj-dr__b pj-dr__b--del" type="button" data-pjact="del" data-pjid="'+p.id+'">'+PJ_ICO.trash+'Delete</button>'
   + '</div><div class="pj-dr__body">'
   + (inf.kids.length?('<div class="pj-dr__sec">Phases \u00b7 '+inf.kids.length+'</div><div class="pj-phl">'
      + inf.kids.map(function(k){
         var ks=pjTreeStats(k.id), kp=ks.total?Math.round(ks.done/ks.total*100):0, kc=pjCat(k);
         return '<button class="pj-phr" type="button" style="--cc:'+pjCC(kc)+'" data-pjcard="'+k.id+'">'
          + '<span class="pj-phr__n">'+(kp>=100?PJ_ICO.check:'<span class="pj-phr__dot"></span>')+'</span>'
          + '<span class="pj-phr__m"><span class="pj-phr__t">'+esc(k.name||'Phase')+'</span>'
          + '<span class="pj-bar" style="margin:6px 0 0"><span style="width:'+kp+'%"></span></span></span>'
          + '<span class="pj-phr__c">'+ks.done+'/'+ks.total+'</span></button>';
        }).join('')
      + '</div>'):'')
   + (inf.isSub?'<div class="pj-dr__sec">Part of</div><button class="pj-phr" type="button" style="--cc:'+pjCC(pjCat(pjParent(p)||p))+'" data-pjcard="'+p.parentId+'">'
      + '<span class="pj-phr__n">'+PJ_ICO.up+'</span><span class="pj-phr__m"><span class="pj-phr__t">'+esc((pjParent(p)||{}).name||'')+'</span></span></button>':'')
   + '<div class="pj-dr__sec">Open tasks \u00b7 '+inf.open.length+'</div>'
   + (inf.open.length?'<div class="hmlist">'+inf.open.map(taskRowSlim).join('')+'</div>'
      :'<div class="docempty">'+(inf.st.total?'All tasks done, project complete! \ud83c\udf89':'No tasks yet \u2014 add the first one above.')+'</div>')
   + (doneT.length?'<div class="pj-dr__sec">Completed \u00b7 '+doneT.length+'</div><div class="hmlist">'+doneT.map(taskRowSlim).join('')+'</div>':'')
   + '</div>';
 }

 /* ---------- celebration ---------- */
 var pjCelebT=0;
 function pjCelebrate(){
  if(Date.now()-pjCelebT<8000) return; pjCelebT=Date.now();
  try{ if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; }catch(e){}
  var cols=['var(--m-planning)','var(--pjc-family)','var(--pjc-finance)','var(--ok)','var(--pjc-education)'];
  var w=document.createElement('div'); w.className='pj-cf';
  for(var i=0;i<60;i++){
   var s=document.createElement('span');
   s.style.left=(Math.random()*100)+'vw';
   s.style.background=cols[i%cols.length];
   s.style.animationDuration=(2.4+Math.random()*1.8)+'s';
   s.style.animationDelay=(Math.random()*.5)+'s';
   w.appendChild(s);
  }
  document.body.appendChild(w);
  setTimeout(function(){ if(w.parentNode) w.parentNode.removeChild(w); },4600);
 }
 document.addEventListener('keydown',function(e){
  if(e.key==='Escape'||e.keyCode===27){
   if(document.getElementById('pjCtx')){ pjCloseMenu(); }
   else if(pjDrawerId){ pjCloseDrawer(); }
  }
 });
 function pjCloseAllMenus(){
  var sm=document.getElementById('pjSortMenu');
  if(sm) sm.classList.remove('is-open');
  pjCloseMenu();
 }
 /* always-runs listener: early `return`s in the main click chain
    must never leave a dropdown stuck open */
 document.addEventListener('click',function(e){
  if(!e.target||!e.target.closest) return;
  if(e.target.closest('.pj-menu')) return;
  if(e.target.closest('[data-pjsortbtn]')) return;
  if(e.target.closest('[data-pjmenu]')) return;
  if(e.target.closest('[data-pjassign]')) return;
  pjCloseAllMenus();
 },true);
 window.addEventListener('scroll',function(){ pjCloseAllMenus(); },true);
 window.addEventListener('resize',function(){ pjCloseAllMenus(); });
 function plDayEvents(ds){
 return FD.data.events.filter(function(e){ return String(e.date||'').slice(0,10)===ds; }).sort(function(a,b){ return String(a.date).localeCompare(String(b.date)); });
 }
 function renderPlanWeek(){
  var el=$('#plWeek'); if(!el) return;
  var days=ckWeekDates(plWeekOff), today=todayStr();
  var tasks=FD.data.planning.tasks;
  var p0=days[0].split('-'), p6=days[6].split('-');
  var lab=(+p0[2])+' '+MON[+p0[1]-1]+' \u2013 '+(+p6[2])+' '+MON[+p6[1]-1]+' '+p6[0];
  var sub=(plWeekOff===0)?'This week':(plWeekOff===1?'Next week':(plWeekOff===-1?'Last week':(plWeekOff>0?('In '+plWeekOff+' weeks'):(Math.abs(plWeekOff)+' weeks ago'))));

  var head='<div class="plw-nav">'
   + '<button class="plw-btn" type="button" data-plweek="prev" aria-label="Previous week"><svg class="ico" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button>'
   + '<div class="plw-lab"><span class="plw-lab__t">'+lab+'</span><span class="plw-lab__s">'+sub+'</span>'
   + (plWeekOff!==0?'<button class="plw-today" type="button" data-plweek="reset">'+PJ_ICO.cal+'Jump to today</button>':'')
   + '</div>'
   + '<button class="plw-btn" type="button" data-plweek="next" aria-label="Next week"><svg class="ico" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button></div>';

  /* week totals */
  var wTasks=tasks.filter(function(t){ return t.due&&days.indexOf(t.due)>-1; });
  var wDone=wTasks.filter(function(t){ return t.done; });
  var wEv=0; days.forEach(function(ds){ wEv+=plDayEvents(ds).length; });
  var strip='<div class="plw-strip">'
   + '<div class="plw-si" style="--cc:var(--m-planning)"><span class="plw-si__n">'+wTasks.length+'</span><span class="plw-si__l">Tasks this week</span></div>'
   + '<div class="plw-si" style="--cc:var(--ok)"><span class="plw-si__n">'+wDone.length+'</span><span class="plw-si__l">Completed</span></div>'
   + '<div class="plw-si" style="--cc:var(--pjc-travel)"><span class="plw-si__n">'+wEv+'</span><span class="plw-si__l">Events</span></div></div>';

  var grid='<div class="plw-grid">'+days.map(function(ds){
   var isT=(ds===today), isPast=(ds<today);
   var q=ds.split('-'), dnum=+q[2];
   var wd=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(+q[0],+q[1]-1,+q[2]).getDay()];

   var evs=plDayEvents(ds).map(function(e){
    var tm=e.allDay?'All day':(String(e.date).indexOf('T')>0?String(e.date).slice(11,16):'');
    return '<button class="plw-ev" type="button" data-evopen="'+e.id+'">'
     + '<span class="plw-ev__d"></span><span class="plw-ev__t">'+esc(e.title||'Event')+'</span>'
     + (tm?'<span class="plw-ev__m">'+tm+'</span>':'')+'</button>';
   }).join('');

   var dayT=tasks.filter(function(t){ return t.due===ds; }).sort(plSort);
   var shown=dayT.slice(0,4);
   var rows=shown.map(function(t){
    return '<div class="plw-t'+(t.done?' is-done':'')+((!t.done&&isPast)?' is-over':'')+'">'
     + '<button class="plw-chk" type="button" data-pltdone="'+t.id+'" aria-label="Toggle done"><svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>'
     + '<button class="plw-t__t" type="button" data-pltopen="'+t.id+'">'+esc(t.title||'Task')+'</button></div>';
   }).join('');
   if(dayT.length>shown.length) rows+='<button class="plw-more" type="button" data-sub="planning-tasks">+'+(dayT.length-shown.length)+' more</button>';

   var cnt=dayT.length+plDayEvents(ds).length;
   var body=(evs||rows)?(evs+rows):'<div class="plw-none">Nothing planned</div>';

   return '<section class="plw-day'+(isT?' is-today':'')+((isPast&&!isT)?' is-past':'')+'">'
    + '<div class="plw-day__h"><span class="plw-wd">'+wd+'</span><span class="plw-dnum">'+dnum+'</span>'
    + '<span class="plw-day__sp"></span>'
    + (isT?'<span class="plw-now">Today</span>':(cnt?'<span class="plw-cnt">'+cnt+'</span>':''))
    + '</div><div class="plw-body">'+body+'</div>'
    + '<button class="plw-add" type="button" data-pldayadd="'+ds+'"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add</button></section>';
  }).join('')+'</div>';

  el.innerHTML=head+strip+grid;
 }

 function ploGreet(){
  var h=new Date().getHours();
  if(h<5) return 'Late night';
  if(h<12) return 'Good morning';
  if(h<17) return 'Good afternoon';
  if(h<21) return 'Good evening';
  return 'Good night';
 }
 function renderPlanOverview(){
  var el=$('#plOverview'); if(!el) return;
  var P=FD.data.planning, tasks=P.tasks, projects=P.projects;
  var add='<div class="pl-top"><button class="btn btn--primary" data-modal="task">'+PL_ICO.plus+'Add task</button>'
   + '<button class="btn btn--soft" data-modal="project">'+PL_ICO.folder+'Add project</button></div>';
  if(!tasks.length&&!projects.length){
   el.innerHTML=add+hEmpty(PL_ICO.task,'The family\u2019s command centre',
    'Tasks with owners and priorities, projects that track themselves, and a week view that weaves in your calendar.','');
   return;
  }
  var td=todayStr();
  var open=tasks.filter(function(t){ return !t.done; });
  var over=open.filter(function(t){ return t.due&&t.due<td; });
  var dueToday=open.filter(function(t){ return t.due===td; });
  var activeP=projects.filter(function(p){ return p.status!=='archived'; });

  /* today's momentum */
  var scope=tasks.filter(function(t){ return t.due&&t.due<=td; });
  var pct;
  if(scope.length) pct=Math.round(scope.filter(function(t){return t.done;}).length/scope.length*100);
  else pct=tasks.length?Math.round(tasks.filter(function(t){return t.done;}).length/tasks.length*100):0;
  var circ=2*Math.PI*54, off=circ*(1-pct/100);

  var line;
  if(over.length) line='<b>'+over.length+' running late</b> \u00b7 '+dueToday.length+' due today';
  else if(dueToday.length) line=dueToday.length+' task'+(dueToday.length>1?'s':'')+' due today \u00b7 nothing overdue';
  else line='Nothing due today \u00b7 '+open.length+' open task'+(open.length===1?'':'s');

  var deck='<div class="plo-deck pl-rise">'
   + '<div class="pj-ring"><svg width="122" height="122" viewBox="0 0 122 122">'
   + '<circle class="pj-ring__tr" cx="61" cy="61" r="54" stroke-width="11" style="stroke:color-mix(in srgb,var(--m-planning) 16%,var(--border))"/>'
   + '<circle class="pj-ring__fill" cx="61" cy="61" r="54" stroke-width="11" style="stroke:var(--m-planning)" stroke-dasharray="'+circ.toFixed(1)+'" stroke-dashoffset="'+circ.toFixed(1)+'" data-off="'+off.toFixed(1)+'"/></svg>'
   + '<div class="pj-ring__c"><div class="pj-ring__p">'+pct+'%</div><div class="pj-ring__l">Today</div></div></div>'
   + '<div><div class="plo-hi">'+ploGreet()+'</div><div class="plo-sub">'+line+'</div>'
   + '<div class="plo-stats">'
   + '<button class="plo-st" type="button" data-sub="planning-tasks"><span class="plo-st__n">'+dueToday.length+'</span><span class="plo-st__l">Due today</span></button>'
   + '<button class="plo-st'+(over.length?' plo-st--alert':'')+'" type="button" data-sub="planning-tasks"><span class="plo-st__n">'+over.length+'</span><span class="plo-st__l">Overdue</span></button>'
   + '<button class="plo-st" type="button" data-sub="planning-tasks"><span class="plo-st__n">'+open.length+'</span><span class="plo-st__l">Open tasks</span></button>'
   + '<button class="plo-st" type="button" data-sub="planning-projects"><span class="plo-st__n">'+activeP.length+'</span><span class="plo-st__l">Projects</span></button>'
   + '</div></div></div>';

  /* today's focus */
  var focus=over.concat(dueToday).sort(plSort).slice(0,6);
  var focusCard='<div class="plo-card pl-rise" style="animation-delay:.06s"><div class="plo-card__h">'
   + '<span class="plo-card__ic" style="--cc:var(--m-planning)">'+PJ_ICO.check+'</span>'
   + '<span class="plo-card__t">Today\u2019s focus</span><span class="plo-card__sp"></span>'
   + '<button class="plo-link" type="button" data-sub="planning-tasks">All tasks'+PJ_ICO.arrow+'</button></div>'
   + (focus.length?'<div class="plt-list" style="margin-bottom:0">'+focus.map(taskRowSlim).join('')+'</div>'
      :'<div class="plo-quiet">Nothing needs you today \u2014 enjoy it.</div>')+'</div>';

  /* coming up */
  var evs=FD.data.events.filter(function(e){ return String(e.date||'').slice(0,10)>=td; })
   .sort(function(a,b){ return String(a.date).localeCompare(String(b.date)); }).slice(0,3);
  var evCard='';
  if(evs.length){
   evCard='<div class="plo-card pl-rise" style="animation-delay:.12s"><div class="plo-card__h">'
    + '<span class="plo-card__ic" style="--cc:var(--pjc-travel)">'+PJ_ICO.cal+'</span>'
    + '<span class="plo-card__t">Coming up</span><span class="plo-card__sp"></span>'
    + '<button class="plo-link" type="button" data-goto="family:calendar">Calendar'+PJ_ICO.arrow+'</button></div>'
    + evs.map(function(e){
       var ds=String(e.date||'').slice(0,10);
       return '<button class="plo-row" type="button" style="--cc:var(--pjc-travel)" data-evopen="'+e.id+'">'
        + '<span class="plo-row__ic">'+PJ_ICO.cal+'</span><span class="plo-row__m">'
        + '<span class="plo-row__t">'+esc(e.title||'Event')+'</span>'
        + '<span class="plo-row__s">'+(ds===td?'Today':jDateLabel(ds))+'</span></span>'
        + '<svg class="ico plo-row__ch" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>';
      }).join('')+'</div>';
  }

  /* projects */
  var topP=activeP.map(function(p){ var st=projectStats(p.id); return {p:p,st:st,openN:st.total-st.done}; })
   .sort(function(a,b){ return b.openN-a.openN; }).slice(0,3);
  var pCard='';
  if(topP.length){
   pCard='<div class="plo-card pl-rise" style="animation-delay:.18s"><div class="plo-card__h">'
    + '<span class="plo-card__ic" style="--cc:var(--pjc-work)">'+PL_ICO.folder+'</span>'
    + '<span class="plo-card__t">Projects</span><span class="plo-card__sp"></span>'
    + '<button class="plo-link" type="button" data-sub="planning-projects">All projects'+PJ_ICO.arrow+'</button></div>'
    + topP.map(function(o){
       var c=pjCat(o.p), per=o.st.total?Math.round(o.st.done/o.st.total*100):0;
       return '<button class="plo-row" type="button" style="--cc:'+pjCC(c)+'" data-plopen="'+o.p.id+'">'
        + '<span class="plo-row__ic">'+(PJ_ICO[c]||PL_ICO.folder)+'</span><span class="plo-row__m">'
        + '<span class="plo-row__t">'+esc(o.p.name||'Project')+'</span>'
        + '<span class="plo-mini"><span style="width:'+per+'%"></span></span></span>'
        + '<span class="plo-pct">'+o.st.done+'/'+o.st.total+'</span></button>';
      }).join('')+'</div>';
  }

  el.innerHTML=add+deck+focusCard+evCard+pCard;
  var fr=el.querySelector('.pj-ring__fill');
  if(fr) setTimeout(function(){ try{ fr.style.strokeDashoffset=fr.getAttribute('data-off'); }catch(e){} },70);
 }

 /* ===================== NUTRITION ===================== */
 var NT_ICO={
 apple:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 8c-1.1-2.1-3.6-2.7-5.4-1.4C4.5 8.1 3.9 11 4.9 13.6c1 2.6 3 5.1 4.9 5.1.9 0 1.1-.5 2.2-.5s1.3.5 2.2.5c1.9 0 3.9-2.5 4.9-5.1 1-2.6.4-5.5-1.7-7C15.6 5.3 13.1 5.9 12 8Z"/><path d="M12 8c0-2 1-3.4 2.6-4"/></svg>',
 drop:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 3.5S6 10 6 14a6 6 0 0 0 12 0c0-4-6-10.5-6-10.5Z"/></svg>',
 leaf:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 19c0-8 5-13 14-14-.5 9-5.5 14-12 14"/><path d="M5 19c3-3.2 6-5.2 10-6.2"/></svg>',
 check:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
 plus:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
 minus:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
 x:'<svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>'
 };
 var NT_Q=['Healthy','Balanced','Treat'];
 var NT_QC={Healthy:'#4F9A78',Balanced:'#C2A24A',Treat:'#D9803D'};
 var ntFilter='all';
 function ntWaterToday(name){ var t=todayStr(), g=0; FD.data.nutrition.water.forEach(function(w){ if(w.date===t&&w.member===name) g=w.glasses; }); return g; }
 function ntWeekWater(name){ var wk=ckWeekDates(0), set={}; wk.forEach(function(d){set[d]=1;}); var g=0; FD.data.nutrition.water.forEach(function(w){ if(set[w.date]&&w.member===name) g+=w.glasses; }); return g; }
 function ntTarget(name){ return Math.max(1,parseInt(FD.data.nutrition.targets[name],10)||8); }
 function habitStreak(h){ return jStreak(h.dates.map(function(d){return {date:d};})); }
 function nMealRow(m){
 var qc=NT_QC[m.quality]||'';
 var sub=[m.meal||'Meal',jDateLabel(m.date)||'No date']; if(m.member) sub.push(esc(m.member));
 return '<div class="hmrow"><span class="lnskico lnskico--nt">'+NT_ICO.apple+'</span><div class="hmrow__main"><div class="hmrow__t">'+esc(m.what||'Something tasty')+(m.quality?' <span class="ntq" style="--qc:'+qc+'">'+m.quality+'</span>':'')+'</div><div class="hmrow__s">'+sub.join(' \u00b7 ')+'</div>'+(m.note?'<div class="hmrow__note">'+esc(m.note).replace(/\n/g,'<br>')+'</div>':'')+'</div><button class="ckmeal__b" data-ntedit="'+m.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-ntdel="'+m.id+'" aria-label="Delete">'+NT_ICO.x+'</button></div>';
 }
 function renderNutriMeals(){
 var el=$('#ntMeals'); if(!el) return;
 var arr=FD.data.nutrition.meals;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="nmeal">'+NT_ICO.plus+'Log a meal</button></div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(NT_ICO.apple,'The food diary is empty','No calories, no judgement, just note what was eaten and how it felt: Healthy, Balanced, or a Treat.',''); return; }
 var list=arr.slice().filter(function(x){return lnMatch(x,ntFilter);}).sort(function(a,b){ var c=String(b.date).localeCompare(String(a.date)); return c||(b.createdAt-a.createdAt); });
 el.innerHTML=add+lnFilterChips(arr,ntFilter,'data-ntfilter')+(list.length?'<div class="hmlist">'+list.map(nMealRow).join('')+'</div>':'<div class="docempty">Nothing here for this filter.</div>');
 }
 function ntMemberWaterRow(m){
 var g=ntWaterToday(m.name), tg=ntTarget(m.name), wkw=ntWeekWater(m.name);
 var dots=''; var show=Math.max(tg,g); for(var i=1;i<=tg;i++){ dots+='<span class="ntdot'+(i<=g?' is-on':'')+'"></span>'; }
 var extra=(g>tg)?'<span class="ntextra">+'+(g-tg)+'</span>':'';
 return '<div class="ntwrow"><span class="lnav">'+avatarHTML(m,'lnav__t')+'</span><div class="ntwrow__main"><div class="ntwrow__top"><span class="lnmrow__n">'+esc(m.name)+'</span><button class="ckmeal__b" data-ntwt="'+esc(m.name)+'" aria-label="Set target">'+J_ICO.pen+'</button></div><div class="ntdots">'+dots+extra+'</div><div class="lnmrow__s">'+g+' of '+tg+' today \u00b7 '+wkw+' this week</div></div><div class="ntbtns"><button class="ntbtn" data-ntw="'+esc(m.name)+'" data-d="-1" aria-label="Minus one glass">'+NT_ICO.minus+'</button><button class="ntbtn ntbtn--plus" data-ntw="'+esc(m.name)+'" data-d="1" aria-label="Add one glass">'+NT_ICO.plus+'</button></div></div>';
 }
 /* ===================== P4 CHART: family water, this week ===================== */
 function ntWeekChart(){
 var mems=FD.data.members; if(!mems.length) return '';
 var wk=ckWeekDates(0), t=todayStr();
 var perDay={}; wk.forEach(function(d){ perDay[d]=0; });
 FD.data.nutrition.water.forEach(function(w){ if(perDay[w.date]!=null) perDay[w.date]+=(+w.glasses||0); });
 var any=false; wk.forEach(function(d){ if(perDay[d]>0) any=true; });
 if(!any) return '';
 var target=0; mems.forEach(function(m){ target+=ntTarget(m.name); });
 var maxG=target||1; wk.forEach(function(d){ if(perDay[d]>maxG) maxG=perDay[d]; });
 var W=336,H=150,padL=8,padR=8,padT=16,padB=24,plotH=H-padT-padB,plotW=W-padL-padR;
 var n=wk.length||7, slot=plotW/n, barW=Math.min(26,Math.round(slot*0.52)), baseY=padT+plotH;
 var scale=maxG*1.12;
 var WD=['Su','Mo','Tu','We','Th','Fr','Sa'];
 var parts='';
 wk.forEach(function(d,i){
 var g=perDay[d], h=Math.max(2,Math.round((g/scale)*plotH)), x=padL+i*slot+(slot-barW)/2, y=baseY-h;
 var hit=(target>0&&g>=target), isT=(d===t);
 var p=d.split('-'); var wd=WD[new Date(+p[0],+p[1]-1,+p[2]).getDay()]||'';
 parts+='<rect x="'+x.toFixed(1)+'" y="'+y+'" width="'+barW+'" height="'+h+'" rx="6" fill="'+(hit?'var(--ok)':'var(--m-nutrition)')+'" opacity="'+(isT?'1':'.8')+'"/>';
 if(g>0) parts+='<text x="'+(x+barW/2).toFixed(1)+'" y="'+(y-5)+'" class="wch__v">'+g+'</text>';
 parts+='<text x="'+(x+barW/2).toFixed(1)+'" y="'+(H-7)+'" class="wch__l'+(isT?' wch__l--td':'')+'">'+wd+'</text>';
 });
 var tline='';
 if(target>0){ var tY=(baseY-(target/scale)*plotH).toFixed(1); tline='<line x1="'+padL+'" y1="'+tY+'" x2="'+(W-padR)+'" y2="'+tY+'" class="wch__t"/><text x="'+(W-padR)+'" y="'+(+tY-4)+'" text-anchor="end" class="wch__tl">goal '+target+'</text>'; }
 return '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">This week\u2019s water</h3><span class="wch__meta">family \u00b7 glasses/day</span></div>'
 +'<svg class="wch" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Family water this week"><line x1="'+padL+'" y1="'+baseY+'" x2="'+(W-padR)+'" y2="'+baseY+'" class="wch__b"/>'+tline+parts+'</svg></div>';
 }
 function renderNutriWater(){
 var el=$('#ntWater'); if(!el) return;
 var mems=FD.data.members;
 if(!mems.length){ el.innerHTML=hEmpty(NT_ICO.drop,'Add your people first','Water tracking is per person. Add family members and each gets their own glasses to tap.','<button class="btn btn--primary" data-modal="member" style="margin-top:4px">'+NT_ICO.plus+'Add member</button>'); return; }
 var total=0; mems.forEach(function(m){ total+=ntWaterToday(m.name); });
 var hero='<div class="jghero" style="background:linear-gradient(135deg,color-mix(in srgb,var(--m-nutrition) 12%,var(--surface)),var(--surface))"><span class="jghero__ic" style="background:color-mix(in srgb,var(--m-nutrition) 18%,var(--surface));color:var(--m-nutrition)">'+NT_ICO.drop+'</span><div><div class="jghero__n">'+total+'</div><div class="jghero__l">glasses today, across the family</div></div></div>';
 el.innerHTML=hero+ntWeekChart()+'<div class="hmlist">'+mems.map(ntMemberWaterRow).join('')+'</div>';
 }
 function habitCard(h){
 var t=todayStr(); var doneToday=h.dates.indexOf(t)>=0; var wk=ckWeekDates(0); var set={}; h.dates.forEach(function(d){set[d]=1;});
 var dots=wk.map(function(d){ return '<span class="ntdot ntdot--sm'+(set[d]?' is-on':'')+(d===t?' is-td':'')+'"></span>'; }).join('');
 var st=habitStreak(h);
 return '<div class="hmrow'+(doneToday?' nthab-done':'')+'"><button class="hmrow__chk hmrow__chk--nt" data-nthab="'+h.id+'" aria-label="Toggle today">'+NT_ICO.check+'</button><div class="hmrow__main"><div class="hmrow__t">'+esc(h.title||'Habit')+(h.member?' <span class="lnwho lnwho--nt">'+esc(h.member)+'</span>':'')+'</div><div class="ntwk">'+dots+(st>1?'<span class="ntstreak">'+st+' day streak</span>':'')+'</div></div><button class="ckmeal__b" data-nthedit="'+h.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-nthdel="'+h.id+'" aria-label="Delete">'+NT_ICO.x+'</button></div>';
 }
 function renderNutriHabits(){
 var el=$('#ntHabits'); if(!el) return;
 var arr=FD.data.nutrition.habits;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="habit">'+NT_ICO.plus+'Add habit</button></div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(NT_ICO.leaf,'No habits yet','Small daily wins, \u201cfruit with breakfast\u201d, \u201cno sugary drinks\u201d. Tick them each day and watch streaks grow.',''); return; }
 el.innerHTML=add+'<div class="hsec-h">Tap the circle when done today</div><div class="hmlist">'+arr.map(habitCard).join('')+'</div>';
 }
 function renderNutriOverview(){
 var el=$('#ntOverview'); if(!el) return;
 var N=FD.data.nutrition, meals=N.meals, habits=N.habits;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="nmeal">'+NT_ICO.plus+'Log a meal</button><button class="btn btn--soft" data-modal="habit">'+NT_ICO.leaf+'Add habit</button></div>';
 if(!meals.length&&!habits.length&&!N.water.length){ el.innerHTML=add+hEmpty(NT_ICO.apple,'Gentle nutrition, together','A kind food diary, per-person water glasses, and small daily habits, nourishment without the numbers game.',''); return; }
 var t=todayStr();
 var totalW=0; FD.data.members.forEach(function(m){ totalW+=ntWaterToday(m.name); });
 var mealsToday=meals.filter(function(m){return m.date===t;}).length;
 var hd=habits.filter(function(h){return h.dates.indexOf(t)>=0;}).length;
 var wk=ckWeekDates(0), set={}; wk.forEach(function(d){set[d]=1;});
 var healthyWk=meals.filter(function(m){return set[m.date]&&m.quality==='Healthy';}).length;
 var stats='<div class="hstats">'+hStat('Water today',totalW,NT_ICO.drop)+hStat('Meals logged',mealsToday,NT_ICO.apple)+hStat('Habits today',habits.length?hd+'/'+habits.length:0,NT_ICO.leaf)+hStat('Healthy this week',healthyWk,NT_ICO.check)+'</div>';
 var plan=FD.data.cooking.meals.filter(function(m){return m.date===t;}).sort(function(a,b){return CK_SLOTS.indexOf(a.slot)-CK_SLOTS.indexOf(b.slot);});
 var planCard= plan.length? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">On today\u2019s menu</h3><button class="fcard__link" data-goto="cooking:meals">Meal plan</button></div>'+plan.map(function(m){ return '<div class="lrow"><span class="vrow__ic">'+NT_ICO.apple+'</span><div class="lrow__main"><div class="lrow__title">'+esc(m.title)+'</div><div class="lrow__sub">'+ckCap(m.slot)+'</div></div></div>'; }).join('')+'</div>' : '';
 var due=habits.filter(function(h){return h.dates.indexOf(t)<0;});
 var habCard= habits.length? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Today\u2019s habits</h3><button class="fcard__link" data-sub="nutrition-habits">All habits</button></div>'+(due.length?due.slice(0,4).map(habitCard).join(''):'<div class="docempty">All habits done today, beautiful.</div>')+'</div>' : '';
 var wRows=''; FD.data.members.slice(0,4).forEach(function(m){ var g=ntWaterToday(m.name), tg=ntTarget(m.name); wRows+='<div class="lrow"><span class="vrow__ic">'+NT_ICO.drop+'</span><div class="lrow__main"><div class="lrow__title">'+esc(m.name)+'</div><div class="lnbar lnbar--nt lnbar--mini" style="margin-top:5px"><span style="width:'+Math.min(100,Math.round(g/tg*100))+'%"></span></div></div><span class="lnpct">'+g+'/'+tg+'</span></div>'; });
 var wCard= FD.data.members.length? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Water</h3><button class="fcard__link" data-sub="nutrition-water">Tap glasses</button></div>'+wRows+'</div>' : '';
 var recent=meals.slice().sort(function(a,b){ var c=String(b.date).localeCompare(String(a.date)); return c||(b.createdAt-a.createdAt); }).slice(0,3);
 var rCard= recent.length? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Recently eaten</h3><button class="fcard__link" data-sub="nutrition-meals">Food diary</button></div>'+recent.map(function(m){ return '<div class="lrow"><span class="vrow__ic">'+NT_ICO.apple+'</span><div class="lrow__main"><div class="lrow__title">'+esc(m.what)+(m.quality?' <span class="ntq" style="--qc:'+(NT_QC[m.quality]||'')+'">'+m.quality+'</span>':'')+'</div><div class="lrow__sub">'+(m.meal||'Meal')+' \u00b7 '+jDateLabel(m.date)+'</div></div></div>'; }).join('')+'</div>' : '';
 el.innerHTML=add+stats+planCard+habCard+wCard+rCard;
 }

 /* ===================== FITNESS ===================== */
 var FT_TYPES=['Walking','Running','Gym','Cycling','Swimming','Yoga','Home workout','Sports','Other'];
 var FT_ICO={
 dumb:'<svg class="ico" viewBox="0 0 24 24"><path d="M7.5 8.5v7M4.5 10v4M16.5 8.5v7M19.5 10v4M7.5 12h9"/></svg>',
 pulse:'<svg class="ico" viewBox="0 0 24 24"><path d="M3.5 12.5h4l2-5 3.5 9 2.5-6 1.5 2h3.5"/></svg>',
 listr:'<svg class="ico" viewBox="0 0 24 24"><path d="M8 6.5h12M8 12h12M8 17.5h12"/><circle cx="4.5" cy="6.5" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="17.5" r="1.2"/></svg>',
 clock:'<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5"/><path d="M12 8v4.4l2.8 1.6"/></svg>',
 spark:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 3.5l2.2 5.1 5.3.4-4 3.5 1.2 5.2L12 20.4l-4.7 2.7 1.2-5.2-4-3.5 5.3-.4L12 3.5Z"/></svg>',
 check:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
 plus:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
 x:'<svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>'
 };
 var ftFilter='all', ftrOpen={};
 function ftWeekStats(memberName){
 var wk=ckWeekDates(0); var set={}; wk.forEach(function(d){set[d]=1;});
 var s=0,m=0;
 FD.data.fitness.workouts.forEach(function(w){ if(set[w.date] && (memberName==null || (w.member||'')===memberName)){ s++; m+=(parseInt(w.minutes,10)||0); } });
 return {sessions:s,minutes:m};
 }
 function ftGoalLabel(g){ return (g.member?esc(g.member):'Whole family')+' \u00b7 '+g.target+' '+(g.kind==='minutes'?'min':'workout'+(g.target>1?'s':''))+' / week'; }
 function ftGoalCur(g){ var st=ftWeekStats(g.member===''?null:g.member); return g.kind==='minutes'?st.minutes:st.sessions; }
 function workoutRow(w){
 var sub=[jDateLabel(w.date)||'No date']; if(w.member) sub.push(esc(w.member));
 return '<div class="hmrow"><span class="lnskico lnskico--ft">'+FT_ICO.dumb+'</span><div class="hmrow__main"><div class="hmrow__t">'+esc(w.type||'Workout')+(w.minutes?' <span class="ftmin">'+w.minutes+' min</span>':'')+'</div><div class="hmrow__s">'+sub.join(' \u00b7 ')+'</div>'+(w.note?'<div class="hmrow__note">'+esc(w.note).replace(/\n/g,'<br>')+'</div>':'')+'</div><button class="ckmeal__b" data-ftedit="'+w.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-ftdel="'+w.id+'" aria-label="Delete">'+FT_ICO.x+'</button></div>';
 }
 /* ===================== P4 CHART: workouts per week (6 weeks) ===================== */
 function ftWeeksChart(){
 var arr=FD.data.fitness.workouts||[]; if(!arr.length) return '';
 var weeks=[]; for(var o=-5;o<=0;o++){ var wk=ckWeekDates(o); var set={}; wk.forEach(function(d){set[d]=1;}); var c=0; arr.forEach(function(w){ if(set[w.date]) c++; }); weeks.push({start:wk[0],c:c,cur:o===0}); }
 var tot=0,maxC=1; weeks.forEach(function(w){ tot+=w.c; if(w.c>maxC)maxC=w.c; });
 if(!tot) return '';
 var W=336,H=140,padL=8,padR=8,padT=14,padB=24,plotH=H-padT-padB,plotW=W-padL-padR;
 var n=weeks.length, slot=plotW/n, barW=Math.min(30,Math.round(slot*0.5)), baseY=padT+plotH, scale=maxC*1.15;
 function dl(ds){ var p=ds.split('-'); return (+p[2])+' '+(MON[+p[1]-1]||'').slice(0,3); }
 var parts='';
 weeks.forEach(function(w,i){ var h=Math.max(2,Math.round((w.c/scale)*plotH)), x=padL+i*slot+(slot-barW)/2, y=baseY-h;
 parts+='<rect x="'+x.toFixed(1)+'" y="'+y+'" width="'+barW+'" height="'+h+'" rx="6" fill="var(--m-fitness)" opacity="'+(w.cur?'1':'.75')+'"/>';
 if(w.c>0) parts+='<text x="'+(x+barW/2).toFixed(1)+'" y="'+(y-5)+'" class="wch__v">'+w.c+'</text>';
 parts+='<text x="'+(x+barW/2).toFixed(1)+'" y="'+(H-7)+'" class="wch__l'+(w.cur?' wch__l--td':'')+'">'+dl(w.start)+'</text>';
 });
 return '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Workouts per week</h3><span class="wch__meta">last 6 weeks</span></div>'
 +'<svg class="wch" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Workouts per week, last six weeks"><line x1="'+padL+'" y1="'+baseY+'" x2="'+(W-padR)+'" y2="'+baseY+'" class="wch__b"/>'+parts+'</svg></div>';
 }
 function renderFitWorkouts(){
 var el=$('#ftWorkouts'); if(!el) return;
 var arr=FD.data.fitness.workouts;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="workout">'+FT_ICO.plus+'Log workout</button></div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(FT_ICO.dumb,'No workouts logged','A walk counts. A stretch counts. Log any movement, for anyone, and watch the week fill up.',''); return; }
 var list=arr.slice().filter(function(x){return lnMatch(x,ftFilter);}).sort(function(a,b){ var c=String(b.date).localeCompare(String(a.date)); return c||(b.createdAt-a.createdAt); });
 el.innerHTML=add+ftWeeksChart()+lnFilterChips(arr,ftFilter,'data-ftfilter')+(list.length?'<div class="hmlist">'+list.map(workoutRow).join('')+'</div>':'<div class="docempty">Nothing here for this filter.</div>');
 }
 function fitGoalRow(g){
 var cur=ftGoalCur(g), pct=Math.min(100,Math.round(cur/g.target*100)), met=cur>=g.target;
 return '<div class="lncard'+(met?' ftmet':'')+'"><div class="lncard__top"><div class="lncard__hl"><div class="lncard__t">'+ftGoalLabel(g)+'</div><div class="lncard__s">'+(met?'Met this week':cur+' of '+g.target+' so far')+'</div></div>'+(met?'<span class="lnpill lnpill--done">Done</span>':'')+'</div><div class="lncard__prog"><div class="lnbar lnbar--ft"><span style="width:'+pct+'%"></span></div><span class="lnpct">'+pct+'%</span></div><div class="lncard__acts"><span class="lncard__sp"></span><button class="ckmeal__b" data-ftgedit="'+g.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-ftgdel="'+g.id+'" aria-label="Delete">'+FT_ICO.x+'</button></div></div>';
 }
 function renderFitGoals(){
 var el=$('#ftGoals'); if(!el) return;
 var arr=FD.data.fitness.goals;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="fitgoal">'+FT_ICO.plus+'Add weekly goal</button></div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(FT_ICO.pulse,'No weekly goals yet','Set a gentle target, like \u201c3 workouts a week\u201d, and it tracks itself from your log. Every Monday it starts fresh.',''); return; }
 el.innerHTML=add+'<div class="hsec-h">This week resets every Monday</div><div class="hmlist">'+arr.map(fitGoalRow).join('')+'</div>';
 }
 function routineCard(r){
 var open=!!ftrOpen[r.id];
 var items=(r.items||'').split('\n').map(function(t){return t.trim();}).filter(Boolean);
 var det= open? '<div class="rcard__det">'+(items.length?'<ul class="ring ring--ft">'+items.map(function(t){return '<li>'+esc(t)+'</li>';}).join('')+'</ul>':'<div class="docempty">No exercises listed yet.</div>')+'</div>' : '';
 var sub=[]; if(r.days) sub.push(esc(r.days)); if(r.member) sub.push(esc(r.member));
 return '<article class="lncard"><div class="lncard__top"><div class="lncard__hl"><div class="lncard__t">'+esc(r.name||'Routine')+'</div><div class="lncard__s">'+sub.join(' \u00b7 ')+'</div></div></div>'+det
 +'<div class="lncard__acts"><button class="ckact ckact--ft" data-ftrlog="'+r.id+'">'+FT_ICO.dumb+'Log this</button><button class="jentry__more" style="margin:0;color:var(--m-fitness)" data-ftrexp="'+r.id+'">'+(open?'Hide':'View')+'</button><span class="lncard__sp"></span><button class="ckmeal__b" data-ftredit="'+r.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-ftrdel="'+r.id+'" aria-label="Delete">'+FT_ICO.x+'</button></div></article>';
 }
 function renderFitRoutines(){
 var el=$('#ftRoutines'); if(!el) return;
 var arr=FD.data.fitness.routines;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="routine">'+FT_ICO.plus+'Add routine</button></div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(FT_ICO.listr,'No routines saved','Save your go-to workouts, exercises, days, and log them with one tap when you\u2019re done.',''); return; }
 el.innerHTML=add+'<div class="cklist">'+arr.slice().sort(function(a,b){return b.createdAt-a.createdAt;}).map(routineCard).join('')+'</div>';
 }
 function renderFitOverview(){
 var el=$('#ftOverview'); if(!el) return;
 var F=FD.data.fitness, ws=F.workouts, gs=F.goals;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="workout">'+FT_ICO.plus+'Log workout</button><button class="btn btn--soft" data-modal="fitgoal">'+FT_ICO.pulse+'Weekly goal</button></div>';
 if(!ws.length&&!gs.length&&!F.routines.length){ el.innerHTML=add+hEmpty(FT_ICO.dumb,'Move together, gently','Log any movement, set weekly goals that track themselves, and keep the family\u2019s favourite routines handy.',''); return; }
 var wk=ftWeekStats(null);
 var met=0; gs.forEach(function(g){ if(ftGoalCur(g)>=g.target) met++; });
 var stats='<div class="hstats">'+hStat('This week',wk.sessions,FT_ICO.dumb,'fitness-workouts')+hStat('Minutes',wk.minutes,FT_ICO.clock,'fitness-workouts')+hStat('Day streak',jStreak(ws),FT_ICO.spark,'fitness-workouts')+hStat('Goals met',gs.length?met+'/'+gs.length:0,FT_ICO.pulse,'fitness-goals')+'</div>';
 var days=ckWeekDates(0); var mins={}; days.forEach(function(d){mins[d]=0;});
 var cnts={}; days.forEach(function(d){cnts[d]=0;});
 ws.forEach(function(w){ if(mins[w.date]!=null){ mins[w.date]+=(parseInt(w.minutes,10)||0); cnts[w.date]++; } });
 var useMin=wk.minutes>0, vals=useMin?mins:cnts, unit=useMin?' min':' workout';
 var mx=1; days.forEach(function(d){ if(vals[d]>mx) mx=vals[d]; });
 var td=todayStr();
 var bars=days.map(function(d){ var h=Math.round(vals[d]/mx*100); return '<span class="jmbar" title="'+jDateLabel(d)+' \u00b7 '+vals[d]+unit+(!useMin&&vals[d]!==1?'s':'')+'"><span class="jmbar__fill" style="height:'+h+'%;background:'+(d===td?'var(--m-fitness)':'color-mix(in srgb,var(--m-fitness) 55%,var(--surface-2))')+'"></span></span>'; }).join('');
 var dl='<div class="ftdl"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>';
 var weekCard='<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Activity this week</h3><span class="jmavg">'+(useMin?(wk.minutes+' min'):(wk.sessions+' session'+(wk.sessions!==1?'s':'')))+'</span></div><div class="jmbars">'+bars+'</div>'+dl+'</div>';
 var mrows='';
 FD.data.members.forEach(function(m){
 var st=ftWeekStats(m.name);
 mrows+='<button class="lnmrow" data-ftgo="'+esc(m.name)+'"><span class="lnav">'+avatarHTML(m,'lnav__t')+'</span><span class="lnmrow__main"><span class="lnmrow__n">'+esc(m.name)+'</span><span class="lnmrow__s">'+(st.sessions?st.sessions+' workout'+(st.sessions>1?'s':'')+' \u00b7 '+st.minutes+' min this week':'No movement yet this week')+'</span></span><svg class="ico jrecent__chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>';
 });
 if(wk.sessions){
 var owned=0; FD.data.members.forEach(function(m){ owned+=ftWeekStats(m.name).sessions; });
 var un=wk.sessions-owned;
 if(un>0){ mrows+='<button class="lnmrow" data-sub="fitness-workouts"><span class="lnav"><span class="lnav__t" style="background:color-mix(in srgb,var(--m-fitness) 18%,var(--surface));color:var(--m-fitness)">W</span></span><span class="lnmrow__main"><span class="lnmrow__n">Whole family</span><span class="lnmrow__s">'+un+' workout'+(un>1?'s':'')+' \u00b7 not assigned to a person</span></span><svg class="ico jrecent__chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>'; }
 }
 var memberCard= mrows? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">By member</h3></div><div class="lnmlist">'+mrows+'</div></div>' : '';
 var gPrev= gs.length? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Weekly goals</h3><button class="fcard__link" data-sub="fitness-goals">All goals</button></div>'+gs.slice(0,3).map(function(g){ var cur=ftGoalCur(g),pct=Math.min(100,Math.round(cur/g.target*100)); return '<div class="lrow"><span class="vrow__ic">'+FT_ICO.pulse+'</span><div class="lrow__main"><div class="lrow__title">'+ftGoalLabel(g)+'</div><div class="lnbar lnbar--ft lnbar--mini" style="margin-top:5px"><span style="width:'+pct+'%"></span></div></div>'+(cur>=g.target?'<span class="lnpill lnpill--done">Done</span>':'<span class="lnpct">'+pct+'%</span>')+'</div>'; }).join('')+'</div>' : '';
 var recent=ws.slice().sort(function(a,b){ var c=String(b.date).localeCompare(String(a.date)); return c||(b.createdAt-a.createdAt); }).slice(0,3);
 var rCard= recent.length? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Recent workouts</h3><button class="fcard__link" data-sub="fitness-workouts">All workouts</button></div>'+recent.map(function(w){ return '<div class="lrow"><span class="vrow__ic">'+FT_ICO.dumb+'</span><div class="lrow__main"><div class="lrow__title">'+esc(w.type||'Workout')+(w.member?' \u00b7 '+esc(w.member):'')+'</div><div class="lrow__sub">'+jDateLabel(w.date)+(w.minutes?' \u00b7 '+w.minutes+' min':'')+'</div></div></div>'; }).join('')+'</div>' : '';
 el.innerHTML=add+stats+weekCard+memberCard+gPrev+rCard;
 }

 /* ===================== TRAVEL ===================== */
 var TV_ICO={
 plane:'<svg class="ico" viewBox="0 0 24 24"><path d="M10.5 20.5 9 14.8 3.8 13l16-8.5-4.6 15.7-4.7-2.2Z"/><path d="M9 14.8l10.6-9.9"/></svg>',
 caseb:'<svg class="ico" viewBox="0 0 24 24"><rect x="5" y="8" width="14" height="12" rx="2.5"/><path d="M9 8V6.5A2.5 2.5 0 0 1 11.5 4h1A2.5 2.5 0 0 1 15 6.5V8"/><path d="M9 12v4M15 12v4"/></svg>',
 pin:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 21s-6.5-5.3-6.5-10A6.5 6.5 0 0 1 12 4.5 6.5 6.5 0 0 1 18.5 11c0 4.7-6.5 10-6.5 10Z"/><circle cx="12" cy="10.8" r="2.3"/></svg>',
 cal:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="14" rx="2.5"/><path d="M8 3.8V8M16 3.8V8M4 11h16"/></svg>',
 check:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
 plus:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
 x:'<svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>'
 };
 var TV_ESSENTIALS=['Passports / IDs','Tickets & bookings','Phone chargers','Power bank','Medicines','Toiletries','Clothes','Comfy shoes','Sunglasses','Snacks & water'];
 var tpTrip='';
 function tripStatus(t){ var td=todayStr(); if(!t.start&&!t.end) return 'planning'; if(t.end&&t.end<td) return 'past'; if(t.start&&t.start>td) return 'upcoming'; return 'ongoing'; }
 function daysTo(ds){ if(!ds) return null; var p=ds.split('-'); var a=new Date(+p[0],+p[1]-1,+p[2]); var n=new Date(); n.setHours(0,0,0,0); return Math.round((a-n)/86400000); }
 function fmtRange(s,e){ if(s&&e) return jDateLabel(s)+' \u2013 '+jDateLabel(e); if(s) return 'From '+jDateLabel(s); if(e) return 'Until '+jDateLabel(e); return 'Dates to decide'; }
 function tvCountdown(t){ var st=tripStatus(t); if(st==='ongoing') return 'Happening now \u2708'; if(st==='upcoming'){ var n=daysTo(t.start); if(n===0) return 'Today!'; if(n===1) return 'Tomorrow'; return 'In '+n+' days'; } return ''; }
 var TV_PILL={ongoing:'Happening now',upcoming:'Upcoming',planning:'Planning',past:'Past trip'};
 function tvTravChips(str){ var parts=String(str||'').split(',').map(function(x){return x.trim();}).filter(Boolean); if(!parts.length) return ''; return '<div class="jtags" style="margin-top:9px">'+parts.map(function(p){return '<span class="jtag">'+esc(p)+'</span>';}).join('')+'</div>'; }
 function tvPackStats(tripId){ var items=FD.data.travel.packing.filter(function(p){return p.tripId===tripId;}); var dn=items.filter(function(p){return p.done;}).length; return {total:items.length,done:dn}; }
 function tripCard(t){
 var st=tripStatus(t), cd=tvCountdown(t);
 var photo=t.photo?'<div class="rcard__photo"><img src="'+t.photo+'" alt=""></div>':'';
 var pk=tvPackStats(t.id);
 return '<article class="tvcard'+(st==='past'?' is-past':'')+'" data-tvopen="'+t.id+'">'+photo
 +'<div class="rcard__body"><div class="lncard__top"><div class="lncard__hl"><div class="rcard__t">'+esc(t.dest||'Trip')+'</div><div class="lncard__s">'+fmtRange(t.start,t.end)+'</div></div><span class="tvpill tvpill--'+st+'">'+(cd||TV_PILL[st])+'</span></div>'
 +tvTravChips(t.travelers)
 +(t.note?'<div class="lncard__note">'+esc(t.note).replace(/\n/g,'<br>')+'</div>':'')
 +'<div class="lncard__acts"><button class="ckact" data-tvpkgo="'+t.id+'">'+TV_ICO.caseb+'Packing'+(pk.total?' '+pk.done+'/'+pk.total:'')+'</button><span class="lncard__sp"></span><button class="ckmeal__b" data-tvedit="'+t.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-tvdel="'+t.id+'" aria-label="Delete">'+TV_ICO.x+'</button></div>'
 +'</div></article>';
 }
 function tvOrderTrips(){ var rank={ongoing:0,upcoming:1,planning:2,past:3}; return FD.data.travel.trips.slice().sort(function(a,b){ var ra=rank[tripStatus(a)],rb=rank[tripStatus(b)]; if(ra!==rb) return ra-rb; if(ra===1) return String(a.start).localeCompare(String(b.start)); if(ra===3) return String(b.end||b.start||'').localeCompare(String(a.end||a.start||'')); return b.createdAt-a.createdAt; }); }
 function renderTravelTrips(){
 var el=$('#tvTrips'); if(!el) return;
 var arr=FD.data.travel.trips;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="trip">'+TV_ICO.plus+'Add trip</button></div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(TV_ICO.plane,'No trips yet','Plan the family\u2019s adventures, dates, travellers, a photo of the destination, and pack for them without stress.',''); return; }
 el.innerHTML=add+'<div class="cklist">'+tvOrderTrips().map(tripCard).join('')+'</div>';
 }
 function tvPkAdd(){ var ni=$('#pkNewName'); if(!ni||!tpTrip) return; var n=(ni.value||'').trim(); if(!n){ ni.focus(); return; } FD.addPack({tripId:tpTrip,name:n,done:false}); renderTravelPacking(); var f=$('#pkNewName'); if(f) f.focus(); }
 function tvWirePk(){ var x=$('#pkNewName'); if(x){ x.addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); tvPkAdd(); } }); } }
 function renderTravelPacking(){
 var el=$('#tvPacking'); if(!el) return;
 var trips=tvOrderTrips();
 if(!trips.length){ el.innerHTML=hEmpty(TV_ICO.caseb,'Add a trip first','Packing lists live inside trips. Create your first trip and the suitcase opens here.','<button class="btn btn--primary" data-modal="trip" style="margin-top:4px">'+TV_ICO.plus+'Add trip</button>'); return; }
 var ok=false; trips.forEach(function(t){ if(t.id===tpTrip) ok=true; });
 if(!ok) tpTrip=trips[0].id;
 var chips='<div class="jfilter">'+trips.map(function(t){ return '<button class="ckfchip'+(tpTrip===t.id?' is-on':'')+'" data-tvpk="'+t.id+'">'+esc(t.dest||'Trip')+'</button>'; }).join('')+'</div>';
 var items=FD.data.travel.packing.filter(function(p){return p.tripId===tpTrip;});
 var dn=items.filter(function(p){return p.done;});
 var qadd='<div class="ckadd"><input id="pkNewName" type="text" placeholder="Add something to pack\u2026"><button class="btn btn--primary" data-tvpkadd="1">'+TV_ICO.plus+'Add</button></div>';
 function row(i){ return '<div class="hmrow'+(i.done?' is-done':'')+'"><button class="hmrow__chk" data-tvpkdone="'+i.id+'" aria-label="Toggle packed">'+TV_ICO.check+'</button><div class="hmrow__main"><div class="hmrow__t">'+esc(i.name)+'</div></div><button class="ckmeal__b" data-tvpkedit="'+i.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-tvpkdel="'+i.id+'" aria-label="Delete">'+TV_ICO.x+'</button></div>'; }
 var html=chips+qadd;
 if(!items.length){ html+='<div class="docempty">Nothing on this list yet.</div><div class="happt-top" style="margin-top:12px"><button class="btn btn--soft" data-tvpkseed="1">'+TV_ICO.caseb+'Add travel essentials</button></div>'; }
 else{
 var pct=Math.round(dn.length/items.length*100);
 html+='<div class="lncard__prog" style="margin:2px 0 14px"><div class="lnbar lnbar--tv"><span style="width:'+pct+'%"></span></div><span class="lnpct">'+dn.length+'/'+items.length+'</span></div>';
 var open=items.filter(function(i){return !i.done;});
 html+='<div class="hsec-h">To pack \u00b7 '+open.length+'</div>';
 html+= open.length? '<div class="hmlist">'+open.map(row).join('')+'</div>' : '<div class="docempty">Everything\u2019s packed, safe travels! \u2708</div>';
 if(dn.length){ html+='<div class="hsec-h" style="margin-top:16px">Packed \u00b7 '+dn.length+'<button class="ckclear" data-tvpkreset="1">Uncheck all</button></div><div class="hmlist">'+dn.map(row).join('')+'</div>'; }
 }
 el.innerHTML=html;
 tvWirePk();
 }
 function renderTravelBucket(){
 var el=$('#tvBucket'); if(!el) return;
 var arr=FD.data.travel.ideas;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="idea">'+TV_ICO.plus+'Add dream place</button></div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(TV_ICO.pin,'The bucket list is empty','Where does your family dream of going? Collect places here, and turn any of them into a real trip with one tap.',''); return; }
 var rows=arr.slice().sort(function(a,b){return b.createdAt-a.createdAt;}).map(function(x){ return '<div class="hmrow"><span class="lnskico" style="background:color-mix(in srgb,var(--m-travel) 12%,var(--surface));color:var(--m-travel)">'+TV_ICO.pin+'</span><div class="hmrow__main"><div class="hmrow__t">'+esc(x.place||'Somewhere')+'</div>'+(x.note?'<div class="hmrow__s">'+esc(x.note)+'</div>':'')+'</div><button class="lnup lnup--tv" data-tvmk="'+x.id+'">Make it a trip</button><button class="ckmeal__b" data-tvidedit="'+x.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-tviddel="'+x.id+'" aria-label="Delete">'+TV_ICO.x+'</button></div>'; }).join('');
 el.innerHTML=add+'<div class="hsec-h">Dream destinations \u00b7 '+arr.length+'</div><div class="hmlist">'+rows+'</div>';
 }
 function renderTravelOverview(){
 var el=$('#tvOverview'); if(!el) return;
 var T=FD.data.travel, trips=T.trips, ideas=T.ideas;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="trip">'+TV_ICO.plus+'Add trip</button><button class="btn btn--soft" data-modal="idea">'+TV_ICO.pin+'Dream place</button></div>';
 if(!trips.length&&!ideas.length){ el.innerHTML=add+hEmpty(TV_ICO.plane,'Where to, together?','Trips with countdowns, packing lists that remember everything, and a family bucket list of dream places.',''); return; }
 var ordered=tvOrderTrips();
 var next=null; ordered.forEach(function(t){ if(!next){ var s=tripStatus(t); if(s==='ongoing'||s==='upcoming') next=t; } });
 var upN=trips.filter(function(t){return tripStatus(t)==='upcoming';}).length;
 var pastN=trips.filter(function(t){return tripStatus(t)==='past';}).length;
 var unpacked=0; if(next){ var s2=tvPackStats(next.id); unpacked=s2.total-s2.done; }
 var stats='<div class="hstats">'+hStat('Upcoming',upN,TV_ICO.plane)+hStat('Past adventures',pastN,TV_ICO.cal)+hStat('Bucket list',ideas.length,TV_ICO.pin)+hStat('Left to pack',unpacked,TV_ICO.caseb)+'</div>';
 var hero='';
 if(next){
 var pk=tvPackStats(next.id); var pct=pk.total?Math.round(pk.done/pk.total*100):0;
 hero='<div class="tvhero">'+(next.photo?'<div class="tvhero__ph"><img src="'+next.photo+'" alt=""></div>':'')
 +'<div class="tvhero__body"><div class="tvhero__cd">'+(tvCountdown(next)||'Next trip')+'</div><div class="tvhero__t">'+esc(next.dest||'Trip')+'</div><div class="tvhero__s">'+fmtRange(next.start,next.end)+'</div>'
 +tvTravChips(next.travelers)
 +(pk.total?'<div class="lncard__prog" style="margin-top:12px"><div class="lnbar lnbar--tv"><span style="width:'+pct+'%"></span></div><span class="lnpct">'+pk.done+'/'+pk.total+'</span></div>':'')
 +'<div class="lncard__acts" style="margin-top:12px"><button class="ckact" data-tvpkgo="'+next.id+'">'+TV_ICO.caseb+(pk.total?'Continue packing':'Start packing')+'</button><button class="ckact" data-sub="travel-trips">All trips</button></div></div></div>';
 }
 var others=ordered.filter(function(t){ var s=tripStatus(t); return (s==='upcoming'||s==='planning') && (!next||t.id!==next.id); }).slice(0,3);
 var upCard= others.length? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Also on the horizon</h3><button class="fcard__link" data-sub="travel-trips">All trips</button></div>'+others.map(function(t){ return '<div class="lrow"><span class="vrow__ic">'+TV_ICO.plane+'</span><div class="lrow__main"><div class="lrow__title">'+esc(t.dest)+'</div><div class="lrow__sub">'+fmtRange(t.start,t.end)+'</div></div></div>'; }).join('')+'</div>' : '';
 var past=ordered.filter(function(t){return tripStatus(t)==='past';}).slice(0,3);
 var pastCard= past.length? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Memories</h3></div>'+past.map(function(t){ return '<div class="lrow"><span class="vrow__ic">'+TV_ICO.cal+'</span><div class="lrow__main"><div class="lrow__title">'+esc(t.dest)+'</div><div class="lrow__sub">'+fmtRange(t.start,t.end)+'</div></div></div>'; }).join('')+'</div>' : '';
 var bCard= ideas.length? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Bucket list</h3><button class="fcard__link" data-sub="travel-bucket">See all</button></div><div class="chiplist" style="padding:4px 0 2px">'+ideas.slice(0,8).map(function(x){return '<span class="dchip">'+esc(x.place)+'</span>';}).join('')+'</div></div>' : '';
 el.innerHTML=add+stats+hero+upCard+pastCard+bCard;
 }

 /* ===================== LEARNING ===================== */
 var LN_ICO={
 cap:'<svg class="ico" viewBox="0 0 24 24"><path d="M3 9.5 12 5l9 4.5-9 4.5L3 9.5Z"/><path d="M6.5 11.8V16c0 1.4 2.4 2.6 5.5 2.6s5.5-1.2 5.5-2.6v-4.2"/><path d="M21 9.5V14"/></svg>',
 book:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z"/><path d="M19 18v3H6.5A2.5 2.5 0 0 1 4 20.5"/><path d="M8 7.5h7"/></svg>',
 target:'<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="3.8"/><circle cx="12" cy="12" r=".8"/></svg>',
 check:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
 plus:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
 minus:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
 x:'<svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>'
 };
 var LN_LEVELS=['','Beginner','Practicing','Confident','Mastered'];
 var lcFilter='all', lbFilter='all', lsFilter='all';
 function lnStatus(kind,p){ if(p>=100) return kind==='book'?'Finished':'Done'; if(p>0) return kind==='book'?'Reading':'In progress'; return kind==='book'?'To read':'Planned'; }
 function lnWhoChip(name){ if(!name) return ''; return '<span class="lnwho">'+esc(name)+'</span>'; }
 function lnFilterChips(arr,current,attr){
 var whoSet={}; arr.forEach(function(x){ var k=x.member||''; whoSet[k]=(whoSet[k]||0)+1; });
 var names=Object.keys(whoSet).filter(function(n){return n;});
 if(!names.length) return '';
 var out='<div class="jfilter"><button class="ckfchip'+(current==='all'?' is-on':'')+'" '+attr+'="all">All <span>'+arr.length+'</span></button>';
 names.forEach(function(n){ out+='<button class="ckfchip'+(current===n?' is-on':'')+'" '+attr+'="'+esc(n)+'">'+esc(n)+' <span>'+whoSet[n]+'</span></button>'; });
 if(whoSet['']) out+='<button class="ckfchip'+(current==='__none'?' is-on':'')+'" '+attr+'="__none">Unassigned <span>'+whoSet['']+'</span></button>';
 return out+'</div>';
 }
 function lnMatch(x,f){ return f==='all' || (f==='__none'?!x.member:x.member===f); }
 function lnItemCard(x,kind){
 var p=parseInt(x.progress,10)||0, done=p>=100;
 var sub=[]; if(kind==='book'){ if(x.author) sub.push(esc(x.author)); } else { if(x.subject) sub.push(esc(x.subject)); if(x.source) sub.push(esc(x.source)); }
 return '<article class="lncard'+(done?' is-done':'')+'">'
 +'<div class="lncard__top"><div class="lncard__hl"><div class="lncard__t">'+esc(x.title||(kind==='book'?'Book':'Course'))+'</div><div class="lncard__s">'+(sub.length?sub.join(' \u00b7 '):'')+'</div></div>'+lnWhoChip(x.member)+'</div>'
 +'<div class="lncard__prog"><div class="lnbar"><span style="width:'+p+'%"></span></div><span class="lnpct">'+p+'%</span></div>'
 +(x.note?'<div class="lncard__note">'+esc(x.note).replace(/\n/g,'<br>')+'</div>':'')
 +'<div class="lncard__acts"><span class="lnpill'+(done?' lnpill--done':(p>0?' lnpill--on':''))+'">'+lnStatus(kind,p)+'</span>'
 +'<span class="lncard__sp"></span>'
 +(done?'':'<button class="lnstep" data-lnprog="'+x.id+'" data-kind="'+kind+'" data-d="-10" aria-label="Minus 10 percent">'+LN_ICO.minus+'</button><button class="lnstep lnstep--plus" data-lnprog="'+x.id+'" data-kind="'+kind+'" data-d="10" aria-label="Plus 10 percent">'+LN_ICO.plus+'</button>')
 +'<button class="ckmeal__b" data-lnedit="'+x.id+'" data-kind="'+kind+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-lndel="'+x.id+'" data-kind="'+kind+'" aria-label="Delete">'+LN_ICO.x+'</button></div>'
 +'</article>';
 }
 function lnSort(a,b){ var pa=parseInt(a.progress,10)||0, pb=parseInt(b.progress,10)||0; var ga=(pa>=100)?2:(pa>0?0:1), gb=(pb>=100)?2:(pb>0?0:1); return (ga-gb)||(pb-pa)||(b.createdAt-a.createdAt); }
 function renderLearnCourses(){
 var el=$('#lnCourses'); if(!el) return;
 var arr=FD.data.learning.courses;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="course">'+LN_ICO.plus+'Add course</button></div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(LN_ICO.cap,'No courses yet','Track classes, online courses and study, for anyone in the family, with simple progress you can nudge forward.',''); return; }
 var list=arr.slice().filter(function(x){return lnMatch(x,lcFilter);}).sort(lnSort);
 el.innerHTML=add+lnFilterChips(arr,lcFilter,'data-lncf')+(list.length?'<div class="hmlist">'+list.map(function(x){return lnItemCard(x,'course');}).join('')+'</div>':'<div class="docempty">Nothing here for this filter.</div>');
 }
 function renderLearnBooks(){
 var el=$('#lnBooks'); if(!el) return;
 var arr=FD.data.learning.books;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="book">'+LN_ICO.plus+'Add book</button></div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(LN_ICO.book,'The reading list is empty','Keep the family\u2019s books in one place, to read, reading, finished, and watch the pages add up.',''); return; }
 var list=arr.slice().filter(function(x){return lnMatch(x,lbFilter);}).sort(lnSort);
 el.innerHTML=add+lnFilterChips(arr,lbFilter,'data-lnbf')+(list.length?'<div class="hmlist">'+list.map(function(x){return lnItemCard(x,'book');}).join('')+'</div>':'<div class="docempty">Nothing here for this filter.</div>');
 }
 function skillRow(s){
 var lv=Math.max(1,Math.min(4,parseInt(s.level,10)||1));
 var segs=''; for(var i=1;i<=4;i++){ segs+='<span class="lnlvl__seg'+(i<=lv?' is-on':'')+'"></span>'; }
 return '<div class="hmrow"><span class="lnskico">'+LN_ICO.target+'</span><div class="hmrow__main"><div class="hmrow__t">'+esc(s.name||'Skill')+(s.member?' '+lnWhoChip(s.member):'')+'</div><div class="lnlvl"><span class="lnlvl__segs">'+segs+'</span><span class="lnlvl__lab">'+LN_LEVELS[lv]+'</span></div>'+(s.note?'<div class="hmrow__note">'+esc(s.note).replace(/\n/g,'<br>')+'</div>':'')+'</div>'+(lv<4?'<button class="lnup" data-lnsup="'+s.id+'">Level up</button>':'')+'<button class="ckmeal__b" data-lnedit="'+s.id+'" data-kind="skill" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-lndel="'+s.id+'" data-kind="skill" aria-label="Delete">'+LN_ICO.x+'</button></div>';
 }
 function renderLearnSkills(){
 var el=$('#lnSkills'); if(!el) return;
 var arr=FD.data.learning.skills;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="skill">'+LN_ICO.plus+'Add skill</button></div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(LN_ICO.target,'No skills tracked','From swimming to coding to Arabic, track what each person is learning and level them up as they grow.',''); return; }
 var list=arr.slice().filter(function(x){return lnMatch(x,lsFilter);}).sort(function(a,b){ return (b.level-a.level)||(b.createdAt-a.createdAt); });
 el.innerHTML=add+lnFilterChips(arr,lsFilter,'data-lnsf')+(list.length?'<div class="hmlist">'+list.map(skillRow).join('')+'</div>':'<div class="docempty">Nothing here for this filter.</div>');
 }
 function renderLearnOverview(){
 var el=$('#lnOverview'); if(!el) return;
 var L=FD.data.learning, cs=L.courses, bk=L.books, sk=L.skills;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="course">'+LN_ICO.plus+'Add course</button><button class="btn btn--soft" data-modal="book">'+LN_ICO.book+'Add book</button><button class="btn btn--soft" data-modal="skill">'+LN_ICO.target+'Add skill</button></div>';
 if(!cs.length&&!bk.length&&!sk.length){ el.innerHTML=add+hEmpty(LN_ICO.cap,'A learning home for the whole family','Courses with progress, a shared reading list, and skills that level up, each one belonging to someone you love.',''); return; }
 var all=cs.map(function(x){return{x:x,k:'course'};}).concat(bk.map(function(x){return{x:x,k:'book'};}));
 var actN=0, doneN=0; all.forEach(function(o){ var p=parseInt(o.x.progress,10)||0; if(p>=100) doneN++; else if(p>0) actN++; });
 var bkDone=bk.filter(function(b){return (parseInt(b.progress,10)||0)>=100;}).length;
 var stats='<div class="hstats">'+hStat('In progress',actN,LN_ICO.cap)+hStat('Completed',doneN,LN_ICO.check)+hStat('Books finished',bkDone,LN_ICO.book)+hStat('Skills',sk.length,LN_ICO.target)+'</div>';
 function whoStats(name){
 var mine=all.filter(function(o){ return (o.x.member||'')===name; });
 var act=mine.filter(function(o){ var p=parseInt(o.x.progress,10)||0; return p>0&&p<100; });
 var dn=mine.filter(function(o){ return (parseInt(o.x.progress,10)||0)>=100; }).length;
 var skN=sk.filter(function(s){ return (s.member||'')===name; }).length;
 var avg=act.length? Math.round(act.reduce(function(a,o){return a+(parseInt(o.x.progress,10)||0);},0)/act.length) : 0;
 return {total:mine.length+skN, act:act.length, dn:dn, skN:skN, avg:avg};
 }
 var mrows='';
 FD.data.members.forEach(function(m){
 var w=whoStats(m.name);
 var bits=[]; if(w.act) bits.push(w.act+' active'); if(w.dn) bits.push(w.dn+' done'); if(w.skN) bits.push(w.skN+' skill'+(w.skN>1?'s':''));
 mrows+='<button class="lnmrow" data-lngo="'+esc(m.name)+'"><span class="lnav">'+avatarHTML(m,'lnav__t')+'</span><span class="lnmrow__main"><span class="lnmrow__n">'+esc(m.name)+'</span><span class="lnmrow__s">'+(w.total?bits.join(' \u00b7 '):'Nothing yet, start something for '+esc(m.name.split(' ')[0]))+'</span>'+(w.act?'<span class="lnbar lnbar--mini"><span style="width:'+w.avg+'%"></span></span>':'')+'</span><svg class="ico jrecent__chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>';
 });
 var un=whoStats('');
 if(un.total){ mrows+='<button class="lnmrow" data-lngo="__none"><span class="lnav"><span class="lnav__t" style="background:var(--text-3)">?</span></span><span class="lnmrow__main"><span class="lnmrow__n">Unassigned</span><span class="lnmrow__s">'+un.act+' active \u00b7 '+un.dn+' done \u00b7 '+un.skN+' skills</span></span><svg class="ico jrecent__chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>'; }
 var memberCard= mrows? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">By member</h3></div><div class="lnmlist">'+mrows+'</div></div>' : '';
 var active=all.filter(function(o){ var p=parseInt(o.x.progress,10)||0; return p>0&&p<100; }).sort(function(a,b){ return (parseInt(b.x.progress,10)||0)-(parseInt(a.x.progress,10)||0); }).slice(0,4);
 var actCard= active.length? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Continuing now</h3><button class="fcard__link" data-sub="learning-courses">Courses</button></div>'+active.map(function(o){ var p=parseInt(o.x.progress,10)||0; return '<div class="lrow"><span class="vrow__ic">'+(o.k==='book'?LN_ICO.book:LN_ICO.cap)+'</span><div class="lrow__main"><div class="lrow__title">'+esc(o.x.title)+(o.x.member?' '+lnWhoChip(o.x.member):'')+'</div><div class="lnbar lnbar--mini" style="margin-top:5px"><span style="width:'+p+'%"></span></div></div><button class="lnstep lnstep--plus" data-lnprog="'+o.x.id+'" data-kind="'+o.k+'" data-d="10" aria-label="Plus 10 percent">'+LN_ICO.plus+'</button></div>'; }).join('')+'</div>' : '';
 el.innerHTML=add+stats+memberCard+actCard;
 }

 /* ===================== HOME MANAGEMENT ===================== */
 var HM_FREQ_LABEL={once:'Once',daily:'Daily',weekly:'Weekly',monthly:'Monthly'};
 var HM_AREAS=['General','Kitchen','Bathroom','Bedroom','Living room','Outdoor','Appliances','Vehicle','Other'];
 var SUP_CATS=['Cleaning','Kitchen','Bathroom','Laundry','Personal care','Other'];
 var SUP_LABEL={ok:'OK',low:'Low',out:'Out'};
 var HM_ICO={
 chore:'<svg class="ico" viewBox="0 0 24 24"><path d="M4.5 6.2l1.5 1.5 2.5-3"/><path d="M11.5 6.5H20"/><path d="M4.5 12.2l1.5 1.5 2.5-3"/><path d="M11.5 12.5H20"/><path d="M4.5 18.2l1.5 1.5 2.5-3"/><path d="M11.5 18.5H20"/></svg>',
 wrench:'<svg class="ico" viewBox="0 0 24 24"><path d="M14.8 6.2a4.1 4.1 0 0 0-5.5 5.1L4 16.6V20h3.4l5.3-5.3a4.1 4.1 0 0 0 5.1-5.5l-2.7 2.7-2.2-.5-.5-2.2 2.4-3Z"/></svg>',
 box:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 8l8-4 8 4v8l-8 4-8-4V8Z"/><path d="M4 8l8 4 8-4M12 12v8"/></svg>',
 check:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
 plus:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
 x:'<svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>'
 };
 var hmChoreFilter='all';
 function choreDue(c){
 var t=todayStr();
 if(c.freq==='once') return !c.lastDone;
 if(!c.lastDone) return true;
 if(c.freq==='daily') return c.lastDone!==t;
 if(c.freq==='weekly') return c.lastDone<ckWeekDates(0)[0];
 if(c.freq==='monthly') return c.lastDone.slice(0,7)!==t.slice(0,7);
 return !c.lastDone;
 }
 function choreRow(c){
 var due=choreDue(c), who=jWho(c.assignee);
 var sub=[HM_FREQ_LABEL[c.freq]||'Once']; if(who) sub.push(who);
 if(!due&&c.lastDone) sub.push('done '+jDateLabel(c.lastDone));
 return '<div class="hmrow'+(due?'':' is-done')+'"><button class="hmrow__chk" data-hcdone="'+c.id+'" aria-label="Toggle done">'+HM_ICO.check+'</button><div class="hmrow__main"><div class="hmrow__t">'+esc(c.title||'Chore')+'</div><div class="hmrow__s">'+sub.join(' \u00b7 ')+'</div></div><button class="ckmeal__b" data-hcedit="'+c.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-hcdel="'+c.id+'" aria-label="Delete">'+HM_ICO.x+'</button></div>';
 }
 function renderHomeChores(){
 var el=$('#hmChores'); if(!el) return;
 var arr=FD.data.home.chores;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="chore">'+HM_ICO.plus+'Add chore</button></div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(HM_ICO.chore,'No chores yet','Add the recurring jobs of the house, daily, weekly or monthly, and assign them to your people. They come back due on their own.',''); return; }
 var whoSet={}; arr.forEach(function(c){ if(c.assignee) whoSet[c.assignee]=(whoSet[c.assignee]||0)+1; });
 var names=Object.keys(whoSet);
 var chips = names.length? '<div class="jfilter"><button class="ckfchip'+(hmChoreFilter==='all'?' is-on':'')+'" data-hcfilter="all">All <span>'+arr.length+'</span></button>'+names.map(function(n){ return '<button class="ckfchip'+(hmChoreFilter===n?' is-on':'')+'" data-hcfilter="'+esc(n)+'">'+esc(n)+' <span>'+whoSet[n]+'</span></button>'; }).join('')+'</div>' : '';
 var list=arr.slice().filter(function(c){ return hmChoreFilter==='all'||c.assignee===hmChoreFilter; });
 var due=list.filter(choreDue), rest=list.filter(function(c){return !choreDue(c);});
 var html=add+chips;
 html+='<div class="hsec-h">Due now \u00b7 '+due.length+'</div>';
 html+= due.length? '<div class="hmlist">'+due.map(choreRow).join('')+'</div>' : '<div class="docempty">All caught up, nothing due.</div>';
 if(rest.length){ html+='<div class="hsec-h" style="margin-top:16px">Done / upcoming \u00b7 '+rest.length+'</div><div class="hmlist">'+rest.map(choreRow).join('')+'</div>'; }
 el.innerHTML=html;
 }
 function maintRow(m){
 var t=todayStr(); var over=!m.done&&m.due&&m.due<t;
 var sub=[]; if(m.area) sub.push(esc(m.area));
 if(m.done) sub.push('done'+(m.doneAt?' '+jDateLabel(m.doneAt):''));
 else if(m.due) sub.push(over?('<span class="hmover">Overdue \u00b7 '+jDateLabel(m.due)+'</span>'):('Due '+jDateLabel(m.due)));
 else sub.push('No date');
 return '<div class="hmrow'+(m.done?' is-done':'')+(over?' is-over':'')+'"><button class="hmrow__chk" data-mtdone="'+m.id+'" aria-label="Toggle done">'+HM_ICO.check+'</button><div class="hmrow__main"><div class="hmrow__t">'+esc(m.title||'Task')+'</div><div class="hmrow__s">'+sub.join(' \u00b7 ')+'</div>'+(m.note?'<div class="hmrow__note">'+esc(m.note).replace(/\n/g,'<br>')+'</div>':'')+'</div><button class="ckmeal__b" data-mtedit="'+m.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-mtdel="'+m.id+'" aria-label="Delete">'+HM_ICO.x+'</button></div>';
 }
 function renderHomeMaint(){
 var el=$('#hmMaint'); if(!el) return;
 var arr=FD.data.home.maint;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="maint">'+HM_ICO.plus+'Add task</button></div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(HM_ICO.wrench,'No maintenance yet','Track the upkeep of your home, filters, servicing, repairs, with due dates so nothing slips.',''); return; }
 var open=arr.filter(function(m){return !m.done;}).sort(function(a,b){ var ad=a.due||'9999',bd=b.due||'9999'; return ad.localeCompare(bd)||(a.createdAt-b.createdAt); });
 var done=arr.filter(function(m){return m.done;}).sort(function(a,b){ return String(b.doneAt||'').localeCompare(String(a.doneAt||'')); });
 var html=add+'<div class="hsec-h">To do \u00b7 '+open.length+'</div>';
 html+= open.length? '<div class="hmlist">'+open.map(maintRow).join('')+'</div>' : '<div class="docempty">Nothing pending, the house is happy.</div>';
 if(done.length){ html+='<div class="hsec-h" style="margin-top:16px">Completed \u00b7 '+done.length+'</div><div class="hmlist">'+done.map(maintRow).join('')+'</div>'; }
 el.innerHTML=html;
 }
 function supplyRow(s){
 return '<div class="hmrow"><button class="supchip supchip--'+s.status+'" data-supstat="'+s.id+'" aria-label="Cycle status"><span class="supchip__dot"></span>'+SUP_LABEL[s.status]+'</button><div class="hmrow__main"><div class="hmrow__t">'+esc(s.name||'Item')+'</div>'+(s.cat?'<div class="hmrow__s">'+esc(s.cat)+'</div>':'')+'</div><button class="ckmeal__b" data-supedit="'+s.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-supdel="'+s.id+'" aria-label="Delete">'+HM_ICO.x+'</button></div>';
 }
 function renderHomeSupplies(){
 var el=$('#hmSupplies'); if(!el) return;
 var arr=FD.data.home.supplies;
 var needs=arr.filter(function(s){return s.status!=='ok';});
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="supply">'+HM_ICO.plus+'Add supply</button>'+(needs.length?'<button class="btn btn--soft" data-suptoshop="1"><svg class="ico" viewBox="0 0 24 24"><circle cx="9.6" cy="19.2" r="1.3"/><circle cx="16.9" cy="19.2" r="1.3"/><path d="M4 5h2.1l2.1 10a1.6 1.6 0 0 0 1.6 1.3h6.5a1.6 1.6 0 0 0 1.6-1.2L19.8 8H7"/></svg>Send '+needs.length+' to shopping</button>':'')+'</div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(HM_ICO.box,'No supplies tracked','Keep an eye on household essentials. Tap the status to cycle OK \u2192 Low \u2192 Out, then send what\u2019s needed straight to your shopping list.',''); return; }
 var ord={out:0,low:1,ok:2};
 var list=arr.slice().sort(function(a,b){ return (ord[a.status]-ord[b.status])||String(a.name).localeCompare(String(b.name)); });
 el.innerHTML=add+'<div class="hsec-h">Household supplies \u00b7 '+arr.length+'</div><div class="hmlist">'+list.map(supplyRow).join('')+'</div>';
 }
 function renderHomeOverview(){
 var el=$('#hmOverview'); if(!el) return;
 var H=FD.data.home, chores=H.chores, maint=H.maint, sup=H.supplies;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="chore">'+HM_ICO.plus+'Add chore</button><button class="btn btn--soft" data-modal="maint">'+HM_ICO.wrench+'Add maintenance</button></div>';
 if(!chores.length&&!maint.length&&!sup.length){ el.innerHTML=add+hEmpty(HM_ICO.chore,'Run your household from here','Chores that come back on their own, maintenance with due dates, and a supplies tracker wired straight into your shopping list.',''); return; }
 var due=chores.filter(choreDue);
 var ws=ckWeekDates(0)[0];
 var doneWk=chores.filter(function(c){return c.lastDone&&c.lastDone>=ws;}).length;
 var openM=maint.filter(function(m){return !m.done;});
 var t=todayStr(); var overM=openM.filter(function(m){return m.due&&m.due<t;}).length;
 var restock=sup.filter(function(s){return s.status!=='ok';});
 var stats='<div class="hstats">'+hStat('Due now',due.length,HM_ICO.chore)+hStat('Done this week',doneWk,HM_ICO.check)+hStat(overM?'Overdue upkeep':'Maintenance',overM||openM.length,HM_ICO.wrench)+hStat('To restock',restock.length,HM_ICO.box)+'</div>';
 var dueCard='<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Due now</h3><button class="fcard__link" data-sub="homemgmt-chores">All chores</button></div>'
 +(due.length? due.slice(0,5).map(choreRow).join('') : '<div class="docempty">Nothing due, all caught up.</div>')+'</div>';
 var upcoming=openM.slice().sort(function(a,b){ return (a.due||'9999').localeCompare(b.due||'9999'); }).slice(0,4);
 var mCard= upcoming.length? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Upcoming maintenance</h3><button class="fcard__link" data-sub="homemgmt-maintenance">All tasks</button></div>'+upcoming.map(maintRow).join('')+'</div>' : '';
 var sCard= restock.length? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Running low</h3><button class="fcard__link" data-sub="homemgmt-supplies">Supplies</button></div><div class="chiplist" style="padding:4px 0 2px">'+restock.slice(0,8).map(function(s){ return '<span class="dchip">'+esc(s.name)+' \u00b7 '+SUP_LABEL[s.status]+'</span>'; }).join('')+'</div></div>' : '';
 el.innerHTML=add+stats+dueCard+mCard+sCard;
 }

 /* ===================== EASE: QUICK ADD + GETTING STARTED + SOON ===================== */
 var GS_HIDE='fw.gs.hide';
 var SOON_VIEWS=[];
 function markSoon(){ SOON_VIEWS.forEach(function(v){ var els=document.querySelectorAll('.sidebar [data-view="'+v+'"]'); for(var i=0;i<els.length;i++){ if(els[i].querySelector('.nav__soon')) continue; var s=document.createElement('span'); s.className='nav__soon'; s.textContent='soon'; els[i].appendChild(s); } }); }
 function toggleQa(force){ var m=$('#qaMenu'); if(!m) return; var open=(force!==undefined)?force:m.hidden; if(open){ try{ toggleNoti(false); }catch(e){} window.__panelOpenedAt=Date.now(); } m.hidden=!open; var b=$('#qaBtn'); if(b){ b.classList.toggle('is-open',!!open); b.setAttribute('aria-expanded', String(!!open)); } }
 function updateBackupNote(){ var el=$('#lastBackupNote'); if(!el) return; var t=parseInt(Store.get('fw.lastExport','0'),10)||0; if(!t){ el.hidden=true; el.textContent=''; return; } var d=new Date(t); el.hidden=false; el.textContent='Last backup: '+d.getDate()+' '+MON[d.getMonth()]+' '+d.getFullYear(); }
 function gsSteps(){ var d=FD.data; return [
 {k:'family',t:'Name your family',d:!!String(Store.get('fw.family','')||'').trim()},
 {k:'member',t:'Add your people',d:d.members.length>0},
 {k:'event',t:'Plan something together',d:d.events.length>0},
 {k:'goal',t:'Set a first goal',d:d.goals.length>0},
 {k:'journal',t:'Write a journal entry',d:(d.journal.entries.length+d.journal.gratitude.length)>0}
 ]; }
 function renderGettingStarted(){
 var el=$('#gsCard'); if(!el) return;
 if(Store.get(GS_HIDE,'')){ el.innerHTML=''; return; }
 var steps=gsSteps(); var done=steps.filter(function(s){return s.d;}).length;
 if(done===steps.length){ Store.set(GS_HIDE,'1'); el.innerHTML=''; return; }
 var rows=steps.map(function(s){ return '<div class="gs__row'+(s.d?' is-done':'')+'"><span class="gs__chk">'+(s.d?'<svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>':'')+'</span><span class="gs__t">'+s.t+'</span>'+(s.d?'':'<button class="gs__go" data-gsgo="'+s.k+'">Go</button>')+'</div>'; }).join('');
 el.innerHTML='<section class="gs reveal"><div class="gs__head"><div><div class="gs__title">Getting started</div><div class="gs__sub">'+done+' of '+steps.length+' done, a two-minute setup</div></div><button class="gs__x" data-gsgo="hide" aria-label="Dismiss"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div><div class="gs__bar"><span style="width:'+Math.round(done/steps.length*100)+'%"></span></div>'+rows+'</section>';
 }

 /* ===================== COOKING ===================== */
 var CK_CATS=['Breakfast','Lunch','Dinner','Snack','Dessert','Drink','Other'];
 var CK_SLOTS=['breakfast','lunch','dinner'];
 var CK_ICO={
 rec:'<svg class="ico" viewBox="0 0 24 24"><path d="M7.2 3.8v6.4M4.8 3.8v3.4a2.4 2.4 0 0 0 4.8 0V3.8"/><path d="M7.2 10.2v10"/><path d="M16.2 3.8c-1.5 1.7-2 4.6-1 6.7.5 1 1.6 1.2 1.6 1.2v8.5"/></svg>',
 cal:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="14" rx="2.5"/><path d="M8 3.8V8M16 3.8V8M4 11h16"/></svg>',
 cart:'<svg class="ico" viewBox="0 0 24 24"><circle cx="9.6" cy="19.2" r="1.3"/><circle cx="16.9" cy="19.2" r="1.3"/><path d="M4 5h2.1l2.1 10a1.6 1.6 0 0 0 1.6 1.3h6.5a1.6 1.6 0 0 0 1.6-1.2L19.8 8H7"/></svg>',
 clock:'<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5"/><path d="M12 8v4.4l2.8 1.6"/></svg>',
 serve:'<svg class="ico" viewBox="0 0 24 24"><circle cx="9" cy="8.5" r="2.6"/><path d="M4.5 18.5c0-2.6 2-4.3 4.5-4.3s4.5 1.7 4.5 4.3"/><circle cx="16.5" cy="9.5" r="2.1"/><path d="M15.7 14.4c2.2.2 3.8 1.8 3.8 4.1"/></svg>',
 heart:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 20.3s-7-4.4-7-9.4A3.8 3.8 0 0 1 12 8.2a3.8 3.8 0 0 1 7 2.7c0 5-7 9.4-7 9.4Z"/></svg>',
 check:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
 plus:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>'
 };
 var ckSearch='', ckFilter='all', rOpen={}, ckWeekOff=0;
 function ckCap(s){ s=String(s||''); return s? s.charAt(0).toUpperCase()+s.slice(1):''; }
 function ckWeekDates(off){ var d=new Date(); d.setHours(12,0,0,0); var wd=(d.getDay()+6)%7; d.setDate(d.getDate()-wd+off*7); var out=[]; for(var i=0;i<7;i++){ out.push(d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())); d.setDate(d.getDate()+1); } return out; }
 function ckShort(ds){ var p=ds.split('-'); var dt=new Date(+p[0],+p[1]-1,+p[2]); return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dt.getDay()]+' '+dt.getDate()+' '+MON[dt.getMonth()]; }
 function recipeCard(r){
 var open=!!rOpen[r.id];
 var photo=r.photo?'<div class="rcard__photo"><img src="'+r.photo+'" alt=""></div>':'';
 var mb=[]; if(r.cat) mb.push('<span class="rmb">'+esc(r.cat)+'</span>'); if(r.time) mb.push('<span class="rmb">'+CK_ICO.clock+esc(String(r.time))+' min</span>'); if(r.serves) mb.push('<span class="rmb">'+CK_ICO.serve+'serves '+esc(String(r.serves))+'</span>');
 var det='';
 if(open){
 var ing=(r.ingredients||'').split('\n').map(function(t){return t.trim();}).filter(Boolean);
 det='<div class="rcard__det">'
 +(ing.length?'<div class="rcard__sect">Ingredients</div><ul class="ring">'+ing.map(function(t){return '<li>'+esc(t)+'</li>';}).join('')+'</ul>':'')
 +((r.steps||'').trim()?'<div class="rcard__sect">Steps</div><div class="rsteps">'+esc(r.steps).replace(/\n/g,'<br>')+'</div>':'')
 +'<div class="rcard__acts">'
 +(ing.length?'<button class="ckact" data-rshop="'+r.id+'">'+CK_ICO.cart+'Add to shopping</button>':'')
 +'<button class="ckact" data-redit="'+r.id+'">'+J_ICO.pen+'Edit</button>'
 +'<button class="ckact ckact--del" data-rdel="'+r.id+'"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>Delete</button></div>'
 +'</div>';
 }
 return '<article class="rcard">'+photo
 +'<div class="rcard__body"><div class="rcard__top"><div class="rcard__t">'+esc(r.name||'Recipe')+'</div>'
 +'<button class="rcard__fav'+(r.fav?' is-fav':'')+'" data-rfav="'+r.id+'" aria-label="Favourite">'+CK_ICO.heart+'</button></div>'
 +(mb.length?'<div class="rcard__meta">'+mb.join('')+'</div>':'')
 +det
 +'<button class="jentry__more" data-rexpand="'+r.id+'">'+(open?'Hide recipe':'View recipe')+'</button>'
 +'</div></article>';
 }
 function renderCookingRecipes(){
 var el=$('#ckRecipes'); if(!el) return;
 var arr=FD.data.cooking.recipes;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="recipe">'+CK_ICO.plus+'Add recipe</button></div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(CK_ICO.rec,'No recipes yet','Save the dishes your family loves, ingredients, steps and a photo, then plan meals and shop from them.',''); return; }
 var q=ckSearch.trim().toLowerCase();
 var list=arr.slice().filter(function(r){
 if(ckFilter==='fav'&&!r.fav) return false;
 if(ckFilter!=='all'&&ckFilter!=='fav'&&r.cat!==ckFilter) return false;
 if(q){ var hay=((r.name||'')+' '+(r.cat||'')+' '+(r.ingredients||'')).toLowerCase(); if(hay.indexOf(q)<0) return false; }
 return true;
 }).sort(function(a,b){ return ((b.fav?1:0)-(a.fav?1:0)) || String(a.name||'').localeCompare(String(b.name||'')); });
 var favN=arr.filter(function(r){return r.fav;}).length;
 var counts={}; arr.forEach(function(r){ if(r.cat) counts[r.cat]=(counts[r.cat]||0)+1; });
 var search='<div class="jsearch"><svg class="ico" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-3.8-3.8"/></svg><input id="ckSearchInput" type="search" placeholder="Search recipes\u2026" value="'+esc(ckSearch)+'"></div>';
 var chips='<div class="jfilter">'
 +'<button class="ckfchip'+(ckFilter==='all'?' is-on':'')+'" data-ckfilter="all">All <span>'+arr.length+'</span></button>'
 +(favN?'<button class="ckfchip'+(ckFilter==='fav'?' is-on':'')+'" data-ckfilter="fav">'+CK_ICO.heart+'Favourites <span>'+favN+'</span></button>':'')
 +CK_CATS.filter(function(c){return counts[c];}).map(function(c){ return '<button class="ckfchip'+(ckFilter===c?' is-on':'')+'" data-ckfilter="'+esc(c)+'">'+esc(c)+' <span>'+counts[c]+'</span></button>'; }).join('')
 +'</div>';
 var body=list.length?'<div class="cklist">'+list.map(recipeCard).join('')+'</div>':'<div class="docempty">No recipes match.</div>';
 el.innerHTML=add+search+chips+body;
 var si=$('#ckSearchInput'); if(si){ si.addEventListener('input',function(){ ckSearch=this.value; var pos=this.selectionStart; renderCookingRecipes(); var n=$('#ckSearchInput'); if(n){ n.focus(); try{ n.setSelectionRange(pos,pos); }catch(e){} } }); }
 }
 function mealChip(m){
 return '<div class="ckmeal"><span class="ckmeal__t">'+esc(m.title||'Meal')+'</span><span class="ckmeal__acts"><button class="ckmeal__b" data-mealedit="'+m.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-mealdel="'+m.id+'" aria-label="Delete"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></span></div>';
 }
 function renderCookingMeals(){
 var el=$('#ckMeals'); if(!el) return;
 var days=ckWeekDates(ckWeekOff), today=todayStr();
 var byKey={}; FD.data.cooking.meals.forEach(function(m){ var k=m.date+'|'+m.slot; (byKey[k]=byKey[k]||[]).push(m); });
 var p0=days[0].split('-'), p6=days[6].split('-');
 var lab=(+p0[2])+' '+MON[+p0[1]-1]+' \u2013 '+(+p6[2])+' '+MON[+p6[1]-1];
 var mid=(ckWeekOff===0)?'<span>This week</span>':(ckWeekOff===1?'<span>Next week</span>':(ckWeekOff===-1?'<span>Last week</span>':'<button class="ckwback" data-ckweek="today">Back to this week</button>'));
 var head='<div class="ckwnav"><button class="ckwbtn" data-ckweek="prev" aria-label="Previous week"><svg class="ico" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button><div class="ckwlab"><strong>'+lab+'</strong>'+mid+'</div><button class="ckwbtn" data-ckweek="next" aria-label="Next week"><svg class="ico" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button></div>';
 var grid='<div class="ckweek">'+days.map(function(ds){
 var isT=ds===today;
 var slots=CK_SLOTS.map(function(sl){
 var a2=byKey[ds+'|'+sl]||[];
 return '<div class="ckslot"><div class="ckslot__l">'+ckCap(sl)+'</div>'+a2.map(mealChip).join('')+'<button class="ckslot__add" data-mealadd data-date="'+ds+'" data-slot="'+sl+'">'+CK_ICO.plus+'Add</button></div>';
 }).join('');
 return '<section class="ckday'+(isT?' is-today':'')+'"><header class="ckday__h">'+ckShort(ds)+(isT?'<span class="ckday__now">Today</span>':'')+'</header>'+slots+'</section>';
 }).join('')+'</div>';
 el.innerHTML=head+grid;
 }
 function ckQuickAdd(){ var ni=$('#shopNewName'), nq=$('#shopNewQty'); if(!ni) return; var n=(ni.value||'').trim(); if(!n){ ni.focus(); return; } FD.addShopItem({name:n,qty:((nq&&nq.value)||'').trim(),done:false}); renderCookingShopping(); if($('#ckOverview')) renderCookingOverview(); var f=$('#shopNewName'); if(f) f.focus(); }
 function ckWireQuickAdd(){ ['shopNewName','shopNewQty'].forEach(function(id){ var x=document.getElementById(id); if(x){ x.addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); ckQuickAdd(); } }); } }); }
 function renderCookingShopping(){
 var el=$('#ckShopping'); if(!el) return;
 var arr=FD.data.cooking.shopping;
 var qadd='<div class="ckadd"><input id="shopNewName" type="text" placeholder="Add an item\u2026"><input id="shopNewQty" type="text" placeholder="Qty"><button class="btn btn--primary" data-shopadd="1">'+CK_ICO.plus+'Add</button></div>';
 if(!arr.length){ el.innerHTML=qadd+hEmpty(CK_ICO.cart,'Shopping list is empty','Add items above, or open a recipe and tap \u201cAdd to shopping\u201d to pull its ingredients in.',''); ckWireQuickAdd(); return; }
 var open=arr.filter(function(i){return !i.done;}), done=arr.filter(function(i){return i.done;});
 function row(i){ return '<div class="ckitem'+(i.done?' is-done':'')+'"><button class="ckitem__chk" data-shopdone="'+i.id+'" aria-label="Toggle bought">'+CK_ICO.check+'</button><div class="ckitem__main"><span class="ckitem__n">'+esc(i.name)+'</span>'+(i.qty?'<span class="ckitem__q">'+esc(i.qty)+'</span>':'')+'</div><button class="ckmeal__b" data-shopedit="'+i.id+'" aria-label="Edit">'+J_ICO.pen+'</button><button class="ckmeal__b ckmeal__b--del" data-shopdel="'+i.id+'" aria-label="Delete"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>'; }
 var html=qadd+'<div class="hsec-h">To buy \u00b7 '+open.length+'</div>';
 html+= open.length?'<div class="ckshop">'+open.map(row).join('')+'</div>':'<div class="docempty">Everything\u2019s bought, nice.</div>';
 if(done.length){ html+='<div class="hsec-h" style="margin-top:16px">In the basket \u00b7 '+done.length+'<button class="ckclear" data-shopclear="1">Clear</button></div><div class="ckshop">'+done.map(row).join('')+'</div>'; }
 el.innerHTML=html;
 ckWireQuickAdd();
 }
 function renderCookingOverview(){
 var el=$('#ckOverview'); if(!el) return;
 var C=FD.data.cooking, recipes=C.recipes, meals=C.meals, shop=C.shopping;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="recipe">'+CK_ICO.plus+'Add recipe</button><button class="btn btn--soft" data-modal="meal">'+CK_ICO.cal+'Plan a meal</button></div>';
 if(!recipes.length&&!meals.length&&!shop.length){ el.innerHTML=add+hEmpty(CK_ICO.rec,'Set up your kitchen','Save family recipes, plan the week\u2019s meals, and keep one shared shopping list, all in one place.',''); return; }
 var week=ckWeekDates(0); var weekSet={}; week.forEach(function(dd){weekSet[dd]=1;});
 var planned=meals.filter(function(m){return weekSet[m.date];}).length;
 var toBuy=shop.filter(function(i){return !i.done;}).length;
 var favN=recipes.filter(function(r){return r.fav;}).length;
 var stats='<div class="hstats">'+hStat('Recipes',recipes.length,CK_ICO.rec)+hStat('Favourites',favN,CK_ICO.heart)+hStat('This week',planned,CK_ICO.cal)+hStat('To buy',toBuy,CK_ICO.cart)+'</div>';
 var today=todayStr();
 var tms=meals.filter(function(m){return m.date===today;}).sort(function(a,b){return CK_SLOTS.indexOf(a.slot)-CK_SLOTS.indexOf(b.slot);});
 var todayCard='<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Today\u2019s meals</h3><button class="fcard__link" data-sub="cooking-meals">Meal plan</button></div>'
 +(tms.length?tms.map(function(m){ return '<div class="lrow"><span class="vrow__ic">'+CK_ICO.cal+'</span><div class="lrow__main"><div class="lrow__title">'+esc(m.title)+'</div><div class="lrow__sub">'+ckCap(m.slot)+'</div></div></div>'; }).join(''):'<div class="docempty">Nothing planned for today yet.</div>')
 +'</div>';
 var favs=recipes.filter(function(r){return r.fav;}).slice(0,4);
 var favCard=favs.length?'<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Family favourites</h3><button class="fcard__link" data-sub="cooking-recipes">All recipes</button></div>'+favs.map(function(r){ return '<button class="jrecent" data-rgo="'+r.id+'"><span class="vrow__ic">'+CK_ICO.heart+'</span><span class="jrecent__main"><span class="jrecent__t">'+esc(r.name)+'</span><span class="jrecent__s">'+esc(r.cat||'Recipe')+(r.time?' \u00b7 '+r.time+' min':'')+'</span></span><svg class="ico jrecent__chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>'; }).join('')+'</div>':'';
 var sPrev=shop.filter(function(i){return !i.done;}).slice(0,4);
 var shopCard=sPrev.length?'<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Shopping list</h3><button class="fcard__link" data-sub="cooking-shopping">Open list</button></div>'+sPrev.map(function(i){ return '<div class="lrow"><span class="vrow__ic">'+CK_ICO.cart+'</span><div class="lrow__main"><div class="lrow__title">'+esc(i.name)+'</div>'+(i.qty?'<div class="lrow__sub">'+esc(i.qty)+'</div>':'')+'</div></div>'; }).join('')+(toBuy>4?'<div class="lrow__sub" style="padding:8px 2px 0">+ '+(toBuy-4)+' more\u2026</div>':'')+'</div>':'';
 el.innerHTML=add+stats+todayCard+favCard+shopCard;
 }

 /* ===================== JOURNAL & MEMORIES ===================== */
 var JMOODS=[null,{v:1,label:'Tough',color:'#C75D66'},{v:2,label:'Low',color:'#D9803D'},{v:3,label:'Okay',color:'#C2A24A'},{v:4,label:'Good',color:'#4F9A78'},{v:5,label:'Great',color:'#2E86A8'}];
 var JMOOD_LABELS=['Not set','Tough','Low','Okay','Good','Great'];
 function moodMeta(v){ v=parseInt(v,10)||0; return (v>=1&&v<=5)?JMOODS[v]:null; }
 function journalWhoOpts(){ return ['Not set'].concat(FD.data.members.map(function(m){return m.name;})); }
 function jWho(val){ if(!val||val==='Not set') return ''; return esc(val); }
 var J_ICO={
 entry:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 4.5h11l3 3V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z"/><path d="M8 9.5h6M8 13h8M8 16.5h5"/></svg>',
 grat:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 20.3s-7-4.4-7-9.4A3.8 3.8 0 0 1 12 8.2a3.8 3.8 0 0 1 7 2.7c0 5-7 9.4-7 9.4Z"/></svg>',
 mile:'<svg class="ico" viewBox="0 0 24 24"><path d="M6 21V4.5"/><path d="M6 5.2h10.5l-2 3.3 2 3.3H6"/></svg>',
 pen:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.8-2.8L5 17.2V20Z"/><path d="M13.5 6.5l4 4"/></svg>',
 spark:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 3.5l2.2 5.1 5.3.4-4 3.5 1.2 5.2L12 20.4l-4.7 2.7 1.2-5.2-4-3.5 5.3-.4L12 3.5Z"/></svg>'
 };
 var jSearch='', jEntryFilter='all', jOpen={};
 function jDateLabel(ds){ if(!ds) return ''; var p=String(ds).split('-'); if(p.length<3) return ds; var dt=new Date(+p[0],+p[1]-1,+p[2]); if(isNaN(dt.getTime())) return ds; return dt.getDate()+' '+MON[dt.getMonth()]+' '+dt.getFullYear(); }
 function jStreak(entries){ var set={}; entries.forEach(function(e){ if(e.date) set[e.date]=true; }); var d=new Date(); var ds=d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate()); if(!set[ds]){ d.setDate(d.getDate()-1); } var streak=0; for(var i=0;i<730;i++){ var k=d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate()); if(set[k]){ streak++; d.setDate(d.getDate()-1); } else break; } return streak; }
 function jEntryCard(e){
 var mm=moodMeta(e.mood), who=jWho(e.member), open=!!jOpen[e.id];
 var raw=e.body||''; var longish=raw.length>260 || (raw.indexOf('\n')>=0 && raw.length>130);
 var bodyHTML = raw ? ('<div class="jentry__body'+(open||!longish?' is-open':'')+'">'+esc(raw).replace(/\n/g,'<br>')+'</div>'+(longish?'<button class="jentry__more" data-jexpand="'+e.id+'">'+(open?'Show less':'Read more')+'</button>':'')) : '';
 var tags = (e.tags&&e.tags.length) ? '<div class="jtags">'+e.tags.map(function(t){return '<span class="jtag">#'+esc(t)+'</span>';}).join('')+'</div>' : '';
 var photo = e.photo ? '<a class="jentry__photo" href="'+e.photo+'" target="_blank" rel="noopener"><img src="'+e.photo+'" alt=""></a>' : '';
 var metaBits=[jDateLabel(e.date)||'No date']; if(who) metaBits.push(who);
 var moodChip = mm ? '<span class="jmood" style="--mc:'+mm.color+'"><span class="jmood__dot"></span>'+mm.label+'</span>' : '';
 return '<article class="jentry">'
 +'<div class="jentry__head"><div class="jentry__hl"><div class="jentry__title">'+(e.title?esc(e.title):'<span class="jentry__untitled">Untitled entry</span>')+'</div><div class="jentry__meta">'+metaBits.join(' \u00b7 ')+'</div></div>'+moodChip+'</div>'
 +photo+bodyHTML+tags
 +'<div class="jentry__acts"><button class="jentry__act" data-jedit="'+e.id+'">'+J_ICO.pen+'Edit</button><button class="jentry__act jentry__act--del" data-jdel="'+e.id+'"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>Delete</button></div>'
 +'</article>';
 }
 function renderJournalEntries(){
 var el=$('#jEntries'); if(!el) return;
 var entries=FD.data.journal.entries;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="journalEntry"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>New entry</button></div>';
 if(!entries.length){ el.innerHTML=add+hEmpty(J_ICO.entry,'Your journal is empty','Write your first entry, a thought, a moment, how today felt. It stays private on this device.',''); return; }
 var q=jSearch.trim().toLowerCase();
 var list=entries.slice().filter(function(e){
 if(jEntryFilter!=='all' && String(e.mood)!==String(jEntryFilter)) return false;
 if(q){ var hay=((e.title||'')+' '+(e.body||'')+' '+(e.tags||[]).join(' ')).toLowerCase(); if(hay.indexOf(q)<0) return false; }
 return true;
 }).sort(function(a,b){ var c=String(b.date).localeCompare(String(a.date)); return c||(b.createdAt-a.createdAt); });
 var search='<div class="jsearch"><svg class="ico" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-3.8-3.8"/></svg><input id="jSearchInput" type="search" placeholder="Search entries\u2026" value="'+esc(jSearch)+'"></div>';
 var counts={}; entries.forEach(function(e){ counts[e.mood]=(counts[e.mood]||0)+1; });
 var chips='<div class="jfilter"><button class="jfchip'+(jEntryFilter==='all'?' is-on':'')+'" data-jfilter="all">All <span>'+entries.length+'</span></button>'+[5,4,3,2,1].filter(function(v){return counts[v];}).map(function(v){ var mm=JMOODS[v]; return '<button class="jfchip'+(String(jEntryFilter)===String(v)?' is-on':'')+'" data-jfilter="'+v+'" style="--mc:'+mm.color+'"><span class="jmood__dot"></span>'+mm.label+' <span>'+counts[v]+'</span></button>'; }).join('')+'</div>';
 var body = list.length ? '<div class="jlist">'+list.map(jEntryCard).join('')+'</div>' : '<div class="docempty">No entries match.</div>';
 el.innerHTML=add+search+chips+body;
 var si=$('#jSearchInput'); if(si){ si.addEventListener('input',function(){ jSearch=this.value; var pos=this.selectionStart; renderJournalEntries(); var n=$('#jSearchInput'); if(n){ n.focus(); try{ n.setSelectionRange(pos,pos); }catch(e){} } }); }
 }
 function gratCard(g){
 var who=jWho(g.member); var items=(g.items||[]).filter(function(t){return t;});
 var lis=items.map(function(t){ return '<li class="jgrat__item"><span class="jgrat__bullet">'+J_ICO.grat+'</span>'+esc(t)+'</li>'; }).join('');
 var meta=[jDateLabel(g.date)||'No date']; if(who) meta.push(who);
 return '<article class="jgcard"><div class="jgcard__head"><div class="jgcard__date">'+meta.join(' \u00b7 ')+'</div><div class="jgcard__acts"><button class="jentry__act" data-gratedit="'+g.id+'">'+J_ICO.pen+'</button><button class="jentry__act jentry__act--del" data-gratdel="'+g.id+'"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div></div><ul class="jgrat">'+lis+'</ul></article>';
 }
 function renderJournalGratitude(){
 var el=$('#jGratitude'); if(!el) return;
 var arr=FD.data.journal.gratitude;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="gratitude"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add gratitude</button></div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(J_ICO.grat,'Nothing logged yet','Each day, note a few things you are grateful for, a small habit that lifts the whole household.',''); return; }
 var sorted=arr.slice().sort(function(a,b){ var c=String(b.date).localeCompare(String(a.date)); return c||(b.createdAt-a.createdAt); });
 var totalItems=0; arr.forEach(function(g){ totalItems+=(g.items||[]).filter(function(t){return t;}).length; });
 var head='<div class="jghero"><span class="jghero__ic">'+J_ICO.grat+'</span><div><div class="jghero__n">'+totalItems+'</div><div class="jghero__l">things noted across '+arr.length+' '+(arr.length>1?'days':'day')+'</div></div></div>';
 el.innerHTML=add+head+'<div class="jglist">'+sorted.map(gratCard).join('')+'</div>';
 }
 function mileCard(m){
 var who=jWho(m.member);
 var photo=m.photo ? '<a class="jmile__photo" href="'+m.photo+'" target="_blank" rel="noopener"><img src="'+m.photo+'" alt=""></a>' : '<span class="jmile__photo jmile__photo--none">'+J_ICO.mile+'</span>';
 var meta=[jDateLabel(m.date)||'No date']; if(who) meta.push(who);
 return '<article class="jmile">'+photo+'<div class="jmile__main"><div class="jmile__top"><div class="jmile__title">'+esc(m.title||'Milestone')+'</div><div class="jmile__acts"><button class="jentry__act" data-msedit="'+m.id+'">'+J_ICO.pen+'</button><button class="jentry__act jentry__act--del" data-msdel="'+m.id+'"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div></div><div class="jmile__meta">'+meta.join(' \u00b7 ')+'</div>'+(m.note?'<div class="jmile__note">'+esc(m.note).replace(/\n/g,'<br>')+'</div>':'')+'</div></article>';
 }
 function renderJournalMilestones(){
 var el=$('#jMilestones'); if(!el) return;
 var arr=FD.data.journal.milestones;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="milestone"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add milestone</button></div>';
 if(!arr.length){ el.innerHTML=add+hEmpty(J_ICO.mile,'No milestones yet','Capture the moments that matter, first steps, achievements, anniversaries, with a date and a photo.',''); return; }
 var sorted=arr.slice().sort(function(a,b){ var c=String(b.date).localeCompare(String(a.date)); return c||(b.createdAt-a.createdAt); });
 el.innerHTML=add+'<div class="hsec-h">Milestones \u00b7 '+arr.length+'</div><div class="jmlist">'+sorted.map(mileCard).join('')+'</div>';
 }
 function renderJournalOverview(){
 var el=$('#jOverview'); if(!el) return;
 var J=FD.data.journal, entries=J.entries, miles=J.milestones, grats=J.gratitude;
 var add='<div class="happt-top"><button class="btn btn--primary" data-modal="journalEntry"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>New entry</button></div>';
 if(!entries.length && !miles.length && !grats.length){ el.innerHTML=add+hEmpty(J_ICO.entry,'Start your journal','Write entries, log daily gratitude, and save life\u2019s milestones, all gathered here in one calm, private place.','<button class="btn btn--soft" data-modal="milestone" style="margin-top:4px">Add a milestone</button>'); return; }
 var nowYM=curYM(); var monthCount=entries.filter(function(e){ return (e.date||'').slice(0,7)===nowYM; }).length;
 var stats='<div class="hstats">'+hStat('Entries',entries.length,J_ICO.entry)+hStat('This month',monthCount,J_ICO.pen)+hStat('Day streak',jStreak(entries),J_ICO.spark)+hStat('Milestones',miles.length,J_ICO.mile)+'</div>';
 var moodEntries=entries.filter(function(e){return e.mood;}).slice().sort(function(a,b){ var c=String(a.date).localeCompare(String(b.date)); return c||(a.createdAt-b.createdAt); }).slice(-14);
 var moodCard='';
 if(moodEntries.length>=2){ var bars=moodEntries.map(function(e){ var mm=moodMeta(e.mood); return '<span class="jmbar" title="'+(mm?mm.label:'')+'"><span class="jmbar__fill" style="height:'+Math.round(e.mood/5*100)+'%;background:'+(mm?mm.color:'#999')+'"></span></span>'; }).join(''); var avg=Math.round(moodEntries.reduce(function(a,e){return a+e.mood;},0)/moodEntries.length*10)/10; moodCard='<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Recent mood</h3><span class="jmavg">avg '+avg+' / 5</span></div><div class="jmbars">'+bars+'</div></div>'; }
 var today=new Date(); var md=p2(today.getMonth()+1)+'-'+p2(today.getDate()); var yr=String(today.getFullYear());
 var ond=[];
 entries.forEach(function(e){ if((e.date||'').slice(5)===md && (e.date||'').slice(0,4)!==yr) ond.push({t:'entry',date:e.date,title:e.title||'Journal entry'}); });
 miles.forEach(function(m){ if((m.date||'').slice(5)===md && (m.date||'').slice(0,4)!==yr) ond.push({t:'mile',date:m.date,title:m.title||'Milestone'}); });
 ond.sort(function(a,b){return String(b.date).localeCompare(String(a.date));});
 var ondCard = ond.length ? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">On this day</h3></div>'+ond.map(function(o){ return '<div class="lrow"><span class="vrow__ic">'+(o.t==='mile'?J_ICO.mile:J_ICO.entry)+'</span><div class="lrow__main"><div class="lrow__title">'+esc(o.title)+'</div><div class="lrow__sub">'+jDateLabel(o.date)+'</div></div></div>'; }).join('')+'</div>' : '';
 var recent=entries.slice().sort(function(a,b){ var c=String(b.date).localeCompare(String(a.date)); return c||(b.createdAt-a.createdAt); }).slice(0,3);
 var recentCard = recent.length ? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Latest entries</h3><button class="fcard__link" data-sub="journal-entries">All entries</button></div>'+recent.map(function(e){ var mm=moodMeta(e.mood); var snip=(e.body||'').replace(/\s+/g,' ').slice(0,90); return '<button class="jrecent" data-jgo="'+e.id+'"><span class="jrecent__dot'+(mm?'':' jrecent__dot--none')+'"'+(mm?' style="background:'+mm.color+'"':'')+'></span><span class="jrecent__main"><span class="jrecent__t">'+(e.title?esc(e.title):'Untitled')+'</span><span class="jrecent__s">'+(snip?esc(snip)+((e.body||'').length>90?'\u2026':''):jDateLabel(e.date))+'</span></span><svg class="ico jrecent__chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>'; }).join('')+'</div>' : '';
 el.innerHTML=add+stats+moodCard+ondCard+recentCard;
 }

 /* ===================== UNDO for deletions (all spaces) ===================== */
 var _undoTimer=null, _undoReady=false;
 function wrapRemoves(){
 Object.keys(FD).forEach(function(k){
 if(typeof FD[k]==='function' && /^remove/.test(k)){
 var orig=FD[k];
 FD[k]=function(){
 try{ FD._undoSnap=JSON.stringify(FD.data); }catch(e){ FD._undoSnap=null; }
 var r=orig.apply(FD,arguments);
 if(_undoReady) showUndo();
 return r;
 };
 }
 });
 }
 function showUndo(){
 var t=document.getElementById('undoToast'); if(!t) return;
 t.hidden=false; t.classList.add('is-on');
 clearTimeout(_undoTimer); _undoTimer=setTimeout(hideUndo, 6000);
 }
 function hideUndo(){ var t=document.getElementById('undoToast'); if(t){ t.classList.remove('is-on'); t.hidden=true; } }
 function undoLastDelete(){
 if(FD._undoSnap){
 try{ FD.data=JSON.parse(FD._undoSnap); FD._undoSnap=null; FD.save(); refreshAll(); if(typeof flash==='function') flash('Restored'); }catch(e){}
 }
 hideUndo();
 }

 /* ===================== NOTIFICATION CENTER (all 15 spaces) ===================== */
 var NOTI_ICO = {
 task:'<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.5 12.2l2.4 2.4 4.6-5"/>',
 chore:'<path d="M4.5 6.2l1.5 1.5 2.5-3"/><path d="M11.5 6.5H20"/><path d="M4.5 12.2l1.5 1.5 2.5-3"/><path d="M11.5 12.5H20"/><path d="M4.5 18.2l1.5 1.5 2.5-3"/><path d="M11.5 18.5H20"/>',
 wrench:'<path d="M14.8 6.2a4.1 4.1 0 0 0-5.5 5.1L4 16.6V20h3.4l5.3-5.3a4.1 4.1 0 0 0 5.1-5.5l-2.7 2.7-2.2-.5-.5-2.2 2.4-3Z"/>',
 box:'<path d="M4 8l8-4 8 4v8l-8 4-8-4V8Z"/><path d="M4 8l8 4 8-4M12 12v8"/>',
 health:'<path d="M12 20s-7-4.25-7-9.1C5 8.2 6.75 6.6 9 6.6c1.45 0 2.65.72 3 1.8.35-1.08 1.55-1.8 3-1.8 2.25 0 4 1.6 4 4.3 0 4.85-7 9.1-7 9.1Z"/><path d="M12 10.4v3.5M10.25 12.15h3.5"/>',
 cake:'<path d="M4.5 20.5h15"/><path d="M6 20.5V13a1.8 1.8 0 0 1 1.8-1.8h8.4A1.8 1.8 0 0 1 18 13v7.5"/><path d="M6 15.4c1 0 1.2.9 2.4.9s1.4-.9 2.4-.9 1.2.9 2.4.9 1.4-.9 2.4-.9 1.2.9 1.8.9"/><path d="M9 11.2V8.6M12 11.2V8.6M15 11.2V8.6"/>',
 calendar:'<rect x="4" y="6" width="16" height="14" rx="2.5"/><path d="M8 3.8V8M16 3.8V8M4 11h16"/>',
 bill:'<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v4h-4"/><path d="M12 8v4.5l3 1.7"/>',
 water:'<path d="M12 3.5S6 10 6 14a6 6 0 0 0 12 0c0-4-6-10.5-6-10.5Z"/>',
 heart:'<path d="M12 20.3s-7-4.4-7-9.4A3.8 3.8 0 0 1 12 8.2a3.8 3.8 0 0 1 7 2.7c0 5-7 9.4-7 9.4Z"/>',
 capsule:'<path d="M7 4h10M7 20h10M8 4c0 4 3.2 4.6 3.2 8S8 16 8 20M16 4c0 4-3.2 4.6-3.2 8s3.2 4 3.2 8"/>',
 plane:'<path d="M10.5 20.5 9 14.8 3.8 13l16-8.5-4.6 15.7-4.7-2.2Z"/><path d="M9 14.8l10.6-9.9"/>',
 pen:'<path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.8-2.8L5 17.2V20Z"/><path d="M13.5 6.5l4 4"/>',
 cart:'<circle cx="9.6" cy="19.2" r="1.3"/><circle cx="16.9" cy="19.2" r="1.3"/><path d="M4 5h2.1l2.1 10a1.6 1.6 0 0 0 1.6 1.3h6.5a1.6 1.6 0 0 0 1.6-1.2L19.8 8H7"/>',
 leaf:'<path d="M12 21v-8"/><path d="M12 13c0-2.8 2-4.8 4.8-4.8 0 2.8-2 4.8-4.8 4.8Z"/><path d="M12 14.5c0-2.4-1.8-4.2-4.4-4.2 0 2.4 1.8 4.2 4.4 4.2Z"/>',
 bell:'<path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.4 5.5 1.4 5.5H4.6S6 13.5 6 9.5Z"/><path d="M10 18.5a2 2 0 0 0 4 0"/>',
 user:'<circle cx="12" cy="8.2" r="3.6"/><path d="M5 19.5c1.2-3.4 3.9-5 7-5s5.8 1.6 7 5"/>',
 book:'<path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15.5H7.5A2.5 2.5 0 0 0 5 21V5.5Z"/><path d="M5 18.5A2.5 2.5 0 0 1 7.5 16H19"/>',
 star:'<path d="M12 3.6l2.5 5.1 5.6.8-4 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4-4 5.6-.8L12 3.6Z"/>',
 food:'<path d="M7 3.5v5.5a2.5 2.5 0 0 0 5 0V3.5M9.5 3.5v17"/><path d="M16.5 3.5c1.8 1.1 2.6 3.1 2.6 5.6 0 2-1 3.2-2.6 3.2v8.2"/>',
 photo:'<rect x="4" y="5.5" width="16" height="13" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="M4.5 16l4.5-4 3.5 3 3-2.5 4 3.5"/>',
 doc:'<path d="M7 3.5h7l4 4v13H7z"/><path d="M14 3.5V8h4"/>',
 go:'<path d="M5 12h13M12.5 6.5 18 12l-5.5 5.5"/>'
 };

 function notiBdayDays(dob){
 if(!dob) return null;
 var p=String(dob).split('-'); if(p.length<3) return null;
 var mo=+p[1], da=+p[2]; if(!mo||!da) return null;
 var now=new Date(); now.setHours(0,0,0,0); var y=now.getFullYear();
 var nx=new Date(y,mo-1,da); nx.setHours(0,0,0,0);
 if(nx<now) nx=new Date(y+1,mo-1,da);
 return Math.round((nx-now)/86400000);
 }

 function buildNotifications(){
 var D=(FD&&FD.data)||{}, out=[], t=todayStr();
 function dU(d){ if(!d) return null; try{ var n=daysUntil(d); return (typeof n==='number'&&!isNaN(n))?n:null; }catch(e){ return null; } }
 function add(sp,ico,cvar,sev,title,sub,go){ if(typeof spOn==='function' && !spOn(sp)) return; out.push({sp:sp,ico:ico,c:cvar,sev:sev,t:title,s:sub,go:go||sp}); }

 /* Planning, overdue / due today */
 try{
 var tk=(D.planning&&D.planning.tasks)||[], ov=0, td=0;
 tk.forEach(function(x){ if(x.done) return; var n=dU(x.due); if(n===null) return; if(n<0) ov++; else if(n===0) td++; });
 if(ov) add('planning','task','--m-planning','urgent',ov+(ov>1?' tasks overdue':' task overdue'),'Planning · needs you','planning:tasks');
 if(td) add('planning','task','--m-planning','today',td+(td>1?' tasks due today':' task due today'),'Planning','planning:tasks');
 }catch(e){}

 /* Home Management, chores / maintenance / supplies */
 try{
 var H=D.homemgmt||{}, cd=0;
 (H.chores||[]).forEach(function(c){ try{ if(!c.done && choreDue(c)) cd++; }catch(e){} });
 if(cd) add('homemgmt','chore','--m-homemgmt','today',cd+(cd>1?' chores due':' chore due'),'Home · chores','homemgmt:chores');
 var mo=0; (H.maintenance||[]).forEach(function(m){ if(m.done) return; var n=dU(m.due||m.date); if(n!==null&&n<0) mo++; });
 if(mo) add('homemgmt','wrench','--m-homemgmt','urgent',mo+(mo>1?' maintenance tasks overdue':' maintenance task overdue'),'Home · upkeep','homemgmt:maintenance');
 var so=0, lo=0; (H.supplies||[]).forEach(function(s){ if(s.status==='out') so++; else if(s.status==='low') lo++; });
 if(so) add('homemgmt','box','--m-homemgmt','urgent',so+(so>1?' supplies out of stock':' supply out of stock'),'Home · restock','homemgmt:supplies');
 else if(lo) add('homemgmt','box','--m-homemgmt','soon',lo+(lo>1?' supplies running low':' supply running low'),'Home · restock soon','homemgmt:supplies');
 }catch(e){}

 /* Health, appointments today / soon */
 try{
 var at=0, as=0;
 (D.events||[]).forEach(function(e){ if(e.kind!=='appointment'||e.completed||e.status==='cancelled') return; var n=dU(e.date); if(n===null) return; if(n===0) at++; else if(n>0&&n<=3) as++; });
 if(at) add('health','health','--m-health','today',at+(at>1?' appointments today':' appointment today'),'Health','health:appointments');
 if(as) add('health','health','--m-health','soon',as+(as>1?' appointments coming up':' appointment coming up'),'Health · next 3 days','health:appointments');
 }catch(e){}

 /* Family, birthdays soon / events today */
 try{
 var bs=0, bt=0;
 (D.members||[]).forEach(function(m){ var n=notiBdayDays(m.dob||m.birthday||m.birthdate); if(n===null) return; if(n===0) bt++; else if(n>0&&n<=7) bs++; });
 if(bt) add('family','cake','--m-family','today',bt+(bt>1?' birthdays today':' birthday today')+' 🎂','Family','family:members');
 if(bs) add('family','cake','--m-family','soon',bs+(bs>1?' birthdays this week':' birthday this week'),'Family · coming up','family:members');
 var et=0;
 (D.events||[]).forEach(function(e){ if(e.kind==='appointment'||e.completed) return; var n=dU(e.date); if(n===0) et++; });
 if(et) add('family','calendar','--m-family','today',et+(et>1?' events today':' event today'),'Family · calendar','family:calendar');
 }catch(e){}

 /* Finance, planned bills overdue / today / soon */
 try{
 var bo=0, bd=0, bn=0;
 ((D.finance&&D.finance.planned)||[]).forEach(function(p){ if(!p.active) return; var n=dU(p.nextDue); if(n===null) return; if(n<0) bo++; else if(n===0) bd++; else if(n<=5) bn++; });
 if(bo) add('finance','bill','--m-finance','urgent',bo+(bo>1?' bills overdue':' bill overdue'),'Finance · payments','finance:planned');
 if(bd) add('finance','bill','--m-finance','today',bd+(bd>1?' bills due today':' bill due today'),'Finance','finance:planned');
 if(bn) add('finance','bill','--m-finance','soon',bn+(bn>1?' bills due soon':' bill due soon'),'Finance · next 5 days','finance:planned');
 }catch(e){}

 /* Travel, trip starting within a week */
 try{
 var near=null;
 ((D.travel&&D.travel.trips)||[]).forEach(function(tr){ var n=dU(tr.startDate||tr.start||tr.date||tr.from); if(n!==null&&n>=0&&n<=7&&(near===null||n<near)) near=n; });
 if(near!==null) add('travel','plane','--m-travel','soon',near===0?'A trip begins today ✈️':('A trip in '+near+(near>1?' days':' day')),'Travel','travel:trips');
 }catch(e){}

 /* Memory, time capsule opening today / soon */
 try{
 var caps=(D.memory&&(D.memory.capsules||D.memory.timeCapsules))||[], ct=0, cs=0;
 caps.forEach(function(c){ var n=dU(c.openOn||c.openDate||c.opensOn); if(n===null) return; if(n===0) ct++; else if(n>0&&n<=3) cs++; });
 if(ct) add('memory','capsule','--m-memory','today',ct+(ct>1?' time capsules open today':' time capsule opens today'),'Memory Vault','memory:capsule');
 if(cs) add('memory','capsule','--m-memory','soon',cs+(cs>1?' capsules opening soon':' capsule opening soon'),'Memory Vault','memory:capsule');
 }catch(e){}

 /* Relationship, special dates (ONLY when unlocked, for privacy) */
 try{
 if(typeof rlUnlocked!=='undefined' && rlUnlocked){
 var rt=0, rs=0;
 ((D.relationship&&D.relationship.dates)||[]).forEach(function(d){ var n=notiBdayDays(d.date||d.on); if(n===null) return; if(n===0) rt++; else if(n>0&&n<=7) rs++; });
 if(rt) add('relationship','heart','--m-relationship','today',rt+(rt>1?' special dates today':' special date today')+' 💗','Just the two of you','relationship:dates');
 if(rs) add('relationship','heart','--m-relationship','soon',rs+(rs>1?' special dates this week':' special date this week'),'Coming up','relationship:dates');
 }
 }catch(e){}

 /* Nutrition, water not logged yet today (gentle) */
 try{
 var wt=ntWaterToday(); if(typeof wt==='number' && wt===0 && (D.members||[]).length) add('nutrition','water','--m-nutrition','soon','No water logged yet today','Nutrition · a gentle reminder','nutrition:water');
 }catch(e){}

 /* Wellbeing, daily check-in pending (only if they use it) */
 try{
 var chk=(D.wellbeing&&D.wellbeing.checkins)||[];
 if(chk.length){ var hasToday=chk.some(function(c){ return String(c.date||'').slice(0,10)===t; }); if(!hasToday) add('wellbeing','leaf','--m-wellbeing','soon','Today\u2019s check-in is waiting','Wellbeing','wellbeing:checkins'); }
 }catch(e){}

 /* Cooking, items waiting on the shopping list (gentle) */
 try{
 var sh=(D.cooking&&D.cooking.shopping)||[], un=sh.filter(function(i){ return !i.done&&!i.checked; }).length;
 if(un) add('cooking','cart','--m-cooking','soon',un+(un>1?' items on your shopping list':' item on your shopping list'),'Cooking','cooking:shopping');
 }catch(e){}

 /* Journal, a gentle nudge to reflect (only for active journalers) */
 try{
 var ents=(D.journal&&D.journal.entries)||[];
 if(ents.length>=3){ var todayHas=ents.some(function(e){ return String(e.date||e.createdAt||'').slice(0,10)===t; }); if(!todayHas) add('journal','pen','--m-journal','soon','A quiet day, write a line?','Journal','journal:entries'); }
 }catch(e){}

 var W={urgent:0,today:1,soon:2};
 out.sort(function(a,b){ return (W[a.sev]-W[b.sev]); });
 return out;
 }

 function renderNotifications(){
 var body=document.getElementById('notiBody'); if(!body) return;
 var list=buildNotifications();
 var prio=list.filter(function(a){ return a.sev==='urgent'||a.sev==='today'; });
 var soon=list.filter(function(a){ return a.sev==='soon'; });

 var badge=document.getElementById('notiBadge');
 if(badge){ if(prio.length){ badge.textContent=prio.length>9?'9+':String(prio.length); badge.hidden=false; } else { badge.hidden=true; } }
 var hsub=document.getElementById('notiHsub');
 if(hsub) hsub.textContent = list.length ? (prio.length? (prio.length+' need'+(prio.length>1?'':'s')+' attention') : 'You\u2019re on track') : 'All clear';

 var keyHash=list.map(function(a){ return a.sp+'|'+a.sev+'|'+a.t; }).join(';');
 window.__notiHash=keyHash;
 var btn=document.getElementById('notiBtn');
 var seen=Store.get('fw.noti.seen','');
 if(btn) btn.classList.toggle('has-unseen', !!list.length && keyHash!==seen);

 function rows(arr){ return arr.map(function(a){
 var ic=NOTI_ICO[a.ico]||NOTI_ICO.bell;
 var sc=a.sev==='urgent'?' noti__row--urgent':(a.sev==='today'?' noti__row--today':'');
 return '<button class="noti__row'+sc+'" data-notirow data-goto="'+esc(a.go||a.sp)+'" style="--mc:var('+a.c+')">'
 +'<span class="noti__ic"><svg class="ico" viewBox="0 0 24 24">'+ic+'</svg></span>'
 +'<span class="noti__tx"><span class="noti__t">'+esc(a.t)+'</span><span class="noti__s">'+esc(a.s||'')+'</span></span>'
 +'<svg class="ico noti__chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>';
 }).join(''); }

 var html='';
 if(!list.length){
 html='<div class="noti__empty"><span class="noti__emptyic"><svg class="ico" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></span><p class="noti__emptyt">You\u2019re all caught up</p><p class="noti__emptys">Nothing needs your attention right now.</p></div>';
 } else {
 if(prio.length) html+='<div class="noti__grp">Needs attention</div>'+rows(prio);
 if(soon.length) html+='<div class="noti__grp">Coming up</div>'+rows(soon);
 }
 body.innerHTML=html;

 /* per-space dots on the sidebar */
 try{
 var counts={};
 prio.forEach(function(a){ counts[a.sp]=(counts[a.sp]||0)+1; });
 $$('.nav__item[data-view]').forEach(function(it){
 var v=it.getAttribute('data-view'), dot=it.querySelector('.nav__dot');
 if(counts[v]){ if(!dot){ dot=document.createElement('span'); dot.className='nav__dot'; it.appendChild(dot); } }
 else if(dot){ dot.remove(); }
 });
 }catch(e){}
 }

 function toggleNoti(force){
 var p=document.getElementById('notiPanel'); if(!p) return;
 var open=(force!==undefined)?force:p.hidden;
 if(open){ try{ toggleQa(false); }catch(e){} window.__panelOpenedAt=Date.now(); }
 p.hidden=!open;
 var b=document.getElementById('notiBtn'); if(b){ b.classList.toggle('is-open',!!open); b.setAttribute('aria-expanded', String(!!open)); }
 if(open){ Store.set('fw.noti.seen', window.__notiHash||''); if(b) b.classList.remove('has-unseen'); }
 }

 /* ===================== GLOBAL SEARCH (Ctrl+K) ===================== */
 var SRCH_LABEL={home:'Home',dashboard:'Home',family:'Family',health:'Health',finance:'Finance',learning:'Learning',journal:'Journal',travel:'Travel',relationship:'Relationship',planning:'Planning',memory:'Memory Vault',fitness:'Fitness',nutrition:'Nutrition',cooking:'Cooking',homemgmt:'Home Care',wellbeing:'Wellbeing',legacy:'Legacy',settings:'Settings',ai:'Wisal AI'};
 var SRCH_ACC={home:'--brand',dashboard:'--m-dashboard',settings:'--brand',ai:'--m-ai',family:'--m-family',health:'--m-health',finance:'--m-finance',learning:'--m-learning',journal:'--m-journal',travel:'--m-travel',relationship:'--m-relationship',planning:'--m-planning',memory:'--m-memory',fitness:'--m-fitness',nutrition:'--m-nutrition',cooking:'--m-cooking',homemgmt:'--m-homemgmt',wellbeing:'--m-wellbeing',legacy:'--m-legacy'};
 var SRCH_ORDER=['family','planning','health','finance','journal','cooking','homemgmt','travel','learning','fitness','nutrition','memory','wellbeing','legacy','relationship'];
 function srchLabelOf(o){ var f=['title','name','text','destination','word','item'],i; for(i=0;i<f.length;i++){ if(o && typeof o[f[i]]==='string' && o[f[i]].trim()) return o[f[i]].trim(); } return ''; }
 function buildSearchIndex(){
 var D=(FD&&FD.data)||{}, ix=[];
 function push(arr,sp,sub,ico,kind){ (arr||[]).forEach(function(o){ var t=srchLabelOf(o); if(!t) return; ix.push({t:t.length>64?t.slice(0,63)+'\u2026':t,s:kind+' \u00b7 '+SRCH_LABEL[sp],go:sub?sp+':'+sub:sp,sp:sp,ico:ico,c:SRCH_ACC[sp]}); }); }
 push(D.members,'family','members','user','Member');
 push((D.events||[]).filter(function(e){return e.kind!=='appointment';}),'family','calendar','calendar','Event');
 push((D.events||[]).filter(function(e){return e.kind==='appointment';}),'health','appointments','health','Appointment');
 push(D.goals,'family','goals','star','Goal');
 push(D.documents,'family','documents','doc','Document');
 push(D.planning&&D.planning.tasks,'planning','tasks','task','Task');
 push(D.planning&&D.planning.projects,'planning','projects','star','Project');
 push(D.journal&&D.journal.entries,'journal','entries','pen','Entry');
 push(D.journal&&D.journal.milestones,'journal','milestones','star','Milestone');
 push(D.cooking&&D.cooking.recipes,'cooking','recipes','food','Recipe');
 push(D.cooking&&D.cooking.shopping,'cooking','shopping','cart','Shopping');
 push(D.travel&&D.travel.trips,'travel','trips','plane','Trip');
 push(D.travel&&D.travel.ideas,'travel','bucket','star','Idea');
 push(D.finance&&D.finance.planned,'finance','planned','bill','Bill');
 push(D.finance&&D.finance.debts,'finance','debts','bill','Debt');
 push(D.finance&&D.finance.savings,'finance','savings','star','Saving');
 push(D.finance&&D.finance.transactions,'finance','transactions','bill','Transaction');
 push(D.learning&&D.learning.courses,'learning','courses','book','Course');
 push(D.learning&&D.learning.books,'learning','books','book','Book');
 push(D.learning&&D.learning.skills,'learning','skills','star','Skill');
 push(D.homemgmt&&D.homemgmt.chores,'homemgmt','chores','chore','Chore');
 push(D.homemgmt&&D.homemgmt.maintenance,'homemgmt','maintenance','wrench','Maintenance');
 push(D.homemgmt&&D.homemgmt.supplies,'homemgmt','supplies','box','Supply');
 push(D.fitness&&D.fitness.goals,'fitness','goals','task','Goal');
 push(D.fitness&&D.fitness.routines,'fitness','routines','star','Routine');
 push(D.nutrition&&D.nutrition.habits,'nutrition','habits','leaf','Habit');
 push(D.memory&&D.memory.albums,'memory','albums','photo','Album');
 push(D.memory&&D.memory.stories,'memory','stories','pen','Story');
 push(D.memory&&D.memory.capsules,'memory','capsule','capsule','Capsule');
 push(D.wellbeing&&D.wellbeing.selfcare,'wellbeing','selfcare','leaf','Self-care');
 push(D.wellbeing&&D.wellbeing.growth,'wellbeing','growth','star','Reflection');
 push(D.legacy&&D.legacy.duas,'legacy','duas','star','Du\u2019a');
 push(D.legacy&&D.legacy.deeds,'legacy','deeds','heart','Deed');
 push(D.legacy&&D.legacy.wisdom,'legacy','wisdom','pen','Wisdom');
 if(typeof rlUnlocked!=='undefined' && rlUnlocked && D.relationship){
 push(D.relationship.notes,'relationship','notes','heart','Note');
 push(D.relationship.dates,'relationship','dates','heart','Date');
 push(D.relationship.plans,'relationship','plans','heart','Plan');
 }
 return ix;
 }
 var _srchIdx=[], _srchN=0, _srchSel=-1;
 function srchRowHTML(o,idx){
 var ic=NOTI_ICO[o.ico]||NOTI_ICO.bell;
 return '<button class="noti__row" data-srchrow data-idx="'+idx+'" data-goto="'+esc(o.go)+'" style="--mc:var('+o.c+')">'
 +'<span class="noti__ic"><svg class="ico" viewBox="0 0 24 24">'+ic+'</svg></span>'
 +'<span class="noti__tx"><span class="noti__t">'+esc(o.t)+'</span><span class="noti__s">'+esc(o.s||'')+'</span></span>'
 +'<svg class="ico noti__chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>';
 }
 function renderSearch(q){
 var body=document.getElementById('srchBody'); if(!body) return;
 q=String(q||'').trim().toLowerCase(); _srchSel=-1; var n=0, html='';
 var cmds=[]; Object.keys(SRCH_LABEL).forEach(function(v){ var L=SRCH_LABEL[v]; if(v!=='home'&&v!=='dashboard'&&v!=='settings'&&typeof spOn==='function'&&!spOn(v)) return; if(!q || L.toLowerCase().indexOf(q)>=0) cmds.push({t:'Go to '+L,s:'Navigate',go:v,ico:'go',c:SRCH_ACC[v]||'--brand'}); });
 if(!q){
 html+='<div class="noti__grp">Jump to</div>';
 cmds.forEach(function(c){ html+=srchRowHTML(c,n++); });
 } else {
 var hits=_srchIdx.filter(function(o){ return o.t.toLowerCase().indexOf(q)>=0; });
 if(cmds.length){ html+='<div class="noti__grp">Navigate</div>'; cmds.slice(0,3).forEach(function(c){ html+=srchRowHTML(c,n++); }); }
 if(hits.length){
 SRCH_ORDER.forEach(function(sp){
 var g=hits.filter(function(o){ return o.sp===sp; }).slice(0,5);
 if(!g.length) return;
 html+='<div class="noti__grp">'+esc(SRCH_LABEL[sp])+'</div>';
 g.forEach(function(o){ if(n<40) html+=srchRowHTML(o,n++); });
 });
 } else {
 html+='<div class="srch__none">No matches for \u201c'+esc(q)+'\u201d</div>';
 }
 }
 _srchN=n; body.innerHTML=html;
 }
 function srchPaintSel(){
 var body=document.getElementById('srchBody'); if(!body||!body.querySelectorAll) return;
 var rows=body.querySelectorAll('[data-srchrow]');
 for(var i=0;i<rows.length;i++){ rows[i].classList.toggle('is-sel', i===_srchSel); }
 if(_srchSel>=0 && rows[_srchSel] && rows[_srchSel].scrollIntoView) rows[_srchSel].scrollIntoView({block:'nearest'});
 }
 function openSearch(){
 var s=document.getElementById('srch'); if(!s) return;
 try{ toggleQa(false); toggleNoti(false); }catch(e){}
 _srchIdx=buildSearchIndex();
 s.hidden=false; s.classList.add('is-on'); window.__panelOpenedAt=Date.now();
 var i=document.getElementById('srchInput');
 if(i){ i.value=''; renderSearch(''); setTimeout(function(){ try{ i.focus(); }catch(e){} },30); }
 }
 function closeSearch(){
 var s=document.getElementById('srch'); if(s){ s.classList.remove('is-on'); s.hidden=true; }
 _srchSel=-1;
 var b=document.getElementById('srchBtn'); if(b&&b.focus){ try{ b.focus(); }catch(e){} }
 }
 function srchActivate(row){
 var g=row&&row.getAttribute? row.getAttribute('data-goto'):null;
 closeSearch();
 if(g){ var p=g.split(':'); navigate(p[0]); if(p[1]) navigateSub(p[0],p[1]); }
 }
 document.addEventListener('keydown', function(e){
 if((e.ctrlKey||e.metaKey) && (e.key==='k'||e.key==='K')){ e.preventDefault(); var s=document.getElementById('srch'); if(s&&s.classList.contains('is-on')){ closeSearch(); } else { openSearch(); } return; }
 var s2=document.getElementById('srch');
 var srchOpen=!!(s2&&s2.classList&&s2.classList.contains&&s2.classList.contains('is-on'));
 if(e.key==='Escape'){
 if(srchOpen){ closeSearch(); return; }
 var np=document.getElementById('notiPanel'); if(np&&!np.hidden){ toggleNoti(false); var nb=document.getElementById('notiBtn'); if(nb&&nb.focus) nb.focus(); return; }
 var qm=document.getElementById('qaMenu'); if(qm&&!qm.hidden){ toggleQa(false); var qb=document.getElementById('qaBtn'); if(qb&&qb.focus) qb.focus(); return; }
 return;
 }
 if(!srchOpen) return;
 if(e.key==='ArrowDown'){ e.preventDefault(); if(_srchN){ _srchSel=Math.min(_srchSel+1,_srchN-1); srchPaintSel(); } }
 else if(e.key==='ArrowUp'){ e.preventDefault(); if(_srchN){ _srchSel=Math.max(_srchSel-1,0); srchPaintSel(); } }
 else if(e.key==='Enter'){
 var body=document.getElementById('srchBody'); if(!body||!body.querySelector) return;
 var pick=(_srchSel>=0)? body.querySelector('[data-idx="'+_srchSel+'"]') : body.querySelector('[data-srchrow]');
 if(pick){ e.preventDefault(); srchActivate(pick); }
 }
 });
 (function(){ var i=document.getElementById('srchInput'); if(i&&i.addEventListener) i.addEventListener('input', function(){ renderSearch(i.value); }); })();

 /* Dismiss floating panels when the page scrolls (dropdown convention).
 Scrolls INSIDE a panel are ignored; a short grace period protects the open moment. */
 document.addEventListener('scroll', function(e){
 if(Date.now()-(window.__panelOpenedAt||0) < 400) return;
 var t=e.target;
 if(t && t.nodeType===1 && typeof t.closest==='function' && (t.closest('#notiPanel')||t.closest('#qaMenu')||t.closest('#srch'))) return;
 var qm=document.getElementById('qaMenu'); if(qm&&!qm.hidden) toggleQa(false);
 var np=document.getElementById('notiPanel'); if(np&&!np.hidden) toggleNoti(false);
 var s=document.getElementById('srch'); if(s&&s.classList&&s.classList.contains&&s.classList.contains('is-on')) closeSearch();
 }, {capture:true, passive:true});

 /* ===================== ACCOUNT: Supabase auth (backend step 1) ===================== */
 var SUPA_URL='https://uiiyumjnlcreqdzqierd.supabase.co';
 var SUPA_KEY='sb_publishable_XSYO_1rCHF1m_iE4A05pZw_r2crDZlS';
 var sb=null; try{ if(window.supabase && window.supabase.createClient){ sb=window.supabase.createClient(SUPA_URL,SUPA_KEY); } }catch(e){}
 var AUTH={user:null}, _authMode='in', _authFirstRun=false;

  /* ==================== AVATARS ====================
     Twelve marks drawn in the brand palette. No photos, no uploads, no faces to
     get wrong — a family picks a shape and it shows wherever their identity does. */
  var AVATARS = {
    person:AV_PERSON,
    wisal:'<circle cx="7.85" cy="12" r="5.7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="2.64 3.34 29.84"/><circle cx="16.15" cy="12" r="5.7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="20.54 3.34 11.93"/>',
    hearth:'<path d="M4.6 19v-7.4a7.4 7.4 0 0 1 14.8 0V19" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="13" r="2.3" fill="currentColor"/>',
    knot:'<path d="M8.4 8.2a3.8 3.8 0 1 0 0 7.6c3.6 0 3.6-7.6 7.2-7.6a3.8 3.8 0 1 1 0 7.6c-3.6 0-3.6-7.6-7.2-7.6z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>',
    orbit:'<circle cx="12" cy="12" r="7.4" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="2.4" fill="currentColor"/><circle cx="12" cy="4.6" r="2" fill="currentColor"/>',
    star:'<path d="M12 3.4l2.5 5.7 6 .6-4.4 4.2 1.2 6-5.3-3-5.3 3 1.2-6L3.5 9.7l6-.6z" fill="currentColor"/>',
    leaf:'<path d="M19 5c0 8-5.4 13.4-13.4 13.4C5.6 10.4 11 5 19 5z" fill="currentColor"/><path d="M6.6 17.4 15 9" fill="none" stroke="var(--surface)" stroke-width="2" stroke-linecap="round"/>',
    moon:'<path d="M17.6 14.9A7.4 7.4 0 0 1 8.2 5.6a7.6 7.6 0 1 0 9.4 9.3z" fill="currentColor"/>',
    drop:'<path d="M12 3.6c3.4 4 5.4 6.7 5.4 9.2a5.4 5.4 0 0 1-10.8 0c0-2.5 2-5.2 5.4-9.2z" fill="currentColor"/>',
    shield:'<path d="M12 3.4 5 6.2v5c0 4.3 3 8.1 7 9.3 4-1.2 7-5 7-9.3v-5L12 3.4z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M9.2 12.2 11.3 14.3l3.7-4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    book:'<path d="M4.4 5.4h6a2.6 2.6 0 0 1 2.6 2.6v11a2 2 0 0 0-2-2H4.4z" fill="currentColor"/><path d="M19.6 5.4h-6A2.6 2.6 0 0 0 11 8v11a2 2 0 0 1 2-2h6.6z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
    sun:'<circle cx="12" cy="12" r="4.2" fill="currentColor"/><g stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><path d="M12 2.6v2.4M12 19v2.4M2.6 12H5M19 12h2.4M5.4 5.4 7.1 7.1M16.9 16.9l1.7 1.7M18.6 5.4 16.9 7.1M7.1 16.9l-1.7 1.7"/></g>',
    mountain:'<path d="M2.6 19 9 8.4l3.4 5.4 2.2-3.4L21.4 19z" fill="currentColor"/>'
  };
  var AV_ORDER = ['person','wisal','hearth','knot','orbit','star','leaf','moon','drop','shield','book','sun','mountain'];
  function avGet(){ try{ var v=(avStore().mark)||Store.get('fw.avatar','person'); return AVATARS[v]?v:'person'; }catch(e){ return 'person'; } }
  function avSvg(key,cls){
    return '<svg class="'+(cls||'avt')+'" viewBox="0 0 24 24" aria-hidden="true">'+(AVATARS[key]||AVATARS.wisal)+'</svg>';
  }
  /* Lives inside FD.data so it travels with every other synced thing.
     Falls back to the old local-only key once, then migrates it. */
  function avStore(){ try{ if(!FD.data.profile) FD.data.profile={}; return FD.data.profile; }catch(e){ return {}; } }
  function avPhoto(){
    try{
      var p=avStore();
      if(p.photo) return p.photo;
      var legacy=Store.get('fw.avatar.photo',null);
      if(legacy){ p.photo=legacy; try{ FD.save(); Store.set('fw.avatar.photo',null); }catch(e){} return legacy; }
      return null;
    }catch(e){ return null; }
  }
  var AV_PERSON='<circle cx="12" cy="8.4" r="3.9" fill="currentColor"/><path d="M4.6 20.4c0-4.1 3.3-6.6 7.4-6.6s7.4 2.5 7.4 6.6z" fill="currentColor"/>';
  function avApply(){
    try{
      var k=avGet(), host=document.getElementById('brandLogo'), ph=avPhoto();
      if(host) host.innerHTML = ph
        ? '<img class="avt" src="'+ph+'" alt="">'
        : avSvg(k,'avt');
      var pv=document.getElementById('avPhotoPv');
      if(pv) pv.innerHTML = ph ? '<img src="'+ph+'" alt="">' : avSvg(k,'');
      var rm=document.getElementById('avPhotoRm');
      if(rm) rm.hidden = !ph;
      var grid=document.getElementById('avGrid');
      if(grid){
        var btns=grid.querySelectorAll('[data-av]');
        for(var i=0;i<btns.length;i++) btns[i].classList.toggle('is-on', btns[i].getAttribute('data-av')===k);
      }
    }catch(e){}
  }
  function avSet(k){
    if(!AVATARS[k]) return;
    try{ var p=avStore(); p.mark=k; p.photo=null; FD.save(); }catch(e){}
    avApply();
    if(typeof flash==='function') flash('Picture updated');
  }
  function avPickPhoto(){
    try{
      var inp=document.createElement('input');
      inp.type='file'; inp.accept='image/*';
      inp.onchange=function(){
        var f=inp.files&&inp.files[0]; if(!f) return;
        var rd=new FileReader();
        rd.onload=function(){ cropOpen(rd.result); };
        rd.onerror=function(){ if(typeof flash==='function') flash('Could not read that picture'); };
        rd.readAsDataURL(f);
      };
      inp.click();
    }catch(e){}
  }
  function avClearPhoto(){
    try{ var p=avStore(); p.photo=null; FD.save(); }catch(e){}
    avApply();
    if(typeof flash==='function') flash('Photo removed');
  }

  /* ---- Cropper: square viewport, drag to pan, slider to zoom ---- */
  var _cropImg=null, _cropZ=1, _cropX=0, _cropY=0, _cropDrag=null, _cropSide=1280;
  var _cropAsp=1, _cropCb=null;   /* 1 = round avatar, 1.5 = wide cover */
  function cropDraw(){
    var cv=document.getElementById('avCanvas'); if(!cv||!_cropImg) return;
    var W=_cropSide, H=Math.round(_cropSide/_cropAsp);
    if(cv.width!==W||cv.height!==H){ cv.width=W; cv.height=H; }
    var cx=cv.getContext('2d');
    cx.imageSmoothingEnabled=true; cx.imageSmoothingQuality='high';
    cx.clearRect(0,0,W,H);
    var iw=_cropImg.width, ih=_cropImg.height;
    var base=Math.max(W/iw, H/ih);               /* always cover the frame */
    var sc=base*_cropZ, dw=iw*sc, dh=ih*sc;
    var maxX=Math.max(0,(dw-W)/2), maxY=Math.max(0,(dh-H)/2);
    _cropX=Math.max(-maxX,Math.min(maxX,_cropX));
    _cropY=Math.max(-maxY,Math.min(maxY,_cropY));
    cx.drawImage(_cropImg,(W-dw)/2+_cropX,(H-dh)/2+_cropY,dw,dh);
  }
  function cropOpen(src, aspect, cb){
    _cropAsp = aspect || 1; _cropCb = cb || null;
    var stage=document.getElementById('avStage');
    if(stage){
      stage.style.aspectRatio = String(_cropAsp);
      stage.style.borderRadius = (_cropAsp===1 ? '50%' : '18px');
    }
    var im=new Image();
    im.onload=function(){
      _cropImg=im; _cropZ=1; _cropX=0; _cropY=0;
      var z=document.getElementById('avZoom'); if(z) z.value=100;
      var box=document.getElementById('avCrop'); if(box) box.classList.add('is-on');
      cropDraw();
    };
    im.onerror=function(){ if(typeof flash==='function') flash('Could not read that picture'); };
    im.src=src;
  }
  function cropClose(){ var b=document.getElementById('avCrop'); if(b) b.classList.remove('is-on'); _cropImg=null; }
  function cropSave(){
    var cv=document.getElementById('avCanvas'); if(!cv||!_cropImg){ cropClose(); return; }
    var durl;
    try{ durl=cv.toDataURL('image/jpeg',0.92); }catch(e){ durl=null; }
    if(!durl){ cropClose(); return; }
    var cb=_cropCb;
    cropClose();
    if(cb){ cb(durl); return; }
    try{ var p=avStore(); p.photo=durl; FD.save(); }catch(e){}
    avApply();
    if(typeof flash==='function') flash('Profile picture saved');
  }
  try{
    var _st=null;
    document.addEventListener('pointerdown', function(e){
      var st=e.target.closest('#avStage'); if(!st||!_cropImg) return;
      _st=st; _cropDrag={x:e.clientX,y:e.clientY,ox:_cropX,oy:_cropY};
      try{ st.setPointerCapture(e.pointerId); }catch(_){}
    });
    document.addEventListener('pointermove', function(e){
      if(!_cropDrag) return;
      var k=_cropSide/(_st?_st.getBoundingClientRect().width:_cropSide);
      _cropX=_cropDrag.ox+(e.clientX-_cropDrag.x)*k;
      _cropY=_cropDrag.oy+(e.clientY-_cropDrag.y)*k;
      cropDraw();
    });
    document.addEventListener('pointerup', function(){ _cropDrag=null; });
    document.addEventListener('input', function(e){
      if(e.target && e.target.id==='avZoom'){ _cropZ=(parseInt(e.target.value,10)||100)/100; cropDraw(); }
    });
  }catch(e){}


  /* Any picture inside a card opens full-size. Nothing to wire per feature:
     one delegated listener covers journal, trips, memories and attachments. */
  function lbxOpen(src, cap){
    var b=document.getElementById('lbx'), im=document.getElementById('lbxImg'), c=document.getElementById('lbxCap');
    if(!b||!im) return;
    im.src=src; if(c) c.textContent=cap||'';
    b.classList.add('is-on');
  }
  function lbxClose(){ var b=document.getElementById('lbx'); if(b){ b.classList.remove('is-on'); var im=document.getElementById('lbxImg'); if(im) im.src=''; } }
  try{
    document.addEventListener('click', function(e){
      if(e.target.closest('[data-action="lbx-close"]') || (e.target.id==='lbx')){ lbxClose(); return; }
      var im=e.target.closest('img');
      if(!im || im.id==='lbxImg') return;
      if(!/^data:image\/|^https?:|^blob:/.test(im.src||'')) return;
      if(im.closest('.lbx')||im.closest('.avcrop')||im.closest('.brand__logo')||im.closest('.avphoto__pv')) return;
      /* Any real content picture opens here. An allow-list of class names kept
         missing the actual ones (.jentry__photo, .tvhero__ph), so pictures fell
         through to the raw file in a new tab — enormous on a desktop screen.
         Size is the reliable test: avatars, chips and icons are small. */
      var r=im.getBoundingClientRect();
      if(r.width<90 || r.height<60) return;
      if(im.closest('.attchip')||im.closest('.pj-avs')||im.closest('[class*="__av"]')) return;
      /* A trip card is mostly its cover photo. Tapping it must open the trip,
         not the picture — the cover is viewable inside the trip itself. */
      if(im.closest('[data-tvopen]')) return;
      e.preventDefault(); e.stopPropagation();
      var card=im.closest('[class*="card"]')||im.closest('[class*="entry"]')||im.parentElement;
      var t=card?card.querySelector('h3,h4,.jr-title,.trip__name,.tvhero__t,.jentry__t'):null;
      lbxOpen(im.src, t?t.textContent.trim():'');
    }, true);
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') lbxClose(); });
  }catch(e){}

  function avGridHtml(){
    return AV_ORDER.map(function(k){
      return '<button type="button" data-av="'+k+'" aria-label="'+k+'" style="color:var(--brand)">'+avSvg(k,'')+'</button>';
    }).join('');
  }

  /* ==================== Cloudflare Turnstile (CAPTCHA) ==================== */
  /* Paste your Turnstile Site Key below — this is the ONE place to edit it. */
  var TURNSTILE_SITE_KEY = 'PASTE_YOUR_TURNSTILE_SITE_KEY_HERE';
  var _tsWidgetId = null;
  function tsRender(){
    if(!window.turnstile){ return; } /* api.js not ready yet — onloadTurnstileCallback re-calls when it is */
    var host=document.getElementById('authCaptcha'); if(!host) return;
    if(_tsWidgetId!==null){ try{ window.turnstile.reset(_tsWidgetId); }catch(e){} return; }
    try{ host.innerHTML=''; }catch(e){} /* never leave a stale widget behind */
    try{
      _tsWidgetId=window.turnstile.render(host,{
        sitekey:TURNSTILE_SITE_KEY, theme:'auto', 'refresh-expired':'auto', retry:'auto',
        callback:function(){ try{ authErr(''); }catch(e){} },
        'expired-callback':function(){ try{ window.turnstile.reset(_tsWidgetId); }catch(e){} },
        'timeout-callback':function(){ try{ window.turnstile.reset(_tsWidgetId); }catch(e){} },
        'error-callback':function(){ try{ window.turnstile.reset(_tsWidgetId); }catch(e){} return true; }
      });
    }catch(e){}
  }
  window.onloadTurnstileCallback=function(){ try{ tsRender(); }catch(e){} };
  /* Read from OUR widget, not whatever hidden input happens to be first in the DOM. */
  function tsToken(){
    try{ if(window.turnstile && _tsWidgetId!==null){ return window.turnstile.getResponse(_tsWidgetId) || ''; } }catch(e){}
    var el=document.querySelector('input[name="cf-turnstile-response"]'); return el?el.value:'';
  }
  function tsReset(){ if(window.turnstile && _tsWidgetId!==null){ try{ window.turnstile.reset(_tsWidgetId); }catch(e){} } }
 /* remember who you are across reloads, so the UI never has to wait for the network */
 (function restoreIdentity(){
 AUTH.user=null;
 })();
 function authRemember(u){
 try{
 if(u&&u.id){ Store.set('fw.auth.uid',u.id); Store.set('fw.auth.email',u.email||''); }
 else { Store.set('fw.auth.uid',''); Store.set('fw.auth.email',''); }
 }catch(e){}
 }
 function authFriendly(err){
 var m=String((err&&err.message)||'').toLowerCase();
 if(m.indexOf('captcha')>=0||m.indexOf('timeout-or-duplicate')>=0) return 'The security check expired. It has been refreshed \u2014 wait for the tick, then try again.';
 if(m.indexOf('invalid email')>=0||m.indexOf('email address')>=0&&m.indexOf('invalid')>=0) return 'That email address doesn\u2019t look right \u2014 please check it.';
 if(m.indexOf('rate limit')>=0) return 'Too many sign-up emails just now. Try again in a few minutes, or turn off \u201cConfirm email\u201d in Supabase to skip emails entirely.';
 if(m.indexOf('already registered')>=0||m.indexOf('already been registered')>=0||m.indexOf('user already')>=0) return 'That email already has an account, sign in instead.';
 if(m.indexOf('invalid login')>=0||m.indexOf('invalid credentials')>=0) return 'That email and password don\u2019t match.';
 if(m.indexOf('not confirmed')>=0) return 'Confirm your email first, check your inbox (and spam).';
 if(m.indexOf('password')>=0) return 'Password needs at least 6 characters.';
 if(m.indexOf('network')>=0||m.indexOf('fetch')>=0||m.indexOf('failed to')>=0) return 'No connection, check your internet and try again.';
 return (err&&err.message)||'Something went wrong.';
 }
 function authErr(msg){ var e=document.getElementById('authErr'); if(e){ e.textContent=msg||''; e.hidden=!msg; } }
 function authBusy(on){ var b=document.getElementById('authGo'); if(b){ b.disabled=!!on; b.textContent=on?'Please wait\u2026':(_authMode==='in'?'Sign in':'Create account'); } }
 function authSetMode(m){ _authMode=m;
 var t=document.getElementById('authTitle'), s=document.getElementById('authSwap'), g=document.getElementById('authGo');
 if(t) t.textContent=(m==='in')?'Welcome back':'Create your account';
 if(g) g.textContent=(m==='in')?'Sign in':'Create account';
 if(s) s.innerHTML=(m==='in')?'New to Wisal? <b>Create an account</b>':'Already have an account? <b>Sign in</b>';
 authErr('');
 }
  /* ==================== ONBOARDING (Phase 1) ==================== */
  var ONB_KEY='fw.onboarded';
  var onbState={ step:0, family:'', size:'', challenges:[], focus:[], goal:'', name:'', plan:null };
  function onbDone(){ try{ return Store.get(ONB_KEY,false)===true; }catch(e){ return false; } }
  function onbMaybeStart(){
    // start only once, on a fresh account with no data yet
    try{
      if(onbDone()) return false;
      if(FD.data.members && FD.data.members.length) { Store.set(ONB_KEY,true); return false; }
      openOnb(); return true;
    }catch(e){ return false; }
  }
  function openOnb(){ var el=$('#onb'); if(!el) return; onbState={ step:0, family:'', size:'', challenges:[], focus:[], goal:'', name:'', plan:null }; el.hidden=false; el.classList.add('is-on'); onbRender(); }
  function closeOnb(){ var el=$('#onb'); if(el){ el.classList.remove('is-on'); el.hidden=true; } Store.set(ONB_KEY,true); }

  var ONB_CHALLENGES=[
    ['time','Never enough time'],['money','Money feels messy'],['health','Health & appointments'],
    ['organize','Staying organised'],['relationship','Time for my relationship'],['mental','Stress & peace of mind'],
    ['kids','Managing the kids'],['goals','Reaching my goals'],['home','Running the household'],['faith','Faith & good deeds']
  ];
  var ONB_FOCUS=[
    ['planning','Planning & tasks'],['finance','Money & budgets'],['health','Health'],
    ['family','Family'],['wellbeing','Wellbeing'],['nutrition','Meals & nutrition'],
    ['fitness','Fitness'],['relationship','Relationship'],['learning','Learning'],['legacy','Faith & legacy']
  ];

  function onbSteps(){ return 6; }
  function onbSetBar(){
    var f=$('#onbBarFill'); if(f){ f.style.width=Math.min(100,Math.round((onbState.step/(onbSteps()-1))*100))+'%'; }
    var top=$('#onbTop'), cnt=$('#onbCount');
    if(top){ top.style.visibility=(onbState.step>=1 && onbState.step<=4)?'visible':'hidden'; }
    if(cnt){ cnt.textContent='Step '+onbState.step+' of 4'; }
  }

  var _onbLastStep=-1;
  function onbRender(){
    var st=$('#onbStage'); if(!st) return; onbSetBar();
    var _same = (_onbLastStep === onbState.step), _keep = _same ? st.scrollTop : 0;
    st.classList.toggle('is-quiet', _same);
    var s=onbState.step, html='';
    if(s===0){
      html='<div class="onbc onbc--hero">'
        +'<div class="onb__mark"><svg viewBox="0 0 24 24"><circle cx="7.85" cy="12" r="5.7" stroke-dasharray="2.64 3.34 29.84"/><circle cx="16.15" cy="12" r="5.7" stroke-dasharray="20.54 3.34 11.93"/></svg></div>'
        +'<h1 class="onb__h">Welcome to Wisal</h1>'
        +'<p class="onb__eyebrow" style="margin-bottom:16px">Your family\u2019s calm, in one place</p>'
        +'<p class="onb__p">In a minute or two, I\u2019ll understand what your family needs \u2014 then build you a personal plan to make life calmer and free up your time.</p>'
        +'<button class="btn btn--primary onb__go" data-onbnext>Let\u2019s begin</button>'
        +'<button class="onb__skip" data-onbskip>Skip for now</button>'
      +'</div>';
    } else if(s===1){
      var opts=[['just_me','Just me'],['couple','Me & my partner'],['young_family','Young family with kids'],['grown_family','Bigger / grown family'],['extended','Extended family']];
      html=onbQ('Who is Wisal for?','So I can shape everything around your household.',
        opts.map(function(o){ return onbPill('family',o[0],o[1],onbState.family===o[0]); }).join(''), onbState.family);
    } else if(s===2){
      html=onbQ('What feels hardest right now?','Pick as many as you like \u2014 be honest, this stays private.',
        ONB_CHALLENGES.map(function(o){ return onbPill('challenges',o[0],o[1],onbState.challenges.indexOf(o[0])>=0); }).join(''), onbState.challenges.length);
    } else if(s===3){
      html=onbQ('Where should we focus first?','Choose the areas you most want Wisal\u2019s help with.',
        ONB_FOCUS.map(function(o){ return onbPill('focus',o[0],o[1],onbState.focus.indexOf(o[0])>=0); }).join(''), onbState.focus.length);
    } else if(s===4){
      html='<div class="onbc">'
        +'<h2 class="onb__q">One thing that would make life easier?</h2>'
        +'<p class="onb__qs">In your own words \u2014 the AI will use this to shape your plan. (Optional)</p>'
        +'<textarea class="onb__ta" id="onbGoalInput" placeholder="e.g. Keep track of the kids\u2019 appointments and our monthly budget without the stress\u2026">'+esc(onbState.goal)+'</textarea>'
        +'<div class="onb__q" style="font-size:1rem;margin-top:18px">What should I call you?</div>'
        +'<input class="onb__in" id="onbNameInput" placeholder="Your name" value="'+esc(onbState.name)+'">'
        +'<div class="onb__nav"><button class="onb__back" data-onbback>Back</button><button class="btn btn--primary" data-onbnext>Continue</button></div>'
      +'</div>';
    } else if(s===5){
      // building / plan screen
      if(onbState.plan==='__loading__'){
        html='<div class="onbc onbc--load">'
          +'<div class="onb__orb"><span></span><span></span><span></span></div>'
          +'<h2 class="onb__h">Building your plan\u2026</h2>'
          +'<p class="onb__p" id="onbLoadMsg">Reading what matters to your family\u2026</p>'
        +'</div>';
        onbCycleLoadMsg();
      } else if(onbState.plan && typeof onbState.plan==='object'){
        var p=onbState.plan;
        var foc=(p.focus||[]).map(function(f){ return '<span class="onb__chip">'+esc(f)+'</span>'; }).join('');
        var steps=(p.steps||[]).map(function(x,i){ return '<div class="onb__step"><span class="onb__stepn">'+(i+1)+'</span><span>'+esc(x)+'</span></div>'; }).join('');
        var added=(p.added||[]).map(function(x){ return '<div class="onb__added"><svg class="ico" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>'+esc(x)+'</div>'; }).join('');
        html='<div class="onbc onbc--plan">'
          +'<div class="onb__planhead"><span class="onb__eyebrow">Your personal plan</span><h1 class="onb__h">'+(onbState.name?('For '+esc(onbState.name)):'Here\u2019s your plan')+'</h1></div>'
          +'<p class="onb__summary">'+esc(p.summary||'')+'</p>'
          +(foc?'<div class="onb__chips">'+foc+'</div>':'')
          +(steps?'<div class="onb__block"><div class="onb__blockh">Where to start</div>'+steps+'</div>':'')
          +(added?'<div class="onb__block"><div class="onb__blockh">I\u2019ve set these up for you</div>'+added+'</div>':'')
          +'<button class="btn btn--primary onb__go" data-onbtopay>Start using Wisal</button>'
        +'</div>';
      } else {
        html='<div class="onbc"><p class="onb__p">Something went wrong. Let\u2019s just get you started.</p><button class="btn btn--primary" data-onbfinish>Enter Wisal</button></div>';
      }
    }
    else if(s===6){ html=onbPayView(); }
    st.innerHTML=html;
    if(_same) st.scrollTop=_keep;
    _onbLastStep=onbState.step;
    if(s===4){ setTimeout(function(){ var t=$('#onbGoalInput'); if(t) t.focus(); },50); }
  }
  function onbQ(title,sub,pills,hasAns){
    return '<div class="onbc">'
      +'<h2 class="onb__q">'+esc(title)+'</h2>'
      +'<p class="onb__qs">'+esc(sub)+'</p>'
      +'<div class="onb__pills">'+pills+'</div>'
      +'<div class="onb__nav"><button class="onb__back" data-onbback>Back</button><button class="btn btn--primary'+(hasAns?'':' is-dim')+'" data-onbnext>Continue</button></div>'
    +'</div>';
  }
  function onbPill(group,val,label,on){
    return '<button type="button" class="onb__pill'+(on?' is-on':'')+'" data-onbpick="'+group+'" data-onbval="'+val+'">'+esc(label)+'</button>';
  }
  var _onbLoadTimer=null, _onbLoadIdx=0;
  function onbCycleLoadMsg(){
    var msgs=['Reading what matters to your family\u2026','Matching the right Wisal spaces\u2026','Shaping a plan that fits you\u2026','Setting up your first steps\u2026'];
    _onbLoadIdx=0; clearInterval(_onbLoadTimer);
    _onbLoadTimer=setInterval(function(){ _onbLoadIdx=(_onbLoadIdx+1)%msgs.length; var m=$('#onbLoadMsg'); if(m) m.textContent=msgs[_onbLoadIdx]; },1600);
  }
  function onbPick(group,val){
    if(group==='family'){ onbState.family=val; }
    else { var arr=onbState[group]; var i=arr.indexOf(val); if(i>=0) arr.splice(i,1); else arr.push(val); }
    /* Repaint only the pills that changed. Redrawing the whole stage made every
       tap replay the entry animation, which read as a flicker. */
    var st=document.getElementById('onbStage');
    var pills = st ? st.querySelectorAll('[data-onbpick="'+group+'"]') : null;
    if(!pills || !pills.length){ onbRender(); return; }
    for(var k=0;k<pills.length;k++){
      var v=pills[k].getAttribute('data-onbval');
      var on=(group==='family') ? (onbState.family===v) : (onbState[group].indexOf(v)>=0);
      pills[k].classList.toggle('is-on', on);
      pills[k].setAttribute('aria-pressed', on?'true':'false');
    }
    /* Continue stays dimmed until there is an answer — mirrors the same test the
       renderer uses, so it lights up the instant a valid choice is made. */
    var has=(group==='family') ? !!onbState.family : !!(onbState[group] && onbState[group].length);
    var cont=st.querySelector('[data-onbnext]');
    if(cont) cont.classList.toggle('is-dim', !has);
  }
  function onbNext(){
    var s=onbState.step;
    if(s===4){ var t=$('#onbGoalInput'); if(t) onbState.goal=t.value; var n=$('#onbNameInput'); if(n) onbState.name=n.value.trim(); }
    if(s>=onbSteps()-2){ onbState.step=5; onbRender(); onbBuildPlan(); return; }
    onbState.step++; onbRender();
  }
  function onbBack(){ if(onbState.step>0){ onbState.step--; onbRender(); } }

  function onbFallbackPlan(){
    // used if the AI call fails, so the user always gets a plan
    var focusLabels=onbState.focus.map(function(k){ for(var i=0;i<ONB_FOCUS.length;i++){ if(ONB_FOCUS[i][0]===k) return ONB_FOCUS[i][1]; } return k; });
    if(!focusLabels.length) focusLabels=['Planning & tasks','Family','Wellbeing'];
    return { summary:'Here\u2019s a simple starting plan built around what you told me. Take it one step at a time \u2014 Wisal will handle the rest.',
      focus:focusLabels.slice(0,4),
      steps:['Add your family members so everything connects to the right person.','Log this week\u2019s tasks \u2014 or just ask the AI to add them for you.','Open Home each morning to see your day in 3 seconds.'],
      addStarters:true };
  }
  function onbApplyPlan(plan){
    // create the starter content the plan describes
    var added=[];
    try{
      if(plan.addStarters!==false){
        // a couple of gentle starter tasks based on focus
        var f=onbState.focus;
        if(f.indexOf('finance')>=0){ FD.addTask({title:'Set this month\u2019s budget',done:false,due:'',priority:'Normal',subs:[]}); added.push('A task: set this month\u2019s budget'); }
        if(f.indexOf('health')>=0){ FD.addTask({title:'Add family health details & any appointments',done:false,due:'',priority:'Normal',subs:[]}); added.push('A task: add health details'); }
        if(f.indexOf('planning')>=0 || !f.length){ FD.addTask({title:'Plan the week ahead',done:false,due:'',priority:'Normal',subs:[]}); added.push('A task: plan the week ahead'); }
        if(f.indexOf('wellbeing')>=0){ try{ FD.addGoal({title:'Take 10 quiet minutes for myself, daily',area:'wellbeing',done:false}); added.push('A wellbeing goal'); }catch(e){} }
        if(onbState.goal){ FD.addTask({title:onbState.goal.slice(0,80),done:false,due:'',priority:'High',subs:[]}); added.push('Your own goal, as a task'); }
      }
    }catch(e){}
    plan.added=added;
    return plan;
  }
  function onbBuildPlan(){
    onbState.plan='__loading__'; onbRender();
    var challLabels=onbState.challenges.map(function(k){ for(var i=0;i<ONB_CHALLENGES.length;i++){ if(ONB_CHALLENGES[i][0]===k) return ONB_CHALLENGES[i][1]; } return k; });
    var focusLabels=onbState.focus.map(function(k){ for(var i=0;i<ONB_FOCUS.length;i++){ if(ONB_FOCUS[i][0]===k) return ONB_FOCUS[i][1]; } return k; });
    var prompt='You are Wisal, a warm family assistant. A new user just onboarded. Based on their answers, write a short, encouraging, personalised starter plan.\n'
      +'Household: '+(onbState.family||'unknown')+'\n'
      +'Their biggest challenges: '+(challLabels.join(', ')||'not specified')+'\n'
      +'Areas they want help with: '+(focusLabels.join(', ')||'not specified')+'\n'
      +'In their own words: '+(onbState.goal||'(none)')+'\n'
      +'Their name: '+(onbState.name||'(not given)')+'\n\n'
      +'Reply ONLY with valid JSON, no markdown, no extra text, in this exact shape:\n'
      +'{"summary":"2-3 warm sentences naming their main need and how Wisal will help","focus":["3-4 short focus area labels"],"steps":["3 short, concrete first steps"]}';
    var contents=[{role:'user',parts:[{text:prompt}]}];
    var payload={ system:'You reply only with valid minified JSON. No markdown fences, no prose outside the JSON.', contents:contents, generationConfig:{maxOutputTokens:600,temperature:0.6} };

    function finish(planObj){
      clearInterval(_onbLoadTimer);
      var plan = planObj || onbFallbackPlan();
      plan = onbApplyPlan(plan);
      onbState.plan = plan;
      try{ refreshAll(); }catch(e){}
      onbRender();
    }
    function parsePlan(txt){
      try{ var clean=String(txt).replace(/```json/gi,'').replace(/```/g,'').trim(); var a=clean.indexOf('{'), b=clean.lastIndexOf('}'); if(a>=0&&b>a) clean=clean.slice(a,b+1); var o=JSON.parse(clean); if(o&&(o.summary||o.steps)) return o; }catch(e){}
      return null;
    }
    function fire(token){
      var headers={ 'Content-Type':'application/json', 'apikey':SUPA_KEY };
      if(token){ headers['Authorization']='Bearer '+token; }
      var key=aiGetKey();
      var url, hdr, body;
      if(key){ url='https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent'; hdr={ 'Content-Type':'application/json','x-goog-api-key':key }; body={ system_instruction:{parts:[{text:payload.system}]}, contents:contents, generationConfig:payload.generationConfig }; }
      else { url=AI_PROXY_URL; hdr=headers; body=payload; }
      fetch(url,{ method:'POST', headers:hdr, body:JSON.stringify(body) })
        .then(function(r){ return r.json(); })
        .then(function(data){
          var txt='';
          if(data && data.text){ txt=data.text; }
          else if(data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts){ txt=data.candidates[0].content.parts.map(function(p){return p.text||'';}).join(''); }
          finish(parsePlan(txt));
        })
        .catch(function(){ finish(null); });
    }
    try{ if(sb && sb.auth && sb.auth.getSession){ sb.auth.getSession().then(function(r){ var s=r&&r.data&&r.data.session; fire(s?s.access_token:''); }).catch(function(){ fire(''); }); } else { fire(''); } }catch(e){ fire(''); }
  }
  function onbFinish(){
    try{ if(!Store.get('fw.plan.tier',null)) Store.set('fw.plan.tier','free'); }catch(e){}
    closeOnb();
    try{ navigate('home'); }catch(e){}
    try{ refreshAll(); }catch(e){}
    if(typeof flash==='function') flash('Your plan is ready. Welcome to Wisal!');
  }

  /* ==================== PAYWALL — Wisal Plus (Phase 2) ==================== */
  /* Prices in BDT (\u09F3). Edit here in ONE place; the yearly saving badge is auto-derived. */
  var WISAL_PRICE={
    month:{ amt:149, per:'/month', cycleLabel:'Billed monthly' },
    year: { amt:990, per:'/year',  cycleLabel:'\u2248 \u09F3 83/mo \u00b7 billed yearly' },
    saveP:45
  };
  var onbPay={ cycle:'month', method:null, view:'plans', busy:false, note:'' };

  function onbToPaywall(){ onbPay={ cycle:'month', method:null, view:'plans', busy:false, note:'' }; onbState.step=6; onbRender(); }
  function onbSetCycle(c){
    if(c!=='month'&&c!=='year') return;
    onbPay.cycle=c;
    var st=document.getElementById('onbStage'), m=WISAL_PRICE[c];
    var amt = st && st.querySelector('.onbpw__amt');
    if(!amt){ onbRender(); return; }
    amt.textContent=m.amt;
    var per=st.querySelector('.onbpw__per'); if(per) per.textContent=m.per;
    var note=st.querySelector('.onbpw__note'); if(note) note.textContent=m.cycleLabel+' \u00b7 cancel anytime';
    var segs=st.querySelectorAll('[data-onbcycle]');
    for(var k=0;k<segs.length;k++){
      var on=segs[k].getAttribute('data-onbcycle')===c;
      segs[k].classList.toggle('is-on', on);
      segs[k].setAttribute('aria-pressed', on?'true':'false');
    }
  }
  function onbPlusStart(){ onbPay.view='pay'; if(!onbPay.method) onbPay.method='bkash'; onbPay.note=''; onbRender(); }
  function onbPayBack(){ onbPay.view='plans'; onbPay.note=''; onbRender(); }
  function onbPayMethod(m){
    onbPay.method=m; onbPay.note='';
    var st=document.getElementById('onbStage');
    var rows = st ? st.querySelectorAll('[data-onbpay]') : null;
    if(!rows || !rows.length){ onbRender(); return; }
    for(var k=0;k<rows.length;k++) rows[k].classList.toggle('is-on', rows[k].getAttribute('data-onbpay')===m);
    var warn=st.querySelector('.onbpw__notewrap'); if(warn) warn.remove();
  }

  function onbPayView(){
    if(onbPay.view==='pay') return onbPaySheet();
    var m=WISAL_PRICE[onbPay.cycle];
    var tick='<span class="onbpw__tick"><svg viewBox="0 0 20 20"><path d="M4 10.5l4 4 8-9" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
    var mk='<svg stroke-linecap="butt" stroke-width="2.5" class="mk" viewBox="0 0 24 24"><circle cx="7.85" cy="12" r="5.7" stroke-dasharray="2.64 3.34 29.84"/><circle cx="16.15" cy="12" r="5.7" stroke-dasharray="20.54 3.34 11.93"/></svg>';
    return '<div class="onbc onbc--pay">'
      +'<div class="onbpw__head">'
        +'<span class="onb__eyebrow">Almost there</span>'
        +'<h1 class="onb__h" style="font-size:1.9rem;margin-bottom:0">Make Wisal yours</h1>'
        +'<p class="onbpw__sub">Start free and keep everything you just set up. Move to Plus whenever you want the AI with no limits.</p>'
      +'</div>'
      +'<div class="onbpw__toggle" role="group" aria-label="Billing period">'
        +'<button type="button" class="onbpw__seg'+(onbPay.cycle==='month'?' is-on':'')+'" data-onbcycle="month" aria-pressed="'+(onbPay.cycle==='month')+'">Monthly</button>'
        +'<button type="button" class="onbpw__seg'+(onbPay.cycle==='year'?' is-on':'')+'" data-onbcycle="year" aria-pressed="'+(onbPay.cycle==='year')+'">Yearly<span class="onbpw__save">Save '+WISAL_PRICE.saveP+'%</span></button>'
      +'</div>'
      +'<div class="onbpw__cards">'
        +'<section class="onbpw__card onbpw__card--plus" aria-label="Wisal Plus">'
          +'<span class="onbpw__badge"><svg viewBox="0 0 24 24"><path d="M12 3l2.4 5.4L20 9l-4 3.9 1 5.6L12 16l-5 2.5 1-5.6L4 9l5.6-.6z"/></svg>Recommended</span>'
          +'<div class="onbpw__nm">'+mk+'Wisal Plus</div>'
          +'<div class="onbpw__tag">All of Wisal, no limits.</div>'
          +'<div class="onbpw__price"><span class="onbpw__cur">\u09F3</span><span class="onbpw__amt">'+m.amt+'</span><span class="onbpw__per">'+m.per+'</span></div>'
          +'<div class="onbpw__note">'+m.cycleLabel+' \u00b7 cancel anytime</div>'
          +'<ul class="onbpw__feats">'
            +'<li>'+tick+'<span><b>Unlimited AI</b> \u2014 no monthly cap</span></li>'
            +'<li>'+tick+'<span>Bring your own Gemini key</span></li>'
            +'<li>'+tick+'<span><b>Weekly family insights</b> &amp; reports</span></li>'
            +'<li>'+tick+'<span>Unlimited members &amp; projects</span></li>'
            +'<li>'+tick+'<span>Priority support</span></li>'
          +'</ul>'
          +'<button type="button" class="btn btn--primary onbpw__cta" data-onbplus>Start Wisal Plus<svg viewBox="0 0 20 20"><path d="M4 10h11M11 5l5 5-5 5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'
        +'</section>'
        +'<section class="onbpw__card onbpw__card--free" aria-label="Wisal Free">'
          +'<div class="onbpw__nm">Wisal Free</div>'
          +'<div class="onbpw__tag">Everything a family needs to begin.</div>'
          +'<div class="onbpw__price"><span class="onbpw__cur">\u09F3</span><span class="onbpw__amt">0</span><span class="onbpw__per">always</span></div>'
          +'<div class="onbpw__note">No card needed.</div>'
          +'<ul class="onbpw__feats">'
            +'<li>'+tick+'<span>Shared family dashboard</span></li>'
            +'<li>'+tick+'<span>Tasks, events &amp; expenses</span></li>'
            +'<li>'+tick+'<span><b>30 AI actions</b> a month</span></li>'
            +'<li>'+tick+'<span>Up to 2 members</span></li>'
          +'</ul>'
          +'<button type="button" class="onbpw__cta onbpw__cta--ghost" data-onbfinish>Continue with Free</button>'
        +'</section>'
      +'</div>'
      +'<div class="onbpw__pay">'
        +'<div class="onbpw__paylabel">Secure checkout</div>'
        +'<div class="onbpw__marks">'
          +'<span class="onbpw__mark"><span class="dot" style="background:#e2136e"></span>bKash</span>'
          +'<span class="onbpw__mark"><span class="dot" style="background:#ec1c24"></span>Nagad</span>'
          +'<span class="onbpw__mark"><svg viewBox="0 0 20 20"><rect x="2" y="4.5" width="16" height="11" rx="2"/><path d="M2 8.5h16"/></svg>Cards</span>'
        +'</div>'
      +'</div>'
      +'<div class="onbpw__fine"><svg viewBox="0 0 16 16"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2"/></svg>Payments by SSLCommerz \u00b7 cancel anytime</div>'
      +'<button type="button" class="onbpw__later" data-onbfinish>Maybe later</button>'
    +'</div>';
  }

  function onbPaySheet(){
    var m=WISAL_PRICE[onbPay.cycle];
    var methods=[
      ['bkash','bKash','Pay from your bKash wallet','#e2136e','b'],
      ['nagad','Nagad','Pay from your Nagad wallet','#ec1c24','N'],
      ['card','Card','Visa, Mastercard &amp; local banks','var(--brand)','']
    ];
    var rows=methods.map(function(x){
      var on=onbPay.method===x[0];
      var logo = x[0]==='card'
        ? '<span class="onbpw__mlogo" style="background:'+x[3]+'"><svg viewBox="0 0 20 20" style="width:20px;height:20px;fill:none;stroke:#fff;stroke-width:1.7"><rect x="2" y="4.5" width="16" height="11" rx="2"/><path d="M2 8.5h16"/></svg></span>'
        : '<span class="onbpw__mlogo" style="background:'+x[3]+'">'+x[4]+'</span>';
      return '<button type="button" class="onbpw__method'+(on?' is-on':'')+'" data-onbpay="'+x[0]+'">'
        +logo
        +'<span class="onbpw__mmeta"><span class="onbpw__mname">'+x[1]+'</span><span class="onbpw__mdesc">'+x[2]+'</span></span>'
        +'<span class="onbpw__mradio"></span>'
      +'</button>';
    }).join('');
    return '<div class="onbc onbc--pay">'
      +'<div class="onbpw__sheethead"><button type="button" class="onbpw__backb" data-onbpayback><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>Plans</button></div>'
      +'<span class="onb__eyebrow">Wisal Plus</span>'
      +'<h1 class="onb__h" style="font-size:1.7rem;margin-bottom:4px">How would you like to pay?</h1>'
      +'<div class="onbpw__summary"><span class="lbl">Wisal Plus \u00b7 '+(onbPay.cycle==='year'?'yearly':'monthly')+'</span><span class="amt">\u09F3'+m.amt+'</span></div>'
      +(onbPay.note?'<div class="onbpw__notewrap">'+esc(onbPay.note)+'</div>':'')
      +'<div class="onbpw__methods">'+rows+'</div>'
      +'<button type="button" class="btn btn--primary onbpw__cta" data-onbcheckout'+(onbPay.busy?' disabled':'')+'>'+(onbPay.busy?'Opening secure checkout\u2026':'Continue to secure checkout')+'</button>'
      +'<div class="onbpw__fine" style="margin-top:14px"><svg viewBox="0 0 16 16"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2"/></svg>You\u2019ll confirm on the secure SSLCommerz page</div>'
    +'</div>';
  }

  function onbCheckout(){
    if(!onbPay.method){ onbPay.note='Please choose bKash, Nagad or a card first.'; onbRender(); return; }
    onbPay.busy=true; onbPay.note=''; onbRender();
    var amt=WISAL_PRICE[onbPay.cycle].amt;
    var body={ tier:'plus', cycle:onbPay.cycle, amount:amt, currency:'BDT', method:onbPay.method, email:(AUTH.user&&AUTH.user.email)||'', user_id:(AUTH.user&&AUTH.user.id)||'' };
    var go=function(tok){
      fetch(WISAL_PAY_URL,{ method:'POST', headers:{ 'Content-Type':'application/json', 'apikey':SUPA_KEY, 'Authorization':'Bearer '+(tok||'') }, body:JSON.stringify(body) })
        .then(function(r){ return r.json(); })
        .then(function(d){
          if(d && d.url){ try{ Store.set('fw.plan.pending', body); }catch(e){} location.href=d.url; return; }
          throw new Error('no-url');
        })
        .catch(function(){
          onbPay.busy=false;
          onbPay.note='Secure checkout isn\u2019t connected yet. Start on Free for now \u2014 you can upgrade any time from Settings once payments go live.';
          onbRender();
        });
    };
    try{ if(sb&&sb.auth&&sb.auth.getSession){ sb.auth.getSession().then(function(r){ var s=r&&r.data&&r.data.session; go(s?s.access_token:''); }).catch(function(){ go(''); }); } else { go(''); } }catch(e){ go(''); }
  }

 function openAuth(firstRun){
 _authFirstRun=!!firstRun;
 var a=document.getElementById('auth'); if(!a) return;
 try{ toggleQa(false); toggleNoti(false); }catch(e){}
 authSetMode('in');
 var note=document.getElementById('authNote');
 if(note) note.textContent= sb ? 'One account, your whole family\u2019s OS. Cloud sync arrives in the very next update.' : 'You\u2019re offline right now, connect to the internet to create or use an account.';
 a.hidden=false; a.classList.add('is-on'); window.__panelOpenedAt=Date.now();
 try{ tsRender(); }catch(e){}
 try{ authShowResend(false); }catch(e){}
 setTimeout(function(){ var i=document.getElementById('authEmail'); if(i&&i.focus){ try{ i.focus(); }catch(e){} } },40);
 }
 function authAfterResolve(){
 if(_authFirstRun){ _authFirstRun=false;
 try{ if(!onbDone() && !FD.data.members.length){ onbMaybeStart(); } else if(!Store.get('fw.spaces.chosen',false) && !FD.data.members.length){ openSpPick(true); } }catch(e){}
 }
 }
 function closeAuth(asOffline){
 var a=document.getElementById('auth'); if(a){ a.classList.remove('is-on'); a.hidden=true; }
 if(asOffline){ Store.set('fw.auth.mode','local'); renderAccountCard(); if(typeof flash==='function') flash('Using Wisal on this device'); }
 authAfterResolve();
 }
 function authShowResend(on){ var b=document.getElementById('authResend'); if(b) b.hidden=!on; }
 function authResend(){
   if(!sb){ authErr('No connection.'); return; }
   var e=document.getElementById('authEmail'); var email=((e&&e.value)||'').trim();
   if(!email || email.indexOf('@')<1){ authErr('Enter your email first.'); return; }
   var captchaToken=tsToken();
   if(!captchaToken){ authErr('Please complete the CAPTCHA, then tap Resend.'); return; }
   authErr(''); var b=document.getElementById('authResend'); if(b) b.disabled=true;
   sb.auth.resend({ type:'signup', email:email, options:{ captchaToken:captchaToken, emailRedirectTo:location.origin } }).then(function(res){
     if(b) b.disabled=false; tsReset();
     if(res && res.error){ authErr(authFriendly(res.error)); return; }
     var n=document.getElementById('authNote'); if(n) n.textContent='Sent again to '+email+' \u2014 check your inbox and spam. If nothing arrives, email confirmation is likely off or unconfigured in Supabase.';
   }).catch(function(){ if(b) b.disabled=false; tsReset(); authErr('Could not resend, please try again.'); });
 }
 function doAuth(){
 if(!sb){ authErr('No connection, connect to the internet and try again, or continue offline below.'); return; }
 var e=document.getElementById('authEmail'), p=document.getElementById('authPass');
 var email=((e&&e.value)||'').trim(), pass=(p&&p.value)||'';
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){ authErr('Please enter a valid email \u2014 check for a missing dot, e.g. name@gmail.com'); return; }
 if(!pass || pass.length<6){ authErr('Password needs at least 6 characters.'); return; }
 var captchaToken=tsToken();
 if(!captchaToken){ authErr('Please wait for the CAPTCHA to finish, then try again.'); return; }
 tsReset(); /* single-use token: retire it now and start a fresh one */
 authErr(''); authBusy(true);
 var call=(_authMode==='in') ? sb.auth.signInWithPassword({email:email,password:pass,options:{captchaToken:captchaToken}}) : sb.auth.signUp({email:email,password:pass,options:{captchaToken:captchaToken,emailRedirectTo:location.origin}});
 call.then(function(res){
 authBusy(false);
 if(res.error){ authErr(authFriendly(res.error)); tsReset(); return; }
 var user=(res.data&&res.data.user)||null, sess=res.data&&res.data.session;
 if(_authMode==='up' && !sess){
 var t=document.getElementById('authTitle'); if(t) t.textContent='Check your email';
 var n=document.getElementById('authNote'); if(n) n.textContent='We sent a confirmation link to '+email+'. Tap it, then come back and sign in \u2014 check your spam folder too.';
 tsReset(); authSetMode('in'); authShowResend(true); return;
 }
 var _newUid=(user&&user.id)||'';
   var _prevUid=Store.get('fw.auth.uid','');
   if(_newUid && _prevUid && _newUid!==_prevUid){ try{ wipeLocalData(); }catch(e){} }
   AUTH.user=user||AUTH.user;
   authRemember(AUTH.user);
   Store.set('fw.auth.mode','cloud');
   renderAccountCard(); renderHouseholdCard();
   try{ cloudPull(); }catch(e){}
   try{ wisalSyncPlan(); }catch(e){}
 try{ _chLoaded=false; _chSub=null; if(currentView==='ai') chGate(); }catch(e){}
 try{ hideAuthGate(); }catch(e){}
   try{ if(!onbDone() && !FD.data.members.length){ onbMaybeStart(); } else if(!Store.get('fw.spaces.chosen',false) && !FD.data.members.length){ openSpPick(true); } }catch(e){}
   if(typeof flash==='function') flash('Signed in, welcome!');
 }).catch(function(){ authBusy(false); authErr('Network error, please try again.'); tsReset(); });
 }
 function acctDelete(){
 if(!AUTH.user){ flash('Sign in first'); return; }
 if(!confirm('Delete your Wisal account data?\n\nThis erases your cloud copy, your chat messages and your household membership, signs you out, and clears this device.')) return;
 if(!confirm('Last check, this cannot be undone. Delete everything?')) return;
 var me=AUTH.user.id;
 var fin=function(){ try{ if(sb) sb.auth.signOut(); }catch(e){} try{ Store.clearAll(); }catch(e){} try{ location.reload(); }catch(e){} };
 if(!sb){ fin(); return; }
 /* Ask the server to remove the auth record too. The browser cannot delete an auth
    user itself, and leaving it behind means the email can never be reused. If the
    function is not deployed yet we fall through to clearing the data rows only. */
 var serverDelete=function(){
   return new Promise(function(resolve){
     var done=function(){ resolve(false); };
     try{
       sb.auth.getSession().then(function(r){
         var tok=r&&r.data&&r.data.session ? r.data.session.access_token : '';
         if(!tok){ done(); return; }
         fetch(SUPA_URL+'/functions/v1/wisal-delete-account',{
           method:'POST',
           headers:{ 'Content-Type':'application/json', 'apikey':SUPA_KEY, 'Authorization':'Bearer '+tok }
         }).then(function(r2){ return r2.json(); })
           .then(function(d){ resolve(!!(d&&d.ok)); })
           .catch(done);
       }).catch(done);
     }catch(e){ done(); }
   });
 };
 serverDelete().then(function(fullyRemoved){
   if(fullyRemoved){ fin(); return; }
   sb.from('family_messages')['delete']().eq('user_id',me)
 .then(function(){ return sb.from('family_members')['delete']().eq('member_id',me); }, function(){ return sb.from('family_members')['delete']().eq('member_id',me); })
 .then(function(){ return sb.from('family_data')['delete']().eq('user_id',me); }, function(){ return sb.from('family_data')['delete']().eq('user_id',me); })
 .then(fin, fin);
 });
 }
 function wipeLocalData(){
   // Securely clear this device of the current account's family data + sync state.
   // Used on account-switch (before loading a different user) and on sign-out wipe.
   try{ Store.set(FD.KEY, null); }catch(e){}
   try{
     ['fw.sync.ts','fw.sync.row','fw.sync.code','fw.sync.rescue','fw.family','fw.family.data'].forEach(function(k){ try{ localStorage.removeItem(k); }catch(e){} });
   }catch(e){}
   try{ _chMsgs=[]; _chLoaded=false; _chSub=null; }catch(e){}
   try{ FD.load(); }catch(e){}   // re-init a fresh, empty dataset
 }
 function doSignOut(){
   if(!confirm('Sign out?\n\nYour cloud copy stays safe. Choose OK to sign out.')) return;
   var wipe=confirm('For your privacy: clear this account\u2019s data from THIS device?\n\nOK = clear it (recommended on shared devices).\nCancel = keep it on this device for offline viewing.');
   if(sb){ try{ sb.auth.signOut(); }catch(e){} }
   AUTH.user=null; authRemember(null); Store.set('fw.auth.mode','local');
   if(wipe){ try{ wipeLocalData(); }catch(e){} }
   else { Store.set('fw.sync.ts',''); Store.set('fw.sync.row',''); Store.set('fw.sync.code',''); _chMsgs=[]; _chLoaded=false; _chSub=null; }
   renderAccountCard(); renderHouseholdCard(); try{ if(currentView==='ai') chGate(); }catch(e){}
   try{ refreshAll(); }catch(e){}
   try{ showAuthGate(); }catch(e){}
   if(typeof flash==='function') flash(wipe?'Signed out, this device cleared':'Signed out');
 }
  function renderAccountCard(){
 var el=document.getElementById('accountBody'); if(!el) return;
 if(AUTH.user){
 el.innerHTML='<p class="set__p"><strong>Signed in</strong> as '+esc(AUTH.user.email||'')+'.</p>'
 +'<p class="set__p acct__soon">Cloud sync: <strong id="syncStatus">checking\u2026</strong> \u00b7 Backups are still wise.</p>'
 +'<div class="acctd">'+'<div class="acctd__r"><span>Email</span><b>'+esc(AUTH.user.email||'')+'</b></div>'+'<div class="acctd__r"><span>User ID</span><b class="acctd__mono">'+esc(String(AUTH.user.id||'').slice(0,8))+'&hellip;</b></div>'+'<div class="acctd__r"><span>Role</span><b>'+esc((typeof myRole==='function'? myRole():'member'))+'</b></div>'+'</div>'+'<div class="field"><button class="btn btn--soft" type="button" data-auth-signout>Sign out</button></div>'+'<button class="acctdel" type="button" data-acct-delete>Delete account &amp; data</button>'+'<p class="acct__soon">Erases your cloud data, chat messages and membership, signs you out, and clears this device.</p>';
 } else {
 var offline=!sb;
 el.innerHTML='<p class="set__p">'+(offline?'Connect to the internet to create your Wisal account.':'One account for your family, unlocks cloud sync and shared access in the next updates.')+'</p>'
 +'<div class="field"><button class="btn btn--primary" type="button" data-auth-open'+(offline?' disabled':'')+'>Sign in / Create account</button></div>';
 }
 try{ var sm=document.getElementById('storageMode'); if(sm) sm.textContent = AUTH.user? 'This device + Cloud' : 'This device'; }catch(e){}
 try{ var sw2=document.getElementById('sxWho'); if(sw2) sw2.textContent = AUTH.user? (AUTH.user.email||'Signed in') : 'Not signed in, tap Account'; }catch(e){}
 try{ renderSetIndex(); }catch(e){}
 }
 function authInit(){
   try{ showAuthGate(); }catch(e){}   // gate appears instantly; hidden only once a valid session is confirmed
   if(!sb){ renderAccountCard(); renderHouseholdCard(); return; }
   try{
     sb.auth.getSession().then(function(r){ var s=r&&r.data&&r.data.session; if(s&&s.user){ AUTH.user=s.user; authRemember(s.user); Store.set('fw.auth.mode','cloud'); try{ hideAuthGate(); }catch(e){} try{ cloudPull(); }catch(e){} } else { AUTH.user=null; authRemember(null); try{ wipeLocalData(); }catch(e){} try{ showAuthGate(); }catch(e){} } renderAccountCard(); renderHouseholdCard(); chRefreshView(); }).catch(function(){ try{ showAuthGate(); }catch(e){} renderAccountCard(); renderHouseholdCard(); chRefreshView(); });
 sb.auth.onAuthStateChange(function(ev,session){ if(session&&session.user){ AUTH.user=session.user; authRemember(session.user); try{ hideAuthGate(); }catch(e){} try{ authCleanUrl(); }catch(e){} } else if(ev==='SIGNED_OUT'){ AUTH.user=null; authRemember(null); try{ wipeLocalData(); }catch(e){} try{ showAuthGate(); }catch(e){} } renderAccountCard(); renderHouseholdCard(); _chLoaded=false; _chSub=null; chRefreshView(); });
 }catch(e){ renderAccountCard(); renderHouseholdCard(); }
 }
 /* After an email-confirmation / magic link, Supabase returns tokens in the URL.
    The session is already stored by then, so wipe the URL and greet the user. */
 function authCleanUrl(){
   try{
     var h=location.hash||'', s=location.search||'';
     var dirty = h.indexOf('access_token')>=0 || h.indexOf('refresh_token')>=0 || h.indexOf('type=signup')>=0 || /[?&]code=/.test(s);
     if(!dirty) return;
     try{ history.replaceState({},'',location.pathname); }catch(e){}
     if(typeof flash==='function') flash('Email confirmed \u2014 welcome to Wisal!');
   }catch(e){}
 }
 function showAuthGate(){
   var a=document.getElementById('auth'); var app=document.getElementById('app');
   if(app) app.style.display='none';           // hide the whole app behind the gate
   if(a){ a.hidden=false; a.classList.add('is-on'); }
   try{ authSetMode('in'); }catch(e){}
   var t=document.getElementById('authTitle'); if(t) t.textContent='Welcome to Wisal';
   var n=document.getElementById('authNote'); if(n) n.textContent='Sign in or create your account to continue.';
   setTimeout(function(){ var i=document.getElementById('authEmail'); if(i&&i.focus){ try{ i.focus(); }catch(e){} } },60);
 }
 function hideAuthGate(){
   var a=document.getElementById('auth'); var app=document.getElementById('app');
   if(a){ a.classList.remove('is-on'); a.hidden=true; }
   if(app) app.style.display='';
 }
 /* ==================== Subscription (Wisal Plus) ==================== */
 /* Source of truth = the Supabase "subscriptions" table (written by the wisal-pay-ipn function). */
 function isPlus(){ try{ return Store.get('fw.plan.tier','free')==='plus'; }catch(e){ return false; } }
 function wisalSetTier(t){ try{ var e=document.getElementById('setPlanName'); if(e) e.textContent = (t==='plus'?'Wisal Plus':'Wisal Free'); }catch(_){} try{ Store.set('fw.plan.tier', t==='plus'?'plus':'free'); }catch(e){} }
 function wisalSyncPlan(){
   if(!sb || !sb.auth) return;
   try{ sb.auth.getSession().then(function(r){
     var s=r&&r.data&&r.data.session; if(!s||!s.user) return;
     sb.from('subscriptions').select('tier,status,current_period_end').eq('user_id',s.user.id).maybeSingle()
       .then(function(res){ var row=res&&res.data; if(!row) return;
         var active = row.status==='active' && (!row.current_period_end || new Date(row.current_period_end).getTime()>Date.now());
         wisalSetTier(active && row.tier==='plus' ? 'plus' : 'free');
       }).catch(function(){});
   }).catch(function(){}); }catch(e){}
 }
 /* Arriving from the standalone pricing page: open the paywall on the chosen cycle. */
 function wisalHandleUpgradeLink(){
   try{
     var q=new URLSearchParams(location.search), u=q.get('upgrade');
     if(!u) return;
     history.replaceState({},'',location.pathname);
     if(typeof isPlus==='function' && isPlus()){
       if(typeof flash==='function') flash('You are already on Wisal Plus.');
       return;
     }
     setTimeout(function(){
       try{
         onbPay={ cycle:(u==='year'?'year':'month'), method:null, view:'plans', busy:false, note:'' };
         onbState.step=6;
         var a=document.getElementById('onb'); if(a){ a.hidden=false; a.classList.add('is-on'); }
         onbRender();
       }catch(e){}
     },300);
   }catch(e){}
 }
 function wisalHandlePaymentReturn(){
   try{ var q=new URLSearchParams(location.search), r=q.get('wisal_pay');
     if(r==='success'){ wisalSetTier('plus'); try{ Store.set('fw.plan.pending',null); }catch(e){} if(typeof flash==='function') flash('Welcome to Wisal Plus \u2014 thank you!'); try{ wisalSyncPlan(); }catch(e){} }
     else if(r==='fail'||r==='cancel'){ if(typeof flash==='function') flash('Payment not completed \u2014 you\u2019re still on Free.'); }
     if(r){ try{ history.replaceState({},'',location.pathname); }catch(e){} }
   }catch(e){}
 }
 function bootOnboarding(){
   // The hard auth gate (in the getSession boot) decides access. If no Supabase client
   // is present at all, fall back to showing the gate so nothing private renders.
   if(!sb){ try{ showAuthGate(); }catch(e){} return; }
 }
 (function(){ var p=document.getElementById('authPass'); if(p&&p.addEventListener) p.addEventListener('keydown',function(ev){ if(ev.key==='Enter'){ ev.preventDefault(); doAuth(); } }); })();

 /* ===================== CLOUD SYNC (backend step 2) ===================== */
 var _pushT=null, _pulling=false;
 function cloudEnabled(){ return !!(sb && AUTH.user && Store.get('fw.auth.mode',null)==='cloud'); }
 function syncStatus(t){ var s=document.getElementById('syncStatus'); if(s) s.textContent=t; }
 function hasLocalData(){ try{ var d=FD.data; return !!((d.members&&d.members.length)||(d.planning&&d.planning.tasks.length)||(d.journal&&d.journal.entries.length)||(d.finance&&d.finance.transactions.length)); }catch(e){ return true; } }
 function queuePush(){ if(!cloudEnabled()) return; clearTimeout(_pushT); _pushT=setTimeout(cloudPush,2500); syncStatus('saving\u2026'); }
 function cloudPush(){
 if(!cloudEnabled()) return; syncStatus('syncing\u2026');
 var ts=new Date().toISOString();
 var me=AUTH.user.id, key=Store.get('fw.sync.row','')||me;
 var done=function(r){ if(r&&r.error){ syncStatus('couldn\u2019t sync, will retry on next change'); return; } Store.set('fw.sync.row',key); Store.set('fw.sync.ts',ts); syncStatus('up to date'); };
 var fail=function(){ syncStatus('offline, will sync when online'); };
 if(key!==me){
 sb.from('family_data').update({data:FD.data,updated_at:ts}).eq('user_id',key).then(done).catch(fail);
 } else {
 sb.from('family_data').upsert({user_id:me,data:FD.data,updated_at:ts}).then(done).catch(fail);
 }
 }
 function adoptCloud(row){
 try{ localStorage.setItem('fw.sync.rescue', JSON.stringify(FD.data)); }catch(e){}
 var _oldMemEmails={}; try{ (FD.data.members||[]).forEach(function(m){ if(m.email) _oldMemEmails[String(m.email).toLowerCase()]=1; }); }catch(e){}
 var _oldAssign={}; try{
 var _meN=(meMember()&&meMember().name||'').toLowerCase();
 if(_meN){
 (FD.data.planning.tasks||[]).forEach(function(t){ if(String(t.member||'').toLowerCase()===_meN) _oldAssign['t:'+t.id]=1; });
 ((FD.data.home&&FD.data.home.chores)||[]).forEach(function(c){ if(String(c.assignee||'').toLowerCase()===_meN) _oldAssign['c:'+c.id]=1; });
 }
 }catch(e){}
 Store.set(FD.KEY, (row&&row.data)||{});
 try{ FD.load(); }catch(e){}
 try{
 if(AUTH.user&&AUTH.user.email&&hhIsGuest()&&!meMember()){
 var _nm=String(AUTH.user.email).split('@')[0]||'Member'; _nm=_nm.charAt(0).toUpperCase()+_nm.slice(1);
 FD.addMember({name:_nm,relation:'Family',email:String(AUTH.user.email).toLowerCase(),role:'member'});
 if(typeof flash==='function') flash('Welcome, you\u2019ve been added to the family');
 }
 }catch(e){}
 try{
 var _meE=(AUTH.user&&AUTH.user.email||'').toLowerCase(), _joined=[];
 (FD.data.members||[]).forEach(function(m){ var e2=String(m.email||'').toLowerCase(); if(e2 && !_oldMemEmails[e2] && e2!==_meE) _joined.push(m.name||e2); });
 if(_joined.length){
 var _who=_joined.join(', ');
 if(typeof flash==='function') flash(_who+' joined your family');
 try{ notifShow('New family member', _who+' just joined, say salam!', 'wisal-join-'+_who, 'family'); }catch(e2){}
 }
 }catch(e){}
 try{
 var _meN2=(meMember()&&meMember().name||'').toLowerCase();
 if(_meN2){
 var _as=[];
 (FD.data.planning.tasks||[]).forEach(function(t){ if(!t.done && String(t.member||'').toLowerCase()===_meN2 && !_oldAssign['t:'+t.id]) _as.push(t.title||'A task'); });
 ((FD.data.home&&FD.data.home.chores)||[]).forEach(function(c){ if(String(c.assignee||'').toLowerCase()===_meN2 && !_oldAssign['c:'+c.id]) _as.push(c.title||'A chore'); });
 if(_as.length){
 var _ab=_as.slice(0,2).join(' \u00b7 ')+(_as.length>2?' \u00b7 +'+(_as.length-2)+' more':'');
 if(typeof flash==='function') flash('Assigned to you: '+_as[0]+(_as.length>1?' +'+(_as.length-1):''));
 try{ notifShow('Assigned to you', _ab, 'wisal-assign', 'dashboard'); }catch(e2){}
 }
 }
 }catch(e){}
 Store.set('fw.sync.ts', (row&&row.updated_at)||'');
 try{ refreshAll(); }catch(e){}
 try{ chReset(); }catch(e){}
 try{ if(FD.data.ai&&Array.isArray(FD.data.ai.thread)){ aiThread=FD.data.ai.thread.slice(); if(typeof commTab!=='undefined'&&commTab==='assistant'&&currentView==='ai'){ renderComm(); } } }catch(e){}
 syncStatus('up to date'); try{ renderHouseholdCard(); }catch(e){}
 if(typeof flash==='function') flash('Synced from your cloud');
 }
 function cloudPull(){
 if(!cloudEnabled()||_pulling) return; _pulling=true; syncStatus('syncing\u2026');
 sb.from('family_data').select('user_id,data,updated_at,invite_code').eq('user_id',AUTH.user.id)
 .then(function(r){
 _pulling=false;
 if(r.error){ syncStatus('error, will retry'); return; }
 var rows=r.data||[], me=AUTH.user.id;
 var own=null;
 rows.forEach(function(x){ if(x.user_id===me) own=x; });
 var row=own;
 var prevKey=Store.get('fw.sync.row','');
 var key=row? row.user_id : '';
 Store.set('fw.sync.row', key);
 if(own && own.invite_code) Store.set('fw.sync.code', own.invite_code);
 if(key!==prevKey){ if(prevKey) Store.set('fw.sync.ts',''); try{ chReset(); }catch(e){} }
 if(!row){ if(hasLocalData()) cloudPush(); else syncStatus('on \u00b7 add something and it will sync'); return; }
 if(!hasLocalData()){ adoptCloud(row); return; }
 var known=Store.get('fw.sync.ts','');
 if(row.updated_at && String(row.updated_at)>String(known||'')){ adoptCloud(row); }
 else { cloudPush(); }
 })
 .catch(function(){ _pulling=false; syncStatus('offline, will sync when online'); });
 }
 window.addEventListener('online', function(){ try{ cloudPull(); }catch(e){} });

 /* ===================== PHONE NOTIFICATIONS (system-level) ===================== */
 function notifSupported(){ try{ return ('Notification' in window); }catch(e){ return false; } }
 function notifGranted(){ try{ return notifSupported() && Notification.permission==='granted'; }catch(e){ return false; } }
 function notifOn(){ return notifGranted() && Store.get('fw.notif.on', true)!==false; }
 function notifShow(title, body, tag, view){
 if(!notifGranted()) return;
 var opts={ body:body||'', tag:tag||'wisal', renotify:false,
 icon:(typeof PWA_ICONS!=='undefined'?PWA_ICONS.i192:undefined),
 badge:(typeof PWA_ICONS!=='undefined'?PWA_ICONS.i192:undefined),
 data:{ url:'./#'+(view||'dashboard') } };
 try{
 if(navigator.serviceWorker && navigator.serviceWorker.ready){
 navigator.serviceWorker.ready.then(function(reg){
 if(reg && reg.showNotification) reg.showNotification(title, opts);
 else notifFallback(title, opts, view);
 }).catch(function(){ notifFallback(title, opts, view); });
 return;
 }
 }catch(e){}
 notifFallback(title, opts, view);
 }
 function notifFallback(title, opts, view){
 /* Android Chrome forbids new Notification() in a page, this is only for desktop */
 try{ var n=new Notification(title, opts); n.onclick=function(){ try{ window.focus(); navigate(view||'dashboard'); }catch(e){} n.close(); }; }catch(e){}
 }
 function notifAsk(cb){
 if(!notifSupported()){ flash('Notifications aren\u2019t supported on this browser'); return; }
 try{
 Notification.requestPermission().then(function(p){
 if(p==='granted'){ Store.set('fw.notif.on', true); flash('Notifications are on'); notifShow('Wisal is watching your day','You\u2019ll hear from us when something needs you.','wisal-welcome','dashboard'); }
 else flash('Notifications stayed off');
 renderNotifCard(); try{ chRefreshView(); }catch(e){}
 if(typeof cb==='function') cb(p);
 }).catch(function(){});
 }catch(e){}
 }
 /* --- dedupe: never say the same thing twice --- */
 function notifSeen(){ var o=Store.get('fw.notif.seenmap',null); return (o&&typeof o==='object')?o:{}; }
 function notifWas(key){ return !!notifSeen()[key]; }
 function notifMark(keys){
 var m=notifSeen(), now=Date.now();
 keys.forEach(function(k){ m[k]=now; });
 Object.keys(m).forEach(function(k){ if(now-m[k] > 35*86400000) delete m[k]; });
 Store.set('fw.notif.seenmap', m);
 }
 /* --- money: is it overflowing today / this week / this month? --- */
 function moneyAlerts(){
 var out=[], F=FD.data.finance, budgets=F.budgets||{}, cats=Object.keys(budgets);
 if(!cats.length) return out; /* no budget set \u2192 nothing honest to say */
 var total=0; cats.forEach(function(k){ total+=Number(budgets[k])||0; });
 if(total<=0) return out;
 var sym=''; try{ sym=curSymbol(); }catch(e){}
 function money(n){ return sym+Math.round(n).toLocaleString(); }
 var ym=curYM(), today=todayStr();
 var d=new Date(), dim=new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
 var dayPace=total/dim, weekPace=total*7/dim;
 var wk={}; try{ ckWeekDates(0).forEach(function(x){ wk[x]=1; }); }catch(e){}
 var mSpend=0, wSpend=0, dSpend=0, byCat={};
 (F.transactions||[]).forEach(function(t){
 if(t.type!=='expense') return;
 var amt=Number(t.amount)||0, dt=String(t.date||'');
 if(dt.slice(0,7)===ym){ mSpend+=amt; var c=t.category||'other'; byCat[c]=(byCat[c]||0)+amt; }
 if(wk[dt]) wSpend+=amt;
 if(dt===today) dSpend+=amt;
 });
 if(mSpend>total) out.push({k:'m:over:'+ym, t:'Over budget this month', b:money(mSpend)+' spent of '+money(total)+', '+money(mSpend-total)+' over.', v:'finance'});
 else if(mSpend >= total*0.9) out.push({k:'m:near:'+ym, t:'Close to your monthly budget', b:Math.round(mSpend/total*100)+'% used, '+money(total-mSpend)+' left.', v:'finance'});
 var wkKey=''; try{ wkKey=ckWeekDates(0)[0]; }catch(e){}
 if(wSpend>weekPace && wkKey) out.push({k:'w:over:'+wkKey, t:'A heavy week', b:money(wSpend)+' spent this week, above your '+money(weekPace)+' pace.', v:'finance'});
 if(dSpend>dayPace*1.5) out.push({k:'d:over:'+today, t:'A big spending day', b:money(dSpend)+' today, well above your '+money(dayPace)+' daily pace.', v:'finance'});
 cats.forEach(function(c){
 var lim=Number(budgets[c])||0, sp=byCat[c]||0;
 if(lim>0 && sp>lim) out.push({k:'c:over:'+c+':'+ym, t:ckCap(c)+' is over budget', b:money(sp)+' of '+money(lim)+', '+money(sp-lim)+' over.', v:'finance'});
 });
 return out;
 }
 /* --- fire the relevant reminder the instant you log anything, anywhere --- */
 var _sweepT=null;
 function queueNotifSweep(){
 if(!notifOn()) return;
 clearTimeout(_sweepT);
 _sweepT=setTimeout(function(){ try{ notifSweep(); }catch(e){} }, 1400);
 }
 /* --- the sweep: everything the day is asking of you --- */
 function notifSweep(){
 if(!notifOn()) return;
 var fire=[], t=todayStr();
 if(Store.get('fw.notif.tasks', true)!==false){
 var life=[]; try{ life=buildNotifications(); }catch(e){}
 life.filter(function(a){ return a.sev==='urgent'||a.sev==='today'; }).forEach(function(a){
 fire.push({ k:'a:'+a.sp+':'+a.t+':'+t, t:a.t, b:a.s||'Wisal', v:a.sp });
 });
 }
 if(Store.get('fw.notif.money', true)!==false){
 try{ moneyAlerts().forEach(function(m){ fire.push(m); }); }catch(e){}
 }
 var fresh=fire.filter(function(x){ return !notifWas(x.k); });
 if(!fresh.length) return;
 if(fresh.length<=2){
 fresh.forEach(function(x){ notifShow(x.t, x.b, x.k, x.v); });
 } else {
 var more=fresh.length-2;
 notifShow(fresh.length+' things need you', fresh[0].t+' \u00b7 '+fresh[1].t+' \u00b7 and '+more+' more', 'wisal-daily', 'dashboard');
 }
 notifMark(fresh.map(function(x){ return x.k; }));
 }
 /* --- money watch: fires the moment you log the spend --- */
 function moneyWatch(){
 if(!notifOn() || Store.get('fw.notif.money', true)===false) return;
 try{
 var fresh=moneyAlerts().filter(function(m){ return !notifWas(m.k); });
 if(!fresh.length) return;
 fresh.slice(0,2).forEach(function(m){ notifShow(m.t, m.b, m.k, 'finance'); });
 try{ chBeep(); }catch(e){}
 notifMark(fresh.map(function(m){ return m.k; }));
 }catch(e){}
 }
 function renderNotifCard(){
 var el=document.getElementById('notifBody'); if(!el) return;
 if(!notifSupported()){ el.innerHTML='<p class="set__p">This browser can\u2019t show phone notifications.</p>'; return; }
 if(!notifGranted()){
 el.innerHTML='<p class="set__p">Let Wisal tap you on the shoulder, an overdue task, a bill due today, a budget going over.</p>'
 +'<div class="field"><button class="btn btn--primary" type="button" data-notif-ask>Turn on notifications</button></div>';
 return;
 }
 function row(key,label,sub,def){
 var on = (key==='fw.notif.chatoff') ? (Store.get('fw.chat.mute',false)!==true) : (Store.get(key, def)!==false);
 return '<button class="ntgl'+(on?' is-on':'')+'" type="button" data-notif-toggle="'+key+'"><span class="ntgl__tx"><span class="ntgl__l">'+esc(label)+'</span><span class="ntgl__s">'+esc(sub)+'</span></span><span class="ntgl__sw"><span class="ntgl__dot"></span></span></button>';
 }
 var noBudget=false; try{ noBudget=!Object.keys(FD.data.finance.budgets||{}).length; }catch(e){}
 var moneyHint = noBudget ? '<p class="set__p" style="color:var(--warn-strong);font-size:.8rem">Money alerts need a budget, set one in Finance \u2192 Budget, then Wisal will warn you when a day, week or month runs over.</p>' : '';
 el.innerHTML='<p class="set__p">Wisal will reach you even when you\u2019re in another app, as long as it\u2019s open in the background.</p>'
 +'<div class="ntgls">'
 + row('fw.notif.on','All notifications','The master switch',true)
 + row('fw.notif.tasks','Reminders','Overdue tasks, bills, chores, appointments, birthdays',true)
 + row('fw.notif.money','Money alerts','When the day, week or month goes over budget',true)
 + row('fw.notif.chatoff','Chat messages','When your family writes to you',true)
 +'</div>'
 + moneyHint
 +'<div class="field"><button class="btn btn--soft" type="button" data-notif-test>Send a test</button></div>';
 }
 function notifToggle(key){
 if(key==='fw.notif.chatoff'){ var muted=Store.get('fw.chat.mute',false); Store.set('fw.chat.mute', !muted); }
 else { var cur=Store.get(key, true)!==false; Store.set(key, !cur); }
 renderNotifCard();
 }

 /* ===================== CHATS: realtime family messages ===================== */
 var _chSub=null, _chMsgs=[], _chLoaded=false;
 var chReply=null, chEditing=null, _chSeen={}, _chTyping={}, _chTypeT=null, _chLastTyped=0, _chMaxId=0;
 var CH_EMO=['\u2764\uFE0F','\uD83D\uDC4D','\uD83D\uDE02','\uD83D\uDE2E','\uD83D\uDE22','\uD83E\uDD32'];
 /* --- alerts: ring + vibrate + system popup --- */
 function chBeep(){
 try{
 var C=window.AudioContext||window.webkitAudioContext; if(!C) return;
 var a=new C(), o=a.createOscillator(), g=a.createGain(), t=a.currentTime;
 o.type='sine'; o.frequency.setValueAtTime(880,t); o.frequency.setValueAtTime(1320,t+0.09);
 g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.16,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+0.30);
 o.connect(g); g.connect(a.destination); o.start(t); o.stop(t+0.32);
 }catch(e){}
 }
 var _popT=null;
 function chPopup(name,preview){
 var p=document.getElementById('chatPop'); if(!p) return;
 var av=document.getElementById('chatPopAv'), n=document.getElementById('chatPopN'), t=document.getElementById('chatPopP');
 if(av) av.textContent=String(name||'F').charAt(0).toUpperCase();
 if(n) n.textContent=name||'Family';
 if(t) t.textContent=preview||'';
 p.hidden=false; p.classList.add('is-on');
 clearTimeout(_popT); _popT=setTimeout(chPopHide,6000);
 }
 function chPopHide(){ var p=document.getElementById('chatPop'); if(p){ p.classList.remove('is-on'); p.hidden=true; } }
 function chEnableAlerts(){ try{ chAskNotify(); }catch(e){} setTimeout(chRefreshView,600); }
 function chNotify(author,preview){
 if(Store.get('fw.chat.mute',false)) return;
 chBeep();
 try{ if(navigator.vibrate) navigator.vibrate([18,60,18]); }catch(e){}
 try{ if(!document.hidden && currentView!=='ai') chPopup(author,preview); }catch(e){}
 try{
 if(window.Notification && Notification.permission==='granted' && document.hidden){
 var n=new Notification(author+' \u00b7 Wisal', {body:preview, tag:'wisal-chat', renotify:true});
 n.onclick=function(){ try{ window.focus(); navigate('ai'); n.close(); }catch(e){} };
 }
 }catch(e){}
 }
 function chAskNotify(){
 try{ if(window.Notification && Notification.permission==='default'){ Notification.requestPermission().then(function(p){ if(p==='granted') flash('Message alerts are on'); }); } }catch(e){}
 }
 function chHouse(){ return Store.get('fw.sync.row','') || (AUTH.user? AUTH.user.id : ''); }
 function chWho(){ var m=meMember(); if(m&&m.name) return m.name; var e=(AUTH.user&&AUTH.user.email)||''; return e? e.split('@')[0] : 'Someone'; }
 function chTime(ts){ try{ var d=new Date(ts); return p2(d.getHours())+':'+p2(d.getMinutes()); }catch(e){ return ''; } }
 function chDayLabel(ts){
 var d=new Date(ts), n=new Date(); d.setHours(0,0,0,0); n.setHours(0,0,0,0);
 var diff=Math.round((n-d)/86400000);
 if(diff===0) return 'Today'; if(diff===1) return 'Yesterday';
 return jDateLabel(d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate()));
 }
 /* --- typing indicator (broadcast, not stored) --- */
 function chTyped(){
 if(!cloudEnabled()||!_chSub) return;
 var now=Date.now(); if(now-_chLastTyped<2000) return; _chLastTyped=now;
 try{ _chSub.send({type:'broadcast',event:'typing',payload:{who:chWho(),id:AUTH.user.id}}); }catch(e){}
 }
 function chTypingText(){
 var names=[], now=Date.now();
 Object.keys(_chTyping).forEach(function(k){ if(now-_chTyping[k].t<4000) names.push(_chTyping[k].who); });
 if(!names.length) return '';
 return names.join(', ')+(names.length>1?' are':' is')+' typing\u2026';
 }
 /* --- read receipts --- */
 function chMarkSeen(){
 if(!cloudEnabled()||!_chMaxId) return;
 var mine=Store.get('fw.chat.seen',0);
 if(_chMaxId<=mine) return;
 Store.set('fw.chat.seen',_chMaxId);
 try{ sb.from('family_reads').upsert({household_id:chHouse(),user_id:AUTH.user.id,last_seen_id:_chMaxId,updated_at:new Date().toISOString()},{onConflict:'household_id,user_id'}).then(function(){}).catch(function(){}); }catch(e){}
 }
 function chSeenBy(rid){
 if(!rid) return 0; var id=+String(rid).replace('c',''), n=0, me=AUTH.user&&AUTH.user.id;
 Object.keys(_chSeen).forEach(function(u){ if(u!==me && _chSeen[u]>=id) n++; });
 return n;
 }
 function chTicks(m){
 if(!cloudEnabled()||!m.rid||m.from!=='') return '';
 var seen=chSeenBy(m.rid);
 return '<span class="ctick'+(seen?' ctick--seen':'')+'">'+(seen
 ? '<svg viewBox="0 0 20 12"><path d="M1 6.5 4.5 10 11 2.5"/><path d="M8 9.5 9.5 11 19 1"/></svg>'
 : '<svg viewBox="0 0 20 12"><path d="M3 6.5 6.5 10 15 1"/></svg>')+'</span>';
 }
 function chSignedIn(){ return !!(AUTH && AUTH.user); }
 function chRefreshView(){ try{ if(currentView==='ai') chGate(); }catch(e){} }
 function chAlertsAsk(){
 try{
 if(!('Notification' in window)) return false;
 if(Notification.permission!=='default') return false;
 return !Store.get('fw.chat.alertskip', false);
 }catch(e){ return false; }
 }
 function chGate(){
 var g=document.getElementById('chatGate'); if(!g) return;
 if(!chSignedIn()){
 g.hidden=false;
 g.innerHTML='<div class="chat__signin"><div><span class="chat__signint">Messages stay on this device</span><span class="chat__signins">Sign in so they reach your family, live.</span></div><button class="btn btn--soft" type="button" data-auth-open>Sign in</button></div>';
 } else if(chAlertsAsk()){
 g.hidden=false;
 g.innerHTML='<div class="chat__signin"><div><span class="chat__signint">Get alerted for new messages</span><span class="chat__signins">A gentle sound and a pop-up when your family writes.</span></div><span class="chat__gacts"><button class="btn btn--soft" type="button" data-chat-alerts>Turn on</button><button class="chat__skip" type="button" data-chat-alerts-skip>Not now</button></span></div>';
 } else { g.hidden=true; }
 if(chSignedIn() && cloudEnabled() && !_chLoaded) chLoad();
 try{ renderComm(); }catch(e){}
 }

 function chLoad(){
 if(!cloudEnabled()) return;
 _chLoaded=true;
 sb.from('family_messages').select('id,user_id,author,body,created_at,reply_to,edited_at,deleted,reactions').eq('household_id',chHouse()).order('created_at',{ascending:true}).limit(300)
 .then(function(r){ if(r.error) return; (r.data||[]).forEach(chAbsorb); try{ renderComm(); }catch(e){} chSubscribe(); chLoadReads(); chMarkSeen(); })
 .catch(function(){});
 }
 function chLoadReads(){
 if(!cloudEnabled()) return;
 sb.from('family_reads').select('user_id,last_seen_id').eq('household_id',chHouse())
 .then(function(r){ if(r.error) return; (r.data||[]).forEach(function(x){ _chSeen[x.user_id]=x.last_seen_id; }); try{ renderComm(); }catch(e){} })
 .catch(function(){});
 }
 function chAbsorb(row){
 try{
 var ch=FD.getChannel(currentChannelId)||FD.data.channels[0]; if(!ch) return;
 var rid='c'+row.id; if(+row.id>_chMaxId) _chMaxId=+row.id;
 var ex=null; ch.messages.forEach(function(m){ if(m.rid===rid) ex=m; });
 var payload={}; try{ payload=JSON.parse(row.body); }catch(e){ payload={text:row.body}; }
 var mine=(AUTH.user && row.user_id===AUTH.user.id);
 if(ex){
 ['text','photo','audio','file'].forEach(function(k){ if(payload[k]!=null) ex[k]=payload[k]; });
 ex.edited=!!row.edited_at; ex.reactions=row.reactions||{}; ex.deleted=!!row.deleted;
 Store.set(FD.KEY, FD.data); return;
 }
 var m={id:FD.uid(),rid:rid,ts:new Date(row.created_at).getTime(),from:(mine?'':(row.author||'Family')),pinned:false,
 replyTo:row.reply_to?('c'+row.reply_to):null, edited:!!row.edited_at, reactions:row.reactions||{}, deleted:!!row.deleted};
 ['text','photo','audio','file'].forEach(function(k){ if(payload[k]!=null) m[k]=payload[k]; });
 ch.messages.push(m); ch.messages.sort(function(a,b){ return a.ts-b.ts; });
 Store.set(FD.KEY, FD.data);
 }catch(e){}
 }
 function chReset(){
 try{ if(_chSub && sb && sb.removeChannel) sb.removeChannel(_chSub); }catch(e){}
 try{ if(_chSub && _chSub.unsubscribe) _chSub.unsubscribe(); }catch(e){}
 _chSub=null; _chLoaded=false;
 try{ chRefreshView(); }catch(e){}
 }
 function chSubscribe(){
 if(!sb||_chSub) return;
 try{
 _chSub=sb.channel('wisal-chat-'+chHouse())
 .on('postgres_changes',{event:'INSERT',schema:'public',table:'family_messages',filter:'household_id=eq.'+chHouse()},function(p){
 var m=p&&p.new; if(!m) return;
 if(AUTH.user && m.user_id===AUTH.user.id) return;
 chAbsorb(m); try{ renderComm(); }catch(e){}
 var pv={}; try{ pv=JSON.parse(m.body); }catch(e2){ pv={text:m.body}; }
 var prev=pv.text? String(pv.text).slice(0,60) : (pv.photo?'sent a photo':(pv.audio?'sent a voice message':'sent a file'));
 chNotify(m.author||'Family', prev);
 if(currentView!=='ai'){ if(typeof flash==='function') flash((m.author||'Family')+': '+prev); }
 else chMarkSeen();
 })
 .on('postgres_changes',{event:'UPDATE',schema:'public',table:'family_messages',filter:'household_id=eq.'+chHouse()},function(p){
 if(p&&p.new){ chAbsorb(p.new); try{ renderComm(); }catch(e){} }
 })
 .on('postgres_changes',{event:'*',schema:'public',table:'family_reads',filter:'household_id=eq.'+chHouse()},function(p){
 var r=p&&p.new; if(!r) return; _chSeen[r.user_id]=r.last_seen_id; try{ renderComm(); }catch(e){}
 })
 .on('broadcast',{event:'typing'},function(p){
 var d=p&&p.payload; if(!d||!AUTH.user||d.id===AUTH.user.id) return;
 _chTyping[d.id]={who:d.who,t:Date.now()};
 var el=document.getElementById('chTyping'); if(el) el.textContent=chTypingText();
 clearTimeout(_chTypeT); _chTypeT=setTimeout(function(){ var e2=document.getElementById('chTyping'); if(e2) e2.textContent=chTypingText(); },4200);
 })
 .subscribe();
 }catch(e){}
 }
 function chMirror(msg){
 if(!cloudEnabled()||!msg) return;
 var payload={};
 ['text','photo','audio','file'].forEach(function(k){ if(msg[k]!=null) payload[k]=msg[k]; });
 if(!Object.keys(payload).length) return;
 var row={household_id:chHouse(),user_id:AUTH.user.id,author:chWho(),body:JSON.stringify(payload)};
 if(msg.replyTo) row.reply_to=+String(msg.replyTo).replace('c','');
 sb.from('family_messages').insert(row).select('id').maybeSingle()
 .then(function(r){ if(r.error||!r.data) return; msg.rid='c'+r.data.id; if(+r.data.id>_chMaxId) _chMaxId=+r.data.id; Store.set(FD.KEY,FD.data); try{ renderComm(); }catch(e){} })
 .catch(function(){ if(typeof flash==='function') flash('Offline, they\u2019ll get it when you reconnect'); });
 }
 function chEditSave(m,text){
 m.text=text; m.edited=true; Store.set(FD.KEY,FD.data);
 if(cloudEnabled()&&m.rid){
 var payload={}; ['text','photo','audio','file'].forEach(function(k){ if(m[k]!=null) payload[k]=m[k]; });
 sb.from('family_messages').update({body:JSON.stringify(payload),edited_at:new Date().toISOString()}).eq('id',+String(m.rid).replace('c','')).then(function(){}).catch(function(){});
 }
 chEditing=null; renderComm();
 }
 function chReact(m,emo){
 if(!AUTH.user) return;
 var r=m.reactions||{}, me=AUTH.user.id;
 var list=(r[emo]||[]).slice(), i=list.indexOf(me);
 if(i>=0) list.splice(i,1); else list.push(me);
 if(list.length) r[emo]=list; else delete r[emo];
 m.reactions=r; Store.set(FD.KEY,FD.data); renderComm();
 if(cloudEnabled()&&m.rid) sb.from('family_messages').update({reactions:r}).eq('id',+String(m.rid).replace('c','')).then(function(){}).catch(function(){});
 }
 function chCloudDelete(m){
 if(cloudEnabled()&&m.rid) sb.from('family_messages').delete().eq('id',+String(m.rid).replace('c','')).then(function(){}).catch(function(){});
 }

 /* ===================== HOUSEHOLD: invite + join (backend step 3) ===================== */
 function hhCode(){ var A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s=''; for(var i=0;i<6;i++){ s+=A.charAt(Math.floor(Math.random()*A.length)); } return s; }
 function hhIsGuest(){ var k=Store.get('fw.sync.row',''); return !!(AUTH.user && k && k!==AUTH.user.id); }
 function meMember(){ try{ if(!AUTH.user||!AUTH.user.email) return null; var e=String(AUTH.user.email).toLowerCase(); var ms=FD.data.members; for(var i=0;i<ms.length;i++){ if(String(ms[i].email||'').toLowerCase()===e) return ms[i]; } }catch(err){} return null; }
 function myRole(){ var m=meMember(); if(m&&m.role) return String(m.role).toLowerCase(); try{ var row=Store.get('fw.sync.row',''); if(AUTH.user&&(!row||row===AUTH.user.id)) return 'owner'; }catch(e){} return 'member'; }
 function canManage(){ var r=myRole(); return r==='owner'||r==='admin'; }
 function roleChip(m){
 if(!m) return ''; var out='', me=meMember();
 var r=String(m.role||'').toLowerCase();
 if(r==='owner'||r==='admin') out+='<span class="rolechip rolechip--'+r+'">'+(r==='owner'?'Owner':'Admin')+'</span>';
 if(me&&me.id===m.id) out+='<span class="rolechip rolechip--you">You</span>';
 else if(m.email&&r!=='owner'&&r!=='admin') out+='<span class="rolechip">Member</span>';
 return out;
 }
 var PF_ICO={
 task:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19 7"/></svg>',
 chore:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10.5V19h11v-8.5"/></svg>',
 money:'<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.2"/><path d="M12 8v8M9.6 10.2c0-1 1-1.7 2.4-1.7s2.4.7 2.4 1.7-1 1.4-2.4 1.8-2.4.8-2.4 1.8 1 1.7 2.4 1.7 2.4-.7 2.4-1.7"/></svg>',
 fit:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 12h2.2M17.8 12H20M7.4 8.8v6.4M16.6 8.8v6.4M7.4 12h9.2"/></svg>'
 };
 function pf360(m){
 var nm=String(m.name||'').toLowerCase(); if(!nm) return '';
 var t=todayStr(), ym=curYM();
 var tasks=(FD.data.planning.tasks||[]).filter(function(x){ return String(x.member||'').toLowerCase()===nm; });
 var open=tasks.filter(function(x){ return !x.done; }).length;
 var chores=((FD.data.home&&FD.data.home.chores)||[]).filter(function(c){ return String(c.assignee||'').toLowerCase()===nm; }).length;
 var spent=0, tagged=false;
 ((FD.data.finance&&FD.data.finance.transactions)||[]).forEach(function(x){
 if(x.type==='expense' && String(x.member||'').toLowerCase()===nm){ tagged=true; if(String(x.date||'').slice(0,7)===ym) spent+=Number(x.amount)||0; }
 });
 var sym=''; try{ sym=curSymbol(); }catch(e){}
 var wk=0; try{ wk=(ftWeekStats(m.name)||{}).sessions||0; }catch(e){}
 var appt=null;
 try{
 appt=((FD.data.health&&FD.data.health.appointments)||[]).filter(function(a){ return String(a.member||'').toLowerCase()===nm && String(a.date||'')>=t; })
 .sort(function(a,b){ return String(a.date).localeCompare(String(b.date)); })[0]||null;
 }catch(e){}
 var stats=hStat('Open tasks',open,PF_ICO.task)+hStat('Chores',chores,PF_ICO.chore)
 +hStat('Spent this month',(tagged? sym+Math.round(spent).toLocaleString() : '\u2014'),PF_ICO.money)
 +hStat('Workouts \u00b7 wk',wk,PF_ICO.fit);
 return '<section class="pf360"><div class="pf360__hd"><h3 class="pf360__t">Life at a glance</h3><span class="pf360__s">everything linked to '+esc(m.name)+'</span></div>'
 +'<div class="hstats pf360__stats">'+stats+'</div>'
 +(appt? '<button class="pf360__row" type="button" data-view="health"><svg class="ico" viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="14" rx="2.5"/><path d="M8 3.5v4M16 3.5v4M4 10h16"/></svg><span><b>'+esc(appt.title||'Appointment')+'</b> \u00b7 '+esc(appt.date||'')+'</span></button>' : '')
 +((!tagged)? '<p class="pf360__note">Tip: when logging an expense, use \u201cFor\u201d to see spending per person here.</p>' : '')
 +'</section>';
 }
 function buildInviteMail(email,name){
 var code=Store.get('fw.sync.code','')||'';
 var sub='Join our family on Wisal';
 var body='Assalamu alaikum'+(name?' '+name:'')+'!\n\nI\u2019ve set up Wisal, one calm place for our whole family: plans, money, health, memories and chat.\n\nHow to join:\n1) Open https://wisal.family\n2) Create your account with this email: '+email+'\n3) Settings \u2192 Household \u2192 \u201cJoin with a code\u201d \u2192 enter: '+(code||'(ask me for the code)')+'\n\nKeep this code private, it\u2019s the key to our family\u2019s Wisal.\n\nSee you inside!';
 return 'mailto:'+encodeURIComponent(email)+'?subject='+encodeURIComponent(sub)+'&body='+encodeURIComponent(body);
 }
 function renderHouseholdCard(){
 var el=document.getElementById('hhBody'); if(!el) return;
 if(!cloudEnabled()){ el.innerHTML='<p class="set__p">Sign in to share Wisal with your family.</p>'; return; }
 if(hhIsGuest()){
 el.innerHTML='<p class="set__p"><strong>You\u2019re in a shared household.</strong> Everything you add syncs with your family.</p>'
 +'<div class="field"><button class="btn btn--soft" type="button" data-hh-leave>Leave household</button></div>';
 return;
 }
 var code=Store.get('fw.sync.code','');
 el.innerHTML='<p class="set__p">Invite your family to this Wisal. They create their own account, enter your code, and you all share one home.</p>'
 +(code? '<div class="hhcode"><span class="hhcode__k">'+esc(code)+'</span><button class="btn btn--soft hhcode__c" type="button" data-hh-copy>Copy</button></div>'
 : '<div class="field"><button class="btn btn--primary" type="button" data-hh-make>Create invite code</button></div>')
 +'<div class="field"><button class="btn btn--soft" type="button" data-hh-join>Join with a code</button></div>';
 }
 function hhMake(){
 if(!cloudEnabled()) return;
 var code=hhCode();
 syncStatus('syncing\u2026');
 sb.from('family_data').upsert({user_id:AUTH.user.id,data:FD.data,invite_code:code,updated_at:new Date().toISOString()})
 .then(function(r){ if(r.error){ flash('Could not create code, try again'); return; } Store.set('fw.sync.code',code); Store.set('fw.sync.row',AUTH.user.id); syncStatus('up to date'); renderHouseholdCard(); flash('Invite code ready'); })
 .catch(function(){ flash('Offline, connect and try again'); });
 }
 function hhCopy(){
 var c=Store.get('fw.sync.code',''); if(!c) return;
 try{ if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(c); flash('Code copied'); return; } }catch(e){}
 flash('Your code: '+c);
 }
 function hhJoin(){
 if(!cloudEnabled()){ flash('Sign in first'); return; }
 openModal('hhjoin',{});
 }
 function hhLeave(){
 if(!confirm('Leave this family? Their data will be removed from this device, and your own Wisal (from before you joined) will be restored.')) return;
 var me=AUTH.user? AUTH.user.id:'', myEmail=String((AUTH.user&&AUTH.user.email)||'').toLowerCase();
 /* 1) politely take my profile out of the family's shared data */
 try{
 if(myEmail){
 var keep=(FD.data.members||[]).filter(function(m){ return String(m.email||'').toLowerCase()!==myEmail; });
 if(keep.length!==FD.data.members.length){ FD.data.members=keep; Store.set(FD.KEY, FD.data); }
 }
 }catch(e){}
 try{ cloudPush(); }catch(e){} /* push the removal to THEIR row (still current) */
 /* 2) sever membership on the server so the door actually closes */
 try{ if(sb&&me){ sb.from('family_members').delete().eq('member_id',me).then(function(){}).catch(function(){}); } }catch(e){}
 /* 3) restore MY pre-join data on this device */
 var rescued=null; try{ rescued=localStorage.getItem('fw.sync.rescue'); }catch(e){}
 try{ Store.set(FD.KEY, rescued? JSON.parse(rescued) : {}); }catch(e){ Store.set(FD.KEY, {}); }
 try{ FD.load(); }catch(e){}
 Store.set('fw.sync.row', me); Store.set('fw.sync.ts','');
 try{ chReset(); }catch(e){}
 try{ refreshAll(); }catch(e){}
 renderHouseholdCard(); try{ renderAccountCard(); }catch(e){}
 try{ cloudPush(); }catch(e){} /* my own row gets my restored data */
 flash('You left, back to your own Wisal');
 }

 /* ===================== SETTINGS: Telegram-style index ===================== */
 var SET_PANES={account:'Account',household:'Household',notifications:'Notifications',spaces:'Your spaces',appearance:'Appearance',family:'Family name',backup:'Backup & restore',install:'Install app',about:'About',legal:'Privacy & Terms',reset:'Reset'};
 function openSetPane(k){
 var g=document.getElementById('setGrid'), ix=document.getElementById('setIndex'), bb=document.getElementById('setBack');
 if(!g||!g.querySelector) return;
 var card=g.querySelector('.set__card[data-pane="'+k+'"]');
 if(!card) return;
 if(k==='install' && card.hidden){ if(typeof flash==='function') flash('Already installed, or not available in this browser'); return; }
 $$('#setGrid .set__card').forEach(function(c){ c.classList.remove('pane-on'); });
 card.classList.add('pane-on');
 g.classList.add('pane-mode');
 if(ix) ix.hidden=true;
 if(bb){ bb.hidden=false; var t=document.getElementById('setBackT'); if(t) t.textContent=SET_PANES[k]||''; }
 try{ window.scrollTo({top:0,behavior:'smooth'}); }catch(e){}
 }
 function closeSetPane(){
 var g=document.getElementById('setGrid'), ix=document.getElementById('setIndex'), bb=document.getElementById('setBack');
 if(g){ g.classList.remove('pane-mode'); }
 $$('#setGrid .set__card').forEach(function(c){ c.classList.remove('pane-on'); });
 if(ix) ix.hidden=false;
 if(bb) bb.hidden=true;
 try{ renderSetIndex(); }catch(e){}
 }
  /* ---- Settings hero: live workspace health ---- */
  function setBytes(){
    try{
      var n=0;
      for(var i=0;i<localStorage.length;i++){
        var k=localStorage.key(i);
        if(k && k.indexOf('fw.')===0){ n+=k.length+(localStorage.getItem(k)||'').length; }
      }
      return n*2; /* UTF-16 */
    }catch(e){ return 0; }
  }
  function setFmtBytes(b){
    if(!b) return '0 KB';
    if(b<1024) return b+' B';
    if(b<1048576) return Math.round(b/1024)+' KB';
    return (Math.round(b/104857.6)/10)+' MB';
  }
  function setAgo(ts){
    if(!ts) return 'Never';
    var d=Math.floor((Date.now()-ts)/86400000);
    if(d<=0) return 'Today';
    if(d===1) return 'Yesterday';
    if(d<30) return d+'d ago';
    if(d<365) return Math.round(d/30)+'mo ago';
    return Math.round(d/365)+'y ago';
  }
  function renderSetHero(){
    function s(id,t){ var el=document.getElementById(id); if(el) el.textContent=t; }
    try{
      var fam=''; try{ fam=familyName(); }catch(e){}
      s('sxFam', fam||'Your family');
      var signed=!!(typeof AUTH!=='undefined' && AUTH.user);
      var me=null; try{ me=(typeof meMember==='function')?meMember():null; }catch(e){}
      s('sxWho', signed ? (me&&me.name ? me.name+' \u00b7 '+(AUTH.user.email||'') : (AUTH.user.email||'Signed in')) : 'Not signed in');
      s('sxMembers', ((FD.data.members||[]).length)||0);
      s('sxSync', signed?'Cloud':'Local');
      var lb=0; try{ lb=parseInt(Store.get('fw.lastExport','0'),10)||0; }catch(e){}
      s('sxBackup', setAgo(lb));
      s('sxStore', setFmtBytes(setBytes()));
      var st=document.getElementById('sxState'), dot=document.getElementById('sxDot');
      if(st) st.textContent = signed ? 'Encrypted in transit \u00b7 synced to your family' : 'Saved on this device only';
      if(dot) dot.className = 'sxdot'+(signed?' is-live':'');
    }catch(e){}
  }
  /* ---- Settings search ---- */
  function setFilter(q){
    q=String(q||'').trim().toLowerCase();
    var rows=document.querySelectorAll('#setIndex .sxrow'), any=false;
    for(var i=0;i<rows.length;i++){
      var hit = !q || (rows[i].getAttribute('data-q')||'').indexOf(q)>-1;
      rows[i].hidden = !hit;
      if(hit) any=true;
    }
    var grps=document.querySelectorAll('#setIndex .sxgrp');
    for(var g=0;g<grps.length;g++){
      var vis=grps[g].querySelectorAll('.sxrow:not([hidden])').length;
      grps[g].hidden = (vis===0);
    }
    var box=document.getElementById('setIndex');
    if(box) box.classList.toggle('is-searching', !!q);
    var none=document.getElementById('sxNone'); if(none) none.hidden = any;
  }
  /* ================= UPDATES: "new version" toast + "what's new" ================= */
  /* ⬇⬇ BUMP THIS ON EVERY RELEASE — and bump CACHE in sw.js to match ⬇⬇ */
  var APP_VERSION = '49 \u00b7 trip-details';
  var WHATS_NEW = {
    title: 'What\u2019s new in Wisal',
    date: 'July 2026',
    items: [
      ['Projects, rebuilt', 'A Current Focus card, projects grouped by area, search and sorting, and assignees you can tap to change.'],
      ['A real weekly calendar', 'The Week view now shows every day with its events and tasks, and you can tick things off right there.'],
      ['Tasks &amp; Overview refreshed', 'Cleaner sections, a daily progress ring, and everything easier to scan.'],
      ['Wisal AI can now do far more', 'It sees every part of your household and can add to any of them \u2014 shopping, meals, workouts, journal, savings and more.'],
      ['AI writes documents', 'Ask for a plan or a report and it writes a proper document on Wisal letterhead that you can save as PDF.'],
      ['Settings, reorganised', 'Grouped sections, a workspace health card, and search.']
    ]
  };

  function wnSeenKey(){ return 'fw.seenVersion'; }
  function wnMarkSeen(){ try{ Store.set(wnSeenKey(), APP_VERSION); }catch(e){} }
  function wnClose(){
    var el=document.getElementById('wnew');
    if(el){ el.classList.remove('is-open'); setTimeout(function(){ var e2=document.getElementById('wnew'); if(e2&&e2.parentNode) e2.parentNode.removeChild(e2); },260); }
    try{ unlockScroll('wnew'); }catch(e){}
    wnMarkSeen();
  }
  function wnOpen(){
    if(document.getElementById('wnew')) return;
    var el=document.createElement('div');
    el.className='wnew'; el.id='wnew'; el.setAttribute('role','dialog');
    el.innerHTML=
      '<div class="wnew__scrim" data-wnclose="1"></div>'
      + '<div class="wnew__card">'
      +   '<div class="wnew__hd">'
      +     '<span class="wnew__mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="7.85" cy="12" r="5.7" stroke-dasharray="2.64 3.34 29.84"/><circle cx="16.15" cy="12" r="5.7" stroke-dasharray="20.54 3.34 11.93"/></svg></span>'
      +     '<span class="wnew__hx"><span class="wnew__t">'+WHATS_NEW.title+'</span>'
      +     '<span class="wnew__d">Version '+APP_VERSION+' \u00b7 '+WHATS_NEW.date+'</span></span>'
      +   '</div>'
      +   '<div class="wnew__body">'
      +     WHATS_NEW.items.map(function(it){
            return '<div class="wnew__i"><span class="wnew__dot"></span><span class="wnew__ix">'
              + '<span class="wnew__it">'+it[0]+'</span><span class="wnew__is">'+it[1]+'</span></span></div>';
          }).join('')
      +   '</div>'
      +   '<div class="wnew__ft"><button class="wnew__b" type="button" data-wnclose="1">Continue</button></div>'
      + '</div>';
    document.body.appendChild(el);
    try{ lockScroll('wnew'); }catch(e){}
    setTimeout(function(){ el.classList.add('is-open'); },12);
  }
  function wnCheck(){
    try{
      var seen=Store.get(wnSeenKey(), null);
      if(seen===APP_VERSION) return;
      if(seen===null || seen===undefined){ wnMarkSeen(); return; }  /* first ever run: no popup */
      setTimeout(wnOpen, 900);
    }catch(e){}
  }

  /* ---- "a new version is ready" toast ---- */
  var _upShown=false;
  function upToast(){
    if(_upShown || document.getElementById('uptoast')) return;
    _upShown=true;
    var el=document.createElement('div');
    el.className='uptoast'; el.id='uptoast';
    el.innerHTML='<span class="uptoast__ic"><svg class="ico" viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 13.7-5.6M20 12a8 8 0 0 1-13.7 5.6"/><path d="M17 3.5V7h-3.5M7 20.5V17h3.5"/></svg></span>'
      + '<span class="uptoast__tx">A new version of Wisal is ready</span>'
      + '<button class="uptoast__b" type="button" data-upreload="1">Refresh</button>'
      + '<button class="uptoast__x" type="button" data-upclose="1" aria-label="Dismiss">'
      + '<svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>';
    document.body.appendChild(el);
    setTimeout(function(){ el.classList.add('is-open'); },40);
  }
  function upClose(){
    var el=document.getElementById('uptoast');
    if(el){ el.classList.remove('is-open'); setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); },260); }
  }
  function upWatch(reg){
    try{
      var had = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener('controllerchange', function(){
        if(had) upToast();
      });
      if(reg){
        reg.addEventListener('updatefound', function(){
          var nw=reg.installing;
          if(!nw) return;
          nw.addEventListener('statechange', function(){
            if(nw.state==='installed' && navigator.serviceWorker.controller) upToast();
          });
        });
        setInterval(function(){ try{ reg.update(); }catch(e){} }, 1800000); /* every 30 min */
        document.addEventListener('visibilitychange', function(){
          if(!document.hidden){ try{ reg.update(); }catch(e){} }
        });
      }
    }catch(e){}
  }
 function renderSetIndex(){
 renderSetHero();
 function s(id,t){ var el=document.getElementById(id); if(el) el.textContent=t; }
 try{ s('sxs-account', AUTH.user? (AUTH.user.email||'Signed in') : 'Sign in \u00b7 cloud sync'); }catch(e){}
 try{
 var code=Store.get('fw.sync.code','');
 s('sxs-household', hhIsGuest()? 'Connected to a family \u2713' : (code? ('Code '+code) : 'Invite code \u00b7 members'));
 }catch(e){}
 try{ s('sxs-notifications', (typeof notifOn==='function' && notifOn())? 'On \u00b7 reminders \u00b7 money \u00b7 chat' : 'Tap to turn on'); }catch(e){}
 try{ var n=0; SP_KEYS.forEach(function(k){ if(spOn(k)) n++; }); s('sxs-spaces', n+' of '+SP_KEYS.length+' active'); }catch(e){}
 try{
 var ic=document.querySelector('#setGrid .set__card[data-pane="install"]');
 var ir=document.querySelector('#setIndex [data-setopen="install"]');
 if(ir) ir.hidden = !!(ic && ic.hidden);
 if(ic && !ic.hidden) s('sxs-install','Add to your home screen');
 }catch(e){}
 }
 document.addEventListener('keydown', function(e){
 if(e.key==='Escape'){
 var g=document.getElementById('setGrid');
 if(g && g.classList && g.classList.contains && g.classList.contains('pane-mode')){ closeSetPane(); }
 }
 });

 /* ===================== SPACES: progressive disclosure ===================== */
 var SP_KEYS=SRCH_ORDER.slice();
 var SP_START={family:1,planning:1,finance:1,health:1};
 function spMap(){ return Store.get('fw.spaces.on', null); }
 function spOn(k){ var m=spMap(); if(!m) return true; return m[k]!==false; }
 var QA_SPACE={task:'planning',chore:'homemgmt',workout:'fitness',recipe:'cooking',meal:'cooking',shopping:'cooking',transaction:'finance',event:'family',journal:'journal',gratitude:'journal',milestone:'journal',water:'nutrition',checkin:'wellbeing'};
 function applySpaceVisibility(){
 SP_KEYS.forEach(function(k){
 var on=spOn(k);
 $$('.nav__item[data-view="'+k+'"]').forEach(function(el){ el.classList.toggle('sp-off',!on); });
 $$('.domains .domain[data-view="'+k+'"]').forEach(function(el){ el.classList.toggle('sp-off',!on); });
 });
 try{ $$('#qaMenu [data-qa]').forEach(function(b){ var sp=QA_SPACE[b.getAttribute('data-qa')]; if(sp) b.classList.toggle('sp-off', !spOn(sp)); }); }catch(e){}
 try{ var sa=document.getElementById('spacesActive'); if(sa){ var n=0; SP_KEYS.forEach(function(k){ if(spOn(k)) n++; }); sa.textContent=n+' active'; } }catch(e){}
 try{ renderSetIndex(); }catch(e){}
 try{ $$('.nav__group').forEach(function(g){
 var its=g.querySelectorAll? g.querySelectorAll('.nav__item[data-view]'):[]; if(!its.length) return;
 var any=false; for(var i=0;i<its.length;i++){ if(!(its[i].classList&&its[i].classList.contains('sp-off'))) any=true; }
 g.classList.toggle('sp-off', !any);
 }); }catch(e){}
 }
 var _spSel=null;
 var SP_GROUPS=[['Family & People',['family','relationship','planning','memory']],['Health & Body',['health','fitness','nutrition']],['Home & Money',['cooking','homemgmt','finance']],['Life & Growth',['learning','journal','travel']],['Mind & Soul',['wellbeing','legacy']]];
 function sppickChips(){
 return SP_GROUPS.map(function(gr){
 return '<div class="sppick__ghd">'+gr[0]+'</div>'+gr[1].map(function(k){
 var on=_spSel&&_spSel[k]!==false;
 return '<button type="button" class="spchip'+(on?' is-on':'')+'" data-spk="'+k+'" style="--c:var('+(SRCH_ACC[k]||'--brand')+')"><span class="spchip__d"></span>'+esc(SRCH_LABEL[k]||k)+'</button>';
 }).join('');
 }).join('');
 }
 function openSpPick(firstRun){
 var s=document.getElementById('sppick'); if(!s) return;
 var m=spMap(); _spSel={};
 SP_KEYS.forEach(function(k){ _spSel[k]= m? (m[k]!==false) : (firstRun? !!SP_START[k] : true); });
 var g=document.getElementById('sppickGrid'); if(g) g.innerHTML=sppickChips();
 var sub=document.getElementById('sppickSub'); if(sub) sub.textContent= firstRun? 'Start small, pick what matters now. You can turn any space on later in Settings.' : 'Turn spaces on or off. Hidden spaces keep all their data and can return anytime.';
 s.hidden=false; s.classList.add('is-on'); window.__panelOpenedAt=Date.now();
 }
 function closeSpPick(){ var s=document.getElementById('sppick'); if(s){ s.classList.remove('is-on'); s.hidden=true; } Store.set('fw.spaces.chosen', true); }
 function saveSpPick(){
 var m={}, any=false, all=true;
 SP_KEYS.forEach(function(k){ var on=_spSel&&_spSel[k]!==false; m[k]=on; if(on) any=true; else all=false; });
 if(!any){ if(typeof flash==='function') flash('Keep at least one space'); return; }
 Store.set('fw.spaces.on', all? null : m);
 Store.set('fw.spaces.chosen', true);
 applySpaceVisibility();
 try{ renderNotifications(); }catch(e){}
 try{ if(document.getElementById('homeToday')) renderHome(); try{ renderHeroPulse(); }catch(e){} }catch(e){}
 closeSpPick();
 if(typeof flash==='function') flash('Spaces updated');
 }

 /* ===================== MY DAY (daily briefing) ===================== */
 var MD_ICO={
 sun:'<svg class="ico" viewBox="0 0 24 24"><path d="M3 18h18"/><path d="M7 18a5 5 0 0 1 10 0"/><path d="M12 3.5V6M5.2 8.2 6.8 9.8M18.8 8.2 17.2 9.8M2.5 14h2M19.5 14h2"/></svg>',
 task:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.5 12.2l2.4 2.4 4.6-5"/></svg>',
 broom:'<svg class="ico" viewBox="0 0 24 24"><path d="M14 4l-2.5 8M5 20c0-3 1.5-5 4.5-6l5 1.5C13 18.5 10.5 20 8 20Z"/><path d="M12 14.5 16 16"/></svg>',
 cal:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="14" rx="2.5"/><path d="M8 3.8V8M16 3.8V8M4 11h16"/></svg>',
 steth:'<svg class="ico" viewBox="0 0 24 24"><path d="M6 4v4a3.5 3.5 0 0 0 7 0V4"/><path d="M9.5 11.5v2a5 5 0 0 0 10 0v-1"/><circle cx="19" cy="11" r="2"/></svg>',
 fork:'<svg class="ico" viewBox="0 0 24 24"><path d="M7 3v7M5 3v3.5a2 2 0 0 0 4 0V3M7 10v11M16 3c-1.4 1.6-2 4.4-1 6.5.5 1 1.5 1.2 1.5 1.2V21"/></svg>',
 drop:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 3.5S6 10 6 14a6 6 0 0 0 12 0c0-4-6-10.5-6-10.5Z"/></svg>',
 leaf:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 19c0-8 5-13 14-14-.5 9-5.5 14-12 14"/><path d="M5 19c3-3.2 6-5.2 10-6.2"/></svg>',
 heart:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 20.3s-7-4.4-7-9.4A3.8 3.8 0 0 1 12 8.2a3.8 3.8 0 0 1 7 2.7c0 5-7 9.4-7 9.4Z"/></svg>',
 gift:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M4 12.5h16M12 9v11M12 9C10.5 9 8.5 8.4 8.5 6.6 8.5 5.5 9.4 5 10.2 5c1.8 0 1.8 4 1.8 4Zm0 0c1.5 0 3.5-.6 3.5-2.4C15.5 5.5 14.6 5 13.8 5 12 5 12 9 12 9Z"/></svg>',
 sparkle:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 3.5l1.7 4.6 4.6 1.7-4.6 1.7L12 16.1l-1.7-4.6L5.7 9.8l4.6-1.7z"/></svg>',
 photo:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="M4.5 16.5 9.5 12l3 2.8 3-2.3 4 3.7"/></svg>',
 mile:'<svg class="ico" viewBox="0 0 24 24"><path d="M6 21V4M6 5h9l-1.5 2.5L15 10H6"/></svg>',
 hour:'<svg class="ico" viewBox="0 0 24 24"><path d="M7 4h10M7 20h10M8 4c0 4 3.2 4.6 3.2 8S8 16 8 20M16 4c0 4-3.2 4.6-3.2 8s3.2 4 3.2 8"/></svg>',
 dua:'<svg class="ico" viewBox="0 0 24 24"><path d="M8.5 21c-1-2.5-1-4 0-6M15.5 21c1-2.5 1-4 0-6"/><path d="M12 15c-2.5 0-4.5-2-4.5-4.5C7.5 7 12 3 12 3s4.5 4 4.5 7.5C16.5 13 14.5 15 12 15Z"/></svg>',
 check:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
 plus:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>'
 };
 function mdRow(ico,cvar,title,sub,attrs,danger){
 return '<button class="mdrow'+(danger?' mdrow--alert':'')+'" '+attrs+'><span class="mdrow__ic" style="--mc:'+cvar+'">'+ico+'</span><span class="mdrow__main"><span class="mdrow__t">'+title+'</span>'+(sub?'<span class="mdrow__s">'+sub+'</span>':'')+'</span><svg class="ico mdrow__chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>';
 }
 function renderMyDay(){
 var el=$('#mydayBody'); if(!el) return;
 var D=FD.data, t=todayStr(), now=new Date();
 var md=p2(now.getMonth()+1)+'-'+p2(now.getDate()), yr=String(now.getFullYear());
 function evDay(e){ return String(e.date||'').slice(0,10); }
 var evToday=(D.events||[]).filter(function(e){ return evDay(e)===t && !e.completed && e.status!=='cancelled'; }).sort(function(a,b){ return String(a.date).localeCompare(String(b.date)); });
 var appts=evToday.filter(function(e){ return e.kind==='appointment'; });
 var evs=evToday.filter(function(e){ return e.kind!=='appointment'; });
 var tasks=(D.planning?D.planning.tasks:[])||[];
 var overdue=tasks.filter(function(x){ return taskGroup(x)==='overdue'; }).sort(plSort);
 var dueToday=tasks.filter(function(x){ return taskGroup(x)==='today'; }).sort(plSort);
 var chores=(D.home?D.home.chores:[])||[]; var choresDue=chores.filter(function(c){ return choreDue(c); });
 var needN=overdue.length+dueToday.length+choresDue.length+appts.length+evs.length;

 var word=greetWord(), nm=familyName();
 var dstr=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()]+', '+now.getDate()+' '+MON[now.getMonth()];
 var meals=(D.cooking?D.cooking.meals:[]).filter(function(m){ return m.date===t; });
 var summ;
 if(needN===0 && !meals.length){ summ='A calm, open day. Breathe it in.'; }
 else { var bits=[]; if(needN) bits.push('<b>'+needN+'</b> thing'+(needN>1?'s':'')+' need'+(needN>1?'':'s')+' you'); if(meals.length) bits.push(meals.length+' meal'+(meals.length>1?'s':'')+' planned'); summ=bits.join(' \u00b7 ')+' today.'; }
 var hero='<div class="mdhero"><span class="mdhero__ic">'+MD_ICO.sun+'</span><div class="mdhero__tx"><div class="mdhero__date">'+dstr+'</div><div class="mdhero__hi">'+esc(word)+(nm?', '+esc(nm.split(' ')[0]):'')+'</div><div class="mdhero__sum">'+summ+'</div></div></div>';

 var rows=[];
 overdue.forEach(function(x){ rows.push(mdRow(MD_ICO.task,'var(--m-planning)',esc(x.title||'Task'),'Overdue'+(x.member?' \u00b7 '+esc(x.member):''),'data-goto="planning:tasks"',true)); });
 appts.forEach(function(x){ var tm=String(x.date).indexOf('T')>0?String(x.date).slice(11,16):''; rows.push(mdRow(MD_ICO.steth,'var(--m-health)',esc(x.title||'Appointment'),'Appointment'+(tm?' \u00b7 '+tm:''),'data-goto="health:appointments"',false)); });
 evs.forEach(function(x){ var tm=x.allDay?'All day':(String(x.date).indexOf('T')>0?String(x.date).slice(11,16):''); rows.push(mdRow(MD_ICO.cal,'var(--m-family)',esc(x.title||'Event'),tm||'Today','data-goto="family:calendar"',false)); });
 dueToday.forEach(function(x){ rows.push(mdRow(MD_ICO.task,'var(--m-planning)',esc(x.title||'Task'),'Due today'+(x.member?' \u00b7 '+esc(x.member):''),'data-goto="planning:tasks"',false)); });
 choresDue.forEach(function(x){ rows.push(mdRow(MD_ICO.broom,'var(--m-homemgmt)',esc(x.title||'Chore'),'Due'+(x.assignee?' \u00b7 '+esc(x.assignee):''),'data-goto="homemgmt:chores"',false)); });
 var shown=rows.slice(0,7), moreN=rows.length-shown.length;
 var needCard='<div class="fcard mdfocus"><div class="fcard__h"><h3 class="fcard__t">Needs you today</h3>'+(needN?'<span class="mdpill">'+needN+'</span>':'')+'</div>'
 +(shown.length? '<div class="mdlist">'+shown.join('')+'</div>'+(moreN>0?'<button class="fcard__link" style="margin-top:10px" data-goto="planning:tasks">+ '+moreN+' more</button>':'') : '<div class="mdclear"><span class="mdclear__ic">'+MD_ICO.check+'</span><div><div class="mdclear__t">All clear</div><div class="mdclear__s">Nothing urgent today, enjoy the space.</div></div></div>')
 +'</div>';

 var mealRows=meals.slice().sort(function(a,b){ return CK_SLOTS.indexOf(a.slot)-CK_SLOTS.indexOf(b.slot); }).map(function(m){ return '<div class="lrow"><span class="vrow__ic" style="color:var(--m-cooking)">'+MD_ICO.fork+'</span><div class="lrow__main"><div class="lrow__title">'+esc(m.title)+'</div><div class="lrow__sub">'+ckCap(m.slot)+'</div></div></div>'; }).join('');
 var mealCard= mealRows? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">On the table</h3><button class="fcard__link" style="color:var(--m-cooking)" data-goto="cooking:meals">Meal plan</button></div>'+mealRows+'</div>'
 : '<div class="fcard mdinvite"><div class="fcard__h"><h3 class="fcard__t">On the table</h3></div><div class="mdinvite__b">No meals planned for today.</div><button class="btn btn--soft" data-goto="cooking:meals">'+MD_ICO.plus+'Plan today\u2019s meals</button></div>';
 var mems=D.members||[];
 var waterCard='';
 if(mems.length){
 var totW=0; mems.forEach(function(m){ totW+=ntWaterToday(m.name); });
 var wr=mems.slice(0,4).map(function(m){ var g=ntWaterToday(m.name),tg=ntTarget(m.name); return '<div class="lrow"><span class="vrow__ic" style="color:var(--m-nutrition)">'+MD_ICO.drop+'</span><div class="lrow__main"><div class="lrow__title">'+esc(m.name)+'</div><div class="lnbar lnbar--nt lnbar--mini" style="margin-top:5px"><span style="width:'+Math.min(100,Math.round(g/tg*100))+'%"></span></div></div><span class="lnpct">'+g+'/'+tg+'</span></div>'; }).join('');
 waterCard='<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Water \u00b7 '+totW+' today</h3><button class="fcard__link" style="color:var(--m-nutrition)" data-goto="nutrition:water">Tap glasses</button></div>'+wr+'</div>';
 }
 var rhythm='<div class="mdgrid2">'+mealCard+waterCard+'</div>';

 var habs=(D.nutrition?D.nutrition.habits:[])||[];
 var habCard='';
 var hitems=[];
 habs.forEach(function(h){ var done=h.dates.indexOf(t)>=0; hitems.push({id:h.id,title:h.title,who:h.member,done:done}); });
 if(hitems.length){
 hitems.sort(function(a,b){ return (a.done?1:0)-(b.done?1:0); });
 var hrows=hitems.slice(0,5).map(function(it){ return '<div class="hmrow'+(it.done?' nthab-done':'')+'"><button class="hmrow__chk hmrow__chk--nt" data-nthab="'+it.id+'" aria-label="Toggle">'+MD_ICO.check+'</button><div class="hmrow__main"><div class="hmrow__t">'+esc(it.title||'Habit')+(it.who?' <span class="lnwho lnwho--nt">'+esc(it.who)+'</span>':'')+'</div></div></div>'; }).join('');
 var doneN=hitems.filter(function(x){return x.done;}).length;
 habCard='<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Little habits</h3><span class="fcard__link" style="color:var(--m-nutrition)">'+doneN+'/'+hitems.length+' today</span></div><div class="hmlist">'+hrows+'</div></div>';
 }

 var peopleCard='';
 var pending=mems.filter(function(m){ return !wbTodayCheckin(m.name); });
 if(mems.length){
 var pc='';
 if(pending.length){ pc+='<div class="hsec-h" style="margin:2px 2px 10px">Not checked in yet</div>'+pending.slice(0,4).map(function(m){ return '<div class="lrow"><span class="lnav">'+avatarHTML(m,'lnav__t')+'</span><div class="lrow__main"><div class="lrow__title">'+esc(m.name)+'</div></div><button class="lnup" style="color:var(--m-wellbeing);background:color-mix(in srgb,var(--m-wellbeing) 12%,var(--surface));border-color:color-mix(in srgb,var(--m-wellbeing) 30%,transparent)" data-wbadd="'+esc(m.name)+'">Check in</button></div>'; }).join(''); }
 else { pc+='<div class="mdclear" style="margin-bottom:4px"><span class="mdclear__ic" style="color:var(--m-wellbeing);background:color-mix(in srgb,var(--m-wellbeing) 12%,var(--surface))">'+MD_ICO.heart+'</span><div><div class="mdclear__t">Everyone\u2019s checked in</div><div class="mdclear__s">The whole family said hello today.</div></div></div>'; }
 peopleCard='<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">The people</h3><button class="fcard__link" style="color:var(--m-wellbeing)" data-goto="wellbeing:checkins">Wellbeing</button></div>'+pc+'</div>';
 }

 var up=[];
 mems.forEach(function(m){ var nb=nextBirthday(m); if(nb && nb.days<=30) up.push({days:nb.days,ico:MD_ICO.gift,cvar:'var(--m-family)',title:esc(m.name)+'\u2019s birthday',sub:(nb.turning?'turns '+nb.turning:'')+' \u00b7 '+jDateLabel(nb.date.getFullYear()+'-'+p2(nb.date.getMonth()+1)+'-'+p2(nb.date.getDate())),go:'data-view="family"'}); });
 if(typeof rlUnlocked!=='undefined' && rlUnlocked){ (D.relationship?D.relationship.dates:[]).forEach(function(x){ var nx=rlNextOccur(x.date); if(nx && nx.days<=30) up.push({days:nx.days,ico:MD_ICO.heart,cvar:'var(--m-relationship)',title:esc(x.title||'Special day'),sub:jDateLabel(nx.date)+(nx.years>0?' \u00b7 turns '+nx.years:''),go:'data-goto="relationship:dates"'}); }); }
 (D.memory?D.memory.capsules:[]).forEach(function(c){ if(capsuleSealed(c)){ var dd=daysTo(c.openOn); if(dd<=30) up.push({days:dd,ico:MD_ICO.hour,cvar:'var(--m-memory)',title:esc(c.title||'Time capsule'),sub:'opens '+jDateLabel(c.openOn),go:'data-goto="memory:capsule"'}); } });
 up.sort(function(a,b){ return a.days-b.days; });
 var upCard= up.length? '<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Coming up</h3></div>'+up.slice(0,4).map(function(o){ return '<button class="mdrow" '+o.go+'><span class="mdrow__ic" style="--mc:'+o.cvar+'">'+o.ico+'</span><span class="mdrow__main"><span class="mdrow__t">'+o.title+'</span><span class="mdrow__s">'+o.sub+'</span></span><span class="mdaway">'+(o.days===0?'Today':(o.days===1?'Tomorrow':'in '+o.days+'d'))+'</span></button>'; }).join('')+'</div>' : '';

 var moment='';
 var ond=[];
 (D.journal?D.journal.entries:[]).forEach(function(e){ if((e.date||'').slice(5)===md && (e.date||'').slice(0,4)!==yr) ond.push({ico:MD_ICO.mile,t:e.title||'A journal entry',d:e.date,go:'data-goto="journal:entries"'}); });
 (D.journal?D.journal.milestones:[]).forEach(function(m){ if((m.date||'').slice(5)===md && (m.date||'').slice(0,4)!==yr) ond.push({ico:MD_ICO.mile,t:m.title||'A milestone',d:m.date,go:'data-goto="journal:milestones"'}); });
 (D.memory?D.memory.albums:[]).forEach(function(a){ a.photos.forEach(function(p){ if((p.date||'').slice(5)===md && (p.date||'').slice(0,4)!==yr) ond.push({ico:MD_ICO.photo,t:p.caption||('A photo in '+a.name),d:p.date,go:'data-goto="memory:albums"'}); }); });
 if(ond.length){
 ond.sort(function(a,b){ return String(b.d).localeCompare(String(a.d)); });
 moment='<div class="fcard mdmoment"><div class="fcard__h"><h3 class="fcard__t">On this day</h3></div>'+ond.slice(0,3).map(function(o){ var y=(o.d||'').slice(0,4); var yrsAgo=yr-(+y); return '<button class="mdrow" '+o.go+'><span class="mdrow__ic" style="--mc:var(--m-memory)">'+o.ico+'</span><span class="mdrow__main"><span class="mdrow__t">'+esc(o.t)+'</span><span class="mdrow__s">'+(yrsAgo===1?'1 year ago':yrsAgo+' years ago')+'</span></span></button>'; }).join('')+'</div>';
 } else {
 var wis=(D.legacy?D.legacy.wisdom:[]); var dus=(D.legacy?D.legacy.duas:[]);
 if(wis.length){ var w=wis[now.getDate()%wis.length]; moment='<div class="fcard mdmoment mdmoment--quote"><div class="mdq__mark">\u201C</div><div class="mdq__text">'+esc((w.text||'').slice(0,180))+((w.text||'').length>180?'\u2026':'')+'</div><div class="mdq__from">'+(w.from?'\u2014 '+esc(w.from):'\u2014 Family wisdom')+'</div></div>'; }
 else if(dus.length){ var du=dus[now.getDate()%dus.length]; moment='<div class="fcard mdmoment mdmoment--quote"><div class="fcard__h"><h3 class="fcard__t">A du\u2019a for today</h3></div><div class="mdq__text" style="padding-left:0">'+esc((du.text||'').slice(0,180))+'</div>'+(du.title?'<div class="mdq__from">'+esc(du.title)+'</div>':'')+'</div>'; }
 }

 var quick='<div class="fcard"><div class="fcard__h"><h3 class="fcard__t">Jump back in</h3></div><div class="happt-top" style="margin:0"><button class="btn btn--soft" data-modal="task">'+MD_ICO.task+'Task</button><button class="btn btn--soft" data-modal="journalEntry">'+MD_ICO.mile+'Journal</button><button class="btn btn--soft" data-modal="nmeal">'+MD_ICO.fork+'Log meal</button><button class="btn btn--soft" data-modal="checkin">'+MD_ICO.heart+'Check in</button></div></div>';

 if(!mems.length && needN===0 && !meals.length && !habs.length){
 el.innerHTML=hero+'<div class="fcard mdinvite"><div class="mdinvite__b" style="text-align:center;padding:8px 0 4px">Your day will fill up here as you use the spaces, tasks, meals, birthdays and gentle reminders, all gathered each morning.</div><div class="happt-top" style="justify-content:center;margin:8px 0 0"><button class="btn btn--primary" data-view="family">'+MD_ICO.sun+'Start with Family</button></div></div>';
 return;
 }
 el.innerHTML=hero+needCard+rhythm+(habCard||'')+(peopleCard||'')+upCard+(moment||'')+quick;
 }

 /* ===================== HOME, living overview ===================== */
 function homeStat(view){
 var D=(FD&&FD.data)||{}, t=todayStr();
 function dU(d){ if(!d) return null; try{ var n=daysUntil(d); return (typeof n==='number'&&!isNaN(n))?n:null; }catch(e){ return null; } }
 try{ switch(view){
 case 'family': { var n=(D.members||[]).length; return n?{text:n+(n>1?' members':' member')}:{text:'Add your family',cta:1}; }
 case 'relationship': {
 if(typeof rlUnlocked!=='undefined' && !rlUnlocked && D.relationship && D.relationship.hash) return {text:'Private \u00b7 locked'};
 var dd=null; try{ dd=rlDaysTogether(); }catch(e){}
 if(dd!==null) return {text:dd.toLocaleString()+' days together'};
 return {text:'Set up your space',cta:1};
 }
 case 'planning': {
 var tk=(D.planning&&D.planning.tasks)||[], ov=0,td=0,op=0;
 tk.forEach(function(x){ if(x.done) return; op++; var n=dU(x.due); if(n===null) return; if(n<0) ov++; else if(n===0) td++; });
 if(ov) return {text:ov+(ov>1?' tasks overdue':' task overdue'),alert:1};
 if(td) return {text:td+' due today'};
 if(op) return {text:op+(op>1?' open tasks':' open task')};
 return {text:'No tasks yet',cta:1};
 }
 case 'memory': {
 var ph=0; ((D.memory&&D.memory.albums)||[]).forEach(function(a){ ph+=((a.photos&&a.photos.length)||0); });
 if(ph) return {text:ph+(ph>1?' photos kept':' photo kept')};
 var st=((D.memory&&D.memory.stories)||[]).length; if(st) return {text:st+(st>1?' stories':' story')};
 return {text:'Save a memory',cta:1};
 }
 case 'health': {
 var up=[]; (D.events||[]).forEach(function(e){ if(e.kind!=='appointment'||e.completed) return; var n=dU(e.date); if(n!==null&&n>=0) up.push(n); });
 if(up.length){ up.sort(function(a,b){return a-b;}); var n=up[0]; return {text:n===0?'Appointment today':('Next visit in '+n+(n>1?' days':' day')),alert:n===0}; }
 var prof=(D.members||[]).filter(function(m){ return m.health&&(m.health.doctor||m.health.weightKg); }).length;
 if(prof) return {text:prof+' health profile'+(prof>1?'s':'')};
 return {text:'Add a profile',cta:1};
 }
 case 'fitness': {
 var w=null; try{ w=ftWeekStats(); }catch(e){}
 var cnt=(w&&typeof w.count==='number')?w.count:((D.fitness&&D.fitness.workouts)||[]).filter(function(x){ var n=dU(x.date); return n!==null&&n>-7&&n<=0; }).length;
 if(cnt) return {text:cnt+' workout'+(cnt>1?'s':'')+' this week'};
 return {text:'Log a workout',cta:1};
 }
 case 'nutrition': {
 var wt=null,tg=null; try{ wt=ntWaterToday(); }catch(e){} try{ tg=ntTarget(); }catch(e){}
 if(typeof wt==='number'&&typeof tg==='number'&&tg>0) return {text:'Water '+wt+'/'+tg+' today',alert:wt===0};
 var ml=((D.nutrition&&D.nutrition.meals)||[]).filter(function(m){ return String(m.date||'').slice(0,10)===t; }).length;
 if(ml) return {text:ml+' meal'+(ml>1?'s':'')+' today'};
 return {text:'Track your day',cta:1};
 }
 case 'cooking': {
 var sh=((D.cooking&&D.cooking.shopping)||[]).filter(function(i){ return !i.done&&!i.checked; }).length;
 if(sh) return {text:sh+' item'+(sh>1?'s':'')+' to buy'};
 var r=((D.cooking&&D.cooking.recipes)||[]).length; if(r) return {text:r+(r>1?' recipes':' recipe')};
 return {text:'Add a recipe',cta:1};
 }
 case 'homemgmt': {
 var cd=0; ((D.homemgmt&&D.homemgmt.chores)||[]).forEach(function(c){ try{ if(!c.done&&choreDue(c)) cd++; }catch(e){} });
 if(cd) return {text:cd+(cd>1?' chores due':' chore due'),alert:1};
 var so=((D.homemgmt&&D.homemgmt.supplies)||[]).filter(function(s){ return s.status==='out'; }).length;
 if(so) return {text:so+' to restock',alert:1};
 var ch=((D.homemgmt&&D.homemgmt.chores)||[]).length; if(ch) return {text:'Chores on track'};
 return {text:'Set up chores',cta:1};
 }
 case 'finance': {
 var tx=(D.finance&&D.finance.transactions)||[], ym=curYM(), inc=0,exp=0,cnt=0;
 tx.forEach(function(x){ if(String(x.date||'').slice(0,7)!==ym) return; cnt++; var a=+x.amount||0; if(x.type==='income') inc+=a; else exp+=a; });
 if(cnt){ var net=inc-exp, s=''; try{ s=curSymbol(); }catch(e){} return {text:'This month '+(net>=0?'+':'\u2212')+s+Math.abs(net).toLocaleString()}; }
 return {text:'Track spending',cta:1};
 }
 case 'learning': {
 var ip=((D.learning&&D.learning.courses)||[]).filter(function(c){ return (c.progress||0)<100; }).length;
 if(ip) return {text:ip+' in progress'};
 var bk=((D.learning&&D.learning.books)||[]).length; if(bk) return {text:bk+(bk>1?' books':' book')};
 return {text:'Add a course',cta:1};
 }
 case 'journal': {
 var en=((D.journal&&D.journal.entries)||[]).length, stk=0; try{ stk=jStreak(); }catch(e){}
 if(stk&&stk>1) return {text:stk+'-day streak'};
 if(en) return {text:en+(en>1?' entries':' entry')};
 return {text:'Write today',cta:1};
 }
 case 'travel': {
 var near=null; ((D.travel&&D.travel.trips)||[]).forEach(function(tr){ var n=dU(tr.startDate||tr.start||tr.date||tr.from); if(n!==null&&n>=0&&(near===null||n<near)) near=n; });
 if(near!==null) return {text:near===0?'A trip today':('Trip in '+near+(near>1?' days':' day'))};
 var tc=((D.travel&&D.travel.trips)||[]).length; if(tc) return {text:tc+(tc>1?' trips planned':' trip planned')};
 return {text:'Plan a trip',cta:1};
 }
 case 'wellbeing': {
 var ck=(D.wellbeing&&D.wellbeing.checkins)||[];
 if(ck.some(function(c){ return String(c.date||'').slice(0,10)===t; })) return {text:'Checked in today'};
 if(ck.length) return {text:'Check in today'};
 return {text:'How are you?',cta:1};
 }
 case 'legacy': {
 var de=((D.legacy&&D.legacy.deeds)||[]).length, du=((D.legacy&&D.legacy.duas)||[]).length;
 if(de) return {text:de+' good deed'+(de>1?'s':'')};
 if(du) return {text:du+(du>1?' du\u2019as':' du\u2019a')};
 return {text:'Add a du\u2019a',cta:1};
 }
 }}catch(e){}
 return {text:'Open'};
 }

 function renderHeroPulse(){
 var el=document.getElementById('heroPulse'); if(!el) return;
 var t=todayStr(), chips=[];
 try{ var td=(FD.data.planning.tasks||[]).filter(function(x){return !x.done&&x.due===t;}).length; if(td) chips.push({c:'--m-planning',v:'planning',t:td+' task'+(td>1?'s':'')+' today'}); }catch(e){}
 try{ var ev=(FD.data.events||[]).filter(function(x){return x.date===t;}).length; if(ev) chips.push({c:'--m-family',v:'family',t:ev+' event'+(ev>1?'s':'')+' today'}); }catch(e){}
 try{
 var B=(FD.data.finance&&FD.data.finance.budgets)||{}, ks=Object.keys(B);
 var tot=0; ks.forEach(function(k){ tot+=Number(B[k])||0; });
 if(tot>0){
 var ym=curYM(), sp=0;
 (FD.data.finance.transactions||[]).forEach(function(x){ if(x.type==='expense'&&String(x.date||'').slice(0,7)===ym) sp+=Number(x.amount)||0; });
 var left=tot-sp, sym=''; try{ sym=curSymbol(); }catch(e2){}
 chips.push({c:'--m-finance',v:'finance',t:(left>=0? (sym+Math.round(left).toLocaleString()+' left this month') : (sym+Math.round(-left).toLocaleString()+' over budget'))});
 }
 }catch(e){}
 if(!chips.length) chips.push({c:'--brand',v:'dashboard',t:'All clear today'});
 el.innerHTML=chips.slice(0,3).map(function(ch){ return '<button type="button" class="pulsechip" data-view="'+ch.v+'" style="--c:var('+ch.c+')"><span class="pulsechip__d"></span>'+esc(ch.t)+'</button>'; }).join('');
 }
  function renderHomeGlance(){
    var host=$('#homeGlance'); if(!host) return;
    var D=FD.data, t=todayStr(), ym=t.slice(0,7), sym=curSymbol();
    // --- Money this month ---
    var spent=0, income=0;
    (D.finance.transactions||[]).forEach(function(x){ if(String(x.date||'').slice(0,7)===ym){ var a=Number(x.amount)||0; if(x.type==='income') income+=a; else spent+=a; } });
    // --- Tasks (daily work) ---
    var tk=(D.planning&&D.planning.tasks)||[], open=0, overdue=0, dueToday=0;
    tk.forEach(function(x){ if(x.done) return; open++; var n=daysUntil(x.due); if(n===null) return; if(n<0) overdue++; else if(n===0) dueToday++; });
    // --- Chores today ---
    var chores=(D.homemgmt&&D.homemgmt.chores)||[], choresOpen=chores.filter(function(c){return !c.done;}).length;
    // --- Upcoming (events incl appointments, next 7 days) ---
    var evs=(D.events||[]).filter(function(e){ var ds=String(e.date||'').slice(0,10); return ds>=t; }).sort(function(a,b){ return String(a.date).localeCompare(String(b.date)); });
    var nextEv=evs[0];
    // --- Appointments ---
    var appts=(D.events||[]).filter(function(e){ return e.kind==='appointment' && String(e.date||'').slice(0,10)>=t; }).length;
    // --- Members ---
    var mem=(D.members||[]).length;

    function card(cls,accent,icon,big,label,sub,go){
      return '<button class="hg__card '+cls+'" data-goto="'+go+'" style="--hg:'+accent+'">'
        +'<span class="hg__ic">'+icon+'</span>'
        +'<span class="hg__big">'+big+'</span>'
        +'<span class="hg__lbl">'+label+'</span>'
        +(sub?'<span class="hg__sub">'+sub+'</span>':'')
      +'</button>';
    }
    var ic={
      money:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 3v18M8 7h5a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h6"/></svg>',
      task:'<svg class="ico" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
      cal:'<svg class="ico" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/></svg>',
      health:'<svg class="ico" viewBox="0 0 24 24"><path d="M20.8 5.6a5.5 5.5 0 0 0-8.8-1.4l-.0 .0-.0-.0A5.5 5.5 0 0 0 3.2 12L12 20.5 20.8 12a5.5 5.5 0 0 0 0-6.4z"/></svg>',
      chore:'<svg class="ico" viewBox="0 0 24 24"><path d="M3 7h18M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
      family:'<svg class="ico" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0M15 20a5 5 0 0 1 6-4.5"/></svg>'
    };

    // Money card: show net or spent
    var moneyBig=sym+Math.round(spent).toLocaleString();
    var moneySub=income>0?('+'+sym+Math.round(income).toLocaleString()+' in'):'this month';
    // Tasks card
    var taskBig, taskLbl, taskSub, taskCls='';
    if(overdue){ taskBig=String(overdue); taskLbl=overdue>1?'tasks overdue':'task overdue'; taskSub=open+' open total'; taskCls='hg__card--alert'; }
    else if(dueToday){ taskBig=String(dueToday); taskLbl='due today'; taskSub=open+' open total'; }
    else { taskBig=String(open); taskLbl=open===1?'open task':'open tasks'; taskSub='all on track'; }
    // Upcoming card
    var upBig, upLbl, upSub;
    if(nextEv){ var dn=daysUntil(nextEv.date); upBig=(dn===0?'Today':(dn===1?'1 day':(dn>1?dn+' days':'Soon'))); upLbl='next: '+esc((nextEv.title||'event').slice(0,18)); upSub=evs.length+' upcoming'; }
    else { upBig='0'; upLbl='upcoming'; upSub='nothing scheduled'; }

    var cards=''
      + card('','var(--m-finance,#3a926b)',ic.money,moneyBig,'spent',moneySub,'finance')
      + card(taskCls,'var(--m-planning,#6d6af0)',ic.task,taskBig,taskLbl,taskSub,'planning')
      + card('','var(--m-dashboard,#c9873f)',ic.cal,upBig,upLbl,upSub,'travel')
      + card('','var(--m-health,#c85b6b)',ic.health,String(appts),appts===1?'appointment':'appointments',appts?'upcoming':'none scheduled','health')
      + card('','var(--m-homemgmt,#8a72a8)',ic.chore,String(choresOpen),choresOpen===1?'chore left':'chores left',choresOpen?'to do':'all done','homemgmt')
      + card('','var(--m-family,#4a90d0)',ic.family,String(mem),mem===1?'member':'members','360\u00b0 profiles','family');

    host.innerHTML='<div class="hg__head"><span class="eyebrow">At a glance</span><span class="hg__date">'+new Date().toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'})+'</span></div>'
      +'<div class="hg__grid">'+cards+'</div>';
  }
  function renderHome(){
 try{ renderHomeGlance(); }catch(e){}
 var host=$('#homeToday');
 if(host){
 var list=[]; try{ list=buildNotifications(); }catch(e){}
 var prio=list.filter(function(a){ return a.sev==='urgent'||a.sev==='today'; });
 var soon=list.filter(function(a){ return a.sev==='soon'; });
 var h='';
 if(prio.length){
 var items=prio.slice(0,3).map(function(a){
 return '<button class="htoday__row" data-goto="'+esc(a.go||a.sp)+'"><span class="htoday__dot"'+(a.sev==='urgent'?' style="background:var(--danger)"':'')+'></span><span class="htoday__rt">'+esc(a.t)+'</span><svg class="ico htoday__rc" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>';
 }).join('');
 h='<div class="htoday htoday--alert"><div class="htoday__head"><div class="htoday__lead"><span class="htoday__k">Today</span><span class="htoday__h">'+prio.length+(prio.length>1?' things need you':' thing needs you')+'</span></div>'
 +'</div>'
 +'<div class="htoday__list">'+items+'</div></div>';
 } else if(soon.length){
 h='<div class="htoday"><div class="htoday__head"><div class="htoday__lead"><span class="htoday__k">Today</span><span class="htoday__h">You\u2019re on track</span><span class="htoday__s">'+soon.length+' thing'+(soon.length>1?'s':'')+' coming up</span></div>'
 +'</div></div>';
 } else {
 h='<div class="htoday htoday--calm"><span class="htoday__check"><svg class="ico" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></span><div class="htoday__lead"><span class="htoday__h">You\u2019re all caught up</span><span class="htoday__s">Nothing urgent today. Enjoy the calm.</span></div><button class="htoday__cta htoday__cta--ghost" data-view="dashboard">My Day</button></div>';
 }
 host.innerHTML=h;
 }
 try{
 document.querySelectorAll('.domains .domain[data-view]').forEach(function(card){
 var v=card.getAttribute('data-view'), st=homeStat(v);
 var desc=card.querySelector('.domain__desc'); if(desc) desc.textContent=st.text;
 card.classList.toggle('is-alert', !!st.alert);
 card.classList.toggle('is-cta', !!st.cta);
 var status=card.querySelector('.domain__status');
 if(status) status.textContent = st.alert?'Needs attention':(st.cta?'Set up':'Open');
 });
 }catch(e){}
 }

 function renderGreeting(){
 var name=familyName();
 $('#greetWord').textContent = greetWord();
 $('#greetName').textContent = name ? name : 'Welcome home';
 var sub=$('#brandSub'); if(sub) sub.textContent = name ? name : 'Family OS';
 var inp=$('#familyInput'); if(inp && document.activeElement!==inp) inp.value=name;
 }
 function saveFamily(){
 var inp=$('#familyInput'); var v=(inp.value||'').trim();
 Store.set(K.family, v); renderGreeting(); flash('Saved');
 }

 /* ---- Live clock ---- */
 var DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 function p2(n){ return (n<10?'0':'')+n; }
 function tick(){
 var d=new Date();
 var clk=$('#clock'); if(clk) clk.textContent = DOW[d.getDay()]+' '+p2(d.getDate())+' '+MON[d.getMonth()]+' · '+p2(d.getHours())+':'+p2(d.getMinutes())+':'+p2(d.getSeconds());
 var dd=$('#dashDate'); if(dd) dd.textContent = DOW[d.getDay()]+', '+d.getDate()+' '+MON[d.getMonth()]+' '+d.getFullYear();
 }

 /* ---- Toast ---- */
 var toastT;
 function flash(msg){ var t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(function(){ t.classList.remove('show'); },1700); }

 /* ---- Reveal replay ---- */
 function reveal(scope){
 /* Views toggle display:none -> block, which restarts child animations natively.
 The old per-element forced-reflow loop here caused layout thrash (jank) on every navigation. */
 }

 /* ===================== FAMILY DATA ===================== */
 var FD = {
 KEY:'fw.family.data',
 data:{members:[],goals:[],events:[],announcements:[],activity:[],governance:{},customCategories:[],responsibilities:[],documents:[],finance:{currency:'USD',transactions:[],budgets:{},customCats:[],planned:[],debts:[],savings:[]},journal:{entries:[],gratitude:[],milestones:[]},cooking:{recipes:[],meals:[],shopping:[]},home:{chores:[],maint:[],supplies:[]},learning:{courses:[],books:[],skills:[]},travel:{trips:[],packing:[],ideas:[]},fitness:{workouts:[],goals:[],routines:[]},nutrition:{meals:[],water:[],targets:{},habits:[]},planning:{tasks:[],projects:[]},relationship:{pinHash:'',pinSalt:'',since:'',notes:[],dates:[],plans:[]},memory:{albums:[],stories:[],capsules:[]},wellbeing:{checkins:[],selfcare:[],growth:[]},legacy:{duas:[],deeds:[],wisdom:[]},vault:{pinHash:'',pinSalt:'',entries:[]},ai:{thread:[],history:[]}},
 load:function(){
 var d = Store.get(this.KEY, null) || {};
 ['members','goals','events','announcements','activity','responsibilities','documents'].forEach(function(k){ if(!Array.isArray(d[k])) d[k]=[]; });
 d.responsibilities.forEach(function(r){ if(typeof r.title!=='string') r.title=''; if(typeof r.assignee!=='string') r.assignee=''; if(typeof r.frequency!=='string') r.frequency='once'; if(typeof r.note!=='string') r.note=''; if(typeof r.done!=='boolean') r.done=false; if(typeof r.doneAt!=='number') r.doneAt=0; });
 d.documents.forEach(function(x){ if(typeof x.title!=='string') x.title=''; if(typeof x.category!=='string') x.category='other'; if(typeof x.owner!=='string') x.owner=''; if(typeof x.note!=='string') x.note=''; if(typeof x.expiry!=='string') x.expiry=''; if(!Array.isArray(x.attachments)) x.attachments=[]; });
 if(!d.finance||typeof d.finance!=='object') d.finance={};
 if(typeof d.finance.currency!=='string') d.finance.currency='USD';
 if(!Array.isArray(d.finance.transactions)) d.finance.transactions=[];
 if(!d.finance.budgets||typeof d.finance.budgets!=='object') d.finance.budgets={};
 if(!Array.isArray(d.finance.customCats)) d.finance.customCats=[];
 d.finance.customCats=d.finance.customCats.filter(function(c){return c&&typeof c==='object'&&c.key&&c.label;}).map(function(c){ return {key:String(c.key),label:String(c.label),color:(typeof c.color==='string'&&c.color)?c.color:'#1E3A7B'}; });
 d.finance.transactions.forEach(function(t){ t.amount=Number(t.amount)||0; if(t.type!=='income'&&t.type!=='expense') t.type='expense'; if(typeof t.category!=='string') t.category='other'; if(typeof t.member!=='string') t.member=''; if(typeof t.date!=='string') t.date=''; if(typeof t.note!=='string') t.note=''; });
 if(!Array.isArray(d.finance.planned)) d.finance.planned=[];
 d.finance.planned.forEach(function(p){ p.amount=Number(p.amount)||0; if(p.type!=='income'&&p.type!=='expense') p.type='expense'; if(typeof p.title!=='string') p.title=''; if(typeof p.category!=='string') p.category='other'; if(typeof p.member!=='string') p.member=''; if(['weekly','monthly','yearly'].indexOf(p.frequency)<0) p.frequency='monthly'; if(typeof p.nextDue!=='string') p.nextDue=''; if(typeof p.note!=='string') p.note=''; if(typeof p.active!=='boolean') p.active=true; if(typeof p.lastPaid!=='string') p.lastPaid=''; });
 if(!Array.isArray(d.finance.debts)) d.finance.debts=[];
 d.finance.debts.forEach(function(x){ x.amount=Number(x.amount)||0; x.paid=Number(x.paid)||0; if(x.paid<0) x.paid=0; if(x.paid>x.amount) x.paid=x.amount; if(x.direction!=='owed_to_us'&&x.direction!=='we_owe') x.direction='owed_to_us'; if(typeof x.person!=='string') x.person=''; if(typeof x.member!=='string') x.member=''; if(typeof x.note!=='string') x.note=''; if(typeof x.date!=='string') x.date=''; if(typeof x.dueDate!=='string') x.dueDate=''; });
 if(!Array.isArray(d.finance.savings)) d.finance.savings=[];
 d.finance.savings.forEach(function(g){ g.target=Number(g.target)||0; g.saved=Number(g.saved)||0; if(g.saved<0) g.saved=0; if(typeof g.title!=='string') g.title=''; if(typeof g.member!=='string') g.member=''; if(typeof g.targetDate!=='string') g.targetDate=''; if(typeof g.note!=='string') g.note=''; if(typeof g.color!=='string'||!g.color) g.color='#1E3A7B'; });
 if(!d.cooking||typeof d.cooking!=='object') d.cooking={};
 if(!Array.isArray(d.cooking.recipes)) d.cooking.recipes=[];
 d.cooking.recipes.forEach(function(x){ if(typeof x.name!=='string') x.name=''; if(typeof x.cat!=='string') x.cat=''; if(typeof x.ingredients!=='string') x.ingredients=''; if(typeof x.steps!=='string') x.steps=''; if(typeof x.photo!=='string') x.photo=''; x.fav=!!x.fav; });
 if(!Array.isArray(d.cooking.meals)) d.cooking.meals=[];
 d.cooking.meals.forEach(function(x){ if(typeof x.date!=='string') x.date=''; if(typeof x.title!=='string') x.title=''; if(typeof x.recipeId!=='string') x.recipeId=''; x.slot=(x.slot==='breakfast'||x.slot==='lunch')?x.slot:'dinner'; });
 if(!Array.isArray(d.cooking.shopping)) d.cooking.shopping=[];
 d.cooking.shopping.forEach(function(x){ if(typeof x.name!=='string') x.name=''; if(typeof x.qty!=='string') x.qty=''; x.done=!!x.done; });
 if(!d.home||typeof d.home!=='object') d.home={};
 if(!Array.isArray(d.home.chores)) d.home.chores=[];
 d.home.chores.forEach(function(x){ if(typeof x.title!=='string') x.title=''; if(typeof x.assignee!=='string') x.assignee=''; x.freq=(x.freq==='daily'||x.freq==='weekly'||x.freq==='monthly')?x.freq:'once'; if(typeof x.lastDone!=='string') x.lastDone=''; });
 if(!Array.isArray(d.home.maint)) d.home.maint=[];
 d.home.maint.forEach(function(x){ if(typeof x.title!=='string') x.title=''; if(typeof x.area!=='string') x.area=''; if(typeof x.due!=='string') x.due=''; if(typeof x.note!=='string') x.note=''; x.done=!!x.done; });
 if(!Array.isArray(d.home.supplies)) d.home.supplies=[];
 d.home.supplies.forEach(function(x){ if(typeof x.name!=='string') x.name=''; if(typeof x.cat!=='string') x.cat=''; x.status=(x.status==='low'||x.status==='out')?x.status:'ok'; });
 if(!d.learning||typeof d.learning!=='object') d.learning={};
 if(!Array.isArray(d.learning.courses)) d.learning.courses=[];
 d.learning.courses.forEach(function(x){ if(typeof x.title!=='string') x.title=''; if(typeof x.member!=='string') x.member=''; if(typeof x.subject!=='string') x.subject=''; if(typeof x.source!=='string') x.source=''; if(typeof x.note!=='string') x.note=''; x.progress=Math.max(0,Math.min(100,parseInt(x.progress,10)||0)); });
 if(!Array.isArray(d.learning.books)) d.learning.books=[];
 d.learning.books.forEach(function(x){ if(typeof x.title!=='string') x.title=''; if(typeof x.author!=='string') x.author=''; if(typeof x.member!=='string') x.member=''; if(typeof x.note!=='string') x.note=''; x.progress=Math.max(0,Math.min(100,parseInt(x.progress,10)||0)); });
 if(!Array.isArray(d.learning.skills)) d.learning.skills=[];
 d.learning.skills.forEach(function(x){ if(typeof x.name!=='string') x.name=''; if(typeof x.member!=='string') x.member=''; if(typeof x.note!=='string') x.note=''; x.level=Math.max(1,Math.min(4,parseInt(x.level,10)||1)); });
 if(!d.travel||typeof d.travel!=='object') d.travel={};
 if(!Array.isArray(d.travel.trips)) d.travel.trips=[];
 d.travel.trips.forEach(function(x){ if(typeof x.dest!=='string') x.dest=''; if(typeof x.start!=='string') x.start=''; if(typeof x.end!=='string') x.end=''; if(typeof x.travelers!=='string') x.travelers=''; if(typeof x.note!=='string') x.note=''; if(typeof x.photo!=='string') x.photo=''; });
 if(!Array.isArray(d.travel.packing)) d.travel.packing=[];
 d.travel.packing.forEach(function(x){ if(typeof x.tripId!=='string') x.tripId=''; if(typeof x.name!=='string') x.name=''; x.done=!!x.done; });
 if(!Array.isArray(d.travel.ideas)) d.travel.ideas=[];
 d.travel.ideas.forEach(function(x){ if(typeof x.place!=='string') x.place=''; if(typeof x.note!=='string') x.note=''; });
 if(!d.fitness||typeof d.fitness!=='object') d.fitness={};
 if(!Array.isArray(d.fitness.workouts)) d.fitness.workouts=[];
 d.fitness.workouts.forEach(function(x){ if(typeof x.date!=='string') x.date=''; if(typeof x.type!=='string') x.type=''; if(typeof x.member!=='string') x.member=''; if(typeof x.note!=='string') x.note=''; x.minutes=Math.max(0,parseInt(x.minutes,10)||0); });
 if(!Array.isArray(d.fitness.goals)) d.fitness.goals=[];
 d.fitness.goals.forEach(function(x){ if(typeof x.member!=='string') x.member=''; x.kind=(x.kind==='minutes')?'minutes':'sessions'; x.target=Math.max(1,parseInt(x.target,10)||1); });
 if(!Array.isArray(d.fitness.routines)) d.fitness.routines=[];
 d.fitness.routines.forEach(function(x){ if(typeof x.name!=='string') x.name=''; if(typeof x.member!=='string') x.member=''; if(typeof x.days!=='string') x.days=''; if(typeof x.items!=='string') x.items=''; });
 if(!d.nutrition||typeof d.nutrition!=='object') d.nutrition={};
 if(!Array.isArray(d.nutrition.meals)) d.nutrition.meals=[];
 d.nutrition.meals.forEach(function(x){ if(typeof x.date!=='string') x.date=''; if(typeof x.meal!=='string') x.meal=''; if(typeof x.what!=='string') x.what=''; if(typeof x.quality!=='string') x.quality=''; if(typeof x.member!=='string') x.member=''; if(typeof x.note!=='string') x.note=''; });
 if(!Array.isArray(d.nutrition.water)) d.nutrition.water=[];
 d.nutrition.water.forEach(function(x){ if(typeof x.date!=='string') x.date=''; if(typeof x.member!=='string') x.member=''; x.glasses=Math.max(0,parseInt(x.glasses,10)||0); });
 if(!d.nutrition.targets||typeof d.nutrition.targets!=='object') d.nutrition.targets={};
 if(!Array.isArray(d.nutrition.habits)) d.nutrition.habits=[];
 d.nutrition.habits.forEach(function(x){ if(typeof x.title!=='string') x.title=''; if(typeof x.member!=='string') x.member=''; if(!Array.isArray(x.dates)) x.dates=[]; x.dates=x.dates.filter(function(t){return typeof t==='string'&&t;}); });
 if(!d.planning||typeof d.planning!=='object') d.planning={};
 if(!Array.isArray(d.planning.tasks)) d.planning.tasks=[];
 d.planning.tasks.forEach(function(x){ if(typeof x.title!=='string') x.title=''; if(typeof x.due!=='string') x.due=''; if(typeof x.member!=='string') x.member=''; if(typeof x.projectId!=='string') x.projectId=''; if(typeof x.note!=='string') x.note=''; x.priority=(x.priority==='high'||x.priority==='low')?x.priority:'normal'; x.done=!!x.done; });
 d.planning.tasks.forEach(function(x){ if(Array.isArray(x.subs)) x.subs=x.subs.filter(function(s){return s&&typeof s.t==='string'&&s.t.trim();}); });
 if(!Array.isArray(d.planning.projects)) d.planning.projects=[];
 d.planning.projects.forEach(function(x){ if(typeof x.name!=='string') x.name=''; if(typeof x.note!=='string') x.note=''; if(['personal','work','health','finance','family','education','travel'].indexOf(x.cat)===-1) x.cat='family'; x.prio=(x.prio==='high'||x.prio==='low')?x.prio:'normal'; x.pinned=!!x.pinned; if(x.status!=='completed'&&x.status!=='archived') x.status='active'; if(typeof x.order!=='number') x.order=0; if(!Array.isArray(x.members)) x.members=[]; x.members=x.members.filter(function(m){ return typeof m==='string' && m; }); if(typeof x.parentId!=='string') x.parentId=''; if(typeof x.goalId!=='string') x.goalId=''; if(typeof x.due!=='string') x.due=''; });
 /* heal the hierarchy: drop dead parents, self-links and anything deeper than two levels */
 (function(){
  var byId={}; d.planning.projects.forEach(function(x){ byId[x.id]=x; });
  d.planning.projects.forEach(function(x){
   if(!x.parentId) return;
   if(x.parentId===x.id){ x.parentId=''; return; }
   var par=byId[x.parentId];
   if(!par){ x.parentId=''; return; }        /* parent was deleted */
   if(par.parentId){ x.parentId=''; return; } /* would be a third level */
  });
  /* break any cycle that somehow survived */
  d.planning.projects.forEach(function(x){
   var seen={}, cur=x, hops=0;
   while(cur && cur.parentId && hops<50){
    if(seen[cur.id]){ x.parentId=''; break; }
    seen[cur.id]=1; cur=byId[cur.parentId]; hops++;
   }
  });
 })();
 if(!d.relationship||typeof d.relationship!=='object') d.relationship={};
 if(!d.ai||typeof d.ai!=='object') d.ai={thread:[],history:[]};
 if(!Array.isArray(d.ai.thread)) d.ai.thread=[];
 if(!Array.isArray(d.ai.history)) d.ai.history=[];
 if(!d.vault||typeof d.vault!=='object') d.vault={pinHash:'',pinSalt:'',entries:[]};
 if(typeof d.vault.pinHash!=='string') d.vault.pinHash='';
 if(typeof d.vault.pinSalt!=='string') d.vault.pinSalt='';
 if(!Array.isArray(d.vault.entries)) d.vault.entries=[];
 if(typeof d.relationship.pinHash!=='string') d.relationship.pinHash='';
 if(typeof d.relationship.pinSalt!=='string') d.relationship.pinSalt='';
 if(typeof d.relationship.since!=='string') d.relationship.since='';
 if(!Array.isArray(d.relationship.notes)) d.relationship.notes=[];
 d.relationship.notes.forEach(function(x){ if(typeof x.date!=='string') x.date=''; if(typeof x.from!=='string') x.from=''; if(typeof x.title!=='string') x.title=''; if(typeof x.body!=='string') x.body=''; });
 if(!Array.isArray(d.relationship.dates)) d.relationship.dates=[];
 d.relationship.dates.forEach(function(x){ if(typeof x.title!=='string') x.title=''; if(typeof x.date!=='string') x.date=''; if(typeof x.type!=='string') x.type=''; if(typeof x.note!=='string') x.note=''; });
 if(!Array.isArray(d.relationship.plans)) d.relationship.plans=[];
 d.relationship.plans.forEach(function(x){ if(typeof x.title!=='string') x.title=''; if(typeof x.when!=='string') x.when=''; if(typeof x.place!=='string') x.place=''; if(typeof x.note!=='string') x.note=''; x.done=!!x.done; if(typeof x.doneAt!=='string') x.doneAt=''; });
 if(!d.memory||typeof d.memory!=='object') d.memory={};
 if(!Array.isArray(d.memory.albums)) d.memory.albums=[];
 d.memory.albums.forEach(function(a){ if(typeof a.name!=='string') a.name=''; if(typeof a.note!=='string') a.note=''; if(!Array.isArray(a.photos)) a.photos=[]; a.photos.forEach(function(p){ if(typeof p.photo!=='string') p.photo=''; if(typeof p.caption!=='string') p.caption=''; if(typeof p.date!=='string') p.date=''; }); });
 if(!Array.isArray(d.memory.stories)) d.memory.stories=[];
 d.memory.stories.forEach(function(x){ if(typeof x.title!=='string') x.title=''; if(typeof x.when!=='string') x.when=''; if(typeof x.who!=='string') x.who=''; if(typeof x.body!=='string') x.body=''; if(typeof x.photo!=='string') x.photo=''; });
 if(!Array.isArray(d.memory.capsules)) d.memory.capsules=[];
 d.memory.capsules.forEach(function(x){ if(typeof x.title!=='string') x.title=''; if(typeof x.openOn!=='string') x.openOn=''; if(typeof x.body!=='string') x.body=''; if(typeof x.from!=='string') x.from=''; });
 if(!d.wellbeing||typeof d.wellbeing!=='object') d.wellbeing={};
 if(!Array.isArray(d.wellbeing.checkins)) d.wellbeing.checkins=[];
 d.wellbeing.checkins.forEach(function(x){ if(typeof x.date!=='string') x.date=''; if(typeof x.member!=='string') x.member=''; if(typeof x.note!=='string') x.note=''; x.mood=Math.max(1,Math.min(5,parseInt(x.mood,10)||3)); x.energy=Math.max(1,Math.min(5,parseInt(x.energy,10)||3)); });
 if(!Array.isArray(d.wellbeing.selfcare)) d.wellbeing.selfcare=[];
 d.wellbeing.selfcare.forEach(function(x){ if(typeof x.title!=='string') x.title=''; if(typeof x.member!=='string') x.member=''; if(!Array.isArray(x.log)) x.log=[]; x.log=x.log.filter(function(t){return typeof t==='string'&&t;}); });
 if(!Array.isArray(d.wellbeing.growth)) d.wellbeing.growth=[];
 d.wellbeing.growth.forEach(function(x){ if(typeof x.title!=='string') x.title=''; if(typeof x.member!=='string') x.member=''; if(typeof x.why!=='string') x.why=''; if(!Array.isArray(x.reflections)) x.reflections=[]; x.reflections.forEach(function(r){ if(typeof r.date!=='string') r.date=''; if(typeof r.text!=='string') r.text=''; }); });
 if(!d.legacy||typeof d.legacy!=='object') d.legacy={};
 if(!Array.isArray(d.legacy.duas)) d.legacy.duas=[];
 d.legacy.duas.forEach(function(x){ if(typeof x.title!=='string') x.title=''; if(typeof x.text!=='string') x.text=''; if(typeof x.note!=='string') x.note=''; });
 if(!Array.isArray(d.legacy.deeds)) d.legacy.deeds=[];
 d.legacy.deeds.forEach(function(x){ if(typeof x.date!=='string') x.date=''; if(typeof x.what!=='string') x.what=''; if(typeof x.member!=='string') x.member=''; if(typeof x.note!=='string') x.note=''; });
 if(!Array.isArray(d.legacy.wisdom)) d.legacy.wisdom=[];
 d.legacy.wisdom.forEach(function(x){ if(typeof x.text!=='string') x.text=''; if(typeof x.from!=='string') x.from=''; if(typeof x.when!=='string') x.when=''; });
 if(!d.journal||typeof d.journal!=='object') d.journal={};
 if(!Array.isArray(d.journal.entries)) d.journal.entries=[];
 d.journal.entries.forEach(function(x){ if(typeof x.title!=='string') x.title=''; if(typeof x.body!=='string') x.body=''; x.mood=parseInt(x.mood,10)||0; if(x.mood<0||x.mood>5) x.mood=0; if(typeof x.member!=='string') x.member=''; if(typeof x.date!=='string') x.date=''; if(!Array.isArray(x.tags)) x.tags=[]; x.tags=x.tags.filter(function(t){return typeof t==='string'&&t;}); if(typeof x.photo!=='string') x.photo=''; });
 if(!Array.isArray(d.journal.gratitude)) d.journal.gratitude=[];
 d.journal.gratitude.forEach(function(x){ if(typeof x.date!=='string') x.date=''; if(typeof x.member!=='string') x.member=''; if(!Array.isArray(x.items)) x.items=[]; x.items=x.items.filter(function(t){return typeof t==='string'&&t;}); });
 if(!Array.isArray(d.journal.milestones)) d.journal.milestones=[];
 d.journal.milestones.forEach(function(x){ if(typeof x.title!=='string') x.title=''; if(typeof x.note!=='string') x.note=''; if(typeof x.member!=='string') x.member=''; if(typeof x.date!=='string') x.date=''; if(typeof x.photo!=='string') x.photo=''; });
 d.members.forEach(function(m){ ['allergies','medications','records','expenses','support','conditions','vitals'].forEach(function(k){ if(!Array.isArray(m[k])) m[k]=[]; }); if(m.relation==null) m.relation=m.role||''; if(!m.health||typeof m.health!=='object') m.health={}; });
 if(!d.governance || typeof d.governance!=='object') d.governance={};
 ['mission','vision','values','constitution','rules'].forEach(function(k){ var g=d.governance[k]; if(!g||typeof g!=='object') d.governance[k]={text:'',updatedAt:0,history:[]}; else { if(typeof g.text!=='string') g.text=''; if(typeof g.updatedAt!=='number') g.updatedAt=0; if(!Array.isArray(g.history)) g.history=[]; } });
 d.events.forEach(function(e){ if(e.kind==='meeting'){ if(typeof e.status!=='string') e.status='upcoming'; if(typeof e.notes!=='string') e.notes=''; ['decisions','actionItems','followUps'].forEach(function(k){ if(!Array.isArray(e[k])) e[k]=[]; }); if(!e.category) e.category='meeting'; } if(typeof e.category!=='string') e.category=''; if(typeof e.repeat!=='string') e.repeat='none'; if(typeof e.reminder!=='string') e.reminder=''; if(typeof e.description!=='string') e.description=''; if(typeof e.location!=='string') e.location=e.location||''; if(typeof e.notes!=='string') e.notes=''; if(typeof e.allDay!=='boolean') e.allDay=false; if(typeof e.completed!=='boolean') e.completed=false; if(!Array.isArray(e.participants)) e.participants=[]; if(!Array.isArray(e.attachments)) e.attachments=[]; });
 d.goals.forEach(function(g){ if(typeof g.type!=='string') g.type=''; var legacy={spiritual:1,travel:1,home:1,learning:1}; if(legacy[g.type]){ g.progressManual=(typeof g.progress==='number'?g.progress:parseInt(g.progress||0,10))||0; g.type=(g.type==='learning')?'education':'general'; } if(typeof g.deadline!=='string') g.deadline=''; if(typeof g.owner!=='string') g.owner=''; if(typeof g.progress!=='number') g.progress=parseInt(g.progress||0,10)||0; });
 if(!Array.isArray(d.customCategories)) d.customCategories=[];
 d.customCategories=d.customCategories.filter(function(c){return c&&typeof c==='object'&&c.key&&c.label;}).map(function(c){ return {key:String(c.key),label:String(c.label),color:(typeof c.color==='string'&&c.color)?c.color:'#1E3A7B'}; });
 if(!Array.isArray(d.channels)){ d.channels=[{id:this.uid(),name:'Family Chat',system:true}]; }
 (function(){ try{
   var oldNames=['General Chat','Parents','Husband & Wife','Children'];
   var sys=d.channels.filter(function(c){return c.system;});
   var looksOld = sys.length>=3 && sys.filter(function(c){return oldNames.indexOf(c.name)>=0;}).length>=3;
   if(looksOld && !Store.get('fw.chan.migrated')){
     var withMsgs=d.channels.filter(function(c){return (c.messages||[]).length>0;});
     var keep;
     if(withMsgs.length===0){ keep=[{id:d.channels[0].id,name:'Family Chat',system:true,messages:[]}]; }
     else { keep=withMsgs; keep[0].name=keep[0].name||'Family Chat'; }
     d.channels=keep;
     Store.set('fw.chan.migrated','1');
   }
 }catch(e){} })();
 d.channels.forEach(function(ch){ if(!Array.isArray(ch.messages)) ch.messages=[]; ch.messages.forEach(function(msg){ if(typeof msg.text!=='string') msg.text=''; if(typeof msg.from!=='string') msg.from=''; if(typeof msg.pinned!=='boolean') msg.pinned=false; }); });
 if(!Array.isArray(d.polls)) d.polls=[];
 d.polls.forEach(function(p){ if(!Array.isArray(p.options)) p.options=[]; if(!p.votes||typeof p.votes!=='object') p.votes={}; if(typeof p.allowChange!=='boolean') p.allowChange=false; p.options.forEach(function(o){ if(typeof o.id!=='string') o.id='o'+Math.random().toString(36).slice(2,7); }); });
 if(!Array.isArray(d.noteLists)){ d.noteLists=[{id:this.uid(),title:'Shopping ideas',items:[]},{id:this.uid(),title:'Vacation plans',items:[]},{id:this.uid(),title:'Family reminders',items:[]}]; }
 d.noteLists.forEach(function(n){ if(!Array.isArray(n.items)) n.items=[]; });
 this.data = d; return d;
 },
 save:function(){ Store.set(this.KEY, this.data); try{ queuePush(); }catch(e){} try{ queueNotifSweep(); }catch(e){} },
 uid:function(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); },
 log:function(type,text){ this.data.activity.unshift({id:this.uid(),type:type,text:text,ts:Date.now()}); if(this.data.activity.length>60) this.data.activity.length=60; },
 addMember:function(m){ m.id=this.uid(); ['allergies','medications','records','expenses','support','conditions','vitals'].forEach(function(k){ if(!Array.isArray(m[k])) m[k]=[]; }); if(!m.health||typeof m.health!=='object') m.health={}; this.data.members.push(m); this.log('member','Added '+m.name+' to the family'); this.save(); },
 addGoal:function(g){ g.id=this.uid(); g.createdAt=Date.now(); this.data.goals.push(g); this.log('goal','Created goal: '+g.title); this.save(); },
 addEvent:function(e){ e.id=this.uid(); e.createdAt=Date.now(); if(e.kind==='meeting'){ if(typeof e.status!=='string') e.status='upcoming'; if(typeof e.notes!=='string') e.notes=''; e.decisions=e.decisions||[]; e.actionItems=e.actionItems||[]; e.followUps=e.followUps||[]; } if(typeof e.category!=='string') e.category=''; if(typeof e.repeat!=='string') e.repeat='none'; if(typeof e.reminder!=='string') e.reminder=''; if(typeof e.allDay!=='boolean') e.allDay=false; if(typeof e.completed!=='boolean') e.completed=false; e.participants=e.participants||[]; e.attachments=e.attachments||[]; this.data.events.push(e); this.log('event','Scheduled: '+e.title); this.save(); },
 addAnnouncement:function(a){ a.id=this.uid(); a.createdAt=Date.now(); this.data.announcements.unshift(a); this.log('announcement','Announcement from '+(a.author||'Family')); this.save(); },
 getMember:function(id){ for(var i=0;i<this.data.members.length;i++){ if(this.data.members[i].id===id) return this.data.members[i]; } return null; },
 updateMember:function(id,patch){ var m=this.getMember(id); if(!m) return; for(var k in patch){ m[k]=patch[k]; } this.save(); },
 removeMember:function(id){ var m=this.getMember(id); var nm=m?m.name:'member'; this.data.members=this.data.members.filter(function(x){return x.id!==id;}); this.log('member','Removed '+nm); this.save(); },
 getJournalEntry:function(id){ var a=this.data.journal.entries; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addJournalEntry:function(e){ e.id=this.uid(); e.createdAt=Date.now(); this.data.journal.entries.push(e); this.log('journal','New journal entry'+(e.title?': '+e.title:'')); this.save(); },
 updateJournalEntry:function(id,patch){ var x=this.getJournalEntry(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeJournalEntry:function(id){ this.data.journal.entries=this.data.journal.entries.filter(function(x){return x.id!==id;}); this.save(); },
 getGratitude:function(id){ var a=this.data.journal.gratitude; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addGratitude:function(g){ g.id=this.uid(); g.createdAt=Date.now(); this.data.journal.gratitude.push(g); this.log('journal','Added gratitude'); this.save(); },
 updateGratitude:function(id,patch){ var x=this.getGratitude(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeGratitude:function(id){ this.data.journal.gratitude=this.data.journal.gratitude.filter(function(x){return x.id!==id;}); this.save(); },
 getMilestone:function(id){ var a=this.data.journal.milestones; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addMilestone:function(m){ m.id=this.uid(); m.createdAt=Date.now(); this.data.journal.milestones.push(m); this.log('journal','Added milestone'+(m.title?': '+m.title:'')); this.save(); },
 updateMilestone:function(id,patch){ var x=this.getMilestone(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeMilestone:function(id){ this.data.journal.milestones=this.data.journal.milestones.filter(function(x){return x.id!==id;}); this.save(); },
 getRecipe:function(id){ var a=this.data.cooking.recipes; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addRecipe:function(r){ r.id=this.uid(); r.createdAt=Date.now(); this.data.cooking.recipes.push(r); this.log('cooking','Added recipe: '+r.name); this.save(); },
 updateRecipe:function(id,patch){ var x=this.getRecipe(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeRecipe:function(id){ this.data.cooking.recipes=this.data.cooking.recipes.filter(function(x){return x.id!==id;}); this.save(); },
 toggleFavRecipe:function(id){ var x=this.getRecipe(id); if(!x) return; x.fav=!x.fav; this.save(); },
 getMeal:function(id){ var a=this.data.cooking.meals; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addMeal:function(m){ m.id=this.uid(); m.createdAt=Date.now(); this.data.cooking.meals.push(m); this.log('cooking','Planned: '+m.title); this.save(); },
 updateMeal:function(id,patch){ var x=this.getMeal(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeMeal:function(id){ this.data.cooking.meals=this.data.cooking.meals.filter(function(x){return x.id!==id;}); this.save(); },
 getShopItem:function(id){ var a=this.data.cooking.shopping; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addShopItem:function(s){ s.id=this.uid(); s.createdAt=Date.now(); this.data.cooking.shopping.push(s); this.save(); },
 updateShopItem:function(id,patch){ var x=this.getShopItem(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeShopItem:function(id){ this.data.cooking.shopping=this.data.cooking.shopping.filter(function(x){return x.id!==id;}); this.save(); },
 toggleShopItem:function(id){ var x=this.getShopItem(id); if(!x) return; x.done=!x.done; this.save(); },
 clearDoneShopping:function(){ this.data.cooking.shopping=this.data.cooking.shopping.filter(function(x){return !x.done;}); this.save(); },
 getChore:function(id){ var a=this.data.home.chores; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addChore:function(c){ c.id=this.uid(); c.createdAt=Date.now(); this.data.home.chores.push(c); this.log('home','Added chore: '+c.title); this.save(); },
 updateChore:function(id,patch){ var x=this.getChore(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeChore:function(id){ this.data.home.chores=this.data.home.chores.filter(function(x){return x.id!==id;}); this.save(); },
 checkChore:function(id){ var x=this.getChore(id); if(!x) return; x.lastDone=choreDue(x)?todayStr():''; this.save(); },
 getMaint:function(id){ var a=this.data.home.maint; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addMaint:function(m){ m.id=this.uid(); m.createdAt=Date.now(); this.data.home.maint.push(m); this.log('home','Added maintenance: '+m.title); this.save(); },
 updateMaint:function(id,patch){ var x=this.getMaint(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeMaint:function(id){ this.data.home.maint=this.data.home.maint.filter(function(x){return x.id!==id;}); this.save(); },
 toggleMaint:function(id){ var x=this.getMaint(id); if(!x) return; x.done=!x.done; x.doneAt=x.done?todayStr():''; this.save(); },
 getSupply:function(id){ var a=this.data.home.supplies; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addSupply:function(s){ s.id=this.uid(); s.createdAt=Date.now(); this.data.home.supplies.push(s); this.save(); },
 updateSupply:function(id,patch){ var x=this.getSupply(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeSupply:function(id){ this.data.home.supplies=this.data.home.supplies.filter(function(x){return x.id!==id;}); this.save(); },
 cycleSupply:function(id){ var x=this.getSupply(id); if(!x) return; x.status={ok:'low',low:'out',out:'ok'}[x.status]||'low'; this.save(); },
 getCourse:function(id){ var a=this.data.learning.courses; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addCourse:function(c){ c.id=this.uid(); c.createdAt=Date.now(); this.data.learning.courses.push(c); this.log('learning','Started course: '+c.title); this.save(); },
 updateCourse:function(id,patch){ var x=this.getCourse(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeCourse:function(id){ this.data.learning.courses=this.data.learning.courses.filter(function(x){return x.id!==id;}); this.save(); },
 getBook:function(id){ var a=this.data.learning.books; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addBook:function(b){ b.id=this.uid(); b.createdAt=Date.now(); this.data.learning.books.push(b); this.log('learning','Added book: '+b.title); this.save(); },
 updateBook:function(id,patch){ var x=this.getBook(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeBook:function(id){ this.data.learning.books=this.data.learning.books.filter(function(x){return x.id!==id;}); this.save(); },
 bumpProgress:function(kind,id,d){ var x=(kind==='book')?this.getBook(id):this.getCourse(id); if(!x) return; x.progress=Math.max(0,Math.min(100,(parseInt(x.progress,10)||0)+d)); this.save(); },
 getSkill:function(id){ var a=this.data.learning.skills; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addSkill:function(s){ s.id=this.uid(); s.createdAt=Date.now(); this.data.learning.skills.push(s); this.log('learning','New skill: '+s.name); this.save(); },
 updateSkill:function(id,patch){ var x=this.getSkill(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeSkill:function(id){ this.data.learning.skills=this.data.learning.skills.filter(function(x){return x.id!==id;}); this.save(); },
 levelUpSkill:function(id){ var x=this.getSkill(id); if(!x) return; x.level=Math.min(4,(parseInt(x.level,10)||1)+1); this.save(); },
 getTrip:function(id){ var a=this.data.travel.trips; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addTrip:function(t){ t.id=this.uid(); t.createdAt=Date.now(); this.data.travel.trips.push(t); this.log('travel','New trip: '+t.dest); this.save(); },
 updateTrip:function(id,patch){ var x=this.getTrip(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeTrip:function(id){ this.data.travel.trips=this.data.travel.trips.filter(function(x){return x.id!==id;}); this.data.travel.packing=this.data.travel.packing.filter(function(p){return p.tripId!==id;}); this.save(); },
 getPack:function(id){ var a=this.data.travel.packing; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addPack:function(p){ p.id=this.uid(); p.createdAt=Date.now(); this.data.travel.packing.push(p); this.save(); },
 updatePack:function(id,patch){ var x=this.getPack(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removePack:function(id){ this.data.travel.packing=this.data.travel.packing.filter(function(x){return x.id!==id;}); this.save(); },
 togglePack:function(id){ var x=this.getPack(id); if(!x) return; x.done=!x.done; this.save(); },
 resetPacking:function(tripId){ this.data.travel.packing.forEach(function(p){ if(p.tripId===tripId) p.done=false; }); this.save(); },
 getIdea:function(id){ var a=this.data.travel.ideas; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addIdea:function(x){ x.id=this.uid(); x.createdAt=Date.now(); this.data.travel.ideas.push(x); this.log('travel','Bucket list: '+x.place); this.save(); },
 updateIdea:function(id,patch){ var x=this.getIdea(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeIdea:function(id){ this.data.travel.ideas=this.data.travel.ideas.filter(function(x){return x.id!==id;}); this.save(); },
 getWorkout:function(id){ var a=this.data.fitness.workouts; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addWorkout:function(w){ w.id=this.uid(); w.createdAt=Date.now(); this.data.fitness.workouts.push(w); this.log('fitness','Logged '+(w.type||'workout')); this.save(); },
 updateWorkout:function(id,patch){ var x=this.getWorkout(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeWorkout:function(id){ this.data.fitness.workouts=this.data.fitness.workouts.filter(function(x){return x.id!==id;}); this.save(); },
 getFitGoal:function(id){ var a=this.data.fitness.goals; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addFitGoal:function(g){ g.id=this.uid(); g.createdAt=Date.now(); this.data.fitness.goals.push(g); this.log('fitness','New fitness goal'); this.save(); },
 updateFitGoal:function(id,patch){ var x=this.getFitGoal(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeFitGoal:function(id){ this.data.fitness.goals=this.data.fitness.goals.filter(function(x){return x.id!==id;}); this.save(); },
 getRoutine:function(id){ var a=this.data.fitness.routines; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addRoutine:function(r){ r.id=this.uid(); r.createdAt=Date.now(); this.data.fitness.routines.push(r); this.log('fitness','New routine: '+r.name); this.save(); },
 updateRoutine:function(id,patch){ var x=this.getRoutine(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeRoutine:function(id){ this.data.fitness.routines=this.data.fitness.routines.filter(function(x){return x.id!==id;}); this.save(); },
 getNMeal:function(id){ var a=this.data.nutrition.meals; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addNMeal:function(m){ m.id=this.uid(); m.createdAt=Date.now(); this.data.nutrition.meals.push(m); this.log('nutrition','Logged '+(m.meal||'meal')); this.save(); },
 updateNMeal:function(id,patch){ var x=this.getNMeal(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeNMeal:function(id){ this.data.nutrition.meals=this.data.nutrition.meals.filter(function(x){return x.id!==id;}); this.save(); },
 setWater:function(member,delta){ var t=todayStr(); var rec=null; this.data.nutrition.water.forEach(function(w){ if(w.date===t&&w.member===member) rec=w; }); if(!rec){ if(delta<=0) return; rec={id:this.uid(),date:t,member:member,glasses:0}; this.data.nutrition.water.push(rec); } rec.glasses=Math.max(0,rec.glasses+delta); this.save(); },
 setWaterTarget:function(member,n){ this.data.nutrition.targets[member]=Math.max(1,Math.min(30,parseInt(n,10)||8)); this.save(); },
 getHabit:function(id){ var a=this.data.nutrition.habits; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addHabit:function(h){ h.id=this.uid(); h.createdAt=Date.now(); if(!Array.isArray(h.dates)) h.dates=[]; this.data.nutrition.habits.push(h); this.log('nutrition','New habit: '+h.title); this.save(); },
 updateHabit:function(id,patch){ var x=this.getHabit(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeHabit:function(id){ this.data.nutrition.habits=this.data.nutrition.habits.filter(function(x){return x.id!==id;}); this.save(); },
 toggleHabitToday:function(id){ var x=this.getHabit(id); if(!x) return; var t=todayStr(); var i=x.dates.indexOf(t); if(i>=0) x.dates.splice(i,1); else { x.dates.push(t); x.dates.sort(); if(x.dates.length>120) x.dates=x.dates.slice(-120); } this.save(); },
 getTask:function(id){ var a=this.data.planning.tasks; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addTask:function(t){ t.id=this.uid(); t.createdAt=Date.now(); this.data.planning.tasks.push(t); this.log('planning','Task: '+t.title); this.save(); },
 updateTask:function(id,patch){ var x=this.getTask(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeTask:function(id){ this.data.planning.tasks=this.data.planning.tasks.filter(function(x){return x.id!==id;}); this.save(); },
 toggleTask:function(id){ var x=this.getTask(id); if(!x) return; x.done=!x.done; x.doneAt=x.done?todayStr():''; this.save(); },
 clearDoneTasks:function(){ this.data.planning.tasks=this.data.planning.tasks.filter(function(x){return !x.done;}); this.save(); },
 getProject:function(id){ var a=this.data.planning.projects; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addProject:function(p){ p.id=this.uid(); p.createdAt=Date.now(); this.data.planning.projects.push(p); this.log('planning','Project: '+p.name); this.save(); },
 updateProject:function(id,patch){ var x=this.getProject(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeProject:function(id){ this.data.planning.projects=this.data.planning.projects.filter(function(x){return x.id!==id;}); this.data.planning.tasks.forEach(function(t){ if(t.projectId===id) t.projectId=''; }); this.save(); },
 setVaultPin:function(hash,salt){ this.data.vault.pinHash=hash; this.data.vault.pinSalt=salt; this.save(); },
 addVaultEntry:function(e){ e.id='v'+Date.now()+Math.floor(Math.random()*999); e.ts=Date.now(); this.data.vault.entries.unshift(e); this.save(); return e; },
 updateVaultEntry:function(id,patch){ var es=this.data.vault.entries; for(var i=0;i<es.length;i++){ if(es[i].id===id){ for(var k in patch){ es[i][k]=patch[k]; } this.save(); return es[i]; } } return null; },
 removeVaultEntry:function(id){ this.data.vault.entries=this.data.vault.entries.filter(function(e){return e.id!==id;}); this.save(); },
 wipeVault:function(){ this.data.vault={pinHash:'',pinSalt:'',entries:[]}; this.save(); },
 setRelPin:function(hash,salt){ this.data.relationship.pinHash=hash; this.data.relationship.pinSalt=salt; this.save(); },
 setRelSince:function(dt){ this.data.relationship.since=dt||''; this.save(); },
 wipeRelationship:function(){ this.data.relationship={pinHash:'',pinSalt:'',since:'',notes:[],dates:[],plans:[]}; this.save(); },
 getRelNote:function(id){ var a=this.data.relationship.notes; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addRelNote:function(n){ n.id=this.uid(); n.createdAt=Date.now(); this.data.relationship.notes.push(n); this.save(); },
 updateRelNote:function(id,patch){ var x=this.getRelNote(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeRelNote:function(id){ this.data.relationship.notes=this.data.relationship.notes.filter(function(x){return x.id!==id;}); this.save(); },
 getRelDate:function(id){ var a=this.data.relationship.dates; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addRelDate:function(x){ x.id=this.uid(); x.createdAt=Date.now(); this.data.relationship.dates.push(x); this.save(); },
 updateRelDate:function(id,patch){ var x=this.getRelDate(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeRelDate:function(id){ this.data.relationship.dates=this.data.relationship.dates.filter(function(x){return x.id!==id;}); this.save(); },
 getRelPlan:function(id){ var a=this.data.relationship.plans; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addRelPlan:function(p){ p.id=this.uid(); p.createdAt=Date.now(); this.data.relationship.plans.push(p); this.save(); },
 updateRelPlan:function(id,patch){ var x=this.getRelPlan(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeRelPlan:function(id){ this.data.relationship.plans=this.data.relationship.plans.filter(function(x){return x.id!==id;}); this.save(); },
 toggleRelPlan:function(id){ var x=this.getRelPlan(id); if(!x) return; x.done=!x.done; x.doneAt=x.done?todayStr():''; this.save(); },
 getAlbum:function(id){ var a=this.data.memory.albums; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addAlbum:function(a){ a.id=this.uid(); a.createdAt=Date.now(); if(!Array.isArray(a.photos)) a.photos=[]; this.data.memory.albums.push(a); this.log('memory','New album: '+a.name); this.save(); },
 updateAlbum:function(id,patch){ var x=this.getAlbum(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeAlbum:function(id){ this.data.memory.albums=this.data.memory.albums.filter(function(x){return x.id!==id;}); this.save(); },
 getAlbumPhoto:function(aid,pid){ var a=this.getAlbum(aid); if(!a) return null; for(var i=0;i<a.photos.length;i++){ if(a.photos[i].id===pid) return a.photos[i]; } return null; },
 addAlbumPhoto:function(aid,p){ var a=this.getAlbum(aid); if(!a) return; p.id=this.uid(); p.createdAt=Date.now(); a.photos.push(p); this.log('memory','Photo added to '+a.name); this.save(); },
 updateAlbumPhoto:function(aid,pid,patch){ var p=this.getAlbumPhoto(aid,pid); if(!p) return; for(var k in patch){ p[k]=patch[k]; } this.save(); },
 removeAlbumPhoto:function(aid,pid){ var a=this.getAlbum(aid); if(!a) return; a.photos=a.photos.filter(function(x){return x.id!==pid;}); this.save(); },
 getStory:function(id){ var a=this.data.memory.stories; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addStory:function(s){ s.id=this.uid(); s.createdAt=Date.now(); this.data.memory.stories.push(s); this.log('memory','Story kept: '+s.title); this.save(); },
 updateStory:function(id,patch){ var x=this.getStory(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeStory:function(id){ this.data.memory.stories=this.data.memory.stories.filter(function(x){return x.id!==id;}); this.save(); },
 getCapsule:function(id){ var a=this.data.memory.capsules; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addCapsule:function(c){ c.id=this.uid(); c.createdAt=Date.now(); this.data.memory.capsules.push(c); this.log('memory','Time capsule sealed'); this.save(); },
 updateCapsule:function(id,patch){ var x=this.getCapsule(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeCapsule:function(id){ this.data.memory.capsules=this.data.memory.capsules.filter(function(x){return x.id!==id;}); this.save(); },
 getCheckin:function(id){ var a=this.data.wellbeing.checkins; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addCheckin:function(c){ c.id=this.uid(); c.createdAt=Date.now(); this.data.wellbeing.checkins.push(c); this.log('wellbeing','Check-in'+(c.member?': '+c.member:'')); this.save(); },
 updateCheckin:function(id,patch){ var x=this.getCheckin(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeCheckin:function(id){ this.data.wellbeing.checkins=this.data.wellbeing.checkins.filter(function(x){return x.id!==id;}); this.save(); },
 getCare:function(id){ var a=this.data.wellbeing.selfcare; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addCare:function(c){ c.id=this.uid(); c.createdAt=Date.now(); if(!Array.isArray(c.log)) c.log=[]; this.data.wellbeing.selfcare.push(c); this.save(); },
 updateCare:function(id,patch){ var x=this.getCare(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeCare:function(id){ this.data.wellbeing.selfcare=this.data.wellbeing.selfcare.filter(function(x){return x.id!==id;}); this.save(); },
 logCare:function(id){ var x=this.getCare(id); if(!x) return; x.log.push(todayStr()); if(x.log.length>200) x.log=x.log.slice(-200); this.save(); },
 unlogCareToday:function(id){ var x=this.getCare(id); if(!x) return; var t=todayStr(); for(var i=x.log.length-1;i>=0;i--){ if(x.log[i]===t){ x.log.splice(i,1); break; } } this.save(); },
 getGrowth:function(id){ var a=this.data.wellbeing.growth; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addGrowth:function(g){ g.id=this.uid(); g.createdAt=Date.now(); if(!Array.isArray(g.reflections)) g.reflections=[]; this.data.wellbeing.growth.push(g); this.log('wellbeing','Intention: '+g.title); this.save(); },
 updateGrowth:function(id,patch){ var x=this.getGrowth(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeGrowth:function(id){ this.data.wellbeing.growth=this.data.wellbeing.growth.filter(function(x){return x.id!==id;}); this.save(); },
 addReflection:function(gid,r){ var g=this.getGrowth(gid); if(!g) return; r.id=this.uid(); r.createdAt=Date.now(); g.reflections.push(r); this.save(); },
 removeReflection:function(gid,rid){ var g=this.getGrowth(gid); if(!g) return; g.reflections=g.reflections.filter(function(x){return x.id!==rid;}); this.save(); },
 getDua:function(id){ var a=this.data.legacy.duas; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addDua:function(x){ x.id=this.uid(); x.createdAt=Date.now(); this.data.legacy.duas.push(x); this.log('legacy','Du\u2019a added'); this.save(); },
 updateDua:function(id,patch){ var x=this.getDua(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeDua:function(id){ this.data.legacy.duas=this.data.legacy.duas.filter(function(x){return x.id!==id;}); this.save(); },
 getDeed:function(id){ var a=this.data.legacy.deeds; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addDeed:function(x){ x.id=this.uid(); x.createdAt=Date.now(); this.data.legacy.deeds.push(x); this.log('legacy','Good deed noted'); this.save(); },
 updateDeed:function(id,patch){ var x=this.getDeed(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeDeed:function(id){ this.data.legacy.deeds=this.data.legacy.deeds.filter(function(x){return x.id!==id;}); this.save(); },
 getWisdom:function(id){ var a=this.data.legacy.wisdom; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addWisdom:function(x){ x.id=this.uid(); x.createdAt=Date.now(); this.data.legacy.wisdom.push(x); this.log('legacy','Wisdom kept'); this.save(); },
 updateWisdom:function(id,patch){ var x=this.getWisdom(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeWisdom:function(id){ this.data.legacy.wisdom=this.data.legacy.wisdom.filter(function(x){return x.id!==id;}); this.save(); },
 addSubItem:function(id,key,item){ var m=this.getMember(id); if(!m) return; if(!Array.isArray(m[key])) m[key]=[]; item.id=this.uid(); m[key].push(item); this.save(); },
 removeSubItem:function(id,key,itemId){ var m=this.getMember(id); if(!m) return; m[key]=(m[key]||[]).filter(function(x){return x.id!==itemId;}); this.save(); },
 getGov:function(key){ return this.data.governance[key] || {text:'',updatedAt:0,history:[]}; },
 setGov:function(key,text){ var g=this.data.governance[key]||(this.data.governance[key]={text:'',updatedAt:0,history:[]}); text=(text||'').trim(); if(g.text===text) return false; if(g.text){ g.history.unshift({text:g.text,ts:g.updatedAt||Date.now()}); if(g.history.length>30) g.history.length=30; } g.text=text; g.updatedAt=Date.now(); this.log('governance','Updated Family '+key.charAt(0).toUpperCase()+key.slice(1)); this.save(); return true; },
 restoreGov:function(key,idx){ var g=this.data.governance[key]; if(!g||!g.history||!g.history[idx]) return false; return this.setGov(key, g.history[idx].text); },
 govStats:function(){ var keys=['mission','vision','values','constitution','rules'],n=0; for(var i=0;i<keys.length;i++){ var g=this.data.governance[keys[i]]; if(g&&g.text&&g.text.trim()) n++; } return n; },
 getEvent:function(id){ for(var i=0;i<this.data.events.length;i++){ if(this.data.events[i].id===id) return this.data.events[i]; } return null; },
 updateEvent:function(id,patch){ var e=this.getEvent(id); if(!e) return; for(var k in patch){ e[k]=patch[k]; } this.save(); },
 removeEvent:function(id){ var e=this.getEvent(id); var t=e?e.title:'meeting'; this.data.events=this.data.events.filter(function(x){return x.id!==id;}); this.log('event','Removed '+t); this.save(); },
 addEvItem:function(id,key,item){ var e=this.getEvent(id); if(!e) return; if(!Array.isArray(e[key])) e[key]=[]; item.id=this.uid(); e[key].push(item); this.save(); },
 removeEvItem:function(id,key,itemId){ var e=this.getEvent(id); if(!e) return; e[key]=(e[key]||[]).filter(function(x){return x.id!==itemId;}); this.save(); },
 toggleEvItem:function(id,key,itemId){ var e=this.getEvent(id); if(!e) return; (e[key]||[]).forEach(function(x){ if(x.id===itemId) x.done=!x.done; }); this.save(); },
 getGoal:function(id){ for(var i=0;i<this.data.goals.length;i++){ if(this.data.goals[i].id===id) return this.data.goals[i]; } return null; },
 updateGoal:function(id,patch){ var g=this.getGoal(id); if(!g) return; for(var k in patch){ g[k]=patch[k]; } this.save(); },
 removeGoal:function(id){ var g=this.getGoal(id); var t=g?g.title:'goal'; this.data.goals=this.data.goals.filter(function(x){return x.id!==id;}); this.log('goal','Removed goal: '+t); this.save(); },
 addCustomCat:function(label,color){ label=String(label||'').trim(); if(!label) return 'general'; for(var i=0;i<this.data.customCategories.length;i++){ if(this.data.customCategories[i].label.toLowerCase()===label.toLowerCase()){ if(color) this.data.customCategories[i].color=color; this.save(); return this.data.customCategories[i].key; } } var key='cat_'+this.uid(); this.data.customCategories.push({key:key,label:label,color:color||'#1E3A7B'}); this.save(); return key; },
 removeCustomCat:function(key){ this.data.customCategories=this.data.customCategories.filter(function(c){return c.key!==key;}); this.data.events.forEach(function(e){ if(e.category===key) e.category='general'; }); this.save(); },
 getChannel:function(id){ for(var i=0;i<this.data.channels.length;i++){ if(this.data.channels[i].id===id) return this.data.channels[i]; } return null; },
 addChannel:function(name){ var ch={id:this.uid(),name:String(name||'Group').trim()||'Group',system:false,messages:[]}; this.data.channels.push(ch); this.save(); return ch.id; },
 removeChannel:function(id){ this.data.channels=this.data.channels.filter(function(c){return c.id!==id||c.system;}); this.save(); },
 addMessage:function(cid,msg){ var ch=this.getChannel(cid); if(!ch) return; msg.id=this.uid(); msg.ts=Date.now(); if(typeof msg.pinned!=='boolean') msg.pinned=false; ch.messages.push(msg); this.save(); try{ if(!msg.rid) chMirror(msg); }catch(e){} },
 removeMessage:function(cid,mid){ var ch=this.getChannel(cid); if(!ch) return; ch.messages=ch.messages.filter(function(m){return m.id!==mid;}); this.save(); },
 togglePin:function(cid,mid){ var ch=this.getChannel(cid); if(!ch) return; ch.messages.forEach(function(m){ if(m.id===mid) m.pinned=!m.pinned; }); this.save(); },
 removeAnnouncement:function(id){ this.data.announcements=this.data.announcements.filter(function(a){return a.id!==id;}); this.save(); },
 getResp:function(id){ for(var i=0;i<this.data.responsibilities.length;i++){ if(this.data.responsibilities[i].id===id) return this.data.responsibilities[i]; } return null; },
 addResponsibility:function(r){ r.id=this.uid(); r.createdAt=Date.now(); if(typeof r.done!=='boolean') r.done=false; if(typeof r.doneAt!=='number') r.doneAt=0; this.data.responsibilities.push(r); this.log('responsibility','Added duty: '+r.title); this.save(); },
 updateResponsibility:function(id,patch){ var r=this.getResp(id); if(!r) return; for(var k in patch){ r[k]=patch[k]; } this.save(); },
 removeResponsibility:function(id){ this.data.responsibilities=this.data.responsibilities.filter(function(x){return x.id!==id;}); this.save(); },
 toggleResponsibility:function(id){ var r=this.getResp(id); if(!r) return; r.done=!r.done; r.doneAt=r.done?Date.now():0; this.save(); },
 getDoc:function(id){ for(var i=0;i<this.data.documents.length;i++){ if(this.data.documents[i].id===id) return this.data.documents[i]; } return null; },
 addDocument:function(x){ x.id=this.uid(); x.createdAt=Date.now(); if(!Array.isArray(x.attachments)) x.attachments=[]; this.data.documents.push(x); this.log('document','Saved document: '+x.title); this.save(); },
 updateDocument:function(id,patch){ var x=this.getDoc(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } this.save(); },
 removeDocument:function(id){ this.data.documents=this.data.documents.filter(function(x){return x.id!==id;}); this.save(); },
 setCurrency:function(code){ this.data.finance.currency=code; this.save(); },
 getTx:function(id){ var a=this.data.finance.transactions; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addTx:function(t){ t.id=this.uid(); t.createdAt=Date.now(); t.amount=Number(t.amount)||0; this.data.finance.transactions.push(t); try{ setTimeout(moneyWatch,400); }catch(e){} this.log('finance',(t.type==='income'?'Income ':'Expense ')+t.category); this.save(); },
 updateTx:function(id,patch){ var t=this.getTx(id); if(!t) return; for(var k in patch){ t[k]=patch[k]; } t.amount=Number(t.amount)||0; this.save(); },
 removeTx:function(id){ this.data.finance.transactions=this.data.finance.transactions.filter(function(x){return x.id!==id;}); this.save(); },
 setBudget:function(cat,amount){ amount=Number(amount)||0; if(amount>0) this.data.finance.budgets[cat]=amount; else delete this.data.finance.budgets[cat]; this.save(); },
 addFinCat:function(label,color){ label=String(label||'').trim(); if(!label) return ''; if(!Array.isArray(this.data.finance.customCats)) this.data.finance.customCats=[]; for(var i=0;i<this.data.finance.customCats.length;i++){ if(this.data.finance.customCats[i].label.toLowerCase()===label.toLowerCase()){ if(color) this.data.finance.customCats[i].color=color; this.save(); return this.data.finance.customCats[i].key; } } var key='fcat_'+this.uid(); this.data.finance.customCats.push({key:key,label:label,color:color||'#1E3A7B'}); this.save(); return key; },
 removeFinCat:function(key){ this.data.finance.customCats=(this.data.finance.customCats||[]).filter(function(c){return c.key!==key;}); this.data.finance.transactions.forEach(function(t){ if(t.category===key) t.category='other'; }); if(this.data.finance.budgets[key]!=null) delete this.data.finance.budgets[key]; this.save(); },
 getPlanned:function(id){ var a=this.data.finance.planned; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addPlanned:function(p){ p.id=this.uid(); p.createdAt=Date.now(); p.active=true; p.lastPaid=''; p.amount=Number(p.amount)||0; this.data.finance.planned.push(p); this.log('finance','Planned: '+p.title); this.save(); },
 updatePlanned:function(id,patch){ var p=this.getPlanned(id); if(!p) return; for(var k in patch){ p[k]=patch[k]; } p.amount=Number(p.amount)||0; this.save(); },
 removePlanned:function(id){ this.data.finance.planned=this.data.finance.planned.filter(function(x){return x.id!==id;}); this.save(); },
 togglePlanned:function(id){ var p=this.getPlanned(id); if(!p) return; p.active=!p.active; this.save(); },
 markPlannedPaid:function(id){ var p=this.getPlanned(id); if(!p) return; this.addTx({type:p.type,category:p.category,amount:p.amount,member:p.member||'',date:todayStr(),note:p.title}); p.lastPaid=todayStr(); p.nextDue=advanceDate(p.nextDue||todayStr(),p.frequency); this.save(); },
 getDebt:function(id){ var a=this.data.finance.debts; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addDebt:function(x){ x.id=this.uid(); x.createdAt=Date.now(); x.amount=Number(x.amount)||0; x.paid=Number(x.paid)||0; if(typeof x.date!=='string'||!x.date) x.date=todayStr(); this.data.finance.debts.push(x); this.log('finance','Debt with '+x.person); this.save(); },
 updateDebt:function(id,patch){ var x=this.getDebt(id); if(!x) return; for(var k in patch){ x[k]=patch[k]; } x.amount=Number(x.amount)||0; x.paid=Number(x.paid)||0; if(x.paid>x.amount) x.paid=x.amount; this.save(); },
 removeDebt:function(id){ this.data.finance.debts=this.data.finance.debts.filter(function(y){return y.id!==id;}); this.save(); },
 settleDebt:function(id){ var x=this.getDebt(id); if(!x) return; x.paid=x.amount; this.save(); },
 payDebt:function(id,amt){ var x=this.getDebt(id); if(!x) return; x.paid=Math.min(x.amount,(Number(x.paid)||0)+(Number(amt)||0)); this.save(); },
 getSaving:function(id){ var a=this.data.finance.savings; for(var i=0;i<a.length;i++){ if(a[i].id===id) return a[i]; } return null; },
 addSaving:function(g){ g.id=this.uid(); g.createdAt=Date.now(); g.target=Number(g.target)||0; g.saved=Number(g.saved)||0; if(!g.color) g.color=SAVE_COLORS[this.data.finance.savings.length % SAVE_COLORS.length]; this.data.finance.savings.push(g); this.log('finance','Savings goal: '+g.title); this.save(); },
 updateSaving:function(id,patch){ var g=this.getSaving(id); if(!g) return; for(var k in patch){ g[k]=patch[k]; } g.target=Number(g.target)||0; g.saved=Number(g.saved)||0; this.save(); },
 removeSaving:function(id){ this.data.finance.savings=this.data.finance.savings.filter(function(y){return y.id!==id;}); this.save(); },
 contributeSaving:function(id,amt){ var g=this.getSaving(id); if(!g) return; g.saved=(Number(g.saved)||0)+(Number(amt)||0); this.save(); },
 addPoll:function(question,options,allowChange){ var p={id:this.uid(),question:String(question||'').trim(),createdAt:Date.now(),allowChange:!!allowChange,votes:{},options:options.map(function(t){return {id:'o'+Math.random().toString(36).slice(2,7),text:t};})}; this.data.polls.unshift(p); this.log('announcement','New poll: '+p.question); this.save(); return p.id; },
 votePoll:function(pid,oid,voterKey){ var p=null; for(var i=0;i<this.data.polls.length;i++){ if(this.data.polls[i].id===pid){ p=this.data.polls[i]; break; } } if(!p) return false; if(!p.votes||typeof p.votes!=='object') p.votes={}; if(p.votes[voterKey]!=null && !p.allowChange) return false; p.votes[voterKey]=oid; this.save(); return true; },
 removePoll:function(pid){ this.data.polls=this.data.polls.filter(function(p){return p.id!==pid;}); this.save(); },
 getNoteList:function(id){ for(var i=0;i<this.data.noteLists.length;i++){ if(this.data.noteLists[i].id===id) return this.data.noteLists[i]; } return null; },
 addNoteList:function(title){ var n={id:this.uid(),title:String(title||'List').trim()||'List',items:[]}; this.data.noteLists.push(n); this.save(); return n.id; },
 removeNoteList:function(id){ this.data.noteLists=this.data.noteLists.filter(function(n){return n.id!==id;}); this.save(); },
 addNoteItem:function(lid,text,by){ var n=this.getNoteList(lid); if(!n) return; n.items.push({id:this.uid(),text:String(text||'').trim(),by:by||'',ts:Date.now(),done:false}); this.save(); },
 toggleNoteItem:function(lid,iid){ var n=this.getNoteList(lid); if(!n) return; n.items.forEach(function(it){ if(it.id===iid) it.done=!it.done; }); this.save(); },
 removeNoteItem:function(lid,iid){ var n=this.getNoteList(lid); if(!n) return; n.items=n.items.filter(function(it){return it.id!==iid;}); this.save(); }
 };

 function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
 function initials(name){ var p=String(name||'').trim().split(/\s+/); var r=((p[0]||'')[0]||'').toUpperCase()+((p[1]||'')[0]||'').toUpperCase(); return r||'?'; }
 var AV_COLORS=['#C2745E','#C75D66','#BE8E3C','#5566C0','#956CA6','#3F8DBF','#5BA888','#79819A'];
 function colorFor(x){ var s=String(x.id||x.name||''),h=0; for(var i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return AV_COLORS[h%AV_COLORS.length]; }
 function relTime(ts){ var s=(Date.now()-ts)/1000; if(s<60) return 'just now'; var m=s/60; if(m<60) return Math.floor(m)+'m ago'; var h=m/60; if(h<24) return Math.floor(h)+'h ago'; var dd=h/24; if(dd<7) return Math.floor(dd)+'d ago'; var x=new Date(ts); return x.getDate()+' '+MON[x.getMonth()]; }
 function awayLabel(date){ var t=new Date(); t.setHours(0,0,0,0); var g=new Date(date); g.setHours(0,0,0,0); var days=Math.round((g-t)/864e5); if(days===0) return 'Today'; if(days===1) return 'Tomorrow'; if(days>1 && days<14) return 'in '+days+'d'; return g.getDate()+' '+MON[g.getMonth()]; }
 function fmtDate(date){ var g=new Date(date); return g.getDate()+' '+MON[g.getMonth()]; }
 function fmtTime(date){ var g=new Date(date),h=g.getHours(),m=g.getMinutes(); return (h<10?'0':'')+h+':'+(m<10?'0':'')+m; }
 function nextBirthday(member){
 if(!member.birthday) return null;
 var p=String(member.birthday).split('-'); if(p.length<3) return null;
 var by=parseInt(p[0],10),bm=parseInt(p[1],10)-1,bd=parseInt(p[2],10);
 var today=new Date(); today.setHours(0,0,0,0);
 var next=new Date(today.getFullYear(),bm,bd); next.setHours(0,0,0,0);
 if(next<today) next=new Date(today.getFullYear()+1,bm,bd);
 return {date:next, days:Math.round((next-today)/864e5), turning:(by>1900?next.getFullYear()-by:null)};
 }
 function upcomingBirthdays(d,n){ var list=[]; d.members.forEach(function(m){ var nb=nextBirthday(m); if(nb) list.push({member:m,nb:nb}); }); list.sort(function(a,b){return a.nb.days-b.nb.days;}); return list.slice(0,n||4); }
 function upcomingEvents(d,n){ var now=Date.now(); var list=d.events.filter(function(e){ if(e.completed) return false; if(e.kind==='meeting' && (e.status==='cancelled'||e.status==='completed')) return false; return new Date(e.date).getTime()>=now-3600000; }); list.sort(function(a,b){return new Date(a.date)-new Date(b.date);}); return n?list.slice(0,n):list; }
 function wellbeingScore(d){
 if(!d.members.length) return 0;
 var s=Math.min(d.members.length,5)*4;
 if(d.goals.length){ var avg=d.goals.reduce(function(a,g){return a+(g.progress||0);},0)/d.goals.length; s+=Math.min(d.goals.length,4)*5; s+=(avg/100)*25; }
 s+=Math.min(upcomingEvents(d).length,3)*5;
 s+=Math.min(d.announcements.filter(function(a){return Date.now()-a.createdAt<14*864e5;}).length,2)*5;
 s+=Math.min(d.activity.filter(function(a){return Date.now()-a.ts<7*864e5;}).length,5)*2;
 s+=govStatsCount(d)*2;
 return Math.max(0,Math.min(100,Math.round(s)));
 }
 var ACT_ICON={
 member:'<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.1"/><path d="M5.5 19.5c0-3.4 2.9-5.6 6.5-5.6s6.5 2.2 6.5 5.6"/></svg>',
 goal:'<svg class="ico" viewBox="0 0 24 24"><path d="M6 21V4"/><path d="M6 5h10.5l-2 3.3 2 3.3H6"/></svg>',
 event:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="5.2" width="16" height="14.8" rx="2.2"/><path d="M4 9.4h16"/><path d="M8.2 3.4v3.4M15.8 3.4v3.4"/></svg>',
 announcement:'<svg class="ico" viewBox="0 0 24 24"><path d="M3.5 10.2v3.6a1 1 0 0 0 1 1H7l5 3.4V5.8L7 9.2H4.5a1 1 0 0 0-1 1Z"/><path d="M15 9.2a3.5 3.5 0 0 1 0 5.6"/></svg>',
 governance:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 3.3 5 5.7v5.1c0 4.3 2.9 7.4 7 8.9 4.1-1.5 7-4.6 7-8.9V5.7L12 3.3Z"/><path d="M9.1 11.7l2 2 3.7-3.9"/></svg>'
 };
 function emptyState(line,action,modal){ return '<div class="w-empty"><svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 8.5v4M12 15.4h.01"/></svg><p>'+esc(line)+'</p>'+(modal?('<button data-modal="'+modal+'">'+esc(action)+'</button>'):'')+'</div>'; }

 /* ===================== RENDER DASHBOARD ===================== */
 function renderDashboard(){
 if(!$('#famDash')) return;
 var d=FD.data;
 /* Wellbeing score */
 var sc=wellbeingScore(d),label,sub;
 if(!d.members.length){ label='Let\u2019s begin'; sub='Add your family to start your score.'; }
 else if(sc<30){ label='Getting started'; sub='Set a goal or plan something together.'; }
 else if(sc<55){ label='Finding rhythm'; sub='Nice, keep the momentum going.'; }
 else if(sc<75){ label='Steady'; sub='A healthy, active family rhythm.'; }
 else if(sc<90){ label='Flourishing'; sub='Everyone\u2019s engaged and connected.'; }
 else { label='Thriving'; sub='Beautifully balanced across the board.'; }
 var c=2*Math.PI*60, off=c*(1-sc/100);
 $('#wScore').innerHTML='<div class="ring"><svg width="140" height="140" viewBox="0 0 140 140"><circle class="ring__track" cx="70" cy="70" r="60" fill="none" stroke-width="12"/><circle class="ring__bar" cx="70" cy="70" r="60" fill="none" stroke-width="12" stroke-dasharray="'+c.toFixed(1)+'" stroke-dashoffset="'+c.toFixed(1)+'"/></svg><div class="ring__center"><span class="ring__num">'+sc+'</span><span class="ring__unit">/ 100</span></div></div><div class="score__label">'+label+'</div><div class="score__sub">'+sub+'</div>';
 requestAnimationFrame(function(){ var b=$('#wScore .ring__bar'); if(b) b.style.strokeDashoffset=off.toFixed(1); });
 /* Members */
 var mEl=$('#wMembers');
 if(!d.members.length){ mEl.innerHTML='<div class="stat__num">0</div><div class="stat__cap" style="margin-bottom:12px">No members yet</div><button class="qa-btn" data-modal="member"><span class="qa-ico"><svg class="ico" viewBox="0 0 24 24"><circle cx="10" cy="8" r="3"/><path d="M4.5 19.2c0-3.1 2.6-5.1 5.5-5.1 1.05 0 2 .25 2.8.7"/><path d="M17.6 14v5M15.1 16.5h5"/></svg></span><span>Add family member</span></button>'; }
 else { var avs=d.members.slice(0,6).map(function(x){return '<span class="avatar" style="background:'+colorFor(x)+'">'+esc(initials(x.name))+'</span>';}).join(''); if(d.members.length>6) avs+='<span class="avatar avatar--more">+'+(d.members.length-6)+'</span>'; mEl.innerHTML='<div class="stat__num">'+d.members.length+'</div><div class="stat__cap">'+(d.members.length===1?'person':'people')+' in your family</div><div class="avatars">'+avs+'</div>'; }
 /* Today's duties */
 var duEl=$('#wDuties'), duM=$('#wDutiesMeta'), reps=d.responsibilities;
 if(!reps.length){ if(duM) duM.textContent=''; duEl.innerHTML=emptyState('No duties yet.','Add responsibility','responsibility'); }
 else { var dn=reps.filter(function(r){return r.done;}).length; if(duM) duM.textContent=dn+'/'+reps.length+' done'; var rs=reps.slice().sort(function(a,b){return (a.done?1:0)-(b.done?1:0);}).slice(0,5);
 duEl.innerHTML=rs.map(function(r){ var who='', mm=r.assignee?FD.getMember(r.assignee):null; if(mm) who='<span class="ddrow__av">'+avatarHTML(mm,'ddrow__ini')+'</span>'; return '<button class="ddrow'+(r.done?' is-done':'')+'" data-resptoggle="'+r.id+'"><span class="ddchk'+(r.done?' is-on':'')+'"><svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4 4 10-10"/></svg></span><span class="ddrow__main"><span class="ddrow__t">'+esc(r.title)+'</span><span class="ddrow__s">'+freqLabel(r.frequency)+(mm?' \u00b7 '+esc(mm.name):' \u00b7 Anyone')+'</span></span>'+who+'</button>'; }).join('')+(reps.length>5?'<button class="ddmore" data-sub="family-responsibilities">+'+(reps.length-5)+' more in Responsibilities</button>':''); }
 /* What's coming up (events incl. appointments) */
 var upEl=$('#wUpcoming'), evs=upcomingEvents(d,5);
 if(!evs.length){ upEl.innerHTML=emptyState('Nothing scheduled.','Schedule a meeting','meeting'); }
 else { upEl.innerHTML=evs.map(function(e){ var isAppt=e.kind==='appointment', mm=isAppt?FD.getMember(e.memberId):null, dt=new Date(e.date); var dot=isAppt?('<span class="row__dot row__dot--appt">'+(mm?esc(initials(mm.name)):'+')+'</span>'):('<span class="row__dot">'+(isNaN(dt.getTime())?'?':dt.getDate())+'</span>'); var sub=isAppt?('Appointment'+(mm?' \u00b7 '+esc(mm.name):'')+(e.location?' \u00b7 '+esc(e.location):'')):(fmtTime(e.date)+(e.location?' \u00b7 '+esc(e.location):'')); return '<div class="row">'+dot+'<div class="row__main"><div class="row__title">'+esc(e.title)+'</div><div class="row__sub">'+sub+'</div></div><span class="row__when">'+awayLabel(e.date)+'</span></div>'; }).join(''); }
 /* Goals */
 var gEl=$('#wGoals'),gm=$('#wGoalsMeta');
 if(!d.goals.length){ gEl.innerHTML=emptyState('No goals yet.','Create a goal','goal'); gm.textContent=''; }
 else { var avg=Math.round(d.goals.reduce(function(a,g){return a+(g.progress||0);},0)/d.goals.length); gm.textContent=avg+'% avg'; gEl.innerHTML=d.goals.slice(0,4).map(function(g){var p=Math.max(0,Math.min(100,g.progress||0));return '<div class="goal"><div class="goal__top"><span class="goal__title">'+esc(g.title)+'</span><span class="goal__pct">'+p+'%</span></div><div class="bar"><span class="bar__fill" data-w="'+p+'"></span></div></div>';}).join(''); requestAnimationFrame(function(){ $$('#wGoals .bar__fill').forEach(function(b){ b.style.width=b.getAttribute('data-w')+'%'; }); }); }
 /* Activity */
 var fEl=$('#wActivity');
 if(!d.activity.length){ fEl.innerHTML='<div class="w-empty"><svg class="ico" viewBox="0 0 24 24"><path d="M3 12h3.5l2-6.5 4 13.5 2.2-7H21"/></svg><p>Your family\u2019s activity will appear here as you go.</p></div>'; }
 else { fEl.innerHTML=d.activity.slice(0,14).map(function(a){return '<div class="act"><span class="act__ico">'+(ACT_ICON[a.type]||ACT_ICON.member)+'</span><div class="act__txt">'+esc(a.text)+'<div class="act__when">'+relTime(a.ts)+'</div></div></div>';}).join(''); }
 /* Birthdays */
 var bEl=$('#wBirthdays'),bl=upcomingBirthdays(d,4);
 if(!bl.length){ bEl.innerHTML=emptyState('No birthdays yet.','Add a member','member'); }
 else { bEl.innerHTML=bl.map(function(b){return '<div class="row"><span class="row__dot">'+esc(initials(b.member.name))+'</span><div class="row__main"><div class="row__title">'+esc(b.member.name)+'</div><div class="row__sub">'+fmtDate(b.nb.date)+(b.nb.turning?(' \u00b7 turns '+b.nb.turning):'')+'</div></div><span class="row__when">'+awayLabel(b.nb.date)+'</span></div>';}).join(''); }
 /* Announcements */
 var aEl=$('#wAnnouncements');
 if(!d.announcements.length){ aEl.innerHTML=emptyState('No announcements yet.','Post one','announcement'); }
 else { aEl.innerHTML=d.announcements.slice(0,3).map(function(a){return '<div class="row"><div class="row__main"><div class="ann__txt">'+esc(a.text)+'</div><div class="ann__meta">'+esc(a.author||'Family')+' \u00b7 '+relTime(a.createdAt)+'</div></div></div>';}).join(''); }
 /* Documents needing attention */
 var dcEl=$('#wDocs'), dcM=$('#wDocsMeta'), docs=d.documents;
 if(!docs.length){ if(dcM) dcM.textContent=''; dcEl.innerHTML=emptyState('No documents yet.','Add document','document'); }
 else { var att=docs.filter(function(x){ var n=daysUntil(x.expiry); return n!==null && n<=30; }).sort(function(a,b){ return daysUntil(a.expiry)-daysUntil(b.expiry); }); if(dcM) dcM.textContent=att.length?(att.length+' to review'):'all valid';
 if(!att.length){ dcEl.innerHTML='<div class="w-ok"><svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4 4 10-10"/></svg><p>'+docs.length+' document'+(docs.length>1?'s':'')+' on file, none expiring soon.</p></div>'; }
 else { dcEl.innerHTML=att.slice(0,4).map(function(x){ var cc=docCatMeta(x.category); return '<button class="drow" data-sub="family-documents"><span class="drow__ic" style="color:'+cc.color+'">'+cc.icon+'</span><span class="drow__main"><span class="drow__t">'+esc(x.title)+'</span><span class="drow__s">'+esc(docOwnerName(x.owner))+'</span></span>'+expiryBadge(x.expiry)+'</button>'; }).join('')+(att.length>4?'<button class="ddmore" data-sub="family-documents">+'+(att.length-4)+' more</button>':''); }
 }
 /* Bills due soon */
 var blEl=$('#wBills'), blM=$('#wBillsMeta'), plans=(d.finance&&Array.isArray(d.finance.planned))?d.finance.planned:[];
 if(blEl){ var ap=plans.filter(function(p){return p.active;});
 if(!ap.length){ if(blM) blM.textContent=''; blEl.innerHTML=emptyState('No recurring payments yet.','Add planned payment','planned'); }
 else { var due=ap.filter(function(p){ var n=daysUntil(p.nextDue); return n!==null && n<=14; }).sort(function(a,b){ return daysUntil(a.nextDue)-daysUntil(b.nextDue); }); if(blM) blM.textContent=due.length?(due.length+' due soon'):'all clear';
 if(!due.length){ blEl.innerHTML='<div class="w-ok"><svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4 4 10-10"/></svg><p>'+ap.length+' scheduled, nothing due in the next two weeks.</p></div>'; }
 else { blEl.innerHTML=due.slice(0,4).map(function(p){ var cm=finCatMeta(p.type,p.category); var sign=p.type==='income'?'+':'\u2212'; return '<button class="drow" data-sub="finance-planned"><span class="drow__ic" style="color:'+cm.color+'">'+cm.icon+'</span><span class="drow__main"><span class="drow__t">'+esc(p.title)+'</span><span class="drow__s">'+sign+curSymbol()+nfmt(p.amount)+' \u00b7 '+(PLAN_FREQ[p.frequency]||'Monthly')+'</span></span>'+planDueBadge(p.nextDue)+'</button>'; }).join('')+(due.length>4?'<button class="ddmore" data-sub="finance-planned">+'+(due.length-4)+' more</button>':''); }
 }
 }
 /* Foundation */
 var fdEl=$('#wFoundation'), fdM=$('#wFoundationMeta');
 if(fdEl){
 var gd=FD.govStats(); if(fdM) fdM.textContent=gd+'/5';
 var miss=FD.getGov('mission');
 var lead=(miss.text&&miss.text.trim())?('<div class="foundation__mission">\u201c'+esc(miss.text.replace(/\s+/g,' '))+'\u201d</div>'):('<div class="foundation__prompt">Define what your family stands for, your mission, vision, values, constitution and rules.</div>');
 var pills=GOV.map(function(sg){ var g=FD.getGov(sg.key); var on=g.text&&g.text.trim(); return '<span class="fpill'+(on?' is-on':'')+'">'+(on?'<svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4 4 10-10"/></svg>':'')+esc(sg.title.replace('Family ',''))+'</span>'; }).join('');
 fdEl.innerHTML=lead+'<div class="fpills">'+pills+'</div><button class="foundation__cta" data-sub="family-governance"><span>Open Governance</span><svg class="ico ico-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>';
 }
 }

 /* ===================== CREATE MODAL ===================== */
 var MODAL_ICON={
 hhjoin:'<path d="M12 3.5 20 8v8l-8 4.5L4 16V8l8-4.5Z"/><path d="M9 12.2l2 2 4-4.2"/>',
 dua:'<svg class="ico" viewBox="0 0 24 24"><path d="M8.5 21c-1-2.5-1-4 0-6M15.5 21c1-2.5 1-4 0-6"/><path d="M12 15c-2.5 0-4.5-2-4.5-4.5C7.5 7 12 3 12 3s4.5 4 4.5 7.5C16.5 13 14.5 15 12 15Z"/></svg>',
 editDua:'<svg class="ico" viewBox="0 0 24 24"><path d="M8.5 21c-1-2.5-1-4 0-6M15.5 21c1-2.5 1-4 0-6"/><path d="M12 15c-2.5 0-4.5-2-4.5-4.5C7.5 7 12 3 12 3s4.5 4 4.5 7.5C16.5 13 14.5 15 12 15Z"/></svg>',
 deed:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 4.5c1.6 0 3 .9 3.7 2.2C16.4 5.4 17.8 4.5 19.4 4.5c.9 3-.5 5.8-2.4 7.9-1.6 1.8-3.6 3.3-5 4.6-1.4-1.3-3.4-2.8-5-4.6C5.1 10.3 3.7 7.5 4.6 4.5 6.2 4.5 7.6 5.4 8.3 6.7 9 5.4 10.4 4.5 12 4.5Z"/><path d="M9 19.5h6"/></svg>',
 editDeed:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 4.5c1.6 0 3 .9 3.7 2.2C16.4 5.4 17.8 4.5 19.4 4.5c.9 3-.5 5.8-2.4 7.9-1.6 1.8-3.6 3.3-5 4.6-1.4-1.3-3.4-2.8-5-4.6C5.1 10.3 3.7 7.5 4.6 4.5 6.2 4.5 7.6 5.4 8.3 6.7 9 5.4 10.4 4.5 12 4.5Z"/><path d="M9 19.5h6"/></svg>',
 wisdom:'<svg class="ico" viewBox="0 0 24 24"><path d="M7 8h10M7 12h7"/><path d="M5 4.5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 3.5V5.5a1 1 0 0 1 1-1Z"/></svg>',
 editWisdom:'<svg class="ico" viewBox="0 0 24 24"><path d="M7 8h10M7 12h7"/><path d="M5 4.5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 3.5V5.5a1 1 0 0 1 1-1Z"/></svg>',
 checkin:'<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M3 12h2M19 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg>',
 editCheckin:'<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M3 12h2M19 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg>',
 selfcare:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 20.3s-7-4.4-7-9.4A3.8 3.8 0 0 1 12 8.2a3.8 3.8 0 0 1 7 2.7c0 5-7 9.4-7 9.4Z"/></svg>',
 editSelfcare:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 20.3s-7-4.4-7-9.4A3.8 3.8 0 0 1 12 8.2a3.8 3.8 0 0 1 7 2.7c0 5-7 9.4-7 9.4Z"/></svg>',
 growth:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 20.5v-7.5"/><path d="M12 13C12 9.5 9.4 7 5.5 7c0 3.7 2.7 6 6.5 6Z"/><path d="M12 11c0-3 2.3-5 5.8-5 0 3.2-2.4 5-5.8 5Z"/></svg>',
 editGrowth:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 20.5v-7.5"/><path d="M12 13C12 9.5 9.4 7 5.5 7c0 3.7 2.7 6 6.5 6Z"/><path d="M12 11c0-3 2.3-5 5.8-5 0 3.2-2.4 5-5.8 5Z"/></svg>',
 reflection:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 20.5v-7.5"/><path d="M12 13C12 9.5 9.4 7 5.5 7c0 3.7 2.7 6 6.5 6Z"/><path d="M12 11c0-3 2.3-5 5.8-5 0 3.2-2.4 5-5.8 5Z"/></svg>',
 album:'<svg class="ico" viewBox="0 0 24 24"><rect x="6" y="3.5" width="14" height="14" rx="2.5"/><path d="M4 7.5v11A2.5 2.5 0 0 0 6.5 21H17"/><circle cx="10.5" cy="8" r="1.4"/><path d="M6.8 14.5 10 11.6l2.5 2.3 2.5-1.9 4 3.5"/></svg>',
 editAlbum:'<svg class="ico" viewBox="0 0 24 24"><rect x="6" y="3.5" width="14" height="14" rx="2.5"/><path d="M4 7.5v11A2.5 2.5 0 0 0 6.5 21H17"/><circle cx="10.5" cy="8" r="1.4"/><path d="M6.8 14.5 10 11.6l2.5 2.3 2.5-1.9 4 3.5"/></svg>',
 memPhoto:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="M4.5 16.5 9.5 12l3 2.8 3-2.3 4 3.7"/></svg>',
 editMemPhoto:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="M4.5 16.5 9.5 12l3 2.8 3-2.3 4 3.7"/></svg>',
 story:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 6.5c-1.6-1.4-3.9-1.9-6.5-1.5v13c2.6-.4 4.9.1 6.5 1.5 1.6-1.4 3.9-1.9 6.5-1.5v-13c-2.6-.4-4.9.1-6.5 1.5Z"/><path d="M12 6.5V20"/></svg>',
 editStory:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 6.5c-1.6-1.4-3.9-1.9-6.5-1.5v13c2.6-.4 4.9.1 6.5 1.5 1.6-1.4 3.9-1.9 6.5-1.5v-13c-2.6-.4-4.9.1-6.5 1.5Z"/><path d="M12 6.5V20"/></svg>',
 capsule:'<svg class="ico" viewBox="0 0 24 24"><path d="M7 4h10M7 20h10M8 4c0 4 3.2 4.6 3.2 8S8 16 8 20M16 4c0 4-3.2 4.6-3.2 8s3.2 4 3.2 8"/></svg>',
 editCapsule:'<svg class="ico" viewBox="0 0 24 24"><path d="M7 4h10M7 20h10M8 4c0 4 3.2 4.6 3.2 8S8 16 8 20M16 4c0 4-3.2 4.6-3.2 8s3.2 4 3.2 8"/></svg>',
 relNote:'<svg class="ico" viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M4.5 7l7.5 6 7.5-6"/></svg>',
 editRelNote:'<svg class="ico" viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M4.5 7l7.5 6 7.5-6"/></svg>',
 relDate:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="14" rx="2.5"/><path d="M8 3.8V8M16 3.8V8M4 11h16"/><path d="M12 17.6s-2.8-1.8-2.8-3.8a1.55 1.55 0 0 1 2.8-1 1.55 1.55 0 0 1 2.8 1c0 2-2.8 3.8-2.8 3.8Z"/></svg>',
 editRelDate:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="14" rx="2.5"/><path d="M8 3.8V8M16 3.8V8M4 11h16"/><path d="M12 17.6s-2.8-1.8-2.8-3.8a1.55 1.55 0 0 1 2.8-1 1.55 1.55 0 0 1 2.8 1c0 2-2.8 3.8-2.8 3.8Z"/></svg>',
 relPlan:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 3.5l2.2 5.1 5.3.4-4 3.5 1.2 5.2L12 20.4l-4.7 2.7 1.2-5.2-4-3.5 5.3-.4L12 3.5Z"/></svg>',
 editRelPlan:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 3.5l2.2 5.1 5.3.4-4 3.5 1.2 5.2L12 20.4l-4.7 2.7 1.2-5.2-4-3.5 5.3-.4L12 3.5Z"/></svg>',
 relSince:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 20.3s-7-4.4-7-9.4A3.8 3.8 0 0 1 12 8.2a3.8 3.8 0 0 1 7 2.7c0 5-7 9.4-7 9.4Z"/></svg>',
 task:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.5 12.2l2.4 2.4 4.6-5"/></svg>',
 editTask:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.5 12.2l2.4 2.4 4.6-5"/></svg>',
 project:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 7.5A2 2 0 0 1 6 5.5h4l2 2.5h6a2 2 0 0 1 2 2V17a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17V7.5Z"/></svg>',
 editProject:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 7.5A2 2 0 0 1 6 5.5h4l2 2.5h6a2 2 0 0 1 2 2V17a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17V7.5Z"/></svg>',
 nmeal:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 8c-1.1-2.1-3.6-2.7-5.4-1.4C4.5 8.1 3.9 11 4.9 13.6c1 2.6 3 5.1 4.9 5.1.9 0 1.1-.5 2.2-.5s1.3.5 2.2.5c1.9 0 3.9-2.5 4.9-5.1 1-2.6.4-5.5-1.7-7C15.6 5.3 13.1 5.9 12 8Z"/><path d="M12 8c0-2 1-3.4 2.6-4"/></svg>',
 editNmeal:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 8c-1.1-2.1-3.6-2.7-5.4-1.4C4.5 8.1 3.9 11 4.9 13.6c1 2.6 3 5.1 4.9 5.1.9 0 1.1-.5 2.2-.5s1.3.5 2.2.5c1.9 0 3.9-2.5 4.9-5.1 1-2.6.4-5.5-1.7-7C15.6 5.3 13.1 5.9 12 8Z"/><path d="M12 8c0-2 1-3.4 2.6-4"/></svg>',
 habit:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 19c0-8 5-13 14-14-.5 9-5.5 14-12 14"/><path d="M5 19c3-3.2 6-5.2 10-6.2"/></svg>',
 editHabit:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 19c0-8 5-13 14-14-.5 9-5.5 14-12 14"/><path d="M5 19c3-3.2 6-5.2 10-6.2"/></svg>',
 waterTarget:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 3.5S6 10 6 14a6 6 0 0 0 12 0c0-4-6-10.5-6-10.5Z"/></svg>',
 workout:'<svg class="ico" viewBox="0 0 24 24"><path d="M7.5 8.5v7M4.5 10v4M16.5 8.5v7M19.5 10v4M7.5 12h9"/></svg>',
 editWorkout:'<svg class="ico" viewBox="0 0 24 24"><path d="M7.5 8.5v7M4.5 10v4M16.5 8.5v7M19.5 10v4M7.5 12h9"/></svg>',
 fitgoal:'<svg class="ico" viewBox="0 0 24 24"><path d="M3.5 12.5h4l2-5 3.5 9 2.5-6 1.5 2h3.5"/></svg>',
 editFitgoal:'<svg class="ico" viewBox="0 0 24 24"><path d="M3.5 12.5h4l2-5 3.5 9 2.5-6 1.5 2h3.5"/></svg>',
 routine:'<svg class="ico" viewBox="0 0 24 24"><path d="M8 6.5h12M8 12h12M8 17.5h12"/><circle cx="4.5" cy="6.5" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="17.5" r="1.2"/></svg>',
 editRoutine:'<svg class="ico" viewBox="0 0 24 24"><path d="M8 6.5h12M8 12h12M8 17.5h12"/><circle cx="4.5" cy="6.5" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="17.5" r="1.2"/></svg>',
 trip:'<svg class="ico" viewBox="0 0 24 24"><path d="M10.5 20.5 9 14.8 3.8 13l16-8.5-4.6 15.7-4.7-2.2Z"/><path d="M9 14.8l10.6-9.9"/></svg>',
 editTrip:'<svg class="ico" viewBox="0 0 24 24"><path d="M10.5 20.5 9 14.8 3.8 13l16-8.5-4.6 15.7-4.7-2.2Z"/><path d="M9 14.8l10.6-9.9"/></svg>',
 idea:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 21s-6.5-5.3-6.5-10A6.5 6.5 0 0 1 12 4.5 6.5 6.5 0 0 1 18.5 11c0 4.7-6.5 10-6.5 10Z"/><circle cx="12" cy="10.8" r="2.3"/></svg>',
 editIdea:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 21s-6.5-5.3-6.5-10A6.5 6.5 0 0 1 12 4.5 6.5 6.5 0 0 1 18.5 11c0 4.7-6.5 10-6.5 10Z"/><circle cx="12" cy="10.8" r="2.3"/></svg>',
 editPack:'<svg class="ico" viewBox="0 0 24 24"><rect x="5" y="8" width="14" height="12" rx="2.5"/><path d="M9 8V6.5A2.5 2.5 0 0 1 11.5 4h1A2.5 2.5 0 0 1 15 6.5V8"/><path d="M9 12v4M15 12v4"/></svg>',
 course:'<svg class="ico" viewBox="0 0 24 24"><path d="M3 9.5 12 5l9 4.5-9 4.5L3 9.5Z"/><path d="M6.5 11.8V16c0 1.4 2.4 2.6 5.5 2.6s5.5-1.2 5.5-2.6v-4.2"/><path d="M21 9.5V14"/></svg>',
 editCourse:'<svg class="ico" viewBox="0 0 24 24"><path d="M3 9.5 12 5l9 4.5-9 4.5L3 9.5Z"/><path d="M6.5 11.8V16c0 1.4 2.4 2.6 5.5 2.6s5.5-1.2 5.5-2.6v-4.2"/><path d="M21 9.5V14"/></svg>',
 book:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z"/><path d="M19 18v3H6.5A2.5 2.5 0 0 1 4 20.5"/><path d="M8 7.5h7"/></svg>',
 editBook:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z"/><path d="M19 18v3H6.5A2.5 2.5 0 0 1 4 20.5"/><path d="M8 7.5h7"/></svg>',
 skill:'<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="3.8"/><circle cx="12" cy="12" r=".8"/></svg>',
 editSkill:'<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="3.8"/><circle cx="12" cy="12" r=".8"/></svg>',
 chore:'<svg class="ico" viewBox="0 0 24 24"><path d="M4.5 6.2l1.5 1.5 2.5-3"/><path d="M11.5 6.5H20"/><path d="M4.5 12.2l1.5 1.5 2.5-3"/><path d="M11.5 12.5H20"/><path d="M4.5 18.2l1.5 1.5 2.5-3"/><path d="M11.5 18.5H20"/></svg>',
 editChore:'<svg class="ico" viewBox="0 0 24 24"><path d="M4.5 6.2l1.5 1.5 2.5-3"/><path d="M11.5 6.5H20"/><path d="M4.5 12.2l1.5 1.5 2.5-3"/><path d="M11.5 12.5H20"/><path d="M4.5 18.2l1.5 1.5 2.5-3"/><path d="M11.5 18.5H20"/></svg>',
 maint:'<svg class="ico" viewBox="0 0 24 24"><path d="M14.8 6.2a4.1 4.1 0 0 0-5.5 5.1L4 16.6V20h3.4l5.3-5.3a4.1 4.1 0 0 0 5.1-5.5l-2.7 2.7-2.2-.5-.5-2.2 2.4-3Z"/></svg>',
 editMaint:'<svg class="ico" viewBox="0 0 24 24"><path d="M14.8 6.2a4.1 4.1 0 0 0-5.5 5.1L4 16.6V20h3.4l5.3-5.3a4.1 4.1 0 0 0 5.1-5.5l-2.7 2.7-2.2-.5-.5-2.2 2.4-3Z"/></svg>',
 supply:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 8l8-4 8 4v8l-8 4-8-4V8Z"/><path d="M4 8l8 4 8-4M12 12v8"/></svg>',
 editSupply:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 8l8-4 8 4v8l-8 4-8-4V8Z"/><path d="M4 8l8 4 8-4M12 12v8"/></svg>',
 recipe:'<svg class="ico" viewBox="0 0 24 24"><path d="M7.2 3.8v6.4M4.8 3.8v3.4a2.4 2.4 0 0 0 4.8 0V3.8"/><path d="M7.2 10.2v10"/><path d="M16.2 3.8c-1.5 1.7-2 4.6-1 6.7.5 1 1.6 1.2 1.6 1.2v8.5"/></svg>',
 editRecipe:'<svg class="ico" viewBox="0 0 24 24"><path d="M7.2 3.8v6.4M4.8 3.8v3.4a2.4 2.4 0 0 0 4.8 0V3.8"/><path d="M7.2 10.2v10"/><path d="M16.2 3.8c-1.5 1.7-2 4.6-1 6.7.5 1 1.6 1.2 1.6 1.2v8.5"/></svg>',
 meal:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="14" rx="2.5"/><path d="M8 3.8V8M16 3.8V8M4 11h16"/></svg>',
 editMeal:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="14" rx="2.5"/><path d="M8 3.8V8M16 3.8V8M4 11h16"/></svg>',
 shopItem:'<svg class="ico" viewBox="0 0 24 24"><circle cx="9.6" cy="19.2" r="1.3"/><circle cx="16.9" cy="19.2" r="1.3"/><path d="M4 5h2.1l2.1 10a1.6 1.6 0 0 0 1.6 1.3h6.5a1.6 1.6 0 0 0 1.6-1.2L19.8 8H7"/></svg>',
 editShopItem:'<svg class="ico" viewBox="0 0 24 24"><circle cx="9.6" cy="19.2" r="1.3"/><circle cx="16.9" cy="19.2" r="1.3"/><path d="M4 5h2.1l2.1 10a1.6 1.6 0 0 0 1.6 1.3h6.5a1.6 1.6 0 0 0 1.6-1.2L19.8 8H7"/></svg>',
 journalEntry:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 4.5h11l3 3V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z"/><path d="M8 9.5h6M8 13h8M8 16.5h5"/></svg>',
 editJournalEntry:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 4.5h11l3 3V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z"/><path d="M8 9.5h6M8 13h8M8 16.5h5"/></svg>',
 gratitude:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 20.3s-7-4.4-7-9.4A3.8 3.8 0 0 1 12 8.2a3.8 3.8 0 0 1 7 2.7c0 5-7 9.4-7 9.4Z"/></svg>',
 editGratitude:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 20.3s-7-4.4-7-9.4A3.8 3.8 0 0 1 12 8.2a3.8 3.8 0 0 1 7 2.7c0 5-7 9.4-7 9.4Z"/></svg>',
 milestone:'<svg class="ico" viewBox="0 0 24 24"><path d="M6 21V4.5"/><path d="M6 5.2h10.5l-2 3.3 2 3.3H6"/></svg>',
 editMilestone:'<svg class="ico" viewBox="0 0 24 24"><path d="M6 21V4.5"/><path d="M6 5.2h10.5l-2 3.3 2 3.3H6"/></svg>',
 member:'<svg class="ico" viewBox="0 0 24 24"><circle cx="10" cy="8" r="3"/><path d="M4.5 19.2c0-3.1 2.6-5.1 5.5-5.1 1.05 0 2 .25 2.8.7"/><path d="M17.6 14v5M15.1 16.5h5"/></svg>',
 editProfile:'<svg class="ico" viewBox="0 0 24 24"><path d="M16.5 4.5l3 3M4.5 19.5l.9-3.6L15 5.3a1.3 1.3 0 0 1 1.8 0l1.9 1.9a1.3 1.3 0 0 1 0 1.8L8.1 18.6 4.5 19.5Z"/></svg>',
 goal:'<svg class="ico" viewBox="0 0 24 24"><path d="M6 21V4"/><path d="M6 5h10.5l-2 3.3 2 3.3H6"/></svg>',
 meeting:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="4.5" width="16" height="11" rx="2"/><path d="M9 19.5l3-3 3 3"/><path d="M8 11l2.4-2.4 2 2L16 7"/></svg>',
 announcement:'<svg class="ico" viewBox="0 0 24 24"><path d="M3.5 10.2v3.6a1 1 0 0 0 1 1H7l5 3.4V5.8L7 9.2H4.5a1 1 0 0 0-1 1Z"/><path d="M15 9.2a3.5 3.5 0 0 1 0 5.6"/><path d="M17.4 6.8a7 7 0 0 1 0 10.4"/></svg>',
 allergy:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 4.6 21 19.4H3L12 4.6Z"/><path d="M12 10.2v4"/><circle cx="12" cy="16.9" r=".75" fill="currentColor" stroke="none"/></svg>',
 medication:'<svg class="ico" viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-45 12 12)"/><path d="M8.3 7.7l8 8"/></svg>',
 record:'<svg class="ico" viewBox="0 0 24 24"><path d="M13 3.5H6.5A1.5 1.5 0 0 0 5 5v14a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V9.5L13 3.5Z"/><path d="M13 3.5V9.5h6"/><path d="M7.6 14.6h2l1-1.7 1.5 3 1-1.3H16"/></svg>',
 expense:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 7.6C4 6.2 5.15 5.1 6.6 5.1H16.5a1 1 0 0 1 1 1V8"/><rect x="4" y="7.6" width="15.5" height="11.4" rx="2.4"/><path d="M19.5 11.7h-2.7a2.05 2.05 0 0 0 0 4.1h2.7"/></svg>',
 support:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 9h13l-3.2-3.2"/><path d="M20 15H7l3.2 3.2"/></svg>',
 editMeeting:'<svg class="ico" viewBox="0 0 24 24"><path d="M16.5 4.5l3 3M4.5 19.5l.9-3.6L15 5.3a1.3 1.3 0 0 1 1.8 0l1.9 1.9a1.3 1.3 0 0 1 0 1.8L8.1 18.6 4.5 19.5Z"/></svg>',
 decision:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4 4 10-10"/></svg>',
 actionItem:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="4.5" width="15" height="15" rx="3"/><path d="M8 12l2.5 2.5L16 9"/></svg>',
 followUp:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 7v5l3.2 1.9"/><path d="M3.5 12a8.5 8.5 0 1 0 2.4-5.9M3.5 4.5V8h3.5"/></svg>',
 editGoal:'<svg class="ico" viewBox="0 0 24 24"><path d="M6 21V4"/><path d="M6 5h10.5l-2 3.3 2 3.3H6"/></svg>',
 event:'<svg class="ico" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="2.2"/><path d="M3.5 9.5h17M8 3.4v3.4M16 3.4v3.4"/><path d="M12 12.5v4M10 14.5h4"/></svg>',
 editEvent:'<svg class="ico" viewBox="0 0 24 24"><path d="M16.5 4.5l3 3M4.5 19.5l.9-3.6L15 5.3a1.3 1.3 0 0 1 1.8 0l1.9 1.9a1.3 1.3 0 0 1 0 1.8L8.1 18.6 4.5 19.5Z"/></svg>',
 poll:'<svg class="ico" viewBox="0 0 24 24"><path d="M7 20V10M12 20V4M17 20v-7"/></svg>',
 channel:'<svg class="ico" viewBox="0 0 24 24"><circle cx="9" cy="9" r="3"/><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><circle cx="17" cy="9.5" r="2.3"/><path d="M15.6 19c.2-2.4 1.1-4 3.4-4 1.6 0 2.6 1 3 2.5"/></svg>',
 noteList:'<svg class="ico" viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M9 9h6M9 12.5h6M9 16h3"/></svg>',
 condition:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 20s-7-4.25-7-9.1C5 8.2 6.75 6.6 9 6.6c1.45 0 2.65.72 3 1.8.35-1.08 1.55-1.8 3-1.8 2.25 0 4 1.6 4 4.3 0 4.85-7 9.1-7 9.1Z"/></svg>',
 healthprofile:'<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.2"/><path d="M5.5 19.5c0-3.4 2.9-5.6 6.5-5.6s6.5 2.2 6.5 5.6"/></svg>',
 appointment:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="5.2" width="16" height="14.8" rx="2.2"/><path d="M4 9.4h16"/><path d="M8.2 3.4v3.4M15.8 3.4v3.4"/><path d="M8.8 14.4l2 2 3.6-3.8"/></svg>',
 editAppointment:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="5.2" width="16" height="14.8" rx="2.2"/><path d="M4 9.4h16"/><path d="M8.2 3.4v3.4M15.8 3.4v3.4"/><path d="M8.8 14.4l2 2 3.6-3.8"/></svg>',
 vital:'<svg class="ico" viewBox="0 0 24 24"><path d="M3 12.5h3.6l1.7-5 3.4 10 2.3-7 1.4 2H21"/></svg>',
 responsibility:'<svg class="ico" viewBox="0 0 24 24"><path d="M9.5 6.5H19M9.5 12H19M9.5 17.5H19"/><path d="M4.5 6.3l.9.9 1.6-1.7M4.5 11.8l.9.9 1.6-1.7M4.5 17.3l.9.9 1.6-1.7"/></svg>',
 editResponsibility:'<svg class="ico" viewBox="0 0 24 24"><path d="M9.5 6.5H19M9.5 12H19M9.5 17.5H19"/><path d="M4.5 6.3l.9.9 1.6-1.7M4.5 11.8l.9.9 1.6-1.7M4.5 17.3l.9.9 1.6-1.7"/></svg>',
 document:'<svg class="ico" viewBox="0 0 24 24"><path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"/><path d="M13.5 3.6V8h4.4"/><path d="M9 13h6M9 16.5h4"/></svg>',
 editDocument:'<svg class="ico" viewBox="0 0 24 24"><path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"/><path d="M13.5 3.6V8h4.4"/><path d="M9 13h6M9 16.5h4"/></svg>',
 transaction:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 9h13l-3.2-3.2"/><path d="M20 15H7l3.2 3.2"/></svg>',
 editTransaction:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 9h13l-3.2-3.2"/><path d="M20 15H7l3.2 3.2"/></svg>',
 budget:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5"/><path d="M12 3.5V12h8.5"/></svg>',
 planned:'<svg class="ico" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v4h-4"/><path d="M12 8v4.5l3 1.7"/></svg>',
 editPlanned:'<svg class="ico" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v4h-4"/><path d="M12 8v4.5l3 1.7"/></svg>',
 debt:'<svg class="ico" viewBox="0 0 24 24"><path d="M16 4h4v4M20 4l-6 6"/><path d="M8 20H4v-4M4 20l6-6"/></svg>',
 editDebt:'<svg class="ico" viewBox="0 0 24 24"><path d="M16 4h4v4M20 4l-6 6"/><path d="M8 20H4v-4M4 20l6-6"/></svg>',
 debtPay:'<svg class="ico" viewBox="0 0 24 24"><rect x="3.5" y="6.5" width="17" height="12" rx="2.5"/><path d="M3.5 10h17"/><circle cx="16.5" cy="14" r="1.4"/></svg>',
 saving:'<svg class="ico" viewBox="0 0 24 24"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>',
 editSaving:'<svg class="ico" viewBox="0 0 24 24"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>',
 saveContribute:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>'
 };
  function modalConfig(type,ctx){
    if(type==='vaultAdd'||type==='vaultEdit'){
      var en=(type==='vaultEdit')?(FD.data.vault.entries.filter(function(e){return e.id===ctx.entryId;})[0]||{}):{};
      var isE=(type==='vaultEdit');
      var f0=(en.fields&&en.fields[0])||{}, f1=(en.fields&&en.fields[1])||{}, f2=(en.fields&&en.fields[2])||{};
      return {title:isE?'Edit vault item':'Add to vault',submit:isE?'Save':'Add item',done:isE?'Updated':'Added securely',fields:[
        {name:'type',label:'Type',type:'select',opts:VAULT_TYPES.map(function(t){return t[1];}),value:vaultTypeLabel(en.type||'bank')},
        {name:'title',label:'Title',type:'text',ph:'e.g. Main bank account',value:en.title||''},
        {name:'l0',label:'Field 1 label',type:'text',ph:'e.g. Account number',value:f0.label||''},
        {name:'v0',label:'Field 1 value',type:'text',ph:'e.g. 1234 5678 9012',value:f0.value||''},
        {name:'l1',label:'Field 2 label (optional)',type:'text',ph:'e.g. IBAN / routing',value:f1.label||''},
        {name:'v1',label:'Field 2 value (optional)',type:'text',ph:'',value:f1.value||''},
        {name:'l2',label:'Field 3 label (optional)',type:'text',ph:'e.g. Branch',value:f2.label||''},
        {name:'v2',label:'Field 3 value (optional)',type:'text',ph:'',value:f2.value||''},
        {name:'note',label:'Secure note (optional)',type:'textarea',ph:'Anything else to remember',value:en.note||''}
      ],save:function(v){
        var typeKey='bank'; for(var i=0;i<VAULT_TYPES.length;i++){ if(VAULT_TYPES[i][1]===v.type) typeKey=VAULT_TYPES[i][0]; }
        var fields=[{label:v.l0,value:v.v0},{label:v.l1,value:v.v1},{label:v.l2,value:v.v2}].filter(function(f){return f.label&&f.value;});
        var payload={type:typeKey,title:v.title,fields:fields,note:v.note};
        if(isE){ FD.updateVaultEntry(en.id,payload); } else { FD.addVaultEntry(payload); }
        renderVault();
      }};
    }

 if(type==='hhjoin'){ return {title:'Join a household', icon:'hhjoin', submit:'Join',
 fields:[{name:'code',label:'Invite code',type:'text',ph:'6 characters, e.g. K7M2QP'}],
 save:function(v){
 var code=String(v.code||'').trim().toUpperCase();
 if(code.length<6) return 'Enter the 6-character code.';
 if(!cloudEnabled()) return 'Sign in first.';
 syncStatus('syncing\u2026');
 sb.rpc('join_household',{code:code})
 .then(function(r){
 if(r.error){ var m=String(r.error.message||''); flash(m.indexOf('own_code')>=0?'That\u2019s your own code':'Code not found, check it and try again'); syncStatus('up to date'); return null; }
 var hid=r.data; if(!hid) return null;
 Store.set('fw.sync.row', hid); Store.set('fw.sync.ts','');
 return sb.from('family_data').select('user_id,data,updated_at').eq('user_id',hid).maybeSingle();
 })
 .then(function(r2){
 if(!r2||r2.error||!r2.data){ try{ cloudPull(); }catch(e){} flash('Joined, syncing your family\u2026'); return; }
 adoptCloud(r2.data); renderHouseholdCard(); flash('Joined, welcome to the family'); try{ notifShow('Welcome to the family','You\u2019re connected, everything stays in sync now','wisal-joined','family'); }catch(e3){}
 })
 .catch(function(){ flash('Offline, connect and try again'); });
 return null;
 }, done:'Joining\u2026'};
 }
 ctx=ctx||{};
 if(type==='dua'||type==='editDua'){ var du=(type==='editDua')?(FD.getDua(ctx.duaId)||{}):{}; var isDU=(type==='editDua');
 return {title:isDU?'Edit du\u2019a':'Add a du\u2019a',submit:isDU?'Save':'Keep it',done:isDU?'Updated':'Du\u2019a kept',fields:[
 {name:'title',label:'A name for it (optional)',type:'text',ph:'e.g. For our children',value:du.title||''},
 {name:'text',label:'The du\u2019a',type:'textarea',ph:'Write it in any language\u2026',value:du.text||''},
 {name:'note',label:'When to read it (optional)',type:'text',ph:'e.g. After every salah',value:du.note||''}
 ],save:function(v){ if(!(v.text&&v.text.trim())) return 'Please write the du\u2019a.'; var patch={title:(v.title||'').trim(),text:v.text.trim(),note:(v.note||'').trim()}; if(isDU) FD.updateDua(ctx.duaId,patch); else FD.addDua(patch); }};
 }
 if(type==='deed'||type==='editDeed'){ var de=(type==='editDeed')?(FD.getDeed(ctx.deedId)||{}):{}; var isDE=(type==='editDeed');
 return {title:isDE?'Edit good deed':'Note a good deed',submit:isDE?'Save':'Note it',done:isDE?'Updated':'Noted',fields:[
 {name:'what',label:'What was done',type:'text',ph:'e.g. Gave sadaqah / helped a neighbour',value:de.what||''},
 {name:'date',label:'Date',type:'date',value:de.date||todayStr()},
 {name:'member',label:'Who? (optional)',type:'select',opts:journalWhoOpts(),value:de.member||''},
 {name:'note',label:'Note (optional)',type:'text',ph:'A quiet detail\u2026',value:de.note||''}
 ],save:function(v){ if(!(v.what&&v.what.trim())) return 'Please describe the deed.'; var patch={what:v.what.trim(),date:v.date||todayStr(),member:(v.member&&v.member!=='Not set')?v.member:'',note:(v.note||'').trim()}; if(isDE) FD.updateDeed(ctx.deedId,patch); else FD.addDeed(patch); }};
 }
 if(type==='wisdom'||type==='editWisdom'){ var wi=(type==='editWisdom')?(FD.getWisdom(ctx.wisdomId)||{}):{}; var isWI=(type==='editWisdom');
 return {title:isWI?'Edit wisdom':'Add wisdom',submit:isWI?'Save':'Keep it',done:isWI?'Updated':'Wisdom kept',fields:[
 {name:'text',label:'The saying or advice',type:'textarea',ph:'The words worth passing down\u2026',value:wi.text||''},
 {name:'from',label:'From whom? (optional)',type:'text',ph:'e.g. Dadu, Mama, the Prophet \uFDFA',value:wi.from||''},
 {name:'when',label:'When / context (optional)',type:'text',ph:'e.g. She always said this at Eid',value:wi.when||''}
 ],save:function(v){ if(!(v.text&&v.text.trim())) return 'Please write the wisdom.'; var patch={text:v.text.trim(),from:(v.from||'').trim(),when:(v.when||'').trim()}; if(isWI) FD.updateWisdom(ctx.wisdomId,patch); else FD.addWisdom(patch); }};
 }
 if(type==='checkin'||type==='editCheckin'){ var ci=(type==='editCheckin')?(FD.getCheckin(ctx.checkinId)||{}):{}; var isCI=(type==='editCheckin');
 return {title:isCI?'Edit check-in':'How are you?',submit:isCI?'Save':'Check in',done:isCI?'Updated':'Checked in',fields:[
 {name:'date',label:'Date',type:'date',value:ci.date||todayStr()},
 {name:'member',label:'Who?',type:'select',opts:journalWhoOpts(),value:ci.member||ctx.member||''},
 {name:'mood',label:'Mood',type:'select',opts:JMOOD_LABELS.slice(1),value:JMOOD_LABELS[ci.mood||3]},
 {name:'energy',label:'Energy',type:'select',opts:WB_ENERGY.slice(1),value:WB_ENERGY[ci.energy||3]},
 {name:'note',label:'A line about today (optional)',type:'text',ph:'What\u2019s behind it?',value:ci.note||''}
 ],save:function(v){ var mood=JMOOD_LABELS.indexOf(v.mood); if(mood<1) mood=3; var en=WB_ENERGY.indexOf(v.energy); if(en<1) en=3; var patch={date:v.date||todayStr(),member:(v.member&&v.member!=='Not set')?v.member:'',mood:mood,energy:en,note:(v.note||'').trim()}; if(isCI) FD.updateCheckin(ctx.checkinId,patch); else FD.addCheckin(patch); }};
 }
 if(type==='selfcare'||type==='editSelfcare'){ var sc=(type==='editSelfcare')?(FD.getCare(ctx.careId)||{}):{}; var isSC=(type==='editSelfcare');
 return {title:isSC?'Edit self-care':'Add self-care',submit:isSC?'Save':'Add to menu',done:isSC?'Updated':'Added',fields:[
 {name:'title',label:'The little thing',type:'text',ph:'e.g. Walk after Maghrib',value:sc.title||''},
 {name:'member',label:'Whose? (optional)',type:'select',opts:journalWhoOpts(),value:sc.member||''}
 ],save:function(v){ if(!(v.title&&v.title.trim())) return 'Please name it.'; var patch={title:v.title.trim(),member:(v.member&&v.member!=='Not set')?v.member:''}; if(isSC) FD.updateCare(ctx.careId,patch); else FD.addCare(patch); }};
 }
 if(type==='growth'||type==='editGrowth'){ var gr=(type==='editGrowth')?(FD.getGrowth(ctx.growthId)||{}):{}; var isGR=(type==='editGrowth');
 return {title:isGR?'Edit intention':'Add an intention',submit:isGR?'Save':'Plant it',done:isGR?'Updated':'Intention planted',fields:[
 {name:'title',label:'The intention',type:'text',ph:'e.g. Be more patient in the evenings',value:gr.title||''},
 {name:'member',label:'Whose? (optional)',type:'select',opts:journalWhoOpts(),value:gr.member||''},
 {name:'why',label:'Why it matters (optional)',type:'textarea',ph:'A sentence to come back to\u2026',value:gr.why||''}
 ],save:function(v){ if(!(v.title&&v.title.trim())) return 'Please name the intention.'; var patch={title:v.title.trim(),member:(v.member&&v.member!=='Not set')?v.member:'',why:(v.why||'').trim()}; if(isGR) FD.updateGrowth(ctx.growthId,patch); else FD.addGrowth(patch); }};
 }
 if(type==='reflection'){
 return {title:'A reflection',submit:'Keep it',done:'Reflection kept',fields:[
 {name:'date',label:'Date',type:'date',value:todayStr()},
 {name:'text',label:'How is it going?',type:'textarea',ph:'Honest words, however small\u2026',value:''}
 ],save:function(v){ if(!(v.text&&v.text.trim())) return 'Write at least a line.'; FD.addReflection(ctx.growthId,{date:v.date||todayStr(),text:v.text.trim()}); }};
 }
 if(type==='album'||type==='editAlbum'){ var al=(type==='editAlbum')?(FD.getAlbum(ctx.albumId)||{}):{}; var isAL=(type==='editAlbum');
 return {title:isAL?'Edit album':'New album',submit:isAL?'Save':'Create album',done:isAL?'Updated':'Album created',fields:[
 {name:'name',label:'Album name',type:'text',ph:'e.g. Eid 2026',value:al.name||''},
 {name:'note',label:'A line about it (optional)',type:'text',ph:'e.g. Three days of food and family',value:al.note||''}
 ],save:function(v){ if(!(v.name&&v.name.trim())) return 'Please name the album.'; var patch={name:v.name.trim(),note:(v.note||'').trim()}; if(isAL) FD.updateAlbum(ctx.albumId,patch); else FD.addAlbum(patch); }};
 }
 if(type==='memPhoto'||type==='editMemPhoto'){ var mp=(type==='editMemPhoto')?(FD.getAlbumPhoto(ctx.albumId,ctx.photoId)||{}):{}; var isMP=(type==='editMemPhoto');
 return {title:isMP?'Edit photo':'Add photo',submit:isMP?'Save':'Add to album',done:isMP?'Updated':'Photo added',fields:[
 {name:'photo',label:isMP?'Replace photo (optional)':'Photo',type:'photo',value:mp.photo||'',ini:''},
 {name:'caption',label:'Caption (optional)',type:'text',ph:'A line about this moment\u2026',value:mp.caption||''},
 {name:'date',label:'Date (optional)',type:'date',value:mp.date||todayStr()}
 ],save:function(v){ var patch={caption:(v.caption||'').trim(),date:v.date||''}; if(isMP){ if(pendingPhoto!==undefined&&pendingPhoto) patch.photo=pendingPhoto; FD.updateAlbumPhoto(ctx.albumId,ctx.photoId,patch); } else { if(!pendingPhoto) return 'Please choose a photo.'; patch.photo=pendingPhoto; FD.addAlbumPhoto(ctx.albumId,patch); } }};
 }
 if(type==='story'||type==='editStory'){ var sto=(type==='editStory')?(FD.getStory(ctx.storyId)||{}):{}; var isST=(type==='editStory');
 return {title:isST?'Edit story':'Keep a story',submit:isST?'Save':'Keep it',done:isST?'Updated':'Story kept',fields:[
 {name:'title',label:'The story',type:'text',ph:'e.g. How we found this house',value:sto.title||''},
 {name:'when',label:'When was it? (optional)',type:'text',ph:'e.g. Summer 2015',value:sto.when||''},
 {name:'who',label:'Whose story? (optional)',type:'select',opts:journalWhoOpts(),value:sto.who||''},
 {name:'body',label:'Tell it',type:'textarea',ph:'Write it the way you\u2019d tell it at dinner\u2026',value:sto.body||''},
 {name:'photo',label:'Photo (optional)',type:'photo',value:sto.photo||'',ini:''}
 ],save:function(v){ if(!(v.title&&v.title.trim())) return 'Please give the story a title.'; if(!(v.body&&v.body.trim())) return 'Tell at least a little of the story.'; var patch={title:v.title.trim(),when:(v.when||'').trim(),who:(v.who&&v.who!=='Not set')?v.who:'',body:v.body.trim()}; if(isST){ if(pendingPhoto!==undefined) patch.photo=pendingPhoto; FD.updateStory(ctx.storyId,patch); } else { patch.photo=pendingPhoto||''; FD.addStory(patch); } }};
 }
 if(type==='capsule'||type==='editCapsule'){ var cp=(type==='editCapsule')?(FD.getCapsule(ctx.capsuleId)||{}):{}; var isCP=(type==='editCapsule');
 return {title:isCP?'Edit capsule':'Seal a time capsule',submit:isCP?'Save':'Seal it',done:isCP?'Updated':'Capsule sealed',fields:[
 {name:'title',label:'For the outside of the envelope',type:'text',ph:'e.g. To us, next Ramadan',value:cp.title||''},
 {name:'openOn',label:'Opens on',type:'date',value:cp.openOn||''},
 {name:'from',label:'From (optional)',type:'select',opts:journalWhoOpts(),value:cp.from||''},
 {name:'body',label:'The letter inside',type:'textarea',ph:'Dear future us\u2026',value:cp.body||''}
 ],save:function(v){ if(!(v.title&&v.title.trim())) return 'Give the capsule a title.'; if(!v.openOn) return 'Pick the day it should open.'; if(!(v.body&&v.body.trim())) return 'Write the letter inside.'; var patch={title:v.title.trim(),openOn:v.openOn,from:(v.from&&v.from!=='Not set')?v.from:'',body:v.body.trim()}; if(isCP) FD.updateCapsule(ctx.capsuleId,patch); else FD.addCapsule(patch); }};
 }
 if(type==='relNote'||type==='editRelNote'){ var rn=(type==='editRelNote')?(FD.getRelNote(ctx.relNoteId)||{}):{}; var isRN=(type==='editRelNote');
 return {title:isRN?'Edit note':'Write a love note',submit:isRN?'Save':'Keep it safe',done:isRN?'Updated':'Note kept safe',fields:[
 {name:'date',label:'Date',type:'date',value:rn.date||todayStr()},
 {name:'from',label:'From (optional)',type:'select',opts:journalWhoOpts(),value:rn.from||''},
 {name:'title',label:'A little title (optional)',type:'text',ph:'e.g. Thank you for today',value:rn.title||''},
 {name:'body',label:'Your words',type:'textarea',ph:'Write from the heart\u2026',value:rn.body||''}
 ],save:function(v){ if(!(v.body&&v.body.trim())) return 'A note needs at least a few words.'; var patch={date:v.date||todayStr(),from:(v.from&&v.from!=='Not set')?v.from:'',title:(v.title||'').trim(),body:v.body.trim()}; if(isRN) FD.updateRelNote(ctx.relNoteId,patch); else FD.addRelNote(patch); }};
 }
 if(type==='relDate'||type==='editRelDate'){ var rd=(type==='editRelDate')?(FD.getRelDate(ctx.relDateId)||{}):{}; var isRD=(type==='editRelDate');
 return {title:isRD?'Edit special date':'Add special date',submit:isRD?'Save':'Add',done:isRD?'Updated':'Added',fields:[
 {name:'title',label:'What is it?',type:'text',ph:'e.g. Our nikah anniversary',value:rd.title||''},
 {name:'date',label:'The original date',type:'date',value:rd.date||''},
 {name:'type',label:'Type',type:'select',opts:['Anniversary','Birthday','First met','Special day'],value:rd.type||'Anniversary'},
 {name:'note',label:'Note (optional)',type:'text',ph:'A line to remember\u2026',value:rd.note||''}
 ],save:function(v){ if(!(v.title&&v.title.trim())) return 'Please name the day.'; if(!v.date) return 'Please pick the original date.'; var patch={title:v.title.trim(),date:v.date,type:v.type||'',note:(v.note||'').trim()}; if(isRD) FD.updateRelDate(ctx.relDateId,patch); else FD.addRelDate(patch); }};
 }
 if(type==='relPlan'||type==='editRelPlan'){ var rp=(type==='editRelPlan')?(FD.getRelPlan(ctx.relPlanId)||{}):{}; var isRP=(type==='editRelPlan');
 return {title:isRP?'Edit plan':'Add a date idea',submit:isRP?'Save':'Into the jar',done:isRP?'Updated':'Added to the jar',fields:[
 {name:'title',label:'The idea',type:'text',ph:'e.g. Sunset picnic by the river',value:rp.title||''},
 {name:'when',label:'When? (optional, leave empty for the idea jar)',type:'date',value:rp.when||''},
 {name:'place',label:'Where? (optional)',type:'text',ph:'e.g. Nile corniche',value:rp.place||''},
 {name:'note',label:'Note (optional)',type:'text',ph:'Anything to remember\u2026',value:rp.note||''}
 ],save:function(v){ if(!(v.title&&v.title.trim())) return 'Please name the idea.'; var patch={title:v.title.trim(),when:v.when||'',place:(v.place||'').trim(),note:(v.note||'').trim()}; if(isRP) FD.updateRelPlan(ctx.relPlanId,patch); else { patch.done=false; FD.addRelPlan(patch); } }};
 }
 if(type==='relSince'){
 return {title:'The day it all began',submit:'Save',done:'Saved',fields:[
 {name:'since',label:'Our date',type:'date',value:FD.data.relationship.since||''}
 ],save:function(v){ if(!v.since) return 'Please pick the date.'; FD.setRelSince(v.since); }};
 }
 if(type==='task'||type==='editTask'){ var tk=(type==='editTask')?(FD.getTask(ctx.taskId)||{}):{}; var isTK=(type==='editTask');
 var pnames=FD.data.planning.projects.map(function(p){return p.name;}).filter(Boolean);
 var pjVal=''; if(isTK&&tk.projectId){ pjVal=projectName(tk.projectId); } else if(ctx.projectId){ pjVal=projectName(ctx.projectId); }
 return {title:isTK?'Edit task':'Add task',submit:isTK?'Save':'Add task',done:isTK?'Updated':'Task added',fields:[
 {name:'title',label:'Task',type:'text',ph:'e.g. Renew passports',value:tk.title||''},
 {name:'due',label:'Due date (optional)',type:'date',value:tk.due||ctx.due||''},
 {name:'member',label:'Who owns it? (optional)',type:'select',opts:journalWhoOpts(),value:tk.member||''},
 {name:'priority',label:'Priority',type:'select',opts:['High','Normal','Low'],value:tk.priority?(tk.priority.charAt(0).toUpperCase()+tk.priority.slice(1)):'Normal'},
 {name:'project',label:'Project (optional)',type:'select',opts:['No project'].concat(pnames),value:pjVal||'No project'},
 {name:'subs',label:'Sub-tasks (optional)',type:'subtasks',value:(tk.subs||[])},
 {name:'note',label:'Note (optional)',type:'text',ph:'Any detail to remember?',value:tk.note||''}
 ],save:function(v){var _subs=(function(){function ok(s){return s&&typeof s.t==='string'&&s.t.trim();} var raw=v.subs; if(Array.isArray(raw)) return raw.filter(ok).map(function(s){return {t:s.t.trim(),done:!!s.done};}); try{var p=JSON.parse(raw||'[]'); if(Array.isArray(p)) return p.filter(ok).map(function(s){return {t:s.t.trim(),done:!!s.done};});}catch(e){} return String(raw||'').split('\n').map(function(l){return l.trim();}).filter(Boolean).map(function(l){return {t:l,done:false};});})(); if(!(v.title&&v.title.trim())) return 'Please name the task.'; var pid=''; if(v.project&&v.project!=='No project'&&v.project!=='Not set'){ var hit=null; FD.data.planning.projects.some(function(p){ if(p.name===v.project){ hit=p; return true; } return false; }); pid=hit?hit.id:''; } var patch={subs:_subs,subs:_subs,title:v.title.trim(),due:v.due||'',member:(v.member&&v.member!=='Not set')?v.member:'',priority:(v.priority||'Normal').toLowerCase(),projectId:pid,note:(v.note||'').trim()}; if(isTK) FD.updateTask(ctx.taskId,patch); else { patch.done=false; FD.addTask(patch); } }};
 }
 if(type==='addPhase'){
  var par=FD.getProject(ctx.parentId)||{};
  return {title:'Add a phase', submit:'Add phase', done:'Phase added', fields:[
   {name:'name',label:'Phase of \u201c'+(par.name||'project')+'\u201d',type:'text',ph:'e.g. Phase 1 \u2014 Foundation',value:''},
   {name:'prio',label:'Priority',type:'select',opts:['High','Normal','Low'],value:'Normal'},
   {name:'due',label:'Target date (optional)',type:'date',value:''},
   {name:'note',label:'Note (optional)',type:'textarea',ph:'What does this phase deliver?',value:''}
  ],save:function(v){
   if(!(v.name&&v.name.trim())) return 'Please name the phase.';
   var pp=FD.getProject(ctx.parentId);
   if(!pp) return 'That project no longer exists.';
   if(pp.parentId) return 'A phase cannot have phases of its own.';
   FD.addProject({ name:v.name.trim(), note:(v.note||'').trim(), cat:pjCat(pp),
    prio:String(v.prio||'Normal').toLowerCase(), due:String(v.due||''),
    status:'active', pinned:false, order:pjChildren(pp.id).length, members:[],
    parentId:pp.id, goalId:pp.goalId||'' });
  }};
 }
 if(type==='project'||type==='editProject'){ var pj=(type==='editProject')?(FD.getProject(ctx.projectId)||{}):{}; var isPJ=(type==='editProject');
 return {title:isPJ?'Edit project':'Add project',submit:isPJ?'Save':'Add project',done:isPJ?'Updated':'Project added',fields:[
 {name:'name',label:'Project',type:'text',ph:'e.g. Eid preparations',value:pj.name||''},
 {name:'cat',label:'Category',type:'select',opts:['Personal','Work','Health','Finance','Family','Education','Travel'],value:(pj.cat?(pj.cat.charAt(0).toUpperCase()+pj.cat.slice(1)):'Family')},
 {name:'prio',label:'Priority',type:'select',opts:['High','Normal','Low'],value:(pj.prio?(pj.prio.charAt(0).toUpperCase()+pj.prio.slice(1)):'Normal')},
 ].concat(isPJ?[{name:'parent',label:'Part of',type:'select',opts:pjParentOpts(ctx.projectId||''),value:pjParentValue(pj)}]:[]).concat([
 {name:'vision',label:'Serves which family goal?',type:'select',opts:pjGoalOpts(),value:pjGoalValue(pj)},
 {name:'due',label:'Target date (optional)',type:'date',value:pj.due||''},
 {name:'note',label:'Note (optional)',type:'textarea',ph:'What does done look like?',value:pj.note||''}
 ]),save:function(v){ if(!(v.name&&v.name.trim())) return 'Please name the project.'; var patch={name:v.name.trim(),note:(v.note||'').trim()}; patch.cat=String(v.cat||'Family').toLowerCase(); patch.prio=String(v.prio||'Normal').toLowerCase(); patch.due=String(v.due||''); patch.goalId=pjGoalIdFromLabel(v.vision); var _pid;
  if(isPJ){ FD.updateProject(ctx.projectId,patch); _pid=ctx.projectId; }
  else { patch.status='active'; patch.pinned=false; patch.order=0; patch.parentId=''; FD.addProject(patch);
   var _l=FD.data.planning.projects; _pid=_l.length?_l[_l.length-1].id:''; }
  var _want=pjParentIdFromLabel(v.parent,_pid), _cur=((FD.getProject(_pid)||{}).parentId)||'';
  if(_want!==_cur && !pjSetParent(_pid,_want)) return 'That would nest too deep \u2014 a phase cannot have phases of its own.';
 }};
 }
 if(type==='nmeal'||type==='editNmeal'){ var nm=(type==='editNmeal')?(FD.getNMeal(ctx.nmealId)||{}):{}; var isNM=(type==='editNmeal');
 return {title:isNM?'Edit meal':'Log a meal',submit:isNM?'Save':'Log it',done:isNM?'Updated':'Meal logged',fields:[
 {name:'date',label:'Date',type:'date',value:nm.date||todayStr()},
 {name:'meal',label:'Which meal?',type:'select',opts:['Breakfast','Lunch','Dinner','Snack'],value:nm.meal||'Lunch'},
 {name:'what',label:'What was eaten?',type:'text',ph:'e.g. Rice, dal & salad',value:nm.what||''},
 {name:'quality',label:'How was it?',type:'select',opts:NT_Q,value:nm.quality||'Balanced'},
 {name:'member',label:'Who ate? (optional)',type:'select',opts:journalWhoOpts(),value:nm.member||''},
 {name:'note',label:'Note (optional)',type:'text',ph:'Anything to remember?',value:nm.note||''}
 ],save:function(v){ if(!(v.what&&v.what.trim())) return 'What was eaten? Please add a line.'; var patch={date:v.date||todayStr(),meal:v.meal||'Meal',what:v.what.trim(),quality:v.quality||'',member:(v.member&&v.member!=='Not set')?v.member:'',note:(v.note||'').trim()}; if(isNM) FD.updateNMeal(ctx.nmealId,patch); else FD.addNMeal(patch); }};
 }
 if(type==='habit'||type==='editHabit'){ var hb=(type==='editHabit')?(FD.getHabit(ctx.habitId)||{}):{}; var isHB=(type==='editHabit');
 return {title:isHB?'Edit habit':'Add daily habit',submit:isHB?'Save':'Add habit',done:isHB?'Updated':'Habit added',fields:[
 {name:'title',label:'Habit',type:'text',ph:'e.g. Fruit with breakfast',value:hb.title||''},
 {name:'member',label:'Whose habit? (optional)',type:'select',opts:journalWhoOpts(),value:hb.member||''}
 ],save:function(v){ if(!(v.title&&v.title.trim())) return 'Please name the habit.'; var patch={title:v.title.trim(),member:(v.member&&v.member!=='Not set')?v.member:''}; if(isHB) FD.updateHabit(ctx.habitId,patch); else FD.addHabit(patch); }};
 }
 if(type==='waterTarget'){ var wtn=ctx.wname||'';
 return {title:'Water target \u00b7 '+wtn,submit:'Save',done:'Target saved',fields:[
 {name:'target',label:'Glasses per day',type:'number',ph:'8',value:ntTarget(wtn)}
 ],save:function(v){ var n=parseInt(v.target,10)||0; if(n<1) return 'At least 1 glass, please.'; FD.setWaterTarget(wtn,n); }};
 }
 if(type==='workout'||type==='editWorkout'){ var wo=(type==='editWorkout')?(FD.getWorkout(ctx.workoutId)||{}):{}; var isWO=(type==='editWorkout');
 return {title:isWO?'Edit workout':'Log workout',submit:isWO?'Save':'Log it',done:isWO?'Updated':'Workout logged',fields:[
 {name:'date',label:'Date',type:'date',value:wo.date||todayStr()},
 {name:'type',label:'Type',type:'select',opts:FT_TYPES,value:wo.type||ctx.type||'Walking'},
 {name:'minutes',label:'Minutes',type:'number',ph:'30',value:(wo.minutes==null?'':wo.minutes)},
 {name:'member',label:'Who moved?',type:'select',opts:journalWhoOpts(),value:wo.member||ctx.member||''},
 {name:'note',label:'Note (optional)',type:'text',ph:'How did it feel?',value:wo.note||ctx.note||''}
 ],save:function(v){ var patch={date:v.date||todayStr(),type:v.type||'Other',minutes:Math.max(0,parseInt(v.minutes,10)||0),member:(v.member&&v.member!=='Not set')?v.member:'',note:(v.note||'').trim()}; if(isWO) FD.updateWorkout(ctx.workoutId,patch); else FD.addWorkout(patch); }};
 }
 if(type==='fitgoal'||type==='editFitgoal'){ var fg=(type==='editFitgoal')?(FD.getFitGoal(ctx.fitgoalId)||{}):{}; var isFG=(type==='editFitgoal');
 var fgWho=['Whole family'].concat(FD.data.members.map(function(m){return m.name;}));
 return {title:isFG?'Edit weekly goal':'Add weekly goal',submit:isFG?'Save':'Set goal',done:isFG?'Updated':'Goal set',fields:[
 {name:'member',label:'For whom?',type:'select',opts:fgWho,value:fg.member||'Whole family'},
 {name:'kind',label:'Measure',type:'select',opts:['Workouts per week','Minutes per week'],value:(fg.kind==='minutes'?'Minutes per week':'Workouts per week')},
 {name:'target',label:'Target',type:'number',ph:'3',value:(fg.target==null?'':fg.target)}
 ],save:function(v){ var t=parseInt(v.target,10)||0; if(t<1) return 'Please set a target of at least 1.'; var patch={member:(v.member&&v.member!=='Whole family')?v.member:'',kind:(v.kind==='Minutes per week')?'minutes':'sessions',target:t}; if(isFG) FD.updateFitGoal(ctx.fitgoalId,patch); else FD.addFitGoal(patch); }};
 }
 if(type==='routine'||type==='editRoutine'){ var ro=(type==='editRoutine')?(FD.getRoutine(ctx.routineId)||{}):{}; var isRO=(type==='editRoutine');
 return {title:isRO?'Edit routine':'Add routine',submit:isRO?'Save':'Save routine',done:isRO?'Updated':'Routine saved',fields:[
 {name:'name',label:'Routine name',type:'text',ph:'e.g. Morning stretch',value:ro.name||''},
 {name:'member',label:'Whose routine? (optional)',type:'select',opts:journalWhoOpts(),value:ro.member||''},
 {name:'days',label:'Days (optional)',type:'text',ph:'e.g. Mon \u00b7 Wed \u00b7 Fri',value:ro.days||''},
 {name:'items',label:'Exercises (one per line)',type:'textarea',ph:'10 squats\n20 jumping jacks\n\u2026',value:ro.items||''}
 ],save:function(v){ if(!(v.name&&v.name.trim())) return 'Please name the routine.'; var patch={name:v.name.trim(),member:(v.member&&v.member!=='Not set')?v.member:'',days:(v.days||'').trim(),items:(v.items||'').trim()}; if(isRO) FD.updateRoutine(ctx.routineId,patch); else FD.addRoutine(patch); }};
 }
 if(type==='trip'||type==='editTrip'){ var tr=(type==='editTrip')?(FD.getTrip(ctx.tripId)||{}):{}; var isTR=(type==='editTrip');
 return {title:isTR?'Edit trip':'Add trip',submit:isTR?'Save':'Add trip',done:isTR?'Updated':'Trip added',fields:[
 {name:'dest',label:'Destination',type:'text',ph:'e.g. Cairo, Egypt',value:tr.dest||ctx.dest||''},
 {name:'start',label:'Start date (optional)',type:'date',value:tr.start||''},
 {name:'end',label:'End date (optional)',type:'date',value:tr.end||''},
 {name:'travelers',label:'Who\u2019s going? (optional)',type:'text',ph:'Everyone, or names separated by commas',value:tr.travelers||''},
 {name:'note',label:'Note (optional)',type:'textarea',ph:'Plans, bookings, hopes\u2026',value:tr.note||''},
 {name:'photo',label:'Photo (optional)',type:'photo',value:tr.photo||'',ini:''}
 ],save:function(v){ if(!(v.dest&&v.dest.trim())) return 'Where are you going? Please add a destination.'; if(v.start&&v.end&&v.end<v.start) return 'The end date is before the start date.'; var patch={dest:v.dest.trim(),start:v.start||'',end:v.end||'',travelers:(v.travelers||'').trim(),note:(v.note||'').trim()}; if(isTR){ if(pendingPhoto!==undefined) patch.photo=pendingPhoto; FD.updateTrip(ctx.tripId,patch); } else { patch.photo=pendingPhoto||''; FD.addTrip(patch); } }};
 }
 if(type==='idea'||type==='editIdea'){ var ide=(type==='editIdea')?(FD.getIdea(ctx.ideaId)||{}):{}; var isID=(type==='editIdea');
 return {title:isID?'Edit dream place':'Add dream place',submit:isID?'Save':'Add',done:isID?'Updated':'Added to bucket list',fields:[
 {name:'place',label:'Place',type:'text',ph:'e.g. Santorini',value:ide.place||''},
 {name:'note',label:'Why there? (optional)',type:'text',ph:'A line about the dream\u2026',value:ide.note||''}
 ],save:function(v){ if(!(v.place&&v.place.trim())) return 'Please name the place.'; var patch={place:v.place.trim(),note:(v.note||'').trim()}; if(isID) FD.updateIdea(ctx.ideaId,patch); else FD.addIdea(patch); }};
 }
 if(type==='editPack'){ var pki=FD.getPack(ctx.packId)||{};
 return {title:'Edit item',submit:'Save',done:'Updated',fields:[
 {name:'name',label:'Item',type:'text',ph:'e.g. Sunscreen',value:pki.name||''}
 ],save:function(v){ if(!(v.name&&v.name.trim())) return 'Please name the item.'; FD.updatePack(ctx.packId,{name:v.name.trim()}); }};
 }
 if(type==='course'||type==='editCourse'){ var co=(type==='editCourse')?(FD.getCourse(ctx.courseId)||{}):{}; var isCO=(type==='editCourse');
 return {title:isCO?'Edit course':'Add course',submit:isCO?'Save':'Add course',done:isCO?'Updated':'Course added',fields:[
 {name:'title',label:'Course or study',type:'text',ph:'e.g. IELTS preparation',value:co.title||''},
 {name:'member',label:'Who is learning?',type:'select',opts:journalWhoOpts(),value:co.member||''},
 {name:'subject',label:'Subject (optional)',type:'text',ph:'e.g. English',value:co.subject||''},
 {name:'source',label:'Where? (optional)',type:'text',ph:'e.g. YouTube, school, Coursera',value:co.source||''},
 {name:'progress',label:'Progress % (0\u2013100)',type:'number',ph:'0',value:(co.progress==null?'':co.progress)},
 {name:'note',label:'Note (optional)',type:'textarea',ph:'Goals, schedule, links\u2026',value:co.note||''}
 ],save:function(v){ if(!(v.title&&v.title.trim())) return 'Please name the course.'; var p=Math.max(0,Math.min(100,parseInt(v.progress,10)||0)); var patch={title:v.title.trim(),member:(v.member&&v.member!=='Not set')?v.member:'',subject:(v.subject||'').trim(),source:(v.source||'').trim(),progress:p,note:(v.note||'').trim()}; if(isCO) FD.updateCourse(ctx.courseId,patch); else FD.addCourse(patch); }};
 }
 if(type==='book'||type==='editBook'){ var bo=(type==='editBook')?(FD.getBook(ctx.bookId)||{}):{}; var isBO=(type==='editBook');
 return {title:isBO?'Edit book':'Add book',submit:isBO?'Save':'Add book',done:isBO?'Updated':'Book added',fields:[
 {name:'title',label:'Book title',type:'text',ph:'e.g. Atomic Habits',value:bo.title||''},
 {name:'author',label:'Author (optional)',type:'text',ph:'e.g. James Clear',value:bo.author||''},
 {name:'member',label:'Who is reading?',type:'select',opts:journalWhoOpts(),value:bo.member||''},
 {name:'progress',label:'Progress % (0\u2013100)',type:'number',ph:'0',value:(bo.progress==null?'':bo.progress)},
 {name:'note',label:'Note (optional)',type:'textarea',ph:'Thoughts so far\u2026',value:bo.note||''}
 ],save:function(v){ if(!(v.title&&v.title.trim())) return 'Please name the book.'; var p=Math.max(0,Math.min(100,parseInt(v.progress,10)||0)); var patch={title:v.title.trim(),author:(v.author||'').trim(),member:(v.member&&v.member!=='Not set')?v.member:'',progress:p,note:(v.note||'').trim()}; if(isBO) FD.updateBook(ctx.bookId,patch); else FD.addBook(patch); }};
 }
 if(type==='skill'||type==='editSkill'){ var sk2=(type==='editSkill')?(FD.getSkill(ctx.skillId)||{}):{}; var isSK=(type==='editSkill');
 return {title:isSK?'Edit skill':'Add skill',submit:isSK?'Save':'Add skill',done:isSK?'Updated':'Skill added',fields:[
 {name:'name',label:'Skill',type:'text',ph:'e.g. Swimming, Arabic, Coding',value:sk2.name||''},
 {name:'member',label:'Whose skill?',type:'select',opts:journalWhoOpts(),value:sk2.member||''},
 {name:'level',label:'Level',type:'select',opts:['Beginner','Practicing','Confident','Mastered'],value:LN_LEVELS[sk2.level||1]},
 {name:'note',label:'Note (optional)',type:'textarea',ph:'What does progress look like?',value:sk2.note||''}
 ],save:function(v){ if(!(v.name&&v.name.trim())) return 'Please name the skill.'; var lv=['Beginner','Practicing','Confident','Mastered'].indexOf(v.level)+1; if(lv<1) lv=1; var patch={name:v.name.trim(),member:(v.member&&v.member!=='Not set')?v.member:'',level:lv,note:(v.note||'').trim()}; if(isSK) FD.updateSkill(ctx.skillId,patch); else FD.addSkill(patch); }};
 }
 if(type==='chore'||type==='editChore'){ var ch=(type==='editChore')?(FD.getChore(ctx.choreId)||{}):{}; var isCH=(type==='editChore');
 return {title:isCH?'Edit chore':'Add chore',submit:isCH?'Save':'Add chore',done:isCH?'Updated':'Chore added',fields:[
 {name:'title',label:'Chore',type:'text',ph:'e.g. Take out the bins',value:ch.title||''},
 {name:'freq',label:'How often?',type:'select',opts:['Once','Daily','Weekly','Monthly'],value:HM_FREQ_LABEL[ch.freq]||'Weekly'},
 {name:'assignee',label:'Who does it? (optional)',type:'select',opts:journalWhoOpts(),value:ch.assignee||''}
 ],save:function(v){ if(!(v.title&&v.title.trim())) return 'Please name the chore.'; var patch={title:v.title.trim(),freq:(v.freq||'Once').toLowerCase(),assignee:(v.assignee&&v.assignee!=='Not set')?v.assignee:''}; if(isCH) FD.updateChore(ctx.choreId,patch); else { patch.lastDone=''; FD.addChore(patch); } }};
 }
 if(type==='maint'||type==='editMaint'){ var mt=(type==='editMaint')?(FD.getMaint(ctx.maintId)||{}):{}; var isMT=(type==='editMaint');
 return {title:isMT?'Edit maintenance':'Add maintenance',submit:isMT?'Save':'Add task',done:isMT?'Updated':'Task added',fields:[
 {name:'title',label:'Task',type:'text',ph:'e.g. Clean AC filter',value:mt.title||''},
 {name:'area',label:'Area',type:'select',opts:HM_AREAS,value:mt.area||'General'},
 {name:'due',label:'Due date (optional)',type:'date',value:mt.due||''},
 {name:'note',label:'Note (optional)',type:'textarea',ph:'Details, model numbers, who to call\u2026',value:mt.note||''}
 ],save:function(v){ if(!(v.title&&v.title.trim())) return 'Please name the task.'; var patch={title:v.title.trim(),area:v.area||'',due:v.due||'',note:(v.note||'').trim()}; if(isMT) FD.updateMaint(ctx.maintId,patch); else { patch.done=false; FD.addMaint(patch); } }};
 }
 if(type==='supply'||type==='editSupply'){ var sp=(type==='editSupply')?(FD.getSupply(ctx.supId)||{}):{}; var isSP=(type==='editSupply');
 return {title:isSP?'Edit supply':'Add supply',submit:isSP?'Save':'Add',done:isSP?'Updated':'Added',fields:[
 {name:'name',label:'Item',type:'text',ph:'e.g. Dish soap',value:sp.name||''},
 {name:'cat',label:'Category',type:'select',opts:SUP_CATS,value:sp.cat||'Cleaning'},
 {name:'status',label:'Status',type:'select',opts:['OK','Low','Out'],value:SUP_LABEL[sp.status]||'OK'}
 ],save:function(v){ if(!(v.name&&v.name.trim())) return 'Please name the item.'; var patch={name:v.name.trim(),cat:v.cat||'',status:(v.status||'OK').toLowerCase()}; if(isSP) FD.updateSupply(ctx.supId,patch); else FD.addSupply(patch); }};
 }
 if(type==='recipe'||type==='editRecipe'){ var rc=(type==='editRecipe')?(FD.getRecipe(ctx.recipeId)||{}):{}; var isR=(type==='editRecipe');
 return {title:isR?'Edit recipe':'Add recipe',submit:isR?'Save':'Save recipe',done:isR?'Recipe updated':'Recipe saved',fields:[
 {name:'name',label:'Recipe name',type:'text',ph:'e.g. Chicken biryani',value:rc.name||''},
 {name:'cat',label:'Category',type:'select',opts:CK_CATS,value:rc.cat||'Dinner'},
 {name:'time',label:'Time (minutes, optional)',type:'number',ph:'30',value:rc.time||''},
 {name:'serves',label:'Serves (optional)',type:'number',ph:'4',value:rc.serves||''},
 {name:'ingredients',label:'Ingredients (one per line)',type:'textarea',ph:'One ingredient per line\u2026',value:rc.ingredients||''},
 {name:'steps',label:'Steps (optional)',type:'textarea',ph:'Write the method\u2026',value:rc.steps||''},
 {name:'photo',label:'Photo (optional)',type:'photo',value:rc.photo||'',ini:''}
 ],save:function(v){ if(!(v.name&&v.name.trim())) return 'Please name the recipe.'; var patch={name:v.name.trim(),cat:v.cat||'',time:(v.time===''||v.time==null)?'':(parseInt(v.time,10)||''),serves:(v.serves===''||v.serves==null)?'':(parseInt(v.serves,10)||''),ingredients:(v.ingredients||'').trim(),steps:(v.steps||'').trim()}; if(isR){ if(pendingPhoto!==undefined) patch.photo=pendingPhoto; FD.updateRecipe(ctx.recipeId,patch); } else { patch.photo=pendingPhoto||''; patch.fav=false; FD.addRecipe(patch); } }};
 }
 if(type==='meal'||type==='editMeal'){ var ml=(type==='editMeal')?(FD.getMeal(ctx.mealId)||{}):{}; var isML=(type==='editMeal');
 var rnames=FD.data.cooking.recipes.map(function(r){return r.name;}).filter(Boolean);
 var dishVal=''; if(isML&&ml.recipeId){ var rr0=FD.getRecipe(ml.recipeId); dishVal=rr0?rr0.name:''; }
 var customVal=(isML&&!dishVal)?(ml.title||''):'';
 return {title:isML?'Edit meal':'Plan a meal',submit:isML?'Save':'Add to plan',done:isML?'Updated':'Meal planned',fields:[
 {name:'date',label:'Date',type:'date',value:ml.date||ctx.date||todayStr()},
 {name:'slot',label:'Meal',type:'select',opts:['Breakfast','Lunch','Dinner'],value:ckCap(ml.slot||ctx.slot||'dinner')},
 {name:'dish',label:'From your recipes',type:'select',opts:['Something else\u2026'].concat(rnames),value:dishVal||'Something else\u2026'},
 {name:'custom',label:'Or type a dish',type:'text',ph:'e.g. Leftovers, order pizza\u2026',value:customVal}
 ],save:function(v){ var slot=(v.slot||'Dinner').toLowerCase(); var title='',rid=''; if(v.dish&&v.dish!=='Something else\u2026'&&v.dish!=='Not set'){ title=v.dish; var hit=null; FD.data.cooking.recipes.some(function(r){ if(r.name===v.dish){ hit=r; return true; } return false; }); rid=hit?hit.id:''; } else { title=(v.custom||'').trim(); } if(!title) return 'Pick a recipe or type a dish.'; var patch={date:v.date||todayStr(),slot:slot,title:title,recipeId:rid}; if(isML) FD.updateMeal(ctx.mealId,patch); else FD.addMeal(patch); }};
 }
 if(type==='shopItem'||type==='editShopItem'){ var sh=(type==='editShopItem')?(FD.getShopItem(ctx.shopId)||{}):{}; var isSH=(type==='editShopItem');
 return {title:isSH?'Edit item':'Add item',submit:isSH?'Save':'Add',done:isSH?'Updated':'Added',fields:[
 {name:'name',label:'Item',type:'text',ph:'e.g. Rice',value:sh.name||''},
 {name:'qty',label:'Quantity (optional)',type:'text',ph:'e.g. 2 kg',value:sh.qty||''}
 ],save:function(v){ if(!(v.name&&v.name.trim())) return 'Please name the item.'; var patch={name:v.name.trim(),qty:(v.qty||'').trim()}; if(isSH) FD.updateShopItem(ctx.shopId,patch); else { patch.done=false; FD.addShopItem(patch); } }};
 }
 if(type==='journalEntry'||type==='editJournalEntry'){ var je=(type==='editJournalEntry')?(FD.getJournalEntry(ctx.entryId)||{}):{}; var isE=(type==='editJournalEntry');
 return {title:isE?'Edit entry':'New journal entry',submit:isE?'Save':'Save entry',done:isE?'Entry updated':'Entry saved',fields:[
 {name:'date',label:'Date',type:'date',value:je.date||todayStr()},
 {name:'title',label:'Title (optional)',type:'text',ph:'A line for this moment\u2026',value:je.title||''},
 {name:'mood',label:'How are you feeling?',type:'select',opts:JMOOD_LABELS,value:(je.mood?JMOOD_LABELS[je.mood]:'')},
 {name:'member',label:'Who is this about? (optional)',type:'select',opts:journalWhoOpts(),value:je.member||''},
 {name:'tags',label:'Tags (optional, comma-separated)',type:'text',ph:'e.g. work, family, gratitude',value:(je.tags||[]).join(', ')},
 {name:'body',label:'Entry',type:'textarea',ph:'Write what\u2019s on your mind\u2026',value:je.body||''},
 {name:'photo',label:'Photo (optional)',type:'photo',value:je.photo||'',ini:''}
 ],save:function(v){ if(!(v.body&&v.body.trim())&&!(v.title&&v.title.trim())) return 'Please write something, or add a title.'; var tags=(v.tags||'').split(',').map(function(t){return t.trim();}).filter(Boolean); var mood=JMOOD_LABELS.indexOf(v.mood||'Not set'); if(mood<0) mood=0; var patch={date:v.date||todayStr(),title:(v.title||'').trim(),mood:mood,member:v.member||'',tags:tags,body:(v.body||'').trim()}; if(isE){ if(pendingPhoto!==undefined) patch.photo=pendingPhoto; FD.updateJournalEntry(ctx.entryId,patch); } else { patch.photo=pendingPhoto||''; FD.addJournalEntry(patch); } }};
 }
 if(type==='gratitude'||type==='editGratitude'){ var gg=(type==='editGratitude')?(FD.getGratitude(ctx.gratId)||{}):{}; var isG=(type==='editGratitude'); var gi=(gg.items||[]);
 return {title:isG?'Edit gratitude':'Grateful for\u2026',submit:isG?'Save':'Add',done:isG?'Updated':'Added',fields:[
 {name:'date',label:'Date',type:'date',value:gg.date||todayStr()},
 {name:'g1',label:'I\u2019m grateful for\u2026',type:'text',ph:'Something big or small',value:gi[0]||''},
 {name:'g2',label:'And\u2026 (optional)',type:'text',ph:'Another thing',value:gi[1]||''},
 {name:'g3',label:'And\u2026 (optional)',type:'text',ph:'One more',value:gi[2]||''},
 {name:'member',label:'Who? (optional)',type:'select',opts:journalWhoOpts(),value:gg.member||''}
 ],save:function(v){ var items=[v.g1,v.g2,v.g3].map(function(t){return (t||'').trim();}).filter(Boolean); if(!items.length) return 'Please add at least one thing.'; var patch={date:v.date||todayStr(),items:items,member:v.member||''}; if(isG) FD.updateGratitude(ctx.gratId,patch); else FD.addGratitude(patch); }};
 }
 if(type==='milestone'||type==='editMilestone'){ var mst=(type==='editMilestone')?(FD.getMilestone(ctx.mileId)||{}):{}; var isM=(type==='editMilestone');
 return {title:isM?'Edit milestone':'Add milestone',submit:isM?'Save':'Save',done:isM?'Updated':'Milestone saved',fields:[
 {name:'title',label:'Milestone',type:'text',ph:'e.g. Took the first steps',value:mst.title||''},
 {name:'date',label:'Date',type:'date',value:mst.date||todayStr()},
 {name:'member',label:'Who? (optional)',type:'select',opts:journalWhoOpts(),value:mst.member||''},
 {name:'note',label:'Note (optional)',type:'textarea',ph:'A few words about this moment\u2026',value:mst.note||''},
 {name:'photo',label:'Photo (optional)',type:'photo',value:mst.photo||'',ini:''}
 ],save:function(v){ if(!(v.title&&v.title.trim())) return 'Please name the milestone.'; var patch={title:v.title.trim(),date:v.date||todayStr(),member:v.member||'',note:(v.note||'').trim()}; if(isM){ if(pendingPhoto!==undefined) patch.photo=pendingPhoto; FD.updateMilestone(ctx.mileId,patch); } else { patch.photo=pendingPhoto||''; FD.addMilestone(patch); } }};
 }
 if(type==='member') return {title:'Add Family Member',submit:'Add member',done:'Member added',fields:[
 {name:'photo',label:'Photo (optional)',type:'photo',value:'',ini:''},
 {name:'name',label:'Name',type:'text',ph:'e.g. Basma'},
 {name:'relation',label:'Relation',type:'select',opts:RELATIONS},
 {name:'email',label:'Email, lets them join Wisal (optional)',type:'email',ph:'name@gmail.com'},
 {name:'role',label:'Role',type:'select',opts:['Member','Admin','Owner']},
 {name:'birthday',label:'Birthday (optional)',type:'date'},
 {name:'bloodGroup',label:'Blood group (optional)',type:'select',opts:BLOODS}
 ],save:function(v){ if(!v.name) return 'Please enter a name.'; var m={name:v.name,relation:v.relation||'',birthday:v.birthday||'',bloodGroup:v.bloodGroup||'',email:String(v.email||'').trim().toLowerCase(),role:String(v.role||'member').toLowerCase()}; if(pendingPhoto) m.photo=pendingPhoto; FD.addMember(m); if(modalCtx&&modalCtx.invite&&m.email){ setTimeout(function(){ try{ if(!Store.get('fw.sync.code','')&&!hhIsGuest()&&cloudEnabled()) hhMake(); setTimeout(function(){ try{ location.href=buildInviteMail(m.email,m.name); }catch(e2){} }, Store.get('fw.sync.code','')?150:1100); }catch(e){} },250); } }};
 if(type==='editProfile'){ var em=FD.getMember(ctx.memberId)||{}; return {title:'Edit Profile',submit:'Save',done:'Profile updated',fields:[
 {name:'photo',label:'Photo',type:'photo',value:em.photo||'',ini:initials(em.name||'')},
 {name:'name',label:'Name',type:'text',value:em.name||''},
 {name:'relation',label:'Relation',type:'select',opts:RELATIONS,value:em.relation||''},
 {name:'email',label:'Email',type:'email',value:em.email||''},
 {name:'role',label:'Role',type:'select',opts:['Member','Admin','Owner'],value:(em.role? em.role.charAt(0).toUpperCase()+em.role.slice(1):'Member')},
 {name:'birthday',label:'Birthday',type:'date',value:em.birthday||''},
 {name:'bloodGroup',label:'Blood group',type:'select',opts:BLOODS,value:em.bloodGroup||''}
 ],save:function(v){ if(!v.name) return 'Please enter a name.'; var patch={name:v.name,relation:v.relation||'',birthday:v.birthday||'',bloodGroup:v.bloodGroup||'',email:String(v.email||'').trim().toLowerCase(),role:String(v.role||'member').toLowerCase()}; if(pendingPhoto!==undefined) patch.photo=pendingPhoto; FD.updateMember(ctx.memberId,patch); }}; }
 if(type==='goal'){ goalModalTypeKey='financial'; return {title:'Create Family Goal',submit:'Create goal',done:'Goal created',fields:[
 {name:'title',label:'Goal name',type:'text',ph:'e.g. Save for summer trip'},
 {type:'goaltype',value:goalTypeLabel(goalModalTypeKey),typeKey:goalModalTypeKey,goal:null},
 {name:'owner',label:'Responsible person (optional)',type:'select',opts:ownerOpts()}
 ],save:function(v){ if(!v.title) return 'Please enter a goal.'; FD.addGoal(buildGoalPatch(goalTypeKey(v.type),v,null)); }};}
 if(type==='editGoal'){ var eg=FD.getGoal(ctx.goalId)||{}; var ek=goalTypeBy(eg.type)?eg.type:'general'; goalModalTypeKey=ek; return {title:'Edit Goal',submit:'Save',done:'Goal updated',fields:[
 {name:'title',label:'Goal name',type:'text',value:eg.title||''},
 {type:'goaltype',value:goalTypeLabel(ek),typeKey:ek,goal:eg},
 {name:'owner',label:'Responsible person (optional)',type:'select',opts:ownerOpts(),value:eg.owner||''}
 ],save:function(v){ if(!v.title) return 'Please enter a goal.'; FD.updateGoal(ctx.goalId,buildGoalPatch(goalTypeKey(v.type),v,eg)); }};}
 if(type==='event'||type==='editEvent'){ var ev=(type==='editEvent')?(FD.getEvent(ctx.eventId)||{}):{}; var isEdit=(type==='editEvent');
 var dval=ev.date||''; if(isEdit && ev.allDay && dval && dval.indexOf('T')<0) dval=dval+'T09:00';
 return {title:isEdit?'Edit Event':'Add Event',submit:isEdit?'Save':'Add event',done:isEdit?'Event updated':'Event added',
 pending:{participants:(ev.participants||[]).slice(),attachments:(ev.attachments||[]).slice()},
 fields:[
 {name:'title',label:'Title',type:'text',value:ev.title||'',ph:'e.g. Dentist appointment'},
 {name:'category',label:'Category',type:'category',value:isEdit?catLabel(ev.category):''},
 {name:'allDay',label:'All-day event',type:'checkbox',value:!!ev.allDay},
 {name:'date',label:'Date & time',type:'datetime-local',value:dval},
 {name:'location',label:'Location (optional)',type:'text',value:ev.location||'',ph:'e.g. City Clinic'},
 {name:'participants',label:'Participants',type:'participants'},
 {name:'reminder',label:'Reminder',type:'select',opts:REMINDER_OPTS,value:ev.reminder||'None'},
 {name:'repeat',label:'Repeat',type:'select',opts:REPEAT_OPTS,value:repeatLabel(ev.repeat||'none')},
 {name:'description',label:'Description (optional)',type:'textarea',value:ev.description||'',ph:'What is this event about?'},
 {name:'notes',label:'Notes (optional)',type:'textarea',value:ev.notes||''},
 {name:'attachments',label:'Attachments',type:'attachments'}
 ],save:function(v){ if(!v.title) return 'Please enter a title.'; if(!v.date) return 'Please choose a date and time.'; var catKeyVal; if(v.category===NEW_CAT_OPT){ var nm=(v.newCatName||'').trim(); if(!nm) return 'Please name your new category, or pick one from the list.'; catKeyVal=FD.addCustomCat(nm,v.newCatColor||'#1E3A7B'); } else { catKeyVal=catKey(v.category); } var allDay=!!v.allDay; var dt=v.date; if(allDay && dt.indexOf('T')>=0) dt=dt.slice(0,10); var patch={title:v.title,category:catKeyVal,allDay:allDay,date:dt,location:v.location||'',participants:pendingParticipants.slice(),reminder:v.reminder||'None',repeat:repeatCode(v.repeat),description:v.description||'',notes:v.notes||'',attachments:pendingAtts.slice()}; if(isEdit){ FD.updateEvent(ctx.eventId,patch); } else { FD.addEvent(patch); } }}; }
 if(type==='meeting') return {title:'Schedule Meeting',submit:'Schedule',done:'Meeting scheduled',fields:[
 {name:'title',label:'Topic',type:'text',ph:'e.g. Weekly family meeting'},
 {name:'date',label:'Date & time',type:'datetime-local'},
 {name:'status',label:'Status',type:'select',opts:['Upcoming','Completed','Cancelled']},
 {name:'location',label:'Location or notes (optional)',type:'text',ph:'e.g. Living room'}
 ],save:function(v){ if(!v.title) return 'Please enter a topic.'; if(!v.date) return 'Please choose a date and time.'; FD.addEvent({title:v.title,date:v.date,status:(v.status||'Upcoming').toLowerCase(),location:v.location||'',kind:'meeting'}); }};
 if(type==='editMeeting'){ var ev=FD.getEvent(ctx.meetingId)||{}; var st=(ev.status||'upcoming'); return {title:'Edit Meeting',submit:'Save',done:'Meeting updated',fields:[
 {name:'title',label:'Topic',type:'text',value:ev.title||''},
 {name:'date',label:'Date & time',type:'datetime-local',value:ev.date||''},
 {name:'status',label:'Status',type:'select',opts:['Upcoming','Completed','Cancelled'],value:st.charAt(0).toUpperCase()+st.slice(1)},
 {name:'location',label:'Location (optional)',type:'text',value:ev.location||''}
 ],save:function(v){ if(!v.title) return 'Please enter a topic.'; if(!v.date) return 'Please choose a date and time.'; FD.updateEvent(ctx.meetingId,{title:v.title,date:v.date,status:(v.status||'Upcoming').toLowerCase(),location:v.location||''}); }}; }
 if(type==='decision') return {title:'Add Decision',submit:'Add',done:'Decision added',fields:[
 {name:'text',label:'Decision',type:'textarea',ph:'What did the family decide?'}
 ],save:function(v){ if(!v.text) return 'Please enter a decision.'; FD.addEvItem(ctx.meetingId,'decisions',{text:v.text}); }};
 if(type==='actionItem') return {title:'Add Action Item',submit:'Add',done:'Action item added',fields:[
 {name:'text',label:'Action item',type:'text',ph:'e.g. Book dentist appointments'},
 {name:'owner',label:'Owner (optional)',type:'select',opts:ownerOpts()}
 ],save:function(v){ if(!v.text) return 'Please enter an action item.'; FD.addEvItem(ctx.meetingId,'actionItems',{text:v.text,owner:v.owner||'',done:false}); }};
 if(type==='followUp') return {title:'Add Follow-up Task',submit:'Add',done:'Follow-up added',fields:[
 {name:'text',label:'Follow-up task',type:'text',ph:'e.g. Revisit budget next month'},
 {name:'owner',label:'Owner (optional)',type:'select',opts:ownerOpts()}
 ],save:function(v){ if(!v.text) return 'Please enter a follow-up task.'; FD.addEvItem(ctx.meetingId,'followUps',{text:v.text,owner:v.owner||'',done:false}); }};
 if(type==='announcement'){ var opts=['Family'].concat(FD.data.members.map(function(mm){return mm.name;})); return {title:'Create Announcement',submit:'Post',done:'Announcement posted',fields:[
 {name:'text',label:'Message',type:'textarea',ph:'Share something with the family\u2026'},
 {name:'author',label:'From',type:'select',opts:opts}
 ],save:function(v){ if(!v.text) return 'Please write a message.'; FD.addAnnouncement({text:v.text,author:v.author||'Family'}); }}; }
 if(type==='allergy') return {title:'Add Allergy',submit:'Add',done:'Allergy added',fields:[
 {name:'text',label:'Allergy',type:'text',ph:'e.g. Peanuts'}
 ],save:function(v){ if(!v.text) return 'Please enter an allergy.'; FD.addSubItem(ctx.memberId,'allergies',{text:v.text}); }};
 if(type==='medication') return {title:'Add Medication',submit:'Add',done:'Medication added',fields:[
 {name:'name',label:'Medication',type:'text',ph:'e.g. Vitamin D'},
 {name:'dose',label:'Dose / schedule (optional)',type:'text',ph:'e.g. 1000 IU, once daily'}
 ],save:function(v){ if(!v.name) return 'Please enter a medication.'; FD.addSubItem(ctx.memberId,'medications',{name:v.name,dose:v.dose||''}); }};
 if(type==='record') return {title:'Add Medical Record',submit:'Add',done:'Record added',fields:[
 {name:'title',label:'Title',type:'text',ph:'e.g. Annual check-up'},
 {name:'date',label:'Date (optional)',type:'date'},
 {name:'note',label:'Notes (optional)',type:'textarea',ph:'Diagnosis, results, doctor\u2019s notes\u2026'}
 ],save:function(v){ if(!v.title) return 'Please enter a title.'; FD.addSubItem(ctx.memberId,'records',{title:v.title,date:v.date||'',note:v.note||''}); }};
 if(type==='expense') return {title:'Add Expense',submit:'Add',done:'Expense added',fields:[
 {name:'label',label:'Expense',type:'text',ph:'e.g. School fees'},
 {name:'amount',label:'Amount',type:'number',ph:'0'},
 {name:'date',label:'Date (optional)',type:'date'}
 ],save:function(v){ if(!v.label) return 'Please enter a label.'; if(v.amount===''||v.amount==null) return 'Please enter an amount.'; FD.addSubItem(ctx.memberId,'expenses',{label:v.label,amount:Number(v.amount)||0,date:v.date||''}); }};
 if(type==='support') return {title:'Add Support',submit:'Add',done:'Support recorded',fields:[
 {name:'direction',label:'Type',type:'select',opts:['Given','Received']},
 {name:'label',label:'For',type:'text',ph:'e.g. Tuition help'},
 {name:'amount',label:'Amount',type:'number',ph:'0'},
 {name:'date',label:'Date (optional)',type:'date'}
 ],save:function(v){ if(!v.label) return 'Please enter a label.'; if(v.amount===''||v.amount==null) return 'Please enter an amount.'; FD.addSubItem(ctx.memberId,'support',{direction:(v.direction==='Received'?'received':'given'),label:v.label,amount:Number(v.amount)||0,date:v.date||''}); }};
 if(type==='poll') return {title:'New Poll',submit:'Create poll',done:'Poll created',fields:[
 {name:'question',label:'Question',type:'text',ph:'e.g. Where should we travel?'},
 {name:'o1',label:'Option 1',type:'text',ph:'First option'},
 {name:'o2',label:'Option 2',type:'text',ph:'Second option'},
 {name:'o3',label:'Option 3 (optional)',type:'text'},
 {name:'o4',label:'Option 4 (optional)',type:'text'},
 {name:'allowChange',label:'Allow voters to change their vote',type:'checkbox'}
 ],save:function(v){ if(!v.question) return 'Please enter a question.'; var opts=[v.o1,v.o2,v.o3,v.o4].map(function(x){return (x||'').trim();}).filter(Boolean); if(opts.length<2) return 'Please add at least two options.'; FD.addPoll(v.question,opts,!!v.allowChange); }};
 if(type==='channel') return {title:'New Group',submit:'Create group',done:'Group created',fields:[
 {name:'name',label:'Group name',type:'text',ph:'e.g. Siblings, Grandparents\u2026'}
 ],save:function(v){ if(!v.name) return 'Please enter a group name.'; var id=FD.addChannel(v.name); currentChannelId=id; }};
 if(type==='noteList') return {title:'New Shared Note',submit:'Create',done:'Note created',fields:[
 {name:'title',label:'Title',type:'text',ph:'e.g. Weekend plans'}
 ],save:function(v){ if(!v.title) return 'Please enter a title.'; FD.addNoteList(v.title); }};
 if(type==='condition') return {title:'Add Condition',submit:'Add',done:'Condition added',fields:[
 {name:'text',label:'Condition',type:'text',ph:'e.g. Asthma, Diabetes'}
 ],save:function(v){ if(!v.text) return 'Please enter a condition.'; FD.addSubItem(ctx.memberId,'conditions',{text:v.text}); }};
 if(type==='healthprofile'){ var hm=FD.getMember(ctx.memberId)||{}; var hh=hm.health||{}; return {title:'Edit Health Profile',submit:'Save',done:'Profile updated',fields:[
 {name:'heightCm',label:'Height (cm)',type:'number',ph:'e.g. 170',value:hh.heightCm||''},
 {name:'weightKg',label:'Weight (kg)',type:'number',ph:'e.g. 68',value:hh.weightKg||''},
 {name:'doctor',label:'Doctor',type:'text',ph:'Primary doctor',value:hh.doctor||''},
 {name:'doctorPhone',label:'Doctor phone',type:'text',ph:'Contact number',value:hh.doctorPhone||''},
 {name:'clinic',label:'Clinic / hospital',type:'text',ph:'Where they\u2019re seen',value:hh.clinic||''},
 {name:'insurer',label:'Insurance provider',type:'text',ph:'e.g. provider name',value:hh.insurer||''},
 {name:'policyNo',label:'Policy number',type:'text',ph:'Policy / member no.',value:hh.policyNo||''},
 {name:'emergencyName',label:'Emergency contact',type:'text',ph:'Full name',value:hh.emergencyName||''},
 {name:'emergencyRelation',label:'Contact relation',type:'text',ph:'e.g. Spouse, Father',value:hh.emergencyRelation||''},
 {name:'emergencyPhone',label:'Emergency phone',type:'text',ph:'Contact number',value:hh.emergencyPhone||''},
 {name:'organDonor',label:'Registered organ donor',type:'checkbox',value:!!hh.organDonor},
 {name:'notes',label:'Notes (optional)',type:'textarea',ph:'Anything important to know\u2026',value:hh.notes||''}
 ],save:function(v){ var mm=FD.getMember(ctx.memberId); if(!mm) return 'Member not found.'; FD.updateMember(ctx.memberId,{health:{heightCm:(v.heightCm||''),weightKg:(v.weightKg||''),doctor:(v.doctor||''),doctorPhone:(v.doctorPhone||''),clinic:(v.clinic||''),insurer:(v.insurer||''),policyNo:(v.policyNo||''),emergencyName:(v.emergencyName||''),emergencyRelation:(v.emergencyRelation||''),emergencyPhone:(v.emergencyPhone||''),organDonor:!!v.organDonor,notes:(v.notes||'')}}); }};}
 if(type==='appointment'){ var defM=(hMember&&FD.getMember(hMember))?hMember:((FD.data.members[0]||{}).id||''); return {title:'Add Appointment',submit:'Add',done:'Appointment added',fields:[
 {name:'member',label:'Who is it for',type:'memberselect',value:defM},
 {name:'apptType',label:'Type',type:'select',opts:APPT_TYPES},
 {name:'title',label:'Title',type:'text',ph:'e.g. Dentist check-up'},
 {name:'date',label:'Date & time',type:'datetime-local'},
 {name:'doctor',label:'Doctor / provider (optional)',type:'text',ph:'e.g. Dr. Smith'},
 {name:'location',label:'Location (optional)',type:'text',ph:'e.g. City Clinic'},
 {name:'notes',label:'Notes (optional)',type:'textarea',ph:'Reason, preparation, things to bring\u2026'}
 ],save:function(v){ if(!v.title) return 'Please enter a title.'; if(!v.date) return 'Please choose a date and time.'; FD.addEvent({kind:'appointment',category:'doctor',memberId:v.member||'',apptType:(v.apptType||'Appointment'),title:v.title,date:v.date,doctor:v.doctor||'',location:v.location||'',notes:v.notes||''}); }};}
 if(type==='editAppointment'){ var ap=FD.getEvent(ctx.eventId)||{}; var apd=ap.date||''; if(apd && apd.indexOf('T')<0) apd=apd+'T09:00'; return {title:'Edit Appointment',submit:'Save',done:'Appointment updated',fields:[
 {name:'member',label:'Who is it for',type:'memberselect',value:ap.memberId||''},
 {name:'apptType',label:'Type',type:'select',opts:APPT_TYPES,value:ap.apptType||'Appointment'},
 {name:'title',label:'Title',type:'text',value:ap.title||''},
 {name:'date',label:'Date & time',type:'datetime-local',value:apd},
 {name:'doctor',label:'Doctor / provider (optional)',type:'text',value:ap.doctor||''},
 {name:'location',label:'Location (optional)',type:'text',value:ap.location||''},
 {name:'notes',label:'Notes (optional)',type:'textarea',value:ap.notes||''}
 ],save:function(v){ if(!v.title) return 'Please enter a title.'; if(!v.date) return 'Please choose a date and time.'; FD.updateEvent(ctx.eventId,{memberId:v.member||'',apptType:(v.apptType||'Appointment'),title:v.title,date:v.date,doctor:v.doctor||'',location:v.location||'',notes:v.notes||''}); }};}
 if(type==='vital'){ var vt=ctx.vitalType||'weight'; return {title:'Add Reading',submit:'Save',done:'Reading saved',fields:[
 {name:'__v',label:'',type:'vitalfields',value:vt},
 {name:'vdate',label:'Date',type:'date',value:todayStr()},
 {name:'vnote',label:'Note (optional)',type:'text',ph:'e.g. after exercise, fasting\u2026'}
 ],save:function(v){ var tp=v.vtype||'weight'; var val=parseFloat(v.vvalue); if(isNaN(val)) return 'Please enter a number for the reading.'; var rec={type:tp,value:val,date:v.vdate||todayStr()}; if(tp==='bp'){ var dia=parseFloat(v.vdia); if(isNaN(dia)) return 'Please enter both numbers for blood pressure (e.g. 120 / 80).'; rec.value2=dia; } if(v.vnote) rec.note=v.vnote; FD.addSubItem(ctx.memberId,'vitals',rec); }};}
 if(type==='responsibility') return {title:'Add Responsibility',submit:'Add',done:'Responsibility added',fields:[
 {name:'title',label:'Duty',type:'text',ph:'e.g. Take out the bins'},
 {name:'assignee',label:'Assigned to',type:'assignee',value:''},
 {name:'frequency',label:'How often',type:'select',opts:['Once','Daily','Weekly','Monthly']},
 {name:'note',label:'Note (optional)',type:'text',ph:'e.g. Tuesday nights'}
 ],save:function(v){ if(!v.title) return 'Please enter a duty.'; FD.addResponsibility({title:v.title,assignee:v.assignee||'',frequency:(v.frequency||'Once').toLowerCase(),note:v.note||''}); }};
 if(type==='editResponsibility'){ var rr=FD.getResp(ctx.respId)||{}; return {title:'Edit Responsibility',submit:'Save',done:'Responsibility updated',fields:[
 {name:'title',label:'Duty',type:'text',value:rr.title||''},
 {name:'assignee',label:'Assigned to',type:'assignee',value:rr.assignee||''},
 {name:'frequency',label:'How often',type:'select',opts:['Once','Daily','Weekly','Monthly'],value:freqLabel(rr.frequency||'once')},
 {name:'note',label:'Note (optional)',type:'text',value:rr.note||''}
 ],save:function(v){ if(!v.title) return 'Please enter a duty.'; FD.updateResponsibility(ctx.respId,{title:v.title,assignee:v.assignee||'',frequency:(v.frequency||'Once').toLowerCase(),note:v.note||''}); }};}
 if(type==='document') return {title:'Add Document',submit:'Add',done:'Document saved',pending:{participants:[],attachments:[]},fields:[
 {name:'title',label:'Document',type:'text',ph:'e.g. Passport, Basma'},
 {name:'category',label:'Category',type:'doccat',value:'other'},
 {name:'owner',label:'Belongs to',type:'assignee',value:'',anyLabel:'Whole family'},
 {name:'expiry',label:'Expiry / renewal date (optional)',type:'date'},
 {name:'note',label:'Note (optional)',type:'textarea',ph:'Reference number, where the original is kept\u2026'},
 {name:'attachments',label:'Files',type:'attachments'}
 ],save:function(v){ if(!v.title) return 'Please enter a document name.'; FD.addDocument({title:v.title,category:v.category||'other',owner:v.owner||'',expiry:v.expiry||'',note:v.note||'',attachments:pendingAtts.slice()}); }};
 if(type==='editDocument'){ var dc=FD.getDoc(ctx.docId)||{}; return {title:'Edit Document',submit:'Save',done:'Document updated',pending:{participants:[],attachments:(dc.attachments||[]).slice()},fields:[
 {name:'title',label:'Document',type:'text',value:dc.title||''},
 {name:'category',label:'Category',type:'doccat',value:dc.category||'other'},
 {name:'owner',label:'Belongs to',type:'assignee',value:dc.owner||'',anyLabel:'Whole family'},
 {name:'expiry',label:'Expiry / renewal date (optional)',type:'date',value:dc.expiry||''},
 {name:'note',label:'Note (optional)',type:'textarea',value:dc.note||''},
 {name:'attachments',label:'Files',type:'attachments'}
 ],save:function(v){ if(!v.title) return 'Please enter a document name.'; FD.updateDocument(ctx.docId,{title:v.title,category:v.category||'other',owner:v.owner||'',expiry:v.expiry||'',note:v.note||'',attachments:pendingAtts.slice()}); }};}
 if(type==='transaction') return {title:'Add Transaction',submit:'Add',done:'Transaction added',fields:[
 {name:'txtype',label:'Type',type:'txtype',value:'expense'},
 {name:'category',label:'Category',type:'txcat',txtype:'expense',value:'groceries'},
 {name:'member',label:'For (optional)',type:'select',opts:journalWhoOpts()},
 {name:'amount',label:'Amount ('+FD.data.finance.currency+')',type:'number',ph:'0.00'},
 {name:'member',label:'Who',type:'assignee',value:(ctx&&ctx.memberId)?ctx.memberId:'',anyLabel:'Whole household'},
 {name:'date',label:'Date',type:'date',value:todayStr()},
 {name:'note',label:'Note (optional)',type:'text',ph:'e.g. weekly shop'}
 ],save:function(v){ var amt=parseFloat(v.amount); if(isNaN(amt)||amt<=0) return 'Please enter an amount greater than zero.'; FD.addTx({type:v.txtype||'expense',category:v.category||'other',amount:amt,member:v.member||'',member:v.member||'',date:v.date||todayStr(),note:v.note||''}); }};
 if(type==='editTransaction'){ var tt=FD.getTx(ctx.txId)||{}; return {title:'Edit Transaction',submit:'Save',done:'Transaction updated',fields:[
 {name:'txtype',label:'Type',type:'txtype',value:tt.type||'expense'},
 {name:'category',label:'Category',type:'txcat',txtype:tt.type||'expense',value:tt.category||''},
 {name:'amount',label:'Amount ('+FD.data.finance.currency+')',type:'number',value:tt.amount||''},
 {name:'member',label:'Who',type:'assignee',value:tt.member||'',anyLabel:'Whole household'},
 {name:'date',label:'Date',type:'date',value:tt.date||todayStr()},
 {name:'note',label:'Note (optional)',type:'text',value:tt.note||''}
 ],save:function(v){ var amt=parseFloat(v.amount); if(isNaN(amt)||amt<=0) return 'Please enter an amount greater than zero.'; FD.updateTx(ctx.txId,{type:v.txtype||'expense',category:v.category||'other',amount:amt,member:v.member||'',date:v.date||todayStr(),note:v.note||''}); }};}
 if(type==='budget'){ var preCat=(ctx&&ctx.cat)?ctx.cat:'groceries'; if(preCat==='__new__') preCat='__newfincat__'; var has=(preCat!=='__newfincat__')&&!!FD.data.finance.budgets[preCat]; return {title:(has?'Edit Budget':'Set Budget'),submit:'Save',done:'Budget saved',fields:[
 {name:'category',label:'Category',type:'budgetcat',value:preCat},
 {name:'amount',label:'Monthly limit ('+FD.data.finance.currency+')',type:'number',value:(preCat!=='__newfincat__'?(FD.data.finance.budgets[preCat]||''):''),ph:'0.00'}
 ],save:function(v){ var amt=parseFloat(v.amount); if(isNaN(amt)||amt<0) return 'Please enter a valid amount.'; var catKey=v.category; if(catKey==='__newfincat__'){ var nm=(v.newFinCatName||'').trim(); if(!nm) return 'Please name your new category.'; catKey=FD.addFinCat(nm,v.newFinCatColor||'#1E3A7B'); } FD.setBudget(catKey,amt); }};}
 if(type==='planned'||type==='editPlanned'){ var ped=(type==='editPlanned'); var pp=ped?(FD.getPlanned(ctx&&ctx.planId)||{}):{}; var ptp=pp.type||'expense'; return {title:(ped?'Edit Planned Payment':'New Planned Payment'),submit:(ped?'Save':'Add'),done:'Saved',fields:[
 {name:'txtype',label:'Type',type:'txtype',value:ptp},
 {name:'title',label:'Name',type:'text',value:pp.title||'',ph:'e.g. Rent, Netflix, Salary'},
 {name:'amount',label:'Amount',type:'number',value:(pp.amount||''),ph:'0.00'},
 {name:'category',label:'Category',type:'txcat',txtype:ptp,value:pp.category||''},
 {name:'member',label:'Who',type:'assignee',value:pp.member||'',anyLabel:'Whole household'},
 {name:'frequency',label:'Repeats',type:'planfreq',value:pp.frequency||'monthly'},
 {name:'nextDue',label:'Next due date',type:'date',value:pp.nextDue||todayStr()},
 {name:'note',label:'Note (optional)',type:'text',value:pp.note||'',ph:''}
 ],save:function(v){ if(!v.title||!v.title.trim()) return 'Please give it a name.'; var amt=parseFloat(v.amount); if(isNaN(amt)||amt<=0) return 'Please enter an amount greater than zero.'; var obj={type:v.txtype||'expense',title:v.title.trim(),amount:amt,category:v.category||'other',member:v.member||'',frequency:v.frequency||'monthly',nextDue:v.nextDue||todayStr(),note:v.note||''}; if(ped){ FD.updatePlanned(ctx.planId,obj); } else { FD.addPlanned(obj); } }};}
 if(type==='debt'||type==='editDebt'){ var ded=(type==='editDebt'); var dd=ded?(FD.getDebt(ctx&&ctx.debtId)||{}):{}; return {title:(ded?'Edit Debt':'Record a Debt'),submit:(ded?'Save':'Add'),done:'Saved',fields:[
 {name:'direction',label:'Type',type:'debtdir',value:dd.direction||'owed_to_us'},
 {name:'person',label:'Person',type:'text',value:dd.person||'',ph:'e.g. Karim, City Bank'},
 {name:'amount',label:'Amount',type:'number',value:(dd.amount||''),ph:'0.00'},
 {name:'paid',label:'Already paid back (optional)',type:'number',value:(dd.paid||''),ph:'0.00'},
 {name:'member',label:'Linked to',type:'assignee',value:dd.member||'',anyLabel:'Whole household'},
 {name:'dueDate',label:'Due date (optional)',type:'date',value:dd.dueDate||''},
 {name:'note',label:'Note (optional)',type:'text',value:dd.note||'',ph:''}
 ],save:function(v){ if(!v.person||!v.person.trim()) return 'Please enter who the debt is with.'; var amt=parseFloat(v.amount); if(isNaN(amt)||amt<=0) return 'Please enter an amount greater than zero.'; var paid=parseFloat(v.paid); if(isNaN(paid)||paid<0) paid=0; if(paid>amt) paid=amt; var obj={direction:v.direction||'owed_to_us',person:v.person.trim(),amount:amt,paid:paid,member:v.member||'',dueDate:v.dueDate||'',note:v.note||''}; if(ded){ FD.updateDebt(ctx.debtId,obj); } else { FD.addDebt(obj); } }};}
 if(type==='debtPay'){ var dpd=FD.getDebt(ctx&&ctx.debtId)||{}; var drem=(Number(dpd.amount)||0)-(Number(dpd.paid)||0); return {title:'Add Payment',submit:'Add',done:'Payment added',fields:[
 {name:'amount',label:'Payment amount ('+FD.data.finance.currency+')',type:'number',value:'',ph:(drem>0?String(drem):'0.00')}
 ],save:function(v){ var amt=parseFloat(v.amount); if(isNaN(amt)||amt<=0) return 'Please enter an amount greater than zero.'; FD.payDebt(ctx.debtId,amt); }};}
 if(type==='saving'||type==='editSaving'){ var sed=(type==='editSaving'); var sg=sed?(FD.getSaving(ctx&&ctx.saveId)||{}):{}; return {title:(sed?'Edit Savings Goal':'New Savings Goal'),submit:(sed?'Save':'Add'),done:'Saved',fields:[
 {name:'title',label:'Goal name',type:'text',value:sg.title||'',ph:'e.g. Emergency Fund, Hajj, New Car'},
 {name:'target',label:'Target amount',type:'number',value:(sg.target||''),ph:'0.00'},
 {name:'saved',label:'Saved so far (optional)',type:'number',value:(sg.saved||''),ph:'0.00'},
 {name:'member',label:'For',type:'assignee',value:sg.member||'',anyLabel:'Whole household'},
 {name:'targetDate',label:'Target date (optional)',type:'date',value:sg.targetDate||''},
 {name:'note',label:'Note (optional)',type:'text',value:sg.note||'',ph:''}
 ],save:function(v){ if(!v.title||!v.title.trim()) return 'Please name your goal.'; var tgt=parseFloat(v.target); if(isNaN(tgt)||tgt<=0) return 'Please enter a target greater than zero.'; var sv=parseFloat(v.saved); if(isNaN(sv)||sv<0) sv=0; var obj={title:v.title.trim(),target:tgt,saved:sv,member:v.member||'',targetDate:v.targetDate||'',note:v.note||''}; if(sed){ FD.updateSaving(ctx.saveId,obj); } else { FD.addSaving(obj); } }};}
 if(type==='saveContribute'){ var scg=FD.getSaving(ctx&&ctx.saveId)||{}; var srem=(Number(scg.target)||0)-(Number(scg.saved)||0); return {title:'Add to '+(scg.title||'goal'),submit:'Add',done:'Added',fields:[
 {name:'amount',label:'Amount to add ('+FD.data.finance.currency+')',type:'number',value:'',ph:(srem>0?String(srem):'0.00')}
 ],save:function(v){ var amt=parseFloat(v.amount); if(isNaN(amt)||amt<=0) return 'Please enter an amount greater than zero.'; FD.contributeSaving(ctx.saveId,amt); }};}
 return null;
 }
 function fieldHTML(f){
 var inner;
 if(f.type==='select') inner='<select name="'+f.name+'">'+f.opts.map(function(o){ var val=(o==='Not set'?'':o); var sel=(f.value!=null && String(f.value)===String(val))?' selected':''; return '<option value="'+esc(val)+'"'+sel+'>'+esc(o)+'</option>'; }).join('')+'</select>';
 else if(f.type==='textarea') inner='<textarea name="'+f.name+'" placeholder="'+esc(f.ph||'')+'">'+esc(f.value||'')+'</textarea>';
 else if(f.type==='subtasks'){
 var _arr=Array.isArray(f.value)?f.value:[];
 var _rows=_arr.map(function(s,i){ return '<div class="stw__row'+(s.done?' is-done':'')+'" data-stw-row="'+i+'"><button type="button" class="stw__chk" data-stw-toggle="'+i+'"><span class="stw__box"></span></button><input class="stw__in" data-stw-text="'+i+'" value="'+esc(s.t||'')+'" placeholder="Sub-task"><button type="button" class="stw__del" data-stw-del="'+i+'" aria-label="Remove"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>'; }).join('');
 inner='<div class="stw" data-stw><input type="hidden" name="'+f.name+'" data-stw-val>'+'<div class="stw__list" data-stw-list>'+_rows+'</div>'+'<button type="button" class="stw__add" data-stw-add><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add a sub-task</button></div>';
 }
 else if(f.type==='range') inner='<div class="range-row"><input type="range" name="'+f.name+'" min="'+(f.min||0)+'" max="'+(f.max||100)+'" value="'+(f.val||0)+'"><span class="range-val">'+(f.val||0)+'%</span></div>';
 else if(f.type==='number') inner='<input type="number" inputmode="decimal" step="any" min="0" name="'+f.name+'" placeholder="'+esc(f.ph||'')+'" value="'+esc(f.value||'')+'">';
 else if(f.type==='photo'){ var prev=f.value?('<img src="'+f.value+'">'):('<span class="photo-empty">'+(esc(f.ini||'')||'No photo')+'</span>'); inner='<div class="photopick"><div class="photopick__prev" id="photoPrev">'+prev+'</div><div class="photopick__btns"><label class="btn photopick__choose">Choose photo<input type="file" accept="image/*" id="photoInput" hidden></label>'+(f.value?'<button type="button" class="btn" data-photo-remove>Remove</button>':'')+'</div></div>'; }
 else if(f.type==='checkbox'){ return '<label class="fld fld--check"><input type="checkbox" name="'+f.name+'"'+(f.value?' checked':'')+'><span class="fld__cklabel">'+esc(f.label)+'</span></label>'; }
 else if(f.type==='participants'){ inner = FD.data.members.length ? ('<div class="chooser">'+FD.data.members.map(function(m){ var on=pendingParticipants.indexOf(m.id)>=0; return '<button type="button" class="chooser__item'+(on?' is-on':'')+'" data-participant="'+m.id+'"><span class="chooser__av" style="background:'+colorFor(m)+'">'+esc(initials(m.name))+'</span><span class="chooser__nm">'+esc(m.name)+'</span><svg class="ico chooser__chk" viewBox="0 0 24 24"><path d="M5 12.5l4 4 10-10"/></svg></button>';}).join('')+'</div>') : '<p class="chooser__empty">Add family members first to invite them.</p>'; }
 else if(f.type==='debtdir'){ var ddv=f.value||'owed_to_us'; inner='<select name="direction" id="debtDirSel"><option value="owed_to_us"'+(ddv==='owed_to_us'?' selected':'')+'>They owe us</option><option value="we_owe"'+(ddv==='we_owe'?' selected':'')+'>We owe them</option></select>'; }
 else if(f.type==='planfreq'){ var pfv=f.value||'monthly'; inner='<select name="frequency" id="planFreqSel">'+[['weekly','Weekly'],['monthly','Monthly'],['yearly','Yearly']].map(function(o){ return '<option value="'+o[0]+'"'+(o[0]===pfv?' selected':'')+'>'+o[1]+'</option>'; }).join('')+'</select>'; }
 else if(f.type==='budgetcat'){ var bcats=EXP_CATS.concat(finCustomCats()); var isNew=(f.value==='__newfincat__'); var bopts=bcats.map(function(c){ return '<option value="'+c.key+'"'+((!isNew&&c.key===f.value)?' selected':'')+'>'+esc(c.label)+'</option>'; }).join('')+'<option value="__newfincat__"'+(isNew?' selected':'')+'>\u002B New category\u2026</option>'; var isCust=finCustomCats().some(function(c){return c.key===f.value;}); inner='<select name="category" id="budgetCatSel">'+bopts+'</select><div class="newcat" id="finNewCatBox"'+(isNew?'':' hidden')+'><input type="text" name="newFinCatName" class="newcat__name" placeholder="Name your category" maxlength="28"><input type="color" name="newFinCatColor" class="newcat__color" value="#1E3A7B" aria-label="Pick a colour"></div><button type="button" class="cat-del" id="finCatDelBtn" data-fincatdel="'+(isCust?f.value:'')+'"'+(isCust?'':' hidden')+'><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>Delete this category</button>'; }
 else if(f.type==='txtype'){ var tv=f.value||'expense'; inner='<select name="txtype" id="txTypeSel"><option value="expense"'+(tv==='expense'?' selected':'')+'>Expense</option><option value="income"'+(tv==='income'?' selected':'')+'>Income</option></select>'; }
 else if(f.type==='txcat'){ var tcp=f.txtype||'expense', tcv=f.value||''; inner='<select name="category" id="txCatSel">'+catsFor(tcp).map(function(c){ return '<option value="'+c.key+'"'+(c.key===tcv?' selected':'')+'>'+esc(c.label)+'</option>'; }).join('')+'</select>'; }
 else if(f.type==='assignee'){ var anyLab=f.anyLabel||'Anyone in the family'; var ao='<option value=""'+((!f.value)?' selected':'')+'>'+esc(anyLab)+'</option>'+FD.data.members.map(function(m){ return '<option value="'+m.id+'"'+(String(f.value)===String(m.id)?' selected':'')+'>'+esc(m.name)+'</option>'; }).join(''); inner='<select name="'+f.name+'">'+ao+'</select>'; }
 else if(f.type==='doccat'){ inner='<select name="category">'+DOC_CATS.map(function(c){ return '<option value="'+c.key+'"'+(f.value===c.key?' selected':'')+'>'+esc(c.label)+'</option>'; }).join('')+'</select>'; }
 else if(f.type==='memberselect'){ inner = FD.data.members.length ? ('<select name="'+f.name+'">'+FD.data.members.map(function(m){ var sel=(String(f.value)===String(m.id))?' selected':''; return '<option value="'+m.id+'"'+sel+'>'+esc(m.name)+'</option>'; }).join('')+'</select>') : '<input type="text" value="No members yet" disabled>'; }
 else if(f.type==='vitalfields'){ var vt=f.value||'weight'; var meta=vitalMeta(vt); var isBP=(vt==='bp'); var sel='<select name="vtype" id="vitalTypeSel">'+VITAL_TYPES.map(function(t){ return '<option value="'+t.key+'"'+(t.key===vt?' selected':'')+'>'+esc(t.label)+'</option>'; }).join('')+'</select>'; return '<div class="fld"><label>Measurement</label>'+sel+'</div><div class="vfrow"><div class="fld vfrow__main"><label id="vValLabel">'+(isBP?'Systolic':'Reading')+'</label><input type="number" inputmode="decimal" step="any" name="vvalue" placeholder="0"></div><div class="fld vfrow__dia" id="vDiaWrap"'+(isBP?'':' hidden')+'><label>Diastolic</label><input type="number" inputmode="decimal" step="any" name="vdia" placeholder="0"></div><div class="vfrow__unit"><span class="vfrow__unitlab">Unit</span><span id="vUnit">'+esc(meta.unit)+'</span></div></div>'; }
 else if(f.type==='goaltype'){ return '<div class="fld"><label>Category</label><select name="type" id="goalTypeSelect">'+GOAL_TYPE_LABELS.map(function(o){ return '<option'+(f.value===o?' selected':'')+'>'+esc(o)+'</option>'; }).join('')+'</select></div><div id="goalTypeFields">'+goalFieldsHTML(f.typeKey,f.goal)+'</div>'; }
 else if(f.type==='category'){ var copts=catOptionLabels().concat([NEW_CAT_OPT]); var csel='<select name="category" id="catSelect">'+copts.map(function(o){ var csl=(f.value!=null && String(f.value)===String(o))?' selected':''; return '<option'+csl+'>'+esc(o)+'</option>'; }).join('')+'</select>'; var show=(f.value===NEW_CAT_OPT); var isCustom=(FD.data.customCategories||[]).some(function(c){return c.label===f.value;}); inner=csel+'<div class="newcat" id="newCatBox"'+(show?'':' hidden')+'><input type="text" name="newCatName" class="newcat__name" placeholder="Name your category" maxlength="32"><input type="color" name="newCatColor" class="newcat__color" value="#1E3A7B" aria-label="Pick a colour"></div><button type="button" class="cat-del" id="catDelBtn" data-catdel'+(isCustom?'':' hidden')+'><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>Delete this category</button>'; }
 else if(f.type==='attachments'){ inner='<div class="attwrap"><div class="attlist" id="attList">'+attChipsHTML()+'</div><label class="btn att-add"><svg class="ico" viewBox="0 0 24 24"><path d="M16 7l-6.5 6.5a2.5 2.5 0 0 0 3.5 3.5L20 10a4.5 4.5 0 0 0-6.4-6.4L6 11.2a6.5 6.5 0 0 0 9.2 9.2L21 14.6"/></svg>Attach files<input type="file" id="attInput" multiple hidden></label><span class="att-hint">Images, PDFs and documents. Photos are compressed automatically.</span></div>'; }
 else inner='<input type="'+f.type+'" name="'+f.name+'" placeholder="'+esc(f.ph||'')+'" value="'+esc(f.value||'')+'">';
 return '<div class="fld"><label>'+esc(f.label)+'</label>'+inner+'</div>';
 }
 var modalCfg=null, modalCtx={}, pendingPhoto, currentMemberId=null, pendingParticipants=[], pendingAtts=[];
 /* ---- body scroll lock (fixes background scrolling behind overlays) ---- */
 var _lockSrc={};
 function _anyLock(){ for(var k in _lockSrc){ if(_lockSrc[k]) return true; } return false; }
 function lockScroll(src){
  _lockSrc[src]=true;
  document.documentElement.classList.add('is-locked');
  document.body.classList.add('is-locked');
 }
 function unlockScroll(src){
  _lockSrc[src]=false;
  if(_anyLock()) return;
  document.documentElement.classList.remove('is-locked');
  document.body.classList.remove('is-locked');
 }
 /* every modal opens through here: closes project overlays, locks the page */
 function pjKillDrawer(){
  var s=document.getElementById('pjScrim'), d=document.getElementById('pjDrawer');
  if(s&&s.parentNode) s.parentNode.removeChild(s);
  if(d&&d.parentNode) d.parentNode.removeChild(d);
  if(pjDrawerId){ pjDrawerId=''; unlockScroll('drawer'); }
 }
 function pjModalShow(){
  lockScroll('modal');
  try{ pjCloseMenu(); }catch(e){}
  try{ pjKillDrawer(); }catch(e){}
  $('#modal').classList.add('open');
 }
 function openModal(type,ctx){
 ctx=ctx||{};
 var cfg=modalConfig(type,ctx); if(!cfg) return; modalCfg=cfg; modalCtx=ctx; pendingPhoto=undefined;
 pendingParticipants = cfg.pending ? cfg.pending.participants.slice() : [];
 pendingAtts = cfg.pending ? cfg.pending.attachments.slice() : [];
 var h='<div class="modal__head"><span class="modal__ico">'+(MODAL_ICON[type]||'')+'</span><h3 class="modal__title" id="modalTitle">'+esc(cfg.title)+'</h3><button class="modal__close" data-modal-close aria-label="Close"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>';
 h+='<div id="modalForm">'+cfg.fields.map(fieldHTML).join('')+'</div>';
 h+='<div class="modal__actions"><button class="btn" data-modal-close>Cancel</button><button class="btn btn--primary" id="modalSubmit">'+esc(cfg.submit)+'</button></div>';
 var dlg=$('#modalDialog'); dlg.innerHTML=h;
 pjModalShow();
 var rng=dlg.querySelector('input[type=range]'); if(rng) rng.addEventListener('input',function(){ var s=this.parentNode.querySelector('.range-val'); if(s) s.textContent=this.value+'%'; });
 var pin=dlg.querySelector('#photoInput'); if(pin) pin.addEventListener('change',function(){ var file=this.files&&this.files[0]; if(!file) return; var _rd=new FileReader(); _rd.onload=function(){ cropOpen(_rd.result, 1.5, function(durl){ pendingPhoto=durl; var pv=$('#photoPrev'); if(pv) pv.innerHTML='<img src="'+durl+'">'; if(typeof flash==='function') flash('Picture ready'); }); }; _rd.onerror=function(){ if(typeof flash==='function') flash('Could not read that picture'); }; _rd.readAsDataURL(file); });
 var ain=dlg.querySelector('#attInput'); if(ain) ain.addEventListener('change',function(){ var files=this.files; if(!files||!files.length) return; addAttachments(files); this.value=''; });
 var csel=dlg.querySelector('#catSelect'); if(csel) csel.addEventListener('change',function(){ var val=this.value; var box=dlg.querySelector('#newCatBox'); var on=(val===NEW_CAT_OPT); if(box){ box.hidden=!on; if(on){ var ni=box.querySelector('.newcat__name'); if(ni) ni.focus(); } } var del=dlg.querySelector('#catDelBtn'); if(del){ del.hidden=!(FD.data.customCategories||[]).some(function(c){return c.label===val;}); } });
 var bcs=dlg.querySelector('#budgetCatSel'); if(bcs) bcs.addEventListener('change',function(){ var val=this.value, isNew=(val==='__newfincat__'); var nb=dlg.querySelector('#finNewCatBox'); if(nb){ nb.hidden=!isNew; if(isNew){ var ni=nb.querySelector('.newcat__name'); if(ni) ni.focus(); } } var amtIn=dlg.querySelector('[name="amount"]'); if(amtIn&&!isNew){ var b=FD.data.finance.budgets[val]; amtIn.value=b?b:''; } var dn=dlg.querySelector('#finCatDelBtn'); if(dn){ var ic=finCustomCats().some(function(c){return c.key===val;}); dn.hidden=!ic; dn.setAttribute('data-fincatdel', ic?val:''); } });
 var tts=dlg.querySelector('#txTypeSel'); if(tts) tts.addEventListener('change',function(){ var cs=dlg.querySelector('#txCatSel'); if(cs){ cs.innerHTML=catsFor(this.value).map(function(c){ return '<option value="'+c.key+'">'+esc(c.label)+'</option>'; }).join(''); } });
 var vts=dlg.querySelector('#vitalTypeSel'); if(vts) vts.addEventListener('change',function(){ var meta=vitalMeta(this.value); var isBP=(this.value==='bp'); var dw=dlg.querySelector('#vDiaWrap'); if(dw) dw.hidden=!isBP; var vl=dlg.querySelector('#vValLabel'); if(vl) vl.textContent=isBP?'Systolic':'Reading'; var u=dlg.querySelector('#vUnit'); if(u) u.textContent=meta.unit; });
 var gts=dlg.querySelector('#goalTypeSelect'); if(gts) gts.addEventListener('change',function(){ goalModalTypeKey=goalTypeKey(this.value); var c=dlg.querySelector('#goalTypeFields'); if(c){ c.innerHTML=goalFieldsHTML(goalModalTypeKey,null); var rng=c.querySelector('input[type=range]'); if(rng) rng.addEventListener('input',function(){ var s=this.parentNode.querySelector('.range-val'); if(s) s.textContent=this.value+'%'; }); } });
 (function(){
 var wrap=dlg.querySelector('[data-stw]'); if(!wrap) return;
 var hidden=wrap.querySelector('[data-stw-val]'), list=wrap.querySelector('[data-stw-list]');
 function read(){ var out=[]; wrap.querySelectorAll('[data-stw-row]').forEach(function(row){ var t=row.querySelector('[data-stw-text]').value.trim(); if(!t) return; out.push({t:t,done:row.classList.contains('is-done')}); }); return out; }
 function sync(){ hidden.value=JSON.stringify(read()); }
 function addRow(t,done){
 var i=Date.now()+Math.floor(Math.random()*999);
 var div=document.createElement('div'); div.className='stw__row'+(done?' is-done':''); div.setAttribute('data-stw-row',i);
 div.innerHTML='<button type="button" class="stw__chk" data-stw-toggle="'+i+'"><span class="stw__box"></span></button><input class="stw__in" data-stw-text="'+i+'" placeholder="Sub-task"><button type="button" class="stw__del" data-stw-del="'+i+'" aria-label="Remove"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>';
 list.appendChild(div); div.querySelector('[data-stw-text]').value=t||'';
 if(!t) div.querySelector('[data-stw-text]').focus();
 sync();
 }
 wrap.addEventListener('click',function(e){
 var tg=e.target.closest('[data-stw-toggle]'); if(tg){ tg.closest('[data-stw-row]').classList.toggle('is-done'); sync(); return; }
 var dl=e.target.closest('[data-stw-del]'); if(dl){ dl.closest('[data-stw-row]').remove(); sync(); return; }
 var ad=e.target.closest('[data-stw-add]'); if(ad){ addRow('',false); return; }
 });
 wrap.addEventListener('input',function(e){ if(e.target.closest('[data-stw-text]')) sync(); });
 wrap.addEventListener('keydown',function(e){ if(e.key==='Enter' && e.target.closest('[data-stw-text]')){ e.preventDefault(); addRow('',false); } });
 sync();
 })();
 dlg.onkeydown=function(e){ if(e.key==='Enter' && e.target.tagName!=='TEXTAREA' && e.target.type!=='checkbox' && !e.target.closest('[data-stw]')){ e.preventDefault(); submitModal(); } };
 setTimeout(function(){ var f=dlg.querySelector('input:not([type=file]):not([type=checkbox]),select,textarea'); if(f) f.focus(); },50);
 }
 function closeModal(){ $('#modal').classList.remove('open'); $('#modalDialog').innerHTML=''; modalCfg=null; unlockScroll('modal'); }
 function clearFieldErrors(){
 $$('#modalForm .fld--err').forEach(function(f){ f.classList.remove('fld--err'); });
 $$('#modalForm .fld__err').forEach(function(e){ e.remove(); });
 $$('#modalForm [aria-invalid]').forEach(function(i){ i.removeAttribute('aria-invalid'); i.removeAttribute('aria-describedby'); });
 }
 function showInlineError(msg){
 var els=$$('#modalForm [name]'), target=null;
 for(var i=0;i<els.length;i++){
 var el=els[i], t=(el.type||'').toLowerCase();
 if(t==='checkbox'||t==='file'||t==='range'||t==='hidden') continue;
 var val=(typeof el.value==='string')?el.value.trim():el.value;
 if(val===''||val==null){ target=el; break; }
 }
 if(!target) return false;
 var fld=target.closest? target.closest('.fld'):null; if(!fld) return false;
 fld.classList.add('fld--err');
 var id='fldErr-'+(target.getAttribute('name')||'x');
 var e=document.createElement('div'); e.className='fld__err'; e.id=id;
 e.innerHTML='<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.6"/><circle cx="12" cy="15.8" r=".9" fill="currentColor" stroke="none"/></svg>'+esc(msg);
 fld.appendChild(e);
 target.setAttribute('aria-invalid','true'); target.setAttribute('aria-describedby',id);
 try{ target.focus(); }catch(er){}
 return true;
 }
 function modalErrClear(e){ var f=(e.target&&e.target.closest)? e.target.closest('.fld--err'):null; if(!f) return; f.classList.remove('fld--err'); var er=f.querySelector('.fld__err'); if(er) er.remove(); if(e.target.removeAttribute){ e.target.removeAttribute('aria-invalid'); e.target.removeAttribute('aria-describedby'); } }
 (function(){ var d=document.getElementById('modalDialog'); if(d&&d.addEventListener){ d.addEventListener('input',modalErrClear); d.addEventListener('change',modalErrClear); } })();
 function submitModal(){
 if(!modalCfg) return;
 clearFieldErrors();
 var v={}; $$('#modalForm [name]').forEach(function(el){ v[el.getAttribute('name')] = (el.type==='checkbox') ? el.checked : ((typeof el.value==='string')?el.value.trim():el.value); });
 var err=modalCfg.save(v); if(err){ if(!showInlineError(err)) flash(err); return; }
 var done=modalCfg.done, ctx=modalCtx; closeModal(); refreshAll(ctx); flash(done);
 }

 /* ===================== MEMBERS PAGE ===================== */
 var RELATIONS=['Not set','Parent','Partner','Child','Grandparent','Sibling','Other'];
 var BLOODS=['Not set','A+','A-','B+','B-','AB+','AB-','O+','O-'];
 function ageOf(m){ if(!m.birthday) return null; var p=String(m.birthday).split('-'); if(p.length<3) return null; var b=new Date(parseInt(p[0],10),parseInt(p[1],10)-1,parseInt(p[2],10)); if(isNaN(b)) return null; var t=new Date(); var a=t.getFullYear()-b.getFullYear(); var mo=t.getMonth()-b.getMonth(); if(mo<0||(mo===0&&t.getDate()<b.getDate())) a--; return (a>=0&&a<200)?a:null; }
 function ovDate(b){ if(!b) return ''; var p=String(b).split('-'); if(p.length<3) return ''; return parseInt(p[2],10)+' '+MON[parseInt(p[1],10)-1]+' '+p[0]; }
 function money(n){ n=Number(n)||0; return n.toLocaleString(undefined,{maximumFractionDigits:2}); }
 /* Downscale in halving steps with high smoothing. A single big jump
    (4000px -> 1280px) is what made saved pictures look soft. */
 function imgScaled(img, maxSide){
   var w=img.width, h=img.height;
   var sc=Math.min(1, maxSide/Math.max(w,h));
   var cw=Math.max(1,Math.round(w*sc)), ch=Math.max(1,Math.round(h*sc));
   var src=img, sw=w, sh=h;
   while(sw*0.5 > cw && sh*0.5 > ch){
     var half=document.createElement('canvas');
     half.width=Math.round(sw*0.5); half.height=Math.round(sh*0.5);
     var hx=half.getContext('2d');
     hx.imageSmoothingEnabled=true; hx.imageSmoothingQuality='high';
     hx.drawImage(src,0,0,half.width,half.height);
     src=half; sw=half.width; sh=half.height;
   }
   var cv=document.createElement('canvas'); cv.width=cw; cv.height=ch;
   var cx=cv.getContext('2d');
   cx.imageSmoothingEnabled=true; cx.imageSmoothingQuality='high';
   cx.drawImage(src,0,0,cw,ch);
   return cv;
 }
 function processImage(file,cb){
 var reader=new FileReader();
 reader.onload=function(){ var img=new Image(); img.onload=function(){ var w=img.width,h=img.height,side=Math.min(w,h),sx=(w-side)/2,sy=(h-side)/2; var sq=document.createElement('canvas'); sq.width=side; sq.height=side; var s2=sq.getContext('2d'); s2.imageSmoothingEnabled=true; s2.imageSmoothingQuality='high'; s2.drawImage(img,sx,sy,side,side,0,0,side,side); var cv=imgScaled(sq,512); try{ cb(cv.toDataURL('image/jpeg',0.92)); }catch(e){ cb(null); } }; img.onerror=function(){ cb(null); }; img.src=reader.result; };
 reader.onerror=function(){ cb(null); };
 reader.readAsDataURL(file);
 }
 function avatarHTML(m,cls){ return m.photo?('<img src="'+m.photo+'" alt="">'):('<span class="'+cls+'" style="background:'+colorFor(m)+'">'+esc(initials(m.name))+'</span>'); }
 function xbtn(mid,key,id){ return '<button class="lrow__x" data-del data-mid="'+mid+'" data-key="'+key+'" data-id="'+id+'" aria-label="Remove"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>'; }
 function secCard(icon,title,mid,modal,body,meta){ return '<div class="seccard"><div class="sec__head"><span class="sec__ico">'+icon+'</span><h4 class="sec__title">'+title+'</h4>'+(meta||'')+'<button class="sec__add" data-modal="'+modal+'" data-mid="'+mid+'" aria-label="Add"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button></div><div class="sec__body">'+body+'</div></div>'; }

 function renderMembersList(){
 var host=$('#membersList'); if(!host) return;
 var d=FD.data;
 var add='<button class="btn btn--primary" data-modal="member"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add member</button><button class="btn btn--soft" type="button" data-invite-mem><svg class="ico" viewBox="0 0 24 24"><path d="M4 7.5 12 13l8-5.5"/><rect x="4" y="5.5" width="16" height="13" rx="2.5"/></svg>Invite by email</button>';
 var head='<div class="mlist__head"><span class="eyebrow">'+d.members.length+' '+(d.members.length===1?'member':'members')+'</span>'+add+'</div>';
 if(!d.members.length){ host.innerHTML=head+'<div class="mempty"><svg class="ico" viewBox="0 0 24 24"><circle cx="9" cy="8" r="2.7"/><path d="M4.4 19c0-2.85 2.05-4.6 4.6-4.6s4.6 1.75 4.6 4.6"/><circle cx="16.6" cy="9.4" r="2"/><path d="M14.6 19c.15-1.95 1-3.3 2.6-3.3 1.45 0 2.35.95 2.6 2.4"/></svg><p>No members yet. Add everyone in your family to start building their profiles.</p><button data-modal="member">Add your first member</button></div>'; return; }
 var cards=d.members.map(function(m){ var age=ageOf(m); var meta=[]; if(m.relation) meta.push(esc(m.relation)); if(age!=null) meta.push(age+' yrs'); if(m.bloodGroup) meta.push(esc(m.bloodGroup)); return '<button class="mcard" data-member="'+m.id+'"><span class="mcard__av">'+avatarHTML(m,'mcard__ini')+'</span><span class="mcard__body"><span class="mcard__name">'+esc(m.name)+'</span><span class="mcard__meta">'+(meta.join(' \u00b7 ')||'Tap to add details')+'</span></span><svg class="ico ico-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>'; }).join('');
 host.innerHTML=head+'<div class="mgrid">'+cards+'</div>';
 }

 function renderMemberDetail(id){
 var host=$('#memberDetail'); var m=FD.getMember(id); if(!host||!m){ showMembersList(); return; }
 var age=ageOf(m);
 var ov='';
 ov+='<span class="ovchip"><span class="ovchip__k">Relation</span><span class="ovchip__v">'+(m.relation?esc(m.relation):'\u2014')+'</span></span>';
 ov+='<span class="ovchip"><span class="ovchip__k">Age</span><span class="ovchip__v">'+(age!=null?age:'\u2014')+'</span></span>';
 ov+='<span class="ovchip"><span class="ovchip__k">Blood</span><span class="ovchip__v">'+(m.bloodGroup?esc(m.bloodGroup):'\u2014')+'</span></span>';
 ov+='<span class="ovchip"><span class="ovchip__k">Birthday</span><span class="ovchip__v">'+(m.birthday?ovDate(m.birthday).replace(/ \d{4}$/,''):'\u2014')+'</span></span>';
 var I=MODAL_ICON;
 var aBody=m.allergies.length?('<div class="chiplist">'+m.allergies.map(function(a){return '<span class="dchip">'+esc(a.text)+'<button class="dchip__x" data-del data-mid="'+m.id+'" data-key="allergies" data-id="'+a.id+'" aria-label="Remove"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></span>';}).join('')+'</div>'):'<p class="sec__empty">No allergies recorded.</p>';
 var medBody=m.medications.length?m.medications.map(function(x){return '<div class="lrow"><div class="lrow__main"><div class="lrow__title">'+esc(x.name)+'</div>'+(x.dose?'<div class="lrow__sub">'+esc(x.dose)+'</div>':'')+'</div>'+xbtn(m.id,'medications',x.id)+'</div>';}).join(''):'<p class="sec__empty">No medications recorded.</p>';
 var recBody=m.records.length?m.records.slice().reverse().map(function(x){var sub=[]; if(x.date) sub.push(ovDate(x.date)); if(x.note) sub.push(esc(x.note)); return '<div class="lrow"><div class="lrow__main"><div class="lrow__title">'+esc(x.title)+'</div>'+(sub.length?'<div class="lrow__sub">'+sub.join(' \u00b7 ')+'</div>':'')+'</div>'+xbtn(m.id,'records',x.id)+'</div>';}).join(''):'<p class="sec__empty">No records yet.</p>';
 var mtx=FD.data.finance.transactions.filter(function(t){return t.member===id;});
 var aInc=0,aExp=0,mInc=0,mExp=0,_ym=curYM(); mtx.forEach(function(t){ if(t.type==='income'){ aInc+=t.amount; if(ymOf(t.date)===_ym) mInc+=t.amount; } else { aExp+=t.amount; if(ymOf(t.date)===_ym) mExp+=t.amount; } });
 var finMeta=mtx.length?('<span class="sec__meta">'+mtx.length+' entr'+(mtx.length>1?'ies':'y')+'</span>'):'';
 var finBody;
 if(!mtx.length){ finBody='<p class="sec__empty">No transactions yet. Tap + to record income or spending for '+esc(m.name)+'.</p>'; }
 else { finBody='<div class="mfin"><div class="mfin__row"><span class="mfin__k">This month</span><span class="mfin__v"><span class="mfin__in">+'+curSymbol()+nfmt(mInc)+'</span><span class="mfin__out">\u2212'+curSymbol()+nfmt(mExp)+'</span></span></div><div class="mfin__row"><span class="mfin__k">All time</span><span class="mfin__v"><span class="mfin__in">+'+curSymbol()+nfmt(aInc)+'</span><span class="mfin__out">\u2212'+curSymbol()+nfmt(aExp)+'</span></span></div></div>'+mtx.slice().sort(function(a,b){ var c=String(b.date).localeCompare(String(a.date)); return c||(b.createdAt-a.createdAt); }).slice(0,4).map(function(t){ var cm=finCatMeta(t.type,t.category); var sign=t.type==='income'?'+':'\u2212'; return '<div class="lrow"><span class="mfin__ic" style="color:'+cm.color+'">'+cm.icon+'</span><div class="lrow__main"><div class="lrow__title">'+esc(cm.label)+'</div><div class="lrow__sub">'+ovDate(t.date)+(t.note?' \u00b7 '+esc(t.note):'')+'</div></div><span class="lrow__amt'+(t.type==='income'?' mfin__amtin':'')+'">'+sign+curSymbol()+nfmt(t.amount)+'</span></div>'; }).join('')+'<button class="mfin__link" data-view="finance">View all in Finance</button>'; }
 var html='';
 html+='<div class="dtopbar"><button class="backbtn" data-action="members-back"><svg class="ico" viewBox="0 0 24 24"><path d="M14 6l-6 6 6 6"/></svg>Members</button><span class="dtopbar__sp"></span><button class="iconbtn--sm" data-action="edit-member" data-mid="'+m.id+'" aria-label="Edit profile"><svg class="ico" viewBox="0 0 24 24"><path d="M16.5 4.5l3 3M4.5 19.5l.9-3.6L15 5.3a1.3 1.3 0 0 1 1.8 0l1.9 1.9a1.3 1.3 0 0 1 0 1.8L8.1 18.6 4.5 19.5Z"/></svg></button><button class="iconbtn--sm danger" data-action="del-member" data-mid="'+m.id+'" aria-label="Remove member"><svg class="ico" viewBox="0 0 24 24"><path d="M19 7 18 19.5a2 2 0 0 1-2 1.5H8a2 2 0 0 1-2-1.5L5 7M3.5 7h17M9.5 7V4.5a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5V7"/></svg></button></div>';
 html+='<div class="mhero"><span class="mhero__av">'+avatarHTML(m,'mdetail__ini')+'</span><div class="mhero__info"><div class="mhero__name">'+esc(m.name)+'</div><div class="mhero__rel">'+(m.relation?esc(m.relation):'Family member')+'</div><div class="ovchips">'+ov+'</div></div></div>';
 try{ html+=pf360(m); }catch(e){}
 html+='<div class="dgroup__label">Health</div><div class="dgroup__grid">'+secCard(I.allergy,'Allergies',m.id,'allergy',aBody)+secCard(I.medication,'Medications',m.id,'medication',medBody)+secCard(I.record,'Medical Records',m.id,'record',recBody)+'</div>';
 html+='<div class="dgroup__label">Finance</div><div class="dgroup__grid">'+secCard(I.transaction,'Finances',m.id,'transaction',finBody,finMeta)+'</div>';
 host.innerHTML=html;
 }

 function showMembersList(){ currentMemberId=null; var dt=$('#memberDetail'),ls=$('#membersList'); if(dt){ dt.hidden=true; dt.innerHTML=''; } if(ls){ ls.style.display=''; renderMembersList(); } }
 function openMember(id){ var dt=$('#memberDetail'),ls=$('#membersList'); if(!dt) return; currentMemberId=id; renderMemberDetail(id); if(ls) ls.style.display='none'; dt.hidden=false; var c=$('#canvas'); if(c) c.scrollTop=0; }
 function refreshAll(ctx){ try{ avApply(); }catch(e){} renderDashboard(); if($('#mydayBody')) renderMyDay(); if($('#membersList')) renderMembersList(); if(ctx && ctx.memberId && $('#memberDetail') && !$('#memberDetail').hidden) renderMemberDetail(ctx.memberId); if($('#meetingsList')) renderMeetingsList(); if(ctx && ctx.meetingId && $('#meetingDetail') && !$('#meetingDetail').hidden) renderMeetingDetail(ctx.meetingId); if($('#goalsList')) renderGoalsList(); if($('#calWrap')) renderCalendar(); if($('#commWrap')) renderComm(); if($('#hOverview')) renderHealthOverview(); if($('#hProfiles')) renderHealthProfiles(); if($('#hMeds')) renderHealthMeds(); if($('#hRecords')) renderHealthRecords(); if($('#hAppts')) renderHealthAppts(); if($('#hVitals')) renderHealthVitals(); if($('#respWrap')) renderResponsibilities(); if($('#docsWrap')) renderDocuments(); if($('#treeWrap')) renderFamilyTree(); if($('#finOverview')) renderFinOverview(); if($('#finTx')) renderFinTx(); if($('#finPlanned')) renderFinPlanned(); if($('#finDebts')) renderFinDebts(); if($('#finBudget')) renderFinBudget(); if($('#finSavings')) renderFinSavings(); if($('#finStats')) renderFinStats(); if($('#jOverview')) renderJournalOverview(); if($('#jEntries')) renderJournalEntries(); if($('#jGratitude')) renderJournalGratitude(); if($('#jMilestones')) renderJournalMilestones(); if($('#ckOverview')) renderCookingOverview(); if($('#ckRecipes')) renderCookingRecipes(); if($('#ckMeals')) renderCookingMeals(); if($('#ckShopping')) renderCookingShopping(); if($('#gsCard')) renderGettingStarted(); if($('#hmOverview')) renderHomeOverview(); if($('#hmChores')) renderHomeChores(); if($('#hmMaint')) renderHomeMaint(); if($('#hmSupplies')) renderHomeSupplies(); if($('#lnOverview')) renderLearnOverview(); if($('#lnCourses')) renderLearnCourses(); if($('#lnBooks')) renderLearnBooks(); if($('#lnSkills')) renderLearnSkills(); if($('#tvOverview')) renderTravelOverview(); if($('#tvTrips')) renderTravelTrips(); if($('#tvPacking')) renderTravelPacking(); if($('#tvBucket')) renderTravelBucket(); if($('#ftOverview')) renderFitOverview(); if($('#ftWorkouts')) renderFitWorkouts(); if($('#ftGoals')) renderFitGoals(); if($('#ftRoutines')) renderFitRoutines(); if($('#ntOverview')) renderNutriOverview(); if($('#ntMeals')) renderNutriMeals(); if($('#ntWater')) renderNutriWater(); if($('#ntHabits')) renderNutriHabits(); if($('#plOverview')) renderPlanOverview(); if($('#plTasks')) renderPlanTasks(); if($('#plProjects')) renderPlanProjects(); if($('#plWeek')) renderPlanWeek(); if($('#rlLock')) renderRelLock(); if(rlUnlocked){ if($('#rlUs')) renderRelUs(); if($('#rlNotes')) renderRelNotes(); if($('#rlDates')) renderRelDates(); if($('#rlPlans')) renderRelPlans(); } if($('#mmOverview')) renderMemOverview(); if($('#mmAlbums')) renderMemAlbums(); if($('#mmStories')) renderMemStories(); if($('#mmCapsule')) renderMemCapsule(); if($('#wbOverview')) renderWbOverview(); if($('#wbCheckins')) renderWbCheckins(); if($('#wbCare')) renderWbCare(); if($('#wbGrowth')) renderWbGrowth(); if($('#lgOverview')) renderLegOverview(); if($('#lgDuas')) renderLegDuas(); if($('#lgDeeds')) renderLegDeeds(); if($('#lgWisdom')) renderLegWisdom(); if(currentMemberId && $('#memberDetail') && !$('#memberDetail').hidden) renderMemberDetail(currentMemberId); if(document.getElementById('notiBody')) renderNotifications(); if(document.getElementById('homeToday')) renderHome(); try{ renderHeroPulse(); }catch(e){} }

 /* ===================== GOVERNANCE ===================== */
 var GOV=[
 {key:'mission',title:'Family Mission',icon:'<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z"/></svg>',ph:'Why does our family exist? What do we strive for together every day?'},
 {key:'vision',title:'Family Vision',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M2.6 12S6 5.6 12 5.6 21.4 12 21.4 12 18 18.4 12 18.4 2.6 12 2.6 12Z"/><circle cx="12" cy="12" r="2.9"/></svg>',ph:'Where are we headed? Picture the family we want to become.'},
 {key:'values',title:'Family Values',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 20.3s-7-4.4-7-9.4A3.8 3.8 0 0 1 12 8.2a3.8 3.8 0 0 1 7 2.7c0 5-7 9.4-7 9.4Z"/></svg>',ph:'The principles that guide how we treat each other and the world.'},
 {key:'constitution',title:'Family Constitution',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M7 3.5h7.5L18 7v12.5A1.5 1.5 0 0 1 16.5 21h-9A1.5 1.5 0 0 1 6 19.5V5A1.5 1.5 0 0 1 7.5 3.5"/><path d="M14 3.5V7h3.5"/><path d="M9 12h6M9 15h6M9 9h2"/></svg>',ph:'The core agreements and commitments we hold ourselves to.'},
 {key:'rules',title:'Family Rules',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M10 5.5h9M10 12h9M10 18.5h9"/><path d="M4.5 4.6l1.1 1.1 2-2.1M4.5 11.1l1.1 1.1 2-2.1M4.5 17.6l1.1 1.1 2-2.1"/></svg>',ph:'The everyday rules that keep our home calm and running smoothly.'}
 ];
 function govStatsCount(d){ var keys=['mission','vision','values','constitution','rules'],n=0,gv=d.governance||{}; for(var i=0;i<keys.length;i++){ var g=gv[keys[i]]; if(g&&g.text&&g.text.trim()) n++; } return n; }
 function govBy(key){ for(var i=0;i<GOV.length;i++){ if(GOV[i].key===key) return GOV[i]; } return {key:key,title:key,icon:'',ph:''}; }
 function govWhen(ts){ if(!ts) return ''; var d=new Date(ts); return d.getDate()+' '+MON[d.getMonth()]+' '+d.getFullYear()+' \u00b7 '+p2(d.getHours())+':'+p2(d.getMinutes()); }
 var govEditing=null;

 function renderGovernance(){
 var host=$('#govWrap'); if(!host) return;
 var defined=FD.govStats();
 var head='<div class="gov-head"><div class="gov-head__txt"><span class="eyebrow">Foundation</span><h2 class="gov-h">What our family stands for</h2><p class="gov-lead">The shared agreements that guide how your family lives, decides and grows together.</p></div><div class="gov-progress"><div class="gov-progress__ring"><svg width="58" height="58" viewBox="0 0 58 58"><circle cx="29" cy="29" r="24" fill="none" stroke-width="6" class="gpr-track"/><circle cx="29" cy="29" r="24" fill="none" stroke-width="6" class="gpr-bar" stroke-dasharray="'+(2*Math.PI*24).toFixed(1)+'" stroke-dashoffset="'+(2*Math.PI*24*(1-defined/5)).toFixed(1)+'" stroke-linecap="round" transform="rotate(-90 29 29)"/></svg><span class="gov-progress__n">'+defined+'<small>/5</small></span></div></div></div>';
 var cards=GOV.map(function(s){
 var g=FD.getGov(s.key);
 var has=!!(g.text && g.text.trim());
 var editing=(govEditing===s.key);
 var meta = (has && g.updatedAt) ? ('<span class="gov-meta">Updated '+relTime(g.updatedAt)+'</span>') : '<span class="gov-meta gov-meta--off">Not set yet</span>';
 var body, actions;
 if(editing){
 body='<textarea class="gov-edit" id="govEdit-'+s.key+'" placeholder="'+esc(s.ph)+'">'+esc(g.text||'')+'</textarea>';
 actions='<button class="gov-btn gov-btn--primary" data-action="gov-save" data-key="'+s.key+'"><svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4 4 10-10"/></svg>Save</button><button class="gov-btn gov-btn--ghost" data-action="gov-cancel"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>Cancel</button>';
 } else {
 body = has ? ('<div class="gov-text">'+esc(g.text).replace(/\n/g,'<br>')+'</div>') : ('<div class="gov-empty">'+esc(s.ph)+'</div>');
 var histBtn = (g.history && g.history.length) ? ('<button class="gov-btn gov-btn--ghost" data-action="gov-history" data-key="'+s.key+'"><svg class="ico" viewBox="0 0 24 24"><path d="M12 7v5l3.2 1.9"/><path d="M3.5 12a8.5 8.5 0 1 0 2.4-5.9M3.5 4.5V8h3.5"/></svg>History<span class="gov-hn">'+g.history.length+'</span></button>') : '';
 actions='<button class="gov-btn" data-action="gov-edit" data-key="'+s.key+'"><svg class="ico" viewBox="0 0 24 24"><path d="M16.5 4.5l3 3M4.5 19.5l.9-3.6L15 5.3a1.3 1.3 0 0 1 1.8 0l1.9 1.9a1.3 1.3 0 0 1 0 1.8L8.1 18.6 4.5 19.5Z"/></svg>'+(has?'Edit':'Add')+'</button>'+histBtn;
 }
 return '<div class="govcard'+(editing?' is-editing':'')+(has?'':' is-blank')+'"><div class="gov-cardhead"><span class="gov-ico">'+s.icon+'</span><div class="gov-titles"><h3 class="gov-title">'+s.title+'</h3>'+meta+'</div></div><div class="gov-body">'+body+'</div><div class="gov-actions">'+actions+'</div></div>';
 }).join('');
 host.innerHTML=head+'<div class="govgrid">'+cards+'</div>';
 if(govEditing){ var ta=$('#govEdit-'+govEditing); if(ta){ ta.focus(); try{ ta.setSelectionRange(ta.value.length,ta.value.length); }catch(e){} } }
 }

 function editGov(key){ govEditing=key; renderGovernance(); }
 function cancelGov(){ govEditing=null; renderGovernance(); }
 function saveGov(key){ var ta=$('#govEdit-'+key); if(!ta) return; FD.setGov(key, ta.value); govEditing=null; renderGovernance(); renderDashboard(); flash('Saved'); }

 function openGovHistory(key){
 var s=govBy(key), g=FD.getGov(key);
 var list = (g.history && g.history.length) ? g.history.map(function(h,i){ return '<div class="vrow"><div class="vrow__head"><span class="vrow__when">'+govWhen(h.ts)+'</span><button class="gov-btn gov-btn--ghost gov-btn--sm" data-action="gov-restore" data-key="'+key+'" data-idx="'+i+'"><svg class="ico" viewBox="0 0 24 24"><path d="M3.5 12a8.5 8.5 0 1 0 2.4-5.9M3.5 4.5V8h3.5"/></svg>Restore</button></div><div class="vrow__text">'+esc(h.text).replace(/\n/g,'<br>')+'</div></div>'; }).join('') : '<p class="sec__empty">No previous versions yet. Each time you save a change, the old version is kept here.</p>';
 var cur = (g.text && g.text.trim()) ? ('<div class="vrow vrow--current"><div class="vrow__head"><span class="vrow__when">Current'+(g.updatedAt?(' \u00b7 '+govWhen(g.updatedAt)):'')+'</span><span class="vrow__badge">live</span></div><div class="vrow__text">'+esc(g.text).replace(/\n/g,'<br>')+'</div></div>') : '';
 var h='<div class="modal__head"><span class="modal__ico">'+s.icon+'</span><h3 class="modal__title" id="modalTitle">'+esc(s.title)+' \u00b7 History</h3><button class="modal__close" data-modal-close aria-label="Close"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>';
 h+='<div class="vhist">'+cur+list+'</div>';
 h+='<div class="modal__actions"><button class="btn" data-modal-close>Close</button></div>';
 var dlg=$('#modalDialog'); dlg.innerHTML=h; modalCfg=null; pjModalShow();
 }

 /* ===================== MEETINGS ===================== */
 function ownerOpts(){ return ['Not set','Everyone'].concat(FD.data.members.map(function(m){return m.name;})); }
 var MTG_STATUS={ upcoming:{label:'Upcoming',cls:'upcoming'}, completed:{label:'Completed',cls:'completed'}, cancelled:{label:'Cancelled',cls:'cancelled'} };
 function mtgStatus(s){ return MTG_STATUS[s]||MTG_STATUS.upcoming; }
 function meetingsAll(){ return FD.data.events.filter(function(e){return e.kind==='meeting';}).slice().sort(function(a,b){return new Date(b.date)-new Date(a.date);}); }
 var currentMeetingId=null, mtgEditNotes=false;

 function renderMeetingsList(){
 var host=$('#meetingsList'); if(!host) return;
 var list=meetingsAll();
 var add='<button class="btn btn--primary" data-modal="meeting"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Schedule meeting</button>';
 var head='<div class="mlist__head"><span class="eyebrow">'+list.length+' '+(list.length===1?'meeting':'meetings')+'</span>'+add+'</div>';
 if(!list.length){ host.innerHTML=head+'<div class="mempty"><svg class="ico" viewBox="0 0 24 24"><rect x="4" y="4.5" width="16" height="11" rx="2"/><path d="M9 19.5l3-3 3 3"/><path d="M8 11l2.4-2.4 2 2L16 7"/></svg><p>No meetings yet. Schedule your first family meeting to capture notes, decisions and action items.</p><button data-modal="meeting">Schedule a meeting</button></div>'; return; }
 var rows=list.map(function(e){ var st=mtgStatus(e.status); var dt=new Date(e.date); var open=(e.actionItems||[]).filter(function(x){return !x.done;}).length+(e.followUps||[]).filter(function(x){return !x.done;}).length; var meta=fmtTime(e.date); if(open) meta+=' \u00b7 '+open+' open task'+(open>1?'s':''); return '<button class="mtgrow" data-meeting="'+e.id+'"><span class="mtgrow__date"><span class="mtgrow__d">'+dt.getDate()+'</span><span class="mtgrow__mon">'+MON[dt.getMonth()]+'</span></span><span class="mtgrow__body"><span class="mtgrow__topic">'+esc(e.title)+'</span><span class="mtgrow__meta">'+esc(meta)+'</span></span><span class="stbadge stbadge--'+st.cls+'">'+st.label+'</span><svg class="ico ico-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>'; }).join('');
 host.innerHTML=head+'<div class="mtglist">'+rows+'</div>';
 }
 function secCardE(icon,title,eid,modal,body,meta){ return '<div class="seccard"><div class="sec__head"><span class="sec__ico">'+icon+'</span><h4 class="sec__title">'+title+'</h4>'+(meta||'')+'<button class="sec__add" data-modal="'+modal+'" data-meetingid="'+eid+'" aria-label="Add"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button></div><div class="sec__body">'+body+'</div></div>'; }
 function openMeta(e,key){ var items=e[key]||[]; if(!items.length) return ''; var done=items.filter(function(x){return x.done;}).length; return '<span class="sec__meta">'+done+'/'+items.length+' done</span>'; }
 function evList(e,key,empty,withChk){
 var items=e[key]||[];
 if(!items.length) return '<p class="sec__empty">'+empty+'</p>';
 return items.map(function(x){
 var chk = withChk ? ('<button class="chk'+(x.done?' is-on':'')+'" data-evtoggle data-eid="'+e.id+'" data-key="'+key+'" data-id="'+x.id+'" aria-label="Toggle done"><svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4 4 10-10"/></svg></button>') : '<span class="lrow__bul"></span>';
 var owner = (key!=='decisions' && x.owner) ? ('<div class="lrow__sub"><span class="lrow__owner"><svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.2"/><path d="M5.5 19.5c0-3.4 2.9-5.6 6.5-5.6s6.5 2.2 6.5 5.6"/></svg>'+esc(x.owner)+'</span></div>') : '';
 return '<div class="lrow'+(x.done?' is-done':'')+'">'+chk+'<div class="lrow__main"><div class="lrow__title">'+esc(x.text)+'</div>'+owner+'</div><button class="lrow__x" data-evdel data-eid="'+e.id+'" data-key="'+key+'" data-id="'+x.id+'" aria-label="Remove"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>';
 }).join('');
 }
 function renderMeetingDetail(id){
 var host=$('#meetingDetail'); var e=FD.getEvent(id); if(!host||!e){ showMeetingsList(); return; }
 var st=mtgStatus(e.status), I=MODAL_ICON;
 var notesBody;
 if(mtgEditNotes){
 notesBody='<textarea class="gov-edit" id="mtgNotes" placeholder="Capture what was discussed\u2026">'+esc(e.notes||'')+'</textarea><div class="gov-actions" style="margin-top:10px"><button class="gov-btn gov-btn--primary" data-action="mtg-notes-save"><svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4 4 10-10"/></svg>Save</button><button class="gov-btn gov-btn--ghost" data-action="mtg-notes-cancel"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>Cancel</button></div>';
 } else {
 notesBody=(e.notes&&e.notes.trim())?('<div class="gov-text">'+esc(e.notes).replace(/\n/g,'<br>')+'</div>'):('<div class="gov-empty">No notes yet.</div>');
 notesBody+='<div class="gov-actions" style="margin-top:12px"><button class="gov-btn" data-action="mtg-notes-edit"><svg class="ico" viewBox="0 0 24 24"><path d="M16.5 4.5l3 3M4.5 19.5l.9-3.6L15 5.3a1.3 1.3 0 0 1 1.8 0l1.9 1.9a1.3 1.3 0 0 1 0 1.8L8.1 18.6 4.5 19.5Z"/></svg>'+((e.notes&&e.notes.trim())?'Edit notes':'Add notes')+'</button></div>';
 }
 var notesCard='<div class="seccard seccard--wide"><div class="sec__head"><span class="sec__ico">'+I.record+'</span><h4 class="sec__title">Meeting Notes</h4></div><div class="sec__body">'+notesBody+'</div></div>';
 var decCard=secCardE(I.decision,'Decisions',e.id,'decision',evList(e,'decisions','No decisions recorded.',false));
 var aiCard=secCardE(I.actionItem,'Action Items',e.id,'actionItem',evList(e,'actionItems','No action items yet.',true),openMeta(e,'actionItems'));
 var fuCard=secCardE(I.followUp,'Follow-up Tasks',e.id,'followUp',evList(e,'followUps','No follow-up tasks yet.',true),openMeta(e,'followUps'));
 var html='';
 html+='<div class="dtopbar"><button class="backbtn" data-action="meetings-back"><svg class="ico" viewBox="0 0 24 24"><path d="M14 6l-6 6 6 6"/></svg>Meetings</button><span class="dtopbar__sp"></span><button class="iconbtn--sm" data-action="edit-meeting" data-mid="'+e.id+'" aria-label="Edit"><svg class="ico" viewBox="0 0 24 24"><path d="M16.5 4.5l3 3M4.5 19.5l.9-3.6L15 5.3a1.3 1.3 0 0 1 1.8 0l1.9 1.9a1.3 1.3 0 0 1 0 1.8L8.1 18.6 4.5 19.5Z"/></svg></button><button class="iconbtn--sm danger" data-action="del-meeting" data-mid="'+e.id+'" aria-label="Delete"><svg class="ico" viewBox="0 0 24 24"><path d="M19 7 18 19.5a2 2 0 0 1-2 1.5H8a2 2 0 0 1-2-1.5L5 7M3.5 7h17M9.5 7V4.5a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5V7"/></svg></button></div>';
 html+='<div class="mtg-hero"><div class="mtg-hero__top"><span class="stbadge stbadge--'+st.cls+'">'+st.label+'</span><span class="mtg-hero__date">'+fmtDate(e.date)+' \u00b7 '+fmtTime(e.date)+(e.location?(' \u00b7 '+esc(e.location)):'')+'</span></div><h2 class="mtg-hero__topic">'+esc(e.title)+'</h2></div>';
 html+='<div class="govgrid" style="margin-top:4px">'+notesCard+decCard+aiCard+fuCard+'</div>';
 host.innerHTML=html;
 if(mtgEditNotes){ var ta=$('#mtgNotes'); if(ta){ ta.focus(); try{ta.setSelectionRange(ta.value.length,ta.value.length);}catch(_e){}} }
 }
 function showMeetingsList(){ currentMeetingId=null; mtgEditNotes=false; var dt=$('#meetingDetail'),ls=$('#meetingsList'); if(dt){dt.hidden=true;dt.innerHTML='';} if(ls){ls.style.display='';renderMeetingsList();} }
 function openMeeting(id){ var dt=$('#meetingDetail'),ls=$('#meetingsList'); if(!dt) return; currentMeetingId=id; mtgEditNotes=false; renderMeetingDetail(id); if(ls)ls.style.display='none'; dt.hidden=false; var c=$('#canvas'); if(c)c.scrollTop=0; }
 function saveMtgNotes(){ if(!currentMeetingId) return; var ta=$('#mtgNotes'); if(!ta) return; FD.updateEvent(currentMeetingId,{notes:ta.value.trim()}); mtgEditNotes=false; renderMeetingDetail(currentMeetingId); flash('Notes saved'); }

 /* ===================== GOALS ===================== */
 function gnum(x){ var n=parseFloat(x); return isNaN(n)?0:n; }
 function clampPct(p){ return Math.max(0,Math.min(100,Math.round(p))); }
 var GOAL_TYPES=[
 {key:'financial',label:'Financial',color:'#BE8E3C',icon:'<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.3v9.4M14.3 9.5c0-1-1-1.7-2.3-1.7s-2.3.7-2.3 1.8c0 2.5 4.7 1.3 4.7 3.7 0 1.1-1.1 1.8-2.4 1.8s-2.4-.7-2.4-1.8"/></svg>',
 fields:[{name:'targetAmount',label:'Target amount',type:'number',ph:'e.g. 5000'},{name:'currentAmount',label:'Current amount',type:'number',ph:'e.g. 1200'},{name:'deadline',label:'Deadline (optional)',type:'date'}],
 progress:function(g){ var t=gnum(g.targetAmount); return t>0?clampPct(gnum(g.currentAmount)/t*100):null; },
 stats:function(g){ var tt=gnum(g.targetAmount),cc=gnum(g.currentAmount),out=[]; if(tt||cc){ out.push({k:'Saved',v:money(cc)+' / '+money(tt)}); out.push({k:'Remaining',v:money(Math.max(0,tt-cc))}); } return out; }},
 {key:'education',label:'Education',color:'#5566C0',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11a2 2 0 0 1 2 2v13a1.5 1.5 0 0 0-1.5-1.5H4Z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13a2 2 0 0 0-2 2v13a1.5 1.5 0 0 1 1.5-1.5H20Z"/></svg>',
 fields:[{name:'subject',label:'Course or subject',type:'text',ph:'e.g. Spoken English'},{name:'lessonsCompleted',label:'Lessons completed',type:'number',ph:'e.g. 8'},{name:'lessonsTotal',label:'Total lessons',type:'number',ph:'e.g. 20'},{name:'deadline',label:'Target completion date (optional)',type:'date'}],
 progress:function(g){ var t=gnum(g.lessonsTotal); return t>0?clampPct(gnum(g.lessonsCompleted)/t*100):null; },
 stats:function(g){ var out=[]; if(g.subject) out.push({k:'Subject',v:g.subject}); var lt=gnum(g.lessonsTotal),lc=gnum(g.lessonsCompleted); if(lt||lc) out.push({k:'Lessons',v:lc+' / '+lt}); return out; }},
 {key:'health',label:'Health',color:'#C75D66',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 20.3s-7-4.4-7-9.4A3.8 3.8 0 0 1 12 8.2a3.8 3.8 0 0 1 7 2.7c0 5-7 9.4-7 9.4Z"/></svg>',
 fields:[{name:'startWeight',label:'Starting weight',type:'number',ph:'e.g. 80'},{name:'currentWeight',label:'Current weight',type:'number',ph:'e.g. 76'},{name:'targetWeight',label:'Target weight',type:'number',ph:'e.g. 70'},{name:'exercisePlan',label:'Exercise plan',type:'text',ph:'e.g. Walk 30 min daily'},{name:'deadline',label:'Target date (optional)',type:'date'}],
 progress:function(g){ var s=gnum(g.startWeight),c=gnum(g.currentWeight),t=gnum(g.targetWeight); if(!s||!t||s===t||!c) return null; return clampPct((s-c)/(s-t)*100); },
 stats:function(g){ var out=[],c=gnum(g.currentWeight),t=gnum(g.targetWeight); if(c||t) out.push({k:'Weight',v:(c?c:'\u2014')+' \u2192 '+(t?t:'\u2014')}); if(g.exercisePlan) out.push({k:'Plan',v:g.exercisePlan}); return out; }},
 {key:'fitness',label:'Fitness',color:'#2E86A8',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M6.5 9v6M4 10.5v3M17.5 9v6M20 10.5v3M6.5 12h11"/></svg>',
 fields:[{name:'workoutTarget',label:'Workout target',type:'text',ph:'e.g. 4 workouts / week'},{name:'gymDone',label:'Gym sessions done',type:'number',ph:'e.g. 12'},{name:'gymTarget',label:'Gym sessions target',type:'number',ph:'e.g. 30'},{name:'runningDistance',label:'Running distance (km)',type:'number',ph:'e.g. 25'},{name:'deadline',label:'Deadline (optional)',type:'date'}],
 progress:function(g){ var t=gnum(g.gymTarget); return t>0?clampPct(gnum(g.gymDone)/t*100):null; },
 stats:function(g){ var out=[]; if(g.workoutTarget) out.push({k:'Target',v:g.workoutTarget}); var gt=gnum(g.gymTarget),gd=gnum(g.gymDone); if(gt||gd) out.push({k:'Sessions',v:gd+' / '+gt}); if(gnum(g.runningDistance)) out.push({k:'Run',v:gnum(g.runningDistance)+' km'}); return out; }},
 {key:'reading',label:'Reading',color:'#956CA6',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 6c-1.5-1.2-3.5-1.8-5.5-1.8S3 4.8 3 4.8v13s1-.6 3.5-.6S12 19 12 19m0-13c1.5-1.2 3.5-1.8 5.5-1.8S21 4.8 21 4.8v13s-1-.6-3.5-.6S12 19 12 19m0-13v13"/></svg>',
 fields:[{name:'booksTarget',label:'Books to read',type:'number',ph:'e.g. 12'},{name:'booksRead',label:'Books read',type:'number',ph:'e.g. 3'},{name:'pagesRead',label:'Pages read',type:'number',ph:'e.g. 540'},{name:'deadline',label:'Deadline (optional)',type:'date'}],
 progress:function(g){ var t=gnum(g.booksTarget); return t>0?clampPct(gnum(g.booksRead)/t*100):null; },
 stats:function(g){ var out=[],bt=gnum(g.booksTarget),br=gnum(g.booksRead); if(bt||br) out.push({k:'Books',v:br+' / '+bt}); if(gnum(g.pagesRead)) out.push({k:'Pages',v:gnum(g.pagesRead)}); return out; }},
 {key:'general',label:'General',color:'#79819A',icon:'<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>',
 fields:[{name:'progressManual',label:'Progress',type:'range',min:0,max:100,val:0},{name:'deadline',label:'Deadline (optional)',type:'date'}],
 progress:function(g){ return clampPct(gnum(g.progressManual)); },
 stats:function(g){ return []; }}
 ];
 var GOAL_TYPE_LABELS=GOAL_TYPES.map(function(t){return t.label;});
 function goalTypeBy(t){ t=(t||'').toLowerCase(); for(var i=0;i<GOAL_TYPES.length;i++){ if(GOAL_TYPES[i].key===t) return GOAL_TYPES[i]; } return null; }
 function goalTypeKey(label){ for(var i=0;i<GOAL_TYPES.length;i++){ if(GOAL_TYPES[i].label===label) return GOAL_TYPES[i].key; } return 'general'; }
 function goalTypeLabel(key){ var t=goalTypeBy(key); return t?t.label:'General'; }
 function computeGoalProgress(tk,data,prev){ var t=goalTypeBy(tk)||goalTypeBy('general'); var p=t.progress(data); if(p==null){ p=prev?clampPct(prev.progress||0):0; } return clampPct(p); }
 function buildGoalPatch(tk,v,prev){ var t=goalTypeBy(tk)||goalTypeBy('general'); var patch={title:v.title,type:tk,owner:v.owner||'',deadline:v.deadline||''}; t.fields.forEach(function(f){ if(f.name==='deadline') return; var raw=v[f.name]; patch[f.name]=(f.type==='number'||f.type==='range')?((raw===''||raw==null)?'':gnum(raw)):(raw||''); }); patch.progress=computeGoalProgress(tk,patch,prev); return patch; }
 function goalFieldsHTML(typeKey,goal){ var t=goalTypeBy(typeKey)||goalTypeBy('general'); return t.fields.map(function(f){ var ff={name:f.name,label:f.label,type:f.type,ph:f.ph,min:f.min,max:f.max}; if(f.type==='range'){ ff.val=goal?gnum(goal[f.name]!=null&&goal[f.name]!==''?goal[f.name]:(goal.progress||0)):(f.val||0); } else { ff.value=goal?(goal[f.name]!=null?goal[f.name]:''):''; } return fieldHTML(ff); }).join(''); }
 var goalModalTypeKey='financial';
 function deadlineLabel(d){ var t=new Date(); t.setHours(0,0,0,0); var g=new Date(d); g.setHours(0,0,0,0); var days=Math.round((g-t)/864e5); if(isNaN(days)) return {text:'',cls:''}; if(days<0) return {text:'Overdue',cls:'is-over'}; if(days===0) return {text:'Due today',cls:'is-soon'}; if(days===1) return {text:'Due tomorrow',cls:'is-soon'}; if(days<14) return {text:'Due in '+days+'d',cls:'is-soon'}; return {text:'Due '+g.getDate()+' '+MON[g.getMonth()],cls:''}; }
 function renderGoalsList(){
 var host=$('#goalsList'); if(!host) return;
 var goals=FD.data.goals;
 var add='<button class="btn btn--primary" data-modal="goal"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Create goal</button>';
 var avg = goals.length ? Math.round(goals.reduce(function(a,g){return a+(g.progress||0);},0)/goals.length) : 0;
 var head='<div class="mlist__head"><span class="eyebrow">'+goals.length+' '+(goals.length===1?'goal':'goals')+(goals.length?(' \u00b7 '+avg+'% avg'):'')+'</span>'+add+'</div>';
 if(!goals.length){ host.innerHTML=head+'<div class="mempty"><svg class="ico" viewBox="0 0 24 24"><path d="M6 21V4"/><path d="M6 5h10.5l-2 3.3 2 3.3H6"/></svg><p>No goals yet. Set shared goals and track how your family progresses together.</p><button data-modal="goal">Create your first goal</button></div>'; return; }
 var cards=goals.map(function(g){
 var t=goalTypeBy(g.type)||goalTypeBy('general'); var p=Math.max(0,Math.min(100,g.progress||0));
 var badge='<span class="gtype" style="--gt:'+t.color+'">'+t.icon+esc(t.label)+'</span>';
 var st=t.stats(g); var statHTML = st.length ? '<div class="goalcard__stats">'+st.map(function(s){return '<span class="goalstat"><span class="goalstat__k">'+esc(s.k)+'</span><span class="goalstat__v">'+esc(String(s.v))+'</span></span>';}).join('')+'</div>' : '';
 var dl = g.deadline ? (function(){ var l=deadlineLabel(g.deadline); return '<span class="goalcard__dl '+l.cls+'"><svg class="ico" viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M4 9.5h16M8 3.5v3M16 3.5v3"/></svg>'+esc(l.text)+'</span>'; })() : '<span class="goalcard__dl goalcard__dl--none">No deadline</span>';
 var owner = g.owner ? ('<span class="goalcard__owner"><span class="goalcard__av" style="background:'+colorFor({name:g.owner})+'">'+esc(initials(g.owner))+'</span>'+esc(g.owner)+'</span>') : '';
 return '<div class="goalcard'+(p>=100?' is-complete':'')+'" data-goal="'+g.id+'"><button class="goalcard__del" data-del-goal data-id="'+g.id+'" aria-label="Delete goal"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button><div class="goalcard__head">'+badge+'</div><h3 class="goalcard__name">'+esc(g.title)+'</h3>'+statHTML+'<div class="goalcard__prog"><div class="goalcard__ptop"><span class="goalcard__pct">'+p+'%</span>'+(p>=100?'<span class="goalcard__doneb">Reached</span>':'')+'</div><div class="bar"><span class="bar__fill" data-w="'+p+'" style="background:'+t.color+'"></span></div></div><div class="goalcard__foot">'+dl+owner+'</div></div>';
 }).join('');
 host.innerHTML=head+'<div class="goalsgrid">'+cards+'</div>';
 requestAnimationFrame(function(){ $$('#goalsList .bar__fill').forEach(function(b){ b.style.width=b.getAttribute('data-w')+'%'; }); });
 }
 function showGoalsList(){ renderGoalsList(); }

 /* ===================== CALENDAR ===================== */
 var DOW_FULL=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
 var MONTHS_FULL=['January','February','March','April','May','June','July','August','September','October','November','December'];
 var CATS=[
 {key:'general',label:'General',color:'#79819A',icon:'<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>'},
 {key:'birthday',label:'Birthday',color:'#C2745E',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 20.5h14M6 20.5v-6.5h12v6.5"/><path d="M4.5 14c1 0 1.3-1 2.5-1s1.5 1 2.5 1 1.3-1 2.5-1 1.5 1 2.5 1 1.3-1 2.5-1 1.5 1 2.5 1"/><path d="M9 10.5V8M12 10.5V8M15 10.5V8"/></svg>'},
 {key:'anniversary',label:'Anniversary',color:'#C75D66',icon:'<svg class="ico" viewBox="0 0 24 24"><circle cx="8.5" cy="13.5" r="4.3"/><circle cx="15.5" cy="13.5" r="4.3"/><path d="M7 6.5l1.5 2.2M17 6.5l-1.5 2.2"/></svg>'},
 {key:'doctor',label:'Doctor Appointment',color:'#3F8DBF',icon:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="8.5" width="16" height="11.5" rx="2"/><path d="M9 8.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2.5"/><path d="M12 12v4M10 14h4"/></svg>'},
 {key:'school',label:'School Event',color:'#5566C0',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M3 20.5h18M5 20.5V9.5l7-4 7 4V20.5"/><path d="M9.5 20.5v-4.5h5v4.5"/></svg>'},
 {key:'exam',label:'Exam',color:'#BE8E3C',icon:'<svg class="ico" viewBox="0 0 24 24"><rect x="5" y="4.5" width="14" height="16" rx="2"/><path d="M9 4.5V3.5h6v1"/><path d="M8.5 12l2 2 4-4.5"/></svg>'},
 {key:'meeting',label:'Family Meeting',color:'#1E3A7B',icon:'<svg class="ico" viewBox="0 0 24 24"><circle cx="9" cy="9" r="3"/><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><circle cx="17" cy="9.5" r="2.3"/><path d="M15.6 19c.2-2.4 1.1-4 3.4-4 1.6 0 2.6 1 3 2.5"/></svg>'},
 {key:'trip',label:'Trip',color:'#1FA2C4',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M21 4 3 11l6 2.5L11 20l3-5 7-11Z"/></svg>'},
 {key:'holiday',label:'Holiday',color:'#E08A2E',icon:'<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M17 17l1.6 1.6M18.4 5.6 16.8 7.2M7.2 16.8 5.6 18.4"/></svg>'},
 {key:'religious',label:'Religious Event',color:'#8E6FB0',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M16.5 4.2a8 8 0 1 0 0 15.6 6.4 6.4 0 0 1 0-15.6Z"/></svg>'},
 {key:'bill',label:'Bill Due',color:'#B85C44',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3V3.5Z"/><path d="M9 8h6M9 11.5h6M9 15h3"/></svg>'},
 {key:'maintenance',label:'Maintenance',color:'#8A6D4B',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M15.5 4.5a4 4 0 0 0 5 5L9.6 20.4a2.1 2.1 0 1 1-3-3L17.5 6.5"/></svg>'},
 {key:'grocery',label:'Grocery Day',color:'#4F9A78',icon:'<svg class="ico" viewBox="0 0 24 24"><path d="M3 4h2l1.8 11h10.2l1.8-7H6.4"/><circle cx="9" cy="19" r="1.4"/><circle cx="16.5" cy="19" r="1.4"/></svg>'}
 ];
 var CAT_OPTS=CATS.map(function(c){return c.label;});
 var NEW_CAT_OPT='+ New category\u2026';
 var CUSTOM_ICON='<svg class="ico" viewBox="0 0 24 24"><path d="M4 12.6V5.6A1.6 1.6 0 0 1 5.6 4h7l7.4 7.4a1.7 1.7 0 0 1 0 2.4l-5.6 5.6a1.7 1.7 0 0 1-2.4 0L4 12.6Z"/><circle cx="8.6" cy="8.6" r="1.4"/></svg>';
 function allCats(){ return CATS.concat((FD.data.customCategories||[]).map(function(c){ return {key:c.key,label:c.label,color:c.color,icon:c.icon||CUSTOM_ICON}; })); }
 function catOptionLabels(){ return allCats().map(function(c){return c.label;}); }
 function catBy(k){ k=(k||'').toLowerCase(); var a=allCats(); for(var i=0;i<a.length;i++){ if(a[i].key.toLowerCase()===k) return a[i]; } return null; }
 function catKey(label){ var a=allCats(); for(var i=0;i<a.length;i++){ if(a[i].label===label) return a[i].key; } return 'general'; }
 function catLabel(key){ var c=catBy(key); return c?c.label:'General'; }
 var REMINDER_OPTS=['None','At time of event','10 minutes before','30 minutes before','1 hour before','1 day before'];
 var REPEAT_OPTS=['Does not repeat','Daily','Weekly','Monthly','Yearly'];
 function repeatCode(label){ var m={'Does not repeat':'none','Daily':'daily','Weekly':'weekly','Monthly':'monthly','Yearly':'yearly'}; return m[label]||'none'; }
 function repeatLabel(code){ var m={none:'Does not repeat',daily:'Daily',weekly:'Weekly',monthly:'Monthly',yearly:'Yearly'}; return m[code]||'Does not repeat'; }

 function parseDT(s){ if(!s) return null; if(s instanceof Date) return new Date(s); var m=String(s).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2}))?/); if(m) return new Date(+m[1],+m[2]-1,+m[3],m[4]?+m[4]:0,m[5]?+m[5]:0,0,0); var d=new Date(s); return isNaN(d.getTime())?null:d; }
 function daysInMonth(y,m){ return new Date(y,m+1,0).getDate(); }
 function addMonthsClamped(date,n){ var y=date.getFullYear(),mo=date.getMonth(),day=date.getDate(),h=date.getHours(),mi=date.getMinutes(); var nm=mo+n,ny=y+Math.floor(nm/12); nm=((nm%12)+12)%12; return new Date(ny,nm,Math.min(day,daysInMonth(ny,nm)),h,mi); }
 function occInRange(baseStr,repeat,rs,re){
 var b=parseDT(baseStr); if(!b) return []; var out=[],safety=0,rsT=rs.getTime(),reT=re.getTime();
 if(!repeat||repeat==='none'){ if(b.getTime()>=rsT && b.getTime()<=reT) out.push(new Date(b)); return out; }
 if(repeat==='daily'||repeat==='weekly'){ var step=(repeat==='daily'?1:7)*864e5,t=b.getTime(); if(t<rsT){ t+=Math.ceil((rsT-t)/step)*step; } while(t<=reT && safety++<4000){ out.push(new Date(t)); t+=step; } return out; }
 if(repeat==='monthly'){ var d=new Date(b); while(d.getTime()<rsT && safety++<6000){ d=addMonthsClamped(d,1); } while(d.getTime()<=reT && safety++<6000){ out.push(new Date(d)); d=addMonthsClamped(d,1); } return out; }
 if(repeat==='yearly'){ var dy=new Date(b); while(dy.getTime()<rsT && safety++<4000){ dy=addMonthsClamped(dy,12); } while(dy.getTime()<=reT && safety++<4000){ out.push(new Date(dy)); dy=addMonthsClamped(dy,12); } return out; }
 return out;
 }
 function expandEvents(rs,re){
 var occ=[];
 FD.data.events.forEach(function(ev){ occInRange(ev.date,ev.repeat||'none',rs,re).forEach(function(dt){ occ.push({ev:ev,date:dt,cat:ev.category||'general',allDay:!!ev.allDay,completed:!!ev.completed,virtual:false}); }); });
 FD.data.members.forEach(function(m){ if(!m.birthday) return; occInRange(m.birthday,'yearly',rs,re).forEach(function(dt){ occ.push({ev:{id:'bday:'+m.id,title:m.name+'\u2019s birthday',category:'birthday',memberId:m.id,allDay:true,virtual:true},date:dt,cat:'birthday',allDay:true,completed:false,virtual:true,member:m}); }); });
 return occ;
 }
 function ymdKey(d){ return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate()); }
 function bucketByDay(occ){ var map={}; occ.forEach(function(o){ var k=ymdKey(o.date); (map[k]=map[k]||[]).push(o); }); for(var k in map){ map[k].sort(function(a,b){ if(a.allDay!==b.allDay) return a.allDay?-1:1; return a.date-b.date; }); } return map; }
 function startOfDay(d){ var x=new Date(d); x.setHours(0,0,0,0); return x; }
 function endOfDay(d){ var x=new Date(d); x.setHours(23,59,59,999); return x; }

 var calView=(Store.get('fw.cal.view','month')||'month'), calCursor=new Date();
 function calRange(){
 if(calView==='day') return [startOfDay(calCursor),endOfDay(calCursor)];
 if(calView==='week'){ var s=startOfDay(calCursor); s.setDate(s.getDate()-s.getDay()); var e=new Date(s); e.setDate(e.getDate()+6); return [s,endOfDay(e)]; }
 if(calView==='year') return [new Date(calCursor.getFullYear(),0,1),new Date(calCursor.getFullYear(),11,31,23,59,59,999)];
 var first=new Date(calCursor.getFullYear(),calCursor.getMonth(),1); var gs=new Date(first); gs.setDate(gs.getDate()-gs.getDay()); var ge=new Date(gs); ge.setDate(ge.getDate()+41); return [startOfDay(gs),endOfDay(ge)];
 }
 function calLabel(){
 if(calView==='day') return DOW_FULL[calCursor.getDay()]+', '+calCursor.getDate()+' '+MON[calCursor.getMonth()]+' '+calCursor.getFullYear();
 if(calView==='week'){ var r=calRange(),a=r[0],b=r[1]; return a.getDate()+' '+MON[a.getMonth()]+' \u2013 '+b.getDate()+' '+MON[b.getMonth()]+' '+b.getFullYear(); }
 if(calView==='year') return ''+calCursor.getFullYear();
 return MONTHS_FULL[calCursor.getMonth()]+' '+calCursor.getFullYear();
 }
 function setCalView(v){ calView=v; Store.set('fw.cal.view',v); renderCalendar(); }
 function calNav(dir){ if(dir==='today'){ calCursor=new Date(); } else { var k=(dir==='next')?1:-1; if(calView==='day') calCursor.setDate(calCursor.getDate()+k); else if(calView==='week') calCursor.setDate(calCursor.getDate()+7*k); else if(calView==='year') calCursor.setFullYear(calCursor.getFullYear()+k); else calCursor=addMonthsClamped(calCursor,k); } renderCalendar(); }
 function evChip(o){ var c=catBy(o.cat); var col=c?c.color:'var(--m-family)'; return '<button class="evchip'+(o.completed?' is-done':'')+(o.virtual?' is-bday':'')+'" style="--cc:'+col+'" data-event="'+o.ev.id+'" data-occ="'+ymdKey(o.date)+'"><span class="evchip__dot"></span><span class="evchip__t2">'+(o.allDay?'':'<b>'+fmtTime(o.date)+'</b> ')+esc(o.ev.title)+'</span></button>'; }
 function evRow(o){ var c=catBy(o.cat); var col=c?c.color:'var(--m-family)'; var tm=o.allDay?'All day':fmtTime(o.date); return '<button class="evrow'+(o.completed?' is-done':'')+'" style="--cc:'+col+'" data-event="'+o.ev.id+'" data-occ="'+ymdKey(o.date)+'"><span class="evrow__time">'+tm+'</span><span class="evrow__dot"></span><span class="evrow__title">'+esc(o.ev.title)+'</span>'+(o.completed?'<svg class="ico evrow__chk" viewBox="0 0 24 24"><path d="M5 12.5l4 4 10-10"/></svg>':'')+'</button>'; }
 function calLegend(){ return '<div class="cal-legend">'+allCats().filter(function(c){return c.key!=='general';}).map(function(c){return '<span class="leg"><span class="leg__dot" style="background:'+c.color+'"></span>'+esc(c.label)+'</span>';}).join('')+'</div>'; }

 function renderMonthView(){
 var r=calRange(),map=bucketByDay(expandEvents(r[0],r[1]));
 var gs=new Date(r[0]); var today=ymdKey(new Date()),curM=calCursor.getMonth();
 var head='<div class="mo-grid mo-head">'+DOW.map(function(d){return '<div class="mo-hcell">'+d+'</div>';}).join('')+'</div>';
 var cells='';
 for(var i=0;i<42;i++){ var d=new Date(gs); d.setDate(gs.getDate()+i); var key=ymdKey(d),items=map[key]||[],out=(d.getMonth()!==curM)?' is-out':'',tod=(key===today)?' is-today':'';
 var chips=items.slice(0,3).map(evChip).join(''),more=items.length>3?('<span class="mo-more">+'+(items.length-3)+'</span>'):'';
 cells+='<div class="mo-cell'+out+tod+'" data-day="'+key+'"><span class="mo-num">'+d.getDate()+'</span><div class="mo-evs">'+chips+more+'</div></div>';
 }
 return head+'<div class="mo-grid mo-body">'+cells+'</div>';
 }
 function renderWeekView(){
 var r=calRange(),map=bucketByDay(expandEvents(r[0],r[1])); var s=new Date(r[0]),today=ymdKey(new Date());
 var cols='';
 for(var i=0;i<7;i++){ var d=new Date(s); d.setDate(s.getDate()+i); var key=ymdKey(d),items=map[key]||[],tod=(key===today)?' is-today':'';
 var list=items.length?items.map(evRow).join(''):'<div class="wk-empty">\u2014</div>';
 cols+='<div class="wk-day'+tod+'"><button class="wk-dayhd" data-day="'+key+'"><span class="wk-dow">'+DOW[d.getDay()]+'</span><span class="wk-dnum">'+d.getDate()+'</span></button><div class="wk-list">'+list+'</div></div>';
 }
 return '<div class="wk-grid">'+cols+'</div>';
 }
 function renderDayView(){
 var r=calRange(),items=(bucketByDay(expandEvents(r[0],r[1]))[ymdKey(calCursor)]||[]);
 var allday=items.filter(function(o){return o.allDay;}),timed=items.filter(function(o){return !o.allDay;});
 if(!items.length) return '<div class="day-empty"><svg class="ico" viewBox="0 0 24 24"><rect x="4" y="5.2" width="16" height="14.8" rx="2.2"/><path d="M4 9.4h16M8.2 3.4v3.4M15.8 3.4v3.4"/></svg><p>Nothing planned for this day.</p><button class="btn btn--primary" data-modal="event"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add event</button></div>';
 var out='';
 if(allday.length) out+='<div class="day-sec"><div class="day-seclbl">All-day</div><div class="day-list">'+allday.map(evRow).join('')+'</div></div>';
 if(timed.length) out+='<div class="day-sec"><div class="day-seclbl">Schedule</div><div class="day-list">'+timed.map(evRow).join('')+'</div></div>';
 return '<div class="day-wrap">'+out+'</div>';
 }
 function renderYearView(){
 var y=calCursor.getFullYear(),map=bucketByDay(expandEvents(new Date(y,0,1),new Date(y,11,31,23,59,59,999))),today=ymdKey(new Date());
 var months='';
 for(var m=0;m<12;m++){ var gs=new Date(y,m,1); gs.setDate(gs.getDate()-gs.getDay()); var cells='';
 for(var i=0;i<42;i++){ var d=new Date(gs); d.setDate(gs.getDate()+i); var key=ymdKey(d),inM=d.getMonth()===m,has=map[key]&&map[key].length,col=has?catBy(map[key][0].cat):null;
 cells+='<div class="yr-d'+(inM?'':' is-out')+(key===today?' is-today':'')+'">'+(inM?d.getDate():'')+((inM&&has)?'<span class="yr-dot" style="background:'+(col?col.color:'var(--m-family)')+'"></span>':'')+'</div>';
 }
 months+='<button class="yr-month" data-calmonth="'+m+'"><div class="yr-mname">'+MONTHS_FULL[m]+'</div><div class="yr-dowrow">'+DOW.map(function(x){return '<span>'+x.charAt(0)+'</span>';}).join('')+'</div><div class="yr-grid">'+cells+'</div></button>';
 }
 return '<div class="yr-wrap">'+months+'</div>';
 }
 function renderCalendar(){
 var host=$('#calWrap'); if(!host) return;
 var views=['day','week','month','year'];
 var toolbar='<div class="cal-toolbar"><div class="cal-navrow"><div class="cal-nav"><button class="cal-navbtn" data-calnav="prev" aria-label="Previous"><svg class="ico" viewBox="0 0 24 24"><path d="M14 6l-6 6 6 6"/></svg></button><button class="cal-today" data-calnav="today">Today</button><button class="cal-navbtn" data-calnav="next" aria-label="Next"><svg class="ico" viewBox="0 0 24 24"><path d="M10 6l6 6-6 6"/></svg></button></div><div class="cal-label">'+esc(calLabel())+'</div></div><div class="cal-right"><div class="cal-views">'+views.map(function(v){return '<button class="cal-viewbtn'+(calView===v?' is-on':'')+'" data-calview="'+v+'">'+v.charAt(0).toUpperCase()+v.slice(1)+'</button>';}).join('')+'</div><button class="btn btn--primary cal-add" data-modal="event"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add event</button></div></div>';
 var body = calView==='day'?renderDayView():calView==='week'?renderWeekView():calView==='year'?renderYearView():renderMonthView();
 host.innerHTML=toolbar+'<div class="cal-body cal-body--'+calView+'">'+body+'</div>'+calLegend();
 }
 function showCalendar(){ renderCalendar(); }

 function evdRow(icon,txt){ return '<div class="evd-row"><span class="evd-ic">'+icon+'</span><span>'+txt+'</span></div>'; }
 function openEvent(id,occ){
 var ICO={cal:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="5.2" width="16" height="14.8" rx="2.2"/><path d="M4 9.4h16M8.2 3.4v3.4M15.8 3.4v3.4"/></svg>',pin:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 21s6-5.3 6-10a6 6 0 1 0-12 0c0 4.7 6 10 6 10Z"/><circle cx="12" cy="11" r="2.3"/></svg>',bell:'<svg class="ico" viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5L6 16Z"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>',rep:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 9a8 8 0 0 1 14-3l2 2M20 5v4h-4"/><path d="M20 15a8 8 0 0 1-14 3l-2-2M4 19v-4h4"/></svg>',ppl:'<svg class="ico" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19.5c0-3.4 2.9-5.6 5.5-5.6"/><circle cx="16.5" cy="9" r="2.4"/><path d="M14 19.5c.2-2.6 1.2-4.2 3.5-4.2"/></svg>',file:'<svg class="ico" viewBox="0 0 24 24"><path d="M13 3.5H6.5A1.5 1.5 0 0 0 5 5v14a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V9.5L13 3.5Z"/><path d="M13 3.5V9.5h6"/></svg>'};
 if(id && id.indexOf('bday:')===0){ var mid=id.slice(5),m=FD.getMember(mid); if(!m) return; var dd=parseDT(occ||m.birthday),c=catBy('birthday');
 var bh='<div class="modal__head"><span class="modal__ico" style="color:'+c.color+'">'+c.icon+'</span><h3 class="modal__title" id="modalTitle">'+esc(m.name)+'\u2019s birthday</h3><button class="modal__close" data-modal-close aria-label="Close"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>';
 bh+='<div class="evd">'+evdRow(ICO.cal,(dd?DOW_FULL[dd.getDay()]+', '+dd.getDate()+' '+MON[dd.getMonth()]:'')+' \u00b7 All day')+evdRow(c.icon,'From '+esc(m.name)+'\u2019s profile in Members')+'</div>';
 bh+='<div class="modal__actions"><button class="btn" data-modal-close>Close</button><button class="btn btn--primary" data-action="goto-member" data-mid="'+mid+'">View in Members</button></div>';
 var bdlg=$('#modalDialog'); bdlg.innerHTML=bh; modalCfg=null; pjModalShow(); return;
 }
 var e=FD.getEvent(id); if(!e) return; var c=catBy(e.category)||catBy('general'); var dd=parseDT(occ||e.date);
 var datestr = dd?(DOW_FULL[dd.getDay()]+', '+dd.getDate()+' '+MON[dd.getMonth()]+' '+dd.getFullYear()+(e.allDay?' \u00b7 All day':' \u00b7 '+fmtTime(dd))):'';
 var rows=evdRow(ICO.cal,esc(datestr));
 if(e.repeat&&e.repeat!=='none') rows+=evdRow(ICO.rep,'Repeats '+esc(repeatLabel(e.repeat).toLowerCase()));
 if(e.location) rows+=evdRow(ICO.pin,esc(e.location));
 if(e.reminder&&e.reminder!=='None') rows+=evdRow(ICO.bell,esc(e.reminder));
 if(e.participants&&e.participants.length){ var avs=e.participants.map(function(pid){ var mm=FD.getMember(pid); return mm?'<span class="evd-av" style="background:'+colorFor(mm)+'" title="'+esc(mm.name)+'">'+esc(initials(mm.name))+'</span>':''; }).join(''); if(avs) rows+='<div class="evd-row evd-row--top"><span class="evd-ic">'+ICO.ppl+'</span><div class="evd-people">'+avs+'</div></div>'; }
 if(e.description) rows+='<div class="evd-block"><div class="evd-bl">Description</div><div class="evd-txt">'+esc(e.description).replace(/\n/g,'<br>')+'</div></div>';
 if(e.notes) rows+='<div class="evd-block"><div class="evd-bl">Notes</div><div class="evd-txt">'+esc(e.notes).replace(/\n/g,'<br>')+'</div></div>';
 if(e.attachments&&e.attachments.length){ var imgs=e.attachments.filter(function(a){return /^data:image\//.test(a.dataUrl||'');}); var docs=e.attachments.filter(function(a){return !/^data:image\//.test(a.dataUrl||'');}); var ah=''; if(imgs.length) ah+='<div class="evd-imgs">'+imgs.map(function(a){return '<a class="evd-img" href="'+a.dataUrl+'" target="_blank" rel="noopener" title="'+esc(a.name)+'"><img src="'+a.dataUrl+'" alt=""></a>';}).join('')+'</div>'; if(docs.length) ah+='<div class="evd-atts">'+docs.map(function(a){return '<a class="evd-att" href="'+a.dataUrl+'" download="'+esc(a.name)+'">'+ICO.file+'<span>'+esc(a.name)+'</span></a>';}).join('')+'</div>'; rows+='<div class="evd-block"><div class="evd-bl">Attachments \u00b7 '+e.attachments.length+'</div>'+ah+'</div>'; }
 var compBtn='<button class="btn'+(e.completed?' btn--soft':'')+'" data-action="ev-complete" data-id="'+e.id+'"><svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4 4 10-10"/></svg>'+(e.completed?'Completed':'Mark completed')+'</button>';
 var h='<div class="modal__head"><span class="modal__ico" style="color:'+c.color+'">'+c.icon+'</span><div class="evd-headtxt"><h3 class="modal__title" id="modalTitle">'+esc(e.title)+'</h3><span class="evd-cat" style="--cc:'+c.color+'">'+esc(c.label)+'</span></div><button class="modal__close" data-modal-close aria-label="Close"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>';
 h+='<div class="evd'+(e.completed?' is-done':'')+'">'+rows+'</div>';
 h+='<div class="modal__actions evd-actions">'+compBtn+'<button class="btn" data-action="ev-edit" data-id="'+e.id+'"><svg class="ico" viewBox="0 0 24 24"><path d="M16.5 4.5l3 3M4.5 19.5l.9-3.6L15 5.3a1.3 1.3 0 0 1 1.8 0l1.9 1.9a1.3 1.3 0 0 1 0 1.8L8.1 18.6 4.5 19.5Z"/></svg>Edit</button><button class="btn btn--danger" data-action="ev-del" data-id="'+e.id+'"><svg class="ico" viewBox="0 0 24 24"><path d="M19 7 18 19.5a2 2 0 0 1-2 1.5H8a2 2 0 0 1-2-1.5L5 7M3.5 7h17M9.5 7V4.5a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5V7"/></svg>Delete</button></div>';
 var dlg=$('#modalDialog'); dlg.innerHTML=h; modalCfg=null; pjModalShow();
 }
 function attChipsHTML(){ if(!pendingAtts.length) return '<span class="att-none">No files attached yet.</span>'; return pendingAtts.map(function(a){ var isImg=/^data:image\//.test(a.dataUrl||''); var thumb=isImg?('<img class="attchip__img" src="'+a.dataUrl+'" alt="">'):('<span class="attchip__ic"><svg class="ico" viewBox="0 0 24 24"><path d="M13 3.5H6.5A1.5 1.5 0 0 0 5 5v14a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V9.5L13 3.5Z"/><path d="M13 3.5V9.5h6"/></svg></span>'); return '<span class="attchip">'+thumb+'<span class="attchip__nm">'+esc(a.name)+'</span><button type="button" class="attchip__x" data-att-remove="'+a.id+'" aria-label="Remove"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></span>'; }).join(''); }
 function fileToAttachment(file,cb){
 if(/^image\//.test(file.type)){ var reader=new FileReader(); reader.onload=function(){ var img=new Image(); img.onload=function(){ var cv=imgScaled(img,1920); var durl; try{ durl=cv.toDataURL('image/jpeg',0.88); }catch(e){ durl=reader.result; } cb({name:file.name,dataUrl:durl}); }; img.onerror=function(){ cb(null); }; img.src=reader.result; }; reader.onerror=function(){ cb(null); }; reader.readAsDataURL(file); return; }
 if(file.size>10485760){ flash('\u201c'+file.name+'\u201d is larger than 10 MB'); cb(null); return; }
 var rd=new FileReader(); rd.onload=function(){ cb({name:file.name,dataUrl:rd.result}); }; rd.onerror=function(){ cb(null); }; rd.readAsDataURL(file);
 }
 function addAttachments(files){ Array.prototype.slice.call(files).forEach(function(f){ fileToAttachment(f,function(att){ if(!att) return; att.id='a'+Date.now().toString(36)+Math.random().toString(36).slice(2,5); pendingAtts.push(att); var el=$('#attList'); if(el) el.innerHTML=attChipsHTML(); }); }); }

 /* ===================== COMMUNICATION ===================== */
 var commTab='assistant', currentChannelId=null, commFrom='', isRecording=false, mediaRec=null, recChunks=[];
 function cmAvatar(from){ if(from){ var m=FD.getMember(from); if(m){ return m.photo?('<img class="cmsg__av" src="'+m.photo+'" alt="">'):('<span class="cmsg__av" style="background:'+colorFor(m)+'">'+esc(initials(m.name))+'</span>'); } } return '<span class="cmsg__av cmsg__av--me"><svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.4"/><path d="M5.5 19.5c0-3.6 3-5.8 6.5-5.8s6.5 2.2 6.5 5.8"/></svg></span>'; }
 function senderName(from){ if(from){ var m=FD.getMember(from); if(m) return m.name; } return 'Me'; }
 function fromOpts(sel){ var o='<option value=""'+(sel===''?' selected':'')+'>Me</option>'; FD.data.members.forEach(function(m){ o+='<option value="'+m.id+'"'+(sel===m.id?' selected':'')+'>'+esc(m.name)+'</option>'; }); return o; }
 function msgBody(msg){
 var b='';
 if(msg.photo) b+='<a class="cmsg__photo" href="'+msg.photo+'" target="_blank" rel="noopener"><img src="'+msg.photo+'" alt=""></a>';
 if(msg.audio) b+='<audio class="cmsg__audio" controls src="'+msg.audio+'"></audio>';
 if(msg.file) b+='<a class="cmsg__file" href="'+msg.file.dataUrl+'" download="'+esc(msg.file.name)+'"><svg class="ico" viewBox="0 0 24 24"><path d="M13 3.5H6.5A1.5 1.5 0 0 0 5 5v14a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V9.5L13 3.5Z"/><path d="M13 3.5V9.5h6"/></svg><span>'+esc(msg.file.name)+'</span></a>';
 if(msg.text) b+='<div class="cmsg__text">'+esc(msg.text).replace(/\n/g,'<br>')+'</div>';
 return b;
 }
 function renderChat(){
 var chans=FD.data.channels;
 if(!currentChannelId || !FD.getChannel(currentChannelId)) currentChannelId=chans.length?chans[0].id:null;
 var chips=chans.map(function(c){ var on=c.id===currentChannelId; var del=(!c.system)?'<span class="chan__x" data-chdel="'+c.id+'" aria-label="Delete group"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></span>':''; return '<button class="chan'+(on?' is-on':'')+'" data-channel="'+c.id+'">'+esc(c.name)+del+'</button>'; }).join('');
 var chanbar=(chans.length>1)?'<div class="chanbar">'+chips+'<button class="chan chan--new" data-modal="channel"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>New group</button></div>':'';
 var ch=FD.getChannel(currentChannelId);
 if(!ch) return chanbar+'<div class="comm-empty">No channel selected.</div>';
 var pinned=ch.messages.filter(function(m){return m.pinned;});
 var pinbar = pinned.length ? '<div class="pinbar"><div class="pinbar__hd"><svg class="ico" viewBox="0 0 24 24"><path d="M9 4h6l-1 6 3 3v2H7v-2l3-3-1-6Z"/><path d="M12 15v5"/></svg> Pinned</div>'+pinned.map(function(m){return '<div class="pinmsg"><span class="pinmsg__t">'+esc((senderName(m.from)+': '+(m.text||(m.photo?'Photo':m.file?m.file.name:m.audio?'Voice note':''))).slice(0,80))+'</span><button class="pinmsg__x" data-msgpin data-cid="'+ch.id+'" data-mid="'+m.id+'" aria-label="Unpin"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>';}).join('')+'</div>' : '';
 var lastDay='';
 var thread = ch.messages.length ? ch.messages.map(function(m){
 var me=(m.from==='');
 var sep=''; var dl=chDayLabel(m.ts); if(dl!==lastDay){ lastDay=dl; sep='<div class="cday"><span>'+esc(dl)+'</span></div>'; }
 if(m.deleted) return sep+'<div class="cmsg'+(me?' cmsg--me':'')+'">'+cmAvatar(m.from)+'<div class="cmsg__body"><div class="cmsg__bubble cmsg__gone">This message was deleted</div></div></div>';
 var rq='';
 if(m.replyTo){ var src=null; ch.messages.forEach(function(x){ if(x.rid===m.replyTo) src=x; });
 if(src) rq='<div class="cquote"><span class="cquote__n">'+esc(senderName(src.from))+'</span><span class="cquote__t">'+esc(src.text? String(src.text).slice(0,70) : (src.photo?'Photo':(src.audio?'Voice message':'File')))+'</span></div>'; }
 var rx=''; var rk=Object.keys(m.reactions||{});
 if(rk.length) rx='<div class="crx">'+rk.map(function(e){ var lst=m.reactions[e]||[]; var mine=(AUTH.user&&lst.indexOf(AUTH.user.id)>=0); return '<button class="crx__b'+(mine?' is-mine':'')+'" data-rx="'+esc(e)+'" data-mid="'+m.id+'">'+e+' '+lst.length+'</button>'; }).join('')+'</div>';
 var edited = m.edited? '<span class="cmsg__ed">edited</span>' : '';
 var acts='<div class="cmsg__acts">'
 +'<button data-msgreply data-mid="'+m.id+'" title="Reply">Reply</button>'
 +(me&&m.text?'<button data-msgedit data-mid="'+m.id+'" title="Edit">Edit</button>':'')
 +'<button data-msgrx data-mid="'+m.id+'" title="React">React</button>'
 +'<button data-msgpin data-cid="'+ch.id+'" data-mid="'+m.id+'">'+(m.pinned?'Unpin':'Pin')+'</button>'
 +'<button data-msgdel data-cid="'+ch.id+'" data-mid="'+m.id+'">Delete</button></div>';
 return sep+'<div class="cmsg'+(me?' cmsg--me':'')+(m.pinned?' is-pinned':'')+'" data-mrow="'+m.id+'">'+cmAvatar(m.from)
 +'<div class="cmsg__body"><div class="cmsg__hd"><span class="cmsg__name">'+esc(senderName(m.from))+'</span><span class="cmsg__time">'+relTime(m.ts)+'</span></div>'
 +'<div class="cmsg__bubble">'+rq+msgBody(m)+'<span class="cmsg__meta">'+edited+'<span class="cmsg__t2">'+chTime(m.ts)+'</span>'+chTicks(m)+'</span></div>'+rx+acts+'</div></div>';
 }).join('') : '<div class="thread-empty"><svg class="ico" viewBox="0 0 24 24"><path d="M4.5 6.6a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-6.4l-4.1 3.4V14.6H6.5a2 2 0 0 1-2-2Z"/></svg><p>No messages yet in <b>'+esc(ch.name)+'</b>. Say hello!</p></div>';
 var rb='';
 if(chReply){ var rsrc=null; ch.messages.forEach(function(x){ if(x.id===chReply) rsrc=x; });
 if(rsrc) rb='<div class="creply"><span class="creply__i"></span><span class="creply__b"><span class="creply__n">Reply to '+esc(senderName(rsrc.from))+'</span><span class="creply__t">'+esc(rsrc.text? String(rsrc.text).slice(0,60) : (rsrc.photo?'Photo':(rsrc.audio?'Voice message':'File')))+'</span></span><button class="creply__x" data-replyx>&times;</button></div>'; }
 if(chEditing){ rb='<div class="creply creply--edit"><span class="creply__i"></span><span class="creply__b"><span class="creply__n">Editing message</span><span class="creply__t">Change the text and send</span></span><button class="creply__x" data-editx>&times;</button></div>'; }
 var typing='<div class="ctyping" id="chTyping">'+esc(chTypingText())+'</div>';
 var composer=typing+rb+'<div class="composer">'+(chSignedIn()?'':'<div class="composer__top"><span class="composer__lbl">From</span><select id="commFrom" class="composer__from">'+fromOpts(commFrom)+'</select></div>')+'<div class="composer__bar"><label class="cbtn cbtn--attach" title="Attach"><svg class="ico" viewBox="0 0 24 24"><path d="M16 7l-6.5 6.5a2.5 2.5 0 0 0 3.5 3.5L20 10a4.5 4.5 0 0 0-6.4-6.4L6 11.2a6.5 6.5 0 0 0 9.2 9.2L21 14.6"/></svg><input type="file" id="commAttach" accept="image/*,application/pdf,.doc,.docx,.txt,.rtf,.xls,.xlsx,.ppt,.pptx,.csv,.zip" hidden></label><div class="composer__inwrap"><textarea id="commText" class="composer__text" rows="1" placeholder="Message"></textarea></div><button class="cbtn cbtn--mic" data-action="comm-rec" title="Voice note" type="button"><svg class="ico" viewBox="0 0 24 24"><rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V20"/></svg></button><button class="cbtn cbtn--send" data-action="comm-send" title="Send" type="button" hidden><svg class="ico" viewBox="0 0 24 24"><path d="M4 12l16-7-7 16-2.5-6.5L4 12Z"/></svg></button></div></div>';
 return '<div class="chat"><div class="chat__top">'+chanbar+'</div>'+pinbar+'<div class="comm-thread" id="commThread">'+thread+'</div>'+composer+'</div>';
 }
 function renderAnnounce(){
 var anns=FD.data.announcements;
 var composer='<div class="ann-compose"><textarea id="annText" class="ann-compose__text" rows="2" placeholder="Important notice for the family\u2026"></textarea><div class="ann-compose__row"><select id="annFrom" class="composer__from">'+['Family'].concat(FD.data.members.map(function(m){return m.name;})).map(function(o){return '<option>'+esc(o)+'</option>';}).join('')+'</select><button class="btn btn--primary" data-action="comm-announce"><svg class="ico" viewBox="0 0 24 24"><path d="M4.5 9.5 18 5v11l-13.5-3.5"/><path d="M4.5 9.5V13a1.5 1.5 0 0 0 1.5 1.5h1.5"/></svg>Post</button></div></div>';
 var hint='<p class="comm-hint">Announcements also appear on the Family Overview.</p>';
 var list = anns.length ? '<div class="ann-list">'+anns.map(function(a){return '<div class="anncard"><div class="anncard__main"><div class="anncard__txt">'+esc(a.text)+'</div><div class="anncard__meta">'+esc(a.author||'Family')+' \u00b7 '+relTime(a.createdAt)+'</div></div><button class="anncard__x" data-anndel="'+a.id+'" aria-label="Delete"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>';}).join('')+'</div>' : '<div class="comm-empty">No announcements yet.</div>';
 return composer+hint+list;
 }
 var pollVoters={};
 function renderPolls(){
 var polls=FD.data.polls;
 var head='<div class="mlist__head"><span class="eyebrow">'+polls.length+' '+(polls.length===1?'poll':'polls')+'</span><button class="btn btn--primary" data-modal="poll"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>New poll</button></div>';
 if(!polls.length) return head+'<div class="comm-empty">No polls yet. Create one to vote together.</div>';
 var cards=polls.map(function(p){ var votesMap=p.votes||{}; var total=Object.keys(votesMap).length;
 var vk=(pollVoters[p.id]!=null?pollVoters[p.id]:''); var keyV=vk||'me'; var myVote=votesMap[keyV];
 var voterSel='<div class="poll-voter"><span class="poll-voter__lbl">Voting as</span><select class="poll-voter__sel" data-pollvoter="'+p.id+'">'+fromOpts(vk)+'</select>'+(myVote?'<span class="poll-voter__done">\u2713 voted</span>':'')+'</div>';
 var opts=p.options.map(function(o){ var count=0; for(var k in votesMap){ if(votesMap[k]===o.id) count++; } var pct=total?Math.round(count/total*100):0; var mine=(myVote===o.id); return '<button class="pollopt'+(mine?' is-mine':'')+'" data-vote data-pid="'+p.id+'" data-oid="'+o.id+'"><span class="pollopt__bar" style="width:'+pct+'%"></span><span class="pollopt__txt">'+esc(o.text)+(mine?'<svg class="ico pollopt__me" viewBox="0 0 24 24"><path d="M5 12.5l4 4 10-10"/></svg>':'')+'</span><span class="pollopt__n">'+count+(total?' \u00b7 '+pct+'%':'')+'</span></button>'; }).join('');
 var note = myVote ? (p.allowChange?'You voted \u00b7 tap another option to change':'You\u2019ve voted \u00b7 one vote per person') : 'Tap an option to vote';
 return '<div class="pollcard"><div class="pollcard__hd"><h3 class="pollcard__q">'+esc(p.question)+'</h3><button class="pollcard__x" data-polldel="'+p.id+'" aria-label="Delete"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>'+voterSel+'<div class="pollopts">'+opts+'</div><div class="pollcard__tot">'+total+' vote'+(total===1?'':'s')+' \u00b7 '+esc(note)+'</div></div>';
 }).join('');
 return head+'<div class="poll-list">'+cards+'</div>';
 }
 function wirePolls(){ $$('#commWrap [data-pollvoter]').forEach(function(sel){ sel.addEventListener('change',function(){ pollVoters[this.getAttribute('data-pollvoter')]=this.value; renderComm(); }); }); }
 function renderNotes(){
 var lists=FD.data.noteLists;
 var head='<div class="mlist__head"><span class="eyebrow">Shared notes, everyone can add</span><button class="btn btn--primary" data-modal="noteList"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>New note</button></div>';
 if(!lists.length) return head+'<div class="comm-empty">No shared notes yet.</div>';
 var cards=lists.map(function(n){
 var items = n.items.length ? n.items.map(function(it){ return '<div class="noteitem'+(it.done?' is-done':'')+'"><button class="noteitem__chk'+(it.done?' is-on':'')+'" data-noteitem data-lid="'+n.id+'" data-iid="'+it.id+'" aria-label="Toggle"><svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4 4 10-10"/></svg></button><span class="noteitem__txt">'+esc(it.text)+'</span><button class="noteitem__x" data-noteitemdel data-lid="'+n.id+'" data-iid="'+it.id+'" aria-label="Remove"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>'; }).join('') : '<p class="note-empty">Nothing here yet.</p>';
 return '<div class="notecard"><div class="notecard__hd"><h3 class="notecard__title">'+esc(n.title)+'</h3><button class="notecard__del" data-notelistdel="'+n.id+'" aria-label="Delete list"><svg class="ico" viewBox="0 0 24 24"><path d="M19 7 18 19.5a2 2 0 0 1-2 1.5H8a2 2 0 0 1-2-1.5L5 7M3.5 7h17M9.5 7V4.5a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5V7"/></svg></button></div><div class="notecard__items">'+items+'</div><div class="noteadd"><input type="text" class="note-add-input" id="noteinput-'+n.id+'" data-lid="'+n.id+'" placeholder="Add an item\u2026" maxlength="120"><button class="noteadd__btn" data-noteadd="'+n.id+'"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button></div></div>';
 }).join('');
 return head+'<div class="note-list">'+cards+'</div>';
 }
  /* ===================== AI ASSISTANT ENGINE ===================== */
  var aiThread = [];
  var aiBusy = false;
  var AI_KEY = 'fw.ai.thread';
  function aiLoadThread(){
    try{
      // one-time migrate from old local-only storage into synced FD.data.ai
      if((!FD.data.ai.thread||!FD.data.ai.thread.length)){ var old=Store.get(AI_KEY,null); if(Array.isArray(old)&&old.length){ FD.data.ai.thread=old; } }
      if(Array.isArray(FD.data.ai.thread)) aiThread=FD.data.ai.thread.slice();
    }catch(e){}
  }
  function aiSaveThread(){ try{ FD.data.ai.thread=aiThread.slice(-40); FD.save(); }catch(e){} }
  var AI_HIST='fw.ai.history';
  function aiLoadHist(){
    try{
      if((!FD.data.ai.history||!FD.data.ai.history.length)){ var old=Store.get(AI_HIST,null); if(Array.isArray(old)&&old.length){ FD.data.ai.history=old; } }
      if(Array.isArray(FD.data.ai.history)) return FD.data.ai.history;
    }catch(e){}
    return [];
  }
  function aiSaveHist(list){ try{ FD.data.ai.history=list.slice(-30); FD.save(); }catch(e){} }
  var aiCurrentId=null;  // id of the conversation currently being viewed/continued
  function aiArchiveCurrent(){
    var real=aiThread.filter(function(m){ return m.content && m.content!=='__NEEDKEY__' && m.content!=='__BADKEY__'; });
    if(real.length<2) return;   // nothing worth saving
    var hist=aiLoadHist();
    var firstUser=real.filter(function(m){return m.role==='user';})[0];
    var title=firstUser ? firstUser.content.slice(0,60) : 'Conversation';
    if(aiCurrentId){
      // UPDATE the existing conversation (no duplicate)
      var found=false;
      for(var i=0;i<hist.length;i++){ if(hist[i].id===aiCurrentId){ hist[i].thread=real; hist[i].title=title; hist[i].ts=Date.now(); found=true; break; } }
      if(!found){ hist.push({ id:aiCurrentId, title:title, ts:Date.now(), thread:real }); }
    } else {
      // brand-new conversation -> create an id so future saves update it
      aiCurrentId='c'+Date.now();
      hist.push({ id:aiCurrentId, title:title, ts:Date.now(), thread:real });
    }
    aiSaveHist(hist);
  }
  var aiView='chat';  // 'chat' | 'history'
  function familySnapshot(){
    var d=FD.data, S=[], sym=(typeof curSymbol==='function'?curSymbol():'$');
    var today=(typeof todayStr==='function')?todayStr():new Date().toISOString().slice(0,10);
    S.push('# FAMILY SNAPSHOT (as of '+today+')');
    if(d.members.length){
      S.push('\n## Members ('+d.members.length+')');
      d.members.forEach(function(m){
        var bits=[m.name];
        if(m.relation) bits.push(m.relation);
        if(m.dob){ var age=Math.floor((Date.now()-new Date(m.dob))/31557600000); if(age>0&&age<130) bits.push(age+' yrs'); }
        if(m.role) bits.push('role: '+m.role);
        var line='- '+bits.join(', ');
        var health=[];
        if((m.allergies||[]).length) health.push('allergies: '+m.allergies.map(function(a){return a.name||a;}).join('/'));
        if((m.conditions||[]).length) health.push('conditions: '+m.conditions.map(function(a){return a.name||a;}).join('/'));
        if((m.medications||[]).length) health.push(m.medications.length+' medication(s)');
        if(m.health&&m.health.blood) health.push('blood '+m.health.blood);
        if(health.length) line+=' ('+health.join('; ')+')';
        S.push(line);
      });
    } else { S.push('\n## Members\n- (none added yet)'); }
    var tasks=(d.planning&&d.planning.tasks)||[];
    var openT=tasks.filter(function(t){return !t.done;});
    if(tasks.length){
      S.push('\n## Tasks ('+openT.length+' open / '+tasks.length+' total)');
      openT.slice(0,25).forEach(function(t){
        var b='- '+(t.title||'Task');
        if(t.priority&&t.priority!=='Normal') b+=' ['+t.priority+']';
        if(t.due) b+=' due '+t.due;
        if(t.member) b+=' @'+t.member;
        if(t.projectId&&typeof projectName==='function'){ var pn=projectName(t.projectId); if(pn) b+=' /'+pn; }
        if((t.subs||[]).length){ var dn=t.subs.filter(function(s){return s.done;}).length; b+=' ('+dn+'/'+t.subs.length+' subtasks)'; }
        S.push(b);
      });
    }
    var projs=(d.planning&&d.planning.projects)||[];
    if(projs.length){
      S.push('\n## Projects ('+projs.length+')');
      projs.forEach(function(p){
        var pt=tasks.filter(function(t){return t.projectId===p.id;});
        var done=pt.filter(function(t){return t.done;}).length;
        S.push('- '+(p.name||'Project')+': '+done+'/'+pt.length+' tasks done'+(p.note?' \u2014 '+p.note:''));
      });
    }
    var fin=d.finance||{};
    var tx=fin.transactions||[];
    if(tx.length){
      var ym=today.slice(0,7);
      var inc=0, exp=0;
      tx.forEach(function(t){ if(String(t.date||'').slice(0,7)===ym){ if(t.type==='income') inc+=(+t.amount||0); else exp+=(+t.amount||0); } });
      S.push('\n## Finance (this month)');
      S.push('- Income: '+sym+inc.toFixed(0)+' | Spent: '+sym+exp.toFixed(0)+' | Net: '+sym+(inc-exp).toFixed(0));
      if((fin.debts||[]).length) S.push('- '+fin.debts.length+' debt/loan record(s) tracked');
      if((fin.savings||[]).length){ S.push('- Savings goals: '+fin.savings.map(function(s){return (s.name||'goal')+' '+sym+(+s.saved||0)+'/'+sym+(+s.target||0);}).join(', ')); }
    }
    var evs=(d.events||[]).filter(function(e){ return String(e.date||'').slice(0,10)>=today; }).sort(function(a,b){return String(a.date).localeCompare(String(b.date));});
    if(evs.length){
      S.push('\n## Upcoming events');
      evs.slice(0,10).forEach(function(e){ S.push('- '+(e.title||'Event')+' on '+String(e.date).slice(0,10)+(e.location?' @ '+e.location:'')); });
    }
    var apptCount=0; d.members.forEach(function(m){ apptCount+=(m.records||[]).filter(function(r){return r.next&&String(r.next)>=today;}).length; });
    if(apptCount) S.push('\n## Health\n- '+apptCount+' upcoming appointment(s) across the family');
    var chores=(d.home&&d.home.chores)||[];
    var openC=chores.filter(function(c){return !c.done;});
    if(openC.length) S.push('\n## Home\n- '+openC.length+' open chore(s)');
    var wo=(d.fitness&&d.fitness.workouts)||[];
    if(wo.length){ var wk=wo.filter(function(w){ return (Date.now()-new Date(w.date||0))<604800000; }).length; if(wk) S.push('\n## Fitness\n- '+wk+' workout(s) logged this week'); }
    /* ===== full-app awareness: every remaining module ===== */
    try{
      function _n(a){ return (a&&a.length)||0; }
      function _cut(s,n){ s=String(s||''); return s.length>n?(s.slice(0,n)+'\u2026'):s; }
      function _list(arr,n,fn){ return arr.slice(0,n).map(fn).join('; '); }

      /* Home: maintenance + supplies */
      var hm=(d.home&&d.home.maint)||[], hs=(d.home&&d.home.supplies)||[];
      var hmDue=hm.filter(function(x){ return !x.done; });
      var hsLow=hs.filter(function(x){ return x.status && String(x.status).toLowerCase()!=='ok' && String(x.status).toLowerCase()!=='in stock'; });
      if(hmDue.length||hsLow.length){
        var hL=[];
        if(hmDue.length) hL.push('- '+hmDue.length+' maintenance job(s) open: '+_list(hmDue,5,function(x){ return (x.title||'job')+(x.area?' ['+x.area+']':'')+(x.due?' due '+x.due:''); }));
        if(hsLow.length) hL.push('- Supplies needing attention: '+_list(hsLow,8,function(x){ return (x.name||'item')+' ('+x.status+')'; }));
        S.push('\n## Home upkeep\n'+hL.join('\n'));
      }

      /* Cooking: recipes, planned meals, shopping */
      var ck=d.cooking||{}, rec=ck.recipes||[], mls=ck.meals||[], shop=ck.shopping||[];
      var shopOpen=shop.filter(function(x){ return !x.done; });
      var mealsSoon=mls.filter(function(m){ return String(m.date||'')>=today; }).sort(function(a,b){ return String(a.date).localeCompare(String(b.date)); });
      if(rec.length||mealsSoon.length||shopOpen.length){
        var cL=[];
        if(rec.length) cL.push('- '+rec.length+' recipe(s) saved: '+_list(rec,8,function(r){ return (r.name||'recipe')+(r.cat?' ('+r.cat+')':''); }));
        if(mealsSoon.length) cL.push('- Upcoming meals: '+_list(mealsSoon,6,function(m){ return String(m.date)+' '+(m.slot||'')+' \u2192 '+(m.dish||m.custom||''); }));
        if(shopOpen.length) cL.push('- Shopping list ('+shopOpen.length+'): '+_list(shopOpen,12,function(x){ return (x.name||'item')+(x.qty?' x'+x.qty:''); }));
        S.push('\n## Kitchen\n'+cL.join('\n'));
      }

      /* Nutrition */
      var nu=d.nutrition||{}, nmeals=nu.meals||[], water=nu.water||[], habits=nu.habits||[];
      var nToday=nmeals.filter(function(m){ return String(m.date||'')===today; });
      var wToday=water.filter(function(w){ return String(w.date||'')===today; }).reduce(function(a,w){ return a+(+w.glasses||+w.amount||1); },0);
      if(nToday.length||wToday||habits.length){
        var nL=[];
        if(nToday.length) nL.push('- Today\u2019s meals logged: '+_list(nToday,6,function(m){ return (m.meal||'')+' \u2013 '+_cut(m.what,40)+(m.member?' ('+m.member+')':''); }));
        if(wToday) nL.push('- Water today: '+wToday+' glass(es)');
        if(habits.length) nL.push('- Habits tracked: '+_list(habits,8,function(h){ return (h.title||'habit')+(h.member?' ('+h.member+')':''); }));
        S.push('\n## Nutrition\n'+nL.join('\n'));
      }

      /* Fitness detail */
      var fg=(d.fitness&&d.fitness.goals)||[], rt=(d.fitness&&d.fitness.routines)||[];
      if(fg.length||rt.length){
        var fL=[];
        if(fg.length) fL.push('- Fitness goals: '+_list(fg,6,function(g){ return (g.member?g.member+': ':'')+(g.kind||'goal')+' target '+(g.target||''); }));
        if(rt.length) fL.push('- Routines: '+_list(rt,5,function(r){ return (r.name||'routine')+(r.member?' ('+r.member+')':''); }));
        S.push('\n## Fitness plans\n'+fL.join('\n'));
      }

      /* Learning */
      var ln=d.learning||{}, crs=ln.courses||[], bks=ln.books||[], sks=ln.skills||[];
      if(crs.length||bks.length||sks.length){
        var lL=[];
        if(crs.length) lL.push('- Courses: '+_list(crs,6,function(c){ return (c.title||'course')+(c.member?' ('+c.member+')':'')+' '+(c.progress||0)+'%'; }));
        if(bks.length) lL.push('- Books: '+_list(bks,6,function(b){ return (b.title||'book')+(b.author?' by '+b.author:'')+' '+(b.progress||0)+'%'; }));
        if(sks.length) lL.push('- Skills: '+_list(sks,6,function(x){ return (x.name||'skill')+(x.level?' ('+x.level+')':''); }));
        S.push('\n## Learning\n'+lL.join('\n'));
      }

      /* Travel */
      var tv=d.travel||{}, trips=tv.trips||[], packs=tv.packing||[], ideas=tv.ideas||[];
      var tripsSoon=trips.filter(function(t){ return !t.end || String(t.end)>=today; });
      if(tripsSoon.length||ideas.length||packs.length){
        var tL=[];
        if(tripsSoon.length) tL.push('- Trips: '+_list(tripsSoon,5,function(t){ return (t.dest||'trip')+' '+(t.start||'')+(t.end?' \u2192 '+t.end:''); }));
        if(packs.filter(function(p){return !p.done;}).length) tL.push('- Packing items left: '+packs.filter(function(p){return !p.done;}).length);
        if(ideas.length) tL.push('- Destination ideas: '+_list(ideas,8,function(x){ return (x.place||''); }));
        S.push('\n## Travel\n'+tL.join('\n'));
      }

      /* Journal */
      var jr=d.journal||{}, ent=jr.entries||[], grt=jr.gratitude||[], mil=jr.milestones||[];
      if(ent.length||mil.length||grt.length){
        var jL=[];
        if(ent.length) jL.push('- '+ent.length+' journal entr(ies). Recent: '+_list(ent.slice().sort(function(a,b){return String(b.date).localeCompare(String(a.date));}),4,function(e){ return String(e.date||'')+' '+_cut(e.title,40)+(e.mood?' ['+e.mood+']':''); }));
        if(mil.length) jL.push('- Milestones: '+_list(mil,6,function(m){ return (m.title||'')+' '+(m.date||''); }));
        if(grt.length) jL.push('- '+grt.length+' gratitude note(s) logged');
        S.push('\n## Journal\n'+jL.join('\n'));
      }

      /* Wellbeing */
      var wb=d.wellbeing||{}, chk=wb.checkins||[], care=wb.selfcare||[], grw=wb.growth||[];
      if(chk.length||care.length||grw.length){
        var wL=[];
        var lastChk=chk.slice().sort(function(a,b){return String(b.date).localeCompare(String(a.date));})[0];
        if(lastChk) wL.push('- Latest check-in: '+(lastChk.member||'')+' on '+(lastChk.date||'')+' mood '+(lastChk.mood||'?')+', energy '+(lastChk.energy||'?'));
        if(care.length) wL.push('- Self-care items: '+_list(care,6,function(c){ return (c.title||'')+(c.member?' ('+c.member+')':''); }));
        if(grw.length) wL.push('- Growth goals: '+_list(grw,5,function(g){ return (g.title||''); }));
        S.push('\n## Wellbeing\n'+wL.join('\n'));
      }

      /* Memory */
      var mem=d.memory||{}, alb=mem.albums||[], sto=mem.stories||[], cap=mem.capsules||[];
      if(alb.length||sto.length||cap.length){
        var mL=[];
        if(alb.length) mL.push('- Albums: '+_list(alb,6,function(a){ return (a.name||'album')+' ('+_n(a.photos)+' photo(s))'; }));
        if(sto.length) mL.push('- Stories: '+_list(sto,5,function(x){ return _cut(x.title,40)+(x.when?' ('+x.when+')':''); }));
        if(cap.length) mL.push('- Time capsules: '+_list(cap,5,function(c){ return _cut(c.title,35)+(c.openOn?' opens '+c.openOn:''); }));
        S.push('\n## Memories\n'+mL.join('\n'));
      }

      /* Legacy */
      var lg=d.legacy||{}, dua=lg.duas||[], deed=lg.deeds||[], wis=lg.wisdom||[];
      if(dua.length||deed.length||wis.length){
        var gL=[];
        if(dua.length) gL.push('- Duas saved: '+_list(dua,6,function(x){ return _cut(x.title,40); }));
        if(deed.length) gL.push('- Good deeds logged: '+deed.length+'. Recent: '+_list(deed,4,function(x){ return _cut(x.what,35)+(x.date?' ('+x.date+')':''); }));
        if(wis.length) gL.push('- Wisdom notes: '+_list(wis,4,function(x){ return _cut(x.text,45)+(x.from?' \u2014 '+x.from:''); }));
        S.push('\n## Faith & legacy\n'+gL.join('\n'));
      }

      /* Household admin: responsibilities, documents, announcements */
      var resp=d.responsibilities||[], docs=d.documents||[], anns=d.announcements||[];
      var admL=[];
      if(resp.length) admL.push('- Responsibilities: '+_list(resp,8,function(r){ return (r.title||'')+(r.assignee?' \u2192 '+r.assignee:'')+(r.frequency?' ('+r.frequency+')':''); }));
      if(docs.length){
        var expSoon=docs.filter(function(x){ return x.expiry && String(x.expiry)>=today; }).sort(function(a,b){ return String(a.expiry).localeCompare(String(b.expiry)); });
        var expOver=docs.filter(function(x){ return x.expiry && String(x.expiry)<today; });
        admL.push('- '+docs.length+' document(s) on file'+(expSoon.length?'. Next expiries: '+_list(expSoon,4,function(x){ return (x.title||'doc')+' '+x.expiry; }):'')+(expOver.length?'. EXPIRED: '+_list(expOver,4,function(x){ return (x.title||'doc')+' '+x.expiry; }):''));
      }
      if(anns.length) admL.push('- Latest announcement: '+_cut(anns[anns.length-1].text,90));
      if(admL.length) S.push('\n## Household admin\n'+admL.join('\n'));

      /* Finance depth: planned payments, debts */
      var fin2=d.finance||{}, pl=fin2.planned||[], db=fin2.debts||[];
      var finL=[];
      if(pl.length) finL.push('- Planned/recurring: '+_list(pl,8,function(p){ return (p.title||'')+' '+sym+(+p.amount||0)+(p.nextDue?' next '+p.nextDue:'')+(p.frequency?' ('+p.frequency+')':''); }));
      if(db.length) finL.push('- Debts: '+_list(db,6,function(x){ return (x.direction||'')+' '+(x.person||'')+' '+sym+(+x.amount||0)+(x.paid?' (paid '+sym+x.paid+')':'')+(x.dueDate?' due '+x.dueDate:''); }));
      if(finL.length) S.push('\n## Money commitments\n'+finL.join('\n'));

      /* Privacy note */
      S.push('\n## Private (not visible to you)\n- Secure Vault and the Relationship space are PIN-protected. You cannot see them and must never ask for their contents, passwords or bank credentials.');
    }catch(_snapErr){ }
    return S.join('\n');
  }
  function aiParseActions(text){
    var actions=[]; var clean=text;
    var re=/\[\[ACTION:(\{[\s\S]*?\})\]\]/g; var m;
    while((m=re.exec(text))!==null){
      try{ var obj=JSON.parse(m[1]); if(obj&&obj.type) actions.push(obj); }catch(e){}
    }
    var docs=aiParseDocs(text);
    clean=text.replace(/\[\[ACTION:\{[\s\S]*?\}\]\]/g,'').replace(/\[\[DOC:\{[\s\S]*?\}\]\]/g,'').replace(/\n{3,}/g,'\n\n').trim();
    if(!clean && actions.length) clean='Here is what I can add for you:';
    if(!clean && docs.length) clean='Your document is ready.';
    return {text:clean, actions:actions, docs:docs};
  }
  function aiActionLabel(a){
    if(AI_ACT_LABEL[a.type]) return AI_ACT_LABEL[a.type]+': '+(a.title||a.name||a.text||a.what||a.dest||a.place||a.person||'added');
    if(a.type==='task') return 'Task: '+(a.title||'Untitled')+(a.due?' \u00b7 due '+a.due:'')+(a.priority&&a.priority!=='Normal'?' \u00b7 '+a.priority:'');
    if(a.type==='event') return 'Event: '+(a.title||'Untitled')+(a.date?' \u00b7 '+a.date:'')+(a.time?' '+a.time:'');
    if(a.type==='project') return 'New project: '+(a.name||'Untitled');
    if(a.type==='clear_project') return (a.mode==='delete'?'Delete project: ':'Complete all tasks in: ')+(a.name||'Untitled');
    if(a.type==='task' && a.project) return 'Task: '+(a.title||'Untitled')+' \u00b7 in '+a.project+(a.due?' \u00b7 due '+a.due:'')+(a.priority&&a.priority!=='Normal'?' \u00b7 '+a.priority:'');
    if(a.type==='appointment') return 'Appointment: '+(a.title||'Untitled')+(a.date?' \u00b7 '+a.date:'')+(a.time?' '+a.time:'')+(a.doctor?' \u00b7 '+a.doctor:'');
    if(a.type==='chore') return 'Chore: '+(a.title||'Untitled');
    if(a.type==='expense') return (a.kind==='income'?'Income: ':'Expense: ')+((typeof curSymbol==='function'?curSymbol():'')+(a.amount||0))+(a.category?' \u00b7 '+a.category:'');
    return a.type;
  }
  function aiActionIcon(t){
    var m={ task:'<path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>', project:'<path d="M4 7h6l2 2h8v9a2 2 0 0 1-2 2H4z"/>', clear_project:'<path d="M4 7h6l2 2h8v9a2 2 0 0 1-2 2H4z"/><path d="M9 14l2 2 4-4"/>', event:'<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9h16M8 3v4M16 3v4"/>', appointment:'<path d="M19 14c1.5-1.5 2-3 2-5a5 5 0 0 0-10 0c0 2 .5 3.5 2 5l3 3z"/><circle cx="16" cy="9" r="1.5"/>', chore:'<path d="M4 7h16M6 7v13h12V7M9 7V4h6v3"/>', expense:'<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10h3.5a1.5 1.5 0 0 1 0 3h-2a1.5 1.5 0 0 0 0 3H15"/>' };
    return '<svg class="ico" viewBox="0 0 24 24">'+(m[t]||m.task)+'</svg>';
  }
  /* ===================== AI: full-app action registry ===================== */
  function aiToday(){ return (typeof todayStr==='function')?todayStr():new Date().toISOString().slice(0,10); }
  function aiStr(v){ return (v===undefined||v===null)?'':String(v); }
  function aiNum(v){ var n=Number(v); return isNaN(n)?0:n; }
  function aiPct(v){ var n=parseInt(v,10); if(isNaN(n)) n=0; return Math.max(0,Math.min(100,n)); }
  function aiLines(v){
    if(Array.isArray(v)) return v.map(aiStr).filter(Boolean).join('\n');
    return aiStr(v);
  }
  var AI_ACT={
    /* --- planning / household --- */
    goal:            function(a){ FD.addGoal({ title:aiStr(a.title)||'Goal', owner:aiStr(a.owner) }); },
    phase:           function(a){
      var par=null, nm=aiStr(a.project);
      pjAllProjects().some(function(x){ if((x.name||'')===nm && !x.parentId){ par=x; return true; } return false; });
      if(!par) return;
      FD.addProject({ name:aiStr(a.name)||'Phase', note:aiStr(a.note), cat:pjCat(par), prio:aiStr(a.prio)||'normal',
        status:'active', pinned:false, order:pjChildren(par.id).length, members:[], parentId:par.id,
        goalId:par.goalId||'', due:aiStr(a.due) });
    },
    announcement:    function(a){ FD.addAnnouncement({ text:aiStr(a.text), author:aiStr(a.author) }); },
    responsibility:  function(a){ FD.addResponsibility({ title:aiStr(a.title)||'Responsibility', assignee:aiStr(a.assignee), frequency:aiStr(a.frequency)||'Weekly', note:aiStr(a.note) }); },
    document:        function(a){ FD.addDocument({ title:aiStr(a.title)||'Document', category:aiStr(a.category)||'Other', owner:aiStr(a.owner), expiry:aiStr(a.expiry), note:aiStr(a.note), attachments:[] }); },

    /* --- money --- */
    planned:         function(a){ FD.addPlanned({ txtype:(a.txtype==='income'?'income':'expense'), title:aiStr(a.title)||'Payment', amount:aiNum(a.amount), category:aiStr(a.category)||'other', member:aiStr(a.member), frequency:aiStr(a.frequency)||'Monthly', nextDue:aiStr(a.nextDue)||aiToday(), note:aiStr(a.note) }); },
    debt:            function(a){ FD.addDebt({ direction:aiStr(a.direction)||'I owe', person:aiStr(a.person), amount:aiNum(a.amount), paid:aiNum(a.paid), member:aiStr(a.member), dueDate:aiStr(a.dueDate), note:aiStr(a.note) }); },
    saving:          function(a){ FD.addSaving({ title:aiStr(a.title)||'Savings goal', target:aiNum(a.target), saved:aiNum(a.saved), member:aiStr(a.member), targetDate:aiStr(a.targetDate), note:aiStr(a.note) }); },

    /* --- home --- */
    maint:           function(a){ FD.addMaint({ title:aiStr(a.title)||'Maintenance', area:aiStr(a.area), due:aiStr(a.due), note:aiStr(a.note), done:false }); },
    supply:          function(a){ FD.addSupply({ name:aiStr(a.name)||'Item', cat:aiStr(a.cat)||'Other', status:aiStr(a.status)||'Low' }); },

    /* --- kitchen --- */
    shopping:        function(a){ FD.addShopItem({ name:aiStr(a.name)||'Item', qty:aiStr(a.qty), done:false }); },
    recipe:          function(a){ FD.addRecipe({ name:aiStr(a.name)||'Recipe', cat:aiStr(a.cat)||'Dinner', time:aiStr(a.time), serves:aiStr(a.serves), ingredients:aiLines(a.ingredients), steps:aiLines(a.steps) }); },
    mealplan:        function(a){ FD.addMeal({ date:aiStr(a.date)||aiToday(), slot:aiStr(a.slot)||'Dinner', dish:aiStr(a.dish), custom:aiStr(a.custom||a.dish) }); },

    /* --- nutrition --- */
    nmeal:           function(a){ FD.addNMeal({ date:aiStr(a.date)||aiToday(), meal:aiStr(a.meal)||'Lunch', what:aiStr(a.what), quality:aiStr(a.quality), member:aiStr(a.member), note:aiStr(a.note) }); },
    habit:           function(a){ FD.addHabit({ title:aiStr(a.title)||'Habit', member:aiStr(a.member) }); },

    /* --- fitness --- */
    workout:         function(a){ FD.addWorkout({ date:aiStr(a.date)||aiToday(), type:aiStr(a.type)||'Workout', minutes:aiNum(a.minutes), member:aiStr(a.member), note:aiStr(a.note) }); },
    fitgoal:         function(a){ FD.addFitGoal({ member:aiStr(a.member), kind:aiStr(a.kind)||'Steps', target:aiStr(a.target) }); },
    routine:         function(a){ FD.addRoutine({ name:aiStr(a.name)||'Routine', member:aiStr(a.member), days:aiStr(a.days), items:aiLines(a.items) }); },

    /* --- learning --- */
    course:          function(a){ FD.addCourse({ title:aiStr(a.title)||'Course', member:aiStr(a.member), subject:aiStr(a.subject), source:aiStr(a.source), progress:aiPct(a.progress), note:aiStr(a.note) }); },
    book:            function(a){ FD.addBook({ title:aiStr(a.title)||'Book', author:aiStr(a.author), member:aiStr(a.member), progress:aiPct(a.progress), note:aiStr(a.note) }); },
    skill:           function(a){ FD.addSkill({ name:aiStr(a.name)||'Skill', member:aiStr(a.member), level:aiStr(a.level)||'Beginner', note:aiStr(a.note) }); },

    /* --- travel --- */
    trip:            function(a){ FD.addTrip({ dest:aiStr(a.dest)||'Trip', start:aiStr(a.start), end:aiStr(a.end), travelers:aiStr(a.travelers), note:aiStr(a.note) }); },
    idea:            function(a){ FD.addIdea({ place:aiStr(a.place)||'Idea', note:aiStr(a.note) }); },

    /* --- journal --- */
    journal:         function(a){ FD.addJournalEntry({ date:aiStr(a.date)||aiToday(), title:aiStr(a.title)||'Entry', mood:aiStr(a.mood), member:aiStr(a.member), tags:aiStr(a.tags), body:aiStr(a.body) }); },
    milestone:       function(a){ FD.addMilestone({ title:aiStr(a.title)||'Milestone', date:aiStr(a.date)||aiToday(), member:aiStr(a.member), note:aiStr(a.note) }); },

    /* --- wellbeing --- */
    checkin:         function(a){ FD.addCheckin({ date:aiStr(a.date)||aiToday(), member:aiStr(a.member), mood:aiStr(a.mood), energy:aiStr(a.energy), note:aiStr(a.note) }); },
    selfcare:        function(a){ FD.addCare({ title:aiStr(a.title)||'Self-care', member:aiStr(a.member) }); },
    growth:          function(a){ FD.addGrowth({ title:aiStr(a.title)||'Growth goal', member:aiStr(a.member), why:aiStr(a.why) }); },

    /* --- memories --- */
    album:           function(a){ FD.addAlbum({ name:aiStr(a.name)||'Album', note:aiStr(a.note), photos:[] }); },
    story:           function(a){ FD.addStory({ title:aiStr(a.title)||'Story', when:aiStr(a.when), who:aiStr(a.who), body:aiStr(a.body) }); },
    capsule:         function(a){ FD.addCapsule({ title:aiStr(a.title)||'Time capsule', openOn:aiStr(a.openOn), from:aiStr(a.from), body:aiStr(a.body) }); },

    /* --- faith & legacy --- */
    dua:             function(a){ FD.addDua({ title:aiStr(a.title)||'Dua', text:aiStr(a.text), note:aiStr(a.note) }); },
    deed:            function(a){ FD.addDeed({ what:aiStr(a.what)||'Good deed', date:aiStr(a.date)||aiToday(), member:aiStr(a.member), note:aiStr(a.note) }); },
    wisdom:          function(a){ FD.addWisdom({ text:aiStr(a.text), from:aiStr(a.from), when:aiStr(a.when) }); }
  };
  var AI_ACT_LABEL={
    goal:'Family goal', phase:'Project phase', announcement:'Announcement', responsibility:'Responsibility', document:'Document',
    planned:'Planned payment', debt:'Debt record', saving:'Savings goal',
    maint:'Maintenance job', supply:'Supply item',
    shopping:'Shopping item', recipe:'Recipe', mealplan:'Planned meal',
    nmeal:'Meal log', habit:'Habit', workout:'Workout', fitgoal:'Fitness goal', routine:'Routine',
    course:'Course', book:'Book', skill:'Skill', trip:'Trip', idea:'Travel idea',
    journal:'Journal entry', milestone:'Milestone', checkin:'Well-being check-in',
    selfcare:'Self-care item', growth:'Growth goal', album:'Photo album', story:'Family story',
    capsule:'Time capsule', dua:'Dua', deed:'Good deed', wisdom:'Wisdom note'
  };

  /* ===================== AI: Wisal document generator ===================== */
  /* ---- full markdown renderer, for documents only (chat keeps aiMd) ---- */
  function aiDocInline(s){
    s=esc(s);
    s=s.replace(/`([^`]+)`/g,'<code>$1</code>');
    s=s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
    s=s.replace(/__([^_]+)__/g,'<strong>$1</strong>');
    s=s.replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<em>$2</em>');
    s=s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g,'<a href="$2">$1</a>');
    return s;
  }
  function aiDocMd(src){
    var lines=String(src||'').replace(/\r/g,'').split('\n');
    var out=[], i=0;
    function listBlock(ordered, baseIndent){
      var tag=ordered?'ol':'ul', html='<'+tag+'>';
      while(i<lines.length){
        var L=lines[i];
        var mU=L.match(/^(\s*)[-*\u2022]\s+(.*)$/);
        var mO=L.match(/^(\s*)\d+[.)]\s+(.*)$/);
        var m=ordered?mO:mU;
        var other=ordered?mU:mO;
        if(!m){
          if(other && other[1].length>baseIndent){ html+=listBlock(!ordered, other[1].length); continue; }
          break;
        }
        var ind=m[1].length;
        if(ind<baseIndent) break;
        if(ind>baseIndent){ html+=listBlock(ordered, ind); continue; }
        var item=m[2];
        i++;
        /* nested list directly under this item */
        var nxtU=(i<lines.length)?lines[i].match(/^(\s*)[-*\u2022]\s+/):null;
        var nxtO=(i<lines.length)?lines[i].match(/^(\s*)\d+[.)]\s+/):null;
        var inner='';
        if(nxtU && nxtU[1].length>baseIndent) inner=listBlock(false, nxtU[1].length);
        else if(nxtO && nxtO[1].length>baseIndent) inner=listBlock(true, nxtO[1].length);
        html+='<li>'+aiDocInline(item)+inner+'</li>';
      }
      return html+'</'+tag+'>';
    }
    function isTableSep(s){ return /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(s) && s.indexOf('-')>-1; }
    function cells(row){
      var r=row.trim().replace(/^\||\|$/g,'');
      return r.split('|').map(function(c){ return c.trim(); });
    }
    while(i<lines.length){
      var L=lines[i];

      if(/^\s*$/.test(L)){ i++; continue; }

      /* fenced code */
      if(/^\s*```/.test(L)){
        i++; var buf=[];
        while(i<lines.length && !/^\s*```/.test(lines[i])){ buf.push(lines[i]); i++; }
        i++;
        out.push('<pre><code>'+esc(buf.join('\n'))+'</code></pre>');
        continue;
      }
      /* horizontal rule */
      if(/^\s*(---|___|\*\*\*)\s*$/.test(L)){ out.push('<hr>'); i++; continue; }
      /* heading */
      var h=L.match(/^\s*(#{1,6})\s+(.*)$/);
      if(h){ var lv=Math.min(h[1].length,4); out.push('<h'+lv+'>'+aiDocInline(h[2].replace(/\s*#+\s*$/,''))+'</h'+lv+'>'); i++; continue; }
      /* table */
      if(L.indexOf('|')>-1 && i+1<lines.length && isTableSep(lines[i+1])){
        var head=cells(L); i+=2;
        var t='<table><thead><tr>'+head.map(function(c){ return '<th>'+aiDocInline(c)+'</th>'; }).join('')+'</tr></thead><tbody>';
        while(i<lines.length && lines[i].indexOf('|')>-1 && !/^\s*$/.test(lines[i])){
          var rc=cells(lines[i]);
          t+='<tr>'+rc.map(function(c){ return '<td>'+aiDocInline(c)+'</td>'; }).join('')+'</tr>';
          i++;
        }
        out.push(t+'</tbody></table>');
        continue;
      }
      /* blockquote */
      if(/^\s*>\s?/.test(L)){
        var q=[];
        while(i<lines.length && /^\s*>\s?/.test(lines[i])){ q.push(lines[i].replace(/^\s*>\s?/,'')); i++; }
        out.push('<blockquote>'+aiDocMd(q.join('\n'))+'</blockquote>');
        continue;
      }
      /* lists */
      var uu=L.match(/^(\s*)[-*\u2022]\s+/);
      if(uu){ out.push(listBlock(false, uu[1].length)); continue; }
      var oo=L.match(/^(\s*)\d+[.)]\s+/);
      if(oo){ out.push(listBlock(true, oo[1].length)); continue; }
      /* paragraph */
      var para=[];
      while(i<lines.length && !/^\s*$/.test(lines[i])
            && !/^\s*(#{1,6})\s+/.test(lines[i])
            && !/^\s*[-*\u2022]\s+/.test(lines[i])
            && !/^\s*\d+[.)]\s+/.test(lines[i])
            && !/^\s*>/.test(lines[i])
            && !/^\s*```/.test(lines[i])
            && !/^\s*(---|___|\*\*\*)\s*$/.test(lines[i])
            && !(lines[i].indexOf('|')>-1 && i+1<lines.length && isTableSep(lines[i+1]))){
        para.push(lines[i]); i++;
      }
      if(para.length) out.push('<p>'+aiDocInline(para.join('\n')).replace(/\n/g,'<br>')+'</p>');
    }
    return out.join('\n');
  }
  function aiParseDocs(text){
    var docs=[], re=/\[\[DOC:(\{[\s\S]*?\})\]\]/g, m;
    while((m=re.exec(text))!==null){
      try{ var o=JSON.parse(m[1]); if(o&&o.body) docs.push({ title:aiStr(o.title)||'Wisal document', subtitle:aiStr(o.subtitle), body:aiStr(o.body) }); }catch(e){}
    }
    return docs;
  }
  function aiDocDateLabel(){
    var d=new Date(), MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
    return d.getDate()+' '+MN[d.getMonth()]+' '+d.getFullYear();
  }
  function aiDocGet(mi,di){
    var msg=aiThread[mi]; if(!msg||!msg.docs) return null;
    return msg.docs[di]||null;
  }
  /* ===== Wisal document viewer: in-app, no pop-ups, prints reliably ===== */
  var WISAL_MARK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="7.85" cy="12" r="5.7" stroke-dasharray="2.64 3.34 29.84"/><circle cx="16.15" cy="12" r="5.7" stroke-dasharray="20.54 3.34 11.93"/></svg>';
  function wdocClose(){
    var el=document.getElementById('wdoc');
    if(el){ el.classList.remove('is-open'); setTimeout(function(){ var e2=document.getElementById('wdoc'); if(e2&&e2.parentNode) e2.parentNode.removeChild(e2); },260); }
    document.documentElement.classList.remove('wdoc-print');
    try{ unlockScroll('wdoc'); }catch(e){}
  }
  function wdocOpen(mi,di,thenPrint){
    var doc=aiDocGet(mi,di); if(!doc) return;
    var old=document.getElementById('wdoc'); if(old&&old.parentNode) old.parentNode.removeChild(old);
    var fam=''; try{ fam=aiStr(familyName()); }catch(e){}
    var when=aiDocDateLabel();
    var el=document.createElement('div');
    el.className='wdoc'; el.id='wdoc'; el.setAttribute('role','dialog');
    el.innerHTML=
      '<div class="wdoc__bar">'
      + '<button class="wdoc__x" type="button" data-wdocclose="1" aria-label="Close">'
      +   '<svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>'
      + '<span class="wdoc__bt">'+esc(doc.title)+'</span>'
      + '<button class="wdoc__pdf" type="button" data-wdocprint="1">'
      +   '<svg class="ico" viewBox="0 0 24 24"><path d="M7 9V4.5h10V9M7 17.5h10V21H7z"/><rect x="4" y="9" width="16" height="8.5" rx="2"/></svg>Save as PDF</button>'
      + '</div>'
      + '<div class="wdoc__scroll"><article class="wdoc__page">'
      +   '<header class="wdoc__hd"><span class="wdoc__mark">'+WISAL_MARK+'</span>'
      +     '<span class="wdoc__id"><span class="wdoc__bn">Wisal</span>'
      +     '<span class="wdoc__bs">'+(fam?esc(fam)+' \u00b7 ':'')+'Family OS</span></span>'
      +     '<span class="wdoc__sp"></span><span class="wdoc__dt">'+esc(when)+'</span></header>'
      +   '<h1 class="wdoc__t">'+esc(doc.title)+'</h1>'
      +   (doc.subtitle?'<p class="wdoc__st">'+esc(doc.subtitle)+'</p>':'')
      +   '<div class="wdoc__ct">'+aiDocMd(doc.body)+'</div>'
      +   '<footer class="wdoc__ft">Generated by Wisal AI \u00b7 '+esc(when)+' \u00b7 wisal.family</footer>'
      + '</article></div>';
    document.body.appendChild(el);
    try{ lockScroll('wdoc'); }catch(e){}
    setTimeout(function(){ el.classList.add('is-open'); },12);
    if(thenPrint) setTimeout(function(){ wdocPrint(); },420);
  }
  function wdocPrint(){
    if(!document.getElementById('wdoc')) return;
    document.documentElement.classList.add('wdoc-print');
    setTimeout(function(){
      try{ window.print(); }catch(e){}
      setTimeout(function(){ document.documentElement.classList.remove('wdoc-print'); },800);
    },90);
  }
  function aiDocOpen(mi,di){ wdocOpen(mi,di,false); }
  function aiDocPDF(mi,di){ wdocOpen(mi,di,true); }
  function aiDocCard(m,mi){
    return '<div class="aidoc">'+m.docs.map(function(d,di){
      return '<div class="aidoc__row">'
       + '<span class="aidoc__ic"><svg class="ico" viewBox="0 0 24 24"><path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"/><path d="M13.5 3.6V8h4.4"/><path d="M9 13h6M9 16.5h4"/></svg></span>'
       + '<span class="aidoc__m"><span class="aidoc__t">'+esc(d.title)+'</span><span class="aidoc__s">Wisal document \u00b7 '+esc(aiDocDateLabel())+'</span></span>'
       + '<button class="aidoc__b aidoc__b--pri" type="button" data-aidocopen="'+mi+':'+di+'">Open</button>'
       + '<button class="aidoc__b" type="button" data-aidocdl="'+mi+':'+di+'">'
       + '<svg class="ico" viewBox="0 0 24 24"><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/></svg>PDF</button>'
       + '</div>';
    }).join('')+'</div>';
  }
  function aiExecuteActions(msgIndex){
    var msg=aiThread[msgIndex]; if(!msg||!msg.actions) return;
    var done=[];
    msg.actions.forEach(function(a){
      try{
        if(AI_ACT[a.type]){ AI_ACT[a.type](a); done.push(a); return; }
        if(a.type==='task'){
          var subs=(a.subs&&a.subs.length)?a.subs.map(function(s){return {t:String(s),done:false};}):[];
          var projId='';
          if(a.project){ var pj=FD.data.planning.projects.filter(function(p){return (p.name||'').toLowerCase()===String(a.project).toLowerCase();})[0]; if(pj) projId=pj.id; }
          FD.addTask({ title:a.title||'Task', due:a.due||'', priority:(a.priority==='High'?'High':'Normal'), member:a.member||'', projectId:projId, note:'', subs:subs, done:false });
          done.push(a);
        } else if(a.type==='event'){
          var evt={ title:a.title||'Event', date:a.date||todayStr(), category:'', location:a.location||'' };
          if(a.time){ evt.time=a.time; evt.allDay=false; } else { evt.allDay=true; }
          if(a.reminder && a.reminder!=='empty'){ var rm={'At time':'0','1 hour before':'60','1 day before':'1440'}; evt.reminder=rm[a.reminder]||''; }
          FD.addEvent(evt);
          done.push(a);
        } else if(a.type==='appointment'){
          var apptDate=a.date||todayStr();
          if(a.time){ apptDate=apptDate+'T'+a.time; } else { apptDate=apptDate+'T09:00'; }
          var memId='';
          if(a.member){ var mm=FD.data.members.filter(function(x){return (x.name||'').toLowerCase()===String(a.member).toLowerCase();})[0]; if(mm) memId=mm.id; }
          if(!memId && FD.data.members[0]) memId=FD.data.members[0].id;
          FD.addEvent({ kind:'appointment', category:'doctor', memberId:memId, apptType:(a.apptType||'Appointment'), title:a.title||'Appointment', date:apptDate, doctor:a.doctor||'', location:a.location||'', notes:a.notes||'' });
          done.push(a);
        } else if(a.type==='project'){
          FD.addProject({ name:a.name||'Project', note:a.note||'' });
          done.push(a);
        } else if(a.type==='clear_project'){
          var proj=FD.data.planning.projects.filter(function(p){return (p.name||'').toLowerCase()===String(a.name||'').toLowerCase();})[0];
          if(proj){
            if(a.mode==='delete'){ FD.removeProject(proj.id); }
            else { FD.data.planning.tasks.forEach(function(t){ if(t.projectId===proj.id){ t.done=true; } }); FD.save(); }
            done.push(a);
          }
        } else if(a.type==='chore'){
          FD.addChore({ title:a.title||'Chore', member:a.member||'', done:false });
          done.push(a);
        } else if(a.type==='expense'){
          FD.addTx({ type:(a.kind==='income'?'income':'expense'), amount:Number(a.amount)||0, category:a.category||'General', note:a.note||'', date:todayStr() });
          done.push(a);
        }
      }catch(e){}
    });
    msg.actionState='done';
    aiSaveThread();
    try{ refreshAll(); }catch(e){}
    renderComm();
    if(typeof flash==='function') flash(done.length+' added to Wisal');
  }
  function aiDismissActions(msgIndex){ var msg=aiThread[msgIndex]; if(msg){ msg.actionState='dismissed'; aiSaveThread(); renderComm(); } }
  function aiSystemPrompt(){
    var me=(typeof meMember==='function')?meMember():null;
    var meName=me?me.name:'the user';
    return "You are Wisal, a warm, wise family assistant living inside the family's private operating-system app. "
      + "You can see a live snapshot of the WHOLE family operating system: members, tasks, projects, finances, planned payments, debts, savings, events, health appointments, home chores, maintenance and supplies, the kitchen (recipes, meal plans, shopping list), nutrition, fitness, learning, travel, journal, wellbeing check-ins, memories, faith and legacy, responsibilities and documents. "
      + "You are speaking with "+meName+". "
      + "Answer using ONLY the snapshot data provided \u2014 never invent members, numbers, or events that aren't there. "
      + "If asked about something not in the snapshot, say you don't see it yet and suggest where they can add it. "
      + "Be concise, kind and practical. Match the user's language (they often write in Bengali/Banglish or English). "
      + "You may reference specific members, tasks or amounts from the snapshot to be helpful. "
      + "Respect privacy: this data is the family's own.\n\n"
      + "=== ACTIONS YOU CAN TAKE ===\n"
      + "You can DO things in the app, not just talk. When the user asks you to add, create, schedule, remind, or log something, respond with a short friendly sentence AND include an action block at the very end of your message.\n"
      + "Use this EXACT format on its own line (you may include more than one):\n"
      + "[[ACTION:{\"type\":\"task\",\"title\":\"...\",\"due\":\"YYYY-MM-DD\",\"priority\":\"Normal|High\",\"member\":\"name or empty\",\"project\":\"exact project name or empty\",\"subs\":[\"step one\",\"step two\"]}]]\n"
      + "[[ACTION:{\"type\":\"event\",\"title\":\"...\",\"date\":\"YYYY-MM-DD\",\"time\":\"HH:MM or empty\",\"reminder\":\"1 hour before|1 day before|At time|empty\",\"location\":\"...\"}]]\n"
      + "[[ACTION:{\"type\":\"appointment\",\"title\":\"...\",\"date\":\"YYYY-MM-DD\",\"time\":\"HH:MM\",\"member\":\"name or empty\",\"doctor\":\"...\",\"location\":\"...\",\"apptType\":\"Doctor|Dentist|Checkup|Appointment\"}]]\n"
      + "[[ACTION:{\"type\":\"chore\",\"title\":\"...\",\"member\":\"name or empty\"}]]\n"
      + "[[ACTION:{\"type\":\"expense\",\"amount\":123,\"category\":\"...\",\"note\":\"...\",\"kind\":\"expense|income\"}]]\n"
      + "[[ACTION:{\"type\":\"project\",\"name\":\"...\",\"note\":\"short description or empty\"}]]\n"
      + "[[ACTION:{\"type\":\"clear_project\",\"name\":\"exact project name\",\"mode\":\"complete|delete\"}]]\n"
      + "--- Household ---\n"
      + "[[ACTION:{\"type\":\"goal\",\"title\":\"...\",\"owner\":\"name or empty\"}]]\n"
      + "[[ACTION:{\"type\":\"phase\",\"project\":\"exact parent project name\",\"name\":\"Phase 1 \\u2014 ...\",\"due\":\"YYYY-MM-DD\"}]]\n"
      + "[[ACTION:{\"type\":\"announcement\",\"text\":\"...\",\"author\":\"name or empty\"}]]\n"
      + "[[ACTION:{\"type\":\"responsibility\",\"title\":\"...\",\"assignee\":\"name\",\"frequency\":\"Daily|Weekly|Monthly\",\"note\":\"...\"}]]\n"
      + "[[ACTION:{\"type\":\"document\",\"title\":\"...\",\"category\":\"...\",\"owner\":\"name\",\"expiry\":\"YYYY-MM-DD\",\"note\":\"...\"}]]\n"
      + "--- Money ---\n"
      + "[[ACTION:{\"type\":\"planned\",\"txtype\":\"expense|income\",\"title\":\"...\",\"amount\":123,\"category\":\"...\",\"member\":\"\",\"frequency\":\"Monthly\",\"nextDue\":\"YYYY-MM-DD\"}]]\n"
      + "[[ACTION:{\"type\":\"debt\",\"direction\":\"I owe|Owed to me\",\"person\":\"...\",\"amount\":123,\"paid\":0,\"dueDate\":\"YYYY-MM-DD\"}]]\n"
      + "[[ACTION:{\"type\":\"saving\",\"title\":\"...\",\"target\":10000,\"saved\":0,\"member\":\"\",\"targetDate\":\"YYYY-MM-DD\"}]]\n"
      + "--- Home ---\n"
      + "[[ACTION:{\"type\":\"maint\",\"title\":\"...\",\"area\":\"...\",\"due\":\"YYYY-MM-DD\",\"note\":\"...\"}]]\n"
      + "[[ACTION:{\"type\":\"supply\",\"name\":\"...\",\"cat\":\"...\",\"status\":\"Low|Out|OK\"}]]\n"
      + "--- Kitchen ---\n"
      + "[[ACTION:{\"type\":\"shopping\",\"name\":\"...\",\"qty\":\"2kg or empty\"}]]\n"
      + "[[ACTION:{\"type\":\"recipe\",\"name\":\"...\",\"cat\":\"Breakfast|Lunch|Dinner|Snack\",\"time\":\"30 min\",\"serves\":\"4\",\"ingredients\":[\"...\"],\"steps\":[\"...\"]}]]\n"
      + "[[ACTION:{\"type\":\"mealplan\",\"date\":\"YYYY-MM-DD\",\"slot\":\"Breakfast|Lunch|Dinner\",\"dish\":\"...\"}]]\n"
      + "--- Nutrition & fitness ---\n"
      + "[[ACTION:{\"type\":\"nmeal\",\"date\":\"YYYY-MM-DD\",\"meal\":\"Breakfast|Lunch|Dinner|Snack\",\"what\":\"...\",\"member\":\"\"}]]\n"
      + "[[ACTION:{\"type\":\"habit\",\"title\":\"...\",\"member\":\"\"}]]\n"
      + "[[ACTION:{\"type\":\"workout\",\"date\":\"YYYY-MM-DD\",\"type\":\"Walk|Gym|Run|...\",\"minutes\":30,\"member\":\"\"}]]\n"
      + "[[ACTION:{\"type\":\"fitgoal\",\"member\":\"\",\"kind\":\"Steps|Weight|Workouts\",\"target\":\"8000\"}]]\n"
      + "[[ACTION:{\"type\":\"routine\",\"name\":\"...\",\"member\":\"\",\"days\":\"...\",\"items\":[\"...\"]}]]\n"
      + "--- Learning ---\n"
      + "[[ACTION:{\"type\":\"course\",\"title\":\"...\",\"member\":\"\",\"subject\":\"...\",\"source\":\"...\",\"progress\":0}]]\n"
      + "[[ACTION:{\"type\":\"book\",\"title\":\"...\",\"author\":\"...\",\"member\":\"\",\"progress\":0}]]\n"
      + "[[ACTION:{\"type\":\"skill\",\"name\":\"...\",\"member\":\"\",\"level\":\"Beginner|Intermediate|Advanced\"}]]\n"
      + "--- Travel ---\n"
      + "[[ACTION:{\"type\":\"trip\",\"dest\":\"...\",\"start\":\"YYYY-MM-DD\",\"end\":\"YYYY-MM-DD\",\"travelers\":\"...\"}]]\n"
      + "[[ACTION:{\"type\":\"idea\",\"place\":\"...\",\"note\":\"...\"}]]\n"
      + "--- Journal, wellbeing, memories, faith ---\n"
      + "[[ACTION:{\"type\":\"journal\",\"date\":\"YYYY-MM-DD\",\"title\":\"...\",\"mood\":\"...\",\"member\":\"\",\"body\":\"...\"}]]\n"
      + "[[ACTION:{\"type\":\"milestone\",\"title\":\"...\",\"date\":\"YYYY-MM-DD\",\"member\":\"\"}]]\n"
      + "[[ACTION:{\"type\":\"checkin\",\"date\":\"YYYY-MM-DD\",\"member\":\"\",\"mood\":\"...\",\"energy\":\"...\"}]]\n"
      + "[[ACTION:{\"type\":\"selfcare\",\"title\":\"...\",\"member\":\"\"}]]\n"
      + "[[ACTION:{\"type\":\"growth\",\"title\":\"...\",\"member\":\"\",\"why\":\"...\"}]]\n"
      + "[[ACTION:{\"type\":\"album\",\"name\":\"...\",\"note\":\"...\"}]]\n"
      + "[[ACTION:{\"type\":\"story\",\"title\":\"...\",\"when\":\"...\",\"who\":\"...\",\"body\":\"...\"}]]\n"
      + "[[ACTION:{\"type\":\"capsule\",\"title\":\"...\",\"openOn\":\"YYYY-MM-DD\",\"from\":\"...\",\"body\":\"...\"}]]\n"
      + "[[ACTION:{\"type\":\"dua\",\"title\":\"...\",\"text\":\"...\"}]]\n"
      + "[[ACTION:{\"type\":\"deed\",\"what\":\"...\",\"date\":\"YYYY-MM-DD\",\"member\":\"\"}]]\n"
      + "[[ACTION:{\"type\":\"wisdom\",\"text\":\"...\",\"from\":\"...\",\"when\":\"...\"}]]\n"
      + "\n=== DOCUMENTS YOU CAN WRITE ===\n"
      + "When the user asks for a document, report, plan, letter, summary, checklist, guide or anything they may want to keep, print or share, write it as a document block. It is rendered on Wisal letterhead with the logo and today's date, and can be opened, printed or saved as PDF.\n"
      + "[[DOC:{\"title\":\"...\",\"subtitle\":\"one line or empty\",\"body\":\"# Heading\\n\\nMarkdown body with ## sections, - bullets, **bold** and tables.\"}]]\n"
      + "Document rules \u2014 follow ALL of them:\n"
      + "- Write the FULL document. A real one runs 400\u20131200 words with 3\u20136 '##' sections. Never a stub, never a placeholder, never '...'.\n"
      + "- Open with one short paragraph saying what the document is for. Then the sections. Close with clear next steps.\n"
      + "- Ground every section in the snapshot: real member names, real task titles, real amounts, real dates. If the snapshot lacks something, say so plainly instead of inventing it.\n"
      + "- Use a markdown TABLE whenever you present money, dates, owners or comparisons \u2014 header row, then '|---|' separator, then rows.\n"
      + "- Use '##' for sections and '###' for sub-sections. Use '-' bullets and '1.' numbered steps. Bold key figures with **.\n"
      + "- Assign owners and dates on checklists so the family can act on it.\n"
      + "- JSON safety: the body is ONE JSON string. Write every line break as \\n, escape any double quote as \\\", and never put a raw newline inside it.\n"
      + "- Keep your chat reply to one short sentence; the document carries the detail.\n"
      + "- Use a document for anything long, structured or worth keeping. Never dump a long answer into the chat bubble.\n"
      + "- You may send a document and actions together \u2014 e.g. a plan document plus the tasks it needs.\n"
      + "Rules for actions:\n"
      + "- Todays date is "+((typeof todayStr==='function')?todayStr():'')+". Convert 'tomorrow', 'next Friday', etc. into a real YYYY-MM-DD date.\n"
      + "- Only add an action block when the user clearly wants something created. For questions, just answer normally with no action block.\n"
      + "- For anything medical (doctor, dentist, clinic, checkup, hospital visit) use the appointment type, NOT event \u2014 it belongs in Health so the family can track it there.\n"
      + "- Keep the visible reply short (one or two sentences). Put the JSON action LAST.\n"
      + "- The JSON must be valid: double quotes, no trailing commas. Omit optional fields you do not have instead of guessing.\n"
      + "- To create a new project use the project action. To 'clear a project': mode 'complete' marks all its tasks done; mode 'delete' removes the project (its tasks stay, just unlabelled). Use the EXACT existing project name.\n"
      + "- PROJECTS: If the user says to add a task to a specific project (e.g. 'add X to the Wisal project'), set the project field to the EXACT project name from the snapshot above. If no project is mentioned, leave it empty. Never invent a project name that is not in the list.\n"
      + "- You can act across EVERY part of Wisal, not just tasks. Pick the action type that matches where the item truly belongs: groceries go to shopping, a bill to planned, a walk to workout, a book to book, a memory to story, and so on.\n"
      + "- Do EXACTLY what the user asks, nothing more. If they say add one task, add one task. If they specify a project, member, date or priority, honour it precisely. If something is ambiguous, ask a short question instead of guessing.\n"
      + "- Never put anything from the Secure Vault into an action. You cannot see the vault and must never ask for passwords or bank details.\n\n"
      + familySnapshot();
  }
  function aiRender(){ if(typeof commTab!=='undefined' && commTab==='assistant'){ renderComm(); } }
  var AI_APIKEY='fw.ai.gemini_key';
  function aiGetKey(){ try{ return Store.get(AI_APIKEY,'')||''; }catch(e){ return ''; } }
  function aiSetKey(k){ try{ Store.set(AI_APIKEY, String(k||'').trim()); }catch(e){} }
  function aiHasKey(){ return !!aiGetKey(); }
  var AI_PROXY_URL = SUPA_URL + '/functions/v1/wisal-ai';
  var WISAL_PAY_URL = SUPA_URL + '/functions/v1/wisal-pay'; /* Phase 2: SSLCommerz session creator — deploy this Edge Function to go live */
  function aiBuildContents(){
    var hist = aiThread.filter(function(m){ return m.content && m.content!=='__NEEDKEY__' && m.content!=='__BADKEY__'; }).slice(-12);
    return hist.map(function(m){ return { role:(m.role==='assistant'?'model':'user'), parts:[{text:m.content}] }; });
  }
  function aiFinishReply(out){
    var parsed=aiParseActions(out);
    var msg={role:'assistant', content:parsed.text, ts:Date.now()};
    if(parsed.actions.length){ msg.actions=parsed.actions; msg.actionState='pending'; }
    if(parsed.docs && parsed.docs.length){ msg.docs=parsed.docs; }
    aiThread.push(msg);
    aiBusy=false; aiSaveThread(); aiRender();
  }
  function aiErrorReply(text){
    aiThread.push({role:'assistant', content:text, ts:Date.now()});
    aiBusy=false; aiSaveThread(); aiRender();
  }
  // ---- Path A (default, FREE): call our Supabase proxy; the key lives on the server ----
  function aiSendViaProxy(){
    var contents=aiBuildContents();
    var payload={ system:aiSystemPrompt(), contents:contents, generationConfig:{maxOutputTokens:1024, temperature:0.7} };
    function fire(token){
      var headers={ 'Content-Type':'application/json', 'apikey':SUPA_KEY };
      if(token){ headers['Authorization']='Bearer '+token; }
      fetch(AI_PROXY_URL, { method:'POST', headers:headers, body:JSON.stringify(payload) })
        .then(function(r){ return r.json(); })
        .then(function(data){
          if(data && data.text){ aiFinishReply(data.text); return; }
          if(data && data.kind==='daily_limit'){ aiErrorReply(data.error || 'Daily free limit reached. Add your own key for unlimited use.'); return; }
          if(data && data.kind==='server_key'){ aiErrorReply('The free AI is being set up. You can add your own free key any time from the API key button.'); return; }
          aiErrorReply((data && data.error) ? data.error : 'I could not get a reply. Please try again in a moment.');
        })
        .catch(function(){ aiErrorReply('I could not reach the AI. Check your internet connection and try again.'); });
    }
    // attach the signed-in user's token so the server can rate-limit fairly
    try{
      if(sb && sb.auth && sb.auth.getSession){
        sb.auth.getSession().then(function(r){ var s=r&&r.data&&r.data.session; fire(s?s.access_token:''); }).catch(function(){ fire(''); });
      } else { fire(''); }
    }catch(e){ fire(''); }
  }
  // ---- Path B (optional, power user): call Gemini directly with the user's own key ----
  function aiSendWithKey(key){
    var contents=aiBuildContents();
    var bodyObj={ system_instruction:{ parts:[{ text: aiSystemPrompt() }] }, contents:contents, generationConfig:{ maxOutputTokens:1024, temperature:0.7 } };
    var MODELS=['gemini-3.1-flash-lite','gemini-3.5-flash','gemini-2.5-flash-lite','gemini-flash-latest'];
    var savedModel=Store.get('fw.ai.model',''); if(savedModel){ MODELS=[savedModel].concat(MODELS.filter(function(m){return m!==savedModel;})); }
    function tryModel(idx){
      if(idx>=MODELS.length){ aiErrorReply('The AI models seem unavailable right now. Please try again later.'); return; }
      var model=MODELS[idx];
      fetch("https://generativelanguage.googleapis.com/v1beta/models/"+model+":generateContent", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "x-goog-api-key": key },
        body: JSON.stringify(bodyObj)
      })
      .then(function(r){ return r.json(); })
      .then(function(data){
        var out='';
        try{ if(data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts){ out=data.candidates[0].content.parts.map(function(p){ return p.text||''; }).filter(Boolean).join('\n'); } }catch(e){}
        if(out){ try{ Store.set('fw.ai.model', model); }catch(e){} aiFinishReply(out); return; }
        var em=(data && data.error && data.error.message) ? String(data.error.message) : '';
        if(/API key not valid|API_KEY_INVALID/i.test(em)){ aiThread.push({role:'assistant', content:'__BADKEY__', ts:Date.now()}); aiBusy=false; aiSaveThread(); aiRender(); return; }
        if(/not available|not found|no longer|does not exist|unsupported|deprecated/i.test(em)){ tryModel(idx+1); return; }
        if(/quota|rate|RESOURCE_EXHAUSTED|429/i.test(em)){ aiErrorReply('Your key has hit its limit for now. Please wait a little and try again.'); return; }
        if(em){ tryModel(idx+1); return; }
        aiErrorReply('I could not get a reply. Please try again in a moment.');
      })
      .catch(function(){ if(idx+1<MODELS.length){ tryModel(idx+1); } else { aiErrorReply('I could not reach the AI. Check your internet connection and try again.'); } });
    }
    tryModel(0);
  }
  function aiSend(text){
    if(aiBusy || !text.trim()) return;
    aiThread.push({role:'user', content:text.trim(), ts:Date.now()});
    aiSaveThread(); aiBusy=true; aiRender();
    var key=aiGetKey();
    if(key){ aiSendWithKey(key); }   // user chose their own key
    else { aiSendViaProxy(); }        // default: free, key hidden on server
  }
  function aiMoneyChip(){
    try{
      var tx=((FD.data.finance||{}).transactions)||[];
      var ym=((typeof todayStr==='function')?todayStr():new Date().toISOString().slice(0,10)).slice(0,7);
      var spent=0;
      tx.forEach(function(t){ if(String(t.date||'').slice(0,7)===ym && t.type==='expense') spent+=(Number(t.amount)||0); });
      var sym=(typeof curSymbol==='function')?curSymbol():'';
      function r1(x){ return String(Math.round(x*10)/10); }
      if(spent>=1000000) return sym+r1(spent/1000000)+'M';
      if(spent>=1000) return sym+r1(spent/1000)+'k';
      return sym+Math.round(spent);
    }catch(e){ return '\u2014'; }
  }
  function aiSnapStats(){
    var d=FD.data;
    var tasks=(d.planning&&d.planning.tasks)||[];
    var openT=tasks.filter(function(t){return !t.done;}).length;
    var mem=d.members.length;
    var td=(typeof todayStr==='function')?todayStr():new Date().toISOString().slice(0,10);
    var evs=(d.events||[]).filter(function(e){ return String(e.date||'').slice(0,10)>=td; }).length;
    return [['Members',mem],['Tasks',openT],['Upcoming',evs],['Money',aiMoneyChip()]];
  }
  function aiMd(t){
    // tiny, safe markdown -> html (bold, italics, line breaks, bullets)
    var s=esc(t);
    s=s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
    s=s.replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<em>$2</em>');
    s=s.replace(/^\s*[-\u2022]\s+(.*)$/gm,'<span class="aim-li">$1</span>');
    s=s.replace(/\n/g,'<br>');
    return s;
  }
  function aiKeyCard(isBad){
    return '<div class="aikey">'
      +'<div class="aikey__ic"><svg class="ico" viewBox="0 0 24 24"><path d="M12 3l2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5z"/></svg></div>'
      +'<div class="aikey__ttl">'+(isBad?'That key did not work':'Use your own AI key (optional)')+'</div>'
      +'<div class="aikey__sub">'+(isBad?'Please double-check the key and paste it again.':'The AI already works for free. If you ever hit the daily limit, add your own free Gemini key here for unlimited use \u2014 it stays private on this device.')+'</div>'
      +'<a class="aikey__link" href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Get a free key from Google AI Studio →</a>'
      +'<div class="aikey__row"><input id="aiKeyInput" class="aikey__in" type="password" placeholder="Paste your Gemini API key" autocomplete="off"><button type="button" class="aikey__save" data-aikeysave>Save</button></div>'
      +'<div class="aikey__hint">Your key is stored only in this browser, never sent to us.</div>'
    +'</div>';
  }
  function renderAIHistory(){
    var hist=aiLoadHist().slice().reverse();
    var head='<div class="aihist__head"><button type="button" class="aihist__back" data-aibackchat><svg class="ico" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>Back</button><div class="aihist__ttl">Chat history</div></div>';
    var body;
    if(!hist.length){ body='<div class="aihist__empty">No saved conversations yet. When you start a new chat, the old one is saved here.</div>'; }
    else {
      body='<div class="aihist__list">'+hist.map(function(c){
        var when=new Date(c.ts);
        var dstr=when.toLocaleDateString(undefined,{month:'short',day:'numeric'})+' \u00b7 '+when.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
        var count=c.thread.length;
        return '<div class="aihist__item"><button type="button" class="aihist__open" data-airestore="'+c.id+'"><div class="aihist__itop">'+esc(c.title)+'</div><div class="aihist__isub">'+dstr+' \u00b7 '+count+' messages</div></button><button type="button" class="aihist__del" data-aihistdel="'+c.id+'" aria-label="Delete"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>';
      }).join('')+'</div>';
    }
    return '<div class="aiwrap aiwrap--hist">'+head+'<div class="aihist__scroll">'+body+'</div></div>';
  }
  function aiActionCard(m,mi){
    var items=m.actions.map(function(a){ return '<div class="aiact__item">'+aiActionIcon(a.type)+'<span>'+esc(aiActionLabel(a))+'</span></div>'; }).join('');
    var foot;
    if(m.actionState==='done'){ foot='<div class="aiact__done"><svg class="ico" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>Added to Wisal</div>'; }
    else if(m.actionState==='dismissed'){ foot='<div class="aiact__dismissed">Dismissed</div>'; }
    else { foot='<div class="aiact__btns"><button type="button" class="aiact__no" data-aidismiss="'+mi+'">Not now</button><button type="button" class="aiact__yes" data-aiconfirm="'+mi+'">Add '+(m.actions.length>1?('all '+m.actions.length):'to Wisal')+'</button></div>'; }
    return '<div class="aiact">'+items+foot+'</div>';
  }
  function renderAI(){
    if(aiView==='history') return renderAIHistory();
    var stats=aiSnapStats();
    var chips=stats.map(function(s){ return '<div class="aichip"><span class="aichip__n">'+s[1]+'</span><span class="aichip__l">'+s[0]+'</span></div>'; }).join('');
    var head='<div class="aihead">'
      +'<div class="aihead__top">'
        +'<p class="aihead__sub'+(aiBusy?' is-busy':'')+'">'+(aiBusy?'Thinking\u2026':'Your family\u2019s intelligent operating system.')+'</p>'
      +'</div>'
      +'<div class="aichips">'+chips+'</div>'
    +'</div>';
    var msgs;
    if(!aiThread.length){
      var prompts=[
        'What should I focus on today?',
        'Write me a plan for this week',
        'How is our spending this month?',
        'Add onion and rice to the shopping list'
      ];
      msgs='<div class="aiwelcome">'
        +'<p class="aiwelcome__t">Ask me anything about your family.</p>'
        +'<p class="aiwelcome__s">I can see your members, tasks, projects, finances, events and home \u2014 all private to you.</p>'
        +'<div class="aiprompts">'+prompts.map(function(p){ return '<button type="button" class="aiprompt" data-aiask="'+esc(p).replace(/"/g,'&quot;')+'">'+esc(p)+'</button>'; }).join('')+'</div>'
      +'</div>';
    } else {
      msgs=aiThread.map(function(m,mi){
        if(m.role==='user') return '<div class="aimsg aimsg--me"><div class="aimsg__b">'+esc(m.content).replace(/\n/g,'<br>')+'</div></div>';
        if(m.content==='__NEEDKEY__'||m.content==='__BADKEY__') return aiKeyCard(m.content==='__BADKEY__');
        var actionHtml='';
        if(m.actions&&m.actions.length){ actionHtml=aiActionCard(m,mi); }
        if(m.docs&&m.docs.length){ actionHtml+=aiDocCard(m,mi); }
        return '<div class="aimsg aimsg--ai"><div class="aimsg__av"><svg class="ico" viewBox="0 0 24 24"><path d="M12 3l2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5z"/></svg></div><div class="aimsg__b">'+aiMd(m.content)+actionHtml+'</div></div>';
      }).join('');
      if(aiBusy) msgs+='<div class="aimsg aimsg--ai"><div class="aimsg__av"><svg class="ico" viewBox="0 0 24 24"><path d="M12 3l2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5z"/></svg></div><div class="aimsg__b aityping"><span></span><span></span><span></span></div></div>';
    }

    var histCount=aiLoadHist().length;
    var clearBtn='<div class="aitopbar aitopbar--slim">'
      +(histCount?'<button type="button" class="aiclear aiclear--ghost" data-aihistory>History ('+histCount+')</button>':'')
      +'<button type="button" class="aiclear aiclear--ghost" data-aikeyedit>'+(aiHasKey()?'My key':'Use own key')+'</button>'
      +(aiThread.length?'<button type="button" class="aiclear" data-aiclear>New chat</button>':'')
    +'</div>';
    var composer='<div class="aicomposer"><div class="aicomposer__bar"><textarea id="aiText" class="aicomposer__text" rows="1" placeholder="Ask Wisal about your family\u2026"'+(aiBusy?' disabled':'')+'></textarea><button class="aicbtn" data-aisendbtn type="button" aria-label="Send"'+(aiBusy?' disabled':'')+'><svg class="ico" viewBox="0 0 24 24"><path d="M4 12l16-7-7 16-2.5-6.5L4 12Z"/></svg></button></div></div>';

    return '<div class="aiwrap">'+head+clearBtn+'<div class="aiscroll" id="aiThread"><div class="aithread-inner">'+msgs+'</div></div>'+composer+'</div>';
  }
  function wireAI(){
    var ta=document.getElementById('aiText');
    if(ta){
      ta.addEventListener('keydown',function(e){ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); var v=ta.value; ta.value=''; aiSend(v); } });
      ta.addEventListener('input',function(){ ta.style.height='auto'; ta.style.height=Math.min(ta.scrollHeight,140)+'px'; });
      if(!aiBusy) setTimeout(function(){ try{ ta.focus(); }catch(e){} },40);
    }
    var thread=document.getElementById('aiThread');
    if(thread){ thread.scrollTop=thread.scrollHeight; setTimeout(function(){ var t2=document.getElementById('aiThread'); if(t2) t2.scrollTop=t2.scrollHeight; },30); }

  }
  function aiClear(){ aiArchiveCurrent(); aiThread=[]; aiCurrentId=null; aiSaveThread(); aiView='chat'; renderComm(); }
  function aiOpenHistory(){ aiView='history'; renderComm(); }
  function aiRestore(id){ var hist=aiLoadHist(); for(var i=0;i<hist.length;i++){ if(hist[i].id===id){ aiThread=hist[i].thread.slice(); aiCurrentId=id; aiSaveThread(); aiView='chat'; renderComm(); return; } } }
  function aiDeleteHist(id){ var hist=aiLoadHist().filter(function(c){return c.id!==id;}); aiSaveHist(hist); renderComm(); }
 function renderComm(){
 var host=$('#commWrap'); if(!host) return;
 var tabs=[['assistant','Assistant']];
 var bar=(tabs.length>1)?('<div class="comm-tabs">'+tabs.map(function(t){return '<button class="comm-tab'+(commTab===t[0]?' is-on':'')+'" data-commtab="'+t[0]+'">'+t[1]+'</button>';}).join('')+'</div>'):'';
 var body = commTab==='assistant'?renderAI():commTab==='announce'?renderAnnounce():commTab==='polls'?renderPolls():commTab==='notes'?renderNotes():renderChat();
 host.innerHTML=bar+'<div class="comm-body">'+body+'</div>';
 if(commTab==='assistant') wireAI();
    if(commTab==='chat') wireChat();
 if(commTab==='notes') wireNotes();
 if(commTab==='polls') wirePolls();
 }
 function showComm(){ renderComm(); }
 function sendCommMsg(){ var ta=$('#commText'); if(!ta) return; var val=ta.value.trim(); if(!val) return;
 var ch=FD.getChannel(currentChannelId);
 if(chEditing && ch){ var em=null; ch.messages.forEach(function(x){ if(x.id===chEditing) em=x; }); if(em){ ta.value=''; chEditSave(em,val); return; } chEditing=null; }
 var msg={from:commFrom,text:val};
 if(chReply && ch){ var rs=null; ch.messages.forEach(function(x){ if(x.id===chReply) rs=x; }); if(rs&&rs.rid) msg.replyTo=rs.rid; }
 FD.addMessage(currentChannelId,msg); chReply=null; ta.value=''; renderComm(); var t2=$('#commText'); if(t2) t2.focus(); }
 function dataUrlToBlob(dataUrl){ try{ var parts=dataUrl.split(','); var mime=(parts[0].match(/:(.*?);/)||[])[1]||'application/octet-stream'; var bin=atob(parts[1]); var n=bin.length; var u8=new Uint8Array(n); while(n--){ u8[n]=bin.charCodeAt(n); } return new Blob([u8],{type:mime}); }catch(e){ return null; } }
 function mediaExt(mime){ var map={'image/png':'png','image/jpeg':'jpg','image/jpg':'jpg','image/webp':'webp','image/gif':'gif','audio/webm':'webm','audio/mp4':'m4a','audio/mpeg':'mp3','audio/ogg':'ogg','audio/wav':'wav','application/pdf':'pdf'}; return map[mime]||'bin'; }
 // Upload a Blob to Supabase Storage 'chat-media'; returns a public URL, or null on failure.
 function uploadChatMedia(blob, cb){
   try{
     if(!blob || !(typeof sb!=='undefined' && sb && sb.storage) || !cloudEnabled()){ cb(null); return; }
     var ext=mediaExt(blob.type);
     var uid=(typeof AUTH!=='undefined'&&AUTH.user&&AUTH.user.id)?AUTH.user.id:'anon';
     var path=uid+'/'+Date.now()+'-'+Math.random().toString(36).slice(2,8)+'.'+ext;
     sb.storage.from('chat-media').upload(path, blob, {contentType:blob.type, upsert:false})
       .then(function(res){
         if(res && res.error){ cb(null); return; }
         try{ var pub=sb.storage.from('chat-media').getPublicUrl(path); var url=pub&&pub.data&&pub.data.publicUrl; cb(url||null); }
         catch(e){ cb(null); }
       })
       .catch(function(){ cb(null); });
   }catch(e){ cb(null); }
 }
 function sendCommMedia(file,kind){ fileToAttachment(file,function(att){ if(!att) return;
   function finish(url){ var msg={from:commFrom}; if(kind==='photo'){ if(url) msg.photo=url; else msg.photo=att.dataUrl; } else { msg.file={name:att.name, dataUrl:url||att.dataUrl}; } FD.addMessage(currentChannelId,msg); renderComm(); }
   var blob=dataUrlToBlob(att.dataUrl);
   if(blob && typeof cloudEnabled==='function' && cloudEnabled()){ uploadChatMedia(blob, function(url){ finish(url); }); }
   else { finish(null); }
 }); }
 function wireChat(){
 var ta=$('#commText');
 function toggleSend(){ var has=ta&&ta.value.trim().length>0; var s=document.querySelector('.cbtn--send'), mic=document.querySelector('.cbtn--mic'); if(s) s.hidden=!has; if(mic) mic.hidden=has; if(ta){ ta.style.height='auto'; ta.style.height=Math.min(ta.scrollHeight,120)+'px'; } }
 if(ta){ ta.addEventListener('keydown',function(e){ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendCommMsg(); } }); ta.addEventListener('input',toggleSend); }
 var at=$('#commAttach'); if(at) at.addEventListener('change',function(){ var f=this.files&&this.files[0]; if(f) sendCommMedia(f,/^image\//.test(f.type)?'photo':'file'); this.value=''; });
 var fr=$('#commFrom'); if(fr) fr.addEventListener('change',function(){ commFrom=this.value; });
 var tta=$('#commText'); if(tta) tta.addEventListener('input',function(){ try{ chTyped(); }catch(e){} });
 var thread=$('#commThread'); if(thread) thread.scrollTop=thread.scrollHeight;
 if(isRecording){ var b=document.querySelector('.cbtn--mic'); if(b) b.classList.add('is-rec'); }
 toggleSend();
 }
 function wireNotes(){ $$('#commWrap .note-add-input').forEach(function(inp){ inp.addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); var v=this.value.trim(); if(v){ FD.addNoteItem(this.getAttribute('data-lid'),v,commFrom); renderComm(); } } }); }); }
 function startRec(){ if(!navigator.mediaDevices||!window.MediaRecorder){ flash('Voice notes aren\u2019t supported here'); return; } navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){ recChunks=[]; mediaRec=new MediaRecorder(stream); mediaRec.ondataavailable=function(e){ if(e.data&&e.data.size) recChunks.push(e.data); }; mediaRec.onstop=function(){ var blob=new Blob(recChunks,{type:(mediaRec&&mediaRec.mimeType)||'audio/webm'}); stream.getTracks().forEach(function(t){t.stop();}); if(blob.size>10485760){ flash('Recording is too long'); return; } (function(){ function finish(url){ var rd=new FileReader(); rd.onload=function(){ FD.addMessage(currentChannelId,{from:commFrom,audio:url||rd.result}); renderComm(); }; if(url){ FD.addMessage(currentChannelId,{from:commFrom,audio:url}); renderComm(); } else { rd.readAsDataURL(blob); } } if(typeof cloudEnabled==='function' && cloudEnabled()){ uploadChatMedia(blob, function(url){ finish(url); }); } else { finish(null); } })(); }; mediaRec.start(); isRecording=true; var b=document.querySelector('.cbtn--mic'); if(b) b.classList.add('is-rec'); flash('Recording\u2026 tap again to stop'); }).catch(function(){ flash('Microphone permission denied'); }); }
 function stopRec(){ if(mediaRec && mediaRec.state!=='inactive'){ mediaRec.stop(); } mediaRec=null; isRecording=false; var b=document.querySelector('.cbtn--mic'); if(b) b.classList.remove('is-rec'); }

 /* ---- Reset ---- */
 function resetAll(){
 if(!window.confirm('This clears EVERYTHING on this device, members, health records, finances, documents and settings. If cloud sync is on, your cloud copy stays safe and sign-in will restore it. Continue?')) return;
 Store.clearAll();
 if(history.replaceState) history.replaceState(null,'',location.pathname+location.search);
 location.reload();
 }
 function exportData(){
 var payload={ app:'Wisal', kind:'backup', version:1, exportedAt:new Date().toISOString(), keys:{} };
 try{ for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); if(k&&k.indexOf('fw.')===0) payload.keys[k]=localStorage.getItem(k); } }catch(e){}
 try{ if(!payload.keys['fw.family.data']) payload.keys['fw.family.data']=JSON.stringify(FD.data); }catch(e){}
 var json=JSON.stringify(payload,null,2);
 var blob=new Blob([json],{type:'application/json'});
 var url=URL.createObjectURL(blob);
 var d=new Date(), fn='wisal-backup-'+d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())+'.json';
 var a=document.createElement('a'); a.href=url; a.download=fn; document.body.appendChild(a); a.click();
 setTimeout(function(){ try{ document.body.removeChild(a); }catch(e){} URL.revokeObjectURL(url); },120);
 flash('Backup downloaded');
 Store.set('fw.lastExport', Date.now());
 updateBackupNote();
 }
 function importData(file){
 if(!file) return;
 var rd=new FileReader();
 rd.onload=function(){
 var obj; try{ obj=JSON.parse(rd.result); }catch(e){ flash('That file isn\u2019t a valid backup'); return; }
 var keys=(obj&&obj.keys&&typeof obj.keys==='object')?obj.keys:null;
 if(!keys){ if(obj&&obj.members){ keys={'fw.family.data':JSON.stringify(obj)}; } else { flash('That isn\u2019t a Wisal backup'); return; } }
 if(!keys['fw.family.data']){ flash('No family data found in that file'); return; }
 var when=''; if(obj&&obj.exportedAt){ var dt=new Date(obj.exportedAt); if(!isNaN(dt.getTime())) when='\n\nBackup date: '+dt.getDate()+' '+MON[dt.getMonth()]+' '+dt.getFullYear(); }
 if(!window.confirm('Restore this backup? It will replace ALL current data on this device.'+when)) return;
 try{ Store.clearAll(); Object.keys(keys).forEach(function(k){ if(k.indexOf('fw.')===0){ try{ localStorage.setItem(k,keys[k]); }catch(e){} } }); }catch(e){ flash('Could not restore on this device'); return; }
 flash('Backup restored');
 setTimeout(function(){ location.reload(); },450);
 };
 rd.onerror=function(){ flash('Could not read that file'); };
 rd.readAsText(file);
 }

 /* ---- Events (delegated) ---- */
 document.addEventListener('click', function(e){
 if(e.target.closest('[data-hh-make]')){ hhMake(); return; }
 if(e.target.closest('[data-hh-copy]')){ hhCopy(); return; }
 if(e.target.closest('[data-hh-join]')){ hhJoin(); return; }
 if(e.target.closest('[data-hh-leave]')){ hhLeave(); return; }
 var mrep=e.target.closest('[data-msgreply]'); if(mrep){ chReply=mrep.getAttribute('data-mid'); chEditing=null; renderComm(); var ti=$('#commText'); if(ti) ti.focus(); return; }
 var med=e.target.closest('[data-msgedit]'); if(med){ var _c=FD.getChannel(currentChannelId), _t=$('#commText'); if(_c&&_t){ _c.messages.forEach(function(x){ if(x.id===med.getAttribute('data-mid')){ chEditing=x.id; chReply=null; renderComm(); var t3=$('#commText'); if(t3){ t3.value=x.text||''; t3.focus(); } } }); } return; }
 if(e.target.closest('[data-replyx]')){ chReply=null; renderComm(); return; }
 if(e.target.closest('[data-editx]')){ chEditing=null; var te=$('#commText'); if(te) te.value=''; renderComm(); return; }
 var mrx=e.target.closest('[data-msgrx]'); if(mrx){ var bar=document.getElementById('chEmo'); var mid=mrx.getAttribute('data-mid');
 if(bar){ bar.remove(); }
 var b2=document.createElement('div'); b2.className='cemo'; b2.id='chEmo';
 b2.innerHTML=CH_EMO.map(function(x){ return '<button data-rx="'+x+'" data-mid="'+mid+'">'+x+'</button>'; }).join('');
 var row=mrx.closest('.cmsg'); if(row) row.appendChild(b2); return; }
 var rxb=e.target.closest('[data-rx]'); if(rxb){ var chx=FD.getChannel(currentChannelId); if(chx){ chx.messages.forEach(function(x){ if(x.id===rxb.getAttribute('data-mid')) chReact(x, rxb.getAttribute('data-rx')); }); } var eb=document.getElementById('chEmo'); if(eb) eb.remove(); return; }
 var sx=e.target.closest('[data-setopen]'); if(sx){ openSetPane(sx.getAttribute('data-setopen')); return; }
 if(e.target.closest('[data-setback]')){ closeSetPane(); return; }
 var _sdl=e.target.closest('[data-subdel]');
 if(_sdl){
  var _sp=_sdl.getAttribute('data-subdel').split('::'), _st=FD.getTask(_sp[0]), _si=+_sp[1];
  if(_st&&_st.subs&&_st.subs[_si]){
   var _nm=_st.subs[_si].t||'this step';
   if(window.confirm('Delete \u201c'+_nm+'\u201d?')){
    _st.subs.splice(_si,1); FD.save();
    try{ pjCloseMenu(); }catch(e3){}
    try{ flash('Subtask deleted'); }catch(e4){}
    try{ refreshAll('planning'); }catch(e2){}
   } else { try{ pjCloseMenu(); }catch(e5){} }
  }
  return;
 }
 var tsb=e.target.closest('[data-tsub]'); if(tsb){ var _pr=tsb.getAttribute('data-tsub').split('::'); var _tk=FD.getTask(_pr[0]); if(_tk&&_tk.subs&&_tk.subs[+_pr[1]]){ _tk.subs[+_pr[1]].done=!_tk.subs[+_pr[1]].done; FD.save(); try{ refreshAll('planning'); }catch(e2){} } return; }
 if(e.target.closest('[data-notif-ask]')){ notifAsk(); return; }
 if(e.target.closest('[data-notif-test]')){ notifShow('This is Wisal','If you can see this, your notifications are working.','wisal-test','dashboard'); try{ chBeep(); }catch(e){} return; }
 var ntg=e.target.closest('[data-notif-toggle]'); if(ntg){ notifToggle(ntg.getAttribute('data-notif-toggle')); return; }
 if(e.target.closest('[data-chat-alerts]')){ chEnableAlerts(); return; }
 if(e.target.closest('[data-chat-alerts-skip]')){ Store.set('fw.chat.alertskip', true); chRefreshView(); return; }
 if(e.target.closest('[data-chatpop-go]')){ chPopHide(); navigate('ai'); return; }
 if(e.target.closest('[data-chatpop-close]')){ chPopHide(); return; }
 if(e.target.closest('[data-invite-mem]')){ if(typeof canManage==='function' && !canManage()){ flash('Only the owner or an admin can invite'); return; } openModal('member',{invite:1}); return; }
 var _clm=e.target.closest('[data-claim-me]'); if(_clm){ var _cm=FD.getMember? FD.getMember(_clm.getAttribute('data-claim-me')):null; if(_cm&&AUTH.user){ _cm.email=String(AUTH.user.email||'').toLowerCase(); if(!_cm.role) _cm.role=hhIsGuest()?'member':'owner'; FD.save(); refreshAll('family'); flash('Linked, this profile is you now'); } return; }
 if(e.target.closest('#authGo')){ doAuth(); return; }
 if(e.target.closest('[data-auth-toggle]')){ authSetMode(_authMode==='in'?'up':'in'); try{ authShowResend(false); }catch(e){} return; }
 if(e.target.closest('[data-auth-resend]')){ authResend(); return; }
 var _av=e.target.closest('[data-av]'); if(_av){ avSet(_av.getAttribute('data-av')); return; }
 if(e.target.closest('[data-action="av-photo"]')){ avPickPhoto(); return; }
 if(e.target.closest('[data-action="av-photo-rm"]')){ avClearPhoto(); return; }
 if(e.target.closest('[data-action="av-cancel"]')){ cropClose(); return; }
 if(e.target.closest('[data-action="av-save"]')){ cropSave(); return; }
 if(e.target.closest('[data-action="avatar"]')){ avPickPhoto(); return; }
 if(e.target.closest('[data-auth-open]')){ openAuth(false); return; }
 if(e.target.closest('[data-acct-delete]')){ acctDelete(); return; }
 if(e.target.closest('[data-auth-signout]')){ doSignOut(); return; }
 var spk=e.target.closest('[data-spk]'); if(spk){ if(!_spSel) _spSel={}; var _k=spk.getAttribute('data-spk'); _spSel[_k]=!(_spSel[_k]!==false); spk.classList.toggle('is-on', _spSel[_k]!==false); return; }
 if(e.target.closest('#sppickSave')){ saveSpPick(); return; }
 if(e.target.closest('[data-sppick-all]')){ SP_KEYS.forEach(function(k){ _spSel[k]=true; }); var _g=document.getElementById('sppickGrid'); if(_g) _g.innerHTML=sppickChips(); return; }
 if(e.target.closest('[data-sppick-open]')){ openSpPick(false); return; }
 if(e.target.closest('[data-sppick-close]')){ closeSpPick(); return; }
 var sr=e.target.closest('[data-srchrow]'); if(sr){ srchActivate(sr); return; }
 if(e.target.closest('#srchBtn')){ openSearch(); return; }
 if(e.target.closest('[data-srch-close]')){ closeSearch(); return; }
 if(e.target.closest('#undoBtn')){ undoLastDelete(); return; }
 if(e.target.closest('#qaBtn')){ toggleQa(); return; }
 if(!e.target.closest('#qaMenu')) toggleQa(false);
 if(e.target.closest('#notiBtn')){ toggleNoti(); return; }
 if(!e.target.closest('#notiPanel') && !e.target.closest('#notiBtn')) toggleNoti(false);
 var notiRow = e.target.closest('[data-notirow]');
 if(notiRow){ var _ng=notiRow.getAttribute('data-goto'); toggleNoti(false); if(_ng){ var _np=_ng.split(':'); navigate(_np[0]); if(_np[1]) navigateSub(_np[0], _np[1]); } return; }
 var qa = e.target.closest('[data-qa]');
 if(qa){ toggleQa(false); openModal(qa.getAttribute('data-qa')); return; }
 var gsg = e.target.closest('[data-gsgo]');
 if(gsg){ var _g=gsg.getAttribute('data-gsgo'); if(_g==='hide'){ Store.set(GS_HIDE,'1'); renderGettingStarted(); return; } if(_g==='family'){ navigate('settings'); setTimeout(function(){ var fi=$('#familyInput'); if(fi) fi.focus(); },140); return; } openModal(_g==='journal'?'journalEntry':_g); return; }
 var ghd = e.target.closest('[data-grouphd]');
 if(ghd){ var gk2=ghd.getAttribute('data-grouphd'); if(app.classList.contains('is-collapsed')){ collapsed=false; Store.set(K.collapsed,false); applyCollapsed(); var st2=Store.get('fw.nav.groups',{})||{}; st2[gk2]=false; Store.set('fw.nav.groups',st2); var g2=document.querySelector('.nav__group[data-group="'+gk2+'"]'); if(g2) g2.classList.remove('is-grpcollapsed'); } else { toggleNavGroup(gk2); } return; }
 var nav = e.target.closest('[data-view]');
 if(nav){ e.preventDefault(); var _v=nav.getAttribute('data-view'); if(_v==='ai'){ commTab = nav.getAttribute('data-aitab') ? 'assistant' : 'chat'; } navigate(_v); return; }
 var sub = e.target.closest('[data-sub]');
 if(sub){ var sv=sub.getAttribute('data-sub'); var ix=sv.indexOf('-'); var sp=sv.slice(0,ix), su=sv.slice(ix+1); var av=document.querySelector('.view.active'); if(document.getElementById('view-'+sp) && (!av || av.id!=='view-'+sp)){ navigate(sp); } navigateSub(sp, su); return; }
 var md = e.target.closest('[data-modal]');
 if(md){ openModal(md.getAttribute('data-modal'), {memberId: md.getAttribute('data-mid')||null, meetingId: md.getAttribute('data-meetingid')||null, goalId: md.getAttribute('data-goalid')||null}); return; }
 if(e.target.closest('[data-modal-close]')){ closeModal(); return; }
 if(e.target.closest('#modalSubmit')){ submitModal(); return; }
 var prm = e.target.closest('[data-photo-remove]');
 if(prm){ pendingPhoto=''; var pv0=$('#photoPrev'); if(pv0) pv0.innerHTML='<span class="photo-empty">No photo</span>'; prm.remove(); return; }
 var etog = e.target.closest('[data-evtoggle]');
 if(etog){ FD.toggleEvItem(etog.getAttribute('data-eid'),etog.getAttribute('data-key'),etog.getAttribute('data-id')); if(currentMeetingId) renderMeetingDetail(currentMeetingId); return; }
 var edel = e.target.closest('[data-evdel]');
 if(edel){ FD.removeEvItem(edel.getAttribute('data-eid'),edel.getAttribute('data-key'),edel.getAttribute('data-id')); if(currentMeetingId) renderMeetingDetail(currentMeetingId); flash('Removed'); return; }
 var gdel = e.target.closest('[data-del-goal]');
 if(gdel){ if(window.confirm('Delete this goal? This cannot be undone.')){ FD.removeGoal(gdel.getAttribute('data-id')); renderGoalsList(); renderDashboard(); flash('Goal deleted'); } return; }
 var cv = e.target.closest('[data-calview]');
 if(cv){ setCalView(cv.getAttribute('data-calview')); return; }
 var cn = e.target.closest('[data-calnav]');
 if(cn){ calNav(cn.getAttribute('data-calnav')); return; }
 var cmo = e.target.closest('[data-calmonth]');
 if(cmo){ calCursor=new Date(calCursor.getFullYear(), parseInt(cmo.getAttribute('data-calmonth'),10), 1); setCalView('month'); return; }
 var dev = e.target.closest('[data-event]');
 if(dev){ openEvent(dev.getAttribute('data-event'), dev.getAttribute('data-occ')); return; }
 var dday = e.target.closest('[data-day]');
 if(dday){ calCursor=parseDT(dday.getAttribute('data-day'))||calCursor; setCalView('day'); return; }
 var par = e.target.closest('[data-participant]');
 if(par){ var pid=par.getAttribute('data-participant'); var pix=pendingParticipants.indexOf(pid); if(pix>=0){ pendingParticipants.splice(pix,1); par.classList.remove('is-on'); } else { pendingParticipants.push(pid); par.classList.add('is-on'); } return; }
 var arem = e.target.closest('[data-att-remove]');
 if(arem){ var aid=arem.getAttribute('data-att-remove'); pendingAtts=pendingAtts.filter(function(x){return x.id!==aid;}); var al=$('#attList'); if(al) al.innerHTML=attChipsHTML(); return; }
 var cdel = e.target.closest('[data-catdel]');
 if(cdel){ var sel=$('#catSelect'); if(sel){ var lbl=sel.value; var cc=(FD.data.customCategories||[]).filter(function(c){return c.label===lbl;})[0]; if(cc && window.confirm('Delete the category \u201c'+cc.label+'\u201d? Events using it become General.')){ FD.removeCustomCat(cc.key); var opt=sel.querySelector('option[value="'+cc.label+'"]')||Array.prototype.filter.call(sel.options,function(o){return o.value===cc.label;})[0]; if(opt) opt.remove(); sel.value='General'; var nb=$('#newCatBox'); if(nb) nb.hidden=true; cdel.hidden=true; if($('#calWrap')) renderCalendar(); flash('Category deleted'); } } return; }
 var ctab = e.target.closest('[data-commtab]');
 if(ctab){ commTab=ctab.getAttribute('data-commtab'); renderComm(); return; }
 var _aiask=e.target.closest('[data-aiask]'); if(_aiask){ aiSend(_aiask.getAttribute('data-aiask')); return; }
 var _aisend=e.target.closest('[data-aisendbtn]'); if(_aisend){ var _t=document.getElementById('aiText'); if(_t){ var _v=_t.value; _t.value=''; aiSend(_v); } return; }
 if(e.target.closest('[data-aiclear]')){ aiClear(); return; }
 if(e.target.closest('[data-vaultset]')){ var _a=($('#vaultNewA')||{}).value||'', _b=($('#vaultNewB')||{}).value||''; if(_a.length<8){ vaultErr('Use at least 8 characters.'); return; } if(_a!==_b){ vaultErr('The passwords do not match.'); return; } var _salt=vaultSalt(); vaultHash(_a,_salt,function(hx){ FD.setVaultPin(hx,_salt); vaultAfterUnlock(); if(typeof flash==='function') flash('Vault created'); }); return; }
 if(e.target.closest('[data-vaultunlock]')){ var _p=($('#vaultPin')||{}).value||''; if(!_p){ vaultErr('Enter your password.'); return; } var V=FD.data.vault; vaultHash(_p,V.pinSalt,function(hx){ if(hx===V.pinHash){ vaultAfterUnlock(); } else { vaultErr('Wrong password. Try again.'); var pin=$('#vaultPin'); if(pin){ pin.value=''; pin.focus(); } } }); return; }
 if(e.target.closest('[data-vaultlockbtn]')){ vaultUnlocked=false; vaultMode='unlock'; renderVaultLock(); return; }
 if(e.target.closest('[data-vaultchpw]')){ vaultMode='change'; renderVaultLock(); return; }
 if(e.target.closest('[data-vaultcancelchange]')){ vaultMode='unlock'; vaultUnlocked=true; renderVaultLock(); return; }
 if(e.target.closest('[data-vaultchange]')){ var _cur=($('#vaultCur')||{}).value||'', _na=($('#vaultNewA')||{}).value||'', _nb=($('#vaultNewB')||{}).value||''; if(_na.length<8){ vaultErr('New password: at least 8 characters.'); return; } if(_na!==_nb){ vaultErr('New passwords do not match.'); return; } var V2=FD.data.vault; vaultHash(_cur,V2.pinSalt,function(hx){ if(hx!==V2.pinHash){ vaultErr('Current password is wrong.'); return; } var ns=vaultSalt(); vaultHash(_na,ns,function(nh){ FD.setVaultPin(nh,ns); vaultMode='unlock'; vaultUnlocked=true; renderVaultLock(); if(typeof flash==='function') flash('Password updated'); }); }); return; }
 if(e.target.closest('[data-vaultadd]')){ openVaultEntry(null); return; }
 var _ved=e.target.closest('[data-vaultedit]'); if(_ved){ openVaultEntry(_ved.getAttribute('data-vaultedit')); return; }
 var _vdel=e.target.closest('[data-vaultdel]'); if(_vdel){ if(window.confirm('Delete this item from the vault? This cannot be undone.')){ FD.removeVaultEntry(_vdel.getAttribute('data-vaultdel')); renderVault(); } return; }
 var _vrev=e.target.closest('[data-vaultreveal]'); if(_vrev){ _vrev.classList.toggle('is-shown'); return; }
 if(e.target.closest('[data-aihistory]')){ aiOpenHistory(); return; }
 if(e.target.closest('[data-onbnext]')){ onbNext(); return; }
 if(e.target.closest('[data-onbback]')){ onbBack(); return; }
 if(e.target.closest('[data-onbskip]')){ closeOnb(); try{ if(!Store.get('fw.spaces.chosen',false)&&!FD.data.members.length) openSpPick(true); }catch(e){} return; }
 if(e.target.closest('[data-onbfinish]')){ onbFinish(); return; }
 if(e.target.closest('[data-onbtopay]')){ onbToPaywall(); return; }
 var _obc=e.target.closest('[data-onbcycle]'); if(_obc){ onbSetCycle(_obc.getAttribute('data-onbcycle')); return; }
 if(e.target.closest('[data-onbplus]')){ onbPlusStart(); return; }
 if(e.target.closest('[data-onbpayback]')){ onbPayBack(); return; }
 var _obm=e.target.closest('[data-onbpay]'); if(_obm){ onbPayMethod(_obm.getAttribute('data-onbpay')); return; }
 if(e.target.closest('[data-onbcheckout]')){ onbCheckout(); return; }
 var _onbp=e.target.closest('[data-onbpick]'); if(_onbp){ onbPick(_onbp.getAttribute('data-onbpick'), _onbp.getAttribute('data-onbval')); return; }
 var _aic=e.target.closest('[data-aiconfirm]'); if(_aic){ aiExecuteActions(+_aic.getAttribute('data-aiconfirm')); return; }
 var _aid=e.target.closest('[data-aidismiss]'); if(_aid){ aiDismissActions(+_aid.getAttribute('data-aidismiss')); return; }
 var _wnc=e.target.closest('[data-wnclose]'); if(_wnc){ wnClose(); return; }
 var _upr=e.target.closest('[data-upreload]'); if(_upr){ location.reload(); return; }
 var _upc=e.target.closest('[data-upclose]'); if(_upc){ upClose(); return; }
 var _wdx=e.target.closest('[data-wdocclose]'); if(_wdx){ wdocClose(); return; }
 var _wdp=e.target.closest('[data-wdocprint]'); if(_wdp){ wdocPrint(); return; }
 var _sclr=e.target.closest('[data-setclr]');
 if(_sclr){ var _si=document.getElementById('setSearch'); if(_si){ _si.value=''; } setFilter(''); return; }
 var _dop=e.target.closest('[data-aidocopen]');
 if(_dop){ var _p1=_dop.getAttribute('data-aidocopen').split(':'); aiDocOpen(+_p1[0],+_p1[1]); return; }
 var _ddl=e.target.closest('[data-aidocdl]');
 if(_ddl){ var _p2=_ddl.getAttribute('data-aidocdl').split(':'); aiDocPDF(+_p2[0],+_p2[1]); return; }
 if(e.target.closest('[data-aibackchat]')){ aiView='chat'; renderComm(); return; }
 var _air=e.target.closest('[data-airestore]'); if(_air){ aiRestore(_air.getAttribute('data-airestore')); return; }
 var _aihd=e.target.closest('[data-aihistdel]'); if(_aihd){ aiDeleteHist(_aihd.getAttribute('data-aihistdel')); return; }
 if(e.target.closest('[data-aikeyedit]')){ aiSetKey(''); aiThread.push({role:'assistant', content:'__NEEDKEY__', ts:Date.now()}); aiSaveThread(); renderComm(); return; }
 if(e.target.closest('[data-aikeysave]')){ var _ki=document.getElementById('aiKeyInput'); if(_ki){ var _k=_ki.value.trim(); if(_k){ aiSetKey(_k); if(aiThread.length&&aiThread[aiThread.length-1].content&&(aiThread[aiThread.length-1].content==='__NEEDKEY__'||aiThread[aiThread.length-1].content==='__BADKEY__')){ aiThread.pop(); var lastUser=aiThread.length?aiThread[aiThread.length-1]:null; aiThread.pop(); aiSaveThread(); if(lastUser&&lastUser.role==='user'){ aiSend(lastUser.content); } else { renderComm(); } } else { renderComm(); if(typeof flash==='function') flash('AI connected'); } } else { if(typeof flash==='function') flash('Paste your key first'); } } return; }
 var chx = e.target.closest('[data-chdel]');
 if(chx){ var cid=chx.getAttribute('data-chdel'); if(window.confirm('Delete this group and its messages?')){ FD.removeChannel(cid); if(currentChannelId===cid) currentChannelId=null; renderComm(); } return; }
 var chan = e.target.closest('[data-channel]');
 if(chan){ currentChannelId=chan.getAttribute('data-channel'); renderComm(); return; }
 var mpin = e.target.closest('[data-msgpin]');
 if(mpin){ FD.togglePin(mpin.getAttribute('data-cid'),mpin.getAttribute('data-mid')); renderComm(); return; }
 var mdel = e.target.closest('[data-msgdel]');
 if(mdel){ try{ var _ch=FD.getChannel(mdel.getAttribute('data-cid')); if(_ch){ var _m=null; _ch.messages.forEach(function(x){ if(x.id===mdel.getAttribute('data-mid')) _m=x; }); if(_m) chCloudDelete(_m); } }catch(_e){} FD.removeMessage(mdel.getAttribute('data-cid'),mdel.getAttribute('data-mid')); renderComm(); return; }
 var vote = e.target.closest('[data-vote]');
 if(vote){ var vpid=vote.getAttribute('data-pid'),voptid=vote.getAttribute('data-oid'); var vkey=(pollVoters[vpid]||'')||'me'; var ok=FD.votePoll(vpid,voptid,vkey); if(ok===false){ flash('You\u2019ve already voted in this poll'); } else { renderComm(); } return; }
 var pdel = e.target.closest('[data-polldel]');
 if(pdel){ if(window.confirm('Delete this poll?')){ FD.removePoll(pdel.getAttribute('data-polldel')); renderComm(); } return; }
 var adel = e.target.closest('[data-anndel]');
 if(adel){ FD.removeAnnouncement(adel.getAttribute('data-anndel')); renderComm(); renderDashboard(); return; }
 var nadd = e.target.closest('[data-noteadd]');
 if(nadd){ var lid=nadd.getAttribute('data-noteadd'); var inp=$('#noteinput-'+lid); var v=inp?inp.value.trim():''; if(v){ FD.addNoteItem(lid,v,commFrom); renderComm(); } return; }
 var nit = e.target.closest('[data-noteitem]');
 if(nit){ FD.toggleNoteItem(nit.getAttribute('data-lid'),nit.getAttribute('data-iid')); renderComm(); return; }
 var nitd = e.target.closest('[data-noteitemdel]');
 if(nitd){ FD.removeNoteItem(nitd.getAttribute('data-lid'),nitd.getAttribute('data-iid')); renderComm(); return; }
 var nld = e.target.closest('[data-notelistdel]');
 if(nld){ if(window.confirm('Delete this shared note and its items?')){ FD.removeNoteList(nld.getAttribute('data-notelistdel')); renderComm(); } return; }
 var dmtg = e.target.closest('[data-meeting]');
 if(dmtg){ openMeeting(dmtg.getAttribute('data-meeting')); return; }
 var dgoal = e.target.closest('[data-goal]');
 if(dgoal){ openModal('editGoal',{goalId:dgoal.getAttribute('data-goal')}); return; }
 var tmem = e.target.closest('[data-treemember]');
 if(tmem){ navigateSub('family','members'); openMember(tmem.getAttribute('data-treemember')); return; }
 var finmo = e.target.closest('[data-finmo]');
 if(finmo){ finTxYM=ymShift(finTxYM, parseInt(finmo.getAttribute('data-finmo'),10)); renderFinTx(); return; }
 var finfilt = e.target.closest('[data-finfilt]');
 if(finfilt){ finTxFilter=finfilt.getAttribute('data-finfilt'); renderFinTx(); return; }
 var txedit = e.target.closest('[data-txedit]');
 if(txedit){ openModal('editTransaction',{txId:txedit.getAttribute('data-txedit')}); return; }
 var txdel = e.target.closest('[data-txdel]');
 if(txdel){ if(window.confirm('Delete this transaction?')){ FD.removeTx(txdel.getAttribute('data-txdel')); renderFinTx(); if($('#finOverview')) renderFinOverview(); if(currentMemberId && $('#memberDetail') && !$('#memberDetail').hidden) renderMemberDetail(currentMemberId); flash('Deleted'); } return; }
 var budgetadd = e.target.closest('[data-budgetadd]');
 if(budgetadd){ openModal('budget',{cat:budgetadd.getAttribute('data-budgetadd')}); return; }
 var budgetedit = e.target.closest('[data-budgetedit]');
 if(budgetedit){ openModal('budget',{cat:budgetedit.getAttribute('data-budgetedit')}); return; }
 var budgetdel = e.target.closest('[data-budgetdel]');
 if(budgetdel){ FD.setBudget(budgetdel.getAttribute('data-budgetdel'),0); renderFinBudget(); flash('Budget removed'); return; }
 var fincatdel = e.target.closest('[data-fincatdel]');
 if(fincatdel){ var fk=fincatdel.getAttribute('data-fincatdel'); if(fk){ var fc=finCustomCats().filter(function(c){return c.key===fk;})[0]; if(fc && window.confirm('Delete the category \u201C'+fc.label+'\u201D? Transactions using it become Other.')){ FD.removeFinCat(fk); closeModal(); refreshAll({}); flash('Category deleted'); } } return; }
 var statrange = e.target.closest('[data-statrange]');
 if(statrange){ finStatsRange=parseInt(statrange.getAttribute('data-statrange'),10)||6; renderFinStats(); return; }
 var planpaid = e.target.closest('[data-planpaid]');
 if(planpaid){ var pid=planpaid.getAttribute('data-planpaid'); var pobj=FD.getPlanned(pid); if(pobj){ FD.markPlannedPaid(pid); renderFinPlanned(); if($('#finOverview')) renderFinOverview(); if($('#finTx')) renderFinTx(); if($('#finBudget')) renderFinBudget(); if($('#finStats')) renderFinStats(); flash((pobj.type==='income'?'Received ':'Paid ')+curSymbol()+nfmt(pobj.amount)+' \u00b7 '+pobj.title); } return; }
 var planedit = e.target.closest('[data-planedit]');
 if(planedit){ openModal('editPlanned',{planId:planedit.getAttribute('data-planedit')}); return; }
 var panpause = e.target.closest('[data-panpause]');
 if(panpause){ FD.togglePlanned(panpause.getAttribute('data-panpause')); renderFinPlanned(); return; }
 var pandel = e.target.closest('[data-pandel]');
 if(pandel){ if(window.confirm('Delete this planned payment?')){ FD.removePlanned(pandel.getAttribute('data-pandel')); renderFinPlanned(); flash('Deleted'); } return; }
 var debtsettle = e.target.closest('[data-debtsettle]');
 if(debtsettle){ var dse=FD.getDebt(debtsettle.getAttribute('data-debtsettle')); if(dse && window.confirm('Mark this debt as fully settled?')){ FD.settleDebt(dse.id); renderFinDebts(); flash('Settled \u00b7 '+esc(dse.person)); } return; }
 var debtpay = e.target.closest('[data-debtpay]');
 if(debtpay){ openModal('debtPay',{debtId:debtpay.getAttribute('data-debtpay')}); return; }
 var debtedit = e.target.closest('[data-debtedit]');
 if(debtedit){ openModal('editDebt',{debtId:debtedit.getAttribute('data-debtedit')}); return; }
 var debtdel = e.target.closest('[data-debtdel]');
 if(debtdel){ if(window.confirm('Delete this debt record?')){ FD.removeDebt(debtdel.getAttribute('data-debtdel')); renderFinDebts(); flash('Deleted'); } return; }
 var savecontrib = e.target.closest('[data-savecontrib]');
 if(savecontrib){ openModal('saveContribute',{saveId:savecontrib.getAttribute('data-savecontrib')}); return; }
 var saveedit = e.target.closest('[data-saveedit]');
 if(saveedit){ openModal('editSaving',{saveId:saveedit.getAttribute('data-saveedit')}); return; }
 var savedel = e.target.closest('[data-savedel]');
 if(savedel){ if(window.confirm('Delete this savings goal?')){ FD.removeSaving(savedel.getAttribute('data-savedel')); renderFinSavings(); flash('Deleted'); } return; }
 var dmem = e.target.closest('[data-member]');
 if(dmem){ openMember(dmem.getAttribute('data-member')); return; }
 var hsel = e.target.closest('[data-hsel]');
 if(hsel){ hMember=hsel.getAttribute('data-hsel');
 if($('#hVitals')&&$('#sub-health-vitals')&&$('#sub-health-vitals').classList.contains('is-active')) renderHealthVitals();
 else if($('#hMeds')&&$('#sub-health-medications')&&$('#sub-health-medications').classList.contains('is-active')) renderHealthMeds();
 else if($('#hRecords')&&$('#sub-health-records')&&$('#sub-health-records').classList.contains('is-active')) renderHealthRecords();
 else renderHealthProfiles();
 return; }
 var hgo = e.target.closest('[data-hgo]');
 if(hgo){ hMember=hgo.getAttribute('data-hgo'); navigateSub('health','profiles'); return; }
 var hdel = e.target.closest('[data-hdel]');
 if(hdel){ FD.removeSubItem(hdel.getAttribute('data-mid'),hdel.getAttribute('data-key'),hdel.getAttribute('data-id')); renderHealthProfiles(); flash('Removed'); return; }
 var apptedit = e.target.closest('[data-apptedit]');
 if(apptedit){ openModal('editAppointment',{eventId:apptedit.getAttribute('data-apptedit')}); return; }
 var apptdel = e.target.closest('[data-apptdel]');
 if(apptdel){ if(window.confirm('Delete this appointment?')){ FD.removeEvent(apptdel.getAttribute('data-apptdel')); renderHealthAppts(); if($('#hOverview')) renderHealthOverview(); flash('Appointment deleted'); } return; }
 var vadd = e.target.closest('[data-vadd]');
 if(vadd){ openModal('vital',{memberId:vadd.getAttribute('data-mid'),vitalType:vadd.getAttribute('data-vadd')}); return; }
 var vdel = e.target.closest('[data-vdel]');
 if(vdel){ FD.removeSubItem(vdel.getAttribute('data-mid'),'vitals',vdel.getAttribute('data-vdel')); renderHealthVitals(); flash('Reading deleted'); return; }
 var jexp = e.target.closest('[data-jexpand]');
 if(jexp){ var _jid=jexp.getAttribute('data-jexpand'); jOpen[_jid]=!jOpen[_jid]; renderJournalEntries(); return; }
 var jgo = e.target.closest('[data-jgo]');
 if(jgo){ jOpen[jgo.getAttribute('data-jgo')]=true; navigateSub('journal','entries'); return; }
 var jedit = e.target.closest('[data-jedit]');
 if(jedit){ openModal('editJournalEntry',{entryId:jedit.getAttribute('data-jedit')}); return; }
 var jdel = e.target.closest('[data-jdel]');
 if(jdel){ if(window.confirm('Delete this entry? This cannot be undone.')){ FD.removeJournalEntry(jdel.getAttribute('data-jdel')); renderJournalEntries(); if($('#jOverview')) renderJournalOverview(); flash('Entry deleted'); } return; }
 var gedit = e.target.closest('[data-gratedit]');
 if(gedit){ openModal('editGratitude',{gratId:gedit.getAttribute('data-gratedit')}); return; }
 var gdel = e.target.closest('[data-gratdel]');
 if(gdel){ if(window.confirm('Delete this gratitude note?')){ FD.removeGratitude(gdel.getAttribute('data-gratdel')); renderJournalGratitude(); if($('#jOverview')) renderJournalOverview(); flash('Deleted'); } return; }
 var msedit = e.target.closest('[data-msedit]');
 if(msedit){ openModal('editMilestone',{mileId:msedit.getAttribute('data-msedit')}); return; }
 var msdel = e.target.closest('[data-msdel]');
 if(msdel){ if(window.confirm('Delete this milestone? This cannot be undone.')){ FD.removeMilestone(msdel.getAttribute('data-msdel')); renderJournalMilestones(); if($('#jOverview')) renderJournalOverview(); flash('Milestone deleted'); } return; }
 var jf = e.target.closest('[data-jfilter]');
 if(jf){ jEntryFilter=jf.getAttribute('data-jfilter'); renderJournalEntries(); return; }
 var ckf = e.target.closest('[data-ckfilter]');
 if(ckf){ ckFilter=ckf.getAttribute('data-ckfilter'); renderCookingRecipes(); return; }
 var rfav = e.target.closest('[data-rfav]');
 if(rfav){ FD.toggleFavRecipe(rfav.getAttribute('data-rfav')); renderCookingRecipes(); if($('#ckOverview')) renderCookingOverview(); return; }
 var rexp = e.target.closest('[data-rexpand]');
 if(rexp){ var _rid=rexp.getAttribute('data-rexpand'); rOpen[_rid]=!rOpen[_rid]; renderCookingRecipes(); return; }
 var rgo = e.target.closest('[data-rgo]');
 if(rgo){ rOpen[rgo.getAttribute('data-rgo')]=true; ckFilter='all'; ckSearch=''; navigateSub('cooking','recipes'); return; }
 var redit = e.target.closest('[data-redit]');
 if(redit){ openModal('editRecipe',{recipeId:redit.getAttribute('data-redit')}); return; }
 var rdel = e.target.closest('[data-rdel]');
 if(rdel){ if(window.confirm('Delete this recipe? This cannot be undone.')){ FD.removeRecipe(rdel.getAttribute('data-rdel')); renderCookingRecipes(); if($('#ckOverview')) renderCookingOverview(); flash('Recipe deleted'); } return; }
 var rshop = e.target.closest('[data-rshop]');
 if(rshop){ var _rr=FD.getRecipe(rshop.getAttribute('data-rshop')); if(_rr){ var _lines=(_rr.ingredients||'').split('\n').map(function(t){return t.trim();}).filter(Boolean); var _have={}; FD.data.cooking.shopping.forEach(function(i){ if(!i.done) _have[i.name.toLowerCase()]=1; }); var _added=0; _lines.forEach(function(t){ if(!_have[t.toLowerCase()]){ FD.addShopItem({name:t,qty:'',done:false}); _added++; } }); if($('#ckShopping')) renderCookingShopping(); if($('#ckOverview')) renderCookingOverview(); flash(_added?('Added '+_added+' item'+(_added>1?'s':'')+' to shopping'):'Already on the list'); } return; }
 var ckw = e.target.closest('[data-ckweek]');
 if(ckw){ var _wv=ckw.getAttribute('data-ckweek'); if(_wv==='prev') ckWeekOff--; else if(_wv==='next') ckWeekOff++; else ckWeekOff=0; renderCookingMeals(); return; }
 var madd = e.target.closest('[data-mealadd]');
 if(madd){ openModal('meal',{date:madd.getAttribute('data-date'),slot:madd.getAttribute('data-slot')}); return; }
 var medit = e.target.closest('[data-mealedit]');
 if(medit){ openModal('editMeal',{mealId:medit.getAttribute('data-mealedit')}); return; }
 var mdel = e.target.closest('[data-mealdel]');
 if(mdel){ FD.removeMeal(mdel.getAttribute('data-mealdel')); renderCookingMeals(); if($('#ckOverview')) renderCookingOverview(); flash('Removed from plan'); return; }
 var sadd = e.target.closest('[data-shopadd]');
 if(sadd){ ckQuickAdd(); return; }
 var sdone = e.target.closest('[data-shopdone]');
 if(sdone){ FD.toggleShopItem(sdone.getAttribute('data-shopdone')); renderCookingShopping(); if($('#ckOverview')) renderCookingOverview(); return; }
 var sedit = e.target.closest('[data-shopedit]');
 if(sedit){ openModal('editShopItem',{shopId:sedit.getAttribute('data-shopedit')}); return; }
 var sdel = e.target.closest('[data-shopdel]');
 if(sdel){ FD.removeShopItem(sdel.getAttribute('data-shopdel')); renderCookingShopping(); if($('#ckOverview')) renderCookingOverview(); return; }
 var sclr = e.target.closest('[data-shopclear]');
 if(sclr){ FD.clearDoneShopping(); renderCookingShopping(); flash('Cleared'); return; }
 var chd = e.target.closest('[data-hcdone]');
 if(chd){ FD.checkChore(chd.getAttribute('data-hcdone')); if($('#hmChores')) renderHomeChores(); if($('#hmOverview')) renderHomeOverview(); return; }
 var che = e.target.closest('[data-hcedit]');
 if(che){ openModal('editChore',{choreId:che.getAttribute('data-hcedit')}); return; }
 var hcx = e.target.closest('[data-hcdel]');
 if(hcx){ if(window.confirm('Delete this chore?')){ FD.removeChore(hcx.getAttribute('data-hcdel')); renderHomeChores(); if($('#hmOverview')) renderHomeOverview(); flash('Chore deleted'); } return; }
 var chf = e.target.closest('[data-hcfilter]');
 if(chf){ hmChoreFilter=chf.getAttribute('data-hcfilter'); renderHomeChores(); return; }
 var mtd = e.target.closest('[data-mtdone]');
 if(mtd){ FD.toggleMaint(mtd.getAttribute('data-mtdone')); if($('#hmMaint')) renderHomeMaint(); if($('#hmOverview')) renderHomeOverview(); return; }
 var mte = e.target.closest('[data-mtedit]');
 if(mte){ openModal('editMaint',{maintId:mte.getAttribute('data-mtedit')}); return; }
 var mtx = e.target.closest('[data-mtdel]');
 if(mtx){ if(window.confirm('Delete this maintenance task?')){ FD.removeMaint(mtx.getAttribute('data-mtdel')); renderHomeMaint(); if($('#hmOverview')) renderHomeOverview(); flash('Task deleted'); } return; }
 var sps = e.target.closest('[data-supstat]');
 if(sps){ FD.cycleSupply(sps.getAttribute('data-supstat')); renderHomeSupplies(); if($('#hmOverview')) renderHomeOverview(); return; }
 var spe = e.target.closest('[data-supedit]');
 if(spe){ openModal('editSupply',{supId:spe.getAttribute('data-supedit')}); return; }
 var spx = e.target.closest('[data-supdel]');
 if(spx){ if(window.confirm('Delete this supply?')){ FD.removeSupply(spx.getAttribute('data-supdel')); renderHomeSupplies(); if($('#hmOverview')) renderHomeOverview(); flash('Deleted'); } return; }
 var sts = e.target.closest('[data-suptoshop]');
 if(sts){ var _need=FD.data.home.supplies.filter(function(s){return s.status!=='ok';}); var _hv={}; FD.data.cooking.shopping.forEach(function(i){ if(!i.done) _hv[i.name.toLowerCase()]=1; }); var _n=0; _need.forEach(function(s){ if(s.name&&!_hv[s.name.toLowerCase()]){ FD.addShopItem({name:s.name,qty:'',done:false}); _n++; } }); renderHomeSupplies(); if($('#ckShopping')) renderCookingShopping(); flash(_n?('Added '+_n+' item'+(_n>1?'s':'')+' to shopping'):'Already on the list'); return; }
 var lnp = e.target.closest('[data-lnprog]');
 if(lnp){ FD.bumpProgress(lnp.getAttribute('data-kind'),lnp.getAttribute('data-lnprog'),parseInt(lnp.getAttribute('data-d'),10)||0); if($('#lnCourses')) renderLearnCourses(); if($('#lnBooks')) renderLearnBooks(); if($('#lnOverview')) renderLearnOverview(); return; }
 var lne = e.target.closest('[data-lnedit]');
 if(lne){ var _lk=lne.getAttribute('data-kind'); var _lid=lne.getAttribute('data-lnedit'); if(_lk==='book') openModal('editBook',{bookId:_lid}); else if(_lk==='skill') openModal('editSkill',{skillId:_lid}); else openModal('editCourse',{courseId:_lid}); return; }
 var lnd = e.target.closest('[data-lndel]');
 if(lnd){ var _dk=lnd.getAttribute('data-kind'); var _did=lnd.getAttribute('data-lndel'); var _nm=_dk==='book'?'book':(_dk==='skill'?'skill':'course'); if(window.confirm('Delete this '+_nm+'?')){ if(_dk==='book') FD.removeBook(_did); else if(_dk==='skill') FD.removeSkill(_did); else FD.removeCourse(_did); if($('#lnCourses')) renderLearnCourses(); if($('#lnBooks')) renderLearnBooks(); if($('#lnSkills')) renderLearnSkills(); if($('#lnOverview')) renderLearnOverview(); flash('Deleted'); } return; }
 var lns = e.target.closest('[data-lnsup]');
 if(lns){ FD.levelUpSkill(lns.getAttribute('data-lnsup')); renderLearnSkills(); if($('#lnOverview')) renderLearnOverview(); flash('Level up!'); return; }
 var lcf = e.target.closest('[data-lncf]');
 if(lcf){ lcFilter=lcf.getAttribute('data-lncf'); renderLearnCourses(); return; }
 var lbf = e.target.closest('[data-lnbf]');
 if(lbf){ lbFilter=lbf.getAttribute('data-lnbf'); renderLearnBooks(); return; }
 var lsf = e.target.closest('[data-lnsf]');
 if(lsf){ lsFilter=lsf.getAttribute('data-lnsf'); renderLearnSkills(); return; }
 var lng = e.target.closest('[data-lngo]');
 if(lng){ var _w=lng.getAttribute('data-lngo'); lcFilter=_w; lbFilter=_w; lsFilter=_w; navigateSub('learning','courses'); return; }
 var tve = e.target.closest('[data-tvedit]');
 if(tve){ openModal('editTrip',{tripId:tve.getAttribute('data-tvedit')}); return; }
 var tvd = e.target.closest('[data-tvdel]');
 if(tvd){ if(window.confirm('Delete this trip and its packing list? This cannot be undone.')){ FD.removeTrip(tvd.getAttribute('data-tvdel')); if($('#tvTrips')) renderTravelTrips(); if($('#tvPacking')) renderTravelPacking(); if($('#tvOverview')) renderTravelOverview(); flash('Trip deleted'); } return; }
 var tpg = e.target.closest('[data-tvpkgo]');
 if(tpg){ tpTrip=tpg.getAttribute('data-tvpkgo'); navigateSub('travel','packing'); return; }
 var tpk = e.target.closest('[data-tvpk]');
 if(tpk){ tpTrip=tpk.getAttribute('data-tvpk'); renderTravelPacking(); return; }
 var tpd = e.target.closest('[data-tvpkdone]');
 if(tpd){ FD.togglePack(tpd.getAttribute('data-tvpkdone')); renderTravelPacking(); if($('#tvOverview')) renderTravelOverview(); return; }
 var tpe = e.target.closest('[data-tvpkedit]');
 if(tpe){ openModal('editPack',{packId:tpe.getAttribute('data-tvpkedit')}); return; }
 var tpx = e.target.closest('[data-tvpkdel]');
 if(tpx){ FD.removePack(tpx.getAttribute('data-tvpkdel')); renderTravelPacking(); if($('#tvOverview')) renderTravelOverview(); return; }
 var tpa = e.target.closest('[data-tvpkadd]');
 if(tpa){ tvPkAdd(); return; }
 var tpr = e.target.closest('[data-tvpkreset]');
 if(tpr){ if(window.confirm('Uncheck everything on this list? Handy when reusing it for the next trip.')){ FD.resetPacking(tpTrip); renderTravelPacking(); flash('List reset'); } return; }
 var tps = e.target.closest('[data-tvpkseed]');
 if(tps){ TV_ESSENTIALS.forEach(function(n){ FD.addPack({tripId:tpTrip,name:n,done:false}); }); renderTravelPacking(); flash('Essentials added \u2708'); return; }
 var tie = e.target.closest('[data-tvidedit]');
 if(tie){ openModal('editIdea',{ideaId:tie.getAttribute('data-tvidedit')}); return; }
 var tid = e.target.closest('[data-tviddel]');
 if(tid){ if(window.confirm('Remove this from the bucket list?')){ FD.removeIdea(tid.getAttribute('data-tviddel')); renderTravelBucket(); if($('#tvOverview')) renderTravelOverview(); flash('Removed'); } return; }
 var tmk = e.target.closest('[data-tvmk]');
 if(tmk){ var _ide=FD.getIdea(tmk.getAttribute('data-tvmk')); openModal('trip',{dest:_ide?_ide.place:''}); return; }
 var fte = e.target.closest('[data-ftedit]');
 if(fte){ openModal('editWorkout',{workoutId:fte.getAttribute('data-ftedit')}); return; }
 var ftd = e.target.closest('[data-ftdel]');
 if(ftd){ if(window.confirm('Delete this workout?')){ FD.removeWorkout(ftd.getAttribute('data-ftdel')); if($('#ftWorkouts')) renderFitWorkouts(); if($('#ftGoals')) renderFitGoals(); if($('#ftOverview')) renderFitOverview(); flash('Deleted'); } return; }
 var ftf = e.target.closest('[data-ftfilter]');
 if(ftf){ ftFilter=ftf.getAttribute('data-ftfilter'); renderFitWorkouts(); return; }
 var fge = e.target.closest('[data-ftgedit]');
 if(fge){ openModal('editFitgoal',{fitgoalId:fge.getAttribute('data-ftgedit')}); return; }
 var fgd = e.target.closest('[data-ftgdel]');
 if(fgd){ if(window.confirm('Delete this weekly goal?')){ FD.removeFitGoal(fgd.getAttribute('data-ftgdel')); renderFitGoals(); if($('#ftOverview')) renderFitOverview(); flash('Goal deleted'); } return; }
 var frx = e.target.closest('[data-ftrexp]');
 if(frx){ var _fid=frx.getAttribute('data-ftrexp'); ftrOpen[_fid]=!ftrOpen[_fid]; renderFitRoutines(); return; }
 var frl = e.target.closest('[data-ftrlog]');
 if(frl){ var _ro=FD.getRoutine(frl.getAttribute('data-ftrlog')); openModal('workout',{type:'Home workout',member:_ro?_ro.member:'',note:_ro?('Routine: '+_ro.name):''}); return; }
 var fre = e.target.closest('[data-ftredit]');
 if(fre){ openModal('editRoutine',{routineId:fre.getAttribute('data-ftredit')}); return; }
 var frd = e.target.closest('[data-ftrdel]');
 if(frd){ if(window.confirm('Delete this routine?')){ FD.removeRoutine(frd.getAttribute('data-ftrdel')); renderFitRoutines(); flash('Routine deleted'); } return; }
 var ftg = e.target.closest('[data-ftgo]');
 if(ftg){ ftFilter=ftg.getAttribute('data-ftgo'); navigateSub('fitness','workouts'); return; }
 var gto = e.target.closest('[data-goto]');
 if(gto){ var _pr=String(gto.getAttribute('data-goto')||'').split(':'); if(_pr[0]){ navigate(_pr[0]); if(_pr[1]) navigateSub(_pr[0],_pr[1]); } return; }
 var nte = e.target.closest('[data-ntedit]');
 if(nte){ openModal('editNmeal',{nmealId:nte.getAttribute('data-ntedit')}); return; }
 var ntd = e.target.closest('[data-ntdel]');
 if(ntd){ if(window.confirm('Delete this meal entry?')){ FD.removeNMeal(ntd.getAttribute('data-ntdel')); if($('#ntMeals')) renderNutriMeals(); if($('#ntOverview')) renderNutriOverview(); flash('Deleted'); } return; }
 var ntf = e.target.closest('[data-ntfilter]');
 if(ntf){ ntFilter=ntf.getAttribute('data-ntfilter'); renderNutriMeals(); return; }
 var ntw = e.target.closest('[data-ntw]');
 if(ntw){ FD.setWater(ntw.getAttribute('data-ntw'),parseInt(ntw.getAttribute('data-d'),10)||0); if($('#ntWater')) renderNutriWater(); if($('#ntOverview')) renderNutriOverview(); return; }
 var ntt = e.target.closest('[data-ntwt]');
 if(ntt){ openModal('waterTarget',{wname:ntt.getAttribute('data-ntwt')}); return; }
 var nth = e.target.closest('[data-nthab]');
 if(nth){ FD.toggleHabitToday(nth.getAttribute('data-nthab')); if($('#ntHabits')) renderNutriHabits(); if($('#ntOverview')) renderNutriOverview(); if($('#mydayBody')) renderMyDay(); return; }
 var nthe = e.target.closest('[data-nthedit]');
 if(nthe){ openModal('editHabit',{habitId:nthe.getAttribute('data-nthedit')}); return; }
 var nthd = e.target.closest('[data-nthdel]');
 if(nthd){ if(window.confirm('Delete this habit and its history?')){ FD.removeHabit(nthd.getAttribute('data-nthdel')); renderNutriHabits(); if($('#ntOverview')) renderNutriOverview(); flash('Habit deleted'); } return; }
 var pltd = e.target.closest('[data-pltdone]');
 var _tsb=e.target.closest('[data-tsub]'); if(_tsb){ var _pp=_tsb.getAttribute('data-tsub').split('::'); var _tt=FD.getTask(_pp[0]); if(_tt&&_tt.subs&&_tt.subs[+_pp[1]]){ _tt.subs[+_pp[1]].done=!_tt.subs[+_pp[1]].done; FD.save(); if($('#plTasks')) renderPlanTasks(); if($('#plProjects')) renderPlanProjects(); if($('#plOverview')) renderPlanOverview(); } return; }
 if(pltd){ FD.toggleTask(pltd.getAttribute('data-pltdone')); if($('#plTasks')) renderPlanTasks(); if($('#plProjects')) renderPlanProjects(); if($('#plWeek')) renderPlanWeek(); if($('#plOverview')) renderPlanOverview(); return; }
 var _plf=e.target.closest('[data-plfold]'); if(_plf){ var _fid=_plf.getAttribute('data-plfold'); plFoldT[_fid]=!plFoldT[_fid];
 // animate ONLY this task's fold, no global re-render (keeps neighbours still)
 var _open=plFoldT[_fid];
 document.querySelectorAll('[data-plfold="'+_fid+'"]').forEach(function(btn){
 btn.classList.toggle('is-open',_open);
 var row=btn.closest('.hmrow'); if(!row) return;
 var wrap=row.querySelector('.tsubwrap'); if(wrap) wrap.classList.toggle('is-open',_open);
 });
 return; }
 var _plo=e.target.closest('[data-pltopen]'); if(_plo){ openModal('editTask',{taskId:_plo.getAttribute('data-pltopen')}); return; }
 var plte = e.target.closest('[data-pltedit]');
 if(plte){ openModal('editTask',{taskId:plte.getAttribute('data-pltedit')}); return; }
 var pltx = e.target.closest('[data-pltdel]');
 if(pltx){ if(window.confirm('Delete this task?')){ FD.removeTask(pltx.getAttribute('data-pltdel')); if($('#plTasks')) renderPlanTasks(); if($('#plProjects')) renderPlanProjects(); if($('#plOverview')) renderPlanOverview(); flash('Task deleted'); } return; }
 var _pltq = e.target.closest('[data-pltclrq]');
 if(_pltq){ pltQuery=''; var _ti=document.getElementById('pltSearch'); if(_ti) _ti.value='';
  var _tb=document.getElementById('pltSearchBox'); if(_tb) _tb.classList.remove('has-val');
  pltPaint(); return; }
 var pltf = e.target.closest('[data-pltfilter]');
 if(pltf){ pltFilter=pltf.getAttribute('data-pltfilter'); renderPlanTasks(); return; }
 var pltc = e.target.closest('[data-pltclr]');
 if(pltc){ if(window.confirm('Clear all completed tasks?')){ FD.clearDoneTasks(); renderPlanTasks(); if($('#plProjects')) renderPlanProjects(); if($('#plOverview')) renderPlanOverview(); flash('Cleared'); } return; }
 var plta = e.target.closest('[data-pltadd]');
 if(plta){ openModal('task',{projectId:plta.getAttribute('data-pltadd')}); return; }
 var plda = e.target.closest('[data-pldayadd]');
 if(plda){ openModal('task',{due:plda.getAttribute('data-pldayadd')}); return; }
 var _evo=e.target.closest('[data-evopen]'); if(_evo){ try{ openEvent(_evo.getAttribute('data-evopen')); }catch(err){} return; }
 var _plo=e.target.closest('[data-plopen]'); if(_plo){ var _pid=_plo.getAttribute('data-plopen'); navigateSub('planning','projects'); setTimeout(function(){ try{ if($('#plProjects')) renderPlanProjects(); pjOpenDrawer(_pid); }catch(e2){} },60); return; }
   /* ---- Projects page (redesign) ---- */
   if(!e.target.closest('.pj-menu')&&!e.target.closest('[data-pjsortbtn]')){
    var _sm=document.getElementById('pjSortMenu'); if(_sm) _sm.classList.remove('is-open');
    if(!e.target.closest('[data-pjmenu]')) pjCloseMenu();
   }
   var _pjclr=e.target.closest('[data-pjclr]');
   if(_pjclr){ pjQuery=''; var _si=document.getElementById('pjSearch'); if(_si) _si.value='';
    var _sb=document.getElementById('pjSearchBox'); if(_sb) _sb.classList.remove('has-val'); pjPaint(); return; }
   var _pjf=e.target.closest('[data-pjfilter]');
   if(_pjf){ pjFilter=_pjf.getAttribute('data-pjfilter'); pjPaint(); return; }
   var _pjsb=e.target.closest('[data-pjsortbtn]');
   if(_pjsb){ var _m=document.getElementById('pjSortMenu'); if(_m) _m.classList.toggle('is-open'); return; }
   var _pjs=e.target.closest('[data-pjsort]');
   if(_pjs){ pjSort=_pjs.getAttribute('data-pjsort');
    var _l=document.getElementById('pjSortLbl'); if(_l) _l.textContent=_pjs.getAttribute('data-pjsortlbl');
    pjSortMenu(); var _m2=document.getElementById('pjSortMenu'); if(_m2) _m2.classList.remove('is-open'); pjPaint(); return; }
   var _pjm=e.target.closest('[data-pjmenu]');
   if(_pjm){ e.stopPropagation();
    var _ex=document.getElementById('pjCtx');
    if(_ex&&_ex.getAttribute('data-pjanchor')===_pjm.getAttribute('data-pjmenu')){ pjCloseMenu(); return; }
    pjOpenMenu(_pjm.getAttribute('data-pjmenu'),_pjm,'main'); return; }
   var _pja=e.target.closest('[data-pjact]');
   if(_pja){ e.stopPropagation(); pjAction(_pja.getAttribute('data-pjact'),_pja.getAttribute('data-pjid'),_pja.getAttribute('data-pjval')); return; }
   var _pjx=e.target.closest('[data-pjclose]');
   if(_pjx){ pjCloseDrawer(); return; }
   var _pjmc=e.target.closest('[data-pjmenuclose]'); if(_pjmc){ pjCloseMenu(); return; }
   var _pjas=e.target.closest('[data-pjassign]');
   if(_pjas){ e.stopPropagation(); pjOpenMenu(_pjas.getAttribute('data-pjassign'),_pjas,'mem'); return; }
   var _pjc=e.target.closest('[data-pjcard]');
   if(_pjc){ if(pjLPFired){ pjLPFired=false; return; } pjOpenDrawer(_pjc.getAttribute('data-pjcard')); return; }
 var plwk = e.target.closest('[data-plweek]');
 if(plwk){ var _pw=plwk.getAttribute('data-plweek'); if(_pw==='prev') plWeekOff--; else if(_pw==='next') plWeekOff++; else plWeekOff=0; renderPlanWeek(); return; }
 var rls = e.target.closest('[data-rlset]');
 if(rls){ var _a=($('#rlPinA')||{}).value||'', _b=($('#rlPinB')||{}).value||''; if(!/^[0-9]{4,8}$/.test(_a)){ rlErr('Use 4\u20138 digits.'); return; } if(_a!==_b){ rlErr('The PINs don\u2019t match.'); return; } var _salt=rlRandSalt(); rlHash(_a,_salt,function(h){ FD.setRelPin(h,_salt); flash('Private space created'); rlAfterUnlock(); }); return; }
 var rlu = e.target.closest('[data-rlunlock]');
 if(rlu){ var _p=($('#rlPin')||{}).value||''; if(!_p){ rlErr('Enter your PIN.'); return; } rlHash(_p,FD.data.relationship.pinSalt,function(h){ if(h===FD.data.relationship.pinHash){ rlAfterUnlock(); } else { rlErr('That\u2019s not it, try again.'); var _pi=$('#rlPin'); if(_pi){ _pi.value=''; _pi.focus(); } } }); return; }
 var rlf = e.target.closest('[data-rlforgot]');
 if(rlf){ if(window.confirm('Without the PIN, the only way in is to erase this private space, all notes, dates and plans inside will be permanently deleted. The rest of the app is untouched.\n\nErase and start fresh?')){ FD.wipeRelationship(); rlUnlocked=false; rlMode='unlock'; renderRelLock(); flash('Private space reset'); } return; }
 var rll = e.target.closest('[data-rllock]');
 if(rll){ rlUnlocked=false; rlMode='unlock'; renderRelLock(); flash('Locked'); return; }
 var rlc = e.target.closest('[data-rlchange]');
 if(rlc){ rlMode='change'; renderRelLock(); return; }
 var rlcs = e.target.closest('[data-rlchangesave]');
 if(rlcs){ var _cur=($('#rlCur')||{}).value||'', _na=($('#rlNewA')||{}).value||'', _nb=($('#rlNewB')||{}).value||''; if(!/^[0-9]{4,8}$/.test(_na)){ rlErr('New PIN must be 4\u20138 digits.'); return; } if(_na!==_nb){ rlErr('The new PINs don\u2019t match.'); return; } rlHash(_cur,FD.data.relationship.pinSalt,function(h){ if(h!==FD.data.relationship.pinHash){ rlErr('Current PIN isn\u2019t right.'); return; } var _s2=rlRandSalt(); rlHash(_na,_s2,function(h2){ FD.setRelPin(h2,_s2); rlMode='unlock'; renderRelLock(); flash('PIN changed'); }); }); return; }
 var rlx = e.target.closest('[data-rlcancel]');
 if(rlx){ rlMode='unlock'; renderRelLock(); return; }
 var rlsn = e.target.closest('[data-rlsince]');
 if(rlsn){ openModal('relSince'); return; }
 var rlne = e.target.closest('[data-rlnedit]');
 if(rlne){ openModal('editRelNote',{relNoteId:rlne.getAttribute('data-rlnedit')}); return; }
 var rlnd = e.target.closest('[data-rlndel]');
 if(rlnd){ if(window.confirm('Delete this note? It cannot be recovered.')){ FD.removeRelNote(rlnd.getAttribute('data-rlndel')); renderRelNotes(); if($('#rlUs')) renderRelUs(); flash('Note deleted'); } return; }
 var rlde = e.target.closest('[data-rldedit]');
 if(rlde){ openModal('editRelDate',{relDateId:rlde.getAttribute('data-rldedit')}); return; }
 var rldd = e.target.closest('[data-rlddel]');
 if(rldd){ if(window.confirm('Remove this special date?')){ FD.removeRelDate(rldd.getAttribute('data-rlddel')); renderRelDates(); if($('#rlUs')) renderRelUs(); flash('Removed'); } return; }
 var rlpe = e.target.closest('[data-rlpedit]');
 if(rlpe){ openModal('editRelPlan',{relPlanId:rlpe.getAttribute('data-rlpedit')}); return; }
 var rlpd = e.target.closest('[data-rlpdel]');
 if(rlpd){ if(window.confirm('Delete this idea?')){ FD.removeRelPlan(rlpd.getAttribute('data-rlpdel')); renderRelPlans(); if($('#rlUs')) renderRelUs(); flash('Deleted'); } return; }
 var rlpo = e.target.closest('[data-rlpdone]');
 if(rlpo){ FD.toggleRelPlan(rlpo.getAttribute('data-rlpdone')); rlSurpriseId=''; renderRelPlans(); if($('#rlUs')) renderRelUs(); return; }
 var rlsu = e.target.closest('[data-rlsurprise]');
 if(rlsu){ var _ids=FD.data.relationship.plans.filter(function(p){return !p.done&&!p.when;}); if(_ids.length){ rlSurpriseId=_ids[Math.floor(Math.random()*_ids.length)].id; renderRelPlans(); flash('How about this one?'); } return; }
 var mmo = e.target.closest('[data-mmopen]');
 if(mmo){ mmOpenAlbum=mmo.getAttribute('data-mmopen'); renderMemAlbums(); return; }
 var mmb = e.target.closest('[data-mmback]');
 if(mmb){ mmOpenAlbum=''; renderMemAlbums(); return; }
 var mmae = e.target.closest('[data-mmaledit]');
 if(mmae){ openModal('editAlbum',{albumId:mmae.getAttribute('data-mmaledit')}); return; }
 var mmad = e.target.closest('[data-mmaldel]');
 if(mmad){ var _al=FD.getAlbum(mmad.getAttribute('data-mmaldel')); if(window.confirm('Delete this album'+(_al&&_al.photos.length?' and its '+_al.photos.length+' photo'+(_al.photos.length>1?'s':''):'')+'? This cannot be undone.')){ FD.removeAlbum(mmad.getAttribute('data-mmaldel')); mmOpenAlbum=''; renderMemAlbums(); if($('#mmOverview')) renderMemOverview(); flash('Album deleted'); } return; }
 var mmpa = e.target.closest('[data-mmphadd]');
 if(mmpa){ openModal('memPhoto',{albumId:mmpa.getAttribute('data-mmphadd')}); return; }
 var mmpe = e.target.closest('[data-mmphedit]');
 if(mmpe){ openModal('editMemPhoto',{albumId:mmpe.getAttribute('data-alb'),photoId:mmpe.getAttribute('data-mmphedit')}); return; }
 var mmpd = e.target.closest('[data-mmphdel]');
 if(mmpd){ if(window.confirm('Delete this photo?')){ FD.removeAlbumPhoto(mmpd.getAttribute('data-alb'),mmpd.getAttribute('data-mmphdel')); renderMemAlbums(); if($('#mmOverview')) renderMemOverview(); flash('Photo deleted'); } return; }
 var mmsx = e.target.closest('[data-mmsexp]');
 if(mmsx){ var _sid=mmsx.getAttribute('data-mmsexp'); mmOpenS[_sid]=!mmOpenS[_sid]; renderMemStories(); return; }
 var mmse = e.target.closest('[data-mmsedit]');
 if(mmse){ openModal('editStory',{storyId:mmse.getAttribute('data-mmsedit')}); return; }
 var mmsd = e.target.closest('[data-mmsdel]');
 if(mmsd){ if(window.confirm('Delete this story? It cannot be recovered.')){ FD.removeStory(mmsd.getAttribute('data-mmsdel')); renderMemStories(); if($('#mmOverview')) renderMemOverview(); flash('Story deleted'); } return; }
 var mmce = e.target.closest('[data-mmcedit]');
 if(mmce){ openModal('editCapsule',{capsuleId:mmce.getAttribute('data-mmcedit')}); return; }
 var mmcd = e.target.closest('[data-mmcdel]');
 if(mmcd){ if(window.confirm('Delete this capsule? Whatever is inside will be lost.')){ FD.removeCapsule(mmcd.getAttribute('data-mmcdel')); renderMemCapsule(); if($('#mmOverview')) renderMemOverview(); flash('Capsule deleted'); } return; }
 var mmsh = e.target.closest('[data-mmshuffle]');
 if(mmsh){ mmVaultPick(true); renderMemOverview(); return; }
 var wba = e.target.closest('[data-wbadd]');
 if(wba){ openModal('checkin',{member:wba.getAttribute('data-wbadd')}); return; }
 var wbce = e.target.closest('[data-wbcedit]');
 if(wbce){ openModal('editCheckin',{checkinId:wbce.getAttribute('data-wbcedit')}); return; }
 var wbcd = e.target.closest('[data-wbcdel]');
 if(wbcd){ if(window.confirm('Delete this check-in?')){ FD.removeCheckin(wbcd.getAttribute('data-wbcdel')); if($('#wbCheckins')) renderWbCheckins(); if($('#wbOverview')) renderWbOverview(); flash('Deleted'); } return; }
 var wbd = e.target.closest('[data-wbdid]');
 if(wbd){ FD.logCare(wbd.getAttribute('data-wbdid')); wbGlowId=''; if($('#wbCare')) renderWbCare(); if($('#wbOverview')) renderWbOverview(); flash(WB_AFFIRM[Math.floor(Math.random()*WB_AFFIRM.length)]); return; }
 var wbu = e.target.closest('[data-wbundo]');
 if(wbu){ FD.unlogCareToday(wbu.getAttribute('data-wbundo')); if($('#wbCare')) renderWbCare(); if($('#wbOverview')) renderWbOverview(); return; }
 var wbse = e.target.closest('[data-wbsedit]');
 if(wbse){ openModal('editSelfcare',{careId:wbse.getAttribute('data-wbsedit')}); return; }
 var wbsd = e.target.closest('[data-wbsdel]');
 if(wbsd){ if(window.confirm('Remove this from the self-care menu?')){ FD.removeCare(wbsd.getAttribute('data-wbsdel')); renderWbCare(); if($('#wbOverview')) renderWbOverview(); flash('Removed'); } return; }
 var wbss = e.target.closest('[data-wbseed]');
 if(wbss){ WB_STARTERS.forEach(function(t){ FD.addCare({title:t,member:'',log:[]}); }); renderWbCare(); flash('Starter ideas added'); return; }
 var wbsu = e.target.closest('[data-wbsuggest]');
 if(wbsu){ var _cs=FD.data.wellbeing.selfcare; if(_cs.length){ wbGlowId=_cs[Math.floor(Math.random()*_cs.length)].id; renderWbCare(); flash('Maybe this one?'); } return; }
 var wbrf = e.target.closest('[data-wbref]');
 if(wbrf){ openModal('reflection',{growthId:wbrf.getAttribute('data-wbref')}); return; }
 var wbgx = e.target.closest('[data-wbgexp]');
 if(wbgx){ var _gid2=wbgx.getAttribute('data-wbgexp'); wbOpenG[_gid2]=!wbOpenG[_gid2]; renderWbGrowth(); return; }
 var wbge = e.target.closest('[data-wbgedit]');
 if(wbge){ openModal('editGrowth',{growthId:wbge.getAttribute('data-wbgedit')}); return; }
 var wbgd = e.target.closest('[data-wbgdel]');
 if(wbgd){ if(window.confirm('Delete this intention and its reflections?')){ FD.removeGrowth(wbgd.getAttribute('data-wbgdel')); renderWbGrowth(); if($('#wbOverview')) renderWbOverview(); flash('Deleted'); } return; }
 var wbrd = e.target.closest('[data-wbrdel]');
 if(wbrd){ if(window.confirm('Delete this reflection?')){ FD.removeReflection(wbrd.getAttribute('data-gid'),wbrd.getAttribute('data-wbrdel')); renderWbGrowth(); if($('#wbOverview')) renderWbOverview(); } return; }
 var lgde = e.target.closest('[data-lgded]');
 if(lgde){ openModal('editDua',{duaId:lgde.getAttribute('data-lgded')}); return; }
 var lgdd = e.target.closest('[data-lgddel]');
 if(lgdd){ if(window.confirm('Delete this du\u2019a?')){ FD.removeDua(lgdd.getAttribute('data-lgddel')); renderLegDuas(); if($('#lgOverview')) renderLegOverview(); flash('Deleted'); } return; }
 var lgee = e.target.closest('[data-lgdeed-e]');
 if(lgee){ openModal('editDeed',{deedId:lgee.getAttribute('data-lgdeed-e')}); return; }
 var lged = e.target.closest('[data-lgdeed-d]');
 if(lged){ if(window.confirm('Delete this deed?')){ FD.removeDeed(lged.getAttribute('data-lgdeed-d')); renderLegDeeds(); if($('#lgOverview')) renderLegOverview(); flash('Deleted'); } return; }
 var lgwe = e.target.closest('[data-lgwe]');
 if(lgwe){ openModal('editWisdom',{wisdomId:lgwe.getAttribute('data-lgwe')}); return; }
 var lgwd = e.target.closest('[data-lgwd]');
 if(lgwd){ if(window.confirm('Delete this saying?')){ FD.removeWisdom(lgwd.getAttribute('data-lgwd')); renderLegWisdom(); if($('#lgOverview')) renderLegOverview(); flash('Deleted'); } return; }
 var rtog = e.target.closest('[data-resptoggle]');
 if(rtog){ FD.toggleResponsibility(rtog.getAttribute('data-resptoggle')); if($('#respWrap')) renderResponsibilities(); if($('#famDash')) renderDashboard(); return; }
 var redit = e.target.closest('[data-respedit]');
 if(redit){ openModal('editResponsibility',{respId:redit.getAttribute('data-respedit')}); return; }
 var rdel = e.target.closest('[data-respdel]');
 if(rdel){ if(window.confirm('Delete this responsibility?')){ FD.removeResponsibility(rdel.getAttribute('data-respdel')); renderResponsibilities(); flash('Deleted'); } return; }
 var docchip = e.target.closest('[data-docchip]');
 if(docchip){ docCat=docchip.getAttribute('data-docchip'); renderDocuments(); return; }
 var docedit = e.target.closest('[data-docedit]');
 if(docedit){ openModal('editDocument',{docId:docedit.getAttribute('data-docedit')}); return; }
 var docdel = e.target.closest('[data-docdel]');
 if(docdel){ if(window.confirm('Delete this document? Any attached files will be removed too.')){ FD.removeDocument(docdel.getAttribute('data-docdel')); renderDocuments(); flash('Document deleted'); } return; }
 var ddel = e.target.closest('[data-del]');
 if(ddel){ FD.removeSubItem(ddel.getAttribute('data-mid'),ddel.getAttribute('data-key'),ddel.getAttribute('data-id')); if(currentMemberId) renderMemberDetail(currentMemberId); flash('Removed'); return; }
 var act = e.target.closest('[data-action]'); if(!act) return;
 var a = act.getAttribute('data-action');
 if(a==='theme-toggle') quickTheme();
 else if(a==='collapse') toggleCollapse();
 else if(a==='menu') (app.classList.contains('is-drawer-open')?closeDrawer():openDrawer());
 else if(a==='close-drawer') closeDrawer();
 else if(a==='save-family') saveFamily();
 else if(a==='reset') resetAll();
 else if(a==='export') exportData();
 else if(a==='import'){ var _fi=$('#importFile'); if(_fi){ _fi.value=''; _fi.click(); } }
 else if(a==='set-theme') setTheme(act.getAttribute('data-theme'));
 else if(a==='members-back') showMembersList();
 else if(a==='edit-member') openModal('editProfile',{memberId:act.getAttribute('data-mid')});
 else if(a==='del-member'){ if(window.confirm('Remove this member and all their details? This cannot be undone.')){ FD.removeMember(act.getAttribute('data-mid')); showMembersList(); renderDashboard(); flash('Member removed'); } }
 else if(a==='gov-edit') editGov(act.getAttribute('data-key'));
 else if(a==='gov-save') saveGov(act.getAttribute('data-key'));
 else if(a==='gov-cancel') cancelGov();
 else if(a==='gov-history') openGovHistory(act.getAttribute('data-key'));
 else if(a==='gov-restore'){ FD.restoreGov(act.getAttribute('data-key'), parseInt(act.getAttribute('data-idx'),10)); closeModal(); govEditing=null; renderGovernance(); renderDashboard(); flash('Version restored'); }
 else if(a==='meetings-back') showMeetingsList();
 else if(a==='edit-meeting') openModal('editMeeting',{meetingId:act.getAttribute('data-mid')});
 else if(a==='del-meeting'){ if(window.confirm('Delete this meeting and all its notes? This cannot be undone.')){ FD.removeEvent(act.getAttribute('data-mid')); showMeetingsList(); renderDashboard(); flash('Meeting deleted'); } }
 else if(a==='mtg-notes-edit'){ mtgEditNotes=true; renderMeetingDetail(currentMeetingId); }
 else if(a==='mtg-notes-cancel'){ mtgEditNotes=false; renderMeetingDetail(currentMeetingId); }
 else if(a==='mtg-notes-save') saveMtgNotes();
 else if(a==='ev-edit') openModal('editEvent',{eventId:act.getAttribute('data-id')});
 else if(a==='ev-del'){ if(window.confirm('Delete this event? This cannot be undone.')){ FD.removeEvent(act.getAttribute('data-id')); closeModal(); renderCalendar(); renderDashboard(); flash('Event deleted'); } }
 else if(a==='ev-complete'){ var eid=act.getAttribute('data-id'); var eev=FD.getEvent(eid); if(eev){ FD.updateEvent(eid,{completed:!eev.completed}); openEvent(eid); renderCalendar(); renderDashboard(); } }
 else if(a==='goto-member'){ var gm=act.getAttribute('data-mid'); closeModal(); navigate('family'); navigateSub('family','members'); openMember(gm); }
 else if(a==='comm-send') sendCommMsg();
 else if(a==='comm-rec'){ if(isRecording) stopRec(); else startRec(); }
 else if(a==='comm-announce'){ var at=$('#annText'); var af=$('#annFrom'); var txt=at?at.value.trim():''; if(!txt){ flash('Please write a notice.'); } else { FD.addAnnouncement({text:txt,author:(af?af.value:'Family')||'Family'}); renderComm(); renderDashboard(); flash('Announcement posted'); } }
 });
 $('#familyInput').addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); saveFamily(); } });
 (function(){ var _imp=$('#importFile'); if(_imp) _imp.addEventListener('change', function(){ if(this.files&&this.files[0]) importData(this.files[0]); }); })();
 markSoon(); renderGettingStarted(); updateBackupNote();
 document.addEventListener('input', function(e){ if(e.target && e.target.id==='setSearch') setFilter(e.target.value); });
 document.addEventListener('keydown', function(e){ if(e.key==='Escape'&&document.getElementById('wdoc')){ wdocClose(); return; } });
 document.addEventListener('keydown', function(e){ if(e.key==='Escape'){ if($('#modal').classList.contains('open')){ closeModal(); return; } if(app.classList.contains('is-drawer-open')) closeDrawer(); } });
 window.addEventListener('hashchange', function(){ navigate((location.hash||'#home').slice(1), false); });
 mqMobile.addEventListener('change', function(e){ if(!e.matches) closeDrawer(); });

 /* ---- Init ---- */
 FD.load();
 renderGreeting();
 tick(); setInterval(tick, 1000);

 /* ===================== PWA: manifest + install + service worker ===================== */
 var PWA_ICONS = {
 i192: "data:image/png;base64,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", i512: "data:image/png;base64,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", i192m: "data:image/png;base64,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", i512m: "data:image/png;base64,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"
 };
 (function setupPWA(){
 try{
 var baseDir = location.href.replace(/[^\/]*(\?.*)?(#.*)?$/, '');
 var manifest = {
 name: "Wisal",
 short_name: "Wisal",
 description: "Your whole household, family, health, finance, journal, cooking and more, in one calm, private life operating system.",
 id: baseDir,
 start_url: baseDir,
 scope: baseDir,
 display: "standalone",
 display_override: ["standalone","minimal-ui"],
 orientation: "portrait-primary",
 background_color: "#F3F5FA",
 theme_color: "#1E3A7B",
 categories: ["lifestyle","productivity","health"],
 lang: "en",
 dir: "ltr",
 icons: [
 { src: PWA_ICONS.i192, sizes:"192x192", type:"image/png", purpose:"any" },
 { src: PWA_ICONS.i512, sizes:"512x512", type:"image/png", purpose:"any" },
 { src: PWA_ICONS.i192m, sizes:"192x192", type:"image/png", purpose:"maskable" },
 { src: PWA_ICONS.i512m, sizes:"512x512", type:"image/png", purpose:"maskable" }
 ]
 };
 if(!document.querySelector('link[rel="manifest"]')){
  var blob = new Blob([JSON.stringify(manifest)], {type:"application/manifest+json"});
  var url = URL.createObjectURL(blob);
  var link = document.createElement("link");
  link.rel = "manifest"; link.setAttribute("href", url);
  document.head.appendChild(link);
 }
 }catch(e){ /* manifest optional */ }

 // Register a service worker for offline IF a sibling sw.js is present (graceful no-op otherwise).
 try{
 if("serviceWorker" in navigator && location.protocol.indexOf("http")===0){
 window.addEventListener("load", function(){
 navigator.serviceWorker.register("sw.js").then(function(reg){
 window.__swReady = true;
 try{ upWatch(reg); }catch(e){}
 }).catch(function(){ /* no sw.js deployed, app still works, just no offline cache */ });
 });
 }
 }catch(e){}

 // Install prompt handling (Android / desktop Chromium)
 var deferred = null;
 function isStandalone(){ return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone===true; }
 function showInstallUI(on){
 var card = document.getElementById("installCard"); if(card) card.hidden = !on;
 try{ renderSetIndex(); }catch(e){}
 }
 window.addEventListener("beforeinstallprompt", function(e){
 e.preventDefault(); deferred = e; showInstallUI(true);
 try{ renderSetIndex(); }catch(e){}
 });
 window.addEventListener("appinstalled", function(){
 deferred = null; showInstallUI(false);
 if(typeof flash==="function") flash("Installed, find it on your home screen");
 try{ renderSetIndex(); }catch(e){}
 });
 function doInstall(){
 if(deferred){ deferred.prompt(); deferred.userChoice.then(function(){ deferred=null; showInstallUI(false); }); }
 }
 window.__pwaInstall = doInstall;

 window.addEventListener("load", function(){
 // Reflect existing installability into the settings card on load
 if(isStandalone()){ var c=document.getElementById("installCard"); if(c){ var d=document.getElementById("installedNote"); if(d) d.hidden=false; var b=document.getElementById("installBtn"); if(b) b.hidden=true; c.hidden=false; } }
 });

 // Wire clicks (delegate)
 document.addEventListener("click", function(e){
 var t=e.target.closest("[data-pwa]"); if(!t) return;
 var k=t.getAttribute("data-pwa");
 if(k==="install"){ doInstall(); }
 });
 })();

 wrapRemoves(); _undoReady=true;
 try{ renderNotifCard(); }catch(e){}
 setTimeout(function(){ try{ notifSweep(); }catch(e){} }, 6000);
 setInterval(function(){ try{ notifSweep(); }catch(e){} }, 900000);
 document.addEventListener('visibilitychange', function(){ if(!document.hidden){ setTimeout(function(){ try{ notifSweep(); }catch(e){} }, 1200); } });
 /* ---- Resume behaviour ----
    Coming back to the app should feel live, not like a frozen screenshot: re-render with
    current data, and after a long absence treat it as a new visit and return Home. */
 var _fwAwayFrom = 0;
 function _fwResume(){
   var away = _fwAwayFrom ? (Date.now() - _fwAwayFrom) : 0;
   _fwAwayFrom = 0;
   if(!away) return;
   try{ refreshAll(); }catch(e){}
   try{ renderGreeting(); }catch(e){}
   try{ renderNotifications(); }catch(e){}
   if(away > 1800000){ /* away 30+ minutes -> start fresh at Home */
     try{ navigate('home'); }catch(e){}
   }
 }
 document.addEventListener('visibilitychange', function(){
   if(document.hidden){ _fwAwayFrom = Date.now(); } else { _fwResume(); }
 });
 window.addEventListener('pageshow', function(e){ if(e && e.persisted){ _fwResume(); } });
 try{ applySpaceVisibility(); }catch(e){}
 try{ authInit(); }catch(e){}
 try{ bootOnboarding(); }catch(e){}
 try{ var _g=document.getElementById('avGrid'); if(_g) _g.innerHTML=avGridHtml(); avApply(); }catch(e){}
 try{ wisalHandlePaymentReturn(); }catch(e){}
 try{ wisalHandleUpgradeLink(); }catch(e){}
 try{ wisalSyncPlan(); }catch(e){}
 try{ wnCheck(); }catch(e){}
 try{ renderNotifications(); }catch(e){}
 setInterval(function(){ try{ renderNotifications(); }catch(e){} }, 300000);
 setInterval(renderGreeting, 60000);
 /* ---- Fresh-start behaviour ----
    A cold launch (app opened anew, or returning after it was closed) always begins at
    Home, the way every major app does. A reload *inside* the same session keeps your place. */
 var _fwFresh = true;
 try{ if(sessionStorage.getItem('fw.session.live')==='1'){ _fwFresh=false; } sessionStorage.setItem('fw.session.live','1'); }catch(e){}
 var start;
 if(_fwFresh){
   start='home';
   try{ if(location.hash){ history.replaceState(null,'',location.pathname+location.search); } }catch(e){}
 } else {
   start=(location.hash||'').slice(1) || Store.get(K.view,'home');
 }
 applyNavGroups();
 navigate(VIEWS.indexOf(start)!==-1?start:'home', false);
/* ==================== TRIP COMMAND CENTER (step 1) ====================
   Tapping a trip opens its own space. Everything here reads from the existing
   trip object and the existing packing list — no data was moved or renamed, so
   the Travel list keeps working exactly as before. New fields are optional and
   created on demand. */

  var TRD_TABS = [
    ['overview','Overview'], ['itinerary','Itinerary'], ['packing','Packing'],
    ['budget','Budget'], ['bookings','Bookings'], ['docs','Documents'], ['journal','Journal']
  ];
  /* The eight things that decide whether a family is actually ready to go. */
  var TRD_PREP = [
    ['flights','Flights booked'], ['hotel','Accommodation confirmed'],
    ['passport','Passports ready'], ['visa','Visa completed'],
    ['insurance','Travel insurance'], ['currency','Currency exchanged'],
    ['transfer','Airport transfer'], ['docs','Documents copied']
  ];
  var trdId=null, trdTab='overview';

  function trdTrip(){ try{ return (FD.data.travel.trips||[]).filter(function(t){return t.id===trdId;})[0]||null; }catch(e){ return null; } }
  function trdPrepOf(t){ if(!t.prep) t.prep={}; return t.prep; }

  function trdReadiness(t){
    var p=trdPrepOf(t), done=0;
    TRD_PREP.forEach(function(x){ if(p[x[0]]) done++; });
    var pk=tvPackStats(t.id);
    /* Preparation is most of it; packing counts for a quarter. */
    var prepPart = done/TRD_PREP.length;
    var packPart = pk.total ? pk.done/pk.total : 0;
    var pc = Math.round((prepPart*0.75 + packPart*0.25)*100);
    return { pc:pc, done:done, total:TRD_PREP.length, pack:pk };
  }

  function trdRemaining(t){
    var p=trdPrepOf(t), out=[];
    TRD_PREP.forEach(function(x){ if(!p[x[0]]) out.push(x[1]); });
    var pk=tvPackStats(t.id);
    if(pk.total && pk.done<pk.total) out.push((pk.total-pk.done)+' packing items');
    return out;
  }

  function trdNights(t){
    if(!t.start||!t.end) return null;
    var a=new Date(t.start), b=new Date(t.end);
    var d=Math.round((b-a)/86400000);
    return d>0? d : null;
  }

  function trdIco(name){
    if(name==='back') return '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return '<svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function trdTabOverview(t){
    var r=trdReadiness(t), left=trdRemaining(t), n=trdNights(t);
    var facts=[
      ['Destination', t.dest||'\u2014'],
      ['Departure', t.start? fmtDate(t.start) : 'To decide'],
      ['Return', t.end? fmtDate(t.end) : 'To decide'],
      ['Duration', n? (n+' night'+(n>1?'s':'')) : '\u2014'],
      ['Travellers', (t.travelers&&t.travelers.length)? t.travelers.join(', ') : 'Everyone'],
      ['Packing', r.pack.total? (r.pack.done+' of '+r.pack.total+' packed') : 'Not started']
    ];
    var p=trdPrepOf(t);
    return '<div class="trd__sec"><div class="trd__secH">Trip summary</div><div class="trd__facts">'
      + facts.map(function(f){ return '<div class="trd__fact"><div class="trd__factL">'+f[0]+'</div><div class="trd__factV">'+esc(String(f[1]))+'</div></div>'; }).join('')
      + '</div></div>'
      + (t.note? '<div class="trd__sec"><div class="trd__secH">Notes</div><div class="trd__fact">'+esc(t.note).replace(/\n/g,'<br>')+'</div></div>' : '')
      + '<div class="trd__sec"><div class="trd__secH">Before you leave \u00b7 '+r.done+' of '+r.total+'</div><div class="trd__prep">'
      + TRD_PREP.map(function(x){
          return '<button type="button" class="trd__prepI'+(p[x[0]]?' is-done':'')+'" data-trdprep="'+x[0]+'">'
            +'<span class="trd__box">'+trdIco('tick')+'</span><span class="trd__prepT">'+x[1]+'</span></button>';
        }).join('')
      + '</div></div>';
  }

  function trdSoon(what){
    return '<div class="trd__soon">'+what+' arrives in the next step.<br>Everything you add elsewhere stays exactly where it is.</div>';
  }

  function trdRender(){
    var t=trdTrip(); if(!t) return trdClose();
    var host=document.getElementById('trdView'); if(!host) return;
    var r=trdReadiness(t), left=trdRemaining(t);
    var st=tripStatus(t), cd=tvCountdown(t);
    var hasPhoto = !!t.photo;
    var cover = hasPhoto ? '<img src="'+t.photo+'" alt="">' : '';
    var hint = left.length
      ? '<b>'+left.length+' left:</b> '+esc(left.slice(0,3).join(' \u00b7 '))+(left.length>3?' \u00b7 \u2026':'')
      : '<b>Everything is ready.</b> Have a safe journey.';

    host.innerHTML =
      '<div class="trd__scroll">'
      + '<div class="trd__cover'+(hasPhoto?'':' trd__cover--empty')+'">'+cover
        + '<button class="trd__back" data-trdclose aria-label="Back to trips">'+trdIco('back')+'</button>'
        + '<div class="trd__head">'
          + '<div class="trd__dest">'+esc(t.dest||'Trip')+'</div>'
          + '<h1 class="trd__name">'+esc(t.name||t.dest||'Trip')+'</h1>'
          + '<div class="trd__dates">'+fmtRange(t.start,t.end)+'</div>'
          + '<span class="trd__pill">'+(cd||TV_PILL[st])+'</span>'
        + '</div>'
      + '</div>'
      + '<div class="trd__ready">'
        + '<div class="trd__readtop"><span class="trd__readlbl">Trip readiness</span><span class="trd__readpc">'+r.pc+'%</span></div>'
        + '<div class="trd__bar"><div class="trd__barfill" style="width:'+r.pc+'%"></div></div>'
        + '<div class="trd__hint">'+hint+'</div>'
      + '</div>'
      + '<div class="trd__tabs">'
        + TRD_TABS.map(function(x){ return '<button class="trd__tab'+(trdTab===x[0]?' is-on':'')+'" data-trdtab="'+x[0]+'">'+x[1]+'</button>'; }).join('')
      + '</div>'
      + '<div class="trd__body">'
        + (trdTab==='overview' ? trdTabOverview(t)
          : trdTab==='packing' ? trdSoon('The full packing view')
          : trdTab==='itinerary' ? trdSoon('A day-by-day itinerary')
          : trdTab==='budget' ? trdSoon('Trip budget and expenses')
          : trdTab==='bookings' ? trdSoon('Flights, hotels and reservations')
          : trdTab==='docs' ? trdSoon('Passports, visas and tickets')
          : trdSoon('The travel journal'))
      + '</div>'
      + '</div>';
  }

  function trdOpen(id){
    trdId=id; trdTab='overview';
    var host=document.getElementById('trdView');
    if(!host){
      host=document.createElement('div');
      host.className='trd'; host.id='trdView';
      document.body.appendChild(host);
    }
    trdRender();
    host.classList.add('is-on');
    try{ host.querySelector('.trd__scroll').scrollTop=0; }catch(e){}
    document.body.style.overflow='hidden';
  }
  function trdClose(){
    var host=document.getElementById('trdView');
    if(host) host.classList.remove('is-on');
    document.body.style.overflow='';
    trdId=null;
    try{ renderTravelTrips(); }catch(e){}
  }

  document.addEventListener('click', function(e){
    if(e.target.closest('[data-trdclose]')){ trdClose(); return; }
    var tb=e.target.closest('[data-trdtab]');
    if(tb){ trdTab=tb.getAttribute('data-trdtab'); trdRender(); return; }
    var pr=e.target.closest('[data-trdprep]');
    if(pr){
      var t=trdTrip(); if(!t) return;
      var k=pr.getAttribute('data-trdprep'), p=trdPrepOf(t);
      p[k]=!p[k];
      try{ FD.save(); }catch(_){}
      trdRender();
      return;
    }
    /* Open a trip — but never when the tap was meant for a control on the card. */
    var card=e.target.closest('[data-tvopen]');
    if(card && !e.target.closest('button') && !e.target.closest('a')){
      trdOpen(card.getAttribute('data-tvopen'));
    }
  });

  document.addEventListener('keydown', function(e){
    if(e.key==='Escape' && trdId) trdClose();
  });

})();
