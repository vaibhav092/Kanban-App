import { Router } from 'express'
import { createBoard, getAllBoard, getFullBoard, createColumn } from '../Controller/Kanban.js'

const router = Router()

router.post('/boards', createBoard)
router.get('/boards/:id', getFullBoard)
router.get('/boards', getAllBoard)
router.post('/boards/:id/columns', createColumn)

export default router
