/**
 * Glide — Shared Panel Types
 *
 * © Rizonetech (Pty) Ltd. — https://rizonesoft.com
 */

export interface PanelProps {
  showError: (msg: string) => void;
  clearError: () => void;
  showLoading: (msg?: string) => void;
  hideLoading: () => void;
}
