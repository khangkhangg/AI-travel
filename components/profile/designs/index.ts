export { default as JourneyDesign } from './JourneyDesign';
export { default as ExplorerDesign } from './ExplorerDesign';
export { default as DreamyPassportDesign } from './DreamyPassportDesign';
export { default as WanderlustDiaryDesign } from './WanderlustDiaryDesign';
export { default as CyberdeckDesign } from './CyberdeckDesign';
export { default as HologramDesign } from './HologramDesign';
export { default as DrifterDesign } from './DrifterDesign';

export type ProfileDesign = 'journey' | 'explorer' | 'dreamy-passport' | 'wanderlust-diary' | 'cyberdeck' | 'hologram' | 'drifter';

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
    id: 'dreamy-passport',
    name: 'DREAMY PASSPORT',
    description: 'Soft scrapbook aesthetic with passport stamps and Polaroid trip cards',
  },
  {
    id: 'wanderlust-diary',
    name: 'WANDERLUST DIARY',
    description: 'Bold editorial magazine style with hot pink accents and marquee ticker',
  },
  {
    id: 'cyberdeck',
    name: 'CYBERDECK',
    description: 'Hacker terminal aesthetic with green-on-black and Matrix vibes',
  },
  {
    id: 'hologram',
    name: 'HOLOGRAM',
    description: 'Sci-fi interface with cyan/magenta neon and rotating HUD elements',
  },
  {
    id: 'drifter',
    name: 'DRIFTER',
    description: 'Casual scrapbook style with Polaroids, sticky notes, and IDGAF energy',
  },
];
