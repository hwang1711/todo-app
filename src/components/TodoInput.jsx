import { useState } from 'react'
import './TodoInput.css'

function TodoInput({ onAdd }) {
  const [text, setText] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onAdd(text)
    setText('')
  }

  return (
    <form className="todo-input-form" onSubmit={handleSubmit}>
      <input
        className="todo-input"
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="할 일을 입력하세요..."
        autoFocus
      />
      <button className="todo-input-btn" type="submit">
        추가
      </button>
    </form>
  )
}

export default TodoInput
