import {Request, Response} from "express";
import {PaginatorOptionInterface} from "../repositories/interfaces/query.repository.interface";
import bcrypt from "bcrypt";
import {UserInDbEntity} from "../repositories/entitiesRepository/user-in-db.entity";
import {UserViewModelDto} from "../controllers/dto/userViewModel.dto";
import {v4 as uuidv4} from "uuid";
import add from "date-fns/add";
import * as dotenv from "dotenv";
import hash from "hash.js";
import {CONFIRM_EMAIL_LIFE_PERIOD, COOKIE_LIFE_PERIOD} from '../utils/settings-const';

dotenv.config();

export const parseQueryPaginator = (req: Request): PaginatorOptionInterface => {
    return {
        pageNumber: req.query.pageNumber ? +req.query.pageNumber : 1,
        pageSize: req.query.pageSize ? +req.query.pageSize : 10,
        sortBy: req.query.sortBy ? String(req.query.sortBy) : 'createdAt',
        sortDirection: req.query.sortDirection === 'asc' ? 'asc' : 'desc'
    };
};

export const pagesCount = (totalCount: number, pageSize: number) => Math.ceil(totalCount / pageSize);

export const generatePassHash = (password: string, salt: string): string => {
    return hash.sha256().update(salt).digest('hex');
};

export const generateHashSalt = async (): Promise<string> => {
    const salt_base = process.env.HASH_SALT_BASE || '54321';
    return await bcrypt.genSalt(+salt_base);
};

export const parseUserViewModel = (user: UserInDbEntity): UserViewModelDto => {
    return {
        id: user.id,
        login: user.accountData.login,
        email: user.accountData.email,
        createdAt: user.accountData.createdAt.toISOString()
    };
};

export const getConfirmationCode = () => uuidv4();

export const getConfirmationEmailExpirationDate = () => add(
    new Date(),
    {[CONFIRM_EMAIL_LIFE_PERIOD.units]: CONFIRM_EMAIL_LIFE_PERIOD.amount}
);

export const getCookieRefreshTokenExpire = () => add(
    new Date(),
    {[COOKIE_LIFE_PERIOD.units]: COOKIE_LIFE_PERIOD.amount}
);

export const setRefreshTokenToCookie = (res: Response, refreshToken: string) => {
    res.cookie(
        'RefreshToken',
        refreshToken,
        {expires: getCookieRefreshTokenExpire(), httpOnly: true} //secure: true,
    );
};

export const getDeviceInfo = (req: Request): { ip: string, title: string } => {
    const ipInHeaders = req.headers['x-forwarded-for'] || req.headers['X-Forwarded-For'];
    const ip = Array.isArray(ipInHeaders) ? ipInHeaders[0] : (ipInHeaders || '00:00:0000');
    const titleInHeader = req.headers['User-Agent'] || req.headers['user-agent'] || 'no name';
    const title = Array.isArray(titleInHeader) ? titleInHeader[0] : titleInHeader;
    return {ip, title};
};