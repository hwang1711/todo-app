import { useState } from 'react'
import TodoInput from './components/TodoInput'
import TodoList from './components/TodoList'
import './App.css'

function App() {
  const [todos, setTodos] = useState([])
  const [filter, setFilter] = useState('all') // all | active | done

  const addTodo = (text) => {
    if (!text.trim()) return
    setTodos([
      { id: Date.now(), text: text.trim(), done: false },
      ...todos,
    ])
  }

  const toggleTodo = (id) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  const deleteTodo = (id) => {
    setTodos(todos.filter((t) => t.id !== id))
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

      <TodoList todos={filtered} onToggle={toggleTodo} onDelete={deleteTodo} />

      {todos.length === 0 && (
        <p className="empty-msg">할 일을 추가해보세요 ✨</p>
      )}
    </div>
  )
}

export default App
