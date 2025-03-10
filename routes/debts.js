const express = require('express')
const Debt = require('../models/Debt')
const { checkToken, isAdmin } = require('../middlewares/auth')

const router = express.Router()

const passport = require("../auth/passport");
router.use(passport.initialize()); // Inicializa o Passport

//Criar dívida (apenas Adms)
router.post('/add', 
    passport.authenticate("jwt", { session: false }), 
    isAdmin, async(req, res) => {

    // Extrai os dados do corpo da requisição
    const { userId, name, value, dueDate} = req.body

    //Validações
    if (!name || !userId || !value || !dueDate) {
        return res.status(422).json({ msg: "Todos os campos são obrigatórios!" })
    }

    try {
        // Cria uma nova dívida associada a um usuário e salva no banco
        const debt = new Debt ({ userId, name, value, dueDate})
        await debt.save()

        res.status(201).json({ msg: 'Dívida criada com sucesso!', debt })
    } catch(error) {
        console.log(error)

        res
            .status(500)
            .json({
                msg: "Erro ao criar a dívida, tente novamente mais tarde!"
            })
    }

})

//Listar dívidas (Adms ve todas e o usuário vê as suas)
router.get('/:userId', 
    passport.authenticate("jwt", { session: false }), 
    async (req, res) => {
    const {userId} = req.params // Obtém o ID do usuário a partir dos parâmetros da URL

    try{
        if (req.user.role === "admin") {
            debts = await Debt.find(); 
        } else if (req.user.id === userId) { 
            debts = await Debt.find({ userId });
        } else {
            return res.status(403).json({ msg: "Acesso negado!" });
        }

        res.status(200).json({ debts });
    }catch(error){
        res.status(500).json({ msg: 'Erro ao buscar dívidas.' })
    }
})

//Atualizar status da dívida 
router.put('/:debtId', 
    passport.authenticate("jwt", { session: false }), 
    async (req, res) => {
        
    const {debtId} = req.params // Obtém o ID da dívida a partir dos parâmetros da URL
    const {status} = req.body // Obtém o novo status enviado no corpo da requisição

    if (!['pendente', 'agendado', 'pago'].includes(status)) {
        return res.status(422).json({ msg: 'Status inválido!' })
    }

    try{
        const debt = await Debt.findById(debtId) // Busca a dívida pelo ID
        if (!debt) return res.status(404).json({ msg: 'Dívida não encontrada!' })

        // Verifica se o usuário é admin ou se está tentando alterar uma dívida própria
        if (req.user.role !== 'admin' && debt.userId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Acesso negado!' })
        }    

        //Atualiza o status e salva no banco
        debt.status = status      
        await debt.save()

        res.status(200).json({ msg: 'Status atualizado com sucesso!', debt })

    } catch(error) {
        res.status(500).json({ msg: 'Erro ao atualizar dívida.' })
    }
})

// Editar dívida (Apenas Admins)
router.put('/:debtId/edit',
    passport.authenticate("jwt", { session: false }),
    async (req, res) => {

    const { debtId } = req.params; // Obtém o ID da dívida da URL
    const { userId, name, value, dueDate, status } = req.body; // Obtém os dados do corpo da requisição

    // Verifica se o usuário é admin
    if (req.user.role !== "admin") {
        return res.status(403).json({ msg: "Apenas administradores podem editar dívidas!" });
    }

    // Verifica se todos os campos foram preenchidos
    if (!userId || !name || !value || !dueDate || !status) {
        return res.status(422).json({ msg: "Todos os campos são obrigatórios!" });
    }

    try {
        const debt = await Debt.findById(debtId); // Busca a dívida no banco

        if (!debt) {
            return res.status(404).json({ msg: "Dívida não encontrada!" });
        }

        // Atualiza os campos
        debt.userId = userId;
        debt.name = name;
        debt.value = value;
        debt.dueDate = dueDate;
        debt.status = status;

        await debt.save(); // Salva no banco

        res.status(200).json({ msg: "Dívida atualizada com sucesso!", debt });

    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Erro ao editar a dívida!" });
    }
});

//Excluir dívida (Apenas Admin)
router.delete('/:debtId', 
    passport.authenticate("jwt", { session: false }), 
    isAdmin, 
    async (req, res) => {
            
        const {debtId} = req.params // Obtém o ID da dívida a partir dos parâmetros da URL

        try{
            // Busca e deleta a dívida pelo ID
            await Debt.findByIdAndDelete(debtId)
            res.status(200).json({ msg: 'Dívida excluída com sucesso!' })
        }catch(error){
            res.status(500).json({ msg: 'Erro ao excluir dívida.' })
        }
})

module.exports = router