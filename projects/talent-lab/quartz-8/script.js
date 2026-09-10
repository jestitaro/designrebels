const modal = document.getElementById('startModal');
const toast = document.getElementById('toast');
const heroDeck = document.getElementById('heroDeck');

function openModal(){
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  setTimeout(()=>document.getElementById('ideaInput').focus(),120);
}
function closeModal(){
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
}

document.querySelectorAll('[data-start]').forEach(btn=>btn.addEventListener('click',openModal));
document.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',closeModal));
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeModal(); });

document.querySelectorAll('.mode').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.mode').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
  });
});

document.getElementById('shuffleBtn').addEventListener('click',()=>{
  const input = document.getElementById('ideaInput');
  const count = document.querySelector('.mode.active').dataset.count;
  if(!input.value.trim()){
    input.focus();
    input.style.borderColor = '#7025e0';
    return;
  }
  closeModal();
  heroDeck.classList.add('shuffle');
  toast.textContent = `✦ Sesión de ${count} cartas preparada`;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),2600);
  setTimeout(()=>heroDeck.classList.remove('shuffle'),900);
});

document.querySelectorAll('.deck-card').forEach(card=>{
  card.addEventListener('click',()=>{
    const name = card.dataset.deck;
    toast.textContent = `Mazo "${name}" seleccionado`;
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'),1800);
  });
});

const observer = new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.animate([
        {opacity:0, transform:'translateY(24px)'},
        {opacity:1, transform:'translateY(0)'}
      ],{duration:650,easing:'cubic-bezier(.2,.7,.2,1)',fill:'both'});
      observer.unobserve(entry.target);
    }
  });
},{threshold:.12});

document.querySelectorAll('.step-card,.deck-card,.workspace-card,.manifesto-card').forEach(el=>observer.observe(el));

const style = document.createElement('style');
style.textContent = `
  .deck.shuffle .card-1{animation:shuffleA .75s ease}
  .deck.shuffle .card-2{animation:shuffleB .75s ease}
  .deck.shuffle .card-3{animation:shuffleC .75s ease}
  @keyframes shuffleA{40%{transform:rotate(15deg) translate(140px,-15px)}}
  @keyframes shuffleB{40%{transform:rotate(-18deg) translate(-150px,20px)}}
  @keyframes shuffleC{40%{transform:rotate(8deg) translateY(-35px)}}
`;
document.head.appendChild(style);
