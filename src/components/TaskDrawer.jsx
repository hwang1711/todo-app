import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { useTodoStore } from '../store/todoStore'
import { useTagStore } from '../store/tagStore'
import './TaskDrawer.css'

const PRIORITY_OPTIONS = [
  { value: null,  label: '없음' },
  { value: 'p1',  label: 'P1 긴급' },
  { value: 'p2',  label: 'P2 중요' },
  { value: 'p3',  label: 'P3 일반' },
]

const STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'today',   label: 'Today' },
  { value: 'doing',   label: 'Doing' },
  { value: 'done',    label: 'Done' },
]

function TaskDrawer({ task, onClose }) {
  const { updateTask, deleteTask } = useTodoStore()
  const { tags } = useTagStore()

  const [title, setTitle] = useState(task.title)
  const [priority, setPriority] = useState(task.priority ?? null)
  const [status, setStatus] = useState(task.status)
  const [scheduledDate, setScheduledDate] = useState(task.scheduledDate ?? '')
  const [startDate, setStartDate] = useState(task.startDate ?? '')
  const [doneAt, setDoneAt] = useState(task.doneAt ? dayjs(task.doneAt).format('YYYY-MM-DD') : '')
  const [dueDate, setDueDate] = useState(task.dueDate ?? '')
  const [notes, setNotes] = useState(task.notes ?? '')
  const [selectedTags, setSelectedTags] = useState(task.tags ?? [])

  // 자동저장 (600ms debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      let effectiveDate = scheduledDate || null
      let effectiveStatus = status

      // today/doing으로 상태 변경 시 scheduledDate 없으면 오늘로 설정
      if ((effectiveStatus === 'today' || effectiveStatus === 'doing') && !effectiveDate) {
        effectiveDate = dayjs().format('YYYY-MM-DD')
        setScheduledDate(effectiveDate)
      }

      const todayStr = dayjs().format('YYYY-MM-DD')
      // doing 상태에서 예정일을 오늘 이후로 변경 시 → today로 자동 전환 (진행 일시중단)
      if (effectiveStatus === 'doing' && effectiveDate && effectiveDate > todayStr) {
        effectiveStatus = 'today'
        setStatus('today')
      }
      // backlog 상태에서 예정일을 오늘 또는 과거로 변경 시 → today로 자동 승격
      if (effectiveStatus === 'backlog' && effectiveDate && effectiveDate <= todayStr) {
        effectiveStatus = 'today'
        setStatus('today')
      }

      // doing으로 전환 시 시작일 자동 설정 (미설정인 경우에만)
      let effectiveStartDate = startDate || null
      if (effectiveStatus === 'doing' && !effectiveStartDate) {
        effectiveStartDate = todayStr
        setStartDate(effectiveStartDate)
      }

      // done으로 전환 시 완료일 자동 설정, 다른 상태로 전환 시 완료일 초기화
      let effectiveDoneAt = doneAt ? dayjs(doneAt).endOf('day').valueOf() : null
      if (effectiveStatus === 'done' && !effectiveDoneAt) {
        effectiveDoneAt = Date.now()
        setDoneAt(dayjs().format('YYYY-MM-DD'))
      } else if (effectiveStatus !== 'done') {
        effectiveDoneAt = null
        setDoneAt('')
      }

      updateTask(task.id, { title, priority, status: effectiveStatus, scheduledDate: effectiveDate, startDate: effectiveStartDate, doneAt: effectiveDoneAt, dueDate: dueDate || null, notes, tags: selectedTags })
    }, 600)
    return () => clearTimeout(timer)
  }, [title, priority, status, scheduledDate, startDate, doneAt, dueDate, notes, selectedTags])

  const toggleTag = (id) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  const handleDelete = async () => {
    if (!window.confirm('삭제하시겠습니까?')) return
    await deleteTask(task.id)
    onClose()
  }

  return (
    <div className="drawer-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer">
        <div className="drawer-handle" />

        <div className="drawer-body">
          {/* 제목 */}
          <textarea
            className="drawer-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="업무 제목"
            rows={2}
          />

          {/* 상태 */}
          <div className="drawer-field">
            <label>상태</label>
            <div className="option-row">
              {STATUS_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  className={`option-btn ${status === o.value ? 'active' : ''}`}
                  onClick={() => setStatus(o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* 우선순위 */}
          <div className="drawer-field">
            <label>우선순위</label>
            <div className="option-row">
              {PRIORITY_OPTIONS.map((o) => (
                <button
                  key={String(o.value)}
                  className={`option-btn ${priority === o.value ? 'active' : ''}`}
                  onClick={() => setPriority(o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* 날짜 2열 그리드 */}
          <div className="drawer-date-grid">
            <div className="drawer-field">
              <label>예정일</label>
              <input type="date" className="drawer-date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
            </div>
            <div className="drawer-field">
              <label>마감일 (선택)</label>
              <input type="date" className="drawer-date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="drawer-field">
              <label>시작일</label>
              <input type="date" className="drawer-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="drawer-field">
              <label>종료일</label>
              <input type="date" className="drawer-date" value={doneAt} onChange={(e) => setDoneAt(e.target.value)} />
            </div>
          </div>

          {/* 태그 */}
          {tags.length > 0 && (
            <div className="drawer-field">
              <label>태그</label>
              <div className="tag-row">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    className={`tag-chip ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
                    style={{
                      background: selectedTags.includes(tag.id) ? tag.color : tag.color + '22',
                      color: selectedTags.includes(tag.id) ? 'white' : tag.color,
                    }}
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 메모 */}
          <div className="drawer-field">
            <label>메모</label>
            <textarea
              className="drawer-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="메모를 입력하세요"
              rows={3}
            />
          </div>

          {/* 삭제 */}
          <button className="drawer-delete-btn" onClick={handleDelete}>
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}

export default TaskDrawer
