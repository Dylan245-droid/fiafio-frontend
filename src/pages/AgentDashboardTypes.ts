export interface Transaction {
  reference: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  direction: 'IN' | 'OUT';
  description: string;
}

export interface AgentStats {
  level: {
    key: number;
    name: string;
    badge: string;
    daysActive: number;
    daysUntilNextLevel: number;
    transactionsUntilNextLevel: number;
    nextLevel: string | null;
    nextLevelLimit: number | null;
    isStagnating: boolean;
    stagnationReason: string | null;
  };
  limits: {
    daily: number;
    perTransaction: number;
    todayUsed: number;
    remaining: number;
    percentage: number;
  };
  float: {
    balance: number;
    minimum: number;
    canOperate: boolean;
    blockReason: string | null;
  };
  commissions: {
    today: number;
    week: number;
    month: number;
  };
  kycLevel: number;
  totalTransactions: number;
  activation: {
    status: 'PENDING_FLOAT' | 'ACTIVE' | 'SUSPENDED' | null;
    deadline: string | null;
    daysRemaining: number | null;
  };
}

export interface Customer {
  id: number;
  phone: string;
  uniqueId?: string;
  fullName: string | null;
}

export type View = 'DASHBOARD' | 'DEPOSIT' | 'ACTIVATE' | 'MY_QR' | 'WITHDRAW';
export type Step = 'CUSTOMER' | 'AMOUNT' | 'CONFIRM' | 'SUCCESS';
export type MobileTab = 'HOME' | 'FINANCE' | 'HISTORY' | 'PROFILE';
