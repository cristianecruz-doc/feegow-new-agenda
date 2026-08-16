/* ============================================================================
   Feegow — New Agenda · Agenda toolbar (SubNavbar)
   View toggle · date nav + mini-calendar · filters · + Novo agendamento
   ============================================================================ */

const VIEW_OPTS = [
  { value: 'dia',    label: 'Dia',         icon: 'columns-3' },
  { value: 'semana', label: 'Semana',      icon: 'calendar-range' },
  { value: 'mes',    label: 'Mês',         icon: 'calendar' },
  { value: 'equip',  label: 'Equipamentos', icon: 'activity' },
  { value: 'sala',   label: 'Salas',       icon: 'door-open' },
  { value: 'programacao', label: 'Programação', icon: 'list' },
];

// zoom da grade — refina a densidade em telas pequenas (1366×768, Windows 125%)
function ZoomStepper({ value, onChange }) {
  const clamp = z => Math.round(Math.max(0.6, Math.min(1.6, z)) * 100) / 100;
  const btn = { width: 26, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: WT.fg2 };
  React.useEffect(() => {
    const h = e => { if (!(e.ctrlKey || e.metaKey)) return; if (e.key === '-') { e.preventDefault(); onChange(clamp(value - 0.1)); } else if (e.key === '=' || e.key === '+') { e.preventDefault(); onChange(clamp(value + 0.1)); } else if (e.key === '0') { e.preventDefault(); onChange(1); } };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [value, onChange]);
  return (
    <div title="Zoom da grade (Ctrl + / Ctrl − / Ctrl 0)" style={{ display: 'inline-flex', alignItems: 'center', height: 32, border: `1px solid ${WT.border}`, borderRadius: WT.rM, background: '#fff', overflow: 'hidden' }}>
      <button aria-label="Diminuir zoom" onClick={() => onChange(clamp(value - 0.1))} style={btn} onMouseEnter={e => e.currentTarget.style.background = WT.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><WIcon name="minus" size={14} /></button>
      <button onClick={() => onChange(1)} style={{ ...btn, width: 44, fontFamily: WT.font, fontSize: 12, fontWeight: WT.wEmph, color: value === 1 ? WT.muted : WT.accent, fontVariantNumeric: 'tabular-nums' }}
        onMouseEnter={e => e.currentTarget.style.background = WT.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{Math.round(value * 100)}%</button>
      <button aria-label="Aumentar zoom" onClick={() => onChange(clamp(value + 0.1))} style={btn} onMouseEnter={e => e.currentTarget.style.background = WT.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><WIcon name="plus" size={14} /></button>
    </div>
  );
}

function Toolbar({ state, set, onNew, compact }) {
  // Os filtros de agenda vivem no seletor "Agendas" da barra lateral (AgendaSidebarPanel).
  const { view, date, freeOnly } = state;
  const mvp = !!window.__mvp;
  const viewOpts = mvp ? VIEW_OPTS.filter(v => v.value === 'dia' || v.value === 'semana') : VIEW_OPTS;
  const [pop, setPop] = React.useState(null); // {kind, rect}
  const open = (kind, rect) => setPop(p => (p && p.kind === kind ? null : { kind, rect }));
  const close = () => setPop(null);

  // "container query": o gatilho é a largura da própria barra (o painel de agendamento
  // e o sidebar a estreitam), não a do viewport — abaixo do limiar o segmented de
  // views vira dropdown em vez de quebrar para uma segunda linha
  const barRef = React.useRef(null);
  const [narrow, setNarrow] = React.useState(false);
  React.useEffect(() => {
    const el = barRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setNarrow(el.clientWidth < 1080));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const dateLabel = view === 'semana'
    ? `${fmtShortDate(state.date)} – ${fmtShortDate(dateUtil.addDays(dateUtil.weekDaysOf(date)[5], 0))}`
    : view === 'mes' ? `${MONTHS[parseISO(date).getMonth()]} ${parseISO(date).getFullYear()}`
    : (compact || narrow) ? fmtShortDate(date) : fmtLongDate(date);

  // "Hoje" só aparece quando hoje NÃO está no período visível — estando nele o
  // botão não teria para onde levar
  const showToday = view === 'semana' ? !dateUtil.weekDaysOf(date, 7).includes(TODAY)
    : view === 'mes' ? (parseISO(date).getMonth() !== parseISO(TODAY).getMonth() || parseISO(date).getFullYear() !== parseISO(TODAY).getFullYear())
    : date !== TODAY;


  return (
    <div ref={barRef} style={{ flex: 'none', background: WT.raised, borderBottom: `1px solid ${WT.border}`, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {/* esquerda: setas · data (abre o calendário) · Hoje (só fora de hoje) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <WIconButton name="chevron-left" title="Anterior" onClick={() => set(s => ({ date: dateUtil.addDays(s.date, view === 'semana' ? -7 : view === 'mes' ? -30 : -1) }))} />
        <WIconButton name="chevron-right" title="Próximo" onClick={() => set(s => ({ date: dateUtil.addDays(s.date, view === 'semana' ? 7 : view === 'mes' ? 30 : 1) }))} />
      </div>
      <button onClick={e => open('cal', e.currentTarget.getBoundingClientRect())} title="Escolher data" style={{
        display: 'flex', alignItems: 'center', height: 32, padding: '0 8px', borderRadius: WT.rM,
        border: `1px solid transparent`, background: 'transparent', cursor: 'pointer', fontFamily: WT.font, fontSize: 15, color: WT.fg, fontWeight: WT.wHead, textTransform: 'capitalize', whiteSpace: 'nowrap',
      }} onMouseEnter={e => e.currentTarget.style.background = WT.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        {dateLabel}
      </button>
      {showToday && <WButton variant="default" label="Hoje" onClick={() => set({ date: TODAY })} />}

      <div style={{ flex: 1 }} />

      {/* right: view tabs · filtros · ajustes · novo */}
      {/* `fit`: o dropdown se ajusta à visão escolhida. Com largura fixa ele mal ganhava
          espaço sobre o segmented — ainda menos na edição MVP, que só tem duas opções. */}
      {(compact || narrow)
        ? <WSelect fit value={view} onChange={v => set({ view: v })} options={viewOpts} placeholder="" />
        : <WSegmented options={viewOpts} value={view} onChange={v => set({ view: v })} />}

      {view !== 'mes' && <ZoomStepper value={state.zoom || 1} onChange={z => set({ zoom: z })} />}

      <WIconButton name="sliders-horizontal" title="Configurações de visualização" active={pop && pop.kind === 'viewcfg'} onClick={e => open('viewcfg', e.currentTarget.getBoundingClientRect())} />

      {pop && pop.kind === 'cal' && (
        <WPopover anchorRect={pop.rect} onClose={close} width={260} placement="below">
          <div style={{ borderBottom: `1px solid ${WT.borderSub}`, padding: '4px 4px 0' }} />
          <MiniCalendar value={date} onSelect={iso => { set({ date: iso }); close(); }} />
        </WPopover>
      )}
      {pop && pop.kind === 'viewcfg' && (
        <WPopover anchorRect={pop.rect} onClose={close} width={264} placement="below">
          <div style={{ padding: '12px 14px 4px', fontSize: 14, fontWeight: WT.wHead, color: WT.fg }}>Configurações de visualização</div>
          <div style={{ padding: '8px 14px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* realce (não filtro): pinta os vãos livres dentro da grade de atendimento */}
            <WToggle checked={freeOnly} onChange={v => set({ freeOnly: v })} label="Realçar somente horários livres" />
            <div style={{ borderTop: `1px solid ${WT.borderSub}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: WT.wEmph, color: WT.fg2 }}>Indicação de cor do profissional</span>
              <WSegmented value={state.cardStyle} onChange={v => set({ cardStyle: v })}
                options={[{ value: 'typebar', label: 'Barra' }, { value: 'filled', label: 'Preenchido' }]} />
            </div>
            <div style={{ borderTop: `1px solid ${WT.borderSub}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: WT.wEmph, color: WT.fg2 }}>Altura da hora</span>
              <WSegmented value={state.density || 'auto'} onChange={v => set({ density: v })}
                options={[{ value: 'auto', label: 'Auto' }, { value: 'compact', label: 'Compacta' }, { value: 'normal', label: 'Média' }, { value: 'comfortable', label: 'Alta' }]} />
              <span style={{ fontSize: 11, color: WT.muted }}>Auto ajusta a densidade à altura da tela. O zoom da barra superior refina em cima disso.</span>
            </div>
            <div style={{ borderTop: `1px solid ${WT.borderSub}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: WT.wEmph, color: WT.fg2 }}>Sinalizadores no card</span>
              <WToggle checked={state.showPriorityFlags !== false} onChange={v => set({ showPriorityFlags: v })} label="Exibir ícones de prioridade" />
              <WToggle checked={state.showNewPatientFlag !== false} onChange={v => set({ showNewPatientFlag: v })} label="Exibir ícone de novo paciente" />
            </div>
          </div>
        </WPopover>
      )}
    </div>
  );
}

Object.assign(window, { Toolbar, VIEW_OPTS });
