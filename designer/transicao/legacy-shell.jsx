/* ============================================================================
   Feegow — Fase de transição · Shell da agenda LEGADA (recriação visual)
   Só o menu "Agenda" é funcional: abre a nova tela de Configurações de Agenda.
   Nada mais da agenda antiga é replicado — é apenas contexto.
   ============================================================================ */

const LT = {
  fg: '#2b3440', fg2: '#5a6672', muted: '#8a97a4', line: '#e3e8ee', line2: '#eef2f6',
  bg: '#f4f6f9', card: '#ffffff', blue: '#2f9be3', blueDark: '#1b7ab8', navy: '#1f2933',
  teal: '#006a59', tealSoft: '#dff9f2', tealBorder: '#00a085',
  font: '"InterVariable","Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
};

function LIcon({ name, size = 16, color = LT.muted, strokeWidth = 2, style = {} }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const host = ref.current; if (!host || !window.lucide) return;
    host.innerHTML = '';
    const i = document.createElement('i');
    i.setAttribute('data-lucide', name);
    i.setAttribute('width', size); i.setAttribute('height', size);
    i.setAttribute('stroke-width', strokeWidth);
    host.appendChild(i);
    try { window.lucide.createIcons(); } catch (e) {}
  }, [name, size, strokeWidth]);
  return <span ref={ref} aria-hidden="true" style={{ display: 'inline-flex', width: size, height: size, color, flex: 'none', ...style }} />;
}

// ---- menu Agenda (itens reais do produto legado) ----------------------------
const LEGACY_AGENDA_MENU = [
  [{ id: 'diaria', icon: 'calendar', label: 'Diária' }, { id: 'semanal', icon: 'calendar', label: 'Semanal' }, { id: 'multipla', icon: 'calendar-days', label: 'Múltipla' }],
  [{ id: 'checkin', icon: 'clipboard-check', label: 'Check-in' }, { id: 'confirmar', icon: 'calendar-check', label: 'Confirmar agendamentos' }],
  [{ id: 'equip', icon: 'laptop', label: 'Equipamentos Alocados' }, { id: 'mapa', icon: 'map', label: 'Mapa de agenda' },
   { id: 'config', icon: 'settings', label: 'Configurações de agenda', novo: true }],
];

// ---- seletor de edição (mesmo controle da Nova Agenda) ----------------------
function LEditionMenu() {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const opts = [
    { value: 'final', label: 'Final', href: 'index.html#final' },
    { value: 'mvp', label: 'MVP', href: 'index.html#mvp' },
    { value: 'legado', label: 'Legado', hint: 'Agenda atual · transição' },
  ];
  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex', flex: 'none' }}>
      <button onClick={() => setOpen(o => !o)} title="Edição do produto" style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, padding: '0 8px 0 10px', borderRadius: 999,
        border: `1px solid ${LT.line}`, background: open ? LT.bg : '#fff', cursor: 'pointer', fontFamily: LT.font,
        fontSize: 12.5, fontWeight: 550, color: LT.fg2, whiteSpace: 'nowrap',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: LT.warn || '#b06400', flex: 'none' }} />
        Legado
        <LIcon name={open ? 'chevron-up' : 'chevron-down'} size={14} color={LT.muted} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 36, right: 0, minWidth: 212, background: '#fff', borderRadius: 12, border: `1px solid ${LT.line}`, boxShadow: '0 8px 28px #1f293322', padding: 6, zIndex: 80 }}>
          <div style={{ padding: '4px 10px 6px', fontSize: 10.5, fontWeight: 550, color: LT.muted, textTransform: 'uppercase', letterSpacing: '.05em' }}>Edição do produto</div>
          {opts.map(o => {
            const cur = o.value === 'legado';
            return (
              <button key={o.value} onClick={() => { setOpen(false); if (o.href) window.location.href = o.href; }} style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 8,
                border: 'none', background: cur ? '#f1f3f3' : 'transparent', cursor: 'pointer', textAlign: 'left',
                fontFamily: LT.font, fontSize: 13.5, color: LT.fg,
                marginTop: cur ? 5 : 0, borderTop: cur ? `1px solid ${LT.line2}` : 'none', paddingTop: cur ? 10 : 8,
              }} onMouseEnter={e => { if (!cur) e.currentTarget.style.background = '#f1f3f3'; }} onMouseLeave={e => { if (!cur) e.currentTarget.style.background = 'transparent'; }}>
                <LIcon name={cur ? 'check' : 'sparkles'} size={15} color={cur ? LT.teal : LT.muted} />
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  {o.label}
                  {o.hint && <span style={{ fontSize: 11.5, color: LT.muted }}>{o.hint}</span>}
                </span>
                {o.href && <LIcon name="arrow-up-right" size={14} color={LT.teal} />}
              </button>
            );
          })}
        </div>
      )}
    </span>
  );
}

function LegacyAgendaMenu({ onPick, onClose }) {
  React.useEffect(() => {
    const k = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
      <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 2, width: 258, background: '#fff', border: `1px solid ${LT.line}`, borderRadius: 6, boxShadow: '0 6px 20px #1f293319, 0 1px 2px #1f29330f', zIndex: 50, padding: '6px 0', fontFamily: LT.font }}>
        {LEGACY_AGENDA_MENU.map((group, gi) => (
          <div key={gi} style={{ borderTop: gi ? `1px solid ${LT.line2}` : 'none', padding: '5px 0' }}>
            {group.map(it => {
              const clickable = it.id === 'config' || !!it.href;
              return (
                <button key={it.id} onClick={() => { if (!clickable) return; if (it.href) { window.location.href = it.href; return; } onPick(it.id); }} disabled={!clickable}
                  title={clickable ? (it.href ? 'Abrir o protótipo da Nova Agenda' : 'Nova tela de configurações') : 'Fora do escopo deste protótipo'}
                  onMouseEnter={e => { if (clickable) e.currentTarget.style.background = LT.tealSoft; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 14px', border: 'none', background: 'transparent', textAlign: 'left', fontFamily: LT.font, fontSize: 14, color: clickable ? LT.fg : LT.fg2, cursor: clickable ? 'pointer' : 'default', opacity: clickable ? 1 : 0.75 }}>
                  <LIcon name={it.icon} size={15} color={clickable ? LT.teal : LT.muted} />
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: clickable ? 550 : 450 }}>{it.label}</span>
                    {it.desc && <span style={{ fontSize: 11.5, color: LT.muted }}>{it.desc}</span>}
                  </span>
                  {it.novo && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: LT.teal, background: LT.tealSoft, border: `1px solid ${LT.tealBorder}66`, borderRadius: 999, padding: '1px 6px' }}>novo</span>}
                  {it.href && <LIcon name="arrow-up-right" size={14} color={LT.teal} />}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

// ---- barra superior ---------------------------------------------------------
const LEGACY_NAV = [
  { label: 'Agenda', caret: true, menu: true }, { label: 'Espera' }, { label: 'Pacientes', caret: true },
  { label: 'Estoque', caret: true }, { label: 'Financeiro' }, { label: 'Faturamento TISS', caret: true, minW: 1160 }, { label: 'Relatórios', minW: 1060 },
];

function LegacyTopbar({ onPick }) {
  const [open, setOpen] = React.useState(false);
  const [w, setW] = React.useState(window.innerWidth);
  React.useEffect(() => { const r = () => setW(window.innerWidth); window.addEventListener('resize', r); return () => window.removeEventListener('resize', r); }, []);
  return (
    <header style={{ flex: 'none', fontFamily: LT.font }}>
      <div style={{ height: 36, background: '#101418', display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#ffffff', borderRadius: 999, padding: '3px 12px 3px 4px' }}>
          <img src="assets/symbol-feegow-primary.svg" alt="" style={{ width: 18, height: 18 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#052B3B' }}>Feegow</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '3px 12px 3px 4px', opacity: 0.85 }}>
          <img src="assets/icon-doctoralia.png" alt="" style={{ width: 18, height: 18, borderRadius: 4 }} />
          <span style={{ fontSize: 13, fontWeight: 550, color: '#fff' }}>Doctoralia</span>
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ width: 44, height: 4, borderRadius: 999, background: '#3a4149' }} />
        <span style={{ flex: 1 }} />
      </div>
      <div style={{ height: 46, background: '#fff', borderBottom: `1px solid ${LT.line}`, display: 'flex', alignItems: 'center', gap: 2, padding: '0 12px' }}>
        <LIcon name="menu" size={19} color={LT.fg} style={{ marginRight: 8 }} />
        <nav style={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
          {LEGACY_NAV.filter(m => !m.minW || w >= m.minW).map(m => m.menu ? (
            <span key={m.label} style={{ position: 'relative' }}>
              <button onClick={() => setOpen(o => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 10px', border: `1px solid ${open ? LT.line : 'transparent'}`, borderRadius: 6, background: open ? LT.bg : 'transparent', cursor: 'pointer', fontFamily: LT.font, fontSize: 14, fontWeight: 550, color: LT.fg }}>
                {m.label}<LIcon name="chevrons-up-down" size={13} color={LT.muted} />
              </button>
              {open && <LegacyAgendaMenu onClose={() => setOpen(false)} onPick={id => { setOpen(false); onPick(id); }} />}
            </span>
          ) : (
            <span key={m.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 10px', fontSize: 14, color: LT.fg2, whiteSpace: 'nowrap' }}>
              {m.label}{m.caret && <LIcon name="chevrons-up-down" size={13} color={LT.muted} />}
            </span>
          ))}
        </nav>
        {w >= 1040 && <span style={{ display: 'inline-flex', gap: 10, marginLeft: 10, flex: 'none' }}>
          <LIcon name="database" size={16} /><LIcon name="settings" size={16} />
        </span>}
        <span style={{ flex: 1 }} />
        <LEditionMenu />
        <span style={{ width: 1, height: 22, background: LT.line, margin: '0 10px', flex: 'none' }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14, flex: 'none' }}>
          {(w >= 1140 ? ['phone', 'inbox', 'list-checks', 'bell', 'message-square', 'help-circle'] : ['bell', 'help-circle']).map(n => <LIcon key={n} name={n} size={17} color={LT.fg2} />)}
          <span style={{ width: 28, height: 28, borderRadius: '50%', background: LT.line, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><LIcon name="user-round" size={15} color={LT.fg2} /></span>
        </span>
      </div>
    </header>
  );
}

// ---- sidebar legada ---------------------------------------------------------
function LegacyBtn({ icon, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 34, border: `1px solid ${LT.line}`, borderRadius: 4, background: '#fff', fontSize: 13, fontWeight: 550, color: LT.fg2, whiteSpace: 'nowrap' }}>
      <LIcon name={icon} size={13} color={LT.fg2} />{label}
    </span>
  );
}
function LegacySidebar() {
  const days = [];
  for (let i = 0; i < 3; i++) days.push(null);
  for (let d = 1; d <= 31; d++) days.push(d);
  return (
    <aside style={{ width: 250, flex: 'none', background: '#fff', borderRight: `1px solid ${LT.line}`, padding: 12, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto', fontFamily: LT.font }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34, border: `1px solid ${LT.line}`, borderRadius: 4, padding: '0 10px' }}>
        <LIcon name="search" size={14} /><span style={{ fontSize: 13, color: LT.muted }}>Busca rápida…</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: LT.muted }}>PROFISSIONAL</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 30, height: 30, borderRadius: '50%', background: LT.blue, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><LIcon name="user-round" size={16} color="#fff" /></span>
          <span style={{ flex: 1, display: 'flex', alignItems: 'center', height: 30, border: `1px solid ${LT.line}`, borderRadius: 4, padding: '0 8px', fontSize: 12.5, color: LT.fg }}>ADAM RYBAKO<span style={{ flex: 1 }} /><LIcon name="chevron-down" size={13} /></span>
          <span style={{ width: 28, height: 28, border: `1px solid ${LT.line}`, borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><LIcon name="info" size={13} color={LT.blue} /></span>
        </div>
      </div>
      <div style={{ border: `1px solid ${LT.line}`, borderLeft: `3px solid ${LT.blue}`, borderRadius: 4, padding: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <LegacyBtn icon="calendar-range" label="Grade" /><LegacyBtn icon="printer" label="Imprimir" />
        <LegacyBtn icon="external-link" label="Encaixe" /><LegacyBtn icon="lock" label="Bloqueio" />
        <span style={{ gridColumn: 'span 2' }}><LegacyBtn icon="repeat" label="Alterações em massa" /></span>
      </div>
      <div style={{ border: `1px solid ${LT.line}`, borderRadius: 4, padding: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <LIcon name="chevron-left" size={14} />
          <span style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 700, color: LT.fg2, letterSpacing: '.04em' }}>JUL - 2026</span>
          <LIcon name="chevron-right" size={14} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, fontSize: 11 }}>
          {['DO', 'SE', 'TE', 'QA', 'QI', 'SE', 'SA'].map((d, i) => <span key={i} style={{ height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: LT.fg2 }}>{d}</span>)}
          {days.map((d, i) => {
            if (!d) return <span key={i} style={{ height: 24 }} />;
            const dow = i % 7;
            const isSel = d === 27;
            const noGrade = !isSel && dow !== 1 && dow !== 6;
            return (
              <span key={i} style={{ height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3, fontVariantNumeric: 'tabular-nums', background: isSel ? '#d6f0fb' : (noGrade ? '#fdecec' : 'transparent'), color: isSel ? LT.blueDark : (noGrade ? '#d9736b' : LT.fg2), fontWeight: isSel ? 700 : 450 }}>{d}</span>
            );
          })}
        </div>
      </div>
      <div style={{ border: `1px solid ${LT.line}`, borderLeft: `3px solid ${LT.blue}`, borderRadius: 4, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 550, color: LT.fg2 }}>
        <LIcon name="refresh-cw" size={13} color={LT.fg2} />Atualizar Calendário
      </div>
      <div style={{ display: 'flex', gap: 18, borderBottom: `1px solid ${LT.line}`, paddingBottom: 8, marginTop: 'auto' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: LT.fg, borderBottom: `2px solid ${LT.blue}`, paddingBottom: 6, marginBottom: -9 }}><LIcon name="file-text" size={14} color={LT.fg} />Notas</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: LT.fg2 }}><LIcon name="clock" size={14} />Espera</span>
      </div>
    </aside>
  );
}

// ---- grade legada (inerte, só contexto) ------------------------------------
function LegacyAgendaGrid() {
  const rows = [];
  for (let m = 9 * 60; m <= 18 * 60; m += 30) rows.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  return (
    <div style={{ flex: 1, minWidth: 0, overflow: 'auto', padding: '16px 20px 40px', fontFamily: LT.font }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: LT.fg }}>Agenda diária</h1>
        <span style={{ color: LT.line }}>/</span>
        <LIcon name="calendar" size={15} color={LT.blue} />
        <span style={{ fontSize: 14, color: LT.muted }}>segunda-feira, 27 de julho de 2026</span>
      </div>
      <div style={{ border: `1px solid ${LT.line}`, borderRadius: 4, background: '#fff', overflow: 'hidden' }}>
        <div style={{ height: 34, borderBottom: `1px solid ${LT.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '.03em', color: LT.muted }}>
          BAIA COMERCIAL (FEEGOW - LICENÇA FINANCEIRO)
        </div>
        {rows.map((t, i) => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, height: 33, padding: '0 10px', borderTop: i ? `1px solid ${LT.line2}` : 'none' }}>
            <span style={{ flex: 'none', fontSize: 12, fontWeight: 700, color: '#fff', background: LT.blue, borderRadius: 3, padding: '3px 8px', fontVariantNumeric: 'tabular-nums' }}>{t}</span>
            <span style={{ flex: 1 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { LT, LIcon, LegacyTopbar, LegacySidebar, LegacyAgendaGrid, LEGACY_AGENDA_MENU });
