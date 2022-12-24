import {LoginInputModel} from "../controllers/dto/loginInputModel.dto";
import {usersRepository} from "../repositories/users.repository";
import {UserViewModelDto} from "../controllers/dto/userViewModel.dto";
import {
    generatePassHash,
    getConfirmationCode,
    getExpirationDate,
    parseUserViewModel
} from "../helpers/helpers";
import {emailManager} from "../managers/emailManager";
import add from 'date-fns/add';
import {SentMessageInfo} from "nodemailer";
import {jwtService} from "../utils/jwt-service";
import {UserTokensPairInterface} from "./entities/user-tokens-pair.interface";
import {authSessionsRepository} from "../repositories/auth-sessions.repository";
import {DeviceSessionViewModelDto} from "../controllers/dto/deviceSessionViewModel.dto";
import {AuthSessionInDb} from "../repositories/entitiesRepository/auth-session-in-db.interface";

export const authService = {
    async findCorrectConfirmationCode(code: string): Promise<boolean> {
        const user = await usersRepository.findUserByConfirmationCode(code);
        console.log(`[usersService]: findCorrectConfirmationCode`);
        if (!user) return false;
        if (user.emailConfirmation.isConfirmed) return false;
        if (user.emailConfirmation.expirationDate < new Date()) return false;
        return true;
    },
    async checkCredentials(credentials: LoginInputModel): Promise<UserViewModelDto | null> {
        const {loginOrEmail, password} = credentials;
        const user = await usersRepository.findUserByEmailOrPassword(loginOrEmail);
        if (!user) return null;
        const passwordHash = generatePassHash(password, user.accountData.passwordSalt);
        if (passwordHash !== user.accountData.passwordHash) return null;
        if (!user.emailConfirmation.isConfirmed) return null;
        return parseUserViewModel(user);
    },
    async confirmEmail(code: string): Promise<boolean> {
        console.log(`[usersService]:confirmEmail `);
        const user = await usersRepository.findUserByConfirmationCode(code);
        if (!user) return false;
        return await usersRepository.confirmEmailInDb(user.id);
    },
    async resendingEmail(id: string): Promise<boolean> {
        console.log(`[usersService]:resendingEmail `);
        const user = await usersRepository.getUserById(id);
        if (!user) return false;
        if (user.emailConfirmation.isConfirmed) return false;
        const newConfirmationCode = getConfirmationCode();
        const newExpirationDate = getExpirationDate();
        await usersRepository.updateSendingConfirmEmail(user.id, newConfirmationCode, newExpirationDate);
        const sendingDates = user.emailConfirmation.dateSendingConfirmEmail;
        //Если было более 5 отправок письма и последняя менее 5 минут назад отбиваем
        if (sendingDates.length > 5
            && sendingDates.slice(-1)[0] < add(new Date(), {minutes: 5})) return false;
        const resend: SentMessageInfo = await emailManager.sendEmailConfirmation(user.accountData.email, newConfirmationCode);
        // проверяем ответ после отправки письма и обновляем данные в базе по повторной отправке
        // письма
        if (resend.accepted.length > 0) await usersRepository.updateSendingConfirmEmail(id, newConfirmationCode, newExpirationDate);
        return true;
    },
    async userLogin(userId: string, ip: string, title: string): Promise<UserTokensPairInterface | null> {
        const lastActiveDate = new Date();
        console.log(`[authService]-userLogin: lastActiveDate: ${lastActiveDate}`);
        const deviceId = await authSessionsRepository.saveDeviceAuthSession({
            ip,
            title,
            lastActiveDate,
            userId
        });
        if (!deviceId) return null;
        const accessToken = await jwtService.createAccessJWT(userId);
        const refreshToken = await jwtService.createRefreshJWT(userId, deviceId, String(lastActiveDate.getTime()));
        return {accessToken, refreshToken};
    },
    async userLogout(refreshToken: string): Promise<boolean> {
        const userInfo = await jwtService.getSessionInfoByJwtToken(refreshToken);
        console.log(`[usersService]: userLogout`);
        if (!userInfo) return false;
        await authSessionsRepository.deleteSessionById(userInfo.deviceId);
        return true;
    },
    async checkDeviceSession(ip: string, title: string, refreshToken: string): Promise<string | null> {
        const userInfoFromToken = await jwtService.getSessionInfoByJwtToken(refreshToken);
        console.log(`[checkDeviceSession]: userId:${userInfoFromToken!.userId}`);
        console.log(`[checkDeviceSession]: deviceId:${userInfoFromToken!.deviceId}`);
        console.log(`[checkDeviceSession]: lastActiveDate:${userInfoFromToken!.lastActiveDate}`);
        if (!userInfoFromToken) return null;
        const sessionInDb = await authSessionsRepository.findDeviceAuthSession(userInfoFromToken.deviceId);
        console.log(`[checkDeviceSession]: sessionInDb:${sessionInDb}`);
        if (!sessionInDb) return null;
        if (sessionInDb.ip !== ip
            || sessionInDb.title !== title
            || sessionInDb.lastActiveDate > userInfoFromToken.lastActiveDate
            || sessionInDb.userId !== userInfoFromToken.userId) return null;
        return userInfoFromToken.userId;
    },
    async getAllSessionByUserId(userId: string): Promise<DeviceSessionViewModelDto[]> {
        const sessions = await authSessionsRepository.getAllSessionByUserId(userId);
        return sessions.map(s => ({
            ip: s.ip,
            title: s.title,
            lastActiveDate: s.lastActiveDate.toISOString(),
            deviceId: s.deviceId
        }));
    },
    async getAuthSessionById(deviceId: string): Promise<AuthSessionInDb | null> {
        return await authSessionsRepository.getDeviceAuthSessionById(deviceId);
    },
    async deleteAllSessionExcludeCurrent(refreshToken: string): Promise<boolean> {
        const userInfoFromToken = await jwtService.getSessionInfoByJwtToken(refreshToken);
        if (!userInfoFromToken) return false;
        const sessionInDb = await authSessionsRepository.findDeviceAuthSession(userInfoFromToken.deviceId);
        if (!sessionInDb) return false;
        return await authSessionsRepository.deleteSessionExcludeId(sessionInDb.deviceId, sessionInDb.userId);
    },
    async deleteSessionById(deviceId: string): Promise<boolean> {
        return await authSessionsRepository.deleteSessionById(deviceId);
    }


};
