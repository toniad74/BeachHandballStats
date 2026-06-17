import React, { useEffect, useState } from 'react';
import { GoogleUser } from '../types';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

declare global {
    interface Window {
        google?: any;
    }
}

interface GoogleLoginScreenProps {
    onLoginSuccess: (user: GoogleUser) => void;
}

export default function GoogleLoginScreen({ onLoginSuccess }: GoogleLoginScreenProps) {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Obtener el Client ID de las variables de entorno de Vite
    const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

    // Decodificación nativa de JWT segura y sin dependencias externas
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
            console.error("Error al decodificar el token de Google:", e);
            return null;
        }
    };

    // Callback de Google Sign-In que se ejecuta tras seleccionar la cuenta en el popup oficial
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
            setErrorMessage("Error de autenticación con Google.");
        }
    };

    // Escuchar la carga del script oficial de Google Identity Services
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const checkGoogleLoaded = () => {
            if (window.google?.accounts?.id) {
                setGoogleScriptLoaded(true);
                clearInterval(interval);
            }
        };

        checkGoogleLoaded();
        interval = setInterval(checkGoogleLoaded, 300);

        return () => clearInterval(interval);
    }, []);

    // Inicializar y renderizar el botón oficial de Google de forma invisible encima del botón personalizado
    useEffect(() => {
        if (googleScriptLoaded) {
            try {
                window.google.accounts.id.initialize({
                    client_id: clientId || "tu-cliente-id-placeholder.apps.googleusercontent.com",
                    callback: handleCredentialResponse,
                    auto_select: false,
                    cancel_on_tap_outside: true
                });

                const btnContainer = document.getElementById("hidden-google-btn-container");
                if (btnContainer) {
                    btnContainer.innerHTML = ''; // Evitar duplicaciones
                    window.google.accounts.id.renderButton(btnContainer, {
                        theme: "outline",
                        size: "large",
                        text: "continue_with",
                        shape: "rectangular",
                        width: 340
                    });
                }
            } catch (err) {
                console.error("Error al inicializar el SDK de Google:", err);
            }
        }
    }, [googleScriptLoaded, clientId, activeTab]);

    // Función de registro local de email y contraseña (funcional mediante localStorage)
    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        if (!email || !password) {
            setErrorMessage("Por favor, rellena todos los campos.");
            return;
        }

        if (password.length < 6) {
            setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        // Leer usuarios registrados actuales
        const savedUsersRaw = localStorage.getItem('beach_handball_local_auth_2026');
        const users = savedUsersRaw ? JSON.parse(savedUsersRaw) : {};

        if (users[email.toLowerCase()]) {
            setErrorMessage("Este correo ya está registrado.");
            return;
        }

        // Registrar el nuevo usuario
        users[email.toLowerCase()] = password;
        localStorage.setItem('beach_handball_local_auth_2026', JSON.stringify(users));

        setSuccessMessage("¡Usuario registrado con éxito! Ahora puedes iniciar sesión.");
        setEmail('');
        setPassword('');
        setActiveTab('login');
    };

    // Función de inicio de sesión local de email y contraseña (funcional mediante localStorage)
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        if (!email || !password) {
            setErrorMessage("Por favor, rellena todos los campos.");
            return;
        }

        // Leer usuarios registrados actuales
        const savedUsersRaw = localStorage.getItem('beach_handball_local_auth_2026');
        const users = savedUsersRaw ? JSON.parse(savedUsersRaw) : {};

        const storedPassword = users[email.toLowerCase()];

        if (storedPassword && storedPassword === password) {
            // Login correcto
            const nameFromEmail = email.split('@')[0];
            const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
            const localUser: GoogleUser = {
                id: 'local-' + email.toLowerCase(),
                email: email.toLowerCase(),
                name: formattedName,
            };
            onLoginSuccess(localUser);
        } else {
            setErrorMessage("El correo electrónico o la contraseña son incorrectos.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-900/10 flex flex-col justify-center items-center p-4">

            {/* Tarjeta de Inicio de Sesión idéntica a la captura de pantalla */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl max-w-[27rem] w-full border border-slate-100 flex flex-col">

                {/* Selector de pestañas: Iniciar Sessió / Registrar-se */}
                <div className="flex border-b border-slate-100 mb-6 text-sm font-semibold">
                    <button
                        onClick={() => {
                            setActiveTab('login');
                            setErrorMessage(null);
                            setSuccessMessage(null);
                        }}
                        className={`pb-3 flex-1 text-center transition-all ${activeTab === 'login'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        Iniciar Sessió
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('register');
                            setErrorMessage(null);
                            setSuccessMessage(null);
                        }}
                        className={`pb-3 flex-1 text-center transition-all ${activeTab === 'register'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        Registrar-se
                    </button>
                </div>

                {/* Botón de Google Personalizado (que contiene el botón oficial transparente encima) */}
                <div className="relative mb-6">
                    <button
                        type="button"
                        className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium text-[13px] flex items-center justify-center gap-3 transition-all"
                    >
                        {/* Logotipo de Google multicolor */}
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                            <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.113-5.136 4.113-3.473 0-6.257-2.818-6.257-6.257s2.784-6.257 6.257-6.257c1.61 0 3.08.617 4.2 1.63L21.1 4.542C18.843 2.456 15.753 1.2 12.24 1.2 6.043 1.2 1 6.243 1 12.4s5.043 11.2 11.24 11.2c5.9 0 10.971-4.228 10.971-11.2 0-.743-.075-1.4-.2-2.115H12.24z" />
                        </svg>
                        Continuar amb Google
                    </button>

                    {/* El botón oficial de Google se renderiza invisible justo encima de nuestro botón */}
                    {googleScriptLoaded && (
                        <div
                            id="hidden-google-btn-container"
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            style={{ overflow: 'hidden' }}
                        ></div>
                    )}
                </div>

                {/* Separador con la "o" de la captura */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <span className="text-xs text-slate-400 font-medium">o</span>
                    <div className="h-px bg-slate-200 flex-1"></div>
                </div>

                {/* Alertas de error o éxito */}
                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {successMessage && (
                    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs">
                        {successMessage}
                    </div>
                )}

                {/* Formulario de Email y Contraseña */}
                <form onSubmit={activeTab === 'login' ? handleLogin : handleRegister} className="flex flex-col flex-1">

                    {/* Campo de Correo Electrónico */}
                    <div className="flex flex-col gap-1.5 mb-4">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                            Correu Electrònic
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-slate-350"
                        />
                    </div>

                    {/* Campo de Contraseña */}
                    <div className="flex flex-col gap-1.5 mb-3 relative">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                            Contrasenya
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 w-full text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Olvidaste tu contraseña */}
                    {activeTab === 'login' && (
                        <div className="text-right mb-6">
                            <button
                                type="button"
                                onClick={() => setErrorMessage("Para restablecer tu contraseña, por favor contacta con el administrador del club.")}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                Has oblidat la contrasenya?
                            </button>
                        </div>
                    )}

                    {/* Botón azul principal que ocupa todo el ancho */}
                    <button
                        type="submit"
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all cursor-pointer mt-auto"
                    >
                        {activeTab === 'login' ? 'Iniciar Sessió' : 'Registrar-se'}
                    </button>
                </form>

                {/* Footer idéntico a la firma del usuario */}
                <div className="text-center mt-6 text-[10px] text-slate-400 leading-normal select-none">
                    <p>© 2026 IAtpro74</p>
                    <p className="text-[9px] text-slate-350 mt-0.5">v1.9.4</p>
                </div>

            </div>

        </div>
    );
}
