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
const serverPort = process.env.PORT ? Number(process.env.PORT) : 3000
const server = http.createServer(app)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(
    cors({
        origin: ['http://localhost:5000'],
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
import { verifyToken } from './Middleware/Auth.js'
app.use('/api/kanban',  KanbanRoutes)

app.use(express.static(path.join(__dirname, 'public')))

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})
  

server.listen(serverPort, async () => {
    try {
        await connectDB()
    } catch (error) {
        console.error('Continuing without database. Reason:', error?.message || error)
    }

    try {
        await SocketServer(server)
    } catch (error) {
        console.error('Failed to initialize WebSocket server:', error?.message || error)
    }

    console.log(`Server is running on port ${serverPort}`)
})
