# VPC Lambda Integration Issues

## Problem
Lambda functions deployed in VPC cannot access internet resources (like Secrets Manager, Resend API) without proper NAT Gateway configuration.

## Symptoms
- Lambda functions timeout when trying to access external APIs
- Secrets Manager access fails with timeout errors
- Email sending via Resend API fails

## Root Cause
Lambda functions in VPC need NAT Gateway or VPC Endpoints to access AWS services and internet resources.

## Solution

### Option 1: NAT Gateway (Recommended for Production)
```bash
# Create NAT Gateway in public subnet
aws ec2 create-nat-gateway \
  --subnet-id subnet-PUBLIC \
  --allocation-id eipalloc-ALLOCATION-ID

# Update route table for private subnets
aws ec2 create-route \
  --route-table-id rtb-PRIVATE \
  --destination-cidr-block 0.0.0.0/0 \
  --nat-gateway-id nat-GATEWAY-ID
```

### Option 2: VPC Endpoints (Cost-effective)
```bash
# Create VPC endpoint for Secrets Manager
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-ID \
  --service-name com.amazonaws.eu-central-1.secretsmanager \
  --vpc-endpoint-type Interface \
  --subnet-ids subnet-PRIVATE-1 subnet-PRIVATE-2
```

### Option 3: Remove VPC (Development Only)
```bash
# Update Lambda function to remove VPC configuration
aws lambda update-function-configuration \
  --function-name FUNCTION-NAME \
  --vpc-config '{}'
```

## Prevention
- Always plan VPC networking before deploying Lambda functions
- Use VPC endpoints for AWS services to reduce costs
- Test internet connectivity after VPC deployment

## Related Issues
- A2.4: Lambda VPC integration
- A3.2: Secrets Manager access from Lambda