import { useLocation } from "react-router-dom";

const pageTitles: Record<string, string> = {
  "/estoque": "Estoque",
  "/lista-compras": "Lista de Compras",
  "/fotos-entregas": "Fotos e Entregas",
  "/calculadora-cores": "Calculadora de Cores",
  "/assistente-ia": "Assistente IA",
  "/receitas": "Receitas",
  "/comunidade": "Comunidade",
};

export default function PlaceholderPage() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "Página";

  return (
    <>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-foreground mb-4">{title}</h1>
        <div className="bg-card rounded-xl border border-border/50 p-12 text-center">
          <p className="text-muted-foreground">
            Esta página está em desenvolvimento.
          </p>
        </div>
      </div>
    </>
  );
}
