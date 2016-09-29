import Vue from 'vue';
import VueRouter from 'vue-router';
Vue.use(VueRouter);
import Problems from './components/problems';
import Problem from './components/problem';
import Submit from './components/submit';
import Admin from './components/admin';
import Submissions from './components/submissions';
import Submission from './components/submission';
import {Logo} from './components/root';
import Profile from './components/profile';

const router = new VueRouter({
    linkActiveClass: 'active',
});

router.map({
    '/': {
        component: Logo,
    },
    '/problems': {
        name: 'problems',
        component: Problems,
    },
    '/problem/:id': {
        name: 'problem',
        component: Problem,
    },
    '/submissions': {
        name: 'submissions',
        component: Submissions,
    },
    '/submission/:id': {
        name: 'submission',
        component: Submission,
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
                component: Admin.submissions,
            },
            '/problem/:id': {
                name: 'admin.problem',
                component: Admin.problem,
            },
            '/newProblem': {
                component: Admin.newProblem,
            },
        },
    },
    '/profile': {
        name: 'profile',
        component: Profile,
    }
});

router.redirect({
    '/admin': '/admin/problems',
});

export default router;
