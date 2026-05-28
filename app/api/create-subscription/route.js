import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// ✅ Your Razorpay Plan IDs — fill these in after creating plans
const PLAN_IDS = {
  basic_monthly: 'plan_SuOttNEDWNiZyB',
  basic_annual:  'plan_SuOteLMEJb05ah',
  pro_monthly:   'plan_SuOtLow5GwmIpl',
  pro_annual:    'plan_SuOqw9NBLWCr6s',
}

export async function POST(req) {
  try {
    const { plan, period } = await req.json()

    const planKey = `${plan}_${period}`
    const planId  = PLAN_IDS[planKey]

    if (!planId || planId === 'plan_xxxxxxxxxxxx') {
      return Response.json({
        error: 'Plan not configured yet. Please create plans in Razorpay dashboard first.'
      }, { status: 400 })
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id:         planId,
      total_count:     period === 'annual' ? 1 : 12,
      quantity:        1,
    })

    return Response.json({ subscriptionId: subscription.id })

  } catch (e) {
    console.error('Create subscription error:', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
