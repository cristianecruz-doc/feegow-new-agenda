/* ============================================================================
   Feegow — New Agenda · Tokens  (Watson edition, /watson)
   Every value below is copied from ~/Github/watson-react-design-spec/
   watson-design-tokens.json (@dp-watson-web/tokens 2.0.1, customer / web / light).
   Rule: if a value is not in that file, it does not exist here.
   The only derived values are the 18% card tints (tag colour + alpha 2e),
   approved by Cris on 2026-11-13 (see RESULT.md "values not in tokens").
   ============================================================================ */

const WT = {
  // foreground (semantic.color.foreground)
  fg: '#242727', fg2: '#565f5f', muted: '#888f8f', inverted: '#f7f8f8',
  accent: '#006a59', accentInv: '#f2fcf8',
  success: '#176d00', successInv: '#f8fbf5', warning: '#865200',
  danger: '#ae2f25', dangerInv: '#fefaf8', info: '#1b5ea9', infoInv: '#f8fafe',
  // background (semantic.color.background)
  bg: '#f7f8f8', raised: '#ffffff', inset: '#f3f5f5',
  hover: '#e8eaea99', active: '#d8dada99', neutral: '#e8eaea', placeholder: '#d8dada',
  highlight: '#888f8f', backdrop: '#25282880',
  invertedBg: '#3d4343', invHover: '#4a5151', invActive: '#565f5f',
  accentSoft: '#dff9f2', accentSoftHover: '#c1f5e7', accentSoftActive: '#8febd5',
  accentFill: '#007c68', accentFillHover: '#006a59', accentFillActive: '#025b4c',
  successSoft: '#dbf0ce', warningSoft: '#fff6ba', dangerSoft: '#ffe5de', infoSoft: '#e2e9ff',
  successFill: '#1c7f00', warningFill: '#ffd625', dangerFill: '#c9392d', dangerFillHover: '#ae2f25', dangerFillActive: '#96281f', infoFill: '#256ec3',
  formAccent: '#3d4343',
  // border (semantic.color.border)
  border: '#d8dada', borderHover: '#afb4b4', borderSub: '#e8eaea', borderHi: '#888f8f',
  borderAccent: '#00a085', borderSuccess: '#38a203', borderWarning: '#e2aa00', borderDanger: '#f35a47', borderInfo: '#4e8de9',
  // calendar (components.calendar.day)
  calToday: '#00a085', calTodayFg: '#006a59', calSelBg: '#007c68', calSelFg: '#f2fcf8',
  calHi: '#dff9f2', calMuted: '#888f8f',
  // segmented control (components.segmented-control)
  segSelBg: '#d8dada99', segSelBgHover: '#d8dadacc',
  // AI (semantic gradients) — only for AI content / AI entry points
  aiLight: 'linear-gradient(-44deg, #5bc0ff 0%, #4de7ca 100%)',
  aiDark: 'linear-gradient(-44deg, #008dfc 0%, #0095d1 38.5%, #0a9e8d 76%)',
  aiSubtle: 'linear-gradient(137deg, #d1fff7 0%, #a7eaff 100%)',
  // type
  font: '"InterVariable","Inter",system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
  wBody: 450, wEmph: 550, wHead: 600, wXbold: 700,
  // radius (semantic.border-radius)
  rXS: '2px', rS: '4px', rM: '8px', rL: '16px', rXL: '24px', pill: '999px',
  // shadows (semantic.box-shadow, all layers)
  shEmphasis: 'inset 0 -1px 0 0 #00000014, 0 1px 1.5px -1px #0000000a, 0 1px 3px 0 #00000005',
  shPopout: '0 0 1px 0 #00000003, 0 1px 2px 0 #00000014, 0 2px 4px 0 #0000000f, 0 4px 8px 0 #0000000a, 0 6px 12px 0 #00000005',
  shDialog: '0 1px 2px 0 #00000005, 0 2px 4px 0 #00000005, 0 4px 8px 0 #0000000a, 0 8px 16px 0 #0000000a, 0 12px 24px 0 #0000000f, 0 16px 32px 0 #0000000f',
  // z-index (semantic.z-index)
  zSticky: 300, zPopout: 600, zModal: 900, zNotification: 1000,
};

// ---- Watson tag palette (semantic.color.tag) — categorical colours ----------
// Used for clinic / professional / procedure colours. Bar = decorative,
// tint = decorative at 18% (alpha 2e) over white, text stays WT.fg.
const TAG = {
  gray:      { bg: '#c6c6c6', deco: '#898989', inv: '#6f6f6f', fg: '#424242' },
  slategray: { bg: '#c6c6cd', deco: '#878895', inv: '#6e6e7f', fg: '#404154' },
  pink:      { bg: '#e5bbca', deco: '#c76c8f', inv: '#b84772', fg: '#6f2a44' },
  red:       { bg: '#feb3b3', deco: '#f54b4b', inv: '#c83e3e', fg: '#782525' },
  orange:    { bg: '#e6bfa5', deco: '#c9733a', inv: '#ba4e06', fg: '#722e01' },
  yellow:    { bg: '#fdb95b', deco: '#b17f3a', inv: '#90672f', fg: '#563e1c' },
  olive:     { bg: '#c6cb90', deco: '#859019', inv: '#6c7515', fg: '#40460d' },
  teal:      { bg: '#2edebe', deco: '#1b9a83', inv: '#167d6b', fg: '#0d4b40' },
  tealblue:  { bg: '#8fd1dd', deco: '#1a95ad', inv: '#157a8d', fg: '#0d4954' },
  skyblue:   { bg: '#83cffb', deco: '#2591ce', inv: '#1e75a7', fg: '#124664' },
  blue:      { bg: '#bac4f7', deco: '#6b81ee', inv: '#5668c5', fg: '#343f76' },
  lavender:  { bg: '#d3bbfc', deco: '#9979cf', inv: '#7c62a8', fg: '#4a3b64' },
  purple:    { bg: '#debce0', deco: '#b76ebc', inv: '#a54bab', fg: '#652b68' },
};
const TINT_ALPHA = '2e'; // 18% — approved 2026-11-13
const tint = hex => (hex && /^#[0-9a-f]{6}$/i.test(hex) ? hex + TINT_ALPHA : hex);

// ---- Appointment STATUS → WBadge type + Watson icon ------------------------
// Icons = the same Watson icons production uses (useDefaultAppointmentStatusOptions, booking embed misc.ts).
// Colours = WBadge types (production still uses off-token hexes; see report).
// fg/bg/dot come straight from components.badge.<type>.
const _B = {
  neutral: { fg: '#565f5f', bg: '#e8eaea', dot: '#888f8f' },
  info:    { fg: '#1b5ea9', bg: '#e2e9ff', dot: '#4e8de9' },
  warning: { fg: '#865200', bg: '#fff6ba', dot: '#e2aa00' },
  accent:  { fg: '#006a59', bg: '#dff9f2', dot: '#00a085' },
  success: { fg: '#176d00', bg: '#dbf0ce', dot: '#38a203' },
  danger:  { fg: '#ae2f25', bg: '#ffe5de', dot: '#f35a47' },
  inverted:{ fg: '#f7f8f8', bg: '#3d4343', dot: '#3d4343' },
};
const STATUS = {
  marcado:        { label: 'Marcado',        short: 'Marcado',  icon: 'calendar',      badge: 'neutral', ..._B.neutral },
  confirmado:     { label: 'Confirmado',     short: 'Confirm.', icon: 'check',         badge: 'info',    ..._B.info },
  aguardando:     { label: 'Aguardando',     short: 'Aguard.',  icon: 'clock',         badge: 'warning', ..._B.warning },
  em_atendimento: { label: 'Em atendimento', short: 'Atend.',   icon: 'play',          badge: 'accent',  ..._B.accent },
  finalizado:     { label: 'Finalizado',     short: 'Final.',   icon: 'double-check',  badge: 'success', ..._B.success },
  faltou:         { label: 'Faltou',         short: 'Faltou',   icon: 'close',         badge: 'danger',  ..._B.danger },
  remarcado:      { label: 'Remarcado',      short: 'Remarc.',  icon: 'refresh',       badge: 'neutral', ..._B.neutral, fg: '#242727' },
  cancelado:      { label: 'Cancelado',      short: 'Cancel.',  icon: 'bin',           badge: 'neutral', fg: '#888f8f', bg: '#f3f5f5', dot: '#d8dada' },
};
const STATUS_ORDER = ['marcado', 'confirmado', 'aguardando', 'em_atendimento', 'finalizado', 'faltou', 'remarcado', 'cancelado'];

// ---- Appointment TYPE colour — Watson tag hues ------------------------------
const TYPES = {
  consulta:     { label: 'Consulta',     bar: TAG.blue.deco,     tint: tint(TAG.blue.deco),     fg: TAG.blue.fg },
  retorno:      { label: 'Retorno',      bar: TAG.teal.deco,     tint: tint(TAG.teal.deco),     fg: TAG.teal.fg },
  exame:        { label: 'Exame',        bar: TAG.lavender.deco, tint: tint(TAG.lavender.deco), fg: TAG.lavender.fg },
  procedimento: { label: 'Procedimento', bar: TAG.pink.deco,     tint: tint(TAG.pink.deco),     fg: TAG.pink.fg },
  telemedicina: { label: 'Telemedicina', bar: TAG.skyblue.deco,  tint: tint(TAG.skyblue.deco),  fg: TAG.skyblue.fg },
};

// ---- Helpers ----------------------------------------------------------------
const pad2 = n => String(n).padStart(2, '0');
const fmtMin = m => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
const toMin = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const brl = n => 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const WEEKDAYS_FULL = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

Object.assign(window, { WT, TAG, tint, STATUS, STATUS_ORDER, TYPES, pad2, fmtMin, toMin, brl, WEEKDAYS, WEEKDAYS_FULL, MONTHS, MONTHS_SHORT });
