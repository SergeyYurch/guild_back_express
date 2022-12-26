import * as dotenv from "dotenv";
import jwt from 'jsonwebtoken';
import {
    UserInfoInRefreshToken
} from "../controllers/interfaces/user-info-in-refresh-token.interface";
import {ACCESS_TOKEN_LIFE_PERIOD, REFRESH_TOKEN_LIFE_PERIOD} from '../settings-const';

dotenv.config();

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || '11';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '22';


export type TypeJWT = 'access' | 'refresh'


export const jwtService = {
    async createAccessJWT(userId: string) {
        const expiresIn = ACCESS_TOKEN_LIFE_PERIOD.amount + ACCESS_TOKEN_LIFE_PERIOD.units[0]
        console.log('[jwtService]expiresIn accessToken:' + expiresIn);
        return jwt.sign(
            {userId},
            JWT_ACCESS_SECRET,
            {expiresIn}
        );
    },

    async createRefreshJWT(userId: string, deviceId: string, lastActiveDate: string, ) {
        const expiresIn = REFRESH_TOKEN_LIFE_PERIOD.amount + REFRESH_TOKEN_LIFE_PERIOD.units[0]
        console.log('[jwtService]expiresIn refreshToken:' + expiresIn);
        return jwt.sign(
            {userId, deviceId, lastActiveDate},
            JWT_REFRESH_SECRET,
            {expiresIn}
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