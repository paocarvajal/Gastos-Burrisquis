import React, { useState } from 'react';
import { Expense, Card } from '../types';
import { formatMoney } from '../utils/format';

interface TransactionsListProps {
    expenses: Expense[];
    cards: Record<string, Card>;
    onDelete: (id: number) => void;
    onDeleteMany: (ids: number[]) => void;
    onEdit: React.Dispatch<React.SetStateAction<Expense | null>>;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({ expenses, cards, onDelete, onDeleteMany, onEdit }) => {
    const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [filterCard, setFilterCard] = useState('all');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Generate date options (last 12 months)
    const dateOptions = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const value = d.toISOString().slice(0, 7);
        const label = d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
        dateOptions.push({ value, label });
    }

    const filteredExpenses = expenses.filter(e => {
        const dateMatch = filterDate === 'all' || e.date.startsWith(filterDate);
        const cardMatch = filterCard === 'all' ||
            (e.cardId === filterCard || (e as any).cardInfo?.name === cards[filterCard]?.name);
        return dateMatch && cardMatch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(filteredExpenses.map(ex => ex.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const handleDeleteSelected = () => {
        if (confirm(`¿Estás seguro de borrar ${selectedIds.length} movimientos?`)) {
            onDeleteMany(selectedIds);
            setSelectedIds([]);
        }
    };

    return (
        <section className="bg-white dark:bg-slate-800 rounded-[20px] p-5 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-end mb-4">
                <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    📝 Últimos Movimientos
                </h2>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <select
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="text-sm bg-slate-100 dark:bg-slate-700 border-none rounded-lg px-2 py-2 text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-pink-500 outline-none max-w-[120px]"
                    >
                        <option value="all">📅 Todo</option>
                        {dateOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>

                    <select
                        value={filterCard}
                        onChange={(e) => setFilterCard(e.target.value)}
                        className="text-sm bg-slate-100 dark:bg-slate-700 border-none rounded-lg px-2 py-2 text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-pink-500 outline-none max-w-[120px]"
                    >
                        <option value="all">💳 Todo</option>
                        {Object.values(cards).filter(c => c).map(card => (
                            <option key={card.id} value={card.id}>{card.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedIds.length > 0 && (
                <div className="mb-4 p-3 bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800 rounded-xl flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                    <span className="text-sm font-bold text-pink-700 dark:text-pink-400">{selectedIds.length} seleccionados</span>
                    <button
                        onClick={handleDeleteSelected}
                        className="text-xs bg-white dark:bg-slate-800 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800 px-3 py-1.5 rounded-lg font-bold hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors"
                    >
                        Borrar Seleccionados
                    </button>
                </div>
            )}

            <div className="space-y-3">
                {filteredExpenses.length > 0 && (
                    <div className="flex items-center px-4 mb-2">
                        <input
                            type="checkbox"
                            checked={filteredExpenses.length > 0 && selectedIds.length === filteredExpenses.length}
                            onChange={handleSelectAll}
                            className="w-4 h-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
                        />
                        <span className="ml-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Seleccionar Todo</span>
                    </div>
                )}

                {filteredExpenses.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-slate-400 dark:text-slate-500 text-sm">No hay movimientos en este periodo.</p>
                    </div>
                ) : (
                    filteredExpenses.map(e => {
                        const isExpense = e.amount < 0;
                        const colorClass = isExpense ? 'text-pink-600 dark:text-pink-400' : 'text-green-600 dark:text-green-400';
                        const sign = isExpense ? '' : '+';
                        const cardName = e.cardId ? cards[e.cardId]?.name : (e as any).cardInfo?.name;
                        const isSelected = selectedIds.includes(e.id);

                        return (
                            <div key={e.id} className={`flex items-center justify-between p-4 rounded-xl transition-all border group ${isSelected ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800' : 'bg-slate-50 dark:bg-slate-700/50 border-transparent hover:bg-white dark:hover:bg-slate-700 hover:border-slate-100 dark:hover:border-slate-600'}`}>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleSelectOne(e.id)}
                                        className="w-4 h-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
                                    />
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isExpense ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-500 dark:text-pink-400' : 'bg-green-100 dark:bg-green-900/30 text-green-500 dark:text-green-400'}`}>
                                        {isExpense ? '📉' : '💵'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700 dark:text-slate-200">{e.description}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">
                                            {new Date(e.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} •
                                            {e.paymentMethod} {cardName ? `• ${cardName}` : ''} {e.installments && e.installments > 0 ? `• ${e.installments} MSI` : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${colorClass}`}>{sign}{formatMoney(Math.abs(e.amount))}</p>
                                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => onEdit(e)} className="text-xs text-blue-500 dark:text-blue-400 hover:underline font-bold">Editar</button>
                                        <span className="text-slate-300 dark:text-slate-600">|</span>
                                        <button onClick={() => onDelete(e.id)} className="text-xs text-red-500 dark:text-red-400 hover:underline">Borrar</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
};
