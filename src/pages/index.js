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
import { CopyIcon,  DownloadIcon, DeleteIcon, CloseIcon } from '@chakra-ui/icons'
import { useEffect, useState, useReducer, useCallback } from 'react';
import { CSVLink } from "react-csv";
import { DarkModeSwitch } from '../components/DarkModeSwitch'
import { Formik, Form, Field } from 'formik';
//import { providerOptions } from './constants.js';
import { providers } from 'ethers'
import { getAccount, getSignature } from '../lib/signature';

import WalletLink from 'walletlink'
import Web3Modal from 'web3modal'
import WalletConnectProvider from '@walletconnect/web3-provider'

const baseUrl = 'https://coolist-xyz.vercel.app'
//const baseUrl = 'localhost:3000';

const INFURA_ID = '460f40a260564ac4a4f4b3fffb032dad'

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider, // required
    options: {
      infuraId: INFURA_ID, // required
    },
  },
  'custom-walletlink': {
    display: {
      logo: 'https://play-lh.googleusercontent.com/PjoJoG27miSglVBXoXrxBSLveV6e3EeBPpNY55aiUUBM9Q1RCETKCOqdOkX2ZydqVf0',
      name: 'Coinbase',
      description: 'Connect to Coinbase Wallet (not Coinbase App)',
    },
    options: {
      appName: 'Coinbase', // Your app name
      networkUrl: `https://mainnet.infura.io/v3/${INFURA_ID}`,
      chainId: 1,
    },
    package: WalletLink,
    connector: async (_, options) => {
      const { appName, networkUrl, chainId } = options
      const walletLink = new WalletLink({
        appName,
      })
      const provider = walletLink.makeWeb3Provider(networkUrl, chainId)
      await provider.enable()
      return provider
    },
  },
}

let web3Modal
if (typeof window !== 'undefined') {
  web3Modal = new Web3Modal({
    network: 'mainnet', // optional
    providerOptions, // required
  })
}

const initialState = {
  provider: null,
  web3Provider: null,
  address: null,
  chainId: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_WEB3_PROVIDER':
      return {
        ...state,
        provider: action.provider,
        web3Provider: action.web3Provider,
        address: action.address,
        chainId: action.chainId,
      }
    case 'SET_ADDRESS':
      return {
        ...state,
        address: action.address,
      }
    case 'SET_CHAIN_ID':
      return {
        ...state,
        chainId: action.chainId,
      }
    case 'RESET_WEB3_PROVIDER':
      return initialState
    default:
      throw new Error()
  }
}

const Index = () => {
  const [account, setAccount] = useState();
  const [showForm, setShowForm] = useState(false);
  const [coolistId, setCoolistId] = useState(null);
  const [manage, setManage] = useState(null);

  const [state, dispatch] = useReducer(reducer, initialState)
  const { provider, web3Provider, address, chainId } = state

  const connect = useCallback(async function () {
    // This is the initial `provider` that is returned when
    // using web3Modal to connect. Can be MetaMask or WalletConnect.
    const provider = await web3Modal.connect()

    // We plug the initial `provider` into ethers.js and get back
    // a Web3Provider. This will add on methods from ethers.js and
    // event listeners such as `.on()` will be different.
    const web3Provider = new providers.Web3Provider(provider)

    const signer = web3Provider.getSigner()
    const address = await signer.getAddress()

    const network = await web3Provider.getNetwork()

    dispatch({
      type: 'SET_WEB3_PROVIDER',
      provider,
      web3Provider,
      address,
      chainId: network.chainId,
    })
  }, [])


  const disconnect = useCallback(
    async function () {
      await web3Modal.clearCachedProvider()
      if (provider?.disconnect && typeof provider.disconnect === 'function') {
        await provider.disconnect()
      }
      dispatch({
        type: 'RESET_WEB3_PROVIDER',
      })
    },
    [provider]
  )

  // A `provider` should come with EIP-1193 events. We'll listen for those events
  // here so that when a user switches accounts or networks, we can update the
  // local React state with that new information.
  useEffect(() => {
    if (provider?.on) {
      const handleAccountsChanged = (accounts) => {
        // eslint-disable-next-line no-console
        console.log('accountsChanged', accounts)
        setAccount(accounts[0])
        dispatch({
          type: 'SET_ADDRESS',
          address: accounts[0],
        })
      }

      // https://docs.ethers.io/v5/concepts/best-practices/#best-practices--network-changes
      const handleChainChanged = () => {
        window.location.reload()
      }

      const handleDisconnect = () => {
        // eslint-disable-next-line no-console
        console.log('disconnect', error)
        disconnect()
      }

      provider.on('accountsChanged', handleAccountsChanged)
      provider.on('chainChanged', handleChainChanged)
      provider.on('disconnect', handleDisconnect)

      // Subscription Cleanup
      return () => {
        if (provider.removeListener) {
          provider.removeListener('accountsChanged', handleAccountsChanged)
          provider.removeListener('chainChanged', handleChainChanged)
          provider.removeListener('disconnect', handleDisconnect)
        }
      }
    }
  }, [provider, disconnect])

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
    <Center mt={50} pr={5} pl={5} sx={{textAlign:"center"}}>
      <DarkModeSwitch />
      <VStack spacing={8}>
        <Heading>coolist</Heading>
        <Text>a simple way to collect Ethereum wallet addresses</Text>
        {!address ? (
        <Button onClick={connect}>connect wallet</Button>
        ):(
        <VStack spacing={8}>
          <HStack>
            <Text>{`${address.substring(0,6)}...${address.substring(38)}`}</Text>
            <IconButton icon={<CloseIcon/>} onClick={disconnect} />
          </HStack>
          <Button onClick={() => { setShowForm(true); setCoolistId(null) }}>create a coolist</Button>
          {!manage ? (<Button onClick={async () => { await getCoolists(address) }}>manage my coolists</Button>):null}
          {showForm ? (
            <VStack>
              <Formik initialValues = {{ name:'' }}
                onSubmit={async (values) => {
                  const response = await fetch('/api/createCoolist', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({name:values.name, owner:address})
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
                        onClick={(async () => deleteCoolist(address, coolist.sid))}
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
