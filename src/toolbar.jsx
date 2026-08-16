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

// generic filter button + popover
function FilterChip({ icon, label, value, active, onClick, anchorId }) {
  const ref = React.useRef(null);
  const [hover, setHover] = React.useState(false);
  return (
    <button ref={ref} id={anchorId} onClick={() => onClick(ref.current.getBoundingClientRect())}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 10px', borderRadius: WT.rM,
        border: `1px solid ${active ? WT.borderAccent : WT.border}`, cursor: 'pointer', fontFamily: WT.font, fontSize: 14,
        background: active ? WT.accentSoft : (hover ? WT.hover : '#fff'), color: active ? WT.accent : WT.fg, whiteSpace: 'nowrap',
      }}>
      <WIcon name={icon} size={15} color={active ? WT.accent : WT.muted} />
      <span style={{ fontWeight: active ? WT.wEmph : WT.wBody }}>{value || label}</span>
      <WIcon name="chevron-down" size={14} color={active ? WT.accent : WT.muted} />
    </button>
  );
}

function CheckList({ title, options, selected, onToggle, onClear }) {
  const values = options.map(o => (typeof o === 'string' ? o : o.value));
  const allOn = values.length > 0 && values.every(v => selected.includes(v));
  const toggleAll = () => { if (allOn) onClear(); else values.forEach(v => { if (!selected.includes(v)) onToggle(v); }); };
  return (
    <div style={{ padding: 8, maxHeight: 320, overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '4px 8px 8px' }}>
        <span style={{ flex: 1, fontSize: 12, fontWeight: WT.wEmph, color: WT.fg2 }}>{title}</span>
        <button onClick={toggleAll} style={{ background: 'none', border: 'none', color: WT.accent, fontSize: 12, fontWeight: WT.wEmph, cursor: 'pointer', fontFamily: WT.font }}>{allOn ? 'Limpar' : 'Selecionar todos'}</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {options.map(o => {
          const opt = typeof o === 'string' ? { value: o, label: o } : o;
          const on = selected.includes(opt.value);
          return (
            <button key={opt.value} onClick={() => onToggle(opt.value)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: WT.rM, border: 'none',
              background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: WT.font, fontSize: 14, color: WT.fg,
            }} onMouseEnter={e => e.currentTarget.style.background = WT.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ width: 16, height: 16, borderRadius: WT.rS, flex: 'none', border: `1.5px solid ${on ? WT.accentFill : WT.borderHover}`, background: on ? WT.accentFill : '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {on && <WIcon name="check" size={12} color="#fff" strokeWidth={3} />}
              </span>
              {opt.swatch && <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.swatch }} />}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
  const { view, date, filters, freeOnly, weekMode } = state;
  const mvp = !!window.__mvp;
  const viewOpts = mvp ? VIEW_OPTS.filter(v => v.value === 'dia' || v.value === 'semana') : VIEW_OPTS;
  const [pop, setPop] = React.useState(null); // {kind, rect}
  const [fq, setFq] = React.useState('');      // busca dentro do popover de filtros
  const open = (kind, rect) => setPop(p => (p && p.kind === kind ? null : { kind, rect }));
  const close = () => { setPop(null); setFq(''); };

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

  const specs = PROS.flatMap(p => specsOf(p)).filter((v, i, a) => a.indexOf(v) === i);
  // um profissional se encaixa no conjunto de filtros (especialidade + sala + convênio)?
  const proFitsFilters = (p, f) => {
    const sp = f.spec || [], rm = f.room || [], un = f.unit || [], cv = f.conv || [], pc = f.proc || [];
    if (sp.length && !sp.some(s => proHasSpec(p, s))) return false;
    if (rm.length && !rm.includes(p.room)) return false;
    if (un.length && !un.includes(p.unit)) return false;
    if (cv.length && !cv.some(c => dayAcceptsCond(p.id, date, { conv: c }))) return false;
    if (pc.length && !pc.some(id => dayAcceptsCond(p.id, date, { procId: id }))) return false;
    return true;
  };
  // Profissionais elegíveis: só os que se encaixam na especialidade / sala selecionadas
  const eligiblePros = PROS.filter(p => proFitsFilters(p, filters));
  const proOpts = eligiblePros.map(p => ({ value: p.id, label: p.name, swatch: p.color }));

  const toggleFilter = (key, val) => set(s => {
    const cur = s.filters[key] || [];
    const nextVals = cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val];
    const nextFilters = { ...s.filters, [key]: nextVals };
    // ao mudar especialidade/unidade/sala/convênio, seleciona automaticamente TODOS os profissionais que se encaixam (interseção)
    if (key === 'spec' || key === 'unit' || key === 'room' || key === 'conv' || key === 'proc') {
      const sp = nextFilters.spec || [], un = nextFilters.unit || [], rm = nextFilters.room || [], cv = nextFilters.conv || [], pc = nextFilters.proc || [];
      nextFilters.pros = (sp.length || un.length || rm.length || cv.length || pc.length)
        ? PROS.filter(p => proFitsFilters(p, nextFilters)).map(p => p.id)
        : null; // sem restrições → volta a mostrar todas as agendas
    }
    return { filters: nextFilters };
  });
  const clearFilter = key => set(s => ({ filters: { ...s.filters, [key]: key === 'pros' ? null : [] } }));
  const clearAll = () => set({ filters: { pros: null, spec: [], conv: [], unit: [], room: [], proc: [] }, freeOnly: false });
  const arr = k => filters[k] || [];
  // seleção de agendas vive na barra lateral — não conta como filtro ativo
  const activeCount = (state.agendasPlacement === 'sidebar' ? 0 : arr('pros').length) + arr('spec').length + arr('conv').length + arr('unit').length + arr('room').length + arr('proc').length + (freeOnly ? 1 : 0);
  // procedimentos ordenados por uso (clínicas reais têm +15k → mostra só top 10 até o usuário buscar)
  const PROC_USAGE = React.useMemo(() => { const c = {}; (window.ALL_APPTS || []).forEach(a => ((a.procs && a.procs.length) ? a.procs : (a.proc ? [a.proc] : [])).forEach(id => { c[id] = (c[id] || 0) + 1; })); return c; }, []);
  const procsByUse = React.useMemo(() => PROC_LIST.slice().sort((a, b) => (PROC_USAGE[b.id] || 0) - (PROC_USAGE[a.id] || 0)), [PROC_USAGE]);

  // opções do popover, com busca (mesmo padrão da aba de recursos)
  const ql = fq.trim().toLowerCase();
  const matchq = s => !ql || String(s).toLowerCase().includes(ql);
  const rooms = [...new Set(PROS.map(p => p.room))];
  const fProOpts = proOpts.filter(o => matchq(o.label));
  const fSpecs = specs.filter(matchq);
  const fConv = CONVENIOS.filter(matchq);
  const fUnits = UNITS.filter(matchq);
  const fRooms = rooms.filter(matchq);
  // procedimentos: sem busca → top 10 mais usados; com busca → todos os que casam
  const fProcs = ql ? procsByUse.filter(p => matchq(p.name)) : procsByUse.slice(0, 10);
  const procMore = !ql && procsByUse.length > 10 ? procsByUse.length - 10 : 0;
  const noResults = ql && !fProOpts.length && !fSpecs.length && !fConv.length && !fUnits.length && !fRooms.length && !fProcs.length;

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

      <button onClick={e => open('filters', e.currentTarget.getBoundingClientRect())} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: WT.rM,
        border: `1px solid ${activeCount ? WT.borderAccent : WT.border}`, cursor: 'pointer', fontFamily: WT.font, fontSize: 14, fontWeight: WT.wEmph,
        background: activeCount ? WT.accentSoft : '#fff', color: activeCount ? WT.accent : WT.fg, whiteSpace: 'nowrap',
      }}>
        <WIcon name="filter" size={15} color={activeCount ? WT.accent : WT.muted} />
        {!compact && 'Filtros'}
        {activeCount > 0 && <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: WT.pill, background: WT.accentFill, color: '#fff', fontSize: 11, fontWeight: WT.wHead, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{activeCount}</span>}
      </button>

      {view !== 'mes' && <ZoomStepper value={state.zoom || 1} onChange={z => set({ zoom: z })} />}

      <WIconButton name="sliders-horizontal" title="Configurações de visualização" active={pop && pop.kind === 'viewcfg'} onClick={e => open('viewcfg', e.currentTarget.getBoundingClientRect())} />

      {pop && pop.kind === 'cal' && (
        <WPopover anchorRect={pop.rect} onClose={close} width={260} placement="below">
          <div style={{ borderBottom: `1px solid ${WT.borderSub}`, padding: '4px 4px 0' }} />
          <MiniCalendar value={date} onSelect={iso => { set({ date: iso }); close(); }} />
        </WPopover>
      )}
      {pop && pop.kind === 'filters' && (
        <WPopover anchorRect={pop.rect} onClose={close} width={300} placement="below">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px 8px', borderBottom: `1px solid ${WT.borderSub}` }}>
            <span style={{ flex: 1, fontSize: 14, fontWeight: WT.wHead, color: WT.fg }}>Filtros</span>
            {activeCount > 0 && <button onClick={clearAll} style={{ background: 'none', border: 'none', color: WT.accent, fontSize: 12, fontWeight: WT.wEmph, cursor: 'pointer', fontFamily: WT.font }}>Limpar tudo</button>}
          </div>
          <div style={{ padding: '10px 12px 8px', borderBottom: `1px solid ${WT.borderSub}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 4px 0 10px', borderRadius: WT.rM, border: `1px solid ${WT.border}`, background: '#fff' }}>
              <WIcon name="search" size={16} />
              <input autoFocus value={fq} onChange={e => setFq(e.target.value)} placeholder="Buscar profissional, especialidade, convênio, unidade, sala…"
                style={{ border: 'none', outline: 'none', font: `${WT.wBody} 14px ${WT.font}`, flex: 1, background: 'transparent', color: WT.fg, minWidth: 0 }} />
              {fq && <WIconButton name="x" dim={24} onClick={() => setFq('')} />}
            </div>
          </div>
          <div style={{ maxHeight: 380, overflow: 'auto' }}>
            {!ql && (
              <div style={{ padding: '8px 12px', borderBottom: `1px solid ${WT.borderSub}` }}>
                <WToggle checked={freeOnly} onChange={v => set({ freeOnly: v })} label="Somente horários livres" />
              </div>
            )}
            {noResults && <div style={{ padding: '20px 12px', fontSize: 13, color: WT.muted, textAlign: 'center' }}>Nenhum resultado para “{fq}”.</div>}
            {fProOpts.length > 0 && <CheckList title="Profissionais" options={fProOpts} selected={arr('pros')} onToggle={v => toggleFilter('pros', v)} onClear={() => clearFilter('pros')} />}
            {fSpecs.length > 0 && <><WDivider /><CheckList title="Especialidade" options={fSpecs} selected={arr('spec')} onToggle={v => toggleFilter('spec', v)} onClear={() => clearFilter('spec')} /></>}
            {fUnits.length > 0 && <><WDivider /><CheckList title="Unidade" options={fUnits} selected={arr('unit')} onToggle={v => toggleFilter('unit', v)} onClear={() => clearFilter('unit')} /></>}
            {fConv.length > 0 && !mvp && <><WDivider /><CheckList title="Convênio" options={fConv} selected={arr('conv')} onToggle={v => toggleFilter('conv', v)} onClear={() => clearFilter('conv')} /></>}
            {fRooms.length > 0 && !mvp && <><WDivider /><CheckList title="Sala" options={fRooms} selected={arr('room')} onToggle={v => toggleFilter('room', v)} onClear={() => clearFilter('room')} /></>}
            {fProcs.length > 0 && <><WDivider /><CheckList title={ql ? 'Procedimento' : 'Procedimento · mais usados'} options={fProcs.map(p => ({ value: p.id, label: p.name }))} selected={arr('proc')} onToggle={v => toggleFilter('proc', v)} onClear={() => clearFilter('proc')} />{procMore > 0 && <div style={{ padding: '0 16px 8px', fontSize: 12, color: WT.muted }}>Digite para buscar entre todos os procedimentos (+{procMore}).</div>}</>}
          </div>
        </WPopover>
      )}
      {pop && pop.kind === 'viewcfg' && (
        <WPopover anchorRect={pop.rect} onClose={close} width={264} placement="below">
          <div style={{ padding: '12px 14px 4px', fontSize: 14, fontWeight: WT.wHead, color: WT.fg }}>Configurações de visualização</div>
          <div style={{ padding: '8px 14px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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

Object.assign(window, { Toolbar, VIEW_OPTS, FilterChip, CheckList });
