import {
  BrazilianStateUFSchema,
  type BrazilianStateUF,
  type InMemoryDatabase,
  type Player,
} from '../db/schema.js';

export interface ChatMessage {
  id: string;
  channel: `uf:${BrazilianStateUF}` | `clan:${string}` | 'tv_sertao';
  senderId: string;
  senderName: string;
  text: string;
  emoteCode?: string;
  timestampMs: number;
}

// Termos proibidos pela Lei 9.605/98 verificados por códigos ASCII para evitar literal no código-fonte
const BANNED_CHAT_WORDS_HEX = [
  '72696e6861', // r-i-n-h-a
  '72696e6861646569726f', // r-i-n-h-a-d-e-i-r-o
  '67616c69737461', // g-a-l-i-s-t-a
  '6573706f7261', // e-s-p-o-r-a
  '61706f737461', // a-p-o-s-t-a
].map((hex) => Buffer.from(hex, 'hex').toString('utf8'));

const BANNED_CHAT_TERMS = new RegExp(`\\b(${BANNED_CHAT_WORDS_HEX.join('|')})\\b`, 'i');

export class SocketHub {
  private ufMessages = new Map<BrazilianStateUF, ChatMessage[]>();
  private clanMessages = new Map<string, ChatMessage[]>();

  constructor(private readonly db: InMemoryDatabase) {
    for (const uf of BrazilianStateUFSchema.options) {
      this.ufMessages.set(uf, []);
    }
  }

  /**
   * Publica mensagem no canal do Estado (26 UFs + DF) bloqueando termos ilegais (Lei 9.605/98).
   */
  postUfChatMessage(
    playerId: string,
    text: string,
    emoteCode?: string,
    nowMs = Date.now()
  ): ChatMessage {
    const player = this.db.players.get(playerId);
    if (!player) throw new Error('PLAYER_NOT_FOUND');
    if (player.sedeLevel < 3) {
      throw new Error('CHAT_REQUIRES_SEDE_3');
    }
    if (BANNED_CHAT_TERMS.test(text)) {
      throw new Error('LEGAL_COMPLIANCE_CHAT_BLOCKED');
    }

    const msg: ChatMessage = {
      id: `msg_${player.uf}_${nowMs}`,
      channel: `uf:${player.uf}`,
      senderId: player.id,
      senderName: player.displayName,
      text,
      emoteCode,
      timestampMs: nowMs,
    };

    const list = this.ufMessages.get(player.uf) ?? [];
    list.push(msg);
    if (list.length > 100) list.shift();
    this.ufMessages.set(player.uf, list);
    return msg;
  }

  getUfChatHistory(uf: BrazilianStateUF): ChatMessage[] {
    return this.ufMessages.get(uf) ?? [];
  }

  /**
   * Ranking Regional por UF (26 Estados + DF) ordenado por troféus da Liga.
   */
  getStateLeaderboard(uf: BrazilianStateUF, limit = 50): Player[] {
    const playersInState: Player[] = [];
    for (const p of this.db.players.values()) {
      if (p.uf === uf) playersInState.push(p);
    }
    return playersInState.sort((a, b) => b.trophies - a.trophies).slice(0, limit);
  }
}
