import Vue from 'vue';
import VueRouter from 'vue-router';
Vue.use(VueRouter);
import Problems from './components/problems';
import Problem from './components/problem';
import Submit from './components/submit';
import Admin from './components/admin';

const router = new VueRouter({
    linkActiveClass: 'active',
});

router.map({
    '/problems': {
        name: 'problem',
        component: Problems,
    },
    '/problem/:id': {
        name: 'problem',
        component: Problem,
    },
    '/submit/:id': {
        name: 'submit',
        component: Submit,
    },
    '/admin': {
        name: 'admin',
        component: Admin.index,
        subRoutes: {
            '/problems': {
                component: Admin.problems,
            },
            'submissions': {
                component: Admin.index,
            },
            '/problem/:id': {
                component: Admin.problem,
            },
            '/newProblem': {
                component: Admin.newProblem,
            },
        },
    },
});

router.redirect({
    '/admin': '/admin/problems',
});

export default router;
