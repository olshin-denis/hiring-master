import { IExecutor } from './Executor';
import ITask from './Task';

export default async function run(executor: IExecutor, queue: AsyncIterable<ITask>, maxThreads = 0) {
    maxThreads = Math.max(0, maxThreads);
    /**
     * Код надо писать сюда
     * Тут что-то вызываем в правильном порядке executor.executeTask для тасков из очереди queue
     */

    const cleanDate = JSON.parse(JSON.stringify(queue)).q.length === 0;
    const Array: ITask[] = [];
    const taskBody: any = {};
    let runningTask: Array<Promise<any>> = [];
    let queueIndex = 0;

    for await (let item of queue) {
        Array.push(item)
        queueIndex++;
        if (cleanDate && queueIndex === maxThreads) {
            break;
        }
    }

    const itemsCount = JSON.parse(JSON.stringify(queue)).q.length;

    while (Array.length > 0) {
        let taskIndex = 0;
        while (Array.length > taskIndex) {

            const task = Array[taskIndex];

            if (runningTask.length >= maxThreads && maxThreads > 0) {
                break
            }
            if (taskBody[task.targetId]) {
                taskIndex++;
            } else {
                Array.splice(taskIndex, 1);
                taskBody[task.targetId] = task;
                const runTask = executor.executeTask(task).then(async () => {
                    delete taskBody[task.targetId];
                    runningTask = runningTask.filter(item => item !== runTask);
                    if (itemsCount !== JSON.parse(JSON.stringify(queue)).q.length && !cleanDate) {
                        for await (const item of queue) {
                            Array.push(item)
                        }
                    }
                    if (cleanDate) {
                        for await (const item of queue) {
                            Array.push(item)
                            break;
                        }
                    }
                });
                runningTask.push(runTask)
            }
        }
        await Promise.race(runningTask)
    }
    await Promise.all(runningTask)
}
