import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import CryptoGraph from './components/CryptoGraph.js';
import CoinDetails from './components/CoinDetails.js';
import 'bootstrap/dist/css/bootstrap.min.css'; // using bootstrap for css
import dotenv from 'dotenv';

dotenv.config();

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CryptoGraph />} />
        <Route path="/coin/:id" element={<CoinDetails />} />
      </Routes>
    </Router>
  );
};

export default App;