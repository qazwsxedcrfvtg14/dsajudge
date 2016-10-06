import Vue from 'vue';
import moment from 'moment-timezone';
import _ from 'lodash';

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
Vue.filter('toFixed', (val, fx=2) => {
    if (!_.isNumber(val)) return val;
    return val.toFixed(fx);
});
