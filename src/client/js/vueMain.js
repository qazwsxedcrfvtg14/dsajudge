import _ from 'lodash';
import Vue from 'vue';
import VueResource from 'vue-resource';
import VueRouter from 'vue-router';
import moment from 'moment-timezone';
Vue.use(VueResource);
Vue.use(VueRouter);

Vue.filter('toFormattedTime', (val, fmt) => moment(val).tz('Asia/Taipei').format(fmt));
Vue.filter('toResultString', (val) => {
    if (val === 'pending' || val === 'judging') return val;
    return {
        WA: 'Wrong Answer',
        AC: 'Accepted',
        TLE: 'Time Limit Exceeded',
        RE: 'Runtime Error',
        CE: 'Compile Error',
    }[val];
});

import router from './router';

console.log(router);

import App from './components/root'
router.start(App, '#App');
