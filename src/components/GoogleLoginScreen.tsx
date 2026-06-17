import React, { useEffect, useState } from 'react';
import { GoogleUser } from '../types';
import { Sun, Trophy, AlertCircle, HelpCircle, ShieldAlert, Settings, Save, Trash2, Key, Mail } from 'lucide-react';

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
        // Intentar leer de localStorage primero, luego de las variables de entorno
        const savedId = localStorage.getItem('beach_handball_google_client_id_2026');
        if (savedId && savedId.trim() !== '') return savedId;
        return (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
    });
    const [tempClientId, setTempClientId] = useState('');
    const [showConfigForm, setShowConfigForm] = useState(false);
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

    // Google Sign-In Callback (Autenticación Real de Google)
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

    // Initialize Google Login Button (Autenticación Real de Google)
    useEffect(() => {
        const hasValidClientId = clientId && clientId.trim() !== '' && !clientId.includes('tu_cliente_id');
        if (googleScriptLoaded && hasValidClientId) {
            try {
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: handleCredentialResponse,
                    auto_select: false,
                    cancel_on_tap_outside: true
                });

                const btnContainer = document.getElementById("google-signin-btn-container");
                if (btnContainer) {
                    btnContainer.innerHTML = ''; // Evitar duplicación
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
                setErrorMessage("No se pudo inicializar el servicio de inicio de sesión de Google. Comprueba tu Client ID.");
            }
        }
    }, [googleScriptLoaded, clientId]);

    // Guardar Client ID dinámico en localStorage
    const handleSaveClientId = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = tempClientId.trim();
        if (trimmed !== '') {
            localStorage.setItem('beach_handball_google_client_id_2026', trimmed);
            setClientId(trimmed);
            setErrorMessage(null);
            setShowConfigForm(false);
            setTimeout(() => {
                window.location.reload();
            }, 100);
        } else {
            setErrorMessage("Por favor, introduce un ID de cliente válido.");
        }
    };

    // Eliminar Client ID de localStorage para restaurar el de entorno
    const handleClearClientId = () => {
        localStorage.removeItem('beach_handball_google_client_id_2026');
        const defaultEnvId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
        setClientId(defaultEnvId);
        setTempClientId('');
        setErrorMessage(null);
        setTimeout(() => {
            window.location.reload();
        }, 100);
    };

    const isClientIdMissing = !clientId || clientId.trim() === '' || clientId.includes('tu_cliente_id');

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-sky-100 flex flex-col justify-between p-6">

            {/* Top Decoration Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-amber-400 to-sky-400"></div>

            {/* Main Center Login Form */}
            <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full py-10">

                {/* Logo Section */}
                <div className="text-center mb-8 relative">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-md transform hover:scale-105 transition-all duration-300">
                        <Sun className="w-11 h-11 text-white animate-pulse" />
                    </div>
                    <div className="absolute top-0 right-1/2 translate-x-12 bg-sky-500 text-white p-1.5 rounded-full shadow-md">
                        <Trophy className="w-4 h-4" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-800 mt-5 drop-shadow-xs">
                        BeachHandball <span className="text-orange-500 font-extrabold">Stats</span>
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                        Estadísticas Oficiales IHF 2026 • Edición Arena
                    </p>
                </div>

                {/* Login Container Card */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/50 w-full mb-6">
                    <div className="flex items-center gap-2 justify-center text-orange-500 mb-3">
                        <Mail className="w-5 h-5" />
                        <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
                            Iniciar Sesión Obligatorio
                        </h2>
                    </div>
                    <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
                        Para acceder y utilizar esta herramienta de estadísticas tácticas, es requisito obligatorio iniciar sesión con tu cuenta de correo de Google.
                    </p>

                    {errorMessage && (
                        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-start gap-2 text-xs">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 animate-bounce" />
                            <span className="font-semibold">{errorMessage}</span>
                        </div>
                    )}

                    {/* Google OAuth Section */}
                    <div className="flex flex-col items-center gap-4 justify-center py-4 bg-slate-50/50 rounded-2xl border border-slate-100 p-4">

                        {/* Google Button Container (Only displays if Google API is configured) */}
                        {!isClientIdMissing && googleScriptLoaded ? (
                            <div className="w-full flex flex-col items-center gap-3">
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                    Identificarse con Google
                                </span>
                                <div id="google-signin-btn-container" className="min-h-[50px] flex items-center justify-center"></div>
                            </div>
                        ) : (
                            /* Informative alert when Client ID is not configured */
                            <div className="w-full text-center py-2">
                                <Key className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                                <p className="text-xs font-bold text-slate-750">Servicio de Google pendiente de activación</p>
                                <p className="text-[10px] text-slate-500 mt-1.5 max-w-xs mx-auto leading-normal">
                                    Para activar la autenticación de Google obligatoria, configura el Google Client ID mediante el engranaje inferior o la variable de entorno.
                                </p>
                            </div>
                        )}

                    </div>

                    {/* Client ID Setup Forms */}
                    <div className="mt-6 pt-4 border-t border-slate-150/70 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => setShowConfigForm(!showConfigForm)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
                            >
                                <Settings className="w-4 h-4" />
                                {isClientIdMissing ? "Configurar Google Client ID" : "Editar Google Client ID"}
                            </button>

                            {!isClientIdMissing && (
                                <button
                                    onClick={handleClearClientId}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                                    title="Restaurar configuración de entorno"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Restaurar
                                </button>
                            )}
                        </div>

                        {showConfigForm && (
                            <form onSubmit={handleSaveClientId} className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                    Ingresar Google Client ID real:
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="ej. xxxx-yyyy.apps.googleusercontent.com"
                                        value={tempClientId}
                                        onChange={(e) => setTempClientId(e.target.value)}
                                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs flex-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 font-mono"
                                    />
                                    <button
                                        type="submit"
                                        className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center"
                                        title="Guardar ID de Google"
                                    >
                                        <Save className="w-4 h-4" />
                                    </button>
                                </div>
                                <span className="text-[9px] text-slate-400 leading-normal">
                                    * El ID de cliente se almacenará localmente en este navegador (`localStorage`) de manera privada para activar el botón real de Google.
                                </span>
                            </form>
                        )}

                        {/* Dynamic Active ID Banner */}
                        {!isClientIdMissing && (
                            <div className="text-center mt-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                    Acceso con Google Activo
                                </span>
                                <p className="text-[9px] text-slate-400 mt-1 font-mono break-all truncate" title={clientId}>
                                    ID: {clientId}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Setup Guides Section */}
                    <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                        <button
                            onClick={() => setShowSetupHelp(!showSetupHelp)}
                            className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors mx-auto cursor-pointer uppercase tracking-wider"
                        >
                            <HelpCircle className="w-3.5 h-3.5" />
                            ¿Cómo registrar un Client ID en Google Cloud?
                        </button>

                        {showSetupHelp && (
                            <div className="mt-3 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-left text-[11px] leading-relaxed text-slate-700">
                                <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-1.5">
                                    <ShieldAlert className="w-4 h-4 shrink-0" />
                                    Instrucciones Obligatorias:
                                </div>
                                <ol className="list-decimal pl-4.5 space-y-1.5 text-slate-600 text-[10px]">
                                    <li>Ve a la <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-orange-600 underline font-bold">Consola de Google Cloud</a>.</li>
                                    <li>Crea un proyecto y configura la <strong>Pantalla de consentimiento de OAuth</strong>.</li>
                                    <li>Crea una credencial de tipo <strong>ID de cliente de OAuth 2.0</strong> (Selecciona "Aplicación Web").</li>
                                    <li>Añade los siguientes <strong>Orígenes JavaScript autorizados</strong>:
                                        <div className="bg-slate-200/60 font-mono text-[9px] px-1.5 py-0.5 rounded mt-1 max-w-max">http://localhost:3000</div>
                                        <div className="bg-slate-200/60 font-mono text-[9px] px-1.5 py-0.5 rounded mt-1 max-w-max">https://toniad74.github.io</div>
                                    </li>
                                    <li>Copia el Client ID y pégalo arriba mediante la sección "Configurar Google Client ID".</li>
                                </ol>
                            </div>
                        )}
                    </div>

                </div>

                {/* Footnote */}
                <p className="text-[10px] text-center text-slate-400 max-w-xs leading-normal">
                    Las estadísticas del partido se guardan automáticamente en tu navegador local, evitando cualquier pérdida de información a pie de pista.
                </p>

            </div>

            {/* Footer */}
            <footer className="text-center py-3 text-[10px] font-bold text-slate-400 select-none uppercase tracking-widest">
                BeachHandball Stats © 2026 • Diseñado para la Arena
            </footer>

        </div>
    );
}
