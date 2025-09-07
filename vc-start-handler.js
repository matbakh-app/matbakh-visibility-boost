// VcStartFn - Visibility Check Start Logic
const { getPgClient, executeQuery } = require('/opt/nodejs/pgClient');

exports.handler = async (event, context) => {
    console.log('VcStartFn - Event received:', JSON.stringify(event, null, 2));
    console.log('Function name:', context.functionName);
    console.log('Request ID:', context.awsRequestId);
    
    try {
        // Get database connection
        console.log('Connecting to database...');
        const pool = await getPgClient();
        
        // Count existing visibility check leads
        console.log('Querying visibility_check_leads table...');
        const leadsResult = await executeQuery('SELECT COUNT(*) as count FROM visibility_check_leads');
        const leadsCount = parseInt(leadsResult.rows[0].count);
        
        // Get some sample data for context
        console.log('Getting recent leads...');
        const recentLeadsResult = await executeQuery(
            'SELECT id, business_name, email, status, created_at FROM visibility_check_leads ORDER BY created_at DESC LIMIT 5'
        );
        
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
                message: 'VC Start logic - ready for business logic implementation',
                service: 'visibility-check-start',
                leadsCount: leadsCount,
                recentLeads: recentLeadsResult.rows.map(row => ({
                    id: row.id,
                    businessName: row.business_name,
                    email: row.email,
                    status: row.status,
                    createdAt: row.created_at
                })),
                functionName: context.functionName,
                requestId: context.awsRequestId,
                timestamp: new Date().toISOString(),
                ready: true
            })
        };
        
        console.log('VcStartFn - Returning successful response');
        return response;
        
    } catch (error) {
        console.error('VcStartFn - Error:', error);
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
                error: 'VC Start function error',
                message: error.message,
                service: 'visibility-check-start',
                functionName: context.functionName,
                requestId: context.awsRequestId,
                timestamp: new Date().toISOString()
            })
        };
        
        console.log('VcStartFn - Returning error response');
        return errorResponse;
    }
};