<template>
  <div class="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
    <div class="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
      <h2 class="text-xl font-semibold text-white">Current Drops</h2>
      
      <div class="flex flex-1 w-full md:w-auto gap-3">
        <div class="relative flex-1">
          <input 
            type="text" 
            v-model="searchQuery"
            placeholder="Search drops..."
            class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <svg class="w-5 h-5 absolute left-3 top-2.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <select 
          v-model="typeFilter"
          class="bg-slate-800 text-slate-200 text-sm rounded-lg px-4 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
        >
          <option value="all">All Types</option>
          <option value="new-drop">New Drop</option>
          <option value="recent-drop">Recent Drop</option>
          <option value="limited">Limited Edition</option>
        </select>
      </div>
    </div>
    
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-widest border-b border-slate-800">
            <th class="px-6 py-4 font-semibold">Drop</th>
            <th class="px-6 py-4 font-semibold">Price</th>
            <th class="px-6 py-4 font-semibold">Type</th>
            <th class="px-6 py-4 font-semibold">Sizes</th>
            <th class="px-6 py-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800">
          <tr v-if="filteredDrops.length === 0">
            <td colSpan="5" class="px-6 py-20 text-center">
              <div class="flex flex-col items-center gap-2 text-slate-500">
                <svg class="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p class="font-medium italic">No drops match your criteria.</p>
              </div>
            </td>
          </tr>
          <tr v-for="drop in filteredDrops" :key="drop.id" class="hover:bg-slate-800/30 transition-colors group">
            <td class="px-6 py-4">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700 shadow-inner group-hover:scale-105 transition-transform">
                  <img v-if="getImages(drop)[0]" :src="getImages(drop)[0]" :alt="drop.name" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center text-slate-600 text-[10px] font-bold">NO IMG</div>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-slate-100">{{ drop.name }}</span>
                    <span 
                      :class="['w-2 h-2 rounded-full', drop.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-slate-600']" 
                      :title="drop.is_active ? 'Active' : 'Inactive'"
                    ></span>
                  </div>
                  <p class="text-xs text-slate-500 line-clamp-1 max-w-[200px]">{{ drop.description || 'No description' }}</p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <span class="font-mono text-slate-300 font-semibold">${{ parseFloat(drop.price).toLocaleString() }}</span>
            </td>
            <td class="px-6 py-4">
              <span :class="['px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider', typeBadgeClass(drop.type)]">
                {{ drop.type }}
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="flex flex-wrap gap-1 max-w-[120px]">
                <span v-for="size in getSizes(drop)" :key="size" class="text-[8px] font-bold bg-slate-800 text-slate-400 px-1 border border-slate-700/50 rounded lowercase">
                  {{ size }}
                </span>
              </div>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  @click="$emit('edit', drop)"
                  class="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                  title="Edit Drop"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button 
                  @click="$emit('delete', drop.id)"
                  class="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                  title="Delete Drop"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v2m3 3h.01" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  drops: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['edit', 'delete']);

const searchQuery = ref('');
const typeFilter = ref('all');

const filteredDrops = computed(() => {
  return props.drops.filter(drop => {
    const matchesSearch = drop.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesType = typeFilter.value === 'all' || drop.type === typeFilter.value;
    return matchesSearch && matchesType;
  });
});

const getImages = (drop) => {
  if (Array.isArray(drop.images)) return drop.images;
  try {
    return drop.images ? JSON.parse(drop.images) : [];
  } catch (e) {
    return [drop.images].filter(Boolean);
  }
};

const getSizes = (drop) => {
  if (Array.isArray(drop.sizes)) return drop.sizes;
  try {
    return drop.sizes ? JSON.parse(drop.sizes) : [];
  } catch (e) {
    return [];
  }
};

const typeBadgeClass = (type) => {
  switch (type) {
    case 'new-drop': return 'bg-blue-900/40 text-blue-400 border border-blue-500/20';
    case 'recent-drop': return 'bg-slate-800 text-slate-400 border border-slate-700';
    case 'limited': return 'bg-amber-900/40 text-amber-400 border border-amber-500/20';
    default: return 'bg-slate-800 text-slate-500';
  }
};
</script>
