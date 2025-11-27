// app.js — v6.16
// Vehicle filter + auto-fill + per-model Arms PDFs (ARMS_FILES) + Manual page map
// + i18n + share/csv/pdf/save + PWA + URL state restore
// + iOS/PWA PDF wrapper con pulsante "← Torna alla App"

(function () {
  'use strict';

  // ================== iOS/PWA — PDF wrapper "Torna alla App" ==================
  const IS_STANDALONE = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isPdfHref = (href) => !!href && /\.pdf($|[?#])/i.test(href);
  const absUrl = (u) => { try { return new URL(u, location.href).toString(); } catch { return u; } };

  function openPDFwithReturn(url) {
    if (!IS_STANDALONE) { window.open(url, '_blank'); return; }
    const html = `
      <!DOCTYPE html><html lang="it"><head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
        <title>Documento PDF</title>
        <style>
          :root{ --bg:#0b1022; --bar:#111735; --ink:#eef2ff; --line:#1d2a55; --focus:#2dd4bf; }
          html,body{height:100%}
          body{margin:0;background:var(--bg);color:var(--ink);display:flex;flex-direction:column}
          .bar{background:var(--bar);border-bottom:1px solid var(--line);padding:10px env(safe-area-inset-right) 10px calc(12px + env(safe-area-inset-left));display:flex;align-items:center;justify-content:space-between}
          .bar .title{font:15px system-ui, -apple-system, Segoe UI, Roboto, Arial}
          .btn{background:#0e193f;border:1px solid var(--line);padding:8px 12px;border-radius:10px;color:var(--ink);text-decoration:none;font:14px system-ui}
          iframe{flex:1;border:0;width:100%}
        </style>
      </head>
      <body>
        <div class="bar">
          <div class="title">📄 Documento</div>
          <a class="btn" href="./index.html">← Torna alla App</a>
        </div>
        <iframe src="${url}" allow="fullscreen"></iframe>
      </body></html>`;
    const w = window.open('', '_blank');
    if (w && w.document) { w.document.write(html); w.document.close(); }
    else { location.href = url; } // estremo fallback
  }

  // Intercetta tutti i click su <a> verso PDF (solo in PWA)
  document.addEventListener('click', (e) => {
    const a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a || !IS_STANDALONE) return;
    const href = a.getAttribute('href') || '';
    if (isPdfHref(href)) {
      e.preventDefault();
      openPDFwithReturn(absUrl(href));
    }
  }, { capture:true });

  // ================== helpers ==================
  const $  = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const curLang = () => document.documentElement.lang || 'it';
  const fmt = (x, unit = '') =>
    (x == null || x === '' ? '-' :
      Number(x).toLocaleString(curLang() === 'en' ? 'en-US' : 'it-IT')) + (unit ? ' ' + unit : '');

  function stopRowPropagation(el) {
    ['click','pointerdown','touchstart'].forEach(evt =>
      el.addEventListener(evt, ev => ev.stopPropagation(), { passive: true })
    );
  }

  // ================== static docs ==================
  const PDF = {
    withbase:   './docs/scheda_con_pedana.pdf',
    baseless:   './docs/scheda_senza_pedana_2022.pdf',
    manuale:    './docs/manuale_tecnico_presentazione.pdf',
    fondazioni: './docs/fondazioni_cascos_c4c.pdf',
    arms_general: './ARMS_FILES/MISURE_GENERALI_BRACCI_TIPO_VEICOLI.pdf'
  };

  // ================== ARMS (misure bracci) ==================
  const ARMS_PATH = './ARMS_FILES/';
  const ARMS_FILES = {
    // --- con basamento / pedana ---
    'C3.2':             ARMS_PATH + 'misure_C3.2.pdf',
    'C3.2 Comfort':     ARMS_PATH + 'misure_C3.2_Comfort.pdf',
    'C3.5':             ARMS_PATH + 'misure_C3.5.pdf',
    'C3.5XL':           ARMS_PATH + 'misure_C3.5XL.pdf',
    'C4':               ARMS_PATH + 'misure_C4.pdf',
    'C4XL':             ARMS_PATH + 'misure_C4XL.pdf',
    'C5':               ARMS_PATH + 'misure_C5.pdf',
    'C5.5':             ARMS_PATH + 'misure_C5.5.pdf',
    'C5 WAGON':         ARMS_PATH + 'misure_C5WAGON.pdf',
    'C5 XLWAGON':       ARMS_PATH + 'misure_C5XLWAGON.pdf',
    'C5.5 WAGON':       ARMS_PATH + 'misure_C5.5WAGON.pdf',

    // --- senza basamento / sbalzo libero ---
    'C3.2S':            ARMS_PATH + 'misure_C3.2S.pdf',
    'C3.2S CONFORT':    ARMS_PATH + 'misure_C3.2S_CONFORT.pdf',
    'C3.2S SPORT':      ARMS_PATH + 'misure_C3.2S_SPORT.pdf',
    'C3.2S VS PREMIUM': ARMS_PATH + 'misure_C3.2SVS_PREMIUM.pdf',
    'C3.5S':            ARMS_PATH + 'misure_C3.5S.pdf',
    'C3.5SXL':          ARMS_PATH + 'misure_C3.5SXL.pdf',
    'C4S':              ARMS_PATH + 'misure_C4S.pdf',
    'C4SXL':            ARMS_PATH + 'misure_C4SXL.pdf',
    'C4SVS':            ARMS_PATH + 'misure_C4SVS.pdf',
    'C5S':              ARMS_PATH + 'misure_C5S.pdf',
    'C5.5S':            ARMS_PATH + 'misure_C5.5S.pdf',
    'C5.5S GLOBAL':     ARMS_PATH + 'misure_C5.5SGLOBAL.pdf',
    'C5 SWAGON':        ARMS_PATH + 'misure_C5SWAGON.pdf',
    'C35.5SWAGON':      ARMS_PATH + 'misure_C35.5SWAGON.pdf',
    'C7S':              ARMS_PATH + 'misure_C7S.pdf',

    // --- utilità ---
    'MISURE TAMPONI':   ARMS_PATH + 'MISURE TAMPONI.pdf'
  };

  const ARMS_PAGES = { 'C3.2': 7, 'C3.2 Comfort': 13, 'C3.5': 19 };

  // ================== Schede commerciali per modello ==================
  const SHEET_FILES = {
    withbase: {
      'C3.2':         './docs/scheda_C3.2_con_pedana.pdf',
      'C3.2 Comfort': './docs/scheda_C3.2CONFORT_con_pedana.pdf',
      'C3.5':         './docs/scheda_C3.5_con_pedana.pdf',
      'C3.5XL':       './docs/scheda_C3.5XL_con_pedana.pdf',
      'C4':           './docs/scheda_C4_con_pedana.pdf',
      'C4XL':         './docs/scheda_C4XL_con_pedana.pdf',
      'C5':           './docs/scheda_C5_con_pedana.pdf',
      'C5 WAGON':     './docs/scheda_C5WAGON_con_pedana.pdf',
      'C5 XLWAGON':   './docs/scheda_C5XL_WAGON_con_pedana.pdf',
      'C5.5':         './docs/scheda_C5.5_con_pedana.pdf',
      'C5.5 WAGON':   './docs/scheda_C5.5WAGON_con_pedana.pdf'
    },
    baseless: {
      'C3.2S':         './docs/scheda_C3.2S_senza_pedana.pdf',
      'C3.2S CONFORT': './docs/scheda_C3.2S_CONFORT_senza_pedana.pdf',
      'C3.2S SPORT':   './docs/scheda_C3.2S_SPORT_senza_pedana.pdf',
      'C3.5S':         './docs/scheda_C3.5S_senza_pedana.pdf',
      'C3.5SXL':       './docs/scheda_C3.5SXL_senza_pedana.pdf',
      'C4S':           './docs/scheda_C4S_senza_pedana.pdf',
      'C4SXL':         './docs/scheda_C4SXL_senza_pedana.pdf',
      'C5S':           './docs/scheda_C5S_senza_pedana.pdf',
      'C5.5S':         './docs/scheda_C5.5S_senza_pedana.pdf',
      'C5.5SWAGON':    './docs/scheda_C5.5SWAGON_senza_pedana.pdf',
      'C5SWAGON':      './docs/scheda_C5SWAGON_senza_pedana.pdf'
    }
  };

  const MANUAL_PAGES = {
    'C3.2': 5, 'C3.5': 12, 'C4': 16, 'C4XL': 18, 'C5': 20, 'C5.5': 22, 'C5 WAGON': 25,
    'C3.2S': 32, 'C3.5S': 36, 'C4S': 40, 'C5.5S': 44
  };

  // ================== URL builders ==================
  function buildSheetUrl(modelId, baseKind) {
    const hit = SHEET_FILES[baseKind]?.[modelId];
    if (hit) return hit;

    // Prova varianti comuni del filename
    const base = baseKind === 'withbase' ? 'con_pedana' : 'senza_pedana';
    const candidates = [
      `./docs/scheda_${modelId}_${base}.pdf`,
      `./docs/scheda_${modelId.replaceAll('.', '_')}_${base}.pdf`,
      `./docs/scheda_${modelId.replaceAll('.', '')}_${base}.pdf`,
    ];
    return candidates[0];

    // Fallback manuale (alternativa):
    // const pdf = baseKind === 'withbase' ? PDF.withbase : PDF.baseless;
    // return `${pdf}#search=${encodeURIComponent(modelId)}`;
  }
  function buildManualUrl(modelId) {
    const p = MANUAL_PAGES[modelId];
    return p ? `${PDF.manuale}#page=${p}` : `${PDF.manuale}#search=${encodeURIComponent(modelId)}`;
  }
  function buildArmsUrl(modelId) {
    if (ARMS_FILES[modelId]) return ARMS_FILES[modelId];
    const p = ARMS_PAGES[modelId];
    return p ? `${PDF.manuale}#page=${p}` : `${PDF.manuale}#search=${encodeURIComponent(modelId)}`;
  }

  // ================== i18n ==================
  const I18N = { /* (identico alla tua v6.14) */ 
    it:{title:'🔧 CASCOS — Configuratore Sollevatori 2 Colonne',lang:'Lingua',save:'Salva',readme_btn:'Leggimi',install:'Installa',
      sec1:'1) Vincoli dell’officina',h:'Altezza utile soffitto (mm)',w:'Larghezza baia disponibile (mm)',
      conc:'Qualità calcestruzzo', conc_hint:'Per i modelli 3.2–5.5 t sono richiesti ancoraggi su calcestruzzo C20/25.',
      th:'Spessore soletta (mm)', pow:'Alimentazione disponibile', base:'Tipo colonna',
      tip:'Suggerimento: imposta <em>larghezza baia ≥ 3350 mm</em> per le serie C3.2–C4; per veicoli lunghi valuta le versioni XL / WAGON.',
      secVeh:'Tipo di veicolo', sec2:'2) Veicolo tipo da sollevare', gvw:'Peso veicolo (kg)', wb:'Passo (mm) / ingombro',
      use:'Uso', duty:'Frequenza cicli/h', calc:'Calcola suggerimenti', reset:'Reset',
      sec3:'3) Risultati e modelli consigliati', th_model:'Modello', th_cap:'Portata', th_inter:'Interasse<br>(mm)', th_width:'Larghezza tot.<br>(mm)',
      th_height:'Altezza utile<br>sotto traversa (mm)', th_power:'Alimentazione', th_anchor:'Anc. / Spessore<br>soletta', th_arms:'Bracci', th_notes:'Note',
      offline:'Puoi installarla e usarla offline.', withbase:'Con basamento', baseless:'Senza basamento',
      ok:'✓ Compatibile', warn_slab:'Soletta < 170 mm: adeguare prima del montaggio', warn_weight:'Veicolo > 3.5 t: considerare serie C5 / C5.5',
      share:'Condividi', csv:'CSV', pdfmulti:'PDF multiplo',
      arms_btn:'📐 Misure bracci', sheet_btn:'📄 Scheda', fond_btn:'🏗️ Fondazioni', arms_general:'📐 Misure generali (tipi veicolo)'
    },
    en:{title:'🔧 CASCOS — 2-Post Lift Configurator',lang:'Language',save:'Save',readme_btn:'Readme',install:'Install',
      sec1:'1) Workshop constraints',h:'Ceiling height (mm)',w:'Bay width (mm)', conc:'Concrete quality',
      conc_hint:'For 3.2–5.5 t models use anchors on C20/25 concrete.', th:'Slab thickness (mm)', pow:'Power supply', base:'Column type',
      tip:'Tip: set <em>bay width ≥ 3350 mm</em> for C3.2–C4; for long wheelbase consider XL/WAGON.', secVeh:'Vehicle type',
      sec2:'2) Vehicle to lift', gvw:'Vehicle weight (kg)', wb:'Wheelbase (mm) / length', use:'Use', duty:'Cycles/h', calc:'Compute suggestions', reset:'Reset',
      sec3:'3) Results & suggested models', th_model:'Model', th_cap:'Capacity', th_inter:'Interaxis<br>(mm)', th_width:'Total width<br>(mm)',
      th_height:'Clear height<br>under crossbar (mm)', th_power:'Power', th_anchor:'Anchors / Slab', th_arms:'Arms', th_notes:'Notes',
      offline:'You can install and use it offline.', withbase:'With base', baseless:'Baseless',
      ok:'✓ Compatible', warn_slab:'Slab < 170 mm: upgrade before installation', warn_weight:'Vehicle > 3.5 t: consider C5 / C5.5',
      share:'Share', csv:'CSV', pdfmulti:'Multi PDF', arms_btn:'📐 Arms sizes', sheet_btn:'📄 Sheet', fond_btn:'🏗️ Foundations',
      arms_general:'📐 General arms vs. vehicle'
    },
    es:{title:'🔧 CASCOS — Configurador 2 columnas',lang:'Idioma',save:'Guardar',readme_btn:'Léeme',install:'Instalar',
      sec1:'1) Restricciones del taller',h:'Altura útil de techo (mm)',w:'Ancho de bahía (mm)', conc:'Calidad del hormigón',
      conc_hint:'Para 3.2–5.5 t usar anclajes en C20/25.', th:'Espesor de losa (mm)', pow:'Alimentación', base:'Tipo de columna',
      tip:'Sugerencia: ancho ≥ 3350 mm para C3.2–C4; para batalla larga ver XL/WAGON.', secVeh:'Tipo de vehículo',
      sec2:'2) Vehículo a elevar', gvw:'Peso (kg)', wb:'Batalla (mm) / longitud', use:'Uso', duty:'Ciclos/h', calc:'Calcular', reset:'Restablecer',
      sec3:'3) Resultados y modelos sugeridos', th_model:'Modelo', th_cap:'Capacidad', th_inter:'Intereje<br>(mm)', th_width:'Ancho total<br>(mm)',
      th_height:'Altura útil<br>bajo travesaño (mm)', th_power:'Alimentación', th_anchor:'Anclajes / Losa', th_arms:'Brazos', th_notes:'Notas',
      offline:'Instalable y utilizable sin conexión.', withbase:'Con base', baseless:'Sin base',
      ok:'✓ Compatible', warn_slab:'Losa < 170 mm: reforzar', warn_weight:'Vehículo > 3.5 t: considerar C5 / C5.5',
      share:'Compartir', csv:'CSV', pdfmulti:'PDF múltiple', arms_btn:'📐 Medidas brazos', sheet_btn:'📄 Ficha', fond_btn:'🏗️ Cimientos',
      arms_general:'📐 Medidas generales (tipos)'
    },
    fr:{title:'🔧 CASCOS — Configurateur 2 colonnes',lang:'Langue',save:'Enregistrer',readme_btn:'Lisez-moi',install:'Installer',
      sec1:'1) Contraintes de l’atelier',h:'Hauteur sous plafond (mm)',w:'Largeur de baie (mm)', conc:'Qualité du béton',
      conc_hint:'Pour 3,2–5,5 t ancrages sur béton C20/25.', th:'Épaisseur de dalle (mm)', pow:'Alimentation', base:'Type de colonne',
      tip:'Astuce : largeur ≥ 3350 mm pour C3.2–C4 ; empattement long → XL/WAGON.', secVeh:'Type de véhicule',
      sec2:'2) Véhicule à lever', gvw:'Poids (kg)', wb:'Empattement (mm) / longueur', use:'Usage', duty:'Cycles/h', calc:'Calculer', reset:'Réinitialiser',
      sec3:'3) Résultats & modèles suggérés', th_model:'Modèle', th_cap:'Capacité', th_inter:'Entraxe<br>(mm)', th_width:'Largeur totale<br>(mm)',
      th_height:'Hauteur utile<br>sous traverse (mm)', th_power:'Alimentation', th_anchor:'Ancrages / Dalle', th_arms:'Bras', th_notes:'Remarques',
      offline:'Installable et utilisable hors-ligne.', withbase:'Avec base', baseless:'Sans base',
      ok:'✓ Compatible', warn_slab:'Dalle < 170 mm', warn_weight:'Véhicule > 3,5 t : C5 / C5.5',
      share:'Partager', csv:'CSV', pdfmulti:'PDF multiple', arms_btn:'📐 Bras (cotes)', sheet_btn:'📄 Fiche', fond_btn:'🏗️ Fondations',
      arms_general:'📐 Cotes générales (types)'
    },
    pt:{title:'🔧 CASCOS — Configurador 2 colunas',lang:'Idioma',save:'Salvar',readme_btn:'Leia-me',install:'Instalar',
      sec1:'1) Restrições da oficina',h:'Altura do teto (mm)',w:'Largura da baia (mm)', conc:'Qualidade do concreto',
      conc_hint:'Para 3,2–5,5 t usar chumbadores em C20/25.', th:'Espessura da laje (mm)', pow:'Alimentação', base:'Tipo de coluna',
      tip:'Dica: largura ≥ 3350 mm para C3.2–C4; entre-eixos longo → XL/WAGON.', secVeh:'Tipo de veículo',
      sec2:'2) Veículo a elevar', gvw:'Peso (kg)', wb:'Entre-eixos (mm) / comprimento', use:'Uso', duty:'Ciclos/h', calc:'Calcular', reset:'Limpar',
      sec3:'3) Resultados e modelli sugeridos', th_model:'Modelo', th_cap:'Capacidade', th_inter:'Entre-eixos<br>(mm)', th_width:'Largura total<br>(mm)',
      th_height:'Altura útil<br>sob travessa (mm)', th_power:'Alimentação', th_anchor:'Chumbadores / Laje', th_arms:'Braços', th_notes:'Notas',
      offline:'Pode ser instalada e usada offline.', withbase:'Com base', baseless:'Sem base',
      ok:'✓ Compatível', warn_slab:'Laje < 170 mm', warn_weight:'Veículo > 3,5 t: C5 / C5.5',
      share:'Compartilhar', csv:'CSV', pdfmulti:'PDF múltiplo', arms_btn:'📐 Medidas braços', sheet_btn:'📄 Ficha', fond_btn:'🏗️ Fundação',
      arms_general:'📐 Medidas gerais (tipos)'
    }
  };

  const bindings = [
    ['t_title','title'],['t_lang','lang'],['t_save','save'],['t_readme','readme_btn'],['t_install','install'],
    ['t_sec1','sec1'],['t_h','h'],['t_w','w'],['t_conc','conc'],['t_conc_hint','conc_hint'],['t_th','th'],['t_pow','pow'],['t_base','base'],['t_tip','tip'],
    ['t_sec2','sec2'],['t_gvw','gvw'],['t_wb','wb'],['t_use','use'],['t_duty','duty'],['t_calc','calc'],['t_reset','reset'],
    ['t_sec3','sec3'],['t_th_model','th_model'],['t_th_cap','th_cap'],['t_th_inter','th_inter'],['t_th_width','th_width'],['t_th_height','th_height'],
    ['t_th_power','th_power'],['t_th_anchor','th_anchor'],['t_th_arms','th_arms'],['t_th_notes','th_notes'],
    ['t_share','share'],['t_csv','csv'],['t_pdfmulti','pdfmulti']
  ];

  function applyLang(lang) {
    const L = I18N[lang] || I18N.it;
    bindings.forEach(([id,key]) => { const el = document.getElementById(id); if (el) el.innerHTML = L[key]; });
    const gen = document.getElementById('armsGeneralBtn');
    if (gen) { gen.textContent = L.arms_general || '📐 Misure generali (tipi veicolo)'; gen.href = PDF.arms_general; gen.target = '_blank'; gen.rel = 'noopener'; }
    populateVehicleSelect(lang);
    document.documentElement.lang = lang;
    safeRender();
  }
  $('#langSel')?.addEventListener('change', (e) => applyLang(e.target.value));

  // ================== dataset ==================
  let MODELS = [];

  function withNoStore(u) {
    try {
      const url = new URL(u, location.href);
      if (!url.searchParams.has('v') && !url.searchParams.has('t')) url.searchParams.set('t', Date.now());
      return url.toString();
    } catch { return u; }
  }
  const DATA_URL = withNoStore(window.MODELS_URL || './models.json');

  // ================== URL state ==================
  const qp = new URLSearchParams(location.search);
  const preselect = { lang: qp.get('lang') || null, ids: (qp.get('ids') || '').split(',').map(s=>s.trim()).filter(Boolean) };
  const restoreInputs = { H:'inpH', W:'inpW', T:'inpThickness', C:'inpConcrete', P:'inpPower', B:'inpBase', GVW:'inpGVW', WB:'inpWB', V:'vehicleSel' };
  Object.entries(restoreInputs).forEach(([q,id]) => {
    const v = qp.get(q); if (v != null && v !== '') { const el = document.getElementById(id); if (el) el.value = v; }
  });
  if (preselect.lang) { const sel = $('#langSel'); if (sel) sel.value = preselect.lang; applyLang(preselect.lang); }

  fetch(DATA_URL, { cache: 'no-store' })
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status} su ${DATA_URL}`); return r.json(); })
    .then(d => {
      if (!Array.isArray(d)) throw new Error('models.json non è un array');
      MODELS = d;
      initVehicleFilter();
      if (preselect.lang) { const sel = $('#langSel'); if (sel) sel.value = preselect.lang; applyLang(preselect.lang); }
      else { applyLang(document.documentElement.lang || 'it'); }
      calculate();
      if (preselect.ids.length) setTimeout(()=>{ const setIds = new Set(preselect.ids); $$('.pick').forEach(chk=>{ if(setIds.has(chk.dataset.id)) chk.checked = true; }); },0);
    })
    .catch(err => {
      console.error('Errore nel caricamento di models.json:', err);
      MODELS = [];
      initVehicleFilter(); applyLang(document.documentElement.lang || 'it');
      const warnings = document.getElementById('warnings');
      if (warnings) { const s = document.createElement('span'); s.className='tag bad'; s.textContent='Impossibile caricare i modelli (rete/cache/MIME).'; warnings.appendChild(s); }
    });

  // ================== vehicle types / defaults / compat ==================
  const VEHICLE_TYPES = {
    any:{ it:'Qualsiasi', en:'Any', es:'Cualquiera', fr:'Toutes', pt:'Qualquer' },
    city:{ it:'City / Utilitaria', en:'City / Small', es:'Ciudad / utilitario', fr:'Citadine', pt:'Citadino' },
    sedan:{ it:'Berlina / Crossover', en:'Sedan / Crossover', es:'Berlina / Crossover', fr:'Berline / Crossover' , pt:'Sedan / Crossover'},
    suv:{ it:'SUV / Pickup', en:'SUV / Pickup', es:'SUV / Pickup', fr:'SUV / Pickup', pt:'SUV / Pickup' },
    mpv:{ it:'MPV / Monovolume', en:'MPV / Minivan', es:'Monovolumen', fr:'Monospace', pt:'Minivan' },
    van:{ it:'Van / Furgoni', en:'Van / LCV', es:'Furgón', fr:'Fourgon', pt:'Furgão' },
    lcv:{ it:'Veicoli lunghi / WAGON', en:'Long vehicles / WAGON', es:'Vehículos largos / WAGON', fr:'Véhicules longs / WAGON', pt:'Veículos longos / WAGON' }
  };
  const VEHICLE_DEFAULTS = {
    any:null, city:{kg:1200, wb:2400, use:'auto', duty:6}, sedan:{kg:1650, wb:2700, use:'auto', duty:6},
    suv:{kg:2300, wb:2900, use:'auto', duty:6}, mpv:{kg:2000, wb:2800, use:'mpv', duty:6},
    van:{kg:2800, wb:3100, use:'van', duty:10}, lcv:{kg:3200, wb:3300, use:'auto', duty:10}
  };
  const VEHICLE_COMPAT = {
    city:['C3.2','C3.2 Comfort','C3.5','C3.2S','C3.5S','C4','C4S'],
    sedan:['C3.2','C3.2 Comfort','C3.5','C3.2S','C3.5S','C4','C4S','C4XL'],
    suv:['C3.5','C4','C4XL','C5','C5.5','C5.5S'],
    mpv:['C3.5','C4','C4XL'],
    van:['C4S','C4SXL','C4XL','C5','C5.5','C5.5S','C5 WAGON','C5SWAGON','C5.5SWAGON'],
    lcv:['C5','C5.5','C5 WAGON','C5.5S','C5SWAGON','C5.5SWAGON']
  };

  function populateVehicleSelect(lang) {
    const sel = $('#vehicleSel'); if (!sel) return;
    const cur = sel.value || qp.get('V') || 'any';
    sel.innerHTML = '';
    Object.entries(VEHICLE_TYPES).forEach(([k,labels]) => { const opt = document.createElement('option'); opt.value = k; opt.textContent = labels[lang] || labels.it; sel.appendChild(opt); });
    sel.value = cur;
  }

  function initVehicleFilter() {
    const sel = $('#vehicleSel'); if (!sel) return;
    populateVehicleSelect(curLang());
    sel.addEventListener('change', () => {
      const d = VEHICLE_DEFAULTS[sel.value];
      if (d) { const g=$('#inpGVW'); if (g) g.value=d.kg; const w=$('#inpWB'); if (w) w.value=d.wb; const u=$('#inpUse'); if (u&&d.use) u.value=d.use; const c=$('#inpDuty'); if (c&&d.duty!=null) c.value=String(d.duty); }
      safeRender();
    });
    if (!qp.get('V')) sel.value = 'any';
    const lbl = $('#t_secVeh'); if (lbl) lbl.textContent = (I18N[curLang()]||I18N.it).secVeh;
  }

  // ================== core logic ==================
  const rows = $('#rows'); const warnings = $('#warnings');

  function issuesFor(m) {
    const L = I18N[curLang()] || I18N.it;
    const H = +($('#inpH')?.value || 0);
    const W = +($('#inpW')?.value || 0);
    const T = +($('#inpThickness')?.value || 0);
    const conc = $('#inpConcrete')?.value;
    const pw = $('#inpPower')?.value;
    const arr = [];
    if (H && m.h_sotto_traversa && H < (m.h_sotto_traversa - 200)) arr.push({ t:'Soffitto basso', cls:'warn' });
    if (W && m.larghezza && W < m.larghezza) arr.push({ t:'Baia stretta', cls:'bad' });
    if (pw && !(m.power || []).includes(pw)) arr.push({ t:'Alimentazione non prevista', cls:'warn' });
    if (T && T < (m.anchors?.thickness_min_mm || 170)) arr.push({ t:L.warn_slab, cls:'bad' });
    if (conc && m.anchors && conc !== 'unknown' && conc !== m.anchors.concrete) arr.push({ t:`${m.anchors.concrete}`, cls:'warn' });
    return arr;
  }

  function fitScore(m) {
    const gvw = +($('#inpGVW')?.value || 0); const wb = +($('#inpWB')?.value || 0);
    let s = 0;
    if (gvw > 0) { const head = (m.portata - gvw) / (m.portata || 1); s += Math.max(-1, Math.min(1, head * 2)); }
    if (wb > 0) { const wantsLong = wb >= 3000; const long = /XL|WAGON/i.test(m.id) || (m.interasse || 0) >= 3000; s += wantsLong ? (long ? 0.6 : -0.6) : (long ? -0.2 : 0.2); }
    return s;
  }

  function makeFiltered() {
    const gvw = +($('#inpGVW')?.value || 0);
    const wantBase = $('#inpBase')?.value;
    const pw = $('#inpPower')?.value;
    const vehSel = $('#vehicleSel') ? $('#vehicleSel').value : 'any';

    let list = [...(MODELS || [])]
      .filter(m => !wantBase || m.base === wantBase)
      .filter(m => !gvw || m.portata >= Math.max(1000, gvw * 1.25))
      .filter(m => !pw || (m.power || []).includes(pw));

    if (vehSel && vehSel !== 'any') {
      const allowed = new Set(VEHICLE_COMPAT[vehSel] || []);
      list = list.filter(m => allowed.has(m.id));
    }
    return list.sort((a, b) => fitScore(b) - fitScore(a));
  }

  function render(list) {
    const L = I18N[curLang()] || I18N.it;
    if (!rows) return;
    rows.innerHTML = '';
    list.forEach(m => {
      const tr = document.createElement('tr');
      const issues = issuesFor(m);
      const isWithBase = m.base === 'withbase';
      const schedaUrl = buildSheetUrl(m.id, isWithBase ? 'withbase' : 'baseless');
      const armsUrl = buildArmsUrl(m.id);
      const armsStr = m.arms ? `${m.arms.type || ''} ${(m.arms.min_mm ?? '–')}–${(m.arms.max_mm ?? '–')} mm` : '–';
      const baseChip = `<div class="tag" style="margin-top:4px">${isWithBase ? L.withbase : L.baseless}</div>`;

      tr.innerHTML = `
        <td>
          <strong>${m.id}</strong>
          <div class="hint">ref. ${m.ref || '-'}</div>
          ${baseChip}
          <div style="margin-top:4px;display:flex;gap:6px;flex-wrap:wrap">
            <a class="btn action-sheet" style="padding:2px 8px" href="${schedaUrl}" target="_blank" rel="noopener">${L.sheet_btn}</a>
            <a class="btn action-arms"  style="padding:2px 8px" href="${armsUrl}"   target="_blank" rel="noopener">${L.arms_btn}</a>
            <a class="btn action-fond"  style="padding:2px 8px" href="${PDF.fondazioni}" target="_blank" rel="noopener">${L.fond_btn}</a>
          </div>
        </td>
        <td>${fmt(m.portata, 'kg')}</td>
        <td>${fmt(m.interasse, 'mm')}</td>
        <td>${fmt(m.larghezza, 'mm')}</td>
        <td>${fmt(m.h_sotto_traversa, 'mm')}</td>
        <td>${(m.power || []).join(', ') || '-'}</td>
        <td>${m.anchors ? `${m.anchors.qty}× ${m.anchors.type}<br>${m.anchors.concrete}, ≥ ${m.anchors.thickness_min_mm} mm` : '-'}</td>
        <td>${armsStr}</td>
        <td>${issues.length ? issues.map(i => `<span class="tag ${i.cls}">${i.t}</span>`).join(' ') : `<span class="ok">${L.ok}</span>`}</td>
        <td><input type="checkbox" class="pick" data-id="${m.id}"></td>`;

      tr.style.cursor = 'pointer';
      tr.addEventListener('click', () => openSheet(m, L));
      tr.querySelectorAll('.action-sheet,.action-arms,.action-fond,.pick').forEach(stopRowPropagation);
      rows.appendChild(tr);
    });
  }

  function safeRender() { try { render(makeFiltered().slice(0, 40)); } catch (e) { console.error(e); } }

  // ================== top actions ==================
  function selectedIds() { return $$('.pick:checked').map(i => i.dataset.id); }
  function buildQuery(extras) {
    const p = new URLSearchParams();
    const set = (k, v) => { if (v != null && v !== '') p.set(k, v); };
    set('H', $('#inpH')?.value); set('W', $('#inpW')?.value); set('T', $('#inpThickness')?.value);
    set('C', $('#inpConcrete')?.value); set('P', $('#inpPower')?.value); set('B', $('#inpBase')?.value);
    set('GVW', $('#inpGVW')?.value); set('WB', $('#inpWB')?.value);
    if ($('#vehicleSel')) set('V', $('#vehicleSel').value);
    set('lang', curLang());
    if (extras) Object.keys(extras).forEach(k => set(k, extras[k]));
    return p.toString();
  }

  $('#shareBtn')?.addEventListener('click', () => {
    const url = location.origin + location.pathname + '?' + buildQuery({ ids: selectedIds().join(',') });
    if (navigator.share) { navigator.share({ title: 'CASCOS Config', url }).catch(()=>{}); }
    else { navigator.clipboard.writeText(url).then(()=>alert('Link copiato:\n' + url)).catch(()=>alert(url)); }
  });

  function toCSV(list) {
    const head = ['Model','Ref','Capacity(kg)','Interaxis(mm)','Width(mm)','Clear height(mm)','Power','Anchors','Arms','Type'];
    const lines = [head.join(';')];
    list.forEach(m => {
      const anc = m.anchors ? `${m.anchors.qty}x ${m.anchors.type} ${m.anchors.concrete} ≥${m.anchors.thickness_min_mm}mm` : '';
      const arms = m.arms ? `${m.arms.type || ''} ${(m.arms.min_mm ?? '')}-${(m.arms.max_mm ?? '')}` : '';
      lines.push([m.id, m.ref || '', m.portata || '', m.interasse || '', m.larghezza || '', m.h_sotto_traversa || '', (m.power || []).join(','), anc, arms, (m.base || '')].join(';'));
    });
    return lines.join('\n');
  }
  $('#csvBtn')?.addEventListener('click', () => {
    const ids = selectedIds();
    const list = ids.length ? (MODELS || []).filter(m => ids.includes(m.id)) : makeFiltered().slice(0, 40);
    const blob = new Blob([toCSV(list)], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'cascos_modelli.csv'; a.click();
  });

  $('#pdfMultiBtn')?.addEventListener('click', () => {
    const ids = selectedIds();
    const list = ids.length ? (MODELS || []).filter(m => ids.includes(m.id)) : makeFiltered().slice(0, 10);
    const L = I18N[curLang()] || I18N.it;
    list.forEach((m, i) => setTimeout(() => openSheet(m, L, true), i * 220));
  });

  $('#saveBtn')?.addEventListener('click', () => {
    const payload = {
      timestamp: new Date().toISOString(),
      lang: curLang(),
      inputs: {
        altezza_mm: +($('#inpH')?.value || 0) || null,
        larghezza_mm: +($('#inpW')?.value || 0) || null,
        calcestruzzo: $('#inpConcrete')?.value,
        soletta_mm: +($('#inpThickness')?.value || 0) || null,
        alimentazione: $('#inpPower')?.value,
        tipo_colonna: $('#inpBase')?.value,
        tipo_veicolo: $('#vehicleSel') ? $('#vehicleSel').value : 'any',
        peso_veicolo: +($('#inpGVW')?.value || 0) || null,
        passo_mm: +($('#inpWB')?.value || 0) || null,
        uso: $('#inpUse')?.value,
        cicli_ora: +($('#inpDuty')?.value || 0) || null
      },
      selected_ids: selectedIds()
    };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    a.download = 'cascos_configurazione.json';
    a.click();
  });

  // ================== single sheet / print ==================
  function openSheet(m, L, silent = false) {
    const css = `body{font:13px system-ui,Segoe UI,Roboto,Arial;margin:0;background:#0b1022;color:#eef2ff}
h1{font-size:18px;margin:0 0 8px 0;padding:14px 16px;background:#111735;border-bottom:1px solid #1d2a55}
table{width:calc(100% - 32px);border-collapse:collapse;margin:12px 16px;background:#111735;border:1px solid #1d2a55;border-radius:10px;overflow:hidden}
td,th{border:1px solid #1d2a55;padding:8px;text-align:left}
a.btn{display:inline-block;background:#0e193f;border:1px solid #1d2a55;padding:6px 10px;border-radius:10px;color:#eef2ff;text-decoration:none;margin-right:6px}
.bar{display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:#0f183b;border-bottom:1px solid #1d2a55;position:sticky;top:0}
`;
    const armsStr = m.arms ? `${m.arms.type || ''} ${(m.arms.min_mm ?? '–')}–${(m.arms.max_mm ?? '–')} mm` : '–';
    const schedaUrl = buildSheetUrl(m.id, m.base === 'withbase' ? 'withbase' : 'baseless');
    const armsUrl = buildArmsUrl(m.id);

    // Mini-wrapper per intercettare PDF anche dentro questa finestra
    const pdfHelper = `
<script>
  (function(){
    var IS_STANDALONE = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    function isPdf(h){ return /\\.pdf($|[?#])/i.test(h||''); }
    function openWrap(u){
      if(!IS_STANDALONE){ window.open(u,'_blank'); return; }
      var html='<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>PDF</title>'+
        '<style>body{margin:0;background:#0b1022;color:#eef2ff;display:flex;flex-direction:column;height:100vh} .bar{background:#111735;border-bottom:1px solid #1d2a55;padding:10px 16px;display:flex;justify-content:space-between;align-items:center} a.btn{background:#0e193f;border:1px solid #1d2a55;padding:8px 12px;border-radius:10px;color:#eef2ff;text-decoration:none} iframe{flex:1;border:0;width:100%}</style></head>'+
        '<body><div class="bar"><div>📄 Documento</div><a class="btn" href="./index.html">← Torna alla App</a></div><iframe src="'+u+'"></iframe></body></html>';
      var w=window.open('','_blank'); if(w&&w.document){ w.document.write(html); w.document.close(); } else { location.href=u; }
    }
    document.addEventListener('click', function(e){
      var a=e.target.closest && e.target.closest('a'); if(!a) return;
      var h=a.getAttribute('href')||''; if(isPdf(h)){ e.preventDefault(); openWrap(new URL(h, location.href).toString()); }
    }, {capture:true});
  })();
</script>`;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${m.id} — CASCOS</title><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>${css}</style></head><body>
<div class="bar">
  <div><a class="btn" href="./index.html">← Torna alla App</a></div>
  <div style="opacity:.8">Scheda tecnica</div>
</div>
<h1>${m.id} — CASCOS</h1>
<table>
<tr><th>${L.th_cap || 'Portata'}</th><td>${m.portata || '-'} kg</td></tr>
<tr><th>Interasse</th><td>${m.interasse || '-'} mm</td></tr>
<tr><th>Larghezza</th><td>${m.larghezza || '-'} mm</td></tr>
<tr><th>Altezza utile</th><td>${m.h_sotto_traversa || '-'} mm</td></tr>
<tr><th>${L.th_arms || 'Bracci'}</th><td>${armsStr} — <a class="btn" href="${armsUrl}" target="_blank" rel="noopener">${L.arms_btn || '📐 Misure bracci'}</a></td></tr>
<tr><th>${L.th_power || 'Alimentazione'}</th><td>${(m.power || []).join(', ') || '-'}</td></tr>
<tr><th>${(L.th_anchor || 'Ancoraggi').replace('<br>',' ')}</th><td>${m.anchors ? (m.anchors.qty + '× ' + m.anchors.type + ' — ' + m.anchors.concrete + ', ≥ ' + m.anchors.thickness_min_mm + ' mm') : '-'}</td></tr>
<tr><th>Tipo</th><td>${m.base === 'withbase' ? (L.withbase || 'Con basamento') : (L.baseless || 'Senza basamento')}</td></tr>
<tr><th>Documentazione</th><td>
<a class="btn" href="${schedaUrl}" target="_blank" rel="noopener">${L.sheet_btn || 'Scheda'}</a>
<a class="btn" href="${PDF.fondazioni}" target="_blank" rel="noopener">${L.fond_btn || 'Fondazioni'}</a>
<a class="btn" href="${PDF.arms_general}" target="_blank" rel="noopener">${L.arms_general || '📐 Misure generali'}</a>
</td></tr>
</table>
${pdfHelper}
<script>window.addEventListener('load',()=>{ ${silent ? '' : 'setTimeout(()=>print(),180);'} });</script>
</body></html>`;

    const w = window.open('', '_blank'); if (!w) return;
    w.document.write(html); w.document.close();
  }

  // ================== compute / reset ==================
  function calculate() {
    const L = I18N[curLang()] || I18N.it;
    if (warnings) {
      warnings.innerHTML = '';
      const lst = [];
      if ((+($('#inpThickness')?.value || 0)) < 170) lst.push({ t:L.warn_slab, cls:'bad' });
      if ((+($('#inpGVW')?.value || 0)) > 3500) lst.push({ t:L.warn_weight, cls:'warn' });
      lst.forEach(w => { const s = document.createElement('span'); s.className = `tag ${w.cls}`; s.textContent = w.t; warnings.appendChild(s); });
    }
    safeRender();
  }
  $('#calcBtn')?.addEventListener('click', calculate);
  $('#resetBtn')?.addEventListener('click', () => {
    $$('.card input').forEach(i => i.value = '');
    if ($('#vehicleSel')) $('#vehicleSel').value = 'any';
    calculate();
  });

  // ================== PWA (install + fallback iOS) ==================
  (function setupPWA() {
    const installBtn = document.getElementById('installBtn');
    let deferredPrompt = null;
    const showBtn = () => { if (installBtn) installBtn.hidden = false; };
    const hideBtn = () => { if (installBtn) installBtn.hidden = true; };

    const isStandalone = IS_STANDALONE;
    if (isStandalone) hideBtn();
    window.addEventListener('appinstalled', () => hideBtn());

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault(); deferredPrompt = e; showBtn();
      if (installBtn) {
        installBtn.onclick = async () => {
          try { await deferredPrompt.prompt(); const choice = await deferredPrompt.userChoice; if (choice && choice.outcome === 'accepted') hideBtn(); }
          catch(_){} deferredPrompt = null;
        };
      }
    });

    setTimeout(() => {
      if (!deferredPrompt && installBtn && installBtn.hidden) {
        showBtn();
        installBtn.onclick = () => {
          const ua = navigator.userAgent || '';
          if (/iPhone|iPad|iPod/i.test(ua)) alert('iPhone/iPad:\n1) Tocca • Condividi\n2) “Aggiungi alla schermata Home”\n3) Conferma Nome → Aggiungi');
          else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) alert('Safari (macOS): File → Aggiungi al Dock.');
          else alert('Se il prompt non compare:\n• Usa Chrome/Edge\n• Assicurati HTTPS attivo\n• Manifest e Service Worker devono essere validi.');
        };
      }
    }, 2500);

    if ('serviceWorker' in navigator) { navigator.serviceWorker.register('./sw.js').catch(() => {}); }
  })();
})();
