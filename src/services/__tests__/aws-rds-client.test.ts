import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AwsRdsClient } from '../aws-rds-client';

// Mock AWS RDS Data Service
const mockExecuteStatement = jest.fn();
const mockBeginTransaction = jest.fn();
const mockCommitTransaction = jest.fn();
const mockRollbackTransaction = jest.fn();

jest.mock('@aws-sdk/client-rds-data', () => ({
  RDSDataClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockImplementation((command) => {
      if (command.constructor.name === 'ExecuteStatementCommand') {
        return mockExecuteStatement(command);
      }
      if (command.constructor.name === 'BeginTransactionCommand') {
        return mockBeginTransaction(command);
      }
      if (command.constructor.name === 'CommitTransactionCommand') {
        return mockCommitTransaction(command);
      }
      if (command.constructor.name === 'RollbackTransactionCommand') {
        return mockRollbackTransaction(command);
      }
    }))
  })),
  ExecuteStatementCommand: jest.fn(),
  BeginTransactionCommand: jest.fn(),
  CommitTransactionCommand: jest.fn(),
  RollbackTransactionCommand: jest.fn(),
}));

describe('AwsRdsClient', () => {
  let rdsClient: AwsRdsClient;

  beforeEach(() => {
    rdsClient = new AwsRdsClient();
    jest.clearAllMocks();
    mockExecuteStatement.mockClear();
    mockBeginTransaction.mockClear();
    mockCommitTransaction.mockClear();
    mockRollbackTransaction.mockClear();
  });

  describe('Query Execution', () => {
    it('should execute SELECT query successfully', async () => {
      const mockResult = {
        records: [
          [
            { stringValue: '1' },
            { stringValue: 'Test Restaurant' },
            { stringValue: 'test@restaurant.com' }
          ],
          [
            { stringValue: '2' },
            { stringValue: 'Another Restaurant' },
            { stringValue: 'another@restaurant.com' }
          ]
        ],
        columnMetadata: [
          { name: 'id', typeName: 'VARCHAR' },
          { name: 'name', typeName: 'VARCHAR' },
          { name: 'email', typeName: 'VARCHAR' }
        ]
      };

      mockExecuteStatement.mockResolvedValue(mockResult);

      const result = await rdsClient.executeQuery(
        'SELECT id, name, email FROM restaurants WHERE active = ?',
        [true]
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '1',
        name: 'Test Restaurant',
        email: 'test@restaurant.com'
      });
      expect(result[1]).toEqual({
        id: '2',
        name: 'Another Restaurant',
        email: 'another@restaurant.com'
      });
    });

    it('should execute INSERT query successfully', async () => {
      const mockResult = {
        generatedFields: [{ longValue: 123 }],
        numberOfRecordsUpdated: 1
      };

      mockExecuteStatement.mockResolvedValue(mockResult);

      const result = await rdsClient.executeQuery(
        'INSERT INTO restaurants (name, email, phone) VALUES (?, ?, ?)',
        ['New Restaurant', 'new@restaurant.com', '+49123456789']
      );

      expect(result).toEqual({
        insertId: 123,
        affectedRows: 1
      });
      expect(mockExecuteStatement).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: 'INSERT INTO restaurants (name, email, phone) VALUES (?, ?, ?)',
          parameters: [
            { name: 'param1', value: { stringValue: 'New Restaurant' } },
            { name: 'param2', value: { stringValue: 'new@restaurant.com' } },
            { name: 'param3', value: { stringValue: '+49123456789' } }
          ]
        })
      );
    });

    it('should execute UPDATE query successfully', async () => {
      const mockResult = {
        numberOfRecordsUpdated: 1
      };

      mockExecuteStatement.mockResolvedValue(mockResult);

      const result = await rdsClient.executeQuery(
        'UPDATE restaurants SET name = ?, email = ? WHERE id = ?',
        ['Updated Restaurant', 'updated@restaurant.com', 123]
      );

      expect(result).toEqual({
        affectedRows: 1
      });
    });

    it('should execute DELETE query successfully', async () => {
      const mockResult = {
        numberOfRecordsUpdated: 1
      };

      mockExecuteStatement.mockResolvedValue(mockResult);

      const result = await rdsClient.executeQuery(
        'DELETE FROM restaurants WHERE id = ?',
        [123]
      );

      expect(result).toEqual({
        affectedRows: 1
      });
    });

    it('should handle queries with no results', async () => {
      const mockResult = {
        records: []
      };

      mockExecuteStatement.mockResolvedValue(mockResult);

      const result = await rdsClient.executeQuery(
        'SELECT * FROM restaurants WHERE id = ?',
        [999]
      );

      expect(result).toEqual([]);
    });
  });

  describe('Parameter Handling', () => {
    it('should handle string parameters', async () => {
      mockExecuteStatement.mockResolvedValue({ records: [] });

      await rdsClient.executeQuery(
        'SELECT * FROM restaurants WHERE name = ?',
        ['Test Restaurant']
      );

      expect(mockExecuteStatement).toHaveBeenCalledWith(
        expect.objectContaining({
          parameters: [
            { name: 'param1', value: { stringValue: 'Test Restaurant' } }
          ]
        })
      );
    });

    it('should handle number parameters', async () => {
      mockExecuteStatement.mockResolvedValue({ records: [] });

      await rdsClient.executeQuery(
        'SELECT * FROM restaurants WHERE id = ? AND rating > ?',
        [123, 4.5]
      );

      expect(mockExecuteStatement).toHaveBeenCalledWith(
        expect.objectContaining({
          parameters: [
            { name: 'param1', value: { longValue: 123 } },
            { name: 'param2', value: { doubleValue: 4.5 } }
          ]
        })
      );
    });

    it('should handle boolean parameters', async () => {
      mockExecuteStatement.mockResolvedValue({ records: [] });

      await rdsClient.executeQuery(
        'SELECT * FROM restaurants WHERE active = ? AND verified = ?',
        [true, false]
      );

      expect(mockExecuteStatement).toHaveBeenCalledWith(
        expect.objectContaining({
          parameters: [
            { name: 'param1', value: { booleanValue: true } },
            { name: 'param2', value: { booleanValue: false } }
          ]
        })
      );
    });

    it('should handle null parameters', async () => {
      mockExecuteStatement.mockResolvedValue({ records: [] });

      await rdsClient.executeQuery(
        'SELECT * FROM restaurants WHERE description = ?',
        [null]
      );

      expect(mockExecuteStatement).toHaveBeenCalledWith(
        expect.objectContaining({
          parameters: [
            { name: 'param1', value: { isNull: true } }
          ]
        })
      );
    });

    it('should handle Date parameters', async () => {
      mockExecuteStatement.mockResolvedValue({ records: [] });

      const testDate = new Date('2024-01-15T10:30:00Z');
      await rdsClient.executeQuery(
        'SELECT * FROM restaurants WHERE created_at > ?',
        [testDate]
      );

      expect(mockExecuteStatement).toHaveBeenCalledWith(
        expect.objectContaining({
          parameters: [
            { name: 'param1', value: { stringValue: '2024-01-15T10:30:00.000Z' } }
          ]
        })
      );
    });
  });

  describe('Transaction Management', () => {
    it('should begin transaction successfully', async () => {
      const mockTransactionId = 'txn-123456';
      mockBeginTransaction.mockResolvedValue({ transactionId: mockTransactionId });

      const transactionId = await rdsClient.beginTransaction();

      expect(transactionId).toBe(mockTransactionId);
      expect(mockBeginTransaction).toHaveBeenCalled();
    });

    it('should commit transaction successfully', async () => {
      const transactionId = 'txn-123456';
      mockCommitTransaction.mockResolvedValue({});

      await rdsClient.commitTransaction(transactionId);

      expect(mockCommitTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionId
        })
      );
    });

    it('should rollback transaction successfully', async () => {
      const transactionId = 'txn-123456';
      mockRollbackTransaction.mockResolvedValue({});

      await rdsClient.rollbackTransaction(transactionId);

      expect(mockRollbackTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionId
        })
      );
    });

    it('should execute query within transaction', async () => {
      const transactionId = 'txn-123456';
      mockExecuteStatement.mockResolvedValue({ records: [] });

      await rdsClient.executeQuery(
        'INSERT INTO restaurants (name) VALUES (?)',
        ['Test Restaurant'],
        transactionId
      );

      expect(mockExecuteStatement).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionId,
          sql: 'INSERT INTO restaurants (name) VALUES (?)'
        })
      );
    });
  });

  describe('Record Mapping', () => {
    it('should map database record to object', () => {
      const record = [
        { stringValue: '1' },
        { stringValue: 'Test Restaurant' },
        { longValue: 5 },
        { doubleValue: 4.5 },
        { booleanValue: true },
        { isNull: true }
      ];

      const columnMetadata = [
        { name: 'id', typeName: 'VARCHAR' },
        { name: 'name', typeName: 'VARCHAR' },
        { name: 'rating_count', typeName: 'BIGINT' },
        { name: 'rating', typeName: 'DOUBLE' },
        { name: 'active', typeName: 'BOOLEAN' },
        { name: 'description', typeName: 'VARCHAR' }
      ];

      const result = rdsClient.mapRecord(record, columnMetadata);

      expect(result).toEqual({
        id: '1',
        name: 'Test Restaurant',
        rating_count: 5,
        rating: 4.5,
        active: true,
        description: null
      });
    });

    it('should handle missing column metadata', () => {
      const record = [
        { stringValue: '1' },
        { stringValue: 'Test Restaurant' }
      ];

      const result = rdsClient.mapRecord(record);

      expect(result).toEqual({
        column_0: '1',
        column_1: 'Test Restaurant'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle SQL syntax errors', async () => {
      const sqlError = new Error('SQL syntax error near "SELCT"');
      mockExecuteStatement.mockRejectedValue(sqlError);

      await expect(
        rdsClient.executeQuery('SELCT * FROM restaurants')
      ).rejects.toThrow('SQL syntax error near "SELCT"');
    });

    it('should handle connection errors', async () => {
      const connectionError = new Error('Unable to connect to database');
      mockExecuteStatement.mockRejectedValue(connectionError);

      await expect(
        rdsClient.executeQuery('SELECT * FROM restaurants')
      ).rejects.toThrow('Unable to connect to database');
    });

    it('should handle transaction errors', async () => {
      const transactionError = new Error('Transaction failed');
      mockBeginTransaction.mockRejectedValue(transactionError);

      await expect(rdsClient.beginTransaction()).rejects.toThrow('Transaction failed');
    });

    it('should handle invalid parameters', async () => {
      await expect(
        rdsClient.executeQuery('SELECT * FROM restaurants WHERE id = ?', [undefined])
      ).rejects.toThrow('Invalid parameter type');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full transaction workflow', async () => {
      // 1. Begin transaction
      mockBeginTransaction.mockResolvedValue({ transactionId: 'txn-123' });
      const transactionId = await rdsClient.beginTransaction();
      expect(transactionId).toBe('txn-123');

      // 2. Execute queries within transaction
      mockExecuteStatement.mockResolvedValueOnce({
        generatedFields: [{ longValue: 1 }],
        numberOfRecordsUpdated: 1
      });

      const insertResult = await rdsClient.executeQuery(
        'INSERT INTO restaurants (name, email) VALUES (?, ?)',
        ['Test Restaurant', 'test@restaurant.com'],
        transactionId
      );
      expect(insertResult.insertId).toBe(1);

      mockExecuteStatement.mockResolvedValueOnce({
        numberOfRecordsUpdated: 1
      });

      const updateResult = await rdsClient.executeQuery(
        'UPDATE restaurants SET active = ? WHERE id = ?',
        [true, 1],
        transactionId
      );
      expect(updateResult.affectedRows).toBe(1);

      // 3. Commit transaction
      mockCommitTransaction.mockResolvedValue({});
      await rdsClient.commitTransaction(transactionId);

      expect(mockCommitTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ transactionId: 'txn-123' })
      );
    });

    it('should handle transaction rollback on error', async () => {
      // 1. Begin transaction
      mockBeginTransaction.mockResolvedValue({ transactionId: 'txn-456' });
      const transactionId = await rdsClient.beginTransaction();

      // 2. Execute successful query
      mockExecuteStatement.mockResolvedValueOnce({
        generatedFields: [{ longValue: 1 }],
        numberOfRecordsUpdated: 1
      });

      await rdsClient.executeQuery(
        'INSERT INTO restaurants (name) VALUES (?)',
        ['Test Restaurant'],
        transactionId
      );

      // 3. Execute failing query
      mockExecuteStatement.mockRejectedValueOnce(new Error('Constraint violation'));

      try {
        await rdsClient.executeQuery(
          'INSERT INTO restaurants (name) VALUES (?)',
          ['Duplicate Restaurant'],
          transactionId
        );
      } catch (error) {
        // 4. Rollback transaction on error
        mockRollbackTransaction.mockResolvedValue({});
        await rdsClient.rollbackTransaction(transactionId);
      }

      expect(mockRollbackTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ transactionId: 'txn-456' })
      );
    });
  });
});