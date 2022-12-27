import {LoginInputModel} from "../controllers/dto/loginInputModel.dto";
import {usersRepository} from "../repositories/users.repository";
import {UserViewModelDto} from "../controllers/dto/userViewModel.dto";
import {
    generatePassHash,
    getConfirmationCode,
    getConfirmationEmailExpirationDate,
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
import {REFRESH_TOKEN_LIFE_PERIOD} from '../settings-const';

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
        const user = await usersRepository.findUserByEmailOrLogin(loginOrEmail);
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
        const newExpirationDate = getConfirmationEmailExpirationDate();
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
        console.log(`[authService]/userLogin  started`);
        const previousSessionId = await authSessionsRepository.getPreviousUserSessionFromThisDevice(userId, title)
        if(previousSessionId) await authSessionsRepository.deleteSessionById(previousSessionId)
        const lastActiveDate = new Date();
        const expiresDate = add(new Date(), {[REFRESH_TOKEN_LIFE_PERIOD.units]: REFRESH_TOKEN_LIFE_PERIOD.amount});
        console.log(`[authService]/userLogin  expiresDate = ${expiresDate}`);
        const deviceId = await authSessionsRepository.saveDeviceAuthSession({
            ip,
            title,
            lastActiveDate,
            expiresDate,
            userId
        });
        if (!deviceId) return null;
        const accessToken = await jwtService.createAccessJWT(userId);
        const refreshToken = await jwtService.createRefreshJWT(userId, deviceId, lastActiveDate);
        return {accessToken, refreshToken};
    },
    async userLogout(refreshToken: string): Promise<boolean> {
        const userInfo = await jwtService.getSessionInfoByJwtToken(refreshToken);
        console.log(`[usersService]: userLogout`);
        if (!userInfo) return false;
        return authSessionsRepository.deleteSessionById(userInfo.deviceId);
    },
    async checkDeviceSession(ip: string, title: string, refreshToken: string): Promise<{status:string, message:string}> {
        const userInfoFromToken = await jwtService.getSessionInfoByJwtToken(refreshToken);
        if (!userInfoFromToken) return {status: 'error', message: 'userInfoFromToken is wrong'};
        console.log(`[checkDeviceSession]: InToken/deviceId:${userInfoFromToken.deviceId}`);
        const sessionInDb = await authSessionsRepository.getDeviceAuthSessionById(userInfoFromToken.deviceId);
        if (!sessionInDb) return {status: 'error', message: 'sessionInDb not find'};
        console.log(`[checkDeviceSession]: Input/ip:${ip}`);
        console.log(`[checkDeviceSession]: InDb/ip:${sessionInDb?.ip}`);
        console.log(`[checkDeviceSession]: Input/title:${title}`);
        console.log(`[checkDeviceSession]: InDb/title:${sessionInDb.title}`);
        console.log(`[checkDeviceSession]: InToken/lastActiveDate:${userInfoFromToken.lastActiveDate}`);
        console.log(`[checkDeviceSession]: InDb/lastActiveDate:${sessionInDb.lastActiveDate}`);
        console.log(`[checkDeviceSession]: InToken/userId:${userInfoFromToken.userId}`);
        console.log(`[checkDeviceSession]: InDb/userId:${sessionInDb.userId}`);
        const lastActiveDateFromToken =  new Date(userInfoFromToken.lastActiveDate)
        if (sessionInDb.title !== title) return {status: 'error', message: 'title is wrong'}
        if (sessionInDb.lastActiveDate > lastActiveDateFromToken) return {status: 'error', message: 'lastActiveDate is wrong'}
        if (sessionInDb.userId !== userInfoFromToken.userId) return {status: 'error', message: 'userId is wrong'}

        return  {status: 'ok', message: sessionInDb.userId};
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
        console.log(`[authService]/deleteAllSessionExcludeCurrent started`);
        const userInfoFromToken = await jwtService.getSessionInfoByJwtToken(refreshToken);
        console.log(`[authService]/deleteAllSessionExcludeCurrent deviceId:${userInfoFromToken?.deviceId}`);

        if (!userInfoFromToken) return false;
        const sessionInDb = await authSessionsRepository.getDeviceAuthSessionById(userInfoFromToken.deviceId);
        console.log(`[authService]/deleteAllSessionExcludeCurrent userId:${sessionInDb?.userId}`);

        if (!sessionInDb) return false;
        return await authSessionsRepository.deleteSessionExcludeId(sessionInDb.deviceId, sessionInDb.userId);
    },
    async deleteSessionById(deviceId: string): Promise<boolean> {
        return await authSessionsRepository.deleteSessionById(deviceId);
    }
};
