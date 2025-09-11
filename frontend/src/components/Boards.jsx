import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { kanbanAPI } from '../utils/api'
import LogoutButton from './LogoutButton'

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
                    const normalized = Array.isArray(res?.data?.data)
                        ? res.data.data
                        : []
                    setBoards(normalized)
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
            <div className="min-h-screen flex items-center justify-center bg-neutral-950">
                <div className="text-neutral-400">Loading boards...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-950">
                <div className="text-red-400">{error}</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-950">
            <div className="fixed top-4 right-4 z-10">
                <LogoutButton />
            </div>
            <div className="max-w-7xl mx-auto p-6">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">
                            Boards
                        </h1>
                        <p className="text-neutral-400">
                            Select a board to open
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {(Array.isArray(boards) ? boards : []).map((board) => (
                        <button
                            key={board.id || board._id}
                            onClick={() => navigate(`/board/${board.id}`)}
                            className="group text-left p-5 rounded-xl bg-neutral-900 border border-neutral-800 shadow hover:shadow-lg hover:border-neutral-700 transition-all"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-lg font-semibold text-white">
                                        {board.name}
                                    </div>
                                    {board.description && (
                                        <div className="mt-1 text-sm text-neutral-400 line-clamp-2">
                                            {board.description}
                                        </div>
                                    )}
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-blue-900/40 text-blue-300 flex items-center justify-center font-bold">
                                    {board.name
                                        ?.toString()
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
