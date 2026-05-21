import { pgTable, serial, text } from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────────────────────────
// TABELA TEMPORÁRIA — usada apenas para validar o setup do Drizzle.
// REMOVER após rodar db:studio e confirmar que a tabela aparece.
// ─────────────────────────────────────────────────────────────────
export const _test = pgTable("_test", {
  id: serial("id").primaryKey(),
  name: text("name"),
});