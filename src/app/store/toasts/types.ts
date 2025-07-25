export interface Toast {
  id: string;
  children: React.ReactNode;
  timestamp: number;
}

export interface ToastState {
  toasts: Toast[];
}
