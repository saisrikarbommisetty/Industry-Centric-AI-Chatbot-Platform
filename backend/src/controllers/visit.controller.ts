import { Request, Response, NextFunction } from 'express';
import { visitService } from '../services/visits/visit.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorHandler.middleware';

export class VisitController {
  /**
   * Submit a Schedule Visit request (Public/Chatbot)
   */
  async createVisit(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        projectId,
        sessionId,
        conversationId,
        customerName,
        mobileNumber,
        email,
        propertyName,
        propertyUrl,
        locality,
        city,
        bhk,
        propertyPrice,
        assistantId,
        assistantName,
        customerNotes,
        preferredDate,
      } = req.body;

      if (!customerName || customerName.trim().length === 0) {
        throw new AppError('Customer name is required', 400, 'VALIDATION_ERROR');
      }

      if (!mobileNumber || mobileNumber.trim().length === 0) {
        throw new AppError('Mobile number is required', 400, 'VALIDATION_ERROR');
      }

      const visit = await visitService.createVisitRequest({
        projectId: projectId || assistantId || 'prycoons-ai',
        sessionId: sessionId || conversationId,
        customerName,
        mobileNumber,
        email,
        propertyName,
        propertyUrl,
        locality,
        city,
        bhk,
        propertyPrice,
        assistantId,
        assistantName,
        customerNotes,
        preferredDate,
      });

      res.status(201).json({
        success: true,
        data: visit,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all Visit Requests with filtering (Admin only)
   */
  async getVisits(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { projectId, status, search, locality, startDate, endDate } = req.query;

      const visits = await visitService.getVisitRequests({
        projectId: projectId as string,
        status: status as string,
        search: search as string,
        locality: locality as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      res.status(200).json({
        success: true,
        data: visits,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export Visit Requests to genuine Excel .xlsx workbook (Admin only)
   */
  async exportVisitsToExcel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { projectId, status, search, locality, startDate, endDate } = req.query;

      const { buffer, filename } = await visitService.exportVisitRequestsToExcel({
        projectId: projectId as string,
        status: status as string,
        search: search as string,
        locality: locality as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length.toString());

      res.status(200).send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

export const visitController = new VisitController();
