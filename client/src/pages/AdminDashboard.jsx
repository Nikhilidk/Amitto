import { useState, useEffect } from 'react'
import { getPendingUsers, updateUserStatus, getFriendlyErrorMessage } from '../api/apiService.js'

function AdminDashboard() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedImage, setSelectedImage] = useState(null)
    const [actionLoading, setActionLoading] = useState(null)

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const data = await getPendingUsers()
            setUsers(data)
        } catch (err) {
            setError(getFriendlyErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleAction = async (userId, status) => {
        setActionLoading(userId)
        try {
            await updateUserStatus(userId, status)
            setUsers((prev) => prev.filter((u) => (u._id || u.id) !== userId))
        } catch (err) {
            alert(getFriendlyErrorMessage(err))
        } finally {
            setActionLoading(null)
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Admin Control Panel</h1>
                    <p className="text-sm text-slate-500">Review and verify student registrations.</p>
                </div>
                <button
                    onClick={fetchUsers}
                    className="px-4 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition font-medium"
                >
                    Refresh List
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl mb-6">
                    ⚠️ {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-slate-500">Loading pending requests...</div>
            ) : users.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                    🎉 No pending user verifications right now!
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-semibold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">ID Proof</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map((u) => {
                                    const uid = u._id || u.id
                                    return (
                                        <tr key={uid} className="hover:bg-slate-50/50 transition">
                                            <td className="px-6 py-4 font-medium text-slate-900">{u.name}</td>
                                            <td className="px-6 py-4">{u.email}</td>
                                            <td className="px-6 py-4">
                                                {u.idPhotoUrl ? (
                                                    <button
                                                        onClick={() => setSelectedImage(u.idPhotoUrl)}
                                                        className="text-indigo-600 hover:underline font-medium text-xs flex items-center gap-1"
                                                    >
                                                        View ID Card
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">No Photo Uploaded</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleAction(uid, 'approved')}
                                                    disabled={actionLoading === uid}
                                                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleAction(uid, 'rejected')}
                                                    disabled={actionLoading === uid}
                                                    className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                                                >
                                                    Reject
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {selectedImage && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white p-4 rounded-2xl max-w-2xl w-full shadow-2xl relative">
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 font-bold text-lg"
                        >
                            ✕
                        </button>
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Student ID Verification</h3>
                        <img src={selectedImage} alt="Student ID" className="w-full h-auto max-h-[70vh] object-contain rounded-lg border" />
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminDashboard