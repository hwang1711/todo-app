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

function Today() {
  const { tasks, loading, subscribe, reorder } = useTodoStore()
  const { subscribe: subTags } = useTagStore()

  useEffect(() => {
    subscribe()
    subTags()
  }, [])

  const today = dayjs().format('YYYY-MM-DD')

  // Doing 업무 (상단 고정)
  const doingTasks = useMemo(
    () => tasks.filter((t) => t.status === 'doing'),
    [tasks]
  )

  // 오늘 업무 (doing 제외, done 포함)
  const todayTasks = useMemo(
    () => tasks.filter((t) => t.scheduledDate === today && t.status !== 'doing'),
    [tasks, today]
  )

  const doneTasks = todayTasks.filter((t) => t.status === 'done')
  const activeTasks = todayTasks.filter((t) => t.status !== 'done')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = activeTasks.map((t) => t.id)
    const oldIndex = ids.indexOf(active.id)
    const newIndex = ids.indexOf(over.id)
    const newOrder = arrayMove(ids, oldIndex, newIndex)
    await reorder(newOrder)
  }

  const remaining = activeTasks.length

  return (
    <Layout>
      <header className="today-header">
        <div>
          <h1 className="today-title">{dayjs().format('M월 D일 (ddd)')}</h1>
          <p className="today-sub">오늘 할 일 {remaining}개 남음</p>
        </div>
      </header>

      <QuickAdd defaultDate={today} />

      {loading ? (
        <p className="today-loading">불러오는 중...</p>
      ) : (
        <>
          {/* Doing 집중 영역 */}
          {doingTasks.length > 0 && (
            <section className="today-section doing-section">
              <h2 className="section-title">🔥 진행 중</h2>
              <ul className="task-list">
                {doingTasks.map((t) => <TaskCard key={t.id} task={t} />)}
              </ul>
            </section>
          )}

          {/* 오늘 업무 (드래그 정렬) */}
          <section className="today-section">
            <h2 className="section-title">📋 오늘</h2>
            {activeTasks.length === 0 && doingTasks.length === 0 ? (
              <p className="today-empty">할 일을 추가해보세요 ✨</p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={activeTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <ul className="task-list">
                    {activeTasks.map((t) => <TaskCard key={t.id} task={t} />)}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
          </section>

          {/* 완료된 업무 */}
          {doneTasks.length > 0 && (
            <section className="today-section">
              <h2 className="section-title done-title">✅ 완료 ({doneTasks.length})</h2>
              <ul className="task-list">
                {doneTasks.map((t) => <TaskCard key={t.id} task={t} />)}
              </ul>
            </section>
          )}
        </>
      )}
    </Layout>
  )
}

export default Today
