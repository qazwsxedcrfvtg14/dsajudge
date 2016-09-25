import express from 'express';
import config from './config';
import auth from './auth';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import expressSession from 'express-session';

const app = express();

app.use(express.static('static'));
app.use(cookieParser());
app.use(expressSession({secret: 'aabbccaabbddaaeeff'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
auth(app);

app.get('/me', (req, res) => {
    if (req.user) {
        res.send({
            login: true,
            user: req.user,
        });
    } else {
        res.send({
            login: false,
        });
    }
});

app.listen(config.port, () => console.log(`Server start @ ${config.port}`));
