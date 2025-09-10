import Sequelize from 'sequelize'

import BoardModel from '../Models/Board.model.js'
import ColumnModel from '../Models/Column.model.js'
import CardModel from '../Models/Card.model.js'
import AuditModel from '../Models/Audit.model.js'
import UserModel from '../Models/User.model.js'
let sequelize
let models = {}

export const connectDB = async () => {
    try {
        if (!process.env.DATABASE_URL) {
            throw new Error(
                'DATABASE_URL is not defined in environment variables'
            )
        }

        sequelize = new Sequelize(process.env.DATABASE_URL, {
            dialect: 'postgres',
            logging: false,
        })

        await sequelize.authenticate()
        console.log('Database connected successfully')

        models = {
            Board: BoardModel(sequelize),
            Column: ColumnModel(sequelize),
            Card: CardModel(sequelize),
            AuditLog: AuditModel(sequelize),
            User: UserModel(sequelize),
        }

        Object.values(models).forEach((model) => {
            if (typeof model.associate === 'function') {
                model.associate(models)
            }
        })

        await sequelize.sync({ alter: true })
        console.log('Models synchronized with database')

        return { sequelize, models }
    } catch (error) {
        console.error('DB connection error:', error.message)
        throw error
    }
}

export { sequelize, models }
