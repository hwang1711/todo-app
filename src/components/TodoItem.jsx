import './TodoItem.css'

function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <li className={`todo-item ${todo.done ? 'done' : ''}`}>
      <button
        className="todo-check"
        onClick={() => onToggle(todo.id, todo.done)}
        aria-label={todo.done ? '완료 취소' : '완료'}
      >
        {todo.done ? '✅' : '⬜'}
      </button>
      <span className="todo-text">{todo.text}</span>
      <button
        className="todo-delete"
        onClick={() => onDelete(todo.id)}
        aria-label="삭제"
      >
        🗑
      </button>
    </li>
  )
}

export default TodoItem
