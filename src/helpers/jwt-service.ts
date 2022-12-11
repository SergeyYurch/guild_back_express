import * as dotenv from "dotenv";
import jwt from 'jsonwebtoken';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || '1';

export const jwtService = {
    async createJWT(id:string) {
        return jwt.sign({userId: id}, JWT_SECRET, {expiresIn: '10h'});
    },

    async getUserIdByJwtToken(token: string) {
        try {
            const result: any = jwt.verify(token, JWT_SECRET);
            return result.userId;
        } catch (error) {
            return null;
        }
    }

};