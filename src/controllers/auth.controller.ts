import {Router, Response} from "express";
import {validatorMiddleware} from "../middlewares/validator.middleware";
import {RequestWithBody} from "../types/request.type";
import {LoginInputModel} from "./dto/loginInputModel.dto";
import {usersService} from "../services/users.service";
import {jwtService} from "../helpers/jwt-service";
import {authBearerMiddleware} from "../middlewares/authBearer.middleware";

export const authRouter = Router();

const {
    validateAuthInputModel,
    validateResult
} = validatorMiddleware;
const {checkCredentials} = usersService;

authRouter.post('/login',
    validateAuthInputModel(),
    validateResult,
    async (req: RequestWithBody<LoginInputModel>, res: Response) => {
        const {loginOrEmail, password} = req.body;
        console.log(`!!!![authRouter] login:${loginOrEmail}, pass: ${password}`);
        const user = await checkCredentials({loginOrEmail, password});
        if (user) {
            const token = await jwtService.createJWT(user.id);
            return res.status(200).send({
                "accessToken": token
            });
        } else {
            return res.sendStatus(401);
        }
    });

authRouter.get('/me',
    authBearerMiddleware,
    async (req: RequestWithBody<LoginInputModel>, res: Response) => {
        const userId = req.user!.id;
        console.log(`[authController]:get user info by ID: ${userId}`);
        const userInDb = await usersService.getUserById(userId);
        if (!userInDb) return res.sendStatus(401);
        return res.status(200). send({
            email: userInDb.email,
            login: userInDb.login,
            userId
        });
    });