import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

interface Transaction {
    reference: string
    type: string
    amount: number
    status: string
    createdAt: string
    direction: 'IN' | 'OUT'
    description: string
}

export function useTransactions(limit = 5) {
    return useQuery({
        queryKey: ['transactions', limit],
        queryFn: async (): Promise<Transaction[]> => {
            const res = await api.get(`/accounts/history?limit=${limit}`)
            return res.data.transactions || []
        },
    })
}
