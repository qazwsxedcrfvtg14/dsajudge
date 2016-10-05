import path from 'path';
import config from '/config';
import Submission from '/model/submission';
import Result from '/model/result';
import sleep from 'sleep-promise';
import {CppExec, compile, judge} from './shik';
import {mergeResult} from './utils';
import _ from 'lodash';
import logger from '/logger';
import {Error} from 'common-errors';
import fs from 'fs-promise';
import Worker from './pool';
import temp from 'temp';
import {promisify} from 'bluebird';
import Judge from './judge';

async function startJudge(sub) {
    sub.status = 'judging';
    sub.result = null;
    sub.judgeTs = Date.now();
    if (sub.result) {
        const _result = await Result.findById(sub._result);
        if (_result) {
            await _result.purge();
        }
    }
    await sub.save();

    let result;
    try {
        logger.info(`judging #${sub._id}`);
        const judge = new Judge(sub);
        result = await judge.go();
    } catch(e) {
        sub.status = 'error';
        sub.result = 'JE';
        sub.points = 0;
        logger.error(`#${sub._id} judge error`, e);
        await sub.save();
        return;
    }
    sub.status = 'finished';
    ['result', 'points', 'runtime'].forEach(x => {
        sub[x] = result[x];
    });
    logger.info(`judge #${sub._id} finished, result = ${result.result}`);
    await sub.save();
}

async function mainLoop() {
    while (true) {
        const pending = await (
            Submission.findOne({status: 'pending'})
            .populate('problem')
        );
        if (!pending) {
            await sleep(1000);
            continue;
        }

        await startJudge(pending);
        await sleep(50);
    }
}

export default mainLoop;
