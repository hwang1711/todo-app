import { create } from 'zustand'
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { db } from '../firebase'

const TAG_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
]

export const useTagStore = create((set) => ({
  tags: [],
  unsubscribe: null,

  subscribe: () => {
    const q = query(collection(db, 'tags'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, (snapshot) => {
      const tags = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      set({ tags })
    })
    set({ unsubscribe: unsub })
  },

  addTag: async (name, color) => {
    await addDoc(collection(db, 'tags'), {
      name,
      color: color ?? TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)],
      createdAt: Date.now(),
    })
  },

  updateTag: async (id, fields) => {
    await updateDoc(doc(db, 'tags', id), fields)
  },

  deleteTag: async (id) => {
    await deleteDoc(doc(db, 'tags', id))
  },

  TAG_COLORS,
}))
