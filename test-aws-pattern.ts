// Test file to verify AWS patterns are allowed
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient({ region: 'eu-central-1' });