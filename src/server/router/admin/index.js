import express from 'express';
import {requireAdmin} from '/utils';
import Problem from './problem';
import Submission from './submission';

const router = express.Router();

router.use('/', requireAdmin);
router.use('/problem', Problem);
router.use('/submission', Submission);

export default router;
