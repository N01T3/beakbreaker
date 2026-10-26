export type RealtimeChannel =
  | 'chat:uf'
  | 'chat:bando'
  | 'guerra:territorios'
  | 'tv:sertao'
  | 'raid:colosso';

export interface SocketEnvelope<TPayload = unknown> {
  channel: RealtimeChannel;
  event: string;
  payload: TPayload;
  timestampMs: number;
}

export class SocketClient {
  private connected = false;
  private subscribedChannels = new Set<RealtimeChannel>();
  private handlers = new Map<string, Array<(envelope: SocketEnvelope) => void>>();

  public connect(): void {
    this.connected = true;
  }

  public disconnect(): void {
    this.connected = false;
    this.subscribedChannels.clear();
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public joinChannel(channel: RealtimeChannel): boolean {
    if (!this.connected) return false;
    this.subscribedChannels.add(channel);
    return true;
  }

  public leaveChannel(channel: RealtimeChannel): void {
    this.subscribedChannels.delete(channel);
  }

  public getSubscribedChannels(): RealtimeChannel[] {
    return Array.from(this.subscribedChannels);
  }

  public on(channel: RealtimeChannel, callback: (envelope: SocketEnvelope) => void): void {
    const list = this.handlers.get(channel) ?? [];
    list.push(callback);
    this.handlers.set(channel, list);
  }

  public emitSimulated(envelope: SocketEnvelope): number {
    if (!this.connected || !this.subscribedChannels.has(envelope.channel)) {
      return 0;
    }
    const list = this.handlers.get(envelope.channel) ?? [];
    for (const fn of list) {
      fn(envelope);
    }
    return list.length;
  }
}
