/* GhatWise extras. Loads after the main page script. */
(function () {
  var css = document.createElement('style');
  css.textContent = [
    'body{font-size:17px;line-height:1.6}',
    '.gwlogo{width:40px;height:40px;border-radius:50%;display:block;flex:none;background:#faf0e0;box-shadow:0 0 0 2px rgba(255,255,255,.35)}',
    'footer.site .gwlogo{width:48px;height:48px}',
    '.start{display:block;width:100%;max-width:440px;margin-top:18px;padding:12px 16px;text-align:left;font:inherit;color:var(--ink);background:var(--card);border:0;border-left:6px solid var(--p1);border-radius:14px;cursor:pointer;box-shadow:var(--shadow)}',
    '.start span{display:block;font-size:.85rem;color:var(--muted)}',
    '.start b{display:block;font-size:1.25rem;line-height:1.3}',
    '.start em{display:block;font-style:normal;font-size:.85rem;color:var(--muted);margin-top:2px}',
    'ul.todo li::before{display:none}ul.todo li{padding-left:0}',
    'ul.todo label{display:flex;gap:10px;align-items:flex-start;cursor:pointer;padding:6px 0}',
    'ul.todo input{flex:none;width:22px;height:22px;margin:1px 0 0;accent-color:var(--accent);cursor:pointer}',
    'ul.todo li.done span{text-decoration:line-through;color:var(--muted)}',
    '.prog{font-weight:500;margin-left:6px}',
    'main.qa{padding-top:22px}',
    '.qa details{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:12px 16px;margin:10px 0;box-shadow:var(--shadow);max-width:78ch}',
    '.qa .ans{padding-top:6px}'
  ].join('\n');
  document.head.appendChild(css);
  document.title = 'GhatWise | Visarjan Ghat Watch, Bhopal';
  var ic = document.querySelector('link[rel="icon"]');
  if (ic) { ic.type = 'image/png'; ic.href = 'favicon-64.png'; }

  UI.en.title = 'GhatWise'; UI.hi.title = 'GhatWise';
  Object.assign(UI.en, { tab_qa: 'Questions', qa_sub: 'Ready answers to the questions an officer is likely to ask.',
    qa_note: 'These answers are built by code straight from the readings on this page, not by live AI. Open a ghat card to see the report page behind each number.',
    start_k: 'Go here first', start_s: 'tap to open its checklist', done: 'done' });
  Object.assign(UI.hi, { tab_qa: 'सवाल-जवाब', qa_sub: 'अधिकारी के संभावित सवालों के तैयार जवाब।',
    qa_note: 'ये जवाब कोड ने सीधे इस पेज के जाँच-आँकड़ों से बनाए हैं, लाइव AI से नहीं। हर संख्या का रिपोर्ट-पेज घाट के कार्ड में देखें।',
    start_k: 'पहले यहाँ जाएँ', start_s: 'चेकलिस्ट खोलने के लिए टैप करें', done: 'पूरा' });
  try { if (!localStorage.getItem('gw_lang')) lang = 'hi'; } catch (e) { lang = 'hi'; }
  var CHK = {};
  try { CHK = JSON.parse(localStorage.getItem('gw_chk') || '{}') || {}; } catch (e) {}
  var LOGO = '<img class="gwlogo" src="logo-96.png" alt="GhatWise" width="40" height="40">';

  function startBtn() {
    const g = [...D.ghats].sort((a, b) => a.scores[basis].rank - b.scores[basis].rank)[0];
    const sc = g.scores[basis];
    return `<button class="start" data-jump="g-${D.ghats.indexOf(g)}"><span>${esc(t('start_k'))}</span><b>${esc(g['name_' + lang])}</b><em>${sc.score === null ? '' : Math.round(sc.score) + '/100 · '}${esc(t('start_s'))}</em></button>`;
  }
  function updateProg() {
    document.querySelectorAll('[data-prog]').forEach(p => {
      const boxes = [...document.querySelectorAll('ul.todo[data-card="' + p.dataset.prog + '"] input')];
      const n = boxes.filter(b => b.checked).length;
      p.textContent = boxes.length ? '(' + n + '/' + boxes.length + ' ' + t('done') + ')' : '';
    });
  }
  document.addEventListener('change', e => {
    const c = e.target;
    if (!c.dataset || !c.dataset.chk) return;
    if (c.checked) CHK[c.dataset.chk] = 1; else delete CHK[c.dataset.chk];
    try { localStorage.setItem('gw_chk', JSON.stringify(CHK)); } catch (_) {}
    c.closest('li').classList.toggle('done', c.checked);
    updateProg();
  });
  function qaItems() {
    const hi = lang === 'hi', B = D.default_basis;
    const L = [...D.ghats].sort((a, b) => a.scores[B].rank - b.scores[B].rank);
    const nm = g => g['name_' + lang];
    const has = (g, w) => g.actions.en.some(a => a.toLowerCase().includes(w));
    const ul = a => a.length ? '<ul>' + a.map(g => '<li>' + esc(nm(g)) + '</li>').join('') + '</ul>' : '<p>' + esc(hi ? 'कोई नहीं।' : 'None.') + '</p>';
    const top = L[0], last = L[L.length - 1], ts = top.scores[B], ls = last.scores[B];
    const wd = top.m.worst_do, wb = top.m.worst_bod;
    const ev = (w, unit) => esc(fmt(w.value) + ' mg/l') + ' (' + esc(FEST[lang][w.festival] + ' ' + w.year) + ', ' + pageLink(w.year, w.page) + ')';
    const miss = L.filter(g => g.missing_events.length);
    return [
      [hi ? nm(top) + ' पहले नंबर पर क्यों है?' : 'Why is ' + nm(top) + ' number 1?',
        '<p>' + esc(nm(top) + (hi ? ' का अंक ' : ' scores ') + Math.round(ts.score) + '/100.') + '</p><ul>' + top.reasons[lang].map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
        '<p>' + esc(hi ? 'सबसे कम DO: ' : 'Lowest DO: ') + ev(wd) + '. ' + esc(hi ? 'सबसे ऊँचा BOD: ' : 'Highest BOD: ') + ev(wb) + '.</p>'],
      [hi ? 'किन घाटों पर विसर्जन से पहले एयरेशन चाहिए?' : 'Which ghats need aeration before immersion?',
        '<p>' + esc(hi ? 'जहाँ DO बार-बार 5 mg/l से कम रहा:' : 'Where DO was often below 5 mg/l:') + '</p>' + ul(L.filter(g => has(g, 'aeration')))],
      [hi ? 'किन घाटों पर अतिरिक्त सफाई चाहिए?' : 'Which ghats need extra cleaning?',
        '<p>' + esc(hi ? 'जहाँ BOD बार-बार 3 mg/l से ऊपर रहा:' : 'Where BOD was repeatedly above 3 mg/l:') + '</p>' + ul(L.filter(g => has(g, 'cleaning')))],
      [hi ? 'पहले नई जाँच कहाँ करानी चाहिए?' : 'Where should fresh tests be done first?',
        '<p>' + esc(hi ? 'जिन घाटों के आँकड़ों में कमी है, 20 अक्टूबर से पहले वहाँ जाँच कराएँ:' : 'These ghats have gaps in the data. Test them before 20 October:') + '</p>' + ul(L.filter(g => has(g, 'test before')))],
      [hi ? 'क्या कोई घाट सुरक्षित है?' : 'Is any ghat safe?',
        '<p>' + esc(hi ? 'यह टूल सुरक्षित या असुरक्षित का फ़ैसला नहीं देता, केवल सापेक्ष क्रम देता है। सबसे नीचे वाला घाट, ' + nm(last) + ', भी ' + ls.tested + ' में से ' + ls.failed + ' जाँच में किसी मानक से बाहर रहा।' : 'This tool gives a relative ranking, not a safe or unsafe verdict. Even the lowest-ranked ghat, ' + nm(last) + ', went beyond a limit in ' + ls.failed + ' of ' + ls.tested + ' tests.') + '</p>'],
      [hi ? 'डेटा में खाली जगह का क्या मतलब है?' : 'What does missing data mean?',
        '<p>' + esc(hi ? 'खाली का मतलब जाँच नहीं हुई, साफ़ नहीं। इन घाटों की पूरी तालिका रिपोर्ट में नहीं है:' : 'A blank means not sampled, never clean. These ghats have a whole festival table missing from the report:') + '</p>' + ul(miss)],
      [hi ? 'नए घाटों का क्या?' : 'What about the new ghats?',
        '<p>' + esc(hi ? 'नए घाटों का कोई जाँच-डेटा यहाँ नहीं है, इसलिए टूल उन्हें क्रम में नहीं रख सकता। उपयोग से पहले आधारभूत जाँच कराएँ। कौन-से घाट काम में आएँगे, यह नगर निगम तय करे।' : 'New ghats have no readings here, so the tool cannot rank them. Take a baseline test before use. Which ghats are used is for BMC to confirm.') + '</p>']
    ];
  }
  function qaView() {
    return '<div class="qa"><p class="note">' + esc(t('qa_note')) + '</p>' +
      qaItems().map(x => '<details><summary>' + esc(x[0]) + '</summary><div class="ans">' + x[1] + '</div></details>').join('') + '</div>';
  }

  var _card = card, _hero = heroView, _shell = shell, _method = methodView, _render = render;
  card = function (g) {
    var h = _card(g), idx = D.ghats.indexOf(g);
    var ul = '<ul class="todo" data-card="' + idx + '">' + g.actions[lang].map(function (x, i) {
      var k = g.id + '|' + i, on = CHK[k];
      return '<li class="' + (on ? 'done' : '') + '"><label><input type="checkbox" data-chk="' + esc(k) + '"' + (on ? ' checked' : '') + '><span>' + esc(x) + '</span></label></li>';
    }).join('') + '</ul>';
    h = h.replace(/<ul class="todo">[\s\S]*?<\/ul>/, function () { return ul; });
    h = h.replace('<div class="sec">' + esc(t('todo')) + '</div>', function () {
      return '<div class="sec">' + esc(t('todo')) + '<span class="note prog" data-prog="' + idx + '"></span></div>'; });
    return h;
  };
  heroView = function (left) {
    var h = _hero(left);
    if (tab === 'rank') h = h.replace('<div class="stats">', function () { return startBtn() + '<div class="stats">'; });
    else if (tab === 'qa') h = h.replace(esc(t('tab_method')), function () { return esc(t('tab_qa')); })
                                .replace(esc(t('method_sub')), function () { return esc(t('qa_sub')); });
    return h;
  };
  shell = function () {
    var h = _shell();
    h = h.replace('<button role="tab" data-tab="method"', function () {
      return '<button role="tab" data-tab="qa" aria-selected="' + (tab === 'qa') + '">' + esc(t('tab_qa')) + '</button><button role="tab" data-tab="method"'; });
    return h.replace(/<span class="mark">[\s\S]*?<\/svg><\/span>/g, function () { return LOGO; });
  };
  methodView = function () { return tab === 'qa' ? qaView() : _method(); };
  render = function () { _render(); updateProg(); };
  render();
})();
