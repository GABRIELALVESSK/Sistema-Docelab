import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export type Tema = 'light' | 'dark';
export type CorSistema = 'pink' | 'blue' | 'green' | 'purple' | 'orange';
export type Densidade = 'compact' | 'spacious';

export interface Settings {
    nome: string;
    telefone: string;
    dataNascimento: string;
    corSistema: CorSistema;
    email: string;
    tema: Tema;
    densidade: Densidade;
    notificacoesPedidos: boolean;
    notificacoesEstoque: boolean;
    notificacoesResumos: boolean;
    whatsapp: boolean;
    googleCalendar: boolean;
    idioma: string;
    moeda: string;
    fotoPerfil: string;
}

function getDefaultSettings(email?: string, metadata?: Record<string, string>): Settings {
    return {
        nome: metadata?.nome || email?.split('@')[0] || 'Usuário',
        telefone: metadata?.telefone || '',
        dataNascimento: metadata?.data_nascimento || '',
        corSistema: 'pink',
        email: email || '',
        tema: 'light',
        densidade: 'spacious',
        notificacoesPedidos: true,
        notificacoesEstoque: true,
        notificacoesResumos: false,
        whatsapp: false,
        googleCalendar: false,
        idioma: 'Português (Brasil)',
        moeda: 'BRL',
        fotoPerfil: '',
    };
}

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const userId = user?.id;
    const userEmail = user?.email;
    const userMeta = user?.user_metadata as Record<string, string> | undefined;

    const [settings, setSettings] = useState<Settings>(() => {
        if (userId) {
            const saved = localStorage.getItem(`@docelab/settings/${userId}`);
            if (saved) return JSON.parse(saved);
        }
        return getDefaultSettings(userEmail, userMeta);
    });

    // Fetch settings from Supabase when user changes
    useEffect(() => {
        if (!userId) return;

        const fetchSettings = async () => {
            try {
                const { data, error } = await supabase
                    .from('configuracoes')
                    .select('*')
                    .eq('user_id', userId)
                    .single();

                if (data && !error) {
                    setSettings({
                        nome: data.nome || userEmail?.split('@')[0] || 'Usuário',
                        telefone: data.telefone || '',
                        dataNascimento: data.data_nascimento || '',
                        corSistema: data.cor_sistema || 'pink',
                        email: data.email || userEmail || '',
                        tema: data.tema || 'light',
                        densidade: data.densidade || 'spacious',
                        notificacoesPedidos: data.notificacoes_pedidos ?? true,
                        notificacoesEstoque: data.notificacoes_estoque ?? true,
                        notificacoesResumos: data.notificacoes_resumos ?? false,
                        whatsapp: data.whatsapp ?? false,
                        googleCalendar: data.google_calendar ?? false,
                        idioma: data.idioma || 'Português (Brasil)',
                        moeda: data.moeda || 'BRL',
                        fotoPerfil: data.foto_perfil || '',
                    });
                } else {
                    // No row yet for this user — use defaults from auth profile
                    setSettings(getDefaultSettings(userEmail, userMeta));
                }
            } catch (err) {
                console.error("Erro ao puxar configuracoes do supabase", err);
                setSettings(getDefaultSettings(userEmail, userMeta));
            }
        };

        fetchSettings();
    }, [userId, userEmail, userMeta]);

    // Persist to localStorage whenever settings change
    useEffect(() => {
        if (userId) {
            localStorage.setItem(`@docelab/settings/${userId}`, JSON.stringify(settings));
        }

        // Apply theme
        if (settings.tema === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        document.documentElement.setAttribute('data-density', settings.densidade);
    }, [settings, userId]);

    const updateSettings = async (newSettings: Partial<Settings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);

        if (!userId) return;

        try {
            await supabase.from('configuracoes').upsert({
                user_id: userId,
                nome: updated.nome,
                telefone: updated.telefone,
                data_nascimento: updated.dataNascimento,
                cor_sistema: updated.corSistema,
                email: updated.email,
                tema: updated.tema,
                densidade: updated.densidade,
                notificacoes_pedidos: updated.notificacoesPedidos,
                notificacoes_estoque: updated.notificacoesEstoque,
                notificacoes_resumos: updated.notificacoesResumos,
                whatsapp: updated.whatsapp,
                google_calendar: updated.googleCalendar,
                idioma: updated.idioma,
                moeda: updated.moeda,
                foto_perfil: updated.fotoPerfil,
            });
        } catch (err) {
            console.error("Erro ao salvar configuracoes no supabase", err);
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
