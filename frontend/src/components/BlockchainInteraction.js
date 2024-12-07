import React, { useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';

const BlockchainInteraction = () => {
  const [account, setAccount] = useState('');
  const [contractResponse, setContractResponse] = useState('');

  const contractAddress = 'YOUR_CONTRACT_ADDRESS';
  const contractABI = [
    // Add your contract's ABI here
  ];

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('MetaMask is not installed!');
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      console.log('Connected Account:', address);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const interactWithContract = async () => {
    try {
      if (!account) {
        alert('Please connect your wallet first!');
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, contractABI, signer);

      const result = await contract.someFunction();
      setContractResponse(result.toString());
      console.log('Contract Response:', result);
    } catch (error) {
      console.error('Error interacting with contract:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-6">
      <h1 className="text-4xl font-bold mb-6 text-green-600">Blockchain Interaction</h1>
      {!account ? (
        <button
          onClick={connectWallet}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Connect Wallet
        </button>
      ) : (
        <p className="text-gray-700 font-bold mb-4">
          Connected Account: <span className="text-green-600">{account}</span>
        </p>
      )}
      <button
        onClick={interactWithContract}
        className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Interact with Contract
      </button>
      {contractResponse && (
        <p className="mt-4 bg-white shadow-lg rounded px-4 py-2 text-gray-700">
          Contract Response: <strong>{contractResponse}</strong>
        </p>
      )}
    </div>
  );
};

export default BlockchainInteraction;