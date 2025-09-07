#!/bin/bash

# Continuous AWS health monitoring
while true; do
    echo "$(date): Checking AWS health..."
    
    # Check RDS
    aws rds describe-db-instances --db-instance-identifier matbakh-db --query 'DBInstances[0].DBInstanceStatus' --output text
    
    # Check Lambda
    aws lambda get-function --function-name matbakh-db-test --query 'Configuration.State' --output text
    
    # Check API Gateway
    curl -s -o /dev/null -w "%{http_code}" https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/health
    
    echo "Health check complete"
    sleep 300  # Check every 5 minutes
done
