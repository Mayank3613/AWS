const InteractionLog = require('../models/InteractionLog');
const Customer = require('../models/Customer');

const getInteractions = async (req, res) => {
    try {
        const interactions = await InteractionLog.find({ customerId: req.params.customerId }).populate('userId', 'name').sort('-createdAt');
        res.status(200).json(interactions);
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
            userId: req.user._id,
            type,
            notes,
            rating,
            resolvedAt
        });

        await Customer.findByIdAndUpdate(customerId, { lastActivity: Date.now() });

        res.status(201).json(interaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getInteractions, createInteraction };
