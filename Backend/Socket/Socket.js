import { WebSocketServer } from 'ws'
import jwt from 'jsonwebtoken'
import redis from '../Redis/Redis.js'
import { models } from '../DB/db.js'

// In-memory room registry: boardId -> Set<WebSocket>
const boardIdToClients = new Map()

// Track connection context
const clientContext = new WeakMap()

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

const broadcastToBoard = (boardId, message, excludeWs) => {
    const set = boardIdToClients.get(boardId)
    if (!set) return
    for (const client of set) {
        if (client !== excludeWs && client.readyState === 1) {
            try {
                client.send(JSON.stringify(message))
            } catch {}
        }
    }
}

const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        return decoded
    } catch {
        return null
    }
}

// Presence helpers in Redis
// Keys:
// presence:board:{boardId} -> Set of userIds
// presence:user:{userId}:board:{boardId} -> last seen timestamp (ms), with TTL
const PRESENCE_TTL_SECONDS = 30

const presenceKeyBoard = (boardId) => `presence:board:${boardId}`
const presenceKeyUserBoard = (userId, boardId) =>
    `presence:user:${userId}:board:${boardId}`

const touchPresence = async (userId, boardId) => {
    const now = Date.now()
    await Promise.all([
        redis.sadd(presenceKeyBoard(boardId), userId),
        redis.setex(presenceKeyUserBoard(userId, boardId), PRESENCE_TTL_SECONDS, `${now}`),
    ])
}

const leavePresence = async (userId, boardId) => {
    await Promise.all([
        redis.srem(presenceKeyBoard(boardId), userId),
        redis.del(presenceKeyUserBoard(userId, boardId)),
    ])
}

const getBoardPresence = async (boardId) => {
    const members = await redis.smembers(presenceKeyBoard(boardId))
    return members || []
}

export const SocketServer = async (server) => {
    const wss = new WebSocketServer({ server, path: '/ws' })

    wss.on('connection', async (ws, req) => {
        try {
            const url = new URL(req.url, 'http://localhost')
            const token = url.searchParams.get('token')
            const decoded = verifyToken(token)
            if (!decoded?.id) {
                ws.close(4001, 'Unauthorized')
                return
            }
            clientContext.set(ws, {
                userId: decoded.id,
                boards: new Set(),
            })
            ws.send(
                JSON.stringify({ type: 'connection:ack', data: { userId: decoded.id } })
            )
        } catch (e) {
            try {
                ws.close(1011, 'Init error')
            } catch {}
            return
        }

        ws.on('message', async (raw) => {
            let msg
            try {
                msg = JSON.parse(raw.toString())
            } catch {
                return
            }
            const ctx = clientContext.get(ws)
            if (!ctx) return
            const { userId } = ctx
            const { type, data } = msg || {}

            try {
                switch (type) {
                    case 'board:join': {
                        const { boardId } = data || {}
                        if (!boardId) return
                        ctx.boards.add(boardId)
                        addClientToBoard(boardId, ws)
                        await touchPresence(userId, boardId)
                        const users = await getBoardPresence(boardId)
                        ws.send(
                            JSON.stringify({
                                type: 'presence:state',
                                data: { boardId, users },
                            })
                        )
                        broadcastToBoard(
                            boardId,
                            { type: 'presence:join', data: { boardId, userId } },
                            ws
                        )
                        break
                    }
                    case 'board:leave': {
                        const { boardId } = data || {}
                        if (!boardId) return
                        ctx.boards.delete(boardId)
                        removeClientFromBoard(boardId, ws)
                        await leavePresence(userId, boardId)
                        broadcastToBoard(boardId, {
                            type: 'presence:leave',
                            data: { boardId, userId },
                        })
                        break
                    }
                    case 'presence:heartbeat': {
                        const { boardId } = data || {}
                        if (!boardId || !ctx.boards.has(boardId)) return
                        await touchPresence(userId, boardId)
                        break
                    }
                    case 'column:create': {
                        const { boardId, name, order } = data || {}
                        if (!boardId || !name || order === undefined) return
                        const created = await models.Column.create({
                            board_id: boardId,
                            name,
                            order,
                        })
                        const column = created.toJSON()
                        broadcastToBoard(boardId, {
                            type: 'column:created',
                            data: { boardId, column },
                        })
                        break
                    }
                    case 'column:update': {
                        const { columnId, updates } = data || {}
                        if (!columnId || !updates) return
                        const col = await models.Column.findOne({ where: { id: columnId } })
                        if (!col) return
                        await col.update(updates)
                        const column = col.toJSON()
                        const boardId = column.board_id
                        broadcastToBoard(boardId, {
                            type: 'column:updated',
                            data: { boardId, column },
                        })
                        break
                    }
                    case 'card:create': {
                        const { columnId, title, description, assignee, labels, order } =
                            data || {}
                        if (!columnId || !title) return
                        const created = await models.Card.create({
                            column_id: columnId,
                            title,
                            description: description ?? null,
                            assignee: assignee ?? null,
                            labels: labels ?? null,
                            order: order ?? null,
                        })
                        const card = created.toJSON()
                        // Resolve boardId from column
                        const column = await models.Column.findOne({ where: { id: columnId } })
                        const boardId = column?.board_id
                        if (!boardId) return
                        broadcastToBoard(boardId, {
                            type: 'card:created',
                            data: { boardId, card },
                        })
                        break
                    }
                    case 'card:update': {
                        const { cardId, updates } = data || {}
                        if (!cardId || !updates) return
                        const cardModel = await models.Card.findOne({ where: { id: cardId } })
                        if (!cardModel) return
                        await cardModel.update(updates)
                        const updated = cardModel.toJSON()
                        const column = await models.Column.findOne({ where: { id: updated.column_id } })
                        const boardId = column?.board_id
                        if (!boardId) return
                        broadcastToBoard(boardId, {
                            type: 'card:updated',
                            data: { boardId, card: updated },
                        })
                        break
                    }
                    case 'card:delete': {
                        const { cardId } = data || {}
                        if (!cardId) return
                        const cardModel = await models.Card.findOne({ where: { id: cardId } })
                        if (!cardModel) return
                        const column = await models.Column.findOne({ where: { id: cardModel.column_id } })
                        const boardId = column?.board_id
                        await cardModel.destroy()
                        if (!boardId) return
                        broadcastToBoard(boardId, {
                            type: 'card:deleted',
                            data: { boardId, cardId },
                        })
                        break
                    }
                    default:
                        break
                }
            } catch (e) {
                try {
                    ws.send(
                        JSON.stringify({ type: 'error', data: { message: 'action failed' } })
                    )
                } catch {}
            }
        })

        ws.on('close', async () => {
            const ctx = clientContext.get(ws)
            if (!ctx) return
            const { userId, boards } = ctx
            for (const boardId of boards) {
                removeClientFromBoard(boardId, ws)
                await leavePresence(userId, boardId)
                broadcastToBoard(boardId, {
                    type: 'presence:leave',
                    data: { boardId, userId },
                })
            }
            clientContext.delete(ws)
        })
    })
}

export default SocketServer