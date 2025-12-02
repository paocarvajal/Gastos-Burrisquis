'use client';

import React, { useState, useEffect } from 'react';
import { Card, Expense } from '../types';
import { SummaryCard } from './SummaryCard';
import { ExpenseForm } from './ExpenseForm';
import { TransactionsList } from './TransactionsList';
import { PaymentModal } from './PaymentModal';
import { ImportPreviewModal } from './ImportPreviewModal';
import { ToolsSection } from './ToolsSection';
import { AccountsManager } from './AccountsManager';


const STORAGE_KEY = 'finance_tracker_data_v1';
const BALANCE_KEY = 'finance_tracker_balances_v1';
const CARDS_KEY = 'finance_tracker_cards_v1';
const THEME_KEY = 'finance_tracker_theme_v1';

const DEFAULT_CARDS: Record<string, Card> = {
    banamex_debito: { id: 'banamex_debito', name: "Banamex Débito", type: "debit", color: "bg-blue-600" },
    banamex_joy: { id: 'banamex_joy', name: "Banamex Joy", type: "credit", color: "bg-pink-500", cutoffDay: 15, paymentDay: 5 },
    banorte_debito: { id: 'banorte_debito', name: "Banorte Débito", type: "debit", color: "bg-red-600" },
    banorte_credito: { id: 'banorte_credito', name: "Banorte Crédito", type: "credit", color: "bg-red-700", cutoffDay: 10, paymentDay: 30 },
    bienestar: { id: 'bienestar', name: "Bienestar", type: "debit", color: "bg-emerald-500" },
    invex_aeropuerto: { id: 'invex_aeropuerto', name: "Invex Aeropuerto", type: "credit", color: "bg-slate-800", cutoffDay: 20, paymentDay: 10 }
};

export default function Dashboard() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [initialBalances, setInitialBalances] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        Object.keys(DEFAULT_CARDS).forEach(k => initial[k] = 0);
        return initial;
    });
    const [cards, setCards] = useState<Record<string, Card>>(DEFAULT_CARDS);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    // Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentCardId, setPaymentCardId] = useState<string | null>(null);

    // Edit State
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    // Import State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importPreviewData, setImportPreviewData] = useState<any[]>([]);

    useEffect(() => {
        try {
            // Load data
            const savedExpenses = localStorage.getItem(STORAGE_KEY);
            const savedBalances = localStorage.getItem(BALANCE_KEY);
            const savedCards = localStorage.getItem(CARDS_KEY);
            const savedTheme = localStorage.getItem(THEME_KEY);

            if (savedExpenses) {
                try {
                    const parsed = JSON.parse(savedExpenses);
                    if (Array.isArray(parsed)) {
                        const clean = parsed.filter(e => e && e.id && e.date && typeof e.amount === 'number');
                        setExpenses(clean);
                    }
                } catch (e) {
                    console.error("Error parsing expenses", e);
                    setExpenses([]);
                }
            }

            if (savedBalances) {
                try {
                    const parsed = JSON.parse(savedBalances);
                    if (parsed && typeof parsed === 'object') {
                        setInitialBalances(parsed);
                    }
                } catch (e) {
                    console.error("Error parsing balances", e);
                    const initial: Record<string, number> = {};
                    Object.keys(DEFAULT_CARDS).forEach(k => initial[k] = 0);
                    setInitialBalances(initial);
                }
            } else {
                const initial: Record<string, number> = {};
                Object.keys(DEFAULT_CARDS).forEach(k => initial[k] = 0);
                setInitialBalances(initial);
            }

            if (savedCards) {
                try {
                    const parsed = JSON.parse(savedCards);
                    const clean: Record<string, Card> = {};
                    Object.keys(parsed).forEach(key => {
                        const c = parsed[key];
                        if (c && typeof c === 'object' && c.name) {
                            clean[key] = c;
                        }
                    });
                    setCards(clean);
                } catch (e) {
                    console.error("Failed to parse cards", e);
                    setCards(DEFAULT_CARDS);
                }
            } else {
                setCards(DEFAULT_CARDS);
            }

            if (savedTheme === 'dark') {
                setTheme('dark');
                document.documentElement.classList.add('dark');
            }
        } catch (err) {
            console.error("Critical error loading data", err);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
        localStorage.setItem(BALANCE_KEY, JSON.stringify(initialBalances));
        localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
        localStorage.setItem(THEME_KEY, theme);

        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [expenses, initialBalances, cards, theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const handleAddCard = (newCard: Card) => {
        setCards(prev => ({ ...prev, [newCard.id]: newCard }));
        // Init balance for new card
        setInitialBalances(prev => ({ ...prev, [newCard.id]: 0 }));
    };

    const handleDeleteCard = (cardId: string) => {
        const newCards = { ...cards };
        delete newCards[cardId];
        setCards(newCards);
    };



    const handlePay = (cardId: string) => {
        setPaymentCardId(cardId);
        setIsPaymentModalOpen(true);
    };

    const handleConfirmPayment = (amount: number, date: string) => {
        if (!paymentCardId) return;

        const payment: Expense = {
            id: Date.now(),
            description: "PAGO A TARJETA",
            amount: Math.abs(amount), // Payments are positive
            currency: "MXN",
            paymentMethod: "Tarjeta",
            cardId: paymentCardId,
            installments: 0,
            date: date
        };

        setExpenses(prev => [...prev, payment]);
    };

    const handleAdjust = (cardId: string) => {
        const card = cards[cardId];
        const current = initialBalances[cardId] || 0;
        const promptMsg = card.type === 'credit'
            ? `Define la DEUDA INICIAL de ${card.name} (antes de usar esta app): `
            : `Define el SALDO INICIAL de ${card.name}: `;

        const val = prompt(promptMsg, current.toString());
        if (val !== null) {
            const num = parseFloat(val);
            if (!isNaN(num)) {
                setInitialBalances(prev => ({ ...prev, [cardId]: Math.abs(num) }));
            }
        }
    };

    const handleSaveExpense = (data: Omit<Expense, 'id'>) => {
        const newExpense: Expense = {
            ...data,
            id: Date.now()
        };
        setExpenses(prev => [...prev, newExpense]);
    };

    const handleUpdateExpense = (updatedExpense: Expense) => {
        setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
        setEditingExpense(null);
    };

    const handleDeleteExpense = (id: number) => {
        if (confirm("¿Borrar este movimiento?")) {
            setExpenses(prev => prev.filter(e => e.id !== id));
        }
    };

    const handleDeleteMany = (ids: number[]) => {
        setExpenses(prev => prev.filter(e => !ids.includes(e.id)));
    };

    const handleRestoreBackup = (newExpenses: Expense[], newBalances: Record<string, number>) => {
        setExpenses(newExpenses);
        setInitialBalances(newBalances);
    };

    const handlePreviewImport = (rawData: any[]) => {
        setImportPreviewData(rawData);
        setIsImportModalOpen(true);
    };

    const handleConfirmImport = (importedExpenses: Expense[]) => {
        setExpenses(prev => [...prev, ...importedExpenses]);
    };



    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-8 min-h-screen transition-colors duration-300">
            <header className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="text-4xl animate-bounce-slow">
                        {theme === 'dark' ? '🌵' : '🌸'}
                    </div>
                    <h1 className="text-2xl font-black text-pink-600 dark:text-teal-400 tracking-tight">
                        Mis Finanzas
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Cambiar Tema"
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    <button
                        onClick={() => {
                            if (confirm("¿Estás seguro de borrar todos los datos y empezar de cero?")) {
                                setExpenses([]);
                                const initial: Record<string, number> = {};
                                Object.keys(cards).forEach(k => initial[k] = 0);
                                setInitialBalances(initial);
                            }
                        }}
                        className="text-xs text-slate-300 hover:text-slate-500 dark:hover:text-slate-400 transition-colors"
                    >
                        Restablecer App
                    </button>
                </div>
            </header>

            <AccountsManager
                cards={cards}
                onAddCard={handleAddCard}
                onDeleteCard={handleDeleteCard}
            />

            <section>
                <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                    💳 Estado de Cuentas
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    {Object.keys(cards).map(key => {
                        const card = cards[key];
                        if (!card) return null;
                        // Filter movements for this card
                        const cardMovs = expenses.filter(e =>
                            e.paymentMethod === 'Tarjeta' &&
                            (e.cardId === key || (e as any).cardInfo?.name === card.name)
                        );

                        return (
                            <SummaryCard
                                key={key}
                                card={card}
                                initialBalance={initialBalances[key] || 0}
                                movements={cardMovs}
                                onPay={handlePay}
                                onAdjust={handleAdjust}
                            />
                        );
                    })}
                </div>
            </section>

            <ExpenseForm
                cards={cards}
                onSave={handleSaveExpense}
                onUpdate={handleUpdateExpense}
                editingExpense={editingExpense}
                onCancelEdit={() => setEditingExpense(null)}
            />

            <TransactionsList
                expenses={expenses}
                cards={cards}
                onDelete={handleDeleteExpense}
                onDeleteMany={handleDeleteMany}
                onEdit={setEditingExpense}
            />

            <ToolsSection
                expenses={expenses}
                initialBalances={initialBalances}
                cards={cards}
                onRestore={handleRestoreBackup}
                onPreviewImport={handlePreviewImport}
            />
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                cardId={paymentCardId}
                cards={cards}
                onConfirm={handleConfirmPayment}
            />

            <ImportPreviewModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onConfirm={handleConfirmImport}
                rawData={importPreviewData}
                cards={cards}
            />




        </div>
    );
}
