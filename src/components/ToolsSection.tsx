import React, { useRef } from 'react';
import { Expense, Card } from '../types';
import * as XLSX from 'xlsx';

interface ToolsSectionProps {
    expenses: Expense[];
    initialBalances: Record<string, number>;
    cards: Record<string, Card>;
    onRestore: (expenses: Expense[], balances: Record<string, number>) => void;
    onPreviewImport: (rawData: any[]) => void;
}

export const ToolsSection: React.FC<ToolsSectionProps> = ({ expenses, initialBalances, cards, onRestore, onPreviewImport }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const excelInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const data = {
            expenses,
            initialBalances,
            cards,
            timestamp: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finanzas_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const result = ev.target?.result as string;
                const data = JSON.parse(result);

                if (data.expenses && data.initialBalances) {
                    if (confirm("⚠️ Esto reemplazará todos los datos actuales. ¿Estás seguro?")) {
                        onRestore(data.expenses, data.initialBalances);
                        alert("¡Datos restaurados con éxito!");
                    }
                } else {
                    alert("El archivo no tiene el formato correcto.");
                }
            } catch (err) {
                console.error(err);
                alert("Error al leer el archivo de respaldo.");
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = new Uint8Array(ev.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                // Basic parsing logic
                const rawRows: any[] = [];

                // Skip header row
                for (let i = 1; i < jsonData.length; i++) {
                    const row: any = jsonData[i];
                    if (!row || row.length === 0) continue;

                    const dateRaw = row[0];
                    const desc = row[1];
                    const amount = parseFloat(row[2]);
                    const typeRaw = row[3]; // 'Cargo' or 'Abono'
                    const cardName = row[4];
                    const msi = parseInt(row[5] || '0');

                    if (!desc && isNaN(amount)) continue;

                    // Date parsing
                    let dateStr = new Date().toISOString().slice(0, 10);
                    if (typeof dateRaw === 'number') {
                        const d = new Date((dateRaw - (25567 + 2)) * 86400 * 1000);
                        dateStr = d.toISOString().slice(0, 10);
                    } else if (typeof dateRaw === 'string') {
                        if (dateRaw.includes('/')) {
                            const parts = dateRaw.split('/');
                            if (parts.length === 3) {
                                dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                            }
                        } else {
                            dateStr = dateRaw;
                        }
                    }

                    // Match card
                    let cardId = undefined;
                    let method = 'Efectivo'; // Default

                    if (cardName) {
                        const foundEntry = Object.entries(cards).find(([_, c]) => c && c.name && c.name.toLowerCase() === cardName.toLowerCase());
                        if (foundEntry) {
                            cardId = foundEntry[0];
                            method = 'Tarjeta';
                        }
                    }

                    // Determine type
                    let type = undefined;
                    if (typeof typeRaw === 'string') {
                        const lowerType = typeRaw.toLowerCase();
                        if (lowerType.includes('abono') || lowerType.includes('ingreso')) {
                            type = 'income';
                        } else if (lowerType.includes('cargo') || lowerType.includes('gasto')) {
                            type = 'expense';
                        }
                    }

                    rawRows.push({
                        date: dateStr,
                        description: desc,
                        amount: amount,
                        paymentMethod: method,
                        cardId: cardId,
                        installments: msi,
                        type: type // Pass this to preview
                    });
                }

                if (rawRows.length > 0) {
                    onPreviewImport(rawRows);
                } else {
                    alert("No se encontraron movimientos válidos en el Excel.");
                }

            } catch (err) {
                console.error(err);
                alert("Error al procesar el Excel.");
            }
        };
        reader.readAsArrayBuffer(file);
        if (excelInputRef.current) excelInputRef.current.value = '';
    };

    const handleGenerateReport = () => {
        // Simple CSV export
        const headers = ["Fecha", "Descripción", "Monto", "Método", "Tarjeta", "MSI"];
        const rows = expenses.map(e => [
            e.date,
            e.description,
            e.amount,
            e.paymentMethod,
            e.cardId ? cards[e.cardId]?.name : '',
            e.installments || 0
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `reporte_finanzas_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <section className="bg-white dark:bg-slate-800 rounded-[20px] p-6 border-l-4 border-blue-500 dark:border-blue-400 shadow-sm">
            <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4">Herramientas</h2>

            <div className="grid sm:grid-cols-2 gap-4">
                {/* Backup & Restore */}
                <div className="space-y-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">💾 Respaldo y Migración</p>
                    <div className="flex gap-3">
                        <button
                            onClick={handleExport}
                            className="flex-1 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl font-bold text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
                        >
                            <span>⬇️</span> Respaldo JSON
                        </button>
                        <label className="flex-1 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl font-bold text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm">
                            <span>⬆️</span> Restaurar JSON
                            <input
                                type="file"
                                accept=".json"
                                className="hidden"
                                onChange={handleRestore}
                                ref={fileInputRef}
                            />
                        </label>
                    </div>
                </div>

                {/* Excel & Reports */}
                <div className="space-y-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">📊 Reportes y Excel</p>
                    <div className="flex gap-3">
                        <label className="flex-1 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl font-bold text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm">
                            <span>📗</span> Subir Excel
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                className="hidden"
                                onChange={handleExcelUpload}
                                ref={excelInputRef}
                            />
                        </label>
                        <button
                            onClick={handleGenerateReport}
                            className="flex-1 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
                        >
                            <span>📄</span> Reporte CSV
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};
