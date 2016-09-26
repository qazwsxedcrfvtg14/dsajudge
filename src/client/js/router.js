import Vue from 'vue';
import VueRouter from 'vue-router';
Vue.use(VueRouter);
import Problems from './components/problems';

const router = new VueRouter();

router.map({
    '/problems': {
        component: Problems,
    },
});

export default router;
