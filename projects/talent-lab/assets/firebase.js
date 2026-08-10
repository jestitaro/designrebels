// firebase.js — Talent Lab data layer
// Dedicated Firebase project (talent-lab-quartzsales), exclusive to this app.
//
// Collections (see README.md for the full model):
//   talentlab_profiles  — {uid, email, displayName, createdAt} · public read, each user writes only their own doc
//   talentlab_labs      — {id, name, tagline, description, category, links, ownerUid, ownerName, createdAt, updatedAt}
//   talentlab_updates   — {id, labId, authorUid, authorName, title, body, createdAt} · only the Lab's owner can create
//   talentlab_feedback  — {id, labId, updateId, authorUid, authorName, rating(1-5), comment, createdAt}
//
// Nothing is edited or deleted from the client in v1 — see README "Pendiente".
// Every rule enforced here is mirrored (and is the real source of truth) in firestore.rules.

const firebaseConfig = {
  apiKey: "REEMPLAZAR_API_KEY",
  authDomain: "talent-lab-quartzsales.firebaseapp.com",
  projectId: "talent-lab-quartzsales",
  storageBucket: "talent-lab-quartzsales.firebasestorage.app",
  messagingSenderId: "REEMPLAZAR_SENDER_ID",
  appId: "REEMPLAZAR_APP_ID"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const tlAuth = firebase.auth ? firebase.auth() : null;
const tlDb = firebase.firestore();

const col = {
  profiles: tlDb.collection('talentlab_profiles'),
  labs: tlDb.collection('talentlab_labs'),
  updates: tlDb.collection('talentlab_updates'),
  feedback: tlDb.collection('talentlab_feedback')
};

/* ---------- auth + profile ---------- */
function onAuthChange(callback) {
  if (!tlAuth) { callback(null); return () => {}; }
  return tlAuth.onAuthStateChanged(async user => {
    if (!user) { callback(null); return; }
    let profile = null;
    try {
      const snap = await col.profiles.doc(user.uid).get();
      profile = snap.exists ? snap.data() : null;
    } catch (error) {
      console.warn('Talent Lab: no pude leer el perfil.', error);
    }
    callback({ uid: user.uid, email: user.email, displayName: profile?.displayName || user.email.split('@')[0] });
  });
}

async function ensureProfile(user, displayName) {
  const ref = col.profiles.doc(user.uid);
  const snap = await ref.get();
  if (snap.exists) return snap.data();
  const profile = {
    uid: user.uid,
    email: user.email,
    displayName: displayName || user.email.split('@')[0],
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  await ref.set(profile);
  return profile;
}

async function signUp(email, password, displayName) {
  if (!tlAuth) throw new Error('Firebase Auth no está disponible.');
  const credential = await tlAuth.createUserWithEmailAndPassword(email, password);
  await ensureProfile(credential.user, displayName);
  return { uid: credential.user.uid, email: credential.user.email, displayName: displayName || credential.user.email.split('@')[0] };
}

async function signIn(email, password) {
  if (!tlAuth) throw new Error('Firebase Auth no está disponible.');
  const credential = await tlAuth.signInWithEmailAndPassword(email, password);
  const snap = await col.profiles.doc(credential.user.uid).get();
  const profile = snap.exists ? snap.data() : await ensureProfile(credential.user);
  return { uid: credential.user.uid, email: credential.user.email, displayName: profile.displayName };
}

function signOut() {
  return tlAuth ? tlAuth.signOut() : Promise.resolve();
}

/* ---------- labs ---------- */
function subscribeLabs(callback) {
  return col.labs.orderBy('createdAt', 'desc').onSnapshot(
    snapshot => callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
    error => console.warn('Talent Lab: no pude leer los labs.', error)
  );
}

async function createLab({ ownerUid, ownerName, name, tagline, description, category, links }) {
  const ref = col.labs.doc();
  await ref.set({
    id: ref.id,
    ownerUid,
    ownerName,
    name,
    tagline,
    description,
    category,
    links: links || [],
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  return ref.id;
}

/* ---------- updates ---------- */
function subscribeUpdatesForLab(labId, callback) {
  return col.updates.where('labId', '==', labId).orderBy('createdAt', 'desc').onSnapshot(
    snapshot => callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
    error => console.warn('Talent Lab: no pude leer las actualizaciones.', error)
  );
}

async function postUpdate({ labId, authorUid, authorName, title, body }) {
  const ref = col.updates.doc();
  await ref.set({
    id: ref.id,
    labId,
    authorUid,
    authorName,
    title,
    body,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  return ref.id;
}

/* ---------- feedback ---------- */
function subscribeFeedbackForLab(labId, callback) {
  return col.feedback.where('labId', '==', labId).orderBy('createdAt', 'desc').onSnapshot(
    snapshot => callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
    error => console.warn('Talent Lab: no pude leer el feedback.', error)
  );
}

async function leaveFeedback({ labId, updateId, authorUid, authorName, rating, comment }) {
  const ref = col.feedback.doc();
  await ref.set({
    id: ref.id,
    labId,
    updateId,
    authorUid,
    authorName,
    rating,
    comment: comment || '',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  return ref.id;
}

window.TalentLabFirebase = {
  auth: { onAuthChange, signUp, signIn, signOut },
  labs: { subscribe: subscribeLabs, create: createLab },
  updates: { subscribeForLab: subscribeUpdatesForLab, post: postUpdate },
  feedback: { subscribeForLab: subscribeFeedbackForLab, leave: leaveFeedback }
};

console.log('✓ Talent Lab Firebase listo');
