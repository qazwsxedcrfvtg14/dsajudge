import express from 'express';
import wrap from 'express-async-wrap';
import _ from 'lodash';

const router = express.Router();

router.get('/', wrap(async (req, res) => {
    res.send({time:Date.now()});
}));

export default router;
