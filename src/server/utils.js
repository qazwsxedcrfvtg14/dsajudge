import User from './schema/user';
import _ from 'lodash';

export const requireLogin = (req, res, next) => {
    if (!req.user) return res.sendStatus(401);
    next();
};

export const requireAdmin = (req, res, next) => {
    if (!req.user) return res.sendStatus(401);
    if (!req.user.roles && !_.contains(req.user.roles, 'admin')) return res.sendStatus(401);

    next();
};
