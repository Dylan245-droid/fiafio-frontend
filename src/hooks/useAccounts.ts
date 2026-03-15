import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

interface Account {
    type: string
    balance: number
    currency: string
}

interface KycLimits {
    kycLevel: number
    perTransaction: number
    dailyRemaining: number
    monthlyRemaining: number
}

interface BalanceResponse {
    accounts: Account[]
    kycLimits: KycLimits | null
}

export function useAccounts() {
    return useQuery({
        queryKey: ['accounts'],
        queryFn: async (): Promise<BalanceResponse> => {
            const res = await api.get('/accounts/balance')
            return {
                accounts: res.data.accounts || [],
                kycLimits: res.data.kycLimits || null,
            }
        },
    })
}
