import express from "express";
import http from "http";
import cors from 'cors';
import { addOneTimeTask, addRecurrentTask, deleteTask, fetchExecutedTasks, fetchScheduledTasks } from "./task";
import { schedulerCron } from "./cron";

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

const router = express.Router();

router.post('/add-recurrent-task', addRecurrentTask);
router.post('/add-one-time', addOneTimeTask);
router.get('/fetch-scheduled-tasks', fetchScheduledTasks);
router.get('/fetch-executed-tasks', fetchExecutedTasks);
router.post('/delete-task', deleteTask);

router.get('/scheduler-cron', schedulerCron);

app.use('/api/', router);

const httpServer = http.createServer(app);
const PORT: any = process.env.PORT ?? 4000;
httpServer.listen(PORT, () => console.log(`The server is running on port ${PORT}`));
