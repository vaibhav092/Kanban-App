import express, { Request, Response } from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import cors from 'cors'
import {toNodeHandler} from 'better-auth/node'
import { auth } from './utils/auth'
import { testDB } from './db/db'
dotenv.config()

const app = express()

app.all('/api/auth/{*any}',toNodeHandler(auth))

app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))
app.use(cors())

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Works' })
})


const PORT = process.env.PORT
app.listen(PORT, () => {
    try {
        testDB()
        console.log(`Server running on http://localhost:${PORT}`)
    } catch (error) {
        console.log("Server Error ::",error);
    }
})
