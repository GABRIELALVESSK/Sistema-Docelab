import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, Phone, Calendar, Loader2, UserPlus } from 'lucide-react';

export default function Cadastro() {
    const { signUp } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');
    const [dataNascimento, setDataNascimento] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !telefone || !dataNascimento || !password || !confirmPassword) {
            toast({ title: 'Preencha todos os campos', variant: 'destructive' });
            return;
        }

        if (password !== confirmPassword) {
            toast({ title: 'As senhas não coincidem', variant: 'destructive' });
            return;
        }

        if (password.length < 6) {
            toast({ title: 'A senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
            return;
        }

        setLoading(true);
        const { error } = await signUp(email, password, { telefone, data_nascimento: dataNascimento });
        setLoading(false);

        if (error) {
            toast({
                title: 'Erro ao criar conta',
                description: error,
                variant: 'destructive',
            });
        } else {
            toast({
                title: 'Conta criada com sucesso! 🎉',
                description: 'Você já pode acessar o sistema.',
            });
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF5F5] via-[#F5F1EB] to-[#FEE2E2] p-4 relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF8A96]/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#FF5C5C]/8 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
            <div className="absolute top-1/3 right-1/4 w-52 h-52 bg-amber-200/20 rounded-full blur-2xl" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF8A96] to-[#FF5C5C] flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-red-200/50">
                            D
                        </div>
                    </div>
                    <h1 className="text-4xl font-extrabold text-[#1E1E2F] tracking-tighter">
                        Doce<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF8A96] to-[#FF5C5C]">Lab</span>.
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm font-medium">Crie sua conta e comece a gerenciar</p>
                </div>

                {/* Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/5 border border-white/60 p-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-[#1E1E2F] tracking-tight flex items-center gap-2">
                            <UserPlus className="w-6 h-6 text-[#FF8A96]" />
                            Criar Conta
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Preencha seus dados para começar</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#FF8A96]/30 focus:border-[#FF8A96]/50 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Telefone */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Telefone</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="tel"
                                    value={telefone}
                                    onChange={(e) => setTelefone(e.target.value)}
                                    placeholder="(11) 99999-9999"
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#FF8A96]/30 focus:border-[#FF8A96]/50 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Data de Nascimento */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Data de Nascimento</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="date"
                                    value={dataNascimento}
                                    onChange={(e) => setDataNascimento(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#FF8A96]/30 focus:border-[#FF8A96]/50 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Password Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-10 py-3 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#FF8A96]/30 focus:border-[#FF8A96]/50 outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Confirmar</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#FF8A96]/30 focus:border-[#FF8A96]/50 outline-none transition-all"
                                    />
                                </div>
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
                                    Criando conta...
                                </>
                            ) : (
                                'Criar Conta'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400 font-medium">ou</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* Login Link */}
                    <p className="text-center text-sm text-gray-500">
                        Já tem uma conta?{' '}
                        <Link
                            to="/login"
                            className="text-[#FF5C5C] font-bold hover:text-[#FF8A96] transition-colors"
                        >
                            Fazer login
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-400 mt-6">
                    © 2026 DoceLab. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}
