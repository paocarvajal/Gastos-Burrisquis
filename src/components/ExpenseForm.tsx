import React, { useState, useEffect } from 'react';
import { Card, Expense } from '../types';

interface ExpenseFormProps {
    cards: Record<string, Card>;
    onSave: (expense: Omit<Expense, 'id'>) => void;
    onUpdate: (expense: Expense) => void;
    editingExpense: Expense | null;
    onCancelEdit: () => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ cards, onSave, onUpdate, editingExpense, onCancelEdit }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [paymentMethod, setPaymentMethod] = useState('Efectivo');
    const [selectedCardId, setSelectedCardId] = useState('');
    const [installments, setInstallments] = useState(0);
    const [date, setDate] = useState('');

    // Load editing data
    useEffect(() => {
        if (editingExpense) {
            setDescription(editingExpense.description);
            setAmount(Math.abs(editingExpense.amount).toString());
            setType(editingExpense.amount < 0 ? 'expense' : 'income');
            setPaymentMethod(editingExpense.paymentMethod);
            setSelectedCardId(editingExpense.cardId || '');
            setInstallments(editingExpense.installments || 0);
            setDate(editingExpense.date);

            // Scroll to form
            document.getElementById('expense-form-section')?.scrollIntoView({ behavior: 'smooth' });
        } else {
            // Defaults
            setDate(new Date().toISOString().slice(0, 10));
            setDescription('');
            setAmount('');
            setInstallments(0);
            setPaymentMethod('Efectivo');
            setSelectedCardId('');
        }
    }, [editingExpense]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !description) return;

        const numAmount = parseFloat(amount);
        const finalAmount = type === 'income' ? Math.abs(numAmount) : -Math.abs(numAmount);

        const expenseData: any = {
            description,
            amount: finalAmount,
            currency: 'MXN',
            paymentMethod,
            date,
            cardId: paymentMethod === 'Tarjeta' ? selectedCardId : undefined,
            installments: (paymentMethod === 'Tarjeta' && cards[selectedCardId]?.type === 'credit') ? installments : 0
        };

        if (editingExpense) {
            onUpdate({ ...expenseData, id: editingExpense.id });
        } else {
            onSave(expenseData);
        }

        // Reset form handled by useEffect when editingExpense becomes null, but if we just saved new, we reset manually
        if (!editingExpense) {
            setDescription('');
            setAmount('');
            setInstallments(0);
        }
    };

    const handleMethodChange = (method: string) => {
        setPaymentMethod(method);
        if (method !== 'Tarjeta') {
            setSelectedCardId('');
            setInstallments(0);
        }
    };

    const selectedCard = cards[selectedCardId];
    const showInstallments = selectedCard?.type === 'credit';

    return (
        <section id="expense-form-section" className={`rounded-[20px] p-5 sm:p-6 shadow-lg border transition-all ${editingExpense ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    {editingExpense ? '✏️ Editando Movimiento' : 'Nuevo Movimiento'}
                </h2>
                {editingExpense && (
                    <button onClick={onCancelEdit} className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 underline">
                        Cancelar Edición
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Type Toggle */}
                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setType('expense')}
                        className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${type === 'expense'
                            ? 'bg-white dark:bg-slate-800 text-pink-600 dark:text-pink-400 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                    >
                        ➖ Gasto (Cargo)
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('income')}
                        className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${type === 'income'
                            ? 'bg-white dark:bg-slate-800 text-green-600 dark:text-green-400 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                    >
                        ➕ Ingreso (Abono)
                    </button>
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Monto</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            className="w-full pl-8 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-3xl font-black text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-pink-500 outline-none placeholder-slate-200 dark:placeholder-slate-700"
                            required
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">¿Qué compraste?</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ej: Supermercado, Gasolina..."
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-pink-500 outline-none"
                        required
                    />
                </div>

                {/* Payment Method */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Método de Pago</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['Efectivo', 'Tarjeta', 'Transferencia'].map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => handleMethodChange(m)}
                                className={`py-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${paymentMethod === m
                                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-slate-800 dark:border-slate-200'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <span className="text-lg">
                                    {m === 'Efectivo' ? '💵' : m === 'Tarjeta' ? '💳' : '📱'}
                                </span>
                                {m === 'Tarjeta' ? 'Tarjeta' : m === 'Transferencia' ? 'Transfer' : 'Efectivo'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Card Selection */}
                {paymentMethod === 'Tarjeta' && (
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Selecciona la Tarjeta</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {Object.values(cards).filter(c => c).map((card) => (
                                <button
                                    key={card.id}
                                    type="button"
                                    onClick={() => setSelectedCardId(card.id)}
                                    className={`p-3 rounded-xl border text-xs font-bold transition-all ${selectedCardId === card.id
                                        ? 'ring-2 ring-pink-500 bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800 text-slate-700 dark:text-slate-200'
                                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                                        }`}
                                >
                                    {card.name}
                                </button>
                            ))}
                        </div>

                        {/* MSI Selection */}
                        {showInstallments && (
                            <div className="mt-4">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Meses sin Intereses (MSI)</label>
                                <select
                                    value={installments}
                                    onChange={(e) => setInstallments(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-pink-500 outline-none"
                                >
                                    <option value="0">No aplica</option>
                                    <option value="3">3 Meses</option>
                                    <option value="6">6 Meses</option>
                                    <option value="9">9 Meses</option>
                                    <option value="12">12 Meses</option>
                                    <option value="18">18 Meses</option>
                                    <option value="24">24 Meses</option>
                                </select>
                            </div>
                        )}
                    </div>
                )}

                {/* Date */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Fecha</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-pink-500 outline-none"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className={`w-full py-4 text-white rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] ${editingExpense ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-700 shadow-slate-200 dark:shadow-teal-900/20'}`}
                >
                    {editingExpense ? 'Actualizar Movimiento' : 'Guardar Movimiento'}
                </button>
            </form>
        </section>
    );
};
