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

