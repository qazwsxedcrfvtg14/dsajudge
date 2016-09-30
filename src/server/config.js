import path from 'path';
export default {
    port: 3333,
    dirs: {
        problems: path.join(__dirname, './problems'),
        submissions: path.join(__dirname, './submissions'),
        cfiles: path.join(__dirname, './cfiles'),
    },
    mongo: {
        url: 'mongodb://localhost/adajudge',
    }
};
