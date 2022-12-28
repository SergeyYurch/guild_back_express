import {ObjectId} from 'mongodb';

export interface DbAuthSessionInterface {
    ip: string;
    title: string;
    lastActiveDate: Date;
    expiresDate:Date;
    userId: string;
}