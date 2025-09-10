import { Router } from 'express'
import { createBoard, getAllBoard, getFullBoard } from '../Controller/Kanban.js'

const router = Router()

router.post('/boards', createBoard)
router.get('/boards/:id', getFullBoard)
router.get('/boards', getAllBoard)

export default router
