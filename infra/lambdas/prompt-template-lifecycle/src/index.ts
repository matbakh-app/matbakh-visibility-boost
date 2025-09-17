import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { TemplateVersionManager } from './template-version-manager';
import { ApprovalWorkflowManager } from './approval-workflow-manager';
import { PerformanceTrackingManager } from './performance-tracking-manager';
import { ABTestingManager } from './ab-testing-manager';
import { RollbackManager } from './rollback-manager';
import {
  TemplateLifecycleRequest,
  TemplateLifecycleResponse,
  TemplateSearchQuery,
  Environment
} from './types';

const versionManager = new TemplateVersionManager();
const approvalManager = new ApprovalWorkflowManager();
const performanceManager = new PerformanceTrackingManager();
const abTestManager = new ABTestingManager();
const rollbackManager = new RollbackManager();

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = context.awsRequestId;
  const startTime = Date.now();

  try {
    console.log('Template Lifecycle Request:', {
      requestId,
      method: event.httpMethod,
      path: event.path,
      body: event.body
    });

    const method = event.httpMethod;
    const path = event.path;
    const pathSegments = path.split('/').filter(Boolean);

    let response: any;

    switch (method) {
      case 'POST':
        response = await handlePost(pathSegments, event.body, requestId);
        break;
      case 'GET':
        response = await handleGet(pathSegments, event.queryStringParameters, requestId);
        break;
      case 'PUT':
        response = await handlePut(pathSegments, event.body, requestId);
        break;
      case 'DELETE':
        response = await handleDelete(pathSegments, requestId);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }

    const processingTime = Date.now() - startTime;

    const successResponse: TemplateLifecycleResponse = {
      success: true,
      data: response,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime
      }
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify(successResponse)
    };

  } catch (error) {
    console.error('Template Lifecycle Error:', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    const processingTime = Date.now() - startTime;

    const errorResponse: TemplateLifecycleResponse = {
      success: false,
      error: {
        code: error instanceof Error ? error.constructor.name : 'UnknownError',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        details: { requestId }
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime
      }
    };

    return {
      statusCode: error instanceof ValidationError ? 400 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify(errorResponse)
    };
  }
};

async function handlePost(pathSegments: string[], body: string | null, requestId: string): Promise<any> {
  if (!body) {
    throw new ValidationError('Request body is required');
  }

  const request = JSON.parse(body) as TemplateLifecycleRequest;
  
  switch (pathSegments[0]) {
    case 'templates':
      return await versionManager.createTemplate(request.data);

    case 'versions':
      if (pathSegments[1] === 'create') {
        return await versionManager.createVersion(request.templateId!, request.data);
      }
      break;

    case 'approval':
      if (pathSegments[1] === 'submit') {
        return await approvalManager.submitForApproval(request.versionId!, request.userId);
      } else if (pathSegments[1] === 'approve') {
        return await approvalManager.approveStage(
          request.versionId!,
          request.data.stageIndex,
          request.userId,
          request.data.comment
        );
      } else if (pathSegments[1] === 'reject') {
        return await approvalManager.rejectStage(
          request.versionId!,
          request.data.stageIndex,
          request.userId,
          request.data.reason
        );
      } else if (pathSegments[1] === 'comment') {
        return await approvalManager.addComment(
          request.versionId!,
          request.userId,
          request.data.comment,
          request.data.type
        );
      }
      break;

    case 'executions':
      return await performanceManager.recordExecution(request.data);

    case 'abtests':
      if (pathSegments[1] === 'create') {
        return await abTestManager.createABTest(request.data);
      } else if (pathSegments[1] === 'start') {
        return await abTestManager.startABTest(request.data.testId);
      } else if (pathSegments[1] === 'stop') {
        return await abTestManager.stopABTest(request.data.testId);
      }
      break;

    case 'rollback':
      if (pathSegments[1] === 'initiate') {
        return await rollbackManager.initiateRollback(
          request.data.currentVersionId,
          request.data.targetVersionId,
          request.data.reason,
          request.userId,
          request.data.rollbackType
        );
      } else if (pathSegments[1] === 'emergency') {
        return await rollbackManager.executeEmergencyRollback(
          request.templateId!,
          request.environment!,
          request.data.reason,
          request.userId
        );
      }
      break;

    default:
      throw new ValidationError(`Unknown endpoint: ${pathSegments.join('/')}`);
  }

  throw new ValidationError(`Invalid POST request: ${pathSegments.join('/')}`);
}

async function handleGet(pathSegments: string[], queryParams: any, requestId: string): Promise<any> {
  switch (pathSegments[0]) {
    case 'templates':
      if (pathSegments[1]) {
        return await versionManager.getTemplate(pathSegments[1]);
      } else {
        // Search templates
        const query: TemplateSearchQuery = queryParams || {};
        // Implementation would depend on search requirements
        throw new Error('Template search not implemented');
      }

    case 'versions':
      if (pathSegments[1]) {
        if (pathSegments[2] === 'history') {
          return await versionManager.getVersionsByTemplate(pathSegments[1]);
        } else {
          return await versionManager.getVersion(pathSegments[1]);
        }
      }
      break;

    case 'approval':
      if (pathSegments[1] === 'pending') {
        const approverId = queryParams?.approverId;
        if (!approverId) {
          throw new ValidationError('approverId query parameter is required');
        }
        return await approvalManager.getPendingApprovals(approverId);
      } else if (pathSegments[1] === 'history') {
        const templateId = queryParams?.templateId;
        if (!templateId) {
          throw new ValidationError('templateId query parameter is required');
        }
        return await approvalManager.getWorkflowHistory(templateId);
      }
      break;

    case 'performance':
      if (pathSegments[1] === 'metrics') {
        const versionId = queryParams?.versionId;
        if (!versionId) {
          throw new ValidationError('versionId query parameter is required');
        }
        return await performanceManager.getPerformanceMetrics(versionId);
      } else if (pathSegments[1] === 'analytics') {
        const templateId = queryParams?.templateId;
        const startDate = queryParams?.startDate;
        const endDate = queryParams?.endDate;
        if (!templateId || !startDate || !endDate) {
          throw new ValidationError('templateId, startDate, and endDate query parameters are required');
        }
        return await performanceManager.getTemplateAnalytics(templateId, startDate, endDate);
      } else if (pathSegments[1] === 'executions') {
        const versionId = queryParams?.versionId;
        const limit = queryParams?.limit ? parseInt(queryParams.limit) : 100;
        const startTime = queryParams?.startTime;
        const endTime = queryParams?.endTime;
        if (!versionId) {
          throw new ValidationError('versionId query parameter is required');
        }
        return await performanceManager.getExecutionHistory(versionId, limit, startTime, endTime);
      }
      break;

    case 'abtests':
      if (pathSegments[1]) {
        if (pathSegments[2] === 'results') {
          return await abTestManager.getABTestResults(pathSegments[1]);
        } else {
          return await abTestManager.getABTest(pathSegments[1]);
        }
      } else {
        return await abTestManager.getActiveABTests();
      }

    case 'rollback':
      if (pathSegments[1] === 'history') {
        const templateId = queryParams?.templateId;
        if (!templateId) {
          throw new ValidationError('templateId query parameter is required');
        }
        return await rollbackManager.getRollbackHistory(templateId);
      } else if (pathSegments[1] === 'validate') {
        const currentVersionId = queryParams?.currentVersionId;
        const targetVersionId = queryParams?.targetVersionId;
        if (!currentVersionId || !targetVersionId) {
          throw new ValidationError('currentVersionId and targetVersionId query parameters are required');
        }
        return await rollbackManager.validateRollbackTarget(currentVersionId, targetVersionId);
      }
      break;

    default:
      throw new ValidationError(`Unknown endpoint: ${pathSegments.join('/')}`);
  }

  throw new ValidationError(`Invalid GET request: ${pathSegments.join('/')}`);
}

async function handlePut(pathSegments: string[], body: string | null, requestId: string): Promise<any> {
  if (!body) {
    throw new ValidationError('Request body is required');
  }

  const request = JSON.parse(body) as TemplateLifecycleRequest;

  switch (pathSegments[0]) {
    case 'versions':
      if (pathSegments[2] === 'deploy') {
        return await versionManager.deployVersion(pathSegments[1], request.environment!);
      } else if (pathSegments[2] === 'status') {
        return await versionManager.updateVersionStatus(pathSegments[1], request.data.status);
      }
      break;

    case 'abtests':
      if (pathSegments[2] === 'pause') {
        return await abTestManager.pauseABTest(pathSegments[1]);
      }
      break;

    default:
      throw new ValidationError(`Unknown endpoint: ${pathSegments.join('/')}`);
  }

  throw new ValidationError(`Invalid PUT request: ${pathSegments.join('/')}`);
}

async function handleDelete(pathSegments: string[], requestId: string): Promise<any> {
  switch (pathSegments[0]) {
    case 'approval':
      if (pathSegments[1] === 'cancel') {
        // This would require additional parameters in the path or query
        throw new Error('Cancel approval not implemented');
      }
      break;

    default:
      throw new ValidationError(`Unknown endpoint: ${pathSegments.join('/')}`);
  }

  throw new ValidationError(`Invalid DELETE request: ${pathSegments.join('/')}`);
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}