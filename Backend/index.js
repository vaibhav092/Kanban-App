import express from 'express'
import { connectDB } from './DB/db.js'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import http from 'http'
import SocketServer from './Socket/Socket.js'
import morgan from 'morgan'
import { fileURLToPath } from 'url'
import path from 'path'
dotenv.config()

const app = express()
const serverPort = 3000
const server = http.createServer(app)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(
    cors({
        origin: (origin, callback) => callback(null, true),
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    })
)
app.use(morgan('dev'))
app.use((req, res, next) => {
    res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate'
    )
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    res.setHeader('Surrogate-Control', 'no-store')
    next()
})
import authRoutes from './Router/Auth.routes.js'
app.use('/api/auth', authRoutes)

import KanbanRoutes from './Router/Kanban.routes.js'
app.use('/api/kanban', KanbanRoutes)

app.use(express.static(path.join(__dirname, 'public')))

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})
  
const startServer = async () => {
    try {
        console.log('Connecting to database...')
        await connectDB()
        console.log('Database connected successfully')

        console.log('Starting WebSocket server...')
        await SocketServer(server)
        console.log('WebSocket server started!')
    } catch (err) {
        console.error('Startup error:', err?.message || err)
    }

    server.listen(serverPort, () => {
        console.log(`Server is running on port ${serverPort}`)
    })

    setInterval(() => {
        console.log('Heartbeat: server is alive')
    }, 30000)
}

const shutdown = () => {
    console.log('Received shutdown signal. Closing server...')
    server.close(() => {
        console.log('HTTP server closed.')
        process.exit(0)
    })
    setTimeout(() => process.exit(0), 5000).unref()
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

startServer()
