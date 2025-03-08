import { Request, Response } from 'express';
import parser from 'cron-parser';

// Quick & Dirty pseudo cron job that will be executed every X seconds
// takes care of executing the scheduled tasks

import { REDIS_EXECUTED_LIST, REDIS_SCHEDULED_TASK, TZ } from "./utils/constants";
import redis from "./utils/redis";
import { TaskSchedule, TaskType } from './task';

export const schedulerCron = async (_: Request, res: Response) => {
    // First we pop the scheduled tasks due to be executed
    // Calculate which ones need to be executed
    const date = new Date();
    const epochTimeMilliseconds = date.getTime();
    const due = await redis.zRange(REDIS_SCHEDULED_TASK, 0, epochTimeMilliseconds, { BY: "SCORE" });
    // console.log({due});
    const min = await redis.zPopMinCount(REDIS_SCHEDULED_TASK, due.length);
    // console.log({min});
    // Every task gets executed, and if recurrent set next execution time
    for (const task of min) {
        try {
            const parsed = JSON.parse(task.value);
            await redis.rPush(REDIS_EXECUTED_LIST, JSON.stringify({
                ...parsed,
                executedAt: date.toISOString(),
            }));
            if (parsed.taskType !== TaskType.RECURRENT)
                continue;
            const interval = parser.parseExpression(parsed.schedule, {
                tz: TZ,
            });
            const next = interval.next();
            const nextTime = next.getTime();
            if (nextTime < epochTimeMilliseconds)
                continue;
            const taskSchedule: TaskSchedule = {
                ...parsed,
                at: next.toISOString(),
            }
            await redis.zAdd(REDIS_SCHEDULED_TASK, { score: nextTime, value: JSON.stringify(taskSchedule)});
        } catch (e: any) {

        }
    }


    return res.status(200).json(min);
}
