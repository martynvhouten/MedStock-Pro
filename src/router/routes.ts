import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  // Auth pages - uses AuthLayout
  {
    path: '/auth',
    component: () =>
      import(/* webpackChunkName: "auth-layout" */ 'layouts/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'login',
        component: () =>
          import(
            /* webpackChunkName: "auth-login" */ 'pages/auth/LoginPage.vue'
          ),
        meta: { requiresAuth: false },
      },
      {
        path: 'reset-password',
        name: 'reset-password',
        component: () =>
          import(
            /* webpackChunkName: "auth-reset" */ 'pages/auth/ResetPasswordPage.vue'
          ),
        meta: { requiresAuth: false },
      },
      // Future auth pages can be added here:
      // {
      //   path: 'register',
      //   name: 'register',
      //   component: () => import('pages/auth/RegisterPage.vue'),
      //   meta: { requiresAuth: false }
      // }
    ],
  },

  // Redirect /login to /auth/login for backwards compatibility
  {
    path: '/login',
    redirect: '/auth/login',
  },

  // 🎭 REVOLUTIONARY MAGIC INVITE ROUTES - No passwords, instant access!
  {
    path: '/join',
    component: () =>
      import(/* webpackChunkName: "auth-layout" */ 'layouts/AuthLayout.vue'),
    children: [
      {
        path: '',
        name: 'magicJoin',
        component: () =>
          import(
            /* webpackChunkName: "magic-join" */ 'pages/auth/MagicJoinPage.vue'
          ),
        meta: { requiresAuth: false },
      },
      {
        path: ':code',
        name: 'magicJoinWithCode',
        component: () =>
          import(
            /* webpackChunkName: "magic-join" */ 'pages/auth/MagicJoinPage.vue'
          ),
        meta: { requiresAuth: false },
        props: true,
      },
    ],
  },

  // Main Layout - for authenticated users
  {
    path: '/',
    component: () =>
      import(/* webpackChunkName: "main-layout" */ 'layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () =>
          import(/* webpackChunkName: "dashboard" */ 'pages/DashboardPage.vue'),
        meta: { requiresAuth: true, preload: true },
      },

      // Inventory Management Routes - redirect main route to levels
      {
        path: 'inventory',
        redirect: '/inventory/levels'
      },
      {
        path: 'inventory/levels',
        name: 'inventory-levels',
        component: () =>
          import(
            /* webpackChunkName: "inventory-levels" */ 'pages/inventory/InventoryLevelsPage.vue'
          ),
        meta: { requiresAuth: true },
      },
      {
        path: 'inventory/locations',
        name: 'inventory-locations',
        component: () =>
          import(
            /* webpackChunkName: "inventory-locations" */ 'pages/inventory/LocationsPage.vue'
          ),
        meta: { requiresAuth: true },
      },
      {
        path: 'inventory/counting',
        name: 'inventory-counting',
        component: () =>
          import(
            /* webpackChunkName: "inventory-counting" */ 'pages/inventory/CountingPage.vue'
          ),
        meta: { requiresAuth: true },
      },
      {
        path: 'inventory/counting/:sessionId',
        name: 'inventory-counting-session',
        component: () =>
          import(
            /* webpackChunkName: "inventory-counting-session" */ 'pages/inventory/CountingSessionPage.vue'
          ),
        meta: { requiresAuth: true },
        props: true,
      },
      {
        path: 'inventory/movements',
        name: 'inventory-movements',
        component: () =>
          import(
            /* webpackChunkName: "inventory-movements" */ 'pages/inventory/MovementsPage.vue'
          ),
        meta: { requiresAuth: true },
      },
      {
        path: 'inventory/batches',
        name: 'inventory-batches',
        component: () =>
          import(
            /* webpackChunkName: "batch-management" */ 'pages/BatchManagementPage.vue'
          ),
        meta: { requiresAuth: true },
      },

      // Products & Orders & Suppliers
      {
        path: 'products',
        name: 'products',
        component: () =>
          import(/* webpackChunkName: "products" */ 'pages/ProductsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'order-lists',
        name: 'order-lists',
        component: () =>
          import(
            /* webpackChunkName: "order-lists" */ 'pages/OrderListsPage.vue'
          ),
        meta: { requiresAuth: true },
      },
      {
        path: 'orders',
        name: 'orders',
        component: () =>
          import(/* webpackChunkName: "orders" */ 'pages/OrdersPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'analytics',
        name: 'analytics',
        component: () =>
          import(/* webpackChunkName: "analytics" */ 'pages/AnalyticsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'suppliers',
        name: 'suppliers',
        component: () =>
          import(/* webpackChunkName: "suppliers" */ 'pages/SuppliersPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'notifications',
        name: 'notifications',
        component: () =>
          import(
            /* webpackChunkName: "notifications" */ 'pages/NotificationsPage.vue'
          ),
        meta: { requiresAuth: true },
      },
      {
        path: 'admin',
        name: 'admin',
        component: () =>
          import(/* webpackChunkName: "admin" */ 'pages/AdminDashboard.vue'),
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'beheer',
        name: 'beheer',
        component: () =>
          import(/* webpackChunkName: "admin" */ 'pages/AdminDashboard.vue'),
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
        },
      },

      {
        path: 'settings',
        name: 'settings',
        component: () =>
          import(/* webpackChunkName: "settings" */ 'pages/SettingsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'style-guide',
        name: 'style-guide',
        component: () =>
          import(
            /* webpackChunkName: "style-guide" */ 'pages/StyleGuidePage.vue'
          ),
        meta: { requiresAuth: true },
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () =>
      import(/* webpackChunkName: "error" */ 'pages/ErrorNotFound.vue'),
  },
];

export default routes;
