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
        res.json(boards)
    } catch (error) {
        console.error('error::GetAllBoard', error)
        res.status(500).json({ message: 'Internal server error' })
    }
}
