export async function getCurrentTenant() {
  return {
    id: "default",
    name: "Loja Demo",
    meta_title: "Loja Demo",
    meta_description: "Descrição da loja de demonstração",
  };
}

export default getCurrentTenant;