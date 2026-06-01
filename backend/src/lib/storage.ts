export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export async function uploadStoreImage(
  file: UploadedFile,
  tenantId: string,
  storeSlug: string,
): Promise<string> {
  // Stub: retorna URL fake /uploads/{tenant_id}/stores/{slug}/{filename}
  // Fase 6 será substituído por upload real para CDN
  const filename = file.originalname.replace(/\s+/g, '_');
  return `/uploads/${tenantId}/stores/${storeSlug}/${filename}`;
}
