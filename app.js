/* imports */
require('dotenv').config() // Carrega variáveis do arquivo .env
const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const sequelize = require('./config/db');


const app = express()
const passport = require("./auth/passport");
const cors = require('cors');


//Configura o Express para interpretar JSON no corpo das requisições
app.use(express.json())
app.use(passport.initialize()); // Inicializa o Passport

// Middleware do CORS
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));


//Importa os modelos e middlewares
const User = require('./models/User')
const Debt = require("./models/Debt");
const { isAdmin } = require('./middlewares/auth')

//importando a rota de dívidas
const debtRoutes = require('./routes/debts')
app.use('/debts', debtRoutes)

// Open Route - Public Route (acessivel a qualquer pessoa)
app.get('/', (req, res) => {
   res.status(200).json({msg: "Bem vindo a API"}) 
})

// Private Route (acessivel apenas para usuários autentificados)
app.get("/user/:id", 
    passport.authenticate("jwt", { session: false }), 
    isAdmin, 
    async (req, res) => {
    
    const id = req.params.id 

    const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] }
      })      

    if (!user) {
        return res.status(442).json({msg: "Username e/ou senha inválido!"})
    } 

    res.status(200).json({ user })

})


// Cadastrar usuário
app.post('/auth/register', async (req, res) => {

    const {username, password, confirmpassword, role} = req.body

    //validações
    if (!username || !password || !confirmpassword || !role) {
        return res.status(422).json({ msg: "Todos os campos são obrigatórios!" })
    }

    if (password !== confirmpassword){
        return res.status(442).json({msg: "As senhas não conferem!"})
    }

    const userExists = await User.findOne({ where: { username: username } });

    if (userExists) {
        return res.status(442).json({msg: "Por favor, utilize outro username!"})
    }   

    const salt = await bcrypt.genSalt(12) // Gera um salt para criptografia
    const passwordHash = await bcrypt.hash(password, salt) // Hash da senha

    const user = new User({
        username, 
        password: passwordHash,
        role
    })

    try {
        await user.save() 

        res
            .status(201)
            .json({
                msg: "Usuário criado com sucesso!"
            })

    } catch(error) {
        console.log(error)

        res
            .status(500)
            .json({
                msg: "Aconteceu um erro no servidor, tente novamente mais tarde!"
            })
    }

})


// Logar Usuário
app.post('/auth/login', async (req, res) => {

    const {username, password} = req.body

    // validações
    if (!username) {
        return res.status(442).json({msg: "O username é obrigatório!"})
    }

    if (!password) {
        return res.status(442).json({msg: "A senha é obrigatório!"})
    }

    const user = await User.findOne({ where: { username: username } });

    if (!user) {
        return res.status(442).json({msg: "Username e/ou senha inválido!"})
    }  

    // chequando se a senha existe
    const checkPassword = await bcrypt.compare(password, user.password)

    if (!checkPassword){
        return res.status(442).json({msg: "Username e/ou senha inválido!"})
    }


    try {

        const secret = process.env.SECRET

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
            },
            secret,
        )

        res.status(200).json({msg: 'Autentificação realizada com sucesso!', token, role: user.role, userId: user.id, username: user.username})

    }catch(err){ 
        res
            .status(500)
            .json({
                msg: "Aconteceu um erro no servidor, tente novamente mais tarde!"
            })
    }
})

// Atualizar as informações do usuário
app.put('/user/:id', 
    passport.authenticate("jwt", { session: false }), 
    async (req, res) => {

    const {id} = req.params
    const {username, password, role} = req.body

    try {
        const user = await User.findByPk(id)
        if (!user) return res.status(404).json({ msg: "Usuário não encontrado!" })

        //Verifica se o usuário é dono da conta ou Admin
        if (req.user.id !== id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: "Acesso negado!" })
        }

        if (username) {
            const usernameExists = await User.findOne({ where: { username } });
            if (usernameExists && String(usernameExists.id) !== String(id)) {
                return res.status(422).json({ msg: "Username já cadastrado!" });
            }
            user.username = username;
        }

        if (password) {
            const salt = await bcrypt.genSalt(12)
            user.password = await bcrypt.hash(password, salt)
        }

        if (role && req.user.role === 'admin') {
            user.role = role;
        } else if (role && req.user.role !== 'admin') {
            return res.status(403).json({ msg: "Somente administradores podem alterar a função do usuário!" });
        }

        await user.save()
        res.status(200).json({ msg: "Usuário atualizado com sucesso!", user })
    } catch(error) {
        res.status(500).json({ msg: "Erro ao atualizar usuário." })
    }
})

// Listar todos os usuários
app.get('/users', 
    passport.authenticate("jwt", { session: false }), 
    isAdmin, async (req, res) => {
    try{
        const users = await User.findAll({
            attributes: { exclude: ['password'] }
          })          
        res.status(200).json({ users })
    } catch(error) {
        res.status(500).json({ msg: "Erro ao buscar usuários." })
    }
})

// Excluir usuário e suas dívidas 
app.delete('/user/:id', 
    passport.authenticate("jwt", { session: false }), 
    isAdmin,
    async (req, res) => {

    const {id} = req.params

    try{
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ msg: "Usuário não encontrado" });
        }
            
        if (req.user.id !== id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: "Acesso negado!" })
        }

        // Remove as dívidas do usuário antes de excluí-lo
        await Debt.destroy({ where: { userId: id } });
        await User.destroy({ where: { id } });

        res.status(200).json({ msg: "Usuário e suas dívidas foram excluídos!" })

    }catch(error){
        console.error("Erro ao excluir usuário:", error);
        res.status(500).json({ msg: "Erro ao excluir usuário." })
    }
})


// Conexão com o banco de dados MySQL
sequelize.authenticate()
    .then(() => {
        console.log('Conexão com o MySQL estabelecida com sucesso!');
        return sequelize.sync({ alter: true })
    })
    .then(() => {
        app.listen(3001, () => {
            console.log('Servidor rodando na porta 3001');
        })
    })
    .catch(err => {
        console.error('Erro ao conectar ao MySQL:', err);
    })
