// firebase.js — QuartzProde 2026
// Se ejecuta DESPUÉS de que los scripts compat ya cargaron (están antes en el HTML)

const firebaseConfig = {
  apiKey:            "AIzaSyBCt4aNLAiajTJIvM5CpVhQvnyiX15Vkqg",
  authDomain:        "quartzprode2026.firebaseapp.com",
  projectId:         "quartzprode2026",
  storageBucket:     "quartzprode2026.firebasestorage.app",
  messagingSenderId: "616224313629",
  appId:             "1:616224313629:web:5cad77efab7eb2506b51f4"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

window.dbSaveUser = async function(user) {
  const id  = user.email.trim().toLowerCase();
  const ref = db.collection("usuarios").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    // Primera vez — guarda todo incluyendo la contraseña
    await ref.set({
      nombre: user.nombre, email: id, casa: user.casa,
      password: user.password, creadoEn: Date.now()
    });
    return 'created';
  }
  // Ya existe — verificar contraseña
  const storedPass = snap.data().password;
  if (storedPass && storedPass !== user.password) return 'wrong_password';
  // Si no tenía contraseña aún, la setea
  if (!storedPass) await ref.update({ password: user.password });
  return 'ok';
};

// Devuelve el usuario guardado para re-login desde localStorage
window.dbGetUser = async function(email) {
  const snap = await db.collection("usuarios").doc(email.trim().toLowerCase()).get();
  if (!snap.exists) return null;
  return snap.data();
};

window.dbGetMyPreds = async function(emailRaw) {
  const email = emailRaw.trim().toLowerCase();
  const snaps = await db.collection("predicciones").get();
  const result = {};
  snaps.forEach(s => {
    const d = s.data();
    if (d.email === email) result[Number(d.matchId)] = { signo: d.signo };
  });
  return result;
};

window.dbSavePred = async function(matchId, signo) {
  const email = window._currentUserEmail;
  await db.collection("predicciones").doc(`${email}_${matchId}`).set(
    { email, matchId, signo, timestamp: Date.now() },
    { merge: true }
  );
};

window.dbGetAllPreds = async function() {
  const snaps = await db.collection("predicciones").get();
  const result = [];
  snaps.forEach(s => result.push(s.data()));
  return result;
};

window.dbGetResultados = async function() {
  const snaps = await db.collection("resultados").get();
  const result = {};
  snaps.forEach(s => { result[s.id] = s.data(); });
  return result;
};

window.dbSaveResultado = async function(matchId, signo) {
  await db.collection("resultados").doc(String(matchId)).set(
    { signo, estado: "Finalizado", timestamp: Date.now() }
  );
};

window.dbGetFasesHabilitadas = async function() {
  try {
    const snap = await db.collection("config").doc("fases").get();
    if (snap.exists && snap.data().habilitadas) return snap.data().habilitadas;
  } catch(e) {
    console.warn('Error cargando fases:', e);
  }
  return ["Fase de Grupos"];
};

window.dbSetFasesHabilitadas = async function(fases) {
  await db.collection("config").doc("fases").set({
    habilitadas: fases,
    updatedAt: Date.now()
  });
};

window.dbGetAllUsers = async function() {
  const snaps = await db.collection("usuarios").get();
  const result = [];
  snaps.forEach(s => result.push({ id: s.id, ...s.data() }));
  return result;
};

console.log('✓ Firebase listo');
