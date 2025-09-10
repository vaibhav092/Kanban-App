import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router'
import Boards from './components/Boards.jsx'
import KanbanBoard from './components/KanbanBoard.jsx'
import Login from './components/Login.jsx'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Boards />}></Route>
                <Route path="/board/:boardId" element={<KanbanBoard />}></Route>
                <Route path="/login" element={<Login />}></Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App
