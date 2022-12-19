import {DeviceSessionEntity} from "../services/entities/deviceSession.entity";
import {deviceAuthSessionsCollection} from "../adapters/dbAdapters";
import {ObjectId} from "mongodb";
import {DeviceSessionInDb} from "./entitiesRepository/deviceSessionInDb.interface";

export const deviceAuthSessionsRepository = {
    async saveDeviceAuthSession(session: DeviceSessionInDb): Promise<boolean> {
        //сохраняем сессию в базу и возвращаем true если операция была успешна
        console.log(`[deviceAuthSessionsRepository]:saveDeviceAuthSession`);
        const result = await deviceAuthSessionsCollection.insertOne(session);
        return result.acknowledged;
    },
    async checkDeviceAuthSession(session: DeviceSessionEntity): Promise<boolean> {
        console.log(`[deviceAuthSessionsRepository]: checkDeviceAuthSession`);
        //проверяем наличие сессии в базе и возвразщаем true если запись найдена
        const result = await deviceAuthSessionsCollection.findOne({
            deviceId: session.deviceId,
            ip: session.ip,
            title: session.title,
            lastActiveDate: session.lastActiveDate,
            userId: session.userId
        });
        return !!result;
    },
    async getAllSessionByUserId(userId: string): Promise<DeviceSessionInDb[]> {
        console.log(`[deviceAuthSessionsRepository]: getAllSessionByUserId`);
        return await deviceAuthSessionsCollection.find({
            userId
        }).toArray();

    },
    async deleteSessionExcludeById(id: string, userId: string): Promise<boolean> {
        console.log(`[deviceAuthSessionsRepository]: deleteSessionById`);
        const result = await deviceAuthSessionsCollection.deleteMany({
            $and: [{userId}, {$ne: {id: new ObjectId(id)}}]
        });
        return result.acknowledged;
    },
    async deleteSessionById(id: string): Promise<boolean> {
        console.log(`[deviceAuthSessionsRepository]: deleteSessionById`);
        const result = await deviceAuthSessionsCollection.deleteOne({
            id: new ObjectId(id)
        });
        return result.acknowledged;
    },


};