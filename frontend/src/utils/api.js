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

let isRefreshing = false
let refreshPromise = null

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            originalRequest.url !== '/api/auth/refresh' &&
            originalRequest.url !== '/api/auth/isLogin'
        ) {
            originalRequest._retry = true

            if (!isRefreshing) {
                isRefreshing = true
                refreshPromise = api
                    .post('/api/auth/refresh')
                    .then(() => {
                        isRefreshing = false
                    })
                    .catch((refreshError) => {
                        isRefreshing = false
                        window.location.href = '/login'
                        throw refreshError
                    })
            }

            return refreshPromise.then(() => api(originalRequest))
        }

        if (originalRequest.url === '/api/auth/refresh') {
            window.location.href = '/login'
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
    createColumn: (boardId, name, order) =>
        api.post(`/api/kanban/boards/${boardId}/columns`, { name, order }),
    getAudit: (boardId, limit = 50) =>
        api.get(`/api/kanban/boards/${boardId}/audit`, { params: { limit } }),
}

export default api
