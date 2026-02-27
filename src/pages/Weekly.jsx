import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  pointerWithin,
} from '@dnd-kit/core'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import 'dayjs/locale/ko'
import { useTodoStore } from '../store/todoStore'
import { useTagStore } from '../store/tagStore'
import Layout from '../components/Layout'
import TaskDrawer from '../components/TaskDrawer'
import './Weekly.css'

dayjs.extend(isoWeek)
dayjs.locale('ko')

const PRIORITY_COLOR = { p1: '#ef4444', p2: '#f97316', p3: '#3b82f6' }
const PRIORITY_LABEL = { p1: 'P1', p2: 'P2', p3: 'P3' }
const STATUS_DOT = { today: '#3b82f6', doing: '#f59e0b', done: '#22c55e', backlog: '#9ca3af' }

/* ── 드래그 가능한 태스크 카드 ── */
function WeekTask({ task, tags, overlay = false }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })

  const taskTags = (task.tags ?? []).map((id) => tags.find((t) => t.id === id)).filter(Boolean)

  const style = overlay
    ? { opacity: 0.95, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }
    : {
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        opacity: isDragging ? 0.25 : 1,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative',
      }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`week-task ${task.status === 'done' ? 'done' : ''} ${overlay ? 'overlay' : ''}`}
        onClick={() => !isDragging && setDrawerOpen(true)}
        {...listeners}
        {...attributes}
      >
        <span
          className="week-task-dot"
          style={{ background: STATUS_DOT[task.status] ?? '#9ca3af' }}
        />
        <div className="week-task-inner">
          {task.priority && (
            <span
              className="week-task-priority"
              style={{ background: PRIORITY_COLOR[task.priority] }}
            >
              {PRIORITY_LABEL[task.priority]}
            </span>
          )}
          <span className={`week-task-title ${task.status === 'done' ? 'done' : ''}`}>
            {task.title || '(제목 없음)'}
          </span>
          {taskTags.length > 0 && (
            <div className="week-task-tags">
              {taskTags.map((tag) => (
                <span
                  key={tag.id}
                  className="week-task-tag"
                  style={{ background: tag.color + '22', color: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {drawerOpen && !isDragging && (
        <TaskDrawer task={task} onClose={() => setDrawerOpen(false)} />
      )}
    </>
  )
}

/* ── 드롭 가능한 날짜 컬럼 ── */
function DayColumn({ date, tasks, isToday, tags, onAddTask, holiday }) {
  const { setNodeRef, isOver } = useDroppable({ id: date })
  const [addText, setAddText] = useState('')

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!addText.trim()) return
    await onAddTask(date, addText.trim())
    setAddText('')
  }

  const dayName = dayjs(date).format('ddd')
  const dayNum = dayjs(date).format('D')
  const isRed = !!holiday

  return (
    <div className={`week-col ${isToday ? 'is-today' : ''} ${isOver ? 'is-over' : ''}`}>
      {/* 날짜 헤더 */}
      <div className="week-col-header">
        <span className="week-day-name" style={isRed ? { color: '#ef4444' } : {}}>
          {dayName}
        </span>
        <span
          className={`week-day-num ${isToday ? 'is-today' : ''}`}
          style={isRed && !isToday ? { color: '#ef4444' } : {}}
        >
          {dayNum}
        </span>
        {holiday && <span className="week-holiday-name">{holiday}</span>}
      </div>

      {/* 태스크 목록 */}
      <div ref={setNodeRef} className="week-col-tasks">
        {tasks.map((task) => (
          <WeekTask key={task.id} task={task} tags={tags} />
        ))}
        {tasks.length === 0 && <div className="week-col-placeholder" />}
      </div>

      {/* 인라인 추가 */}
      <form className="week-add-form" onSubmit={handleAdd}>
        <input
          className="week-add-input"
          value={addText}
          onChange={(e) => setAddText(e.target.value)}
          placeholder="+ 추가"
        />
      </form>
    </div>
  )
}

/* ── 백로그 컬럼 (드롭 가능) ── */
function BacklogColumn({ tasks, tags, onAddTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'backlog' })
  const [addText, setAddText] = useState('')

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!addText.trim()) return
    await onAddTask(addText.trim())
    setAddText('')
  }

  return (
    <div className={`week-col week-backlog-col ${isOver ? 'is-over' : ''}`}>
      {/* 헤더 */}
      <div className="week-col-header week-backlog-header">
        <span className="week-day-name">BACKLOG</span>
        <span className="week-backlog-count">{tasks.length}</span>
      </div>

      {/* 태스크 목록 */}
      <div ref={setNodeRef} className="week-col-tasks">
        {tasks.map((task) => (
          <WeekTask key={task.id} task={task} tags={tags} />
        ))}
        {tasks.length === 0 && <div className="week-col-placeholder" />}
      </div>

      {/* 인라인 추가 */}
      <form className="week-add-form" onSubmit={handleAdd}>
        <input
          className="week-add-input"
          value={addText}
          onChange={(e) => setAddText(e.target.value)}
          placeholder="+ 백로그 추가"
        />
      </form>
    </div>
  )
}

/* ── Weekly 메인 ── */
function Weekly() {
  const { tasks, loading, subscribe, updateTask, addTask } = useTodoStore()
  const { tags, subscribe: subTags } = useTagStore()
  const [weekOffset, setWeekOffset] = useState(0)
  const [activeTask, setActiveTask] = useState(null)
  const [holidays, setHolidays] = useState(new Map()) // Map<'YYYY-MM-DD', localName>

  useEffect(() => {
    subscribe()
    subTags()
  }, [])

  // 한국 공휴일 fetch (date.nager.at 무료 공개 API)
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const years = [...new Set([dayjs().year(), dayjs().year() + 1])]
        const results = await Promise.all(
          years.map((year) =>
            fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/KR`).then((r) => r.json())
          )
        )
        const map = new Map()
        results.flat().forEach((h) => map.set(h.date, h.localName))
        setHolidays(map)
      } catch {
        // API 실패 시 무시 (공휴일 없이 정상 동작)
      }
    }
    fetchHolidays()
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  const today = dayjs().format('YYYY-MM-DD')

  // 월~금 5일
  const weekDays = useMemo(() => {
    const monday = dayjs().isoWeekday(1).add(weekOffset, 'week')
    return Array.from({ length: 5 }, (_, i) =>
      monday.add(i, 'day').format('YYYY-MM-DD')
    )
  }, [weekOffset])

  // 날짜별 태스크 맵 (doing/done 태스크는 startDate~완료일 범위로 중복 노출)
  const tasksByDate = useMemo(() => {
    const map = Object.fromEntries(weekDays.map((d) => [d, []]))
    const added = Object.fromEntries(weekDays.map((d) => [d, new Set()]))

    tasks.forEach((t) => {
      // 1. doing/done 태스크: startDate ~ 완료일 범위 표시
      if (t.startDate && (t.status === 'doing' || t.status === 'done')) {
        const rangeEnd = t.doneAt
          ? dayjs(t.doneAt).format('YYYY-MM-DD')
          : today
        weekDays.forEach((date) => {
          if (date >= t.startDate && date <= rangeEnd && !added[date].has(t.id)) {
            map[date].push(t)
            added[date].add(t.id)
          }
        })
      }

      // 2. scheduledDate 기준 표시 (범위로 이미 추가된 경우 중복 방지)
      if (t.scheduledDate && map[t.scheduledDate] !== undefined && !added[t.scheduledDate].has(t.id)) {
        map[t.scheduledDate].push(t)
        added[t.scheduledDate].add(t.id)
      }
    })

    return map
  }, [tasks, weekDays, today])

  // 백로그 태스크 (예정일 없는 backlog)
  const backlogTasks = useMemo(
    () => tasks.filter((t) => t.status === 'backlog' && !t.scheduledDate),
    [tasks]
  )

  // 주차 레이블 (월~금)
  const weekLabel = useMemo(() => {
    const monday = dayjs().isoWeekday(1).add(weekOffset, 'week')
    const friday = monday.add(4, 'day')
    return `${monday.format('M/D')} – ${friday.format('M/D')}`
  }, [weekOffset])

  const handleDragStart = ({ active }) => {
    setActiveTask(tasks.find((t) => t.id === active.id) ?? null)
  }

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null)
    if (!over) return
    const task = tasks.find((t) => t.id === active.id)
    if (!task) return

    // 백로그 컬럼으로 드롭 → scheduledDate 제거 + status=backlog
    if (over.id === 'backlog') {
      if (task.status !== 'backlog' || task.scheduledDate) {
        await updateTask(task.id, { scheduledDate: null, status: 'backlog' })
      }
      return
    }

    const targetDate = over.id // droppable id = 'YYYY-MM-DD'
    if (task.scheduledDate === targetDate) return

    const updates = { scheduledDate: targetDate }
    // backlog 태스크를 오늘 또는 과거 날짜로 드래그 → today로 자동 승격
    if (task.status === 'backlog' && targetDate <= today) {
      updates.status = 'today'
    }
    await updateTask(task.id, updates)
  }

  const handleAddTask = async (date, title) => {
    await addTask({ title, status: 'today', scheduledDate: date })
  }

  const handleAddBacklogTask = async (title) => {
    await addTask({ title, status: 'backlog', scheduledDate: null })
  }

  return (
    <Layout>
      <header className="weekly-header">
        <button className="week-nav-btn" onClick={() => setWeekOffset((o) => o - 1)}>‹</button>
        <div className="weekly-center">
          <span className="weekly-label">{weekLabel}</span>
          {weekOffset !== 0 && (
            <button className="this-week-btn" onClick={() => setWeekOffset(0)}>
              이번주
            </button>
          )}
        </div>
        <button className="week-nav-btn" onClick={() => setWeekOffset((o) => o + 1)}>›</button>
      </header>

      {loading ? (
        <p className="weekly-loading">불러오는 중...</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="weekly-grid">
            {weekDays.map((date) => (
              <DayColumn
                key={date}
                date={date}
                tasks={tasksByDate[date] ?? []}
                isToday={date === today}
                tags={tags}
                onAddTask={handleAddTask}
                holiday={holidays.get(date) ?? null}
              />
            ))}
            <BacklogColumn
              tasks={backlogTasks}
              tags={tags}
              onAddTask={handleAddBacklogTask}
            />
          </div>

          <DragOverlay dropAnimation={null}>
            {activeTask && <WeekTask task={activeTask} tags={tags} overlay />}
          </DragOverlay>
        </DndContext>
      )}
    </Layout>
  )
}

export default Weekly
