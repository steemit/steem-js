import { describe, it, expect } from 'vitest';
import { steem } from '../src';
const { auth, broadcast, api, config } = steem;

const username = process.env.STEEM_USERNAME || 'guest123';
const password = process.env.STEEM_PASSWORD;
const activeWif = auth.toWif(username, password, 'active');

describe('SMT', () => {
  describe('smt creation ops', () => {
    it.skip('signs and verifies smt_create', async () => {
      const url = config.get('uri');
      api.setOptions({ url, useAppbaseApi: true });

      const tx = {
        operations: [[
          'smt_create', {
            control_account: username,
            symbol: { nai: '@@631672482', precision: 3 },
            smt_creation_fee: { amount: '10000', precision: 3, nai: '@@000000013' },
            precision: 3
          }
        ]]
      };

      const result = await api.call('condenser_api.get_version', []);
      if (result.blockchain_version < '0.24.0') return; /* SKIP AS THIS WILL ONLY PASS ON A TESTNET CURRENTLY */
      expect(result).toHaveProperty('blockchain_version');

      const preparedTx = await broadcast._prepareTransaction(tx);
      const signedTx = auth.signTransaction(preparedTx, [activeWif]);
      const verified = await api.verifyAuthority(signedTx);
      expect(verified).toBe(true);
    });

    it.skip('signs and verifies smt_setup', async () => {
      const tx = {
        operations: [[
          'smt_setup', {
            control_account: username,
            symbol: { nai: '@@631672482', precision: 3 },
            max_supply: '1000000000000000',
            contribution_begin_time: '2020-12-21T00:00:00',
            contribution_end_time: '2021-12-21T00:00:00',
            launch_time: '2021-12-22T00:00:00',
            steem_units_min: 0,
            min_unit_ratio: 50,
            max_unit_ratio: 100,
            extensions: []
          }
        ]]
      };

      const result = await api.call('condenser_api.get_version', []);
      if (result.blockchain_version < '0.24.0') return; /* SKIP AS THIS WILL ONLY PASS ON A TESTNET CURRENTLY */
      expect(result).toHaveProperty('blockchain_version');

      const preparedTx = await broadcast._prepareTransaction(tx);
      const signedTx = auth.signTransaction(preparedTx, [activeWif]);
      const verified = await api.verifyAuthority(signedTx);
      expect(verified).toBe(true);
    });

    it.skip('signs and verifies smt_setup_ico_tier', async () => {
      const tx = {
        operations: [[
          'smt_setup_ico_tier', {
            control_account: username,
            symbol: { nai: '@@631672482', precision: 3 },
            steem_units_cap: 10000,
            generation_policy: [
              0,
              {
                generation_unit: {
                  steem_unit: [
                    ['$!alice.vesting', 2],
                    ['$market_maker', 2],
                    ['alice', 2]
                  ],
                  token_unit: [
                    ['$!alice.vesting', 2],
                    ['$from', 2],
                    ['$from.vesting', 2],
                    ['$market_maker', 2],
                    ['$rewards', 2],
                    ['alice', 2]
                  ]
                },
                extensions: []
              }
            ],
            remove: false,
            extensions: []
          }
        ]]
      };

      const result = await api.call('condenser_api.get_version', []);
      if (result.blockchain_version < '0.24.0') return; /* SKIP AS THIS WILL ONLY PASS ON A TESTNET CURRENTLY */
      expect(result).toHaveProperty('blockchain_version');

      const preparedTx = await broadcast._prepareTransaction(tx);
      const signedTx = auth.signTransaction(preparedTx, [activeWif]);
      const verified = await api.verifyAuthority(signedTx);
      expect(verified).toBe(true);
    });

    it.skip('signs and verifies smt_setup_emissions', async () => {
      const tx = {
        operations: [[
          'smt_setup_emissions', {
            control_account: username,
            symbol: { nai: '@@631672482', precision: 3 },
            schedule_time: '2019-10-16T19:47:05',
            emissions_unit: {
              token_unit: [
                ['$market_maker', 1],
                ['$rewards', 1],
                ['$vesting', 1]
              ]
            },
            interval_seconds: 21600,
            emission_count: 1,
            lep_time: '1970-01-01T00:00:00',
            rep_time: '1970-01-01T00:00:00',
            lep_abs_amount: 0,
            rep_abs_amount: 0,
            lep_rel_amount_numerator: 1,
            rep_rel_amount_numerator: 0,
            rel_amount_denom_bits: 0,
            remove: false,
            floor_emissions: false,
            extensions: []
          }
        ]]
      };

      const result = await api.call('condenser_api.get_version', []);
      if (result.blockchain_version < '0.24.0') return; /* SKIP AS THIS WILL ONLY PASS ON A TESTNET CURRENTLY */
      expect(result).toHaveProperty('blockchain_version');

      const preparedTx = await broadcast._prepareTransaction(tx);
      const signedTx = auth.signTransaction(preparedTx, [activeWif]);
      const verified = await api.verifyAuthority(signedTx);
      expect(verified).toBe(true);
    });

    it.skip('signs and verifies smt_set_setup_parameters', async () => {
      const tx = {
        operations: [[
          'smt_set_setup_parameters', {
            control_account: username,
            symbol: { nai: '@@631672482', precision: 3 },
            setup_parameters: [[
              0, {
                value: false
              }
            ]],
            extensions: []
          }
        ]]
      };

      const result = await api.call('condenser_api.get_version', []);
      if (result.blockchain_version < '0.24.0') return; /* SKIP AS THIS WILL ONLY PASS ON A TESTNET CURRENTLY */
      expect(result).toHaveProperty('blockchain_version');

      const preparedTx = await broadcast._prepareTransaction(tx);
      const signedTx = auth.signTransaction(preparedTx, [activeWif]);
      const verified = await api.verifyAuthority(signedTx);
      expect(verified).toBe(true);
    });

    it.skip('signs and verifies smt_set_runtime_parameters', async () => {
      const tx = {
        operations: [[
          'smt_set_runtime_parameters', {
            control_account: username,
            symbol: { nai: '@@631672482', precision: 3 },
            runtime_parameters: [[
              1, {
                vote_regeneration_period_seconds: 604800,
                votes_per_regeneration_period: 6999
              }
            ]],
            extensions: []
          }
        ]]
      };

      const result = await api.call('condenser_api.get_version', []);
      if (result.blockchain_version < '0.24.0') return; /* SKIP AS THIS WILL ONLY PASS ON A TESTNET CURRENTLY */
      expect(result).toHaveProperty('blockchain_version');

      const preparedTx = await broadcast._prepareTransaction(tx);
      const signedTx = auth.signTransaction(preparedTx, [activeWif]);
      const verified = await api.verifyAuthority(signedTx);
      expect(verified).toBe(true);
    });

    it.skip('signs and verifies smt_contribute', async () => {
      const tx = {
        operations: [[
          'smt_contribute', {
            contributor: username,
            symbol: { nai: '@@631672482', precision: 3 },
            contribution_id: 1,
            contribution: { amount: '1000', precision: 3, nai: '@@000000013' },
            extensions: []
          }
        ]]
      };

      const result = await api.call('condenser_api.get_version', []);
      if (result.blockchain_version < '0.24.0') return; /* SKIP AS THIS WILL ONLY PASS ON A TESTNET CURRENTLY */
      expect(result).toHaveProperty('blockchain_version');

      const preparedTx = await broadcast._prepareTransaction(tx);
      const signedTx = auth.signTransaction(preparedTx, [activeWif]);
      const verified = await api.verifyAuthority(signedTx);
      expect(verified).toBe(true);
    });
  });

  describe('smt extended ops', () => {
    const permlink = 'test';

    it.skip('signs and verifies claim_rewards_balance2', async () => {
      const tx = {
        operations: [[
          'claim_rewards_balance2', {
            account: username,
            rewards: [
              { amount: '1000', precision: 3, nai: '@@000000013' },
              { amount: '1000', precision: 3, nai: '@@631672482' }
            ]
          }
        ]]
      };

      const result = await api.call('condenser_api.get_version', []);
      if (result.blockchain_version < '0.24.0') return; /* SKIP AS THIS WILL ONLY PASS ON A TESTNET CURRENTLY */
      expect(result).toHaveProperty('blockchain_version');

      const preparedTx = await broadcast._prepareTransaction(tx);
      const signedTx = auth.signTransaction(preparedTx, [activeWif]);
      const verified = await api.verifyAuthority(signedTx);
      expect(verified).toBe(true);
    });
  });
}); 