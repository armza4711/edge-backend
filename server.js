const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const ALPHA_KEY = process.env.ALPHA_KEY;

async function getMarketCap(symbol) {
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_KEY}`;
    const res = await axios.get(url);

    const cap = res.data.MarketCapitalization;

    if (!cap || cap === "None") {
        throw new Error(`No market cap for ${symbol}`);
    }

    return Number(cap);
}

app.get('/check', async (req, res) => {
    try {
        const symbols = ["NVDA","AAPL","MSFT","GOOGL","AMZN"];
        const caps = {};

        for (let s of symbols) {
            caps[s] = await getMarketCap(s);
        }

        const sorted = Object.entries(caps).sort((a,b)=>b[1]-a[1]);
        const leader = sorted[0];
        const second = sorted[1];

        const gapPercent = ((leader[1] - second[1]) / second[1]) * 100;

        const locked = gapPercent > 8;

        res.json({
            leader: leader[0],
            gapPercent: gapPercent.toFixed(2),
            reality: locked ? "LOCKED IN REALITY" : "NOT LOCKED",
            action: locked ? "Go check Polymarket odds" : "Wait"
        });

    } catch (e) {
        res.json({ error: e.message });
    }
});

app.listen(3000);
