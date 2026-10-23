import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Generic confirm dialog for destructive actions.
 * Mount it only while it should be visible: `{open && <ConfirmDeleteModal ... />}`.
 * That way its checkbox state resets on every open and the Escape listener only exists while it's showing.
 *
 * Props:
 *  - title / message:     text shown in the dialog
 *  - confirmLabel:        text on the red confirm button
 *  - showDontAskAgain:    show the "Don't ask me again" checkbox
 *  - onConfirm({ dontAskAgain }), onCancel()
 */
export default function ConfirmDeleteModal({
  title = 'Delete this item?',
  message,
  confirmLabel = 'Delete',
  showDontAskAgain = true,
  onConfirm,
  onCancel
}) {
  const [dontAskAgain, setDontAskAgain] = useState(false)
  const cancelRef = useRef(null)

  // Keep the latest onCancel in a ref so the effect below can run once on mount
  // (otherwise an inline onCancel from the parent would re-run it and steal focus).
  const onCancelRef = useRef(onCancel)
  useEffect(() => { onCancelRef.current = onCancel })

  useEffect(() => {
    // Focus the safe option, so a stray Enter key press cancels instead of deleting
    cancelRef.current?.focus()

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCancelRef.current()
    }
    document.addEventListener('keydown', onKeyDown)

    // Stop the page behind the dialog from scrolling
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop: clicking outside the dialog cancels */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-message"
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6"
      >
        <h2 id="confirm-delete-title" className="text-lg font-semibold text-gray-900">
          {title}
        </h2>
        <p id="confirm-delete-message" className="text-sm text-gray-600 mt-2">
          {message}
        </p>

        {showDontAskAgain && (
          <label className="flex items-center gap-2 mt-4 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontAskAgain}
              onChange={(e) => setDontAskAgain(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-red-600"
            />
            Don't ask me again
          </label>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm({ dontAskAgain })}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}