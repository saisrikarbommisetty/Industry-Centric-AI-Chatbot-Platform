import { Request, Response, NextFunction } from 'express';
import { conversationService } from '../services/chatbot/conversation.service';
import { sessionRepository } from '../repositories/session.repository';
import { messageRepository } from '../repositories/message.repository';
import { AppError } from '../middleware/errorHandler.middleware';

export class ChatController {
  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, sessionId, message, visitorId, context } = req.body;

      const result = await conversationService.processMessage({
        projectId,
        sessionId,
        message,
        visitorId,
        clientContext: context,
        headers: req.headers,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async createSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, visitorId, userName, location } = req.body;

      const session = await sessionRepository.createSession({
        projectId,
        visitorId,
        userName,
        location,
      });

      res.status(201).json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const session = await sessionRepository.getSessionById(sessionId);
      if (!session) {
        return next(new AppError('Session not found', 404, 'SESSION_NOT_FOUND'));
      }

      res.status(200).json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSessionMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const messages = await messageRepository.getMessagesBySessionId(sessionId);

      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const session = await sessionRepository.resetSession(sessionId);

      res.status(200).json({
        success: true,
        data: {
          sessionId,
          message: 'Session context reset successfully',
          session,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getProjectSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = req.params.projectId || (req.query.projectId as string) || 'prycoons-ai';
      const sessions = await sessionRepository.getSessionsByProjectId(projectId);

      // Format sessions into client-friendly transcript list for Conversations UI
      const formattedSessions = sessions.map((s) => {
        const meta = s.sessionMetadata || {};
        const messages = (s.messages || []).map((m: any) => ({
          id: m.id,
          sender: m.role?.toLowerCase() === 'user' ? 'user' : 'bot',
          text: m.content,
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          propertyCards: m.metadata?.propertyCards || (m.metadata?.propertyCard ? [m.metadata.propertyCard] : []),
        }));

        const firstUserMsg = messages.find((m: any) => m.sender === 'user')?.text || '';
        const interest = meta.discovery?.homeType || meta.discovery?.location || firstUserMsg.slice(0, 35) || 'Property Inquiry';

        return {
          id: s.id,
          botId: s.projectId,
          botName: 'Prycoons Real Estate Assistant',
          userName: s.userName || meta.userName || meta.lead?.name || 'Website Visitor',
          userEmail: meta.lead?.email || 'visitor@example.com',
          userPhone: meta.lead?.phone || '+91 98000 00000',
          leadStatus: meta.lead?.captured ? 'Site Visit Requested' : 'Engaged Explorer',
          leadInterest: interest,
          budget: meta.discovery?.budget || 'Standard',
          channel: 'Web Assistant',
          timestamp: new Date(s.lastActivityAt || s.startedAt).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          duration: `${Math.max(1, Math.round((new Date(s.lastActivityAt || s.startedAt).getTime() - new Date(s.startedAt).getTime()) / 60000))}m`,
          messagesCount: messages.length,
          transcript: messages,
        };
      });

      res.status(200).json({
        success: true,
        data: formattedSessions,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();
