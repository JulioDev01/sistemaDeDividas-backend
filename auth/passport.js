const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const User = require("../models/User");
require('dotenv').config();

const params = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extrai o token do cabeçalho "Authorization"
    secretOrKey: process.env.SECRET
}

//Validação JWT
passport.use(
    new JwtStrategy(params, async (jwt_payload, done) => {
        try{
            const user = await User.findByPk(jwt_payload.id, {
                attributes: { exclude: ['password'] }
            });
        
            if(user){
                return done(null, user); 
            }else{
                return done(null, false) 
            }

        }catch(error){
            return done(error, false)
        }
    })
)

module.exports = passport;