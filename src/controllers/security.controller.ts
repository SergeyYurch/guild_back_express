import {Router, Response, Request} from "express";
import {RequestWithId} from "../types/request.type";
import {ObjectId} from "mongodb";

export const securityRouter = Router();



securityRouter.get('/devices',
    async (req: Request, res: Response) => {
        console.log(`!!!![securityRouter]:GET /devices`);
    }

);

securityRouter.delete('/devices',
    async (req: Request, res: Response) => {
        console.log(`!!!![securityRouter]:GET /devices`);
    }
);

securityRouter.delete('/devices/:deviceId',
    async (req: RequestWithId, res: Response) => {
        console.log(`!!!![securityRouter]:GET /devices`);
        const deviceId = req.params.deviceId;
        if (!ObjectId.isValid(deviceId)) return res.sendStatus(404);


    }
);


