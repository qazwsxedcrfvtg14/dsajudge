import express from 'express';
import config from './config';
import './auth';
const app = express();

app.use(express.static('static'));

app.listen(config.port, () => console.log(`Server start @ ${config.port}`));
