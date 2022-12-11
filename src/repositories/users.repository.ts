import {usersCollection} from "./db";
import {ObjectId} from "mongodb";
import {UserEntity} from "../services/entities/user.entity";
import {UsersRepositoryInterface} from "./interfaces/users.repository.interface";
import {UserInDbEntity} from "../services/entities/userInDb.entity";

export const usersRepository: UsersRepositoryInterface = {
    findUserByEmailOrPassword: async (loginOrEmail: string): Promise<UserInDbEntity | null> => {
        console.log(`[findUserByEmailOrPassword]: loginOrEmail:${loginOrEmail}`);
        const result = await usersCollection.findOne({$or: [{email: loginOrEmail}, {login: loginOrEmail}]});
        if (!result) return null;
        return {
            id: result._id.toString(),
            login:result.login,
            email:result.email,
            passwordHash:result.passwordHash,
            passwordSalt:result.passwordSalt,
            createdAt: result.createdAt
        }
    },
    createNewUser: async (user: UserEntity): Promise<string | null> => {
        const result = await usersCollection.insertOne(user);
        if (result.acknowledged) return result.insertedId.toString();
        return null;
    },
    deleteUserById: async (id: string): Promise<boolean> => {
        const result = await usersCollection.deleteOne({_id: new ObjectId(id)});
        return result.acknowledged;
    },
    getUserById: async (id: string): Promise<UserEntity | null> => {
        const result = await usersCollection.findOne({_id: new ObjectId(id)});
        if (!result) return null;
        return {
            login: result.login,
            email: result.email,
            passwordHash: result.passwordHash,
            passwordSalt: result.passwordSalt,
            createdAt: result.createdAt
        };
    }
};