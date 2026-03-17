import { createClient } from "redis"

const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.on("connect", function() {
  console.log("Connected to Redis!");
});

redisClient.on("error", function(err) {
  console.log("error while connecting to redis..");
});
await redisClient.connect()


export default redisClient;