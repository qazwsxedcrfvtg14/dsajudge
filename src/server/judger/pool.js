import sleep from 'sleep-promise';
import {TimeoutError, InvalidOperationError} from 'common-errors';

export default class Worker {
    constructor(_id,timeout=30) {
        this.id=_id;
        this.isIdle = true;
        this.timeoutMs = timeout * 1000;
        this.ret = null;
        this.wait=[];
        this.finish=new Promise((resolve, reject) => {
            if(isIdle)
                resolve({
                    worker: this,
                    ret: this.ret,
                });
            else
                wait.push(async ()=>{
                    resolve({
                        worker: this,
                        ret: this.ret,
                    });
                });
        });
        //wait.shift()
    }
    /*
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
    }*/
    run(taskFactory, err) {
        if (!this.isIdle) throw InvalidOperationError('Runner not finished.');
        this.isIdle = false;
        this.ret = null;
        return taskFactory(this.id).then((ret) => {
            this.ret = ret;
            this.isIdle = true;
            while(this.wait.length)
                (this.wait.shift())();
        }).catch(e => {
            this.isIdle = true;
            while(this.wait.length)
                (this.wait.shift())();
            err(e);
        });
    }
}
