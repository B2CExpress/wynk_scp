export interface CreatePopupInput {
  title: string;
  imageUrl?: string | null;
  htmlContent?: string | null;
  linkUrl?: string | null;
  showAfterSeconds?: number;
  showOnlyOnce?: boolean;
  showOnPages?: string[];
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface UpdatePopupInput {
  title: string;
  imageUrl?: string | null;
  htmlContent?: string | null;
  linkUrl?: string | null;
  showAfterSeconds?: number;
  showOnlyOnce?: boolean;
  showOnPages?: string[];
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface ListPopupsQuery {

}

export interface PopupWithTenant {

}

export interface ListPopupsResult {
    popups: PopupWithTenant[];
    total: number;
}
