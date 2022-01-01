import { mongoConnect } from '../../lib/mongo.js'
import { log } from '../../lib/utils'
import { nanoid } from 'nanoid'

export default async function createCoolistHandler(req, res) {
  try {
    const client = await mongoConnect();
    const collection = await client.db('coolist_xyz').collection('coolists');
    const sid = nanoid(12).toLowerCase();
    const insert = await collection.insertOne({
      name: req.body.name,
      owner: req.body.owner,
      sid: sid,
      coolies: []
    });
    if (insert.acknowledged) {
      log(`New coolist: ${sid}`,'g');
      res.status(200).json({ sid: sid});
    } 
  } catch (e) {
    log(`problem connecting to db\n${e}`,'e');
    res.status(404).json({ sid: "ERROR" });
  }
  
}