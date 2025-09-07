/**
 * Cognito Post-Confirmation Trigger
 * Creates user profile in RDS using the fix-tables Lambda
 */
export const handler = async (event: any) => {
    console.log('Post-Confirmation trigger event:', JSON.stringify(event, null, 2));
    
    try {
        // Validate event structure
        if (!event || !event.request || !event.request.userAttributes) {
            console.error('Invalid event structure:', event);
            return event;
        }
        
        const { userAttributes } = event.request;
        
        // Create user profile using the fix-tables Lambda
        await createUserProfileViaLambda(userAttributes);
        
        console.log('Post-Confirmation processing completed for:', userAttributes.email);
        return event;
        
    } catch (error) {
        console.error('Post-Confirmation error:', error);
        
        // Return event to complete confirmation even if profile creation fails
        // Profile can be created later via retry mechanism
        return event;
    }
};

/**
 * Create user profile by invoking the fix-tables Lambda
 */
async function createUserProfileViaLambda(userAttributes: any): Promise<void> {
    const AWS = require('aws-sdk');
    const lambda = new AWS.Lambda({ region: 'eu-central-1' });
    
    const payload = {
        action: 'create_user_profile',
        userAttributes: {
            sub: userAttributes.sub,
            email: userAttributes.email,
            given_name: userAttributes.given_name || null,
            family_name: userAttributes.family_name || null,
            user_role: userAttributes['custom:user_role'] || 'owner',
            locale: userAttributes['custom:locale'] || 'de'
        }
    };
    
    try {
        const result = await lambda.invoke({
            FunctionName: 'matbakh-fix-tables',
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(payload)
        }).promise();
        
        const response = JSON.parse(result.Payload as string);
        
        if (response.statusCode === 200) {
            console.log('User profile created successfully via Lambda:', userAttributes.email);
        } else {
            console.error('Failed to create user profile:', response);
        }
        
    } catch (error) {
        console.error('Error invoking fix-tables Lambda:', error);
        throw error;
    }
}

