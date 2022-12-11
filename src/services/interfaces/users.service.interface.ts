import {UserViewModelDto} from "../../controllers/dto/userViewModel.dto";
import {LoginInputModel} from "../../controllers/dto/loginInputModel.dto";
import {UserInDbEntity} from "../entities/userInDb.entity";

export interface UsersServiceInterface {
    createUser: (login: string, email: string, password: string) => Promise<UserViewModelDto | null>;
    deleteUserById: (id: string) => Promise<boolean>;
    findUserByEmailOrPassword: (loginOrEmail: string) => Promise<UserViewModelDto | null>;
    getUserById: (id: string) => Promise<UserViewModelDto | null>;
    checkCredentials: (credentials: LoginInputModel) => Promise<UserInDbEntity | null>;
}
