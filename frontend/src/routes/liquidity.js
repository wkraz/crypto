const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

router.get('/liquidity/:address', async (req, res) => {
    const { address } = req.params;
    try {
        const url = `https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=${address}&apikey=YourAPIKey`;
        const response = await fetch(url);
        const data = await response.json();

        // Extract liquidity lock data
        const liquidityLocked = data.result.some((tx) => tx.to === 'LOCKED_ADDRESS');
        res.json({ liquidityLocked });
    } catch (error) {
        console.error('Error fetching liquidity:', error);
        res.status(500).json({ error: 'Failed to fetch liquidity data' });
    }
});

module.exports = router;