export interface AuthSessionEntity {
    ip: string;
    title: string;
    lastActiveDate: Date;
    expiresDate:Date;
    userId: string;
}