import { jest } from '@jest/globals';

export class DynamoDBClient {
  send = jest.fn();
  constructor(..._args: any[]) {}
}// 
Export to make this a module and prevent Jest "no tests" error
export {};