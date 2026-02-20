import { useState, useEffect } from 'react'
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
import { db } from './firebase'
import TodoInput from './components/TodoInput'
import TodoList from './components/TodoList'
import './App.css'

function App() {
  const [todos, setTodos] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  // Firestore 실시간 구독
  useEffect(() => {
    const q = query(collection(db, 'todos'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setTodos(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const addTodo = async (text) => {
    if (!text.trim()) return
    await addDoc(collection(db, 'todos'), {
      text: text.trim(),
      done: false,
      createdAt: Date.now(),
    })
  }

  const toggleTodo = async (id, done) => {
    await updateDoc(doc(db, 'todos', id), { done: !done })
  }

  const deleteTodo = async (id) => {
    await deleteDoc(doc(db, 'todos', id))
  }

  const filtered = todos.filter((t) => {
    if (filter === 'active') return !t.done
    if (filter === 'done') return t.done
    return true
  })

  const remaining = todos.filter((t) => !t.done).length

  return (
    <div className="app">
      <header className="app-header">
        <h1>📝 Todo</h1>
        <span className="badge">{remaining} 남음</span>
      </header>

      <TodoInput onAdd={addTodo} />

      <div className="filter-bar">
        {['all', 'active', 'done'].map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? '전체' : f === 'active' ? '진행중' : '완료'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="empty-msg">불러오는 중...</p>
      ) : (
        <>
          <TodoList todos={filtered} onToggle={toggleTodo} onDelete={deleteTodo} />
          {todos.length === 0 && (
            <p className="empty-msg">할 일을 추가해보세요 ✨</p>
          )}
        </>
      )}
    </div>
  )
}

export default App
