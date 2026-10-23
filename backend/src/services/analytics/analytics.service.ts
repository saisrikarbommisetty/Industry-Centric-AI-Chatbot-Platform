import { analyticsRepository } from '../../repositories/analytics.repository';

export class AnalyticsService {
  async trackEvent(data: {
    projectId: string;
    sessionId?: string | null;
    eventType: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await analyticsRepository.recordEvent(data);
  }

  async getProjectAnalytics(projectId: string): Promise<any> {
    return analyticsRepository.getStatsByProjectId(projectId);
  }
}

export const analyticsService = new AnalyticsService();
