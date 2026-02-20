import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTodoStore } from '../store/todoStore'
import { useTagStore } from '../store/tagStore'
import TaskDrawer from './TaskDrawer'
import './TaskCard.css'

const PRIORITY_COLOR = { p1: '#ef4444', p2: '#f97316', p3: '#3b82f6' }
const PRIORITY_LABEL = { p1: 'P1', p2: 'P2', p3: 'P3' }

function TaskCard({ task }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { toggleDone, postpone, updateTask } = useTodoStore()
  const { tags } = useTagStore()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  const taskTags = (task.tags ?? []).map((id) => tags.find((t) => t.id === id)).filter(Boolean)
  const isDone = task.status === 'done'
  const isDoing = task.status === 'doing'

  const handleToggleDoing = async (e) => {
    e.stopPropagation()
    await updateTask(task.id, { status: isDoing ? 'today' : 'doing' })
  }

  return (
    <>
      <li
        ref={setNodeRef}
        style={style}
        className={`task-card ${isDone ? 'done' : ''} ${isDoing ? 'doing' : ''}`}
        onClick={() => setDrawerOpen(true)}
      >
        {/* 드래그 핸들 */}
        <span className="drag-handle" {...attributes} {...listeners} onClick={(e) => e.stopPropagation()}>
          ⠿
        </span>

        {/* 완료 체크 */}
        <button
          className="task-check"
          onClick={(e) => { e.stopPropagation(); toggleDone(task.id) }}
          aria-label={isDone ? '완료 취소' : '완료'}
        >
          {isDone ? '✅' : '⬜'}
        </button>

        {/* 내용 */}
        <div className="task-content">
          <div className="task-title-row">
            {task.priority && (
              <span className="task-priority" style={{ background: PRIORITY_COLOR[task.priority] }}>
                {PRIORITY_LABEL[task.priority]}
              </span>
            )}
            <span className="task-title">{task.title || '(제목 없음)'}</span>
          </div>

          {taskTags.length > 0 && (
            <div className="task-tags">
              {taskTags.map((tag) => (
                <span key={tag.id} className="task-tag" style={{ background: tag.color + '22', color: tag.color }}>
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* 미루기 + Doing 버튼 */}
          {!isDone && (
            <div className="task-actions" onClick={(e) => e.stopPropagation()}>
              <button className={`task-action-btn doing-btn ${isDoing ? 'on' : ''}`} onClick={handleToggleDoing}>
                {isDoing ? '⏸ Doing' : '▶ Doing'}
              </button>
              <button className="task-action-btn" onClick={() => postpone(task.id, 'tomorrow')}>내일</button>
              <button className="task-action-btn" onClick={() => postpone(task.id, 'nextweek')}>다음주</button>
              <button className="task-action-btn" onClick={() => postpone(task.id, 'none')}>날짜미정</button>
            </div>
          )}
        </div>
      </li>

      {drawerOpen && <TaskDrawer task={task} onClose={() => setDrawerOpen(false)} />}
    </>
  )
}

export default TaskCard
