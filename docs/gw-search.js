/* GhatWise add-on: header search for ghat names + QR scan icon that opens a report sheet. Loads after the main script. No keys, no server. */
(function () {
  var L = function (en, hi) { return lang === 'hi' ? hi : en; };
  var Q = '';
  var stream = null, scanTimer = null;
  var _unusedIssues = [['waste', 'Floating waste or offerings', 'तैरता कचरा या पूजन-सामग्री'], ['debris', 'Idol debris on the bank', 'किनारे पर मूर्ति का मलबा'],
    ['foam', 'Oil, foam or colour in the water', 'पानी में तेल, झाग या रंग'], ['smell', 'Bad smell', 'बदबू'], ['fish', 'Dead fish', 'मरी मछलियाँ'], ['other', 'Something else', 'कुछ और']];
  var gn = function (g) { return g['name_' + lang] || g.name_en; };
  var low = function (s) { return String(s || '').toLowerCase(); };
  var base = function () { return location.origin + location.pathname; };

  var css = document.createElement('style');
  css.textContent = [
    '.gwsearch{position:relative;flex:1 1 170px;min-width:150px;max-width:340px;display:flex;align-items:center;gap:6px}',
    '.gwsearch input{flex:1;min-width:0;font:inherit;font-size:.92rem;padding:8px 12px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--ink)}',
    '.gwsearch .iconbtn{flex:0 0 auto}',
    '.gwres{position:absolute;top:100%;left:0;right:0;margin-top:6px;background:var(--bg);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow-lg);overflow:hidden;z-index:80}',
    '.gwres button,.gwres div{display:block;width:100%;text-align:left;border:0;background:transparent;color:var(--ink);font:inherit;padding:10px 14px;cursor:pointer}',
    '.gwres button:hover{background:var(--band)}.gwres small{display:block;color:var(--muted)}.gwres div{cursor:default;color:var(--muted);font-size:.9rem}',
    '.gwov{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:200;display:flex;align-items:center;justify-content:center;padding:14px}',
    '.gwsheet{background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:20px;box-shadow:var(--shadow-lg);width:100%;max-width:460px;max-height:92vh;overflow:auto;padding:18px}',
    '.gwsheet h2{margin:0 0 6px;font-size:1.15rem}.gwsheet label{display:block;margin:12px 0 4px;font-weight:650;font-size:.92rem}',
    '.gwsheet select,.gwsheet textarea{width:100%;font:inherit;padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--ink)}',
    '.gwsheet textarea{min-height:80px}.gwsheet .note{color:var(--muted);font-size:.88rem;margin:8px 0}',
    '.gwrow{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}',
    '.gwbtn{border:1px solid var(--line);background:var(--card);color:var(--ink);font:inherit;padding:10px 16px;border-radius:999px;cursor:pointer}',
    '.gwbtn.pri{background:linear-gradient(135deg,var(--accent),var(--accent2));color:var(--accent-ink);border-color:transparent;font-weight:650}',
    '.gwvid{width:100%;border-radius:14px;background:#000;max-height:50vh}',
    '.gwqr{background:#fff;color:#000;padding:10px;border-radius:12px;text-align:center;max-width:220px;margin:10px 0;font-size:.85rem}.gwqr svg{width:100%;height:auto;display:block}'
  ].join('\n');
  document.head.appendChild(css);

  function matches(q) {
    q = low(q.trim());
    if (!q) return [];
    return D.ghats.map(function (g, i) { return { g: g, i: i }; }).filter(function (o) {
      return low([o.g.name_en, o.g.name_hi, o.g.body_en, o.g.body_hi].join(' ')).indexOf(q) > -1;
    });
  }
  function results() {
    var box = document.getElementById('gwres'); if (!box) return;
    if (!Q.trim()) { box.hidden = true; box.innerHTML = ''; return; }
    var m = matches(Q);
    box.hidden = false;
    box.innerHTML = m.length ? m.map(function (o) {
      var sc = o.g.scores && o.g.scores[basis];
      return '<button data-open="' + o.i + '">' + esc(gn(o.g)) + '<small>' + esc(o.g['body_' + lang] || '') + (sc ? ' · #' + sc.rank : '') + '</small></button>';
    }).join('') : '<div>' + esc(L('No ghat with this name. New ghats have no readings here.', 'इस नाम का कोई घाट नहीं। नए घाटों की यहाँ कोई जाँच नहीं है।')) + '</div>';
  }

  function inject() {
    Q = '';
    var top = document.querySelector('.topin'); if (!top || top.querySelector('.gwsearch')) return;
    var d = document.createElement('div'); d.className = 'gwsearch';
    d.innerHTML = '<input id="gwq" type="search" autocomplete="off" placeholder="' + esc(L('Search ghat name', 'घाट का नाम खोजें')) + '" aria-label="' + esc(L('Search ghat name', 'घाट का नाम खोजें')) + '">' +
      '<button class="iconbtn" id="gwqr" type="button" title="' + esc(L('Scan a ghat QR to report', 'घाट का QR स्कैन करके शिकायत करें')) + '" aria-label="' + esc(L('Scan a ghat QR to report', 'घाट का QR स्कैन करके शिकायत करें')) + '">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/><rect x="7" y="7" width="4" height="4"/><rect x="13" y="7" width="4" height="4"/><rect x="7" y="13" width="4" height="4"/><path d="M13 13h4v4h-4z"/></svg></button>' +
      '<div class="gwres" id="gwres" hidden></div>';
    var tools = top.querySelector('.tools');
    top.insertBefore(d, tools || null);
    var inp = d.querySelector('#gwq');
    inp.addEventListener('input', function () { Q = inp.value; results(); });
    inp.addEventListener('focus', results);
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { Q = ''; inp.value = ''; results(); }
      if (e.key === 'Enter') { var m = matches(Q); if (m.length) { var b = d.querySelector('.gwres button'); if (b) b.click(); } }
    });
    d.querySelector('#gwqr').addEventListener('click', openScan);
  }
  document.addEventListener('click', function (e) {
    if (!e.target.closest || e.target.closest('.gwsearch')) return;
    var box = document.getElementById('gwres'); if (box) box.hidden = true;
  });

  function closeOv() {
    if (scanTimer) { clearTimeout(scanTimer); scanTimer = null; }
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    var o = document.getElementById('gwov'); if (o) o.remove();
  }
  function overlay(html) {
    closeOv();
    var o = document.createElement('div'); o.className = 'gwov'; o.id = 'gwov';
    o.innerHTML = '<div class="gwsheet" role="dialog" aria-modal="true">' + html + '</div>';
    o.addEventListener('click', function (e) { if (e.target === o) closeOv(); });
    document.body.appendChild(o);
    return o;
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeOv(); });

  function drawQR(i, el) {
    var url = base() + '?ghat=' + i;
    var go = function () {
      try { var q = qrcode(0, 'M'); q.addData(url); q.make(); el.innerHTML = q.createSvgTag(4, 0) + '<div>' + esc(gn(D.ghats[i])) + '</div>'; }
      catch (e) { el.innerHTML = '<div style="word-break:break-all">' + esc(url) + '</div>'; }
    };
    if (window.qrcode) return go();
    var s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
    s.onload = go; s.onerror = go; document.head.appendChild(s);
  }

  function openReport(i, qr) { if (window.gwReport) window.gwReport(i, qr); }

  function indexFromScan(txt) { return window.gwGhatIndex ? window.gwGhatIndex(txt) : -1; }
  function openScan() {
    var o = overlay('<h2>' + esc(L('Scan a ghat QR', 'घाट का QR स्कैन करें')) + '</h2><p class="note" id="gwmsg"></p><video class="gwvid" id="gwvid" playsinline muted hidden></video>' +
      '<div class="gwrow"><button class="gwbtn" id="gwx" type="button">' + esc(L('Close', 'बंद करें')) + '</button></div>');
    o.querySelector('#gwx').addEventListener('click', closeOv);
    var msg = o.querySelector('#gwmsg'), vid = o.querySelector('#gwvid');
    var fallback = L('QR scanning is not available in this browser. Scan the ghat QR with your phone\'s normal camera app, or search the ghat name above.', 'इस ब्राउज़र में QR स्कैन उपलब्ध नहीं है। घाट का QR फ़ोन के सामान्य कैमरा ऐप से स्कैन करें, या ऊपर घाट का नाम खोजें।');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.BarcodeDetector) { msg.textContent = fallback; return; }
    msg.textContent = L('Point the camera at the QR on the ghat.', 'कैमरा घाट पर लगे QR की ओर करें।');
    var det; try { det = new BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { msg.textContent = fallback; return; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }).then(function (s) {
      if (!document.getElementById('gwov')) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
      stream = s; vid.srcObject = s; vid.hidden = false; vid.play();
      var tick = function () {
        if (!stream) return;
        det.detect(vid).then(function (r) {
          if (r && r.length) {
            var i = indexFromScan(r[0].rawValue);
            if (i >= 0) { closeOv(); openReport(i); return; }
            msg.textContent = L('This QR is not a GhatWise ghat QR. Try another.', 'यह GhatWise के घाट का QR नहीं है। दूसरा आज़माएँ।');
          }
          scanTimer = setTimeout(tick, 300);
        }).catch(function () { scanTimer = setTimeout(tick, 500); });
      };
      tick();
    }).catch(function () {
      msg.textContent = L('Camera could not be opened. Allow camera access, or scan with your phone\'s normal camera app.', 'कैमरा नहीं खुल सका। कैमरा की अनुमति दें, या फ़ोन के सामान्य कैमरा ऐप से स्कैन करें।');
    });
  }

  function gotoGhat(i) { var g = D.ghats[i]; if (!g) return; openCards.add(g.id); tab = 'rank'; pendingScroll = 'card-' + i; render(); }
  function decorate() {
    document.querySelectorAll('article.card[id^="card-"]').forEach(function (a) {
      if (a.querySelector('.gwcardact')) return;
      var i = a.id.slice(5), d = document.createElement('div'); d.className = 'gwrow gwcardact';
      d.innerHTML = '<button class="gwbtn pri" type="button" data-gwrep="' + i + '">' + esc(L('Report a problem at this ghat', 'इस घाट की शिकायत करें')) + '</button><button class="gwbtn" type="button" data-gwqr="' + i + '">' + esc(L('QR for this ghat', 'इस घाट का QR')) + '</button>';
      a.appendChild(d);
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button'); if (!b) return;
    if (b.dataset.gwrep !== undefined) openReport(+b.dataset.gwrep);
    else if (b.dataset.gwqr !== undefined) openReport(+b.dataset.gwqr, true);
  });
  var _render = render;
  render = function () { _render(); inject(); decorate(); };
  inject(); decorate();
})();
