import React, { useState, useEffect } from 'react';
import { Card } from '../types';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    cardId: string | null;
    cards: Record<string, Card>;
    onConfirm: (amount: number, date: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, cardId, cards, onConfirm }) => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');

    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setDate(new Date().toISOString().slice(0, 10));
        }
    }, [isOpen]);

    if (!isOpen || !cardId) return null;

    const card = cards[cardId];
    if (!card) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount) return;
        onConfirm(parseFloat(amount), date);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 animate-in zoom-in-95 duration-200">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
                        💸
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Registrar Pago</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Abonar a: <b className="text-slate-800 dark:text-slate-200">{card.name}</b>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Monto a Pagar</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                                className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-2xl font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-green-500 outline-none"
                                required
                                autoFocus
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Fecha</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-green-500 outline-none"
                            required
                        />
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 text-white bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 rounded-xl font-bold shadow-lg transition-colors"
                        >
                            Confirmar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
