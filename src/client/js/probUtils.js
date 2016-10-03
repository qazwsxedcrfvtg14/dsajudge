import _ from 'lodash';

const RESULT_MAP = {
    'JE': 'Judge Error',
    'TLE': 'Time Limit Exceeded',
    'WA': 'Wrong Answer',
    'AC': 'Accepted',
    'CE': 'Compile Error',
    'RE': 'Runtime Error',
};

export function toHumanString(result) {
    return _.get(RESULT_MAP, result, 'Unknown');
}

export function toDisplayTime(result) {
    if (_.isUndefined(result) || _.isNull(result)) return '-';
    if (result < 0.01) return '< 10 ms';
    if (result < 1) return `${result * 1000} ms`;
    return `${result} s`;
}

export function getResultString(sub, toHuman=true) {
    if (sub.status !== 'finished') {
        return {
            'pending': 'Pending',
            'judging': 'Judging',
            'error': 'Judge Error',
        }[sub.status];
    }
    return toHumanString(sub.result);
}

export function getPointsString(sub) {
    if (sub.status !== 'finished') return '?';
    return sub.points.toString();
}

export function isAC(res) {
    return res.result === 'AC' || res.result === RESULT_MAP['AC'];
}

export function isNotAC(res) {
    return res.result && (res.result !== 'AC' && res.result !== RESULT_MAP['AC']);
}

export function getTips(res) {
    return 'Download Hao123';
}
