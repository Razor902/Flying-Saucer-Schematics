/* Engine Schematics — hotspots, zoom/pan, detail panel.
   COMPONENTS must be defined before this script loads. */
(function () {
  'use strict';

  var stage = document.getElementById('stage');
  var canvas = document.getElementById('canvas');
  var list = document.getElementById('component-list');
  var panel = document.getElementById('detail');
  var panelBody = document.getElementById('detail-body');
  var zoom = 1, panX = 0, panY = 0;
  var MIN_Z = 1, MAX_Z = 4;

  function apply() {
    canvas.style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + zoom + ')';
  }

  function clampPan() {
    var r = stage.getBoundingClientRect();
    var maxX = 0, maxY = 0;
    var minX = r.width - r.width * zoom, minY = r.height - r.height * zoom;
    panX = Math.min(maxX, Math.max(minX, panX));
    panY = Math.min(maxY, Math.max(minY, panY));
  }

  function setZoom(z, cx, cy) {
    var r = stage.getBoundingClientRect();
    cx = (cx === undefined) ? r.width / 2 : cx;
    cy = (cy === undefined) ? r.height / 2 : cy;
    var nz = Math.min(MAX_Z, Math.max(MIN_Z, z));
    var k = nz / zoom;
    panX = cx - (cx - panX) * k;
    panY = cy - (cy - panY) * k;
    zoom = nz;
    clampPan();
    apply();
  }

  function reset() { zoom = 1; panX = 0; panY = 0; apply(); }

  document.getElementById('zoom-in').addEventListener('click', function () { setZoom(zoom * 1.3); });
  document.getElementById('zoom-out').addEventListener('click', function () { setZoom(zoom / 1.3); });
  document.getElementById('zoom-reset').addEventListener('click', reset);

  stage.addEventListener('wheel', function (e) {
    e.preventDefault();
    var r = stage.getBoundingClientRect();
    var f = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    setZoom(zoom * f, e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });

  // Drag to pan
  var dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
  stage.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.hotspot')) return;
    dragging = true; sx = e.clientX; sy = e.clientY; ox = panX; oy = panY;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    panX = ox + (e.clientX - sx);
    panY = oy + (e.clientY - sy);
    clampPan();
    apply();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
    stage.addEventListener(ev, function () { dragging = false; });
  });

  // Build hotspots + list
  var hotspots = {};
  COMPONENTS.forEach(function (c) {
    var b = document.createElement('button');
    b.className = 'hotspot';
    b.style.left = c.x + '%';
    b.style.top = c.y + '%';
    b.setAttribute('aria-label', c.name);
    var tip = document.createElement('span');
    tip.className = 'tip';
    tip.textContent = c.name;
    b.appendChild(tip);
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      openDetail(c.id);
    });
    canvas.appendChild(b);
    hotspots[c.id] = b;

    var li = document.createElement('button');
    li.dataset.id = c.id;
    li.innerHTML = '<span></span>' + (c.latin ? '<span class="latin"></span>' : '');
    li.querySelector('span').textContent = c.name;
    if (c.latin) li.querySelector('.latin').textContent = c.latin;
    li.addEventListener('click', function () { openDetail(c.id, true); });
    list.appendChild(li);
  });

  function openDetail(id, flash) {
    var c = COMPONENTS.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    var html = '<h2>' + escapeHtml(c.name) + '</h2>';
    if (c.latin) html += '<p class="latin">' + escapeHtml(c.latin) + '</p>';
    html += '<ul>' + c.specs.map(function (s) { return '<li>' + escapeHtml(s) + '</li>'; }).join('') + '</ul>';
    panelBody.innerHTML = html;
    panel.classList.add('open');

    document.querySelectorAll('.hotspot.active').forEach(function (h) { h.classList.remove('active'); });
    document.querySelectorAll('#component-list button.active').forEach(function (h) { h.classList.remove('active'); });
    hotspots[id].classList.add('active');
    var lb = list.querySelector('button[data-id="' + id + '"]');
    if (lb) lb.classList.add('active');
    if (flash) {
      var h = hotspots[id];
      h.classList.remove('flash');
      void h.offsetWidth;
      h.classList.add('flash');
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  document.getElementById('detail-close').addEventListener('click', function () {
    panel.classList.remove('open');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') panel.classList.remove('open');
  });

  apply();
})();
