import {Router, Response, Request} from "express";
import {validatorMiddleware} from "../middlewares/validator.middleware";
import {RequestWithBody} from "../types/request.type";
import {LoginInputModel} from "./dto/loginInputModel.dto";
import {usersService} from "../services/users.service";
import {jwtService} from "../helpers/jwt-service";
import {authBearerMiddleware} from "../middlewares/authBearer.middleware";
import {UserInputModelDto} from "./dto/userInputModel.dto";
import {RegistrationEmailResendingModelDto} from "./dto/registrationEmailResendingModel.dto";

export const authRouter = Router();

const {
    validateAuthInputModel,
    validateUserInputModel,
    validateRegistrationEmailResendingModel,
    validateRegistrationConfirmationCodeModel,
    validateResult
} = validatorMiddleware;
const {checkCredentials, findUserByEmailOrPassword, registerNewUser, confirmEmail, resendingEmail} = usersService;

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
        return res.status(200).send({
            email: userInDb.email,
            login: userInDb.login,
            userId
        });
    });
authRouter.post('/registration',
    validateUserInputModel(),
    validateResult,
    async (req: RequestWithBody<UserInputModelDto>, res: Response) => {
        console.log(`[authController]:POST/registration run`);
        const {login, password, email} = req.body;
        const loginIsExist = await findUserByEmailOrPassword(login);
        const emailIsExist = await findUserByEmailOrPassword(email);
        if (loginIsExist || emailIsExist) return res.sendStatus(400);
        try {
            const newUser = await registerNewUser(login, email, password);
            console.log('newUser');
            console.log(newUser);
            if (newUser) return res.sendStatus(204);
        } catch (error) {
            return res.sendStatus(500);
        }

    });

authRouter.get('/registration-confirmation',
    validateRegistrationConfirmationCodeModel(),
    validateResult,
    async (req: Request, res: Response) => {
        console.log(`[authController]:POST/registration-confirmation run`);
        console.log(req.query);
        const code = String(req.query.code);
        const result = await confirmEmail(code);
        if (!result) res.sendStatus(400);
        return res.sendStatus(204);
    });


authRouter.post('/registration-email-resending',
    validateRegistrationEmailResendingModel(),
    validateResult,
    async (req: RequestWithBody<RegistrationEmailResendingModelDto>, res: Response) => {
        console.log(`[authController]:POST/registration-email-resending run`);
        const {email} = req.body;
        const user = await findUserByEmailOrPassword(email);
        console.log(`[authController]:POST/registration-email-resending user: ${user?.email}`);
        if (!user) return res.sendStatus(400);
        const result = await resendingEmail(user.id)
        if (!result) return res.sendStatus(400);
        return res.sendStatus(204)
    });
