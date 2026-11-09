import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { ReadingService } from '../services/reading.service.js';

export class ReadingController {
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const reading = await ReadingService.create(userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Blood glucose reading recorded successfully.',
        reading,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { date, startDate, endDate } = req.query as {
        date?: string;
        startDate?: string;
        endDate?: string;
      };

      const readings = await ReadingService.getAll(userId, { date, startDate, endDate });
      res.status(200).json({
        success: true,
        readings,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const reading = await ReadingService.getById(userId, id);
      res.status(200).json({
        success: true,
        reading,
      });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const reading = await ReadingService.update(userId, id, req.body);
      res.status(200).json({
        success: true,
        message: 'Reading updated successfully.',
        reading,
      });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await ReadingService.delete(userId, id);
      res.status(200).json({
        success: true,
        message: 'Reading deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
}
