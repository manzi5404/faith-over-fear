<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <div class="bg-zinc-900/50 border border-slate-800 rounded-2xl p-8 shadow-xl">
      <h2 class="text-xl font-bold text-white mb-6 flex items-center gap-3">
        <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Global Store Configuration
      </h2>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <!-- Store Mode Toggle -->
        <div class="space-y-6">
          <div>
            <label class="block text-xs uppercase tracking-widest text-slate-500 font-bold mb-4">Operational mode</label>
            <div class="flex p-1 bg-black border border-slate-800 rounded-xl w-fit">
              <button 
                @click="config.store_mode = 'live'"
                :class="['px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all', config.store_mode === 'live' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white']"
              >
                Live Sales
              </button>
              <button 
                @click="config.store_mode = 'reserve'"
                :class="['px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all', config.store_mode === 'reserve' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'text-slate-500 hover:text-white']"
              >
                Reserve Only
              </button>
            </div>
            <p class="mt-4 text-xs text-slate-500 leading-relaxed italic">
              {{ config.store_mode === 'live' ? 'Standard checkout is enabled. Customers can purchase items directly via MoMo.' : 'Checkout is blocked. Customers can only submit interest via the reservation form.' }}
            </p>
          </div>

          <div class="pt-6 border-t border-slate-800/50">
            <div class="flex items-center justify-between">
              <div>
                <label class="block text-xs uppercase tracking-widest text-slate-500 font-bold">Global Banner</label>
                <p class="text-[10px] text-slate-600 mt-1 uppercase tracking-tighter">Toggle visibility of the top announcement bar</p>
              </div>
              <button 
                @click="config.banner_enabled = !config.banner_enabled"
                :class="['w-12 h-6 rounded-full relative transition-colors duration-300', config.banner_enabled ? 'bg-blue-600' : 'bg-slate-800']"
              >
                <div :class="['absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300', config.banner_enabled ? 'translate-x-7' : 'translate-x-1']"></div>
              </button>
            </div>
          </div>
        </div>

        <!-- Announcement Message -->
        <div class="space-y-4">
          <label class="block text-xs uppercase tracking-widest text-slate-500 font-bold">Banner Message</label>
          <textarea 
            v-model="config.announcement_message"
            rows="4"
            placeholder="Enter announcement text..."
            class="w-full bg-black border border-slate-800 rounded-xl p-4 text-sm focus:border-blue-500 outline-none transition-colors resize-none"
          ></textarea>
          <div class="flex items-start gap-3 p-4 bg-blue-600/5 border border-blue-500/10 rounded-xl">
            <svg class="w-4 h-4 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-[10px] text-slate-400 leading-relaxed">
              This message will be displayed globally across the site when the banner is enabled. Use it to communicate drop dates or collection status.
            </p>
          </div>
        </div>
      </div>

      <div class="mt-10 pt-8 border-t border-slate-800 flex justify-end">
        <button 
          @click="saveConfig"
          :disabled="loading"
          class="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-widest px-8 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2"
        >
          <span v-if="!loading">Update Configuration</span>
          <span v-else>Saving...</span>
        </button>
      </div>
    </div>

    <!-- Drop Announcement Modal Settings -->
    <div class="bg-zinc-900/50 border border-slate-800 rounded-2xl p-8 shadow-xl">
      <h2 class="text-xl font-bold text-white mb-6 flex items-center gap-3">
        <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Drop Announcement Modal
      </h2>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <label class="block text-xs uppercase tracking-widest text-slate-500 font-bold">Modal Status</label>
              <p class="text-[10px] text-slate-600 mt-1 uppercase tracking-tighter">Enable the premium animated drop announcement</p>
            </div>
            <button 
              @click="announcement.is_enabled = !announcement.is_enabled"
              :class="['w-12 h-6 rounded-full relative transition-colors duration-300', announcement.is_enabled ? 'bg-red-600' : 'bg-slate-800']"
            >
              <div :class="['absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300', announcement.is_enabled ? 'translate-x-7' : 'translate-x-1']"></div>
            </button>
          </div>

          <div class="space-y-4">
            <label class="block text-xs uppercase tracking-widest text-slate-500 font-bold">Modal Title</label>
            <input 
              v-model="announcement.title"
              type="text"
              placeholder="e.g. NEW DROP IS HERE"
              class="w-full bg-black border border-slate-800 rounded-xl p-4 text-sm focus:border-red-500 outline-none transition-colors"
            />
          </div>

          <div class="space-y-4">
            <label class="block text-xs uppercase tracking-widest text-slate-500 font-bold">CTA Button Text</label>
            <input 
              v-model="announcement.button_text"
              type="text"
              placeholder="e.g. SHOP NOW"
              class="w-full bg-black border border-slate-800 rounded-xl p-4 text-sm focus:border-red-500 outline-none transition-colors"
            />
          </div>
        </div>

        <div class="space-y-6">
          <div class="space-y-4">
            <label class="block text-xs uppercase tracking-widest text-slate-500 font-bold">Modal Message</label>
            <textarea 
              v-model="announcement.message"
              rows="5"
              placeholder="Enter modal message..."
              class="w-full bg-black border border-slate-800 rounded-xl p-4 text-sm focus:border-red-500 outline-none transition-colors resize-none"
            ></textarea>
          </div>
        </div>
      </div>

      <div class="mt-10 pt-8 border-t border-slate-800 flex justify-between items-center">
        <p class="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Current Version: <span class="text-white">{{ announcement.version }}</span></p>
        <button 
          @click="saveAnnouncement"
          :disabled="updatingAnnouncement"
          class="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-widest px-8 py-3 rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95 flex items-center gap-2"
        >
          <span v-if="!updatingAnnouncement">Save & Increment Version</span>
          <span v-else>Updating...</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import DropService from './DropService';

const props = defineProps(['initialConfig']);
const emit = defineEmits(['updated']);

const config = ref({
  store_mode: 'live',
  announcement_message: '',
  banner_enabled: false
});

const announcement = ref({
  title: '',
  message: '',
  button_text: '',
  button_link: '',
  is_enabled: false,
  version: 0
});

const loading = ref(false);
const updatingAnnouncement = ref(false);

const fetchConfig = async () => {
  try {
    const data = await DropService.getStoreConfig();
    config.value = data;
    
    const annData = await DropService.getAnnouncement();
    if (annData) {
      announcement.value = annData;
    }
  } catch (error) {
    console.error('Failed to load settings');
  }
};

const saveConfig = async () => {
  loading.value = true;
  try {
    await DropService.updateStoreConfig(config.value);
    emit('updated', { message: 'Store configuration updated successfully!', type: 'success' });
  } catch (error) {
    emit('updated', { message: 'Failed to update configuration.', type: 'error' });
  } finally {
    loading.value = false;
  }
};

const saveAnnouncement = async () => {
  updatingAnnouncement.value = true;
  try {
    await DropService.updateAnnouncement(announcement.value);
    emit('updated', { message: 'Drop announcement updated and version incremented!', type: 'success' });
    // Refresh to get new version number
    const annData = await DropService.getAnnouncement();
    if (annData) {
      announcement.value = annData;
    }
  } catch (error) {
    emit('updated', { message: 'Failed to update announcement.', type: 'error' });
  } finally {
    updatingAnnouncement.value = false;
  }
};

onMounted(fetchConfig);
</script>
