import {Router, Request, Response, NextFunction} from "express";
import {repository} from "../repositories/repository";
export const testingRouter = Router();

testingRouter.use((req: Request, res: Response, next: NextFunction) => {
    next();
});

testingRouter.delete('/all-data', async (req: Request, res: Response)=> {
        const result = await repository.dataBaseClear();
        if (result) {
            res.sendStatus(204);
        } else {
            res.sendStatus(500);
        }
    }
);
