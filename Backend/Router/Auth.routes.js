import Router from 'express'
import {
    register,
    login,
    refreshAccessToken,
    logout,
    isLogin,
} from '../Controller/User.js'
import { verifyToken } from '../Middleware/Auth.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refreshAccessToken)
router.post('/logout', logout)
router.get('/isLogin', verifyToken, isLogin)

export default router
