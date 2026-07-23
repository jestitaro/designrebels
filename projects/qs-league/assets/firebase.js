// firebase.js — Dino Cup admin data layer
// Dedicated Firebase project (dino-cup), exclusive to this app — no longer
// shares a project with QuartzProde or the old QS League.
//
// Collections (see REGLAS.md / README.md for the full model):
//   dinocup_users      — {uid, email, role, displayName, createdAt} · client read-only, never written from here
//   dinocup_players    — roster, seeded once by an authenticated admin
//   dinocup_matches    — one doc per Kahoot report upload (DRAFT/PROCESSING/APPLIED/ERROR/ANNULLED)
//   dinocup_movements  — the real ledger (REPORT_RESULT/ABSENCE_PENALTY/REPORT_REVERSAL/PENALTY_REVERSAL)
//
// Public visitors only ever READ dinocup_players + dinocup_movements (see firestore.rules).
// Every write in here requires an authenticated ADMIN session — enforced both by
// firestore.rules/storage.rules server-side and by the UI only exposing these calls
// from assets/admin.js, never from the public assets/app.js.

const firebaseConfig = {
  apiKey: "AIzaSyAqW8HqRtLLI1eWxpNOvrXtZSVLK4c3eHU",
  authDomain: "dino-cup.firebaseapp.com",
  projectId: "dino-cup",
  storageBucket: "dino-cup.firebasestorage.app",
  messagingSenderId: "734657325277",
  appId: "1:734657325277:web:feada6f960cf17b3ead334",
  measurementId: "G-7Z2VS7KFT5"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const dcAuth = firebase.auth ? firebase.auth() : null;
const dcDb = firebase.firestore();
const dcStorage = firebase.storage ? firebase.storage() : null;

const col = {
  users: dcDb.collection('dinocup_users'),
  players: dcDb.collection('dinocup_players'),
  matches: dcDb.collection('dinocup_matches'),
  movements: dcDb.collection('dinocup_movements')
};

/* ---------- auth ---------- */
function onAuthChange(callback) {
  if (!dcAuth) { callback(null); return () => {}; }
  return dcAuth.onAuthStateChanged(async user => {
    if (!user) { callback(null); return; }
    let role = null;
    try {
      const snap = await col.users.doc(user.uid).get();
      role = snap.exists ? snap.data().role : null;
    } catch (error) {
      console.warn('Dino Cup: no pude leer el perfil de administrador.', error);
    }
    callback({
      uid: user.uid,
      email: user.email,
      role,
      isAdmin: role === 'ADMIN',
      lastSignInTime: user.metadata?.lastSignInTime || null
    });
  });
}
async function signIn(email, password) {
  if (!dcAuth) throw new Error('Firebase Auth no está disponible.');
  const credential = await dcAuth.signInWithEmailAndPassword(email, password);
  const snap = await col.users.doc(credential.user.uid).get();
  const role = snap.exists ? snap.data().role : null;
  if (role !== 'ADMIN') {
    await dcAuth.signOut();
    throw new Error('Esta cuenta no tiene permisos de administrador.');
  }
  return credential.user;
}
function signOut() {
  return dcAuth ? dcAuth.signOut() : Promise.resolve();
}

/* ---------- public reads ---------- */
function subscribePlayers(callback) {
  return col.players.onSnapshot(
    snapshot => callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
    error => console.warn('Dino Cup: no pude leer el roster.', error)
  );
}
function subscribeAppliedMovements(callback) {
  return col.movements.where('status', '==', 'APPLIED').onSnapshot(
    snapshot => callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
    error => console.warn('Dino Cup: no pude leer los movimientos.', error)
  );
}

/* ---------- admin reads ---------- */
function subscribeAllMovements(callback) {
  return col.movements.orderBy('createdAt', 'desc').onSnapshot(
    snapshot => callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
    error => console.warn('Dino Cup admin: no pude leer los movimientos.', error)
  );
}
function subscribeMatches(callback) {
  return col.matches.orderBy('uploadedAt', 'desc').onSnapshot(
    snapshot => callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
    error => console.warn('Dino Cup admin: no pude leer las cargas.', error)
  );
}
async function findMatchByFileHash(fileHash) {
  const snap = await col.matches.where('fileHash', '==', fileHash).where('status', '==', 'APPLIED').limit(1).get();
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}
async function findMatchByDate(sessionDate) {
  const snap = await col.matches.where('sessionDate', '==', sessionDate).where('status', '==', 'APPLIED').limit(1).get();
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

/* ---------- roster bootstrap (admin-only, runs once if the collection is empty) ---------- */
async function ensureRosterSeeded(roster) {
  const snap = await col.players.limit(1).get();
  if (!snap.empty) return;
  const batch = dcDb.batch();
  roster.forEach(person => {
    batch.set(col.players.doc(person.id), {
      id: person.id,
      name: person.name,
      alias: person.aliases || [],
      house: person.house,
      role: person.role || '',
      isActive: true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  });
  await batch.commit();
}

/* ---------- storage: original report files ---------- */
async function uploadOriginalFile(matchId, file) {
  if (!dcStorage) throw new Error('Firebase Storage no está disponible.');
  const path = `dinocup_reports/${matchId}/${file.name}`;
  const ref = dcStorage.ref(path);
  await ref.put(file, { contentType: file.type || 'application/octet-stream' });
  const url = await ref.getDownloadURL();
  return { path, url };
}

/* ---------- match + movement writes (admin-only) ---------- */
function newMovementRef() { return col.movements.doc(); }
function newMatchRef() { return col.matches.doc(); }

async function createMatchDraft(matchId, data) {
  await col.matches.doc(matchId).set({
    status: 'PROCESSING',
    relatedMovementIds: [],
    ...data,
    uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

async function applyMatchWithMovements({ matchId, movements }) {
  const batch = dcDb.batch();
  const movementIds = [];
  movements.forEach(movement => {
    const ref = newMovementRef();
    movementIds.push(ref.id);
    batch.set(ref, { ...movement, status: 'APPLIED', createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  });
  batch.update(col.matches.doc(matchId), {
    status: 'APPLIED',
    relatedMovementIds: movementIds,
    appliedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  await batch.commit();
  return movementIds;
}

async function markMatchError(matchId, message) {
  await col.matches.doc(matchId).update({
    status: 'ERROR',
    errorMessage: String(message || 'Error desconocido'),
    erroredAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

async function createManualPenalties(entries) {
  const batch = dcDb.batch();
  const ids = [];
  entries.forEach(entry => {
    const ref = newMovementRef();
    ids.push(ref.id);
    batch.set(ref, {
      type: 'ABSENCE_PENALTY',
      sourceType: 'MANUAL_PENALTY',
      sourceId: null,
      status: 'APPLIED',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      ...entry
    });
  });
  await batch.commit();
  return ids;
}

async function annulMatch({ match, reason, adminUid, adminEmail }) {
  if (match.status !== 'APPLIED') throw new Error('Solo se puede anular una carga aplicada.');
  const movementsSnap = await col.movements
    .where('sourceId', '==', match.id)
    .where('status', '==', 'APPLIED')
    .get();

  const batch = dcDb.batch();
  movementsSnap.docs.forEach(doc => {
    const original = doc.data();
    const reversalType = original.type === 'REPORT_RESULT' ? 'REPORT_REVERSAL' : 'PENALTY_REVERSAL';
    const reversalRef = newMovementRef();
    batch.set(reversalRef, {
      type: reversalType,
      playerId: original.playerId,
      playerName: original.playerName,
      points: -original.points,
      reason: `Anulación · ${reason}`,
      sourceType: original.sourceType,
      sourceId: original.sourceId,
      status: 'APPLIED',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: adminUid,
      createdByEmail: adminEmail
    });
    batch.update(doc.ref, {
      status: 'ANNULLED',
      annulledAt: firebase.firestore.FieldValue.serverTimestamp(),
      annulledBy: adminUid,
      annulmentMovementId: reversalRef.id
    });
  });
  batch.update(col.matches.doc(match.id), {
    status: 'ANNULLED',
    annulledAt: firebase.firestore.FieldValue.serverTimestamp(),
    annulledBy: adminUid,
    annulmentReason: reason
  });
  await batch.commit();
}

async function annulMovement({ movement, reason, adminUid, adminEmail }) {
  if (movement.status !== 'APPLIED') throw new Error('Este movimiento ya no está activo.');
  const batch = dcDb.batch();
  const reversalRef = newMovementRef();
  batch.set(reversalRef, {
    type: 'PENALTY_REVERSAL',
    playerId: movement.playerId,
    playerName: movement.playerName,
    points: -movement.points,
    reason: `Anulación · ${reason}`,
    sourceType: movement.sourceType,
    sourceId: movement.sourceId,
    status: 'APPLIED',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    createdBy: adminUid,
    createdByEmail: adminEmail
  });
  batch.update(col.movements.doc(movement.id), {
    status: 'ANNULLED',
    annulledAt: firebase.firestore.FieldValue.serverTimestamp(),
    annulledBy: adminUid,
    annulmentMovementId: reversalRef.id
  });
  await batch.commit();
}

window.DinoCupFirebase = {
  auth: { onAuthChange, signIn, signOut },
  players: { subscribe: subscribePlayers, ensureSeeded: ensureRosterSeeded },
  movements: {
    subscribeApplied: subscribeAppliedMovements,
    subscribeAll: subscribeAllMovements,
    createManualPenalties,
    annul: annulMovement
  },
  matches: {
    subscribe: subscribeMatches,
    findByFileHash: findMatchByFileHash,
    findByDate: findMatchByDate,
    newRef: newMatchRef,
    createDraft: createMatchDraft,
    applyWithMovements: applyMatchWithMovements,
    markError: markMatchError,
    annul: annulMatch
  },
  storage: { uploadOriginalFile }
};

console.log('✓ Dino Cup Firebase listo');
