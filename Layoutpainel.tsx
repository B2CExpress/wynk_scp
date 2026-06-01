// Exemplo conceitual no layout do servidor
import React from 'react';

// Certifique-se de que as variáveis 'tenantAtual' e 'user' estejam tipadas e acessíveis aqui
interface LayoutPainelProps {
  tenantAtual: {
    cor_primaria: string;
    cor_secundaria: string;
  };
  user: any; // Substitua pelo tipo correto do seu usuário
}

export default function LayoutPainel({ tenantAtual, user }: LayoutPainelProps) {
  return (
    <div
      className="flex min-h-screen bg-gray-100"
      style={{
        '--color-primary': tenantAtual.cor_primaria,
        '--color-secondary': tenantAtual.cor_secundaria,
      } as React.CSSProperties}
    >
      <Sidebar user={user} />
      
      {/* O restante do seu conteúdo vai aqui */}
      
    </div>
  );
}
