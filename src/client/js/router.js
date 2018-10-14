import Vue from 'vue';
import VueRouter from 'vue-router';
import Problems from './components/problems';
import Problem from './components/problem';
import Submit from './components/submit';
import Submit2 from './components/submit2';
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

router.map({
    '/': {
        component: Home,
    },
    '/problems': {
        name: 'problems',
        component: Problems,
    },
    '/problem/:id': {
        name: 'problem',
        component: Problem,
    },
    '/problem/:id/statistic': {
        name: 'problem.statistic',
        component: ProblemStatistic,
    },
    '/homework/:id/statistic': {
        name: 'homework.statistic',
        component: HomeworkStatistic,
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
    '/submit2/:id': {
        name: 'submit2',
        component: Submit2,
    },
    '/admin': {
        name: 'admin',
        component: Admin.index,
        subRoutes: {
            '/problems': {
                component: Admin.problems,
            },
            '/submissions': {
                name: 'admin.submissions',
                component: Admin.submissions,
            },
            '/homework/:id': {
                name: 'admin.homework',
                component: Admin.homework,
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
