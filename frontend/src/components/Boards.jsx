import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { kanbanAPI } from '../utils/api'

const Boards = () => {
    const navigate = useNavigate()
    const [boards, setBoards] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        let isMounted = true
        ;(async () => {
            try {
                setLoading(true)
                const res = await kanbanAPI.AllgetBoards()
                if (isMounted) {
                    const payload = res?.data
                    const normalized = Array.isArray(payload)
                        ? payload
                        : Array.isArray(payload?.boards)
                          ? payload.boards
                          : Array.isArray(payload?.data)
                            ? payload.data
                            : Array.isArray(payload?.AllBoards)
                              ? payload.AllBoards
                              : []
                    setBoards(normalized)
                    console.log(payload)
                }
            } catch (e) {
                console.log(e)
                if (isMounted) setError('Failed to load boards')
            } finally {
                if (isMounted) setLoading(false)
            }
        })()
        return () => {
            isMounted = false
        }
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="text-neutral-600">Loading boards...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50">
                <div className="text-red-600">{error}</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="max-w-7xl mx-auto p-6">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Boards
                        </h1>
                        <p className="text-gray-600">Select a board to open</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {(Array.isArray(boards) ? boards : []).map((board) => (
                        <button
                            key={board.id || board._id}
                            onClick={() => navigate(`/board/${board.id}`)}
                            className="group text-left p-5 rounded-xl bg-white/70 backdrop-blur border border-white/40 shadow hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        {board.name}
                                    </div>
                                    {board.description && (
                                        <div className="mt-1 text-sm text-gray-600 line-clamp-2">
                                            {board.description}
                                        </div>
                                    )}
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                    {board.name
                                        .toString()
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Boards
