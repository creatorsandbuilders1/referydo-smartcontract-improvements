# REFERYDO Smart Contract - Project Escrow V8

> Decentralized escrow smart contract for the REFERYDO talent marketplace, built on Stacks blockchain with Clarity.

[![Stacks](https://img.shields.io/badge/Stacks-Blockchain-5546FF)](https://www.stacks.co/)
[![Clarity](https://img.shields.io/badge/Clarity-Smart%20Contract-00D4AA)](https://clarity-lang.org/)
[![Tests](https://img.shields.io/badge/Tests-36%2F36%20Passing-success)](./tests)
[![Fuzz](https://img.shields.io/badge/Fuzz%20Tests-100%20runs%2C%200%20bugs-success)](./contracts/referydo_advance.tests.clar)
[![Deployed](https://img.shields.io/badge/Testnet-Deployed-blue)](https://explorer.hiro.so/txid/ST3WRT7YDT1A14EGMND7JA1W0AXV1H5P9TRT55ZJY.REFERYDO-project-escrow-v8?chain=testnet)

---

## 🎉 Development Status: ALL CRITERIA MET ✅

| Criterion | Status | Details |
|-----------|--------|---------|
| ✅ Contract functionality & unit tests | **COMPLETED** | 36/36 tests passing (100% coverage) |
| ✅ Fuzz testing with Rendezvous | **COMPLETED** | 100 runs, 0 bugs found |
| ✅ Migrate to Clarinet | **COMPLETED** | Clarinet 3.8.1 configured |
| ✅ Deploy to testnet | **COMPLETED** | Nov, 2025 |

📄 **[View Complete Criteria Report →](CRITERIA_COMPLETION.md)**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Contract Details](#contract-details)
- [Features](#features)
- [Architecture](#architecture)
- [Testing](#testing)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [About REFERYDO](#about-referydo)

---

## 🎯 Overview

This repository contains the **REFERYDO Project Escrow V8** smart contract, a gas-optimized Clarity contract that powers the escrow functionality for the REFERYDO decentralized talent marketplace.

The contract enables trustless, atomic payments between three parties:
- **Clients** who hire talent
- **Talent** who complete work
- **Scouts** who refer talent and earn commissions

### What Makes This Contract Special

- **100% Fund Distribution**: Mathematically verified to distribute all escrowed funds
- **Gas Optimized**: 30-50% gas reduction vs previous version
- **Atomic Payments**: All transfers succeed or fail together
- **Guaranteed Commissions**: Scouts automatically receive their fees
- **Flexible Fees**: Configurable scout and platform fee percentages
- **Accept/Decline Flow**: Talent can accept or decline projects with automatic refunds

---

## 📜 Contract Details

### Testnet Deployment

| Property | Value |
|----------|-------|
| **Network** | Stacks Testnet |
| **Contract Name** | REFERYDO-project-escrow-v8 |
| **Contract Address** | `ST3WRT7YDT1A14EGMND7JA1W0AXV1H5P9TRT55ZJY.REFERYDO-project-escrow-v8` |
| **Transaction ID** | `0xae7f3aa981fa6af793d5a7ccb868a0743376444bde8e7b096cabde83f4573771` |
| **Deployment Date** | November, 2025 |
| **Version** | V8 (Gas Optimized) |

**Explorer Links**:
- [View Contract](https://explorer.hiro.so/txid/ST3WRT7YDT1A14EGMND7JA1W0AXV1H5P9TRT55ZJY.REFERYDO-project-escrow-v8?chain=testnet)
- [View Transaction](https://explorer.hiro.so/txid/0xae7f3aa981fa6af793d5a7ccb868a0743376444bde8e7b096cabde83f4573771?chain=testnet)

### Contract Statistics

- **Lines of Code**: ~400
- **Public Functions**: 13
- **Read-Only Functions**: 5
- **Gas Efficiency**: All functions use < 0.01% of runtime limit
- **Test Coverage**: 100%

---

## ✨ Features

### Core Functionality

#### 1. Project Creation
```clarity
(create-project talent scout amount scout-fee platform-fee)
```
- Initialize escrow with all participants
- Set custom fee percentages (0-100%)
- Validates fee bounds and combinations

#### 2. Escrow Funding
```clarity
(fund-escrow project-id)
```
- Client deposits STX into contract
- Funds locked until project completion or decline
- Updates project status to "Pending Acceptance"

#### 3. Project Acceptance/Decline
```clarity
(accept-project project-id)
(decline-project project-id)
```
- Talent can accept to start work
- Talent can decline with automatic client refund
- Ensures talent consent before work begins

#### 4. Atomic Distribution
```clarity
(approve-and-distribute project-id)
```
- Client approves completed work
- Distributes 100% of escrowed funds atomically:
  - Talent receives payment (minus fees)
  - Scout receives commission
  - Platform receives fee
- All transfers succeed or fail together

#### 5. Admin Functions
```clarity
(transfer-admin new-admin)
(update-platform-wallet new-wallet)
```
- Super-admin role management
- Platform wallet configuration
- Secure governance controls

### Project Status Flow

```
0: Created → 4: Pending_Acceptance → 1: Funded → 2: Completed
                                   ↓
                              5: Declined (with refund)
```

---

## 🏗️ Architecture

### Gas Optimization (V8)

The V8 version follows the official Stacks mainnet pattern (POX-4) for maximum efficiency:

```clarity
;; Single let block with all calculations
(let (
  ;; 1. Calculate all payouts
  (scout-payout (/ (* total-amount scout-fee) u100))
  (platform-payout (/ (* total-amount platform-fee) u100))
  (talent-payout (- total-amount (+ scout-payout platform-payout)))
  
  ;; 2. Prepare recipients
  (recipients (list
    { to: talent, ustx: talent-payout }
    { to: scout, ustx: scout-payout }
    { to: platform, ustx: platform-payout }
  ))
)
  ;; 3. Validate all conditions
  (asserts! ...)
  
  ;; 4. Execute atomic multi-send
  (fold check-err (map send-payment recipients) (ok true))
)
```

**Benefits**:
- 30-50% gas reduction vs V7
- Atomic multi-recipient transfers
- Follows audited mainnet patterns
- Minimal runtime and memory usage

### Security Features

- ✅ **Immutable Participants**: Addresses locked at project creation
- ✅ **Atomic Transfers**: All payments succeed or fail together
- ✅ **Fee Validation**: Prevents overflow and underflow
- ✅ **Authorization Checks**: Role-based access control
- ✅ **State Machine**: Enforces valid state transitions
- ✅ **No Reentrancy**: Uses Clarity's built-in protections


---

## 🧪 Testing

### Unit Tests (Vitest + Clarinet SDK)

**36 tests covering 100% of functionality**:

```bash
npm test
```

**Test Categories**:
- ✅ Project creation (8 tests)
- ✅ Escrow funding (4 tests)
- ✅ Project acceptance (3 tests)
- ✅ Project decline (2 tests)
- ✅ Fund distribution (9 tests)
- ✅ Admin functions (6 tests)
- ✅ Read-only functions (2 tests)
- ✅ Complete workflows (2 tests)

### Fuzz Testing (Rendezvous)

**Property-based testing with 100 iterations**:

```bash
npm run fuzz
```

**Properties Tested**:
- Fee bounds validation
- Fund conservation (100% distribution)
- Rounding loss minimization
- Arithmetic underflow prevention
- Edge case handling

**Results**: 100 runs, 0 bugs found ✅

### Gas Cost Analysis

```bash
npm run costs
```

**Key Function Costs**:
| Function | Runtime | Memory | Status |
|----------|---------|--------|--------|
| create-project | 23,179 | 247 | ✅ Excellent |
| fund-escrow | 37,353 | 606 | ✅ Excellent |
| accept-project | 29,126 | 230 | ✅ Excellent |
| approve-and-distribute | 101,672 | 1,358 | ✅ Excellent |
| decline-project | 41,082 | 606 | ✅ Excellent |

---

## 🚀 Deployment

### Testnet Deployment

The contract is currently deployed on Stacks Testnet. See [DEPLOYMENT.md](DEPLOYMENT.md) for integration guide.

### Deploy Your Own

```bash
# Generate deployment plan
clarinet deployments generate --testnet

# Deploy to testnet (requires testnet STX)
clarinet deployments apply --testnet
```

**Get Testnet STX**: https://explorer.hiro.so/sandbox/faucet?chain=testnet

### Integration Example

```typescript
import { openContractCall } from '@stacks/connect';

const contractAddress = 'ST3WRT7YDT1A14EGMND7JA1W0AXV1H5P9TRT55ZJY';
const contractName = 'REFERYDO-project-escrow-v8';

// Create a project
await openContractCall({
  network: 'testnet',
  contractAddress,
  contractName,
  functionName: 'create-project',
  functionArgs: [
    principalCV(talentAddress),
    principalCV(scoutAddress),
    uintCV(1000000), // 1 STX
    uintCV(10),      // 10% scout fee
    uintCV(7)        // 7% platform fee
  ],
});
```

---

## 📚 Documentation

### Core Documentation

- **[README.md](README.md)** - This file (contract overview)
- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Development status and technical details
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment info and integration guide
- **[CRITERIA_COMPLETION.md](CRITERIA_COMPLETION.md)** - Proof of criteria completion

### AI Integration Guides 🤖

- **[QUICK_AI_BRIEFING.md](QUICK_AI_BRIEFING.md)** - Quick briefing for AI assistants (5 min read)
- **[AI_INTEGRATION_PROMPT.md](AI_INTEGRATION_PROMPT.md)** - Comprehensive integration guide (15 min read)
- **[AI_BRIEFING_README.md](AI_BRIEFING_README.md)** - How to use the AI briefing documents

**Use these to brief AI assistants** helping with frontend integration or migration from old contract versions.

### Testing Documentation

- **[fuzztesting.md](fuzztesting.md)** - Rendezvous fuzz testing guide
- **[FUZZ_TESTING_PLAN.md](FUZZ_TESTING_PLAN.md)** - Property-based testing plan
- **[unitTesting.md](unitTesting.md)** - Unit testing documentation

### Platform Context

- **[REFERYDO_PLATFORM_CONTEXT.md](REFERYDO_PLATFORM_CONTEXT.md)** - About the REFERYDO platform

---

## 📁 Repository Structure

```
referydo-smartcontract-improvements/
├── contracts/
│   ├── referydo_advance.clar        # Main escrow contract (V8)
│   └── referydo_advance.tests.clar  # Fuzz tests
├── tests/
│   └── referydo_advance.test.ts     # Unit tests (36 tests)
├── settings/
│   └── Devnet.toml                  # Devnet configuration
├── deployments/
│   └── default.simnet-plan.yaml     # Deployment plan
├── Clarinet.toml                    # Clarinet configuration
├── package.json                     # NPM dependencies
├── vitest.config.js                 # Test configuration
├── README.md                        # This file
├── PROJECT_STATUS.md                # Development log
├── DEPLOYMENT.md                    # Deployment guide
├── CRITERIA_COMPLETION.md           # Criteria report
└── REFERYDO_PLATFORM_CONTEXT.md     # Platform overview
```

---

## 🌟 About REFERYDO

This smart contract powers the escrow functionality for **REFERYDO**, a decentralized talent marketplace built on Stacks blockchain.

### Platform Features

- **Three-Way Value Creation**: Clients, Talent, and Scouts all benefit
- **Guaranteed Commissions**: Scouts automatically receive referral fees
- **Sovereign Reputation**: On-chain work history owned by users
- **Fair Fees**: 7% platform fee vs 20%+ on traditional platforms
- **Instant Payouts**: Blockchain-powered automatic distribution

**Learn More**: [REFERYDO_PLATFORM_CONTEXT.md](REFERYDO_PLATFORM_CONTEXT.md)

### Platform Links

- **Live Demo**: https://www.referydo.xyz/
- **Documentation**: https://harmless-oatmeal-afb.notion.site/REFERYDO-299ba1a293e8807b9e73f210bc218d1b

---

## 🤝 Contributing

This is a production smart contract. For security reasons, contributions require thorough review.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass (`npm test`)
5. Run fuzz tests (`npm run fuzz`)
6. Submit a pull request

---

## 📄 License

See LICENSE file for details.

---

## 🔗 Resources

### Stacks & Clarity

- [Stacks Documentation](https://docs.stacks.co/)
- [Clarity Language Book](https://book.clarity-lang.org/)
- [Stacks Explorer](https://explorer.hiro.so/)

### Tools

- [Clarinet](https://github.com/hirosystems/clarinet)
- [Rendezvous (Fuzz Testing)](https://github.com/stacks-network/rendezvous)
- [Stacks.js](https://github.com/hirosystems/stacks.js)

---

**Contract Status**: ✅ Deployed to Testnet | Ready for Production Testing  
**Last Updated**: November, 2025  
**Version**: V8 (Gas Optimized)
