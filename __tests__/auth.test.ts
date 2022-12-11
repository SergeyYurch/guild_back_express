import request from 'supertest';
import {app} from "../src/app";
import {jwtService} from "../src/helpers/jwt-service";

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


describe('AUTH: login user and receiving token, getting info about user', () => {
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

    it('should return code 200 and  JWT-token', async () => {
        const result = await request(app)
            .post('/auth/login')
            .send({
                "loginOrEmail": "user1",
                "password": "password1"
            })
            .expect(200);

        const token = result.body.accessToken;
        const idFromToken = await jwtService.getUserIdByJwtToken(token);
        expect(idFromToken).toBe(user1Id);
    });

    it('should return code 200 JWT-token', async () => {
        const result = await request(app)
            .post('/auth/login')
            .send({
                "loginOrEmail": "user1",
                "password": "password1"
            })
            .expect(200);

        const token = result.body.accessToken;
        const idFromToken = await jwtService.getUserIdByJwtToken(token);
        expect(idFromToken).toBe(user1Id);
    });

    it('should return code 200 and user info with correct JWT-token', async () => {
        const result = await request(app)
            .post('/auth/login')
            .send({
                "loginOrEmail": "user1",
                "password": "password1"
            })
            .expect(200);
        const token = result.body.accessToken;
        const userId = await jwtService.getUserIdByJwtToken(token);

        const info = await request(app)
            .get('/auth/me')
            .auth(token, {type: "bearer"})


        expect(info.body).toEqual({
            login: "user1",
            email: "email1@gmail.com",
            userId
        });
    });
});

