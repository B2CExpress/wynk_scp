import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { TenantsPage } from './pages/tenants/TenantsPage.tsx';

// Sem react-router ainda (SPA single-file). Seleção de view por path: `/admin/tenants`
// abre o painel do Superadmin (SPEC-20260603-1149); qualquer outro path mantém o
// backoffice tenant-scoped. Substituir por roteamento real quando for introduzido.
const isSuperadminView = window.location.pathname.startsWith('/admin/tenants');

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isSuperadminView ? <TenantsPage /> : <App />}</StrictMode>,
);
