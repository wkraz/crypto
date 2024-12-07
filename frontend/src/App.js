import React from 'react';
import PredictionForm from './components/PredictionForm';
import BlockchainInteraction from './components/BlockchainInteraction';
import './App.css';

const App = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto py-10">
        <PredictionForm />
        <BlockchainInteraction />
      </div>
    </div>
  );
};

export default App;