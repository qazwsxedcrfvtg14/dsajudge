import express from 'express';
import _ from 'lodash';
import wrap from 'express-async-wrap';
import Problem from '/schema/problem';
import {requestLogin} from '/utils';

const router = express.Router();

router.post('/:id', requestLogin, wrap(async (req, res) => {
    const id = parseInt(req.params.id);
    console.log(id);
    let problem;
    if (req.user && _.includes(req.user.roles, 'admin'))
        problem = await Problem.findOne({_id: id});
    else
        problem = await Problem.findOne({_id: id, visible: true});
    
    if (!problem) {
        return res.sendStatus(404);
    }
    console.log(req.body);
}));

export default router;
