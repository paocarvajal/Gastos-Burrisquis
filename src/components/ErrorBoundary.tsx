'use client';

import React from 'react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReset = () => {
        if (confirm("Esto borrará todos los datos locales para recuperar la aplicación. ¿Continuar?")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-center font-sans">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
                        <div className="text-5xl mb-4">🤕</div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">¡Algo salió mal!</h1>
                        <p className="text-slate-500 mb-6 text-sm">
                            La aplicación encontró un error inesperado. Es posible que los datos guardados estén corruptos o sean incompatibles.
                        </p>

                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg mb-6 text-left">
                            <p className="text-xs font-bold text-red-800 mb-1">Detalle del error:</p>
                            <code className="text-[10px] text-red-600 font-mono block overflow-auto max-h-20">
                                {this.state.error?.toString()}
                            </code>
                        </div>

                        <button
                            onClick={this.handleReset}
                            className="w-full bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                        >
                            Restablecer App (Borrar Datos)
                        </button>
                        <p className="mt-4 text-[10px] text-slate-400">
                            Esto eliminará tus gastos guardados en este dispositivo para intentar solucionar el problema.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
