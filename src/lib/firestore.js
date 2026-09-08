import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
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

export function createStudent(uid, student) {
  return addDoc(studentsRef(uid), {
    ...student,
    createdAt: serverTimestamp(),
  });
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

export async function createLetter(uid, letter) {
  const docRef = await addDoc(lettersRef(uid), {
    ...letter,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
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
