import { models } from '../DB/db.js'

export const createBoard = async (req, res) => {
    try {
        const { id } = req.user
        const { name } = req.body

        const Board = await models.Board.create({
            name,
            created_by: id,
        })
        return res.status(200).json({ success: true, Board })
    } catch (error) {
        console.log('Error::CreeateBoard', error)
    }
}

export const getFullBoard = async (req, res) => {
    try {
        const id = req.params.id
        const board = await models.Board.findOne({
            where: { id },
            include: [
                {
                    model: models.Column,
                    include: [
                        {
                            model: models.Card,
                        },
                    ],
                },
            ],
        })
        if (!board) {
            return res.status(400).json({ message: 'No board exist' })
        }

        return res.status(200).json({ success: true, board })
    } catch (error) {
        console.log('Error::GetFullBoard', error)
    }
}

export const getAllBoard = async (req, res) => {
    try {
        const boards = await models.Board.findAll()
        res.json({ data: boards })
    } catch (error) {
        console.error('error::GetAllBoard', error)
        res.status(500).json({ message: 'Internal server error' })
    }
}

export const getAuditLogs = async (req, res) => {
    try {
        const boardId = req.params.id
        const limit = Number.parseInt(req.query.limit, 10)
        const logs = await models.AuditLog.findAll({
            where: { board_id: boardId },
            order: [['created_at', 'DESC']],
            limit: Number.isFinite(limit) && limit > 0 ? limit : 50,
        })
        return res.status(200).json({ success: true, data: logs })
    } catch (error) {
        console.error('Error::GetAuditLogs', error)
        res.status(500).json({ message: 'Internal server error' })
    }
}

export const createColumn = async (req, res) => {
    try {
        const { id: boardId } = req.params
        const { name, order } = req.body

        const board = await models.Board.findByPk(boardId)
        if (!board) {
            return res.status(404).json({ message: 'Board not found' })
        }

        const column = await models.Column.create({
            board_id: boardId,
            name: name.trim(),
            order: order || 0,
        })

        return res.status(201).json({
            success: true,
            data: {
                id: column.id,
                board_id: column.board_id,
                name: column.name,
                order: column.order,
                created_at: column.created_at,
                updated_at: column.updated_at,
            },
        })
    } catch (error) {
        console.error('Error::CreateColumn', error)
        res.status(500).json({ message: 'Internal server error' })
    }
}
