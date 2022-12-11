export interface UserInDbEntity {
    id: string;
    login:string;
    email:string;
    passwordHash:string;
    passwordSalt:string;
    createdAt:string;
}