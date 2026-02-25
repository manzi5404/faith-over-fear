<template>
  <div class="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-blue-500/30 selection:text-white">
    <!-- Navigation Sidebar/Top Bar Placeholder -->
    <nav class="bg-black/50 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-8">
          <span class="text-xl font-black tracking-tighter text-white">F<span class="text-blue-500">&gt;</span>F <span class="text-xs uppercase tracking-widest text-slate-500 ml-2 font-bold opacity-50">Admin</span></span>
          <div class="hidden md:flex items-center gap-1">
            <a href="#" class="px-4 py-2 rounded-lg bg-blue-600/10 text-blue-400 text-sm font-bold border border-blue-500/20">Drops</a>
            <a href="#" class="px-4 py-2 rounded-lg text-slate-500 text-sm font-semibold hover:text-white hover:bg-slate-800 transition-all">Orders</a>
          </div>
        </div>
        
        <div class="flex items-center gap-4">
          <button 
            @click="showForm = true; editingDrop = null" 
            class="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Drop
          </button>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <!-- Welcome Header -->
      <section>
        <h1 class="text-3xl font-bold text-white tracking-tight">Manage your <span class="text-blue-500">collections</span>.</h1>
        <p class="text-slate-500 mt-1">Add, update, or remove clothing drops from your store.</p>
      </section>

      <!-- Form Transition -->
      <section v-if="showForm" id="drop-form">
        <AdminDropForm 
          :initialData="editingDrop" 
          @submit="handleFormSubmit" 
          @cancel="showForm = false" 
        />
      </section>

      <!-- Drop List -->
      <section>
        <AdminDropList 
          :drops="drops" 
          @edit="handleEdit" 
          @delete="handleDelete" 
        />
      </section>
    </main>

    <!-- Global Notification Base -->
    <div class="fixed bottom-8 right-8 z-[100] space-y-3 pointer-events-none">
      <div 
        v-for="note in notifications" 
        :key="note.id"
        class="pointer-events-auto flex items-center p-4 bg-zinc-900 border border-slate-800 shadow-2xl min-w-[320px] rounded-xl animate-in slide-in-from-right-4 fade-in duration-300"
      >
        <div :class="['w-1 h-10 mr-4 rounded-full', note.type === 'success' ? 'bg-emerald-500' : 'bg-red-500']"></div>
        <div class="flex-1">
          <p class="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">{{ note.type }}</p>
          <p class="text-sm font-medium text-slate-100">{{ note.message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AdminDropList from './AdminDropList.vue';
import AdminDropForm from './AdminDropForm.vue';
import DropService from './DropService';

const drops = ref([]);
const showForm = ref(false);
const editingDrop = ref(null);
const notifications = ref([]);

const fetchDrops = async () => {
  try {
    drops.value = await DropService.getDrops();
  } catch (error) {
    notify('Failed to load drops.', 'error');
  }
};

const handleFormSubmit = async (formData) => {
  try {
    if (editingDrop.value) {
      await DropService.updateDrop(editingDrop.value.id, formData);
      notify('Drop updated successfully!', 'success');
    } else {
      await DropService.createDrop(formData);
      notify('Drop created and notifications sent!', 'success');
    }
    showForm.value = false;
    await fetchDrops();
  } catch (error) {
    notify('Failed to save drop.', 'error');
  }
};

const handleEdit = (drop) => {
  editingDrop.value = { ...drop };
  showForm.value = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleDelete = async (id) => {
  if (confirm('Are you sure you want to delete this drop? This action cannot be undone.')) {
    try {
      await DropService.deleteDrop(id);
      notify('Drop deleted successfully.', 'success');
      await fetchDrops();
    } catch (error) {
      notify('Failed to delete drop.', 'error');
    }
  }
};

const notify = (message, type = 'success') => {
  const id = Date.now();
  notifications.value.push({ id, message, type });
  setTimeout(() => {
    notifications.value = notifications.value.filter(n => n.id !== id);
  }, 4000);
};

onMounted(fetchDrops);
</script>

<style>
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes slide-in-from-bottom { from { transform: translateY(1rem); } to { transform: translateY(0); } }
.animate-in { animation: fade-in 0.3s ease-out; }
.slide-in-from-bottom-4 { animation: slide-in-from-bottom 0.3s ease-out; }
</style>
