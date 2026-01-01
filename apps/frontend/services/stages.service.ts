import api from '../lib/api';
import { ProjectStagesResponse } from '../types/stage';

export class StagesService {
  private static readonly BASE_URL = '/projects';

  /**
   * Get accessible stages for a project
   * Returns stages with permissions based on current user's role
   */
  static async getProjectStages(projectId: string): Promise<ProjectStagesResponse> {
    const response = await api.get<ProjectStagesResponse>(
      `${this.BASE_URL}/${projectId}/stages`
    );
    return response.data;
  }
}
