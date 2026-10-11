/* GhatWise add-on: slow, calm water waves at the bottom of the page, behind the content. Decorative only. */
(function () {
  if (document.getElementById('gwwater')) return;
  var wave = 'M0 60 C150 20 350 100 600 60 C850 20 1050 100 1200 60 L1200 120 L0 120 Z';
  var layer = function (cls, op, y) {
    return '<svg class="gww ' + cls + '" viewBox="0 0 2400 120" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
      '<g fill="var(--accent)" fill-opacity="' + op + '"><path d="' + wave + '" transform="translate(0,' + y + ')"/><path d="' + wave + '" transform="translate(1200,' + y + ')"/></g></svg>';
  };
  var css = document.createElement('style');
  css.textContent = [
    '#gwwater{position:fixed;left:0;right:0;bottom:0;height:30vh;min-height:140px;max-height:300px;overflow:hidden;pointer-events:none;z-index:-1}',
    '#gwwater .gww{position:absolute;left:0;bottom:0;width:200%;height:100%;will-change:transform;animation:gwdrift 60s linear infinite}',
    '#gwwater .w2{height:82%;animation-duration:42s;animation-direction:reverse}',
    '#gwwater .w3{height:64%;animation-duration:28s}',
    '#gwwater .rip{position:absolute;bottom:6%;width:90px;height:90px;border-radius:50%;border:2px solid var(--accent);opacity:0;animation:gwrip 9s ease-out infinite}',
    '@keyframes gwdrift{from{transform:translateX(0)}to{transform:translateX(-50%)}}',
    '@keyframes gwrip{0%{transform:scale(.2);opacity:.28}100%{transform:scale(2.4);opacity:0}}',
    '@media (prefers-reduced-motion:reduce){#gwwater .gww,#gwwater .rip{animation:none}#gwwater .rip{display:none}}',
    '@media print{#gwwater{display:none}}'
  ].join('\n');
  document.head.appendChild(css);
  var d = document.createElement('div'); d.id = 'gwwater'; d.setAttribute('aria-hidden', 'true');
  d.innerHTML = layer('w1', '.10', 0) + layer('w2', '.12', 8) + layer('w3', '.14', 16) +
    '<span class="rip" style="left:18%"></span><span class="rip" style="left:62%;animation-delay:4s"></span>';
  document.body.appendChild(d);
})();
