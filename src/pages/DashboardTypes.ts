export type MobileTab = 'HOME' | 'TRANSFER' | 'HISTORY' | 'PROFILE';

export interface Account {
  type: 'WALLET' | 'MERCHANT' | 'AGENT_FLOAT';
  balance: number;
}

export interface KycLimits {
  kycLevel: number;
  perTransaction: number;
  dailyRemaining: number;
}

export interface Transaction {
  reference: string;
  type: string;
  amount: number;
  direction: 'IN' | 'OUT';
  status: string;
  createdAt: string;
}
