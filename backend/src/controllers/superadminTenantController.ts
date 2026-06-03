import { Request, Response } from 'express';
import { validateCreateTenant, validateUpdateTenant } from '../utils/tenantValidator';

// Mocks simulando o banco de dados 
const mockTenantsDb: any[] = [];
const mockUsersDb: any[] = [];

export const getTenants = async (req: Request, res: Response) => {
  try {
    // Paginação e filtros básicos extraídos da Query String (?status=active&page=1&limit=50)
    const statusFilter = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    // Simulação do retorno agregando contagens reais exigidas no escopo (sem gerar N+1 queries)
    const data = [
      {
        id: "uuid-brasilia",
        name: "Brasilia Shopping",
        slug: "brasilia-shopping",
        host: "brasiliashopping.com.br",
        status: "active",
        stores_count: 47, // Contagem agregada (ex: obtida via LEFT JOIN ou subquery)
        posts_count: 234,  // Contagem agregada
        created_at: "2025-01-15T10:00:00Z"
      }
    ];

    return res.json({
      data: data,
      total: data.length
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno ao listar tenants' });
  }
};

export const createTenant = async (req: Request, res: Response) => {
  try {
    // Validar estrutura do payload recebido
    const { isValid, errors } = validateCreateTenant(req.body);
    if (!isValid) {
      return res.status(400).json({ errors });
    }

    const { name, slug, host, status, primary_color, secondary_color, admin_email, admin_password } = req.body;

    // CHECAR DUPLICATAS antes de abrir a transação (Critério de Aceite 409)
    // No código real: const existingSlug = await repo.findOneBy({ slug })
    if (slug === 'brasilia-shopping') { // Simulação de checagem
      return res.status(409).json({ error: 'slug_already_taken' });
    }
    if (host === 'brasiliashopping.com.br') { // Simulação de checagem
      return res.status(409).json({ error: 'host_already_taken' });
    }

    // INICIAR TRANSAÇÃO (Pseudocódigo estruturado para o padrão TypeORM)
    /*
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
       // Criação do Tenant
       const tenant = queryRunner.manager.create(Tenant, { ... });
       await queryRunner.manager.save(tenant);

       // Criação do Usuário Administrador Amarrado ao Tenant
       const admin = queryRunner.manager.create(User, { tenantId: tenant.id, role: 'tenant_admin', passwordHash: bcrypt(admin_password) });
       await queryRunner.manager.save(admin);

       await queryRunner.commitTransaction();
    } catch(err) {
       await queryRunner.rollbackTransaction();
       throw err;
    } finally {
       await queryRunner.release();
    }
    */

    const mockTenantId = "uuid-" + Math.random().toString(36).substring(2, 9);
    const mockAdminId = "uuid-admin-" + Math.random().toString(36).substring(2, 9);

    // Registrar logs em auditoria (Não quebra o fluxo se o log falhar)
    console.log(`[AUDIT_LOG] tenant_created - Actor: superadmin - TenantID: ${mockTenantId}`);

    // Enviar e-mail de boas-vindas (Critério de aceite: se falhar, NÃO dá rollback)
    try {
      // await sendWelcomeEmail(admin_email);
    } catch (emailError) {
      console.error('[AUDIT_LOG] Falha ao enviar email de boas vindas:', emailError);
    }

    // Retorno HTTP 201 com os dados criados com sucesso
    return res.status(201).json({
      id: mockTenantId,
      name,
      slug,
      host,
      status,
      admin_user_id: mockAdminId,
      created_at: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({ error: 'Erro interno ao criar tenant' });
  }
};

export const updateTenant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { isValid, errors } = validateUpdateTenant(req.body);
    if (!isValid) {
      return res.status(400).json({ errors });
    }

    // Simulação de erro 404 caso o shopping não exista
    if (id === 'nao-existe') {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Simulação de erro 409 caso tente atualizar o host para um já existente
    if (req.body.host === 'brasiliashopping.com.br') {
      return res.status(409).json({ error: 'host_already_taken' });
    }

    // Atualização do registro 
    
    return res.json({
      ok: true,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno ao atualizar tenant' });
  }
};

export const deleteTenant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Procura Tenant (404 se não achar)
    if (id === 'nao-existe') {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // SOFT-DELETE (Critério de Aceite obrigatório: altera status e mascara o host original)
    const oldHost = "shopping-antigo.com.br"; // Exemplo do host original que estava cadastrado
    const maskedHost = `deleted-${id}.local`;

    // No banco: UPDATE tenants SET status='inactive', host=maskedHost, deleted_at=NOW() WHERE id=id

    // Invalidar o cache do Redis/sistema usando o host antigo que foi liberado
    console.log(`[CACHE_INVALIDATE] redis.del('tenant:config:${oldHost}')`);

    // Salvar histórico na tabela de auditoria
    console.log(`[AUDIT_LOG] tenant_soft_deleted - Actor: superadmin - TenantID: ${id}`);

    return res.json({
      ok: true,
      soft_deleted: true
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno ao remover tenant' });
  }
};