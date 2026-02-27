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
  writeBatch,
  getDocs,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import dayjs from 'dayjs'

// 기존 DONE 태스크에 startDate/doneAt 이 없는 경우 scheduledDate 기준으로 채워주는 1회성 마이그레이션
async function migrateDoneTasks() {
  const q = query(collection(db, 'tasks'), where('status', '==', 'done'))
  const snapshot = await getDocs(q)

  const targets = snapshot.docs.filter((d) => {
    const data = d.data()
    return data.scheduledDate && (!data.startDate || !data.doneAt)
  })

  if (targets.length === 0) return

  const CHUNK = 500
  const now = Date.now()
  for (let i = 0; i < targets.length; i += CHUNK) {
    const batch = writeBatch(db)
    targets.slice(i, i + CHUNK).forEach((d) => {
      const data = d.data()
      const updates = { updatedAt: now }
      if (!data.startDate) updates.startDate = data.scheduledDate
      if (!data.doneAt) updates.doneAt = dayjs(data.scheduledDate).endOf('day').valueOf()
      batch.update(doc(db, 'tasks', d.id), updates)
    })
    await batch.commit()
  }
}

export const useTodoStore = create((set, get) => ({
  tasks: [],
  loading: true,
  unsubscribe: null,

  // Firestore 실시간 구독 시작
  subscribe: () => {
    migrateDoneTasks()
    const q = query(collection(db, 'tasks'), orderBy('order', 'asc'))
    const unsub = onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      set({ tasks, loading: false })
    })
    set({ unsubscribe: unsub })
  },

  // 구독 해제
  unsubscribeAll: () => {
    const { unsubscribe } = get()
    if (unsubscribe) unsubscribe()
  },

  // 업무 추가
  addTask: async (fields) => {
    const { tasks } = get()
    const maxOrder = tasks.length > 0 ? Math.max(...tasks.map((t) => t.order ?? 0)) : 0
    await addDoc(collection(db, 'tasks'), {
      title: '',
      status: 'today',
      priority: null,
      scheduledDate: dayjs().format('YYYY-MM-DD'),
      dueDate: null,
      startDate: null,
      doneAt: null,
      tags: [],
      order: maxOrder + 1000,
      notes: '',
      links: [],
      checklist: [],
      repeat: null,
      postponeCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...fields,
    })
  },

  // 업무 수정
  updateTask: async (id, fields) => {
    await updateDoc(doc(db, 'tasks', id), {
      ...fields,
      updatedAt: Date.now(),
    })
  },

  // 업무 삭제
  deleteTask: async (id) => {
    await deleteDoc(doc(db, 'tasks', id))
  },

  // 완료 처리
  toggleDone: async (id) => {
    const { tasks } = get()
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    if (task.status === 'done') {
      await updateDoc(doc(db, 'tasks', id), {
        status: 'today',
        doneAt: null,
        updatedAt: Date.now(),
      })
    } else {
      await updateDoc(doc(db, 'tasks', id), {
        status: 'done',
        doneAt: Date.now(),
        updatedAt: Date.now(),
      })
    }
  },

  // 미루기
  postpone: async (id, target) => {
    const { tasks } = get()
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    let scheduledDate = null
    if (target === 'tomorrow') scheduledDate = dayjs().add(1, 'day').format('YYYY-MM-DD')
    else if (target === 'nextweek') scheduledDate = dayjs().add(1, 'week').startOf('week').add(1, 'day').format('YYYY-MM-DD')
    await updateDoc(doc(db, 'tasks', id), {
      scheduledDate,
      status: scheduledDate ? 'today' : 'backlog',
      postponeCount: (task.postponeCount ?? 0) + 1,
      updatedAt: Date.now(),
    })
  },

  // 드래그 후 순서 저장
  reorder: async (orderedIds) => {
    const updates = orderedIds.map((id, index) =>
      updateDoc(doc(db, 'tasks', id), { order: index * 1000 })
    )
    await Promise.all(updates)
  },
}))
