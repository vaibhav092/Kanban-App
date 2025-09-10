import axios from 'axios'

const getBackendUrl = () => {
    if (typeof window !== 'undefined') {
        const host = window.location.hostname
        const protocol = window.location.protocol
        return `${protocol}//${host}:3000`
    }
    return 'http://localhost:3000'
}

const API_BASE_URL = getBackendUrl()

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
})

api.interceptors.request.use(
    (config) => {
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

api.interceptors.response.use(
    (response) => {
        return response
    },
    async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                await api.post('/api/auth/refresh')

                return api(originalRequest)
            } catch (refreshError) {
                window.location.href = '/login'
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

export const authAPI = {
    login: (credentials) => api.post('/api/auth/login', credentials),
    register: (userData) => api.post('/api/auth/register', userData),
    logout: () => api.post('/api/auth/logout'),
    refresh: () => api.post('/api/auth/refresh'),
    isLogin: () => api.get('/api/auth/isLogin'),
}

export const kanbanAPI = {
    AllgetBoards: () => api.get('/api/kanban/boards'),
    getBoard: (boardId) => api.get(`/api/kanban/boards/${boardId}`),
    createBoard: (boardData) => api.post('/api/kanban/boards', boardData),
}

export default api
