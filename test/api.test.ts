import { describe, it, expect, beforeEach, vi } from 'vitest';
import { steem } from '../src';
import { Api } from '../src/api';
import testPost from './test-post.json';

// Helper for callback tests
function doneCallback(done: any, fn: (...args: any[]) => void) {
  return (...args: any[]) => {
    try {
      fn(...args);
      done();
    } catch (e) {
      done(e);
    }
  };
}

describe('steem.api:', () => {
  describe('setOptions', () => {
    it('works', () => {
      let url = steem.config.get('uri');
      if (!url) url = steem.config.get('websocket');
      steem.api.setOptions({ url: url, useAppbaseApi: true });
    });
  });

  describe('getFollowers', () => {
    describe("getting ned's followers", () => {
      it('works', async () => {
        const result = await (steem.api as any).getFollowersAsync('ned', 0, 'blog', 5);
        expect(result).toBeDefined();
        expect(result).toHaveLength(5);
      });

      it('the startFollower parameter has an impact on the result', async () => {
        const result1 = await (steem.api as any).getFollowersAsync('ned', 0, 'blog', 5);
        expect(result1).toHaveLength(5);
        const result2 = await (steem.api as any).getFollowersAsync('ned', result1[result1.length - 1].follower, 'blog', 5);
        expect(result2).toHaveLength(5);
        expect(result1).not.toEqual(result2);
      });

      it('clears listeners', async () => {
        expect((steem.api as any).listeners('message')).toHaveLength(0);
      });
    });
  });

  describe('getContent', () => {
    describe('getting a random post', () => {
      it('works', async () => {
        const result = await (steem.api as any).getContentAsync('yamadapc', 'test-1-2-3-4-5-6-7-9');
        expect(result).toMatchObject(testPost);
      });

      it('clears listeners', async () => {
        expect((steem.api as any).listeners('message')).toHaveLength(0);
      });
    });
  });

  describe('streamBlockNumber', () => {
    it('streams steem transactions', async () => {
      let i = 0;
      await new Promise<void>((resolve, reject) => {
        const release = (steem.api as any).streamBlockNumber((err: any, block: any) => {
          try {
            expect(block).toBeDefined();
            expect(typeof block).toBe('number');
            i++;
            if (i === 2) {
              release();
              resolve();
            }
          } catch (e) {
            release();
            reject(e);
          }
        });
      });
    }, 30000);
  });

  describe('streamBlock', () => {
    it('streams steem blocks', async () => {
      let i = 0;
      await new Promise<void>((resolve, reject) => {
        const release = (steem.api as any).streamBlock((err: any, block: any) => {
          try {
            expect(block).toBeDefined();
            expect(block).toHaveProperty('previous');
            expect(block).toHaveProperty('transactions');
            expect(block).toHaveProperty('timestamp');
            i++;
            if (i === 2) {
              release();
              resolve();
            }
          } catch (err2) {
            release();
            reject(err2);
          }
        });
      });
    }, 30000);
  });

  describe('streamTransactions', () => {
    it('streams steem transactions', async () => {
      let i = 0;
      await new Promise<void>((resolve, reject) => {
        const release = (steem.api as any).streamTransactions((err: any, transaction: any) => {
          try {
            expect(transaction).toBeDefined();
            expect(transaction).toHaveProperty('ref_block_num');
            expect(transaction).toHaveProperty('operations');
            expect(transaction).toHaveProperty('extensions');
            i++;
            if (i === 2) {
              release();
              resolve();
            }
          } catch (err2) {
            release();
            reject(err2);
          }
        });
      });
    }, 30000);
  });

  describe('streamOperations', () => {
    it('streams steem operations', async () => {
      let i = 0;
      await new Promise<void>((resolve, reject) => {
        const release = (steem.api as any).streamOperations((err: any, operation: any) => {
          try {
            expect(operation).toBeDefined();
            i++;
            if (i === 2) {
              release();
              resolve();
            }
          } catch (err2) {
            release();
            reject(err2);
          }
        });
      });
    }, 30000);
  });

  describe('useApiOptions', () => {
    it('works ok with the prod instances', async () => {
      (steem.api as any).setOptions({ useAppbaseApi: true, url: steem.config.get('uri') });
      const result = await (steem.api as any).getContentAsync('yamadapc', 'test-1-2-3-4-5-6-7-9');
      (steem.api as any).setOptions({ useAppbaseApi: false, url: steem.config.get('uri') });
      expect(result).toMatchObject(testPost);
    });
  });

  describe('with retry', () => {
    let steemApi: any;
    beforeEach(() => {
      steemApi = new Api({});
    });

    it('works by default', async () => {
      let attempts = 0;
      steemApi.setOptions({
        url: 'https://api.steemit.com',
        fetchMethod: (uri: string, req: any) => new Promise((res, rej) => {
          const data = JSON.parse(req.body);
          res({
            ok: true,
            json: () => Promise.resolve({
              jsonrpc: '2.0',
              id: data.id,
              result: ['ned'],
            }),
          });
          attempts++;
        }),
      });
      const result = await steemApi.getFollowersAsync('ned', 0, 'blog', 5);
      expect(attempts).toBe(1);
      expect(result).toEqual(['ned']);
    });

    it('does not retry by default', async () => {
      let attempts = 0;
      steemApi.setOptions({
        url: 'https://api.steemit.com',
        fetchMethod: (uri: string, req: any) => new Promise((res, rej) => {
          rej(new Error('Bad request'));
          attempts++;
        }),
      });
      let errored = false;
      try {
        await steemApi.getFollowersAsync('ned', 0, 'blog', 5);
      } catch (e) {
        errored = true;
      }
      expect(attempts).toBe(1);
      expect(errored).toBe(true);
    });

    it('works with retry passed as a boolean', async () => {
      let attempts = 0;
      steemApi.setOptions({
        url: 'https://api.steemit.com',
        fetchMethod: (uri: string, req: any) => new Promise((res, rej) => {
          const data = JSON.parse(req.body);
          res({
            ok: true,
            json: () => Promise.resolve({
              jsonrpc: '2.0',
              id: data.id,
              result: ['ned'],
            }),
          });
          attempts++;
        }),
      });
      const result = await steemApi.getFollowersAsync('ned', 0, 'blog', 5);
      expect(attempts).toBe(1);
      expect(result).toEqual(['ned']);
    });

    it('retries with retry passed as a boolean', async () => {
      let attempts = 0;
      steemApi.setOptions({
        url: 'https://api.steemit.com',
        retry: true,
        fetchMethod: (uri: string, req: any) => new Promise((res, rej) => {
          if (attempts < 1) {
            rej(new Error('Bad request'));
          } else {
            const data = JSON.parse(req.body);
            res({
              ok: true,
              json: () => Promise.resolve({
                jsonrpc: '2.0',
                id: data.id,
                result: ['ned'],
              }),
            });
          }
          attempts++;
        }),
      });
      const result = await steemApi.getFollowersAsync('ned', 0, 'blog', 5);
      expect(attempts).toBe(2);
      expect(result).toEqual(['ned']);
    });
  });
}); 