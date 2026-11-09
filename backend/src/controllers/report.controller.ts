import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { ReportService } from '../services/report.service.js';

export class ReportController {
  static async getDaily(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const date = req.query.date as string | undefined;
      const report = await ReportService.getDailyReport(userId, date);
      res.status(200).json({
        success: true,
        report,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMonthToDate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const date = req.query.date as string | undefined;
      const report = await ReportService.getMonthToDateReport(userId, date);
      res.status(200).json({
        success: true,
        report,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMonthly(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const date = req.query.date as string | undefined;
      const report = await ReportService.getMonthlyReport(userId, date);
      res.status(200).json({
        success: true,
        report,
      });
    } catch (err) {
      next(err);
    }
  }
}
