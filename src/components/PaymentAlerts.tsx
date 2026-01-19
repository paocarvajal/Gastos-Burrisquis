import React from 'react';
import { Card, Expense } from '../types';
import { formatMoney } from '../utils/format';

interface PaymentAlertsProps {
    cards: Record<string, Card>;
    expenses: Expense[];
    initialBalances: Record<string, number>;
}

export const PaymentAlerts: React.FC<PaymentAlertsProps> = ({ cards, expenses, initialBalances }) => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const alerts = Object.values(cards)
        .filter(card => card.type === 'credit' && card.cutoffDay && card.gracePeriod)
        .map(card => {
            const cutoffDay = card.cutoffDay!;
            const gracePeriod = card.gracePeriod!;

            // Calculate potential Due Dates based on recent/upcoming Cutoffs
            // 1. Last Month's Cutoff
            const c1 = new Date(currentYear, currentMonth - 1, cutoffDay);
            const d1 = new Date(c1); d1.setDate(c1.getDate() + gracePeriod);

            // 2. This Month's Cutoff
            const c2 = new Date(currentYear, currentMonth, cutoffDay);
            const d2 = new Date(c2); d2.setDate(c2.getDate() + gracePeriod);

            // 3. Next Month's Cutoff
            const c3 = new Date(currentYear, currentMonth + 1, cutoffDay);
            const d3 = new Date(c3); d3.setDate(c3.getDate() + gracePeriod);

            // Pick the first Due Date that is either Today or in the Future (or slightly past, e.g. yesterday)
            // We sort them by time to be sure
            const candidates = [d1, d2, d3].sort((a, b) => a.getTime() - b.getTime());

            // Find the first one that is effectively "Current" (not older than 5 days ago)
            // This allows showing "Overdue" alerts for a few days.
            const targetDueDate = candidates.find(d => {
                const diff = (d.getTime() - today.getTime()) / (1000 * 3600 * 24);
                return diff >= -5;
            }) || candidates[candidates.length - 1];

            // 4. Identify the Relevant Cutoff Date for this target due date
            // The logic: targetDueDate = relevantCutoff + gracePeriod.
            // So relevantCutoff = targetDueDate - gracePeriod.
            const relevantCutoffDate = new Date(targetDueDate);
            relevantCutoffDate.setDate(targetDueDate.getDate() - gracePeriod);

            const diffTime = targetDueDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Show alert if the due date is within the next 20 days (or past)
            if (diffDays > 20) return null;

            // Calculate Debts
            const cardMovs = expenses.filter(e => (e.cardId === card.id || (e as any).cardInfo?.name === card.name));
            const expensesOnly = cardMovs.filter(e => e.amount < 0);
            const paymentsOnly = cardMovs.filter(e => e.amount > 0);

            const totalSpent = expensesOnly.reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
            const totalPaid = paymentsOnly.reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
            const initialDebt = initialBalances[card.id] || 0;
            const currentTotalDebt = initialDebt + totalSpent - totalPaid;

            // --- PAY TO AVOID INTEREST (Statement Balance) ---
            // = InitialDebt + Expenses BEFORE or ON relevantCutoff - All Payments
            // (Assuming initial debt was relevant for the past too)

            // Note: We use a string comparison for dates YYYY-MM-DD to be safe or just timestamp check
            // Set relevantCutoff to End of Day to capture expenses on that day
            const cutoffEndOfDay = new Date(relevantCutoffDate);
            cutoffEndOfDay.setHours(23, 59, 59, 999);

            const expensesBeforeCutoff = expensesOnly
                .filter(e => new Date(e.date) <= cutoffEndOfDay)
                .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

            // Statement Balance = (Initial + PreCutoffSpends) - (All Payments)
            const statementBalance = (initialDebt + expensesBeforeCutoff) - totalPaid;

            // Logic: If Statement Balance is <= 0, the user is "Covered" for this month, 
            // even if they have more debt from recent purchases (that belongs to next month).
            if (statementBalance <= 0) return null;

            // Estimate Interest
            let estimatedInterest = 0;
            if (card.interestRate) {
                const monthlyRate = card.interestRate / 100 / 12;
                // Interest is usually charged on the Average Daily Balance, but here we estimate on the unpaid statement balance
                // to scare the user correctly.
                estimatedInterest = (statementBalance * monthlyRate) * 1.16;
            }

            return {
                card,
                diffDays,
                formattedDate: targetDueDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }),
                cutoffDateDisplay: relevantCutoffDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
                statementBalance: statementBalance > 0 ? statementBalance : 0,
                currentTotalDebt: currentTotalDebt > 0 ? currentTotalDebt : 0,
                estimatedInterest
            };
        })
        .filter(alert => alert !== null);

    if (alerts.length === 0) return null;

    return (
        <section className="animate-in fade-in slide-in-from-top-4 mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                🔔 Alertas de Pago Próximas
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(alerts as any[]).map((alert, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 border-l-4 border-l-pink-500 dark:border-l-pink-400 rounded-r-xl shadow-lg p-4 flex flex-col justify-between relative overflow-hidden">

                        <div className="flex justify-between items-start mb-4 z-10 relative">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight">{alert.card.name}</h3>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-1">
                                    Corte: {alert.cutoffDateDisplay} • Vence:
                                </p>
                                <p className="text-sm font-bold text-pink-600 dark:text-pink-400 mt-0.5">
                                    {alert.formattedDate}
                                </p>
                            </div>
                            <div className={`w-10 h-10 rounded-full ${alert.card.color || 'bg-slate-800'} flex items-center justify-center text-white text-xl shadow-md`}>
                                💳
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 mb-3 border border-slate-100 dark:border-slate-700/50 relative z-10">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-xs font-bold text-slate-500">Para no generar intereses:</span>
                            </div>
                            <div className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                                {formatMoney(alert.statementBalance)}
                            </div>

                            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/50 flex justify-between items-center text-xs">
                                <span className="text-slate-400">Deuda Total Real:</span>
                                <span className="font-semibold text-slate-600 dark:text-slate-300">{formatMoney(alert.currentTotalDebt)}</span>
                            </div>
                        </div>

                        {alert.estimatedInterest > 0 && (
                            <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-800/30 flex items-center gap-2 mb-3 z-10">
                                <span className="text-xl">💸</span>
                                <div className="leading-none">
                                    <p className="text-[10px] font-bold text-red-500 uppercase">Riesgo de Interés (+IVA)</p>
                                    <p className="font-bold text-red-700 dark:text-red-400 text-sm">~{formatMoney(alert.estimatedInterest)}</p>
                                </div>
                            </div>
                        )}

                        <div className="text-center mt-1 z-10">
                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${alert.diffDays <= 3 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-orange-100 text-orange-600'
                                }`}>
                                {alert.diffDays <= 0 ? (alert.diffDays === 0 ? '¡Vence Hoy!' : `Venció hace ${Math.abs(alert.diffDays)} días`) : `Faltan ${alert.diffDays} días`}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
