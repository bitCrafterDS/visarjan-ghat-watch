/* GhatWise add-on: "Report a Ghat Issue" tab. One form for both routes: opened from a ghat QR (?ghat=<id>) or from the tab. Load before gw-search.js. */
(function () {
  var L = function (en, hi) { return lang === 'hi' ? hi : en; };
  var gn = function (g) { return g['name_' + lang] || g.name_en; };
  var gl = function (k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  var sl = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  var base = function () { return location.origin + location.pathname; };

  var PROBLEMS = [['litter', 'Litter on the ghat', 'घाट पर कचरा'], ['flowers', 'Flower and offering waste', 'फूल और पूजन-सामग्री का कचरा'],
    ['plastic', 'Plastic waste', 'प्लास्टिक कचरा'], ['dirty', 'Dirty ghat or steps', 'गंदा घाट या सीढ़ियाँ'],
    ['debris', 'Idol debris on the bank', 'किनारे पर मूर्ति का मलबा'], ['water', 'Foam, oil, colour or smell in the water', 'पानी में झाग, तेल, रंग या बदबू'],
    ['other', 'Something else', 'कुछ और']];
  var WHEN = [['before', 'Before the festival', 'त्योहार से पहले'], ['during', 'During the festival', 'त्योहार के दौरान'], ['after', 'After the festival', 'त्योहार के बाद']];
  var STAT = ['received', 'assigned', 'resolved'];
  var SAMPLES = [
    { id: 'GW-SAMPLE-1', sample: true, ghat: 1, issue: 'flowers', when: 'during', desc: 'Flowers and plastic near the steps.', ts: '2026-10-09T09:30:00+05:30', status: 'assigned' },
    { id: 'GW-SAMPLE-2', sample: true, ghat: 5, issue: 'water', when: 'after', desc: 'Strong smell near the kund after evening aarti.', ts: '2026-10-10T18:10:00+05:30', status: 'received' },
    { id: 'GW-SAMPLE-3', sample: true, ghat: 6, issue: 'debris', when: 'after', desc: 'Idol remains on the bank.', ts: '2026-10-08T08:00:00+05:30', status: 'resolved' }];
  var FORM = {}, LAST = null, SCROLL = null, SHOWQR = false;
  var mine = function () { return gl('gw_reports') || []; };
  var lab = function (arr, k) { var x = arr.filter(function (a) { return a[0] === k; })[0] || arr[arr.length - 1]; return lang === 'hi' ? x[2] : x[1]; };
  var sname = function (s) { return L({ received: 'Received', assigned: 'Assigned', resolved: 'Resolved' }[s], { received: 'प्राप्त', assigned: 'सौंपा गया', resolved: 'हल हुआ' }[s]); };
  var fdt = function (ts) { try { return new Date(ts).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return ts; } };

  window.gwGhatIndex = function (txt) {
    var m = /[?&]ghat=([^&#\s]+)/.exec(String(txt)); if (!m) return -1;
    var v = decodeURIComponent(m[1]), i = -1;
    D.ghats.forEach(function (g, k) { if (String(g.id) === v) i = k; });
    if (i < 0 && /^\d+$/.test(v) && D.ghats[+v]) i = +v;
    return i;
  };
  window.gwReport = function (i, qr) {
    if (D.ghats[i]) FORM.ghat = String(i);
    SHOWQR = !!qr; tab = 'report'; render(); window.scrollTo(0, 0);
  };

  var css = document.createElement('style');
  css.textContent = [
    '.gwr{max-width:78ch}.gwr h2{margin:0 0 6px}.gwr .note{color:var(--muted);font-size:.9rem;margin:8px 0}',
    '.gwform,.gwrep,.gwok{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:18px;box-shadow:var(--shadow);margin:12px 0}',
    '.gwform label.f{display:block;margin:14px 0 4px;font-weight:650;font-size:.92rem}',
    '.gwform select,.gwform textarea{width:100%;font:inherit;padding:11px 12px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink)}',
    '.gwform textarea{min-height:90px}.gwform input[type=file]{font:inherit;max-width:100%}',
    '.gwwhen{display:flex;gap:8px;flex-wrap:wrap}.gwwhen label{display:flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:999px;padding:8px 14px;background:var(--bg);cursor:pointer}',
    '.gwthumb{max-width:150px;max-height:110px;border-radius:10px;border:1px solid var(--line);display:block;margin:6px 0}',
    '.gwb{border:1px solid var(--line);background:var(--card);color:var(--ink);font:inherit;padding:11px 18px;border-radius:999px;cursor:pointer}',
    '.gwb.pri{background:linear-gradient(135deg,var(--accent),var(--accent2));color:var(--accent-ink);border-color:transparent;font-weight:650}',
    '.gwacts{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}',
    '.gwok{border-left:6px solid var(--ok)}.gwid{font-size:1.3rem;font-weight:700;letter-spacing:.03em}',
    '.gwtrk{display:flex;gap:6px;margin:10px 0}.gwtrk span{flex:1;text-align:center;padding:5px 4px;border-radius:999px;font-size:.8rem;background:var(--band);color:var(--muted)}',
    '.gwtrk span.on{background:var(--ok);color:#fff;font-weight:650}',
    '.gwtag{display:inline-block;font-size:.75rem;padding:1px 9px;border-radius:999px;border:1px solid var(--warn);margin-left:6px}',
    '.gwrep h3{margin:0 0 2px;font-size:1.05rem}.gwrep.hl{outline:3px solid var(--accent)}',
    '.gwqrgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px;margin-top:10px}',
    '.gwqrbox{background:#fff;color:#000;padding:10px;border-radius:12px;text-align:center;font-size:.8rem}.gwqrbox svg{width:100%;height:auto;display:block}'
  ].join('\n');
  document.head.appendChild(css);

  function repCard(r) {
    var st = STAT.indexOf(r.status), g = D.ghats[r.ghat], btn = '';
    if (!r.sample) {
      if (r.status === 'received') btn += '<button class="gwb" data-gw="adv" data-id="' + esc(r.id) + '">' + esc(L('Officer: mark assigned (demo)', 'अधिकारी: सौंपा गया (डेमो)')) + '</button>';
      if (r.status === 'assigned') btn += '<button class="gwb" data-gw="adv" data-id="' + esc(r.id) + '">' + esc(L('Officer: mark resolved (demo)', 'अधिकारी: हल हुआ (डेमो)')) + '</button>';
      btn += '<button class="gwb" data-gw="wa" data-id="' + esc(r.id) + '">' + esc(L('Send to BMC officer on WhatsApp', 'नगर निगम अधिकारी को WhatsApp पर भेजें')) + '</button>';
    }
    var after = !r.sample && r.status !== 'received' ? '<p class="note">' + esc(L('After-cleanup photo of the ghat: ', 'सफाई के बाद घाट की फ़ोटो: ')) + '<input type="file" accept="image/*" data-gwafter="' + esc(r.id) + '"></p>' : '';
    return '<div class="gwrep" id="rep-' + esc(r.id) + '"><h3>' + esc(g ? gn(g) : '') + (r.sample ? '<span class="gwtag">' + esc(L('Sample', 'नमूना')) + '</span>' : '') + '</h3>' +
      '<div class="note">' + esc(lab(PROBLEMS, r.issue) + ' · ' + lab(WHEN, r.when) + ' · ' + fdt(r.ts)) + ' · ' + esc(r.id) + '</div>' +
      '<div class="gwtrk">' + STAT.map(function (s, k) { return '<span class="' + (k <= st ? 'on' : '') + '">' + esc(sname(s)) + '</span>'; }).join('') + '</div>' +
      (r.desc ? '<p>' + esc(r.desc) + '</p>' : '') + (r.photo ? '<img class="gwthumb" src="' + r.photo + '" alt="">' : '') + (r.after ? '<img class="gwthumb" src="' + r.after + '" alt="">' : '') +
      after + (btn ? '<div class="gwacts">' + btn + '</div>' : '') + '</div>';
  }

  function reportView() {
    var gsel = FORM.ghat !== undefined ? FORM.ghat : '';
    var opts = '<option value="">' + esc(L('Choose a ghat', 'घाट चुनें')) + '</option>' + D.ghats.map(function (g, i) { return '<option value="' + i + '"' + (String(gsel) === String(i) ? ' selected' : '') + '>' + esc(gn(g)) + '</option>'; }).join('');
    var iss = '<option value="">' + esc(L('Choose the problem', 'समस्या चुनें')) + '</option>' + PROBLEMS.map(function (p) { return '<option value="' + p[0] + '"' + (FORM.issue === p[0] ? ' selected' : '') + '>' + esc(lang === 'hi' ? p[2] : p[1]) + '</option>'; }).join('');
    var when = WHEN.map(function (w) { return '<label><input type="radio" name="gwwhen" data-f="when" value="' + w[0] + '"' + (FORM.when === w[0] ? ' checked' : '') + '> ' + esc(lang === 'hi' ? w[2] : w[1]) + '</label>'; }).join('');
    var all = mine().slice().reverse().concat(SAMPLES), cnt = { received: 0, assigned: 0, resolved: 0 };
    all.forEach(function (r) { cnt[r.status]++; });
    var ok = '';
    if (LAST) ok = '<div class="gwok"><b>' + esc(L('Report saved on this device.', 'शिकायत इस डिवाइस पर सहेजी गई।')) + '</b><div class="note">' + esc(L('Your report ID', 'आपकी शिकायत का संदर्भ क्रमांक')) + '</div><div class="gwid">' + esc(LAST) + '</div>' +
      '<p class="note">' + esc(L('It has not reached BMC yet: this page has no server. Press the WhatsApp button below the status card to send it.', 'यह अभी नगर निगम तक नहीं पहुँची: इस पेज का कोई सर्वर नहीं है। भेजने के लिए नीचे स्थिति कार्ड का WhatsApp बटन दबाएँ।')) + '</p>' +
      '<div class="gwacts"><button class="gwb pri" data-gw="track" data-id="' + esc(LAST) + '">' + esc(L('Follow this report', 'इस शिकायत की स्थिति देखें')) + '</button></div></div>';
    var qr = '<details class="gwqrs"' + (SHOWQR ? ' open' : '') + '><summary>' + esc(L('QR code for each ghat (print and put up at the ghat)', 'हर घाट का QR कोड (प्रिंट करके घाट पर लगाएँ)')) + '</summary>' +
      '<p class="note">' + esc(L('Scanning a QR opens this form with that ghat already chosen. It does not submit anything and does not open the camera by itself.', 'QR स्कैन करने पर यही फ़ॉर्म खुलता है, घाट पहले से चुना हुआ। इससे कुछ अपने-आप जमा नहीं होता और कैमरा खुद नहीं खुलता।')) + '</p>' +
      '<div class="gwqrgrid">' + D.ghats.map(function (g, i) { return '<div class="gwqrbox" data-qr="' + i + '"></div>'; }).join('') + '</div></details>';
    return '<div class="gwr"><h2>' + esc(L('Report a Ghat Issue', 'घाट की समस्या की शिकायत')) + '</h2>' +
      '<p class="note">' + esc(L('Seen a problem at a ghat? Tell BMC. No QR scan and no location access needed. Photo of the ghat or the problem only, never of a person.', 'किसी घाट पर समस्या दिखी? नगर निगम को बताइए। QR स्कैन या लोकेशन की ज़रूरत नहीं। केवल घाट या समस्या की फ़ोटो, किसी व्यक्ति की नहीं।')) + '</p>' + ok +
      '<div class="gwform"><label class="f" style="margin-top:0">' + esc(L('Ghat', 'घाट')) + '</label><select data-f="ghat">' + opts + '</select>' +
      '<label class="f">' + esc(L('What is the problem?', 'समस्या क्या है?')) + '</label><select data-f="issue">' + iss + '</select>' +
      '<label class="f">' + esc(L('When is this?', 'यह कब की बात है?')) + '</label><div class="gwwhen">' + when + '</div>' +
      '<label class="f">' + esc(L('Short description (optional)', 'छोटा विवरण (वैकल्पिक)')) + '</label><textarea data-f="desc">' + esc(FORM.desc || '') + '</textarea>' +
      '<label class="f">' + esc(L('Photo of the ghat or the problem (optional, no people)', 'घाट या समस्या की फ़ोटो (वैकल्पिक, लोगों के बिना)')) + '</label><input type="file" accept="image/*" data-gwphoto="1">' +
      (FORM.photo ? '<img class="gwthumb" src="' + FORM.photo + '" alt="">' : '') +
      '<div class="gwacts"><button class="gwb pri" data-gw="submit">' + esc(L('Submit report', 'शिकायत जमा करें')) + '</button></div><p class="note" id="gwmsg" role="alert"></p></div>' +
      '<h2 style="margin-top:22px">' + esc(L('Report status', 'शिकायतों की स्थिति')) + '</h2><p class="note">' + esc(L('Received', 'प्राप्त')) + ' ' + cnt.received + ' · ' + esc(L('Assigned', 'सौंपे गए')) + ' ' + cnt.assigned + ' · ' + esc(L('Resolved', 'हल हुए')) + ' ' + cnt.resolved +
      ' · ' + esc(L('Reports and statuses are demo data kept only in this browser. Real delivery to BMC needs a server.', 'शिकायतें और स्थिति डेमो हैं, केवल इसी ब्राउज़र में हैं। नगर निगम तक असली पहुँच के लिए सर्वर चाहिए।')) + '</p>' +
      all.map(repCard).join('') + qr + '</div>';
  }

  function shrink(file, cb) {
    var rd = new FileReader();
    rd.onload = function () {
      var im = new Image();
      im.onload = function () {
        var s = Math.min(1, 480 / Math.max(im.width, im.height)), c = document.createElement('canvas');
        c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', 0.6));
      };
      im.src = rd.result;
    };
    rd.readAsDataURL(file);
  }
  function drawQR() {
    var go = function () {
      document.querySelectorAll('.gwqrbox').forEach(function (b) {
        var i = +b.dataset.qr, url = base() + '?ghat=' + encodeURIComponent(D.ghats[i].id);
        try { var q = qrcode(0, 'M'); q.addData(url); q.make(); b.innerHTML = q.createSvgTag(4, 0) + '<div>' + esc(gn(D.ghats[i])) + '</div>'; }
        catch (e) { b.innerHTML = '<div>' + esc(gn(D.ghats[i])) + '</div><div style="word-break:break-all">' + esc(url) + '</div>'; }
      });
    };
    if (window.qrcode) return go();
    var s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
    s.onload = go; s.onerror = go; document.head.appendChild(s);
  }
  function waText(msg) { window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener'); }
  function newId(i) { return 'GW-' + (i + 1) + '-' + Date.now().toString(36).slice(-5).toUpperCase(); }

  document.addEventListener('input', function (e) { var d = e.target.dataset; if (d && d.f) FORM[d.f] = e.target.value; });
  document.addEventListener('change', function (e) {
    var el = e.target, d = el.dataset || {};
    if (d.f) FORM[d.f] = el.value;
    if (d.gwphoto && el.files[0]) shrink(el.files[0], function (u) { FORM.photo = u; render(); });
    if (d.gwafter && el.files[0]) shrink(el.files[0], function (u) { var a = mine(); a.forEach(function (r) { if (r.id === d.gwafter) r.after = u; }); sl('gw_reports', a); render(); });
  });
  document.addEventListener('toggle', function (e) { if (e.target.classList && e.target.classList.contains('gwqrs') && e.target.open) drawQR(); }, true);
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button'), a = b && b.dataset.gw;
    if (!a) return;
    if (a === 'submit') {
      var msg = document.getElementById('gwmsg');
      if (FORM.ghat === undefined || FORM.ghat === '') { msg.textContent = L('Please choose a ghat.', 'कृपया घाट चुनें।'); return; }
      if (!FORM.issue) { msg.textContent = L('Please choose the problem.', 'कृपया समस्या चुनें।'); return; }
      if (!FORM.when) { msg.textContent = L('Please choose before, during or after the festival.', 'कृपया त्योहार से पहले, दौरान या बाद चुनें।'); return; }
      var all = mine(), r = { id: newId(+FORM.ghat), ghat: +FORM.ghat, issue: FORM.issue, when: FORM.when, desc: FORM.desc || '', photo: FORM.photo || '', ts: new Date().toISOString(), status: 'received' };
      all.push(r);
      if (!sl('gw_reports', all)) { r.photo = ''; sl('gw_reports', all); }
      LAST = r.id; FORM = {}; render(); window.scrollTo(0, 0);
    } else if (a === 'track') { SCROLL = b.dataset.id; render(); }
    else if (a === 'adv') { var arr = mine(); arr.forEach(function (r) { if (r.id === b.dataset.id) r.status = STAT[Math.min(2, STAT.indexOf(r.status) + 1)]; }); sl('gw_reports', arr); render(); }
    else if (a === 'wa') {
      var rr = mine().filter(function (r) { return r.id === b.dataset.id; })[0]; if (!rr) return;
      waText('GhatWise report ' + rr.id + '\nGhat: ' + D.ghats[rr.ghat].name_en + '\nProblem: ' + lab(PROBLEMS, rr.issue).replace(/^/, '') + '\nWhen: ' + rr.when + '\n' + (rr.desc || '') + '\n' + base());
    }
  });

  var _shell = shell, _method = methodView, _render = render;
  shell = function () {
    return _shell().replace('<button role="tab" data-tab="brief"', function () {
      return '<button role="tab" data-tab="report" aria-selected="' + (tab === 'report') + '">' + esc(L('Report a ghat issue', 'घाट की शिकायत')) + '</button><button role="tab" data-tab="brief"'; });
  };
  methodView = function () { return tab === 'report' ? reportView() : _method(); };
  render = function () {
    _render();
    if (tab !== 'report') return;
    var d = document.querySelector('.gwqrs'); if (d && d.open) drawQR();
    if (SCROLL) { var el = document.getElementById('rep-' + SCROLL); SCROLL = null; if (el) { el.classList.add('hl'); el.scrollIntoView({ block: 'center' }); } }
  };
  var q = window.gwGhatIndex(location.search);
  if (q >= 0) { FORM.ghat = String(q); tab = 'report'; }
  render();
})();
