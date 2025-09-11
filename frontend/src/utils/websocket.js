class WebSocketService {
    constructor() {
        if (WebSocketService.instance) return WebSocketService.instance
        WebSocketService.instance = this

        this.ws = null
        this.connected = false
        this.reconnectAttempts = 0
        this.maxReconnectAttempts = 5
        this.listeners = new Map()
        this.pending = []
        this.heartbeat = null

        return this
    }

    getWebSocketUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const host = window.location.hostname
        return `${protocol}//${host}:3000/ws`
    }

    connect() {
        if (this.ws && this.connected) return Promise.resolve()

        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.getWebSocketUrl())

            this.ws.onopen = () => {
                console.log('WebSocket connected')
                this.connected = true
                this.reconnectAttempts = 0
                this.emit('connected')

                this.pending.forEach((msg) => this.ws.send(msg))
                this.pending = []

                this.startHeartbeat()
                resolve()
            }

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data)
                    this.handleMessage(message)
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error)
                }
            }

            this.ws.onclose = () => {
                console.log('WebSocket disconnected')
                this.connected = false
                this.emit('disconnected')
                this.stopHeartbeat()

                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnect()
                }
            }

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error)
                this.emit('error', error)
                reject(error)
            }
        })
    }

    reconnect() {
        this.reconnectAttempts++
        const delay = Math.min(this.reconnectAttempts * 1000, 10000)
        console.log(`Reconnecting WebSocket in ${delay / 1000}s`)

        setTimeout(() => this.connect(), delay)
    }

    disconnect() {
        if (this.ws) {
            this.connected = false
            this.stopHeartbeat()
            this.ws.close()
            this.ws = null
        }
    }

    send(message) {
        const payload = JSON.stringify(message)
        if (!this.connected || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('WS not ready, queueing message')
            this.pending.push(payload)
            return false
        }

        try {
            this.ws.send(payload)
            return true
        } catch (error) {
            console.error('Error sending message:', error)
            return false
        }
    }

    handleMessage(message) {
        const { type, data } = message
        this.emit(type, data)
    }

    on(event, callback) {
        if (!this.listeners.has(event)) this.listeners.set(event, new Set())
        this.listeners.get(event).add(callback)
    }

    off(event, callback) {
        if (!this.listeners.has(event)) return
        if (callback) {
            this.listeners.get(event).delete(callback)
            if (this.listeners.get(event).size === 0) {
                this.listeners.delete(event)
            }
        } else {
            this.listeners.delete(event)
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach((callback) => {
                try {
                    callback(data)
                } catch (err) {
                    console.error(err)
                }
            })
        }
    }

    startHeartbeat() {
        this.stopHeartbeat()
        this.heartbeat = setInterval(() => {
            if (this.connected) {
                this.send({ type: 'ping' })
            }
        }, 30000)
    }

    stopHeartbeat() {
        if (this.heartbeat) clearInterval(this.heartbeat)
        this.heartbeat = null
    }

    createColumn(boardId, name, order) {
        return this.send({
            type: 'column:create',
            data: { boardId, name, order },
        })
    }

    updateColumn(columnId, updates) {
        return this.send({
            type: 'column:update',
            data: { columnId, updates },
        })
    }

    deleteColumn(columnId) {
        return this.send({
            type: 'column:delete',
            data: { columnId },
        })
    }

    createCard(columnId, title, description = '', order = 0) {
        return this.send({
            type: 'card:create',
            data: { columnId, title, description, order },
        })
    }

    updateCard(cardId, updates) {
        return this.send({
            type: 'card:update',
            data: { cardId, updates },
        })
    }

    deleteCard(cardId) {
        return this.send({
            type: 'card:delete',
            data: { cardId },
        })
    }

    moveCard(cardId, newColumnId, newOrder = 0) {
        return this.send({
            type: 'card:move',
            data: { cardId, newColumnId, newOrder },
        })
    }
}

const wsClient = new WebSocketService()
export default wsClient
