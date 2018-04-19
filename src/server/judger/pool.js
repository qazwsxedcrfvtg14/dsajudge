import sleep from 'sleep-promise';
import {TimeoutError, InvalidOperationError} from 'common-errors';

export default class Worker {
    constructor(_id,timeout=30) {
        this.id=_id;
        this.isIdle = true;
        this.timeoutMs = timeout * 1000;
        this.ret = null;
        this.wait=[];
    }
    finish() {
        return new Promise((resolve, reject) => {
            if(this.isIdle)
                resolve({
                    worker: this,
                    ret: this.ret,
                });
            else
                this.wait.push(async ()=>{
                    resolve({
                        worker: this,
                        ret: this.ret,
                    });
                });
        });
    }
    run(taskFactory, err, fin) {
        if (!this.isIdle) throw InvalidOperationError('Runner not finished.');
        this.isIdle = false;
        this.ret = null;
        return taskFactory(this.id).then((ret) => {
            this.ret = ret;
            this.isIdle = true;
            while(this.wait.length)
                (this.wait.shift())();
            if(fin)fin();
        }).catch(e => {
            this.isIdle = true;
            while(this.wait.length)
                (this.wait.shift())();
            err(e);
            if(fin)fin();
        });
    }
}
