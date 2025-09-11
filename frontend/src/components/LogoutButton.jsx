// components/LogoutButton.jsx
import React from 'react'
import { useNavigate } from 'react-router'
import { authAPI } from '../utils/api'

const LogoutButton = () => {
    const navigate = useNavigate()

    const handleLogout = async () => {
        try {
            await authAPI.logout()
            navigate('/login')
        } catch (err) {
            console.error('Logout failed', err)
            navigate('/login')
        }
    }
    return (
        <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-400 text-white rounded-lg hover:bg-red-600 transition"
        >
            Logout
        </button>
    )
}

export default LogoutButton
