import React, { useEffect, useState } from 'react';
import { GoogleUser } from '../types';
import { Sun, Trophy, Zap, AlertCircle, HelpCircle, ShieldAlert } from 'lucide-react';

declare global {
    interface Window {
        google?: any;
    }
}

interface GoogleLoginScreenProps {
    onLoginSuccess: (user: GoogleUser) => void;
}

export default function GoogleLoginScreen({ onLoginSuccess }: GoogleLoginScreenProps) {
    const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
    const [clientId, setClientId] = useState<string>(() => {
        return (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
    });
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showSetupHelp, setShowSetupHelp] = useState(false);

    // Decode Google JWT native implementation
    const decodeGoogleJwt = (token: string): any => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                window.atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error("Error al decodificar JWT de Google", e);
            return null;
        }
    };

    // Google Sign-In Callback
    const handleCredentialResponse = (response: any) => {
        if (response && response.credential) {
            const payload = decodeGoogleJwt(response.credential);
            if (payload) {
                const user: GoogleUser = {
                    id: payload.sub,
                    email: payload.email,
                    name: payload.name,
                    picture: payload.picture,
                };
                onLoginSuccess(user);
            } else {
                setErrorMessage("No se pudo extraer la información del perfil del token de Google.");
            }
        } else {
            setErrorMessage("No se recibió credencial de Google.");
        }
    };

    // Check if Google script is loaded
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const checkGoogleLoaded = () => {
            if (window.google?.accounts?.id) {
                setGoogleScriptLoaded(true);
                clearInterval(interval);
            }
        };

        // Check immediately
        checkGoogleLoaded();

        // Check periodically
        interval = setInterval(checkGoogleLoaded, 500);

        return () => clearInterval(interval);
    }, []);

    // Initialize Google Login Button
    useEffect(() => {
        if (googleScriptLoaded && clientId && clientId.trim() !== '') {
            try {
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: handleCredentialResponse,
                    auto_select: false,
                    cancel_on_tap_outside: true
                });

                const btnContainer = document.getElementById("google-signin-btn-container");
                if (btnContainer) {
                    window.google.accounts.id.renderButton(btnContainer, {
                        theme: "filled_blue",
                        size: "large",
                        text: "signin_with",
                        shape: "pill",
                        width: 280
                    });
                }
            } catch (err) {
                console.error("Error al inicializar Google Sign-In:", err);
            }
        }
    }, [googleScriptLoaded, clientId]);

    // Handler for mock developer login
    const handleMockLogin = () => {
        const mockUser: GoogleUser = {
            id: "google-mock-12345",
            email: "entrenador.demo@gmail.com",
            name: "Entrenador Beach Handball (Demo)",
            picture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
        };
        onLoginSuccess(mockUser);
    };

    // Handler for guest login
    const handleGuestLogin = () => {
        const guestUser: GoogleUser = {
            id: "guest-local",
            email: "invitado@local",
            name: "Invitado",
            isGuest: true
        };
        onLoginSuccess(guestUser);
    };

    const isClientIdMissing = !clientId || clientId.trim() === '' || clientId.includes('tu_cliente_id');

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-sky-100 flex flex-col justify-between p-6">

            {/* Top Banner decoration */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-amber-400 to-sky-400"></div>

            {/* Main Container */}
            <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full py-12">

                {/* Logo and Icon */}
                <div className="text-center mb-8 relative">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
                        <Sun className="w-14 h-14 text-white animate-pulse" />
                    </div>
                    <div className="absolute -top-1 -right-1 bg-sky-500 text-white p-2 rounded-full shadow-md">
                        <Trophy className="w-5 h-5" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-800 mt-6 drop-shadow-sm">
                        BeachHandball <span className="text-orange-500 font-extrabold">Stats</span>
                    </h1>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
                        Estadísticas Oficiales IHF 2026 • Edición Arena
                    </p>
                </div>

                {/* Info Card */}
                <div className="bg-white/85 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/50 w-full mb-6">
                    <h2 className="text-lg font-bold text-slate-800 text-center mb-4">
                        Acceso a la Aplicación
                    </h2>
                    <p className="text-sm text-slate-600 text-center mb-6 leading-relaxed">
                        Registra estadísticas de balonmano playa a pie de pista en tiempo real: sets, goles de 2p, robos, exclusiones y shootouts de manera profesional.
                    </p>

                    {errorMessage && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2 text-xs">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Login Buttons Area */}
                    <div className="flex flex-col items-center gap-4 justify-center">

                        {/* Google Button Container (Real Auth if Client ID exists) */}
                        {!isClientIdMissing && googleScriptLoaded && (
                            <div className="w-full flex justify-center py-2">
                                <div id="google-signin-btn-container" className="min-h-[50px] flex items-center justify-center"></div>
                            </div>
                        )}

                        {/* Simulated Google Button (When client ID is missing or for rapid testing) */}
                        {isClientIdMissing && (
                            <button
                                onClick={handleMockLogin}
                                className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer text-sm"
                            >
                                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                </svg>
                                Iniciar sesión con Google (Demo)
                            </button>
                        )}

                        {/* Guest Option */}
                        <button
                            onClick={handleGuestLogin}
                            className="w-full py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                        >
                            <Zap className="w-4 h-4 text-amber-500" />
                            Entrar como Invitado (Modo Local)
                        </button>

                    </div>

                    {/* Helpful configuration alert for developers */}
                    {isClientIdMissing && (
                        <div className="mt-6 pt-5 border-t border-slate-100">
                            <button
                                onClick={() => setShowSetupHelp(!showSetupHelp)}
                                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                <HelpCircle className="w-4 h-4" />
                                ¿Cómo configurar el inicio de sesión real de Google?
                            </button>

                            {showSetupHelp && (
                                <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-slate-700 text-xs leading-relaxed">
                                    <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-1">
                                        <ShieldAlert className="w-4 h-4 shrink-0" />
                                        Pasos de Configuración:
                                    </div>
                                    <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600">
                                        <li>Ve a la <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-orange-600 underline font-bold">Consola de Google Cloud</a>.</li>
                                        <li>Crea un proyecto y configura la <strong>Pantalla de consentimiento de OAuth</strong>.</li>
                                        <li>Crea una <strong>Credencial de ID de cliente de OAuth 2.0</strong> (Tipo: Aplicación Web).</li>
                                        <li>Añade <code className="bg-slate-150 px-1 rounded">http://localhost:3000</code> como origen JavaScript autorizado.</li>
                                        <li>Copia el Client ID en el archivo <code className="bg-slate-150 px-1 rounded">.env</code> de tu proyecto como <code className="bg-slate-150 px-1 rounded font-semibold">VITE_GOOGLE_CLIENT_ID</code>.</li>
                                    </ol>
                                    <p className="mt-2 text-[10px] text-slate-500 font-medium">
                                        * Mientras tanto, puedes usar la opción <strong>Demo de Google</strong> para experimentar todo el flujo de usuario sin configuración previa.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Active Client ID Info (For verified users) */}
                    {!isClientIdMissing && (
                        <div className="mt-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-[10px] font-semibold text-emerald-700 border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                Autenticación Oficial Activada
                            </span>
                        </div>
                    )}

                </div>

                {/* Technical Notice */}
                <p className="text-[11px] text-center text-slate-500 max-w-xs leading-normal">
                    Para garantizar la máxima fiabilidad a pie de pista en partidos con mala cobertura, las estadísticas de juego se guardan localmente de forma continua.
                </p>

            </div>

            {/* Footer */}
            <footer className="text-center py-4 text-xs font-medium text-slate-400">
                BeachHandball Stats © 2026 • Diseñado para la arena
            </footer>

        </div>
    );
}
