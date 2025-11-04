export const extraRoutes = [
    {
        path: '/',
        redirect: '/dashboard'
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('../views/DashboardView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/calendar',
        name: 'Calendar',
        component: () => import('../views/CalendarView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/invoices',
        name: 'Invoices',
        component: () => import('../views/InvoicesView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/clients',
        name: 'Clients',
        component: () => import('../views/ClientsView.vue'),
        meta: { requiresAuth: true }
    }
]