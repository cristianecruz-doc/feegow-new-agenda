/* ============================================================================
   Feegow — New Agenda · App (state machine + wiring)
   ============================================================================ */

const ACCENTS = {
  teal:   { accent: '#006a59', accentFill: '#007c68', accentFillHover: '#006a59', accentSoft: '#dff9f2', borderAccent: '#00a085', calSelBg: '#007c68', calToday: '#00a085', calTodayFg: '#006a59' },
  blue:   { accent: '#1b5ea9', accentFill: '#1f6fb0', accentFillHover: '#1b5ea9', accentSoft: '#e3edf8', borderAccent: '#4e8de9', calSelBg: '#1f6fb0', calToday: '#4e8de9', calTodayFg: '#1b5ea9' },
  violet: { accent: '#6d3aa6', accentFill: '#7b3fb0', accentFillHover: '#6d3aa6', accentSoft: '#f2eafb', borderAccent: '#9a6fce', calSelBg: '#7b3fb0', calToday: '#9a6fce', calTodayFg: '#6d3aa6' },
};
function applyAccent(key) { Object.assign(WT, ACCENTS[key] || ACCENTS.teal); }

// Fixed product config (previously prototype tweaks; flow/permissions now live in
// the clinic's own settings, out of scope for the agenda surface).
const ACCENT = 'teal';
const TIME_RANGE = '07-20';
const BOOKING_FLOW = 'two-tier';
const CLINIC_CONFIG = 'padrao';
const PERMS = { editFicha: true, verConta: true };

const uid = () => 'n' + Math.random().toString(36).slice(2, 9);

// Tweaks (demo). Idioma é uma camada só para demonstração a clientes.
const TWEAK_DEFAULTS = /*EDITMODE*/{
  lang: 'pt',
}/*EDITMODE-END*/;

function App() {
  applyAccent(ACCENT);
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  React.useLayoutEffect(() => { if (window.I18N) window.I18N.set(tw.lang); });


  const [appts, setAppts] = React.useState(() => ALL_APPTS.map(a => ({ ...a })));
  const [blocks, setBlocks] = React.useState(() => SEED_BLOCKS.map(b => ({ ...b })));
  const [app, setApp] = React.useState({
    view: 'dia', date: TODAY, dayPro: 'p1', extraResources: [],
    filters: { pros: null, spec: [], conv: [], unit: [], room: [] }, freeOnly: false,
    sidebarCollapsed: false,
    // Posição do seletor de agendas: 'top' (barra acima da grade) | 'sidebar'
    agendasPlacement: 'top',
    // Configurações de visualização do usuário
    cardStyle: 'typebar', density: 'comfortable',
    // Sinalizadores exibidos nos cards
    showPriorityFlags: false, showNewPatientFlag: false,
  });
  const set = patch => setApp(s => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }));

  const [ctxCard, setCtxCard] = React.useState(null);  // {a, rect}
  const [quick, setQuick] = React.useState(null);       // {ctx, rect}
  const [booking, setBooking] = React.useState(null);   // {init}
  const [cancel, setCancel] = React.useState(null);     // {a}
  const [blockM, setBlockM] = React.useState(null);     // {ctx}
  const [blockPick, setBlockPick] = React.useState(null); // [blocks] — chooser na semanal
  const [draft, setDraft] = React.useState(null); // {colId, time, dur} — placeholder do agendamento em criação
  const [resched, setResched] = React.useState(null);   // {a}
  const [toast, setToast] = React.useState(null);
  const [width, setWidth] = React.useState(window.innerWidth);
  React.useEffect(() => { const r = () => setWidth(window.innerWidth); window.addEventListener('resize', r); return () => window.removeEventListener('resize', r); }, []);
  const compact = width < 860;

  const config = CLINIC_CONFIGS[CLINIC_CONFIG] || CLINIC_CONFIGS.padrao;  const flash = (msg, opts = {}) => { setToast({ msg, ...opts }); clearTimeout(window.__tt); window.__tt = setTimeout(() => setToast(null), opts.dur || 3200); };

  const timeStart = TIME_RANGE === '08-18' ? '08:00' : '07:00';
  const timeEnd = TIME_RANGE === '08-18' ? '18:00' : '20:00';
  const state = { ...app, timeStart, timeEnd };
  // Prefs de sinalizadores lidas pelos cards (apptFlags)
  window.__cardFlags = { priority: app.showPriorityFlags !== false, newPatient: app.showNewPatientFlag !== false };
  const filtered = filterAppts(appts, app.filters);

  // ---- slot resolution -----------------------------------------------------
  function resolveSlot(colId) {
    if (state.view === 'semana') return { proId: app.dayPro, date: colId.slice(1) };
    if (state.view === 'equip') return { equip: colId, proId: PROS[0].id, date: state.date };
    if (typeof colId === 'string' && colId.includes(':')) {
      const [kind, id] = colId.split(':');
      if (kind === 'pro') return { proId: id, date: state.date };
      if (kind === 'equip') return { equip: id, proId: PROS[0].id, date: state.date };
      if (kind === 'room') { const r = ROOMS.find(x => x.id === id); return { room: r ? r.name : null, proId: app.dayPro, date: state.date }; }
    }
    return { proId: colId, date: state.date };
  }

  // ---- create / update -----------------------------------------------------
  function commitNew({ patient, procId, procIds, time, proId, date, equip, room, form, fitIn, payPlano, payConv }) {
    const ids = (procIds && procIds.length) ? procIds : (procId ? [procId] : []);
    const proc = PROCS[ids[0]];
    const sumDur = ids.reduce((s, id) => s + ((PROCS[id] || {}).dur || 0), 0);
    const sumPrice = ids.reduce((s, id) => s + ((PROCS[id] || {}).price || 0), 0);
    const pt = patient && patient.patientId ? patient.patientId : (patient ? patient.patientName : 'novo');
    const na = {
      id: uid(), pro: proId || PROS[0].id, pt, proc: ids[0], procs: ids, start: time, status: form && form._checkin ? 'aguardando' : 'marcado',
      conv: form ? (form.plano ? form.convenio : 'Particular') : (payConv != null ? payConv : ((patientById(pt) || {}).conv || 'Particular')),
      plano: form ? form.plano : (payPlano != null ? payPlano : false), date: date || state.date, dur: sumDur || gradeSlotAt(proId || PROS[0].id, date || state.date, time),
      price: sumPrice, fitIn: !!fitIn, note: form && form.notas ? form.notas : null, equip: equip || null,
      channel: form ? form.canal : 'Balcão', room: room || (form ? form.local : null),
      _patientName: patient && patient.patientName, isNewPt: patient && patient.isNew,
    };
    setAppts(s => [...s, na]);
    return na;
  }

  const openBooking = init => { setQuick(null); setCtxCard(null); setBooking({ init }); };

  function onCreate(kind) {
    const base = { date: state.date, time: '08:00', proId: app.dayPro };
    if (kind === 'bloqueio') { setBlockM({ ctx: { proId: app.dayPro, date: state.date, time: '12:00' } }); return; }
    if (kind === 'encaixe') { openBooking({ ...base, fitIn: true }); return; }
    openBooking(base);
  }

  function onSlotClick(colId, min, rect) {
    const slot = resolveSlot(colId);
    const ctx = { ...slot, time: fmtMin(min) };
    setDraft({ colId, time: ctx.time, dur: gradeSlotAt(slot.proId, slot.date, ctx.time) || 30 });
    if (BOOKING_FLOW === 'two-tier') setQuick({ ctx, rect });
    else openBooking(ctx);
  }
  const onDraft = patch => setDraft(d => d ? { ...d, ...patch } : d);

  function onQuickSave(payload) {
    const na = commitNew(payload);
    setQuick(null); setDraft(null);
    const pt = patientById(na.pt) || { name: na._patientName || 'Paciente' };
    flash(`Agendamento criado · ${pt.name} ${na.start}`);
  }

  function onBookingSave({ form, checkin }) {
    const patient = form.patient;
    const na = commitNew({ patient, procIds: form.procIds, time: form.time, proId: form.proId, date: form.date, equip: form.equip || null, room: form.local, form: { ...form, _checkin: checkin }, fitIn: booking && booking.init && booking.init.fitIn });
    setBooking(null); setDraft(null);
    const pt = patientById(na.pt) || { name: na._patientName || 'Paciente' };
    flash(checkin ? `Agendado e check-in feito · ${pt.name}` : `Agendamento salvo · ${pt.name} ${na.start}`);
  }

  // ---- context-card actions ------------------------------------------------
  function doCheckin(a) {
    setAppts(s => s.map(x => x.id === a.id ? { ...x, status: 'aguardando' } : x));
    setCtxCard(null);
    const pt = patientById(a.pt) || {}; flash(`Check-in realizado · ${pt.name || 'paciente'}`);
  }
  function doCancel(a) { setCtxCard(null); setCancel({ a }); }
  function confirmCancel(info) {
    setAppts(s => s.map(x => x.id === cancel.a.id ? { ...x, status: 'cancelado', reason: info.label } : x));
    setCancel(null); flash('Agendamento cancelado · horário liberado', { tone: 'danger' });
  }
  function doReschedule(a) { setCtxCard(null); setResched({ a }); }
  function confirmReschedule(target) {
    setAppts(s => s.map(x => x.id === resched.a.id ? { ...x, pro: target.pro, date: target.date, start: target.time } : x));
    setResched(null); flash('Agendamento remarcado');
  }
  function openEdit(a) { setCtxCard(null); openBooking({ editing: true, appt: a, date: a.date, time: a.start, proId: a.pro, procIds: (a.procs && a.procs.length ? a.procs : [a.proc]), patient: { patientId: a.pt, patientName: (patientById(a.pt) || {}).name, isNew: false } }); }

  // ---- drag reschedule -----------------------------------------------------
  const [drag, setDrag] = React.useState({ appt: null, colId: null, min: null });
  const [dropError, setDropError] = React.useState(null); // { pro, kind:'conv'|'proc', value }

  // Coluna de destino é de um profissional? (validação de convênio/serviço só vale p/ médico)
  function targetProOf(colId) {
    if (state.view === 'semana') return app.dayPro;
    if (typeof colId === 'string' && colId.startsWith('pro:')) return colId.split(':')[1];
    if (typeof colId === 'string' && !colId.includes(':') && PROS.some(p => p.id === colId)) return colId;
    return null; // equipamento / sala → sem validação de médico
  }
  function applyDrop(colId, min) {
    const a = drag.appt; if (!a) return;
    const slot = resolveSlot(colId);
    // ---- validação: o médico de destino atende o convênio e realiza o serviço? ----
    const tPro = targetProOf(colId);
    if (tPro && tPro !== a.pro) {
      const pro = PROS.find(p => p.id === tPro);
      const date = slot.date || a.date;
      const conv = a.conv || 'Particular';
      if (conv !== 'Particular' && !dayAcceptsCond(tPro, date, { conv })) {
        setDropError({ pro, kind: 'conv', value: conv }); setDrag({ appt: null }); return;
      }
      const procIds = (a.procs && a.procs.length) ? a.procs : (a.proc ? [a.proc] : []);
      const badProc = procIds.find(pid => pid && !dayAcceptsCond(tPro, date, { procId: pid }));
      if (badProc) {
        setDropError({ pro, kind: 'proc', value: (PROCS[badProc] || {}).name || 'esse serviço' }); setDrag({ appt: null }); return;
      }
    }
    const prev = { ...a };
    setAppts(s => s.map(x => x.id === a.id ? { ...x, pro: slot.proId || x.pro, date: slot.date || x.date, equip: slot.equip || x.equip, room: slot.room || x.room, start: fmtMin(min) } : x));
    setDrag({ appt: null });
    flash(`Remarcado para ${fmtMin(min)}`, { action: { label: 'Desfazer', onClick: () => { setAppts(s => s.map(x => x.id === a.id ? prev : x)); setToast(null); } } });
  }
  const dragApi = {
    appt: drag.appt, colId: drag.colId, min: drag.min,
    start: a => setDrag({ appt: a, colId: null, min: null }),
    setMin: (colId, min) => setDrag(d => (d.colId === colId && d.min === min ? d : { ...d, colId, min })),
    onDrop: applyDrop, end: () => setDrag({ appt: null }),
  };

  // (waiting-list / Sala de espera feature lives in a separate project — not part of the agenda)

  const viewProps = { state, set, appts: filtered, blocks, drag: dragApi, onSlotClick, onCardOpen: (a, rect) => setCtxCard({ a, rect }), onBlockOpen: b => setBlockM({ block: b }), onBlockPick: bs => setBlockPick(bs), draft };

  // Seletor de agendas na barra lateral (só nas views multi-recurso Dia/Semana)
  const agendasInSidebar = app.agendasPlacement === 'sidebar';
  const sidebarAgendaSel = (agendasInSidebar && (state.view === 'dia' || state.view === 'semana'))
    ? agendaSelection(state, set) : null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: WT.bg }}>
      <TopNavbar unit="Unidade Centro" onUnit={() => {}} compact={compact} onToggleSidebar={() => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed }))}
        agendasInSidebar={agendasInSidebar} onToggleAgendas={() => set(s => ({ agendasPlacement: s.agendasPlacement === 'sidebar' ? 'top' : 'sidebar' }))} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {!compact && <Sidebar collapsed={app.sidebarCollapsed} onToggle={() => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed }))} date={app.date} onSelectDate={iso => set({ date: iso })} onCreate={onCreate} agendaSel={sidebarAgendaSel} />}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Toolbar state={state} set={set} compact={compact}
            onNew={() => openBooking({ date: state.date, time: '08:00', proId: app.dayPro })} />
          <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {state.view === 'dia' && <DayView {...viewProps} />}
              {state.view === 'semana' && <WeekView {...viewProps} />}
              {state.view === 'mes' && <MonthView state={state} set={set} appts={filtered} blocks={blocks} />}
              {state.view === 'equip' && <EquipmentView {...viewProps} />}
              {state.view === 'sala' && <RoomView {...viewProps} />}
              {state.view === 'programacao' && <ProgramacaoView {...viewProps} />}
            </div>
          </div>
        </main>
      </div>

      {/* overlays */}
      {ctxCard && <ContextCard a={appts.find(x => x.id === ctxCard.a.id) || ctxCard.a} anchorRect={ctxCard.rect || { left: width / 2, right: width / 2, top: 120, bottom: 120 }} onClose={() => setCtxCard(null)}
        onCheckin={doCheckin} onReschedule={doReschedule} onCancel={doCancel} onOpen={openEdit} />}
      {quick && <QuickCreatePopover ctx={quick.ctx} anchorRect={quick.rect} onClose={() => { setQuick(null); setDraft(null); }} onMore={ctx => openBooking(ctx)} onSave={onQuickSave} onDraft={onDraft} />}
      {booking && <BookingHost init={booking.init} config={config} flow={BOOKING_FLOW === 'two-tier' ? 'drawer' : BOOKING_FLOW} compact={compact} perms={PERMS} appts={appts} flash={flash} onCancel={() => { setBooking(null); setDraft(null); }} onSave={onBookingSave} onDraft={onDraft} />}
      {cancel && <CancelModal a={cancel.a} onClose={() => setCancel(null)} onConfirm={confirmCancel} />}
      {blockM && <BlockModal ctx={blockM.ctx || {}} block={blockM.block} appts={appts}
        onClose={() => setBlockM(null)}
        onConfirm={info => {
          if (info.id) { setBlocks(s => s.map(b => b.id === info.id ? { ...b, ...info } : b)); flash('Bloqueio atualizado'); }
          else { setBlocks(s => [...s, { ...info, id: uid() }]); flash('Horário bloqueado'); }
          setBlockM(null);
        }}
        onDelete={b => { setBlocks(s => s.filter(x => x.id !== b.id)); setBlockM(null); flash('Bloqueio excluído · horários liberados', { tone: 'danger' }); }} />}
      {resched && <RescheduleModal a={resched.a} onClose={() => setResched(null)} onConfirm={confirmReschedule} />}
      {blockPick && <BlockChooser blocks={blockPick} onClose={() => setBlockPick(null)} onPick={b => { setBlockPick(null); setBlockM({ block: b }); }} />}
      {dropError && <CenterModal
        title={dropError.kind === 'conv' ? 'Convênio não atendido' : 'Serviço não oferecido'}
        icon="alert-triangle" iconTone="danger" width={430} onClose={() => setDropError(null)}
        footer={<><span style={{ flex: 1 }} /><WButton variant="primary" label="Entendi" onClick={() => setDropError(null)} /></>}>
        <div style={{ fontSize: 14, color: WT.fg2, lineHeight: 1.55 }}>
          {dropError.kind === 'conv'
            ? <><strong style={{ color: WT.fg, fontWeight: WT.wEmph }}>{dropError.pro.name}</strong> não atende o convênio <strong style={{ color: WT.fg, fontWeight: WT.wEmph }}>{dropError.value}</strong>. Escolha outro profissional ou ajuste o convênio do agendamento.</>
            : <><strong style={{ color: WT.fg, fontWeight: WT.wEmph }}>{dropError.pro.name}</strong> não realiza <strong style={{ color: WT.fg, fontWeight: WT.wEmph }}>{dropError.value}</strong>. Escolha um profissional que ofereça esse serviço.</>}
        </div>
      </CenterModal>}
      <WToast toast={toast} />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Demonstração" />
        <TweakRadio label="Idioma / Language" value={tw.lang}
          options={[{ value: 'pt', label: 'Português' }, { value: 'en', label: 'English' }]}
          onChange={v => setTweak('lang', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
