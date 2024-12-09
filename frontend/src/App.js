import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import CryptoGraph from './components/CryptoGraph';
import CoinDetails from './components/CoinDetails';
import 'bootstrap/dist/css/bootstrap.min.css';     // using bootstrap for css

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