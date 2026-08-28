import { Router, Request, Response } from 'express';
import { firestoreDB } from '../firebaseConfig.js';

export const newsRouter = Router();

// GET TRENDING NEWS
newsRouter.get('/', (req: Request, res: Response): void => {
  const news = firestoreDB.getTrendingNews();
  res.json({ success: true, news });
});
