import type { DataSource, Repository } from 'typeorm';
import { Popup } from '../entities/Popup';
import { withTenant } from '../utils/with-tenant';
import { requireTenantContext } from '../middleware/tenant-context';

export class PopupRepository {
    private readonly dataSource: DataSource;
    private readonly popupRepo: Repository<Popup>;


}