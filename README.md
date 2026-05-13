# wynk-scp

Plataforma multitenant para sites de shopping centers — um monorepo gerenciado por **npm workspaces** com três apps que sobem juntas: uma API (backend), um site público por tenant (portal) e um painel de gestão (backoffice). Banco e cache rodam em containers locais.

> Este README é a porta de entrada para **subir o ambiente local**. Para entender a arquitetura, processos internos e estado vivo de cada área, leia [`docs/CLAUDE.md`](docs/CLAUDE.md) e [`docs/RULES.md`](docs/RULES.md).

---

## Sumário

1. [O que é](#o-que-é)
2. [Pré-requisitos](#pré-requisitos)
3. [Setup rápido (atalho)](#setup-rápido-atalho)
4. [Setup Linux (Ubuntu/Debian)](#setup-linux-ubuntudebian)
5. [Setup Windows (via WSL2)](#setup-windows-via-wsl2)
6. [Primeira execução](#primeira-execução)
7. [Comandos do dia-a-dia](#comandos-do-dia-a-dia)
8. [Estrutura do monorepo](#estrutura-do-monorepo)
9. [Troubleshooting](#troubleshooting)
10. [Saiba mais](#saiba-mais)

---

## O que é

- **Backend** (`backend/`): API REST em **Express 4** + **TypeORM 0.3** + TypeScript. Resolve o tenant pelo `host` da requisição, mantém o contexto via `AsyncLocalStorage` e usa um schema dedicado `scp` no Postgres.
- **Portal** (`portal/`): site público de cada shopping em **Next.js (App Router)** + TypeScript. Identidade visual ("flavor") versionada em git por tenant.
- **Backoffice** (`backoffice/`): painel de gestão em **Vite + React** + TypeScript (SPA logada).
- **Infra local**: PostgreSQL 15 + Redis 7 via **Docker Compose** (portas no host: `5435` e `6382`).

---

## Pré-requisitos

Antes de qualquer setup, instale o que está abaixo. Os links são oficiais.

| Ferramenta            | O que é                                            | Pra que serve no projeto                                                       | Versão mínima | Como instalar                                                                  |
| --------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------ | ------------- | ------------------------------------------------------------------------------ |
| **Node.js**           | Runtime JavaScript no servidor                     | Roda o backend (Express) e o build/dev-server do portal e do backoffice         | **22+**       | https://nodejs.org/en/download (LTS) — ou via [nvm](https://github.com/nvm-sh/nvm) |
| **npm**               | Gerenciador de pacotes do Node                     | Instala dependências dos 3 workspaces e dispara scripts (`dev`, `test`, `lint`) | **10+**       | Já vem incluso com o Node 22                                                   |
| **Git**               | Controle de versão                                 | Clonar o repo e interagir com o GitHub                                          | 2.30+         | https://git-scm.com/downloads                                                  |
| **Docker Engine**     | Plataforma de containers                           | Sobe Postgres 15 e Redis 7 locais sem instalar nada direto no host              | 24+           | Linux: https://docs.docker.com/engine/install/ &nbsp;·&nbsp; Windows/Mac: https://www.docker.com/products/docker-desktop/ |
| **Docker Compose v2** | CLI `docker compose` (orquestra `docker-compose.yml`) | Sobe Postgres + Redis com um comando só                                       | v2            | Vem com o Docker Desktop. No Linux: `apt install docker-compose-plugin`        |
| **WSL2 + Ubuntu**     | Linux rodando dentro do Windows (só Windows)        | Caminho oficial pra rodar este monorepo em Windows — todo o resto do setup ocorre **dentro** do WSL | WSL 2 + Ubuntu 22.04+ | `wsl --install` no **PowerShell como Administrador** (requer Windows 10 build 2004+ ou Windows 11) |

> **macOS:** não é caminho oficialmente testado hoje. Em tese funciona seguindo o "Setup Linux" com **Docker Desktop for Mac** e Node via [nvm](https://github.com/nvm-sh/nvm) ou [Homebrew](https://brew.sh/). Se algo quebrar, abra uma SPEC documentando o caminho.

---

## Setup rápido (atalho)

Se você já tem **todos os pré-requisitos** instalados e só quer subir o ambiente:

### Linux / WSL2

```bash
./setup.sh
# ou, com seed de tenants de exemplo:
./setup.sh --seed
```

### Windows (cmd, na raiz do repo)

```cmd
setup.bat
:: ou, com seed:
setup.bat --seed
```

Os scripts são **idempotentes** (rodar duas vezes não quebra nada) e cobrem os passos 2–9 do "Setup Linux" abaixo: `npm install`, copiar `.env.example` → `.env` (se faltar), `docker compose up -d`, esperar Postgres/Redis ficarem `healthy`, e rodar `db:setup` (schema + migrations) no backend. Opcionalmente populam tenants de exemplo com `--seed`.

> **Os scripts não instalam pré-requisitos** (Node, Docker, Git). Só verificam que estão presentes — se faltar algum, falham com instrução clara. Para instalar pré-requisitos, siga a tabela acima.
>
> No Windows, `setup.bat` apenas verifica WSL2 + Docker Desktop e dispara o `setup.sh` **dentro do WSL** (o setup real roda no Linux).

Se preferir entender cada passo manualmente, siga o passo-a-passo abaixo.

---

## Setup Linux (Ubuntu/Debian)

Caminho dourado — testado em Ubuntu 22.04+. Em **Fedora** ou **Arch**, os comandos `npm` e `docker compose` são iguais; só a instalação de Node e Docker varia (siga os links da tabela acima).

```bash
# 1. Clonar o repo
git clone <url-do-repo> wynk-scp
cd wynk-scp

# 2. Instalar dependências de todos os workspaces (backend, portal, backoffice)
#    npm workspaces resolve e hoista automaticamente
npm install

# 3. Variáveis de ambiente — backend
cp backend/.env.example backend/.env
#    (os defaults funcionam; só edite se quiser trocar credenciais/portas)

# 4. Variáveis de ambiente — portal
cp portal/.env.example portal/.env

# 5. Subir Postgres 15 + Redis 7 em containers
#    Portas no host: 5435 (Postgres) e 6382 (Redis) — escolhidas pra não conflitar
#    com o monorepo wynk_ecommerce, que usa 5434/6381.
docker compose up -d

# 6. Conferir que ambos subiram healthy (pode levar uns 5–15 s)
docker compose ps

# 7. Bootstrap do banco: cria o schema `scp` e aplica todas as migrations
#    (NÃO use `migration:run` direto na primeira vez — veja Troubleshooting #4)
npm run db:setup -w backend

# 8. (Opcional) Popular tenants de exemplo a partir de seeds/tenants.json
npm run seed -w backend

# 9. Subir o backend em watch mode
npm run dev -w backend
# Backend escutando em http://localhost:3000
```

A partir daqui, pule para [Primeira execução](#primeira-execução) para subir portal e backoffice.

---

## Setup Windows (via WSL2)

Setup oficial usa **WSL2** (Windows Subsystem for Linux v2) — o repo, scripts e Docker rodam **dentro de uma distro Linux**. Windows nativo não é suportado.

### 1. Instalar o WSL2 + Ubuntu

Abra o **PowerShell como Administrador** e rode:

```powershell
wsl --install
```

Isso instala o WSL2 e a distro Ubuntu por padrão. Reinicie o Windows quando for solicitado. Abra **"Ubuntu"** pelo menu Iniciar e crie um usuário/senha do Linux na primeira execução.

> Mais detalhes em https://learn.microsoft.com/windows/wsl/install.

### 2. Instalar o Docker Desktop com integração WSL2

1. Baixe e instale o **Docker Desktop**: https://www.docker.com/products/docker-desktop/
2. Em **Settings → General**, marque **"Use the WSL 2 based engine"**.
3. Em **Settings → Resources → WSL Integration**, marque **"Enable integration with my default WSL distro"** (Ubuntu).

> Docker Desktop tem **licença comercial** para empresas com **>250 funcionários OU >US$ 10M em receita** ([Docker Subscription Service Agreement](https://www.docker.com/legal/docker-subscription-service-agreement)). Para uso pessoal e empresas menores, é gratuito. Se precisar de alternativa free corporativa, abra uma SPEC propondo um caminho (ex.: Docker Engine via `apt` dentro do WSL com `systemd` habilitado).

### 3. Dentro do Ubuntu (WSL), instalar Node 22 e Git

Abra o terminal do Ubuntu:

```bash
# Atualizar pacotes
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 22 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Confirmar versões
node --version   # deve mostrar v22.x.x
npm --version    # deve mostrar 10.x.x ou superior

# Git já vem com Ubuntu, mas confirme
git --version
```

> Como alternativa ao NodeSource, você pode usar [nvm](https://github.com/nvm-sh/nvm).

### 4. Clonar o repo dentro do WSL (não em `/mnt/c/`)

**Importante:** clone no filesystem **do WSL** (`~/`), **não** no Windows (`/mnt/c/...`). I/O entre WSL e o Windows é ~10× mais lento e quebra alguns hooks de file-watcher.

```bash
cd ~
git clone <url-do-repo> wynk-scp
cd wynk-scp
```

### 5. A partir daqui, siga o "Setup Linux" do passo 2 em diante

Todos os comandos `npm` e `docker compose` rodam **dentro do Ubuntu do WSL**. Você pode editar o código com o **VS Code** no Windows usando a extensão [WSL](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl) — rode `code .` dentro do `wynk-scp` no terminal Ubuntu e ele abre o VS Code no Windows conectado ao WSL.

---

## Primeira execução

Os três apps podem rodar simultaneamente em terminais separados:

```bash
# Terminal 1 — backend (API Express)
npm run dev -w backend
# → http://localhost:3000

# Terminal 2 — portal (site público Next.js)
npm run dev -w portal
# → http://localhost:3001 (porta padrão do Next dev)

# Terminal 3 — backoffice (painel Vite + React)
npm run dev -w backoffice
# → http://localhost:5173 (porta padrão do Vite)
```

Como confirmar que tudo subiu:

- **Postgres + Redis:** `docker compose ps` mostra `scp_postgres` e `scp_redis` como `healthy`.
- **Backend:** `curl http://localhost:3000/health` retorna `200 OK`.
- **Portal:** abrir `http://localhost:3001` no navegador exibe a página inicial do shopping default (`shopping-x`).
- **Backoffice:** abrir `http://localhost:5173` exibe a tela de login do painel.

---

## Comandos do dia-a-dia

Todos rodam **a partir da raiz** do repositório.

| Comando                                                       | O que faz                                                                |
| ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `npm install`                                                 | Instala dependências de todos os workspaces                              |
| `npm run dev -w <app>`                                        | Sobe `<app>` em watch mode (backend / portal / backoffice)               |
| `npm run build -w <app>`                                      | Build de produção do app                                                 |
| `npm run lint`                                                | ESLint em todos os workspaces                                            |
| `npm run typecheck`                                           | TypeScript `--noEmit` em todos                                           |
| `npm test`                                                    | Jest em todos os workspaces                                              |
| `npm run format`                                              | Prettier `--write` em todo o repo                                        |
| `npm run format:check`                                        | Prettier `--check` (mesma checagem que a CI roda)                        |
| `npm run validate:flavors`                                    | Confere mapeamento `seeds/tenants.json` ↔ `portal/public/flavors/<slug>/` |
| `npm run prepare:schema -w backend`                           | Cria o schema `scp` no Postgres (idempotente)                            |
| `npm run db:setup -w backend`                                 | `prepare:schema` + `migration:run` (use **na primeira vez**)              |
| `npm run migration:run -w backend`                            | Aplica migrations pendentes                                              |
| `npm run migration:revert -w backend`                         | Desfaz a última migration aplicada                                       |
| `npm run migration:create -w backend -- <NomePascalCase>`     | Cria um arquivo vazio de migration                                       |
| `npm run seed -w backend`                                     | Popula tenants de exemplo a partir de `seeds/tenants.json`               |
| `docker compose up -d`                                        | Sobe Postgres + Redis em background                                      |
| `docker compose down`                                         | Para os containers (**preserva** os dados)                               |
| `docker compose down -v`                                      | Para e **apaga volumes** (reset total do banco e do Redis)               |
| `docker compose logs -f postgres`                             | Acompanha logs do Postgres                                               |

---

## Estrutura do monorepo

```
wynk-scp/
├── backend/                # API Express + TypeORM (Node 22+)
├── portal/                 # Site público multitenant (Next.js App Router)
├── backoffice/             # Painel de gestão (Vite + React)
├── docs/                   # Documentação SPEC-driven v2 (orientada à IA)
│   ├── CLAUDE.md           # orientações da plataforma
│   ├── RULES.md            # processo SPEC (fonte da verdade)
│   ├── INDEX.md            # gerado pelo CI a partir de features/*
│   ├── features/           # estado vivo por área
│   ├── active/             # SPECs em andamento (só em branches)
│   ├── future/             # SPECs planejadas
│   ├── archive/            # SPECs concluídas
│   └── discard/            # SPECs abandonadas (com justificativa)
├── seeds/                  # Dados de seed (ex.: seeds/tenants.json)
├── scripts/                # Scripts auxiliares (validação de flavors, lint de docs)
├── docker-compose.yml      # Postgres 15 + Redis 7 (portas host: 5435 / 6382)
├── setup.sh                # Atalho idempotente de setup local (Linux/WSL2)
├── setup.bat               # Atalho para Windows (verifica WSL2 + Docker, dispara setup.sh no WSL)
└── package.json            # npm workspaces (backend, portal, backoffice)
```

---

## Troubleshooting

Formato: **Sintoma → Causa → Fix**.

### 1. TypeScript reclama de tipos do Express incompatíveis após `npm install`

- **Causa:** dependência transitiva (`@types/cookie-parser`) puxa `@types/express` **5.x**; o projeto usa 4.x.
- **Fix:** o `overrides` no `package.json` raiz já força a versão certa. Se você editou `node_modules/` ou `package-lock.json` manualmente:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### 2. Jest falha com `Cannot find module 'safer-buffer'`

- **Causa:** dedup agressiva do npm tira `safer-buffer` (transitivo de `iconv-lite ← body-parser ← express`) depois dos `overrides`.
- **Fix:** já está listado como dep direta de `backend` (`safer-buffer ^2.1.2`). Se sumiu, rode `npm install --workspaces`.

### 3. Jest reclama `Cannot find module X` para módulos hoisted na raiz

- **Causa:** npm workspaces hoista deps comuns para `<root>/node_modules`; o Jest não sobe a árvore como o Node faz normalmente.
- **Fix:** já tratado em `backend/jest.config.js` com `moduleDirectories: ['node_modules', '<rootDir>/../node_modules']`. Se você criou um `jest.config.js` novo em outro workspace, adicione a mesma linha.

### 4. `migration:run` falha na **primeira** vez com erro de schema inexistente

- **Causa:** o CLI do TypeORM tenta criar a tabela `migrations` no schema `scp` antes do schema existir.
- **Fix:** use **`npm run db:setup -w backend`** na primeira vez (ele roda `scripts/ensure-schema.ts` primeiro, criando o schema via cliente `pg` cru). Depois, `migration:run` funciona normalmente.

### 5. `typeorm-ts-node-commonjs` falha procurando `ts-node`

- **Causa:** o binário do TypeORM busca `ts-node` a partir da raiz (porque o pacote `typeorm` foi hoisted), não dentro do workspace.
- **Fix:** `ts-node` já está em `devDependencies` da raiz. Se sumiu: `npm install ts-node -D` (na raiz, não no backend).

### 6. TypeScript reclama de `baseUrl` ao criar `tsconfig` novo

- **Causa:** versões recentes de TypeScript depreciaram `baseUrl`; paths não-relativos sem `./` falham.
- **Fix:** sempre prefixe paths com `./` ou `../` no `paths` do `tsconfig.json`.

### 7. `docker compose up` falha com erro de porta em uso (5435 ou 6382)

- **Causa:** outro projeto (geralmente `wynk_ecommerce`, que usa 5434/6381) ou um Postgres/Redis local seu já está nessas portas.
- **Fix:** o `docker-compose.yml` aceita override por env var:
  ```bash
  DB_PORT_HOST=5437 REDIS_PORT_HOST=6384 docker compose up -d
  ```
  Lembre de ajustar `backend/.env` (`DB_PORT`, `REDIS_PORT`) com os mesmos valores.

### 8. (Windows) Performance horrível e file-watcher não detecta mudanças

- **Causa:** clonou o repo em `/mnt/c/...` (filesystem do Windows visto do WSL). I/O cross-FS é ~10× mais lento e quebra hooks de inotify.
- **Fix:** mova o repo para o filesystem do WSL:
  ```bash
  mv /mnt/c/Users/<você>/wynk-scp ~/wynk-scp
  cd ~/wynk-scp
  ```

---

## Saiba mais

- [`docs/CLAUDE.md`](docs/CLAUDE.md) — orientações da plataforma e do processo SPEC-driven
- [`docs/RULES.md`](docs/RULES.md) — fonte da verdade do processo de documentação
- [`docs/features/`](docs/features/) — estado vivo de cada área (`auth`, `infra-base`, `stores-public-api`, `tenant-resolution`, `theme-system`)
- [`docker-compose.yml`](docker-compose.yml) — configuração dos serviços locais
- [`package.json`](package.json) (raiz) — scripts globais e workspaces
- [`backend/package.json`](backend/package.json) — scripts do backend (db, migrations, dev, test)
