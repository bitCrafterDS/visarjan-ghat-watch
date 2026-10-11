/* GhatWise extras 3: check a new reading against CPCB class B, before/during/after trends, read the brief aloud. Loads after extras2.js. */
(function () {
  var L = function (en, hi) { return lang === 'hi' ? hi : en; };
  var css = document.createElement('style');
  css.textContent = '.okc{color:var(--ok);font-weight:650}.badc{color:var(--bad);font-weight:650}.lab h2{margin:22px 0 4px;font-size:1.1rem}.rrow{display:grid;grid-template-columns:1.2fr 1fr 1.2fr 1.3fr;gap:6px 10px;padding:8px 0;border-bottom:1px solid var(--line);font-size:.92rem}.rrow.h{color:var(--muted);font-weight:650}.lab .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.lab input[type=number]{width:100%;font:inherit;padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink)}';
  document.head.appendChild(css);
  Object.assign(UI.en, { tab_lab: 'Check and trends', lab_sub: 'Check a new reading against CPCB limits, and see how readings change before, during and after immersion.' });
  Object.assign(UI.hi, { tab_lab: 'जाँच और रुझान', lab_sub: 'नई जाँच को CPCB मानक से मिलाएँ, और देखें कि विसर्जन से पहले, दौरान और बाद में आँकड़े कैसे बदले।' });

  var P = [['Dissolved oxygen', 'DO', 'do', function (v) { return v >= 5; }, '5 mg/l ' + 'or more', '5 mg/l या अधिक'],
           ['BOD', 'BOD', 'bod', function (v) { return v <= 3; }, '3 mg/l or less', '3 mg/l या कम'],
           ['pH', 'pH', 'ph', function (v) { return v >= 6.5 && v <= 8.5; }, '6.5 to 8.5', '6.5 से 8.5']];
  var LAB = { ghat: '', do: '', bod: '', ph: '', shown: false, f: 'all' };
  var num = function (s) { var n = parseFloat(String(s).replace(',', '.')); return isNaN(n) ? null : n; };
  var fm = function (x) { return (Math.round(x * 10) / 10).toString(); };

  function hist(g, p) { var a = g.readings.filter(function (r) { return r.p === p && r.v !== null; });
    if (!a.length) return null; var v = a.map(function (r) { return r.v; });
    return { n: a.length, min: Math.min.apply(null, v), max: Math.max.apply(null, v), bad: a.filter(function (r) { return r.bad; }).length }; }

  function labResult() {
    var rows = '', entered = 0, beyond = 0, wrong = false, lines = [];
    var g = LAB.ghat !== '' && LAB.ghat !== 'x' ? D.ghats[+LAB.ghat] : null;
    P.forEach(function (p) {
      var raw = LAB[p[2]], v = raw === '' ? null : num(raw), cell, st;
      var bad = v !== null && (v < 0 || (p[2] === 'ph' && v > 14));
      if (bad) wrong = true;
      if (v === null || bad) { st = '<span class="note">' + esc(bad ? L('check the number', 'संख्या जाँचें') : L('not entered', 'दर्ज नहीं')) + '</span>'; }
      else { entered++; var ok = p[3](v); if (!ok) beyond++; st = '<span class="' + (ok ? 'okc' : 'badc') + '">' + esc(ok ? L('within limit', 'सीमा के भीतर') : L('beyond limit', 'सीमा से बाहर')) + '</span>'; lines.push(p[1] + ' ' + v + ': ' + (ok ? 'within' : 'BEYOND') + ' limit'); }
      var h = g && hist(g, p[0]);
      var hs = h ? esc(fm(h.min) + ' to ' + fm(h.max) + ' (' + h.n + ' ' + L('tests', 'जाँच') + ', ' + h.bad + ' ' + L('beyond', 'बाहर') + ')') : '<span class="note">' + esc(g ? L('no past tests', 'पुरानी जाँच नहीं') : '–') + '</span>';
      rows += '<div class="rrow"><span>' + esc(p[1]) + '</span><span>' + (v === null || bad ? '–' : esc(fm(v))) + '</span><span>' + esc(L(p[4], p[5])) + '</span><span>' + st + '</span></div><div class="note" style="padding:2px 0 6px">' + (g ? esc(L('This ghat, 2023 to 2025: ', 'इस घाट पर, 2023 से 2025: ')) + hs : '') + '</div>';
    });
    var sum = entered ? '<p><b>' + esc(beyond + ' ' + L('of', '/') + ' ' + entered + ' ' + L('entered readings are beyond the CPCB class B limit.', 'दर्ज जाँचें CPCB श्रेणी-B की सीमा से बाहर हैं।')) + '</b></p>' : '<p class="note">' + esc(L('Enter at least one reading.', 'कम से कम एक जाँच दर्ज करें।')) + '</p>';
    LAB.wa = 'GhatWise: ' + (g ? g.name_en : 'new ghat') + '\n' + lines.join('\n') + '\n(CPCB class B; relative check, not a safe/unsafe verdict)';
    return '<div class="rrow h"><span>' + esc(L('Test', 'जाँच')) + '</span><span>' + esc(L('Value', 'मान')) + '</span><span>' + esc(L('Limit', 'सीमा')) + '</span><span>' + esc(L('Result', 'नतीजा')) + '</span></div>' + rows + sum +
      (wrong ? '<p class="note">' + esc(L('One value looks impossible. Check it.', 'एक मान असंभव लगता है। जाँचें।')) + '</p>' : '') +
      '<p class="note">' + esc(L('This compares your reading with CPCB class B only. It is not a safe or unsafe verdict, says nothing about health, and total coliform is not checked.', 'यह आपकी जाँच को केवल CPCB श्रेणी-B से मिलाता है। यह सुरक्षित या असुरक्षित का फ़ैसला नहीं है, स्वास्थ्य पर कुछ नहीं कहता, और कुल कॉलिफ़ॉर्म की जाँच नहीं करता।')) + '</p>' +
      (entered ? '<div class="actions"><button class="wa" data-act="wa-lab">' + esc(L('Send result on WhatsApp', 'नतीजा WhatsApp पर भेजें')) + '</button></div>' : '');
  }

  function trend() {
    var ph = ['pre', 'during', 'after'], means = {};
    var head = '<tr><th>' + esc(L('When', 'कब')) + '</th>' + P.map(function (p) { return '<th class="num">' + esc(p[1]) + '</th>'; }).join('') + '</tr>';
    var body = ph.map(function (x) {
      return '<tr><td>' + esc(PHN[lang][x]) + '</td>' + P.map(function (p) {
        var v = []; D.ghats.forEach(function (g) { g.readings.forEach(function (r) { if (r.ph === x && r.p === p[0] && r.v !== null && (LAB.f === 'all' || r.f === LAB.f)) v.push(r.v); }); });
        if (!v.length) return '<td class="num missing">–</td>';
        var m = v.reduce(function (a, b) { return a + b; }, 0) / v.length, bd = v.filter(function (q) { return !p[3](q); }).length;
        means[p[2] + x] = m;
        return '<td class="num"><span class="' + (p[3](m) ? 'okc' : 'badc') + '">' + esc(fm(m)) + '</span><br><span class="note">' + esc(bd + '/' + v.length + ' ' + L('beyond', 'बाहर')) + '</span></td>';
      }).join('') + '</tr>';
    }).join('');
    var sentence = means.bodpre !== undefined && means.bodafter !== undefined ? '<p>' + esc(L('Average BOD was ' + fm(means.bodpre) + ' mg/l before, ' + fm(means.bodduring) + ' during and ' + fm(means.bodafter) + ' mg/l one week after immersion. Average DO was ' + fm(means.dopre) + ', ' + fm(means.doduring) + ' and ' + fm(means.doafter) + ' mg/l.', 'औसत BOD विसर्जन से पहले ' + fm(means.bodpre) + ', दौरान ' + fm(means.bodduring) + ' और एक सप्ताह बाद ' + fm(means.bodafter) + ' mg/l रहा। औसत DO ' + fm(means.dopre) + ', ' + fm(means.doduring) + ' और ' + fm(means.doafter) + ' mg/l रहा।')) + '</p>' : '';
    var seg = '<div class="seg">' + [['all', L('All festivals', 'सभी त्योहार')], ['Ganesh', FEST[lang].Ganesh], ['Durga', FEST[lang].Durga]].map(function (x) { return '<button data-act="labf" data-v="' + x[0] + '" aria-pressed="' + (LAB.f === x[0]) + '">' + esc(x[1]) + '</button>'; }).join('') + '</div>';
    return seg + sentence + '<div class="tablewrap"><table><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div><p class="note">' + esc(L('Averages of all tested readings at the 7 ghats, 2023 to 2025. Not-sampled readings are left out, never counted as clean. This shows a pattern only. It does not explain the cause.', '7 घाटों की 2023 से 2025 की सभी जाँचों का औसत। जो जाँच नहीं हुई उसे शामिल नहीं किया, "साफ़" नहीं माना। यह केवल रुझान दिखाता है, कारण नहीं बताता।')) + '</p>';
  }

  function labView() {
    var gs = '<option value="">' + esc(L('Choose a ghat (optional)', 'घाट चुनें (वैकल्पिक)')) + '</option>' + D.ghats.map(function (g, i) { return '<option value="' + i + '"' + (String(LAB.ghat) === String(i) ? ' selected' : '') + '>' + esc(g['name_' + lang]) + '</option>'; }).join('') + '<option value="x"' + (LAB.ghat === 'x' ? ' selected' : '') + '>' + esc(L('New ghat (no history)', 'नया घाट (कोई इतिहास नहीं)')) + '</option>';
    return '<div class="lab"><div class="rform"><h2 style="margin-top:0">' + esc(L('Check a new reading', 'नई जाँच परखें')) + '</h2><p class="note">' + esc(L('New ghats have no history here. Type the readings from a fresh test and see them against the CPCB limit at once.', 'नए घाटों का यहाँ कोई इतिहास नहीं। ताज़ा जाँच के आँकड़े भरें और उन्हें तुरंत CPCB सीमा से मिलाएँ।')) + '</p>' +
      '<select data-lab="ghat">' + gs + '</select><div class="grid3"><div><label class="f">DO (mg/l)</label><input type="number" step="any" inputmode="decimal" data-lab="do" value="' + esc(LAB.do) + '"></div><div><label class="f">BOD (mg/l)</label><input type="number" step="any" inputmode="decimal" data-lab="bod" value="' + esc(LAB.bod) + '"></div><div><label class="f">pH</label><input type="number" step="any" inputmode="decimal" data-lab="ph" value="' + esc(LAB.ph) + '"></div></div>' +
      '<div class="actions"><button class="primary" data-act="labcheck">' + esc(L('Check against CPCB limit', 'CPCB सीमा से मिलाएँ')) + '</button></div><div id="labres">' + (LAB.shown ? labResult() : '') + '</div></div>' +
      '<h2>' + esc(L('Before, during and one week after immersion', 'विसर्जन से पहले, दौरान और एक सप्ताह बाद')) + '</h2>' + trend() + '</div>';
  }

  var speaking = false;
  document.addEventListener('input', function (e) { var k = e.target.dataset && e.target.dataset.lab; if (k) LAB[k] = e.target.value; });
  document.addEventListener('change', function (e) { var k = e.target.dataset && e.target.dataset.lab; if (k) LAB[k] = e.target.value; });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('button'), a = b && b.dataset.act;
    if (!a) return;
    if (a === 'labcheck') { LAB.shown = true; document.getElementById('labres').innerHTML = labResult(); }
    else if (a === 'labf') { LAB.f = b.dataset.v; render(); }
    else if (a === 'wa-lab') { window.open('https://wa.me/?text=' + encodeURIComponent(LAB.wa), '_blank', 'noopener'); }
    else if (a === 'speak') {
      if (!window.speechSynthesis) { b.textContent = L('Not supported on this browser', 'इस ब्राउज़र में उपलब्ध नहीं'); return; }
      if (speaking) { speechSynthesis.cancel(); speaking = false; b.textContent = L('Read the brief aloud', 'रिपोर्ट सुनें'); return; }
      var u = new SpeechSynthesisUtterance(D.brief[lang]); u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      u.onend = function () { speaking = false; b.textContent = L('Read the brief aloud', 'रिपोर्ट सुनें'); };
      speaking = true; b.textContent = L('Stop reading', 'पढ़ना रोकें'); speechSynthesis.speak(u);
    }
  });

  var _hero = heroView, _shell = shell, _method = methodView;
  heroView = function (left) {
    var h = _hero(left);
    if (tab === 'lab') h = h.replace(esc(t('tab_method')), function () { return esc(t('tab_lab')); }).replace(esc(t('method_sub')), function () { return esc(t('lab_sub')); });
    return h;
  };
  shell = function () {
    var h = _shell().replace('<button role="tab" data-tab="brief"', function () { return '<button role="tab" data-tab="lab" aria-selected="' + (tab === 'lab') + '">' + esc(t('tab_lab')) + '</button><button role="tab" data-tab="brief"'; });
    return h.replace('<button class="ghost" data-csv="1">', function () { return '<button class="ghost" data-act="speak">' + esc(L('Read the brief aloud', 'रिपोर्ट सुनें')) + '</button><button class="ghost" data-csv="1">'; });
  };
  methodView = function () { return tab === 'lab' ? labView() : _method(); };
  render();
})();
