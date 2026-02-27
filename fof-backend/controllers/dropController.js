const { addDrop, getDrops, editDrop, deleteDrop } = require('../models/drop');
const productService = require('../models/product');
const userModel = require('../models/user');
const emailUtils = require('../utils/email');



async function createDrop(req, res) {
  try {
    const { products, ...dropData } = req.body;
    const dropId = await addDrop(dropData);

    // Create products if any
    if (products && Array.isArray(products)) {
      for (const product of products) {
        await productService.createProduct({ ...product, drop_id: dropId });
      }
    }

    // Trigger notifications asynchronously
    userModel.getAllUserEmails().then(emails => {
      if (emails.length > 0) {
        emailUtils.notifyNewDrop(emails, dropData);
      }
    }).catch(err => console.error('Failed to fetch user emails for notification:', err));

    res.json({ success: true, dropId });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function listDrops(req, res) {
  try {
    const drops = await getDrops(req.query.active === 'true');
    const includeProducts = req.query.includeProducts === 'true';

    for (const drop of drops) {
      if (!drop.images || drop.images.length === 0) {
        drop.images = drop.image_url ? [drop.image_url] : [];
      }

      if (includeProducts) {
        drop.products = await productService.getProductsByDropId(drop.id);
      }
    }

    res.json({ success: true, drops });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function updateDrop(req, res) {
  try {
    const { products, ...dropData } = req.body;
    const dropId = req.params.id;
    const updated = await editDrop(dropId, dropData);

    if (products && Array.isArray(products)) {
      const currentProducts = await productService.getProductsByDropId(dropId);
      const incomingIds = products.filter(p => p.id).map(p => p.id);

      for (const p of currentProducts) {
        if (!incomingIds.includes(p.id)) {
          await productService.deleteProduct(p.id);
        }
      }

      for (const product of products) {
        if (product.id) {
          await productService.updateProduct(product.id, product);
        } else {
          await productService.createProduct({ ...product, drop_id: dropId });
        }
      }
    }

    res.json({ success: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function removeDrop(req, res) {
  try {
    const removed = await deleteDrop(req.params.id);
    res.json({ success: removed });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = { createDrop, listDrops, updateDrop, removeDrop };