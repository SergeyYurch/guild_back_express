import * as dotenv from "dotenv";
import jwt from 'jsonwebtoken';
import {
    UserInfoInRefreshToken
} from "../controllers/interfaces/user-info-in-refresh-token.interface";

dotenv.config();

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || '11';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '22';

const expiresIn_Access = '110s';
const expiresIn_Refresh = '120s';

export type TypeJWT = 'access' | 'refresh'


export const jwtService = {
    async createAccessJWT(userId: string) {
        return jwt.sign(
            {userId},
            JWT_ACCESS_SECRET,
            {expiresIn: expiresIn_Access}
        );
    },

    async createRefreshJWT(userId: string, deviceId: string, lastActiveDate: string) {
        return jwt.sign(
            {userId, deviceId, lastActiveDate},
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
    },

    async getSessionInfoByJwtToken(token: string):Promise<UserInfoInRefreshToken | null> {
        try {
            const result: any = jwt.verify(
                token,
                JWT_REFRESH_SECRET
            );
            return ({
                userId:result.userId,
                deviceId:result.deviceId,
                lastActiveDate:result.lastActiveDate});
        } catch (error) {
            return null;
        }
    }

};