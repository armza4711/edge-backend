const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const ALPHA_KEY = process.env.ALPHA_KEY;

// ====== ดึง Market Cap จาก Alpha Vantage ======
async function getMarketCap(symbol) {
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_KEY}`;
    const res = await axios.get(url);
    return parseInt(res.data.MarketCapitalization);
}

async function getMarketCaps() {
    const symbols = ["NVDA","AAPL","MSFT","GOOGL","AMZN"];
    const caps = {};

    for (let s of symbols) {
        caps[s] = await getMarketCap(s);
    }

    return caps;
}

// ====== ดึง Odds จาก Polymarket ======
async function getPolymarketOdds() {
    const MARKET_ID = "34859576";

    const res = await axios.get(`https://clob.polymarket.com/markets/${MARKET_ID}`);

    const odds = {};
    res.data.outcomes.forEach(o => {
        odds[o.name] = parseFloat(o.price) * 100;
    });

    return odds;
}

// ====== Route หลัก ======
app.get('/check', async (req, res) => {
    try {
        const caps = await getMarketCaps();
        const odds = await getPolymarketOdds();

        const sorted = Object.entries(caps).sort((a,b)=>b[1]-a[1]);
        const leader = sorted[0];
        const second = sorted[1];

        const gapPercent = ((leader[1] - second[1]) / second[1]) * 100;

        const decision = (gapPercent > 8 && odds[leader[0]] < 96)
            ? "ENTER TRADE"
            : "WAIT";

        res.json({
            leader: leader[0],
            gapPercent: gapPercent.toFixed(2),
            polymarketOdds: odds[leader[0]] ? odds[leader[0]].toFixed(2) : "N/A",
            decision
        });
    } catch (e) {
        res.json({ error: e.message });
    }
});

app.listen(3000, () => console.log("Server running"));
