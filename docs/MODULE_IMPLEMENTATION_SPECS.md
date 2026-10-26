# 03. ESPECIFICAÇÃO DE ENGENHARIA POR MÓDULO (BEAKBREAKER v5.0)

Este documento traduz todas as regras matemáticas, tabelas e mecânicas da **Bíblia Master GDD v5.0 (28 Páginas)** em especificações diretas de implementação para o **Google Antigravity**.

---

## MÓDULO 1: Motor Determinístico de Combate (`packages/combat-core`)

### 1.1. Parâmetros do Loop de Tempo Fixo
- **Taxa de Simulação:** $20\text{ ticks por segundo}$ ($1\text{ tick} = 50\text{ ms}$).
- **Duração Máxima:**
  - Combate 3v3 / Raid / Guerra / Torre: **$1.800\text{ ticks}$ ($90\text{ segundos}$)**.
  - Duelo Amistoso 1x1: **$900\text{ ticks}$ ($45\text{ segundos}$)**.
- **Ordem de Desempate no Mesmo Tick:** Maior `Velocidade` atual $\rightarrow$ Fila da Frente antes da Fila de Trás $\rightarrow$ Menor índice de slot ($0, 1, 2$) $\rightarrow$ Sorteio via `SeededPRNG`.

### 1.2. As 3 Equações Oficiais em Ponto Fixo (Inteiros)
Toda implementação em `DamageCalculator.ts` e `CantoSystem.ts` deve seguir exatamente estas fórmulas:

1. **Intervalo de Ataque Básico (em Ticks):**
   $$\text{Ticks}_{\text{ataque}} = \max\left(10, 40 - \left\lfloor \frac{\text{Vel}}{12} \right\rfloor\right)$$
   - *Regra de Excesso de Velocidade:* O intervalo mínimo trava em $10\text{ ticks}$ ($0,5\text{ s}$) quando $\text{Vel} \ge 360$.

2. **Geração de Canto por Golpe (Especial = $1.000$ de Canto):**
   $$\text{Canto}_{\text{golpe}} = 120 + \text{Garra} + \left\lfloor \frac{\max(0, \text{Vel} - 360)}{4} \right\rfloor$$

3. **Dano por Golpe (Aritmética Inteira para Evitar Divergência IEEE-754):**
   Para evitar diferenças de ponto flutuante entre arquiteturas ARM (Android) e x86 (Servidor), multiplique os fatores percentuais em base $1.000$ ou $10.000$ antes de dividir:
   $$\text{Dano} = \max\left(1, \left\lfloor \text{Força} \times M_{\text{hab}} \times \frac{1000}{1000 + 3 \times \text{Def}_{\text{efetiva}}} \times M_{\text{elem}} \times M_{\text{crit}} \right\rfloor\right)$$
   - Onde:
     - $M_{\text{elem}} \in \{0,80\text{ (Desvantagem)}; 1,00\text{ (Neutro)}; 1,25\text{ (Vantagem)}\}$.
     - $M_{\text{crit}} = 1,50$ por padrão, ou **$1,95$** se o atacante estiver com o conjunto **Brasa Viva (4 peças)** equipado.
     - Se o atacante for da classe **Atirador** (passiva *Mira Firme*) em ataque básico: $\text{Def}_{\text{efetiva}} = \lfloor \text{Def} \times 0,85 \rfloor$.

### 1.3. Passivas Intrínsecas das 6 Classes & 7 Sinergias de Trio
No `tick = 0`, `SynergyResolver.ts` avalia as classes dos 3 galos aliados:
- **Regra Anti-Monoclasse:** Se os 3 galos forem da mesma classe, **nenhuma sinergia é ativada**.
- **Sinergias de Par (Cumulativas):**
  1. *Muralha Viva* (`Tanque + Suporte`): $+10\%$ Vigor máx. a todo o trio.
  2. *Linha de Frente* (`Tanque + Bruiser`): $+10\%$ Defesa na Fila da Frente.
  3. *Emboscada* (`Assassino + Controle`): $+15\%$ de dano contra alvos `Atordoados` ou `Cegos`.
  4. *Fogo Cruzado* (`Atirador + Bruiser`): $+8\%$ Velocidade a todo o trio.
  5. *Caçada* (`Assassino + Atirador`): $+5\text{ p.p.}$ de Técnica (chance de crítico).
  6. *Coro do Arraial* (`Suporte + Controle`): Todos começam a luta com $+100$ de Canto inicial.
- **Sinergia Tripla (Soma com qualquer par acima!):**
  7. *Bando Completo* (`3 Classes Diferentes`): $+5\%$ em Força, Vigor e Defesa para todo o trio.

### 1.4. Os 11 Efeitos de Status, Corta-Canto (Interrupt) & Torcida
- **1. Atordoado:** Impede ação; duração máx. de $3\text{ s}$ ($60\text{ ticks}$); ao expirar, aplica tag `ImuneAtordoamento` por $2\text{ s}$ ($40\text{ ticks}$).
- **2. Cego:** $50\%$ de chance (via `SeededPRNG`) de o golpe errar (causa 0 dano e não aplica efeitos secundários).
- **3. Silenciado:** Impede disparo do Especial (mesmo com Canto $= 1.000$); máx. $2\text{ s}$ ($40\text{ ticks}$).
- **4. Lento:** Reduz a Velocidade em $-30\%$.
- **5. Queimadura:** Causa dano verdadeiro de $3\%$ do Vigor máximo por segundo ($1,5\%$ a cada $10\text{ ticks}$).
- **6. Provocado:** Força ataques básicos no provocador; unidades da classe **Tanque são imunes**.
- **7. Escudo:** Absorve dano antes do Vigor; o valor total de escudos acumulados tem teto de $50\%$ do Vigor máximo da unidade.
- **8. Espinhos:** Reflete percentual do dano recebido de ataques básicos de volta ao atacante.
- **9. Furtivo:** Impede ser escolhido como alvo direto se houver outro aliado vivo; máx. $1,5\text{ s}$ ($30\text{ ticks}$).
- **10. Regeneração:** Cura percentual fixo do Vigor máximo a cada $20\text{ ticks}$ ($1\text{ s}$).
- **11. Roubo de Vida:** Cura percentual do dano efetivamente causado (teto máximo de $30\%$).
- **Mecânica de Corta-Canto (Interrupt):** Todo Especial possui uma janela de preparação/voo (`castWindupTicks = 6`, equivalente a $0,3\text{ s}$). Se o galo sofrer `Atordoado` durante esses 6 ticks, o Especial é cancelado e $500$ de Canto são consumidos.
- **Botão de Torcida:** Usável $1\times$ por luta (ou $2\times$ no modificador *Festa no Arraial* da Torre), concedendo buff global ao trio por $5\text{ s}$.

---

## MÓDULO 2: Fazenda Viva 2.0, Sede (1–12) & Saque Anticonluio

### 2.1. Equação de Produção dos Poleiros Elementais (`PerchCalculator.ts`)
$$\text{Milho/min} = \text{Base}_{\text{rar}} \times \text{NG} \times (1 + 0,15 \times \text{Estrelas}) \times M_{\text{bônus}}$$
- **Valores de $\text{Base}_{\text{rar}}$:** Comum $= 1,5$; Raro $= 2,2$; Épico $= 3,2$; Lendário $= 4,8$; Mítico $= 6,5$; Heróico $= 7,0$.
- **Bônus Aditivos/Multiplicativos ($M_{\text{bônus}}$):** Totem do Elemento adjacente ($+20\%$), Ciclo Dia/Noite favorável (Sol de dia / Lua à noite: $+10\%$), Estação Climática favorável ($+10\%$) e Cartão do Fazendeiro ($+20\%$).
- **Teto de Nível do Galo (Trava da Sede):** Nenhum galo pode subir de nível no Centro de Treino acima de:
  $$\text{NG}_{\text{máx}} = (\text{Nível da Sede} \times 5) + \text{Bônus}_{\text{Despertar Astral}}$$
  Onde cada Estrela Vermelha ($6\star$ a $10\star$) adiciona $+2$ ao teto de NG (chegando ao NG 70 na Sede 12 com $10\star$).

### 2.2. Saque de Fazenda em 2 Ondas & Trava de Revanche Anticonluio (72h)
1. **Fluxo de Saque:**
   - **Onda 1:** O trio invasor enfrenta as defesas rurais construídas (*Cerca de Mandacaru, Estilingue de Sabugo, Espantalho Assombrado, Cata-Vento de Alerta*).
   - **Onda 2:** O trio invasor enfrenta o Trio Guardião da Fazenda.
   - **Roubo:** Se vencer, rouba até **$20\%$ do Milho excedente** (acima da faixa protegida pelo Celeiro) e ativa imediatamente um **Escudo de 8 horas** no defensor.
2. **Regra Anticonluio da Revanche (`RevengeGuard.ts`):**
   - Ao clicar em **Revanche**, o defensor recupera $100\%$ do Milho roubado $+$ **$50\%$ de bônus gerados pelo sistema**.
   - **Trava Anti-Exploit (Três Regras Obrigatórias no Redis):**
     - **Regra A:** Uma luta de Revanche `isRevenge = true` **NUNCA** gera botão de contra-revanche para o outro jogador.
     - **Regra B:** Chave Redis `revenge:pair:{minId}:{maxId}` com TTL de **72 horas ($259.200\text{ s}$)** impede que as duas contas voltem a se atacar ou revidar por 3 dias.
     - **Regra C:** Se `attacker.lastIpHash === defender.lastIpHash` ou `attacker.deviceFingerprint === defender.deviceFingerprint`, o saque/revanche é bloqueado na hora.

---

## MÓDULO 3: Genética 3.0, Santuário (24 Receitas) & Árvore da Vida

### 3.1. Algoritmo da Calculadora do Ninhal (`NinhalCalculator.ts`)
- **Elegibilidade:** Cada ave possui contador `breedCount` ($0\text{ a }5$). Pais Míticos e Heróicos possuem peso $0$ para passar a própria espécie.
- **Piscina de Pesos de Espécie:**
  - Pai adiciona sua espécie com peso: `Comum: 40`, `Raro: 30`, `Épico: 20`, `Lendário: 10`.
  - Mãe adiciona sua espécie com o respectivo peso de raridade.
  - Se os elementos primários de Pai e Mãe formarem um dos **8 pares Lendários** (ex.: `Brasa x Sol` $\rightarrow$ `#18 Trovão do Sertão`, `Brasa x Correnteza` $\rightarrow$ `#39 Fogo-Apagou`, `Correnteza x Sol` $\rightarrow$ `#40 Arco-Íris do Sertão`) **E** a **Barra de Empoderamento Dourada** estiver ativa (pais $3\star+$ com Joia de Procriação), adicione o Lendário da combinação na piscina com **Peso 8**.
- **Sorteio de Mutação Secreta ($5\%$):**
  - Se `pai.ng >= 30 && mae.ng >= 30`, role primeiro um dado de $5\%$. Se ativar e o par de elementos corresponder a uma das 6 Mutações Secretas já lançadas na temporada atual (ex.: `Lua x Lua` $\rightarrow$ `#26 Sombra Armorial`), o filhote nasce como a Mutação Secreta; caso contrário, recebe a variante *Plumagem de Ouro + Passiva Rara*.
- **Sorteio de Híbrido ($35\%$):**
  - Se o filhote sorteado for uma espécie de 1 elemento e os pais possuírem elementos diferentes, role $35\%$ para que ele herde o segundo elemento como **Híbrido de Dupla Linhagem** (combinando peças visuais dos dois pais no `RoosterSpineAssembler`).

### 3.2. Árvore da Vida e Curva de Empoderamento (11.200 Orbes)
- **Fórmula de Extração (Reciclagem de Repetidos):**
  $$\text{Orbes Extraídos} = 40 + \left\lfloor \frac{\min(30, \text{NG}) - 1}{29} \times 60 \right\rfloor$$
  Garante exatamente **$40\text{ Orbes}$ no NG 1** e **$100\text{ Orbes}$ no NG 30**.
- **Regra de Orbes Curinga vs. Happy Hour:**
  - Dias normais: exige no mínimo **$80\%$ de Orbes da própria espécie** e permite até **$20\%$ de Orbes Curinga**.
  - **Quarta-feira e Sexta-feira (`isHappyHourActive = true`):** Permite usar até **$100\%$ de Orbes Curinga** para empoderar qualquer estrela.

---

## MÓDULO 4: Chocadeira (Gacha Pity 2,73%) & Corrida de Heróis (18 Voltas)

### 4.1. Equação Exata de Soft Pity e Hard Pity (`GachaEngine.ts`)
- **Tiros 1 a 60:** Probabilidade base fixa de Lendário $p(n) = 0,02$ ($2,0\%$).
- **Tiros 61 a 79 (Soft Pity Progressivo de $+5\text{ p.p.}$ por tiro):**
  $$p(n) = 0,02 + 0,05 \times (n - 60)$$
  (Tiro 61 $= 7\%$, Tiro 65 $= 27\%$, Tiro 70 $= 52\%$, Tiro 79 $= 97\%$).
- **Tiro 80 (Hard Pity):** $p(80) = 1,00$ ($100\%$ garantido).
- **Regra 50/50:** Se o Lendário obtido não for o Galo em Destaque do Banner, a flag `guaranteedFeaturedNext = true` é gravada na conta do jogador, garantindo $100\%$ o Destaque no próximo Lendário.
- **Gatilho Comercial da Oferta Relâmpago:** Sempre que `pityCounter` do jogador entrar na faixa $[58, 65]$ e o saldo de Penas Douradas for $< 160$, dispare o evento `TRIGGER_FLASH_PITY_OFFER` (20 tiros por R$ 34,90 com timer de 2h).

### 4.2. Pool Cooldown da Corrida de Heróis (`HeroRacePoolService.ts`)
- Pista de 18 Voltas $\times$ 5 Nós por Volta. Na Volta $V$ ($1 \le V \le 18$), cada Nó exige $N_{\text{itens}} = 6 + V$ itens (totalizando exatamente **$1.050\text{ itens}$ acumulados até a Volta 15**).
- **Regra do Pool Cooldown:**
  - $\lceil 0,60 \times N_{\text{itens}} \rceil$ estão disponíveis imediatamente na piscina do Nó.
  - Os $\lfloor 0,40 \times N_{\text{itens}} \rfloor$ restantes regeneram na piscina à razão de **1 item a cada 15 minutos** (podendo ser pulados com Coroas ou com o *Pacote Pulo da Corrida*).
