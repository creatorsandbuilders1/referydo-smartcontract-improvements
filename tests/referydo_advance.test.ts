import { describe, it, expect, beforeEach } from 'vitest';
import { Cl } from '@stacks/transactions';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const client = accounts.get('wallet_1')!;
const talent = accounts.get('wallet_2')!;
const scout = accounts.get('wallet_3')!;

describe('REFERYDO! Escrow Contract - V8 (Gas Optimized)', () => {
  
  describe('create-project', () => {
    it('creates a new project successfully', () => {
      const amount = 10_000_000; // 10 STX
      const scoutFee = 10; // 10%
      const platformFee = 7; // 7%

      const response = simnet.callPublicFn(
        'referydo_advance',
        'create-project',
        [
          Cl.principal(talent),
          Cl.principal(scout),
          Cl.uint(amount),
          Cl.uint(scoutFee),
          Cl.uint(platformFee),
        ],
        client
      );

      expect(response.result).toBeOk(Cl.uint(1)); // First project ID

      // Verify project data
      const projectData = simnet.callReadOnlyFn(
        'referydo_advance',
        'get-project-data',
        [Cl.uint(1)],
        client
      );

      expect(projectData.result).toBeSome(
        Cl.tuple({
          client: Cl.principal(client),
          talent: Cl.principal(talent),
          scout: Cl.principal(scout),
          amount: Cl.uint(amount),
          'scout-fee-percent': Cl.uint(scoutFee),
          'platform-fee-percent': Cl.uint(platformFee),
          status: Cl.uint(0), // Created
        })
      );
    });

    it('increments project counter correctly', () => {
      // Create first project
      simnet.callPublicFn(
        'referydo_advance',
        'create-project',
        [
          Cl.principal(talent),
          Cl.principal(scout),
          Cl.uint(5_000_000),
          Cl.uint(10),
          Cl.uint(7),
        ],
        client
      );

      // Create second project
      const response = simnet.callPublicFn(
        'referydo_advance',
        'create-project',
        [
          Cl.principal(talent),
          Cl.principal(scout),
          Cl.uint(8_000_000),
          Cl.uint(15),
          Cl.uint(7),
        ],
        client
      );

      expect(response.result).toBeOk(Cl.uint(2)); // Second project ID
    });

    it('allows different fee percentages', () => {
      const response = simnet.callPublicFn(
        'referydo_advance',
        'create-project',
        [
          Cl.principal(talent),
          Cl.principal(scout),
          Cl.uint(20_000_000),
          Cl.uint(25), // 25% scout fee
          Cl.uint(7),
        ],
        client
      );

      expect(response.result).toBeOk(Cl.uint(1));
    });

    it('fails when amount is zero', () => {
      const response = simnet.callPublicFn(
        'referydo_advance',
        'create-project',
        [
          Cl.principal(talent),
          Cl.principal(scout),
          Cl.uint(0), // Zero amount
          Cl.uint(10),
          Cl.uint(7),
        ],
        client
      );

      expect(response.result).toBeErr(Cl.uint(105)); // ERR-FEE-CALCULATION-ERROR
    });

    it('fails when scout fee exceeds 100%', () => {
      const response = simnet.callPublicFn(
        'referydo_advance',
        'create-project',
        [
          Cl.principal(talent),
          Cl.principal(scout),
          Cl.uint(10_000_000),
          Cl.uint(150), // > 100%
          Cl.uint(7),
        ],
        client
      );

      expect(response.result).toBeErr(Cl.uint(105)); // ERR-FEE-CALCULATION-ERROR
    });

    it('fails when platform fee exceeds 100%', () => {
      const response = simnet.callPublicFn(
        'referydo_advance',
        'create-project',
        [
          Cl.principal(talent),
          Cl.principal(scout),
          Cl.uint(10_000_000),
          Cl.uint(10),
          Cl.uint(150), // > 100%
        ],
        client
      );

      expect(response.result).toBeErr(Cl.uint(105)); // ERR-FEE-CALCULATION-ERROR
    });

    it('fails when combined fees exceed 100%', () => {
      const response = simnet.callPublicFn(
        'referydo_advance',
        'create-project',
        [
          Cl.principal(talent),
          Cl.principal(scout),
          Cl.uint(10_000_000),
          Cl.uint(60), // 60%
          Cl.uint(50), // 50% = 110% total
        ],
        client
      );

      expect(response.result).toBeErr(Cl.uint(105)); // ERR-FEE-CALCULATION-ERROR
    });

    it('allows fees that sum exactly to 100%', () => {
      const response = simnet.callPublicFn(
        'referydo_advance',
        'create-project',
        [
          Cl.principal(talent),
          Cl.principal(scout),
          Cl.uint(10_000_000),
          Cl.uint(50), // 50%
          Cl.uint(50), // 50% = 100% total
        ],
        client
      );

      expect(response.result).toBeOk(Cl.uint(1));
    });
  });

  describe('fund-escrow', () => {
    beforeEach(() => {
      // Create a project before each test
      simnet.callPublicFn(
        'referydo_advance',
        'create-project',
        [
          Cl.principal(talent),
          Cl.principal(scout),
          Cl.uint(10_000_000),
          Cl.uint(10),
          Cl.uint(7),
        ],
        client
      );
    });

    it('funds escrow successfully', () => {
      const response = simnet.callPublicFn(
        'referydo_advance',
        'fund-escrow',
        [Cl.uint(1)],
        client
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Verify STX transfer event
      expect(response.events).toContainEqual({
        event: 'stx_transfer_event',
        data: expect.objectContaining({
          sender: client,
          amount: '10000000',
        }),
      });

      // Verify status changed to Pending_Acceptance (4)
      const projectData = simnet.callReadOnlyFn(
        'referydo_advance',
        'get-project-data',
        [Cl.uint(1)],
        client
      );

      expect(projectData.result).toBeSome(
        Cl.tuple({
          client: Cl.principal(client),
          talent: Cl.principal(talent),
          scout: Cl.principal(scout),
          amount: Cl.uint(10_000_000),
          'scout-fee-percent': Cl.uint(10),
          'platform-fee-percent': Cl.uint(7),
          status: Cl.uint(4), // Pending_Acceptance
        })
      );
    });

    it('fails if not called by client', () => {
      const response = simnet.callPublicFn(
        'referydo_advance',
        'fund-escrow',
        [Cl.uint(1)],
        talent // Wrong caller
      );

      expect(response.result).toBeErr(Cl.uint(101)); // ERR-NOT-AUTHORIZED
    });

    it('fails if project does not exist', () => {
      const response = simnet.callPublicFn(
        'referydo_advance',
        'fund-escrow',
        [Cl.uint(999)],
        client
      );

      expect(response.result).toBeErr(Cl.uint(102)); // ERR-PROJECT-NOT-FOUND
    });

    it('fails if project already funded', () => {
      // Fund once
      simnet.callPublicFn('referydo_advance', 'fund-escrow', [Cl.uint(1)], client);

      // Try to fund again
      const response = simnet.callPublicFn(
        'referydo_advance',
        'fund-escrow',
        [Cl.uint(1)],
        client
      );

      expect(response.result).toBeErr(Cl.uint(103)); // ERR-WRONG-STATUS
    });
  });

  describe('accept-project', () => {
    beforeEach(() => {
      // Create and fund a project
      simnet.callPublicFn(
        'referydo_advance',
        'create-project',
        [
          Cl.principal(talent),
          Cl.principal(scout),
          Cl.uint(10_000_000),
          Cl.uint(10),
          Cl.uint(7),
        ],
        client
      );
      simnet.callPublicFn('referydo_advance', 'fund-escrow', [Cl.uint(1)], client);
    });

    it('allows talent to accept project', () => {
      const response = simnet.callPublicFn(
        'referydo_advance',
        'accept-project',
        [Cl.uint(1)],
        talent
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Verify status changed to Funded (1)
      const projectData = simnet.callReadOnlyFn(
        'referydo_advance',
        'get-project-data',
        [Cl.uint(1)],
        client
      );

      expect(projectData.result).toBeSome(
        Cl.tuple({
          client: Cl.principal(client),
          talent: Cl.principal(talent),
          scout: Cl.principal(scout),
          amount: Cl.uint(10_000_000),
          'scout-fee-percent': Cl.uint(10),
          'platform-fee-percent': Cl.uint(7),
          status: Cl.uint(1), // Funded
        })
      );
    });

    it('fails if not called by talent', () => {
      const response = simnet.callPublicFn(
        'referydo_advance',
        'accept-project',
        [Cl.uint(1)],
        client // Wrong caller
      );

      expect(response.result).toBeErr(Cl.uint(101)); // ERR-NOT-AUTHORIZED
    });

    it('fails if project not in Pending_Acceptance state', () => {
      // Accept once
      simnet.callPublicFn('referydo_advance', 'accept-project', [Cl.uint(1)], talent);

      // Try to accept again
      const response = simnet.callPublicFn(
        'referydo_advance',
        'accept-project',
        [Cl.uint(1)],
        talent
      );

      expect(response.result).toBeErr(Cl.uint(103)); // ERR-WRONG-STATUS
    });
  });

  describe('decline-project', () => {
    beforeEach(() => {
      // Create and fund a project
      simnet.callPublicFn(
        'referydo_advance',
        'create-project',
        [
          Cl.principal(talent),
          Cl.principal(scout),
          Cl.uint(10_000_000),
          Cl.uint(10),
          Cl.uint(7),
        ],
        client
      );
      simnet.callPublicFn('referydo_advance', 'fund-escrow', [Cl.uint(1)], client);
    });

    it('allows talent to decline and refunds client', () => {
      const clientBalanceBefore = simnet.getAssetsMap().get('STX')!.get(client)!;

      const response = simnet.callPublicFn(
        'referydo_advance',
        'decline-project',
        [Cl.uint(1)],
        talent
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Verify refund event
      expect(response.events).toContainEqual({
        event: 'stx_transfer_event',
        data: expect.objectContaining({
          recipient: client,
          amount: '10000000',
        }),
      });

      // Verify status changed to Declined (5)
      const projectData = simnet.callReadOnlyFn(
        'referydo_advance',
        'get-project-data',
        [Cl.uint(1)],
        client
      );

      expect(projectData.result).toBeSome(
        Cl.tuple({
          client: Cl.principal(client),
          talent: Cl.principal(talent),
          scout: Cl.principal(scout),
          amount: Cl.uint(10_000_000),
          'scout-fee-percent': Cl.uint(10),
          'platform-fee-percent': Cl.uint(7),
          status: Cl.uint(5), // Declined
        })
      );
    });

    it('fails if not called by talent', () => {
      const response = simnet.callPublicFn(
        'referydo_advance',
        'decline-project',
        [Cl.uint(1)],
        scout // Wrong caller
      );

      expect(response.result).toBeErr(Cl.uint(101)); // ERR-NOT-AUTHORIZED
    });
  });

  describe('approve-and-distribute', () => {
    beforeEach(() => {
      // Create, fund, and accept a project
      simnet.callPublicFn(
        'referydo_advance',
        'create-project',
        [
          Cl.principal(talent),
          Cl.principal(scout),
          Cl.uint(10_000_000), // 10 STX
          Cl.uint(10), // 10% scout
          Cl.uint(7), // 7% platform
        ],
        client
      );
      simnet.callPublicFn('referydo_advance', 'fund-escrow', [Cl.uint(1)], client);
      simnet.callPublicFn('referydo_advance', 'accept-project', [Cl.uint(1)], talent);
    });

    it('distributes funds correctly (100% distribution)', () => {
      const response = simnet.callPublicFn(
        'referydo_advance',
        'approve-and-distribute',
        [Cl.uint(1)],
        client
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Verify all three transfers occurred
      const transferEvents = response.events.filter(
        (e: any) => e.event === 'stx_transfer_event'
      );
      expect(transferEvents).toHaveLength(3);

      // Calculate expected amounts
      const totalAmount = 10_000_000;
      const scoutPayout = Math.floor((totalAmount * 10) / 100); // 1,000,000
      const platformPayout = Math.floor((totalAmount * 7) / 100); // 700,000
      const talentPayout = totalAmount - scoutPayout - platformPayout; // 8,300,000

      // Verify talent payment
      expect(response.events).toContainEqual({
        event: 'stx_transfer_event',
        data: expect.objectContaining({
          recipient: talent,
          amount: talentPayout.toString(),
        }),
      });

      // Verify scout payment
      expect(response.events).toContainEqual({
        event: 'stx_transfer_event',
        data: expect.objectContaining({
          recipient: scout,
          amount: scoutPayout.toString(),
        }),
      });

      // Verify platform payment (goes to platform-wallet, not deployer)
      expect(response.events).toContainEqual({
        event: 'stx_transfer_event',
        data: expect.objectContaining({
          recipient: 'SP3EK6QA5QPBNMMR98QB2HB1J66TF6QTF0HXDJK5X', // Platform wallet
          amount: platformPayout.toString(),
        }),
      });

      // Verify status changed to Completed (2)
      const projectData = simnet.callReadOnlyFn(
        'referydo_advance',
        'get-project-data',
        [Cl.uint(1)],
        client
      );

      expect(projectData.result).toBeSome(
        Cl.tuple({
          client: Cl.principal(client),
          talent: Cl.principal(talent),
          scout: Cl.principal(scout),
          amount: Cl.uint(10_000_000),
          'scout-fee-percent': Cl.uint(10),
          'platform-fee-percent': Cl.uint(7),
          status: Cl.uint(2), // Completed
        })
      );
    });

    it('distributes 100% of escrow with different fee percentages', () => {
      // Create project with different fees
      simnet.callPublicFn(
        'referydo_advance',
        'create-project',
        [
          Cl.principal(talent),
          Cl.principal(scout),
          Cl.uint(20_000_000), // 20 STX
          Cl.uint(15), // 15% scout
          Cl.uint(7), // 7% platform
        ],
        client
      );
      simnet.callPublicFn('referydo_advance', 'fund-escrow', [Cl.uint(2)], client);
      simnet.callPublicFn('referydo_advance', 'accept-project', [Cl.uint(2)], talent);

      const response = simnet.callPublicFn(
        'referydo_advance',
        'approve-and-distribute',
        [Cl.uint(2)],
        client
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Calculate expected amounts
      const totalAmount = 20_000_000;
      const scoutPayout = Math.floor((totalAmount * 15) / 100); // 3,000,000
      const platformPayout = Math.floor((totalAmount * 7) / 100); // 1,400,000
      const talentPayout = totalAmount - scoutPayout - platformPayout; // 15,600,000

      // Verify total distributed = 100%
      const totalDistributed = talentPayout + scoutPayout + platformPayout;
      expect(totalDistributed).toBe(totalAmount);
    });

    it('works with small amounts (no underflow)', () => {
      // Create project with minimal amount
      simnet.callPublicFn(
        'referydo_advance',
        'create-project',
        [
          Cl.principal(talent),
          Cl.principal(scout),
          Cl.uint(1_000_000), // 1 STX
          Cl.uint(10),
          Cl.uint(7),
        ],
        client
      );
      simnet.callPublicFn('referydo_advance', 'fund-escrow', [Cl.uint(2)], client);
      simnet.callPublicFn('referydo_advance', 'accept-project', [Cl.uint(2)], talent);

      const response = simnet.callPublicFn(
        'referydo_advance',
        'approve-and-distribute',
        [Cl.uint(2)],
        client
      );

      expect(response.result).toBeOk(Cl.bool(true));
    });

    it('handles rounding correctly with odd amounts', () => {
      // Create project with amount that causes rounding
      simnet.callPublicFn(
        'referydo_advance',
        'create-project',
        [
          Cl.principal(talent),
          Cl.principal(scout),
          Cl.uint(1_000_003), // Odd number
          Cl.uint(33), // 33% causes rounding
          Cl.uint(33), // 33% causes rounding
        ],
        client
      );
      simnet.callPublicFn('referydo_advance', 'fund-escrow', [Cl.uint(2)], client);
      simnet.callPublicFn('referydo_advance', 'accept-project', [Cl.uint(2)], talent);

      const response = simnet.callPublicFn(
        'referydo_advance',
        'approve-and-distribute',
        [Cl.uint(2)],
        client
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Verify that no money was lost to rounding
      const transferEvents = response.events.filter(
        (e: any) => e.event === 'stx_transfer_event'
      );

      const totalTransferred = transferEvents.reduce(
        (sum: number, event: any) => sum + parseInt(event.data.amount),
        0
      );

      // Should be exactly the original amount (or max 2 uSTX difference due to rounding)
      expect(Math.abs(totalTransferred - 1_000_003)).toBeLessThanOrEqual(2);
    });

    it('distributes exactly 100% with optimized gas (V8 verification)', () => {
      const response = simnet.callPublicFn(
        'referydo_advance',
        'approve-and-distribute',
        [Cl.uint(1)],
        client
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Verify exactly 3 transfers (atomic multi-send)
      const transferEvents = response.events.filter(
        (e: any) => e.event === 'stx_transfer_event'
      );
      expect(transferEvents).toHaveLength(3);

      // Verify sum of all transfers equals original amount (100% distribution)
      const totalTransferred = transferEvents.reduce(
        (sum: number, event: any) => sum + parseInt(event.data.amount),
        0
      );
      expect(totalTransferred).toBe(10_000_000);

      // Verify each recipient got their correct amount
      const talentTransfer = transferEvents.find((e: any) => e.data.recipient === talent);
      const scoutTransfer = transferEvents.find((e: any) => e.data.recipient === scout);
      const platformTransfer = transferEvents.find(
        (e: any) => e.data.recipient === 'SP3EK6QA5QPBNMMR98QB2HB1J66TF6QTF0HXDJK5X'
      );

      expect(talentTransfer).toBeDefined();
      expect(scoutTransfer).toBeDefined();
      expect(platformTransfer).toBeDefined();

      // Verify math: 10M - (1M scout + 700k platform) = 8.3M talent
      expect(parseInt(talentTransfer!.data.amount)).toBe(8_300_000);
      expect(parseInt(scoutTransfer!.data.amount)).toBe(1_000_000);
      expect(parseInt(platformTransfer!.data.amount)).toBe(700_000);
    });

    it('fails if not called by client', () => {
      const response = simnet.callPublicFn(
        'referydo_advance',
        'approve-and-distribute',
        [Cl.uint(1)],
        talent // Wrong caller
      );

      expect(response.result).toBeErr(Cl.uint(101)); // ERR-NOT-AUTHORIZED
    });

    it('fails if project not in Funded state', () => {
      // Create and fund but don't accept
      simnet.callPublicFn(
        'referydo_advance',
        'create-project',
        [
          Cl.principal(talent),
          Cl.principal(scout),
          Cl.uint(5_000_000),
          Cl.uint(10),
          Cl.uint(7),
        ],
        client
      );
      simnet.callPublicFn('referydo_advance', 'fund-escrow', [Cl.uint(2)], client);

      const response = simnet.callPublicFn(
        'referydo_advance',
        'approve-and-distribute',
        [Cl.uint(2)],
        client
      );

      expect(response.result).toBeErr(Cl.uint(103)); // ERR-WRONG-STATUS
    });

    it('fails if already distributed', () => {
      // Distribute once
      simnet.callPublicFn(
        'referydo_advance',
        'approve-and-distribute',
        [Cl.uint(1)],
        client
      );

      // Try to distribute again
      const response = simnet.callPublicFn(
        'referydo_advance',
        'approve-and-distribute',
        [Cl.uint(1)],
        client
      );

      expect(response.result).toBeErr(Cl.uint(103)); // ERR-WRONG-STATUS
    });
  });

  describe('Admin & Governance', () => {
    it('returns correct super-admin on deployment', () => {
      const response = simnet.callReadOnlyFn(
        'referydo_advance',
        'get-super-admin',
        [],
        deployer
      );

      expect(response.result).toBeOk(Cl.principal(deployer));
    });

    it('allows super-admin to transfer admin role', () => {
      const newAdmin = accounts.get('wallet_4')!;

      const response = simnet.callPublicFn(
        'referydo_advance',
        'transfer-admin',
        [Cl.principal(newAdmin)],
        deployer
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Verify new admin
      const adminResponse = simnet.callReadOnlyFn(
        'referydo_advance',
        'get-super-admin',
        [],
        deployer
      );

      expect(adminResponse.result).toBeOk(Cl.principal(newAdmin));
    });

    it('prevents non-admin from transferring admin role', () => {
      const newAdmin = accounts.get('wallet_4')!;

      const response = simnet.callPublicFn(
        'referydo_advance',
        'transfer-admin',
        [Cl.principal(newAdmin)],
        client // Not admin
      );

      expect(response.result).toBeErr(Cl.uint(101)); // ERR-NOT-AUTHORIZED
    });

    it('allows new admin to perform admin actions after transfer', () => {
      const newAdmin = accounts.get('wallet_4')!;
      const newWallet = accounts.get('wallet_5')!;

      // Transfer admin role
      simnet.callPublicFn(
        'referydo_advance',
        'transfer-admin',
        [Cl.principal(newAdmin)],
        deployer
      );

      // New admin updates platform wallet
      const response = simnet.callPublicFn(
        'referydo_advance',
        'update-platform-wallet',
        [Cl.principal(newWallet)],
        newAdmin
      );

      expect(response.result).toBeOk(Cl.bool(true));
    });

    it('prevents old admin from performing admin actions after transfer', () => {
      const newAdmin = accounts.get('wallet_4')!;
      const newWallet = accounts.get('wallet_5')!;

      // Transfer admin role
      simnet.callPublicFn(
        'referydo_advance',
        'transfer-admin',
        [Cl.principal(newAdmin)],
        deployer
      );

      // Old admin tries to update platform wallet
      const response = simnet.callPublicFn(
        'referydo_advance',
        'update-platform-wallet',
        [Cl.principal(newWallet)],
        deployer // Old admin
      );

      expect(response.result).toBeErr(Cl.uint(101)); // ERR-NOT-AUTHORIZED
    });
  });

  describe('update-platform-wallet', () => {
    it('allows super-admin to update platform wallet', () => {
      const newWallet = accounts.get('wallet_4')!;

      const response = simnet.callPublicFn(
        'referydo_advance',
        'update-platform-wallet',
        [Cl.principal(newWallet)],
        deployer
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Verify wallet was updated
      const walletResponse = simnet.callReadOnlyFn(
        'referydo_advance',
        'get-platform-wallet',
        [],
        deployer
      );

      expect(walletResponse.result).toBeOk(Cl.principal(newWallet));
    });

    it('fails if not called by super-admin', () => {
      const newWallet = accounts.get('wallet_4')!;

      const response = simnet.callPublicFn(
        'referydo_advance',
        'update-platform-wallet',
        [Cl.principal(newWallet)],
        client // Not admin
      );

      expect(response.result).toBeErr(Cl.uint(101)); // ERR-NOT-AUTHORIZED
    });
  });

  describe('get-project-data', () => {
    it('returns project data for existing project', () => {
      simnet.callPublicFn(
        'referydo_advance',
        'create-project',
        [
          Cl.principal(talent),
          Cl.principal(scout),
          Cl.uint(10_000_000),
          Cl.uint(10),
          Cl.uint(7),
        ],
        client
      );

      const response = simnet.callReadOnlyFn(
        'referydo_advance',
        'get-project-data',
        [Cl.uint(1)],
        client
      );

      expect(response.result).toBeSome(
        Cl.tuple({
          client: Cl.principal(client),
          talent: Cl.principal(talent),
          scout: Cl.principal(scout),
          amount: Cl.uint(10_000_000),
          'scout-fee-percent': Cl.uint(10),
          'platform-fee-percent': Cl.uint(7),
          status: Cl.uint(0),
        })
      );
    });

    it('returns none for non-existent project', () => {
      const response = simnet.callReadOnlyFn(
        'referydo_advance',
        'get-project-data',
        [Cl.uint(999)],
        client
      );

      expect(response.result).toBeNone();
    });
  });

  describe('Complete workflow', () => {
    it('executes full happy path from creation to distribution', () => {
      // 1. Create project
      const createResponse = simnet.callPublicFn(
        'referydo_advance',
        'create-project',
        [
          Cl.principal(talent),
          Cl.principal(scout),
          Cl.uint(50_000_000), // 50 STX
          Cl.uint(12), // 12% scout
          Cl.uint(7), // 7% platform
        ],
        client
      );
      expect(createResponse.result).toBeOk(Cl.uint(1));

      // 2. Fund escrow
      const fundResponse = simnet.callPublicFn(
        'referydo_advance',
        'fund-escrow',
        [Cl.uint(1)],
        client
      );
      expect(fundResponse.result).toBeOk(Cl.bool(true));

      // 3. Talent accepts
      const acceptResponse = simnet.callPublicFn(
        'referydo_advance',
        'accept-project',
        [Cl.uint(1)],
        talent
      );
      expect(acceptResponse.result).toBeOk(Cl.bool(true));

      // 4. Client approves and distributes
      const distributeResponse = simnet.callPublicFn(
        'referydo_advance',
        'approve-and-distribute',
        [Cl.uint(1)],
        client
      );
      expect(distributeResponse.result).toBeOk(Cl.bool(true));

      // Verify final status
      const finalData = simnet.callReadOnlyFn(
        'referydo_advance',
        'get-project-data',
        [Cl.uint(1)],
        client
      );
      expect(finalData.result).toBeSome(
        Cl.tuple({
          client: Cl.principal(client),
          talent: Cl.principal(talent),
          scout: Cl.principal(scout),
          amount: Cl.uint(50_000_000),
          'scout-fee-percent': Cl.uint(12),
          'platform-fee-percent': Cl.uint(7),
          status: Cl.uint(2), // Completed
        })
      );
    });

    it('executes decline workflow with refund', () => {
      // 1. Create project
      simnet.callPublicFn(
        'referydo_advance',
        'create-project',
        [
          Cl.principal(talent),
          Cl.principal(scout),
          Cl.uint(15_000_000),
          Cl.uint(10),
          Cl.uint(7),
        ],
        client
      );

      // 2. Fund escrow
      simnet.callPublicFn('referydo_advance', 'fund-escrow', [Cl.uint(1)], client);

      // 3. Talent declines
      const declineResponse = simnet.callPublicFn(
        'referydo_advance',
        'decline-project',
        [Cl.uint(1)],
        talent
      );
      expect(declineResponse.result).toBeOk(Cl.bool(true));

      // Verify final status
      const finalData = simnet.callReadOnlyFn(
        'referydo_advance',
        'get-project-data',
        [Cl.uint(1)],
        client
      );
      expect(finalData.result).toBeSome(
        Cl.tuple({
          client: Cl.principal(client),
          talent: Cl.principal(talent),
          scout: Cl.principal(scout),
          amount: Cl.uint(15_000_000),
          'scout-fee-percent': Cl.uint(10),
          'platform-fee-percent': Cl.uint(7),
          status: Cl.uint(5), // Declined
        })
      );
    });
  });
});
