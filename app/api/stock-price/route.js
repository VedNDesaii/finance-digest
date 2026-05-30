export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const { ticker, exchange } = await req.json()
    const symbol = exchange === 'NSE' ? `${ticker}.NS` : ticker

    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' } }
    )

    const data = await res.json()
    const meta = data?.chart?.result?.[0]?.meta

    if (!meta) return Response.json({ error: 'Price not found' }, { status: 404 })

    const price    = meta.regularMarketPrice
    const prev     = meta.chartPreviousClose
    const change   = price - prev
    const changePct = ((change / prev) * 100)

    return Response.json({
      price,
      prevClose: prev,
      change: change.toFixed(2),
      changePct: changePct.toFixed(2),
      currency: meta.currency,
    })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}