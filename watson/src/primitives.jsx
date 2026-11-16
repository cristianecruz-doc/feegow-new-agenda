/* ============================================================================
   Feegow — New Agenda · Watson primitives
   Cosmetic recreations of Watson components, extended for the agenda.
   ============================================================================ */

// ---- Icon — Watson iconography (@docplanner/iconography sprite) ------------
// The prototype was written with Lucide names; LUCIDE_TO_WATSON maps each one
// to the closest Watson icon. Names already in the Watson set pass through.
const LUCIDE_TO_WATSON = {
  'x': 'close', 'x-circle': 'close-circle', 'check': 'check', 'check-check': 'double-check',
  'alert-triangle': 'warning-triangle', 'alert-circle': 'warning', 'circle-alert': 'warning', 'shield-alert': 'warning-triangle',
  'user-round': 'user', 'user': 'user', 'person-standing': 'user', 'users': 'people', 'contact': 'identifier', 'id-card': 'identifier',
  'user-x': 'no-user', 'user-plus': 'saas-new-patient', 'user-check': 'verified',
  'stethoscope': 'stethoscope', 'search': 'search', 'repeat': 'repeat', 'plus': 'plus', 'minus': 'minus', 'info': 'info',
  'clock': 'clock', 'clock-fading': 'pending', 'history': 'history',
  'chevron-down': 'caret', 'chevron-up': 'caret-top', 'chevron-left': 'caret-left', 'chevron-right': 'caret-right', 'chevrons-up-down': 'unfold',
  'calendar': 'calendar', 'calendar-days': 'calendar', 'calendar-clock': 'move-visit', 'calendar-plus': 'add-visit',
  'calendar-check': 'calendar-with-check', 'calendar-x': 'calendar-off', 'calendar-range': 'view-week', 'ban': 'calendar-block',
  'lock': 'lock', 'door-open': 'door', 'clipboard-list': 'checklist', 'list-checks': 'checklist', 'clipboard-check': 'clipboard',
  'banknote': 'bank-note', 'wallet': 'wallet', 'credit-card': 'credit-card', 'receipt': 'receipt',
  'shield-check': 'protect', 'phone': 'phone', 'smartphone': 'mobile-phone', 'laptop': 'monitor',
  'sparkles': 'ai-sparkles', 'settings': 'settings', 'settings-2': 'settings', 'wrench': 'settings', 'sliders-horizontal': 'filters', 'filter': 'filters',
  'arrow-up-right': 'open-in-full', 'external-link': 'open-in-full', 'square-arrow-out-up-right': 'open-in-full',
  'activity': 'trending-up', 'heart-pulse': 'health-checkup', 'flask-conical': 'tube', 'baby': 'infant', 'accessibility': 'disabled-access',
  'trash-2': 'bin', 'sticky-note': 'notes', 'mail': 'mail', 'send': 'paper-plane', 'printer': 'print',
  'list': 'list-bullets', 'layout-grid': 'view-grid', 'table': 'view-grid', 'columns-3': 'view-week', 'layers': 'layers', 'database': 'layers',
  'git-merge': 'sync', 'git-branch': 'sync', 'replace': 'sync', 'arrow-left-right': 'sync', 'refresh-cw': 'refresh', 'rotate-ccw': 'revert',
  'file-text': 'file-text', 'building-2': 'clinic', 'armchair': 'sand-clock', 'archive': 'archive',
  'message-square': 'bubble-chat', 'message-circle': 'bubble-chat-text', 'menu': 'hamburger', 'link': 'connected', 'globe': 'globe',
  'circle': 'circle', 'bell': 'notifications', 'bell-ring': 'notifications', 'sun': 'bulb', 'eye-off': 'hide', 'eye': 'show',
  'pencil': 'pen', 'panel-right-close': 'right-panel-close', 'panel-right-open': 'right-panel-open', 'mouse-pointer-2': 'click',
  'megaphone': 'megaphone', 'map-pin': 'pin', 'map': 'directions', 'log-in': 'out', 'log-out': 'logout',
  'circle-help': 'question', 'camera': 'camera-circle', 'video': 'video-consultation', 'copy': 'copy', 'download': 'download', 'upload': 'upload',
  'more-horizontal': 'dot-menu', 'more-vertical': 'dot-menu', 'ellipsis': 'dot-menu', 'grip-vertical': 'drag',
  'arrow-left': 'arrow-left', 'arrow-right': 'arrow-right', 'arrow-up': 'arrow-up', 'arrow-down': 'arrow-down',
  'star': 'star', 'heart': 'heart', 'home': 'home', 'pill': 'pill', 'syringe': 'vaccine', 'microscope': 'microscope',
  'maximize-2': 'enlarge', 'minimize-2': 'minimalize', 'zoom-in': 'magnifier-plus', 'zoom-out': 'magnifier-less',
  'chevrons-left': 'left-panel-close', 'chevrons-right': 'left-panel-open', 'bell-off': 'notifications', 'tag': 'notes',
};
const W_ICONS_URL = 'assets/watson-icons.svg';
const __missingIcons = new Set();
function watsonIconName(name) {
  const n = LUCIDE_TO_WATSON[name] || name;
  if (!LUCIDE_TO_WATSON[name] && !__missingIcons.has(name)) {
    __missingIcons.add(name);
    if (!window.__WATSON_ICON_NAMES || !window.__WATSON_ICON_NAMES.has(name)) console.warn('[watson] icon not mapped:', name);
  }
  return n;
}
// strokeWidth is accepted for API compatibility; Watson icons are filled glyphs.
function WIcon({ name, size = 16, color = WT.muted, strokeWidth, style = {}, ariaLabel }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden={ariaLabel ? undefined : 'true'} aria-label={ariaLabel} role={ariaLabel ? 'img' : undefined}
      style={{ display: 'inline-block', flex: 'none', color, ...style }}>
      <use href={`${W_ICONS_URL}#${watsonIconName(name)}`} />
    </svg>
  );
}

// ---- Button (components.button) ---------------------------------------------
const W_BTN_VARIANTS = {
  default:   { bg: '#ffffff', fg: WT.fg, ring: 'inset 0 0 0 1px ' + WT.border, hover: WT.hover, active: WT.active, focus: WT.border },
  primary:   { bg: WT.accentFill, fg: WT.accentInv, ring: 'none', hover: WT.accentFillHover, active: WT.accentFillActive, focus: WT.borderAccent },
  secondary: { bg: '#ffffff', fg: WT.accent, ring: 'inset 0 0 0 1px ' + WT.border, hover: WT.hover, active: WT.active, focus: WT.border },
  danger:    { bg: WT.dangerFill, fg: WT.dangerInv, ring: 'none', hover: WT.dangerFillHover, active: WT.dangerFillActive, focus: WT.borderDanger },
  plain:     { bg: 'transparent', fg: WT.fg2, fgHover: WT.fg, ring: 'none', hover: WT.hover, active: WT.active, focus: WT.border },
};
function WButton({ label, children, variant = 'default', size = 'm', leadingIcon, trailingIcon, fullWidth, onClick, type = 'button', disabled, style = {} }) {
  const v = W_BTN_VARIANTS[variant] || W_BTN_VARIANTS.default;
  const [hover, setHover] = React.useState(false);
  const [down, setDown] = React.useState(false);
  const h = size === 'l' ? 44 : size === 's' ? 24 : 32;
  const fg = disabled ? WT.muted : ((hover || down) && v.fgHover ? v.fgHover : v.fg);
  // Watson default/secondary keep a white fill and paint the hover overlay on top of it
  const overlay = down ? v.active : (hover && !disabled ? v.hover : null);
  const isOverlay = variant === 'default' || variant === 'secondary';
  const bg = disabled ? WT.placeholder : (isOverlay ? v.bg : (overlay || v.bg));
  return (
    <button type={type} onClick={disabled ? undefined : onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setDown(false); }}
      onMouseDown={() => setDown(true)} onMouseUp={() => setDown(false)}
      style={{
        height: h, borderRadius: WT.rM, padding: size === 'l' ? '0 16px' : '0 8px', border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: WT.font, fontSize: size === 'l' ? 16 : 14, fontWeight: WT.wEmph, lineHeight: 1.5,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        width: fullWidth ? '100%' : 'auto', color: fg, whiteSpace: 'nowrap',
        background: isOverlay && overlay && !disabled ? `linear-gradient(${overlay}, ${overlay}), ${v.bg}` : bg,
        boxShadow: variant === 'plain' || disabled ? 'none' : `${WT.shEmphasis}${v.ring !== 'none' ? ', ' + v.ring : ''}`,
        transition: 'background .12s', ...style,
      }}>
      {leadingIcon && <WIcon name={leadingIcon} size={size === 'l' ? 20 : 16} color={fg} />}
      {label || children}
      {trailingIcon && <WIcon name={trailingIcon} size={size === 'l' ? 20 : 16} color={fg} />}
    </button>
  );
}

// ---- Icon button (components.icon-button) ------------------------------------
function WIconButton({ name, size = 16, onClick, title, active, color = WT.fg2, dim = 32, style = {} }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button type="button" onClick={onClick} title={title} aria-label={title}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: dim, height: dim, borderRadius: WT.rM, border: 'none', cursor: 'pointer', padding: 0,
        background: active ? WT.active : (hover ? WT.hover : 'transparent'),
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none', ...style,
      }}>
      <WIcon name={name} size={size} color={color} />
    </button>
  );
}

// ---- Badge (components.badge) -----------------------------------------------
const W_BADGE = {
  neutral: ['#e8eaea', '#565f5f', '#888f8f'], accent: ['#dff9f2', '#006a59', '#00a085'],
  info:    ['#e2e9ff', '#1b5ea9', '#4e8de9'], success: ['#dbf0ce', '#176d00', '#38a203'],
  danger:  ['#ffe5de', '#ae2f25', '#f35a47'], warning: ['#fff6ba', '#865200', '#e2aa00'],
  'neutral-inverted': ['#3d4343', '#f7f8f8', null], 'accent-inverted': ['#007c68', '#f2fcf8', null],
  'info-inverted': ['#256ec3', '#f8fafe', null], 'success-inverted': ['#1c7f00', '#f8fbf5', null],
  'danger-inverted': ['#c9392d', '#fefaf8', null], 'warning-inverted': ['#ffd625', '#865200', null],
};
const W_BADGE_ICON = { info: 'info', success: 'check-filled', warning: 'warning-triangle', danger: 'dangerous' };
function WBadge({ type = 'neutral', icon, dot, children, style = {} }) {
  const [bg, fg, bd] = W_BADGE[type] || W_BADGE.neutral;
  const ic = icon === false ? null : (icon || W_BADGE_ICON[type] || null);
  return (
    <span style={{
      height: 20, padding: '0 8px', borderRadius: WT.pill, display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 12, fontWeight: WT.wEmph, lineHeight: 1.15, background: bg, color: fg,
      boxShadow: bd ? `inset 0 0 0 1px ${bd}` : 'none', whiteSpace: 'nowrap', ...style,
    }}>
      {dot && !ic && <span style={{ width: 8, height: 8, borderRadius: '50%', background: fg, flex: 'none' }} />}
      {ic && <WIcon name={ic} size={12} color={fg} />}
      {children}
    </span>
  );
}

// ---- Avatar (components.avatar: xsmall 16 / medium 32 / large 64) -----------
function WAvatar({ initials, size = 32, color, bg, ring, style = {} }) {
  const fontSize = size >= 64 ? 24 : size >= 32 ? 12 : 10;
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', flex: 'none',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: WT.wEmph, lineHeight: 1.15,
      background: bg || WT.accentSoft, color: color || WT.accent,
      boxShadow: `inset 0 0 0 ${ring ? 2 : 1}px ${ring || WT.borderAccent}`, ...style,
    }}>{initials}</span>
  );
}

// neutral profile photo — professional photo when present, else the empty avatar
function WProfileAvatar({ src, size = 32, icon = 'user', style = {}, title }) {
  return (
    <span title={title} style={{
      width: size, height: size, borderRadius: '50%', flex: 'none', overflow: 'hidden',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: WT.invertedBg, ...style,
    }}>
      {src
        ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <WIcon name={icon} size={size >= 32 ? 16 : 12} color={WT.inverted} />}
    </span>
  );
}

// ---- Card (components.card) -------------------------------------------------
function WCard({ variant = 'raised', padding = 16, children, style = {} }) {
  return (
    <div style={{
      background: variant === 'inset' ? WT.inset : WT.raised,
      border: `1px solid ${WT.border}`, borderRadius: WT.rL, padding, ...style,
    }}>{children}</div>
  );
}

// ---- Field label (components.label) -----------------------------------------
function WLabel({ children, required, hint }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: WT.wEmph, color: WT.fg, lineHeight: 1.5 }}>
      {children}
      {required && <span style={{ color: WT.danger }}>*</span>}
      {hint && <span style={{ fontWeight: WT.wBody, color: WT.fg2, fontSize: 12 }}>{hint}</span>}
    </span>
  );
}

// ---- Input (components.input) -----------------------------------------------
function WInput({ label, value, onChange, placeholder, prefixIcon, suffixIcon, error, hint, required, type = 'text', size = 'm', onFocus, onBlur, inputRef, style = {} }) {
  const [focus, setFocus] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const bc = error ? WT.borderDanger : (focus ? WT.borderHi : (hover ? WT.borderHover : WT.border));
  const h = size === 'l' ? 44 : 32;
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
      {label && <WLabel required={required}>{label}</WLabel>}
      <span onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
        height: h, borderRadius: WT.rM, border: `1px solid ${bc}`, background: '#ffffff',
        display: 'flex', alignItems: 'center', gap: 8, padding: size === 'l' ? '0 16px' : '0 8px',
        outline: focus ? `2px solid ${error ? WT.borderDanger : WT.borderHi}` : 'none', outlineOffset: -1,
      }}>
        {prefixIcon && <WIcon name={prefixIcon} size={16} />}
        <input ref={inputRef} type={type} value={value} placeholder={placeholder}
          onChange={e => onChange && onChange(e.target.value)}
          onFocus={() => { setFocus(true); onFocus && onFocus(); }} onBlur={() => { setFocus(false); onBlur && onBlur(); }}
          style={{ border: 'none', outline: 'none', font: `${WT.wBody} ${size === 'l' ? 16 : 14}px ${WT.font}`, flex: 1, background: 'transparent', color: WT.fg, minWidth: 0 }} />
        {suffixIcon && <WIcon name={suffixIcon} size={16} />}
      </span>
      {error && <span style={{ fontSize: 12, color: WT.danger, display: 'flex', alignItems: 'center', gap: 4 }}><WIcon name="dangerous" size={12} color={WT.danger} />{error}</span>}
      {hint && !error && <span style={{ fontSize: 12, color: WT.fg2 }}>{hint}</span>}
    </label>
  );
}

// ---- Textarea (components.textarea) -----------------------------------------
function WTextarea({ label, value, onChange, placeholder, rows = 3, required, error, style = {} }) {
  const [focus, setFocus] = React.useState(false);
  const bc = error ? WT.borderDanger : (focus ? WT.borderHi : WT.border);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
      {label && <WLabel required={required}>{label}</WLabel>}
      <textarea value={value} placeholder={placeholder} rows={rows}
        onChange={e => onChange && onChange(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          borderRadius: WT.rM, border: `1px solid ${bc}`, background: '#ffffff', padding: 8, minHeight: 44,
          font: `${WT.wBody} 14px/1.5 ${WT.font}`, color: WT.fg, resize: 'vertical',
          outline: focus ? `2px solid ${error ? WT.borderDanger : WT.borderHi}` : 'none', outlineOffset: -1,
        }} />
      {error && <span style={{ fontSize: 12, color: WT.danger }}>{error}</span>}
    </label>
  );
}

// ---- Select (components.select, native-backed) ------------------------------
function WSelect({ label, value, onChange, options, placeholder = 'Selecione…', required, error, size = 'm', style = {} }) {
  const [focus, setFocus] = React.useState(false);
  const bc = error ? WT.borderDanger : (focus ? WT.borderHi : WT.border);
  const h = size === 'l' ? 44 : 32;
  const opts = options.map(o => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
      {label && <WLabel required={required}>{label}</WLabel>}
      <span style={{
        position: 'relative', height: h, borderRadius: WT.rM, border: `1px solid ${bc}`, background: '#ffffff',
        display: 'flex', alignItems: 'center', padding: '0 8px',
        outline: focus ? `2px solid ${error ? WT.borderDanger : WT.borderHi}` : 'none', outlineOffset: -1,
      }}>
        <select value={value} onChange={e => onChange && onChange(e.target.value)}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ appearance: 'none', WebkitAppearance: 'none', border: 'none', outline: 'none', background: 'transparent',
            font: `${WT.wBody} 14px ${WT.font}`, color: value ? WT.fg : WT.muted, flex: 1, cursor: 'pointer', paddingRight: 24 }}>
          {placeholder && <option value="">{placeholder}</option>}
          {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <WIcon name="caret" size={16} style={{ position: 'absolute', right: 8, pointerEvents: 'none' }} />
      </span>
      {error && <span style={{ fontSize: 12, color: WT.danger }}>{error}</span>}
    </label>
  );
}

// ---- Checkbox (components.checkbox: 18px, radius 4, border 2px) -------------
function WCheckbox({ checked, onChange, label, disabled }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 14, lineHeight: 1.5, color: disabled ? WT.muted : WT.fg }}>
      <span onClick={() => !disabled && onChange && onChange(!checked)} style={{
        width: 18, height: 18, borderRadius: WT.rS, flex: 'none',
        border: `2px solid ${disabled ? WT.placeholder : (checked ? WT.formAccent : WT.borderHi)}`,
        background: disabled ? WT.placeholder : (checked ? WT.formAccent : '#ffffff'),
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <WIcon name="check" size={12} color={WT.inverted} />}
      </span>
      {label}
    </label>
  );
}

// ---- Radio group (components.radio) -----------------------------------------
function WRadio({ value, onChange, options, name }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map(o => {
        const opt = typeof o === 'string' ? { value: o, label: o } : o;
        const on = value === opt.value;
        return (
          <label key={opt.value} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, lineHeight: 1.5, color: WT.fg }}>
            <span onClick={() => onChange(opt.value)} style={{
              width: 18, height: 18, borderRadius: '50%', flex: 'none',
              border: `2px solid ${on ? WT.formAccent : WT.borderHi}`, background: on ? WT.formAccent : '#ffffff',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {on && <span style={{ width: 8, height: 8, borderRadius: '50%', background: WT.inverted }} />}
            </span>
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}

// ---- Toggle (components.toggle: track 36×20, knob 16) -----------------------
function WToggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, lineHeight: 1.5, color: WT.fg }}>
      <span onClick={() => onChange && onChange(!checked)} style={{
        width: 36, height: 20, borderRadius: WT.pill, background: checked ? WT.accentFill : WT.borderHi,
        position: 'relative', transition: 'background .15s', flex: 'none',
      }}>
        <span style={{ position: 'absolute', top: 2, left: checked ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#ffffff', boxShadow: WT.shEmphasis, transition: 'left .15s' }} />
      </span>
      {label}
    </label>
  );
}

// ---- Segmented control (components.segmented-control) -----------------------
// height 32, padding 3, gap 2, item 25px, radius 8 / item 5, selected = neutral fill.
function WSegmented({ options, value, onChange, size = 'm' }) {
  const mobile = size === 'l';
  return (
    <div style={{ display: 'inline-flex', background: '#ffffff', border: `1px solid ${WT.border}`, borderRadius: WT.rM, padding: 3, gap: 2, height: mobile ? 44 : 32, boxSizing: 'border-box', alignItems: 'center' }}>
      {options.map(o => {
        const opt = typeof o === 'string' ? { value: o, label: o } : o;
        const on = opt.value === value;
        return (
          <button key={opt.value} onClick={() => onChange && onChange(opt.value)} style={{
            height: mobile ? 36 : 24, padding: '0 8px', borderRadius: 5, border: 'none', cursor: 'pointer',
            fontFamily: WT.font, fontSize: 14, fontWeight: on ? WT.wEmph : WT.wBody, lineHeight: 1.5,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: on ? WT.segSelBg : 'transparent', color: on ? WT.fg : WT.fg2,
          }}>
            {opt.icon && <WIcon name={opt.icon} size={16} color={on ? WT.fg : WT.fg2} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ---- Divider (components.divider) -------------------------------------------
function WDivider({ vertical, style = {} }) {
  return vertical
    ? <div style={{ width: 1, alignSelf: 'stretch', background: WT.borderSub, ...style }} />
    : <div style={{ height: 1, background: WT.borderSub, width: '100%', ...style }} />;
}

// ---- Spinner (components.spinner: accent stroke, track 20%, 1200ms) ---------
function WSpinner({ size = 12, color = WT.accent }) {
  return (
    <span style={{ display: 'inline-flex', width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: 'wspin 1.2s linear infinite' }}>
        <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeOpacity="0.2" strokeWidth="3" />
        <path d="M12 3 a9 9 0 0 1 9 9" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}

// ---- Popover (anchored, click-outside) --------------------------------------
function WPopover({ anchorRect, onClose, children, width = 320, placement = 'auto', offset = 8 }) {
  const ref = React.useRef(null);
  const MARGIN = 16;
  React.useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target) && document.contains(e.target)) onClose(); };
    const k = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', h); document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, [onClose]);
  // Measure the real height and keep the whole popover (incl. its footer) inside
  // the viewport. Re-runs on content growth (patient/procedure added) via ResizeObserver.
  React.useLayoutEffect(() => {
    const el = ref.current; if (!el || !anchorRect) return;
    const reposition = () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const h = el.offsetHeight, w = el.offsetWidth || width;
      let left = anchorRect.right + offset;
      if (left + w > vw - MARGIN) left = anchorRect.left - w - offset;
      if (left < MARGIN) left = Math.min(Math.max(MARGIN, anchorRect.left), vw - w - MARGIN);
      let top = anchorRect.top;
      if (top + h > vh - MARGIN) top = vh - MARGIN - h;
      if (top < MARGIN) top = MARGIN;
      el.style.left = left + 'px';
      el.style.top = top + 'px';
    };
    reposition();
    let ro;
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(reposition); ro.observe(el); }
    window.addEventListener('resize', reposition);
    return () => { ro && ro.disconnect(); window.removeEventListener('resize', reposition); };
  }, [anchorRect, width, offset]);
  if (!anchorRect) return null;
  // first-paint best guess (the layout effect refines it once measured)
  const vw = window.innerWidth, vh = window.innerHeight;
  let left = anchorRect.right + offset;
  if (left + width > vw - MARGIN) left = anchorRect.left - width - offset;
  if (left < MARGIN) left = Math.min(Math.max(MARGIN, anchorRect.left), vw - width - MARGIN);
  const top = Math.max(MARGIN, Math.min(anchorRect.top, Math.max(MARGIN, vh - MARGIN - 220)));
  return (
    <div ref={ref} style={{
      position: 'fixed', left, top, width, zIndex: WT.zNotification, background: '#ffffff',
      borderRadius: WT.rM, boxShadow: WT.shPopout, overflow: 'hidden',
      display: 'flex', flexDirection: 'column', maxHeight: `calc(100vh - ${MARGIN * 2}px)`,
    }}>{children}</div>
  );
}

// ---- Toast (components.toast: #3d4343, radius 16, padding 16, bottom 16) ---
function WToast({ toast }) {
  if (!toast) return null;
  const tone = toast.tone || 'success';
  const err = tone === 'danger';
  const ic = tone === 'success' ? 'check-filled' : err ? 'dangerous' : 'info';
  return (
    <div role="status" style={{
      position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: WT.zNotification,
      background: err ? WT.dangerFill : WT.invertedBg, color: err ? WT.dangerInv : WT.inverted, borderRadius: WT.rL, padding: '8px 16px', minHeight: 56, boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', gap: 8, boxShadow: WT.shDialog, fontSize: 14, fontWeight: WT.wBody, lineHeight: 1.5,
      animation: 'wtoast .25s ease',
    }}>
      <WIcon name={ic} size={20} color={err ? WT.dangerInv : WT.inverted} />
      {toast.msg}
      {toast.action && <button onClick={toast.action.onClick} style={{ height: 32, padding: '0 8px', borderRadius: WT.rM, border: 'none', background: err ? WT.dangerFill : WT.invertedBg, color: err ? WT.dangerInv : WT.inverted, fontWeight: WT.wEmph, cursor: 'pointer', fontFamily: WT.font, fontSize: 14, marginLeft: 8 }}
        onMouseEnter={e => { e.currentTarget.style.background = err ? WT.dangerFillHover : WT.invHover; }} onMouseLeave={e => { e.currentTarget.style.background = err ? WT.dangerFill : WT.invertedBg; }}>{toast.action.label}</button>}
    </div>
  );
}

Object.assign(window, {
  WIcon, WButton, WIconButton, WBadge, WAvatar, WProfileAvatar, WCard, WLabel, WInput, WTextarea,
  WSelect, WCheckbox, WRadio, WToggle, WSegmented, WDivider, WSpinner, WPopover, WToast,
});
