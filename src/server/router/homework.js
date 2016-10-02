import express from 'express';
import Problem from '/model/problem';
import Homework from '/model/homework';
import Submission from '/model/submission';
import wrap from 'express-async-wrap';
import _ from 'lodash';
import fs from 'fs';
import bluebird from 'bluebird';
import config from '/config';
import path from 'path';
import {requireLogin} from '/utils';

const router = express.Router();

async function proceedHw(hw) {
    await hw.populate('problems', 'name visible', {visible: true}).execPopulate();
    const ret = hw.toObject();
    let totalPoints = 0, totalAC = 0;
    for (let [idx, prob] of hw.problems.entries()) {
        const subs = (await Submission.find().limit(1)
            .where('ts').lt(hw.due)
            .where('problem').equals(prob)
            .sort('-points'))[0];

        const points = subs.points;
        const AC = (subs.result === 'AC');
        _.assignIn(ret.problems[idx], {
            userPoints: points,
            AC,
        });
        totalPoints += subs.points;
        if (AC) totalAC += 1;
    }
    ret.userPoints = totalPoints;
    ret.AC = totalAC;
    return ret;
}

router.get('/all', requireLogin, wrap(async (req, res) => {
    const _data = await Homework.find()
        .where('visible').equals(true)
        .where('due').gt(Date.now())
        .populate('problems')
    ;
    const data = await Promise.all(_data.map(hw => proceedHw(hw)));
    console.log(data);
    res.send(data);
}));

router.get('/:id', wrap(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.sendStatus(404);
    let problem;
    if (req.user && _.includes(req.user.roles, 'admin'))
        problem = await Problem.findOne({_id: id});
    else
        problem = await Problem.findOne({_id: id, visible: true});

    if (!problem) {
        return res.sendStatus(404);
    }

    problem = problem.toObject();

    let fl = await bluebird.promisify(fs.readFile)(
        path.join(config.dirs.problems, req.params.id, 'prob.md'));

    problem.desc = fl.toString();

    res.send(problem);
}));

export default router;
