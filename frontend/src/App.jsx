import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router'
import Boards from './components/Boards.jsx'
import KanbanBoard from './components/KanbanBoard.jsx'
import Login from './components/Login.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />

                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Boards />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/board/:boardId"
                    element={
                        <ProtectedRoute>
                            <KanbanBoard />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    )
}

export default App
