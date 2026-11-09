import { Request, Response } from 'express';
import { getDatabaseStatus, initDatabase } from '../database/db.js';

export class SystemController {
  static getStatus(req: Request, res: Response): void {
    const dbStatus = getDatabaseStatus();
    res.status(200).json({
      success: true,
      service: 'Sweety Blood Glucose Tracker API',
      version: '1.0.0',
      database: dbStatus,
      timestamp: new Date().toISOString(),
    });
  }

  static async testOrConfigureDatabase(req: Request, res: Response): Promise<void> {
    const { databaseUrl } = req.body;
    if (!databaseUrl || typeof databaseUrl !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid PostgreSQL connection string.',
      });
      return;
    }

    const success = await initDatabase(databaseUrl);
    const dbStatus = getDatabaseStatus();

    if (success) {
      res.status(200).json({
        success: true,
        message: 'Successfully connected to Neon PostgreSQL database!',
        database: dbStatus,
      });
    } else {
      res.status(400).json({
        success: false,
        message: dbStatus.message || 'Failed to connect to Neon PostgreSQL. Check connection string & network access.',
        database: dbStatus,
      });
    }
  }
}
