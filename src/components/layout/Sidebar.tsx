import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSettings } from "../../contexts/SettingsContext";
import { useAuth } from "../../contexts/AuthContext";

const menuItems = [
  { icon: "dashboard", label: "Painel", path: "/" },
  { icon: "shopping_bag", label: "Pedidos", path: "/pedidos" },
  { icon: "people", label: "Clientes", path: "/clientes" },
  { icon: "request_quote", label: "Orçamentos", path: "/orcamentos" },
  { icon: "menu_book", label: "Receitas", path: "/receitas" },
  { icon: "inventory_2", label: "Estoque", path: "/estoque" },
  { icon: "analytics", label: "Finanças", path: "/financas" },
  { icon: "point_of_sale", label: "Caixa", path: "/caixa" },
  { icon: "shopping_cart", label: "Lista de Compras", path: "/lista-compras" },
  { icon: "settings", label: "Configurações", path: "/configuracoes" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="h-full flex flex-col bg-transparent pr-6 font-display overflow-y-auto custom-scrollbar">
      <div className="flex flex-col h-full min-h-max pb-8">
        {/* Logo Section */}
        <div className="flex items-center gap-2 mb-8 pl-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-[#F87171] flex items-center justify-center text-white font-extrabold text-sm shadow-sm transition-transform hover:scale-105 cursor-pointer">
            D
          </div>
          <h1 className="text-2xl font-bold text-[#1E1E2F] tracking-tighter">
            Doce<span className="text-[#F87171]">Lab</span>.
          </h1>
        </div>

        {/* Profile Card Section */}
        <div className="flex flex-col items-center mb-8 shrink-0">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full p-1 border-2 border-dashed border-[#F87171]/50 group cursor-pointer transition-all hover:border-[#F87171]">
              <img
                alt={settings.nome}
                className="w-full h-full rounded-full object-cover shadow-sm transition-all"
                src={settings.fotoPerfil}
              />
            </div>
          </div>
          <h3 className="text-lg font-black text-[#1E1E2F] tracking-tight">{settings.nome}</h3>
          <div className="flex items-center gap-1 mt-2 bg-white px-3 py-1 rounded-full shadow-soft">
            <span className="material-icons-round text-yellow-500 text-sm">star</span>
            <span className="text-xs font-black text-gray-500">4.9</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all duration-300 group",
                  isActive
                    ? "text-[#F87171] bg-white shadow-soft"
                    : "text-gray-400 hover:text-[#1E1E2F] hover:bg-white/50"
                )}
              >
                <span className={cn(
                  "material-icons-round transition-all duration-300",
                  isActive ? "text-[#F87171]" : "text-gray-300 group-hover:text-gray-500"
                )}>
                  {item.icon}
                </span>
                <span className="tracking-tight uppercase">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="mt-8 shrink-0">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl text-rose-500 font-black text-xs hover:bg-rose-50 transition-all duration-300 group">
            <span className="material-icons-round transition-transform group-hover:-translate-x-1">
              logout
            </span>
            <span className="tracking-tight uppercase">Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
