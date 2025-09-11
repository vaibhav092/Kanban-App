import axios from 'axios'

const resolveApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
        const host = window.location.hostname
        const protocol = window.location.protocol
        return `${protocol}//${host}:3000`
    }
    return 'http://localhost:3000'
}

const API_BASE_URL = resolveApiBaseUrl()

const httpClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
})

httpClient.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error)
)

let isTokenRefreshing = false
let tokenRefreshPromise = null

httpClient.interceptors.response.use(
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

            if (!isTokenRefreshing) {
                isTokenRefreshing = true
                tokenRefreshPromise = httpClient
                    .post('/api/auth/refresh')
                    .then(() => {
                        isTokenRefreshing = false
                    })
                    .catch((refreshError) => {
                        isTokenRefreshing = false
                        window.location.href = '/login'
                        throw refreshError
                    })
            }

            return tokenRefreshPromise.then(() => httpClient(originalRequest))
        }

        if (originalRequest.url === '/api/auth/refresh') {
            window.location.href = '/login'
        }

        return Promise.reject(error)
    }
)

export const authAPI = {
    login: (credentials) => httpClient.post('/api/auth/login', credentials),
    register: (userData) => httpClient.post('/api/auth/register', userData),
    logout: () => httpClient.post('/api/auth/logout'),
    refresh: () => httpClient.post('/api/auth/refresh'),
    isLogin: () => httpClient.get('/api/auth/isLogin'),
}

export const kanbanAPI = {
    AllgetBoards: () => httpClient.get('/api/kanban/boards'),
    getBoard: (boardId) => httpClient.get(`/api/kanban/boards/${boardId}`),
    createBoard: (boardData) => httpClient.post('/api/kanban/boards', boardData),
    createColumn: (boardId, name, order) =>
        httpClient.post(`/api/kanban/boards/${boardId}/columns`, { name, order }),
    getAudit: (boardId, limit = 50) =>
        httpClient.get(`/api/kanban/boards/${boardId}/audit`, { params: { limit } }),
}

export default httpClient
