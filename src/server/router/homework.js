import express from 'express';
import Problem from '/model/problem';
import Homework from '/model/homework';
import Submission from '/model/submission';
import wrap from 'express-async-wrap';
import _ from 'lodash';
import fs from 'fs-extra';
import bluebird from 'bluebird';
import config from '/config';
import path from 'path';
import {requireLogin} from '/utils';
import HomeworkResult from '/model/homeworkResult';
import {getRank} from '/statistic/rank';
import moment from 'moment';
import filesize from 'filesize';
import crypto from 'crypto';

const router = express.Router();

async function proceedHw(hw, userID, isAdmin) {
    await hw.populate('problems.problem', 'name visible', isAdmin ? {} : {visible: true}).execPopulate();
    const ret = hw.toObject();
    let totalPoints = 0, totalAC = 0;
    const hwRes = await HomeworkResult.findOne()
        .where('homework').equals(hw)
        .where('user').equals(userID);

    const _subs = _.isNil(hwRes) ? null : (await hwRes.getSubresults());

    for (let i = 0; i < hw.problems.length; i++) {
        const subRes = hwRes ? _subs[i] : null;
        let obj = {};
        if (_.isNil(subRes)) {
            obj.userPoints = 0;
            obj.AC = 0;
        } else {
            obj.userPoints = subRes.points;
            obj.AC = (subRes.result === 'AC');
        }
        _.assignIn(ret.problems[i], obj);
    }

    const [rank, totUsers] = await getRank(hw._id, userID);

    ret.status = hw.visible ? (hw.due < Date.now() ? 'ended' : 'running') : 'unpublished';
    ret.userPoints = hwRes ? hwRes.points : 0;
    ret.AC = hwRes ? hwRes.AC : 0;
    if ((rank-1) > totUsers / 2) ret.rank = 0;
    else ret.rank = rank;
    ret.totUsers = totUsers;

    return ret;
}

router.get('/', requireLogin, wrap(async (req, res) => {
    let qry = Homework.find();
    if (!req.user.isAdmin()&&!req.user.isTA())
        qry = qry.where('visible').equals(true);
    const _data = await qry;
    const data = await Promise.all(_data.map(hw => proceedHw(hw, req.user._id, req.user.isAdmin()||req.user.isTA())));
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
    res.send("not construct");
}));

router.post('/:id/submit', requireLogin, wrap(async (req, res) => {
    return res.status(403).send(`How did you turn this on?`);
}));

export default router;
