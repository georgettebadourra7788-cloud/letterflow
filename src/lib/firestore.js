import {
  collection,
  deleteDoc,
  doc,
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
