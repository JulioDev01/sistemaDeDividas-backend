/* imports */
require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()
const passport = require("./auth/passport");

const cors = require('cors');


//Configura o Express para interpretar JSON no corpo das requisições
app.use(express.json())
app.use(passport.initialize()); // Inicializa o Passport

// Middleware do CORS
app.use(cors({
    origin: 'http://localhost:3000', // Permite apenas o front rodando na porta 3000
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));


//Importa o modelo do usuário e divida
const User = require('./models/User')
const Debt = require("./models/Debt");

// Exporta os middlewares
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
    
    const id = req.params.id // Obtém o ID do usuário da URL

    // Busca o usuário no banco de dados, excluindo o campo senha (-password)
    const user = await User.findById(id, '-password')

    if (!user) {
        return res.status(442).json({msg: "Username e/ou senha inválido!"})
    } 

    res.status(200).json({ user }) // Retorna os dados do usuário encontrado

})


// Cadastrar usuário
app.post('/auth/register', async (req, res) => {

    // Extrai os dados do corpo da requisição
    const {username, password, confirmpassword, role} = req.body

    //validações
    if (!username || !password || !confirmpassword || !role) {
        return res.status(422).json({ msg: "Todos os campos são obrigatórios!" })
    }

    if (password !== confirmpassword){
        return res.status(442).json({msg: "As senhas não conferem!"})
    }

    // checando se o usuário já existe
    const userExists = await User.findOne({ username: username }) //findOne é um método do mongoose, para verificar se já tem esse email

    if (userExists) {
        return res.status(442).json({msg: "Por favor, utilize outro username!"})
    }   

    // criando a senha  com bcrypt
    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)

    // criando usuário
    const user = new User({
        username, 
        password: passwordHash,
        role
    })

    try {

        await user.save() // Salva usuário no banco

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

    console.log('Requisição de login recebida:', req.body);
    const {username, password} = req.body

    // validações
    if (!username) {
        return res.status(442).json({msg: "O username é obrigatório!"})
    }

    if (!password) {
        return res.status(442).json({msg: "A senha é obrigatório!"})
    }

    // chequando se o usuário existe
    const user = await User.findOne({ username: username }) //findOne é um método do mongoose, para verificar se já tem esse email

    if (!user) {
        return res.status(442).json({msg: "Username e/ou senha inválido!"})
    }  

    // chequando se a senha existe
    const checkPassword = await bcrypt.compare(password, user.password)

    if (!checkPassword){
        return res.status(442).json({msg: "Username e/ou senha inválido!"})
    }


    try {

        const secret = process.env.SECRET // Obtém chave secreta do .env

        // Gera token JWT
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
            },
            secret,
        )

        res.status(200).json({msg: 'Autentificação realizada com sucesso!', token, role: user.role, userId: user._id, username: user.username})

    }catch(err){ 
        console.log(err)

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
        const user = await User.findById(id)
        if (!user) return res.status(404).json({ msg: "Usuário não encontrado!" })

        //Verifica se o usuário é dono da conta ou Admin
        if (req.user.id !== id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: "Acesso negado!" })
        }

        // Atualiza os campos apenas se foram enviados na requisição
        if (username) {
            const usernameExists = await User.findOne({ username })
            if (usernameExists && usernameExists.id !== id) {
                return res.status(422).json({ msg: "Username já cadastrado!" })
            }
            user.username = username
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
        const users = await User.find().select('-password')
        res.status(200).json({ users })
    } catch(error) {
        res.status(500).json({ msg: "Erro ao buscar usuários." })
    }
})

// Excluir usuário e suas dívidas (Admin ou próprio usuário)
app.delete('/user/:id', 
    passport.authenticate("jwt", { session: false }), 
    async (req, res) => {
    const {id} = req.params

    try{
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ msg: "Usuário não encontrado" });
        }
            
        // Verifica se o usuário autenticado é o dono da conta ou um admin
        if (req.user.id !== id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: "Acesso negado!" })
        }

        // Remove as dívidas do usuário antes de excluí-lo
        await Debt.deleteMany({ userId: id })

        // Remove o usuário do banco de dados
        await User.findByIdAndDelete(id)

        res.status(200).json({ msg: "Usuário e suas dívidas foram excluídos!" })

    }catch(error){
        console.error("Erro ao excluir usuário:", error);
        res.status(500).json({ msg: "Erro ao excluir usuário." })
    }
})


// Credenciais do banco de dados obtidas do arquivo .env
const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASS
const acess = process.env.ACESS

// Conexão com o banco de dados MongoDB
mongoose
    .connect(`mongodb+srv://${dbUser}:${dbPassword}@${acess}`)
    .then(() => {
        // Inicia o servidor na porta 3001 após a conexão bem-sucedida com o banco
        app.listen(3001)
}).catch((err) => console.log(err))
