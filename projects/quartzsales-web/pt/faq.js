/* =========================
   FAQs data
========================= */
const FAQS = [
  {"q": "O que é a QuartzSales?", "a": "A QuartzSales é uma solução de software móvel e web projetada para alcançar a loja perfeita e otimizar a execução no PDV. Nosso software oferece uma plataforma amigável e intuitiva que permite organizar seus processos de forma eficiente. Além disso, com a QuartzSales você potencializa a comunicação e a gestão do seu time de vendas, obtém informações detalhadas sobre o PDV (PDV 360) e centraliza dados relevantes para ter uma visão estratégica o tempo todo."},
  {"q": "Quais são os benefícios de usar a QuartzSales?", "a": "Mais eficiência: a QuartzSales ajuda a otimizar processos, aumentando a produtividade e economizando tempo do time. Decisões informadas: com uma visão completa e detalhada do desempenho no PDV, você toma decisões estratégicas baseadas em dados reais e objetivos. Adaptabilidade e personalização: a plataforma se adapta às suas necessidades e é totalmente personalizável. Mais visibilidade no PDV e colaboração/comunicação efetiva entre equipes."},
  {"q": "Quais são as funcionalidades-chave da QuartzSales?", "a": "Execução no Ponto de Venda / Retail Execution: roteiros e visitas; formulários e captura de informações; planogramas. Comunicação e gestão do time de vendas: novidades, metas e incentivos, treinamentos, licenças e substituições. PDV 360: indicadores (OSA, SoS, eficiência, lançamentos, preços, vendas), equipe, portfólio/sortimento e itens obrigatórios, notas, vencimentos, vendas e estoque. Informação centralizada: sellout e estoque de redes. Análise preditiva e geração de tarefas inteligentes. IA para reconhecimento de produtos e preços. Integração com plataformas de BI."},
  {"q": "A QuartzSales é compatível com outras ferramentas e sistemas?", "a": "Sim. Integra com CRM, ERP (por exemplo SAP / SAP B1) e outras soluções que você já utiliza. É uma plataforma versátil e compatível, que se adapta às necessidades e requisitos da sua empresa."},
  {"q": "Como posso solicitar uma demonstração da QuartzSales?", "a": "Envie um e-mail para <a href=\"mailto:info@quartzsales.com\">info@quartzsales.com</a> ou ligue para <a href=\"tel:+541152356660\">+54 11 5235-6660</a> e agendamos uma demo personalizada."},
  {"q": "A QuartzSales oferece suporte técnico e treinamento?", "a": "Sim. Oferecemos suporte técnico e treinamento para você aproveitar ao máximo a plataforma."},
  {"q": "A QuartzSales é uma solução personalizável?", "a": "Sim. É altamente personalizável de acordo com os processos e preferências de cada empresa."},
  {"q": "A QuartzSales funciona sem internet?", "a": "Sim. Funciona online e offline, permitindo continuar usando a plataforma mesmo sem conexão."},
  {"q": "A QuartzSales funciona em Android e iOS?", "a": "Sim. É compatível tanto com Android quanto com iOS."},
  {"q": "O que a Inteligência Artificial (IA) faz na QuartzSales?", "a": "A IA automatiza tarefas-chave no PDV: reconhecimento visual de produtos e preços, verificação de planogramas, priorização de tarefas e um assistente que sugere ações em cada ponto de venda."},
  {"q": "Vocês detectam rupturas e presença com IA?", "a": "Sim. Com uma foto, a IA identifica rupturas, presença e métricas como OSA ou share de exposição em segundos, reduzindo tempo e erros."},
  {"q": "Vocês conseguem ler etiquetas de preço com IA?", "a": "Sim. A IA reconhece produto e preço a partir de etiquetas para acelerar auditorias e comparar seus preços com os da concorrência."},
  {"q": "Vocês verificam planogramas com IA?", "a": "Sim. A IA compara a gôndola real com o planograma esperado, detecta desvios de posição e propõe correções para garantir o cumprimento."},
  {"q": "O que é o AiFred e como ele usa IA?", "a": "O AiFred é o assistente virtual que prioriza tarefas com IA, responde perguntas operacionais e recomenda próximos passos em tempo real para cada PDV."},
  {"q": "Qual o impacto da IA nos resultados?", "a": "Implementações relatam maior produtividade, redução do tempo de captura e melhor visibilidade da execução na gôndola graças à IA."},
  {"q": "Como a IA se integra aos meus dados?", "a": "A IA se alimenta de cadastros (produtos, PDVs, listas de preços), inventário e vendas; e integra com ERP/CRM e BI para contextualizar recomendações."},
  {"q": "A IA funciona offline?", "a": "Sim. Várias rotinas móveis de IA podem operar offline e sincronizar quando a conexão voltar, mantendo o trabalho em campo."},
  {"q": "Quais considerações de segurança existem para a IA?", "a": "Aplicamos controle de acesso, criptografia em trânsito e em repouso e governança de dados para proteger as informações usadas pela IA."},
  {"q": "O que é Trade Marketing?", "a": "É a disciplina que conecta marketing e vendas no canal, garantindo disponibilidade, visibilidade e execução de marca no PDV para impulsionar giro e participação."},
  {"q": "Como a QuartzSales ajuda o Trade Marketing?", "a": "Digitalizamos a execução: roteirização inteligente, checklists e formulários, controle de preços e promoções, verificação de planogramas, reconhecimento de produto/preço com IA e painéis PDV 360 para agir sobre desvios em tempo real."},
  {"q": "Quais KPIs de Trade Marketing posso medir com a QuartzSales?", "a": "OSA (On Shelf Availability), share de exposição/SoS, preços e rupturas, cumprimento de planograma, execução de promoções, facing por categoria, tempos de visita e efetividade do roteiro."},
  {"q": "A QuartzSales melhora a coordenação com equipes de campo e clientes?", "a": "Sim. Centraliza informações, comunica metas e incentivos, gerencia licenças e substituições e compartilha relatórios com contas-chave para alinhar ações no PDV."}
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
      pushMsg('Olá! Diga o que você está procurando e eu te ajudo.');
      return;
    }
    if (any(gracias)) {
      pushMsg('De nada—foi um prazer ajudar.');
      return;
    }
    if (any(nombreBot)) {
      pushMsg('Sou o AIfred. Enquanto o Sr. Wayne está ocupado, faço horas extras na QuartzSales. Em que posso ajudar?');
      return;
    }
    if (any(redes)) {
      pushMsg('Você pode nos seguir no LinkedIn: <a href="https://www.linkedin.com/showcase/quartz-sales" target="_blank" rel="noopener">QuartzSales en LinkedIn</a>.');
      return;
    }
    if (any(demo)) {
      pushMsg('Claro! Envie um e-mail para <a href="mailto:info@quartzsales.com">info@quartzsales.com</a> o llamanos al <a href="tel:+541152356660">+54 11 5235-6660</a>.');
      return;
    }
    if (any(tradeKeys)) {
      pushMsg('<strong>Trade Marketing na QuartzSales</strong><br>Digitalizamos a execução no PDV: ruteos inteligentes, checklists, control de precios y promociones, verificación de planogramas y reconocimiento de producto/precio con IA. Medimos KPIs como OSA, quiebres, SoS y cumplimiento de exhibición para accionar en tiempo real. Quer uma demo? <a href="mailto:info@quartzsales.com">info@quartzsales.com</a> · <a href="tel:+541152356660">+54 11 5235-6660</a>.');
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
      pushMsg('Não encontrei uma resposta exata. Tente outra palavra-chave ou envie um e-mail para <a href="mailto:info@quartzsales.com">info@quartzsales.com</a>.');
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
  pushMsg('Olá! Sou seu assistente de FAQs. Digite uma <em>palavra-chave</em> e eu respondo.');
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
    clearBtn.setAttribute('aria-label','Limpar');
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
    else { acc.innerHTML = `<p class="no-results">Não há resultados para “${t}”. Tente outras palavras.</p>`; }
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