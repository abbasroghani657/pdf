const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const { protect } = require('../middleware/auth');
const supabase = require('../config/supabase');

const LS_API_KEY    = process.env.LEMONSQUEEZY_API_KEY;
const LS_STORE_ID   = process.env.LEMONSQUEEZY_STORE_ID;
const LS_SECRET     = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
const FRONTEND_URL  = process.env.FRONTEND_URL || 'http://localhost:3000';

const VARIANTS = {
  monthly: process.env.LEMONSQUEEZY_VARIANT_MONTHLY,
  annual:  process.env.LEMONSQUEEZY_VARIANT_ANNUAL,
};

// LemonSqueezy API helper
const lsApi = axios.create({
  baseURL: 'https://api.lemonsqueezy.com/v1',
  headers: {
    'Authorization': `Bearer ${LS_API_KEY}`,
    'Accept': 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
  },
});

// ─── Helper: Upgrade user in DB ──────────────────────────────────────────────
const upgradeUser = async ({ userId, userEmail, plan, lsCustomerId, lsSubscriptionId, expiresAt }) => {
  const planName = plan === 'annual' ? 'Pro Annual' : 'Pro Monthly';
  const amount   = plan === 'annual' ? 47.88 : 4.99;

  const { error: updateErr } = await supabase
    .from('users')
    .update({
      is_pro:                  true,
      plan:                    planName,
      pro_started_at:          new Date().toISOString(),
      pro_expires_at:          expiresAt || null,
      stripe_customer_id:      lsCustomerId   || null,
      stripe_subscription_id:  lsSubscriptionId || null,
    })
    .eq('id', userId);

  if (updateErr) {
    console.error('[DB Update Error]:', updateErr);
    return false;
  }

  // Insert payment record for Revenue Dashboard
  const { error: insertErr } = await supabase.from('payments').insert({
    user_id:           userId,
    user_email:        userEmail,
    plan:              planName,
    amount,
    status:            'completed',
    stripe_session_id: lsSubscriptionId || null,
  });
  
  if (insertErr) {
    console.warn('[Payment Record Warning]:', insertErr.message);
  }

  console.log(`[LemonSqueezy] User ${userId} upgraded to ${planName}`);
  return true;
};

// ─── Helper: Downgrade user in DB ────────────────────────────────────────────
const downgradeUser = async (userId) => {
  const { error } = await supabase
    .from('users')
    .update({ is_pro: false, plan: 'Free', pro_expires_at: null })
    .eq('id', userId);

  if (error) console.error('[DB Downgrade Error]:', error);
  else console.log(`[LemonSqueezy] User ${userId} downgraded to Free`);
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/payments/create-checkout-session
// @desc    Create LemonSqueezy Checkout URL
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.post('/create-checkout-session', protect, async (req, res) => {
  try {
    const plan = req.body.plan === 'annual' ? 'annual' : 'monthly';
    const variantId = VARIANTS[plan];

    if (!LS_API_KEY || !LS_STORE_ID || !variantId) {
      return res.status(500).json({ error: 'Payment system not configured. Please contact support.' });
    }

    const response = await lsApi.post('/checkouts', {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: req.user.email,
            custom: {
              user_id:    req.user.id,
              user_email: req.user.email,
              plan,
            },
          },
          product_options: {
            redirect_url:    `${FRONTEND_URL}/payment-success`,
            receipt_link_url: `${FRONTEND_URL}/dashboard`,
          },
          checkout_options: {
            dark: false,
          },
          expires_at: null,
        },
        relationships: {
          store: {
            data: { type: 'stores', id: String(LS_STORE_ID) },
          },
          variant: {
            data: { type: 'variants', id: String(variantId) },
          },
        },
      },
    });

    const checkoutUrl = response.data?.data?.attributes?.url;
    if (!checkoutUrl) throw new Error('No checkout URL returned from LemonSqueezy');

    res.json({ id: response.data?.data?.id, url: checkoutUrl });
  } catch (error) {
    console.error('[LemonSqueezy Checkout Error]:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.errors?.[0]?.detail || error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/payments/webhook
// @desc    LemonSqueezy Webhook Handler
// @access  Public (signature verified)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/webhook', express.raw({ type: '*/*' }), async (req, res) => {
  // 1. Verify signature
  const signature = req.headers['x-signature'];
  if (!signature || !LS_SECRET) {
    return res.status(400).json({ error: 'Missing signature or webhook secret' });
  }

  const hmac   = crypto.createHmac('sha256', LS_SECRET);
  const digest = Buffer.from(hmac.update(req.body).digest('hex'), 'utf8');
  const sig    = Buffer.from(signature, 'utf8');

  try {
    if (!crypto.timingSafeEqual(digest, sig)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
  } catch {
    return res.status(401).json({ error: 'Signature verification failed' });
  }

  // 2. Parse body
  let payload;
  try {
    payload = JSON.parse(req.body.toString());
  } catch {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  const eventName = payload?.meta?.event_name;
  const data      = payload?.data;
  const custom    = payload?.meta?.custom_data || {};

  console.log(`[LemonSqueezy Webhook] Event: ${eventName}`);

  try {
    switch (eventName) {

      // ── First-time subscription created ──────────────────────────────────
      case 'subscription_created': {
        const userId    = custom?.user_id;
        const userEmail = custom?.user_email || data?.attributes?.user_email;
        const plan      = custom?.plan || 'monthly';
        const endsAt    = data?.attributes?.ends_at || data?.attributes?.renews_at;
        const expiresAt = endsAt ? new Date(endsAt).toISOString() : null;
        const lsCustomerId      = String(data?.attributes?.customer_id || '');
        const lsSubscriptionId  = String(data?.id || '');

        if (userId) {
          await upgradeUser({ userId, userEmail, plan, lsCustomerId, lsSubscriptionId, expiresAt });
        } else {
          console.warn('[Webhook] No user_id in custom_data');
        }
        break;
      }

      // ── Subscription renewed ──────────────────────────────────────────────
      case 'subscription_updated': {
        const status = data?.attributes?.status;
        const userId = custom?.user_id;
        if (!userId) break;

        if (status === 'active') {
          // Renewal — update expiry date
          const endsAt    = data?.attributes?.ends_at || data?.attributes?.renews_at;
          const expiresAt = endsAt ? new Date(endsAt).toISOString() : null;
          await supabase.from('users').update({ pro_expires_at: expiresAt }).eq('id', userId);
          console.log(`[LemonSqueezy] Subscription renewed for user ${userId}`);
        } else if (['cancelled', 'expired', 'paused'].includes(status)) {
          await downgradeUser(userId);
        }
        break;
      }

      // ── Subscription cancelled ────────────────────────────────────────────
      case 'subscription_cancelled':
      case 'subscription_expired': {
        const userId = custom?.user_id;
        if (userId) await downgradeUser(userId);
        break;
      }

      default:
        // Unhandled events — ignore silently
        break;
    }
  } catch (handlerError) {
    console.error('[Webhook Handler Error]:', handlerError.message);
  }

  res.json({ received: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/payments/create-portal-session
// @desc    Get LemonSqueezy Customer Portal URL
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.post('/create-portal-session', protect, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('users')
      .select('stripe_subscription_id')
      .eq('id', req.user.id)
      .single();

    const subscriptionId = profile?.stripe_subscription_id;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'No active subscription found.' });
    }

    // Get subscription URLs from LemonSqueezy
    const response = await lsApi.get(`/subscriptions/${subscriptionId}`);
    const urls = response.data?.data?.attributes?.urls;

    const portalUrl = urls?.customer_portal || urls?.update_payment_method;

    if (!portalUrl) {
      return res.status(400).json({ error: 'Could not generate portal URL.' });
    }

    res.json({ url: portalUrl });
  } catch (error) {
    console.error('[Portal Error]:', error.response?.data || error.message);
    res.status(500).json({ error: 'Could not open subscription portal.' });
  }
});

module.exports = router;
