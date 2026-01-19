export type CardType = 'debit' | 'credit';

export interface Card {
    id: string;
    name: string;
    type: CardType;
    color: string;
    cutoffDay?: number;
    gracePeriod?: number; // Days after cutoff date to pay (e.g., 20)
    interestRate?: number; // Annual interest rate percentage (e.g., 50 for 50%)
}

export interface Expense {
    id: number;
    description: string;
    amount: number; // Negative for expense, positive for income
    currency: string;
    paymentMethod: string;
    cardId?: string;
    installments?: number;
    date: string; // ISO string YYYY-MM-DD
}
