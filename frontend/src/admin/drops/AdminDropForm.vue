<template>
  <div class="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
    <h2 class="text-xl font-semibold text-white mb-6 flex items-center gap-2">
      <div :class="['w-2 h-2 rounded-full', initialData ? 'bg-blue-500' : 'bg-emerald-500']"></div>
      {{ initialData ? 'Edit Collection' : 'Create New Collection' }}
    </h2>
    
    <form @submit.prevent="handleSubmit" class="space-y-8">
      <!-- Collection Info -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-400">Collection Name</label>
          <input 
            type="text"
            v-model="formData.name"
            :class="['w-full bg-slate-800 border text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all', errors.name ? 'border-red-500' : 'border-slate-700']"
            placeholder="E.g., Origins Summer '26"
          />
          <p v-if="errors.name" class="text-red-500 text-xs mt-1">{{ errors.name }}</p>
        </div>
        
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
      </div>

      <div class="flex items-center gap-6">
        <label class="flex items-center gap-3 cursor-pointer group">
          <input 
            type="checkbox"
            v-model="formData.is_active"
            class="w-5 h-5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 transition-all"
          />
          <span class="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Active Status</span>
        </label>
      </div>

      <!-- Products Management Section -->
      <div class="space-y-4 pt-6 border-t border-slate-800">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold text-white flex items-center gap-2">
            Products In This Collection
            <span class="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full border border-slate-700">{{ formData.products.length }}</span>
          </h3>
          <button 
            type="button"
            @click="openProductForm()"
            class="text-xs font-bold uppercase tracking-widest text-blue-500 hover:text-blue-400 flex items-center gap-1.5 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Product Item
          </button>
        </div>

        <!-- Product List -->
        <div v-if="formData.products.length > 0" class="grid grid-cols-1 gap-3">
          <div 
            v-for="(product, index) in formData.products" 
            :key="product.id || product.tempId"
            class="bg-slate-800/30 border border-slate-800 rounded-lg p-3 flex items-center justify-between group hover:border-slate-700 transition-all shadow-sm"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0">
                <img v-if="product.image_urls?.[0]" :src="product.image_urls[0]" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center text-[8px] text-slate-600 font-bold uppercase">No Img</div>
              </div>
              <div class="max-w-[200px]">
                <p class="text-sm font-bold text-slate-100 truncate">{{ product.name }}</p>
                <p class="text-xs text-slate-500 tracking-tight">${{ product.price }} • {{ product.image_urls?.length || 0 }} images</p>
              </div>
            </div>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button @click="openProductForm(product, index)" type="button" class="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button @click="removeProduct(index)" type="button" class="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v2m3 3h.01" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div v-else class="border-2 border-dashed border-slate-800 rounded-xl py-12 text-center text-slate-600">
          <p class="text-sm italic">No products added to this collection yet.</p>
          <button @click="openProductForm()" type="button" class="mt-2 text-blue-500 hover:text-blue-400 font-bold hover:underline">Click here to add one</button>
        </div>
      </div>

      <!-- Action Buttons -->
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
          <span v-else>{{ initialData ? 'Update Collection' : 'Create & Notify' }}</span>
        </button>
      </div>
    </form>

    <!-- Product Editor Modal -->
    <div v-if="showProductEditor" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div class="w-full max-w-2xl mt-auto mb-auto">
        <AdminProductForm 
          :initialData="editingProduct" 
          @save="handleProductSave" 
          @cancel="showProductEditor = false" 
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import AdminProductForm from './AdminProductForm.vue';

const props = defineProps({
  initialData: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['submit', 'cancel']);

const formData = reactive({
  name: '',
  type: 'new-drop',
  is_active: true,
  products: []
});

const errors = reactive({});
const isSubmitting = ref(false);
const showProductEditor = ref(false);
const editingProduct = ref(null);
const editingProductIndex = ref(-1);

onMounted(() => {
  if (props.initialData) {
    Object.assign(formData, {
      ...props.initialData,
      products: props.initialData.products || []
    });
  }
});

const openProductForm = (product = null, index = -1) => {
  editingProduct.value = product ? JSON.parse(JSON.stringify(product)) : {
    name: '',
    price: 0,
    description: '',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [],
    image_urls: [],
    is_active: true,
    tempId: Date.now()
  };
  editingProductIndex.value = index;
  showProductEditor.value = true;
};

const handleProductSave = (product) => {
  if (editingProductIndex.value > -1) {
    formData.products[editingProductIndex.value] = product;
  } else {
    formData.products.push(product);
  }
  showProductEditor.value = false;
};

const removeProduct = (index) => {
  if (confirm('Remove this product from the collection?')) {
    formData.products.splice(index, 1);
  }
};

const validate = () => {
  Object.keys(errors).forEach(key => delete errors[key]);
  if (!formData.name.trim()) errors.name = 'Collection Name is required';
  return Object.keys(errors).length === 0;
};

const handleSubmit = async () => {
  if (!validate()) return;
  
  isSubmitting.value = true;
  try {
    // We send the whole structure. Backend/Service can decide how to split it.
    await emit('submit', { ...formData });
  } finally {
    isSubmitting.value = false;
  }
};
</script>
