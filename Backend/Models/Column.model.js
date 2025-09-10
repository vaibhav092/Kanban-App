import { DataTypes } from 'sequelize'

export default (sequelize) => {
    const Column = sequelize.define(
        'Column',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            board_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            order: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        },
        {
            tableName: 'columns',
            timestamps: true,
            underscored: true,
        }
    )

    Column.associate = (models) => {
        Column.belongsTo(models.Board, { foreignKey: 'board_id' })
        Column.hasMany(models.Card, {
            foreignKey: 'column_id',
            onDelete: 'CASCADE',
        })
    }

    return Column
}
