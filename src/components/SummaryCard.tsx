import React from 'react';
import { Card, Expense } from '../types';
import { formatMoney } from '../utils/format';

interface SummaryCardProps {
    card: Card;
    initialBalance: number;
    movements: Expense[];
    onPay: (cardId: string) => void;
    onAdjust: (cardId: string) => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ card, initialBalance, movements, onPay, onAdjust }) => {
    const isDebit = card.type === 'debit';

    // Calculate totals
    const totalMovs = movements.reduce((acc, curr) => acc + curr.amount, 0);

    let content;

    if (isDebit) {
        const finalBalance = initialBalance + totalMovs;

        content = (
            <>
                <div className="mt-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Saldo Disponible</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{formatMoney(finalBalance)}</p>
                </div>
            </>
        );
    } else {
        // Credit Logic
        const expensesOnly = movements.filter(e => e.amount < 0);
        const paymentsOnly = movements.filter(e => e.amount > 0);

        const totalSpent = expensesOnly.reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
        const totalPaid = paymentsOnly.reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
        const currentDebt = initialBalance + totalSpent - totalPaid;

        // MSI Logic
        let monthlyPaymentDue = 0;
        expensesOnly.forEach(e => {
            const amt = Math.abs(e.amount);
            if (e.installments && e.installments > 0) {
                monthlyPaymentDue += (amt / e.installments);
            } else {
                monthlyPaymentDue += amt;
            }
        });

        content = (
            <>
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Pago del Mes</p>
                        <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatMoney(totalPaid)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Deuda Total</p>
                        <p className="text-lg font-bold text-pink-600 dark:text-pink-400">{formatMoney(currentDebt)}</p>
                    </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-50 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 flex justify-between">
                        <span>Mensualidad Est. (MSI):</span>
                        <span className="font-bold text-slate-600 dark:text-slate-300">{formatMoney(monthlyPaymentDue)}</span>
                    </p>
                </div>
            </>
        );
    }

    // Dynamic icon color based on card color
    // We assume card.color is like 'bg-blue-600'
    // We want to extract 'blue-600' to use in text class
    const safeColor = card.color || 'bg-slate-800';
    const colorName = safeColor.replace('bg-', '');

    return (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="text-4xl">{isDebit ? '🏦' : '💳'}</span>
            </div>

            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-200">{card.name}</h3>
                    {isDebit ? (
                        <p className="text-xs text-slate-400">Débito / Nómina</p>
                    ) : (
                        <div className="flex gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span>Corte: Día {card.cutoffDay || '?'}</span>
                            <span>•</span>
                            <span>Pago: Día {card.paymentDay || '?'}</span>
                        </div>
                    )}
                </div>
                <div className={`w-10 h-10 rounded-full ${card.color || 'bg-slate-800'} flex items-center justify-center text-white shadow-sm`}>
                    <span className="text-xl">{isDebit ? '🏦' : '💳'}</span>
                </div>
            </div>

            {content}

            <div className="mt-3 flex justify-end gap-2 items-center">
                <button
                    onClick={() => onPay(card.id)}
                    className="text-xs bg-slate-800 dark:bg-slate-700 text-white px-3 py-1 rounded-full hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                >
                    Pagar
                </button>
                <button
                    onClick={() => onAdjust(card.id)}
                    className="text-xs text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 underline"
                >
                    Ajustar
                </button>
            </div>
        </div>
    );
};

