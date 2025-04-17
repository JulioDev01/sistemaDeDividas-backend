const jwt = require('jsonwebtoken');
const User = require('../models/User');


// Middleware para verificar se o usuário é administrador
exports.isAdmin = async (req, res, next) => {
    try{

        // Verifica diretamente se o usuário já tem role "admin"
        if (req.user && req.user.role === 'admin') {
            return next()
        }        

        // Caso contrário, verifica no banco
        const user = await User.findByPk(req.user.id)

        if (!user || user.role !== 'admin') {
            console.log("Acesso negado: não é admin!")
            return res.status(403).json({msg: 'Acesso negado! Apenas administradores realizar essa ação.'})
        }

        next()
    } catch(error) {
        console.error("Erro ao verificar admin:", error)
        return res.status(500).json({msg: 'Erro ao verificar as permissões. Tente novamente mais tarde.'})
    }
}