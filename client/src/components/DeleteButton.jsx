import { useState } from "react"
import {deletePost, getFriendlyErrorMessage} from "../api/apiService.js" 
import {useAuth} from "../context/AuthContext.jsx"

/**
 * Delete button for a post. Renders nothing unless the logged-in user owns the post
 * or is an admin. Hiding is for neatness only; the backend enforces the real check.
 *
 * Props:
 *  - post:      the post object (needs _id, title, postedBy)
 *  - onDeleted: called after a successful delete (parent navigates or updates its list)
 *  - onError:   called with a friendly error message if the delete fails
 *  - onStart:   optional, called when a delete attempt begins (e.g. to clear an old error)
 *  - label:     button text (default "Delete")
 *  - className: sizing/layout classes from the parent (colors and states are built in)
 */
export default function DeleteButton({
  post,
  onDeleted,
  onError,
  onStart,
  label = 'Delete',
  className = ''
}) {
  const { user, isAdmin } = useAuth()
  const [deleting, setDeleting] = useState(false)

  // postedBy is a populated object ({ _id, name, ... }) on the detail page,
  // but a plain id string on /posts/mine. Handle both shapes.
  const ownerId =
    post?.postedBy && typeof post.postedBy === 'object'
      ? post.postedBy._id
      : post?.postedBy

  // The logged-in user has `id`; a populated post.postedBy has `_id`.
  // Boolean(user?.id) stops undefined === undefined from granting access
  // to logged-out visitors or posts whose author no longer exists.
  const isOwner = Boolean(user?.id) && user.id === ownerId

  if (!isOwner && !isAdmin) return null

  const handleClick = async () => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return

    setDeleting(true)
    onStart?.()
    try {
      await deletePost(post._id)
      // No setDeleting(false) here: after success the parent navigates away or removes
      // this card, so the component unmounts. Resetting would update unmounted state.
      onDeleted?.(post)
    } catch (err) {
      setDeleting(false)
      onError?.(getFriendlyErrorMessage(err))
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={deleting}
      className={`bg-white text-red-600 border border-red-200 font-medium rounded-lg hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {deleting ? 'Deleting...' : label}
    </button>
  )
}