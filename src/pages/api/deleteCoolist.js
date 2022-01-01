import { mongoConnect } from '../../lib/mongo.js'
import { log } from '../../lib/utils'
import { checkSignature } from '../../lib/signature.js';

export default async function deleteCoolistHandler(req, res) {
  const account = req.body.account;
  const signature = req.body.signature;
  const sid = req.body.sid;
  try {
    const client = await mongoConnect();
    if (checkSignature(account, signature, "delete")) {
      const coolists = await client.db('coolist_xyz').collection('coolists')
        .deleteOne({'sid': sid })
      const currentCoolists = await client.db('coolist_xyz').collection('coolists')
        .find({'owner': account })
        .project({'_id':0, 'owner':0})
        .toArray();
      console.log(coolists);
      res.status(200).json({ data: currentCoolists });
    }
  } catch (e) {
    log(`problem connecting to db\n${e}`,'e');
    res.status(400).json({ data: "ERROR" });
  }
}