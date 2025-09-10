import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { models } from '../DB/db.js'
import redis from '../Redis/Redis.js'

const NODE_ENV = 'Dev'
const JWT_SECRET = process.env.JWT_SECRET
const isProd = NODE_ENV === 'production'

const generateAccessToken = (userId) => {
    return jwt.sign({ id: userId }, JWT_SECRET, {
        expiresIn: '15m',
    })
}

const generateRefreshToken = (userId) => {
    return jwt.sign({ id: userId }, JWT_SECRET, {
        expiresIn: '7d',
    })
}

const setRefreshToken = async (userId, token) => {
    const ttl = 7 * 24 * 60 * 60
    await redis.setex(`refresh:${userId}`, ttl, token)
}

const getRefreshToken = async (userId) => {
    return redis.get(`refresh:${userId}`)
}

const deleteRefreshToken = async (userId) => {
    await redis.del(`refresh:${userId}`)
}

const accessTokenCookieOptions = {
    httpOnly: true,
    secure: isProd,
    maxAge: 300 * 60 * 1000,
}

const refreshTokenCookieOptions = {
    httpOnly: true,
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
}

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body

        if (!name || !email || !password) {
            return res
                .status(400)
                .json({ success: false, message: 'All fields are required' })
        }

        const existing = await models.User.findOne({ where: { email } })
        if (existing) {
            return res
                .status(400)
                .json({ success: false, message: 'Email Exist' })
        }
        const hashed = await bcrypt.hash(password, 10)

        const user = await models.User.create({
            name,
            email,
            password: hashed,
        })

        const { password: _pw, ...safe } = user.toJSON()
        return res.status(201).json({ success: true, user: safe })
    } catch (err) {
        console.error('Register error:', err)
        return res
            .status(500)
            .json({ success: false, message: 'Registration failed' })
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res
                .status(400)
                .json({ success: false, message: 'All fields are required' })
        }

        const user = await models.User.findOne({ where: { email } })
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User does not exist',
            })
        }

        const ok = await bcrypt.compare(password, user.password)
        if (!ok) {
            return res.status(401).json({
                success: false,
                message: 'Password is incorrect',
            })
        }

        const accessToken = generateAccessToken(user.id)
        const refreshToken = generateRefreshToken(user.id)

        await setRefreshToken(user.id, refreshToken)
        const obj = {
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        }
        console.log(obj)

        const { password: _pw, ...safe } = user.toJSON()

        res.cookie('accessToken', accessToken, accessTokenCookieOptions)
        res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions)

        return res.json({
            success: true,
            user: safe,
            accessToken,
            refreshToken,
        })
    } catch (err) {
        console.error('Login error:', err)
        return res.status(500).json({ success: false, message: 'Login failed' })
    }
}

export const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.cookies || {}

        if (!refreshToken) {
            return res.status(401).json({ message: 'No refresh token' })
        }

        const decoded = jwt.verify(refreshToken, JWT_SECRET)
        const userId = decoded?.id
        if (!userId) {
            return res.status(403).json({ message: 'Invalid token' })
        }

        const stored = await getRefreshToken(userId)
        if (!stored || stored !== refreshToken) {
            return res.status(403).json({ message: 'Invalid token' })
        }

        const role = 'user'
        const newAccessToken = generateAccessToken(userId, role)

        res.cookie('accessToken', newAccessToken, accessTokenCookieOptions)
        return res.json({ accessToken: newAccessToken })
    } catch (err) {
        console.error('Refresh token error:', err)
        return res.status(403).json({ message: 'Token invalid or expired' })
    }
}

export const logout = async (req, res) => {
    try {
        let userId = req.user?.id
        if (!userId) {
            try {
                const { refreshToken } = req.cookies || {}
                if (refreshToken) {
                    const decoded = jwt.verify(refreshToken, JWT_SECRET)
                    userId = decoded?.id
                }
            } catch {}
        }

        if (userId) {
            await deleteRefreshToken(userId)
        }

        res.clearCookie('accessToken')
        res.clearCookie('refreshToken')

        return res
            .status(200)
            .json({ success: true, message: 'Logged out successfully' })
    } catch (err) {
        console.error('Logout error:', err)
        return res
            .status(500)
            .json({ success: false, message: 'Failed to logout' })
    }
}

export const isLogin = async (req, res) => {
    try {
        const { id } = req.user
        if (!id) {
            return res.status(200).json({ isLogin: false, id: null })
        }
        return res.status(200).json({ isLogin: true, user: id })
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}
