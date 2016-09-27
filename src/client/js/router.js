import Vue from 'vue';
import VueRouter from 'vue-router';
Vue.use(VueRouter);
import Problems from './components/problems';
import Problem from './components/problem.js';
import Submit from './components/submit.js';

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
});

export default router;
