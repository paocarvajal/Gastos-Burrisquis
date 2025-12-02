export type CardType = 'debit' | 'credit';

export interface Card {
    id: string;
    name: string;
    type: CardType;
    color: string;
    cutoffDay?: number;
    paymentDay?: number;
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
