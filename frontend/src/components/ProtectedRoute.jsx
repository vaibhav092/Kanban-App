import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { authAPI } from '../utils/api.js'

const ProtectedRoute = ({ children }) => {
    const [checked, setChecked] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        let isMounted = true

        const checkLogin = async () => {
            try {
                const res = await authAPI.isLogin()
                if (isMounted) {
                    setIsAuthenticated(res.data.isLogin)
                }
            } catch {
                if (isMounted) {
                    setIsAuthenticated(false)
                }
            } finally {
                if (isMounted) setChecked(true)
            }
        }

        checkLogin()

        return () => {
            isMounted = false
        }
    }, [])

    if (!checked) return <div>Loading...</div>

    return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default ProtectedRoute
