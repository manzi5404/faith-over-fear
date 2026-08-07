const { supabase } = require('../config/supabase');
const { supabaseAdmin } = require('../config/supabaseAdmin');
const { NotFoundError, ConflictError } = require('../utils/errors');

async function findAll(includeInactive = false) {
  let query = supabase
    .from('price_categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

async function findById(id) {
  const { data, error } = await supabase
    .from('price_categories')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function findActive() {
  const { data, error } = await supabase
    .from('price_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function create(data) {
  const { data: row, error } = await supabaseAdmin
    .from('price_categories')
    .insert(data)
    .select('*')
    .single();

  if (error) throw error;
  return row;
}

async function update(id, data) {
  const { data: row, error } = await supabaseAdmin
    .from('price_categories')
    .update(data)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return row;
}

async function remove(id) {
  const { error } = await supabaseAdmin
    .from('price_categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

async function findByName(name) {
  const { data, error } = await supabase
    .from('price_categories')
    .select('id, name')
    .eq('name', name)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function findByProductIds(productIds) {
  if (!productIds || productIds.length === 0) return [];
  const { data, error } = await supabase
    .from('price_categories')
    .select('*')
    .in('id', productIds);

  if (error) throw error;
  return data || [];
}

module.exports = {
  findAll,
  findById,
  findActive,
  create,
  update,
  remove,
  findByName,
  findByProductIds,
};
