const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
    icon: { type: String, default: 'fa-check' },
    text: { type: String, default: '' }
}, { _id: false });

const subPlanSchema = new mongoose.Schema({
    name:        { type: String, required: true },
    price:       { type: Number, default: 0 },
    period:      { type: String, default: '' },
    icon:        { type: String, default: 'fa-users' },
    description: { type: String, default: '' },
    featured:    { type: Boolean, default: false },
    image:       { type: String, default: '' },
    features:    [featureSchema]
}, { timestamps: true });

module.exports = mongoose.model('SubPlan', subPlanSchema);
