const { supabase } = require('../config/supabase');
const { supabaseAdmin } = require('../config/supabaseAdmin');

async function findByProductId(productId) {
  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function findById(id) {
  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function findBySku(sku) {
  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .eq('sku', sku)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function create(data) {
  const { data: row, error } = await supabase
    .from('product_variants')
    .insert(data)
    .select('*')
    .single();

  if (error) throw error;
  return row;
}

async function createBatch(variants) {
  const { data, error } = await supabase
    .from('product_variants')
    .insert(variants)
    .select('*');

  if (error) throw error;
  return data || [];
}

async function reserveStock(variantId, quantity) {
  const { data, error } = await supabaseAdmin.rpc('reserve_stock', {
    p_variant_id: variantId,
    p_quantity: quantity,
  });

  if (error) throw error;
  return data;
}

async function returnStock(variantId, quantity) {
  const { data, error } = await supabaseAdmin.rpc('return_stock', {
    p_variant_id: variantId,
    p_quantity: quantity,
  });

  if (error) throw error;
  return data;
}

module.exports = {
  findByProductId,
  findById,
  findBySku,
  create,
  createBatch,
  reserveStock,
  returnStock,
};
