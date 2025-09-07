/**
 * Dashboard Manager
 * Handles dashboard creation, management, and configuration
 */
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  Dashboard, 
  DashboardTemplate, 
  DashboardAnalytics,
  DashboardShare,
  VisualizationRequest,
  VisualizationResponse 
} from './types';

export class DashboardManager {
  private dynamoClient: DynamoDBDocumentClient;

  constructor(region: string = 'eu-central-1') {
    const dynamoClient = new DynamoDBClient({ region });
    this.dynamoClient = DynamoDBDocumentClient.from(dynamoClient);
  }

  /**
   * Create a new dashboard
   */
  async createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dashboard> {
    const dashboardId = this.generateDashboardId();
    const now = new Date().toISOString();

    const newDashboard: Dashboard = {
      ...dashboard,
      id: dashboardId,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const command = new PutCommand({
        TableName: 'dashboards',
        Item: {
          PK: `DASHBOARD#${dashboardId}`,
          SK: 'METADATA',
          ...newDashboard,
          GSI1PK: `USER#${dashboard.createdBy}`,
          GSI1SK: `DASHBOARD#${now}`,
          GSI2PK: `TYPE#${dashboard.type}`,
          GSI2SK: `DASHBOARD#${dashboardId}`,
        },
      });

      await this.dynamoClient.send(command);

      // Create analytics record
      await this.initializeDashboardAnalytics(dashboardId);

      console.log(`Dashboard created: ${dashboardId}`);
      return newDashboard;
    } catch (error) {
      console.error('Failed to create dashboard:', error);
      throw error;
    }
  }

  /**
   * Get dashboard by ID
   */
  async getDashboard(dashboardId: string, userId?: string): Promise<Dashboard | null> {
    try {
      const command = new GetCommand({
        TableName: 'dashboards',
        Key: {
          PK: `DASHBOARD#${dashboardId}`,
          SK: 'METADATA',
        },
      });

      const response = await this.dynamoClient.send(command);
      if (!response.Item) {
        return null;
      }

      const dashboard = this.parseDashboardItem(response.Item);

      // Check permissions if userId provided
      if (userId && !this.hasViewPermission(dashboard, userId)) {
        throw new Error('Access denied');
      }

      return dashboard;
    } catch (error) {
      console.error(`Failed to get dashboard ${dashboardId}:`, error);
      throw error;
    }
  }

  /**
   * Update dashboard
   */
  async updateDashboard(
    dashboardId: string, 
    updates: Partial<Dashboard>, 
    userId: string
  ): Promise<Dashboard> {
    try {
      // Get current dashboard to check permissions
      const currentDashboard = await this.getDashboard(dashboardId, userId);
      if (!currentDashboard) {
        throw new Error('Dashboard not found');
      }

      if (!this.hasEditPermission(currentDashboard, userId)) {
        throw new Error('Edit permission denied');
      }

      const updatedDashboard = {
        ...currentDashboard,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const command = new UpdateCommand({
        TableName: 'dashboards',
        Key: {
          PK: `DASHBOARD#${dashboardId}`,
          SK: 'METADATA',
        },
        UpdateExpression: 'SET #name = :name, #description = :description, #layout = :layout, #widgets = :widgets, #filters = :filters, #settings = :settings, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#name': 'name',
          '#description': 'description',
          '#layout': 'layout',
          '#widgets': 'widgets',
          '#filters': 'filters',
          '#settings': 'settings',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':name': updatedDashboard.name,
          ':description': updatedDashboard.description,
          ':layout': updatedDashboard.layout,
          ':widgets': updatedDashboard.widgets,
          ':filters': updatedDashboard.filters,
          ':settings': updatedDashboard.settings,
          ':updatedAt': updatedDashboard.updatedAt,
        },
        ReturnValues: 'ALL_NEW',
      });

      const response = await this.dynamoClient.send(command);
      return this.parseDashboardItem(response.Attributes!);
    } catch (error) {
      console.error(`Failed to update dashboard ${dashboardId}:`, error);
      throw error;
    }
  }

  /**
   * Delete dashboard
   */
  async deleteDashboard(dashboardId: string, userId: string): Promise<void> {
    try {
      const dashboard = await this.getDashboard(dashboardId, userId);
      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      if (!this.hasAdminPermission(dashboard, userId)) {
        throw new Error('Admin permission required');
      }

      // Delete dashboard
      const deleteCommand = new DeleteCommand({
        TableName: 'dashboards',
        Key: {
          PK: `DASHBOARD#${dashboardId}`,
          SK: 'METADATA',
        },
      });

      await this.dynamoClient.send(deleteCommand);

      // Delete analytics
      await this.deleteDashboardAnalytics(dashboardId);

      // Delete shares
      await this.deleteAllShares(dashboardId);

      console.log(`Dashboard deleted: ${dashboardId}`);
    } catch (error) {
      console.error(`Failed to delete dashboard ${dashboardId}:`, error);
      throw error;
    }
  }

  /**
   * List dashboards for user
   */
  async listDashboards(
    userId: string, 
    type?: string, 
    limit: number = 50, 
    lastKey?: string
  ): Promise<{
    dashboards: Dashboard[];
    lastKey?: string;
  }> {
    try {
      let command;

      if (type) {
        // Query by type
        command = new QueryCommand({
          TableName: 'dashboards',
          IndexName: 'GSI2',
          KeyConditionExpression: 'GSI2PK = :pk',
          ExpressionAttributeValues: {
            ':pk': `TYPE#${type}`,
          },
          Limit: limit,
          ExclusiveStartKey: lastKey ? JSON.parse(lastKey) : undefined,
        });
      } else {
        // Query by user
        command = new QueryCommand({
          TableName: 'dashboards',
          IndexName: 'GSI1',
          KeyConditionExpression: 'GSI1PK = :pk',
          ExpressionAttributeValues: {
            ':pk': `USER#${userId}`,
          },
          ScanIndexForward: false, // Most recent first
          Limit: limit,
          ExclusiveStartKey: lastKey ? JSON.parse(lastKey) : undefined,
        });
      }

      const response = await this.dynamoClient.send(command);
      const dashboards = (response.Items || [])
        .map(item => this.parseDashboardItem(item))
        .filter(dashboard => this.hasViewPermission(dashboard, userId));

      return {
        dashboards,
        lastKey: response.LastEvaluatedKey ? JSON.stringify(response.LastEvaluatedKey) : undefined,
      };
    } catch (error) {
      console.error('Failed to list dashboards:', error);
      throw error;
    }
  }

  /**
   * Clone dashboard
   */
  async cloneDashboard(
    dashboardId: string, 
    userId: string, 
    newName?: string
  ): Promise<Dashboard> {
    try {
      const originalDashboard = await this.getDashboard(dashboardId, userId);
      if (!originalDashboard) {
        throw new Error('Dashboard not found');
      }

      const clonedDashboard = {
        ...originalDashboard,
        name: newName || `${originalDashboard.name} (Copy)`,
        createdBy: userId,
        permissions: {
          view: [userId],
          edit: [userId],
          admin: [userId],
          share: [userId],
        },
      };

      // Remove ID and timestamps to create new dashboard
      const { id, createdAt, updatedAt, ...dashboardData } = clonedDashboard;
      
      return await this.createDashboard(dashboardData);
    } catch (error) {
      console.error(`Failed to clone dashboard ${dashboardId}:`, error);
      throw error;
    }
  }

  /**
   * Create dashboard from template
   */
  async createFromTemplate(
    templateId: string, 
    userId: string, 
    customizations?: Partial<Dashboard>
  ): Promise<Dashboard> {
    try {
      const template = await this.getDashboardTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      const dashboardData = {
        ...template.dashboard,
        ...customizations,
        createdBy: userId,
        permissions: {
          view: [userId],
          edit: [userId],
          admin: [userId],
          share: [userId],
        },
      };

      return await this.createDashboard(dashboardData);
    } catch (error) {
      console.error(`Failed to create dashboard from template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Get dashboard template
   */
  async getDashboardTemplate(templateId: string): Promise<DashboardTemplate | null> {
    try {
      const command = new GetCommand({
        TableName: 'dashboard-templates',
        Key: {
          PK: `TEMPLATE#${templateId}`,
          SK: 'METADATA',
        },
      });

      const response = await this.dynamoClient.send(command);
      return response.Item ? (response.Item as DashboardTemplate) : null;
    } catch (error) {
      console.error(`Failed to get dashboard template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * List dashboard templates
   */
  async listDashboardTemplates(
    category?: string, 
    limit: number = 50
  ): Promise<DashboardTemplate[]> {
    try {
      let command;

      if (category) {
        command = new QueryCommand({
          TableName: 'dashboard-templates',
          IndexName: 'GSI1',
          KeyConditionExpression: 'GSI1PK = :pk',
          ExpressionAttributeValues: {
            ':pk': `CATEGORY#${category}`,
          },
          Limit: limit,
        });
      } else {
        command = new ScanCommand({
          TableName: 'dashboard-templates',
          FilterExpression: 'begins_with(PK, :pk)',
          ExpressionAttributeValues: {
            ':pk': 'TEMPLATE#',
          },
          Limit: limit,
        });
      }

      const response = await this.dynamoClient.send(command);
      return (response.Items || []) as DashboardTemplate[];
    } catch (error) {
      console.error('Failed to list dashboard templates:', error);
      throw error;
    }
  }

  /**
   * Share dashboard
   */
  async shareDashboard(
    dashboardId: string, 
    userId: string, 
    shareConfig: Omit<DashboardShare, 'id' | 'dashboardId' | 'accessCount' | 'createdBy' | 'createdAt'>
  ): Promise<DashboardShare> {
    try {
      const dashboard = await this.getDashboard(dashboardId, userId);
      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      if (!this.hasSharePermission(dashboard, userId)) {
        throw new Error('Share permission denied');
      }

      const shareId = this.generateShareId();
      const now = new Date().toISOString();

      const share: DashboardShare = {
        ...shareConfig,
        id: shareId,
        dashboardId,
        accessCount: 0,
        createdBy: userId,
        createdAt: now,
      };

      const command = new PutCommand({
        TableName: 'dashboard-shares',
        Item: {
          PK: `SHARE#${shareId}`,
          SK: 'METADATA',
          ...share,
          GSI1PK: `DASHBOARD#${dashboardId}`,
          GSI1SK: `SHARE#${now}`,
        },
      });

      await this.dynamoClient.send(command);
      return share;
    } catch (error) {
      console.error(`Failed to share dashboard ${dashboardId}:`, error);
      throw error;
    }
  }

  /**
   * Get dashboard analytics
   */
  async getDashboardAnalytics(
    dashboardId: string, 
    userId: string, 
    timeRange?: { start: string; end: string }
  ): Promise<DashboardAnalytics | null> {
    try {
      const dashboard = await this.getDashboard(dashboardId, userId);
      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      if (!this.hasViewPermission(dashboard, userId)) {
        throw new Error('View permission denied');
      }

      const command = new GetCommand({
        TableName: 'dashboard-analytics',
        Key: {
          PK: `ANALYTICS#${dashboardId}`,
          SK: timeRange ? `RANGE#${timeRange.start}#${timeRange.end}` : 'CURRENT',
        },
      });

      const response = await this.dynamoClient.send(command);
      return response.Item ? (response.Item as DashboardAnalytics) : null;
    } catch (error) {
      console.error(`Failed to get dashboard analytics ${dashboardId}:`, error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private generateDashboardId(): string {
    return `dash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateShareId(): string {
    return `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private parseDashboardItem(item: any): Dashboard {
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...dashboard } = item;
    return dashboard as Dashboard;
  }

  private hasViewPermission(dashboard: Dashboard, userId: string): boolean {
    return dashboard.permissions.view.includes(userId) || 
           dashboard.permissions.view.includes('*') ||
           dashboard.createdBy === userId;
  }

  private hasEditPermission(dashboard: Dashboard, userId: string): boolean {
    return dashboard.permissions.edit.includes(userId) || 
           dashboard.createdBy === userId;
  }

  private hasAdminPermission(dashboard: Dashboard, userId: string): boolean {
    return dashboard.permissions.admin.includes(userId) || 
           dashboard.createdBy === userId;
  }

  private hasSharePermission(dashboard: Dashboard, userId: string): boolean {
    return dashboard.permissions.share.includes(userId) || 
           dashboard.createdBy === userId;
  }

  private async initializeDashboardAnalytics(dashboardId: string): Promise<void> {
    const analytics: DashboardAnalytics = {
      dashboardId,
      views: 0,
      uniqueUsers: 0,
      avgSessionDuration: 0,
      bounceRate: 0,
      popularWidgets: [],
      performanceMetrics: {
        avgLoadTime: 0,
        p95LoadTime: 0,
        errorRate: 0,
        cacheHitRate: 0,
        dataFreshness: 0,
      },
      userInteractions: [],
    };

    const command = new PutCommand({
      TableName: 'dashboard-analytics',
      Item: {
        PK: `ANALYTICS#${dashboardId}`,
        SK: 'CURRENT',
        ...analytics,
      },
    });

    await this.dynamoClient.send(command);
  }

  private async deleteDashboardAnalytics(dashboardId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: 'dashboard-analytics',
      Key: {
        PK: `ANALYTICS#${dashboardId}`,
        SK: 'CURRENT',
      },
    });

    await this.dynamoClient.send(command);
  }

  private async deleteAllShares(dashboardId: string): Promise<void> {
    try {
      const command = new QueryCommand({
        TableName: 'dashboard-shares',
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `DASHBOARD#${dashboardId}`,
        },
      });

      const response = await this.dynamoClient.send(command);
      if (response.Items && response.Items.length > 0) {
        for (const item of response.Items) {
          const deleteCommand = new DeleteCommand({
            TableName: 'dashboard-shares',
            Key: {
              PK: item.PK,
              SK: item.SK,
            },
          });
          await this.dynamoClient.send(deleteCommand);
        }
      }
    } catch (error) {
      console.error(`Failed to delete shares for dashboard ${dashboardId}:`, error);
    }
  }
}