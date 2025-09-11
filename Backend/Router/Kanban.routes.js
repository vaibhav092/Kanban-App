import { Router } from 'express'
import {
    createBoard,
    getAllBoard,
    getFullBoard,
    createColumn,
    getAuditLogs,
} from '../Controller/Kanban.js'

const router = Router()

router.post('/boards', createBoard)
router.get('/boards/:id', getFullBoard)
router.get('/boards', getAllBoard)
router.post('/boards/:id/columns', createColumn)
router.get('/boards/:id/audit', getAuditLogs)

export default router
