import { jest } from '@jest/globals';

const send = jest.fn();

export const DynamoDBDocumentClient = {
  from: jest.fn(() => ({ send }))
};

export class PutCommand {
  constructor(_i?: any) {}
}

export class GetCommand {
  constructor(_i?: any) {}
}

export class UpdateCommand {
  constructor(_i?: any) {}
}

export class QueryCommand {
  constructor(_i?: any) {}
}

export class DeleteCommand {
  constructor(_i?: any) {}
}// Export 
to make this a module and prevent Jest "no tests" error
export {};