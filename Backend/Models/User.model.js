import { DataTypes } from 'sequelize'

export default (sequelize) => {
    const User = sequelize.define(
        'User',
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    isEmail: true,
                },
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            avatarUrl: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        {
            tableName: 'users',
            timestamps: true,
        }
    )

    User.associate = (models) => {
        User.hasMany(models.Board, { foreignKey: 'created_by', as: 'boards' })
        User.hasMany(models.Card, {
            foreignKey: 'assignee',
            as: 'assignedCards',
        })
    }

    return User
}
