import { ethers } from 'ethers';

export async function getAccount() {
  if (typeof window.ethereum !== "undefined") {
    const account = await window.ethereum.request({ method: 'eth_requestAccounts' });
  return (account[0]);
  }
}

const defaultMsg = "I own dis"

export async function getSignature(account, msg=defaultMsg) {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const messageHash = ethers.utils.solidityKeccak256(
    ["address", "string"],
    [account, msg]
  );
  const messageHashBytes = ethers.utils.arrayify(messageHash);
  return await signer.signMessage(messageHashBytes)
}

export function checkSignature(account, sig, msg=defaultMsg) {
  let inHash = ethers.utils.solidityKeccak256(
    ["address", "string"],
    [account, msg]
  );
    let inHashBytes = ethers.utils.arrayify(inHash);
    const recoveredAddress = ethers.utils.verifyMessage(inHashBytes, sig).toLowerCase();
    return account === recoveredAddress;
}
