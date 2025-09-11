import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router'
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import websocketService from '../utils/websocket'
import { kanbanAPI } from '../utils/api.js'
import Column from './Column.jsx'
import Card from './Card.jsx'


export default function KanbanBoard() {
    const { boardId } = useParams()
    const [board, setBoard] = useState(null)
    const [draggingCard, setDraggingCard] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState(null)
    const [onlineUsers, setOnlineUsers] = useState(0)
    const wsReadyRef = useRef(false)

    const [showCreateColumn, setShowCreateColumn] = useState(false)
    const [pendingColumnName, setPendingColumnName] = useState('')

    const [showCreateCard, setShowCreateCard] = useState(false)
    const [targetListId, setTargetListId] = useState(null)
    const [pendingCardTitle, setPendingCardTitle] = useState('')
    const [pendingCardDescription, setPendingCardDescription] = useState('')

    const [recentEvents, setRecentEvents] = useState([])
    const [isAuditLoading, setIsAuditLoading] = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor)
    )

    async function loadBoard(id) {
        try {
            setIsLoading(true)
            const resp = await kanbanAPI.getBoard(id)
            const data = await resp.data
            setBoard(data.board)
        } catch (err) {
            console.error('Error fetching board:', err)
            setLoadError('Failed to load board')
        } finally {
            setIsLoading(false)
        }
    }

    async function loadRecentEvents(id) {
        try {
            setIsAuditLoading(true)
            const resp = await kanbanAPI.getAudit(id, 3)
            const logs = Array.isArray(resp?.data?.data) ? resp.data.data.slice(0, 5) : []
            setRecentEvents(logs)
        } catch (err) {
            console.error('Error fetching audit logs:', err)
        } finally {
            setIsAuditLoading(false)
        }
    }

    useEffect(() => {
        if (boardId) {
            loadBoard(boardId)
            loadRecentEvents(boardId)
        }
    }, [boardId])

    useEffect(() => {
        if (!boardId) return

        let isMounted = true
        const setupWebSocket = async () => {
            try {
                if (!wsReadyRef.current) {
                    await websocketService.connect()
                    wsReadyRef.current = true
                }
                websocketService.send({ type: 'board:join', data: { boardId } })
                const pushAudit = (eventType, dedupeKey) => {
                    setRecentEvents(prev => {
                        const nowIso = new Date().toISOString()
                        const wsId = `ws-${nowIso}-${Math.random()}`
                        const entry = {
                            id: wsId,
                            event_type: eventType,
                            created_at: nowIso,
                            _k: dedupeKey,
                        }
                        const existing = (prev || [])
                        if (existing.some(e => e?._k && dedupeKey && e._k === dedupeKey)) {
                            return existing
                        }
                        const next = [entry, ...existing]
                        return next.slice(0, 3)
                    })
                }
                const onJoined = async () => {
                    if (!isMounted) return
                    await loadBoard(boardId)
                }
                const onOnlineCount = (data) => {
                    if (!isMounted) return
                    if (data?.boardId === boardId) setOnlineUsers(data.count || 0)
                }
                const onColumnCreated = (data) => {
                    if (!isMounted) return
                    setBoard(prev => {
                        if (!prev) return prev
                        const exists = prev.Columns.some(c => c.id === data.column.id)
                        if (exists) return prev
                        return {
                            ...prev,
                            Columns: [...prev.Columns, data.column]
                        }
                    })
                    pushAudit('ColumnCreated', `ColumnCreated:${data?.column?.id}`)
                }
                const onColumnUpdated = (data) => {
                    if (!isMounted) return
                    setBoard(prev => {
                        if (!prev) return prev
                        return {
                            ...prev,
                            Columns: prev.Columns.map(col => 
                                col.id === data.column.id ? data.column : col
                            )
                        }
                    })
                    pushAudit('ColumnUpdated', `ColumnUpdated:${data?.column?.id}`)
                }
                const onColumnDeleted = (data) => {
                    if (!isMounted) return
                    setBoard(prev => {
                        if (!prev) return prev
                        return {
                            ...prev,
                            Columns: prev.Columns.filter(col => col.id !== data.columnId)
                        }
                    })
                    pushAudit('ColumnDeleted', `ColumnDeleted:${data?.columnId}`)
                }
                const onCardCreated = (data) => {
                    if (!isMounted) return
                    setBoard(prev => {
                        if (!prev) return prev
                        return {
                            ...prev,
                            Columns: prev.Columns.map(col => {
                                if (col.id === data.card.column_id) {
                                    const exists = (col.Cards || []).some(c => c.id === data.card.id)
                                    if (exists) return col
                                    return {
                                        ...col,
                                        Cards: [...(col.Cards || []), data.card]
                                    }
                                }
                                return col
                            })
                        }
                    })
                    pushAudit('CardCreated', `CardCreated:${data?.card?.id}`)
                }
                const onCardUpdated = (data) => {
                    if (!isMounted) return
                    setBoard(prev => {
                        if (!prev) return prev
                        return {
                            ...prev,
                            Columns: prev.Columns.map(col => ({
                                ...col,
                                Cards: (col.Cards || []).map(card => 
                                    card.id === data.card.id ? data.card : card
                                )
                            }))
                        }
                    })
                    pushAudit('CardUpdated', `CardUpdated:${data?.card?.id}`)
                }
                const onCardDeleted = (data) => {
                    if (!isMounted) return
                    setBoard(prev => {
                        if (!prev) return prev
                        return {
                            ...prev,
                            Columns: prev.Columns.map(col => ({
                                ...col,
                                Cards: (col.Cards || []).filter(card => card.id !== data.cardId)
                            }))
                        }
                    })
                    pushAudit('CardDeleted', `CardDeleted:${data?.cardId}`)
                }
                const onCardMoved = (data) => {
                    if (!isMounted) return
                    setBoard(prev => {
                        if (!prev) return prev
                        const newColumns = prev.Columns.map(col => {
                            if (col.id === data.oldColumnId) {
                                return {
                                    ...col,
                                    Cards: (col.Cards || []).filter(card => card.id !== data.card.id)
                                }
                            }
                            if (col.id === data.newColumnId) {
                                const updated = [...(col.Cards || []).filter(c => c.id !== data.card.id)]
                                const insertIndex = Number.isFinite(data.card.order) ? Math.max(0, Math.min(updated.length, data.card.order)) : updated.length
                                updated.splice(insertIndex, 0, data.card)
                                return {
                                    ...col,
                                    Cards: updated
                                }
                            }
                            return col
                        })
                        return { ...prev, Columns: newColumns }
                    })
                    pushAudit('CardMoved', `CardMoved:${data?.card?.id}:${data?.oldColumnId}->${data?.newColumnId}:${data?.card?.order}`)
                }
                const onWsError = (data) => {
                    if (!isMounted) return
                    console.error('WebSocket error:', data?.message || data)
                    setLoadError((data && data.message) || 'Realtime error')
                }

                websocketService.on('joined', onJoined)
                websocketService.on('online:count', onOnlineCount)
                websocketService.on('column:created', onColumnCreated)
                websocketService.on('column:updated', onColumnUpdated)
                websocketService.on('column:deleted', onColumnDeleted)
                websocketService.on('card:created', onCardCreated)
                websocketService.on('card:updated', onCardUpdated)
                websocketService.on('card:deleted', onCardDeleted)
                websocketService.on('card:moved', onCardMoved)
                websocketService.on('error', onWsError)

                return () => {
                    isMounted = false
                    websocketService.off('joined')
                    websocketService.off('online:count')
                    websocketService.off('column:created')
                    websocketService.off('column:updated')
                    websocketService.off('column:deleted')
                    websocketService.off('card:created')
                    websocketService.off('card:updated')
                    websocketService.off('card:deleted')
                    websocketService.off('card:moved')
                    websocketService.off('error')
                }
            } catch (error) {
                console.error('WebSocket connection failed:', error)
            }
        }

        const cleanup = setupWebSocket()
        return () => {
            if (typeof cleanup === 'function') cleanup()
        }
    }, [boardId])

    const handleDragStart = (event) => {
        const { active } = event
        const card = findCardById(active.id)
        setDraggingCard(card)
    }

    const handleDragEnd = (event) => {
        const { active, over } = event
        setDraggingCard(null)

        if (!over) return

        const draggedCard = findCardById(active.id)
        if (!draggedCard) return

        const overCard = findCardById(over.id)
        const overColumn = overCard ? findColumnByCardId(over.id) : findColumnById(over.id)
        if (!overColumn) return

        const fromColumn = findColumnByCardId(active.id)
        if (!fromColumn) return

        let newOrder = 0
        const targetCards = getColumnCards(overColumn.id)
        if (overCard) {
            const idx = targetCards.findIndex(c => c.id === overCard.id)
            newOrder = idx >= 0 ? idx : targetCards.length
        } else {
            newOrder = targetCards.length
        }

        if (fromColumn.id === overColumn.id) {
            const without = (fromColumn.Cards || []).filter(c => c.id !== draggedCard.id)
            const clampedIndex = Math.max(0, Math.min(without.length, newOrder))
            without.splice(clampedIndex, 0, { ...draggedCard, order: clampedIndex })

            setBoard(prev => ({
                ...prev,
                Columns: prev.Columns.map(col => col.id === fromColumn.id ? { ...col, Cards: without } : col)
            }))

            websocketService.moveCard(draggedCard.id, fromColumn.id, clampedIndex)
            return
        }

        const crossNewOrder = targetCards.length
        setBoard(prev => {
            const newColumns = prev.Columns.map(col => {
                if (col.id === fromColumn.id) {
                    return {
                        ...col,
                        Cards: (col.Cards || []).filter(card => card.id !== draggedCard.id)
                    }
                }
                if (col.id === overColumn.id) {
                    const updated = [...(col.Cards || [])]
                    const insertIndex = Math.max(0, Math.min(updated.length, crossNewOrder))
                    updated.splice(insertIndex, 0, { ...draggedCard, column_id: overColumn.id, order: insertIndex })
                    return { ...col, Cards: updated }
                }
                return col
            })
            return { ...prev, Columns: newColumns }
        })

        websocketService.moveCard(draggedCard.id, overColumn.id, crossNewOrder)
    }

    const handleOpenAddCard = (columnId) => {
        setTargetListId(columnId)
        setPendingCardTitle('')
        setPendingCardDescription('')
        setShowCreateCard(true)
    }

    const handleConfirmAddCard = () => {
        const title = pendingCardTitle.trim()
        if (!title || !targetListId) return setShowCreateCard(false)
        const order = getColumnCards(targetListId).length
        websocketService.createCard(targetListId, title, pendingCardDescription || '', order)
        setShowCreateCard(false)
    }

    const handleDeleteCard = (cardId) => {
        if (!confirm('Delete this card?')) return
        websocketService.deleteCard(cardId)
    }

    const handleOpenAddColumn = () => {
        setPendingColumnName('')
        setShowCreateColumn(true)
    }

    const handleConfirmAddColumn = () => {
        const name = pendingColumnName.trim()
        if (!name) return setShowCreateColumn(false)
        const order = board?.Columns?.length || 0
        websocketService.createColumn(boardId, name, order)
        setShowCreateColumn(false)
    }

    const handleDeleteColumn = (columnId) => {
        if (!confirm('Delete this column and its cards?')) return
        websocketService.deleteColumn(columnId)
    }

    const findCardById = (id) => {
        if (!board) return null
        for (const column of board.Columns) {
            const card = (column.Cards || []).find(card => card.id === id)
            if (card) return card
        }
        return null
    }

    const findColumnByCardId = (cardId) => {
        if (!board) return null
        return board.Columns.find(column => 
            (column.Cards || []).some(card => card.id === cardId)
        )
    }

    const findColumnById = (columnId) => {
        if (!board) return null
        return board.Columns.find(column => column.id === columnId)
    }

    const getColumnCards = (columnId) => {
        const column = findColumnById(columnId)
        return column ? (column.Cards || []) : []
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>Loading board...</p>
                </div>
            </div>
        )
    }

    if (loadError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
                <div className="text-center">
                    <div className="text-red-500 text-xl mb-4">❌</div>
                    <p className="text-red-400">{loadError}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    if (!board) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
                <p>Board not found</p>
            </div>
        )
    }

    const sortedColumns = [...board.Columns].sort((a, b) => (a.order || 0) - (b.order || 0))

    return (
        <div className="min-h-screen p-4 bg-neutral-950 text-white">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-3xl font-bold text-white">{board.name}</h1>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-neutral-300 bg-neutral-800 px-3 py-1 rounded-full">Online: {onlineUsers}</span>
                            <button 
                                onClick={handleOpenAddColumn}
                                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white transition-colors"
                            >
                                + Add Column
                            </button>
                        </div>
                    </div>
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex space-x-6 overflow-x-auto pb-4">
                        {sortedColumns.map(column => (
                            <Column
                                key={column.id}
                                column={column}
                                cards={column.Cards || []}
                                onAddCard={() => handleOpenAddCard(column.id)}
                                onDeleteColumn={handleDeleteColumn}
                                onDeleteCard={handleDeleteCard}
                            />
                        ))}
                    </div>

                    <DragOverlay>
                        {draggingCard ? <Card card={draggingCard} isDragging={true} onDeleteCard={handleDeleteCard} /> : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {showCreateColumn && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 w-full max-w-sm">
                        <h2 className="text-white text-lg font-semibold mb-4">New Column</h2>
                        <input
                            autoFocus
                            value={pendingColumnName}
                            onChange={(e) => setPendingColumnName(e.target.value)}
                            placeholder="Column name"
                            className="w-full bg-neutral-800 text-white placeholder-neutral-400 border border-neutral-700 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:border-blue-500"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowCreateColumn(false)} className="px-3 py-2 rounded-lg bg-neutral-800 text-white hover:bg-neutral-700">Cancel</button>
                            <button onClick={handleConfirmAddColumn} className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Create</button>
                        </div>
                    </div>
                </div>
            )}

            {showCreateCard && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 w-full max-w-sm">
                        <h2 className="text-white text-lg font-semibold mb-4">New Card</h2>
                        <input
                            autoFocus
                            value={pendingCardTitle}
                            onChange={(e) => setPendingCardTitle(e.target.value)}
                            placeholder="Card title"
                            className="w-full bg-neutral-800 text-white placeholder-neutral-400 border border-neutral-700 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:border-blue-500"
                        />
                        <textarea
                            value={pendingCardDescription}
                            onChange={(e) => setPendingCardDescription(e.target.value)}
                            placeholder="Description (optional)"
                            rows={3}
                            className="w-full bg-neutral-800 text-white placeholder-neutral-400 border border-neutral-700 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:border-blue-500"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowCreateCard(false)} className="px-3 py-2 rounded-lg bg-neutral-800 text-white hover:bg-neutral-700">Cancel</button>
                            <button onClick={handleConfirmAddCard} className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Create</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed bottom-4 right-4 w-full max-w-md bg-neutral-900/95 border border-neutral-800 rounded-xl shadow-xl p-4 backdrop-blur z-40">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold text-sm">Recent activity</h3>
                    {isAuditLoading && (
                        <span className="text-xs text-neutral-400">Loading…</span>
                    )}
                </div>
                <div className="space-y-2 max-h-64 overflow-auto pr-1">
                    {(recentEvents || []).map((log) => (
                        <div key={log.id} className="text-xs text-neutral-300 bg-neutral-800/60 border border-neutral-700 rounded-lg p-2">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-white/90">
                                    {log.event_type === 'CardMoved' ? 'Card moved' : log.event_type}
                                </span>
                                <span className="text-[10px] text-neutral-400">
                                    {new Date(log.created_at || log.createdAt).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    ))}
                    {!isAuditLoading && recentEvents.length === 0 && (
                        <div className="text-xs text-neutral-500">No recent activity</div>
                    )}
                </div>
                <div className="mt-3 flex justify-end">
                    <button
                        onClick={() => loadRecentEvents(boardId)}
                        className="text-xs px-3 py-1 rounded-md bg-neutral-800 text-white border border-neutral-700 hover:bg-neutral-700"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        </div>
    )
}