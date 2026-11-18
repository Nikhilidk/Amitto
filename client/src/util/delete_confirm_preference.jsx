// Remembers "don't ask me again" for delete confirmations.
// Keyed per user id so a shared campus computer doesn't carry one student's
// preference over to the next person who logs in.
const keyFor = (userId) => `amitto:skipDeleteConfirm:${userId}`

export function shouldSkipDeleteConfirm(userId) {
  if (!userId) return false
  try {
    return localStorage.getItem(keyFor(userId)) === 'true'
  } catch {
    return false // storage blocked (e.g. private mode): fail safe and keep asking
  }
}

export function setSkipDeleteConfirm(userId, skip) {
  if (!userId) return
  try {
    if (skip) localStorage.setItem(keyFor(userId), 'true')
    else localStorage.removeItem(keyFor(userId))
  } catch {
    // Ignore: the preference just won't persist
  }
}