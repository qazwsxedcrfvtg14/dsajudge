import sleep from 'sleep-promise';
import {TimeoutError, InvalidOperationError} from 'common-errors';

export default class Worker {
    constructor(timeout=30) {
        this.isIdle = true;
        this.timeoutMs = timeout * 1000;
        this.ret = null;
    }
    async finish() {
        let waitedCnt = 0;
        while (!this.isIdle) {
            if (waitedCnt > this.timeoutMs) {
                throw TimeoutError('Runner timeout');
            }
            await sleep(100);
            waitedCnt += 100;
        }
        return {
            worker: this,
            ret: this.ret,
        };
    }
    run(taskFactory, err) {
        if (!this.isIdle) throw InvalidOperationError('Runner not finished.');
        this.isIdle = false;
        this.ret = null;
        return taskFactory().then((ret) => {
            this.ret = ret;
            this.isIdle = true;
        }).catch(e => {
            this.isIdle = true;
            err(e);
        });
    }
}
