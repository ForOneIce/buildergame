export const SUPPORT_CHAIN_ID: 11155111;
export const SUPPORT_CHAIN_HEX: '0xaa36a7';
export const SUPPORT_EXPLORER: string;
export class SupportError extends Error { code: string; constructor(code: string, message?: string); }
export interface DonationInput { projectId: string; recipient: string; amount: string }
export interface DonationIntent extends DonationInput { value: bigint; chainId: number }
export interface WalletAdapter {
  address: string;
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  send(args: { to: string; value: bigint; chainId: number }): Promise<string | { hash: string }>;
}
export interface DonationEstimate { sender: string; fee: string; balance: string; gas: bigint; gasPrice: bigint }
export type DonationPhase = 'idle' | 'preparing' | 'ready' | 'signing' | 'checking' | 'pending' | 'confirmed' | 'failed' | 'error' | 'unknown';
export interface DonationState { phase: DonationPhase; intent: DonationIntent | null; estimate: DonationEstimate | null; hash: string | null; error: string | null; critical: boolean }
export interface DonationCheckpoint extends DonationInput { phase: 'pending' | 'unknown'; sender: string; hash: string | null }
export interface DonationFlow {
  getSnapshot(): DonationState;
  subscribe(listener: () => void): () => void;
  reset(): boolean;
  cancelPreparation(): boolean;
  restore(saved: DonationCheckpoint): boolean;
  prepare(input: DonationInput, adapter: WalletAdapter): Promise<void>;
  send(): Promise<void>;
  recheck(adapter?: WalletAdapter): Promise<void>;
  dispose(): void;
}
export function validateAmount(input: string): { amount: string; value: bigint };
export function donationIntent(input: DonationInput): DonationIntent;
export function canConfirmDonation(options: { state: DonationState; walletAddress?: string; authenticated: boolean; ready: boolean; acknowledged: boolean }): boolean;
export function classifyError(error: unknown): string;
export function estimateDonation(intent: DonationIntent, adapter: WalletAdapter, timeoutMs?: number): Promise<DonationEstimate>;
export interface TransferGuard { acquire(): Promise<void>; save(checkpoint: DonationCheckpoint | null): void; read(): (DonationCheckpoint & { eventId: string; attemptId: string }) | null; migrate(saved: DonationCheckpoint): Promise<void>; release(): void }
export function createBrowserTransferGuard(options: { eventId: string; storage?: Storage; locks?: LockManager; randomId?: () => string }): TransferGuard;
export function createSupportActionGate(): { readonly busy: boolean; run<T>(task: (context: { isCurrent(): boolean }) => Promise<T>, timeoutMs?: number): Promise<{ status: 'busy' | 'cancelled' } | { status: 'error'; error: unknown } | { status: 'done'; value: T }>; cancel(): void; dispose(): void };
export function createDonationFlow(options?: { onConfirmed?: (projectId: string, result: { hash: string; amount: string; recipient: string }) => void; persist?: (checkpoint: DonationCheckpoint | null) => void; guard?: TransferGuard; timeoutMs?: number; receiptWaitMs?: number; pollMs?: number; sendWaitMs?: number }): DonationFlow;
