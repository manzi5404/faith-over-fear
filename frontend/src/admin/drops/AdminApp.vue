<template>
  <div class="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-blue-500/30 selection:text-white">
    <!-- Unauthenticated State: Login Page -->
    <div v-if="!isAuthenticated" class="min-h-screen flex items-center justify-center px-4">
      <div class="w-full max-w-md space-y-8 p-10 bg-zinc-900/50 backdrop-blur-3xl border border-slate-800 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-700">
        <div class="text-center space-y-2">
          <h1 class="text-4xl font-black tracking-tighter text-white">F<span class="text-blue-500">&gt;</span>F <span class="text-xs uppercase tracking-widest text-slate-500 ml-2 font-bold opacity-50">Admin</span></h1>
          <p class="text-slate-500 text-sm font-medium">Restricted Access Portal</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- ... (existing form content) ... -->
        </form>

        <div class="relative py-4">
          <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-800"></div></div>
          <div class="relative flex justify-center text-[10px] uppercase tracking-widest font-bold"><span class="bg-[#050505] px-4 text-slate-600">OR</span></div>
        </div>

        <button 
          @click="initiateGoogleLogin" 
          class="w-full bg-black/40 border border-slate-800 hover:bg-slate-800 text-white font-bold h-14 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <div class="relative py-4">
          <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-800"></div></div>
          <div class="relative flex justify-center text-[10px] uppercase tracking-widest font-bold"><span class="bg-[#0b0b0b] px-4 text-slate-600">Secure Environment</span></div>
        </div>

        <p class="text-center text-[10px] text-slate-600 uppercase tracking-widest font-bold">Authorized personnel only</p>
      </div>
    </div>

    <!-- Authenticated State: Admin Dashboard -->
    <div v-else>
      <nav class="bg-black/50 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div class="flex items-center gap-8">
            <span class="text-xl font-black tracking-tighter text-white">F<span class="text-blue-500">&gt;</span>F <span class="text-xs uppercase tracking-widest text-slate-500 ml-2 font-bold opacity-50">Admin</span></span>
            <div class="hidden md:flex items-center gap-1">
              <button 
                @click="currentTab = 'drops'"
                :class="['px-4 py-2 rounded-lg text-sm font-bold transition-all', currentTab === 'drops' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-500 hover:text-white hover:bg-slate-800']"
              >
                Drops
              </button>
              <button 
                @click="currentTab = 'reservations'"
                :class="['px-4 py-2 rounded-lg text-sm font-bold transition-all', currentTab === 'reservations' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-500 hover:text-white hover:bg-slate-800']"
              >
                Reservations
              </button>
              <button
                @click="currentTab = 'settings'"
                :class="['px-4 py-2 rounded-lg text-sm font-bold transition-all', currentTab === 'settings' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-500 hover:text-white hover:bg-slate-800']"
              >
                Settings
              </button>
              <button
                @click="currentTab = 'messages'"
                :class="['px-4 py-2 rounded-lg text-sm font-bold transition-all', currentTab === 'messages' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-500 hover:text-white hover:bg-slate-800']"
              >
                Messages
                <span v-if="alertCount > 0" class="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{{ alertCount > 9 ? '9+' : alertCount }}</span>
              </button>
            </div>
          </div>
          
          <div class="flex items-center gap-4">
            <!-- Notification Bell -->
            <div class="relative">
              <button
                @click="showAlertPanel = !showAlertPanel"
                class="relative p-2 text-slate-500 hover:text-white transition-colors"
                title="Notifications"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span v-if="alertCount > 0" class="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                  {{ alertCount > 9 ? '9+' : alertCount }}
                </span>
              </button>

              <!-- Notifications Dropdown -->
              <div
                v-if="showAlertPanel"
                class="absolute right-0 mt-2 w-80 bg-zinc-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                <div class="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                  <h4 class="text-sm font-bold text-white">While You Were Away</h4>
                  <button
                    v-if="alertCount > 0"
                    @click="markAllSeen"
                    class="text-[10px] uppercase tracking-widest text-blue-400 hover:text-blue-300 font-bold"
                  >
                    Mark all read
                  </button>
                </div>
                <div class="max-h-64 overflow-y-auto">
                  <div v-if="adminAlerts.length === 0" class="px-4 py-8 text-center text-slate-500 text-sm">
                    No new notifications
                  </div>
                  <div
                    v-for="note in adminAlerts"
                    :key="note.id"
                    :class="['px-4 py-3 hover:bg-slate-800/50 cursor-pointer border-b border-slate-800/50', !note.is_seen ? 'bg-blue-500/5' : '']"
                    @click="handleNotificationClick(note)"
                  >
                    <div class="flex items-start gap-3">
                      <div :class="['w-2 h-2 rounded-full mt-1.5 flex-shrink-0', note.type === 'reservation' ? 'bg-blue-500' : note.type === 'message' ? 'bg-emerald-500' : 'bg-amber-500']"></div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-white truncate">{{ note.title }}</p>
                        <p v-if="note.description" class="text-xs text-slate-500 mt-0.5 line-clamp-2">{{ note.description }}</p>
                        <p class="text-[10px] text-slate-600 mt-1">{{ formatNoteDate(note.created_at) }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              @click="showForm = true; editingDrop = null" 
              class="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              New Drop
            </button>
            <button 
              @click="handleLogout" 
              class="p-2 text-slate-500 hover:text-white transition-colors"
              title="Logout"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <!-- Welcome Header -->
        <section>
          <h1 class="text-3xl font-bold text-white tracking-tight">Manage your <span class="text-blue-500">collections</span>.</h1>
          <p class="text-slate-500 mt-1">Logged in as <span class="text-slate-300 font-medium">{{ user?.email }}</span></p>
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
        <section v-if="currentTab === 'drops'">
          <AdminDropList 
            :drops="drops" 
            @edit="handleEdit" 
            @delete="handleDelete" 
          />
        </section>

        <!-- Reservations -->
        <section v-if="currentTab === 'reservations'">
          <AdminReservations @updated="msg => notify(msg.message, msg.type)" />
        </section>

        <!-- Settings -->
        <section v-if="currentTab === 'settings'">
          <AdminSettings @updated="msg => notify(msg.message, msg.type)" />
        </section>

        <!-- Messages -->
        <section v-if="currentTab === 'messages'">
          <AdminMessages @updated="msg => notify(msg.message, msg.type)" />
        </section>
      </main>
    </div>

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
import AdminSettings from './AdminSettings.vue';
import AdminReservations from './AdminReservations.vue';
import AdminMessages from './AdminMessages.vue';
import DropService from './DropService';

const currentTab = ref('drops');
const drops = ref([]);
const showForm = ref(false);
const editingDrop = ref(null);
const notifications = ref([]);

const isAuthenticated = ref(false);
const isLoggingIn = ref(false);
const user = ref(null);
const loginEmail = ref('');
const loginPassword = ref('');
const adminAlerts = ref([]);
const alertCount = ref(0);
const showAlertPanel = ref(false);

const persistSession = (data) => {
    if (!data?.token) return;
    localStorage.setItem('fof_token', data.token);
    localStorage.setItem('fof_user', JSON.stringify({ id: data.userId, name: data.name, email: data.email }));
};

const clearSession = () => {
    localStorage.removeItem('fof_token');
    localStorage.removeItem('fof_user');
};

const checkAuth = async () => {
    try {
        const data = await DropService.verifySession();
        if (data.success) {
            isAuthenticated.value = true;
            user.value = data.user;
            await fetchDrops();
            await fetchNotifications();
        }
    } catch (error) {
        isAuthenticated.value = false;
        user.value = null;
    }
};

const handleLogin = async () => {
    isLoggingIn.value = true;
    try {
        const data = await DropService.login(loginEmail.value, loginPassword.value);
        if (data.success) {
            persistSession(data);
            isAuthenticated.value = true;
            user.value = { email: data.email, name: data.name };
            notify('Welcome back, Admin.', 'success');
            await fetchDrops();
            await fetchNotifications();
        }
    } catch (error) {
        const msg = error.response?.data?.message || 'Login failed.';
        notify(msg, 'error');
    } finally {
        isLoggingIn.value = false;
    }
};

const initiateGoogleLogin = () => {
    if (typeof google === 'undefined') {
        notify('Google services still loading. Please try again in a moment.', 'error');
        return;
    }
    // Standard Google Identity Services flow for ID tokens

    google.accounts.id.initialize({
        client_id: '982475376311-2oc1ao5h0va41pu525fniu7vma6uksf8.apps.googleusercontent.com',
        callback: async (response) => {
            if (response.credential) {
                try {
                    const data = await DropService.googleLogin(response.credential);
                    if (data.success) {
                        persistSession(data);
                        isAuthenticated.value = true;
                        user.value = { email: data.email, name: data.name };
                        notify('Welcome back, Admin.', 'success');
                        await fetchDrops();
                        await fetchNotifications();
                    }
                } catch (error) {
                    const msg = error.response?.data?.message || 'Google login failed.';
                    notify(msg, 'error');
                }
            }
        },
    });
    google.accounts.id.prompt();
};


const handleLogout = async () => {
    try {
        await DropService.logout();
        clearSession();
        isAuthenticated.value = false;
        user.value = null;
        notify('Logged out successfully.', 'success');
    } catch (error) {
        notify('Logout failed.', 'error');
    }
};

// Resolve image to a usable URL or null
const parseImage = (imageField) => {
  if (!imageField) return null;
  if (typeof imageField === 'string' && imageField.startsWith('[')) {
    try {
      const parsed = JSON.parse(imageField);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
    } catch (_) {
      return imageField;
    }
  }
  if (Array.isArray(imageField)) return imageField[0] || null;
  return imageField;
};

const fetchDrops = async () => {
  try {
    const raw = await DropService.getDrops(false, true);
    // Client-side safety normalization — ensures no undefined fields reach templates
    drops.value = (Array.isArray(raw) ? raw : []).map(drop => ({
      ...drop,
      title: (drop.title || '').trim() || 'Untitled Drop',
      description: drop.description || '',
      image: parseImage(drop.image),
      status: drop.status || 'upcoming',
      price: drop.price != null ? drop.price : 0
    }));
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
        isAuthenticated.value = false;
    }
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

const fetchNotifications = async () => {
  try {
    const [notesData, countData] = await Promise.all([
      DropService.getNotifications(true),
      DropService.getNotificationCount()
    ]);
    adminAlerts.value = notesData;
    alertCount.value = countData;
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    adminAlerts.value = [];
    alertCount.value = 0;
  }
};

const markAllSeen = async () => {
  try {
    await DropService.markAllNotificationsSeen();
    adminAlerts.value = adminAlerts.value.map(n => ({ ...n, is_seen: true }));
    alertCount.value = 0;
    notify('All notifications marked as read', 'success');
  } catch (error) {
    console.error('Failed to mark all seen:', error);
  }
};

const handleNotificationClick = async (note) => {
  try {
    await DropService.markNotificationSeen(note.id);
    note.is_seen = true;
    alertCount.value = Math.max(0, alertCount.value - 1);
    showAlertPanel.value = false;

    // Navigate to relevant tab
    if (note.type === 'message') {
      currentTab.value = 'messages';
    } else if (note.type === 'reservation') {
      currentTab.value = 'reservations';
    }
  } catch (error) {
    console.error('Failed to mark notification:', error);
  }
};

const formatNoteDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

onMounted(checkAuth);
</script>

<style>
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes slide-in-from-bottom { from { transform: translateY(1rem); } to { transform: translateY(0); } }
.animate-in { animation: fade-in 0.3s ease-out; }
.slide-in-from-bottom-4 { animation: slide-in-from-bottom 0.3s ease-out; }
</style>

