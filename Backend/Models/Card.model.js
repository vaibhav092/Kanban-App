import { DataTypes } from 'sequelize'

export default (sequelize) => {
    const Card = sequelize.define(
        'Card',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            column_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            assignee: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            labels: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                allowNull: true,
            },
            order: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
        },
        {
            tableName: 'cards',
            timestamps: true,
            underscored: true,
        }
    )

    Card.associate = (models) => {
        Card.belongsTo(models.Column, { foreignKey: 'column_id' })
        Card.belongsTo(models.User, { foreignKey: 'assignee' })
    }

    return Card
}
