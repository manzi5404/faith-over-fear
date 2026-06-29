const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const paymentService = require('../services/payment.service');

function handleServiceError(res, err) {
  const statusCode = err.statusCode || 500;
  if (statusCode === 404) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  if (statusCode === 400) {
    return res.status(400).json({ success: false, error: err.message });
  }
  return res.status(500).json({ success: false, error: 'Internal Server Error' });
}

async function verifyPayment(req, res) {
  try {
    const { orderId, paymentReference, paymentMethod, proofUrl, notes } = req.body;

    const result = await paymentService.verifyPayment(
      orderId,
      paymentReference,
      paymentMethod,
      req.user.id,
      proofUrl,
      notes
    );

    return res.status(200).json({
      success: true,
      order: {
        id: result.order.id,
        status: result.order.status,
        payment_reference: result.order.payment_reference,
        payment_method: result.order.payment_method,
        updated_at: result.order.updated_at,
      },
      verification: result.verification ? {
        id: result.verification.id,
        verified_at: result.verification.verified_at,
        status: result.verification.status,
      } : null,
    });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

module.exports = {
  verifyPayment,
};
