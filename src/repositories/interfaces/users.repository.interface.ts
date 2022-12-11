import {UserEntity} from "../../services/entities/user.entity";
import {UserInDbEntity} from "../../services/entities/userInDb.entity";

export interface UsersRepositoryInterface {
    findUserByEmailOrPassword: (loginOrEmail: string) => Promise<UserInDbEntity | null>,
    createNewUser: (user: UserEntity) => Promise<string | null>;
    deleteUserById: (id: string) => Promise<boolean>;
    getUserById: (id: string) => Promise<UserEntity | null>
}