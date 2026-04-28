// Shared light theme constants used across all pages
export const L = {
  // Backgrounds
  pageBg:      '#F8FAFC',
  cardBg:      '#FFFFFF',
  rowHover:    '#F8FAFC',
  inputBg:     '#F8FAFC',
  emptyBg:     '#F8FAFC',

  // Borders
  border:      '#E5E7EB',
  borderLight: '#F3F4F6',

  // Text
  text:        '#0F172A',
  textSub:     '#374151',
  textMuted:   '#6B7280',
  textFaint:   '#9CA3AF',

  // Accent
  accent:      '#0AB98A',
  accentSoft:  'rgba(10,185,138,0.08)',
  accentBorder:'rgba(10,185,138,0.2)',
  accentText:  '#0AB98A',

  // Semantic
  red:         '#EF4444',
  redSoft:     'rgba(239,68,68,0.08)',
  redBorder:   'rgba(239,68,68,0.15)',
  gold:        '#F59E0B',
  goldSoft:    'rgba(245,158,11,0.08)',
  goldBorder:  'rgba(245,158,11,0.15)',
  blue:        '#3B82F6',
  blueSoft:    'rgba(59,130,246,0.08)',
  blueBorder:  'rgba(59,130,246,0.15)',
  purple:      '#8B5CF6',
  purpleSoft:  'rgba(139,92,246,0.08)',

  // Shadows
  shadow:      '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
  shadowMd:    '0 4px 12px rgba(0,0,0,0.08)',

  // Radius
  radius:      12,
  radiusSm:    8,

  // Font
  font:        "'Inter', -apple-system, sans-serif",
  fontMono:    "'JetBrains Mono', monospace",
};

// Reusable card style
export const card = {
  background:   '#FFFFFF',
  border:       '1px solid #E5E7EB',
  borderRadius: 12,
  boxShadow:    '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

// Reusable input style
export const input = {
  width:        '100%',
  padding:      '9px 12px',
  background:   '#F8FAFC',
  border:       '1px solid #E5E7EB',
  borderRadius: 8,
  color:        '#0F172A',
  fontSize:     13,
  fontFamily:   "'Inter', sans-serif",
  outline:      'none',
  boxSizing:    'border-box',
};

// Reusable page wrapper style
export const page = {
  flex:       1,
  overflowY:  'auto',
  background: '#F8FAFC',
  fontFamily: "'Inter', -apple-system, sans-serif",
  minHeight:  '100vh',
};

// Reusable top bar style
export const topBar = {
  position:       'sticky',
  top:            0,
  zIndex:         10,
  background:     'rgba(248,250,252,0.92)',
  backdropFilter: 'blur(12px)',
  borderBottom:   '1px solid #E5E7EB',
  padding:        '14px 28px',
  display:        'flex',
  justifyContent: 'space-between',
  alignItems:     'center',
};

// Reusable section title
export const sectionTitle = {
  fontSize:      15,
  fontWeight:    700,
  color:         '#0F172A',
  letterSpacing: '-0.01em',
  marginBottom:  4,
};

// Reusable label style
export const label = {
  fontSize:      10,
  fontWeight:    600,
  color:         '#6B7280',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginBottom:  6,
};

// Reusable badge
export const badge = (color, bg, border) => ({
  display:      'inline-flex',
  alignItems:   'center',
  padding:      '3px 9px',
  borderRadius: 20,
  fontSize:     10,
  fontWeight:   600,
  color,
  background:   bg,
  border:       `1px solid ${border}`,
});

// Primary button
export const btnPrimary = {
  display:        'flex',
  alignItems:     'center',
  gap:            6,
  padding:        '9px 18px',
  borderRadius:   8,
  background:     '#0AB98A',
  color:          '#FFFFFF',
  border:         'none',
  cursor:         'pointer',
  fontSize:       13,
  fontWeight:     600,
  fontFamily:     "'Inter', sans-serif",
  transition:     'all 0.15s',
};

// Secondary button
export const btnSecondary = {
  display:        'flex',
  alignItems:     'center',
  gap:            6,
  padding:        '8px 16px',
  borderRadius:   8,
  background:     'transparent',
  color:          '#6B7280',
  border:         '1px solid #E5E7EB',
  cursor:         'pointer',
  fontSize:       12,
  fontWeight:     500,
  fontFamily:     "'Inter', sans-serif",
  transition:     'all 0.15s',
};