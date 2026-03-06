import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';

export default function Login() {
    const { signIn, signInWithGoogle } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        const { error } = await signInWithGoogle();
        if (error) {
            toast({
                title: 'Erro de autenticação',
                description: 'Não foi possível entrar com Google.',
                variant: 'destructive',
            });
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast({ title: 'Preencha todos os campos', variant: 'destructive' });
            return;
        }

        setLoading(true);
        const { error } = await signIn(email, password);
        setLoading(false);

        if (error) {
            toast({
                title: 'Erro ao entrar',
                description: error === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error,
                variant: 'destructive',
            });
        } else {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF5F5] via-[#F5F1EB] to-[#FEE2E2] p-4 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-[#FF8A96]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#FF5C5C]/8 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
            <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-purple-200/20 rounded-full blur-2xl" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF8A96] to-[#FF5C5C] flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-red-200/50">
                            D
                        </div>
                    </div>
                    <h1 className="text-4xl font-extrabold text-[#1E1E2F] tracking-tighter">
                        Doce<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF8A96] to-[#FF5C5C]">Lab</span>.
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm font-medium">Gestão profissional para sua confeitaria</p>
                </div>

                {/* Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/5 border border-white/60 p-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-[#1E1E2F] tracking-tight">Bem-vindo de volta!</h2>
                        <p className="text-gray-500 text-sm mt-1">Entre na sua conta para continuar</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm font-medium text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-[#FF8A96]/30 focus:border-[#FF8A96]/50 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-12 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm font-medium text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-[#FF8A96]/30 focus:border-[#FF8A96]/50 outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-[#FF8A96] to-[#FF5C5C] text-white font-bold rounded-2xl shadow-lg shadow-red-200/50 hover:shadow-xl hover:shadow-red-200/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                'Entrar'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-500 font-medium">ou</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* Google Login */}
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-bold py-3.5 mb-6 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continuar com Google
                    </button>

                    {/* Sign Up Link */}
                    <p className="text-center text-sm text-gray-500">
                        Não tem uma conta?{' '}
                        <Link
                            to="/cadastro"
                            className="text-[#FF5C5C] font-bold hover:text-[#FF8A96] transition-colors"
                        >
                            Criar conta
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-500 mt-6">
                    © 2026 DoceLab. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}
