import path from 'path';
export default {
    secret: 'aabbccaabbddaaeeff',
    port: 3333,
    dirs: {
        problems: path.join(__dirname, './problems'),
        submissions: path.join(__dirname, './submissions'),
        cfiles: path.join(__dirname, './cfiles'),
        gitadmin: path.join(__dirname, './gitosis-admin'),
        homeworks: path.join(__dirname, './homeworks'),
        isolate: "/dev/shm/isolate",
    },
    mongo: {
        url: 'mongodb://localhost/dsajudge',
    },
    numa: true,
    numaPool: [{cpu:0,mem:0},{cpu:1,mem:1}],
    maxWorkers: 4,
    maxNodeWorkers: 4,
};
