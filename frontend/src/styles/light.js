// Novala Design System — Single Source Of Truth
// Every color, spacing, typography, and layout decision lives here.
// Used by 40+ pages. Do NOT create competing style files.
//
// Import: import { L } from '../styles/light';
// Use:    <div style={{ background: L.brand.primary }}>

export const L = {

  // === BRAND COLORS ===
  brand: {
    primary:      '#046A38',    // Emerald Rich - main brand green
    primaryHover: '#035229',    // Darker for hover states
    dark:         '#023E22',    // Deep emerald - header/footer bg
    darker:       '#0A2618',    // Near-black emerald - max contrast
    bright:       '#00A651',    // Brighter emerald - CTAs on dark bg
    soft:         'rgba(4, 106, 56, 0.10)',
    softStrong:   'rgba(4, 106, 56, 0.18)',
    border:       'rgba(4, 106, 56, 0.25)',
  },

  // === LEGACY BRAND (backward compat during migration) ===
  // Kept because 40+ files use L.accent. Points to brand.primary now.
  accent:       '#046A38',
  accentSoft:   'rgba(4, 106, 56, 0.08)',
  accentBorder: 'rgba(4, 106, 56, 0.2)',
  accentText:   '#046A38',

  // === TEXT (flat - many files use these directly) ===
  text:        '#0F172A',
  textSub:     '#374151',
  textMuted:   '#4B5563',
  textFaint:   '#6B7280',
  textDisabled:'#9CA3AF',
  textInverse: '#FFFFFF',
  textDim:     'rgba(255, 255, 255, 0.72)',

  // === BACKGROUNDS ===
  bg: {
    page:     '#F8FAFC',
    card:     '#FFFFFF',
    cardHover:'#F8FAFC',
    input:    '#F8FAFC',
    dark:     '#023E22',
    darker:   '#0A2618',
  },
  // Legacy
  pageBg: '#F8FAFC',
  cardBg: '#FFFFFF',
  rowHover: '#F8FAFC',
  inputBg: '#F8FAFC',
  emptyBg: '#F8FAFC',

  // === BORDERS ===
  border:      '#E5E7EB',
  borderLight: '#F3F4F6',
  borderDark:  'rgba(255, 255, 255, 0.12)',

  // === SEMANTIC ===
  success:     '#16A34A',
  successSoft: 'rgba(22, 163, 74, 0.08)',
  warning:     '#F59E0B',
  warningSoft: 'rgba(245, 158, 11, 0.08)',
  danger:      '#EF4444',
  dangerSoft:  'rgba(239, 68, 68, 0.08)',
  info:        '#3B82F6',
  infoSoft:    'rgba(59, 130, 246, 0.08)',

  // Legacy semantic names
  red:         '#EF4444',
  redSoft:     'rgba(239, 68, 68, 0.08)',
  redBorder:   'rgba(239, 68, 68, 0.15)',
  gold:        '#F59E0B',
  goldSoft:    'rgba(245, 158, 11, 0.08)',
  goldBorder:  'rgba(245, 158, 11, 0.15)',
  blue:        '#3B82F6',
  blueSoft:    'rgba(59, 130, 246, 0.08)',
  blueBorder:  'rgba(59, 130, 246, 0.15)',
  purple:      '#8B5CF6',
  purpleSoft:  'rgba(139, 92, 246, 0.08)',

  // === SHADOWS ===
  shadow:      '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
  shadowMd:    '0 4px 12px rgba(0,0,0,0.08)',
  shadowLg:    '0 10px 25px rgba(0,0,0,0.10)',

  // === RADIUS ===
  radius:      12,
  radiusSm:    8,
  radiusLg:    16,
  radiusPill:  9999,

  // === SPACING SCALE (4px base) ===
  space: {
    xs:  4,
    sm:  8,
    md:  16,
    lg:  24,
    xl:  32,
    xxl: 48,
    xxxl:64,
  },

  // === TYPOGRAPHY ===
  font:        "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
  fontMono:    "'JetBrains Mono', monospace",

  fontSize: {
    xs:   12,
    sm:   13,
    base: 14,
    md:   15,
    lg:   16,
    xl:   18,
    xxl:  24,
    xxxl: 32,
    hero: 48,
  },

  fontWeight: {
    normal:   400,
    medium:   500,
    semibold: 600,
    bold:     700,
    black:    800,
  },

  lineHeight: {
    tight:   1.2,
    base:    1.5,
    relaxed: 1.7,
  },

  // === TRANSITIONS ===
  transition:     'all 0.15s ease',
  transitionSlow: 'all 0.3s ease',
  transitionFast: 'all 0.1s ease',

};

// === BUTTON PRESETS ===
export const buttonStyles = {
  primary: {
    background: L.brand.primary,
    color: '#FFFFFF',
    fontWeight: L.fontWeight.semibold,
    padding: '12px 24px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    boxShadow: L.shadow,
    transition: L.transition,
  },
  primaryOnDark: {
    background: L.brand.bright,
    color: '#FFFFFF',
    fontWeight: L.fontWeight.semibold,
    padding: '12px 24px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    boxShadow: L.shadow,
    transition: L.transition,
  },
  secondary: {
    background: L.bg.card,
    color: L.text.primary,
    fontWeight: L.fontWeight.medium,
    padding: '12px 24px',
    borderRadius: 10,
    border: `1px solid ${L.border}`,
    cursor: 'pointer',
    transition: L.transition,
  },
};

// === CONTAINER ===
export const container = {
  maxWidth: 1240,
  margin: '0 auto',
  padding: '0 28px',
};

export default L;
