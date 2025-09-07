// Updated Lambda handler with PostgreSQL integration
const { getPgClient, executeQuery, healthCheck } = require('/opt/pgClient');

exports.handler = async (event, context) => {
    console.log('Event received:', JSON.stringify(event, null, 2));
    
    try {
        // Perform database health check
        console.log('Testing database connection...');
        const healthResult = await healthCheck();
        console.log('Health check result:', healthResult);
        
        // Execute a simple query to get current time
        const timeResult = await executeQuery('SELECT NOW() as current_time, version() as db_version');
        console.log('DB Time:', timeResult.rows[0].current_time);
        console.log('DB Version:', timeResult.rows[0].db_version);
        
        // Test a query on visibility_check_leads table to ensure we can access our data
        const leadCountResult = await executeQuery('SELECT COUNT(*) as lead_count FROM visibility_check_leads');
        console.log('Total leads in database:', leadCountResult.rows[0].lead_count);
        
        return {
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
                dbVersion: timeResult.rows[0].db_version,
                leadCount: leadCountResult.rows[0].lead_count,
                functionName: context.functionName,
                requestId: context.awsRequestId
            })
        };
        
    } catch (error) {
        console.error('Database connection failed:', error);
        
        return {
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
                requestId: context.awsRequestId
            })
        };
    }
};