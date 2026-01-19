'use client';

import React, { useState, useEffect } from 'react';
import { auth, googleProvider, saveUserData, loadUserData } from '../utils/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

interface CloudSyncProps {
    dataToSave: {
        expenses: any[];
        balances: any;
        cards: any;
        theme: string;
    };
    onLoadData: (data: any) => void;
}

export function CloudSync({ dataToSave, onLoadData }: CloudSyncProps) {
    const [user, setUser] = useState<User | null>(null);
    const [status, setStatus] = useState<'idle' | 'saving' | 'loading' | 'error'>('idle');
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Login failed", error);
            alert("Error login: " + (error as any).message);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
    };

    const handleSave = async () => {
        if (!user) return;
        setStatus('saving');
        const success = await saveUserData(user.uid, {
            ...dataToSave,
            lastUpdated: new Date().toISOString()
        });
        if (success) {
            setStatus('idle');
            setLastSync(new Date().toLocaleTimeString());
            alert("☁️ Datos guardados en la nube exitosamente.");
        } else {
            setStatus('error');
            alert("Error al guardar.");
        }
    };

    const handleLoad = async () => {
        if (!user) return;
        setStatus('loading');
        const data = await loadUserData(user.uid);
        if (data) {
            onLoadData(data);
            setStatus('idle');
            setLastSync(new Date().toLocaleTimeString());
            alert("📥 Datos descargados de la nube.");
        } else {
            setStatus('idle');
            alert("No se encontraron datos en la nube para este usuario.");
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition z-50 flex items-center gap-2"
                title="Sincronizar Cloud"
            >
                ☁️
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl border border-indigo-100 dark:border-slate-700 z-50 w-80 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    ☁️ Cloud Sync <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">Beta</span>
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {!user ? (
                <div className="text-center space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Inicia sesión con Google para guardar tus finanzas en la nube y compartirlas.
                    </p>
                    <button
                        onClick={handleLogin}
                        className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="G" />
                        Sign in with Google
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        {user.photoURL && <img src={user.photoURL} className="w-8 h-8 rounded-full" alt="User" />}
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate dark:text-white">{user.displayName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleSave}
                            disabled={status !== 'idle'}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition disabled:opacity-50"
                        >
                            {status === 'saving' ? 'Guardando...' : '⬆️ Subir'}
                        </button>
                        <button
                            onClick={handleLoad}
                            disabled={status !== 'idle'}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition disabled:opacity-50"
                        >
                            {status === 'loading' ? 'Cargando...' : '⬇️ Bajar'}
                        </button>
                    </div>

                    {lastSync && (
                        <p className="text-xs text-center text-gray-400">
                            Última sinc: {lastSync}
                        </p>
                    )}

                    <button
                        onClick={handleLogout}
                        className="w-full text-xs text-gray-400 hover:text-red-500 underline text-center mt-2"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            )}
        </div>
    );
}
