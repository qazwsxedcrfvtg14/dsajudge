import _ from 'lodash';

const RESULT_MAP = {
    'JE': 'Judge Error',
    'TLE': 'Time Limit Exceeded',
    'WA': 'Wrong Answer',
    'AC': 'Accepted',
    'CE': 'Compile Error',
    'RE': 'Runtime Error',
    'SE': 'Security Error',
    'GE': 'Git Error',
};

export function toHumanString(result) {
    return _.get(RESULT_MAP, result, 'Unknown');
}

export function toDisplayTime(result) {
    if (_.isUndefined(result) || _.isNull(result)) return '-';
    //if (result < 0.01) return '< 10 ms';
    if (result < 1) return `${result * 1000} ms`;
    return `${result} s`;
}

export function getResultString(sub, toHuman=true) {
    if (sub.status !== 'finished') {
        if (toHuman)
            return {
                'pending': 'Pending',
                'judging': 'Judging',
                'error': 'Judge Error',
            }[sub.status];
        else return sub.status;
    }
    if (toHuman) return toHumanString(sub.result);
    else return sub.result;
}

export function getPointsString(sub) {
    if (sub.status !== 'finished') return '?';
    return sub.points.toString();
}


export function isAC(sub) {
    return sub.result === 'AC' || sub.result === RESULT_MAP['AC'];
}

// TODO: refactor
export function isNotAC(sub) {
    return sub.result !== 'AC' && 
        sub.result !== RESULT_MAP['AC'] &&
        (_.has(RESULT_MAP, sub.result) || _.includes(RESULT_MAP, sub.result));
}

export function getTips(res) {
    return 'Download Hao123';
}
