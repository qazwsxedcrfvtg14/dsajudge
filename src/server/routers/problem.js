import express from 'express';
import Problem from '/schema/problem';
import wrap from 'express-async-wrap';

const router = express.Router();

router.get('/all', wrap(async (req, res) => {
    const data = await Problem.find({});
    console.log(data);
    res.sendStatus(204);
}));

export default router;
