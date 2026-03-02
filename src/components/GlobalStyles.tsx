import React from 'react';
import { useSettings } from '../contexts/SettingsContext';

const THEME_COLORS: Record<string, { primary: string, accent: string }> = {
    pink: { primary: '#FF8A96', accent: '#FF5C5C' },
    blue: { primary: '#3b82f6', accent: '#2563eb' },
    green: { primary: '#10b981', accent: '#059669' },
    purple: { primary: '#a855f7', accent: '#9333ea' },
    orange: { primary: '#f97316', accent: '#ea580c' },
};

export const GlobalStyles = () => {
    const { settings } = useSettings();
    const colors = THEME_COLORS[settings.corSistema] || THEME_COLORS.pink;
    const fontSize = settings.densidade === 'compact' ? '14px' : '16px';

    return (
        <style>
            {`
            html {
                font-size: ${fontSize};
            }

            :root {
                --theme-primary: ${colors.primary};
                --theme-accent: ${colors.accent};
            }

            /* Overrides for #FF8A96 (Primary) */
            .text-\\[\\#FF8A96\\] { color: var(--theme-primary) !important; }
            .bg-\\[\\#FF8A96\\] { background-color: var(--theme-primary) !important; }
            .border-\\[\\#FF8A96\\] { border-color: var(--theme-primary) !important; }
            .ring-\\[\\#FF8A96\\] { --tw-ring-color: var(--theme-primary) !important; }
            .hover\\:bg-\\[\\#FF8A96\\]:hover { background-color: var(--theme-primary) !important; }
            .hover\\:text-\\[\\#FF8A96\\]:hover { color: var(--theme-primary) !important; }
            .hover\\:border-\\[\\#FF8A96\\]:hover { border-color: var(--theme-primary) !important; }
            .focus\\:ring-\\[\\#FF8A96\\]:focus { --tw-ring-color: var(--theme-primary) !important; }
            .focus\\:border-\\[\\#FF8A96\\]:focus { border-color: var(--theme-primary) !important; }
            .peer-checked\\:border-\\[\\#FF8A96\\]:checked ~ * { border-color: var(--theme-primary) !important; }
            .peer-checked\\:ring-\\[\\#FF8A96\\]:checked ~ * { --tw-ring-color: var(--theme-primary) !important; }
            .peer-checked\\:bg-\\[\\#FF8A96\\]:checked ~ * { background-color: var(--theme-primary) !important; }
            .checked\\:bg-\\[\\#FF8A96\\]:checked { background-color: var(--theme-primary) !important; }
            .checked\\:border-\\[\\#FF8A96\\]:checked { border-color:  var(--theme-primary) !important; }

            /* Overrides for #FF5C5C (Accent) */
            .text-\\[\\#FF5C5C\\] { color: var(--theme-accent) !important; }
            .bg-\\[\\#FF5C5C\\] { background-color: var(--theme-accent) !important; }
            .border-\\[\\#FF5C5C\\] { border-color: var(--theme-accent) !important; }
            `}
        </style>
    );
};
