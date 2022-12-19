import {LoginInputModel} from "../controllers/dto/loginInputModel.dto";
import {usersRepository} from "../repositories/users.repository";
import {UserViewModelDto} from "../controllers/dto/userViewModel.dto";
import {
    generateHash,
    getConfirmationCode,
    getExpirationDate,
    parseUserViewModel
} from "../helpers/helpers";
import {emailManager} from "../managers/emailManager";
import add from 'date-fns/add';
import {SentMessageInfo} from "nodemailer";
import {RefreshTokenEntity} from "./entities/refreshToken.entity";
import {jwtService} from "../utils/jwt-service";
import {tokensBlackListRepository} from "../repositories/tokensBlackList.repository";
import {UserTokensPairInterface} from "./entities/userTokensPair.interface";
import {deviceAuthSessionsRepository} from "../repositories/deviceAuthSessions.repository";
import {DeviceSessionViewModelDto} from "../controllers/dto/deviceSessionViewModel.dto";


export const authUsersService = {
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
        const passwordHash = await generateHash(password, user.accountData.passwordSalt);
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
    async refreshUserTokens(oldToken: string, userId: string): Promise<UserTokensPairInterface | null> {
        const refreshTokenToBlackList: RefreshTokenEntity = {
            userId,
            refreshToken: oldToken,
            device: 'chrome',
            createdAt: new Date()
        };
        const result = await tokensBlackListRepository.saveTokenToBlackList(refreshTokenToBlackList);
        if (!result) return null;
        const accessToken = await jwtService.createAccessJWT(userId);
        const refreshToken = await jwtService.createRefreshJWT(userId);
        if (!accessToken || !refreshToken) return null;
        return {accessToken, refreshToken};
    },
    async userLogin(userId: string): Promise<UserTokensPairInterface> {
        const accessToken = await jwtService.createAccessJWT(userId);
        const refreshToken = await jwtService.createRefreshJWT(userId);
        return {accessToken, refreshToken};
    },
    async userLogout(refreshToken: string, userId: string): Promise<boolean> {
        console.log(`[usersService]: userLogout userId:${userId}`);
        return await tokensBlackListRepository.saveTokenToBlackList({
            refreshToken,
            userId,
            device: 'chrome',
            createdAt: new Date(),
        });
    },
    async checkUserRefreshToken(oldToken: string, userId: string): Promise<boolean> {
        return tokensBlackListRepository.checkTokenInBlackList(oldToken, userId);
    },

    async getAllSessionByUserId(userId: string): Promise<DeviceSessionViewModelDto[]> {
        const sessions = await deviceAuthSessionsRepository.getAllSessionByUserId(userId);
        return sessions.map(s => ({
            ip: s.ip,
            title: s.title,
            lastActiveDate: s.lastActiveDate,
            deviceId: s.deviceId
        }));

    }

};
