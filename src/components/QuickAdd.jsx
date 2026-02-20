import { useState } from 'react'
import { useTodoStore } from '../store/todoStore'
import { useTagStore } from '../store/tagStore'
import dayjs from 'dayjs'
import './QuickAdd.css'

// 단축 파싱: #태그명, !p1/!p2/!p3, @내일/@오늘/@다음주/@YYYY-MM-DD
function parseQuickInput(raw) {
  let title = raw
  let scheduledDate = dayjs().format('YYYY-MM-DD')
  let priority = null
  const tagNames = []

  // 우선순위: !p1 !p2 !p3
  title = title.replace(/!p([123])/gi, (_, n) => { priority = `p${n}`; return '' })

  // 날짜: @오늘 @내일 @다음주 @YYYY-MM-DD
  title = title.replace(/@(오늘|내일|다음주|[\d]{4}-[\d]{2}-[\d]{2})/g, (_, d) => {
    if (d === '오늘') scheduledDate = dayjs().format('YYYY-MM-DD')
    else if (d === '내일') scheduledDate = dayjs().add(1, 'day').format('YYYY-MM-DD')
    else if (d === '다음주') scheduledDate = dayjs().add(1, 'week').startOf('week').add(1, 'day').format('YYYY-MM-DD')
    else scheduledDate = d
    return ''
  })

  // 태그: #태그명
  title = title.replace(/#([\wㄱ-ㅎ가-힣]+)/g, (_, name) => { tagNames.push(name); return '' })

  return { title: title.trim(), scheduledDate, priority, tagNames }
}

function QuickAdd({ defaultDate }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const { addTask } = useTodoStore()
  const { tags, addTag } = useTagStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim() || loading) return
    setLoading(true)

    const { title, scheduledDate, priority, tagNames } = parseQuickInput(text)

    // 태그 이름 → ID 변환 (없으면 생성)
    const tagIds = []
    for (const name of tagNames) {
      let tag = tags.find((t) => t.name === name)
      if (!tag) {
        await addTag(name)
        // 새로 추가된 태그는 store에서 곧 갱신되므로 제목에만 표기
        continue
      }
      tagIds.push(tag.id)
    }

    await addTask({
      title,
      status: 'today',
      scheduledDate: defaultDate ?? scheduledDate,
      priority,
      tags: tagIds,
    })

    setText('')
    setLoading(false)
  }

  return (
    <form className="quick-add-form" onSubmit={handleSubmit}>
      <input
        className="quick-add-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="할 일 추가... (#태그 !p1 @내일)"
        autoComplete="off"
      />
      <button className="quick-add-btn" type="submit" disabled={loading}>
        +
      </button>
    </form>
  )
}

export default QuickAdd
