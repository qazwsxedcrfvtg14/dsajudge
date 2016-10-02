const routes = [
    'user',
    'submission',
    'problem',
    'submit',
    'admin',
    'homework',
];

export default function(app) {
    routes.map(x => {
        app.use(`/${x}`, require(`./${x}`).default);
    });
}
