/* GhatWise extras 2: action plan + public report and status flow. Loads after extras.js. */
(function () {
  var L = function (en, hi) { return lang === 'hi' ? hi : en; };
  var css = document.createElement('style');
  css.textContent = [
    '.pbar{height:12px;border-radius:7px;background:var(--band);overflow:hidden;margin:8px 0}.pbar i{display:block;height:100%;background:var(--ok);transition:width .3s}',
    '.phase{margin:10px 0 2px;font-weight:650}',
    '.rform{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:18px;box-shadow:var(--shadow);max-width:78ch}',
    '.rform label.f{display:block;margin:12px 0 4px;font-weight:650;font-size:.92rem}',
    '.rform select,.rform textarea{width:100%;font:inherit;padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink)}',
    '.rform textarea{min-height:90px}',
    '.rform input[type=file]{font:inherit;max-width:100%}',
    '.thumb{max-width:150px;max-height:110px;border-radius:10px;border:1px solid var(--line);display:block;margin:6px 0}',
    '.rep{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:14px 16px;margin:12px 0;box-shadow:var(--shadow);max-width:78ch}',
    '.rep h3{margin:0 0 2px;font-size:1.05rem}',
    '.trk{display:flex;gap:6px;margin:10px 0}.trk span{flex:1;text-align:center;padding:5px 4px;border-radius:999px;font-size:.8rem;background:var(--band);color:var(--muted)}',
    '.trk span.on{background:var(--ok);color:#fff;font-weight:650}',
    '.tag{display:inline-block;font-size:.75rem;padding:1px 9px;border-radius:999px;background:var(--soft-warn);border:1px solid var(--warn);margin-left:6px}',
    '.qrgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px;margin-top:10px}',
    '.qrbox{background:#fff;color:#000;padding:10px;border-radius:12px;text-align:center;font-size:.8rem}.qrbox svg{width:100%;height:auto;display:block}'
  ].join('\n');
  document.head.appendChild(css);

  Object.assign(UI.en, { tab_plan: 'Action plan', tab_report: 'Report a ghat',
    plan_sub: 'Before, during and after Durga visarjan: what to do at each ghat, in priority order. Tasks come from the readings.',
    report_sub: 'Spotted a dirty ghat? Tell BMC. Photo of the ghat only, no people.' });
  Object.assign(UI.hi, { tab_plan: 'कार्य योजना', tab_report: 'घाट की शिकायत',
    plan_sub: 'दुर्गा विसर्जन से पहले, दौरान और बाद में हर घाट पर क्या करना है, प्राथमिकता के क्रम में। काम जाँच-आँकड़ों से बने हैं।',
    report_sub: 'घाट गंदा दिखा? नगर निगम को बताइए। केवल घाट की फ़ोटो, लोगों की नहीं।' });

  var ghatsSorted = function () { return D.ghats.slice().sort(function (a, b) { return a.scores[D.default_basis].rank - b.scores[D.default_basis].rank; }); };
  var has = function (g, w) { return g.actions.en.some(function (a) { return a.toLowerCase().indexOf(w) > -1; }); };
  var gl = function (k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  var sl = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

  function planFor(g) {
    var before = [];
    if (has(g, 'aeration')) before.push(L('Set up aeration or other oxygen support', 'एयरेशन या ऑक्सीजन बढ़ाने की व्यवस्था करें'));
    if (has(g, 'cleaning')) before.push(L('Clear organic waste and old immersion material', 'जैविक कचरा और पुरानी विसर्जन-सामग्री हटवाएँ'));
    if (has(g, 'test before')) before.push(L('Take fresh DO, BOD and pH samples (data gaps)', 'ताज़ा DO, BOD और pH नमूने लें (डेटा की कमी)'));
    before.push(L('Place waste bins and a collection team at the ghat', 'घाट पर कचरा पेटी और संग्रह दल लगाएँ'));
    return [
      [L('Before: by 19 Oct', 'पहले: 19 अक्टूबर तक'), 'before', before],
      [L('During: 20 Oct', 'दौरान: 20 अक्टूबर'), 'during', [
        L('Collect flowers, offerings and other waste in shifts', 'फूल, पूजन-सामग्री और अन्य कचरा पालियों में उठाएँ'),
        L('Sample DO, BOD and pH during immersion', 'विसर्जन के दौरान DO, BOD और pH का नमूना लें')]],
      [L('After: one week later, 27 Oct', 'बाद में: एक सप्ताह बाद, 27 अक्टूबर'), 'after', [
        L('Clean the ghat and remove all remaining waste', 'घाट की सफाई करें और बचा कचरा हटाएँ'),
        L('Sample DO, BOD and pH one week after immersion', 'विसर्जन के एक सप्ताह बाद DO, BOD और pH का नमूना लें'),
        L('Compare with the before-reading and log the result', 'पहले की जाँच से तुलना कर नतीजा दर्ज करें')]]
    ];
  }
  function planView() {
    var chk = gl('gw_chk') || {};
    var cards = ghatsSorted().map(function (g) {
      var sc = g.scores[D.default_basis], pr = sc.priority || 3, idx = D.ghats.indexOf(g);
      return '<article class="card p' + pr + '" data-plan="' + idx + '"><div class="card-top"><div class="rankno"><small>#</small>' + sc.rank + '</div><div class="card-main"><h2>' + esc(g['name_' + lang]) + '</h2><div class="body-name">' + esc(t('p' + pr)) + '</div></div></div>' +
        planFor(g).map(function (ph) {
          return '<div class="phase">' + esc(ph[0]) + '</div><ul class="todo">' + ph[2].map(function (x, i) {
            var k = 'plan|' + g.id + '|' + ph[1] + '|' + i;
            return '<li class="' + (chk[k] ? 'done' : '') + '"><label><input type="checkbox" data-chk="' + esc(k) + '"' + (chk[k] ? ' checked' : '') + '><span>' + esc(x) + '</span></label></li>';
          }).join('') + '</ul>';
        }).join('') +
        '<div class="actions"><button class="wa" data-act="wa-plan" data-i="' + idx + '">' + esc(L('Send pending tasks on WhatsApp', 'बाकी काम WhatsApp पर भेजें')) + '</button></div></article>';
    }).join('');
    return '<div class="planwrap"><p class="note">' + esc(L('Tick tasks as they are done. Ticks are saved on this device only.', 'काम पूरा होने पर टिक करें। टिक केवल इसी डिवाइस पर सहेजे जाते हैं।')) + '</p>' +
      '<div class="pbar"><i id="pfill" style="width:0"></i></div><p class="note" id="ptxt"></p>' + cards + '</div>';
  }
  function planProg() {
    var all = document.querySelectorAll('.planwrap input[data-chk]'), n = 0, i;
    if (!all.length) return;
    for (i = 0; i < all.length; i++) if (all[i].checked) n++;
    document.getElementById('pfill').style.width = (n / all.length * 100) + '%';
    document.getElementById('ptxt').textContent = n + ' / ' + all.length + ' ' + L('tasks done', 'काम पूरे');
  }

  var ISSUES = [['waste', 'Floating waste or offerings', 'तैरता कचरा या पूजन-सामग्री'], ['debris', 'Idol debris on the bank', 'किनारे पर मूर्ति का मलबा'],
    ['foam', 'Oil, foam or colour in the water', 'पानी में तेल, झाग या रंग'], ['smell', 'Bad smell', 'बदबू'], ['fish', 'Dead fish', 'मरी मछलियाँ'], ['other', 'Something else', 'कुछ और']];
  var SAMPLES = [
    { id: 'S-1', sample: true, ghat: 1, issue: 'waste', desc: 'Flowers and plastic near the steps.', ts: '2026-10-09T09:30:00+05:30', status: 'assigned' },
    { id: 'S-2', sample: true, ghat: 5, issue: 'smell', desc: 'Strong smell near the kund after evening aarti.', ts: '2026-10-10T18:10:00+05:30', status: 'received' },
    { id: 'S-3', sample: true, ghat: 6, issue: 'debris', desc: 'Idol remains on the bank.', ts: '2026-10-08T08:00:00+05:30', status: 'resolved' }];
  var FORM = {}, STAT = ['received', 'assigned', 'resolved'];
  var mine = function () { return gl('gw_reports') || []; };
  var fdt = function (ts) { try { return new Date(ts).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return ts; } };
  var sname = function (s) { return L({ received: 'Received', assigned: 'Assigned', resolved: 'Resolved' }[s], { received: 'प्राप्त', assigned: 'सौंपा गया', resolved: 'हल हुआ' }[s]); };
  var iname = function (k) { var x = ISSUES.filter(function (i) { return i[0] === k; })[0] || ISSUES[5]; return lang === 'hi' ? x[2] : x[1]; };

  function repCard(r) {
    var st = STAT.indexOf(r.status), g = D.ghats[r.ghat];
    var gname = g ? g['name_' + lang] : L('Other or new ghat', 'अन्य या नया घाट');
    var btn = '';
    if (!r.sample) {
      if (r.status === 'received') btn += '<button class="ghost" data-act="adv" data-id="' + esc(r.id) + '">' + esc(L('Officer: mark assigned (demo)', 'अधिकारी: सौंपा गया (डेमो)')) + '</button>';
      if (r.status === 'assigned') btn += '<button class="ghost" data-act="adv" data-id="' + esc(r.id) + '">' + esc(L('Officer: mark resolved (demo)', 'अधिकारी: हल हुआ (डेमो)')) + '</button>';
      if (r.status !== 'received') btn += '<label class="note">' + esc(L('After-cleanup photo: ', 'सफाई के बाद की फ़ोटो: ')) + '<input type="file" accept="image/*" data-after="' + esc(r.id) + '"></label>';
      btn += '<button class="wa" data-act="wa-rep" data-id="' + esc(r.id) + '">' + esc(L('Send to BMC officer on WhatsApp', 'नगर निगम अधिकारी को WhatsApp पर भेजें')) + '</button>';
    }
    return '<div class="rep"><h3>' + esc(gname) + (r.sample ? '<span class="tag">' + esc(L('Sample', 'नमूना')) + '</span>' : '') + '</h3><div class="note">' + esc(iname(r.issue)) + ' · ' + esc(fdt(r.ts)) + ' · ' + esc(r.id) + '</div>' +
      '<div class="trk">' + STAT.map(function (s, i) { return '<span class="' + (i <= st ? 'on' : '') + '">' + esc(sname(s)) + '</span>'; }).join('') + '</div>' +
      (r.desc ? '<p>' + esc(r.desc) + '</p>' : '') + (r.photo ? '<img class="thumb" src="' + r.photo + '" alt="">' : '') + (r.after ? '<img class="thumb" src="' + r.after + '" alt="">' : '') +
      (btn ? '<div class="actions">' + btn + '</div>' : '') + '</div>';
  }
  function reportView() {
    var all = mine().concat(SAMPLES), cnt = { received: 0, assigned: 0, resolved: 0 };
    all.forEach(function (r) { cnt[r.status]++; });
    var gsel = FORM.ghat !== undefined ? FORM.ghat : '';
    var opts = '<option value="">' + esc(L('Choose a ghat', 'घाट चुनें')) + '</option>' + D.ghats.map(function (g, i) { return '<option value="' + i + '"' + (String(gsel) === String(i) ? ' selected' : '') + '>' + esc(g['name_' + lang]) + '</option>'; }).join('') + '<option value="x"' + (gsel === 'x' ? ' selected' : '') + '>' + esc(L('Other or new ghat', 'अन्य या नया घाट')) + '</option>';
    var iss = ISSUES.map(function (i) { return '<option value="' + i[0] + '"' + (FORM.issue === i[0] ? ' selected' : '') + '>' + esc(lang === 'hi' ? i[2] : i[1]) + '</option>'; }).join('');
    var qr = '<details class="qrs"><summary>' + esc(L('QR code for each ghat (print and put up at the ghat)', 'हर घाट का QR कोड (प्रिंट करके घाट पर लगाएँ)')) + '</summary><p class="note">' + esc(L('Scanning opens this form with the ghat already selected.', 'स्कैन करने पर यही फ़ॉर्म खुलता है, घाट पहले से चुना हुआ।')) + '</p><div class="qrgrid">' +
      D.ghats.map(function (g, i) { return '<div class="qrbox" data-qr="' + i + '"></div>'; }).join('') + '</div></details>';
    return '<div class="rform"><p class="note"><b>' + esc(L('Demo:', 'डेमो:')) + '</b> ' + esc(L('reports are saved in this browser only. Real delivery to BMC needs a server. Use the WhatsApp button to send a report to an officer today.', 'शिकायतें केवल इसी ब्राउज़र में सहेजी जाती हैं। नगर निगम तक असली पहुँच के लिए सर्वर चाहिए। आज अधिकारी को भेजने के लिए WhatsApp बटन इस्तेमाल करें।')) + '</p>' +
      '<label class="f">' + esc(L('Ghat', 'घाट')) + '</label><select data-f="ghat">' + opts + '</select>' +
      '<label class="f">' + esc(L('What is the problem?', 'समस्या क्या है?')) + '</label><select data-f="issue">' + iss + '</select>' +
      '<label class="f">' + esc(L('Describe it (optional)', 'विवरण (वैकल्पिक)')) + '</label><textarea data-f="desc">' + esc(FORM.desc || '') + '</textarea>' +
      '<label class="f">' + esc(L('Photo of the ghat (no people, optional)', 'घाट की फ़ोटो (लोगों के बिना, वैकल्पिक)')) + '</label><input type="file" accept="image/*" data-photo="1">' +
      (FORM.photo ? '<img class="thumb" src="' + FORM.photo + '" alt="">' : '') +
      '<div class="actions"><button class="primary" data-act="submit">' + esc(L('Submit report', 'शिकायत भेजें')) + '</button></div><p class="note" id="rmsg"></p></div>' +
      '<h2 style="margin-top:22px">' + esc(L('Report status', 'शिकायतों की स्थिति')) + '</h2><p class="note">' + esc(L('Received', 'प्राप्त')) + ' ' + cnt.received + ' · ' + esc(L('Assigned', 'सौंपे गए')) + ' ' + cnt.assigned + ' · ' + esc(L('Resolved', 'हल हुए')) + ' ' + cnt.resolved + '</p>' +
      mine().slice().reverse().concat(SAMPLES).map(repCard).join('') + qr;
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
  function waText(msg) { window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener'); }
  function drawQR() {
    var base = location.origin + location.pathname;
    var go = function () {
      document.querySelectorAll('.qrbox').forEach(function (b) {
        var i = b.dataset.qr, url = base + '?ghat=' + i;
        try { var q = qrcode(0, 'M'); q.addData(url); q.make(); b.innerHTML = q.createSvgTag(4, 0) + '<div>' + esc(D.ghats[i]['name_' + lang]) + '</div>'; }
        catch (e) { b.innerHTML = '<div>' + esc(D.ghats[i]['name_' + lang]) + '</div><div style="word-break:break-all">' + esc(url) + '</div>'; }
      });
    };
    if (window.qrcode) return go();
    var s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
    s.onload = go; s.onerror = go; document.head.appendChild(s);
  }

  document.addEventListener('input', function (e) { var f = e.target.dataset && e.target.dataset.f; if (f) FORM[f] = e.target.value; });
  document.addEventListener('change', function (e) {
    var el = e.target, d = el.dataset || {};
    if (d.f) FORM[d.f] = el.value;
    if (d.chk) planProg();
    if (d.photo && el.files[0]) shrink(el.files[0], function (u) { FORM.photo = u; render(); });
    if (d.after && el.files[0]) shrink(el.files[0], function (u) { var a = mine(); a.forEach(function (r) { if (r.id === d.after) r.after = u; }); sl('gw_reports', a); render(); });
  });
  document.addEventListener('toggle', function (e) { if (e.target.classList && e.target.classList.contains('qrs') && e.target.open) drawQR(); }, true);
  document.addEventListener('click', function (e) {
    var b = e.target.closest('button'), a = b && b.dataset.act;
    if (!a) return;
    if (a === 'submit') {
      var msg = document.getElementById('rmsg');
      if (FORM.ghat === undefined || FORM.ghat === '') { msg.textContent = L('Please choose a ghat.', 'कृपया घाट चुनें।'); return; }
      var all = mine(), r = { id: 'R-' + (all.length + 1), ghat: FORM.ghat === 'x' ? -1 : +FORM.ghat, issue: FORM.issue || 'waste', desc: FORM.desc || '', photo: FORM.photo || '', ts: new Date().toISOString(), status: 'received' };
      all.push(r);
      if (!sl('gw_reports', all)) { r.photo = ''; sl('gw_reports', all); }
      FORM = {}; render();
    } else if (a === 'adv') {
      var arr = mine(); arr.forEach(function (r) { if (r.id === b.dataset.id) r.status = STAT[Math.min(2, STAT.indexOf(r.status) + 1)]; }); sl('gw_reports', arr); render();
    } else if (a === 'wa-rep') {
      var rr = mine().filter(function (r) { return r.id === b.dataset.id; })[0], g = D.ghats[rr.ghat];
      waText('GhatWise: ' + (g ? g.name_en : 'Other or new ghat') + '\n' + ISSUES.filter(function (i) { return i[0] === rr.issue; })[0][1] + '\n' + (rr.desc || '') + '\n' + fdt(rr.ts) + '\n' + location.origin + location.pathname);
    } else if (a === 'wa-plan') {
      var g2 = D.ghats[+b.dataset.i], chk = gl('gw_chk') || {}, lines = [];
      planFor(g2).forEach(function (ph) { ph[2].forEach(function (x, i) { if (!chk['plan|' + g2.id + '|' + ph[1] + '|' + i]) lines.push('- ' + x); }); });
      waText('GhatWise: ' + g2['name_' + lang] + '\n' + L('Pending tasks:', 'बाकी काम:') + '\n' + lines.join('\n'));
    }
  });

  var _hero = heroView, _shell = shell, _method = methodView, _render = render;
  heroView = function (left) {
    var h = _hero(left);
    if (tab === 'plan' || tab === 'report') h = h.replace(esc(t('tab_method')), function () { return esc(t('tab_' + tab)); }).replace(esc(t('method_sub')), function () { return esc(t(tab + '_sub')); });
    return h;
  };
  shell = function () {
    return _shell().replace('<button role="tab" data-tab="brief"', function () {
      return '<button role="tab" data-tab="plan" aria-selected="' + (tab === 'plan') + '">' + esc(t('tab_plan')) + '</button><button role="tab" data-tab="report" aria-selected="' + (tab === 'report') + '">' + esc(t('tab_report')) + '</button><button role="tab" data-tab="brief"'; });
  };
  methodView = function () { return tab === 'plan' ? planView() : tab === 'report' ? reportView() : _method(); };
  render = function () { _render(); planProg(); };
  var q = /[?&]ghat=(\d+)/.exec(location.search);
  if (q && D.ghats[+q[1]]) { tab = 'report'; FORM.ghat = q[1]; }
  render();
})();
