import { DataTypes } from 'sequelize'

export default (sequelize) => {
    const Board = sequelize.define(
        'Board',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            created_by: {
                type: DataTypes.UUID,
                allowNull: true,
            },
        },
        {
            tableName: 'boards',
            timestamps: true,
            underscored: true,
        }
    )

    Board.associate = (models) => {
        Board.hasMany(models.Column, {
            foreignKey: 'board_id',
            onDelete: 'CASCADE',
        })
        Board.hasMany(models.AuditLog, {
            foreignKey: 'board_id',
            onDelete: 'CASCADE',
        })
        Board.belongsTo(models.User, { foreignKey: 'created_by', as: 'owner' })
    }

    return Board
}
