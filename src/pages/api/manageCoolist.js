import { mongoConnect } from '../../lib/mongo.js'
import { log } from '../../lib/utils'
import { checkSignature } from '../../lib/signature.js';

export default async function manageCoolistHandler(req, res) {
  const account = req.body.account;
  const signature = req.body.signature;
  try {
    const client = await mongoConnect();
    if (checkSignature(account, signature)) {
      const coolists = await client.db('coolist_xyz').collection('coolists')
        .find({'owner': account })
        .project({'_id':0, 'owner':0})
        .toArray();
      res.status(200).json({ data: coolists });
    } else {
      res.status(400).json({ data: "ERROR" });
    }
  } catch (e) {
    log(`problem connecting to db\n${e}`,'e');
    res.status(400).json({ data: "ERROR" });
  }
}