const cron = require('node-cron');
const supabase = require('../config/supabase');
const { Resend } = require('resend');
require('dotenv').config();

if (!process.env.RESEND_API_KEY) {
  throw new Error('CRON ERROR: RESEND_API_KEY must be configured.');
}

const resend = new Resend(process.env.RESEND_API_KEY);

const SITE_NAME = process.env.SITE_NAME || 'TheyLovePDF';
const SENDER_EMAIL = process.env.SMTP_USER || 'no-reply@theylovepdf.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

async function checkSubscriptions() {
  console.log('[CRON] Starting daily subscription check...');
  
  try {
    const now = new Date();
    
    // 1. Find users whose subscription expired in the past 24 hours
    const { data: expiredUsers, error: expiredError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('is_pro', true)
      .lte('pro_expires_at', now.toISOString());

    if (expiredError) throw expiredError;

    if (expiredUsers && expiredUsers.length > 0) {
      console.log(`[CRON] Found ${expiredUsers.length} expired subscriptions. Downgrading and sending emails...`);
      
      for (const user of expiredUsers) {
        // Downgrade user
        await supabase
          .from('users')
          .update({ 
            is_pro: false, 
            plan: 'Free', 
            pro_started_at: null, 
            pro_expires_at: null 
          })
          .eq('id', user.id);

        // Send Expiration Email
        try {
          await resend.emails.send({
            from: `"${SITE_NAME} Billing" <noreply@theylovepdf.com>`,
            to: [user.email],
            subject: `Action Required: Your ${SITE_NAME} Pro Plan Has Expired`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                <div style="background-color: #f87171; color: white; padding: 20px; text-align: center;">
                  <h2>Subscription Expired</h2>
                </div>
                <div style="padding: 30px; color: #333; line-height: 1.6;">
                  <p>Hi ${user.name || 'User'},</p>
                  <p>Your <strong>Pro subscription</strong> for ${SITE_NAME} has officially expired today.</p>
                  <p>Your account has been transitioned to our Free tier, which means you no longer have access to premium features, increased file limits, and prioritized processing.</p>
                  <p>To continue enjoying uninterrupted Pro benefits, please update your billing details and renew your subscription.</p>
                  <div style="text-align: center; margin-top: 30px;">
                    <a href="${FRONTEND_URL}/pricing" style="background-color: #378ADD; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Renew Pro Subscription</a>
                  </div>
                </div>
                <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
                  &copy; ${new Date().getFullYear()} ${SITE_NAME}. All rights reserved.
                </div>
              </div>
            `
          });
        } catch (mailErr) {
          console.error(`[CRON] Failed to send expiration email to ${user.email}:`, mailErr.message);
        }
      }
    } else {
      console.log('[CRON] No expired subscriptions found today.');
    }

    // 2. Find users whose subscription expires in exactly 3 days (Warning Email)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    // We want to find users expiring between 2 to 3 days from now to avoid spamming
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    const { data: expiringUsers, error: expiringError } = await supabase
      .from('users')
      .select('id, email, name, pro_expires_at')
      .eq('is_pro', true)
      .lte('pro_expires_at', threeDaysFromNow.toISOString())
      .gt('pro_expires_at', twoDaysFromNow.toISOString());

    if (expiringError) throw expiringError;

    if (expiringUsers && expiringUsers.length > 0) {
      console.log(`[CRON] Found ${expiringUsers.length} subscriptions expiring in 3 days. Sending warning emails...`);
      
      for (const user of expiringUsers) {
        // Send Warning Email
        try {
          await resend.emails.send({
            from: `"${SITE_NAME} Billing" <noreply@theylovepdf.com>`,
            to: [user.email],
            subject: `Reminder: Your ${SITE_NAME} Pro Plan Expires in 3 Days`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                <div style="background-color: #fbbf24; color: white; padding: 20px; text-align: center;">
                  <h2>Subscription Expiring Soon</h2>
                </div>
                <div style="padding: 30px; color: #333; line-height: 1.6;">
                  <p>Hi ${user.name || 'User'},</p>
                  <p>This is a friendly reminder that your <strong>Pro subscription</strong> for ${SITE_NAME} is scheduled to expire on <strong>${new Date(user.pro_expires_at).toLocaleDateString()}</strong>.</p>
                  <p>If you have auto-renew enabled, no action is needed. Otherwise, please renew your subscription to avoid losing access to premium features, increased file limits, and prioritized processing.</p>
                  <div style="text-align: center; margin-top: 30px;">
                    <a href="${FRONTEND_URL}/pricing" style="background-color: #378ADD; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Manage Subscription</a>
                  </div>
                </div>
                <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
                  &copy; ${new Date().getFullYear()} ${SITE_NAME}. All rights reserved.
                </div>
              </div>
            `
          });
        } catch (mailErr) {
          console.error(`[CRON] Failed to send warning email to ${user.email}:`, mailErr.message);
        }
      }
    } else {
      console.log('[CRON] No subscriptions expiring in 3 days found today.');
    }

    console.log('[CRON] Daily subscription check completed successfully.');

  } catch (error) {
    console.error('[CRON] Error during subscription check:', error);
  }
}

// Export a function that starts the cron schedule
function startSubscriptionCron() {
  // Run every day at midnight (00:00) server time
  // '0 0 * * *'
  cron.schedule('0 0 * * *', () => {
    checkSubscriptions();
  }, {
    scheduled: true,
    timezone: "UTC"
  });
  
  console.log('[CRON] Subscription monitoring scheduled (runs daily at 00:00 UTC).');
  
  // Optional: Run immediately on startup for testing if needed
  // checkSubscriptions();
}

module.exports = { startSubscriptionCron, checkSubscriptions };
