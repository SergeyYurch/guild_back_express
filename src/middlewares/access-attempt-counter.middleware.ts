import {Request, Response, NextFunction} from 'express';
import {accessAttemptRepository} from "../repositories/access-attempt.repository";

export const accessAttemptCounter = async (req: Request, res: Response, next: NextFunction) => {
    const endpoint = req.originalUrl;
    const ipInHeaders = req.headers['x-forwarded-for'];
    const ip = Array.isArray(ipInHeaders) ? ipInHeaders[0] : (ipInHeaders || '00:00:0000');
    console.log(`[accessAttemptCounter]-middleware run by ip: ${ip}, for url: ${endpoint}`);
    const attemptsCount = await accessAttemptRepository.getNumberOfAttemptsByIp(ip, endpoint);
    if (attemptsCount > 4) {
        console.log(`[accessAttemptCounter] for ip: ${ip} & url: ${endpoint} attempt limit exceeded`);
        return res.sendStatus(429);
    }
    const result = await accessAttemptRepository.saveAttempt(ip, endpoint);
    if (!result) return res.sendStatus(500);
    return next();

};
