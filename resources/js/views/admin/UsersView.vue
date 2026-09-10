<template>
    <div class="space-y-6">
        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Create user accounts manually and assign system roles</p>
            </div>
            <div class="flex items-center gap-3">
                <router-link to="/admin/roles"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Manage Roles
                </router-link>
                <button @click="openCreateModal"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Create User
                </button>
            </div>
        </div>

        <!-- Search Bar -->
        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4 shadow-sm">
            <div class="relative flex-1 max-w-md">
                <svg class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input v-model="searchQuery" @input="debounceSearch" type="text" placeholder="Search users by name or email..."
                    class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <span class="text-xs text-gray-500 dark:text-gray-400">Total Users: <strong class="text-gray-900 dark:text-gray-100">{{ totalUsers }}</strong></span>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-16">
            <div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>

        <!-- Error -->
        <div v-else-if="error" class="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <p class="text-red-500 mb-4">{{ error }}</p>
            <button @click="loadUsers" class="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium">Retry</button>
        </div>

        <!-- Users Table -->
        <div v-else class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th class="px-6 py-3.5">User</th>
                            <th class="px-6 py-3.5">Email</th>
                            <th class="px-6 py-3.5">Assigned Roles</th>
                            <th class="px-6 py-3.5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                        <tr v-if="users.length === 0">
                            <td colspan="4" class="px-6 py-12 text-center text-gray-400">No users found.</td>
                        </tr>
                        <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold flex items-center justify-center text-sm">
                                        {{ user.name.charAt(0).toUpperCase() }}
                                    </div>
                                    <div>
                                        <div class="font-medium text-gray-900 dark:text-gray-100">{{ user.name }}</div>
                                        <div class="text-xs text-gray-400">ID: #{{ user.id }}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono text-xs">{{ user.email }}</td>
                            <td class="px-6 py-4">
                                <div class="flex flex-wrap gap-1.5">
                                    <span v-for="role in (user.roles || [])" :key="role.id"
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                                        {{ role.display_name || role.name }}
                                    </span>
                                    <span v-if="!user.roles || user.roles.length === 0" class="text-xs text-gray-400 italic">No Role</span>
                                </div>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <div class="flex items-center justify-end gap-2">
                                    <button @click="openEditModal(user)"
                                        class="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        title="Edit User">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button @click="confirmDelete(user)"
                                        class="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Delete User">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Create User Modal -->
        <div v-if="createModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 class="font-semibold text-gray-900 dark:text-gray-100">Create New User</h2>
                    <button @click="createModalOpen = false" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <!-- Credentials Success Screen -->
                <div v-if="createdCredentials" class="p-6 space-y-4">
                    <div class="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 text-sm">
                        <div class="flex items-center gap-2 text-green-700 dark:text-green-300 font-semibold mb-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                            User Created Successfully!
                        </div>
                        <p class="text-gray-600 dark:text-gray-300 mb-3 text-xs">
                            Hand over these credentials to the user so they can log in:
                        </p>
                        <div class="bg-white dark:bg-gray-800 p-3 rounded border border-green-300 dark:border-green-700 space-y-1.5 font-mono text-xs">
                            <div><span class="text-gray-400">Name:</span> <strong class="text-gray-800 dark:text-gray-200">{{ createdCredentials.name }}</strong></div>
                            <div><span class="text-gray-400">Email:</span> <strong class="text-gray-800 dark:text-gray-200">{{ createdCredentials.email }}</strong></div>
                            <div><span class="text-gray-400">Password:</span> <strong class="text-blue-600 dark:text-blue-400">{{ createdCredentials.password }}</strong></div>
                        </div>
                    </div>

                    <div class="flex justify-end gap-2 pt-2">
                        <button @click="copyCredentials" class="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-lg text-gray-700 dark:text-gray-200">
                            {{ copied ? 'Copied!' : 'Copy Credentials' }}
                        </button>
                        <button @click="closeCreateSuccess" class="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                            Done
                        </button>
                    </div>
                </div>

                <!-- Form -->
                <form v-else @submit.prevent="submitCreateUser" class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                        <input v-model="createForm.name" type="text" placeholder="John Doe" required
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                        <input v-model="createForm.email" type="email" placeholder="user@company.com" required
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                            <button type="button" @click="generatePassword" class="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">Generate Random</button>
                        </div>
                        <input v-model="createForm.password" type="text" placeholder="Minimum 6 characters" required
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none font-mono focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign Role</label>
                        <select v-model="createForm.role_id"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">No role assigned</option>
                            <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.display_name || role.name }}</option>
                        </select>
                    </div>

                    <div class="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <button type="button" @click="createModalOpen = false" class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                        <button type="submit" :disabled="submitting" class="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg">
                            {{ submitting ? 'Creating...' : 'Create User' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Edit User Modal -->
        <div v-if="editModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 class="font-semibold text-gray-900 dark:text-gray-100">Edit User</h2>
                    <button @click="editModalOpen = false" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form @submit.prevent="submitEditUser" class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                        <input v-model="editForm.name" type="text" required
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                        <input v-model="editForm.email" type="email" required
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password <span class="text-gray-400 font-normal">(Leave blank to keep unchanged)</span></label>
                        <input v-model="editForm.password" type="text" placeholder="New password..."
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none font-mono focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign Role</label>
                        <select v-model="editForm.role_id"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">No role assigned</option>
                            <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.display_name || role.name }}</option>
                        </select>
                    </div>

                    <div class="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <button type="button" @click="editModalOpen = false" class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                        <button type="submit" :disabled="submitting" class="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg">
                            {{ submitting ? 'Saving...' : 'Save Changes' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/axios';

interface Role { id: number; name: string; display_name: string; }
interface User { id: number; name: string; email: string; roles?: Role[]; }

const users = ref<User[]>([]);
const roles = ref<Role[]>([]);
const totalUsers = ref(0);
const loading = ref(true);
const error = ref<string | null>(null);
const searchQuery = ref('');

const createModalOpen = ref(false);
const editModalOpen = ref(false);
const submitting = ref(false);
const copied = ref(false);

const createForm = ref({ name: '', email: '', password: '', role_id: '' as string | number });
const editForm = ref({ id: 0, name: '', email: '', password: '', role_id: '' as string | number });
const createdCredentials = ref<{ name: string; email: string; password: string } | null>(null);

let debounceTimeout: any = null;

async function loadUsers() {
    loading.value = true;
    error.value = null;
    try {
        const [usersRes, rolesRes] = await Promise.all([
            api.get('/users', { params: { search: searchQuery.value } }),
            api.get('/roles')
        ]);
        users.value = usersRes.data?.data ?? [];
        totalUsers.value = usersRes.data?.meta?.total ?? users.value.length;
        roles.value = rolesRes.data?.data ?? [];
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Failed to load users.';
    } finally {
        loading.value = false;
    }
}

function debounceSearch() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        loadUsers();
    }, 300);
}

onMounted(loadUsers);

function openCreateModal() {
    createForm.value = { name: '', email: '', password: '', role_id: '' };
    createdCredentials.value = null;
    createModalOpen.value = true;
}

function generatePassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    createForm.value.password = pwd;
}

async function submitCreateUser() {
    submitting.value = true;
    try {
        await api.post('/users', {
            name: createForm.value.name,
            email: createForm.value.email,
            password: createForm.value.password,
            role_id: createForm.value.role_id || undefined,
        });

        createdCredentials.value = {
            name: createForm.value.name,
            email: createForm.value.email,
            password: createForm.value.password,
        };

        await loadUsers();
    } catch (e: any) {
        alert(e?.response?.data?.message ?? 'Failed to create user.');
    } finally {
        submitting.value = false;
    }
}

function copyCredentials() {
    if (!createdCredentials.value) return;
    const text = `Account Credentials:\nEmail: ${createdCredentials.value.email}\nPassword: ${createdCredentials.value.password}`;
    navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
}

function closeCreateSuccess() {
    createdCredentials.value = null;
    createModalOpen.value = false;
}

function openEditModal(user: User) {
    const primaryRole = user.roles && user.roles.length > 0 ? user.roles[0].id : '';
    editForm.value = {
        id: user.id,
        name: user.name,
        email: user.email,
        password: '',
        role_id: primaryRole,
    };
    editModalOpen.value = true;
}

async function submitEditUser() {
    submitting.value = true;
    try {
        const payload: any = {
            name: editForm.value.name,
            email: editForm.value.email,
            role_id: editForm.value.role_id || '',
        };
        if (editForm.value.password) {
            payload.password = editForm.value.password;
        }

        await api.put(`/users/${editForm.value.id}`, payload);
        editModalOpen.value = false;
        await loadUsers();
    } catch (e: any) {
        alert(e?.response?.data?.message ?? 'Failed to update user.');
    } finally {
        submitting.value = false;
    }
}

async function confirmDelete(user: User) {
    if (!confirm(`Are you sure you want to delete user "${user.name}" (${user.email})?`)) return;
    try {
        await api.delete(`/users/${user.id}`);
        await loadUsers();
    } catch (e: any) {
        alert(e?.response?.data?.message ?? 'Failed to delete user.');
    }
}
</script>
