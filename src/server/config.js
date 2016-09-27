import path from 'path';
export default {
    port: 3333,
    dirs: {
        problems: path.join(__dirname, './problems'),
        submissions: path.join(__dirname, './submissions'),
    }
};
