import axios from 'axios';
import { useEffect, useState } from 'react';
import { API_URL } from '../constants';
import { TaskSchedule } from './TaskScheduler';


function ExecutedTasks() {
    const [executed, setExecuted] = useState<Array<TaskSchedule>>([]);

    const fetchData = async () => {
        const res = await axios.get(API_URL + '/fetch-executed-tasks');
        const list: Array<TaskSchedule> = [];
        try {
            for (const task of res.data) {
                list.push(task);
            }
        } catch (e: any) {
            console.log(e);
        }
        setExecuted(list);
    };

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 5000);
    
        return () => clearInterval(intervalId);
      }, []);

    return (
        <div>
            <div className='task-list-header'>
                Executed Tasks
            </div>
            <div className='div-row task-list-row task-header'>
                <div>
                    Scheduled at
                </div>
                <div>
                    Schedule
                </div>
                <div>
                    Executed at
                </div>
                <div>                        
                    Type
                </div>
            </div>
            <div className='task-list div-col'>
                {executed.map((st) => (
                    <div className='div-row task-list-row'>
                        <div>
                            {new Date(st.at).toLocaleString()}
                        </div>
                        <div>
                            {st.schedule}
                        </div>
                        <div>
                            {new Date(st.executedAt!).toLocaleString()}
                        </div>
                        <div>
                            {st.taskType}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ExecutedTasks;
