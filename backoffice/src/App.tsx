import { useEffect, useMemo, useState } from 'react';
import './App.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

type Tab = 'stores' | 'categories';

interface Session {
  tenantSlug: string;
  tenantHost: string;
  email: string;
}

interface Category {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  sortOrder: number;
}

interface StoreSummary {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  floor: string | null;
  phone: string | null;
  isRestaurant: boolean;
  isFeatured: boolean;
  status: string;
  sortOrder: number;
  categories: Array<{ id: string; name: string; slug: string }>;
}

interface StoreDetail extends StoreSummary {
  description: string | null;
  externalUrl: string | null;
  openingHours: Record<string, unknown> | null;
}

interface CategoryFormState {
  name: string;
  slug: string;
  sortOrder: string;
}

interface StoreFormState {
  name: string;
  slug: string;
  description: string;
  externalUrl: string;
  floor: string;
  phone: string;
  status: 'active' | 'inactive' | 'archived';
  sortOrder: string;
  isFeatured: boolean;
  isRestaurant: boolean;
  categoryIds: string[];
  openingHoursText: string;
}

const EMPTY_CATEGORY_FORM: CategoryFormState = {
  name: '',
  slug: '',
  sortOrder: '',
};

const EMPTY_STORE_FORM: StoreFormState = {
  name: '',
  slug: '',
  description: '',
  externalUrl: '',
  floor: '',
  phone: '',
  status: 'active',
  sortOrder: '0',
  isFeatured: false,
  isRestaurant: false,
  categoryIds: [],
  openingHoursText: '',
};

function App() {
  const [tab, setTab] = useState<Tab>('stores');
  const [session, setSession] = useState<Session | null>(null);
  const [loginForm, setLoginForm] = useState({
    tenantSlug: '',
    tenantHost: '',
    email: '',
    password: '',
  });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<StoreSummary[]>([]);

  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(EMPTY_CATEGORY_FORM);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const [storeForm, setStoreForm] = useState<StoreFormState>(EMPTY_STORE_FORM);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    void refreshData(session);
  }, [session]);

  const selectedCategoryNames = useMemo(
    () =>
      categories
        .filter((category) => storeForm.categoryIds.includes(category.id))
        .map((category) => category.name),
    [categories, storeForm.categoryIds],
  );

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    if (!session) {
      throw new Error('Sessao ausente');
    }

    const response = await fetch(`${BACKEND_URL}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-Host': session.tenantHost,
        ...(init?.headers ?? {}),
      },
      ...init,
    });

    if (response.status === 204) {
      return undefined as T;
    }

    const body = (await response.json().catch(() => null)) as T | { error?: string; details?: unknown } | null;
    if (!response.ok) {
      const errorMessage =
        body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
          ? body.error
          : `request_failed_${response.status}`;
      throw new Error(errorMessage);
    }

    return body as T;
  }

  async function refreshData(activeSession: Session) {
    setLoading(true);
    try {
      const [categoriesResponse, storesResponse] = await Promise.all([
        fetch(`${BACKEND_URL}/api/admin/store-categories`, {
          credentials: 'include',
          headers: { 'X-Forwarded-Host': activeSession.tenantHost },
        }).then((res) => res.json() as Promise<{ data: Category[] }>),
        fetch(`${BACKEND_URL}/api/admin/stores`, {
          credentials: 'include',
          headers: { 'X-Forwarded-Host': activeSession.tenantHost },
        }).then((res) => res.json() as Promise<{ data: StoreSummary[] }>),
      ]);

      setCategories(categoriesResponse.data ?? []);
      setStores(storesResponse.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setLoginError(null);
    setBanner(null);

    try {
      const response = await fetch(`${BACKEND_URL}/auth/${loginForm.tenantSlug}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'login_failed');
      }

      setSession({
        tenantSlug: loginForm.tenantSlug,
        tenantHost: loginForm.tenantHost,
        email: loginForm.email,
      });
      setBanner('Sessao iniciada. Catalogo carregado com contexto do tenant selecionado.');
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'login_failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch(`${BACKEND_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    setSession(null);
    setStores([]);
    setCategories([]);
    setEditingStoreId(null);
    setEditingCategoryId(null);
    setStoreForm(EMPTY_STORE_FORM);
    setCategoryForm(EMPTY_CATEGORY_FORM);
    setBanner('Sessao encerrada.');
  }

  async function handleCategorySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setBanner(null);
    try {
      const payload = {
        name: categoryForm.name,
        slug: categoryForm.slug || null,
        sort_order: categoryForm.sortOrder ? Number(categoryForm.sortOrder) : undefined,
      };

      if (editingCategoryId) {
        await request(`/api/admin/store-categories/${editingCategoryId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setBanner('Categoria atualizada.');
      } else {
        await request('/api/admin/store-categories', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setBanner('Categoria criada.');
      }

      setCategoryForm(EMPTY_CATEGORY_FORM);
      setEditingCategoryId(null);
      if (session) {
        await refreshData(session);
      }
    } catch (error) {
      setBanner(error instanceof Error ? error.message : 'category_submit_failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleCategoryDelete(id: string) {
    setLoading(true);
    try {
      await request(`/api/admin/store-categories/${id}`, { method: 'DELETE' });
      setBanner('Categoria removida.');
      if (session) {
        await refreshData(session);
      }
    } catch (error) {
      setBanner(error instanceof Error ? error.message : 'category_delete_failed');
    } finally {
      setLoading(false);
    }
  }

  async function moveCategory(id: string, direction: -1 | 1) {
    const index = categories.findIndex((category) => category.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= categories.length) {
      return;
    }

    const next = [...categories];
    [next[index], next[target]] = [next[target], next[index]];

    try {
      await request<{ data: Category[] }>('/api/admin/store-categories/reorder', {
        method: 'POST',
        body: JSON.stringify({
          items: next.map((category, currentIndex) => ({
            id: category.id,
            sort_order: currentIndex,
          })),
        }),
      });
      setBanner('Ordem das categorias atualizada.');
      if (session) {
        await refreshData(session);
      }
    } catch (error) {
      setBanner(error instanceof Error ? error.message : 'category_reorder_failed');
    }
  }

  async function loadStoreForEdit(id: string) {
    setLoading(true);
    try {
      const store = await request<StoreDetail>(`/api/admin/stores/${id}`, { method: 'GET' });
      setEditingStoreId(store.id);
      setStoreForm({
        name: store.name,
        slug: store.slug,
        description: store.description ?? '',
        externalUrl: store.externalUrl ?? '',
        floor: store.floor ?? '',
        phone: store.phone ?? '',
        status: store.status as StoreFormState['status'],
        sortOrder: String(store.sortOrder),
        isFeatured: store.isFeatured,
        isRestaurant: store.isRestaurant,
        categoryIds: store.categories.map((category) => category.id),
        openingHoursText: store.openingHours ? JSON.stringify(store.openingHours, null, 2) : '',
      });
      setLogoFile(null);
      setCoverFile(null);
      setTab('stores');
    } catch (error) {
      setBanner(error instanceof Error ? error.message : 'store_load_failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleStoreSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const openingHours =
        storeForm.openingHoursText.trim().length > 0
          ? (JSON.parse(storeForm.openingHoursText) as Record<string, unknown>)
          : null;

      const payload = {
        name: storeForm.name,
        slug: storeForm.slug || null,
        description: storeForm.description || null,
        external_url: storeForm.externalUrl || null,
        floor: storeForm.floor || null,
        phone: storeForm.phone || null,
        status: storeForm.status,
        sort_order: Number(storeForm.sortOrder || 0),
        is_featured: storeForm.isFeatured,
        is_restaurant: storeForm.isRestaurant,
        category_ids: storeForm.categoryIds,
        opening_hours: openingHours,
        logo_upload: logoFile
          ? { file_name: logoFile.name, mime_type: logoFile.type, size: logoFile.size }
          : undefined,
        cover_upload: coverFile
          ? { file_name: coverFile.name, mime_type: coverFile.type, size: coverFile.size }
          : undefined,
      };

      if (editingStoreId) {
        await request(`/api/admin/stores/${editingStoreId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setBanner('Loja atualizada.');
      } else {
        await request('/api/admin/stores', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setBanner('Loja criada.');
      }

      setStoreForm(EMPTY_STORE_FORM);
      setEditingStoreId(null);
      setLogoFile(null);
      setCoverFile(null);
      if (session) {
        await refreshData(session);
      }
    } catch (error) {
      setBanner(error instanceof Error ? error.message : 'store_submit_failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleStoreDelete(id: string) {
    setLoading(true);
    try {
      await request(`/api/admin/stores/${id}`, { method: 'DELETE' });
      setBanner('Loja removida.');
      if (session) {
        await refreshData(session);
      }
    } catch (error) {
      setBanner(error instanceof Error ? error.message : 'store_delete_failed');
    } finally {
      setLoading(false);
    }
  }

  if (!session) {
    return (
      <div className="shell shell--auth">
        <section className="auth-card">
          <p className="eyebrow">Backoffice do catalogo</p>
          <h1>Operacao de lojas por tenant</h1>
          <p className="lede">
            Entre com o slug e o host do tenant para administrar categorias e lojas usando a API
            multitenant real.
          </p>
          <form className="auth-form" onSubmit={handleLogin}>
            <input
              placeholder="tenant slug"
              value={loginForm.tenantSlug}
              onChange={(event) =>
                setLoginForm((current) => ({ ...current, tenantSlug: event.target.value }))
              }
              required
            />
            <input
              placeholder="tenant host"
              value={loginForm.tenantHost}
              onChange={(event) =>
                setLoginForm((current) => ({ ...current, tenantHost: event.target.value }))
              }
              required
            />
            <input
              type="email"
              placeholder="email"
              value={loginForm.email}
              onChange={(event) =>
                setLoginForm((current) => ({ ...current, email: event.target.value }))
              }
              required
            />
            <input
              type="password"
              placeholder="password"
              value={loginForm.password}
              onChange={(event) =>
                setLoginForm((current) => ({ ...current, password: event.target.value }))
              }
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Abrir painel'}
            </button>
          </form>
          {loginError ? <p className="error">{loginError}</p> : null}
        </section>
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="masthead">
        <div>
          <p className="eyebrow">Tenant conectado</p>
          <h1>{session.tenantSlug}</h1>
          <p className="lede">
            Host operacional: <strong>{session.tenantHost}</strong> · operador <strong>{session.email}</strong>
          </p>
        </div>
        <div className="masthead-actions">
          <button type="button" className="ghost" onClick={() => setTab('categories')}>
            Categorias
          </button>
          <button type="button" className="ghost" onClick={() => setTab('stores')}>
            Lojas
          </button>
          <button type="button" className="danger" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      {banner ? <div className="banner">{banner}</div> : null}

      <main className="dashboard">
        <section className="panel panel--form">
          <div className="panel-header">
            <h2>{tab === 'categories' ? 'Editar categorias' : 'Editar lojas'}</h2>
            <span>{loading ? 'Sincronizando...' : 'Pronto'}</span>
          </div>

          {tab === 'categories' ? (
            <form className="stacked-form" onSubmit={handleCategorySubmit}>
              <input
                placeholder="Nome da categoria"
                value={categoryForm.name}
                onChange={(event) =>
                  setCategoryForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
              <input
                placeholder="Slug opcional"
                value={categoryForm.slug}
                onChange={(event) =>
                  setCategoryForm((current) => ({ ...current, slug: event.target.value }))
                }
              />
              <input
                placeholder="Sort order"
                type="number"
                value={categoryForm.sortOrder}
                onChange={(event) =>
                  setCategoryForm((current) => ({ ...current, sortOrder: event.target.value }))
                }
              />
              <button type="submit">{editingCategoryId ? 'Salvar categoria' : 'Criar categoria'}</button>
            </form>
          ) : (
            <form className="stacked-form" onSubmit={handleStoreSubmit}>
              <div className="two-columns">
                <input
                  placeholder="Nome da loja"
                  value={storeForm.name}
                  onChange={(event) =>
                    setStoreForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
                <input
                  placeholder="Slug opcional"
                  value={storeForm.slug}
                  onChange={(event) =>
                    setStoreForm((current) => ({ ...current, slug: event.target.value }))
                  }
                />
              </div>

              <textarea
                placeholder="Descricao HTML"
                value={storeForm.description}
                onChange={(event) =>
                  setStoreForm((current) => ({ ...current, description: event.target.value }))
                }
              />

              <div className="two-columns">
                <input
                  placeholder="URL externa"
                  value={storeForm.externalUrl}
                  onChange={(event) =>
                    setStoreForm((current) => ({ ...current, externalUrl: event.target.value }))
                  }
                />
                <input
                  placeholder="Telefone"
                  value={storeForm.phone}
                  onChange={(event) =>
                    setStoreForm((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </div>

              <div className="two-columns">
                <input
                  placeholder="Piso"
                  value={storeForm.floor}
                  onChange={(event) =>
                    setStoreForm((current) => ({ ...current, floor: event.target.value }))
                  }
                />
                <input
                  type="number"
                  placeholder="Sort order"
                  value={storeForm.sortOrder}
                  onChange={(event) =>
                    setStoreForm((current) => ({ ...current, sortOrder: event.target.value }))
                  }
                />
              </div>

              <div className="two-columns">
                <select
                  value={storeForm.status}
                  onChange={(event) =>
                    setStoreForm((current) => ({
                      ...current,
                      status: event.target.value as StoreFormState['status'],
                    }))
                  }
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                  <option value="archived">archived</option>
                </select>

                <textarea
                  placeholder='Horario em JSON, ex: {"seg-sex":"10h-22h"}'
                  value={storeForm.openingHoursText}
                  onChange={(event) =>
                    setStoreForm((current) => ({
                      ...current,
                      openingHoursText: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="file-row">
                <label>
                  Logo
                  <input type="file" accept="image/*" onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)} />
                </label>
                <label>
                  Capa
                  <input type="file" accept="image/*" onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)} />
                </label>
              </div>

              <div className="toggle-row">
                <label>
                  <input
                    type="checkbox"
                    checked={storeForm.isFeatured}
                    onChange={(event) =>
                      setStoreForm((current) => ({
                        ...current,
                        isFeatured: event.target.checked,
                      }))
                    }
                  />
                  <span>Destaque</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={storeForm.isRestaurant}
                    onChange={(event) =>
                      setStoreForm((current) => ({
                        ...current,
                        isRestaurant: event.target.checked,
                      }))
                    }
                  />
                  <span>Restaurante</span>
                </label>
              </div>

              <div className="category-picker">
                <strong>Categorias selecionadas</strong>
                <p>{selectedCategoryNames.length > 0 ? selectedCategoryNames.join(', ') : 'Nenhuma categoria selecionada.'}</p>
                <div className="chip-grid">
                  {categories.map((category) => (
                    <label key={category.id} className="chip">
                      <input
                        type="checkbox"
                        checked={storeForm.categoryIds.includes(category.id)}
                        onChange={() =>
                          setStoreForm((current) => ({
                            ...current,
                            categoryIds: current.categoryIds.includes(category.id)
                              ? current.categoryIds.filter((currentId) => currentId !== category.id)
                              : [...current.categoryIds, category.id],
                          }))
                        }
                      />
                      <span>{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit">{editingStoreId ? 'Salvar loja' : 'Criar loja'}</button>
            </form>
          )}
        </section>

        <section className="panel panel--list">
          <div className="panel-header">
            <h2>{tab === 'categories' ? 'Categorias' : 'Lojas cadastradas'}</h2>
            <span>{tab === 'categories' ? `${categories.length} itens` : `${stores.length} itens`}</span>
          </div>

          {tab === 'categories' ? (
            <div className="list-grid">
              {categories.map((category, index) => (
                <article className="list-card" key={category.id}>
                  <div>
                    <p className="list-kicker">ordem {category.sortOrder}</p>
                    <h3>{category.name}</h3>
                    <p>{category.slug}</p>
                  </div>
                  <div className="card-actions">
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => {
                        setEditingCategoryId(category.id);
                        setCategoryForm({
                          name: category.name,
                          slug: category.slug,
                          sortOrder: String(category.sortOrder),
                        });
                      }}
                    >
                      Editar
                    </button>
                    <button type="button" className="ghost" onClick={() => moveCategory(category.id, -1)} disabled={index === 0}>
                      Subir
                    </button>
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => moveCategory(category.id, 1)}
                      disabled={index === categories.length - 1}
                    >
                      Descer
                    </button>
                    <button type="button" className="danger" onClick={() => void handleCategoryDelete(category.id)}>
                      Excluir
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="list-grid">
              {stores.map((store) => (
                <article className="list-card" key={store.id}>
                  <div>
                    <p className="list-kicker">{store.status}</p>
                    <h3>{store.name}</h3>
                    <p>{store.slug}</p>
                    <p>
                      {store.categories.length > 0
                        ? store.categories.map((category) => category.name).join(', ')
                        : 'Sem categorias'}
                    </p>
                  </div>
                  <div className="card-actions">
                    <button type="button" className="ghost" onClick={() => void loadStoreForEdit(store.id)}>
                      Editar
                    </button>
                    <button type="button" className="danger" onClick={() => void handleStoreDelete(store.id)}>
                      Excluir
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
