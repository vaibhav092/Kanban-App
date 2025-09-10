import express from 'express'
import { connectDB } from './DB/db.js'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import http from 'http'
import SocketServer from './Socket/Socket.js'
dotenv.config()

const app = express()
const port = 3000
const server = http.createServer(app)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
import authRoutes from './Router/Auth.routes.js'
app.use('/api/auth', authRoutes)

import KanbanRoutes from './Router/Kanban.routes.js'
import { verifyToken } from './Middleware/Auth.js'
app.use('/api/kanban', verifyToken, KanbanRoutes)

server.listen(port, async () => {
    try {
        await connectDB()
        await SocketServer(server)
        console.log(`Server is running on port ${port}`)
        console.log(process.env.UPSTASH_REDIS_REST_URL)
    } catch (error) {
        console.log(error)
        throw new Error('Error starting the server')
    }
})
