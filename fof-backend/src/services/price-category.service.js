const priceCategoryRepo = require('../repositories/price-category.repository');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/errors');

async function getAllPriceCategories(includeInactive = false) {
  return priceCategoryRepo.findAll(includeInactive);
}

async function getActivePriceCategories() {
  return priceCategoryRepo.findActive();
}

async function getPriceCategoryById(id) {
  const category = await priceCategoryRepo.findById(id);
  if (!category) {
    throw new NotFoundError('Price category not found');
  }
  return category;
}

async function createPriceCategory(data) {
  if (!data.name || !data.name.trim()) {
    throw new ValidationError('Price category name is required');
  }

  if (data.price === undefined || data.price === null || Number(data.price) < 0) {
    throw new ValidationError('Price must be a non-negative number');
  }

  const existing = await priceCategoryRepo.findByName(data.name.trim());
  if (existing) {
    throw new ConflictError('Price category with this name already exists');
  }

  const category = await priceCategoryRepo.create({
    name: data.name.trim(),
    price: Number(data.price),
    sort_order: Number(data.sort_order) || 0,
    is_active: data.is_active !== false,
  });

  return category;
}

async function updatePriceCategory(id, data) {
  const existing = await priceCategoryRepo.findById(id);
  if (!existing) {
    throw new NotFoundError('Price category not found');
  }

  if (data.name && data.name.trim() && data.name.trim() !== existing.name) {
    const nameExists = await priceCategoryRepo.findByName(data.name.trim());
    if (nameExists) {
      throw new ConflictError('Price category with this name already exists');
    }
  }

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.price !== undefined) updateData.price = Number(data.price);
  if (data.sort_order !== undefined) updateData.sort_order = Number(data.sort_order);
  if (data.is_active !== undefined) updateData.is_active = data.is_active;

  const updated = await priceCategoryRepo.update(id, updateData);
  return updated;
}

async function deletePriceCategory(id) {
  const existing = await priceCategoryRepo.findById(id);
  if (!existing) {
    throw new NotFoundError('Price category not found');
  }

  await priceCategoryRepo.remove(id);
  return true;
}

module.exports = {
  getAllPriceCategories,
  getActivePriceCategories,
  getPriceCategoryById,
  createPriceCategory,
  updatePriceCategory,
  deletePriceCategory,
};
