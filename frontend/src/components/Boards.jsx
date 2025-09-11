import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { kanbanAPI } from '../utils/api'
import LogoutButton from './LogoutButton'

const Boards = () => {
    const navigate = useNavigate()
    const [boards, setBoards] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [creating, setCreating] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newBoardName, setNewBoardName] = useState('')

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

    const submitCreateBoard = async () => {
        const name = newBoardName
        if (!name || !name.trim()) return
        try {
            setCreating(true)
            const res = await kanbanAPI.createBoard({ name: name.trim() })
            const created = res?.data?.Board
            if (created) {
                setBoards((prev) => [created, ...prev])
                setShowCreateModal(false)
                setNewBoardName('')
            }
        } catch (e) {
            console.log(e)
            setError('Failed to create board')
        } finally {
            setCreating(false)
        }
    }

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
                    <button
                        onClick={() => setShowCreateModal(true)}
                        disabled={creating}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {creating ? 'Creating...' : 'Add Board'}
                    </button>
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

            {showCreateModal && (
                <div className="fixed inset-0 z-20 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={() => (!creating ? setShowCreateModal(false) : null)}
                    />
                    <div className="relative z-30 w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-5 shadow-xl">
                        <h2 className="text-white text-xl font-semibold">New Board</h2>
                        <p className="text-neutral-400 text-sm mt-1">Enter a name for your board.</p>
                        <div className="mt-4">
                            <input
                                type="text"
                                autoFocus
                                value={newBoardName}
                                onChange={(e) => setNewBoardName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') submitCreateBoard()
                                    if (e.key === 'Escape' && !creating) setShowCreateModal(false)
                                }}
                                placeholder="Board name"
                                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                disabled={creating}
                                className="px-4 py-2 rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800 disabled:opacity-60"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitCreateBoard}
                                disabled={creating || !newBoardName.trim()}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60"
                            >
                                {creating ? 'Creating…' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Boards
