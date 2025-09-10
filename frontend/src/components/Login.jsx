import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { authAPI as authApi } from '../utils/api'

function LoginForm() {
    const navigate = useNavigate()
    const [isLogin, setIsLogin] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
    })

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        if (error) setError('')
    }

    const handleTabChange = (isLoginTab) => {
        setIsLogin(isLoginTab)
        setError('')
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError('')

        try {
            if (isLogin) {
                await authApi.login({
                    email: formData.email,
                    password: formData.password,
                })
            } else {
                await authApi.register({
                    name: `${formData.firstName} ${formData.lastName}`.trim(),
                    email: formData.email,
                    password: formData.password,
                })
            }

            navigate('/')
        } catch (err) {
            console.error('API Error:', err)
            console.log('Error status:', err.response?.status)
            console.log('Error data:', err.response?.data)

            let errorMessage = 'Something went wrong. Please try again.'

            if (
                err.code === 'ECONNABORTED' ||
                err.message?.toLowerCase().includes('timeout') ||
                err.message?.toLowerCase().includes('network error') ||
                err.message?.toLowerCase().includes('failed to fetch')
            ) {
                errorMessage =
                    'Server is starting up. Please try again in 2 minutes.'
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message
            } else if (err.message) {
                errorMessage = err.message
            }

            console.log('Final error message:', errorMessage)

            const isPasswordError =
                errorMessage.toLowerCase().includes('password') ||
                errorMessage.toLowerCase().includes('invalid email or password')

            setError(errorMessage)

            if (isPasswordError && isLogin) {
                setFormData((prev) => ({ ...prev, password: '' }))
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    useEffect(() => {
        let isMounted = true
        ;(async () => {
            try {
                const res = await authApi.isLogin()
                const alreadyLoggedIn = Boolean(
                    res?.data?.isLogin ??
                        res?.data?.loggedIn ??
                        res?.data?.success
                )
                if (isMounted && alreadyLoggedIn) {
                    // navigate('/');
                }
            } catch {
                // Ignore errors; user may not be logged in yet
            }
        })()
        return () => {
            isMounted = false
        }
    }, [navigate])

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950">
            <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/80 shadow-2xl backdrop-blur">
                <div className="p-8">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-white mb-2">
                            KanbanBoard
                        </h1>
                    </div>

                    <div className="flex mb-6 bg-neutral-800/50 rounded-xl p-1">
                        <button
                            type="button"
                            onClick={() => handleTabChange(true)}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                                isLogin
                                    ? 'bg-blue-600 text-white'
                                    : 'text-neutral-400 hover:text-white'
                            }`}
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTabChange(false)}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                                !isLogin
                                    ? 'bg-blue-600 text-white'
                                    : 'text-neutral-400 hover:text-white'
                            }`}
                        >
                            Register
                        </button>
                    </div>

                    {error && (
                        <div
                            className={`border rounded-lg p-3 mb-4 ${
                                error
                                    .toLowerCase()
                                    .includes('server is starting up')
                                    ? 'bg-yellow-500/10 border-yellow-500/20'
                                    : 'bg-red-500/10 border-red-500/20'
                            }`}
                        >
                            <div className="flex items-start space-x-2">
                                <div className="flex-shrink-0">
                                    {error
                                        .toLowerCase()
                                        .includes('server is starting up') ? (
                                        <svg
                                            className="w-4 h-4 text-yellow-400 mt-0.5"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            className="w-4 h-4 text-red-400 mt-0.5"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p
                                        className={`text-sm font-medium ${
                                            error
                                                .toLowerCase()
                                                .includes(
                                                    'server is starting up'
                                                )
                                                ? 'text-yellow-400'
                                                : 'text-red-400'
                                        }`}
                                    >
                                        {error}
                                    </p>
                                    {error
                                        .toLowerCase()
                                        .includes('server is starting up') && (
                                        <p className="text-yellow-300 text-xs mt-1">
                                            The server is initializing. Please
                                            wait a moment and try again.
                                        </p>
                                    )}
                                    {error.toLowerCase().includes('password') &&
                                        !error
                                            .toLowerCase()
                                            .includes(
                                                'server is starting up'
                                            ) && (
                                            <p className="text-red-300 text-xs mt-1">
                                                Please check your password and
                                                try again.
                                            </p>
                                        )}
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label
                                        htmlFor="firstName"
                                        className="text-neutral-300 block"
                                    >
                                        First Name
                                    </label>
                                    <input
                                        id="firstName"
                                        type="text"
                                        placeholder="First name"
                                        value={formData.firstName}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'firstName',
                                                e.target.value
                                            )
                                        }
                                        required={!isLogin}
                                        className="mt-2 w-full rounded-lg bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="lastName"
                                        className="text-neutral-300 block"
                                    >
                                        Last Name
                                    </label>
                                    <input
                                        id="lastName"
                                        type="text"
                                        placeholder="Last name"
                                        value={formData.lastName}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'lastName',
                                                e.target.value
                                            )
                                        }
                                        required={!isLogin}
                                        className="mt-2 w-full rounded-lg bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label
                                htmlFor="email"
                                className="text-neutral-300 block"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={(e) =>
                                    handleInputChange('email', e.target.value)
                                }
                                required
                                className="mt-2 w-full rounded-lg bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="text-neutral-300 block"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                placeholder={
                                    isLogin
                                        ? 'Enter your password'
                                        : 'Create a password'
                                }
                                value={formData.password}
                                onChange={(e) =>
                                    handleInputChange(
                                        'password',
                                        e.target.value
                                    )
                                }
                                required
                                className={`mt-2 w-full rounded-lg bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 px-3 py-2 focus:outline-none focus:ring-2 transition-all duration-200 ${
                                    error &&
                                    error.toLowerCase().includes('password')
                                        ? 'border-red-500/50 shadow-sm shadow-red-500/20 focus:ring-red-600'
                                        : ''
                                }`}
                                disabled={isSubmitting}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Please wait...
                                </div>
                            ) : isLogin ? (
                                'Sign In'
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default LoginForm
