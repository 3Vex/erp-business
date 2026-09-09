/**
 * TPT Free ERP - Main Application
 * Application initialization and main logic
 */

class App {
    constructor() {
        this.isInitialized = false;
        this.currentView = null;
        this.components = new Map();
        this.eventListeners = new Map();

        // Bind methods
        this.handleDOMContentLoaded = this.handleDOMContentLoaded.bind(this);
        this.handleOnlineStatusChange = this.handleOnlineStatusChange.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.isInitialized) return;

        try {
            console.log('Initializing TPT Free ERP...');

            // Setup global error handlers
            this.setupErrorHandlers();

            // Setup event listeners
            this.setupEventListeners();

            // Initialize core systems
            await this.initializeCoreSystems();

            // Setup routing
            this.setupRouting();

            // Setup UI components
            this.setupUI();

            // Load initial data
            await this.loadInitialData();

            // Setup PWA features
            this.setupPWA();

            // Mark as initialized
            this.isInitialized = true;

            console.log('TPT Free ERP initialized successfully');

            // Hide loading screen
            this.hideLoadingScreen();

            // Show welcome message
            this.showWelcomeMessage();

        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Setup global error handlers
     */
    setupErrorHandlers() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            if (CONFIG.ERRORS.LOG_TO_SERVER) {
                this.logErrorToServer(event.reason);
            }
        });

        // Handle JavaScript errors
        window.addEventListener('error', (event) => {
            console.error('JavaScript error:', event.error);
            if (CONFIG.ERRORS.LOG_TO_SERVER) {
                this.logErrorToServer(event.error);
            }
        });

        // Handle console errors in development
        if (CONFIG.APP.DEBUG) {
            const originalConsoleError = console.error;
            console.error = (...args) => {
                originalConsoleError.apply(console, args);
                // Could send to error reporting service
            };
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', this.handleDOMContentLoaded);
        } else {
            this.handleDOMContentLoaded();
        }

        // Online/offline status
        window.addEventListener('online', this.handleOnlineStatusChange);
        window.addEventListener('offline', this.handleOnlineStatusChange);

        // Page visibility
        document.addEventListener('visibilitychange', this.handleVisibilityChange);

        // Before unload
        window.addEventListener('beforeunload', this.handleBeforeUnload);

        // Window resize
        window.addEventListener('resize', debounce(this.handleResize, 250));

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeydown);

        // Custom events
        document.addEventListener('app:navigate', (e) => this.handleNavigation(e.detail));
        document.addEventListener('app:notification', (e) => this.showNotification(e.detail));
        document.addEventListener('app:modal', (e) => this.showModal(e.detail));
    }

    /**
     * Initialize core systems
     */
    async initializeCoreSystems() {
        // Check authentication status
        await this.checkAuthentication();

        // Initialize state management
        this.initializeState();

        // Initialize API client
        this.initializeAPI();

        // Initialize router
        this.initializeRouter();

        // Initialize components
        this.initializeComponents();
    }

    /**
     * Check user authentication
     */
    async checkAuthentication() {
        try {
            if (API.isAuthenticated()) {
                // Get current user data
                const userData = await API.getCurrentUser();
                State.set('user.currentUser', userData);
                State.set('user.isAuthenticated', true);

                // Update UI
                this.updateUserUI(userData);
            } else {
                State.set('user.isAuthenticated', false);
                State.set('user.currentUser', null);
            }
        } catch (error) {
            console.warn('Authentication check failed:', error);
            State.set('user.isAuthenticated', false);
        }
    }

    /**
     * Initialize state management
     */
    initializeState() {
        // Setup state change listeners
        State.subscribe('user.isAuthenticated', (isAuthenticated) => {
            this.handleAuthenticationChange(isAuthenticated);
        });

        State.subscribe('ui.sidebarCollapsed', (collapsed) => {
            this.handleSidebarToggle(collapsed);
        });

        State.subscribe('system.online', (online) => {
            this.handleOnlineStatusChange({ type: online ? 'online' : 'offline' });
        });
    }

    /**
     * Initialize API client
     */
    initializeAPI() {
        // Setup API interceptors
        this.setupAPIInterceptors();
    }

    /**
     * Setup API interceptors
     */
    setupAPIInterceptors() {
        // Add request interceptor for authentication
        const originalRequest = API.request;
        API.request = async (method, endpoint, data, options) => {
            try {
                const result = await originalRequest.call(API, method, endpoint, data, options);
                return result;
            } catch (error) {
                // Handle authentication errors
                if (error.status === 401) {
                    State.set('user.isAuthenticated', false);
                    this.showLoginRequired();
                }
                throw error;
            }
        };

        // Add response interceptor for error handling
        // This would be more complex in a real implementation
    }

    /**
     * Initialize router
     */
    initializeRouter() {
        // Setup routes
        this.setupRoutes();

        // Setup router middlewares
        Router.use(async (context) => {
            // Check authentication for protected routes
            if (context.meta?.requiresAuth && !State.get('user.isAuthenticated')) {
                Router.navigate('/login');
                return;
            }

            // Set page title
            if (context.meta?.title) {
                document.title = `${context.meta.title} - ${CONFIG.APP.NAME}`;
            }

            // Update breadcrumbs
            this.updateBreadcrumbs(context);
        });
    }

    /**
     * Setup application routes
     */
    setupRoutes() {
        // Public routes
        Router.addRoute('/', () => this.showDashboard(), {
            meta: { title: 'Dashboard' }
        });

        Router.addRoute('/login', () => this.showLogin(), {
            meta: { title: 'Login' }
        });

        Router.addRoute('/register', () => this.showRegister(), {
            meta: { title: 'Register' }
        });

        // Protected routes
        Router.addRoute('/dashboard', () => this.showDashboard(), {
            meta: { title: 'Dashboard', requiresAuth: true }
        });

        // Module routes
        const modules = ['finance', 'inventory', 'sales', 'hr', 'projects', 'quality', 'assets', 'field-service', 'lms', 'iot'];
        modules.forEach(module => {
            Router.addRoute(`/${module}`, () => this.showModule(module), {
                meta: { title: StringUtils.capitalize(module), requiresAuth: true }
            });
        });

        // Settings and profile
        Router.addRoute('/settings', () => this.showSettings(), {
            meta: { title: 'Settings', requiresAuth: true }
        });

        Router.addRoute('/profile', () => this.showProfile(), {
            meta: { title: 'Profile', requiresAuth: true }
        });

        // Admin routes
        Router.addRoute('/admin/users', () => this.showUserManagement(), {
            meta: { title: 'User Management', requiresAuth: true, requiresAdmin: true }
        });

        Router.addRoute('/admin/roles', () => this.showRoleManagement(), {
            meta: { title: 'Role Management', requiresAuth: true, requiresAdmin: true }
        });

        // 404 route
        Router.addRoute('/404', () => this.show404(), {
            meta: { title: 'Page Not Found' }
        });
    }

    /**
     * Initialize components
     */
    initializeComponents() {
        // Initialize global components
        this.initializeNotifications();
        this.initializeModals();
        this.initializeSearch();
    }

    /**
     * Setup UI components
     */
    setupUI() {
        // Setup sidebar toggle
        DOM.on('click', '#sidebar-toggle', () => {
            const collapsed = State.get('ui.sidebarCollapsed');
            State.set('ui.sidebarCollapsed', !collapsed);
        });

        // Setup notifications panel
        DOM.on('click', '#notifications-btn', () => {
            this.toggleNotificationsPanel();
        });

        // Setup user menu
        DOM.on('click', '#user-menu-btn', () => {
            this.toggleUserDropdown();
        });

        // Setup global search
        DOM.on('input', '#global-search', debounce((e) => {
            this.handleGlobalSearch(e.target.value);
        }, CONFIG.SEARCH.DEBOUNCE_DELAY));

        // Setup theme toggle (if implemented)
        this.setupThemeToggle();
    }

    /**
     * Load initial application data
     */
    async loadInitialData() {
        try {
            // Load user preferences
            if (State.get('user.isAuthenticated')) {
                await this.loadUserPreferences();
            }

            // Load application settings
            await this.loadAppSettings();

            // Load module data
            await this.loadModulesData();

        } catch (error) {
            console.warn('Failed to load initial data:', error);
        }
    }

    /**
     * Setup PWA features
     */
    setupPWA() {
        if ('serviceWorker' in navigator && CONFIG.PWA.ENABLED) {
            // Service worker is already registered in index.html
            this.setupInstallPrompt();
        }

        // Setup offline detection
        this.setupOfflineDetection();
    }

    /**
     * Handle DOM content loaded
     */
    handleDOMContentLoaded() {
        // Application is ready
        console.log('DOM content loaded');
    }

    /**
     * Handle online/offline status changes
     */
    handleOnlineStatusChange(event) {
        const isOnline = navigator.onLine;
        State.set('system.online', isOnline);

        if (isOnline) {
            this.showNotification({
                type: 'success',
                message: 'Connection restored'
            });
        } else {
            this.showNotification({
                type: 'warning',
                message: 'You are currently offline'
            });
        }
    }

    /**
     * Handle page visibility changes
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden
            this.handlePageHidden();
        } else {
            // Page is visible
            this.handlePageVisible();
        }
    }

    /**
     * Handle before unload
     */
    handleBeforeUnload(event) {
        // Save any pending changes
        this.savePendingChanges();

        // Show confirmation dialog for unsaved changes
        if (this.hasUnsavedChanges()) {
            event.preventDefault();
            event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Update responsive layout
        this.updateResponsiveLayout();

        // Close mobile menus if needed
        if (window.innerWidth > 1024) {
            this.closeMobileMenus();
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeydown(event) {
        // Global shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'k':
                    event.preventDefault();
                    this.focusSearch();
                    break;
                case 'b':
                    event.preventDefault();
                    this.toggleSidebar();
                    break;
                case '/':
                    event.preventDefault();
                    this.showKeyboardShortcuts();
                    break;
            }
        }

        // Escape key
        if (event.key === 'Escape') {
            this.handleEscapeKey();
        }
    }

    /**
     * Handle navigation events
     */
    handleNavigation(route) {
        Router.navigate(route);
    }

    /**
     * Handle authentication changes
     */
    handleAuthenticationChange(isAuthenticated) {
        if (isAuthenticated) {
            // User logged in
            this.showAuthenticatedUI();
        } else {
            // User logged out
            this.showUnauthenticatedUI();
        }
    }

    /**
     * Handle sidebar toggle
     */
    handleSidebarToggle(collapsed) {
        const sidebar = DOM.$('#app-sidebar');
        const main = DOM.$('#app-main');

        if (collapsed) {
            DOM.addClass(sidebar, 'collapsed');
            DOM.addClass(main, 'sidebar-collapsed');
        } else {
            DOM.removeClass(sidebar, 'collapsed');
            DOM.removeClass(main, 'sidebar-collapsed');
        }
    }

    /**
     * Show dashboard
     */
    showDashboard() {
        const mainContent = DOM.$('#main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="dashboard">
                    <div class="dashboard-header">
                        <h1>Dashboard</h1>
                        <div class="dashboard-actions">
                            <button class="btn btn-primary" onclick="App.refreshDashboard()">
                                <i class="fas fa-sync-alt"></i> Refresh
                            </button>
                        </div>
                    </div>
                    <div class="dashboard-content">
                        <div class="dashboard-widgets">
                            <div class="widget">
                                <h3>Quick Stats</h3>
                                <div class="stats-grid">
                                    <div class="stat-item">
                                        <span class="stat-value">0</span>
                                        <span class="stat-label">Active Projects</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-value">0</span>
                                        <span class="stat-label">Pending Tasks</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-value">0</span>
                                        <span class="stat-label">Open Orders</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Show login form
     */
    showLogin() {
        const mainContent = DOM.$('#main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="auth-container">
                    <div class="auth-card">
                        <h2>Login to TPT ERP</h2>
                        <form id="login-form" class="auth-form">
                            <div class="form-group">
                                <label for="email">Email</label>
                                <input type="email" id="email" name="email" required>
                            </div>
                            <div class="form-group">
                                <label for="password">Password</label>
                                <input type="password" id="password" name="password" required>
                            </div>
                            <button type="submit" class="btn btn-primary btn-block">Login</button>
                        </form>
                        <div class="auth-links">
                            <a href="#" onclick="Router.navigate('/register')">Create Account</a>
                            <a href="#" onclick="App.showForgotPassword()">Forgot Password?</a>
                        </div>
                    </div>
                </div>
            `;

            // Setup form submission
            const form = DOM.$('#login-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleLogin(new FormData(form));
                });
            }
        }
    }

    /**
     * Handle login
     */
    async handleLogin(formData) {
        try {
            State.set('ui.loading', true);

            const credentials = {
                email: formData.get('email'),
                password: formData.get('password')
            };

            const response = await API.login(credentials);

            this.showNotification({
                type: 'success',
                message: 'Login successful'
            });

            Router.navigate('/dashboard');

        } catch (error) {
            this.showNotification({
                type: 'error',
                message: error.message || 'Login failed'
            });
        } finally {
            State.set('ui.loading', false);
        }
    }

    /**
     * Show notification
     */
    showNotification(options) {
        const notification = new Notification({
            type: options.type || 'info',
            title: options.title,
            message: options.message,
            duration: options.duration || CONFIG.NOTIFICATIONS.TYPES[options.type]?.duration || 5000
        });

        const container = DOM.$('#toast-container');
        if (container) {
            notification.mount(container);
        }
    }

    /**
     * Show modal
     */
    showModal(options) {
        const modal = new Modal({
            title: options.title,
            size: options.size || 'medium',
            closable: options.closable !== false,
            children: options.content,
            onClose: options.onClose
        });

        const container = DOM.$('#modals-container');
        if (container) {
            modal.mount(container);
        }
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = DOM.$('#loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 300);
        }
    }

    /**
     * Show welcome message
     */
    showWelcomeMessage() {
        setTimeout(() => {
            this.showNotification({
                type: 'info',
                title: 'Welcome',
                message: 'Welcome to TPT Free ERP!'
            });
        }, 1000);
    }

    /**
     * Show error message
     */
    showError(message) {
        const mainContent = DOM.$('#main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error-page">
                    <h1>Error</h1>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">
                        Reload Page
                    </button>
                </div>
            `;
        }
    }

    /**
     * Utility methods
     */
    focusSearch() {
        const searchInput = DOM.$('#global-search');
        if (searchInput) {
            searchInput.focus();
        }
    }

    toggleSidebar() {
        const collapsed = State.get('ui.sidebarCollapsed');
        State.set('ui.sidebarCollapsed', !collapsed);
    }

    showKeyboardShortcuts() {
        this.showModal({
            title: 'Keyboard Shortcuts',
            content: `
                <div class="shortcuts-list">
                    <div class="shortcut-item">
                        <kbd>Ctrl+K</kbd>
                        <span>Focus search</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Ctrl+B</kbd>
                        <span>Toggle sidebar</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Ctrl+/</kbd>
                        <span>Show shortcuts</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Esc</kbd>
                        <span>Close modals</span>
                    </div>
                </div>
            `
        });
    }

    handleEscapeKey() {
        // Close modals, dropdowns, etc.
        this.closeAllOverlays();
    }

    closeAllOverlays() {
        // Close user dropdown
        const dropdown = DOM.$('#user-dropdown');
        if (dropdown) {
            DOM.removeClass(dropdown, 'show');
        }

        // Close notifications panel
        this.closeNotificationsPanel();

        // Close modals
        const modals = DOM.$$('.modal-overlay');
        modals.forEach(modal => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        });
    }

    toggleNotificationsPanel() {
        const panel = DOM.$('#notifications-panel');
        if (panel) {
            DOM.toggleClass(panel, 'show');
        }
    }

    closeNotificationsPanel() {
        const panel = DOM.$('#notifications-panel');
        if (panel) {
            DOM.removeClass(panel, 'show');
        }
    }

    toggleUserDropdown() {
        const dropdown = DOM.$('#user-dropdown');
        if (dropdown) {
            DOM.toggleClass(dropdown, 'show');
        }
    }

    updateUserUI(user) {
        const userName = DOM.$('#user-name');
        if (userName) {
            userName.textContent = user.first_name || user.username || 'User';
        }
    }

    handleGlobalSearch(query) {
        State.set('ui.search.query', query);

        if (query.length >= CONFIG.SEARCH.MIN_QUERY_LENGTH) {
            // Perform search
            this.performSearch(query);
        } else {
            State.set('ui.search.results', []);
        }
    }

    async performSearch(query) {
        try {
            State.set('ui.search.isSearching', true);

            // This would call the search API
            // const results = await API.search(query);
            const results = []; // Mock results

            State.set('ui.search.results', results);

        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            State.set('ui.search.isSearching', false);
        }
    }

    updateBreadcrumbs(context) {
        // Update breadcrumbs based on current route
        const breadcrumbs = [];

        if (context.params) {
            Object.entries(context.params).forEach(([key, value]) => {
                breadcrumbs.push({
                    label: StringUtils.capitalize(key),
                    value: value
                });
            });
        }

        State.set('navigation.breadcrumbs', breadcrumbs);
    }

    hasUnsavedChanges() {
        // Check if there are unsaved changes
        return false; // Implement based on your needs
    }

    savePendingChanges() {
        // Save any pending changes
    }

    updateResponsiveLayout() {
        // Update layout for different screen sizes
    }

    closeMobileMenus() {
        // Close mobile-specific menus
    }

    handlePageHidden() {
        // Handle page becoming hidden
    }

    handlePageVisible() {
        // Handle page becoming visible
        // Could refresh data or check for updates
    }

    setupThemeToggle() {
        // Setup theme toggle functionality
    }

    showAuthenticatedUI() {
        // Show UI for authenticated users
    }

    showUnauthenticatedUI() {
        // Show UI for unauthenticated users
    }

    showLoginRequired() {
        this.showModal({
            title: 'Login Required',
            content: 'Please log in to access this feature.',
            onClose: () => Router.navigate('/login')
        });
    }

    async loadUserPreferences() {
        // Load user preferences from API
    }

    async loadAppSettings() {
        // Load application settings
    }

    async loadModulesData() {
        // Load data for enabled modules
    }

    setupInstallPrompt() {
        // Setup PWA install prompt
    }

    setupOfflineDetection() {
        // Setup offline detection and sync
    }

    initializeNotifications() {
        // Initialize notification system
    }

    initializeModals() {
        // Initialize modal system
    }

    initializeSearch() {
        // Initialize search functionality
    }

    showModule(module) {
        // Show specific module
        const mainContent = DOM.$('#main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="module-container">
                    <h1>${StringUtils.capitalize(module)} Module</h1>
                    <p>This module is coming soon...</p>
                </div>
            `;
        }
    }

    showSettings() {
        // Show settings page
    }

    showProfile() {
        // Show user profile
    }

    showUserManagement() {
        // Show user management (admin)
    }

    async showRoleManagement() {
        const mainContent = DOM.$('#main-content');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div class="page-container">
                <div class="page-header">
                    <div class="page-header-left">
                        <h1><i class="fas fa-user-tag"></i> Role Management</h1>
                        <p class="page-subtitle">Manage roles and permissions for system users</p>
                    </div>
                    <div class="page-header-right">
                        <button class="btn btn-primary" id="create-role-btn">
                            <i class="fas fa-plus"></i> Create Role
                        </button>
                    </div>
                </div>

                <div class="roles-grid" id="roles-grid">
                    <div class="loading-state">
                        <i class="fas fa-spinner fa-spin"></i> Loading roles...
                    </div>
                </div>
            </div>
        `;

        // Load roles from API
        try {
            const response = await API.get('/roles');
            const roles = response.data || [];
            this.renderRoles(roles);
        } catch (error) {
            DOM.$('#roles-grid').innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load roles. Please try again.</p>
                    <button class="btn btn-secondary" onclick="App.showRoleManagement()">Retry</button>
                </div>
            `;
        }

        // Create role button
        DOM.on('click', '#create-role-btn', () => this.showCreateRoleModal());
    }

    renderRoles(roles) {
        const grid = DOM.$('#roles-grid');
        if (!grid) return;

        if (roles.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-tag fa-3x"></i>
                    <h3>No Roles Found</h3>
                    <p>Create your first role to get started.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = roles.map(role => `
            <div class="role-card ${role.is_system ? 'system-role' : ''}" data-role-id="${role.id}">
                <div class="role-card-header">
                    <div class="role-icon">
                        <i class="fas fa-${role.is_system ? 'shield-alt' : 'user-tag'}"></i>
                    </div>
                    <div class="role-info">
                        <h3 class="role-name">${role.display_name}</h3>
                        <span class="role-slug">${role.name}</span>
                        ${role.is_system ? '<span class="badge badge-system">System</span>' : ''}
                    </div>
                    <div class="role-actions">
                        <button class="btn btn-sm btn-outline" onclick="App.showRolePermissions(${role.id}, '${role.display_name}')" title="Manage Permissions">
                            <i class="fas fa-key"></i>
                        </button>
                        ${!role.is_system ? `
                        <button class="btn btn-sm btn-outline btn-danger" onclick="App.deleteRole(${role.id}, '${role.display_name}')" title="Delete Role">
                            <i class="fas fa-trash"></i>
                        </button>` : ''}
                    </div>
                </div>
                <div class="role-card-body">
                    <p class="role-description">${role.description || 'No description'}</p>
                    <div class="role-stats">
                        <span><i class="fas fa-users"></i> ${role.users_count || 0} Users</span>
                        <span><i class="fas fa-key"></i> ${(role.permissions || []).length} Permissions</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    showCreateRoleModal() {
        this.showModal({
            title: 'Create New Role',
            size: 'medium',
            content: `
                <form id="create-role-form">
                    <div class="form-group">
                        <label for="role-name">Role Slug <span class="text-muted">(e.g. sales_manager)</span></label>
                        <input type="text" id="role-name" name="name" class="form-control" placeholder="role_name" required>
                    </div>
                    <div class="form-group">
                        <label for="role-display-name">Display Name</label>
                        <input type="text" id="role-display-name" name="display_name" class="form-control" placeholder="Sales Manager" required>
                    </div>
                    <div class="form-group">
                        <label for="role-description">Description</label>
                        <textarea id="role-description" name="description" class="form-control" rows="3" placeholder="Role description..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Create Role</button>
                    </div>
                </form>
            `
        });

        setTimeout(() => {
            const form = DOM.$('#create-role-form');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const data = {
                        name: DOM.$('#role-name').value,
                        display_name: DOM.$('#role-display-name').value,
                        description: DOM.$('#role-description').value,
                    };
                    try {
                        await API.post('/roles', data);
                        this.showNotification({ type: 'success', message: 'Role created successfully!' });
                        this.showRoleManagement();
                    } catch (error) {
                        this.showNotification({ type: 'error', message: error.message || 'Failed to create role' });
                    }
                });
            }
        }, 100);
    }

    async showRolePermissions(roleId, roleName) {
        try {
            const [roleRes, permRes] = await Promise.all([
                API.get(`/roles/${roleId}`),
                API.get('/roles/permissions')
            ]);

            const role = roleRes.data;
            const allPermissions = permRes.data || [];
            const assignedIds = (role.permissions || []).map(p => p.id);

            // Group permissions by module
            const grouped = allPermissions.reduce((acc, perm) => {
                if (!acc[perm.module]) acc[perm.module] = [];
                acc[perm.module].push(perm);
                return acc;
            }, {});

            const permissionsHtml = Object.entries(grouped).map(([module, perms]) => `
                <div class="permission-module">
                    <div class="permission-module-header">
                        <label class="module-label">
                            <input type="checkbox" class="module-check" data-module="${module}"
                                ${perms.every(p => assignedIds.includes(p.id)) ? 'checked' : ''}>
                            <strong>${module.replace('_', ' ').toUpperCase()}</strong>
                        </label>
                    </div>
                    <div class="permission-list">
                        ${perms.map(perm => `
                            <label class="permission-item">
                                <input type="checkbox" name="permissions" value="${perm.id}"
                                    ${assignedIds.includes(perm.id) ? 'checked' : ''}>
                                ${perm.display_name}
                            </label>
                        `).join('')}
                    </div>
                </div>
            `).join('');

            this.showModal({
                title: `Permissions — ${roleName}`,
                size: 'large',
                content: `
                    <form id="permissions-form">
                        <div class="permissions-grid">
                            ${permissionsHtml}
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Save Permissions</button>
                        </div>
                    </form>
                `
            });

            setTimeout(() => {
                // Module select-all checkboxes
                DOM.$$('.module-check').forEach(moduleCheck => {
                    moduleCheck.addEventListener('change', (e) => {
                        const module = e.target.dataset.module;
                        DOM.$$(`.permission-module [data-module="${module}"] ~ .permission-list input`).forEach(cb => {
                            cb.checked = e.target.checked;
                        });
                    });
                });

                const form = DOM.$('#permissions-form');
                if (form) {
                    form.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const checked = [...DOM.$$('input[name="permissions"]:checked')].map(cb => parseInt(cb.value));
                        try {
                            await API.put(`/roles/${roleId}/permissions`, { permission_ids: checked });
                            this.showNotification({ type: 'success', message: 'Permissions updated!' });
                        } catch (error) {
                            this.showNotification({ type: 'error', message: 'Failed to update permissions' });
                        }
                    });
                }
            }, 100);

        } catch (error) {
            this.showNotification({ type: 'error', message: 'Failed to load permissions' });
        }
    }

    async deleteRole(roleId, roleName) {
        if (!confirm(`Are you sure you want to delete the role "${roleName}"?`)) return;
        try {
            await API.delete(`/roles/${roleId}`);
            this.showNotification({ type: 'success', message: `Role "${roleName}" deleted.` });
            this.showRoleManagement();
        } catch (error) {
            this.showNotification({ type: 'error', message: error.message || 'Failed to delete role' });
        }
    }

    show404() {
        // Show 404 page
    }

    showRegister() {
        // Show registration form
    }

    showForgotPassword() {
        // Show forgot password form
    }

    refreshDashboard() {
        // Refresh dashboard data
        this.showNotification({
            type: 'info',
            message: 'Dashboard refreshed'
        });
    }

    logErrorToServer(error) {
        // Log error to server
        console.log('Logging error to server:', error);
    }
}

// Create global app instance
const App = new App();

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

// Make app globally available
window.App = App;

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
