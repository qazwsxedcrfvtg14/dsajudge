import sleep from 'sleep-promise';
import {TimeoutError, InvalidOperationError} from 'common-errors';

export default class Worker {
    constructor(wid,timeout=30) {
        this.id=wid;
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
    async run(taskFactory, err) {
        if (!this.isIdle) throw InvalidOperationError('Runner not finished.');
        this.isIdle = false;
        this.ret = null;
        try{
            this.ret=await taskFactory(this.id);
        }catch(e){
            err(e);
        }
        this.isIdle = true;
        while(this.wait.length)
            (this.wait.shift())();
    }
}
