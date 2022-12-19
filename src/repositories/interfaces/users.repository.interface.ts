import {UserEntity} from "../../services/entities/user.entity";
import {UserInDbEntity} from "../entitiesRepository/userInDb.entity";

export interface UsersRepositoryInterface {
    findUserByEmailOrPassword: (loginOrEmail: string) => Promise<UserInDbEntity | null>;
    createNewUser: (user: UserEntity) => Promise<string | null>;
    deleteUserById: (id: string) => Promise<boolean>;
    getUserById: (id: string) => Promise<UserInDbEntity | null>;
    findUserByConfirmationCode: (value: string) => Promise<UserInDbEntity | null>;
    confirmEmailInDb: (id: string) => Promise<boolean>;
    updateSendingConfirmEmail: (id: string, confirmationCode: string, expirationDate: Date) => Promise<boolean>;
    setNewConfirmationCode: (id: string, code: string, date: Date) => Promise<boolean>;
}