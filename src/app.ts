import express from 'express';
import {testingRouter} from "./controllers/testing.controller";
import {blogsRouter} from "./controllers/blogs.controller";
import {postsRouter} from "./controllers/posts.controller";
import {authRouter} from "./controllers/auth.controller";
import {usersRouter} from "./controllers/users.controller";
import {commentsRouter} from "./controllers/comments.controller";
import cors from 'cors'

export const app = express();
app.use(cors())

app.use(express.json())
app.use('/blogs', blogsRouter)
app.use('/posts', postsRouter)
app.use('/testing', testingRouter)
app.use('/auth', authRouter)
app.use('/users', usersRouter)
app.use('/comments', commentsRouter)

