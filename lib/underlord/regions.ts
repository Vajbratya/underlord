/**
 * World map regions of Vael'Thrand. Each maps to a hero (or trio of heroes)
 * from the flavor lib and a thematic biome / battlefield.
 */

import type { Region } from './types'

export const REGIONS: Region[] = [
  {
    id: 'lichmoor',
    name: 'O LIQUEMOR',
    subtitle: 'Pântano onde os profetas afundam',
    stage: 1,
    biome: 'moor',
    x: 18,
    y: 70,
    links: ['ironreach'],
    lore: 'Bryan diz que aqui ele "sentiu o chamado". Bryan sente o chamado em qualquer lugar com sinal de Wi-Fi.',
    goldReward: 40,
    heroIds: ['bryan'],
  },
  {
    id: 'ironreach',
    name: 'CONFINS DE FERRO',
    subtitle: 'Foundry-state das Casas da Moeda',
    stage: 3,
    biome: 'iron',
    x: 36,
    y: 56,
    links: ['lichmoor', 'ashfen', 'midgrove'],
    lore: 'Kevin abriu uma franquia de capelas-posto-de-gasolina. Tyrella é gerente. Tyrella quer falar com você.',
    goldReward: 65,
    heroIds: ['kevin', 'tyrella'],
  },
  {
    id: 'ashfen',
    name: 'COSTA DA CINZA',
    subtitle: 'Praia negra onde encalham heróis',
    stage: 5,
    biome: 'ash',
    x: 22,
    y: 36,
    links: ['ironreach', 'midgrove'],
    lore: 'Daggor faz lives de surf. Gandolfini estuda pra prova. Sangue na areia. Engajamento alto.',
    goldReward: 90,
    heroIds: ['daggor', 'gandolfini'],
  },
  {
    id: 'midgrove',
    name: 'BOSQUE NEUTRO',
    subtitle: 'Onde os druidas printam',
    stage: 7,
    biome: 'verdant',
    x: 54,
    y: 46,
    links: ['ironreach', 'ashfen', 'kingreach'],
    lore: 'Vexanna manifesta. Blazborn conta os macros. Bianca já abriu um thread sobre você.',
    goldReward: 120,
    heroIds: ['vexanna', 'blazborn', 'bianca'],
  },
  {
    id: 'kingreach',
    name: 'ALCANCE DO REI',
    subtitle: 'Capital sob impostos sob impostos',
    stage: 10,
    biome: 'iron',
    x: 70,
    y: 30,
    links: ['midgrove', 'sunkencrown'],
    lore: 'Baldrik patenteou a lei. Midas auditou seu CNPJ. Gregórius está mandando áudio.',
    goldReward: 180,
    heroIds: ['baldrik', 'gregorius', 'midas'],
  },
  {
    id: 'sunkencrown',
    name: 'A COROA SUBMERSA',
    subtitle: 'Topo da torre, último degrau',
    stage: 14,
    biome: 'crown',
    x: 86,
    y: 14,
    links: ['kingreach'],
    lore: 'A Profecia em Pessoa te aguarda. Heliarch também. Nem dão bom dia.',
    goldReward: 300,
    heroIds: ['profecia', 'heliarch'],
  },
]

export function getRegion(id: string): Region | undefined {
  return REGIONS.find((r) => r.id === id)
}
