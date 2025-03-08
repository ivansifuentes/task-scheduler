import axios from 'axios';
import { useEffect, useState } from 'react';
import { API_URL } from '../constants';
import { TaskSchedule } from './TaskScheduler';


function ScheduledTasks() {
    const [scheduled, setScheduled] = useState<Array<TaskSchedule>>([]);

    const fetchData = async () => {
        const res = await axios.get(API_URL + '/fetch-scheduled-tasks');
        const list: Array<TaskSchedule> = [];
        try {
            for (const taskEntry of res.data) {
                list.push(JSON.parse(taskEntry.value));
            }
        } catch (e: any) {
            console.log(e);
        }
        setScheduled(list);
    };

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 5000);
    
        return () => clearInterval(intervalId);
      }, []);

    const deleteTask = async (taskId: string) => {
        try {
            const res = await axios.post(API_URL + '/delete-task', { taskId });
            console.log(res);
        } catch (e: any) {
        }
    }

    return (
        <div>
            <div className='task-list-header'>
                Scheduled Tasks
            </div>
            <div className='div-row task-list-row task-header'>
                <div>
                    Next at
                </div>
                <div>
                    Schedule
                </div>
                <div>                        
                    Action
                </div>
            </div>
            <div className='task-list div-col'>
                {scheduled.map((st) => (
                    <div className='div-row task-list-row'>
                        <div>
                            {new Date(st.at).toLocaleString()}
                        </div>
                        <div>
                            {st.schedule}
                        </div>
                        <div>                        
                            <input
                                type="button"
                                onClick={() => deleteTask(st.taskId)}
                                value="Delete"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ScheduledTasks;
