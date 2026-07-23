/* Dino Cup — roster, houses and shared formatting helpers.
   Loaded before app.js/admin.js; exposes window.DinoCupData. */
(function () {
  const norm = value => String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const fmt = value => new Intl.NumberFormat('es-AR').format(value || 0);
  const MINUS = '−';
  function fmtPoints(value) {
    const abs = Math.abs(value);
    const unit = abs === 1 ? 'pt' : 'pts';
    return `${value < 0 ? MINUS : ''}${fmt(abs)} ${unit}`;
  }

  const HOUSES = {
    slytherin: { name: 'Slytherin', avatarClass: 'green' },
    hufflepuff: { name: 'Hufflepuff', avatarClass: 'yellow' },
    ravenclaw: { name: 'Ravenclaw', avatarClass: 'blue' },
    gryffindor: { name: 'Gryffindor', avatarClass: 'red' }
  };
  function house(id) { return HOUSES[id] || { name: 'Sin casa', avatarClass: 'blue' }; }

  /* Houses confirmed against quartzsales.com/hogquartz/salacomun/ (2026-07-17).
     Aliases are the authoritative nickname list the team actually uses in
     Kahoot exports (2026-07-23) — used to auto-match report rows/filenames. */
  const ROSTER = [
    { id: 'javi', name: 'Javi', fullName: 'Javier De Vergilio', role: '', house: 'gryffindor', aliases: ['Javi', 'Javier', 'Javier De Vergilio'] },
    { id: 'mayra', name: 'May', fullName: 'Mayra Milanesio', role: '', house: 'gryffindor', aliases: ['May', 'Mayra', 'Mayra Milanesio'] },
    { id: 'nico', name: 'Nico', fullName: 'Nicolas Rivero Segura', role: 'Integrator / COO', house: 'slytherin', aliases: ['Nico', 'Nicho', 'Nicolas', 'Nicolás', 'Nicolas Rivero Segura'] },
    { id: 'pablo', name: 'Pablo', fullName: 'Pablo Hernan Gimenez', role: 'Visionary / CEO', house: 'slytherin', aliases: ['Pablo', 'Tuki', 'Pablo Hernan Gimenez', 'Pablo Gimenez'] },
    { id: 'agustin', name: 'Agustin', fullName: 'Agustin Goñi Piuma', role: 'Director Comercial', house: 'slytherin', aliases: ['Agustin', 'Agustín', 'Agus', 'Heroe', 'Agustin Goñi Piuma'] },
    { id: 'alejandro', name: 'Ale', fullName: 'Alejandro Frank', role: '', house: 'hufflepuff', aliases: ['Ale', 'Alejandro', 'Alejandro Frank'] },
    { id: 'eugenio', name: 'Euge', fullName: 'Eugenio Balbastro Fages', role: 'Líder técnico', house: 'ravenclaw', aliases: ['Euge', 'Eugenio', 'Eugenio Balbastro Fages'] },
    { id: 'juli', name: 'Juli', fullName: 'Juli Piccioni', role: '', house: 'ravenclaw', aliases: ['Juli', 'July', 'Picci', 'Julieta', 'Juli Piccioni'] },
    { id: 'lucrecia', name: 'Lucre', fullName: 'Lucrecia Moralejo', role: '', house: 'hufflepuff', aliases: ['Lucre', 'Luly', 'Lucrecia', 'Lucrecia Moralejo'] },
    { id: 'sebas', name: 'Sebas', fullName: 'Sebastian Carnota', role: '', house: 'ravenclaw', aliases: ['Sebas', 'Sebi', 'Sebastian', 'Sebastián', 'Sebastian Carnota'] },
    { id: 'jesica', name: 'Jesi', fullName: 'Jesica Titaro', role: 'Rebel Designer', house: 'gryffindor', aliases: ['Jesi', 'Jes', 'Jesica', 'Jesica Titaro'] }
  ];
  function player(id) { return ROSTER.find(item => item.id === id); }
  function findPlayerByNickname(nick) {
    const n = norm(nick);
    if (!n) return null;
    return ROSTER.find(p => [p.id, p.name, p.fullName, ...p.aliases].some(alias => norm(alias) === n)) || null;
  }

  const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function longDate(isoDate) {
    const [year, month, day] = isoDate.split('-').map(Number);
    return `${String(day).padStart(2, '0')} de ${MONTHS_ES[month - 1]} ${year}`;
  }
  function shortDate(isoDate) {
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  }
  function award(rank) {
    if (rank === 1) return { delta: 3, key: 'gold' };
    if (rank === 2) return { delta: 2, key: 'silver' };
    if (rank === 3) return { delta: 1, key: 'bronze' };
    return { delta: 0, key: null };
  }

  window.DinoCupData = {
    norm, fmt, fmtPoints, MINUS,
    HOUSES, house, ROSTER, player, findPlayerByNickname,
    MONTHS_ES, longDate, shortDate, award
  };
})();
