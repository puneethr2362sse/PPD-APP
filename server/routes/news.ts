import { Router, Request, Response } from 'express';
import { newsFeedService } from '../services/newsFeedService.js';

export const newsRouter = Router();

// GET LIVE TRENDING NEWS (Dynamic real-time RSS news feed)
newsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const category = (req.query.category as string || 'all').trim().toLowerCase();
  const forceRefresh = req.query.refresh === 'true' || req.query.force === 'true';
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    const result = await newsFeedService.getLiveNews(category, forceRefresh);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      news: [],
      category,
      error: err.message || 'Failed to fetch live news feed.',
    });
  }
});

// GET SUPPORTED NEWS CATEGORIES
newsRouter.get('/categories', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    categories: newsFeedService.getCategories(),
  });
});
