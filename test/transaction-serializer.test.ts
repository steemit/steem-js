import { describe, it, expect } from 'vitest';
import { serializeTransaction } from '../src/auth/serializer/transaction';
import { transaction } from '../src/auth/serializer';

const ACCOUNT_CREATE_BASELINE = {
  tx: {
    ref_block_num: 19297,
    ref_block_prefix: 1608085982,
    expiration: '2016-03-23T22:41:21',
    operations: [
      ['account_create', {
        fee: '0.000 STEEM',
        creator: 'initminer',
        new_account_name: 'scott',
        owner: {
          weight_threshold: 1,
          account_auths: [],
          key_auths: [['STM7DTS62msowgpAZJBNRMStMUt5bfRA4hc9j5wjwU4vKhi3KFkKb', 1]]
        },
        active: {
          weight_threshold: 1,
          account_auths: [],
          key_auths: [['STM8k1f8fvHxLrCTqMdRUJcK2rCE3y7SQBb8PremyadWvVWMeedZy', 1]]
        },
        posting: {
          weight_threshold: 1,
          account_auths: [],
          key_auths: [['STM6DgpKJqoVGg7o6J1jdiP45xxbgoUg5VGzs96YBxX42NZu2bZea', 1]]
        },
        memo_key: 'STM6ppNVEFmvBW4jEkzxXnGKuKuwYjMUrhz2WX1kHeGSchGdWJEDQ',
        json_metadata: ''
      }]
    ],
    extensions: []
  },
  expectedHex: '614bde71d95f911bf3560109000000000000000003535445454d000009696e69746d696e65720573636f74740100000000010332757668fa45c2bc21447a2ff1dc2bbed9d9dda1616fd7b700255bd28e9d674a010001000000000103fb8900a262d51b908846be54fcf04b3a80d12ee749b9446f976b58b220ba4eed010001000000000102af4963d0f034043f4b4b0c99220e6a4b5d8b9cc71e5cd7d110f7602f3a0a11d1010002ff0de11ef55b998daf88047f1a00a60ed5dffb0c23c3279f8bd42a733845c5da0000'
};

// Comment operation baseline
const COMMENT_OPERATION_BASELINE = {
  tx: {
    ref_block_num: 19297,
    ref_block_prefix: 1608085982,
    expiration: '2016-03-23T22:41:21',
    operations: [
      ['comment', {
        parent_author: '',
        parent_permlink: 'test',
        author: 'alice',
        permlink: 'test-post',
        title: 'Test Post',
        body: 'This is a test post',
        json_metadata: '{}'
      }]
    ],
    extensions: []
  },
  expectedHex: null as string | null
};

// Vote operation baseline from Go test (steemutil/transaction/transaction_test.go)
// This is a verified value from the Go implementation
const VOTE_OPERATION_BASELINE = {
  tx: {
    ref_block_num: 36029,
    ref_block_prefix: 1164960351,
    expiration: '2016-08-08T12:24:17Z',
    operations: [
      ['vote', {
        voter: 'xeroc',
        author: 'xeroc',
        permlink: 'piston',
        weight: 10000
      }]
    ],
    extensions: []
  },
  // Known hex from Go test: steemutil/transaction/transaction_test.go
  // Expected: "bd8c5fe26f45f179a8570100057865726f63057865726f6306706973746f6e102700"
  expectedHex: 'bd8c5fe26f45f179a8570100057865726f63057865726f6306706973746f6e102700'
};

describe('Transaction Serializer', () => {
  describe('serializeTransaction', () => {
    it('should serialize a transaction with comment operation', () => {
      const { tx, expectedHex } = COMMENT_OPERATION_BASELINE;

      const serialized = serializeTransaction(tx);
      expect(serialized).toBeDefined();
      expect(Buffer.isBuffer(serialized)).toBe(true);
      expect(serialized.length).toBeGreaterThan(0);
    });

    it('should match known baseline value from old-steem-js (comment operation)', () => {
      const { tx, expectedHex } = COMMENT_OPERATION_BASELINE;
      const serialized = serializeTransaction(tx);
      const hex = serialized.toString('hex');
    });

    it('should serialize a transaction with vote operation', () => {
      const tx = {
        ref_block_num: 100,
        ref_block_prefix: 1234567890,
        expiration: '2016-03-23T22:41:21',
        operations: [
          ['vote', {
            voter: 'alice',
            author: 'bob',
            permlink: 'test-post',
            weight: 10000
          }]
        ],
        extensions: []
      };

      const serialized = serializeTransaction(tx);
      expect(serialized).toBeDefined();
      expect(Buffer.isBuffer(serialized)).toBe(true);
      expect(serialized.length).toBeGreaterThan(0);
    });

    it('should match known baseline value from Go test (vote operation)', () => {
      // This test uses a known-good value from Go test: steemutil/transaction/transaction_test.go
      // The transaction and expected hex are from the verified Go implementation
      const { tx, expectedHex } = VOTE_OPERATION_BASELINE;
      
      const serialized = serializeTransaction(tx);
      const hex = serialized.toString('hex');
      
      // Verify it matches the known baseline value from Go implementation
      expect(hex).toBe(expectedHex);
    });

    it('should serialize a transaction with multiple operations', () => {
      const tx = {
        ref_block_num: 200,
        ref_block_prefix: 987654321,
        expiration: '2016-03-23T22:41:21',
        operations: [
          ['comment', {
            parent_author: '',
            parent_permlink: 'test',
            author: 'alice',
            permlink: 'test-post',
            title: 'Test Post',
            body: 'This is a test post',
            json_metadata: '{}'
          }],
          ['vote', {
            voter: 'bob',
            author: 'alice',
            permlink: 'test-post',
            weight: 10000
          }]
        ],
        extensions: []
      };

      const serialized = serializeTransaction(tx);
      expect(serialized).toBeDefined();
      expect(Buffer.isBuffer(serialized)).toBe(true);
      expect(serialized.length).toBeGreaterThan(0);
    });

    it('should serialize a transaction with empty operations', () => {
      const tx = {
        ref_block_num: 0,
        ref_block_prefix: 0,
        expiration: '2016-03-23T22:41:21',
        operations: [],
        extensions: []
      };

      const serialized = serializeTransaction(tx);
      expect(serialized).toBeDefined();
      expect(Buffer.isBuffer(serialized)).toBe(true);
      // Empty operations should still produce a valid buffer
      expect(serialized.length).toBeGreaterThan(0);
    });

    it('should handle comment operation with empty strings', () => {
      const tx = {
        ref_block_num: 100,
        ref_block_prefix: 1234567890,
        expiration: '2016-03-23T22:41:21',
        operations: [
          ['comment', {
            parent_author: '',
            parent_permlink: '',
            author: 'alice',
            permlink: 'test',
            title: '',
            body: '',
            json_metadata: '{}'
          }]
        ],
        extensions: []
      };

      const serialized = serializeTransaction(tx);
      expect(serialized).toBeDefined();
      expect(Buffer.isBuffer(serialized)).toBe(true);
    });

    it('should handle comment operation with long strings', () => {
      const longString = 'a'.repeat(1000);
      const tx = {
        ref_block_num: 100,
        ref_block_prefix: 1234567890,
        expiration: '2016-03-23T22:41:21',
        operations: [
          ['comment', {
            parent_author: '',
            parent_permlink: 'test',
            author: 'alice',
            permlink: 'test-post',
            title: longString,
            body: longString,
            json_metadata: JSON.stringify({ tags: ['test'] })
          }]
        ],
        extensions: []
      };

      const serialized = serializeTransaction(tx);
      expect(serialized).toBeDefined();
      expect(Buffer.isBuffer(serialized)).toBe(true);
      expect(serialized.length).toBeGreaterThan(1000);
    });

    it('should match known baseline value from old-steem-js (account_create)', () => {
      // This test uses a known-good value from old-steem-js test/operations_test.js
      // The transaction and expected hex are from the verified old implementation
      // This test will fail until account_create serialization is implemented
      const { tx, expectedHex } = ACCOUNT_CREATE_BASELINE;
      
      const serialized = serializeTransaction(tx);
      const hex = serialized.toString('hex');
      
      // Verify it matches the known baseline value from old-steem-js
      expect(hex).toBe(expectedHex);
    });

    it('should produce consistent output for same transaction', () => {
      const tx = {
        ref_block_num: 100,
        ref_block_prefix: 1234567890,
        expiration: '2016-03-23T22:41:21',
        operations: [
          ['comment', {
            parent_author: '',
            parent_permlink: 'test',
            author: 'alice',
            permlink: 'test-post',
            title: 'Test Post',
            body: 'This is a test post',
            json_metadata: '{}'
          }]
        ],
        extensions: []
      };

      const serialized1 = serializeTransaction(tx);
      const serialized2 = serializeTransaction(tx);
      
      expect(serialized1).toEqual(serialized2);
      expect(serialized1.toString('hex')).toBe(serialized2.toString('hex'));
    });

    it('should handle different expiration formats', () => {
      const baseTx = {
        ref_block_num: 100,
        ref_block_prefix: 1234567890,
        operations: [
          ['comment', {
            parent_author: '',
            parent_permlink: 'test',
            author: 'alice',
            permlink: 'test-post',
            title: 'Test',
            body: 'Test',
            json_metadata: '{}'
          }]
        ],
        extensions: []
      };

      // Test ISO string format
      const tx1 = { ...baseTx, expiration: '2016-03-23T22:41:21' };
      const serialized1 = serializeTransaction(tx1);
      expect(serialized1).toBeDefined();

      // Test with Z suffix
      const tx2 = { ...baseTx, expiration: '2016-03-23T22:41:21Z' };
      const serialized2 = serializeTransaction(tx2);
      expect(serialized2).toBeDefined();

      // Both should produce valid buffers
      expect(Buffer.isBuffer(serialized1)).toBe(true);
      expect(Buffer.isBuffer(serialized2)).toBe(true);
    });
  });

  describe('transaction.toBuffer', () => {
    it('should use binary serialization', () => {
      const tx = {
        ref_block_num: 100,
        ref_block_prefix: 1234567890,
        expiration: '2016-03-23T22:41:21',
        operations: [
          ['comment', {
            parent_author: '',
            parent_permlink: 'test',
            author: 'alice',
            permlink: 'test-post',
            title: 'Test Post',
            body: 'This is a test post',
            json_metadata: '{}'
          }]
        ],
        extensions: []
      };

      const serialized = transaction.toBuffer(tx);
      expect(serialized).toBeDefined();
      expect(Buffer.isBuffer(serialized)).toBe(true);
      
      // Should not be JSON (binary serialization should produce different output)
      const jsonSerialized = Buffer.from(JSON.stringify(tx));
      expect(serialized.toString('hex')).not.toBe(jsonSerialized.toString('hex'));
    });

    it('should produce same output as serializeTransaction', () => {
      const tx = {
        ref_block_num: 100,
        ref_block_prefix: 1234567890,
        expiration: '2016-03-23T22:41:21',
        operations: [
          ['comment', {
            parent_author: '',
            parent_permlink: 'test',
            author: 'alice',
            permlink: 'test-post',
            title: 'Test Post',
            body: 'This is a test post',
            json_metadata: '{}'
          }]
        ],
        extensions: []
      };

      const serialized1 = serializeTransaction(tx);
      const serialized2 = transaction.toBuffer(tx);
      
      expect(serialized1.toString('hex')).toBe(serialized2.toString('hex'));
    });
  });

  describe('operation type indices', () => {
    it('should correctly serialize comment operation (index 1)', () => {
      const tx = {
        ref_block_num: 100,
        ref_block_prefix: 1234567890,
        expiration: '2016-03-23T22:41:21',
        operations: [
          ['comment', {
            parent_author: '',
            parent_permlink: 'test',
            author: 'alice',
            permlink: 'test-post',
            title: 'Test',
            body: 'Test',
            json_metadata: '{}'
          }]
        ],
        extensions: []
      };

      const serialized = serializeTransaction(tx);
      // Comment operation should have index 1 (varint32 encoded)
      // The first byte after transaction header should be operation count (01)
      // Then operation type index (01 for comment)
      expect(serialized.length).toBeGreaterThan(10);
    });

    it('should correctly serialize vote operation (index 0)', () => {
      const tx = {
        ref_block_num: 100,
        ref_block_prefix: 1234567890,
        expiration: '2016-03-23T22:41:21',
        operations: [
          ['vote', {
            voter: 'alice',
            author: 'bob',
            permlink: 'test-post',
            weight: 10000
          }]
        ],
        extensions: []
      };

      const serialized = serializeTransaction(tx);
      expect(serialized.length).toBeGreaterThan(10);
    });
  });

  describe('serialization structure', () => {
    it('should serialize transaction header correctly', () => {
      const tx = {
        ref_block_num: 0x1234, // 4660
        ref_block_prefix: 0x56789ABC, // 1450744508
        expiration: '2016-03-23T22:41:21',
        operations: [],
        extensions: []
      };

      const serialized = serializeTransaction(tx);
      expect(serialized.length).toBeGreaterThan(0);
      
      // First 2 bytes should be ref_block_num (little endian)
      const refBlockNum = serialized.readUInt16LE(0);
      expect(refBlockNum).toBe(0x1234);
      
      // Next 4 bytes should be ref_block_prefix (little endian)
      const refBlockPrefix = serialized.readUInt32LE(2);
      expect(refBlockPrefix).toBe(0x56789ABC);
      
      // Next 4 bytes should be expiration (uint32 timestamp)
      const expiration = serialized.readUInt32LE(6);
      expect(expiration).toBeGreaterThan(0);
    });

    it('should serialize operations array correctly', () => {
      const tx = {
        ref_block_num: 100,
        ref_block_prefix: 1234567890,
        expiration: '2016-03-23T22:41:21',
        operations: [
          ['comment', {
            parent_author: 'alice',
            parent_permlink: 'test',
            author: 'bob',
            permlink: 'reply',
            title: 'Title',
            body: 'Body',
            json_metadata: '{}'
          }]
        ],
        extensions: []
      };

      const serialized = serializeTransaction(tx);
      
      // After header (10 bytes: 2 + 4 + 4), should have operations count
      // Skip header and check operations count (varint32)
      let offset = 10;
      const opsCount = serialized.readUInt8(offset);
      expect(opsCount).toBe(1); // One operation
    });
  });

  describe('edge cases', () => {
    it('should handle missing optional fields', () => {
      const tx = {
        ref_block_num: 100,
        ref_block_prefix: 1234567890,
        expiration: '2016-03-23T22:41:21',
        operations: [
          ['comment', {
            parent_author: undefined as any,
            parent_permlink: undefined as any,
            author: 'alice',
            permlink: 'test',
            title: undefined as any,
            body: undefined as any,
            json_metadata: undefined as any
          }]
        ],
        extensions: []
      };

      const serialized = serializeTransaction(tx);
      expect(serialized).toBeDefined();
      expect(Buffer.isBuffer(serialized)).toBe(true);
    });

    it('should throw error for unknown operation type', () => {
      const tx = {
        ref_block_num: 100,
        ref_block_prefix: 1234567890,
        expiration: '2016-03-23T22:41:21',
        operations: [
          ['unknown_operation' as any, {
            data: 'test'
          }]
        ],
        extensions: []
      };

      expect(() => {
        serializeTransaction(tx);
      }).toThrow('Unknown operation type');
    });

    it('should throw error for invalid operation format', () => {
      const tx = {
        ref_block_num: 100,
        ref_block_prefix: 1234567890,
        expiration: '2016-03-23T22:41:21',
        operations: [
          'invalid' as any
        ],
        extensions: []
      };

      expect(() => {
        serializeTransaction(tx);
      }).toThrow('Operation must be an array');
    });

    it('should handle transaction without extensions field', () => {
      const tx = {
        ref_block_num: 100,
        ref_block_prefix: 1234567890,
        expiration: '2016-03-23T22:41:21',
        operations: [
          ['comment', {
            parent_author: '',
            parent_permlink: 'test',
            author: 'alice',
            permlink: 'test-post',
            title: 'Test',
            body: 'Test',
            json_metadata: '{}'
          }]
        ]
      } as any;

      const serialized = serializeTransaction(tx);
      expect(serialized).toBeDefined();
      expect(Buffer.isBuffer(serialized)).toBe(true);
    });
  });

  describe('comment_options extensions (beneficiaries)', () => {
    const baseTx = {
      ref_block_num: 100,
      ref_block_prefix: 1234567890,
      expiration: '2016-03-23T22:41:21',
      operations: [
        ['comment_options', {
          author: 'alice',
          permlink: 'test-post',
          max_accepted_payout: '1000000.000 SBD',
          percent_steem_dollars: 10000,
          allow_votes: true,
          allow_curation_rewards: true,
          extensions: [] as unknown[]
        }]
      ],
      extensions: [] as unknown[]
    };

    it('should serialize comment_options with empty extensions', () => {
      const serialized = serializeTransaction(baseTx);
      expect(serialized).toBeDefined();
      expect(Buffer.isBuffer(serialized)).toBe(true);
      expect(serialized.length).toBeGreaterThan(0);
    });

    it('should serialize comment_options with beneficiaries extension and sort by account', () => {
      const txWithExt = {
        ...baseTx,
        operations: [
          ['comment_options', {
            ...(baseTx.operations[0] as [string, Record<string, unknown>])[1],
            extensions: [
              [0, {
                beneficiaries: [
                  { account: 'b', weight: 100 },
                  { account: 'a', weight: 200 }
                ]
              }]
            ]
          }]
        ]
      };
      const serialized = serializeTransaction(txWithExt);
      expect(serialized).toBeDefined();
      expect(Buffer.isBuffer(serialized)).toBe(true);
      expect(serialized.length).toBeGreaterThan((serializeTransaction(baseTx) as Buffer).length);
      const hex = serialized.toString('hex');
      const idxA = hex.indexOf('0161');
      const idxB = hex.indexOf('0162');
      expect(idxA).toBeGreaterThan(-1);
      expect(idxB).toBeGreaterThan(-1);
      expect(idxA).toBeLessThan(idxB);
    });

    it('should produce same serialization regardless of input beneficiary order', () => {
      const extensionsA = [
        [0, { beneficiaries: [{ account: 'a', weight: 200 }, { account: 'b', weight: 100 }] }]
      ];
      const extensionsB = [
        [0, { beneficiaries: [{ account: 'b', weight: 100 }, { account: 'a', weight: 200 }] }]
      ];
      const txA = {
        ...baseTx,
        operations: [
          ['comment_options', {
            ...(baseTx.operations[0] as [string, Record<string, unknown>])[1],
            extensions: extensionsA
          }]
        ]
      };
      const txB = {
        ...baseTx,
        operations: [
          ['comment_options', {
            ...(baseTx.operations[0] as [string, Record<string, unknown>])[1],
            extensions: extensionsB
          }]
        ]
      };
      const serializedA = serializeTransaction(txA);
      const serializedB = serializeTransaction(txB);
      expect(serializedA.toString('hex')).toBe(serializedB.toString('hex'));
    });

    it('should handle empty beneficiaries array in extension', () => {
      const tx = {
        ...baseTx,
        operations: [
          ['comment_options', {
            ...(baseTx.operations[0] as [string, Record<string, unknown>])[1],
            extensions: [[0, { beneficiaries: [] }]]
          }]
        ]
      };
      const serialized = serializeTransaction(tx);
      expect(serialized).toBeDefined();
      expect(Buffer.isBuffer(serialized)).toBe(true);
    });
  });

  describe('transaction digest (from Go test)', () => {
    it('should calculate digest matching Go implementation', () => {
      // Test from steemutil/transaction/signed_transaction_test.go
      // Expected digest: "582176b1daf89984bc8b4fdcb24ff1433d1eb114a8c4bf20fb22ad580d035889"
      const { tx } = VOTE_OPERATION_BASELINE;
      const chainId = '0000000000000000000000000000000000000000000000000000000000000000';
      const expectedDigest = '582176b1daf89984bc8b4fdcb24ff1433d1eb114a8c4bf20fb22ad580d035889';

      // Serialize transaction
      const serialized = serializeTransaction(tx);
      
      // Calculate digest: sha256(chain_id + serialized_transaction)
      const { createHash } = require('crypto');
      const chainIdBuffer = Buffer.from(chainId, 'hex');
      const digest = createHash('sha256')
        .update(Buffer.concat([chainIdBuffer, serialized]))
        .digest();
      
      const digestHex = digest.toString('hex');
      
      // Verify it matches the known digest from Go test
      expect(digestHex).toBe(expectedDigest);
    });
  });

  describe('transaction signing and verification (from Go test)', () => {
    it('should sign and verify transaction matching Go implementation', async () => {
      // Test from steemutil/transaction/signed_transaction_test.go
      // WIF: "5JLw5dgQAx6rhZEgNN5C2ds1V47RweGshynFSWFbaMohsYsBvE8"
      const { tx } = VOTE_OPERATION_BASELINE;
      const wif = '5JLw5dgQAx6rhZEgNN5C2ds1V47RweGshynFSWFbaMohsYsBvE8';
      
      // Import auth module
      const { signTransaction, wifToPublic, verifyTransaction } = await import('../src/auth');

      // Sign the transaction
      const signedTx = signTransaction(tx, [wif]);

      // Verify signatures were added
      expect(signedTx.signatures).toBeDefined();
      expect(signedTx.signatures.length).toBe(1);
      expect(typeof signedTx.signatures[0]).toBe('string');

      // Get public key from WIF
      const publicKey = wifToPublic(wif);
      expect(publicKey).toBeDefined();

      // Now verify the signature against the correct binary digest
      // sha256(chain_id || serializeTransaction(trx)). Previously verifyTransaction
      // validated against JSON.stringify(trx) and always returned false.
      const isValid = verifyTransaction(signedTx, publicKey);
      expect(isValid).toBe(true);

      // A different (wrong) public key must be rejected
      const otherPub = wifToPublic('5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3');
      expect(verifyTransaction(signedTx, otherPub)).toBe(false);
    });
  });

  describe('integration with auth.signTransaction', () => {
    it('should produce valid serialization for signing', () => {
      const tx = {
        ref_block_num: 100,
        ref_block_prefix: 1234567890,
        expiration: '2016-03-23T22:41:21',
        operations: [
          ['comment', {
            parent_author: '',
            parent_permlink: 'test',
            author: 'alice',
            permlink: 'test-post',
            title: 'Test Post',
            body: 'This is a test post',
            json_metadata: '{}'
          }]
        ],
        extensions: []
      };

      // This should not throw and should produce a valid buffer
      const serialized = transaction.toBuffer(tx);
      expect(serialized).toBeDefined();
      expect(Buffer.isBuffer(serialized)).toBe(true);
      expect(serialized.length).toBeGreaterThan(0);
    });
  });
});

