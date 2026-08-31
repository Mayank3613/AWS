const { InteractionLog, Customer, User } = require('../models');

const getInteractions = async (req, res) => {
  try {
    const interactions = await InteractionLog.findAll({
      where: { customerId: req.params.customerId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'role']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formatted = interactions.map((log) => {
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

const createInteraction = async (req, res) => {
  try {
    const { type, notes, rating, resolvedAt } = req.body;
    const customerId = req.params.customerId;

    const interaction = await InteractionLog.create({
      customerId,
      userId: req.user.id,
      type: type || 'Note',
      notes,
      rating: rating ? parseInt(rating) : null,
      resolvedAt: resolvedAt ? new Date(resolvedAt) : null
    });

    // Update customer last activity timestamp
    const customer = await Customer.findByPk(customerId);
    if (customer) {
      await customer.update({ lastActivity: new Date() });
    }

    res.status(201).json(interaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getInteractions,
  createInteraction
};
