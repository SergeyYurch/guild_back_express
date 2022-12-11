import {UserEntity} from "../../services/entities/user.entity";
import {UserInDbEntity} from "../entitiesRepository/userInDb.entity";

export interface UsersRepositoryInterface {
    findUserByEmailOrPassword: (loginOrEmail: string) => Promise<UserInDbEntity | null>;
    createNewUser: (user: UserEntity) => Promise<string | null>;
    deleteUserById: (id: string) => Promise<boolean>;
    getUserById: (id: string) => Promise<UserInDbEntity | null>;
    findUserByConfirmationCode: (value: string) => Promise<UserInDbEntity | null>;
    confirmEmail: (id: string) => Promise<boolean>;
    updateSendingConfirmEmail: (id: string) => Promise<boolean>;
}