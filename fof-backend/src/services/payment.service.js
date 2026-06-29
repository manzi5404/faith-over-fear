const { supabaseAdmin } = require('../config/supabaseAdmin');
const orderRepo = require('../repositories/order.repository');
const notificationRepo = require('../repositories/notification.repository');
const { events } = require('../events');
const { NotFoundError, ValidationError } = require('../utils/errors');

async function verifyPayment(orderId, paymentReference, paymentMethod) {
  if (!paymentReference) {
    throw new ValidationError('Payment reference is required');
  }

  const { data, error } = await supabaseAdmin.rpc('verify_payment', {
    p_order_id: orderId,
    p_payment_reference: paymentReference,
    p_payment_method: paymentMethod || 'manual',
  });

  if (error) {
    if (error.message.includes('VERIFICATION_FAILED')) {
      throw new ValidationError('Payment verification failed: order is not in pending_payment status');
    }
    throw error;
  }

  if (data.status !== 'paid') {
    throw new ValidationError('Payment verification did not succeed');
  }

  events.emit(events.PAYMENT_VERIFIED, { order: data });

  return data;
}

async function isPaymentVerified(orderId) {
  const order = await orderRepo.findById(orderId);
  if (!order) {
    throw new NotFoundError('Order not found');
  }
  return order.status === 'paid';
}

module.exports = {
  verifyPayment,
  isPaymentVerified,
};
