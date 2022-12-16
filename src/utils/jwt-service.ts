import * as dotenv from "dotenv";
import jwt from 'jsonwebtoken';

dotenv.config();

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || '11';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '22';

const expiresIn_Access = '10s';
const expiresIn_Refresh = '3d';

export type TypeJWT = 'access' | 'refresh'


export const jwtService = {
    async createAccessJWT(id: string) {
        return jwt.sign(
            {userId: id},
            JWT_ACCESS_SECRET,
            {expiresIn: expiresIn_Access}
        );
    },

    async createRefreshJWT(id: string) {
        return jwt.sign(
            {userId: id},
            JWT_REFRESH_SECRET,
            {expiresIn: expiresIn_Refresh}
        );
    },

    async getUserIdByJwtToken(token: string, type: TypeJWT) {
        try {
            const result: any = jwt.verify(
                token,
                type === 'access' ? JWT_ACCESS_SECRET : JWT_REFRESH_SECRET
            );
            return result.userId;
        } catch (error) {
            return null;
        }
    }

};