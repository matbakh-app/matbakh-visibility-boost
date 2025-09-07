import { PreSignUpTriggerEvent, PreSignUpTriggerHandler } from 'aws-lambda';
import { CloudWatchLogs } from 'aws-sdk';

const cloudWatchLogs = new CloudWatchLogs();

/**
 * Cognito Pre-SignUp Trigger
 * Handles user validation and auto-confirmation for trusted domains
 */
export const handler: PreSignUpTriggerHandler = async (event: PreSignUpTriggerEvent) => {
    console.log('Pre-SignUp trigger event:', JSON.stringify(event, null, 2));
    
    try {
        const { userAttributes, validationData } = event.request;
        const email = userAttributes.email;
        
        // Log signup attempt for audit trail
        await logSignupAttempt(event);
        
        // Validate email format
        if (!isValidEmail(email)) {
            throw new Error('Invalid email format');
        }
        
        // Auto-confirm for trusted domains (internal testing)
        if (email.endsWith('@matbakh.app') || email.endsWith('@matbakh.dev')) {
            event.response.autoConfirmUser = true;
            event.response.autoVerifyEmail = true;
            console.log('Auto-confirmed trusted domain user:', email);
        }
        
        // Set default custom attributes
        event.response.userAttributes = {
            ...userAttributes,
            'custom:user_role': userAttributes['custom:user_role'] || 'owner',
            'custom:locale': userAttributes['custom:locale'] || 'de',
            'custom:profile_complete': 'false',
            'custom:onboarding_step': '0'
        };
        
        // Validate business email (optional enhancement)
        if (validationData?.requireBusinessEmail === 'true') {
            const isBusinessEmail = await validateBusinessEmail(email);
            if (!isBusinessEmail) {
                throw new Error('Please use a business email address');
            }
        }
        
        console.log('Pre-SignUp validation successful for:', email);
        return event;
        
    } catch (error) {
        console.error('Pre-SignUp error:', error);
        
        // Log error for monitoring
        await logSignupError(event, error as Error);
        
        // Throw error to prevent signup
        throw error;
    }
};

/**
 * Validate email format using regex
 */
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate if email appears to be a business email
 * (not gmail, yahoo, hotmail, etc.)
 */
async function validateBusinessEmail(email: string): Promise<boolean> {
    const personalDomains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
        'web.de', 'gmx.de', 't-online.de', 'freenet.de'
    ];
    
    const domain = email.split('@')[1]?.toLowerCase();
    return !personalDomains.includes(domain);
}

/**
 * Log signup attempt for audit trail
 */
async function logSignupAttempt(event: PreSignUpTriggerEvent): Promise<void> {
    const auditEntry = {
        timestamp: new Date().toISOString(),
        event: 'USER_SIGNUP_ATTEMPT',
        email: event.request.userAttributes.email,
        triggerSource: event.triggerSource,
        userPoolId: event.userPoolId,
        clientId: event.callerContext.clientId,
        ipAddress: event.request.clientMetadata?.ipAddress,
        userAgent: event.request.clientMetadata?.userAgent
    };
    
    try {
        await cloudWatchLogs.putLogEvents({
            logGroupName: '/aws/lambda/matbakh-cognito-audit',
            logStreamName: `signup-audit-${new Date().toISOString().split('T')[0]}`,
            logEvents: [{
                timestamp: Date.now(),
                message: JSON.stringify(auditEntry)
            }]
        }).promise();
    } catch (error) {
        console.warn('Failed to log audit entry:', error);
        // Don't fail signup for logging errors
    }
}

/**
 * Log signup error for monitoring
 */
async function logSignupError(event: PreSignUpTriggerEvent, error: Error): Promise<void> {
    const errorEntry = {
        timestamp: new Date().toISOString(),
        event: 'USER_SIGNUP_ERROR',
        email: event.request.userAttributes.email,
        error: error.message,
        triggerSource: event.triggerSource,
        userPoolId: event.userPoolId
    };
    
    try {
        await cloudWatchLogs.putLogEvents({
            logGroupName: '/aws/lambda/matbakh-cognito-errors',
            logStreamName: `signup-errors-${new Date().toISOString().split('T')[0]}`,
            logEvents: [{
                timestamp: Date.now(),
                message: JSON.stringify(errorEntry)
            }]
        }).promise();
    } catch (logError) {
        console.warn('Failed to log error entry:', logError);
    }
}