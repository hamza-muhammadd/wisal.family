/* Wisal — service worker (optional, enables full offline use)
   Drop this file next to your HTML on Netlify and the app works with no connection.
   Strategy: network-first for the page (so you always get the latest when online),
   cache-first for fonts, and a cached fallback when offline. */

var CACHE = 'wisal-v131';
var SHELL = ['./', './index.html', './styles.css', './app.js', './world.js', './places.js'];

/* Finance ledger bridge. It is injected inside app.js's existing scope so all
   existing persistence/cloud-sync paths remain authoritative. app.js itself is
   never rewritten in the repository. */
var APP_PATCH = String.raw`(function(){
  /* Wisal finance ledger bridge — injected at runtime by sw.js. */
  if(!FD || !FD.data || !FD.data.finance || FD.__ledgerBridgeV1) return;
  FD.__ledgerBridgeV1=true;

  function ledgerTxExists(source, sourceId, amount, date){
    var a=FD.data.finance.transactions||[];
    for(var i=0;i<a.length;i++){
      var t=a[i];
      if(t.ledgerSource===source && t.ledgerSourceId===sourceId && Number(t.amount)===Number(amount) && String(t.date||'')===String(date||'')) return true;
    }
    return false;
  }
  function addLedgerTx(o){
    if(!o || !(Number(o.amount)>0)) return;
    if(ledgerTxExists(o.ledgerSource,o.ledgerSourceId,o.amount,o.date)) return;
    FD.addTx({
      type:o.type==='income'?'income':'expense',
      category:'other',
      member:o.member||'',
      date:o.date||todayStr(),
      note:o.note||'',
      ledgerKind:o.ledgerKind||'',
      ledgerSource:o.ledgerSource||'',
      ledgerSourceId:o.ledgerSourceId||'',
      amount:Number(o.amount)||0
    });
  }

  var _payDebt=FD.payDebt;
  FD.payDebt=function(id,amt){
    var before=this.getDebt(id), prev=before?Number(before.paid)||0:0;
    var r=_payDebt.call(this,id,amt);
    var after=this.getDebt(id), now=after?Number(after.paid)||0:prev, delta=Math.max(0,now-prev);
    if(after && delta>0){
      addLedgerTx({
        type:after.direction==='owed_to_us'?'income':'expense',
        amount:delta,
        date:todayStr(),
        member:after.member||'',
        note:'Debt payment — '+(after.person||'Debt'),
        ledgerKind:'debt_payment', ledgerSource:'debt', ledgerSourceId:id
      });
      try{ if(typeof renderFinTx==='function') renderFinTx(); }catch(e){}
    }
    return r;
  };

  var _settleDebt=FD.settleDebt;
  FD.settleDebt=function(id){
    var before=this.getDebt(id), prev=before?Number(before.paid)||0:0;
    var r=_settleDebt.call(this,id);
    var after=this.getDebt(id), now=after?Number(after.paid)||0:prev, delta=Math.max(0,now-prev);
    if(after && delta>0){
      addLedgerTx({
        type:after.direction==='owed_to_us'?'income':'expense',
        amount:delta,
        date:todayStr(),
        member:after.member||'',
        note:'Debt payment — '+(after.person||'Debt'),
        ledgerKind:'debt_payment', ledgerSource:'debt', ledgerSourceId:id
      });
      try{ if(typeof renderFinTx==='function') renderFinTx(); }catch(e){}
    }
    return r;
  };

  var _contributeSaving=FD.contributeSaving;
  FD.contributeSaving=function(id,amt){
    var before=this.getSaving(id), prev=before?Number(before.saved)||0:0;
    var r=_contributeSaving.call(this,id,amt);
    var after=this.getSaving(id), now=after?Number(after.saved)||0:prev, delta=Math.max(0,now-prev);
    if(after && delta>0){
      addLedgerTx({
        type:'expense', amount:delta, date:todayStr(), member:after.member||'',
        note:'Savings contribution — '+(after.title||'Savings'),
        ledgerKind:'savings_contribution', ledgerSource:'savings', ledgerSourceId:id
      });
      try{ if(typeof renderFinTx==='function') renderFinTx(); }catch(e){}
    }
    return r;
  };

  var finLedgerQ='', finLedgerFilter='all';
  function ledgerMatches(t){
    var k=t.ledgerKind||'';
    if(finLedgerFilter==='debt') return k==='debt_payment';
    if(finLedgerFilter==='savings') return k==='savings_contribution';
    if(finLedgerFilter==='income') return t.type==='income' && !k;
    if(finLedgerFilter==='expense') return t.type==='expense' && !k;
    return true;
  }
  function ledgerRow(t){
    var k=t.ledgerKind||'';
    var label='';
    if(k==='debt_payment') label='Debt payment';
    else if(k==='savings_contribution') label='Savings';
    else { try{ label=finCatMeta(t.type,t.category).label; }catch(e){ label=t.type==='income'?'Income':'Expense'; } }
    var sub=[];
    sub.push(ovDate(t.date));
    if(k==='debt_payment') sub.push('Debt');
    else if(k==='savings_contribution') sub.push('Savings');
    else sub.push(t.type==='income'?'Income':'Expense');
    if(t.note) sub.push(esc(t.note));
    var sign=t.type==='income'?'+':'−';
    var icon=k==='debt_payment' ? '<svg class="ico" viewBox="0 0 24 24"><path d="M4 12h16M13 5l7 7-7 7"/></svg>'
      : k==='savings_contribution' ? '<svg class="ico" viewBox="0 0 24 24"><path d="M4 10h16v9H4zM7 10V7h10v3M8 14h8"/></svg>'
      : '<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10h3a2 2 0 0 1 0 4h-2a2 2 0 0 0 0 4h3"/></svg>';
    return '<div class="ftx"><button class="ftx__open" data-txedit="'+t.id+'"><span class="ftx__ic">'+icon+'</span><div class="ftx__main"><div class="ftx__t">'+esc(label)+'</div><div class="ftx__s">'+sub.join(' · ')+'</div></div><div class="ftx__amt ftx__amt--'+t.type+'">'+sign+curSymbol()+nfmt(t.amount)+'</div></button><button class="ftx__del" data-txdel="'+t.id+'" aria-label="Delete"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>';
  }

  function renderAllLedger(){
    var el=$('#finTx'); if(!el) return;
    var all=(FD.data.finance.transactions||[]).slice().sort(function(a,b){
      var d=String(b.date||'').localeCompare(String(a.date||''));
      if(d) return d;
      return (Number(b.createdAt)||0)-(Number(a.createdAt)||0);
    });
    var income=0,expense=0;
    all.forEach(function(t){ if(t.type==='income') income+=Number(t.amount)||0; else expense+=Number(t.amount)||0; });
    var filtered=all.filter(function(t){
      if(!ledgerMatches(t)) return false;
      if(!finLedgerQ) return true;
      var q=finLedgerQ.toLowerCase();
      return [t.note,t.category,t.date,t.ledgerKind,t.ledgerSource].join(' ').toLowerCase().indexOf(q)>=0;
    });
    var filters=[['all','All'],['income','Income'],['expense','Expense'],['debt','Debt'],['savings','Savings']];
    var fhtml='<div class="happt-top" style="gap:10px;flex-wrap:wrap"><button class="btn btn--primary" data-modal="transaction"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add transaction</button><span style="font-size:12px;color:var(--text-3);align-self:center">All-time ledger</span></div>'
      +'<div style="display:grid;grid-template-columns:minmax(0,1fr);gap:10px;margin:0 0 12px"><input id="wisalLedgerSearch" type="search" value="'+esc(finLedgerQ)+'" placeholder="Search transactions, notes, dates…" style="width:100%"></div>'
      +'<div style="display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px">'+filters.map(function(f){ return '<button type="button" class="btn'+(finLedgerFilter===f[0]?' btn--primary':'')+'" data-ledger-filter="'+f[0]+'">'+f[1]+'</button>'; }).join('')+'</div>'
      +'<div class="fpulse-grid" style="margin-bottom:14px"><div class="fpulse"><span class="fpulse__k">Income</span><span class="fpulse__v">'+curSymbol()+nfmt(income)+'</span><span class="fpulse__sub">All recorded income</span></div><div class="fpulse"><span class="fpulse__k">Expenses</span><span class="fpulse__v">'+curSymbol()+nfmt(expense)+'</span><span class="fpulse__sub">All recorded outflow</span></div><div class="fpulse"><span class="fpulse__k">Net</span><span class="fpulse__v">'+(income-expense>=0?'+':'−')+curSymbol()+nfmt(Math.abs(income-expense))+'</span><span class="fpulse__sub">Income minus expenses</span></div></div>';
    if(!filtered.length){
      el.innerHTML=fhtml+hEmpty(FIN_ICO,all.length?'No matching transactions':'No transactions yet',all.length?'Try another search or filter.':'Add your first income or expense.','');
    }else{
      el.innerHTML=fhtml+'<div class="hsec-h" style="margin-top:4px">'+filtered.length+' transaction'+(filtered.length===1?'':'s')+'</div>'+filtered.map(ledgerRow).join('');
    }
  }

  renderFinTx=renderAllLedger;
  document.addEventListener('click',function(e){
    var b=e.target.closest('[data-ledger-filter]');
    if(b){ finLedgerFilter=b.getAttribute('data-ledger-filter')||'all'; renderAllLedger(); return; }
  });
  document.addEventListener('input',function(e){
    if(e.target && e.target.id==='wisalLedgerSearch'){
      finLedgerQ=e.target.value||''; renderAllLedger();
      var q=$('#wisalLedgerSearch'); if(q){ try{ q.focus(); q.setSelectionRange(finLedgerQ.length,finLedgerQ.length); }catch(_){} }
    }
  });
  try{ renderAllLedger(); }catch(e){}
})();`;

function patchAppResponse(res){
  if(!res || res.status !== 200) return Promise.resolve(res);
  return res.text().then(function(src){
    if(src.indexOf('wisal finance ledger bridge')>=0) return new Response(src,{status:res.status,statusText:res.statusText,headers:res.headers});
    var marker='\n})();';
    var at=src.lastIndexOf(marker);
    if(at<0) return new Response(src,{status:res.status,statusText:res.statusText,headers:res.headers});
    var out=src.slice(0,at)+'\n\n/* Wisal finance ledger bridge */\n'+APP_PATCH+'\n'+src.slice(at);
    var h=new Headers(res.headers);
    h.delete('content-encoding'); h.delete('content-length'); h.delete('transfer-encoding');
    return new Response(out,{status:res.status,statusText:res.statusText,headers:h});
  });
}

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.all(SHELL.map(function(u){
        return c.add(u).catch(function(){ /* ignore if a shell URL 404s */ });
      }));
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ if(k !== CACHE) return caches.delete(k); });
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list){
      for (var i = 0; i < list.length; i++){
        var c = list[i];
        if ('focus' in c){
          c.focus();
          if (c.navigate) { try { c.navigate(url); } catch(err){} }
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);

  if(req.mode === 'navigate'){
    e.respondWith(
      fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); c.put('./', copy.clone()); });
        return res;
      }).catch(function(){
        return caches.match(req).then(function(m){ return m || caches.match('./') || caches.match('./index.html'); });
      })
    );
    return;
  }

  if(url.origin === location.origin && /\\.(css|js)$/.test(url.pathname)){
    e.respondWith(
      fetch(req).then(function(res){
        if(url.pathname.slice(-7)==='/app.js'){
          return patchAppResponse(res).then(function(patched){
            if(patched && patched.status === 200){
              var copy = patched.clone();
              caches.open(CACHE).then(function(c){ c.put(req, copy); });
            }
            return patched;
          });
        }
        if(res && res.status === 200){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      }).catch(function(){ return caches.match(req); })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function(hit){
      if(hit) return hit;
      return fetch(req).then(function(res){
        if(res && res.status === 200 && (url.origin === location.origin || url.hostname.indexOf('gstatic') >= 0 || url.hostname.indexOf('googleapis') >= 0 || url.hostname.indexOf('jsdelivr') >= 0)){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      }).catch(function(){ return hit; });
    })
  );
});