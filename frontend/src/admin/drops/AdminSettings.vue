<template>
  <div class="space-y-8 animate-in fade-in duration-500">

    <!-- Website Access (Close / Open for sale) -->
    <section class="bg-zinc-900/50 border border-slate-800 rounded-2xl p-8 shadow-xl">
      <h2 class="text-xl font-bold text-white mb-6 flex items-center gap-3">
        <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Website Access
      </h2>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="space-y-4">
          <div class="space-y-3">
            <label class="block text-xs uppercase tracking-widest text-slate-500 font-bold">Site Status</label>
            <div class="flex flex-wrap gap-3">
              <button
                type="button"
                @click="setSiteStatus('closed')"
                :class="['px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border', siteStatus === 'closed' ? 'bg-red-600 text-white border-red-500/30 shadow-lg shadow-red-600/20' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700']"
              >
                Close Website
              </button>
              <button
                type="button"
                @click="setSiteStatus('live')"
                :class="['px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border', siteStatus === 'live' ? 'bg-blue-600 text-white border-blue-500/30 shadow-lg shadow-blue-600/20' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700']"
              >
                Open for Sale
              </button>
            </div>
          </div>

          <div class="p-4 rounded-xl border" :class="siteStatus === 'closed' ? 'bg-red-600/10 border-red-600/20' : 'bg-blue-600/10 border-blue-500/20'">
            <p class="text-[10px] uppercase tracking-widest font-bold mb-1" :class="siteStatus === 'closed' ? 'text-red-400' : 'text-blue-400'">
              {{ siteStatus === 'closed' ? 'Website is CLOSED' : 'Website is LIVE' }}
            </p>
            <p class="text-sm text-slate-300 leading-relaxed">
              {{ siteStatus === 'closed'
                ? 'Visitors see the animated waitlist card and cannot browse or purchase. They can leave their email to be notified.'
                : 'Visitors can browse the store and purchase normally.' }}
            </p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="space-y-2">
            <label class="block text-xs uppercase tracking-widest text-slate-500 font-bold">Notify Waitlist</label>
            <p class="text-sm text-slate-400">
              Email every address that signed up while the site was closed (unnotified only) with the correct message for the current status.
            </p>
          </div>

          <div class="flex items-center gap-3 text-sm text-slate-400">
            <span class="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 font-bold text-white">{{ waitlistCount }}</span>
            <span>people on the waitlist</span>
          </div>

          <div class="flex items-center gap-2">
            <input
              type="email"
              v-model="newEmail"
              placeholder="add@subscriber.com"
              class="flex-1 min-w-0 bg-black border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-colors"
            />
            <button
              type="button"
              @click="addSubscriber"
              :disabled="addingEmail"
              class="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 disabled:opacity-50 text-xs font-bold uppercase tracking-widest transition-all"
            >
              {{ addingEmail ? 'Adding...' : 'Add' }}
            </button>
          </div>

          <button
            type="button"
            @click="broadcastEmails"
            :disabled="broadcasting"
            class="w-full rounded-xl bg-red-600/15 border border-red-600/30 hover:bg-red-600/25 disabled:opacity-50 text-red-200 text-xs font-bold uppercase tracking-widest px-6 py-3 transition-all shadow-lg shadow-red-600/10"
          >
            {{ broadcasting ? 'Sending...' : 'Send Notification Emails' }}
          </button>

          <div v-if="broadcastResult" class="text-sm text-slate-300 p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1">
            <p><span class="font-bold uppercase tracking-widest text-[10px] text-slate-500">Status</span> {{ broadcastResult.status }}</p>
            <p><span class="font-bold uppercase tracking-widest text-[10px] text-slate-500">Emails sent</span> {{ broadcastResult.sent }}</p>
            <p><span class="font-bold uppercase tracking-widest text-[10px] text-slate-500">Marked notified</span> {{ broadcastResult.markedNotified }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Model Images shown on the closed card -->
    <section class="bg-zinc-900/50 border border-slate-800 rounded-2xl p-8 shadow-xl">
      <h2 class="text-xl font-bold text-white mb-2 flex items-center gap-3">
        <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Closed Page Model Images
      </h2>
      <p class="text-xs text-slate-500 mb-6">These images appear in the floating card shown to visitors while the website is closed.</p>

      <div class="flex items-center gap-3 mb-5">
        <label class="cursor-pointer rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-widest px-6 py-3 transition-all shadow-lg shadow-blue-600/20">
          <span v-if="uploading">Uploading...</span>
          <span v-else>Upload Images</span>
          <input type="file" accept="image/*" multiple class="hidden" :disabled="uploading" @change="onUpload" />
        </label>
        <span class="text-xs text-slate-500">Select one or more photos to upload to the closed page.</span>
      </div>

      <div class="space-y-3">
        <div v-for="(url, idx) in closedImages" :key="idx" class="flex items-center gap-3">
          <input
            type="url"
            v-model="closedImages[idx]"
            placeholder="https://.../model.jpg"
            class="flex-1 min-w-0 bg-black border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors"
          />
          <button
            type="button"
            @click="removeImage(idx)"
            class="p-3 rounded-xl border border-slate-800 text-slate-500 hover:text-red-400 hover:border-red-600/40 transition-colors"
            title="Remove image"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          v-if="closedImages.length < 8"
          @click="addImage"
          class="text-xs uppercase tracking-widest font-bold text-blue-400 hover:text-blue-300 transition-colors"
        >
          + Add image
        </button>
      </div>

      <button
        type="button"
        @click="saveImages"
        :disabled="savingImages"
        class="mt-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-widest px-6 py-3 transition-all shadow-lg shadow-blue-600/20"
      >
        {{ savingImages ? 'Saving...' : 'Save Images' }}
      </button>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import DropService from './DropService';

const emit = defineEmits(['updated']);

const siteStatus = ref('live');
const closedImages = ref([]);
const waitlistCount = ref(0);

const broadcasting = ref(false);
const broadcastResult = ref(null);
const savingImages = ref(false);
const uploading = ref(false);
const newEmail = ref('');
const addingEmail = ref(false);

const addSubscriber = async () => {
  const email = newEmail.value.trim();
  if (!email) return;
  addingEmail.value = true;
  try {
    await DropService.addToWaitlist(email);
    newEmail.value = '';
    await fetchWaitlistCount();
    emit('updated', { message: 'Subscriber added to waitlist.', type: 'success' });
  } catch {
    emit('updated', { message: 'Failed to add subscriber.', type: 'error' });
  } finally {
    addingEmail.value = false;
  }
};

const onUpload = async (event) => {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;
  uploading.value = true;
  try {
    for (const file of files) {
      const data = await DropService.uploadImage(file);
      const url = data?.url || data?.secure_url;
      if (url) closedImages.value.push(url);
    }
    emit('updated', { message: 'Images uploaded.', type: 'success' });
  } catch {
    emit('updated', { message: 'Image upload failed.', type: 'error' });
  } finally {
    uploading.value = false;
    event.target.value = '';
  }
};

const fetchSiteGate = async () => {
  try {
    const res = await DropService.getSettings();
    const settings = res?.settings || {};
    siteStatus.value = String(settings.siteStatus || 'live').toLowerCase();

    let imgs = settings.siteClosedImages;
    if (typeof imgs === 'string') {
      const trimmed = imgs.trim();
      if (trimmed.startsWith('[')) {
        try { imgs = JSON.parse(trimmed); } catch { imgs = []; }
      } else {
        imgs = trimmed.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    closedImages.value = Array.isArray(imgs) ? imgs : [];
  } catch {
    siteStatus.value = 'live';
  }
};

const fetchWaitlistCount = async () => {
  try {
    const res = await DropService.getWaitlist();
    const entries = res?.entries || [];
    waitlistCount.value = entries.length;
  } catch {
    waitlistCount.value = 0;
  }
};

const setSiteStatus = async (status) => {
  const normalized = String(status || '').toLowerCase();
  siteStatus.value = normalized;
  try {
    await DropService.updateSetting('siteStatus', normalized);
    emit('updated', {
      message: normalized === 'closed' ? 'Website closed. Visitors now see the waitlist card.' : 'Website is live for sale.',
      type: 'success'
    });
  } catch {
    emit('updated', { message: 'Failed to update website status.', type: 'error' });
    await fetchSiteGate();
  }
};

const addImage = () => {
  if (closedImages.value.length < 8) closedImages.value.push('');
};

const removeImage = (idx) => {
  closedImages.value.splice(idx, 1);
};

const saveImages = async () => {
  savingImages.value = true;
  const cleaned = closedImages.value.map(u => (u || '').trim()).filter(Boolean);
  try {
    await DropService.updateSetting('siteClosedImages', cleaned);
    closedImages.value = cleaned;
    emit('updated', { message: 'Closed-page images saved.', type: 'success' });
  } catch {
    emit('updated', { message: 'Failed to save images.', type: 'error' });
  } finally {
    savingImages.value = false;
  }
};

const broadcastEmails = async () => {
  broadcasting.value = true;
  broadcastResult.value = null;
  try {
    const data = await DropService.broadcastSiteStatusEmails();
    broadcastResult.value = {
      status: data.status,
      sent: data.sent,
      markedNotified: data.markedNotified
    };
    emit('updated', {
      message: data.success ? 'Emails sent to the waitlist.' : 'Broadcast failed.',
      type: data.success ? 'success' : 'error'
    });
    await fetchWaitlistCount();
  } catch {
    emit('updated', { message: 'Broadcast failed.', type: 'error' });
  } finally {
    broadcasting.value = false;
  }
};

onMounted(async () => {
  await fetchSiteGate();
  await fetchWaitlistCount();
});
</script>
