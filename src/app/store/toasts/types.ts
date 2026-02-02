export type ToastVariant = 'default' | 'error';

export interface Toast {
  id: string;
  children: React.ReactNode;
  timestamp: number;
  variant: ToastVariant;
}

export interface ToastState {
  toasts: Toast[];
}
