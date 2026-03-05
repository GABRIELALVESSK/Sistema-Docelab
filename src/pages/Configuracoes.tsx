import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    User,
    Palette,
    Lock,
    Settings as SettingsIcon,
    ArrowRight,
    ArrowLeft,
    Camera,
    CheckCircle,
    Mail,
    ShieldCheck,
    Bell,
    Globe,
    Settings2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSettings, CorSistema, Tema, Densidade } from "@/contexts/SettingsContext";

export default function Configuracoes() {
    const [currentStep, setCurrentStep] = useState(1);
    const { toast } = useToast();

    const handleNext = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
        } else {
            toast({ title: "Configurações finalizadas com sucesso!" });
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const renderStepIcon = (step: number, icon: React.ElementType, label: string, isSuccess: boolean = false) => {
        const Icon = icon;
        const isActive = currentStep === step;
        const isPast = currentStep > step;

        // Determine colors based on state
        let borderColor = "border-gray-100 dark:border-gray-700 opacity-60";
        let textColor = "text-gray-500";
        let progressBg = "bg-gray-100 dark:bg-gray-700";
        let progressWidth = "w-0";

        if (isActive) {
            borderColor = "border-[#FF8A96] ring-4 ring-[#FF8A96]/5";
            textColor = "text-[#FF8A96]";
            progressBg = "bg-[#FF8A96]";
            progressWidth = "w-1/2";
        } else if (isPast) {
            borderColor = isSuccess ? "border-[#2ECC71] ring-4 ring-[#2ECC71]/5" : "border-[#FF8A96] ring-4 ring-[#FF8A96]/5";
            textColor = isSuccess ? "text-[#2ECC71]" : "text-[#FF8A96]";
            progressBg = isSuccess ? "bg-[#2ECC71]" : "bg-[#FF8A96]";
            progressWidth = "w-full";
        }

        return (
            <button
                key={step}
                onClick={() => setCurrentStep(step)}
                className={cn(
                    "bg-white dark:bg-gray-800 border-2 rounded-2xl p-5 shadow-sm relative overflow-hidden transition-all text-left",
                    borderColor
                )}
            >
                <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-xs font-bold uppercase tracking-wider", textColor)}>Passo {step}</span>
                    {isPast && isSuccess ? (
                        <CheckCircle className={cn("w-5 h-5", textColor)} />
                    ) : (
                        <Icon className={cn("w-5 h-5", textColor)} />
                    )}
                </div>
                <div className={cn(
                    "text-lg font-bold",
                    isActive || isPast ? "text-gray-800 dark:text-white" : "text-gray-500 dark:text-gray-500"
                )}>
                    {label}
                </div>
                <div className="mt-2 w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <div className={cn("h-full transition-all duration-500", progressBg, progressWidth)}></div>
                </div>
            </button>
        );
    };

    return (
        <div className="p-4 h-full overflow-hidden animate-in-fade">
            <div className="bg-white dark:bg-card-dark w-full h-full rounded-[2.5rem] shadow-soft overflow-y-auto p-8 relative flex flex-col">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white uppercase tracking-tight">Assistente de Configurações</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Personalize sua experiência no DoceLab passo a passo.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {currentStep > 1 ? (
                            <Button
                                variant="ghost"
                                onClick={handlePrev}
                                className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Voltar
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                                onClick={() => toast({ title: "Assistente pulado" })}
                            >
                                Pular Assistente
                            </Button>
                        )}

                        <Button
                            onClick={handleNext}
                            className={cn(
                                "text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-md flex items-center gap-2",
                                currentStep === 4
                                    ? "bg-[#2ECC71] hover:bg-emerald-500 shadow-emerald-200"
                                    : "bg-[#FF8A96] hover:bg-red-400 shadow-red-200"
                            )}
                        >
                            {currentStep === 4 ? "Finalizar Configuração" : "Salvar e Continuar"}
                            {currentStep === 4 ? <CheckCircle className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>

                {/* Steps Breadcrumbs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 shrink-0">
                    {renderStepIcon(1, User, "Dados Pessoais", true)}
                    {renderStepIcon(2, Palette, "Aparência", true)}
                    {renderStepIcon(3, Lock, "Credenciais", true)}
                    {renderStepIcon(4, SettingsIcon, "Preferências", true)}
                </div>

                {/* Main Content Area */}
                <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 rounded-3xl p-10 max-w-4xl mx-auto w-full flex-1">
                    {currentStep === 1 && <StepDadosPessoais />}
                    {currentStep === 2 && <StepAparencia />}
                    {currentStep === 3 && <StepCredenciais />}
                    {currentStep === 4 && <StepPreferencias />}
                </div>
            </div>
        </div>
    );
}

function StepDadosPessoais() {
    const { settings, updateSettings } = useSettings();
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateSettings({ nome: e.target.value });
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    updateSettings({ fotoPerfil: reader.result });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-full md:w-1/3 flex flex-col items-center">
                <div className="relative group">
                    <div className="w-40 h-40 rounded-3xl overflow-hidden border-4 border-white dark:border-gray-700 shadow-xl mb-4">
                        <img alt={settings.nome} className="w-full h-full object-cover" src={settings.fotoPerfil} />
                    </div>
                    <label className="cursor-pointer absolute -bottom-2 -right-2 bg-[#FF8A96] text-white p-3 rounded-2xl shadow-lg hover:scale-105 transition-transform">
                        <Camera className="w-5 h-5" />
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    </label>
                </div>
                <p className="text-xs text-gray-500 mt-4 text-center">Clique na câmera para alterar sua foto de perfil</p>
            </div>
            <div className="flex-1 space-y-6">
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Informações Pessoais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-500 uppercase ml-1">Nome Completo</label>
                            <input className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-[#FF8A96] focus:border-[#FF8A96] text-sm p-3 outline-none transition-all" type="text" value={settings.nome} onChange={(e) => updateSettings({ nome: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-500 uppercase ml-1">Telefone</label>
                            <input className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-[#FF8A96] focus:border-[#FF8A96] text-sm p-3 outline-none transition-all" type="tel" value={settings.telefone} onChange={(e) => updateSettings({ telefone: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-500 uppercase ml-1">Data de Nascimento</label>
                            <input className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-[#FF8A96] focus:border-[#FF8A96] text-sm p-3 outline-none transition-all" type="date" value={settings.dataNascimento} onChange={(e) => updateSettings({ dataNascimento: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-500 uppercase ml-1">Cor do Sistema</label>
                            <div className="flex items-center gap-3 p-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl h-[46px]">
                                <button className={cn("w-8 h-8 rounded-full bg-[#FF8A96] hover:scale-110 transition-transform ml-1", settings.corSistema === 'pink' && "ring-2 ring-[#FF8A96] ring-offset-2 dark:ring-offset-gray-700")} onClick={() => updateSettings({ corSistema: 'pink' })}></button>
                                <button className={cn("w-8 h-8 rounded-full bg-blue-400 hover:scale-110 transition-transform", settings.corSistema === 'blue' && "ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-gray-700")} onClick={() => updateSettings({ corSistema: 'blue' })}></button>
                                <button className={cn("w-8 h-8 rounded-full bg-emerald-400 hover:scale-110 transition-transform", settings.corSistema === 'green' && "ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-gray-700")} onClick={() => updateSettings({ corSistema: 'green' })}></button>
                                <button className={cn("w-8 h-8 rounded-full bg-purple-400 hover:scale-110 transition-transform", settings.corSistema === 'purple' && "ring-2 ring-purple-400 ring-offset-2 dark:ring-offset-gray-700")} onClick={() => updateSettings({ corSistema: 'purple' })}></button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Acesso</h3>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-500 uppercase ml-1">E-mail</label>
                            <input className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-[#FF8A96] focus:border-[#FF8A96] text-sm p-3 outline-none transition-all" type="email" value={settings.email} onChange={(e) => updateSettings({ email: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-500 uppercase ml-1">Nova Senha</label>
                                <input className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-[#FF8A96] focus:border-[#FF8A96] text-sm p-3 outline-none transition-all" placeholder="••••••••" type="password" defaultValue="        " />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-500 uppercase ml-1">Confirmar Senha</label>
                                <input className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-[#FF8A96] focus:border-[#FF8A96] text-sm p-3 outline-none transition-all" placeholder="••••••••" type="password" defaultValue="        " />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepAparencia() {
    const { settings, updateSettings } = useSettings();
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                    <div className="w-2 h-4 rounded-full bg-[#FF5C5C]"></div>
                    Tema do Sistema
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="cursor-pointer relative group">
                        <input className="peer sr-only" name="theme" type="radio" value="light" checked={settings.tema === 'light'} onChange={() => updateSettings({ tema: 'light' })} />
                        <div className="bg-white dark:bg-gray-700 border-2 border-transparent peer-checked:border-[#FF8A96] rounded-2xl p-6 peer-checked:ring-4 ring-[#FF8A96]/10 transition-all flex items-start gap-4 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 peer-checked:hover:border-[#FF8A96]">
                            <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center shrink-0">
                                <span className="material-icons-round text-orange-400">light_mode</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 dark:text-white text-lg">Modo Claro</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Visual padrão, ideal para ambientes iluminados.</p>
                            </div>
                            <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center group-hover:border-gray-300", settings.tema === 'light' ? "border-[#FF8A96] bg-[#FF8A96]" : "border-gray-200 dark:border-gray-600")}>
                                {settings.tema === 'light' && <CheckCircle className="w-4 h-4 text-white" />}
                            </div>
                        </div>
                    </label>
                    <label className="cursor-pointer relative group">
                        <input className="peer sr-only" name="theme" type="radio" value="dark" checked={settings.tema === 'dark'} onChange={() => updateSettings({ tema: 'dark' })} />
                        <div className="bg-white dark:bg-gray-700 border-2 border-transparent peer-checked:border-[#FF8A96] rounded-2xl p-6 peer-checked:ring-4 ring-[#FF8A96]/10 transition-all flex items-start gap-4 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 peer-checked:hover:border-[#FF8A96]">
                            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                                <span className="material-icons-round text-indigo-400">dark_mode</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 dark:text-white text-lg">Modo Escuro</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Menor cansaço visual em ambientes escuros.</p>
                            </div>
                            <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center group-hover:border-gray-300", settings.tema === 'dark' ? "border-[#FF8A96] bg-[#FF8A96]" : "border-gray-200 dark:border-gray-600")}>
                                {settings.tema === 'dark' && <CheckCircle className="w-4 h-4 text-white" />}
                            </div>
                        </div>
                    </label>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                    <div className="w-2 h-4 rounded-full bg-[#FF5C5C]"></div>
                    Cor de Destaque
                </h3>
                <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl p-6">
                    <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                        {[
                            { id: 'pink', color: 'bg-[#FF8A96]', name: 'Rosa' },
                            { id: 'blue', color: 'bg-blue-500', name: 'Azul' },
                            { id: 'green', color: 'bg-emerald-500', name: 'Verde' },
                            { id: 'purple', color: 'bg-purple-500', name: 'Roxo' },
                            { id: 'orange', color: 'bg-orange-500', name: 'Laranja' }
                        ].map((c) => (
                            <label key={c.id} className="cursor-pointer group flex flex-col items-center gap-2">
                                <input className="peer sr-only" name="accent-color" type="radio" value={c.id} checked={settings.corSistema === c.id} onChange={() => updateSettings({ corSistema: c.id as CorSistema })} />
                                <div className={cn("w-14 h-14 rounded-full ring-4 ring-offset-2 ring-transparent transition-all flex items-center justify-center shadow-sm hover:scale-105", c.color, settings.corSistema === c.id ? `ring-${c.color.split('-')[1]}-500 dark:ring-offset-gray-700` : "")}>
                                    {settings.corSistema === c.id ? <CheckCircle className="w-6 h-6 text-white" /> : <div className="w-6 h-6" />}
                                </div>
                                <span className={cn("text-sm font-medium", settings.corSistema === c.id ? "text-gray-900 dark:text-white font-bold" : "text-gray-500 dark:text-gray-500")}>{c.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                    <div className="w-2 h-4 rounded-full bg-[#FF5C5C]"></div>
                    Densidade da Interface
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="cursor-pointer relative group">
                        <input className="peer sr-only" name="density" type="radio" value="compact" checked={settings.densidade === 'compact'} onChange={() => updateSettings({ densidade: 'compact' })} />
                        <div className={cn("bg-white dark:bg-gray-700 border-2 rounded-2xl p-5 transition-all flex items-center gap-4 hover:border-gray-300 dark:hover:border-gray-500", settings.densidade === 'compact' ? "border-[#FF8A96] bg-red-50 dark:bg-red-500/5 group-hover:border-[#FF8A96]" : "border-gray-200 dark:border-gray-600")}>
                            <div className={cn("w-10 h-10 rounded-xl shadow-sm flex items-center justify-center shrink-0", settings.densidade === 'compact' ? "bg-white dark:bg-gray-800" : "bg-gray-100 dark:bg-gray-800")}>
                                <span className={cn("material-icons-round", settings.densidade === 'compact' ? "text-[#FF8A96]" : "text-gray-500")}>unfold_less</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 dark:text-white text-md">Compacto</h4>
                                <p className="text-xs text-gray-500 mt-0.5">Mais informações na tela</p>
                            </div>
                            <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", settings.densidade === 'compact' ? "border-[#FF8A96]" : "border-gray-200 dark:border-gray-600")}>
                                {settings.densidade === 'compact' && <div className="w-2.5 h-2.5 rounded-full bg-[#FF8A96]"></div>}
                            </div>
                        </div>
                    </label>
                    <label className="cursor-pointer relative group">
                        <input className="peer sr-only" name="density" type="radio" value="spacious" checked={settings.densidade === 'spacious'} onChange={() => updateSettings({ densidade: 'spacious' })} />
                        <div className={cn("bg-white dark:bg-gray-700 border-2 rounded-2xl p-5 transition-all flex items-center gap-4 hover:border-gray-300 dark:hover:border-gray-500", settings.densidade === 'spacious' ? "border-[#FF8A96] bg-red-50 dark:bg-red-500/5 group-hover:border-[#FF8A96]" : "border-gray-200 dark:border-gray-600")}>
                            <div className={cn("w-10 h-10 rounded-xl shadow-sm flex items-center justify-center shrink-0", settings.densidade === 'spacious' ? "bg-white dark:bg-gray-800" : "bg-gray-100 dark:bg-gray-800")}>
                                <span className={cn("material-icons-round", settings.densidade === 'spacious' ? "text-[#FF8A96]" : "text-gray-500")}>unfold_more</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 dark:text-white text-md">Espaçoso</h4>
                                <p className="text-xs text-gray-500 mt-0.5">Elementos maiores e confortáveis</p>
                            </div>
                            <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", settings.densidade === 'spacious' ? "border-[#FF8A96]" : "border-gray-200 dark:border-gray-600")}>
                                {settings.densidade === 'spacious' && <div className="w-2.5 h-2.5 rounded-full bg-[#FF8A96]"></div>}
                            </div>
                        </div>
                    </label>
                </div>
            </div>
        </div>
    );
}

function StepCredenciais() {
    const { settings, updateSettings } = useSettings();
    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-[#FF8A96]" />
                    Alterar E-mail
                </h3>
                <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-gray-200 dark:border-gray-600 shadow-sm">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-500 uppercase ml-1">E-mail Atual</label>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="w-4 h-4 text-gray-500" />
                                </div>
                                <input className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-[#FF8A96] focus:border-[#FF8A96] text-sm py-3 pl-10 pr-3 outline-none" type="email" value={settings.email} onChange={(e) => updateSettings({ email: e.target.value })} />
                            </div>
                            <Button variant="outline" className="border-gray-200 dark:border-gray-600 rounded-xl px-6 h-[46px]">
                                Alterar
                            </Button>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 ml-1">Para alterar seu e-mail, enviaremos um código de verificação para o endereço atual.</p>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-[#FF8A96]" />
                    Segurança da Senha
                </h3>
                <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-gray-200 dark:border-gray-600 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-500 uppercase ml-1">Senha Atual</label>
                            <input className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-[#FF8A96] focus:border-[#FF8A96] text-sm p-3 outline-none" placeholder="••••••••" type="password" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-500 uppercase ml-1">Nova Senha</label>
                            <input className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-[#FF8A96] focus:border-[#FF8A96] text-sm p-3 outline-none" placeholder="••••••••" type="password" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-500 uppercase ml-1">Confirmar Nova Senha</label>
                            <input className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-[#FF8A96] focus:border-[#FF8A96] text-sm p-3 outline-none" placeholder="••••••••" type="password" />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-600 text-xs text-gray-500 dark:text-gray-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div> Min. 8 caracteres
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-600 text-xs text-gray-500 dark:text-gray-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div> 1 Número
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-600 text-xs text-gray-500 dark:text-gray-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div> 1 Símbolo especial
                        </span>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#FF8A96]" />
                    Segurança Adicional
                </h3>
                <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-gray-200 dark:border-gray-600 shadow-sm flex items-center justify-between">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                            <span className="material-icons-round text-blue-500">phonelink_lock</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-white text-md">Autenticação em Duas Etapas (2FA)</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 max-w-md">Adicione uma camada extra de segurança à sua conta exigindo um código de verificação ao fazer login em novos dispositivos.</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input className="sr-only peer" type="checkbox" value="" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#FF8A96]"></div>
                    </label>
                </div>
            </div>
        </div>
    );
}

function StepPreferencias() {
    const { settings, updateSettings } = useSettings();
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-8">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-[#FF8A96]" />
                        Notificações
                    </h3>
                    <div className="bg-white dark:bg-gray-700 rounded-2xl p-2 border border-gray-200 dark:border-gray-600 shadow-sm">
                        <label className="flex items-start gap-3 p-4 cursor-pointer group">
                            <div className="relative flex items-center w-5 h-5 mt-0.5">
                                <input type="checkbox" className="peer appearance-none w-5 h-5 border-2 border-gray-300 dark:border-gray-500 rounded checked:bg-[#FF8A96] checked:border-transparent transition-all cursor-pointer" checked={settings.notificacoesPedidos} onChange={(e) => updateSettings({ notificacoesPedidos: e.target.checked })} />
                                <CheckCircle className="absolute inset-0 w-5 h-5 text-white pointer-events-none opacity-0 peer-checked:opacity-100" />
                            </div>
                            <div className="flex-1">
                                <span className="block font-bold text-gray-800 dark:text-white">Pedidos Novos</span>
                                <span className="block text-xs text-gray-500 dark:text-gray-500">Receba um alerta sempre que um novo pedido for criado.</span>
                            </div>
                        </label>
                        <div className="h-px bg-gray-100 dark:bg-gray-600 w-full"></div>
                        <label className="flex items-start gap-3 p-4 cursor-pointer group">
                            <div className="relative flex items-center w-5 h-5 mt-0.5">
                                <input type="checkbox" className="peer appearance-none w-5 h-5 border-2 border-gray-300 dark:border-gray-500 rounded checked:bg-[#FF8A96] checked:border-transparent transition-all cursor-pointer" checked={settings.notificacoesEstoque} onChange={(e) => updateSettings({ notificacoesEstoque: e.target.checked })} />
                                <CheckCircle className="absolute inset-0 w-5 h-5 text-white pointer-events-none opacity-0 peer-checked:opacity-100" />
                            </div>
                            <div className="flex-1">
                                <span className="block font-bold text-gray-800 dark:text-white">Lembretes de Estoque</span>
                                <span className="block text-xs text-gray-500 dark:text-gray-500">Alertas quando ingredientes estiverem acabando.</span>
                            </div>
                        </label>
                        <div className="h-px bg-gray-100 dark:bg-gray-600 w-full"></div>
                        <label className="flex items-start gap-3 p-4 cursor-pointer group">
                            <div className="relative flex items-center w-5 h-5 mt-0.5">
                                <input type="checkbox" className="peer appearance-none w-5 h-5 border-2 border-gray-300 dark:border-gray-500 rounded checked:bg-[#FF8A96] checked:border-transparent transition-all cursor-pointer" checked={settings.notificacoesResumos} onChange={(e) => updateSettings({ notificacoesResumos: e.target.checked })} />
                                <CheckCircle className="absolute inset-0 w-5 h-5 text-white pointer-events-none opacity-0 peer-checked:opacity-100" />
                            </div>
                            <div className="flex-1">
                                <span className="block font-bold text-gray-800 dark:text-white">Resumos Financeiros</span>
                                <span className="block text-xs text-gray-500 dark:text-gray-500">Relatório semanal de lucros e despesas.</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-[#FF8A96]" />
                        Integrações
                    </h3>
                    <div className="bg-white dark:bg-gray-700 rounded-2xl p-2 border border-gray-200 dark:border-gray-600 shadow-sm">
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-6 h-6" />
                                </div>
                                <div>
                                    <span className="block font-bold text-gray-800 dark:text-white">WhatsApp</span>
                                    <span className="block text-xs text-gray-500 dark:text-gray-500">Enviar mensagens automáticas</span>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input className="sr-only peer" type="checkbox" checked={settings.whatsapp} onChange={(e) => updateSettings({ whatsapp: e.target.checked })} />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#2ECC71]"></div>
                            </label>
                        </div>
                        <div className="h-px bg-gray-100 dark:bg-gray-600 w-full ml-14"></div>
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                    <span className="material-icons-round text-blue-500 text-xl">event</span>
                                </div>
                                <div>
                                    <span className="block font-bold text-gray-800 dark:text-white">Google Calendar</span>
                                    <span className="block text-xs text-gray-500 dark:text-gray-500">Sincronizar entregas</span>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input className="sr-only peer" type="checkbox" checked={settings.googleCalendar} onChange={(e) => updateSettings({ googleCalendar: e.target.checked })} />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#2ECC71]"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-[#FF8A96]" />
                        Idioma e Região
                    </h3>
                    <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-gray-200 dark:border-gray-600 shadow-sm space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-500 uppercase ml-1">Idioma do Sistema</label>
                            <div className="relative">
                                <select className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-[#FF8A96] focus:border-[#FF8A96] text-sm p-3 appearance-none outline-none" value={settings.idioma} onChange={(e) => updateSettings({ idioma: e.target.value })}>
                                    <option value="Português (Brasil)">Português (Brasil)</option>
                                    <option value="English (US)">English (US)</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                    <span className="material-icons-round text-sm">expand_more</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-500 uppercase ml-1">Moeda Padrão</label>
                            <div className="relative">
                                <select className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-[#FF8A96] focus:border-[#FF8A96] text-sm p-3 appearance-none outline-none" value={settings.moeda} onChange={(e) => updateSettings({ moeda: e.target.value })}>
                                    <option value="BRL">BRL - Real Brasileiro (R$)</option>
                                    <option value="USD">USD - Dólar Americano ($)</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                    <span className="material-icons-round text-sm">expand_more</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <SettingsIcon className="w-5 h-5 text-[#FF8A96]" />
                        Outros Ajustes
                    </h3>
                    <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-gray-200 dark:border-gray-600 shadow-sm">
                        <p className="text-sm text-gray-600 dark:text-gray-500 mb-4">Essas configurações podem ser alteradas a qualquer momento no painel de controle principal.</p>
                        <button className="text-[#FF8A96] hover:text-red-400 transition-colors text-sm font-bold flex items-center gap-1 group">
                            <span className="material-icons-round text-lg group-hover:scale-110 transition-transform">info</span>
                            Saiba mais sobre personalização
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
