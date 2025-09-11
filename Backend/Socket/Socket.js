import { WebSocketServer } from 'ws'
import { models } from '../DB/db.js'

const boardIdToClients = new Map()

const addClientToBoard = (boardId, ws) => {
    if (!boardIdToClients.has(boardId)) {
        boardIdToClients.set(boardId, new Set())
    }
    boardIdToClients.get(boardId).add(ws)
}

const removeClientFromBoard = (boardId, ws) => {
    const set = boardIdToClients.get(boardId)
    if (set) {
        set.delete(ws)
        if (set.size === 0) {
            boardIdToClients.delete(boardId)
        }
    }
}

const broadcastToBoard = (boardId, message) => {
    const set = boardIdToClients.get(boardId)
    if (!set) return

    for (const client of set) {
        if (client.readyState === 1) {
            try {
                client.send(JSON.stringify(message))
            } catch {}
        }
    }
}

const emitOnlineCount = (boardId) => {
    const count = boardIdToClients.get(boardId)?.size || 0
    broadcastToBoard(boardId, { type: 'online:count', data: { boardId, count } })
}

const SocketServer = async (server) => {
    const wss = new WebSocketServer({ server, path: '/ws' })

    wss.on('connection', async (ws) => {
        console.log('✅ New WebSocket connection')

        ws.on('message', async (raw) => {
            let msg
            try {
                msg = JSON.parse(raw.toString())
            } catch {
                return
            }

            const { type, data } = msg || {}

            switch (type) {
                case 'ping': {
                    ws.send(JSON.stringify({ type: 'pong' }))
                    break
                }

                case 'board:join': {
                    const { boardId } = data || {}
                    if (!boardId) return

                    addClientToBoard(boardId, ws)
                    ws.send(
                        JSON.stringify({ type: 'joined', data: { boardId } })
                    )
                    emitOnlineCount(boardId)
                    break
                }

                case 'column:create': {
                    const { boardId, name, order } = data || {}
                    if (!boardId || !name) return

                    try {
                        const column = await models.Column.create({
                            board_id: boardId,
                            name: name.trim(),
                            order: order || 0,
                        })

                        broadcastToBoard(boardId, {
                            type: 'column:created',
                            data: { boardId, column },
                        })
                    } catch (error) {
                        console.error('Error creating column:', error)
                        ws.send(
                            JSON.stringify({
                                type: 'error',
                                data: { message: 'Failed to create column' },
                            })
                        )
                    }
                    break
                }

                case 'column:update': {
                    const { columnId, updates } = data || {}
                    if (!columnId || !updates) return

                    try {
                        const column = await models.Column.findByPk(columnId)
                        if (!column) {
                            ws.send(
                                JSON.stringify({
                                    type: 'error',
                                    data: { message: 'Column not found' },
                                })
                            )
                            return
                        }

                        await column.update(updates)

                        broadcastToBoard(column.board_id, {
                            type: 'column:updated',
                            data: { boardId: column.board_id, column },
                        })
                    } catch (error) {
                        console.error('Error updating column:', error)
                        ws.send(
                            JSON.stringify({
                                type: 'error',
                                data: { message: 'Failed to update column' },
                            })
                        )
                    }
                    break
                }

                case 'column:delete': {
                    const { columnId } = data || {}
                    if (!columnId) return

                    try {
                        const column = await models.Column.findByPk(columnId)
                        if (!column) return

                        const boardId = column.board_id
                        await column.destroy()

                        broadcastToBoard(boardId, {
                            type: 'column:deleted',
                            data: { boardId, columnId },
                        })
                    } catch (error) {
                        console.error('Error deleting column:', error)
                        ws.send(
                            JSON.stringify({
                                type: 'error',
                                data: { message: 'Failed to delete column' },
                            })
                        )
                    }
                    break
                }

                case 'card:create': {
                    const { columnId, title, description, order } = data || {}
                    if (!columnId || !title) return

                    try {
                        const column = await models.Column.findByPk(columnId)
                        if (!column) return

                        const card = await models.Card.create({
                            column_id: columnId,
                            title: title.trim(),
                            description: description || '',
                            order: Number.isFinite(order) ? order : 0,
                        })

                        broadcastToBoard(column.board_id, {
                            type: 'card:created',
                            data: { boardId: column.board_id, card },
                        })
                    } catch (error) {
                        console.error('Error creating card:', error)
                        ws.send(
                            JSON.stringify({
                                type: 'error',
                                data: { message: 'Failed to create card' },
                            })
                        )
                    }
                    break
                }

                case 'card:update': {
                    const { cardId, updates } = data || {}
                    if (!cardId || !updates) return

                    try {
                        const card = await models.Card.findByPk(cardId, {
                            include: [{ model: models.Column, as: 'column' }],
                        })
                        if (!card) return

                        await card.update(updates)

                        broadcastToBoard(card.column.board_id, {
                            type: 'card:updated',
                            data: { boardId: card.column.board_id, card },
                        })
                    } catch (error) {
                        console.error('Error updating card:', error)
                        ws.send(
                            JSON.stringify({
                                type: 'error',
                                data: { message: 'Failed to update card' },
                            })
                        )
                    }
                    break
                }

                case 'card:delete': {
                    const { cardId } = data || {}
                    if (!cardId) return

                    try {
                        const card = await models.Card.findByPk(cardId, {
                            include: [{ model: models.Column, as: 'column' }],
                        })
                        if (!card) return

                        const boardId = card.column.board_id
                        await card.destroy()

                        broadcastToBoard(boardId, {
                            type: 'card:deleted',
                            data: { boardId, cardId },
                        })
                    } catch (error) {
                        console.error('Error deleting card:', error)
                        ws.send(
                            JSON.stringify({
                                type: 'error',
                                data: { message: 'Failed to delete card' },
                            })
                        )
                    }
                    break
                }

                case 'card:move': {
                    const { cardId, newColumnId, newOrder } = data || {}
                    if (!cardId || !newColumnId) return

                    try {
                        const card = await models.Card.findByPk(cardId, {
                            include: [{ model: models.Column, as: 'column' }],
                        })
                        if (!card) return

                        const newColumn =
                            await models.Column.findByPk(newColumnId)
                        if (
                            !newColumn ||
                            newColumn.board_id !== card.column.board_id
                        )
                            return

                        const oldColumnId = card.column_id

                        await card.update({
                            column_id: newColumnId,
                            order: Number.isFinite(newOrder) ? newOrder : 0,
                        })

                        broadcastToBoard(card.column.board_id, {
                            type: 'card:moved',
                            data: {
                                boardId: card.column.board_id,
                                card,
                                oldColumnId,
                                newColumnId,
                            },
                        })
                    } catch (error) {
                        console.error('Error moving card:', error)
                        ws.send(
                            JSON.stringify({
                                type: 'error',
                                data: { message: 'Failed to move card' },
                            })
                        )
                    }
                    break
                }
            }
        })

        ws.on('close', () => {
            for (const [boardId, clients] of boardIdToClients.entries()) {
                if (clients.has(ws)) {
                    removeClientFromBoard(boardId, ws)
                    emitOnlineCount(boardId)
                }
            }
        })
    })
}

export default SocketServer