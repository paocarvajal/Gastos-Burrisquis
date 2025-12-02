import React, { useState, useEffect } from 'react';
import { Card } from '../types';

interface EditCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    card: Card | null;
    onSave: (updatedCard: Card) => void;
}

const PRESET_COLORS = [
    'bg-blue-600', 'bg-red-600', 'bg-emerald-500', 'bg-pink-500',
    'bg-purple-600', 'bg-orange-500', 'bg-slate-800', 'bg-teal-600',
    'bg-indigo-600', 'bg-rose-600', 'bg-cyan-600', 'bg-amber-500'
];

export const EditCardModal: React.FC<EditCardModalProps> = ({ isOpen, onClose, card, onSave }) => {
    const [name, setName] = useState('');
    const [cutoffDay, setCutoffDay] = useState('');
    const [paymentDay, setPaymentDay] = useState('');
    const [color, setColor] = useState('');

    useEffect(() => {
        if (isOpen && card) {
            setName(card.name || '');
            setCutoffDay(card.cutoffDay?.toString() || '');
            setPaymentDay(card.paymentDay?.toString() || '');
            setColor(card.color || 'bg-slate-800');
        }
    }, [isOpen, card]);

    if (!isOpen || !card) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updatedCard: Card = {
            ...card,
            name,
            color,
            cutoffDay: card.type === 'credit' && cutoffDay ? parseInt(cutoffDay) : undefined,
            paymentDay: card.type === 'credit' && paymentDay ? parseInt(paymentDay) : undefined,
        };
        onSave(updatedCard);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 animate-in zoom-in-95 duration-200">
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Editar Tarjeta</h3>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nombre</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>
                    {card.type === 'credit' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Día de Corte</label>
                                <input
                                    type="number"
                                    value={cutoffDay}
                                    onChange={(e) => setCutoffDay(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Día de Pago</label>
                                <input
                                    type="number"
                                    value={paymentDay}
                                    onChange={(e) => setPaymentDay(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Color</label>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-full ${c.replace('bg-', 'bg-')} ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900' : 'opacity-70 hover:opacity-100'}`}
                                />
                            ))}
                        </div>
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
                            className="flex-1 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-bold shadow-lg transition-colors"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
