import { useEffect, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import { useTodoStore } from '../store/todoStore'
import { useTagStore } from '../store/tagStore'
import Layout from '../components/Layout'
import QuickAdd from '../components/QuickAdd'
import TaskCard from '../components/TaskCard'
import './Today.css'

dayjs.locale('ko')

const COLUMNS = [
  { key: 'todo',  label: '할 일',   icon: '📋', color: '#3b82f6' },
  { key: 'doing', label: '진행중',  icon: '🔥', color: '#f59e0b' },
  { key: 'done',  label: '완료',    icon: '✅', color: '#22c55e' },
]

function Today() {
  const { tasks, loading, subscribe, reorder, updateTask } = useTodoStore()
  const { subscribe: subTags } = useTagStore()

  useEffect(() => {
    subscribe()
    subTags()
  }, [])

  const today = dayjs().format('YYYY-MM-DD')

  // 할일: 오늘 날짜 + today 상태
  const todoTasks = useMemo(
    () => tasks.filter((t) => t.scheduledDate === today && t.status === 'today'),
    [tasks, today]
  )
  // 진행중: doing 상태 전체
  const doingTasks = useMemo(
    () => tasks.filter((t) => t.status === 'doing'),
    [tasks]
  )
  // 완료: 오늘 날짜 + done 상태
  const doneTasks = useMemo(
    () => tasks.filter((t) => t.scheduledDate === today && t.status === 'done'),
    [tasks, today]
  )

  const columnTasks = { todo: todoTasks, doing: doingTasks, done: doneTasks }
  const remaining = todoTasks.length + doingTasks.length

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = todoTasks.map((t) => t.id)
    const oldIndex = ids.indexOf(active.id)
    const newIndex = ids.indexOf(over.id)
    if (oldIndex === -1 || newIndex === -1) return
    await reorder(arrayMove(ids, oldIndex, newIndex))
  }

  const handleColumnMove = async (taskId, newStatus) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    const updates = { status: newStatus }
    if (!task.scheduledDate) updates.scheduledDate = today
    if (newStatus === 'done') updates.doneAt = Date.now()
    if (newStatus === 'today' || newStatus === 'doing') updates.doneAt = null
    await updateTask(taskId, updates)
  }

  return (
    <Layout>
      <header className="today-header">
        <div>
          <h1 className="today-title">{dayjs().format('M월 D일 (ddd)')}</h1>
          <p className="today-sub">진행 중 {remaining}개</p>
        </div>
      </header>

      <QuickAdd defaultDate={today} />

      {loading ? (
        <p className="today-loading">불러오는 중...</p>
      ) : (
        <div className="today-kanban">
          {COLUMNS.map((col) => {
            const colTasks = columnTasks[col.key]
            return (
              <div key={col.key} className="today-column">
                {/* 컬럼 헤더 */}
                <div className="today-col-header" style={{ borderColor: col.color }}>
                  <span className="today-col-icon">{col.icon}</span>
                  <span className="today-col-title" style={{ color: col.color }}>{col.label}</span>
                  <span className="today-col-count">{colTasks.length}</span>
                </div>

                {/* 카드 목록 */}
                <div className="today-col-body">
                  {col.key === 'todo' ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={todoTasks.map((t) => t.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <ul className="today-card-list">
                          {todoTasks.map((t) => (
                            <TodayCard
                              key={t.id}
                              task={t}
                              col={col.key}
                              onMove={handleColumnMove}
                            />
                          ))}
                        </ul>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <ul className="today-card-list">
                      {colTasks.map((t) => (
                        <TodayCard
                          key={t.id}
                          task={t}
                          col={col.key}
                          onMove={handleColumnMove}
                        />
                      ))}
                    </ul>
                  )}

                  {colTasks.length === 0 && (
                    <p className="today-col-empty">없음</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Layout>
  )
}

// 컬럼 전용 카드 (미루기 대신 컬럼 이동 버튼)
import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTagStore as useTagStoreInner } from '../store/tagStore'
import TaskDrawer from '../components/TaskDrawer'
import { useTodoStore as useTodoStoreInner } from '../store/todoStore'

const PRIORITY_COLOR = { p1: '#ef4444', p2: '#f97316', p3: '#3b82f6' }
const PRIORITY_LABEL = { p1: 'P1', p2: 'P2', p3: 'P3' }

function TodayCard({ task, col, onMove }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { postpone } = useTodoStoreInner()
  const { tags } = useTagStoreInner()

  const isDraggable = col === 'todo'
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, disabled: !isDraggable })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const taskTags = (task.tags ?? []).map((id) => tags.find((t) => t.id === id)).filter(Boolean)

  return (
    <>
      <li
        ref={setNodeRef}
        style={style}
        className={`today-card ${col === 'done' ? 'done' : ''}`}
        onClick={() => setDrawerOpen(true)}
      >
        {/* 드래그 핸들 (할일 컬럼만) */}
        {isDraggable && (
          <span
            className="today-card-handle"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
          >
            ⠿
          </span>
        )}

        <div className="today-card-body">
          <div className="today-card-title-row">
            {task.priority && (
              <span
                className="today-card-priority"
                style={{ background: PRIORITY_COLOR[task.priority] }}
              >
                {PRIORITY_LABEL[task.priority]}
              </span>
            )}
            <span className="today-card-title">{task.title || '(제목 없음)'}</span>
          </div>

          {taskTags.length > 0 && (
            <div className="today-card-tags">
              {taskTags.map((tag) => (
                <span
                  key={tag.id}
                  className="today-card-tag"
                  style={{ background: tag.color + '22', color: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* 컬럼 이동 버튼 */}
          <div className="today-card-actions" onClick={(e) => e.stopPropagation()}>
            {col === 'todo' && (
              <>
                <button className="col-move-btn doing" onClick={() => onMove(task.id, 'doing')}>▶ 진행</button>
                <button className="col-move-btn postpone" onClick={() => postpone(task.id, 'tomorrow')}>내일</button>
                <button className="col-move-btn postpone" onClick={() => postpone(task.id, 'nextweek')}>다음주</button>
              </>
            )}
            {col === 'doing' && (
              <>
                <button className="col-move-btn todo" onClick={() => onMove(task.id, 'today')}>↩ 할일</button>
                <button className="col-move-btn done" onClick={() => onMove(task.id, 'done')}>✓ 완료</button>
              </>
            )}
            {col === 'done' && (
              <button className="col-move-btn todo" onClick={() => onMove(task.id, 'today')}>↩ 되돌리기</button>
            )}
          </div>
        </div>
      </li>

      {drawerOpen && <TaskDrawer task={task} onClose={() => setDrawerOpen(false)} />}
    </>
  )
}

export default Today
