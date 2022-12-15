import {Router, Response, Request} from "express";
import {validatorMiddleware} from "../middlewares/validator.middleware";
import {RequestWithBody} from "../types/request.type";
import {LoginInputModel} from "./dto/loginInputModel.dto";
import {usersService} from "../services/users.service";
import {jwtService} from "../helpers/jwt-service";
import {authBearerMiddleware} from "../middlewares/authBearer.middleware";
import {UserInputModelDto} from "./dto/userInputModel.dto";
import {RegistrationEmailResendingModelDto} from "./dto/registrationEmailResendingModel.dto";
import add from "date-fns/add";

export const authRouter = Router();

const {
    validateLoginInputModel,
    validateUserInputModel,
    validateRegistrationEmailResendingModel,
    validateRegistrationConfirmationCodeModel,
    validateResult
} = validatorMiddleware;
const {
    checkCredentials,
    findUserByEmailOrPassword,
    registerNewUser,
    confirmEmail,
    resendingEmail,
    userLogin,
    userLogout,
    refreshUserTokens,
    checkUserRefreshToken
} = usersService;

const CookieRefreshTokenExpire =()=> add(new Date(), {seconds:20})

authRouter.post('/login',
    validateLoginInputModel(),
    validateResult,
    async (req: RequestWithBody<LoginInputModel>, res: Response) => {
        const {loginOrEmail, password} = req.body;
        console.log(`!!!![authRouter] login:${loginOrEmail}`);
        const user = await checkCredentials({loginOrEmail, password});
        if (!user) return res.sendStatus(401);
        const loginParams = await userLogin(user.id);
        res.cookie(
            'refreshToken',
            loginParams.refreshToken,
            {expires: CookieRefreshTokenExpire(), secure: true, httpOnly: true}
        );
        return res.status(200).send({
            "accessToken": loginParams.accessToken
        });
    }
);

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
        try {
            const newUser = await registerNewUser(login, email, password);
            if (newUser) return res.sendStatus(204);
        } catch (error) {
            return res.sendStatus(500);
        }

    });

authRouter.post('/registration-confirmation',
    validateRegistrationConfirmationCodeModel(),
    validateResult,
    async (req: Request, res: Response) => {
        console.log(`[authController]:POST/registration-confirmation run`);
        console.log(req.body);
        const code = String(req.body.code);
        try {
            const result = await confirmEmail(code);
            if (!result) res.sendStatus(400);
            return res.sendStatus(204);
        } catch (error) {
            return res.sendStatus(500);
        }
    });


authRouter.post('/registration-email-resending',
    validateRegistrationEmailResendingModel(),
    validateResult,
    async (req: RequestWithBody<RegistrationEmailResendingModelDto>, res: Response) => {
        console.log(`[authController]:POST/registration-email-resending run`);
        const {email} = req.body;
        try {
            const user = await findUserByEmailOrPassword(email);
            const result = await resendingEmail(user!.id);
            if (!result) return res.status(400).send(
                {"errorsMessages": [{"message": "cant\'t send email", "field": "email"}]}
            );
            return res.sendStatus(204);
        } catch (error) {
            return res.sendStatus(500);
        }
    });

authRouter.post('/refresh-token',
    async (req: Request, res: Response) => {
        console.log(`[authController]:POST/refresh-token run`);
        const oldRefreshToken = req.cookies.refreshToken;
        console.log('oldRefreshToken');
        console.log(oldRefreshToken);
        try {
            console.log('try in');
            if (!oldRefreshToken) return res.sendStatus(401);
            const userId = await jwtService.getUserIdByJwtToken(oldRefreshToken, "refresh");
            console.log('userId');
            console.log(userId);
            if (!userId) return res.sendStatus(401);
            const tokenIsMissing = await checkUserRefreshToken(oldRefreshToken, userId);
            console.log('tokenIsMissing');
            console.log(tokenIsMissing);
            if (tokenIsMissing) return res.sendStatus(401);
            const tokensPair = await refreshUserTokens(oldRefreshToken, userId);
            console.log('tokensPair');
            console.log(tokensPair);
            if (!tokensPair) return res.sendStatus(500);
            res.cookie(
                'refreshToken',
                tokensPair.refreshToken,
                {expires: CookieRefreshTokenExpire(), secure: true, httpOnly: true}
            );
            return res.status(200).send({
                "accessToken": tokensPair.accessToken
            });
        } catch (error) {
            return res.sendStatus(500);
        }
    });

authRouter.post('/logout',
    async (req: Request, res: Response) => {
        console.log(`[authController]:POST/logout run`);
        const inputRefreshToken = req.cookies?.refreshToken;
        try {
            if (!inputRefreshToken) return res.sendStatus(401);
            const userId = await jwtService.getUserIdByJwtToken(inputRefreshToken, 'refresh');
            if (!userId) return res.sendStatus(401);
            const result = await userLogout(inputRefreshToken, userId);
            if (!result) return res.sendStatus(500);
            res.clearCookie('refreshToken')
            return res.sendStatus(204);
        } catch (error) {
            return res.sendStatus(500);
        }
    });