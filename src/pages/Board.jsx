import { useTodoStore } from '../store/todoStore'
import { useTagStore } from '../store/tagStore'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import Layout from '../components/Layout'
import QuickAdd from '../components/QuickAdd'
import TaskDrawer from '../components/TaskDrawer'
import './Board.css'

// 컬럼 정의 (key: 'scheduled'는 가상 컬럼 — status가 아닌 별도 필터)
const COLUMNS = [
  { key: 'backlog',   label: 'Backlog', color: '#6b7280', desc: '날짜 미정' },
  { key: 'scheduled', label: '예정',    color: '#8b5cf6', desc: '날짜 있음' },
  { key: 'today',     label: 'Today',   color: '#3b82f6', desc: '오늘' },
  { key: 'doing',     label: 'Doing',   color: '#f59e0b', desc: '진행중' },
  { key: 'done',      label: 'Done',    color: '#22c55e', desc: '완료' },
]

// 이동 버튼에서 '예정' 제외 (예정은 날짜 지정으로만 이동)
const MOVE_TARGETS = COLUMNS.filter((c) => c.key !== 'scheduled')

const PRIORITY_COLOR = { p1: '#ef4444', p2: '#f97316', p3: '#3b82f6' }
const PRIORITY_LABEL = { p1: 'P1', p2: 'P2', p3: 'P3' }

function getColTasks(tasks, colKey) {
  if (colKey === 'backlog') {
    // Backlog: status=backlog + scheduledDate 없음
    return tasks.filter((t) => t.status === 'backlog' && !t.scheduledDate)
  }
  if (colKey === 'scheduled') {
    // 예정: status=backlog + scheduledDate 있음
    return tasks.filter((t) => t.status === 'backlog' && !!t.scheduledDate)
  }
  return tasks.filter((t) => t.status === colKey)
}

function Board() {
  const { tasks, loading, subscribe, updateTask } = useTodoStore()
  const { tags, subscribe: subTags } = useTagStore()

  useEffect(() => {
    subscribe()
    subTags()
  }, [])

  const getTag = (id) => tags.find((t) => t.id === id)

  const moveStatus = async (taskId, newStatus) => {
    const updates = { status: newStatus }
    if (newStatus === 'today' || newStatus === 'doing' || newStatus === 'done') {
      const task = tasks.find((t) => t.id === taskId)
      if (!task?.scheduledDate) {
        updates.scheduledDate = dayjs().format('YYYY-MM-DD')
      }
      if (newStatus === 'done') updates.doneAt = Date.now()
      if (newStatus === 'today' || newStatus === 'doing') updates.doneAt = null
      if (newStatus === 'doing' && !task?.startDate) updates.startDate = dayjs().format('YYYY-MM-DD')
    }
    if (newStatus === 'backlog') {
      // Backlog으로 보내면 날짜 제거 → Backlog 컬럼에 표시
      updates.scheduledDate = null
      updates.doneAt = null
    }
    await updateTask(taskId, updates)
  }

  if (loading) return <Layout><p className="board-loading">불러오는 중...</p></Layout>

  return (
    <Layout>
      <header className="board-header">
        <h1>Board</h1>
      </header>
      <QuickAdd defaultStatus="backlog" />
      <div className="board-columns">
        {COLUMNS.map((col) => {
          const colTasks = getColTasks(tasks, col.key)
          return (
            <div key={col.key} className="board-column">
              <div className="board-col-header" style={{ borderColor: col.color }}>
                <div>
                  <span className="board-col-title" style={{ color: col.color }}>{col.label}</span>
                  <span className="board-col-desc">{col.desc}</span>
                </div>
                <span className="board-col-count">{colTasks.length}</span>
              </div>

              <div className="board-cards">
                {colTasks.map((task) => (
                  <BoardCard
                    key={task.id}
                    task={task}
                    col={col}
                    tags={tags}
                    onMove={moveStatus}
                  />
                ))}
                {colTasks.length === 0 && <p className="board-empty">없음</p>}
              </div>
            </div>
          )
        })}
      </div>
    </Layout>
  )
}

function BoardCard({ task, col, tags, onMove }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  const getTag = (id) => tags.find((t) => t.id === id)

  return (
    <>
      <div
        className="board-card"
        onClick={() => setDrawerOpen(true)}
        style={{ cursor: 'pointer' }}
      >
        {task.priority && (
          <span className="board-priority" style={{ background: PRIORITY_COLOR[task.priority] }}>
            {PRIORITY_LABEL[task.priority]}
          </span>
        )}
        <p className="board-card-title">{task.title || '(제목 없음)'}</p>

        {task.scheduledDate && (
          <p className="board-card-date" style={{ color: col.color }}>
            📅 {dayjs(task.scheduledDate).format('M/D (ddd)')}
          </p>
        )}

        {task.tags?.length > 0 && (
          <div className="board-card-tags">
            {task.tags.map((tid) => {
              const tag = getTag(tid)
              return tag ? (
                <span key={tid} className="board-tag" style={{ background: tag.color + '22', color: tag.color }}>
                  {tag.name}
                </span>
              ) : null
            })}
          </div>
        )}

        <div className="board-card-actions" onClick={(e) => e.stopPropagation()}>
          {MOVE_TARGETS.filter((c) => c.key !== col.key).map((c) => (
            <button
              key={c.key}
              className="board-move-btn"
              style={{ color: c.color, borderColor: c.color + '44' }}
              onClick={() => onMove(task.id, c.key)}
            >
              → {c.label}
            </button>
          ))}
        </div>
      </div>

      {drawerOpen && <TaskDrawer task={task} onClose={() => setDrawerOpen(false)} />}
    </>
  )
}

export default Board
