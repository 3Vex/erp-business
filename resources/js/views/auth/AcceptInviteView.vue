<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div class="max-w-md w-full">
            <!-- Loading token validation -->
            <div v-if="validating" class="text-center py-12">
                <div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p class="text-gray-500 dark:text-gray-400">Validating invitation...</p>
            </div>

            <!-- Invalid/Expired -->
            <div v-else-if="!invitation" class="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center">
                <div class="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Invalid Invitation</h2>
                <p class="text-gray-500 dark:text-gray-400 mb-6">{{ tokenError }}</p>
                <router-link to="/login" class="text-blue-600 hover:text-blue-500 text-sm">Back to Login</router-link>
            </div>

            <!-- Accept Form -->
            <div v-else class="space-y-6">
                <div class="text-center">
                    <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100">RIS ERP</h2>
                    <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        You have been invited{{ invitation.role ? ' as <strong>' + invitation.role + '</strong>' : '' }}
                    </p>
                </div>

                <form @submit.prevent="handleAccept" class="bg-white dark:bg-gray-800 p-8 rounded-xl shadow space-y-4">
                    <div v-if="error" class="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                        {{ error }}
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <input :value="invitation.email" disabled type="email"
                            class="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Name</label>
                        <input v-model="form.name" type="text" required placeholder="Full Name"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                        <input v-model="form.password" type="password" required minlength="8"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                        <input v-model="form.password_confirmation" type="password" required
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <button type="submit" :disabled="loading"
                        class="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-sm">
                        {{ loading ? 'Creating account...' : 'Create Account & Login' }}
                    </button>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/api/axios';

interface InvitationInfo { email: string; name: string | null; role: string | null; }

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const token = route.params.token as string;
const validating = ref(true);
const invitation = ref<InvitationInfo | null>(null);
const tokenError = ref('This invitation link is invalid or has expired.');
const error = ref('');
const loading = ref(false);

const form = ref({ name: '', password: '', password_confirmation: '' });

onMounted(async () => {
    try {
        const res = await api.get(`/invitations/${token}/validate`);
        invitation.value = res.data?.data ?? res.data;
        if (invitation.value?.name) form.value.name = invitation.value.name;
    } catch (e: any) {
        tokenError.value = e?.response?.data?.message ?? 'This invitation link is invalid or has expired.';
        invitation.value = null;
    } finally {
        validating.value = false;
    }
});

async function handleAccept() {
    error.value = '';
    loading.value = true;
    try {
        const res = await api.post('/invitations/accept', {
            token,
            name: form.value.name,
            password: form.value.password,
            password_confirmation: form.value.password_confirmation,
        });
        const data = res.data;
        authStore.token = data.token;
        authStore.user = data.user;
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        router.push('/dashboard');
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Failed to create account. Please try again.';
    } finally {
        loading.value = false;
    }
}
</script>
