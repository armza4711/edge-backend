const express = require('express');
const axios = require('axios');
const app = express();

const STOCKS = ["NVDA", "AAPL", "MSFT", "GOOGL", "AMZN"];
const FMP_KEY = process.env.FMP_KEY;

async function getMarketCaps() {
    const caps = {};
    for (let s of STOCKS) {
        const res = await axios.get(
          `https://financialmodelingprep.com/api/v3/quote/${s}?apikey=${FMP_KEY}`
        );
        caps[s] = res.data[0].marketCap;
    }
    return caps;
}

async function getPolymarketOdds() {
    const res = await axios.get("https://gamma-api.polymarket.com/markets");
    const market = res.data.find(m =>
        m.question.includes("Largest company end of")
    );

    const odds = {};
    market.outcomes.forEach(o => {
        odds[o.name] = o.price * 100;
    });

    return odds;
}

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
            polymarketOdds: odds[leader[0]].toFixed(2),
            decision
        });
    } catch (e) {
        res.json({ error: e.message });
    }
});

app.listen(3000);
