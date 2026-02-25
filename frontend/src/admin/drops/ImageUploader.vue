<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Front Image -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-slate-400">Front Image URL (Required)</label>
        <div class="flex gap-2">
          <input 
            type="text" 
            v-model="front"
            @input="updateImages"
            class="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="https://..."
          />
        </div>
        <div v-if="front" class="mt-2 w-32 h-32 rounded-lg overflow-hidden border border-slate-700">
          <img :src="front" class="w-full h-full object-cover" />
        </div>
      </div>

      <!-- Back Image -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-slate-400">Back Image URL</label>
        <div class="flex gap-2">
          <input 
            type="text" 
            v-model="back"
            @input="updateImages"
            class="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="https://..."
          />
        </div>
        <div v-if="back" class="mt-2 w-32 h-32 rounded-lg overflow-hidden border border-slate-700">
          <img :src="back" class="w-full h-full object-cover" />
        </div>
      </div>
    </div>

    <!-- Additional Gallery -->
    <div class="space-y-3">
      <div class="flex justify-between items-center">
        <label class="text-sm font-medium text-slate-400">Additional Gallery Images</label>
        <button 
          type="button" 
          @click="addAdditional"
          class="text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center gap-1.5 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Image URL
        </button>
      </div>
      
      <div class="flex flex-wrap gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-800">
        <div v-for="(url, index) in additional" :key="index" class="relative group w-20 h-20 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shadow-inner">
          <img :src="url" class="w-full h-full object-cover" />
          <button 
            type="button"
            @click="removeAdditional(index)"
            class="absolute inset-0 bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div v-if="additional.length === 0" class="w-full text-center py-4 text-slate-600 text-sm italic">
          No additional images added
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  images: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:images']);

const front = ref(props.images[0] || '');
const back = ref(props.images[1] || '');
const additional = ref(props.images.slice(2));

watch(() => props.images, (newVal) => {
  front.value = newVal[0] || '';
  back.value = newVal[1] || '';
  additional.value = newVal.slice(2);
}, { deep: true });

const updateImages = () => {
  const allImages = [front.value, back.value, ...additional.value].filter(url => url.trim() !== '');
  emit('update:images', allImages);
};

const addAdditional = () => {
  const url = prompt('Enter image URL:');
  if (url) {
    additional.value.push(url);
    updateImages();
  }
};

const removeAdditional = (index) => {
  additional.value.splice(index, 1);
  updateImages();
};
</script>
