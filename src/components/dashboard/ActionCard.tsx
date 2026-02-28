import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ActionCardProps {
  icon: ReactNode;
  iconBg: string;
  label: string;
  onClick?: () => void;
  className?: string;
}

export function ActionCard({ icon, iconBg, label, onClick, className }: ActionCardProps) {
  return (
    <button onClick={onClick} className={cn("action-card animate-fade-in", className)}>
      <div className={cn("action-icon", iconBg)}>
        {icon}
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </button>
  );
}
