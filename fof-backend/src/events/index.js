const { EventEmitter } = require('events');

const emitter = new EventEmitter();

const ORDER_CREATED = 'order.created';
const PAYMENT_VERIFIED = 'payment.verified';
const ORDER_CANCELLED = 'order.cancelled';
const DROP_ACTIVATED = 'drop.activated';
const DROP_CREATED = 'drop.created';

function on(event, listener) {
  emitter.on(event, listener);
}

function off(event, listener) {
  emitter.off(event, listener);
}

function emit(event, ...args) {
  emitter.emit(event, ...args);
}

module.exports = {
  emitter,
  on,
  off,
  emit,
  ORDER_CREATED,
  PAYMENT_VERIFIED,
  ORDER_CANCELLED,
  DROP_ACTIVATED,
  DROP_CREATED,
};
