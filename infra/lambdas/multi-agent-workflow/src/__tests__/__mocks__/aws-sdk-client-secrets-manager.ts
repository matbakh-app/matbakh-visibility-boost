import { jest } from '@jest/globals';

export class SecretsManagerClient {
  send = jest.fn();
  constructor(..._args: any[]) {}
}

export class GetSecretValueCommand {
  constructor(_input?: any) {}
}//
 Export to make this a module and prevent Jest "no tests" error
export {};