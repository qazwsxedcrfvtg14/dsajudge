import express from 'express';
import HomeworkResult from '/model/homeworkResult';
import wrap from 'express-async-wrap';
import {requireLogin, checkProblem, checkHomework} from '/utils';
import * as probStat from '/statistic/problem';
import * as hwStat from '/statistic/homework';
import _ from 'lodash';

const router = express.Router();

router.get('/problem/:id', requireLogin, checkProblem(), wrap(async (req, res) => {
    if(isNaN(req.problem.id))return res.status(400).send(`id must be a number`);
    const result = await Promise.all([
        probStat.getProblemResultStats(req.problem._id),
        probStat.getProblemResultBucket(req.problem._id),
        probStat.getProblemPointsDistribution(req.problem._id),
        probStat.getProblemFastest(req.problem._id),
        probStat.getProblemAdminFastest(req.problem._id),
    ]);
    const stats = _.zipObject(['probStats', 'resultBuckets', 
        'pointsDistribution', 'fastest', 'adminFastest'], result);
    const problem = req.problem;
    res.send({
        stats,
        problem,
    });
}));

router.get('/homework/:id', requireLogin, checkHomework(), wrap(async (req, res) => {
    if(isNaN(req.homework.id))return res.status(400).send(`id must be a number`);
    const result = await Promise.all([
        hwStat.getHomeworkResultStats(req.homework._id),
        hwStat.getHomeworkPointsDistribution(req.homework._id),
    ]);
    const stats = _.zipObject(['hwStats', 'pointsDistribution'], result);
    const hw = req.homework;
    res.send({
        stats,
        hw,
    });
}));

export default router;
