// Updated Lambda handler with PostgreSQL integration
// Import from the layer's correct path
const { getPgClient, executeQuery, healthCheck } = require('/opt/nodejs/pgClient');

exports.handler = async (event, context) => {
    console.log('Event received:', JSON.stringify(event, null, 2));
    console.log('Function name:', context.functionName);
    console.log('Request ID:', context.awsRequestId);
    
    try {
        // Perform database health check
        console.log('Testing database connection...');
        const healthResult = await healthCheck();
        console.log('Health check result:', JSON.stringify(healthResult, null, 2));
        
        if (!healthResult.success) {
            throw new Error(healthResult.message);
        }
        
        // Execute a simple query to get current time
        console.log('Executing time query...');
        const timeResult = await executeQuery('SELECT NOW() as current_time, version() as db_version');
        console.log('DB Time:', timeResult.rows[0].current_time);
        console.log('DB Version:', timeResult.rows[0].db_version.substring(0, 50) + '...');
        
        // Test a query on visibility_check_leads table to ensure we can access our data
        console.log('Checking visibility_check_leads table...');
        const leadCountResult = await executeQuery('SELECT COUNT(*) as lead_count FROM visibility_check_leads');
        console.log('Total leads in database:', leadCountResult.rows[0].lead_count);
        
        // Test profiles table access (from RBAC system)
        console.log('Checking profiles table...');
        const profileCountResult = await executeQuery('SELECT COUNT(*) as profile_count FROM profiles');
        console.log('Total profiles in database:', profileCountResult.rows[0].profile_count);
        
        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            body: JSON.stringify({
                message: 'Database connection successful',
                dbTime: timeResult.rows[0].current_time,
                dbVersion: timeResult.rows[0].db_version.substring(0, 100),
                leadCount: parseInt(leadCountResult.rows[0].lead_count),
                profileCount: parseInt(profileCountResult.rows[0].profile_count),
                functionName: context.functionName,
                requestId: context.awsRequestId,
                healthCheck: healthResult
            })
        };
        
        console.log('Returning successful response');
        return response;
        
    } catch (error) {
        console.error('Database connection failed:', error);
        console.error('Error stack:', error.stack);
        
        const errorResponse = {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            body: JSON.stringify({
                error: 'Database connection failed',
                message: error.message,
                functionName: context.functionName,
                requestId: context.awsRequestId,
                timestamp: new Date().toISOString()
            })
        };
        
        console.log('Returning error response');
        return errorResponse;
    }
};