import Vue from 'vue';
import VueRouter from 'vue-router';
import Problems from './components/problems';
import Problem from './components/problem';
import Submit from './components/submit';
import Admin from './components/admin';
import Submissions from './components/submissions';
import Submission from './components/submission';
import Home from './components/home';
import Profile from './components/profile';
import ProblemStatistic from './components/statistic/problem';
import HomeworkStatistic from './components/statistic/homework';

Vue.use(VueRouter);

const router = new VueRouter({
    linkActiveClass: 'active',
});

router.routes = [
    {
        path: '/',
        component: Home,
    },
    {
        path: '/problems',
        name: 'problems',
        component: Problems,
    },
    {
        path: '/problem/:id',
        name: 'problem',
        component: Problem,
    },
    {
        path: '/problem/:id/statistic',
        name: 'problem.statistic',
        component: ProblemStatistic,
    },
    {
        path: '/homework/:id/statistic',
        name: 'homework.statistic',
        component: HomeworkStatistic,
    },
    {
        path: '/submissions',
        name: 'submissions',
        component: Submissions,
    },
    {
        path: '/submission/:id',
        name: 'submission',
        component: Submission,
    },
    {
        path: '/submit/:id',
        name: 'submit',
        component: Submit,
    },
    {
        path: '/admin',
        name: 'admin',
        component: Admin.index,
        children: [
            {
                path: '/problems',
                component: Admin.problems,
            },
            {
                path: '/submissions',
                name: 'admin.submissions',
                component: Admin.submissions,
            },
            {
                path: '/homework/:id',
                name: 'admin.homework',
                component: Admin.homework,
            },
            {
                path: '/problem/:id',
                name: 'admin.problem',
                component: Admin.problem,
            },
            {
                path: '/newProblem',
                component: Admin.newProblem,
            },
        ],
    },
    {
        path: '/profile',
        name: 'profile',
        component: Profile,
    }
];

router.redirect({
    '/admin': '/admin/problems',
});

export default router;
