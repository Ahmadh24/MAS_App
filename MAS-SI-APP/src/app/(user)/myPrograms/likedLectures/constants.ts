export const COLORS = {
  primary: '#214E91',
  primaryDark: '#1a3d73',
  primaryDarker: '#15325a',
  text: {
    primary: '#0F172A',
    secondary: '#64748B',
    tertiary: '#475569',
  },
  background: {
    white: '#FFFFFF',
    light: '#F8FAFB',
    lighter: '#F0F4F8',
    gray: '#F1F5F9',
  },
  border: {
    light: 'rgba(33, 78, 145, 0.1)',
    lighter: 'rgba(33, 78, 145, 0.08)',
    lightest: 'rgba(33, 78, 145, 0.06)',
  },
  shadow: {
    primary: '#214E91',
    black: '#000',
  },
} as const

export const GRADIENTS = {
  background: ['#FFFFFF', '#F8FAFB', '#F0F4F8'],
  heroIcon: ['rgba(33, 78, 145, 0.18)', 'rgba(33, 78, 145, 0.1)', 'rgba(33, 78, 145, 0.05)'],
  statIcon: ['rgba(33, 78, 145, 0.1)', 'rgba(33, 78, 145, 0.05)', 'rgba(33, 78, 145, 0.02)'],
  statTotal: ['#214E91', '#1a3d73', '#15325a'],
  emptyIcon: ['rgba(33, 78, 145, 0.12)', 'rgba(33, 78, 145, 0.06)', 'rgba(33, 78, 145, 0.02)'],
} as const

export const ANIMATION_CONFIG = {
  spring: {
    damping: 15,
    stiffness: 100,
  },
  springGentle: {
    damping: 8,
    stiffness: 50,
  },
  delays: {
    hero: 100,
    heroIcon: 150,
    heroText: 200,
    stats: [250, 300, 350],
    empty: [200, 300],
  },
} as const

export const TAB_ROUTES = [
  { key: 'first', title: 'Lectures' },
  { key: 'second', title: 'Events' },
  { key: 'third', title: 'Saved' },
] as const

