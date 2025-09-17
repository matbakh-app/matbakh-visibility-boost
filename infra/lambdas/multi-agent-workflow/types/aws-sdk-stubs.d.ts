declare module '@aws-sdk/client-bedrock-runtime' {
  export class BedrockRuntimeClient { 
    constructor(...args: any[]); 
    send: any; 
  }
  export class InvokeModelCommand { 
    constructor(input?: any); 
  }
}

declare module '@aws-sdk/client-secrets-manager' {
  export class SecretsManagerClient { 
    constructor(...args: any[]); 
    send: any; 
  }
  export class GetSecretValueCommand { 
    constructor(input?: any); 
  }
}

declare module '@aws-sdk/client-dynamodb' {
  export class DynamoDBClient { 
    constructor(...args: any[]); 
    send: any; 
  }
}

declare module '@aws-sdk/lib-dynamodb' {
  export const DynamoDBDocumentClient: { 
    from: (...args: any[]) => { send: any } 
  };
  export class PutCommand { 
    constructor(input?: any); 
  }
  export class GetCommand { 
    constructor(input?: any); 
  }
  export class UpdateCommand { 
    constructor(input?: any); 
  }
  export class QueryCommand { 
    constructor(input?: any); 
  }
  export class DeleteCommand { 
    constructor(input?: any); 
  }
}