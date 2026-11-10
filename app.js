/* VBCF Muscu — application joueuses.
   Écrit en JavaScript ES5 (var, function, XMLHttpRequest) pour rester compatible avec tous les iPhone.
   Le contenu (exercices, postes, options) est dans programme.json : on peut le modifier sans toucher à ce fichier. */
(function () {
  'use strict';

  var STORE = 'vbcfMuscu.v1';
  var DATA = null;
  var S = load();            // { poste, history:[{d,poste,opt}], hideInstall, session }
  var timer = null;          // intervalle du chrono de repos
  var audio = null;          // contexte audio (bips de fin de repos)
  var wake = null;           // verrou d'écran

  var POSTE_UI = {
    centraux: { c: '--c-cen', ic: 'block', court: 'Contre, déplacement latéral' },
    attaque:  { c: '--c-att', ic: 'attack', court: 'Détente, puissance de frappe' },
    passeur:  { c: '--c-pas', ic: 'set', court: 'Poignets, gainage, réactivité' },
    libero:   { c: '--c-lib', ic: 'libero', court: 'Démarrage, posture basse' }
  };
  var ICONS = {
    warm: '<path d="M12 2.8c.6 3.4 5 5.2 5 10.2a5 5 0 0 1-10 0c0-2.6 1.3-4 2.6-5 .1 2 .9 3.1 2 3.6-.5-3.2.3-6 .4-8.8z"/><path d="M12 20a2 2 0 0 1-2-2c0-1.2 1-2 2-3 1 1 2 1.8 2 3a2 2 0 0 1-2 2z"/>',
    block: '<path d="M3 15.5h18M3 19.5h18M7 15.5v4M12 15.5v4M17 15.5v4"/><path d="M8.5 13V8M15.5 13V8"/><path d="M6.6 8.4C6.4 5.6 7.2 3.5 8.5 3.5s2.1 2.1 1.9 4.9M13.6 8.4c-.2-2.8.6-4.9 1.9-4.9s2.1 2.1 1.9 4.9"/>',
    attack: '<circle cx="15.5" cy="8.5" r="5.5"/><path d="M12 5.3c2.2.6 4 3.2 4.3 8.6M16.8 3.2c-.2 2.4-2.6 4.6-6.6 5"/><path d="M2.5 13.5l6-2.4M3.5 18l6.5-3.2M7 21.5l5.2-3.4"/>',
    set: '<circle cx="12" cy="6.5" r="4.2"/><path d="M4.5 21c.4-3.8 1.8-6.3 4.2-7.6M19.5 21c-.4-3.8-1.8-6.3-4.2-7.6"/><path d="M8 12.6l.9-1.9M10 12.3l.2-1.6M16 12.6l-.9-1.9M14 12.3l-.2-1.6"/>',
    libero: '<path d="M12 2.8l7.5 3v5.4c0 4.8-3.2 8.2-7.5 10-4.3-1.8-7.5-5.2-7.5-10V5.8z"/><path d="M10 8.5v6.5h4.2"/>',
    plus: '<path d="M10.5 7v10M5.5 12h10"/><path d="M18.5 2.8l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z"/>',
    home: '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.2-4 4.3-6 8-6s6.8 2 8 6"/>',
    share: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>'
  };
  var SVG_CHEV = '<svg class="chev" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>';
  var SVG_BACK = '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>';
  var SVG_PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
  var SVG_X = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var SVG_CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var BADGE = { conseillee: 'Conseillée', possible: 'Possible', moins_utile: 'Moins utile' };
  var MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  var JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

  /* ---------- utilitaires ---------- */
  function load() {
    try { var v = JSON.parse(localStorage.getItem(STORE)); if (v && typeof v === 'object') { v.history = v.history || []; return v; } } catch (e) {}
    return { poste: null, history: [] };
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function $(id) { return document.getElementById(id); }
  function icon(name, c, extra) { return '<span class="ic' + (extra ? ' ' + extra : '') + '"' + (c ? ' style="--c:var(' + c + ')"' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + '</svg></span>'; }
  function poste(id) { for (var i = 0; i < DATA.postes.length; i++) if (DATA.postes[i].id === id) return DATA.postes[i]; return null; }
  function option(n) { for (var i = 0; i < DATA.options.length; i++) if (DATA.options[i].numero === n) return DATA.options[i]; return null; }
  function ex(id) { return DATA.exercices[id]; }
  function fmtDate(t) { var d = new Date(t); return JOURS[d.getDay()] + ' ' + d.getDate() + ' ' + MOIS[d.getMonth()]; }
  function mmss(s) { s = Math.max(0, Math.ceil(s)); var m = Math.floor(s / 60), r = s % 60; return m + ':' + (r < 10 ? '0' : '') + r; }
  function get(url, ok, ko) {
    var x = new XMLHttpRequest();
    x.open('GET', url, true);
    x.onreadystatechange = function () { if (x.readyState === 4) { if (x.status >= 200 && x.status < 300 || (x.status === 0 && x.responseText)) ok(x.responseText); else if (ko) ko(x.status); } };
    x.send();
  }
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }

  /* ---------- démarrage ---------- */
  function start() {
    get('programme.json?v=' + APP_VERSION, function (txt) {
      try { DATA = JSON.parse(txt); } catch (e) { fail(); return; }
      window.addEventListener('hashchange', render);
      render();
    }, fail);
    if ('serviceWorker' in navigator) { try { navigator.serviceWorker.register('sw.js'); } catch (e) {} }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { checkUpdate(); if (S.session) tick(); } });
    setTimeout(checkUpdate, 4000);
  }
  function fail() { $('app').innerHTML = '<div class="loading"><img src="icons/logo.png" alt="" width="96" height="96"><p>Impossible de charger le programme.<br>Vérifie ta connexion puis rouvre l\'appli.</p></div>'; }

  // Compare la version installée à celle en ligne (version.js) et propose de recharger.
  function checkUpdate() {
    if (!navigator.onLine) return;
    get('version.js?t=' + Date.now(), function (txt) {
      var m = /APP_VERSION\s*=\s*'([^']+)'/.exec(txt);
      if (m && m[1] !== APP_VERSION) banner('Nouvelle version ' + esc(m[1]) + ' disponible.', 'Mettre à jour', function () { location.reload(); });
    });
  }
  function banner(text, btn, fn) {
    var b = $('banner');
    b.innerHTML = '<span>' + text + '</span><button id="bnOk">' + btn + '</button><button class="cl" id="bnX" aria-label="Fermer">✕</button>';
    b.hidden = false;
    $('bnOk').onclick = fn;
    $('bnX').onclick = function () { b.hidden = true; };
  }

  /* ---------- routeur ---------- */
  function render() {
    stopTimer();
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/');
    var app = $('app');
    app.className = 'app';
    if (!S.poste || parts[0] === 'poste') { tabs(null); app.innerHTML = viewChoose(); bindChoose(); return; }
    if (parts[0] === 'seance') { tabs(null); app.className = 'app full'; viewSession(); window.scrollTo(0, 0); return; }
    if (parts[0] === 'ex') { tabs(null); app.innerHTML = viewExercise(parts[1], decodeURIComponent(parts[2] || ''), decodeURIComponent(parts[3] || '')); bindBack(); window.scrollTo(0, 0); return; }
    if (parts[0] === 'options') { tabs('options'); app.innerHTML = viewOptions(); bindRows(); window.scrollTo(0, 0); return; }
    if (parts[0] === 'option') { tabs('options'); app.innerHTML = viewOption(parseInt(parts[1], 10)); bindRows(); bindBack(); window.scrollTo(0, 0); return; }
    if (parts[0] === 'profil') { tabs('profil'); app.innerHTML = viewProfile(); bindProfile(); window.scrollTo(0, 0); return; }
    tabs('home'); app.innerHTML = viewHome(); bindHome();
  }

  function tabs(active) {
    var t = $('tabs');
    if (!active) { t.hidden = true; return; }
    var items = [['home', '', 'Ma séance'], ['plus', 'options', 'Options'], ['user', 'profil', 'Profil']];
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var on = (items[i][1] || 'home') === active;
      html += '<button data-h="#/' + items[i][1] + '" class="' + (on ? 'on' : '') + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[items[i][0]] + '</svg>' + items[i][2] + '</button>';
    }
    t.innerHTML = html; t.hidden = false;
    var bs = t.getElementsByTagName('button');
    for (var j = 0; j < bs.length; j++) bs[j].onclick = function () { go(this.getAttribute('data-h')); };
  }

  function header(sub) {
    var p = poste(S.poste), ui = POSTE_UI[S.poste];
    return '<header class="top"><img class="logo" src="icons/logo.png" alt="VBCF" width="46" height="46">' +
      '<div class="ttl"><b>VBCF Muscu</b><span>' + esc(sub || 'Cœur de Flandre · ' + DATA.equipe) + '</span></div>' +
      (p ? '<button class="pill" data-h="#/poste" id="hdPoste">' + icon(ui.ic, ui.c) + esc(p.nom.split(' ')[0]) + '</button>' : '') + '</header>';
  }
  function backBar(label) { return '<header class="top"><button class="back" id="back">' + SVG_BACK + esc(label || 'Retour') + '</button></header>'; }
  function bindBack() { var b = $('back'); if (b) b.onclick = function () { if (history.length > 1) history.back(); else go('#/'); }; }

  /* ---------- lignes d'exercice ---------- */
  function exRow(ref, code) {
    var e = ex(ref.id);
    return '<button class="row" data-ex="' + ref.id + '" data-dose="' + esc(ref.dosage.join('|')) + '" data-code="' + esc(code) + '">' +
      '<span class="th">' + e.schema + '</span>' +
      '<span class="tx"><span class="code">' + esc(code) + (ref.variante ? ' · ' + esc(ref.variante) : '') + '</span><b>' + esc(e.nom) + '</b><span class="dz">' + esc(ref.dosage.join(' · ')) + '</span></span>' +
      SVG_CHEV + '</button>';
  }
  function bindRows() {
    var rs = document.querySelectorAll('[data-ex]');
    for (var i = 0; i < rs.length; i++) rs[i].onclick = function () {
      go('#/ex/' + this.getAttribute('data-ex') + '/' + encodeURIComponent(this.getAttribute('data-dose')) + '/' + encodeURIComponent(this.getAttribute('data-code')));
    };
    var hs = document.querySelectorAll('[data-h]');
    for (var j = 0; j < hs.length; j++) if (!hs[j].onclick) hs[j].onclick = function () { go(this.getAttribute('data-h')); };
    var os = document.querySelectorAll('[data-opt]');
    for (var k = 0; k < os.length; k++) os[k].onclick = function () { go('#/option/' + this.getAttribute('data-opt')); };
  }

  /* ---------- écran : choix du poste ---------- */
  function viewChoose() {
    var html = '<div class="choose">' + (S.poste ? backBar('Retour') : '<header class="top"><img class="logo" src="icons/logo.png" alt="VBCF" width="46" height="46"><div class="ttl"><b>VBCF Muscu</b><span>Volley Ball Cœur de Flandre</span></div></header>') +
      '<h1>' + (S.poste ? 'Change de poste' : 'Bienvenue !') + '</h1><p>Choisis ton poste : l\'appli te montrera ton programme. Tu pourras le changer quand tu veux dans Profil.</p><div class="postes">';
    for (var i = 0; i < DATA.postes.length; i++) {
      var p = DATA.postes[i], ui = POSTE_UI[p.id];
      html += '<button class="poste' + (S.poste === p.id ? ' sel' : '') + '" style="--c:var(' + ui.c + ')" data-p="' + p.id + '">' + icon(ui.ic, ui.c, 'lg') + '<b>' + esc(p.nom) + '</b><span class="d">' + esc(ui.court) + '</span></button>';
    }
    return html + '</div></div>';
  }
  function bindChoose() {
    bindBack();
    var bs = document.querySelectorAll('[data-p]');
    for (var i = 0; i < bs.length; i++) bs[i].onclick = function () { S.poste = this.getAttribute('data-p'); save(); go('#/'); };
  }

  /* ---------- écran : ma séance ---------- */
  function monthCount() {
    var n = 0, now = new Date();
    for (var i = 0; i < S.history.length; i++) { var d = new Date(S.history[i].d); if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) n++; }
    return n;
  }
  function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent); }
  function standalone() { return window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches); }

  function viewHome() {
    var p = poste(S.poste), ui = POSTE_UI[S.poste];
    var last = S.history.length ? S.history[S.history.length - 1] : null;
    var html = header();
    if (isIOS() && !standalone() && !S.hideInstall) {
      html += '<div class="install"><svg viewBox="0 0 24 24">' + ICONS.share + '</svg><span><b>Installe l\'appli :</b> touche <b>Partager</b> en bas de Safari, puis <b>« Sur l\'écran d\'accueil »</b>.</span><button id="hideInstall" aria-label="Masquer">✕</button></div>';
    }
    if (S.session) {
      html += '<div class="install"><svg viewBox="0 0 24 24">' + ICONS.home + '</svg><span><b>Séance en cours.</b> Reprends là où tu t\'étais arrêtée.</span></div>';
    }
    html += '<section class="hero" style="--c:var(' + ui.c + ')"><div class="k">Ta séance · ' + esc(DATA.equipe) + '</div><h1>' + esc(p.nom) + '</h1><p>' + esc(p.objectif) + '</p>' +
      '<div class="stats"><span>≈ 35 min</span><span>Ce mois : ' + monthCount() + ' séance' + (monthCount() > 1 ? 's' : '') + '</span>' + (last ? '<span>Dernière : ' + fmtDate(last.d) + '</span>' : '') + '</div>' +
      '<button class="cta" id="start">' + SVG_PLAY + (S.session ? 'Reprendre la séance' : 'Démarrer la séance') + '</button></section>';

    html += '<section class="sec"><div class="sh">' + icon('warm', '--c-warm') + '<h2>Échauffement</h2><span class="meta">' + esc(DATA.echauffement.duree) + '<br>tout le monde</span></div><div class="list">';
    for (var i = 0; i < DATA.echauffement.exercices.length; i++) html += exRow(DATA.echauffement.exercices[i], 'Échauffement ' + (i + 1));
    html += '</div></section>';

    for (var s = 0; s < p.supersets.length; s++) {
      var ss = p.supersets[s];
      html += '<section class="sec"><div class="sh"><span class="let">' + ss.lettre + '</span><h2>' + esc(ss.titre) + '</h2><span class="meta">' + ss.tours + ' tours<br>repos ' + mmss(ss.repos_sec) + '</span></div><div class="list">';
      for (var e = 0; e < ss.exercices.length; e++) {
        if (e > 0) html += '<div class="plus">+ enchaîner</div>';
        html += exRow(ss.exercices[e], ss.lettre + (e + 1));
      }
      html += '</div></section>';
    }

    html += '<section class="sec"><div class="sh">' + icon('plus', '--c-opt', 'y') + '<h2>Pour compléter</h2><span class="meta">facultatif<br>+ 8–10 min</span></div><p class="note">À faire après ta séance, jamais à la place.</p><div class="opts">' + optionCards(true) + '</div></section>';
    return html;
  }
  function optionCards(onlyReco) {
    var html = '', m = DATA.matrice_options[S.poste];
    var order = [];
    for (var i = 0; i < DATA.options.length; i++) order.push(i);
    order.sort(function (a, b) { var r = { conseillee: 0, possible: 1, moins_utile: 2 }; return r[m[a]] - r[m[b]]; });
    for (var k = 0; k < order.length; k++) {
      var o = DATA.options[order[k]], lvl = m[order[k]];
      if (onlyReco && lvl !== 'conseillee') continue;
      html += '<button class="opt" data-opt="' + o.numero + '"><span class="n">' + o.numero + '</span><span><b>' + esc(o.nom) + '</b><span class="d">' + esc(o.but) + '</span></span><span class="badge ' + lvl + '">' + BADGE[lvl] + '</span></button>';
    }
    return html;
  }
  function bindHome() {
    bindRows();
    var hi = $('hideInstall'); if (hi) hi.onclick = function () { S.hideInstall = true; save(); render(); };
    $('start').onclick = function () {
      unlockAudio();
      if (!S.session) { S.session = { i: 0, opt: null, t0: Date.now() }; save(); }
      go('#/seance');
    };
  }

  /* ---------- écran : fiche exercice ---------- */
  function exDetail(e, dose) {
    var cues = '';
    for (var i = 0; i < e.consignes.length; i++) cues += '<li><span>' + esc(e.consignes[i]) + '</span></li>';
    var d = '';
    for (var j = 0; j < dose.length; j++) d += '<span>' + esc(dose[j]) + '</span>';
    return '<div class="fig">' + e.schema + '</div>' +
      '<div class="legend"><span><i style="background:var(--hl)"></i>Muscles ciblés</span><span><i style="background:var(--blue)"></i>Mouvement</span><span>1 = départ · 2 = arrivée</span></div>' +
      '<div class="detail"><div class="dose">' + d + '</div><p class="why">' + esc(e.objectif) + '</p><ol class="cues">' + cues + '</ol>' +
      '<p class="avoid"><b>À éviter :</b> ' + esc(e.a_eviter) + '</p>' +
      '<a class="video" href="' + esc(e.video) + '" target="_blank" rel="noopener">' + SVG_PLAY + 'Voir une vidéo de démonstration</a></div>';
  }
  function viewExercise(id, dose, code) {
    var e = ex(id);
    if (!e) return backBar() + '<p>Exercice introuvable.</p>';
    return backBar('Retour') + '<div class="code" style="font:700 12px/1 var(--mono);color:var(--muted);margin-bottom:6px">' + esc(code) + '</div><h1 style="margin:0 0 12px;font:800 32px/1 var(--display);text-transform:uppercase">' + esc(e.nom) + '</h1>' + exDetail(e, dose ? dose.split('|') : []);
  }

  /* ---------- écran : options ---------- */
  function viewOptions() {
    var html = header('Options de travail');
    html += '<section class="sec" style="margin-top:6px"><div class="sh">' + icon('plus', '--c-opt', 'y') + '<h2>Options au choix</h2></div><p class="note">Pour celles qui veulent compléter leur séance. Classées pour ton poste.</p><div class="opts">' + optionCards(false) + '</div></section>';
    html += '<section class="sec"><div class="sh"><h2>Les règles</h2></div><ul class="rules">';
    for (var i = 0; i < DATA.regles_options.length; i++) html += '<li>' + esc(DATA.regles_options[i]) + '</li>';
    html += '</ul></section>';
    html += '<section class="sec"><div class="sh"><h2>Tous les postes</h2></div><div class="tblw"><table class="tbl"><thead><tr><th>Poste</th>';
    for (var o = 0; o < DATA.options.length; o++) html += '<th>' + DATA.options[o].numero + '. ' + esc(DATA.options[o].nom) + '</th>';
    html += '</tr></thead><tbody>';
    for (var p = 0; p < DATA.postes.length; p++) {
      var po = DATA.postes[p], m = DATA.matrice_options[po.id];
      html += '<tr' + (po.id === S.poste ? ' class="me"' : '') + '><td>' + esc(po.nom) + '</td>';
      for (var k = 0; k < m.length; k++) html += '<td><span class="badge ' + m[k] + '">' + BADGE[m[k]] + '</span></td>';
      html += '</tr>';
    }
    return html + '</tbody></table></div></section>';
  }
  function viewOption(n) {
    var o = option(n);
    if (!o) return backBar() + '<p>Option introuvable.</p>';
    var lvl = DATA.matrice_options[S.poste][DATA.options.indexOf(o)];
    var html = backBar('Options') + '<section class="hero" style="--c:var(--c-opt);color:#14203b"><div class="k">Option ' + o.numero + ' · ' + esc(o.duree) + '</div><h1>' + esc(o.nom) + '</h1><p>' + esc(o.but) + '</p><div class="stats"><span>' + o.tours + ' tours</span><span>repos ' + mmss(o.repos_sec) + '</span><span>Pour toi : ' + BADGE[lvl] + '</span></div></section>';
    html += '<section class="sec"><div class="list">';
    for (var i = 0; i < o.exercices.length; i++) { if (i > 0) html += '<div class="plus">+ enchaîner</div>'; html += exRow(o.exercices[i], 'O' + o.numero + '.' + (i + 1)); }
    return html + '</div></section>';
  }

  /* ---------- mode séance guidé ---------- */
  function buildSteps(optNum) {
    var p = poste(S.poste), steps = [], i, t, e;
    var w = DATA.echauffement.exercices;
    for (i = 0; i < w.length; i++) steps.push({ k: 'ex', ref: w[i], blk: 'Échauffement', code: 'Échauffement ' + (i + 1) + '/' + w.length });
    function addBlock(list, title, letter, tours, rest, last) {
      for (t = 1; t <= tours; t++) {
        for (e = 0; e < list.length; e++) steps.push({ k: 'ex', ref: list[e], blk: title, code: letter + (e + 1), tour: t, tours: tours });
        if (!(last && t === tours)) steps.push({ k: 'rest', sec: rest, blk: title, tour: t, tours: tours });
      }
    }
    for (i = 0; i < p.supersets.length; i++) {
      var ss = p.supersets[i];
      addBlock(ss.exercices, 'Superset ' + ss.lettre + ' · ' + ss.titre, ss.lettre, ss.tours, ss.repos_sec, i === p.supersets.length - 1);
    }
    steps.push({ k: 'end' });
    if (optNum) {
      var o = option(optNum);
      addBlock(o.exercices, 'Option ' + o.numero + ' · ' + o.nom, 'O' + o.numero + '.', o.tours, o.repos_sec, true);
      steps.push({ k: 'final' });
    }
    return steps;
  }

  function viewSession() {
    if (!S.session) { go('#/'); return; }
    var steps = buildSteps(S.session.opt);
    if (S.session.i >= steps.length) S.session.i = steps.length - 1;
    var st = steps[S.session.i];
    var total = steps.length, pos = S.session.i;
    var html = '<div class="go-top"><button class="x" id="quit" aria-label="Quitter la séance">' + SVG_X + '</button><div class="bar"><i style="width:' + Math.round(pos / (total - 1) * 100) + '%"></i></div><span class="cnt">' + Math.round(pos / (total - 1) * 100) + ' %</span></div>';

    if (st.k === 'ex') {
      var e = ex(st.ref.id), next = steps[pos + 1];
      var tourHtml = '';
      if (st.tours) { tourHtml = '<span class="tour">'; for (var t = 1; t <= st.tours; t++) tourHtml += '<i class="' + (t < st.tour ? 'ok' : (t === st.tour ? 'on' : '')) + '"></i>'; tourHtml += '</span><span style="font:700 12px/1 var(--mono);color:var(--muted)">Tour ' + st.tour + '/' + st.tours + '</span>'; }
      html += '<div class="stage"><span class="blk">' + esc(st.blk) + '</span>' + tourHtml + '</div>';
      html += '<div class="go-ex"><div class="fig">' + e.schema + '</div><div style="font:700 12px/1 var(--mono);color:var(--muted);margin-top:12px">' + esc(st.code) + (st.ref.variante ? ' · ' + esc(st.ref.variante) : '') + '</div><h1>' + esc(e.nom) + '</h1><div class="dose">';
      for (var d = 0; d < st.ref.dosage.length; d++) html += '<span>' + esc(st.ref.dosage[d]) + '</span>';
      html += '</div><ol class="cues">';
      for (var c = 0; c < e.consignes.length; c++) html += '<li><span>' + esc(e.consignes[c]) + '</span></li>';
      html += '</ol><p class="avoid" style="margin-top:12px"><b>À éviter :</b> ' + esc(e.a_eviter) + '</p><button class="link" id="more">Voir la fiche complète et la vidéo</button></div>';
      var nextLabel = next.k === 'rest' ? 'Fait · repos' : (next.k === 'ex' ? 'Fait · suivant' : 'Fait · terminer');
      html += '<div class="go-actions">' + (pos > 0 ? '<button class="prev" id="prev" aria-label="Étape précédente">' + SVG_BACK + '</button>' : '<span></span>') + '<button class="cta" id="next">' + SVG_CHECK.replace('<svg', '<svg style="fill:none;stroke:currentColor;stroke-width:3"') + nextLabel + '</button></div>';
      $('app').innerHTML = html;
      $('more').onclick = function () { go('#/ex/' + st.ref.id + '/' + encodeURIComponent(st.ref.dosage.join('|')) + '/' + encodeURIComponent(st.code)); };
    } else if (st.k === 'rest') {
      var nx = steps[pos + 1], ne = nx && nx.k === 'ex' ? ex(nx.ref.id) : null;
      if (!S.session.restEnd || S.session.restAt !== pos) { S.session.restEnd = Date.now() + st.sec * 1000; S.session.restAt = pos; save(); }
      var label = (nx && nx.tour === 1 && st.tour === st.tours) ? 'Bloc terminé · repos' : 'Repos';
      html += '<div class="rest"><div class="lbl">' + label + '</div>' +
        '<div class="ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="none" stroke="var(--line)" stroke-width="8"/><circle id="arc" cx="50" cy="50" r="44" fill="none" stroke="var(--yellow)" stroke-width="8" stroke-linecap="round" stroke-dasharray="276.5" stroke-dashoffset="0"/></svg><div class="t" id="clock">' + mmss(st.sec) + '</div></div>' +
        '<div class="adj"><button id="m15">− 15 s</button><button id="p15">+ 15 s</button></div>' +
        (ne ? '<div class="next"><small>Ensuite · ' + esc(nx.code) + (nx.tour ? ' · tour ' + nx.tour + '/' + nx.tours : '') + '</small><b>' + esc(ne.nom) + '</b></div>' : '') + '</div>' +
        '<div class="go-actions"><button class="prev" id="prev" aria-label="Étape précédente">' + SVG_BACK + '</button><button class="cta yellow" id="next">Passer le repos</button></div>';
      $('app').innerHTML = html;
      $('m15').onclick = function () { S.session.restEnd -= 15000; save(); tick(); };
      $('p15').onclick = function () { S.session.restEnd += 15000; save(); tick(); };
      tick();
      timer = setInterval(tick, 250);
    } else if (st.k === 'end') {
      html += '<div class="done"><div class="big">' + SVG_CHECK + '</div><h1>Séance terminée !</h1><p>Bravo. Tu veux ajouter une option pour compléter ?</p><div class="opts">' + optionCards(true) + '</div>' +
        '<button class="cta" id="finish">Terminer ma séance</button></div>';
      $('app').innerHTML = html;
      var os = document.querySelectorAll('[data-opt]');
      for (var k = 0; k < os.length; k++) os[k].onclick = function () { S.session.opt = parseInt(this.getAttribute('data-opt'), 10); S.session.i++; save(); render(); };
      $('finish').onclick = finish;
    } else {
      var oo = option(S.session.opt);
      html += '<div class="done"><div class="big">' + SVG_CHECK + '</div><h1>Option terminée !</h1><p>Séance complète + option ' + oo.numero + ' (' + esc(oo.nom) + '). Bien joué.</p><button class="cta" id="finish">Enregistrer et terminer</button></div>';
      $('app').innerHTML = html;
      $('finish').onclick = finish;
    }
    var n = $('next'); if (n) n.onclick = function () { S.session.i++; S.session.restEnd = null; save(); render(); window.scrollTo(0, 0); };
    var pv = $('prev'); if (pv) pv.onclick = function () { S.session.i = Math.max(0, S.session.i - 1); S.session.restEnd = null; save(); render(); window.scrollTo(0, 0); };
    $('quit').onclick = askQuit;
    keepAwake();
  }

  function tick() {
    var cl = $('clock'); if (!cl || !S.session || !S.session.restEnd) return;
    var steps = buildSteps(S.session.opt), st = steps[S.session.i];
    var left = (S.session.restEnd - Date.now()) / 1000;
    cl.textContent = mmss(left);
    var arc = $('arc'); if (arc && st && st.sec) arc.setAttribute('stroke-dashoffset', String(276.5 * (1 - Math.max(0, left) / st.sec)));
    if (left <= 0) {
      stopTimer(); beep();
      if (navigator.vibrate) { try { navigator.vibrate([200, 100, 200]); } catch (e) {} }
      S.session.i++; S.session.restEnd = null; save();
      setTimeout(render, 600);
    }
  }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

  function finish() {
    S.history.push({ d: Date.now(), poste: S.poste, opt: S.session ? S.session.opt : null });
    if (S.history.length > 200) S.history = S.history.slice(-200);
    S.session = null; save(); releaseWake();
    go('#/');
  }
  function askQuit() {
    var m = $('modal');
    m.innerHTML = '<div class="sheet"><h3>Quitter la séance ?</h3><p>Tu pourras la reprendre plus tard depuis l\'accueil.</p>' +
      '<button class="cta" id="qPause">Mettre en pause</button><button class="cta alt" id="qSave">J\'ai fini, enregistrer</button><button class="cta alt" id="qDrop" style="color:var(--red)">Abandonner sans enregistrer</button><button class="link" id="qNo">Continuer la séance</button></div>';
    m.hidden = false;
    function close() { m.hidden = true; m.innerHTML = ''; }
    m.onclick = function (ev) { if (ev.target === m) close(); };
    $('qNo').onclick = close;
    $('qPause').onclick = function () { close(); releaseWake(); go('#/'); };
    $('qSave').onclick = function () { close(); finish(); };
    $('qDrop').onclick = function () { close(); S.session = null; save(); releaseWake(); go('#/'); };
  }

  /* son et écran allumé */
  function unlockAudio() {
    try { var C = window.AudioContext || window.webkitAudioContext; if (C && !audio) audio = new C(); if (audio && audio.state === 'suspended') audio.resume(); } catch (e) {}
  }
  function beep() {
    if (!audio) return;
    try {
      var now = audio.currentTime;
      for (var i = 0; i < 3; i++) {
        var o = audio.createOscillator(), g = audio.createGain();
        o.frequency.value = i === 2 ? 1175 : 880; o.connect(g); g.connect(audio.destination);
        g.gain.setValueAtTime(0.0001, now + i * 0.25); g.gain.exponentialRampToValueAtTime(0.4, now + i * 0.25 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.25 + 0.18);
        o.start(now + i * 0.25); o.stop(now + i * 0.25 + 0.2);
      }
    } catch (e) {}
  }
  function keepAwake() {
    if (wake || !navigator.wakeLock) return;
    try { navigator.wakeLock.request('screen').then(function (w) { wake = w; w.addEventListener('release', function () { wake = null; }); }, function () {}); } catch (e) {}
  }
  function releaseWake() { if (wake) { try { wake.release(); } catch (e) {} wake = null; } }
  document.addEventListener('touchstart', unlockAudio, { passive: true });

  /* ---------- écran : profil ---------- */
  function viewProfile() {
    var p = poste(S.poste), ui = POSTE_UI[S.poste];
    var html = header('Mon profil');
    html += '<div class="card"><h3>Mon poste</h3><button class="opt" data-h="#/poste" style="grid-template-columns:52px 1fr auto">' + icon(ui.ic, ui.c, 'lg') + '<span><b>' + esc(p.nom) + '</b><span class="d">' + esc(ui.court) + '</span></span><span class="badge possible">Changer</span></button></div>';
    html += '<div class="card" style="margin-top:12px"><h3>Mes séances</h3>';
    if (!S.history.length) html += '<p class="note" style="margin:0">Aucune séance enregistrée pour l\'instant. Lance ta première séance depuis l\'accueil.</p>';
    else {
      html += '<p class="note" style="margin:0">' + S.history.length + ' séance' + (S.history.length > 1 ? 's' : '') + ' au total · ' + monthCount() + ' ce mois-ci</p><ul class="hist">';
      for (var i = S.history.length - 1; i >= 0 && i >= S.history.length - 12; i--) {
        var h = S.history[i], hp = poste(h.poste), ho = h.opt ? option(h.opt) : null;
        html += '<li><span>' + fmtDate(h.d) + '</span><small>' + esc(hp ? hp.nom : '') + (ho ? ' + option ' + ho.numero : '') + '</small></li>';
      }
      html += '</ul>';
    }
    html += '</div>';
    html += '<div class="card" style="margin-top:12px"><h3>Installer sur iPhone</h3><ol class="steps"><li>Ouvre l\'appli dans <b>Safari</b>.</li><li>Touche <b>Partager</b> (carré avec une flèche).</li><li>Choisis <b>« Sur l\'écran d\'accueil »</b>, puis <b>Ajouter</b>.</li></ol><p class="note" style="margin:0">L\'appli s\'ouvre ensuite en plein écran et fonctionne même sans réseau à la salle.</p></div>';
    html += '<div class="card" style="margin-top:12px"><h3>Conseils</h3><ul class="steps">';
    for (var c = 0; c < DATA.consignes_generales.length; c++) html += '<li>' + esc(DATA.consignes_generales[c]) + '</li>';
    html += '<li>' + esc(DATA.jour_conseille) + '</li></ul></div>';
    html += '<button class="danger" id="reset">Effacer mes données sur ce téléphone</button>';
    html += '<p class="ver">VBCF Muscu · v' + esc(APP_VERSION) + ' · programme du ' + esc(DATA.version_contenu) + '</p>';
    return html;
  }
  function bindProfile() {
    bindRows();
    $('reset').onclick = function () {
      var m = $('modal');
      m.innerHTML = '<div class="sheet"><h3>Effacer mes données ?</h3><p>Ton poste et l\'historique de tes séances seront supprimés de ce téléphone.</p><button class="cta" id="rYes" style="background:var(--red)">Effacer</button><button class="link" id="rNo">Annuler</button></div>';
      m.hidden = false;
      $('rNo').onclick = function () { m.hidden = true; };
      $('rYes').onclick = function () { m.hidden = true; S = { poste: null, history: [] }; save(); go('#/'); };
    };
  }

  start();
})();
