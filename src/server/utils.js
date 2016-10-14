import User from '/model/user';
import Problem from '/model/problem';
import Homework from '/model/homework';
import _ from 'lodash';
import wrap from 'express-async-wrap';

export const requireLogin = (req, res, next) => {
    if (!req.user) return res.sendStatus(401);
    next();
};

export const requireAdmin = (req, res, next) => {
    if (!req.user) return res.status(401).send(`You are not logged in`);
    if (!req.user.isAdmin()) return res.status(401).send(`You are not admin`);

    next();
};

export const checkProblem = (_id='id') => wrap(async (req, res, next) => {
    const id = parseInt(req.params[_id]);
    if (isNaN(id)) return res.status(404).send(`Problem #${id} not found`);
    let problem;
    if (req.user && req.user.isAdmin())
        problem = await Problem.findOne({_id: id});
    else
        problem = await Problem.findOne({_id: id, visible: true});

    if (!problem) {
        return res.status(404).send(`Problem #${id} not found`);
    }
    req.problem = problem;
    next();
});

export const checkHomework = (_id='id') => wrap(async (req, res, next) => {
    const id = parseInt(req.params[_id]);
    if (isNaN(id)) return res.status(404).send(`Homework #${id} not found`);
    let homework;
    if (req.user && req.user.isAdmin())
        homework = await Homework.findOne({_id: id});
    else
        homework = await Homework.findOne({_id: id, visible: true});

    if (!homework) {
        return res.status(404).send(`Homework #${id} not found`);
    }
    req.homework = homework;
    next();
});
