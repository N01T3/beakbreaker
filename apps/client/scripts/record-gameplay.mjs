import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const VIDEO_DIR = '/root/.gemini/antigravity-cli/brain/69dafa08-b52a-4385-8a27-34114279919b/gameplay_video';
fs.mkdirSync(VIDEO_DIR, { recursive: true });

async function runPlaywrightTour() {
  console.log('Iniciando Chromium com gravação de vídeo...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 960, height: 1100 },
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 960, height: 1100 },
    },
  });

  const page = await context.newPage();

  try {
    console.log('1. Acessando página inicial...');
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Gate 18+ (ECA Digital)
    console.log('Preenchendo ano de nascimento no Gate 18+...');
    await page.getByTestId('input-birth-year').fill('1992');
    await page.waitForTimeout(1000);
    await page.getByTestId('btn-confirm-18plus').click();
    await page.waitForTimeout(1500);

    // FTUE: Escolha do Ovo Inicial com Vô Tonho
    console.log('Selecionando ovo inicial do FTUE (#5 Brisa do Rio)...');
    await page.getByTestId('btn-egg-2').click();
    await page.waitForTimeout(2000);

    // Salvar Snapshot no Bridge Bar
    console.log('Testando persistência na barra Capacitor/PWA...');
    await page.getByTestId('btn-save-snapshot').click();
    await page.waitForTimeout(1200);

    // Fazenda Viva: Ciclo Dia/Noite e Colheita
    console.log('Interagindo com a Fazenda Viva 2.0...');
    await page.getByTestId('btn-cycle-daynight').click(); // Crepúsculo
    await page.waitForTimeout(1200);
    await page.getByTestId('btn-cycle-daynight').click(); // Luar do Sertão
    await page.waitForTimeout(1200);
    await page.getByTestId('btn-cycle-daynight').click(); // Sol Pleno
    await page.waitForTimeout(1200);

    console.log('Colhendo milho dos poleiros...');
    await page.getByTestId('btn-harvest-all').click();
    await page.waitForTimeout(1500);

    console.log('Ativando Torre de Santo Antônio...');
    await page.getByTestId('btn-saint-tower-2').click();
    await page.waitForTimeout(1200);

    console.log('Executando simulação de Saque de Fazenda (2 Ondas)...');
    await page.getByTestId('btn-execute-farm-raid').click();
    await page.waitForTimeout(1500);

    // Navegando para Lutar (Arena 3v3)
    console.log('2. Entrando na Arena de Combate 3v3...');
    await page.getByTestId('nav-tab-Lutar').click();
    await page.waitForTimeout(1500);

    console.log('Alternando velocidade do combate para 2x e 3x...');
    await page.getByTestId('btn-speed-2x').click();
    await page.waitForTimeout(1000);
    await page.getByTestId('btn-speed-3x').click();
    await page.waitForTimeout(1000);

    console.log('Acionando a Torcida Sertaneja (+Canto)...');
    await page.getByTestId('btn-torcida').click();
    await page.waitForTimeout(1000);
    await page.getByTestId('btn-torcida').click();
    await page.waitForTimeout(1000);

    console.log('Executando Duelo 3v3 no motor de combate...');
    await page.getByTestId('btn-start-battle-3v3').click();
    await page.waitForTimeout(2000);

    console.log('Alternando formação do trio e testando Corta-Canto...');
    await page.getByTestId('btn-cycle-trio').click();
    await page.waitForTimeout(1200);
    await page.getByTestId('btn-corta-canto').click();
    await page.waitForTimeout(2000);

    // Navegando para Galos (Álbum e Genética)
    console.log('3. Explorando o Álbum dos Galos e Genética...');
    await page.getByTestId('nav-tab-Galos').click();
    await page.waitForTimeout(1500);

    console.log('Testando Calculadora do Ninhal e Santuário...');
    await page.getByTestId('btn-toggle-ninhal-ng').click();
    await page.waitForTimeout(1200);
    await page.getByTestId('btn-toggle-golden-bar').click();
    await page.waitForTimeout(1200);
    await page.getByTestId('btn-breed-ninhal').click();
    await page.waitForTimeout(1500);
    await page.getByTestId('btn-sanctuary-fuse').click();
    await page.waitForTimeout(1200);
    await page.getByTestId('btn-refine-15').click();
    await page.waitForTimeout(1500);

    // Navegando para Bando (Clã, Colosso e Festival)
    console.log('4. Acessando Aba Bando e Eventos LiveOps...');
    await page.getByTestId('nav-tab-Bando').click();
    await page.waitForTimeout(1500);

    console.log('Atacando o Galo Colosso na Raid de Clã...');
    await page.getByTestId('btn-raid-attack').click();
    await page.waitForTimeout(1200);

    console.log('Avançando na Corrida de Heróis e no Labirinto do Minotauro...');
    await page.getByTestId('btn-advance-hero-race').click();
    await page.waitForTimeout(1200);
    await page.getByTestId('btn-labyrinth-step').click();
    await page.waitForTimeout(1200);
    await page.getByTestId('btn-spin-wheel').click();
    await page.waitForTimeout(1500);

    // Navegando para Loja & Chocadeira
    console.log('5. Entrando na Loja & Chocadeira...');
    await page.getByTestId('nav-tab-Loja').click();
    await page.waitForTimeout(1500);

    console.log('Chocando 1x Ovo...');
    await page.getByTestId('btn-pull-1x').click();
    await page.waitForTimeout(1500);

    console.log('Chocando 10x Ovos (+10 Pity)...');
    await page.getByTestId('btn-pull-10x').click();
    await page.waitForTimeout(1500);

    console.log('Gerando QR Code Pix oficial (+15% Coroas)...');
    await page.getByTestId('btn-generate-pix-qr').click();
    await page.waitForTimeout(2000);

    console.log('Simulando confirmação de Webhook Pix...');
    await page.getByTestId('btn-simulate-pix-webhook').click();
    await page.waitForTimeout(2000);

    console.log('Turnê completa finalizada com sucesso!');
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

runPlaywrightTour().catch((err) => {
  console.error(err);
  process.exit(1);
});
