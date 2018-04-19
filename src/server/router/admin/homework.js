import express from 'express';
import _ from 'lodash';
import wrap from 'express-async-wrap';
import Problem from '/model/problem';
import Homework from '/model/homework';
import {requireAdmin} from '/utils';
import path from 'path';
import fs from 'fs-extra';
import winston from 'winston';

const router = express.Router();

router.put('/', wrap(async (req, res) => {
    const homework = new Homework({});
    await homework.save();
    res.send({
        id: homework._id,
    });
}));

router.get('/:id', wrap(async (req, res) => {
    if(isNaN(req.params.id))return res.status(400).send(`id must be a number`);
    const hw = await Homework.findById(req.params.id);
    if (!hw) return res.status(404).send(`Homework #${req.params.id} not found`);
    res.send(hw.toObject());
}));

router.put('/:id', wrap(async (req, res) => {
    if (!req.body) {
        return res.sendStatus(400);
    }
    if(isNaN(req.params.id))return res.status(400).send(`id must be a number`);

    const hw = await Homework.findById(req.params.id);
    if (!hw) return res.status(404).send(`Homework #${req.params.id} not found`);
    const homework = req.body;
    _.unset(homework, ['_id', '__v', 'totalPoints', 'problemNum']);
    _.assignIn(hw, homework);
    await hw.populate('problems.problem', 'testdata.points').execPopulate();
    hw.problemNum = hw.problems.length;
    hw.totalPoints = _.reduce(hw.problems, (v, x) => v + x.weight * x.problem.testdata.points, 0);
    await hw.save();
    res.send(`Homework #${req.params.id} update successfully`);
}));

export default router;
