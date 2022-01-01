import {
  Link as ChakraLink,
  Button,
  Text,
  Heading,
  Center,
  Input,
  VStack,
  HStack,
  Code,
  IconButton
} from '@chakra-ui/react'
import {
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
} from '@chakra-ui/react'
import { CopyIcon,  DownloadIcon, DeleteIcon} from '@chakra-ui/icons'
import { useState } from 'react';
import { CSVLink } from "react-csv";
import { DarkModeSwitch } from '../components/DarkModeSwitch'
import { Formik, Form, Field } from 'formik';
//import { providerOptions } from './constants.js';
import { getAccount, getSignature } from '../lib/signature';

//const baseUrl = 'https://coolist.xyz'
const baseUrl = 'localhost:3000';

const Index = () => {
  const [account, setAccount] = useState();
  const [showForm, setShowForm] = useState(false);
  const [coolistId, setCoolistId] = useState(null);
  const [manage, setManage] = useState(null);
  const [provider, setProvider] = useState();

  async function getCoolists(account) {
    const sig = await getSignature(account);
    const response = await fetch('/api/manageCoolist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({account:account, signature:sig})
    });
    const data = await response.json();
    setManage(data.data);
  }

  async function deleteCoolist(account, sid) {
    const sig = await getSignature(account, "delete");
    const response = await fetch('/api/deleteCoolist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({account:account, signature:sig, sid:sid})
    });
    const data = await response.json();
    setManage(data.data);
  }

  async function copyText(t) {
    await navigator.clipboard.writeText(t)
  }

  return (
    <Center mt={50}>
      <DarkModeSwitch />
      <VStack spacing={8}>
        <Heading>coolist</Heading>
        <Text>a simple way to collect Ethereum wallet addresses</Text>
        {!account ? (
        <Button onClick={async () => setAccount(await getAccount())}>connect wallet</Button>
        ):(
        <VStack spacing={8}>
          <Text>{`you: ${account.substring(0,6)}...${account.substring(38)}`}</Text>
          <Button onClick={() => { setShowForm(true); setCoolistId(null) }}>create a coolist</Button>
          {!manage ? (<Button onClick={async () => { await getCoolists(account) }}>manage my coolists</Button>):null}
          {showForm ? (
            <VStack>
              <Formik initialValues = {{ name:'' }}
                onSubmit={async (values) => {
                  const response = await fetch('/api/createCoolist', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({name:values.name, owner:account})
                  });
                  const data = await response.json();
                  setShowForm(false);
                  setCoolistId(data.sid);
                }}>
                {({ isSubmitting }) => (
                    <Form>
                      <VStack spacing={8}>
                      <Field name='name'>
                      {({ field, form }) => (  
                        <Input {...field} id='name' variant='flushed' textAlign='center' placeholder='My super cool project' />
                      )}
                      </Field>
                      <Button type='submit' isLoading={isSubmitting}>submit</Button>
                      </VStack>
                    </Form>
                )}
              </Formik>
            </VStack>
          ):null}
          {coolistId ? (
            <VStack>
              <Text>Done! Share this link for others to join:</Text>
              <HStack>
                <Code id="shareUrl">{baseUrl}/join/{coolistId}</Code>
                <IconButton onClick={() => copyText(`${baseUrl}/join/${coolistId}`)} icon={<CopyIcon />}/>
              </HStack>
            </VStack>
          ):null }
          {manage ? (
            <VStack>
            <Table size='sm'>
              <Thead>
              <Tr>
                <Th>coolist name</Th>
                <Th>coolies count</Th>
                <Th>join link</Th>
                <Th>export</Th>
                <Th>delete</Th>
              </Tr>
              </Thead>
              <Tbody>
                { manage.map((coolist) => (
                  <Tr key={coolist.name}>
                    <Td sx={{'textAlign':'center'}}>{ coolist.name }</Td>
                    <Td sx={{'textAlign':'center'}}>{ coolist.coolies.length }</Td>
                    <Td sx={{'textAlign':'center'}}><IconButton icon={<CopyIcon/>} onClick={() => copyText(`${baseUrl}/join/${coolist.sid}`)}/></Td>
                    <Td sx={{'textAlign':'center'}}>
                      <CSVLink filename={`${coolist.name.split(' ').join('_')}.csv`} data={coolist.coolies}>
                        <IconButton icon={<DownloadIcon/>}/>
                      </CSVLink>
                    </Td>
                    <Td sx={{'textAlign':'center'}}>
                      <IconButton icon={<DeleteIcon/>} 
                        onClick={(async () => deleteCoolist(account, coolist.sid))}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </VStack>
          ):null}
        </VStack>
        )}
      </VStack>
    </Center>
  )
}

export default Index
