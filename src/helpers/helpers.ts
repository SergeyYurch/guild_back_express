import {Request} from "express";
import {PaginatorOptionInterface} from "../repositories/interfaces/query.repository.interface";
import bcrypt from "bcrypt";
import {UserInDbEntity} from "../repositories/entitiesRepository/userInDb.entity";
import {UserViewModelDto} from "../controllers/dto/userViewModel.dto";
import {v4 as uuidv4} from "uuid";
import add from "date-fns/add";
import * as dotenv from "dotenv";

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

export const generateHash = async (password: string, salt:string): Promise<string> => {
    return await bcrypt.hash(password, salt);
};

export const generateHashSalt = async (): Promise<string> => {
    const salt_base = process.env.HASH_SALT_BASE || '54321'
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

export const getExpirationDate = () => add(new Date(),
    {
        hours: 0,
        minutes: 10
    });
