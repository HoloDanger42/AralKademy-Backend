import express from 'express';
import { getAllGroups, createGroup, assignStudentTeacherMembers, assignLearnerMembers, getGroupById } from '../controllers/groupController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const groupsRouter = express.Router();

groupsRouter.get('/', authMiddleware, getAllGroups);
groupsRouter.get('/:id', authMiddleware, getGroupById);
groupsRouter.post('/', authMiddleware, createGroup);
groupsRouter.post('/assignStudentTeacherMembers', authMiddleware, assignStudentTeacherMembers);
groupsRouter.post('/assignLearnerMembers', authMiddleware, assignLearnerMembers);

export { groupsRouter };
