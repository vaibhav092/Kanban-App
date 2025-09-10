import { DataTypes } from 'sequelize'

export default (sequelize) => {
    const AuditLog = sequelize.define(
        'AuditLog',
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
            user_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            event_type: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            payload: {
                type: DataTypes.JSONB,
                allowNull: true,
            },
        },
        {
            tableName: 'audit_logs',
            timestamps: true,
            underscored: true,
        }
    )

    AuditLog.associate = (models) => {
        AuditLog.belongsTo(models.Board, { foreignKey: 'board_id' })
    }

    return AuditLog
}
