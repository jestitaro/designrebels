/* =========================
   FAQs data
========================= */
const FAQS = [
  {"q": "What is QuartzSales?", "a": "QuartzSales is a mobile and web software solution designed to achieve the perfect store and optimize POS execution. Our mobile and web software offers a friendly, intuitive platform that helps you organize processes efficiently. With QuartzSales you can also boost communication and management for your sales team, obtain detailed POS insights (POS 360) and centralize relevant information so you always have a strategic view."},
  {"q": "What are the benefits of using QuartzSales?", "a": "Improved efficiency: QuartzSales helps you optimize processes, resulting in higher productivity and time savings for your team. Informed decision-making: Thanks to a complete and detailed view of POS performance, you can make strategic decisions based on real, objective data. Adaptability and customization: QuartzSales adapts to your specific needs and is fully customizable. Greater in-store visibility and effective collaboration/communication between teams."},
  {"q": "What are QuartzSales’ key features?", "a": "Point of Sale / Retail Execution: routes and visits; forms and data capture; planograms. Sales team communication and management: news, goals and incentives, training, leaves and replacements. POS 360: indicators (OSA, SoS, efficiency, launches, prices, sales), team, portfolio/assortment and must-haves, notes, expirations, sales and stock. Centralized information: sellout and chain stock. Predictive analytics and smart task generation. AI for product and price recognition. Integration with BI platforms."},
  {"q": "Is QuartzSales compatible with other tools and systems?", "a": "Yes. It integrates with CRM, ERP (for example SAP / SAP B1) and other solutions you already use. It’s a versatile, compatible platform that adapts to your company’s needs and requirements."},
  {"q": "How can I request a QuartzSales demo?", "a": "Email us at <a href=\"mailto:info@quartzsales.com\">info@quartzsales.com</a> or call us at <a href=\"tel:+541152356660\">+54 11 5235-6660</a> and we’ll schedule a personalized demo."},
  {"q": "Does QuartzSales provide technical support and training?", "a": "Yes. We provide technical support and training so you can get the most out of the platform."},
  {"q": "Is QuartzSales customizable?", "a": "Yes. It is highly customizable to each company’s processes and preferences."},
  {"q": "Does QuartzSales work without an internet connection?", "a": "Yes. It works online and offline, so you can keep using the platform even without connectivity."},
  {"q": "Does QuartzSales work on Android and iOS?", "a": "Yes. It is compatible with both Android and iOS."},
  {"q": "What does AI do in QuartzSales?", "a": "AI automates key in-store tasks: visual recognition of products and prices, planogram verification, task prioritization, and an assistant that suggests actions at each point of sale."},
  {"q": "Can you detect out-of-stocks and presence with AI?", "a": "Yes. With a photo, AI identifies out-of-stocks, presence and metrics like OSA or share of display in seconds, reducing time and errors."},
  {"q": "Can you read price labels with AI?", "a": "Yes. AI recognizes product and price from labels to speed up audits and compare your prices with competitors."},
  {"q": "Do you verify planograms with AI?", "a": "Yes. AI compares the real shelf to the expected planogram, detects placement deviations and proposes corrections to ensure compliance."},
  {"q": "What is AiFred and how does it use AI?", "a": "AiFred is the virtual assistant that prioritizes tasks with AI, answers operational questions and recommends next steps in real time for each POS."},
  {"q": "What impact does AI have on results?", "a": "Implementations report higher productivity, reduced capture time and better execution visibility on shelf thanks to AI."},
  {"q": "How does AI integrate with my data?", "a": "AI is fed by master data (products, POS, price lists), inventory and sales; and integrates with ERP/CRM and BI to contextualize recommendations."},
  {"q": "Does AI work offline?", "a": "Yes. Several mobile AI routines can operate offline and sync when connectivity returns, keeping field work moving."},
  {"q": "What security considerations apply to AI?", "a": "We apply access control, encryption in transit and at rest, and data governance to protect the information used by AI."},
  {"q": "What is Trade Marketing?", "a": "It’s the discipline that connects marketing and sales in the channel, ensuring availability, visibility and brand execution at the POS to drive rotation and share."},
  {"q": "How does QuartzSales help Trade Marketing?", "a": "We digitize execution: smart routing, checklists and forms, price and promo control, planogram verification, AI product/price recognition, and POS 360 dashboards to act on deviations in real time."},
  {"q": "Which Trade Marketing KPIs can I measure with QuartzSales?", "a": "OSA (On Shelf Availability), share of display/SoS, prices and stockouts, planogram compliance, promotion execution, facing by category, visit times and routing effectiveness."},
  {"q": "Does QuartzSales improve coordination with field teams and clients?", "a": "Yes. It centralizes information, communicates goals and incentives, manages leaves and replacements, and shares reports with key accounts to align actions at the POS."}
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
      pushMsg('Hi! Tell me what you’re looking for and I’ll help.');
      return;
    }
    if (any(gracias)) {
      pushMsg('You’re welcome—happy to help.');
      return;
    }
    if (any(nombreBot)) {
      pushMsg('I’m AIfred. While Mr. Wayne is busy, I’m pulling extra shifts at QuartzSales. How can I help?');
      return;
    }
    if (any(redes)) {
      pushMsg('You can follow us on LinkedIn: <a href="https://www.linkedin.com/showcase/quartz-sales" target="_blank" rel="noopener">QuartzSales en LinkedIn</a>.');
      return;
    }
    if (any(demo)) {
      pushMsg('Sure! Email us at <a href="mailto:info@quartzsales.com">info@quartzsales.com</a> o llamanos al <a href="tel:+541152356660">+54 11 5235-6660</a>.');
      return;
    }
    if (any(tradeKeys)) {
      pushMsg('<strong>Trade Marketing at QuartzSales</strong><br>We digitize in-store execution: ruteos inteligentes, checklists, control de precios y promociones, verificación de planogramas y reconocimiento de producto/precio con IA. Medimos KPIs como OSA, quiebres, SoS y cumplimiento de exhibición para accionar en tiempo real. Want a demo? <a href="mailto:info@quartzsales.com">info@quartzsales.com</a> · <a href="tel:+541152356660">+54 11 5235-6660</a>.');
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
      pushMsg('I couldn’t find an exact match. Try another keyword or email us at <a href="mailto:info@quartzsales.com">info@quartzsales.com</a>.');
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
  pushMsg('Hi! I’m your FAQ assistant. Type a <em>keyword</em> and I’ll answer.');
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
    clearBtn.setAttribute('aria-label','Clear');
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
    else { acc.innerHTML = `<p class="no-results">No results for “${t}”. Try different keywords.</p>`; }
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