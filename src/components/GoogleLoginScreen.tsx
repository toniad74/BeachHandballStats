import React, { useEffect, useState } from 'react';
import { GoogleUser } from '../types';
import { Sun, Trophy, Zap, AlertCircle, HelpCircle, ShieldAlert, Settings, Save, Trash2, Key } from 'lucide-react';

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
    const [showDeveloperBypass, setShowDeveloperBypass] = useState(false);

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

    // Initialize Google Login Button (Autenticación Real)
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
                    // Limpiar contenedor previo para evitar duplicados
                    btnContainer.innerHTML = '';
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
            // Forzar recarga sutil para reinicializar el SDK de Google con el nuevo ID de cliente
            setTimeout(() => {
                window.location.reload();
            }, 100);
        } else {
            setErrorMessage("Por favor, introduce un ID de cliente válido.");
        }
    };

    // Eliminar Client ID de localStorage para restaurar la variable de entorno
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

    // Acceso de pruebas local (Bypass de desarrollo)
    const handleDeveloperBypassLogin = () => {
        const developerUser: GoogleUser = {
            id: "dev-bypass-9999",
            email: "entrenador.oficial@beachhandball.com",
            name: "Entrenador Beach Handball (Real Local)",
            picture: undefined // Let dynamic initial handle picture styling
        };
        onLoginSuccess(developerUser);
    };

    // Acceso local libre de cuenta (Invitado)
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

            {/* Top Decoration */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-amber-400 to-sky-400"></div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full py-10">

                {/* Brand Header */}
                <div className="text-center mb-6 relative">
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

                {/* Login Card */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl p-7 shadow-xl border border-white/50 w-full mb-6">
                    <h2 className="text-md font-extrabold text-slate-800 text-center mb-1">
                        Acceso de Entrenadores
                    </h2>
                    <p className="text-xs text-slate-500 text-center mb-5">
                        Registra estadísticas profesionales de Balonmano Playa a pie de pista en tiempo real.
                    </p>

                    {errorMessage && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2 text-xs">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 animate-bounce" />
                            <span className="font-semibold">{errorMessage}</span>
                        </div>
                    )}

                    {/* Authentication Container */}
                    <div className="flex flex-col items-center gap-4 justify-center py-2">

                        {/* Botón de Google Real (Siempre que haya un Client ID disponible) */}
                        {!isClientIdMissing && googleScriptLoaded ? (
                            <div className="w-full flex flex-col items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acceder mediante Google</span>
                                <div id="google-signin-btn-container" className="min-h-[50px] flex items-center justify-center"></div>
                            </div>
                        ) : (
                            /* Si falta el Client ID, avisar claramente en lugar de mostrar una demo falsa */
                            <div className="w-full text-center p-4 bg-orange-50/70 rounded-2xl border border-orange-100 mb-2">
                                <Key className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                                <p className="text-xs font-bold text-slate-700">Acceso Oficial con Google Desactivado</p>
                                <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto leading-normal">
                                    Para activar el acceso real con Google, configura tu Google Client ID usando el botón de configuración de abajo o la variable de entorno.
                                </p>
                            </div>
                        )}

                        {/* Divider */}
                        <div className="w-full flex items-center justify-center gap-2 text-slate-300 my-1">
                            <div className="h-px bg-slate-200 flex-1"></div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">O</span>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>

                        {/* Invitado (Modo local 100% funcional offline) */}
                        <button
                            onClick={handleGuestLogin}
                            className="w-full py-3 px-5 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 font-bold rounded-full border border-slate-300 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider hover:scale-[1.01] active:scale-95"
                        >
                            <Zap className="w-4 h-4 text-amber-500" />
                            Acceso Local (Modo Invitado)
                        </button>

                    </div>

                    {/* Dynamic Client ID Config Form Toggle */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => setShowConfigForm(!showConfigForm)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-orange-600 transition-colors"
                            >
                                <Settings className="w-4 h-4" />
                                {isClientIdMissing ? "Configurar Google Client ID" : "Editar Google Client ID"}
                            </button>

                            {!isClientIdMissing && (
                                <button
                                    onClick={handleClearClientId}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors"
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
                                    * El ID se almacenará de manera persistente en este navegador (`localStorage`) de forma privada y segura.
                                </span>
                            </form>
                        )}

                        {/* Dynamic Client ID Active Tag */}
                        {!isClientIdMissing && (
                            <div className="text-center mt-2.5">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                    Google Sign-In Real Activado
                                </span>
                                <p className="text-[9px] text-slate-400 mt-1 font-mono break-all truncate" title={clientId}>
                                    ID: {clientId}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Developer Bypass Toggle (Discreetly at the bottom for developers/local testing) */}
                    <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                        <button
                            type="button"
                            onClick={() => setShowDeveloperBypass(!showDeveloperBypass)}
                            className="text-[9px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
                        >
                            {showDeveloperBypass ? "Ocultar Herramientas" : "Herramientas de Desarrollo"}
                        </button>

                        {showDeveloperBypass && (
                            <div className="mt-2.5 flex flex-col gap-2">
                                <button
                                    onClick={handleDeveloperBypassLogin}
                                    className="w-full py-2 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold rounded-xl border border-blue-200 transition text-[10px] uppercase tracking-wider cursor-pointer"
                                >
                                    Simular Acceso Real (Entrenador)
                                </button>
                                <button
                                    onClick={() => setShowSetupHelp(!showSetupHelp)}
                                    className="inline-flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 transition-colors mx-auto"
                                >
                                    <HelpCircle className="w-3.5 h-3.5" />
                                    ¿Cómo registrar un Client ID de Google?
                                </button>
                            </div>
                        )}

                        {showSetupHelp && (
                            <div className="mt-2.5 p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-left text-[11px] leading-relaxed text-slate-700">
                                <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-1.5">
                                    <ShieldAlert className="w-4 h-4 shrink-0" />
                                    Registro en Google Cloud:
                                </div>
                                <ol className="list-decimal pl-4.5 space-y-1 text-slate-600 text-[10px]">
                                    <li>Visita la <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-orange-600 underline font-bold">Consola de Google Cloud</a>.</li>
                                    <li>Crea un proyecto y configura la <strong>Pantalla de consentimiento de OAuth</strong>.</li>
                                    <li>En "Credenciales", crea un <strong>ID de cliente de OAuth 2.0</strong> (Aplicación Web).</li>
                                    <li>Como <strong>Orígenes JavaScript autorizados</strong>, añade:
                                        <div className="bg-slate-200/60 font-mono text-[9px] px-1.5 py-0.5 rounded mt-1 max-w-max">http://localhost:3000</div>
                                        <div className="bg-slate-200/60 font-mono text-[9px] px-1.5 py-0.5 rounded mt-1 max-w-max">https://toniad74.github.io</div>
                                    </li>
                                    <li>Copia el Client ID resultante y pégalo arriba. ¡Listo!</li>
                                </ol>
                            </div>
                        )}
                    </div>

                </div>

                {/* Technical Info Footnote */}
                <p className="text-[10px] text-center text-slate-400 max-w-xs leading-normal">
                    La aplicación utiliza persistencia de datos local continua, garantizando la fiabilidad de las estadísticas aun perdiendo la cobertura de internet.
                </p>

            </div>

            {/* Application Footer */}
            <footer className="text-center py-3 text-[10px] font-bold text-slate-400 select-none uppercase tracking-widest">
                BeachHandball Stats © 2026 • Diseñado para la Arena
            </footer>

        </div>
    );
}
