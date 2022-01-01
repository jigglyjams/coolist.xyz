import {
  Link as ChakraLink,
  Button,
  Text,
  Heading,
  Center,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react'
import { useState } from 'react';
import { DarkModeSwitch } from '../../components/DarkModeSwitch'
import { mongoConnect } from '../../lib/mongo.js'
import { getAccount, getSignature } from '../../lib/signature.js'

export default function Join({ coolist }) {
  const [account, setAccount] = useState();
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState();
  const [alreadyListed, setAlreadyListed] = useState(false);

  async function joinCoolist(account, msg) {
    setJoining(true);
    const sig = await getSignature(account, msg);
    const response = await fetch('/api/joinCoolist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({account:account, signature:sig, sid:coolist.sid})
    });
    const data = await response.json();
    const ack = data.data.ack;
    if (ack === "1") {
      setJoined(true);
      setJoining(false);
    } else if (ack === "already") {
      setJoining(false);
      setAlreadyListed(true);
    }
  }

  return (
    <Center mt={50}>
      <DarkModeSwitch />
      <VStack spacing={8}>
        <Heading>coolist</Heading>
        <Text>a simple way to collect Ethereum wallet addresses</Text>
        <Heading size='sm'>coolist name: {coolist.name} </Heading>
        {!account ? (
        <Button onClick={async () => setAccount(await getAccount())}>connect wallet</Button>):
        (
        <VStack spacing={8}>
          <Text>{`you: ${account.substring(0,6)}...${account.substring(38)}`}</Text>
          {!joined ? (
            <Button onClick={async () => {joinCoolist(account, coolist.sid)}} isLoading={joining}>join coolist</Button>):
            <Alert
              status='success'
              variant='subtle'
              flexDirection='column'
              alignItems='center'
              justifyContent='center'
              textAlign='center'
              height='200px'
              width='md'>
              <AlertIcon boxSize='40px' mr={0} />
              <AlertTitle mt={4} mb={1} fontSize='lg'>
                welcome to the coolist!
              </AlertTitle>
              <AlertDescription maxWidth='md'>
                you're officially a coolie now
              </AlertDescription>
            </Alert>
          }
          {alreadyListed ? (
            <Alert status='info'>
              <AlertIcon />
                you've already joined this coolist
            </Alert>
          ):null}
        </VStack>
        )}
      </VStack>
    </Center>
  )
}

export async function getServerSideProps({ params }) {
  const client = await mongoConnect();
  const collection = await client.db('coolist_xyz').collection('coolists');
  const coolist = await collection.findOne({'sid': params.sid })
  if (coolist !== null) {
    return {
      props: { coolist: { 
        name: coolist.name,
        sid: params.sid
      }}
    }
  } else {
    return {
      notFound: true
    }
  }
}