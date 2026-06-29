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
    const { orderId, paymentReference, paymentMethod, proofUrl } = req.body;

    const order = await paymentService.verifyPayment(orderId, paymentReference, paymentMethod);

    return res.status(200).json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        payment_reference: order.payment_reference,
        payment_method: order.payment_method,
        updated_at: order.updated_at,
      },
    });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

module.exports = {
  verifyPayment,
};
