import React, { useState } from 'react';
import { GoogleUser } from '../types';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import {
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
} from 'firebase/auth';

interface GoogleLoginScreenProps {
    onLoginSuccess: (user: GoogleUser) => void;
}

export default function GoogleLoginScreen({ onLoginSuccess }: GoogleLoginScreenProps) {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Mapear errores de Firebase a mensajes en español
    const getFirebaseErrorMessage = (code: string): string => {
        const errors: Record<string, string> = {
            'auth/invalid-email': 'El correo electrónico no es válido.',
            'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
            'auth/user-not-found': 'No existe ninguna cuenta con este correo.',
            'auth/wrong-password': 'La contraseña es incorrecta.',
            'auth/email-already-in-use': 'Este correo ya está registrado.',
            'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
            'auth/popup-closed-by-user': 'Se cerró la ventana de Google antes de completar el inicio de sesión.',
            'auth/cancelled-popup-request': 'Se canceló la solicitud de inicio de sesión.',
            'auth/network-request-failed': 'Error de red. Comprueba tu conexión a internet.',
            'auth/too-many-requests': 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
            'auth/invalid-credential': 'El correo electrónico o la contraseña son incorrectos.',
        };
        return errors[code] || `Error de autenticación (${code})`;
    };

    // Convertir Firebase User a nuestro tipo GoogleUser
    const firebaseUserToGoogleUser = (fbUser: any): GoogleUser => ({
        id: fbUser.uid,
        email: fbUser.email || '',
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Usuario',
        picture: fbUser.photoURL || undefined,
    });

    // Inicio de sesión con Google via Firebase
    const handleGoogleLogin = async () => {
        setErrorMessage(null);
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            onLoginSuccess(firebaseUserToGoogleUser(result.user));
        } catch (error: any) {
            if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
                setErrorMessage(getFirebaseErrorMessage(error.code));
            }
        } finally {
            setLoading(false);
        }
    };

    // Registro con email y contraseña via Firebase
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        if (!email || !password) {
            setErrorMessage("Por favor, rellena todos los campos.");
            return;
        }

        setLoading(true);
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            // Poner el nombre del email como displayName
            const nameFromEmail = email.split('@')[0];
            const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
            await updateProfile(result.user, { displayName: formattedName });

            setSuccessMessage("¡Usuario registrado con éxito! Ahora puedes iniciar sesión.");
            setEmail('');
            setPassword('');
            setActiveTab('login');
        } catch (error: any) {
            setErrorMessage(getFirebaseErrorMessage(error.code));
        } finally {
            setLoading(false);
        }
    };

    // Inicio de sesión con email y contraseña via Firebase
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        if (!email || !password) {
            setErrorMessage("Por favor, rellena todos los campos.");
            return;
        }

        setLoading(true);
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            onLoginSuccess(firebaseUserToGoogleUser(result.user));
        } catch (error: any) {
            setErrorMessage(getFirebaseErrorMessage(error.code));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900/10 flex flex-col justify-center items-center p-4">

            {/* Tarjeta de Inicio de Sesión */}
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

                {/* Botón de Google con Firebase Auth */}
                <div className="mb-6">
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium text-[13px] flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                    >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        {loading ? 'Conectando...' : 'Continuar amb Google'}
                    </button>
                </div>

                {/* Separador */}
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

                    {/* Botón azul principal */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all cursor-pointer mt-auto disabled:opacity-50 disabled:cursor-wait"
                    >
                        {loading
                            ? 'Procesando...'
                            : activeTab === 'login' ? 'Iniciar Sessió' : 'Registrar-se'
                        }
                    </button>
                </form>

                {/* Footer */}
                <div className="text-center mt-6 text-[10px] text-slate-400 leading-normal select-none">
                    <p>© 2026 IAtpro74</p>
                    <p className="text-[9px] text-slate-350 mt-0.5">v1.9.4</p>
                </div>

            </div>

        </div>
    );
}
