import express from 'express';
import HomeworkResult from '/model/homeworkResult';
import wrap from 'express-async-wrap';
import {requireLogin, checkProblem} from '/utils';
import * as probStat from '/statistic/problem';
import _ from 'lodash';

const router = express.Router();

router.get('/problem/:id', requireLogin, checkProblem(), wrap(async (req, res) => {
    const result = await Promise.all([
        probStat.getProblemResultStats(req.problem._id),
        probStat.getProblemResultBucket(req.problem._id),
        probStat.getProblemPointsDistribution(req.problem._id),
        probStat.getProblemFastest(req.problem._id),
        probStat.getProblemEarliest(req.problem._id),
    ]);
    const stats = _.zipObject(['probStats', 'resultBuckets', 
        'pointsDistribution', 'fastest', 'earliest'], result);
    const problem = req.problem;
    res.send({
        stats,
        problem,
    });
}));

export default router;
