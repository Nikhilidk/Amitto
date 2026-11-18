// Merge by _id (dedupes live + fetched copies, e.g. after a reconnect)
// and keep oldest -> newest. ObjectIds sort chronologically as strings.
export function mergeMessages(existing, incoming) {
  const map = new Map()
  for (const m of existing) map.set(m._id, m)
  for (const m of incoming) map.set(m._id, m)
  return [...map.values()].sort((a, b) => (a._id < b._id ? -1 : a._id > b._id ? 1 : 0))
}

export function formatTime(value) {
  if (!value) return ''
  const d = new Date(value)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function sortByActivity(list) {
  return [...list].sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
}