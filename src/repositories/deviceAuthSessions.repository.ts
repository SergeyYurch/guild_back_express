import {DeviceSessionEntity} from "../services/entities/deviceSession.entity";
import {deviceAuthSessionsCollection} from "../adapters/dbAdapters";

export const deviceAuthSessionsRepository = {
    async saveDeviceAuthSession(session: DeviceSessionEntity): Promise<boolean> {
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
            lastActiveDate: session.lastActiveDate
        });
        return !!result;
    },
};