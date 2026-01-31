const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

// ===== ดึง Market Cap จาก Yahoo Finance =====
async function getMarketCap(symbol) {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;
    const res = await axios.get(url);

    const result = res.data.quoteResponse.result[0];

    if (!result || !result.marketCap) {
        throw new Error(`No market cap for ${symbol}`);
    }

    return result.marketCap;
}

// ===== Route หลัก =====
app.get('/check', async (req, res) => {
    try {
        const symbols = ["NVDA","AAPL","MSFT","GOOGL","AMZN"];
        const caps = {};

        for (let s of symbols) {
            caps[s] = await getMarketCap(s);
        }

        // เรียงลำดับตาม market cap
        const sorted = Object.entries(caps).sort((a,b)=>b[1]-a[1]);
        const leader = sorted[0];
        const second = sorted[1];

        const gapPercent = ((leader[1] - second[1]) / second[1]) * 100;

        const locked = gapPercent > 8;

        res.json({
            leader: leader[0],
            leaderCap: leader[1],
            second: second[0],
            secondCap: second[1],
            gapPercent: gapPercent.toFixed(2),
            reality: locked ? "LOCKED IN REALITY" : "NOT LOCKED",
            action: locked
                ? "Go check Polymarket odds (should be 92–96%)"
                : "Wait — too early"
        });

    } catch (e) {
        res.json({ error: e.message });
    }
});

app.listen(3000, () => console.log("Server running"));
