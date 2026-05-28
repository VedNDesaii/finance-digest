import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export async function POST(req) {
  try {
    const body      = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    // ✅ Verify webhook signature
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex')

    if (expected !== signature) {
      return Response.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    const sub   = event.payload?.subscription?.entity

    if (!sub) return Response.json({ received: true })

    // ✅ Handle subscription events
    if (event.event === 'subscription.activated') {
      await supabase
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('razorpay_subscription_id', sub.id)
    }

    if (event.event === 'subscription.cancelled' || event.event === 'subscription.expired') {
      // Find the subscription and downgrade user to free
      const { data } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('razorpay_subscription_id', sub.id)
        .single()

      if (data) {
        await supabase
          .from('profiles')
          .update({ plan: 'free', plan_period: null })
          .eq('id', data.user_id)

        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('razorpay_subscription_id', sub.id)
      }
    }

    if (event.event === 'subscription.charged') {
      await supabase
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('razorpay_subscription_id', sub.id)
    }

    return Response.json({ received: true })

  } catch (e) {
    console.error('Webhook error:', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}