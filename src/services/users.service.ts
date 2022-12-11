import {UserEntity} from "./entities/user.entity";
import bcrypt from 'bcrypt';
import {LoginInputModel} from "../controllers/dto/loginInputModel.dto";
import {usersRepository} from "../repositories/users.repository";
import {UserViewModelDto} from "../controllers/dto/userViewModel.dto";
import {generateHash} from "../helpers/helpers";
import {UsersServiceInterface} from "./interfaces/users.service.interface";
import {UserInDbEntity} from "../repositories/entitiesRepository/userInDb.entity";
import {v4 as uuidv4} from 'uuid';
import {emailManager} from "../managers/emailManager";
import add from 'date-fns/add';
import {SentMessageInfo} from "nodemailer";

const {
    findUserByEmailOrPassword,
    findUserByConfirmationCode,
    createNewUser,
    deleteUserById,
    getUserById,
    confirmEmail,
    updateSendingConfirmEmail
} = usersRepository;
const parseUserViewModel = (user: UserInDbEntity): UserViewModelDto => {
    return {
        id: user.id,
        login: user.accountData.login,
        email: user.accountData.email,
        createdAt: user.accountData.createdAt.toISOString()
    };
};

export const usersService: UsersServiceInterface = {
    async deleteUserById(id: string): Promise<boolean> {
        return await deleteUserById(id);
    },

    async findUserByEmailOrPassword(loginOrEmail: string): Promise<UserViewModelDto | null> {
        const result = await findUserByEmailOrPassword(loginOrEmail);
        if (!result) return null;
        return parseUserViewModel(result);
    },

    async getUserById(id: string): Promise<UserViewModelDto | null> {
        const result = await getUserById(id);
        if (!result) return null;
        return parseUserViewModel(result);
    },

    async registerNewUser(login: string, email: string, password: string): Promise<UserViewModelDto | null> {
        console.log(`[usersService]: registerNewUser ${login}`);
        const createdAt = new Date();
        const passwordSalt = await bcrypt.genSalt(10);
        const passwordHash = await generateHash(password, passwordSalt);
        const newUser: UserEntity = {
            accountData: {
                login,
                email,
                passwordHash,
                passwordSalt,
                createdAt
            },
            emailConfirmation: {
                confirmationCode: uuidv4(),
                expirationDate: add(new Date(),
                    {
                        hours: 0,
                        minutes: 10
                    }),
                isConfirmed: false,
                nextSendingConfirmEmail: new Date()
            }
        };
        const result = await createNewUser(newUser);
        if (!result) return null;
        const user = await getUserById(result);
        if (!user) return null;
        await emailManager.sendEmailConfirmation(user.accountData.email, user.emailConfirmation.confirmationCode);
        await updateSendingConfirmEmail(user.id)
        return parseUserViewModel(user);
    },
    async checkCredentials(credentials: LoginInputModel): Promise<UserViewModelDto | null> {
        const {loginOrEmail, password} = credentials;
        const user = await findUserByEmailOrPassword(loginOrEmail);
        if (!user) return null;
        const passwordHash = await generateHash(password, user.accountData.passwordSalt);
        if (passwordHash !== user.accountData.passwordHash) return null;
        if (!user.emailConfirmation.isConfirmed) return null;
        return parseUserViewModel(user);

    },
    async confirmEmail(code: string): Promise<boolean> {
        console.log(`[usersService]:confirmEmail `);
        const user = await findUserByConfirmationCode(code);
        console.log(`[usersService]: confirmed user email: ${user?.accountData.email} `);
        if (!user) return false;
        if (user.emailConfirmation.isConfirmed) return false;
        if (user.emailConfirmation.expirationDate < new Date()) return false;
        console.log(`[usersService]:confirmEmail - ok `);
        return await confirmEmail(user.id);
    },

    async resendingEmail(id: string): Promise<boolean> {
        console.log(`[usersService]:resendingEmail `);
        const user = await getUserById(id);
        if (!user) return false;
        if(user.emailConfirmation.isConfirmed) return false

        if(user.emailConfirmation.nextSendingConfirmEmail > new Date()) return false
        const resend: SentMessageInfo = await emailManager.sendEmailConfirmation(user.accountData.email, user.emailConfirmation.confirmationCode);
        await updateSendingConfirmEmail(id)
        if (resend.accepted.length > 0) return true;
        return false;
    }
};
