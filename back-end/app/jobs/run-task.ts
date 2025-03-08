import { REDIS_EXECUTED_LIST, REDIS_SCHEDULED_TASK } from "../utils/constants";
import redis, { connect } from "../utils/redis";
import parser from 'cron-parser';

void (async function main() {
    console.log(`Starting cron job`);

    connect();
    console.log('connected');

    await redis.rPush(REDIS_EXECUTED_LIST, JSON.stringify({'task': '1'}));
    await redis.rPush(REDIS_EXECUTED_LIST, JSON.stringify({'task': '2'}));
    await redis.rPush(REDIS_EXECUTED_LIST, JSON.stringify({'task': '3'}));

    const items = await redis.lRange(REDIS_EXECUTED_LIST, 0, -1);
    // const items = await redis.get('eeesss');
    console.log({items});
    console.log('items above');

    await redis.del(REDIS_EXECUTED_LIST);

    // const val9 = await redis.zAdd(REDIS_SCHEDULED_TASK, [
    //     { value: 'one', score: 1 },
    //     { value: 'two', score: 2 },
    //     { value: 'three', score: 3 }
    // ]);

    const cron_schedule = '*/10 * * * *';

    const interval = parser.parseExpression(cron_schedule, {
        tz: 'America/New_York'
    });

    const next = interval.next();
    const nextTime = next.getTime();

    const date = new Date();
    const epochTimeMilliseconds = date.getTime();

    const j = {
        taskId: 'bleble',
    };
    await redis.zAdd(REDIS_SCHEDULED_TASK, { score: epochTimeMilliseconds - 177755, value: JSON.stringify(j)});
    // await redis.zAdd(REDIS_SCHEDULED_TASK, { score: 1, value: 'webos'});
    // await redis.zAdd(REDIS_SCHEDULED_TASK, { score: nextTime, value: 'webosNext'});
    // await redis.zAdd(REDIS_SCHEDULED_TASK, { score: nextTime + 100000, value: 'webosNextFuture'});

    const before = await redis.zRangeWithScores(REDIS_SCHEDULED_TASK, 0, 1000);
    console.log({before});

    // Calculate which ones need to be executed
    const due = await redis.zRange(REDIS_SCHEDULED_TASK, 0, epochTimeMilliseconds, { BY: "SCORE" });
    console.log({due});
    const min = await redis.zPopMinCount(REDIS_SCHEDULED_TASK, due.length);
    console.log({min});

    for (const task of min) {
        try {
            const parsed = JSON.parse(task.value);
            const execDate = new Date();
            const execTime = execDate.getTime();
            const execTask = {
                at: execTime,
                details: parsed,
            }
            await redis.rPush(REDIS_EXECUTED_LIST, JSON.stringify(execTask));
        } catch (e: any) {

        }
    }

    // const rest = await redis.zRangeWithScores(REDIS_SCHEDULED_TASK, 0, 1000);
    // console.log({rest});

    await redis.del(REDIS_SCHEDULED_TASK);

    process.exit(0);
})();
