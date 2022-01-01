import { mongoConnect } from '../../lib/mongo.js'
import { log } from '../../lib/utils'
import { checkSignature } from '../../lib/signature.js';
import { nanoid } from 'nanoid'

export default async function joinCoolistHandler(req, res) {
  const account = req.body.account;
  const signature = req.body.signature;
  const sid = req.body.sid
  try {
    const client = await mongoConnect();
    const coolist = await client.db('coolist_xyz').collection('coolists').findOne({'sid': sid });
    if (coolist) {
      // is this account already on the list?
      if (coolist.coolies.find( o => o.account === account)) { 
        res.status(200).json({ data: { ack:"already" } });
      } else {
        if (checkSignature(account, signature, sid)) {
          const insert = await client.db('coolist_xyz').collection('coolists').findOneAndUpdate(
            {'sid': sid},
            {$push: { 'coolies': { 
            account: account,
            signature: signature
           } 
          }});
          if (insert.ok) {
            res.status(200).json({ data: { ack:"1" } });
          } else {
            res.status(200).json({ data: { ack:"0" } });
          }
        }
      }
    }
  } catch (e) {
    log(`problem connecting to db\n${e}`,'e');
    res.status(400).json({ data: "ERROR" });
  }
  
}