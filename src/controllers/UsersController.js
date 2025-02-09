const { hash, compare } = require('bcryptjs')
const AppError = require("../utils/AppError")
const sqliteConnection = require('../database/sqlite')

class UsersController {
    async create(req, res) {
        const { name, email, password } = req.body

        const database = await sqliteConnection();
        const checkUserExists = await database.get("SELECT * FROM users WHERE email = (?)", [email])

        if (checkUserExists) {
            throw new AppError("Este email já está em uso")
        }

        if (!name) {
            throw new AppError("Nome é obrigatório")
        }

        if (!email) {
            throw new AppError("Email é obrigatório")
        }

        if (!password) {
            throw new AppError("Senha é obrigatória")
        }

        const hashedPasswod = await hash(password, 8)

        await database.run("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, hashedPasswod])

        return res.status(201).json()
    }
    async update(req, res) {
        const { name, email, password, old_password } = req.body

        const user_id = req.user.id

        const database = await sqliteConnection();
        const user = await database.get("SELECT * FROM users WHERE id = (?)", [user_id])

        if(!user){
            throw new AppError("Usuário não encontrado")
        }
        const checkEmailIsUsed = await database.get("SELECT * FROM users WHERE email = (?)", [email])

        if(checkEmailIsUsed && checkEmailIsUsed.id !== user.id) {
            throw new AppError('Este email já está em uso')
        }

        user.name = name ?? user.name;
        user.email = email ?? user.email;

        if(password && !old_password){
            throw new AppError('Você precisa informar a senha antiga')
        }

        if(password && old_password){
            const checkOldPassword = await compare(old_password, user.password)

            if(!checkOldPassword){
                throw new AppError('A senha antiga não confere', 401)
            }

            user.password = await hash(password, 8)
        }

        await database.run(`UPDATE users SET 
            name = ?, 
            email = ?, 
            password = ?, 
            updated_at = DATETIME('now') 
            WHERE id = ?`, 
            [user.name, user.email, user.password, user_id])

        return res.json()
    }
}
module.exports = UsersController;