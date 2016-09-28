import User from './schema/user';
import _ from 'lodash';

export const requireLogin = (req, res, next) => {
    if (!req.user) return res.sendStatus(401);
    next();
};

export const requireAdmin = (req, res, next) => {
    if (!req.user) return res.status(401).send(`You are not logged in`);
    if (!req.user.isAdmin()) return res.status(401).send(`You are not admin`);

    next();
};
