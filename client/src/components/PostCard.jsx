function PostCard({ post }) {
  const { type, title, description, photoUrl, category, campusZone, status, postedBy, createdAt } = post

  const typeStyles = type === 'lost'
    ? 'bg-red-100 text-red-700'
    : 'bg-green-100 text-green-700'

  const statusStyles = {
    active: 'bg-blue-100 text-blue-700',
    claim_pending: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-gray-200 text-gray-600'
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
      <img
        src={photoUrl}
        alt={title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold uppercase px-2 py-1 rounded ${typeStyles}`}>
            {type}
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded ${statusStyles[status] || ''}`}>
            {status?.replace('_', ' ')}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2">{description}</p>

        <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
          <span className="bg-gray-100 px-2 py-1 rounded">{category}</span>
          <span className="bg-gray-100 px-2 py-1 rounded">{campusZone}</span>
        </div>

        <div className="text-xs text-gray-400 mt-2 flex justify-between">
          <span>{postedBy?.name || 'Unknown'}</span>
          <span>{createdAt ? new Date(createdAt).toLocaleDateString() : ''}</span>
        </div>
      </div>
    </div>
  )
}

export default PostCard