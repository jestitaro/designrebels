// firebase.js — Dino Cup (formerly QS League)
// Reuses the same Firebase project as QuartzProde (prode2026/firebase.js),
// under its own collection so it never touches Prode's data.

const firebaseConfig = {
  apiKey: "AIzaSyBCt4aNLAiajTJIvM5CpVhQvnyiX15Vkqg",
  authDomain: "quartzprode2026.firebaseapp.com",
  projectId: "quartzprode2026",
  storageBucket: "quartzprode2026.firebasestorage.app",
  messagingSenderId: "616224313629",
  appId: "1:616224313629:web:5cad77efab7eb2506b51f4"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const qsDb = firebase.firestore();
const qsDocRef = qsDb.collection('qsleague_state').doc('season02');

window.qsDbLoadState = async function () {
  const snap = await qsDocRef.get();
  return snap.exists ? snap.data() : null;
};

window.qsDbSaveState = async function (state) {
  await qsDocRef.set({
    imports: state.imports || [],
    manual: state.manual || [],
    updatedAt: Date.now()
  });
};

window.qsDbSubscribe = function (onChange) {
  return qsDocRef.onSnapshot(
    snap => onChange(snap.exists ? snap.data() : null),
    error => console.warn('QS League: live sync desconectado.', error)
  );
};

console.log('✓ QS League Firebase listo');
