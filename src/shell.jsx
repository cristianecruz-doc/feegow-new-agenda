/* ============================================================================
   Feegow — New Agenda · App shell (Navbar, Sidebar, Toolbar, MiniCalendar)
   ============================================================================ */

// ---- Date utilities (ISO 'YYYY-MM-DD' based, local) -------------------------
const isoOf = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return isoOf(d); };
const startOfWeek = iso => { const d = parseISO(iso); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); return isoOf(d); }; // Monday
const weekDaysOf = (iso, n = 6) => { const s = startOfWeek(iso); return Array.from({ length: n }, (_, i) => addDays(s, i)); }; // Mon..(+n)
const sameDay = (a, b) => a === b;
const fmtLongDate = iso => { const d = parseISO(iso); return `${WEEKDAYS_FULL[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`; };
const fmtShortDate = iso => { const d = parseISO(iso); return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`; };

window.dateUtil = { isoOf, parseISO, addDays, startOfWeek, weekDaysOf, sameDay, fmtLongDate, fmtShortDate };

// ---- Top navbar (réplica da barra superior da Feegow) -----------------------
// Linha 1: alternador de produtos (Feegow ativo · Doctoralia) sobre faixa escura.
// Linha 2: menu de funcionalidades (módulos) + ícones utilitários à direita.
const FEEGOW_MENU = [
  { label: 'Agenda',      dropdown: true,  active: true },
  { label: 'Espera',      dropdown: false },
  { label: 'Pacientes',   dropdown: true },
  { label: 'Estoque',     dropdown: true },
  { label: 'Financeiro',  dropdown: false },
  { label: 'Faturamento', dropdown: true },
  { label: 'Relatórios',  dropdown: false },
];
const AGENDA_SUBMENU = [
  { id: 'agenda', icon: 'calendar-days', label: 'Agenda', desc: 'Grade de horários do dia e da semana' },
  { id: 'agenda-config', icon: 'settings', label: 'Configurações de Agenda', desc: 'Tudo o que muda o comportamento da agenda' },
];
function ModuleItem({ label, dropdown, active, items, current, onNavigate }) {
  const [hover, setHover] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const [rect, setRect] = React.useState(null);
  React.useEffect(() => { if (open && ref.current) setRect(ref.current.getBoundingClientRect()); }, [open]);
  const hasMenu = dropdown && items && items.length > 0;
  return (
    <>
      <button ref={ref} onClick={() => hasMenu && setOpen(o => !o)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, height: 34, padding: '0 10px', borderRadius: WT.rM,
        border: 'none', background: (hover || open) ? WT.hover : 'transparent', cursor: 'pointer', fontFamily: WT.font,
        fontSize: 14.5, fontWeight: active ? WT.wHead : WT.wBody, color: WT.fg, whiteSpace: 'nowrap',
      }}>
        {label}
        {dropdown && <WIcon name={hasMenu ? (open ? 'chevron-up' : 'chevron-down') : 'chevrons-up-down'} size={13} color={WT.muted} />}
      </button>
      {hasMenu && open && rect && ReactDOM.createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000 }} onMouseDown={() => setOpen(false)}>
          <div onMouseDown={e => e.stopPropagation()} style={{
            position: 'fixed', left: Math.min(rect.left, window.innerWidth - 284), top: rect.bottom + 6, width: 272,
            background: WT.raised, border: `1px solid ${WT.border}`, borderRadius: WT.rL, boxShadow: WT.shPopout,
            padding: 6, display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            {items.map(it => {
              const on = current === it.id;
              return (
                <button key={it.id} onClick={() => { setOpen(false); onNavigate && onNavigate(it.id); }} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 10px', borderRadius: WT.rM,
                  border: 'none', background: on ? WT.accentSoft : 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: WT.font, width: '100%',
                }} onMouseEnter={e => { if (!on) e.currentTarget.style.background = WT.hover; }} onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
                  <WIcon name={it.icon} size={17} color={on ? WT.accent : WT.fg2} style={{ flex: 'none', marginTop: 1 }} />
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13.5, fontWeight: WT.wEmph, color: on ? WT.accent : WT.fg }}>{it.label}</span>
                    <span style={{ fontSize: 12, color: WT.muted, lineHeight: 1.35 }}>{it.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
function ProductTab({ active, label, children, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, height: 30, padding: '0 12px 0 6px', borderRadius: 8,
      border: 'none', cursor: 'pointer', fontFamily: WT.font, fontSize: 14, fontWeight: 600, color: '#fff',
      background: active ? '#34383e' : (hover ? '#ffffff12' : 'transparent'),
      boxShadow: active ? 'inset 0 1px 0 #ffffff1f' : 'none', whiteSpace: 'nowrap',
    }}>
      {children}
      {label}
    </button>
  );
}
function EditionMenu({ edition, onEdition }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const opts = [{ value: 'final', label: 'Final' }, { value: 'mvp', label: 'MVP' }];
  const cur = opts.find(o => o.value === edition) || opts[0];
  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button onClick={() => setOpen(o => !o)} title="Edição do produto" style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, padding: '0 8px 0 10px', borderRadius: WT.pill,
        border: `1px solid ${WT.border}`, background: open ? WT.hover : WT.inset, cursor: 'pointer', fontFamily: WT.font,
        fontSize: 12.5, fontWeight: WT.wEmph, color: WT.fg2,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: WT.accent, flex: 'none' }} />
        {cur.label}
        <WIcon name={open ? 'chevron-up' : 'chevron-down'} size={14} color={WT.muted} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 36, right: 0, minWidth: 168, background: WT.raised, borderRadius: WT.rL, border: `1px solid ${WT.border}`, boxShadow: WT.shDialog, padding: 6, zIndex: 60 }}>
          <div style={{ padding: '4px 10px 6px', fontSize: 10.5, fontWeight: WT.wEmph, color: WT.muted, textTransform: 'uppercase', letterSpacing: '.05em' }}>Edição do produto</div>
          {opts.map(o => (
            <button key={o.value} onClick={() => { onEdition(o.value); setOpen(false); }} style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: WT.rM,
              border: 'none', background: o.value === edition ? WT.hover : 'transparent', cursor: 'pointer', textAlign: 'left',
              fontFamily: WT.font, fontSize: 13.5, fontWeight: WT.wBody, color: WT.fg,
            }} onMouseEnter={e => { if (o.value !== edition) e.currentTarget.style.background = WT.hover; }} onMouseLeave={e => { if (o.value !== edition) e.currentTarget.style.background = 'transparent'; }}>
              <WIcon name={o.value === edition ? 'check' : 'circle'} size={15} color={o.value === edition ? WT.accent : WT.muted} style={{ flex: 'none' }} />
              {o.label}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
function LangMenu({ lang, onLang }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const opts = [
    { value: 'pt', code: 'PT', label: 'Português' },
    { value: 'en', code: 'EN', label: 'English' },
    { value: 'es', code: 'ES', label: 'Español' },
    { value: 'it', code: 'IT', label: 'Italiano' },
  ];
  const cur = opts.find(o => o.value === lang) || opts[0];
  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button onClick={() => setOpen(o => !o)} title="Idioma / Language" style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, padding: '0 8px 0 9px', borderRadius: WT.pill,
        border: `1px solid ${WT.border}`, background: open ? WT.hover : WT.inset, cursor: 'pointer', fontFamily: WT.font,
        fontSize: 12.5, fontWeight: WT.wEmph, color: WT.fg2,
      }}>
        <WIcon name="globe" size={14} color={WT.muted} style={{ flex: 'none' }} />
        {cur.code}
        <WIcon name={open ? 'chevron-up' : 'chevron-down'} size={14} color={WT.muted} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 36, right: 0, minWidth: 168, background: WT.raised, borderRadius: WT.rL, border: `1px solid ${WT.border}`, boxShadow: WT.shDialog, padding: 6, zIndex: 60 }}>
          <div style={{ padding: '4px 10px 6px', fontSize: 10.5, fontWeight: WT.wEmph, color: WT.muted, textTransform: 'uppercase', letterSpacing: '.05em' }}>Idioma / Language</div>
          {opts.map(o => (
            <button key={o.value} onClick={() => { onLang(o.value); setOpen(false); }} style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: WT.rM,
              border: 'none', background: o.value === lang ? WT.hover : 'transparent', cursor: 'pointer', textAlign: 'left',
              fontFamily: WT.font, fontSize: 13.5, fontWeight: WT.wBody, color: WT.fg,
            }} onMouseEnter={e => { if (o.value !== lang) e.currentTarget.style.background = WT.hover; }} onMouseLeave={e => { if (o.value !== lang) e.currentTarget.style.background = 'transparent'; }}>
              <span style={{ width: 22, fontSize: 11, fontWeight: WT.wHead, color: o.value === lang ? WT.accent : WT.muted, flex: 'none' }}>{o.code}</span>
              <span style={{ flex: 1 }}>{o.label}</span>
              {o.value === lang && <WIcon name="check" size={15} color={WT.accent} style={{ flex: 'none' }} />}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
function TopNavbar({ unit, onUnit, onToggleSidebar, compact, edition, onEdition, lang, onLang, page, onNavigate }) {
  return (
    <header style={{ flex: 'none', display: 'flex', flexDirection: 'column', zIndex: 30 }}>
      {/* Linha 1 — faixa escura: alternador de produtos */}
      <div style={{ position: 'relative', height: 40, background: '#1b1e22', display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px', flex: 'none' }}>
        <ProductTab active label="Feegow">
          <span style={{ width: 24, height: 24, borderRadius: 6, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <img src={(window.__resources && window.__resources.feegowSymbol) || "assets/symbol-feegow-primary.svg"} alt="" style={{ width: 16, height: 16, display: 'block' }} />
          </span>
        </ProductTab>
        <ProductTab label="Doctoralia">
          <span style={{ width: 24, height: 24, borderRadius: 6, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <img src={(window.__resources && window.__resources.doctoIcon) || "assets/icon-doctoralia.png"} alt="" style={{ width: 18, height: 18, display: 'block' }} />
          </span>
        </ProductTab>
        {/* alça de arrastar (janela desktop) */}
        <div style={{ position: 'absolute', left: '50%', top: 6, transform: 'translateX(-50%)', width: 44, height: 4, borderRadius: 999, background: '#41464c' }} />
      </div>

      {/* Linha 2 — barra branca: menu de funcionalidades */}
      <div style={{ height: 52, background: WT.raised, borderBottom: `1px solid ${WT.border}`, display: 'flex', alignItems: 'center', gap: 2, padding: '0 10px', flex: 'none' }}>
        <WIconButton name="menu" onClick={onToggleSidebar} color={WT.fg} title="Menu" />
        {!compact && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 4, minWidth: 0, overflow: 'hidden' }}>
            {FEEGOW_MENU.map(m => <ModuleItem key={m.label} {...m} active={m.label === 'Agenda'} items={m.label === 'Agenda' ? AGENDA_SUBMENU : null} current={page || 'agenda'} onNavigate={onNavigate} />)}
            <span style={{ width: 1, height: 22, background: WT.borderSub, margin: '0 6px', flex: 'none' }} />
            <WIconButton name="database" color={WT.fg2} title="Cadastros" />
            <WIconButton name="settings" color={WT.fg2} title="Configurações" />
          </nav>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LangMenu lang={lang} onLang={onLang} />
          <span style={{ width: 6, flex: 'none' }} />
          <EditionMenu edition={edition} onEdition={onEdition} />
          <span style={{ width: 1, height: 22, background: WT.borderSub, margin: '0 8px', flex: 'none' }} />
          {!compact && <WIconButton name="phone" color={WT.fg2} title="Ligações" />}
          {!compact && <WIconButton name="mail" color={WT.fg2} title="Mensagens" />}
          {!compact && <WIconButton name="list-checks" color={WT.fg2} title="Tarefas" />}
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            <WIconButton name="bell" color={WT.fg2} title="Notificações" />
            <span style={{ position: 'absolute', top: 1, right: 1, minWidth: 15, height: 15, padding: '0 3px', borderRadius: 999, background: '#e8503a', color: '#fff', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, border: '1.5px solid #fff' }}>8</span>
          </span>
          <WIconButton name="message-square" color={WT.fg2} title="Chat" />
          {!compact && <WIconButton name="circle-help" color={WT.fg2} title="Ajuda" />}
          <button title="Marina R. · Recepção" style={{ width: 32, height: 32, marginLeft: 5, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#1aa1e6', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <WIcon name="user-round" size={17} color="#fff" />
          </button>
        </div>
      </div>
    </header>
  );
}

// ---- Sidebar ----------------------------------------------------------------
function SideNav({ icon, label, active, disabled, badge, collapsed, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={disabled ? undefined : onClick} title={collapsed ? label : undefined}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        height: 38, borderRadius: WT.rM, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        padding: collapsed ? 0 : '0 10px', justifyContent: collapsed ? 'center' : 'flex-start',
        background: active ? WT.accentSoft : (hover && !disabled ? WT.hover : 'transparent'), textAlign: 'left',
        fontFamily: WT.font, fontSize: 14, fontWeight: active ? WT.wEmph : WT.wBody,
        color: disabled ? WT.placeholder : WT.fg, opacity: disabled ? 0.7 : 1,
      }}>
      {active && !collapsed && <span style={{ position: 'absolute', left: 0, top: 7, bottom: 7, width: 3, borderRadius: 8, background: WT.accentFill }} />}
      <WIcon name={icon} size={18} color={active ? WT.accent : WT.muted} />
      {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
      {!collapsed && badge && <WBadge type="neutral">{badge}</WBadge>}
      {!collapsed && disabled && <WBadge type="neutral">Fase 2</WBadge>}
    </button>
  );
}

// ---- "Criar" dropdown (Google-style) ----------------------------------------
const CREATE_ITEMS = [
  { id: 'agendamento', icon: 'calendar-plus', label: 'Agendamento', desc: 'Consulta, exame ou retorno' },
  { id: 'encaixe',     icon: 'git-merge',     label: 'Encaixe',      desc: 'Sobrepõe um horário ocupado' },
  { id: 'bloqueio',    icon: 'ban',           label: 'Bloqueio',     desc: 'Almoço, reunião, ausência' },
];
function CreateButton({ collapsed, onCreate }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%', height: 46, cursor: 'pointer',
        padding: collapsed ? 0 : '0 14px', justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: WT.rL, border: `1px solid ${WT.border}`, background: '#fff', boxShadow: WT.shEmphasis,
        fontFamily: WT.font, fontSize: 15, fontWeight: WT.wHead, color: WT.fg,
      }}>
        <WIcon name="plus" size={20} color={WT.accent} />
        {!collapsed && <span style={{ flex: 1, textAlign: 'left' }}>Criar</span>}
        {!collapsed && <WIcon name="chevron-down" size={16} />}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 52, left: 0, width: collapsed ? 248 : '100%', minWidth: 248, zIndex: 60,
          background: '#fff', border: `1px solid ${WT.border}`, borderRadius: WT.rL, boxShadow: WT.shPopout, overflow: 'hidden', padding: 6,
        }}>
          {CREATE_ITEMS.map(it => (
            <button key={it.id} onClick={() => { setOpen(false); onCreate(it.id); }} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '9px 10px', borderRadius: WT.rM,
              border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: WT.font,
            }} onMouseEnter={e => e.currentTarget.style.background = WT.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ width: 32, height: 32, borderRadius: WT.rM, background: WT.accentSoft, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><WIcon name={it.icon} size={16} color={WT.accent} /></span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: WT.wEmph, color: WT.fg }}>{it.label}</span>
                <span style={{ display: 'block', fontSize: 12, color: WT.muted }}>{it.desc}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const LEGEND = [
  ['marcado', 'Marcado'], ['confirmado', 'Confirmado'], ['aguardando', 'Aguardando'], ['em_atendimento', 'Em atendimento'], ['finalizado', 'Finalizado'], ['faltou', 'Faltou'], ['remarcado', 'Remarcado'], ['cancelado', 'Cancelado'],
];

function Sidebar({ collapsed, onToggle, date, onSelectDate, onCreate, agendaSel }) {
  const w = collapsed ? 64 : 248;
  const [statusOpen, setStatusOpen] = React.useState(false); // legenda de status sempre inicia fechada
  return (
    <aside style={{
      width: w, flex: 'none', background: WT.raised, borderRight: `1px solid ${WT.border}`,
      display: 'flex', flexDirection: 'column', padding: '14px 12px', gap: 14, transition: 'width .16s', overflow: 'hidden',
    }}>
      {collapsed
        ? <WIconButton name="search" title="Buscar" dim={40} style={{ margin: '0 auto' }} />
        : <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 10px', borderRadius: WT.pill, border: `1px solid ${WT.border}`, background: WT.inset }}>
            <WIcon name="search" size={16} />
            <input placeholder="Buscar paciente, agendamento…" style={{ border: 'none', outline: 'none', background: 'transparent', font: `${WT.wBody} 14px ${WT.font}`, color: WT.fg, flex: 1, minWidth: 0 }} />
          </div>}
      <CreateButton collapsed={collapsed} onCreate={onCreate} />
      {!collapsed && (
        <>
          <div style={{ borderTop: `1px solid ${WT.borderSub}` }} />
          <MiniCalendar value={date} onSelect={onSelectDate} />
          {/* Status do agendamento — seção colapsável (inicia fechada) */}
          <div style={{ borderTop: `1px solid ${WT.borderSub}`, paddingTop: 12 }}>
            <button onClick={() => setStatusOpen(o => !o)} style={{
              display: 'flex', alignItems: 'center', gap: 6, width: '100%', border: 'none', background: 'transparent',
              cursor: 'pointer', padding: '2px 4px', borderRadius: WT.rM, fontFamily: WT.font,
            }} onMouseEnter={e => e.currentTarget.style.background = WT.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ flex: 1, textAlign: 'left', fontSize: 11, fontWeight: WT.wEmph, color: WT.fg2, textTransform: 'uppercase', letterSpacing: '.05em' }}>Status do agendamento</span>
              <WIcon name={statusOpen ? 'chevron-up' : 'chevron-down'} size={15} color={WT.muted} />
            </button>
            {statusOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 8 }}>
                {LEGEND.map(([k, label]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px', fontSize: 13, color: WT.fg2 }}>
                    <WIcon name={STATUS[k].icon} size={15} color={STATUS[k].fg} strokeWidth={2.2} style={{ flex: 'none' }} />{label}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Agendas — abaixo do status */}
          {agendaSel && window.AgendaSidebarPanel && (
            <>
              <div style={{ borderTop: `1px solid ${WT.borderSub}` }} />
              <AgendaSidebarPanel selected={agendaSel.selected} onAdd={agendaSel.add} onRemove={agendaSel.remove} date={agendaSel.date} />
            </>
          )}
        </>
      )}
      <div style={{ flex: 1 }} />
      <SideNav icon={collapsed ? 'chevrons-right' : 'chevrons-left'} label="Recolher" collapsed={collapsed} onClick={onToggle} />
    </aside>
  );
}

// ---- Mini-calendar ----------------------------------------------------------
function MiniCalendar({ value, onSelect, compact }) {
  const [view, setView] = React.useState(() => parseISO(value));
  React.useEffect(() => { setView(parseISO(value)); }, [value]);
  const y = view.getFullYear(), m = view.getMonth();
  const first = new Date(y, m, 1);
  const startPad = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const cell = compact ? 30 : 32;
  return (
    <div style={{ width: cell * 7 + 8, padding: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ flex: 1, fontSize: 14, fontWeight: WT.wHead, color: WT.fg, textTransform: 'capitalize', paddingLeft: 4 }}>{MONTHS[m]} {y}</div>
        <WIconButton name="chevron-left" dim={28} onClick={() => setView(new Date(y, m - 1, 1))} />
        <WIconButton name="chevron-right" dim={28} onClick={() => setView(new Date(y, m + 1, 1))} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, ${cell}px)` }}>
        {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => (
          <div key={i} style={{ height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: WT.wEmph, color: WT.muted }}>{d}</div>
        ))}
        {cells.map((d, i) => {
          if (d == null) return <div key={i} style={{ height: cell }} />;
          const iso = `${y}-${pad2(m + 1)}-${pad2(d)}`;
          const isToday = iso === TODAY;
          const isSel = iso === value;
          const blocked = window.__dayBlocked ? window.__dayBlocked(iso) : null;
          return <CalCell key={i} cell={cell} day={d} isToday={isToday} isSel={isSel} disabled={!!blocked} title={blocked || undefined} onClick={() => onSelect(iso)} />;
        })}
      </div>
    </div>
  );
}
function CalCell({ cell, day, isToday, isSel, onClick, disabled, title }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={disabled ? undefined : onClick} title={title} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      height: cell, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 1,
      fontFamily: WT.font, fontSize: 13, fontVariantNumeric: 'tabular-nums',
      fontWeight: isSel || isToday ? WT.wEmph : WT.wBody,
      background: isSel ? WT.calSelBg : (hover && !disabled ? WT.calHi : 'transparent'),
      color: disabled ? WT.placeholder : (isSel ? WT.calSelFg : (isToday ? WT.calTodayFg : WT.fg)),
      opacity: disabled ? 0.55 : 1,
      textDecoration: disabled ? 'line-through' : 'none',
      boxShadow: isToday && !isSel ? `inset 0 0 0 1.5px ${WT.calToday}` : 'none',
    }}>{day}</button>
  );
}

Object.assign(window, { TopNavbar, Sidebar, SideNav, CreateButton, MiniCalendar });
