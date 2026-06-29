require('dotenv').config();

const { app } = require('./app');
const { on, ORDER_CREATED, PAYMENT_VERIFIED, DROP_ACTIVATED } = require('./events');
const notificationService = require('./services/notification.service');
const waitlistService = require('./services/waitlist.service');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Event listeners for side effects
on(ORDER_CREATED, async ({ order }) => {
  try {
    await notificationService.createForAdmins('order', `New order #${order.id} — ${order.total_amount}`);
  } catch (err) {
    console.error('Failed to create order notification:', err);
  }
});

on(PAYMENT_VERIFIED, async ({ order }) => {
  try {
    await notificationService.createForUser(order.user_id, 'payment', `Payment confirmed for order #${order.id}`);
  } catch (err) {
    console.error('Failed to create payment notification:', err);
  }
});

on(DROP_ACTIVATED, async ({ drop }) => {
  try {
    await waitlistService.notifyForDrop(drop.id, drop.title);
  } catch (err) {
    console.error('Failed to notify waitlist:', err);
  }
});

module.exports = { server };
