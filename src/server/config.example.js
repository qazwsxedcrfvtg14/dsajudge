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
    },
    mongo: {
        url: 'mongodb://localhost/dsajudge',
    },
    maxWorkers: 4,
};
