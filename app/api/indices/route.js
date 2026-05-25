export async function GET() {
  try {
    const [s, n] = await Promise.all([
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EBSESN?interval=1d&range=2d'),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?interval=1d&range=2d'),
    ])
    const [sd, nd] = await Promise.all([s.json(), n.json()])

    const parse = (d) => {
      const closes = d?.chart?.result?.[0]?.indicators?.quote?.[0]?.close
      if (!closes || closes.length < 2) return { price: null, change: null, pct: null }
      const prev = closes[closes.length - 2]
      const curr = closes[closes.length - 1]
      return {
        price: curr.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
        change: (curr - prev).toFixed(2),
        pct: (((curr - prev) / prev) * 100).toFixed(2),
      }
    }

    return Response.json({ sensex: parse(sd), nifty: parse(nd) })
  } catch (e) {
    return Response.json({ sensex: {}, nifty: {} }, { status: 500 })
  }
}