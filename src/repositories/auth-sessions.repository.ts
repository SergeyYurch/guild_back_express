import {AuthSessionEntity} from "../services/entities/auth-session.entity";
import {deviceAuthSessionsCollection} from "../adapters/dbAdapters";
import {ObjectId} from "mongodb";
import {AuthSessionInDb} from "./entitiesRepository/auth-session-in-db.interface";
import {
    UserInfoInRefreshToken
} from "../controllers/interfaces/user-info-in-refresh-token.interface";


export const authSessionsRepository = {
    async saveDeviceAuthSession(session: AuthSessionEntity): Promise<string | null> {
        //сохраняем сессию в базу и возвращаем true если операция была успешна
        console.log(`[deviceAuthSessionsRepository]:saveDeviceAuthSession`);
        const result = await deviceAuthSessionsCollection.insertOne(session);
        if (result.acknowledged) return result.insertedId.toString();
        return null;
    },
    async findDeviceAuthSession(deviceId:string): Promise<AuthSessionInDb | null> {
        console.log(`[deviceAuthSessionsRepository]: findDeviceAuthSession deviceId:${deviceId}`);
        const result = await deviceAuthSessionsCollection.findOne({
            _id: new ObjectId(deviceId),
        });
        if (!result) return null
        return ({
            ip: result.ip,
            title: result.title,
            lastActiveDate: result.lastActiveDate,
            deviceId: result._id.toString(),
            userId:result.userId
        })
    },
    async getDeviceAuthSessionById(deviceId:string): Promise<AuthSessionInDb | null> {
        console.log(`[deviceAuthSessionsRepository]: getDeviceAuthSessionById`);
        const result = await deviceAuthSessionsCollection.findOne({
            deviceId
        });
        if (!result) return null
        return ({
            ip: result.ip,
            title: result.title,
            lastActiveDate: result.lastActiveDate,
            deviceId: result._id.toString(),
            userId:result.userId
        })
    },
    async getAllSessionByUserId(userId: string): Promise<AuthSessionInDb[]> {
        console.log(`[deviceAuthSessionsRepository]: getAllSessionByUserId`);
        const sessions = await deviceAuthSessionsCollection.find({
            userId
        }).toArray();
        return sessions.map(s => ({
            ip: s.ip,
            title: s.title,
            lastActiveDate: s.lastActiveDate,
            userId: s.userId,
            deviceId: s._id.toString()
        }));
    },
    async deleteSessionExcludeId(id: string, userId: string): Promise<boolean> {
        console.log(`[deviceAuthSessionsRepository]: deleteSessionExcludeById`);
        const result = await deviceAuthSessionsCollection.deleteMany({
            $and: [{userId}, {$ne: {id: new ObjectId(id)}}]
        });
        return result.acknowledged;
    },
    async deleteSessionById(deviceId:string): Promise<boolean> {
        console.log(`[deviceAuthSessionsRepository]: deleteSessionById`);
        const result = await deviceAuthSessionsCollection.deleteOne({
            id: new ObjectId(deviceId),
        });
        return result.acknowledged;
    },
};