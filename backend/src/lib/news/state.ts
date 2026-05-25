export type NewsStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export function canTransition(currentStatus: string, nextStatus: string): boolean {
  const transitions: Record<string, NewsStatus[]> = {
    draft: ['scheduled', 'published', 'archived'],
    scheduled: ['published', 'archived'],
    published: ['archived'],
    archived: [],
  };

  if (!transitions[currentStatus]) {
    return false;
  }

  return transitions[currentStatus].includes(nextStatus as NewsStatus);
}

export function isValidNewsStatus(status: string): status is NewsStatus {
  return ['draft', 'scheduled', 'published', 'archived'].includes(status);
}

export function canDelete(status: string): boolean {
  return status === 'draft' || status === 'archived';
}
