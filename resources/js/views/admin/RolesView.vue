<template>
    <div>
        <!-- Page Header -->
        <div class="flex items-center justify-between mb-6">
            <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Role Management</h1>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage roles and permissions for system users</p>
            </div>
            <div class="flex items-center gap-2">
                <button @click="inviteModalOpen = true"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Invite User
                </button>
                <button @click="openCreateModal"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Create Role
                </button>
            </div>
        </div>


        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-16">
            <div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>

        <!-- Error -->
        <div v-else-if="error" class="text-center py-16">
            <p class="text-red-500 mb-4">{{ error }}</p>
            <button @click="loadRoles" class="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">Retry</button>
        </div>

        <!-- Roles Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div v-for="role in roles" :key="role.id"
                class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition-shadow"
                :class="{ 'border-l-4 border-l-blue-500': role.is_system }">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <div :class="['w-10 h-10 rounded-lg flex items-center justify-center', role.is_system ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-500']">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900 dark:text-gray-100">{{ role.display_name }}</h3>
                            <span class="text-xs text-gray-400 font-mono">{{ role.name }}</span>
                        </div>
                    </div>
                    <span v-if="role.is_system" class="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">System</span>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4 min-h-[2.5rem]">{{ role.description || 'No description.' }}</p>
                <div class="flex items-center gap-4 text-xs text-gray-400 mb-4 border-t border-gray-100 dark:border-gray-700 pt-3">
                    <span>{{ role.users_count ?? 0 }} users</span>
                    <span>{{ role.permissions?.length ?? 0 }} permissions</span>
                </div>
                <div class="flex items-center gap-2">
                    <button @click="openPermissionsModal(role)"
                        class="flex-1 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        Manage Permissions
                    </button>
                    <button v-if="!role.is_system" @click="deleteRole(role)"
                        class="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- Create Modal -->
        <div v-if="createModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4">
                <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 class="font-semibold text-gray-900 dark:text-gray-100">Create New Role</h2>
                    <button @click="createModalOpen = false" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form @submit.prevent="createRole" class="px-6 py-4 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role Slug</label>
                        <input v-model="createForm.name" type="text" placeholder="role_name" required
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none font-mono focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                        <input v-model="createForm.display_name" type="text" placeholder="Sales Manager" required
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea v-model="createForm.description" rows="3"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none resize-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div class="flex justify-end gap-3 pt-2">
                        <button type="button" @click="createModalOpen = false" class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                        <button type="submit" :disabled="creating" class="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg">
                            {{ creating ? 'Creating...' : 'Create Role' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Permissions Modal -->
        <div v-if="permissionsModalOpen && selectedRole" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
                <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h2 class="font-semibold text-gray-900 dark:text-gray-100">Permissions — {{ selectedRole.display_name }}</h2>
                    <button @click="permissionsModalOpen = false" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div v-if="permissionsLoading" class="flex items-center justify-center py-12">
                    <div class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <div v-else class="overflow-y-auto flex-1 px-6 py-4 space-y-3">
                    <div v-for="(perms, module) in groupedPermissions" :key="module"
                        class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div class="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 flex items-center gap-2">
                            <input type="checkbox"
                                :checked="isModuleFullyChecked(String(module))"
                                @change="toggleModule(String(module), ($event.target as HTMLInputElement).checked)"
                                class="rounded border-gray-300 text-blue-600" />
                            <span class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{{ module }}</span>
                        </div>
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
                            <label v-for="perm in perms" :key="perm.id"
                                class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                <input type="checkbox" :value="perm.id" v-model="selectedPermissionIds" class="rounded border-gray-300 text-blue-600" />
                                {{ perm.display_name.split(' ')[0] }}
                            </label>
                        </div>
                    </div>
                </div>
                <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 flex-shrink-0">
                    <button @click="permissionsModalOpen = false" class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                    <button @click="savePermissions" :disabled="savingPermissions" class="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg">
                        {{ savingPermissions ? 'Saving...' : 'Save Permissions' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Invite User Modal -->
        <div v-if="inviteModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4">
                <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 class="font-semibold text-gray-900 dark:text-gray-100">Invite New User</h2>
                    <button @click="inviteModalOpen = false" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form @submit.prevent="sendInvite" class="px-6 py-4 space-y-4">
                    <div v-if="inviteSuccess" class="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-3 rounded-lg text-sm">
                        ✓ Invitation sent to {{ inviteForm.email }}
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                        <input v-model="inviteForm.email" type="email" required placeholder="user@company.com"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name <span class="text-gray-400 font-normal">(optional)</span></label>
                        <input v-model="inviteForm.name" type="text" placeholder="John Doe"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign Role <span class="text-gray-400 font-normal">(optional)</span></label>
                        <select v-model="inviteForm.role_id"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-500">
                            <option value="">No role assigned</option>
                            <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.display_name }}</option>
                        </select>
                    </div>
                    <div class="flex justify-end gap-3 pt-2">
                        <button type="button" @click="inviteModalOpen = false" class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                        <button type="submit" :disabled="inviting" class="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg">
                            {{ inviting ? 'Sending...' : 'Send Invitation' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/api/axios';

interface Permission { id: number; name: string; display_name: string; module: string; }
interface Role { id: number; name: string; display_name: string; description: string | null; is_system: boolean; users_count?: number; permissions?: Permission[]; }

const roles = ref<Role[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const createModalOpen = ref(false);
const creating = ref(false);
const createForm = ref({ name: '', display_name: '', description: '' });

// Invite
const inviteModalOpen = ref(false);
const inviting = ref(false);
const inviteSuccess = ref(false);
const inviteForm = ref({ email: '', name: '', role_id: '' as string | number });

const permissionsModalOpen = ref(false);
const permissionsLoading = ref(false);
const selectedRole = ref<Role | null>(null);
const allPermissions = ref<Permission[]>([]);
const selectedPermissionIds = ref<number[]>([]);
const savingPermissions = ref(false);

async function loadRoles() {
    loading.value = true; error.value = null;
    try { const res = await api.get('/roles'); roles.value = res.data?.data ?? res.data ?? []; }
    catch (e: any) { error.value = e?.response?.data?.message ?? 'Failed to load roles.'; }
    finally { loading.value = false; }
}
onMounted(loadRoles);

function openCreateModal() { createForm.value = { name: '', display_name: '', description: '' }; createModalOpen.value = true; }

async function createRole() {
    creating.value = true;
    try { await api.post('/roles', createForm.value); createModalOpen.value = false; await loadRoles(); }
    catch (e: any) { alert(e?.response?.data?.message ?? 'Failed to create role.'); }
    finally { creating.value = false; }
}

async function deleteRole(role: Role) {
    if (!confirm(`Delete role "${role.display_name}"?`)) return;
    try { await api.delete(`/roles/${role.id}`); await loadRoles(); }
    catch (e: any) { alert(e?.response?.data?.message ?? 'Failed to delete role.'); }
}

async function sendInvite() {
    inviting.value = true;
    inviteSuccess.value = false;
    try {
        await api.post('/invitations', {
            email: inviteForm.value.email,
            name: inviteForm.value.name || undefined,
            role_id: inviteForm.value.role_id || undefined,
        });
        inviteSuccess.value = true;
        inviteForm.value = { email: '', name: '', role_id: '' };
    } catch (e: any) {
        alert(e?.response?.data?.message ?? 'Failed to send invitation.');
    } finally {
        inviting.value = false;
    }
}

const groupedPermissions = computed(() =>
    allPermissions.value.reduce((acc, p) => { (acc[p.module] ??= []).push(p); return acc; }, {} as Record<string, Permission[]>)
);

async function openPermissionsModal(role: Role) {
    selectedRole.value = role; permissionsModalOpen.value = true; permissionsLoading.value = true;
    try {
        const [roleRes, permRes] = await Promise.all([api.get(`/roles/${role.id}`), api.get('/roles/permissions')]);
        const roleData: Role = roleRes.data?.data ?? roleRes.data;
        allPermissions.value = permRes.data?.data ?? permRes.data ?? [];
        selectedPermissionIds.value = (roleData.permissions ?? []).map((p: Permission) => p.id);
    } catch { alert('Failed to load permissions.'); permissionsModalOpen.value = false; }
    finally { permissionsLoading.value = false; }
}

function isModuleFullyChecked(module: string) {
    const ids = (groupedPermissions.value[module] ?? []).map(p => p.id);
    return ids.length > 0 && ids.every(id => selectedPermissionIds.value.includes(id));
}

function toggleModule(module: string, checked: boolean) {
    const ids = (groupedPermissions.value[module] ?? []).map(p => p.id);
    if (checked) { selectedPermissionIds.value.push(...ids.filter(id => !selectedPermissionIds.value.includes(id))); }
    else { selectedPermissionIds.value = selectedPermissionIds.value.filter(id => !ids.includes(id)); }
}

async function savePermissions() {
    if (!selectedRole.value) return;
    savingPermissions.value = true;
    try { await api.put(`/roles/${selectedRole.value.id}/permissions`, { permission_ids: selectedPermissionIds.value }); permissionsModalOpen.value = false; await loadRoles(); }
    catch (e: any) { alert(e?.response?.data?.message ?? 'Failed to save.'); }
    finally { savingPermissions.value = false; }
}
</script>
