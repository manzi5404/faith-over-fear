const { supabaseAdmin } = require('../config/supabaseAdmin');
const orderRepo = require('../repositories/order.repository');
const paymentVerificationRepo = require('../repositories/payment-verification.repository');
const notificationRepo = require('../repositories/notification.repository');
const { events } = require('../events');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/errors');

async function verifyPayment(orderId, paymentReference, paymentMethod, verifiedBy, proofUrl = null, notes = null) {
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

  const { exists, data: verification } = await paymentVerificationRepo.create({
    orderId,
    verifiedBy: verifiedBy || data.user_id,
    proofUrl,
    notes,
    status: 'verified',
    verifiedAt: new Date().toISOString(),
  });

  if (exists && !verification) {
    throw new ConflictError('Payment has already been verified for this order');
  }

  events.emit(events.PAYMENT_VERIFIED, { order: data, verification });

  return { order: data, verification };
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
