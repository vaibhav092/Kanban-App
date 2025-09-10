import jwt from 'jsonwebtoken'

export const verifyToken = async (req, res, next) => {
    const token =
        req.cookies.accessToken || req.headers.authorization?.split(' ')[1]
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' })
    }
}
