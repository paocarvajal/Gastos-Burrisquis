import React, { useState } from 'react';
import { Card } from '../types';

interface AccountsManagerProps {
    cards: Record<string, Card>;
    initialBalances: Record<string, number>;
    onAddCard: (card: Card) => void;
    onEditCard: (card: Card) => void;
    onDeleteCard: (cardId: string) => void;
    onUpdateInitialBalance: (cardId: string, amount: number) => void;
}

const PRESET_COLORS = [
    'bg-blue-600', 'bg-red-600', 'bg-emerald-500', 'bg-pink-500',
    'bg-purple-600', 'bg-orange-500', 'bg-slate-800', 'bg-teal-600',
    'bg-indigo-600', 'bg-rose-600', 'bg-cyan-600', 'bg-amber-500'
];

export const AccountsManager: React.FC<AccountsManagerProps> = ({
    cards,
    initialBalances,
    onAddCard,
    onEditCard,
    onDeleteCard,
    onUpdateInitialBalance
}) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Card> & { initialBalance?: string }>({
        type: 'debit',
        color: 'bg-slate-800',
        initialBalance: ''
    });
    const [refDateCutoff, setRefDateCutoff] = useState('');
    const [refDatePayment, setRefDatePayment] = useState('');

    const calculateFromDates = (corte: string, pago: string) => {
        if (!corte) return;

        // 1. Determine Cutoff Day
        // We assume the user enters a full date (YYYY-MM-DD). We just steal the 'Day' part.
        // NOTE: Input date value is usually YYYY-MM-DD.
        // We append T12:00:00 to avoid timezone shifts when parsing with new Date() if it defaults to UTC midnight.
        const d1 = new Date(corte + "T12:00:00");
        const newCutoffDay = d1.getDate();

        let newGracePeriod = formData.gracePeriod;

        // 2. Determine Grace Period
        // Difference in days between Payment Date and Cutoff Date
        if (pago) {
            const d2 = new Date(pago + "T12:00:00");
            const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
            if (!isNaN(diff) && diff > 0) {
                newGracePeriod = diff;
            }
        }

        setFormData(prev => ({
            ...prev,
            cutoffDay: newCutoffDay,
            gracePeriod: newGracePeriod
        }));
    };

    const handleEditClick = (card: Card) => {
        setEditingId(card.id);
        const currentBalance = initialBalances[card.id] || 0;
        setFormData({
            ...card,
            initialBalance: currentBalance.toString()
        });
        setIsFormOpen(true);
        // Reset calc dates (we don't persist them, we only persist the result)
        setRefDateCutoff('');
        setRefDatePayment('');
    };

    const handleCancel = () => {
        setIsFormOpen(false);
        setEditingId(null);
        setFormData({ type: 'debit', color: 'bg-slate-800', initialBalance: '' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        const cardId = editingId || (formData.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString().slice(-4));

        const cardData: Card = {
            id: cardId,
            name: formData.name,
            type: formData.type as 'debit' | 'credit',
            color: formData.color || 'bg-slate-800',
            cutoffDay: formData.cutoffDay,
            gracePeriod: formData.gracePeriod,
            interestRate: formData.interestRate
        };

        if (editingId) {
            onEditCard(cardData);
        } else {
            onAddCard(cardData);
        }

        // Handle initial balance update
        if (formData.initialBalance !== undefined && formData.initialBalance !== '') {
            const balance = parseFloat(formData.initialBalance);
            if (!isNaN(balance)) {
                onUpdateInitialBalance(cardId, Math.abs(balance));
            }
        }

        handleCancel();
    };

    return (
        <section className="bg-white dark:bg-slate-800 rounded-[20px] p-6 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    💳 Mis Cuentas y Tarjetas
                </h2>
                <button
                    onClick={() => {
                        if (isFormOpen) handleCancel();
                        else setIsFormOpen(true);
                    }}
                    className="text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                    {isFormOpen ? 'Cancelar' : '+ Nueva Cuenta'}
                </button>
            </div>

            {isFormOpen && (
                <form onSubmit={handleSubmit} className="mb-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 transition-colors">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Nombre de la Cuenta</label>
                            <input
                                type="text"
                                required
                                placeholder="Ej. Banamex Nómina"
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                                {formData.type === 'credit' ? 'Deuda Inicial Actual' : 'Saldo Inicial Actual'}
                            </label>
                            <input
                                type="number"
                                required
                                step="any"
                                placeholder="0.00"
                                value={formData.initialBalance || ''}
                                onChange={e => setFormData({ ...formData, initialBalance: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                                {formData.type === 'credit'
                                    ? 'Ingresa cuánto debes en esta tarjeta al día de hoy (antes de registrar nuevos gastos).'
                                    : 'Ingresa cuánto dinero tienes en esta cuenta al día de hoy.'}
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Tipo</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'debit' })}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${formData.type === 'debit' ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-slate-600 text-slate-400'}`}
                                >
                                    Débito
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'credit' })}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${formData.type === 'credit' ? 'bg-pink-50 border-pink-200 text-pink-600 dark:bg-pink-900/30 dark:border-pink-700 dark:text-pink-400' : 'border-slate-200 dark:border-slate-600 text-slate-400'}`}
                                >
                                    Crédito
                                </button>
                            </div>
                        </div>

                        {formData.type === 'credit' && (
                            <>
                                {/* Cutoff Day is now auto-calculated below, but we hide strict manual input to simplify UI or keep it read-only if we wanted. 
                                    For now, let's remove the manual input to force the user to use the Date Logic which is safer.
                                 */}

                                <div>
                                    {/* New Date-Based Logic for Grace Period */}
                                    <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2 p-3 bg-blue-50 dark:bg-slate-800/50 rounded-xl border border-blue-100 dark:border-slate-700">
                                        <div className="sm:col-span-2 text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-[-8px]">
                                            📅 Configuración de Fechas
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                                1. Fecha de Corte (Del Recibo)
                                            </label>
                                            <input
                                                type="date"
                                                value={refDateCutoff}
                                                onChange={(e) => {
                                                    setRefDateCutoff(e.target.value);
                                                    calculateFromDates(e.target.value, refDatePayment);
                                                }}
                                                className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <p className="text-[9px] text-slate-400 mt-1">La fecha que dice "Corte" en tu estado de cuenta reciente.</p>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                                2. Fecha Límite de Pago
                                            </label>
                                            <input
                                                type="date"
                                                value={refDatePayment}
                                                onChange={(e) => {
                                                    setRefDatePayment(e.target.value);
                                                    calculateFromDates(refDateCutoff, e.target.value);
                                                }}
                                                className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <p className="text-[9px] text-slate-400 mt-1">La fecha "Límite de Pago" para ese mismo corte.</p>
                                        </div>

                                        {/* Calculated Result Preview */}
                                        <div className="sm:col-span-2 mt-1 pt-2 border-t border-blue-100 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400 flex justify-between items-center">
                                            <span>🧮 Configuración detectada:</span>
                                            <div className="flex gap-3 font-mono">
                                                <span>
                                                    Corte: <strong>Día {formData.cutoffDay || '--'}</strong>
                                                </span>
                                                <span>
                                                    Gracia: <strong>{formData.gracePeriod || '--'} días</strong>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                                        Tasa de Interés Anual Ordinaria (%) <span className="text-gray-300 font-normal">(Opcional)</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Ej. 35.0"
                                        value={formData.interestRate || ''}
                                        onChange={e => setFormData({ ...formData, interestRate: parseFloat(e.target.value) })}
                                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        ℹ️ Busca la <strong>"Tasa Anual Ordinaria"</strong> o "Tasa Presupuesto" (no la Moratoria). <br />
                                        🚫 <strong>NO uses el CAT</strong>. El CAT incluye anualidad y otros costos que no aplican al interés mensual. <br />
                                        Ej. En Liverpool usa el <strong>58.86%</strong>, no el 71.81%.
                                    </p>
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
                                        onClick={() => setFormData({ ...formData, color })}
                                        className={`w-8 h-8 rounded-full ${color.replace('bg-', 'bg-')} ${formData.color === color ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900 scale-110' : 'opacity-70 hover:opacity-100'} transition-all`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold text-sm px-4"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-lg"
                        >
                            {editingId ? 'Actualizar Cuenta' : 'Guardar Cuenta'}
                        </button>
                    </div>
                </form>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.values(cards).filter(c => c).map(card => (
                    <div key={card.id} className="group relative p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition-all bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full ${card.color || 'bg-slate-800'} flex items-center justify-center text-white shadow-sm`}>
                                <span className="text-xl">{card.type === 'credit' ? '💳' : '🏦'}</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">{card.name}</h3>
                                <p className="text-xs text-slate-400 capitalize">{card.type === 'credit' ? 'Crédito' : 'Débito'}</p>
                            </div>
                        </div>

                        {card.type === 'credit' && (
                            <div className="mt-3 flex gap-4 text-[10px] text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2">
                                <div>Corte: Día {card.cutoffDay || '?'}</div>
                                <div>Gracia: {card.gracePeriod || '?'} días naturales</div>
                            </div>
                        )}

                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 p-1">
                            <button
                                onClick={() => handleEditClick(card)}
                                className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                                title="Editar"
                            >
                                ✏️
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm(`¿Seguro que quieres borrar la cuenta "${card.name}"? Los gastos asociados perderán su referencia.`)) {
                                        onDeleteCard(card.id);
                                    }
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                title="Borrar"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
