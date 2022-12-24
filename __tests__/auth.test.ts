import request from 'supertest';
import {app} from "../src/app";
import {jwtService} from "../src/utils/jwt-service";
import {CookieAccessInfo} from "cookiejar";


const user1 = {
    login: "user1",
    password: "password1",
    email: "email1@gmail.com"
};
const user2 = {
    login: "user2",
    password: "password2",
    email: "email2@gmail.com"
};

const blog1 = {
    name: 'blog1',
    description: "description1",
    websiteUrl: 'https://youtube1.com'
};

describe('HOST/auth/registration :login user and receiving token, getting info about user', () => {
    let user1Id = '';
    let user2Id = '';
    let blog1Id = '';
    let post1Id = '';

    beforeAll(async () => {
        //cleaning dataBase
        await request(app)
            .delete('/testing/all-data');
        //created new users
        // const newUser1 = await request(app)
        //     .post('/users')
        //     .auth('admin', 'qwerty', {type: "basic"})
        //     .send(user1)
        //     .expect(201);
        // const newUser2 = await request(app)
        //     .post('/users')
        //     .auth('admin', 'qwerty', {type: "basic"})
        //     .send(user2)
        //     .expect(201);
        //
        // //created new blog
        // const newBlog1 = await request(app)
        //     .post('/blogs')
        //     .auth('admin', 'qwerty', {type: "basic"})
        //     .send(blog1);
        //
        //
        // //created new post
        // const newPost1 = await request(app)
        //     .post('/posts')
        //     .auth('admin', 'qwerty', {type: "basic"})
        //     .send({
        //         title: 'post1',
        //         shortDescription: 'shortDescription1',
        //         content: 'content1',
        //         blogId: newBlog1.body.id
        //     });
        // blog1Id = newBlog1.body.id;
        // user1Id = newUser1.body.id;
        // user2Id = newUser2.body.id;
        // post1Id = newPost1.body.id;
    });

    it('should return code 400 If the inputModel has incorrect values', async () => {
        await request(app)
            .post('/auth/registration')
            .send({
                "email": "string",
                "password": "password1"
            })
            .expect(400);
    });

    it('should return code 204 if input model is correct', async () => {
        await request(app)
            .post('/auth/registration')
            .send({
                "login": "user1",
                "password": "string111",
                "email": "user1@mail.ru"
            })
            .expect(204);
    });

    it('should return code 429 if access attempt limit exceeded', async () => {
        await request(app)
            .post('/auth/registration')
            .send({
                "login": "user11",
                "password": "string11",
                "email": "user11@mail.ru"
            })
            .expect(204);

        await request(app)
            .post('/auth/registration')
            .send({
                "login": "user2",
                "password": "string2",
                "email": "user2@mail.ru"
            })
            .expect(204);

        await request(app)
            .post('/auth/registration')
            .send({
                "login": "user3",
                "password": "string3",
                "email": "user3@mail.ru"
            })
            .expect(204);

        await request(app)
            .post('/auth/registration')
            .send({
                "login": "user4",
                "password": "string4",
                "email": "user4@mail.ru"
            })
            .expect(204);

        await request(app)
            .post('/auth/registration')
            .send({
                "login": "user6",
                "password": "string6",
                "email": "user6@mail.ru"
            })
            .expect(429);
    });
});


describe('HOST/auth/login :login user and receiving token, getting info about user', () => {
    let user1Id = '';
    let user2Id = '';
    let blog1Id = '';
    let post1Id = '';

    beforeAll(async () => {
        //cleaning dataBase
        await request(app)
            .delete('/testing/all-data');
        //created new users
        const newUser1 = await request(app)
            .post('/users')
            .auth('admin', 'qwerty', {type: "basic"})
            .send(user1)
            .expect(201);


        const newUser2 = await request(app)
            .post('/users')
            .auth('admin', 'qwerty', {type: "basic"})
            .send(user2)
            .expect(201);

        //created new blog
        const newBlog1 = await request(app)
            .post('/blogs')
            .auth('admin', 'qwerty', {type: "basic"})
            .send(blog1);


        //created new post
        const newPost1 = await request(app)
            .post('/posts')
            .auth('admin', 'qwerty', {type: "basic"})
            .send({
                title: 'post1',
                shortDescription: 'shortDescription1',
                content: 'content1',
                blogId: newBlog1.body.id
            });
        blog1Id = newBlog1.body.id;
        user1Id = newUser1.body.id;
        user2Id = newUser2.body.id;
        post1Id = newPost1.body.id;
    });

    it('should return code 400 If the inputModel has incorrect values', async () => {
        await request(app)
            .post('/auth/login')
            .send({
                "password": "password1"
            })
            .expect(400);
    });

    it('should return code 401 if the password or login is wrong', async () => {
        await request(app)
            .post('/auth/login')
            .send({
                "loginOrEmail": "wwwwwwwwwwww",
                "password": "password1"
            })
            .expect(401);
    });

    it('should return code 200 and pair of JWT-tokens', async () => {
        const result = await request(app)
            .post('/auth/login')
            .send({
                "loginOrEmail": "user1",
                "password": "password1"
            })
            .expect(200);

        const cookies = result.get('Set-Cookie');
        const refreshToken = cookies[0].split(';').find(c => c.includes('refreshToken'))?.split('=')[1] || 'no token';
        const userIdFromRefreshToken = await jwtService.getUserIdByJwtToken(refreshToken, 'refresh');
        expect(userIdFromRefreshToken).toBe(user1Id);

        const accessToken = result.body.accessToken;
        const idFromToken = await jwtService.getUserIdByJwtToken(accessToken, 'access');
        expect(idFromToken).toBe(user1Id);
    });

    it('should return code 429 to more than 5 attempts from one IP-address during 10 seconds', async () => {
        await request(app)
            .post('/auth/login')
            .send({
                "loginOrEmail": "user1",
                "password": "password1"
            })
            .expect(200);
        await request(app)
            .post('/auth/login')
            .send({
                "loginOrEmail": "user1",
                "password": "password1"
            })
            .expect(200);
        await request(app)
            .post('/auth/login')
            .send({
                "loginOrEmail": "user1",
                "password": "password1"
            })
            .expect(200);
        await request(app)
            .post('/auth/login')
            .send({
                "loginOrEmail": "user1",
                "password": "password1"
            })
            .expect(200);
        await request(app)
            .post('/auth/login')
            .send({
                "loginOrEmail": "user1",
                "password": "password1"
            })
            .expect(200);
        await request(app)
            .post('/auth/login')
            .send({
                "loginOrEmail": "user1",
                "password": "password1"
            })
            .expect(429);


    });
});

describe('HOST/auth/refresh-token ', () => {
    let user1Id = '';
    let accessToken = '';
    let refreshToken = '';
    let expiredRefreshToken = '';
    let user2RefreshToken = '';

    beforeAll(async () => {
        //cleaning dataBase
        await request(app)
            .delete('/testing/all-data');
        //created new users

        const newUser1 = await request(app)
            .post('/users')
            .auth('admin', 'qwerty', {type: "basic"})
            .send(user1)
            .expect(201);

        //login user
        const loginResult = await request(app)
            .post('/auth/login')
            .send({
                "loginOrEmail": "user1",
                "password": "password1"
            });

        const cookies = loginResult.get('Set-Cookie');
        refreshToken = cookies[0].split(';').find(c => c.includes('refreshToken'))?.split('=')[1] || 'no token';
        user1Id = newUser1.body.id;
        const sessionInfo = await  jwtService.getSessionInfoByJwtToken(refreshToken)
        expiredRefreshToken =  await jwtService.createRefreshJWT(user1Id, sessionInfo!.deviceId, String(new Date().getTime()-10000));

    });

    it('should return code 401 no refreshToken', async () => {
        await request(app)
            .post('/auth/refresh-token')
            .expect(401);
    });



    it('should return code 401 no refreshToken', async () => {
        await request(app)
            .post('/auth/refresh-token')
            .set('Cookie', `refreshToken=${expiredRefreshToken}`)
            .expect(401);
    });

    it('should return code 200 and pair of JWT-tokens', async () => {
        const result = await request(app)
            .post('/auth/refresh-token')
            .set('Cookie', `refreshToken=${refreshToken}`)
            .expect(200);

        const cookies = result.get('Set-Cookie');
        const testRefreshToken = cookies[0].split(';').find(c => c.includes('refreshToken'))?.split('=')[1] || 'no token';
        const userIdFromRefreshToken = await jwtService.getUserIdByJwtToken(testRefreshToken, 'refresh');
        expect(userIdFromRefreshToken).toBe(user1Id);

        const accessToken = result.body.accessToken;
        const idFromToken = await jwtService.getUserIdByJwtToken(accessToken, 'access');
        expect(idFromToken).toBe(user1Id);
    });

    it('should return code 429 to more than 5 attempts from one IP-address during 10 seconds', async () => {

        let loginResult = await request(app)
            .post('/auth/refresh-token')
            .set('Cookie', `refreshToken=${refreshToken}`)
            .expect(200);

        let cookies = loginResult.get('Set-Cookie');
        refreshToken = cookies[0].split(';').find(c => c.includes('refreshToken'))?.split('=')[1] || 'no token';

        loginResult = await request(app)
            .post('/auth/refresh-token')
            .set('Cookie', `refreshToken=${refreshToken}`)
            .expect(200);

        cookies = loginResult.get('Set-Cookie');
        refreshToken = cookies[0].split(';').find(c => c.includes('refreshToken'))?.split('=')[1] || 'no token';

        loginResult = await request(app)
            .post('/auth/refresh-token')
            .set('Cookie', `refreshToken=${refreshToken}`)
            .expect(200);

        cookies = loginResult.get('Set-Cookie');
        refreshToken = cookies[0].split(';').find(c => c.includes('refreshToken'))?.split('=')[1] || 'no token';

        loginResult = await request(app)
            .post('/auth/refresh-token')
            .set('Cookie', `refreshToken=${refreshToken}`)
            .expect(200);

        cookies = loginResult.get('Set-Cookie');
        refreshToken = cookies[0].split(';').find(c => c.includes('refreshToken'))?.split('=')[1] || 'no token';

        loginResult = await request(app)
            .post('/auth/refresh-token')
            .set('Cookie', `refreshToken=${refreshToken}`)
            .expect(200);

        cookies = loginResult.get('Set-Cookie');
        refreshToken = cookies[0].split(';').find(c => c.includes('refreshToken'))?.split('=')[1] || 'no token';

        loginResult = await request(app)
            .post('/auth/refresh-token')
            .set('Cookie', `refreshToken=${refreshToken}`)
            .expect(429);

        cookies = loginResult.get('Set-Cookie');
        refreshToken = cookies[0].split(';').find(c => c.includes('refreshToken'))?.split('=')[1] || 'no token';

    });
});

