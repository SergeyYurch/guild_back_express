import {Request, Response, NextFunction} from 'express';
import {jwtService} from "../utils/jwt-service";
import {usersService} from "../services/users.service";
import {getDeviceInfo} from "../helpers/helpers";
import {authService} from "../services/auth.service";

export const refreshTokenValidator = async (req: Request, res: Response, next: NextFunction) => {
    console.log('[refreshTokenValidator]');
    const refreshToken = req.cookies?.refreshToken;
    console.log(`[refreshTokenValidator] refreshToken: ${refreshToken}`);

    try {
        console.log(`[refreshTokenValidator]: refreshToken : ${refreshToken}`);
        if (!refreshToken) return res.status(401).send('no refreshToken');
        const {ip, title} = getDeviceInfo(req);
        console.log(`[refreshTokenValidator]: ip : ${ip}`);
        console.log(`[refreshTokenValidator]: title : ${title}`);
        const result = await authService.checkDeviceSession(ip, title, refreshToken);
        console.log(`[refreshTokenValidator]: userId : ${result}`);
        if (result.status!=='ok') return res.status(402).send(`no checkDeviceSession error:${result.message}`);
        req.user= await usersService.getUserById(result.message)
        return next();
    } catch (error) {
        return res.sendStatus(500);
    }
};