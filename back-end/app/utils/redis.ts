import { RedisClientType, createClient } from 'redis';

class RedisSingleton {
    private static client: RedisClientType;

    private constructor() {}

    // Provide a static method to get the single instance
    public static getClient(): RedisClientType {
        if (!RedisSingleton.client) {
            RedisSingleton.client = createClient({
                // url: `redis://redis:6379`,
                url: `redis://host.docker.internal:6379`,
            });
            RedisSingleton.client.on('error', (err: any) =>
                console.log(err)
            );
        }
        if (!RedisSingleton.client.isOpen) RedisSingleton.client.connect();
        return RedisSingleton.client;
    }
}

export default RedisSingleton.getClient();

export const connect = async () => {
    if (!RedisSingleton.getClient().isOpen) {
        return RedisSingleton.getClient().connect();
    }
}
export const disconnect = async () => RedisSingleton.getClient().disconnect();
