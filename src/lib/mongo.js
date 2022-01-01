import { MongoClient } from 'mongodb';
const uri = process.env.MONGODB_URI;
let cachedClient = null;

export async function mongoConnect() {
  if (cachedClient) {
    return cachedClient;
  } else {
    try {
      const c = new MongoClient(uri)
      const client = await c.connect();
      cachedClient = client;
      return client
    } catch(e) {
      console.log(`ERROR: couldn't connect to db`, 'e');
      return -1;
    }
  }
}