# 🚀 Quick AI Briefing - REFERYDO Contract V8 Integration

**Copy and paste this to brief another AI assistant about the new contract**

---

## Context

I need help integrating the new REFERYDO escrow smart contract (V8) into our frontend. The platform previously used an older contract version. Here's what you need to know:

## New Contract Details

```
Network: Stacks Testnet
Contract: ST3WRT7YDT1A14EGMND7JA1W0AXV1H5P9TRT55ZJY.REFERYDO-project-escrow-v8
Deployed: November 23, 2024
Status: ✅ Verified and tested
```

## What Changed (V8 vs Old)

### NEW: Accept/Decline Flow
The biggest change is that talent must now **accept or decline** projects after the client funds the escrow.

**Old Flow**:
```
Create → Fund → Work → Approve
```

**New Flow**:
```
Create → Fund → Accept/Decline → Work → Approve
                    ↓
                 Refund (automatic)
```

### New Status Codes
```
0 = Created
1 = Funded (work in progress)
2 = Completed
3 = Disputed (reserved)
4 = Pending_Acceptance (NEW - waiting for talent)
5 = Declined (NEW - talent declined, client refunded)
```

## Core Functions

### 1. create-project
```typescript
// Client creates project
functionName: 'create-project'
args: [
  principalCV(talentAddress),    // ST...
  principalCV(scoutAddress),     // ST...
  uintCV(amountMicroSTX),        // 1 STX = 1,000,000
  uintCV(scoutFeePercent),       // 0-100
  uintCV(platformFeePercent)     // 0-100
]
// Returns: project-id
```

### 2. fund-escrow
```typescript
// Client deposits STX
functionName: 'fund-escrow'
args: [uintCV(projectId)]
// Status changes: 0 → 4 (Pending_Acceptance)
```

### 3. accept-project (NEW)
```typescript
// Talent accepts project
functionName: 'accept-project'
args: [uintCV(projectId)]
// Status changes: 4 → 1 (Funded)
// Only talent can call
```

### 4. decline-project (NEW)
```typescript
// Talent declines, client gets refund
functionName: 'decline-project'
args: [uintCV(projectId)]
// Status changes: 4 → 5 (Declined)
// Client automatically refunded
// Only talent can call
```

### 5. approve-and-distribute
```typescript
// Client approves work, funds distributed
functionName: 'approve-and-distribute'
args: [uintCV(projectId)]
// Status changes: 1 → 2 (Completed)
// Distributes to: talent, scout, platform
// Only client can call
```

### 6. get-project-data (read-only)
```typescript
// Get project info
functionName: 'get-project-data'
args: [uintCV(projectId)]
// Returns: { client, talent, scout, amount, scout-fee-percent, platform-fee-percent, status }
```

## Payment Calculation

```typescript
const scoutPayout = (amount * scoutFee) / 100;
const platformPayout = (amount * platformFee) / 100;
const talentPayout = amount - scoutPayout - platformPayout;

// Example: 10 STX, 10% scout, 7% platform
// Scout: 1 STX
// Platform: 0.7 STX
// Talent: 8.3 STX
```

## Frontend Changes Needed

1. **Add Accept/Decline UI**
   - Show after client funds escrow
   - Only visible to talent
   - Two buttons: "Accept Project" and "Decline Project"

2. **Update Status Display**
   - Add "Pending Acceptance" (status 4)
   - Add "Declined" (status 5)
   - Update status colors/icons

3. **Update Contract Address**
   - Old: [your-old-contract]
   - New: `ST3WRT7YDT1A14EGMND7JA1W0AXV1H5P9TRT55ZJY.REFERYDO-project-escrow-v8`

4. **Handle New Flow**
   - After funding, wait for acceptance
   - Show refund notification on decline
   - Update workflow diagrams

## Quick Integration Example

```typescript
import { openContractCall } from '@stacks/connect';
import { principalCV, uintCV } from '@stacks/transactions';

const CONTRACT_ADDRESS = 'ST3WRT7YDT1A14EGMND7JA1W0AXV1H5P9TRT55ZJY';
const CONTRACT_NAME = 'REFERYDO-project-escrow-v8';

// Create project
const createProject = async (talent, scout, amountSTX, scoutFee, platformFee) => {
  await openContractCall({
    network: 'testnet',
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'create-project',
    functionArgs: [
      principalCV(talent),
      principalCV(scout),
      uintCV(amountSTX * 1_000_000),
      uintCV(scoutFee),
      uintCV(platformFee)
    ]
  });
};

// Accept project (NEW)
const acceptProject = async (projectId) => {
  await openContractCall({
    network: 'testnet',
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'accept-project',
    functionArgs: [uintCV(projectId)]
  });
};

// Decline project (NEW)
const declineProject = async (projectId) => {
  await openContractCall({
    network: 'testnet',
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'decline-project',
    functionArgs: [uintCV(projectId)]
  });
};
```

## Common Validations

```typescript
// Before creating project
if (scoutFee + platformFee > 100) {
  throw new Error('Combined fees cannot exceed 100%');
}

// Before accepting
if (projectStatus !== 4) {
  throw new Error('Project must be in Pending Acceptance status');
}

// Before approving
if (projectStatus !== 1) {
  throw new Error('Project must be in Funded status');
}
```

## Testing

**Testnet Faucet**: https://explorer.hiro.so/sandbox/faucet?chain=testnet

**Test Scenario**:
1. Create project: 10 STX, 10% scout, 7% platform
2. Fund escrow: 10 STX
3. Talent accepts
4. Client approves
5. Verify: Talent gets 8.3 STX, Scout gets 1 STX, Platform gets 0.7 STX

## Full Documentation

For complete details, see:
- [AI_INTEGRATION_PROMPT.md](AI_INTEGRATION_PROMPT.md) - Comprehensive guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Integration examples
- [README.md](README.md) - Contract overview

## Explorer Link

View contract: https://explorer.hiro.so/txid/ST3WRT7YDT1A14EGMND7JA1W0AXV1H5P9TRT55ZJY.REFERYDO-project-escrow-v8?chain=testnet

---

**Key Takeaway**: The main change is the accept/decline flow. After funding, talent must explicitly accept before work begins, or decline to trigger an automatic refund.
