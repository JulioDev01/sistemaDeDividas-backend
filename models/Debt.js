const mongoose = require('mongoose')

const DebtSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    value: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum:['pendente', 'agendado', 'pago'], default:'pendente' },
})

module.exports = mongoose.model('Debt', DebtSchema)