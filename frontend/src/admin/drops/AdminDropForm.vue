<template>
  <div class="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
    <h2 class="text-xl font-semibold text-white mb-6 flex items-center gap-2">
      <div :class="['w-2 h-2 rounded-full', initialData ? 'bg-blue-500' : 'bg-emerald-500']"></div>
      {{ initialData ? 'Edit Drop' : 'Add New Drop' }}
    </h2>
    
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-400">Name</label>
          <input 
            type="text"
            v-model="formData.name"
            :class="['w-full bg-slate-800 border text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all', errors.name ? 'border-red-500' : 'border-slate-700']"
            placeholder="E.g., Winter Essential Hoodie"
          />
          <p v-if="errors.name" class="text-red-500 text-xs mt-1">{{ errors.name }}</p>
        </div>
        
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-400">Price ($)</label>
          <input 
            type="number"
            step="0.01"
            v-model="formData.price"
            :class="['w-full bg-slate-800 border text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all', errors.price ? 'border-red-500' : 'border-slate-700']"
            placeholder="0.00"
          />
          <p v-if="errors.price" class="text-red-500 text-xs mt-1">{{ errors.price }}</p>
        </div>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium text-slate-400">Description</label>
        <textarea 
          v-model="formData.description"
          rows="3"
          class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
          placeholder="Describe this drop..."
        ></textarea>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-400">Type</label>
          <select 
            v-model="formData.type"
            class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
          >
            <option value="new-drop">New Drop</option>
            <option value="recent-drop">Recent Drop</option>
            <option value="limited">Limited Edition</option>
          </select>
        </div>
        
        <div class="flex items-end pb-2">
          <label class="flex items-center gap-3 cursor-pointer group">
            <input 
              type="checkbox"
              v-model="formData.is_active"
              class="w-5 h-5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 transition-all"
            />
            <span class="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Active Status</span>
          </label>
        </div>
      </div>

      <SizeSelector v-model="formData.sizes" />

      <ImageUploader v-model:images="formData.images" />
      <p v-if="errors.images" class="text-red-500 text-sm italic">{{ errors.images }}</p>

      <div class="flex justify-end gap-3 pt-6 border-t border-slate-800">
        <button 
          type="button" 
          @click="$emit('cancel')"
          class="px-8 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-medium"
        >
          Discard
        </button>
        <button 
          type="submit" 
          :disabled="isSubmitting"
          class="px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/30 active:scale-95 disabled:opacity-50"
        >
          <span v-if="isSubmitting" class="flex items-center gap-2">
             <svg class="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
               <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
               <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
             Processing...
          </span>
          <span v-else>{{ initialData ? 'Update Drop' : 'Create & Notify' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import SizeSelector from './SizeSelector.vue';
import ImageUploader from './ImageUploader.vue';

const props = defineProps({
  initialData: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['submit', 'cancel']);

const formData = reactive({
  name: '',
  price: 0,
  description: '',
  type: 'new-drop',
  images: [],
  sizes: ['S', 'M', 'L', 'XL'],
  is_active: true
});

const errors = reactive({});
const isSubmitting = ref(false);

onMounted(() => {
  if (props.initialData) {
    Object.assign(formData, {
      ...props.initialData,
      images: Array.isArray(props.initialData.images) ? [...props.initialData.images] : (props.initialData.images ? JSON.parse(props.initialData.images) : [])
    });
  }
});

const validate = () => {
  Object.keys(errors).forEach(key => delete errors[key]);
  
  if (!formData.name.trim()) errors.name = 'Name is required';
  if (formData.price <= 0) errors.price = 'Price must be greater than 0';
  if (formData.images.length === 0) errors.images = 'At least one image (Front) is required';
  
  return Object.keys(errors).length === 0;
};

const handleSubmit = async () => {
  if (!validate()) return;
  
  isSubmitting.value = true;
  try {
    await emit('submit', { ...formData });
  } finally {
    isSubmitting.value = false;
  }
};
</script>
