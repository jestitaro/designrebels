/* =========================
   FAQs data
========================= */
const FAQS = [
  {"q": "¿Qué es QuartzSales?", "a": "QuartzSales es una solución de software móvil y web diseñada para alcanzar la tienda perfecta y optimizar la ejecución del PDV. Nuestro software mobile y web ofrece una plataforma amigable e intuitiva que te permite organizar tus procesos de manera eficiente. Además, con QuartzSales, podrás potenciar la comunicación y gestión de tu equipo de ventas, obtener información detallada acerca del PDV (PDV 360) y centralizar la información relevante para que puedas contar con una visión estratégica en todo momento."},
  {"q": "¿Cuáles son los beneficios de utilizar QuartzSales?", "a": "Mejora en la eficiencia: QuartzSales te permite optimizar tus procesos, lo que se traduce en una mayor productividad y ahorro de tiempo para tu equipo. Toma de decisiones informadas: Gracias a la visión completa y detallada sobre el rendimiento de tu PDV, podrás tomar decisiones estratégicas basadas en datos reales y objetivos. Adaptabilidad y personalización: La plataforma de QuartzSales se adapta a tus necesidades específicas y es completamente personalizable. Mayor visibilidad en el punto de venta y colaboración/ comunicación efectiva entre equipos."},
  {"q": "¿Cuáles son las funcionalidades clave de QuartzSales?", "a": "Ejecución de Punto de Venta / Retail Execution: ruteos y visitas; formularios y captura de información; planogramas. Comunicación y gestión del equipo de ventas: novedades, objetivos e incentivos, capacitaciones, licencias y reemplazos. PDV 360: indicadores (OSA, SoS, eficiencia, lanzamientos, precios, ventas), equipo de trabajo, portafolio/surtido e infaltables, notas, vencimientos, ventas y stock. Información centralizada: sellout y stock de cadenas. Análisis predictivo y generación de tareas inteligentes. IA para reconocimiento de productos y precios. Integración con plataformas de BI."},
  {"q": "¿QuartzSales es compatible con otras herramientas y sistemas?", "a": "Sí. Integra con CRM, ERP (por ejemplo SAP/ SAP B1) y otras soluciones que ya utilices. Es una plataforma versátil y compatible que se adapta a las necesidades y requerimientos de tu empresa."},
  {"q": "¿Cómo puedo solicitar una demostración de QuartzSales?", "a": "Escribinos a <a href=\"mailto:info@quartzsales.com\">info@quartzsales.com</a> o llamanos al <a href=\"tel:+541152356660\">+54 11 5235-6660</a> y coordinamos una demo personalizada."},
  {"q": "¿QuartzSales ofrece soporte técnico y capacitación?", "a": "Sí. Ofrecemos soporte técnico y capacitación para que aproveches al máximo la plataforma."},
  {"q": "¿QuartzSales es una solución personalizable?", "a": "Sí. Es altamente personalizable según los procesos y preferencias de cada compañía."},
  {"q": "¿QuartzSales funciona sin conexión a internet?", "a": "Sí. Funciona online y offline, permitiéndote seguir usando la plataforma incluso sin conexión."},
  {"q": "¿QuartzSales funciona en Android y iOS?", "a": "Sí. Es compatible tanto con Android como con iOS."},
  {"q": "¿Qué hace la Inteligencia artificial (AI) en QuartzSales?", "a": "La Inteligencia artificial (AI) automatiza tareas clave en PDV: reconocimiento visual de productos y precios, verificación de planogramas, priorización de tareas y un asistente que sugiere acciones en cada punto de venta."},
  {"q": "¿Detectan quiebres y presencia con Inteligencia artificial (AI)?", "a": "Sí. Con una foto, la Inteligencia artificial (AI) identifica quiebres, presencia y métricas como OSA o share de exhibición en segundos, reduciendo tiempos y errores."},
  {"q": "¿Pueden leer etiquetas de precio con Inteligencia artificial (AI)?", "a": "Sí. La Inteligencia artificial (AI) reconoce producto y precio desde etiquetas para acelerar auditorías y comparar precios propios y de la competencia."},
  {"q": "¿Verifican planogramas con Inteligencia artificial (AI)?", "a": "Sí. La Inteligencia artificial (AI) compara la góndola real con el planograma esperado, detecta desvíos de ubicación y propone correcciones para asegurar el cumplimiento."},
  {"q": "¿Qué es AiFred y cómo usa Inteligencia artificial (AI)?", "a": "AiFred es el asistente virtual que prioriza tareas con Inteligencia artificial (AI), responde preguntas operativas y recomienda próximos pasos en tiempo real para cada PDV."},
  {"q": "¿Qué impacto tiene la Inteligencia artificial (AI) en resultados?", "a": "Implementaciones reportan mayor productividad, reducción del tiempo de captura y mejor visibilidad de ejecución en góndola gracias a la Inteligencia artificial (AI)."},
  {"q": "¿Cómo se integra la Inteligencia artificial (AI) con mis datos?", "a": "La Inteligencia artificial (AI) se alimenta de maestros (productos, PDVs, listas de precios), inventario y ventas; e integra con ERP/CRM y BI para contextualizar recomendaciones."},
  {"q": "¿La Inteligencia artificial (AI) funciona sin conexión?", "a": "Sí. Varias rutinas móviles de Inteligencia artificial (AI) pueden operar offline y sincronizar cuando vuelve la conexión, manteniendo el trabajo en campo."},
  {"q": "¿Qué consideraciones de seguridad hay para la Inteligencia artificial (AI)?", "a": "Aplicamos control de accesos, cifrado en tránsito y en reposo y gobierno de datos para proteger la información utilizada por la Inteligencia artificial (AI)."},

  /* --- Nuevas FAQs: Trade Marketing --- */
  {"q": "¿Qué es Trade Marketing?", "a": "Es la disciplina que conecta marketing y ventas en el canal, asegurando disponibilidad, visibilidad y ejecución de marca en el PDV para impulsar rotación y participación."},
  {"q": "¿Cómo ayuda QuartzSales al Trade Marketing?", "a": "Digitalizamos la ejecución: ruteos inteligentes, checklists y formularios, control de precios y promo, verificación de planogramas, reconocimiento de producto/precio con IA y tableros PDV 360 para accionar desvíos en tiempo real."},
  {"q": "¿Qué KPIs de Trade Marketing puedo medir con QuartzSales?", "a": "OSA (On Shelf Availability), share de exhibición/SoS, precios y quiebres, cumplimiento de planograma, ejecución de promociones, facing por categoría, tiempos de visita y efectividad de ruteo."},
  {"q": "¿QuartzSales mejora la coordinación con equipos de campo y clientes?", "a": "Sí. Centraliza información, comunica objetivos e incentivos, gestiona licencias y reemplazos y comparte reportes con cuentas clave para alinear acciones en el PDV."}
];

/* =========================
   Render
========================= */
function renderFAQs(root, list = FAQS) {
  if (!root) return;
  root.innerHTML = list.map(({ q, a }) => `
    <details class="faq-item">
      <summary><span class="q">${q}</span><span class="chev"><i class="fa-solid fa-chevron-down"></i></span></summary>
      <div class="a">${a}</div>
    </details>
  `).join('');
}

/* =========================
   Utilities (bot)
========================= */
function normalize(s){
  return (s||'').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9\s]/g,' ')
    .replace(/\s+/g,' ').trim();
}
const SYN = [
  ['offline','sin internet','sin conexion','sin conexión','sin datos','modo avion','modo avión'],
  ['planograma','planogramas','planogram'],
  ['precio','precios','etiqueta','etiquetas','price','prices'],
  ['quiebre','quiebres','faltante','faltantes','stockout','osa'],
  ['trade','trade marketing','marketing','pdv','punto de venta']
];
function expandTerms(term){
  const t = normalize(term);
  const terms = new Set(t.split(' '));
  SYN.forEach(group => {
    if (group.some(k => t.includes(normalize(k)))) {
      group.forEach(k => terms.add(normalize(k)));
    }
  });
  const all = [t, ...Array.from(terms).filter(tok => tok.length > 3)];
  return Array.from(new Set(all));
}
function score(item, term){
  const text = normalize(item.q + ' ' + item.a);
  const exp = expandTerms(term);
  let s = 0;
  if (text.includes(normalize(term))) s += 5;
  exp.forEach(tok => { if (tok && text.includes(tok)) s += (tok.length >= 6 ? 2 : 1); });
  if (normalize(item.q).includes(normalize(term))) s += 3;
  return s;
}

/* =========================
   Main
========================= */
document.addEventListener('DOMContentLoaded', () => {
  /* --- Render FAQs primero --- */
  const acc = document.querySelector('#faq-accordion');
  renderFAQs(acc);
  const first = acc && acc.querySelector('.faq-item');
  if (first) first.setAttribute('open','');

  /* --- Header transparente como en Home --- */
  const header = document.querySelector('header');
  function onScroll(){
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 80);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* --- Drawer mobile --- */
  const drawer = document.querySelector('.drawer');
  const overlay = document.querySelector('.drawer-overlay');
  const closeBtn = document.querySelector('.drawer-close');
  const burger = document.querySelector('.burger');
  function openMenu(){ if(drawer && overlay){ drawer.classList.add('open'); overlay.classList.add('show'); document.body.style.overflow='hidden'; document.body.classList.add('menu-open'); } }
  function closeMenu(){ if(drawer && overlay){ drawer.classList.remove('open'); overlay.classList.remove('show'); document.body.style.overflow=''; document.body.classList.remove('menu-open'); } }
  burger && burger.addEventListener('click', openMenu);
  closeBtn && closeBtn.addEventListener('click', closeMenu);
  overlay && overlay.addEventListener('click', closeMenu);

  /* --- Mini Bot --- */
  const botInput = document.querySelector('#bot-input');
  const botSend = document.querySelector('#bot-send');

  function pushMsg(text, me=false){
    if(!botBody) return;
    const div = document.createElement('div');
    div.innerHTML = text;
    botBody.appendChild(div);
    botBody.scrollTop = botBody.scrollHeight;
  }

  function answer(term){
    const raw = (term||'').trim();
    const t = normalize(raw);
    if(!t) return;

    // Respuestas especiales (detectan por normalize)
    const any = (arr) => arr.some(s => t.includes(normalize(s)));

    const saludos = ['hola','buenas','buen dia','buen día','buenas tardes','buenas noches','que tal','qué tal','hey'];
    const gracias = ['gracias','muchas gracias','mil gracias','te agradezco'];
    const nombreBot = ['como te llamas','cómo te llamas','como te llamas?','como te llamas','como te llamas a','como te llamas vos','como te llamas','como te llamas','como te llamas','como te llamas','como te llamas','como te llamas','como te llamas','como te llamas','como te llamas','como te llamas','como te llamas','como te llamas','como te llamas','como te llamas','como te llamas','como te llamas','como te llamas','como te llamas','como te llamas','como te llamas','como te llamas','como te llamas','como te llamas','como te llamas','como te llamas','como te llamas','como te llamas','como te llamas','como te llamas','como te llamás','cual es tu nombre','cuál es tu nombre','tu nombre','quien sos','quién sos'];
    const redes = ['redes','redes sociales','linkedin','instagram','facebook','rrss'];
    const demo = ['demo','demostracion','demostración','quiero una demo','solicitar demo','pedir demo'];
    const tradeKeys = ['trade','trade marketing','marketing'];

    if (any(saludos)) {
      pushMsg('Hola, decime que estás buscando y te ayudo.');
      return;
    }
    if (any(gracias)) {
      pushMsg('De nada, fue un placer ayudarte.');
      return;
    }
    if (any(nombreBot)) {
      pushMsg('Soy AIfred. Mientras el Sr. Wayne está ocupado hago horas extras en QuartzSales. ¿En qué puedo ayudarte?');
      return;
    }
    if (any(redes)) {
      pushMsg('Podés seguirnos en LinkedIn: <a href="https://www.linkedin.com/showcase/quartz-sales" target="_blank" rel="noopener">QuartzSales en LinkedIn</a>.');
      return;
    }
    if (any(demo)) {
      pushMsg('¡Claro! Escribinos a <a href="mailto:info@quartzsales.com">info@quartzsales.com</a> o llamanos al <a href="tel:+541152356660">+54 11 5235-6660</a>.');
      return;
    }
    if (any(tradeKeys)) {
      pushMsg('<strong>Trade Marketing en QuartzSales</strong><br>Digitalizamos la ejecución en PDV: ruteos inteligentes, checklists, control de precios y promociones, verificación de planogramas y reconocimiento de producto/precio con IA. Medimos KPIs como OSA, quiebres, SoS y cumplimiento de exhibición para accionar en tiempo real. ¿Querés una demo? <a href="mailto:info@quartzsales.com">info@quartzsales.com</a> · <a href="tel:+541152356660">+54 11 5235-6660</a>.');
      return;
    }

    // Búsqueda en FAQs
    const scored = FAQS.map(it => ({...it, _s: score(it, t)}))
      .filter(it => it._s > 0)
      .sort((a,b) => b._s - a._s);

    if (scored.length){
      const top = scored[0];
      pushMsg('<strong>' + top.q + '</strong><br>' + top.a);
    } else {
      pushMsg('No encontré una respuesta exacta. Probá con otra palabra clave o escribinos a <a href="mailto:info@quartzsales.com">info@quartzsales.com</a>.');
    }
  }

  function send(){
    const val = botInput && botInput.value;
    if(!val) return;
    pushMsg(val, true);
    botInput.value = '';
    setTimeout(() => answer(val), 200);
  }
  botSend && botSend.addEventListener('click', send);
  botInput && botInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') send(); });
  botClose && botClose.addEventListener('click', () => bot && bot.classList.add('min'));
  botFab && botFab.addEventListener('click', () => bot && bot.classList.remove('min'));

  function setBotMinState() {
    if (!bot) return;
    if (window.matchMedia('(max-width: 768px)').matches) bot.classList.add('min');
    else bot.classList.remove('min');
  }
  setBotMinState();
  window.addEventListener('resize', setBotMinState);

  // Greeting
  pushMsg('¡Hola! Soy tu asistente de FAQs. Escribí una <em>palabra clave</em> y te respondo.');
});


document.addEventListener('DOMContentLoaded', () => {
  const acc = document.querySelector('#faq-accordion');
  if (typeof renderFAQs === 'function' && acc && !acc.children.length) {
    renderFAQs(acc);
    const first = acc.querySelector('.faq-item'); if (first) first.setAttribute('open','');
  }
  const input = document.querySelector('#site-search');
  const formEl = document.querySelector('.hero-search');
  const btn   = document.querySelector('#site-search-btn');
  const chips = document.querySelector('#suggested-chips');

  let clearBtn = document.querySelector('#site-search-clear');
  if (!clearBtn) {
    clearBtn = document.createElement('button');
    clearBtn.id = 'site-search-clear';
    clearBtn.className = 'hero-search__clear';
    clearBtn.type = 'button';
    clearBtn.setAttribute('aria-label','Limpiar');
    clearBtn.hidden = true;
    clearBtn.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    const box = document.querySelector('.hero-search__box');
    const searchBtn = document.querySelector('#site-search-btn');
    if (box && searchBtn) box.insertBefore(clearBtn, searchBtn);
  }
function normalize(s){return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();}
  const SYN=[['offline','sin internet','sin conexion','sin conexión','sin datos','modo avion','modo avión'],['planograma','planogramas','planogram'],['precio','precios','etiqueta','etiquetas','price','prices'],['quiebre','quiebres','faltante','faltantes','stockout','osa'],['trade','trade marketing','marketing','pdv','punto de venta']];
  function expandTerms(term){const t=normalize(term);const set=new Set(t.split(' '));SYN.forEach(g=>{if(g.some(k=>t.includes(normalize(k))))g.forEach(k=>set.add(normalize(k)));});const all=[t,...Array.from(set).filter(x=>x.length>3)];return Array.from(new Set(all));}
  function score(it,term){const text=normalize((it.q||'')+' '+(it.a||''));const exp=expandTerms(term);let s=0;if(text.includes(normalize(term)))s+=5;exp.forEach(tok=>{if(tok&&text.includes(tok))s+=(tok.length>=6?2:1)});if(normalize(it.q||'').includes(normalize(term)))s+=3;return s;}

  function filterAndRender(term){
    if (!acc || !Array.isArray(FAQS)) return;
    const t=(term||'').trim();
    if(!t){ renderFAQs(acc, FAQS); const first=acc.querySelector('.faq-item'); if(first) first.setAttribute('open',''); return; }
    const scored=FAQS.map(it=>({...it,_s:score(it,t)})).filter(it=>it._s>0).sort((a,b)=>b._s-a._s).map(({_s,...r})=>r);
    if(scored.length){ renderFAQs(acc, scored); const first=acc.querySelector('.faq-item'); if(first) first.setAttribute('open',''); }
    else { acc.innerHTML = `<p class="no-results">No hay resultados para “${t}”. Probá con otras palabras.</p>`; }
  }
  
  function toggleClear(){
    if(!clearBtn || !input) return;
    const has = (input.value||'').trim().length > 0;
    clearBtn.toggleAttribute('hidden', !has);
    if (formEl) formEl.classList.toggle('has-query', has);
  }
function go(){ if(input) filterAndRender(input.value); }
  input && input.addEventListener('keydown', e => { if (e.key==='Enter') go(); });
  btn   && btn.addEventListener('click', go);
  
  input && input.addEventListener('input', () => {
    if ((input.value||'').trim() === '') filterAndRender('');
    toggleClear();
  });
chips && chips.addEventListener('click', e => { const b=e.target.closest('.chip'); if(!b) return; const t=b.getAttribute('data-term')||b.textContent; if(input) input.value=t; toggleClear();
  filterAndRender(t); });

  /* INIT: set initial state for clear & has-query */
  toggleClear();

  clearBtn && clearBtn.addEventListener('click', () => {
    if (!input) return;
    input.value = '';
    toggleClear();
    filterAndRender('');
    input.focus();
  });
});