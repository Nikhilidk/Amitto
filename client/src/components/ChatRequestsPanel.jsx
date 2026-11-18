import Avatar from './chat/Avatar.jsx';

// Poster's view of chat requests on a found post.
// Shows who asked, the wrong answers they tried, and their note.
export default function ChatRequestsPanel({ requests, postActive, busyId, error, onAccept, onDecline }) {
  const pendingCount = requests.filter((r) => r.requestStatus === 'pending').length;

  return (
    <section className="bg-amber-50/60 border border-amber-100 rounded-xl p-4 flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-bold text-gray-900">
          Chat requests{pendingCount > 0 ? ` (${pendingCount} waiting)` : ''}
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          These people used all their attempts. Check what they tried before you decide.
          Accepting opens a chat and starts their claim.
        </p>
      </div>

      {!postActive && pendingCount > 0 && (
        <p className="text-xs text-amber-800 bg-amber-100/60 rounded-lg px-3 py-2">
          Requests can only be accepted while the item is active. If the current claim is rejected,
          you can respond again.
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {requests.map((r) => {
          const person = r.user;
          const uid = person?._id;
          const busy = busyId === uid;
          const answers = Array.isArray(r.answers) ? r.answers : [];

          return (
            <li key={r._id} className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Avatar user={person} size="w-9 h-9" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{person?.name || 'Deleted user'}</p>
                  {typeof person?.trustScore === 'number' && (
                    <p className="text-[11px] text-gray-400">⭐ Trust score {person.trustScore}</p>
                  )}
                </div>
                {r.requestStatus === 'accepted' && (
                  <span className="text-[10px] font-semibold uppercase bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Accepted
                  </span>
                )}
                {r.requestStatus === 'declined' && (
                  <span className="text-[10px] font-semibold uppercase bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                    Declined
                  </span>
                )}
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">Answers tried</p>
                {answers.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {answers.map((a, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full break-all">
                        {a}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No answers were recorded.</p>
                )}
              </div>

              {r.requestNote && (
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 whitespace-pre-line break-words">
                  “{r.requestNote}”
                </p>
              )}

              {r.requestStatus === 'pending' && uid && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onAccept(uid)}
                    disabled={!postActive || busy}
                    className="text-xs font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {busy ? '...' : 'Accept & chat'}
                  </button>
                  <button
                    onClick={() => onDecline(uid)}
                    disabled={busy}
                    className="text-xs font-medium bg-white text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Decline
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}