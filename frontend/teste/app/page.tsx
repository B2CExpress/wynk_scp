export default function HomePage() {
  return (
    <main className="min-h-screen bg-background p-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-5xl font-bold text-primary font-secondary">White-label funcionando</h1>

        <p className="text-lg text-text font-primary">
          Esta página utiliza CSS Variables vindas do tenant atual. O mesmo código muda
          completamente de visual dependendo do shopping ativo.
        </p>

        <div className="rounded-xl border border-primary/20 bg-accent p-6">
          <h2 className="mb-3 text-2xl font-semibold text-primary">Tema atual</h2>

          <p className="mb-5 text-text">
            As cores e fontes estão sendo carregadas do banco via getCurrentTenant().
          </p>

          <button className="rounded-lg bg-secondary px-5 py-3 font-medium text-white transition-opacity hover:opacity-90">
            Botão do tenant
          </button>
        </div>
      </div>
    </main>
  );
}
