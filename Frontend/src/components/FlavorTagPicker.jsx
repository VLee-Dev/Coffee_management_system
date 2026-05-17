import { useEffect, useMemo, useState } from 'react'
import { getApiBase, getToken } from '../lib/auth'

export default function FlavorTagPicker({ value = [], onChange, disabled = false }) {
  const apiBase = getApiBase()
  const token = getToken()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagGroupId, setNewTagGroupId] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`${apiBase}/flavors/catalog`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (!res.ok) throw new Error('Không tải được flavor tags')
        const data = await res.json()
        if (!cancelled) {
          setGroups(data)
          if (data.length && !newTagGroupId) setNewTagGroupId(String(data[0].id))
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [apiBase, token])

  const selectedSet = useMemo(() => new Set(value), [value])

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return groups
    return groups
      .map((g) => ({
        ...g,
        tags: g.tags.filter((t) => t.name.toLowerCase().includes(q) || g.name.toLowerCase().includes(q)),
      }))
      .filter((g) => g.tags.length > 0)
  }, [groups, search])

  function toggleTag(tagId) {
    if (disabled) return
    if (selectedSet.has(tagId)) {
      onChange(value.filter((id) => id !== tagId))
    } else {
      onChange([...value, tagId])
    }
  }

  async function handleAddTag(e) {
    e.preventDefault()
    const name = newTagName.trim()
    const groupId = Number(newTagGroupId)
    if (!name || !groupId) return

    setAdding(true)
    setError('')
    try {
      const res = await fetch(`${apiBase}/flavors/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, group_id: groupId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Không tạo được tag')
      }
      const created = await res.json()
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, tags: [...g.tags, { id: created.id, name: created.name }].sort((a, b) => a.name.localeCompare(b.name, 'vi')) } : g,
        ),
      )
      onChange([...value, created.id])
      setNewTagName('')
      setShowAdd(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return <p className="text-on-surface-variant font-label-sm">Đang tải flavor tags...</p>
  }

  return (
    <div className="flex flex-col gap-3 md:col-span-2">
      <div className="flex flex-col gap-2">
        <label className="font-label-md text-on-surface-variant">Hương vị (flavor tags)</label>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={disabled}
          placeholder="Tìm tag hoặc nhóm..."
          className="bg-surface-container border-none rounded-xl px-4 py-2.5 font-body-md text-body-md focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
        />
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {groups.flatMap((g) =>
            g.tags
              .filter((t) => selectedSet.has(t.id))
              .map((t) => (
                <button
                  key={t.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleTag(t.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-container/30 text-primary border border-primary-container font-label-sm text-label-sm hover:bg-primary-container/50 disabled:opacity-60"
                >
                  {t.name}
                  <span className="text-xs opacity-70">×</span>
                </button>
              )),
          )}
        </div>
      )}

      <div className="max-h-52 overflow-y-auto rounded-xl border border-outline-variant/40 bg-surface-container/50 p-3 flex flex-col gap-3">
        {filteredGroups.length === 0 && (
          <p className="text-on-surface-variant font-label-sm text-center py-4">Không có tag phù hợp</p>
        )}
        {filteredGroups.map((group) => (
          <div key={group.id}>
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide mb-2">
              {group.name}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.tags.map((tag) => {
                const active = selectedSet.has(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleTag(tag.id)}
                    className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm border transition-colors disabled:opacity-60 ${
                      active
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-bright text-on-surface-variant border-outline-variant/50 hover:border-primary-container'
                    }`}
                  >
                    {tag.name}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {!showAdd ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowAdd(true)}
          className="self-start text-sm font-label-md text-primary hover:underline disabled:opacity-60"
        >
          + Thêm flavor tag mới
        </button>
      ) : (
        <form onSubmit={handleAddTag} className="flex flex-col gap-2 p-3 rounded-xl bg-surface-container border border-outline-variant/40">
          <p className="font-label-sm text-on-surface-variant">Tag mới (chọn nhóm có sẵn)</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tên tag, VD: bergamot"
              className="flex-1 bg-surface-bright border-none rounded-lg px-3 py-2 font-body-md"
            />
            <select
              value={newTagGroupId}
              onChange={(e) => setNewTagGroupId(e.target.value)}
              className="bg-surface-bright border-none rounded-lg px-3 py-2 font-body-md min-w-[140px]"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={adding || !newTagName.trim()}
              className="px-4 py-2 bg-primary text-on-primary rounded-full font-label-sm disabled:opacity-60"
            >
              {adding ? 'Đang thêm...' : 'Thêm'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false)
                setNewTagName('')
              }}
              className="px-4 py-2 text-on-surface-variant font-label-sm"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {error && <p className="text-error font-label-sm">{error}</p>}
    </div>
  )
}
