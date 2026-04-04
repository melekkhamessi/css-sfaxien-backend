const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    key: { type: String, unique: true, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

// Static helper to get a setting
settingsSchema.statics.get = async function(key, defaultValue = null) {
    const doc = await this.findOne({ key });
    return doc ? doc.value : defaultValue;
};

// Static helper to set a setting
settingsSchema.statics.set = async function(key, value) {
    return this.findOneAndUpdate({ key }, { value }, { upsert: true, new: true });
};

// Static helper to get all settings as object
settingsSchema.statics.getAll = async function() {
    const docs = await this.find();
    const obj = {};
    docs.forEach(d => { obj[d.key] = d.value; });
    return obj;
};

module.exports = mongoose.model('Settings', settingsSchema);
