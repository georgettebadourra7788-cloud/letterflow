import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

// ---- users/{uid} profile ----

export function watchProfile(uid, callback) {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

export function saveProfile(uid, data) {
  return setDoc(doc(db, 'users', uid), data, { merge: true });
}

// ---- users/{uid}/students ----

function studentsRef(uid) {
  return collection(db, 'users', uid, 'students');
}

export function watchStudents(uid, callback) {
  const q = query(studentsRef(uid), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function getStudent(uid, studentId) {
  const snap = await getDoc(doc(db, 'users', uid, 'students', studentId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Creates the student and bumps the user's lifetime totalStudentsCreated
// counter in the same atomic batch. That counter — not the live count of
// (non-deleted) students — is what free-plan limits are enforced against,
// so deleting a student to free up a slot never restores quota.
export async function createStudent(uid, student) {
  const batch = writeBatch(db);
  const studentRef = doc(studentsRef(uid));
  batch.set(studentRef, { ...student, createdAt: serverTimestamp() });
  batch.update(doc(db, 'users', uid), { totalStudentsCreated: increment(1) });
  await batch.commit();
  return studentRef.id;
}

export function updateStudent(uid, studentId, student) {
  return updateDoc(doc(db, 'users', uid, 'students', studentId), student);
}

export function deleteStudent(uid, studentId) {
  return deleteDoc(doc(db, 'users', uid, 'students', studentId));
}

// ---- users/{uid}/letters ----

function lettersRef(uid) {
  return collection(db, 'users', uid, 'letters');
}

export function watchLetters(uid, callback) {
  const q = query(lettersRef(uid), orderBy('updatedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function getLetter(uid, letterId) {
  const snap = await getDoc(doc(db, 'users', uid, 'letters', letterId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Same lifetime-counter pattern as createStudent — see comment there.
export async function createLetter(uid, letter) {
  const batch = writeBatch(db);
  const letterRef = doc(lettersRef(uid));
  batch.set(letterRef, { ...letter, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  batch.update(doc(db, 'users', uid), { totalLettersGenerated: increment(1) });
  await batch.commit();
  return letterRef.id;
}

export function updateLetter(uid, letterId, letter) {
  return updateDoc(doc(db, 'users', uid, 'letters', letterId), {
    ...letter,
    updatedAt: serverTimestamp(),
  });
}

export function deleteLetter(uid, letterId) {
  return deleteDoc(doc(db, 'users', uid, 'letters', letterId));
}

// ---- lifetime-counter reconciliation ----
//
// createStudent/createLetter increment totalStudentsCreated /
// totalLettersGenerated atomically with the document create, so a mismatch
// shouldn't be possible going forward. But a counter can still legitimately
// end up behind the real document count — most notably, any student/letter
// created before this counter existed (i.e. before it started being
// written) never incremented anything. Rather than requiring a one-off
// manual migration, this recomputes the true count straight from the
// subcollections (a cheap COUNT aggregation query, not a full document
// read) and — only ever upward, since deletes must not restore quota —
// repairs the stored counter if it's behind. Safe to call on every visit
// to a free-plan gate; it's a no-op once the counter has caught up.
export async function reconcileUsageCounters(uid) {
  const userRef = doc(db, 'users', uid);
  const [profileSnap, studentsCount, lettersCount] = await Promise.all([
    getDoc(userRef),
    getCountFromServer(studentsRef(uid)),
    getCountFromServer(lettersRef(uid)),
  ]);

  const stored = profileSnap.exists() ? profileSnap.data() : {};
  const liveStudents = studentsCount.data().count;
  const liveLetters = lettersCount.data().count;
  const storedStudents = stored.totalStudentsCreated || 0;
  const storedLetters = stored.totalLettersGenerated || 0;

  const fixes = {};
  if (liveStudents > storedStudents) fixes.totalStudentsCreated = liveStudents;
  if (liveLetters > storedLetters) fixes.totalLettersGenerated = liveLetters;
  if (Object.keys(fixes).length > 0) {
    await updateDoc(userRef, fixes);
  }

  return {
    totalStudentsCreated: Math.max(liveStudents, storedStudents),
    totalLettersGenerated: Math.max(liveLetters, storedLetters),
  };
}
