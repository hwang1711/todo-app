import { useTodoStore } from '../store/todoStore'
import { useTagStore } from '../store/tagStore'
import { useEffect } from 'react'
import dayjs from 'dayjs'
import Layout from '../components/Layout'
import './Board.css'

const COLUMNS = [
  { key: 'backlog', label: 'Backlog', color: '#6b7280' },
  { key: 'today',   label: 'Today',   color: '#3b82f6' },
  { key: 'doing',   label: 'Doing',   color: '#f59e0b' },
  { key: 'done',    label: 'Done',    color: '#22c55e' },
]

const PRIORITY_COLOR = { p1: '#ef4444', p2: '#f97316', p3: '#3b82f6' }
const PRIORITY_LABEL = { p1: 'P1', p2: 'P2', p3: 'P3' }

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
    // today/doing로 이동 시 scheduledDate가 없으면 오늘 날짜로 설정
    if (newStatus === 'today' || newStatus === 'doing') {
      const task = tasks.find((t) => t.id === taskId)
      if (!task?.scheduledDate) {
        updates.scheduledDate = dayjs().format('YYYY-MM-DD')
      }
    }
    await updateTask(taskId, updates)
  }

  if (loading) return <Layout><p className="board-loading">불러오는 중...</p></Layout>

  return (
    <Layout>
      <header className="board-header">
        <h1>Board</h1>
      </header>
      <div className="board-columns">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key)
          return (
            <div key={col.key} className="board-column">
              <div className="board-col-header" style={{ borderColor: col.color }}>
                <span className="board-col-title" style={{ color: col.color }}>{col.label}</span>
                <span className="board-col-count">{colTasks.length}</span>
              </div>
              <div className="board-cards">
                {colTasks.map((task) => (
                  <div key={task.id} className="board-card">
                    {task.priority && (
                      <span
                        className="board-priority"
                        style={{ background: PRIORITY_COLOR[task.priority] }}
                      >
                        {PRIORITY_LABEL[task.priority]}
                      </span>
                    )}
                    <p className="board-card-title">{task.title}</p>
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
                    <div className="board-card-actions">
                      {COLUMNS.filter((c) => c.key !== col.key).map((c) => (
                        <button
                          key={c.key}
                          className="board-move-btn"
                          style={{ color: c.color, borderColor: c.color + '44' }}
                          onClick={() => moveStatus(task.id, c.key)}
                        >
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <p className="board-empty">없음</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Layout>
  )
}

export default Board
