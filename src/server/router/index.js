const routes = [
    'user',
    'submission',
    'problem',
    'submit',
    'admin',
];

export default function(app) {
    routes.map(x => {
        app.use(`/${x}`, require(`./${x}`).default);
    });
}
