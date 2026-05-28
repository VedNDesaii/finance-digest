import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export async function POST(req) {
  try {
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      plan,
      period,
      userId,
    } = await req.json()

    // ✅ Verify signature
    const body      = razorpay_payment_id + '|' + razorpay_subscription_id
    const expected  = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    if (expected !== razorpay_signature) {
      return Response.json({ success: false, error: 'Invalid signature' }, { status: 400 })
    }

    // ✅ Update user plan in profiles table
    await supabase
      .from('profiles')
      .update({ plan, plan_period: period })
      .eq('id', userId)

    // ✅ Save subscription record
    await supabase
      .from('subscriptions')
      .insert({
        user_id:                  userId,
        razorpay_subscription_id: razorpay_subscription_id,
        plan,
        period,
        status: 'active',
      })

    return Response.json({ success: true })

  } catch (e) {
    console.error('Verify payment error:', e)
    return Response.json({ success: false, error: e.message }, { status: 500 })
  }
}