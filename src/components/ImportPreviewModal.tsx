import React, { useState, useEffect } from 'react';
import { Card, Expense } from '../types';
import { formatMoney } from '../utils/format';

interface ImportPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (expenses: Expense[]) => void;
    rawData: any[];
    cards: Record<string, Card>;
}

export const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({ isOpen, onClose, onConfirm, rawData, cards }) => {
    const [rows, setRows] = useState<any[]>([]);
    const [globalCardId, setGlobalCardId] = useState('');

    useEffect(() => {
        if (isOpen && rawData) {
            // Map raw data to editable format
            const initialRows = rawData.map((row, index) => {
                const rawAmt = parseFloat(row.amount || '0');
                const isNegative = rawAmt < 0;

                // If type is explicitly provided by parser (from 'Cargo'/'Abono' column), use it.
                // Otherwise fallback to sign check.
                let type = 'expense';
                if (row.type === 'income' || row.type === 'expense') {
                    type = row.type;
                } else {
                    type = isNegative ? 'expense' : 'income'; // Default assumption if no type column
                }

                return {
                    _id: index, // temp id for list
                    date: row.date || new Date().toISOString().slice(0, 10),
                    description: row.description || '',
                    amount: Math.abs(rawAmt), // Always show absolute value in input
                    type: type,
                    paymentMethod: row.paymentMethod || 'Tarjeta',
                    cardId: row.cardId || '',
                    installments: row.installments || 0
                };
            });
            setRows(initialRows);
        }
    }, [isOpen, rawData]);

    const handleGlobalCardChange = (cardId: string) => {
        setGlobalCardId(cardId);
    };

    const applyGlobalCard = () => {
        if (!globalCardId) return;
        setRows(prev => prev.map(r => ({ ...r, cardId: globalCardId, paymentMethod: 'Tarjeta' })));
    };

    const updateRow = (index: number, field: string, value: any) => {
        setRows(prev => {
            const newRows = [...prev];
            newRows[index] = { ...newRows[index], [field]: value };
            return newRows;
        });
    };

    const removeRow = (index: number) => {
        setRows(prev => prev.filter((_, i) => i !== index));
    };

    const handleConfirm = () => {
        const finalExpenses: Expense[] = rows.map((r, i) => {
            const finalAmt = r.type === 'expense' ? -Math.abs(r.amount) : Math.abs(r.amount);
            return {
                id: Date.now() + i,
                description: r.description,
                amount: finalAmt,
                currency: 'MXN',
                paymentMethod: r.paymentMethod,
                cardId: r.paymentMethod === 'Tarjeta' ? r.cardId : undefined,
                installments: r.installments,
                date: r.date
            };
        });
        onConfirm(finalExpenses);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col transform transition-all scale-100 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800 rounded-t-3xl">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Vista Previa de Importación</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Revisa y ajusta los movimientos antes de guardarlos.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                        <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase">Asignar Tarjeta a Todo:</span>
                        <select
                            value={globalCardId}
                            onChange={(e) => handleGlobalCardChange(e.target.value)}
                            className="text-sm border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-700 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-blue-900 dark:text-blue-200 font-bold"
                        >
                            <option value="">Seleccionar...</option>
                            {Object.values(cards).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={applyGlobalCard}
                            className="text-xs bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm"
                        >
                            Aplicar
                        </button>
                    </div>
                    <div className="text-xs text-slate-400">
                        {rows.length} movimientos detectados
                    </div>
                </div>

                {/* Table Area */}
                <div className="flex-1 overflow-auto p-4 bg-slate-50 dark:bg-slate-900/50">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs font-bold text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700">
                                <th className="p-2">Fecha</th>
                                <th className="p-2">Descripción</th>
                                <th className="p-2">Tipo</th>
                                <th className="p-2">Monto</th>
                                <th className="p-2">Tarjeta / Cuenta</th>
                                <th className="p-2">MSI</th>
                                <th className="p-2"></th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {rows.map((row, index) => (
                                <tr key={index} className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 group">
                                    <td className="p-2">
                                        <input
                                            type="date"
                                            value={row.date}
                                            onChange={(e) => updateRow(index, 'date', e.target.value)}
                                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-600 dark:text-slate-300"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={row.description}
                                            onChange={(e) => updateRow(index, 'description', e.target.value)}
                                            className="w-full bg-transparent border-none focus:ring-0 p-0 font-medium text-slate-700 dark:text-slate-200"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <button
                                            onClick={() => updateRow(index, 'type', row.type === 'expense' ? 'income' : 'expense')}
                                            className={`px-2 py-1 rounded text-xs font-bold w-20 text-center transition-colors ${row.type === 'expense' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}
                                        >
                                            {row.type === 'expense' ? 'Cargo' : 'Abono'}
                                        </button>
                                    </td>
                                    <td className="p-2">
                                        <div className="flex items-center">
                                            <span className="text-slate-400 mr-1">$</span>
                                            <input
                                                type="number"
                                                value={row.amount}
                                                onChange={(e) => updateRow(index, 'amount', parseFloat(e.target.value))}
                                                className="w-24 bg-transparent border-none focus:ring-0 p-0 font-bold text-slate-700 dark:text-slate-200"
                                            />
                                        </div>
                                    </td>
                                    <td className="p-2">
                                        <select
                                            value={row.cardId}
                                            onChange={(e) => {
                                                updateRow(index, 'cardId', e.target.value);
                                                updateRow(index, 'paymentMethod', e.target.value ? 'Tarjeta' : 'Efectivo');
                                            }}
                                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-600 dark:text-slate-300"
                                        >
                                            <option value="">Efectivo / Otro</option>
                                            {Object.values(cards).map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2">
                                        {cards[row.cardId]?.type === 'credit' && (
                                            <select
                                                value={row.installments}
                                                onChange={(e) => updateRow(index, 'installments', parseInt(e.target.value))}
                                                className="bg-transparent border-none focus:ring-0 p-0 text-slate-500 dark:text-slate-400 text-xs"
                                            >
                                                <option value="0">-</option>
                                                <option value="3">3m</option>
                                                <option value="6">6m</option>
                                                <option value="9">9m</option>
                                                <option value="12">12m</option>
                                                <option value="18">18m</option>
                                            </select>
                                        )}
                                    </td>
                                    <td className="p-2 text-right">
                                        <button
                                            onClick={() => removeRow(index)}
                                            className="text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-b-3xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-8 py-3 rounded-xl font-bold text-white bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-700 shadow-lg transition-transform transform hover:scale-105"
                    >
                        Confirmar Importación
                    </button>
                </div>

            </div>
        </div>
    );
};
