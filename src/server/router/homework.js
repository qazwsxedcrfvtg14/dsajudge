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

async function proceedHw(hw, userID) {
    await hw.populate('problems', 'name visible', {visible: true}).execPopulate();
    const ret = hw.toObject();
    let totalPoints = 0, totalAC = 0;
    for (let [idx, prob] of hw.problems.entries()) {
        const subs = (await Submission.find().limit(1)
            .where('submittedBy').equals(userID)
            .where('ts').lt(hw.due)
            .where('problem').equals(prob)
            .sort('-points'))[0];

        let points = 0, AC = 0;
        if (subs) {
            [points, AC] = [subs.points, (subs.result === 'AC')];
        }
        _.assignIn(ret.problems[idx], {
            userPoints: points,
            AC,
        });
        totalPoints += points;
        if (AC) totalAC += 1;
    }
    ret.status = hw.visible ? (hw.due < Date.now() ? 'ended' : 'running') : 'unpublished';
    ret.userPoints = totalPoints;
    ret.AC = totalAC;

    return ret;
}

router.get('/', requireLogin, wrap(async (req, res) => {
    let qry = Homework.find();
    if (!req.user.isAdmin())
        qry = qry.where('visible').equals(true);
    const _data = await qry.populate('problems').exec();
    const data = await Promise.all(_data.map(hw => proceedHw(hw, req.user._id)));
    data.sort((h1, h2) => {
        if (h1.status != h2.status) {
            const ord = {
                running: 0,
                ended: 1,
                unpublished: 2,
            };
            return ord[h1.status] - ord[h2.status];
        }
        return h1.due - h2.due;
    });
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
