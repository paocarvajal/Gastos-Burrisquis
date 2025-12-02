import React, { useState } from 'react';
import { Card } from '../types';

interface AccountsManagerProps {
    cards: Record<string, Card>;
    onAddCard: (card: Card) => void;
    onDeleteCard: (cardId: string) => void;
}

const PRESET_COLORS = [
    'bg-blue-600', 'bg-red-600', 'bg-emerald-500', 'bg-pink-500',
    'bg-purple-600', 'bg-orange-500', 'bg-slate-800', 'bg-teal-600',
    'bg-indigo-600', 'bg-rose-600', 'bg-cyan-600', 'bg-amber-500'
];

export const AccountsManager: React.FC<AccountsManagerProps> = ({ cards, onAddCard, onDeleteCard }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newCard, setNewCard] = useState<Partial<Card>>({
        type: 'debit',
        color: 'bg-slate-800'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCard.name) return;

        const id = newCard.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString().slice(-4);

        onAddCard({
            id,
            name: newCard.name,
            type: newCard.type as 'debit' | 'credit',
            color: newCard.color || 'bg-slate-800',
            cutoffDay: newCard.cutoffDay,
            paymentDay: newCard.paymentDay
        });

        setIsAdding(false);
        setNewCard({ type: 'debit', color: 'bg-slate-800' });
    };

    return (
        <section className="bg-white dark:bg-slate-800 rounded-[20px] p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    💳 Mis Cuentas y Tarjetas
                </h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                    {isAdding ? 'Cancelar' : '+ Nueva Cuenta'}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="mb-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Nombre de la Cuenta</label>
                            <input
                                type="text"
                                required
                                placeholder="Ej. Banamex Nómina"
                                value={newCard.name || ''}
                                onChange={e => setNewCard({ ...newCard, name: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Tipo</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setNewCard({ ...newCard, type: 'debit' })}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold border ${newCard.type === 'debit' ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-slate-600 text-slate-400'}`}
                                >
                                    Débito
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewCard({ ...newCard, type: 'credit' })}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold border ${newCard.type === 'credit' ? 'bg-pink-50 border-pink-200 text-pink-600 dark:bg-pink-900/30 dark:border-pink-700 dark:text-pink-400' : 'border-slate-200 dark:border-slate-600 text-slate-400'}`}
                                >
                                    Crédito
                                </button>
                            </div>
                        </div>

                        {newCard.type === 'credit' && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Día de Corte</label>
                                    <input
                                        type="number"
                                        min="1" max="31"
                                        placeholder="Ej. 15"
                                        value={newCard.cutoffDay || ''}
                                        onChange={e => setNewCard({ ...newCard, cutoffDay: parseInt(e.target.value) })}
                                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Día de Pago</label>
                                    <input
                                        type="number"
                                        min="1" max="31"
                                        placeholder="Ej. 5"
                                        value={newCard.paymentDay || ''}
                                        onChange={e => setNewCard({ ...newCard, paymentDay: parseInt(e.target.value) })}
                                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm"
                                    />
                                </div>
                            </>
                        )}

                        <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Color Identificativo</label>
                            <div className="flex flex-wrap gap-2">
                                {PRESET_COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setNewCard({ ...newCard, color })}
                                        className={`w-8 h-8 rounded-full ${color.replace('bg-', 'bg-')} ${newCard.color === color ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900' : 'opacity-70 hover:opacity-100'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            type="submit"
                            className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                        >
                            Guardar Cuenta
                        </button>
                    </div>
                </form>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.values(cards).filter(c => c).map(card => (
                    <div key={card.id} className="group relative p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition-all bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full ${card.color || 'bg-slate-800'} flex items-center justify-center text-white shadow-sm`}>
                                {card.type === 'credit' ? '💳' : '🏦'}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">{card.name}</h3>
                                <p className="text-xs text-slate-400 capitalize">{card.type === 'credit' ? 'Crédito' : 'Débito'}</p>
                            </div>
                        </div>

                        {card.type === 'credit' && (
                            <div className="mt-3 flex gap-4 text-[10px] text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2">
                                <div>Corte: Día {card.cutoffDay || '?'}</div>
                                <div>Pago: Día {card.paymentDay || '?'}</div>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                if (confirm(`¿Seguro que quieres borrar la cuenta "${card.name}"? Los gastos asociados perderán su referencia.`)) {
                                    onDeleteCard(card.id);
                                }
                            }}
                            className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
};
