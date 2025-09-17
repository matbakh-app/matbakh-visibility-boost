import { jest } from '@jest/globals';

export class BedrockRuntimeClient {
  send = jest.fn();
  constructor(..._args: any[]) {}
}

export class InvokeModelCommand {
  constructor(_input?: any) {}
}