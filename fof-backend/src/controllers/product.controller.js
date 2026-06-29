const productService = require('../services/product.service');

function handleServiceError(res, err) {
  const statusCode = err.statusCode || 500;
  if (statusCode === 404) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  if (statusCode === 400 || statusCode === 409) {
    return res.status(statusCode).json({ success: false, error: err.message });
  }
  return res.status(500).json({ success: false, error: 'Internal Server Error' });
}

async function getProducts(req, res) {
  try {
    const { dropId } = req.query;
    let products;
    if (dropId) {
      products = await productService.getProductsByDrop(Number(dropId));
    } else {
      const activeDrop = await require('../services/drop.service').getActiveDrop();
      if (activeDrop) {
        products = await productService.getProductsByDrop(activeDrop.id);
      } else {
        products = [];
      }
    }
    return res.status(200).json({ success: true, products });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function getProductBySlug(req, res) {
  try {
    const product = await productService.getProductBySlug(req.params.slug);
    return res.status(200).json({ success: true, product });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function createProduct(req, res) {
  try {
    const product = await productService.createProduct(req.body);
    return res.status(201).json({ success: true, product });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function updateProduct(req, res) {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    return res.status(200).json({ success: true, product });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function deleteProduct(req, res) {
  try {
    await productService.softDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
};
