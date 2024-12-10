const express = require('express');         // using express.js
const fetch = require('node-fetch');
const { runSlitherAnalysis } = require('../utils/slitherUtils'); // Slither integration

const router = express.Router();

router.get('/contract/:address', async (req, res) => {
    const { address } = req.params;
    try {
        // Fetch ownership and standards
        const url = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=YourAPIKey`;
        const response = await fetch(url);
        const data = await response.json();

        const ownershipRenounced = !data.result[0].ABI.includes('Ownable');
        const standardsVerified = data.result[0].SourceCode.includes('IERC20');

        // Run Slither analysis (optional step)
        const vulnerabilities = await runSlitherAnalysis(address);

        res.json({
            ownershipRenounced,
            standardsVerified,
            vulnerabilities,
        });
    } catch (error) {
        console.error('Error in contract analysis:', error);
        res.status(500).json({ error: 'Failed to analyze contract' });
    }
});

module.exports = router;