// VcConfirmFn - Visibility Check Confirm Logic
const { getPgClient, executeQuery } = require('/opt/nodejs/pgClient');

exports.handler = async (event, context) => {
    console.log('VcConfirmFn - Event received:', JSON.stringify(event, null, 2));
    console.log('Function name:', context.functionName);
    console.log('Request ID:', context.awsRequestId);
    
    try {
        // Get database connection
        console.log('Connecting to database...');
        const pool = await getPgClient();
        
        // Count profiles (from RBAC system)
        console.log('Querying profiles table...');
        const profilesResult = await executeQuery('SELECT COUNT(*) as count FROM profiles');
        const profileCount = parseInt(profilesResult.rows[0].count);
        
        // Get profile breakdown by role
        console.log('Getting profile breakdown by role...');
        const roleBreakdownResult = await executeQuery(
            'SELECT role, COUNT(*) as count FROM profiles GROUP BY role ORDER BY role'
        );
        
        // Check for any confirmed visibility check leads
        console.log('Checking confirmed VC leads...');
        const confirmedLeadsResult = await executeQuery(
            'SELECT COUNT(*) as count FROM visibility_check_leads WHERE email_confirmed = true'
        );
        const confirmedLeadsCount = parseInt(confirmedLeadsResult.rows[0].count);
        
        // Prepare response
        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            body: JSON.stringify({
                message: 'VC Confirm logic - ready for business logic implementation',
                service: 'visibility-check-confirm',
                profileCount: profileCount,
                confirmedLeadsCount: confirmedLeadsCount,
                roleBreakdown: roleBreakdownResult.rows.map(row => ({
                    role: row.role,
                    count: parseInt(row.count)
                })),
                functionName: context.functionName,
                requestId: context.awsRequestId,
                timestamp: new Date().toISOString(),
                ready: true
            })
        };
        
        console.log('VcConfirmFn - Returning successful response');
        return response;
        
    } catch (error) {
        console.error('VcConfirmFn - Error:', error);
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
                error: 'VC Confirm function error',
                message: error.message,
                service: 'visibility-check-confirm',
                functionName: context.functionName,
                requestId: context.awsRequestId,
                timestamp: new Date().toISOString()
            })
        };
        
        console.log('VcConfirmFn - Returning error response');
        return errorResponse;
    }
};