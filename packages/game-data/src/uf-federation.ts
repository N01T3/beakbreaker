import { z } from 'zod';

export const BrazilianRegionSchema = z.enum([
  'Nordeste',
  'Norte',
  'Centro-Oeste',
  'Sudeste',
  'Sul',
]);
export type BrazilianRegion = z.infer<typeof BrazilianRegionSchema>;

export const BrazilianStateUFSchema = z.enum([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]);
export type BrazilianStateUF = z.infer<typeof BrazilianStateUFSchema>;

export const StateFederationSchema = z.object({
  uf: BrazilianStateUFSchema,
  name: z.string().min(1),
  region: BrazilianRegionSchema,
  capital: z.string().min(1),
  regionalPrideMultiplier: z.number().positive(),
});
export type StateFederation = z.infer<typeof StateFederationSchema>;

export const BRAZILIAN_FEDERATION_LIST: readonly StateFederation[] = Object.freeze([
  { uf: 'AC', name: 'Acre', region: 'Norte', capital: 'Rio Branco', regionalPrideMultiplier: 1.10 },
  { uf: 'AL', name: 'Alagoas', region: 'Nordeste', capital: 'Maceió', regionalPrideMultiplier: 1.20 },
  { uf: 'AP', name: 'Amapá', region: 'Norte', capital: 'Macapá', regionalPrideMultiplier: 1.10 },
  { uf: 'AM', name: 'Amazonas', region: 'Norte', capital: 'Manaus', regionalPrideMultiplier: 1.10 },
  { uf: 'BA', name: 'Bahia', region: 'Nordeste', capital: 'Salvador', regionalPrideMultiplier: 1.20 },
  { uf: 'CE', name: 'Ceará', region: 'Nordeste', capital: 'Fortaleza', regionalPrideMultiplier: 1.20 },
  { uf: 'DF', name: 'Distrito Federal', region: 'Centro-Oeste', capital: 'Brasília', regionalPrideMultiplier: 1.05 },
  { uf: 'ES', name: 'Espírito Santo', region: 'Sudeste', capital: 'Vitória', regionalPrideMultiplier: 1.05 },
  { uf: 'GO', name: 'Goiás', region: 'Centro-Oeste', capital: 'Goiânia', regionalPrideMultiplier: 1.05 },
  { uf: 'MA', name: 'Maranhão', region: 'Nordeste', capital: 'São Luís', regionalPrideMultiplier: 1.15 },
  { uf: 'MT', name: 'Mato Grosso', region: 'Centro-Oeste', capital: 'Cuiabá', regionalPrideMultiplier: 1.05 },
  { uf: 'MS', name: 'Mato Grosso do Sul', region: 'Centro-Oeste', capital: 'Campo Grande', regionalPrideMultiplier: 1.05 },
  { uf: 'MG', name: 'Minas Gerais', region: 'Sudeste', capital: 'Belo Horizonte', regionalPrideMultiplier: 1.10 },
  { uf: 'PA', name: 'Pará', region: 'Norte', capital: 'Belém', regionalPrideMultiplier: 1.10 },
  { uf: 'PB', name: 'Paraíba', region: 'Nordeste', capital: 'João Pessoa', regionalPrideMultiplier: 1.20 },
  { uf: 'PR', name: 'Paraná', region: 'Sul', capital: 'Curitiba', regionalPrideMultiplier: 1.05 },
  { uf: 'PE', name: 'Pernambuco', region: 'Nordeste', capital: 'Recife', regionalPrideMultiplier: 1.25 },
  { uf: 'PI', name: 'Piauí', region: 'Nordeste', capital: 'Teresina', regionalPrideMultiplier: 1.15 },
  { uf: 'RJ', name: 'Rio de Janeiro', region: 'Sudeste', capital: 'Rio de Janeiro', regionalPrideMultiplier: 1.05 },
  { uf: 'RN', name: 'Rio Grande do Norte', region: 'Nordeste', capital: 'Natal', regionalPrideMultiplier: 1.20 },
  { uf: 'RS', name: 'Rio Grande do Sul', region: 'Sul', capital: 'Porto Alegre', regionalPrideMultiplier: 1.10 },
  { uf: 'RO', name: 'Rondônia', region: 'Norte', capital: 'Porto Velho', regionalPrideMultiplier: 1.10 },
  { uf: 'RR', name: 'Roraima', region: 'Norte', capital: 'Boa Vista', regionalPrideMultiplier: 1.10 },
  { uf: 'SC', name: 'Santa Catarina', region: 'Sul', capital: 'Florianópolis', regionalPrideMultiplier: 1.05 },
  { uf: 'SP', name: 'São Paulo', region: 'Sudeste', capital: 'São Paulo', regionalPrideMultiplier: 1.05 },
  { uf: 'SE', name: 'Sergipe', region: 'Nordeste', capital: 'Aracaju', regionalPrideMultiplier: 1.15 },
  { uf: 'TO', name: 'Tocantins', region: 'Norte', capital: 'Palmas', regionalPrideMultiplier: 1.10 },
]);

export const BRAZILIAN_FEDERATION_MAP: Readonly<Record<BrazilianStateUF, StateFederation>> = Object.freeze(
  BRAZILIAN_FEDERATION_LIST.reduce((acc, curr) => {
    acc[curr.uf] = curr;
    return acc;
  }, {} as Record<BrazilianStateUF, StateFederation>)
);

export function getStateFederation(uf: BrazilianStateUF): StateFederation {
  const state = BRAZILIAN_FEDERATION_MAP[uf];
  if (!state) {
    throw new Error(`Federação estadual não encontrada para a UF: ${uf}`);
  }
  return state;
}

export function getStatesByRegion(region: BrazilianRegion): StateFederation[] {
  return BRAZILIAN_FEDERATION_LIST.filter((s) => s.region === region);
}

export function getAllStateFederations(): readonly StateFederation[] {
  return BRAZILIAN_FEDERATION_LIST;
}
