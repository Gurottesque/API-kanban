import express from 'express';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { authRouter } from './routes/auth.routes.js';
import { userRouter } from './routes/user.routes.js';
import cookieParser from 'cookie-parser';

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();

const whitelist = ["http://localhost:3000", "https://kanban-kwc8jf5lg-mateomors-projects.vercel.app"];
const publicPath = path.resolve('public');

app.disable('x-powered-by');
app.use(express.json());
app.use(cookieParser());
app.use(express.static(publicPath));
app.use(cors({
  origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }}, 
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Acces-Control-Allow-Origin', 'authorization'],
  credentials: true
}));
app.get("/", (_req, res) => { res.send("Up") } )
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.get('/api/documentation', (_req, res) => {
  res.sendFile(path.join(publicPath, 'documentation.html'));
});

// Manejo de errores de solicitud malformada y errores internos que no fueron capturados
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ error: 'Solicitud mal formada: JSON inválido' });
    }
    next();
  });

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT)
export default app;
