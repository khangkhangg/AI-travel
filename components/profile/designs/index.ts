export { default as JourneyDesign } from './JourneyDesign';
export { default as ExplorerDesign } from './ExplorerDesign';
export { default as WandererDesign } from './WandererDesign';

export type ProfileDesign = 'journey' | 'explorer' | 'wanderer';

export const DESIGN_OPTIONS: { id: ProfileDesign; name: string; description: string }[] = [
  {
    id: 'journey',
    name: 'JOURNEY',
    description: 'Dark theme with giant typography and Zune-inspired bold stats',
  },
  {
    id: 'explorer',
    name: 'EXPLORER',
    description: 'Two-column layout with sticky sidebar map',
  },
  {
    id: 'wanderer',
    name: 'WANDERER',
    description: 'Full-bleed gradient hero with horizontal scrolling cards',
  },
];
