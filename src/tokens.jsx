/* ============================================================================
   Feegow — New Agenda · Tokens
   Watson design system (customer / web / light). Values inlined from the spec.
   ============================================================================ */

const WT = {
  // foreground
  fg: '#242727', fg2: '#565f5f', muted: '#888f8f', inverted: '#f7f8f8',
  accent: '#006a59', accentInv: '#f2fcf8',
  success: '#176d00', warning: '#865200', danger: '#ae2f25', info: '#1b5ea9',
  // background
  bg: '#f7f8f8', raised: '#ffffff', inset: '#f3f5f5',
  hover: '#e8eaea99', active: '#d8dada99', neutral: '#e8eaea', placeholder: '#d8dada',
  invertedBg: '#3d4343', invHover: '#4a5151',
  accentSoft: '#dff9f2', accentSoftHover: '#c1f5e7', accentFill: '#007c68', accentFillHover: '#006a59',
  successSoft: '#dbf0ce', warningSoft: '#fff6ba', dangerSoft: '#ffe5de', infoSoft: '#e2e9ff',
  successFill: '#1c7f00', dangerFill: '#c9392d',
  // border
  border: '#d8dada', borderHover: '#afb4b4', borderSub: '#e8eaea', borderHi: '#888f8f',
  borderAccent: '#00a085', borderDanger: '#f35a47',
  // calendar
  calToday: '#00a085', calTodayFg: '#006a59', calSelBg: '#007c68', calSelFg: '#f2fcf8',
  calHi: '#dff9f2', calMuted: '#888f8f',
  // type
  font: '"InterVariable","Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
  wBody: 450, wEmph: 550, wHead: 600, wXbold: 700,
  // radius
  rS: '4px', rM: '8px', rL: '16px', rXL: '24px', pill: '999px',
  // shadow
  shEmphasis: 'inset 0 -1px 0 0 #00000014, 0 1px 1.5px -1px #0000000a, 0 1px 3px 0 #00000005',
  shPopout: '0 0 1px 0 #00000003, 0 1px 2px 0 #00000014, 0 2px 4px 0 #0000000f, 0 4px 8px 0 #0000000a, 0 6px 12px 0 #00000005',
  shDialog: '0 1px 2px 0 #00000005, 0 2px 4px 0 #00000005, 0 4px 8px 0 #0000000a, 0 8px 16px 0 #0000000a, 0 12px 24px 0 #0000000f, 0 16px 32px 0 #0000000f',
};

// ---- Appointment STATUS (spec §4.1) -----------------------------------------
// Patient status on the timeline. label PT · fg/bg for chip · dot color · badge type
const STATUS = {
  marcado:        { label: 'Marcado',        short: 'Marcado',    fg: '#565f5f', bg: '#eef0f0', dot: '#888f8f', icon: 'circle',          badge: 'neutral' },
  confirmado:     { label: 'Confirmado',      short: 'Confirm.',   fg: '#1f6fb0', bg: '#e8f1f9', dot: '#1f6fb0', icon: 'check',           badge: 'info' },
  aguardando:     { label: 'Aguardando',      short: 'Aguard.',    fg: '#9a6700', bg: '#fdf3da', dot: '#d99e00', icon: 'armchair',        badge: 'warning' },
  em_atendimento: { label: 'Em atendimento',  short: 'Atend.',     fg: '#006a59', bg: '#dff9f2', dot: '#006a59', icon: 'stethoscope',     badge: 'accent' },
  finalizado:     { label: 'Finalizado',      short: 'Final.',     fg: '#176d00', bg: '#f1f7ec', dot: '#176d00', icon: 'check-check',     badge: 'success' },
  faltou:         { label: 'Faltou',          short: 'Faltou',     fg: '#b42318', bg: '#fbeae8', dot: '#b42318', icon: 'user-x',          badge: 'danger' },
  cancelado:      { label: 'Cancelado',       short: 'Cancel.',    fg: '#888f8f', bg: '#f3f5f5', dot: '#afb4b4', icon: 'x',               badge: 'neutral' },
};
const STATUS_ORDER = ['marcado', 'confirmado', 'aguardando', 'em_atendimento', 'finalizado', 'faltou', 'cancelado'];

// ---- Appointment TYPE color (spec §M3) — auto-assigned by procedure ----------
// Separate dimension from status. Rendered as left bar + optional fill tint.
const TYPES = {
  consulta:     { label: 'Consulta',     bar: '#1b5ea9', tint: '#eaf1f9', fg: '#1a4e87' },
  retorno:      { label: 'Retorno',      bar: '#007c68', tint: '#dff9f2', fg: '#055f4f' },
  exame:        { label: 'Exame',        bar: '#7b3fb0', tint: '#f3ecfb', fg: '#5b2d83' },
  procedimento: { label: 'Procedimento', bar: '#a23a7a', tint: '#fbeaf3', fg: '#7d2c5e' },
  telemedicina: { label: 'Telemedicina', bar: '#0e7aa0', tint: '#e3f3f9', fg: '#0b5d79' },
};

// ---- Helpers ----------------------------------------------------------------
const pad2 = n => String(n).padStart(2, '0');
// minutes-from-midnight → "HH:MM"
const fmtMin = m => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
// "HH:MM" → minutes
const toMin = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const brl = n => 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const WEEKDAYS_FULL = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

Object.assign(window, { WT, STATUS, STATUS_ORDER, TYPES, pad2, fmtMin, toMin, brl, WEEKDAYS, WEEKDAYS_FULL, MONTHS, MONTHS_SHORT });
