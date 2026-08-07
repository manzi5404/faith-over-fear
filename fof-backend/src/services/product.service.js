const productRepo = require('../repositories/product.repository');
const variantRepo = require('../repositories/variant.repository');
const dropService = require('./drop.service');
const priceCategoryService = require('./price-category.service');
const priceCategoryRepo = require('../repositories/price-category.repository');
const { events } = require('../events');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/errors');

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function attachPriceCategories(products) {
  if (!products || products.length === 0) return;
  const categoryIds = [...new Set(products.map(p => p.price_category_id).filter(Boolean))];
  if (categoryIds.length === 0) return;
  const categories = await priceCategoryRepo.findByProductIds(categoryIds);
  const categoryMap = new Map(categories.map(c => [c.id, c]));
  for (const product of products) {
    if (product.price_category_id && categoryMap.has(product.price_category_id)) {
      product.price_categories = categoryMap.get(product.price_category_id);
    }
  }
}

async function getProductsByDrop(dropId) {
  const products = await productRepo.findByDropId(dropId);
  await attachPriceCategories(products);
  return products;
}

async function getProductBySlug(slug) {
  const product = await productRepo.findBySlug(slug);
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  if (product.price_category_id) {
    try {
      product.price_categories = await priceCategoryService.getPriceCategoryById(product.price_category_id);
    } catch (_) {}
  }
  return product;
}

async function getProductById(id) {
  const product = await productRepo.findById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  if (product.price_category_id) {
    try {
      product.price_categories = await priceCategoryService.getPriceCategoryById(product.price_category_id);
    } catch (_) {}
  }
  return product;
}

async function createProduct(data) {
  if (!data.name || !data.name.trim()) {
    throw new ValidationError('Product name is required');
  }

  if (!data.drop_id) {
    throw new ValidationError('drop_id is required');
  }

  const allDrops = await dropService.getAllDrops(true);
  const dropExists = allDrops.some((d) => d.id === data.drop_id);
  if (!dropExists) {
    throw new ValidationError('Invalid drop_id: drop does not exist');
  }

  let price = null;

  if (data.price_category_id) {
    const category = await priceCategoryService.getPriceCategoryById(data.price_category_id);
    price = Number(category.price);
  } else if (data.price && Number(data.price) > 0) {
    price = Number(data.price);
  } else {
    throw new ValidationError('A price category or price is required');
  }

  const drop = await dropService.getActiveDrop();
  if (!drop || drop.id !== data.drop_id) {
    const dropExists = await dropService.getDropBySlug(
      (await dropService.getAllDrops(true)).find((d) => d.id === data.drop_id)?.slug || ''
    );
    if (!dropExists) {
      throw new ValidationError('Invalid drop_id: drop must exist');
    }
  }

  let slug = data.slug || generateSlug(data.name);
  let counter = 1;
  let isConflict = await productRepo.findBySlugConflict(slug);
  while (isConflict) {
    slug = `${generateSlug(data.name)}-${counter}`;
    counter++;
    isConflict = await productRepo.findBySlugConflict(slug);
  }

  const product = await productRepo.create({
    drop_id: data.drop_id,
    name: data.name.trim(),
    slug,
    description: data.description || null,
    price: price,
    price_category_id: data.price_category_id || null,
    images: data.images || [],
    status: data.status || 'live',
  });

  events.emit(events.PRODUCT_CREATED, { product });

  if (data.variants && Array.isArray(data.variants) && data.variants.length > 0) {
    const variantsService = require('./variant.service');
    await variantsService.createVariants(product.id, data.variants);
  }

  return product;
}

async function updateProduct(id, data) {
  const existing = await productRepo.findById(id);
  if (!existing) {
    throw new NotFoundError('Product not found');
  }

  if (data.slug && data.slug !== existing.slug) {
    const isConflict = await productRepo.findBySlugConflict(data.slug, id);
    if (isConflict) {
      throw new ConflictError('Slug already in use');
    }
  }

  if (data.name && !data.slug) {
    const newSlug = generateSlug(data.name);
    const isConflict = await productRepo.findBySlugConflict(newSlug, id);
    if (!isConflict) {
      data.slug = newSlug;
    }
  }

  const allowedFields = [
    'name', 'slug', 'description', 'price', 'price_category_id', 'images', 'status', 'drop_id', 'default_quality_level_id',
  ];

  const updateData = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  if (data.price_category_id && !data.price) {
    const category = await priceCategoryService.getPriceCategoryById(data.price_category_id);
    updateData.price = Number(category.price);
  }

  if (Object.keys(updateData).length === 0) {
    return existing;
  }

  if (data.variants && Array.isArray(data.variants)) {
    await productRepo.deleteVariants(id);
    const variantsService = require('./variant.service');
    await variantsService.createVariants(id, data.variants);
  }

  const updated = await productRepo.update(id, updateData);
  events.emit(events.PRODUCT_UPDATED, { product: updated, changes: updateData });
  return updated;
}

async function softDelete(id) {
  const product = await productRepo.findById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  await productRepo.softDelete(id);
  events.emit(events.PRODUCT_DELETED, { product });
  return true;
}

module.exports = {
  generateSlug,
  getProductsByDrop,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  softDelete,
};
