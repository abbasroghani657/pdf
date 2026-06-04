const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const supabase = require('../config/supabase');

const YOUR_DOMAIN = process.env.FRONTEND_URL || 'http://localhost:3000';

// @desc    Create Mock Checkout Session
// @route   POST /api/payments/create-checkout-session
// @access  Private
router.post('/create-checkout-session', protect, async (req, res) => {
  try {
    // Generate a fake session ID for testing
    const fakeSessionId = 'mock_sess_' + Math.random().toString(36).substr(2, 9);
    
    // Instead of Stripe URL, return our internal mock checkout page URL
    const checkoutUrl = `${YOUR_DOMAIN}/mock-checkout?session_id=${fakeSessionId}`;
    
    res.json({ id: fakeSessionId, url: checkoutUrl });
  } catch (error) {
    console.error('Mock session error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @desc    Mock Webhook (Called by Mock Checkout Page)
// @route   POST /api/payments/mock-webhook
// @access  Private
router.post('/mock-webhook', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    
    console.log(`[MOCK PAYMENT] Payment successful for user ${userId}. Updating to Pro plan.`);
    
    // Calculate 30 days from now for expiration
    const startedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Update user to Pro in Supabase
    const { error } = await supabase
      .from('users')
      .update({ 
        is_pro: true, 
        plan: 'Pro',
        pro_started_at: startedAt.toISOString(),
        pro_expires_at: expiresAt.toISOString()
      })
      .eq('id', userId);
      
    if (error) {
      console.error('Failed to update user to Pro in Supabase:', error);
      return res.status(500).json({ success: false, message: 'Database update failed' });
    }

    // Insert payment record into payments table for Revenue Dashboard
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        user_email: userEmail,
        plan: 'Pro Monthly',
        amount: 4.99,
        status: 'completed',
        stripe_session_id: 'mock_' + Math.random().toString(36).substr(2, 9)
      });

    if (paymentError) {
      // Non-critical: log but don't fail the request
      console.warn('[PAYMENT RECORD] Could not insert payment record (payments table may not exist yet):', paymentError.message);
    }

    res.json({ success: true, message: 'User upgraded to Pro successfully' });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
