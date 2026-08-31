const { AuditLog, User } = require('../models');

const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'role']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 200
    });

    const formatted = logs.map((log) => {
      const json = log.toJSON();
      if (json.user) {
        json.userId = {
          _id: json.user.id,
          id: json.user.id,
          name: json.user.name,
          role: json.user.role
        };
      }
      return json;
    });

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const logAudit = async (userId, action, details, performedBy, role) => {
  try {
    await AuditLog.create({
      userId: userId || null,
      action,
      details,
      performedBy: performedBy || 'System',
      role: role || 'admin'
    });
  } catch (error) {
    console.error('Audit Log Error on Amazon RDS:', error.message);
  }
};

module.exports = {
  getAuditLogs,
  logAudit
};
