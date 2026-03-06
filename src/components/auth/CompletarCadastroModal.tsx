import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

export function CompletarCadastroModal() {
    const { user } = useAuth();
    const { toast } = useToast();

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [dataNascimento, setDataNascimento] = useState('');

    useEffect(() => {
        if (!user) return;

        const metadata = user.user_metadata || {};
        const hasTelefone = !!metadata.telefone;
        const hasDataNascimento = !!metadata.data_nascimento;

        // Se estiver faltando o telefone ou data de nascimento, forçamos o preenchimento.
        // Especialmente importante para quem loga usando o Google no primeiro acesso.
        if (!hasTelefone || !hasDataNascimento) {
            setOpen(true);
            if (metadata.full_name || metadata.name) {
                setNome(metadata.full_name || metadata.name || '');
            }
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!telefone.trim() || !dataNascimento.trim() || !nome.trim()) {
            toast({ title: 'Preencha todos os campos.', variant: 'destructive' });
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.updateUser({
            data: {
                full_name: nome,
                telefone,
                data_nascimento: dataNascimento,
            }
        });

        setLoading(false);

        if (error) {
            toast({
                title: 'Erro ao salvar',
                description: error.message,
                variant: 'destructive',
            });
            return;
        }

        toast({
            title: 'Sucesso!',
            description: 'Cadastro completado com sucesso.',
        });
        setOpen(false);
    };

    return (
        <AlertDialog open={open}>
            <AlertDialogContent className="max-w-md bg-white border-none shadow-2xl rounded-3xl p-8">
                <AlertDialogHeader className="mb-4">
                    <AlertDialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        Falta pouco! 🎉
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-sm text-gray-500 font-medium">
                        Por favor, complete as informações abaixo para continuar usando o DoceLab.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                            Nome Completo
                        </label>
                        <Input
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Ex: Ana Paula"
                            className="py-6 rounded-2xl bg-gray-50/80 border-gray-200 focus-visible:ring-[#FF8A96]"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                            Telefone
                        </label>
                        <Input
                            value={telefone}
                            onChange={(e) => setTelefone(e.target.value)}
                            placeholder="(00) 00000-0000"
                            className="py-6 rounded-2xl bg-gray-50/80 border-gray-200 focus-visible:ring-[#FF8A96]"
                            type="tel"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                            Data de Nascimento
                        </label>
                        <Input
                            value={dataNascimento}
                            onChange={(e) => setDataNascimento(e.target.value)}
                            type="date"
                            className="py-6 rounded-2xl bg-gray-50/80 border-gray-200 focus-visible:ring-[#FF8A96]"
                            required
                        />
                    </div>

                    <AlertDialogFooter className="mt-6 sm:justify-center">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#FF8A96] to-[#FF5C5C] hover:from-[#FF7A86] hover:to-[#FF4C4C] text-white py-6 rounded-2xl font-bold shadow-lg shadow-red-200/50 hover:shadow-xl transition-all"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Salvando...
                                </>
                            ) : (
                                'Concluir Cadastro'
                            )}
                        </Button>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}
