import { Request, Response } from 'express';
import parser from 'cron-parser';
import { REDIS_EXECUTED_LIST, REDIS_SCHEDULED_TASK, TZ } from './utils/constants';
import { randomUUID } from 'crypto';
import redis from './utils/redis';

export enum TaskType {
    RECURRENT = 'RECURRENT',
    ONE_TIME = 'ONE_TIME',
}

export type TaskSchedule = {
    taskId: string;
    at: string; // Date ISO string
    schedule: string;
    taskType: TaskType;
    executedAt?: string;
}

// Store a new recurrent task, scheduling the first one
export const addRecurrentTask = async (req: Request, res: Response) => {
    const { recurrent } = req.body;
    if (!recurrent) {
        return res.status(400).json([
          'invalid request'
        ]);
    }

    let interval;
    try {
        interval = parser.parseExpression(recurrent, {
            tz: TZ,
        });
    } catch (e: any) {
        return res.status(400).json([
            'invalid request'
        ]);
    }

    // Calculate when is the next execution time of this task
    const next = interval.next();
    const nextTime = next.getTime();
    const taskSchedule: TaskSchedule = {
        taskId: randomUUID(),
        at: next.toISOString(),
        schedule: recurrent,
        taskType: TaskType.RECURRENT,
    }
    await redis.zAdd(REDIS_SCHEDULED_TASK, { score: nextTime, value: JSON.stringify(taskSchedule)});

    return res.status(200).json(taskSchedule);
}

// Store a new single use task, scheduling it
export const addOneTimeTask = async (req: Request, res: Response) => {
    const { oneTime } = req.body;
    if (!oneTime) {
        return res.status(400).json([
          'invalid request'
        ]);
    }

    const date = new Date(oneTime);
    const nextTime = date.getTime();
    const taskSchedule: TaskSchedule = {
        taskId: randomUUID(),
        at: date.toISOString(),
        schedule: '',
        taskType: TaskType.ONE_TIME,
    }
    await redis.zAdd(REDIS_SCHEDULED_TASK, { score: nextTime, value: JSON.stringify(taskSchedule)});

    return res.status(200).json(taskSchedule);
}


// Retrieve a list of scheduled tasks
export const fetchScheduledTasks = async (_: Request, res: Response) => {
    const tasks = await redis.zRangeWithScores(REDIS_SCHEDULED_TASK, 0, -1);
    return res.status(200).json(tasks);
}

// Retrieve a list of executed tasks
export const fetchExecutedTasks = async (_: Request, res: Response) => {
    const tasks = await redis.lRange(REDIS_EXECUTED_LIST, 0, -1);
    const result = [];
    for (const task of tasks) {
        try {
            const parsed = JSON.parse(task);
            result.push(parsed);
        } catch (e: any) {
            console.log(e);
        }
    }
    return res.status(200).json(result);
}

// Deletes an existing task
export const deleteTask = async (req: Request, res: Response) => {
    const { taskId } = req.body;

    for await (const value of redis.zScanIterator(REDIS_SCHEDULED_TASK, { MATCH: `*${taskId}*` })) {
        redis.zRem(REDIS_SCHEDULED_TASK, value.value);
    }
    return res.status(200).json([]);
}
