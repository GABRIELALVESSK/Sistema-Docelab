import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Pedido {
  id: string;
  cliente: string;
  telefone?: string;
  produto: string;
  quantidade: number;
  preco: number;
  itens?: { produto: string; quantidade: number; preco: number }[];
  data: Date;
  status: "pendente" | "em_producao" | "pronto" | "entregue";
  imagem_inspiracao?: string | null;
  notas?: string;
  criadoEm?: Date;
}

interface PedidoCardProps {
  pedido: Pedido;
  onView: () => void;
  onPayment: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: Pedido["status"]) => void;
}

const statusLabels = {
  pendente: "Pendente",
  em_producao: "Produção",
  pronto: "Pronto",
  entregue: "Entregue",
};

const statusColors = {
  pendente: "bg-amber-50 text-amber-600 border-amber-100",
  em_producao: "bg-blue-50 text-blue-600 border-blue-100",
  pronto: "bg-emerald-50 text-emerald-600 border-emerald-100",
  entregue: "bg-green-50 text-green-600 border-green-100",
};

const statusDotColors = {
  pendente: "bg-amber-400",
  em_producao: "bg-blue-400",
  pronto: "bg-emerald-400",
  entregue: "bg-green-500",
};

export function PedidoCard({ pedido, onView, onPayment, onEdit, onDelete, onStatusChange }: PedidoCardProps) {
  const totalItensCount = pedido.itens ? pedido.itens.reduce((acc, i) => acc + i.quantidade, 0) : pedido.quantidade;
  const valorTotal = pedido.itens ? pedido.itens.reduce((acc, i) => acc + (i.quantidade * i.preco), 0) : (pedido.quantidade * pedido.preco);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="bg-white dark:bg-card-dark rounded-2xl p-6 shadow-soft hover:shadow-md transition-all duration-300 border border-gray-50 dark:border-gray-700 group mb-4">
      {/* Top Section: Client & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-50 dark:border-gray-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 text-sm font-bold border-2 border-white dark:border-gray-700 shadow-sm">
            {getInitials(pedido.cliente)}
          </div>
          <div>
            <h4 className="text-sm font-bold text-secondary dark:text-white tracking-tight">{pedido.cliente}</h4>
            <div className="flex items-center gap-2 mt-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    "flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-colors cursor-pointer",
                    statusColors[pedido.status]
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", statusDotColors[pedido.status])} />
                    {statusLabels[pedido.status]}
                    <ChevronDown className="w-2.5 h-2.5 opacity-50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="rounded-xl shadow-lg border-gray-100">
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <DropdownMenuItem
                      key={value}
                      onClick={() => onStatusChange(value as Pedido["status"])}
                      className={cn(
                        "rounded-lg font-semibold text-xs",
                        pedido.status === value && "bg-gray-50"
                      )}
                    >
                      <span className={cn("w-2 h-2 rounded-full mr-2", statusDotColors[value as Pedido["status"]])} />
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          {pedido.telefone && (
            <button
              onClick={() => window.open(`https://wa.me/55${pedido.telefone?.replace(/\D/g, '')}`, '_blank')}
              className="w-8 h-8 rounded-full bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors"
              title="WhatsApp"
            >
              <span className="material-icons-round text-sm">chat</span>
            </button>
          )}
          <button
            onClick={onView}
            className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors"
            title="Ver Detalhes"
          >
            <span className="material-icons-round text-sm">visibility</span>
          </button>
          <button
            onClick={onPayment}
            className="w-8 h-8 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors"
            title="Pagamento"
          >
            <span className="material-icons-round text-sm">credit_card</span>
          </button>
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors"
            title="Editar"
          >
            <span className="material-icons-round text-sm">edit</span>
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
            title="Excluir"
          >
            <span className="material-icons-round text-sm">delete_outline</span>
          </button>
        </div>
      </div>

      {/* Bottom Section: Order Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 dark:border-gray-700 shadow-sm bg-gray-50 flex items-center justify-center">
          {pedido.imagem_inspiracao ? (
            <img src={pedido.imagem_inspiracao} alt="Avatar" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <span className="material-icons-round text-gray-300 text-2xl">image</span>
          )}
        </div>
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Produto</p>
            <p className="text-xs font-semibold text-secondary dark:text-white line-clamp-1">{pedido.produto}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Contato</p>
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <span className="material-icons-round text-[12px]">call</span>
              <p className="text-xs font-medium">{pedido.telefone || "Não informado"}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Qtd</p>
            <span className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded text-xs font-black border border-gray-200 dark:border-gray-700 leading-none">
              {totalItensCount} un
            </span>
          </div>
          <div className="text-right sm:text-left">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Total</p>
            <p className="text-sm font-black text-secondary dark:text-white tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
