const { addDrop, getDrops, editDrop, deleteDrop } = require('../models/drop');
const productService = require('../models/product');
const userModel = require('../models/user');
const emailUtils = require('../utils/email');
const announcementModel = require('../models/announcement');
const appEmitter = require('../utils/events');



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

    // Trigger notifications - using await but non-blocking (fire and forget with internal logging)
    (async () => {
      try {
        const emails = await userModel.getAllUserEmails();
        if (emails && emails.length > 0) {
          // Provide metadata for email template
          const dropMeta = {
             title: dropData.title,
             description: dropData.description,
             release_date: dropData.release_date,
             image_url: dropData.image_url || (products && products[0]?.image_urls?.[0])
          };
          console.log(`[DROP_NOTIFICATION] Notifying ${emails.length} users about new drop: ${dropData.title}`);
          await emailUtils.notifyNewDrop(emails, dropMeta);
        }
      } catch (notifyErr) {
        console.error('❌ [DROP_NOTIFICATION] Email worker failed:', notifyErr.message);
      }
    })();
    
    // UI BROADCAST: Automatically update the live announcement banner for this new drop
    try {
        const announcementData = {
          title: `NEW DROP: ${dropData.title}`,
          message: dropData.description || `The ${dropData.title} collection is now available.`,
          image_url: dropData.image_url || (products && products[0]?.image_urls[0]),
          status: 'live',
          is_enabled: 1
        };
        const updatedAnn = await announcementModel.updateAnnouncement(announcementData);
        appEmitter.emit('announcement_update', updatedAnn);
        console.log(`✅ [AUTO_ANNOUNCEMENT] Broadcasted new drop: ${dropData.title}`);
    } catch (annError) {
        console.warn('⚠️  [AUTO_ANNOUNCEMENT] Failed to auto-update banner:', annError.message);
    }

    res.json({ success: true, dropId });
  } catch (err) {
    console.error('❌ [CREATE_DROP] Controller failed:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
}

async function listDrops(req, res) {
  try {
    const statusFilter = req.query.status || req.query.active; // support old and new
    const drops = await getDrops(statusFilter);
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
    
    // Check old status to see if it just flipped to live
    const oldDrops = await getDrops(null);
    const oldDrop = oldDrops.find(d => d.id == dropId);
    const wasLive = oldDrop && oldDrop.status === 'live';
    const isNowLive = dropData.status === 'live' || (dropData.status === undefined && dropData.is_active);

    const updated = await editDrop(dropId, dropData);

    // If status changed to live, send notification
    if (!wasLive && isNowLive) {
      (async () => {
        try {
          const emails = await userModel.getAllUserEmails();
          if (emails && emails.length > 0) {
            const dropMeta = { ...oldDrop, ...dropData };
            // Ensure title is consistent
            dropMeta.title = dropMeta.title || dropMeta.name; 
            
            console.log(`[LIVE_NOTIFICATION] Notifying ${emails.length} users: ${dropMeta.title} IS LIVE!`);
            await emailUtils.notifyLiveDrop(emails, dropMeta);
          }
        } catch (notifyErr) {
          console.error('❌ [LIVE_NOTIFICATION] Email worker failed:', notifyErr.message);
        }
      })();
      
      // UI BROADCAST: Automatically update the live announcement banner if this drop went live
      try {
          const announcementData = {
            title: `LIVE NOW: ${dropData.title || oldDrop.title}`,
            message: dropData.description || oldDrop.description,
            image_url: dropData.image_url || oldDrop.image_url,
            status: 'live',
            is_enabled: 1
          };
          const updatedAnn = await announcementModel.updateAnnouncement(announcementData);
          appEmitter.emit('announcement_update', updatedAnn);
          console.log(`✅ [AUTO_ANNOUNCEMENT] Broadcasted live update: ${dropData.title || oldDrop.title}`);
      } catch (annError) {
          console.warn('⚠️  [AUTO_ANNOUNCEMENT] Failed to auto-update banner on live shift:', annError.message);
      }
    }

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
  console.error("CREATE DROP ERROR:", err); // 👈 THIS IS THE LINE YOU ADD
  res.status(400).json({ success: false, message: err.message });
}
}

module.exports = { createDrop, listDrops, updateDrop, removeDrop };
