import React, { useState } from 'react';
import { GoogleUser } from '../types';
import { AlertCircle } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { useI18n } from '../i18n';

interface GoogleLoginScreenProps {
    onLoginSuccess: (user: GoogleUser) => void;
}

export default function GoogleLoginScreen({ onLoginSuccess }: GoogleLoginScreenProps) {
    const { t } = useI18n();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Mapear errores de Firebase a mensajes en español
    const getFirebaseErrorMessage = (code: string): string => {
        const errors: Record<string, string> = {
            'auth/popup-closed-by-user': 'Se cerró la ventana de Google antes de completar el inicio de sesión.',
            'auth/cancelled-popup-request': 'Se canceló la solicitud de inicio de sesión.',
            'auth/network-request-failed': 'Error de red. Comprueba tu conexión a internet.',
            'auth/too-many-requests': 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
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

    return (
        <div className="min-h-screen bg-slate-900/10 flex flex-col justify-center items-center p-4">

            {/* Tarjeta de Inicio de Sesión */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl max-w-[27rem] w-full border border-slate-100 flex flex-col items-center">

                {/* Logo */}
                <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-2xl mb-6 shadow-lg">
                    BH
                </div>

                {/* Título */}
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-1">
                    {t.loginTitle}
                </h1>
                <p className="text-xs text-slate-500 font-semibold mb-8">
                    {t.loginSubtitle}
                </p>

                {/* Alerta de error */}
                {errorMessage && (
                    <div className="mb-6 w-full p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* Botón de Google */}
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full py-3 px-4 bg-white hover:bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 font-bold text-sm flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait shadow-sm hover:shadow-md active:scale-[0.98]"
                >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    {loading ? t.connecting : t.loginWithGoogle}
                </button>

                {/* Nota informativa */}
                <p className="text-[11px] text-slate-400 text-center mt-6 leading-relaxed">
                    {t.loginNote}
                </p>

                {/* Footer */}
                <div className="text-center mt-8 text-[10px] text-slate-400 leading-normal select-none">
                    <p>© 2026 IAtpro74</p>
                    <p className="text-[9px] text-slate-350 mt-0.5">v2.0.0</p>
                </div>

            </div>

        </div>
    );
}
