const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'cliente'], default: 'cliente' } // Define cliente como valor padrão
})

module.exports = mongoose.model('User', UserSchema)