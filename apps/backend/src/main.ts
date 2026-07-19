import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { codexRouter } from './routes/codexRoutes';
import { healthRouter } from './routes/healthRoutes';
import { jiraRouter } from './routes/jiraRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

dotenv.config({ path: 'apps/backend/.env' });

const app = express();
const port = Number(process.env.PORT ?? 4000);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';

app.use(cors({ origin: frontendOrigin }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/health', healthRouter);
app.use('/api/jira', jiraRouter);
app.use('/api/codex', codexRouter);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`TicketTDD backend listening on http://localhost:${port}`);
});
