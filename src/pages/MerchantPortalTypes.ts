export type MerchantTab = 'DASHBOARD' | 'API_KEYS' | 'TRANSACTIONS' | 'WEBHOOKS' | 'SETTINGS';

export interface MerchantData {
  id: number;
  businessName: string;
  publicKey: string;
  secretKey?: string;
  webhookSecret?: string;
  webhookUrl?: string;
  isActive: boolean;
  isTestMode: boolean;
  defaultCurrency: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  kycStatus: string;
  testPublicKey?: string;
  testSecretKey?: string;
  testWebhookSecret?: string;
}

export interface MerchantTransaction {
  id: string;
  reference?: string;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  status: string;
  description: string;
  customerEmail?: string;
  createdAt: string;
  paidAt?: string;
  direction?: 'IN' | 'OUT';
  type?: string;
}

export interface MerchantAccount {
  type: string;
  balance: number;
}
