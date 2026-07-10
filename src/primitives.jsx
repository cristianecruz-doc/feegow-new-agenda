/* ============================================================================
   Feegow — New Agenda · Watson primitives
   Cosmetic recreations of Watson components, extended for the agenda.
   ============================================================================ */

// ---- Icon (Lucide substitute for @docplanner/iconography) -------------------
function WIcon({ name, size = 16, color = WT.muted, strokeWidth = 2, style = {} }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const host = ref.current;
    if (!host || !window.lucide) return;
    host.innerHTML = '';
    const i = document.createElement('i');
    i.setAttribute('data-lucide', name);
    i.setAttribute('width', size); i.setAttribute('height', size);
    i.setAttribute('stroke-width', strokeWidth);
    host.appendChild(i);
    try { window.lucide.createIcons(); } catch (e) {}
  }, [name, size, strokeWidth]);
  return <span ref={ref} aria-hidden="true"
    style={{ display: 'inline-flex', width: size, height: size, color, flex: 'none', ...style }} />;
}

// ---- Button -----------------------------------------------------------------
const W_BTN_VARIANTS = {
  default:   { bg: '#fff', fg: WT.fg, ring: 'inset 0 0 0 1px ' + WT.border, hover: '#f1f3f3', active: WT.active },
  primary:   { bg: WT.accentFill, fg: WT.accentInv, ring: 'none', hover: WT.accentFillHover, active: '#025b4c' },
  secondary: { bg: '#fff', fg: WT.accent, ring: 'inset 0 0 0 1px ' + WT.border, hover: '#f1f3f3', active: WT.active },
  danger:    { bg: WT.dangerFill, fg: '#fefaf8', ring: 'none', hover: WT.danger, active: '#96281f' },
  plain:     { bg: 'transparent', fg: WT.fg2, ring: 'none', hover: WT.hover, active: WT.active },
};
function WButton({ label, children, variant = 'default', size = 'm', leadingIcon, trailingIcon, fullWidth, onClick, type = 'button', disabled, style = {} }) {
  const v = W_BTN_VARIANTS[variant];
  const [hover, setHover] = React.useState(false);
  const [down, setDown] = React.useState(false);
  const h = size === 'l' ? 44 : size === 's' ? 24 : 32;
  return (
    <button type={type} onClick={disabled ? undefined : onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setDown(false); }}
      onMouseDown={() => setDown(true)} onMouseUp={() => setDown(false)}
      style={{
        height: h, borderRadius: WT.rM, padding: size === 's' ? '0 10px' : '0 12px', border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        fontFamily: WT.font, fontSize: 14, fontWeight: WT.wEmph, lineHeight: 1.5,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        width: fullWidth ? '100%' : 'auto', color: v.fg, whiteSpace: 'nowrap',
        background: down ? v.active : (hover && !disabled ? v.hover : v.bg),
        boxShadow: variant === 'plain' ? 'none' : `${WT.shEmphasis}, ${v.ring}`,
        transition: 'background .12s', ...style,
      }}>
      {leadingIcon && <WIcon name={leadingIcon} size={16} color={v.fg} />}
      {label || children}
      {trailingIcon && <WIcon name={trailingIcon} size={16} color={v.fg} />}
    </button>
  );
}

// ---- Icon button ------------------------------------------------------------
function WIconButton({ name, size = 16, onClick, title, active, color = WT.fg2, dim = 32, style = {} }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button type="button" onClick={onClick} title={title}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: dim, height: dim, borderRadius: WT.rM, border: 'none', cursor: 'pointer',
        background: active ? WT.active : (hover ? WT.hover : 'transparent'),
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none', ...style,
      }}>
      <WIcon name={name} size={size} color={color} />
    </button>
  );
}

// ---- Badge ------------------------------------------------------------------
const W_BADGE = {
  neutral: ['#e8eaea', '#565f5f', '#c4c9c9'], accent: ['#dff9f2', '#006a59', '#9ee4d2'],
  info:    ['#e2e9ff', '#1b5ea9', '#aec6ee'], success: ['#dbf0ce', '#176d00', '#a9d68f'],
  danger:  ['#ffe5de', '#ae2f25', '#f0b3a8'], warning: ['#fff6ba', '#865200', '#e8d27a'],
};
function WBadge({ type = 'neutral', icon, dot, children, style = {} }) {
  const [bg, fg, bd] = W_BADGE[type] || W_BADGE.neutral;
  return (
    <span style={{
      height: 20, padding: '0 8px', borderRadius: WT.pill, display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 12, fontWeight: WT.wEmph, lineHeight: 1.15, background: bg, color: fg,
      border: `1px solid ${bd}`, whiteSpace: 'nowrap', ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: fg, flex: 'none' }} />}
      {icon && <WIcon name={icon} size={12} color={fg} />}
      {children}
    </span>
  );
}

// ---- Avatar -----------------------------------------------------------------
function WAvatar({ initials, size = 32, color, bg, ring, style = {} }) {
  const fontSize = size >= 40 ? 14 : size >= 28 ? 12 : 10;
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', flex: 'none',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: WT.wEmph, lineHeight: 1, letterSpacing: '.01em',
      background: bg || WT.accentSoft, color: color || WT.accent,
      border: ring ? `2px solid ${ring}` : `1px solid ${WT.borderAccent}`, ...style,
    }}>{initials}</span>
  );
}

// ---- Card -------------------------------------------------------------------
function WCard({ variant = 'raised', padding = 16, children, style = {} }) {
  return (
    <div style={{
      background: variant === 'inset' ? WT.inset : WT.raised,
      border: `1px solid ${WT.border}`, borderRadius: WT.rL, padding, ...style,
    }}>{children}</div>
  );
}

// ---- Field label ------------------------------------------------------------
function WLabel({ children, required, hint }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: WT.wEmph, color: WT.fg }}>
      {children}
      {required && <span style={{ color: WT.danger }}>*</span>}
      {hint && <span style={{ fontWeight: WT.wBody, color: WT.muted, fontSize: 12 }}>{hint}</span>}
    </span>
  );
}

// ---- Input ------------------------------------------------------------------
function WInput({ label, value, onChange, placeholder, prefixIcon, suffixIcon, error, hint, required, type = 'text', size = 'm', onFocus, onBlur, inputRef, style = {} }) {
  const [focus, setFocus] = React.useState(false);
  const bc = error ? WT.borderDanger : (focus ? WT.borderHi : WT.border);
  const h = size === 'l' ? 44 : 32;
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
      {label && <WLabel required={required}>{label}</WLabel>}
      <span style={{
        height: h, borderRadius: WT.rM, border: `1px solid ${bc}`, background: '#fff',
        display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px',
        outline: focus ? `2px solid ${error ? WT.borderDanger : WT.borderAccent}` : 'none', outlineOffset: -1,
      }}>
        {prefixIcon && <WIcon name={prefixIcon} size={16} />}
        <input ref={inputRef} type={type} value={value} placeholder={placeholder}
          onChange={e => onChange && onChange(e.target.value)}
          onFocus={() => { setFocus(true); onFocus && onFocus(); }} onBlur={() => { setFocus(false); onBlur && onBlur(); }}
          style={{ border: 'none', outline: 'none', font: `${WT.wBody} 14px ${WT.font}`, flex: 1, background: 'transparent', color: WT.fg, minWidth: 0 }} />
        {suffixIcon && <WIcon name={suffixIcon} size={16} />}
      </span>
      {error && <span style={{ fontSize: 12, color: WT.danger, display: 'flex', alignItems: 'center', gap: 4 }}><WIcon name="alert-circle" size={12} color={WT.danger} />{error}</span>}
      {hint && !error && <span style={{ fontSize: 12, color: WT.fg2 }}>{hint}</span>}
    </label>
  );
}

// ---- Textarea ---------------------------------------------------------------
function WTextarea({ label, value, onChange, placeholder, rows = 3, required, error, style = {} }) {
  const [focus, setFocus] = React.useState(false);
  const bc = error ? WT.borderDanger : (focus ? WT.borderHi : WT.border);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
      {label && <WLabel required={required}>{label}</WLabel>}
      <textarea value={value} placeholder={placeholder} rows={rows}
        onChange={e => onChange && onChange(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          borderRadius: WT.rM, border: `1px solid ${bc}`, background: '#fff', padding: '8px 10px',
          font: `${WT.wBody} 14px ${WT.font}`, color: WT.fg, resize: 'vertical',
          outline: focus ? `2px solid ${WT.borderAccent}` : 'none', outlineOffset: -1,
        }} />
      {error && <span style={{ fontSize: 12, color: WT.danger }}>{error}</span>}
    </label>
  );
}

// ---- Select (native, styled) ------------------------------------------------
function WSelect({ label, value, onChange, options, placeholder = 'Selecione…', required, error, size = 'm', style = {} }) {
  const [focus, setFocus] = React.useState(false);
  const bc = error ? WT.borderDanger : (focus ? WT.borderHi : WT.border);
  const h = size === 'l' ? 44 : 32;
  const opts = options.map(o => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
      {label && <WLabel required={required}>{label}</WLabel>}
      <span style={{
        position: 'relative', height: h, borderRadius: WT.rM, border: `1px solid ${bc}`, background: '#fff',
        display: 'flex', alignItems: 'center', padding: '0 10px',
        outline: focus ? `2px solid ${error ? WT.borderDanger : WT.borderAccent}` : 'none', outlineOffset: -1,
      }}>
        <select value={value} onChange={e => onChange && onChange(e.target.value)}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ appearance: 'none', WebkitAppearance: 'none', border: 'none', outline: 'none', background: 'transparent',
            font: `${WT.wBody} 14px ${WT.font}`, color: value ? WT.fg : WT.muted, flex: 1, cursor: 'pointer', paddingRight: 18 }}>
          {placeholder && <option value="">{placeholder}</option>}
          {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <WIcon name="chevron-down" size={16} style={{ position: 'absolute', right: 8, pointerEvents: 'none' }} />
      </span>
      {error && <span style={{ fontSize: 12, color: WT.danger }}>{error}</span>}
    </label>
  );
}

// ---- Checkbox ---------------------------------------------------------------
function WCheckbox({ checked, onChange, label, disabled }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 14, color: disabled ? WT.muted : WT.fg }}>
      <span onClick={() => !disabled && onChange && onChange(!checked)} style={{
        width: 18, height: 18, borderRadius: WT.rS, flex: 'none',
        border: `1.5px solid ${checked ? WT.accentFill : WT.borderHover}`,
        background: checked ? WT.accentFill : '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <WIcon name="check" size={13} color="#fff" strokeWidth={3} />}
      </span>
      {label}
    </label>
  );
}

// ---- Radio group ------------------------------------------------------------
function WRadio({ value, onChange, options, name }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map(o => {
        const opt = typeof o === 'string' ? { value: o, label: o } : o;
        const on = value === opt.value;
        return (
          <label key={opt.value} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: WT.fg }}>
            <span onClick={() => onChange(opt.value)} style={{
              width: 18, height: 18, borderRadius: '50%', flex: 'none',
              border: `1.5px solid ${on ? WT.accentFill : WT.borderHover}`, background: '#fff',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {on && <span style={{ width: 9, height: 9, borderRadius: '50%', background: WT.accentFill }} />}
            </span>
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}

// ---- Toggle -----------------------------------------------------------------
function WToggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: WT.fg }}>
      <span onClick={() => onChange && onChange(!checked)} style={{
        width: 36, height: 20, borderRadius: WT.pill, background: checked ? WT.accentFill : WT.muted,
        position: 'relative', transition: 'background .15s', flex: 'none', boxShadow: 'inset 0 -1px 0 0 #00000014',
      }}>
        <span style={{ position: 'absolute', top: 2, left: checked ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px #00000033', transition: 'left .15s' }} />
      </span>
      {label}
    </label>
  );
}

// ---- Segmented control ------------------------------------------------------
function WSegmented({ options, value, onChange, size = 'm' }) {
  const h = size === 'l' ? 38 : 32;
  return (
    <div style={{ display: 'inline-flex', background: '#fff', border: `1px solid ${WT.border}`, borderRadius: WT.rM, padding: 3, gap: 2, boxShadow: WT.shEmphasis }}>
      {options.map(o => {
        const opt = typeof o === 'string' ? { value: o, label: o } : o;
        const on = opt.value === value;
        return (
          <button key={opt.value} onClick={() => onChange && onChange(opt.value)} style={{
            height: h - 8, padding: '0 12px', borderRadius: 5, border: 'none', cursor: 'pointer',
            fontFamily: WT.font, fontSize: 14, fontWeight: on ? WT.wEmph : WT.wBody,
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: on ? WT.accentSoft : 'transparent', color: on ? WT.accent : WT.fg2,
          }}>
            {opt.icon && <WIcon name={opt.icon} size={15} color={on ? WT.accent : WT.muted} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ---- Divider ----------------------------------------------------------------
function WDivider({ vertical, style = {} }) {
  return vertical
    ? <div style={{ width: 1, alignSelf: 'stretch', background: WT.borderSub, ...style }} />
    : <div style={{ height: 1, background: WT.borderSub, width: '100%', ...style }} />;
}

// ---- Spinner ----------------------------------------------------------------
function WSpinner({ size = 20, color = WT.accent }) {
  return (
    <span style={{ display: 'inline-flex', width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: 'wspin 1.2s linear infinite' }}>
        <circle cx="12" cy="12" r="9" fill="none" stroke={WT.neutral} strokeWidth="3" />
        <path d="M12 3 a9 9 0 0 1 9 9" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}

// ---- Popover (anchored, click-outside) --------------------------------------
function WPopover({ anchorRect, onClose, children, width = 320, placement = 'auto', offset = 8 }) {
  const ref = React.useRef(null);
  const MARGIN = 12;
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
      if (top + h > vh - MARGIN) top = Math.max(MARGIN, vh - MARGIN - h);
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
  const top = Math.min(anchorRect.top, Math.max(MARGIN, vh - MARGIN - 220));
  return (
    <div ref={ref} style={{
      position: 'fixed', left, top, width, zIndex: 1000, background: '#fff',
      border: `1px solid ${WT.border}`, borderRadius: WT.rL, boxShadow: WT.shPopout, overflow: 'hidden',
      display: 'flex', flexDirection: 'column', maxHeight: `calc(100vh - ${MARGIN * 2}px)`,
    }}>{children}</div>
  );
}

// ---- Toast ------------------------------------------------------------------
function WToast({ toast }) {
  if (!toast) return null;
  const tone = toast.tone || 'success';
  const c = tone === 'success' ? WT.success : tone === 'danger' ? WT.danger : WT.info;
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 2000,
      background: WT.invertedBg, color: '#fff', borderRadius: WT.rM, padding: '10px 14px',
      display: 'flex', alignItems: 'center', gap: 10, boxShadow: WT.shDialog, fontSize: 14, fontWeight: WT.wEmph,
      animation: 'wtoast .25s ease',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, flex: 'none' }} />
      {toast.msg}
      {toast.action && <button onClick={toast.action.onClick} style={{ background: 'none', border: 'none', color: WT.accentInv, fontWeight: WT.wHead, cursor: 'pointer', fontFamily: WT.font, fontSize: 14, textDecoration: 'underline' }}>{toast.action.label}</button>}
    </div>
  );
}

Object.assign(window, {
  WIcon, WButton, WIconButton, WBadge, WAvatar, WCard, WLabel, WInput, WTextarea,
  WSelect, WCheckbox, WRadio, WToggle, WSegmented, WDivider, WSpinner, WPopover, WToast,
});
