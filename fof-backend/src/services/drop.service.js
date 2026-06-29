const dropRepo = require('../repositories/drop.repository');
const productRepo = require('../repositories/product.repository');
const variantRepo = require('../repositories/variant.repository');
const { supabaseAdmin } = require('../config/supabaseAdmin');
const { events } = require('../events');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/errors');

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function ensureUniqueSlug(baseSlug, excludeId = null) {
  let slug = baseSlug;
  let counter = 1;
  let isConflict = await dropRepo.findSlugConflict(slug, excludeId);

  while (isConflict) {
    slug = `${baseSlug}-${counter}`;
    counter++;
    isConflict = await dropRepo.findSlugConflict(slug, excludeId);
  }

  return slug;
}

async function getActiveDrop() {
  return dropRepo.findActive();
}

async function getAllDrops(includeAll = false) {
  return dropRepo.findAll(includeAll);
}

async function getDropBySlug(slug) {
  const drop = await dropRepo.findBySlug(slug);
  if (!drop) {
    throw new NotFoundError('Drop not found');
  }
  return drop;
}

async function createDrop(data) {
  if (!data.title || data.title.trim() === '') {
    throw new ValidationError('Title is required');
  }

  const slug = await ensureUniqueSlug(generateSlug(data.title));
  const payload = {
    title: data.title.trim(),
    slug,
    description: data.description || null,
    theme_scripture: data.theme_scripture || null,
    hero_video: data.hero_video || null,
    hero_image: data.hero_image || null,
    image_url: data.image_url || null,
    release_date: data.release_date || new Date().toISOString(),
    close_date: data.close_date || null,
    status: data.status || 'upcoming',
  };

  const drop = await dropRepo.create(payload);

  if (data.products && Array.isArray(data.products)) {
    for (const product of data.products) {
      await productRepo.create({
        ...product,
        drop_id: drop.id,
      });
    }
  }

  events.emit(events.DROP_CREATED, { drop });

  return drop;
}

async function updateDrop(id, data) {
  const existing = await dropRepo.findById(id);
  if (!existing) {
    throw new NotFoundError('Drop not found');
  }

  if (data.title && data.title.trim() !== '') {
    const newSlug = await ensureUniqueSlug(generateSlug(data.title), id);
    data.slug = newSlug;
  }

  if (data.slug && !data.title) {
    const isConflict = await dropRepo.findSlugConflict(data.slug, id);
    if (isConflict) {
      throw new ConflictError('Slug already in use');
    }
  }

  const allowedFields = [
    'title', 'slug', 'description', 'theme_scripture',
    'hero_video', 'hero_image', 'image_url',
    'release_date', 'close_date', 'status',
  ];

  const updateData = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return existing;
  }

  const wasLive = existing.status === 'live';
  const willBeLive = updateData.status === 'live';

  let updated;
  if (willBeLive && !wasLive) {
    updated = await dropRepo.activate(id);
    events.emit(events.DROP_ACTIVATED, { drop: updated });
  } else {
    updated = await dropRepo.update(id, updateData);
  }

  return updated;
}

async function activateDrop(id) {
  const existing = await dropRepo.findById(id);
  if (!existing) {
    throw new NotFoundError('Drop not found');
  }

  const activated = await dropRepo.activate(id);
  events.emit(events.DROP_ACTIVATED, { drop: activated });

  return activated;
}

async function validateDropWindow(dropId) {
  const drop = await dropRepo.findById(dropId);
  if (!drop) {
    return false;
  }

  if (drop.status !== 'live') {
    return false;
  }

  const now = new Date();
  const releaseDate = new Date(drop.release_date);
  const closeDate = drop.close_date ? new Date(drop.close_date) : null;

  if (now < releaseDate) {
    return false;
  }

  if (closeDate && now >= closeDate) {
    return false;
  }

  return true;
}

module.exports = {
  generateSlug,
  getActiveDrop,
  getAllDrops,
  getDropBySlug,
  createDrop,
  updateDrop,
  activateDrop,
  validateDropWindow,
};
