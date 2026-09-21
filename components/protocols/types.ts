export interface ProtocolViewProps {
  rationale?: string;
  degraded?: boolean;
  /** Fires the "not this" escape back to manual selection. */
  onReject: () => void;
}
