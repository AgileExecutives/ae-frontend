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
        path: '/clients',
        name: 'Clients',
        component: () => import('../views/ClientsView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/clients/new',
        name: 'ClientCreate',
        component: () => import('../views/ClientCreateView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/clients/:id',
        name: 'ClientDetail',
        component: () => import('../views/ClientDetailView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/clients/:id/edit',
        name: 'ClientEdit',
        component: () => import('../views/ClientEditView.vue'),
        meta: { requiresAuth: true }
    }
]