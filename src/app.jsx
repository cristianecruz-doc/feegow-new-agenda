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
  edition: 'final',
}/*EDITMODE-END*/;

function App() {
  applyAccent(ACCENT);
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  React.useLayoutEffect(() => { if (window.I18N) window.I18N.set(tw.lang); });
  const mvp = tw.edition === 'mvp';
  // #mvp / #final na URL (vindo do protótipo de transição) define a edição na abertura
  React.useEffect(() => {
    const h = (window.location.hash || '').replace('#', '');
    if ((h === 'mvp' || h === 'final') && h !== tw.edition) setTweak('edition', h);
  }, []);
  window.__mvp = mvp;
  // Configurações da Agenda (11 chaves legadas) — persistidas em localStorage
  const [cfg, setCfgState] = React.useState(cfgLoad);
  window.__cfg = cfg;
  const setCfg = patch => setCfgState(c => { const n = { ...c, ...patch }; cfgSave(n); return n; });
  const resetSection = keys => setCfgState(c => { const n = { ...c }; keys.forEach(k => { n[k] = CFG_DEFAULTS[k]; if (k === 'AlterarStatusAgendamento') n.AlterarStatusAgendamentoPara = CFG_DEFAULTS.AlterarStatusAgendamentoPara; }); cfgSave(n); flash('Seção restaurada para o padrão'); return n; });
  // MVP: sem visão mensal/salas/programação/equipamentos → cai para Dia; limpa filtros de convênio/sala
  React.useEffect(() => {
    if (!mvp) return;
    setApp(s => {
      const patch = {};
      if (['mes', 'equip', 'sala', 'programacao'].includes(s.view)) patch.view = 'dia';
      if ((s.filters.conv || []).length || (s.filters.room || []).length) patch.filters = { ...s.filters, conv: [], room: [] };
      return Object.keys(patch).length ? { ...s, ...patch } : s;
    });
  }, [mvp]);


  const [appts, setAppts] = React.useState(() => ALL_APPTS.map(a => ({ ...a })));
  const [blocks, setBlocks] = React.useState(() => SEED_BLOCKS.map(b => ({ ...b })));
  const [app, setApp] = React.useState({
    view: 'dia', date: TODAY, dayPro: 'p1', extraResources: [],
    filters: { pros: ['p1'], spec: [], conv: [], unit: [], room: [], proc: [] }, freeOnly: false,
    sidebarCollapsed: false,
    // Seletor de agendas fixo na barra lateral (abaixo do status)
    agendasPlacement: 'sidebar',
    // Configurações de visualização do usuário
    cardStyle: 'filled', density: 'compact', zoom: 1,
    // Sinalizadores exibidos nos cards
    showPriorityFlags: false, showNewPatientFlag: false,
    // Página ativa do módulo ('agenda' | 'agenda-options')
    page: 'agenda',
  });
  const set = patch => setApp(s => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }));

  const [ctxCard, setCtxCard] = React.useState(null);  // {a, rect}
  const [quick, setQuick] = React.useState(null);       // {ctx, rect}
  const [booking, setBooking] = React.useState(null);   // {init, kind, key} — painel lateral de criação/edição
  const [minimized, setMinimized] = React.useState(false); // painel recolhido na pílula (padrão Gmail)
  const [cancel, setCancel] = React.useState(null);     // {a}
  const [blockPick, setBlockPick] = React.useState(null); // [blocks] — chooser na semanal
  const [draft, setDraft] = React.useState(null); // {colId, time, dur} — placeholder do agendamento em criação
  const [slotPick, setSlotPick] = React.useState(null); // {…slot, seq} — clique no grid com o painel aberto
  const [reschedule, setReschedule] = React.useState(null);   // { a, prevFreeOnly } — modo remarcação (fluxo aberto)
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
  // condição da remarcação em andamento: só destaca horários livres onde o médico atende o convênio + procedimentos
  window.__rxCond = reschedule ? { conv: reschedule.a.conv || 'Particular', procIds: (reschedule.a.procs && reschedule.a.procs.length ? reschedule.a.procs : (reschedule.a.proc ? [reschedule.a.proc] : [])) } : null;
  // filtro de grade ativo (procedimento / convênio): esconde blocos de horário onde não é permitido
  window.__gradeFilter = ((app.filters.proc || []).length || (app.filters.conv || []).length) ? { proc: app.filters.proc || [], conv: app.filters.conv || [] } : null;
  // status alterável direto pelo card (smart tag)
  window.__onSetStatus = (a, status) => {
    if (status === a.status) return;
    if (status === 'cancelado') { setCtxCard(null); setCancel({ a }); return; }
    const prev = a.status;
    setAppts(s => s.map(x => x.id === a.id ? { ...x, status } : x));
    const st = STATUS[status] || {};
    flash(`Status: ${st.label || status}`, { action: { label: 'Desfazer', onClick: () => { setAppts(s => s.map(x => x.id === a.id ? { ...x, status: prev } : x)); setToast(null); } } });
  };
  const filtered = filterAppts(appts, app.filters).filter(a => !cfgHiddenStatuses().includes(a.status));

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

  // sem `kind` explícito, o tipo sai do próprio init (init.fitIn / init.block) — ver BookingHost
  const openBooking = (init, kind) => { setQuick(null); setCtxCard(null); setSlotPick(null); setMinimized(false); setBooking({ init, kind, key: uid() }); };
  const closeBooking = () => { setBooking(null); setDraft(null); setSlotPick(null); setMinimized(false); };
  const openBlockEdit = b => openBooking({ block: b, date: b.date, time: b.allDay ? null : b.start, proId: app.dayPro }, 'bloqueio');

  // "Criar" na barra lateral não parte de um horário do grid: é o caminho de quem está
  // encaixando alguém, então abre como encaixe (o seletor de tipo continua à mão)
  function onCreate() {
    openBooking({ date: state.date, time: '08:00', proId: app.dayPro }, 'encaixe');
  }

  // minuto coberto por um agendamento não-cancelado do profissional
  function busyAt(proId, date, time) {
    const m = toMin(time);
    return appts.some(a => a.pro === proId && a.date === date && a.status !== 'cancelado' && m >= toMin(a.start) && m < toMin(a.start) + (a.dur || 0));
  }

  // escolhe o profissional com horário vago no slot clicado (preferência p/ quem tem grade e sem conflito)
  function pickFreePro(date, time, candidateIds) {
    const cands = (candidateIds && candidateIds.length) ? candidateIds : PROS.map(p => p.id);
    const hasGrade = id => !!gradeAt(id, date, time);
    return cands.find(id => hasGrade(id) && !busyAt(id, date, time))   // grade + livre
      || cands.find(id => hasGrade(id))                                 // tem grade (mesmo ocupado)
      || cands[0];
  }

  function onSlotClick(colId, min, rect) {
    if (reschedule) { applyReschedule(colId, min); return; }
    const slot = resolveSlot(colId);
    const ctx = { ...slot, time: fmtMin(min) };
    if (state.view === 'semana') {
      const candidates = (agendaSelection(state, set).selected || []).filter(r => r.kind === 'pro').map(r => r.id);
      ctx.proOptions = candidates.length ? candidates : PROS.map(p => p.id);
      ctx.proId = pickFreePro(slot.date, ctx.time, ctx.proOptions);
      ctx.pickPro = true;
    }
    // painel lateral aberto → o grid vira um seletor: o clique preenche data/hora/profissional.
    // O rascunho não é tocado aqui: com o painel aberto o formulário é a fonte do placeholder
    // (sobrescrevê-lo apagaria tipo/procedimentos quando o clique repete o horário atual).
    // Com o painel minimizado o clique também o traz de volta — escolher outro horário é uma ação só.
    if (booking) { setSlotPick(s => ({ ...ctx, seq: (s ? s.seq : 0) + 1 })); setMinimized(false); return; }
    // horário já ocupado pelo profissional escolhido → o que está sendo criado é um encaixe.
    // Só vale na ABERTURA e só em coluna de profissional (equipamento/sala fora do escopo).
    ctx.fitIn = !slot.equip && !slot.room && busyAt(ctx.proId, slot.date, ctx.time);
    setDraft({ colId, time: ctx.time, dur: gradeSlotAt(ctx.proId, slot.date, ctx.time) || 30 });
    if (BOOKING_FLOW === 'two-tier') setQuick({ ctx, rect });
    else openBooking(ctx);
  }
  // painel aberto → o placeholder existe mesmo sem clique no grid (pré-visualização ao vivo)
  const onDraft = patch => setDraft(d => (d || booking) ? { ...(d || {}), ...patch } : d);

  function onQuickSave(payload) {
    const na = commitNew(payload);
    setQuick(null); setDraft(null);
    const pt = patientById(na.pt) || { name: na._patientName || 'Paciente' };
    flash(`${na.fitIn ? 'Encaixe' : 'Agendamento'} criado · ${pt.name} ${na.start}`);
  }

  function onBookingSave({ form, checkin, fitIn }) {
    const patient = form.patient;
    const na = commitNew({ patient, procIds: form.procIds, time: form.time, proId: form.proId, date: form.date, equip: form.equip || null, room: form.local, form: { ...form, _checkin: checkin }, fitIn });
    closeBooking();
    const pt = patientById(na.pt) || { name: na._patientName || 'Paciente' };
    flash(checkin ? `Agendado e check-in feito · ${pt.name}` : `${na.fitIn ? 'Encaixe' : 'Agendamento'} salvo · ${pt.name} ${na.start}`);
  }

  // ---- bloqueios (formulário vive no painel lateral) -------------------------
  function onBlockConfirm(info) {
    if (info.id) { setBlocks(s => s.map(b => b.id === info.id ? { ...b, ...info } : b)); flash('Bloqueio atualizado'); }
    else { setBlocks(s => [...s, { ...info, id: uid() }]); flash('Horário bloqueado'); }
    closeBooking();
  }
  function onBlockDelete(b) {
    setBlocks(s => s.filter(x => x.id !== b.id));
    closeBooking();
    flash('Bloqueio excluído · horários liberados', { tone: 'danger' });
  }

  // ---- context-card actions ------------------------------------------------
  function doCheckin(a) {
    setAppts(s => s.map(x => x.id === a.id ? { ...x, status: 'aguardando' } : x));
    setCtxCard(null);
    const pt = patientById(a.pt) || {}; flash(`Check-in realizado · ${pt.name || 'paciente'}`);
  }
  function doCancel(a) { setCtxCard(null); setCancel({ a }); }
  function confirmCancel(info) {
    const a = cancel.a;
    setAppts(s => s.map(x => x.id === a.id ? { ...x, status: 'cancelado', reason: info.label } : x));
    setCancel(null);
    if (a.paid && cfgGet('ContasAPagarCancelamento')) {
      flash(`Agendamento cancelado · conta a pagar de ${brl(a.price || 0)} criada no financeiro`, { tone: 'danger', dur: 4200 });
    } else flash('Agendamento cancelado · horário liberado', { tone: 'danger' });
  }
  function doReschedule(a) {
    // Configuração: bloquear remarcação de retorno de paciente faltoso
    const pt = patientById(a.pt) || {};
    const isRet = apptProcIds(a).includes('retorno');
    if (cfgGet('bloqueioretornofaltoso') && isRet && (pt.noShows || 0) > 0) {
      setCtxCard(null);
      setRuleBlock({
        title: 'Remarcação de retorno bloqueada',
        text: `${pt.name || 'O paciente'} tem ${pt.noShows} falta${pt.noShows > 1 ? 's' : ''} registrada${pt.noShows > 1 ? 's' : ''}. A clínica não permite remarcar o retorno gratuito nesse caso — agende uma nova consulta.`,
      });
      return;
    }
    setCtxCard(null); setReschedule({ a, prevFreeOnly: app.freeOnly }); set({ freeOnly: true });
  }
  function cancelReschedule() { if (reschedule) set({ freeOnly: reschedule.prevFreeOnly }); setReschedule(null); }
  function applyReschedule(colId, min) {
    const a = reschedule.a;
    const slot = resolveSlot(colId);
    const date = slot.date || a.date;
    const newPro = state.view === 'semana' ? a.pro : (slot.proId || a.pro);
    // Configuração: remarcar em dia sem agenda aberta
    if (!cfgGet('PermitirRemarcarSemGrade') && newPro && !gradesFor(newPro, date).length) {
      const p = PROS.find(x => x.id === newPro) || {};
      setRuleBlock({ title: 'Dia sem agenda aberta', text: `${p.name || 'O profissional'} não tem grade de atendimento em ${fmtShortDate(date)}. Escolha um dia com agenda aberta ou ative “Permitir remarcar em dia sem agenda aberta” nas configurações.` });
      return;
    }
    // validação: profissional de destino atende convênio/serviço?
    if (newPro && newPro !== a.pro) {
      const conv = a.conv || 'Particular';
      if (conv !== 'Particular' && !dayAcceptsCond(newPro, date, { conv })) { setDropError({ pro: PROS.find(p => p.id === newPro), kind: 'conv', value: conv }); return; }
      const procIds = (a.procs && a.procs.length) ? a.procs : (a.proc ? [a.proc] : []);
      const badProc = procIds.find(pid => pid && !dayAcceptsCond(newPro, date, { procId: pid }));
      if (badProc) { setDropError({ pro: PROS.find(p => p.id === newPro), kind: 'proc', value: (PROCS[badProc] || {}).name || 'esse serviço' }); return; }
    }
    const prev = { ...a };
    setAppts(s => s.map(x => x.id === a.id ? { ...x, pro: newPro, date, equip: slot.equip || x.equip, room: slot.room || x.room, start: fmtMin(min), status: 'remarcado', reason: `Remarcado · era ${prev.start}` } : x));
    set({ freeOnly: reschedule.prevFreeOnly });
    setReschedule(null);
    flash(`Remarcado para ${fmtMin(min)}`, { action: { label: 'Desfazer', onClick: () => { setAppts(s => s.map(x => x.id === a.id ? prev : x)); setToast(null); } } });
  }
  function openEdit(a) { setCtxCard(null); openBooking({ editing: true, appt: a, date: a.date, time: a.start, proId: a.pro, fitIn: !!a.fitIn, procIds: (a.procs && a.procs.length ? a.procs : [a.proc]), patient: { patientId: a.pt, patientName: (patientById(a.pt) || {}).name, isNew: false } }); }

  // ---- drag reschedule -----------------------------------------------------
  const [drag, setDrag] = React.useState({ appt: null, colId: null, min: null });
  const [dropError, setDropError] = React.useState(null); // { pro, kind:'conv'|'proc', value }
  const [ruleBlock, setRuleBlock] = React.useState(null);  // { title, text } — regra das Configurações da Agenda

  // Configuração: durante a remarcação, dias sem grade ficam desabilitados no mini-calendário
  window.__dayBlocked = (reschedule && !cfgGet('PermitirRemarcarSemGrade'))
    ? iso => gradesFor(reschedule.a.pro, iso).length ? null : 'Profissional sem agenda aberta neste dia'
    : null;

  // Configuração: "Atualizar status automaticamente no fim do dia" — simulação
  function simulateDayEnd(target) {
    const st = STATUS[target] || STATUS.faltou;
    let n = 0;
    setAppts(s => s.map(x => {
      if (x.date === TODAY && ['marcado', 'confirmado'].includes(x.status)) { n++; return { ...x, status: target, reason: `Status atualizado automaticamente no fim do dia` }; }
      return x;
    }));
    setTimeout(() => flash(n ? `${n} agendamento${n > 1 ? 's' : ''} atualizado${n > 1 ? 's' : ''} para ${st.label}` : 'Nenhum agendamento pendente hoje'), 0);
  }

  function doRetorno(a) {
    setCtxCard(null);
    const pt = patientById(a.pt) || {};
    openBooking({ date: state.date, time: a.start, proId: a.pro, procIds: ['retorno'], patient: { patientId: a.pt, patientName: pt.name || a._patientName, isNew: false } });
  }

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

  // com o painel aberto, o placeholder segue o profissional/data do formulário (coluna certa)
  const liveDraft = React.useMemo(() => {
    if (!draft) return null;
    if (!booking) return draft;
    const d = { ...draft };
    if (state.view === 'semana') d.colId = 'd' + (d.date || state.date);
    else if (d.proId) d.colId = (d.date && d.date !== state.date) ? '__outra-data' : 'pro:' + d.proId;
    return d;
  }, [draft, booking, app.view, app.date]);

  const viewProps = { state, set, appts: filtered, blocks, drag: dragApi, onSlotClick, onCardOpen: (a, rect) => setCtxCard({ a, rect }), onBlockOpen: openBlockEdit, onBlockPick: bs => setBlockPick(bs), draft: liveDraft };

  const bookingHost = booking && (
    <BookingHost key={booking.key} init={booking.init} kind={booking.kind} config={config} compact={compact} perms={PERMS}
      appts={appts} flash={flash} slotPick={slotPick} draft={draft}
      minimized={minimized} onMinimize={() => setMinimized(true)} onRestore={() => setMinimized(false)}
      onCancel={closeBooking} onSave={onBookingSave} onDraft={onDraft}
      onBlockConfirm={onBlockConfirm} onBlockDelete={onBlockDelete} />
  );

  // Seletor de agendas na barra lateral (só nas views multi-recurso Dia/Semana)
  const agendasInSidebar = app.agendasPlacement === 'sidebar';
  const sidebarAgendaSel = (agendasInSidebar && (state.view === 'dia' || state.view === 'semana'))
    ? agendaSelection(state, set) : null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: WT.bg }}>
      <TopNavbar unit="Unidade Centro" onUnit={() => {}} compact={compact} onToggleSidebar={() => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed }))} edition={tw.edition} onEdition={v => setTweak('edition', v)} lang={tw.lang} onLang={v => setTweak('lang', v)} page={app.page} onNavigate={id => set({ page: id })} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {!compact && <Sidebar collapsed={app.sidebarCollapsed} onToggle={() => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed }))} date={app.date} onSelectDate={iso => set({ date: iso })} onCreate={onCreate} agendaSel={sidebarAgendaSel} />}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {app.page === 'agenda-config'
            ? <AgendaConfigPage cfg={cfg} onBack={() => set({ page: 'agenda' })} resetSection={resetSection} onSimulateDayEnd={simulateDayEnd}
                setCfg={patch => { setCfg(patch); flash('Configuração salva'); }} />
            : <>
          <Toolbar state={state} set={set} compact={compact}
            onNew={() => openBooking({ date: state.date, time: '08:00', proId: app.dayPro })} />
          {reschedule && (() => { const rp = patientById(reschedule.a.pt) || { name: reschedule.a._patientName || 'Paciente' }; return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: WT.accentSoft, borderBottom: `1px solid ${WT.borderAccent}`, flex: 'none' }}>
              <WIcon name="calendar-clock" size={17} color={WT.accent} style={{ flex: 'none' }} />
              <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: WT.fg }}>
                <strong style={{ fontWeight: WT.wHead, color: WT.accent }}>Remarcando {rp.name}</strong>
                <span style={{ color: WT.fg2 }}> — escolha o novo horário livre. Você pode trocar de agenda, data e visualização.</span>
              </div>
              <WButton variant="default" size="s" leadingIcon="x" label="Cancelar remarcação" onClick={cancelReschedule} />
            </div>
          ); })()}
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
            </>}
        </main>
        {/* painel em altura total — terceira faixa vertical, irmã do sidebar (não fica sob o toolbar) */}
        {!compact && app.page !== 'agenda-config' && bookingHost}
      </div>

      {/* overlays */}
      {ctxCard && <ContextCard a={appts.find(x => x.id === ctxCard.a.id) || ctxCard.a} anchorRect={ctxCard.rect || { left: width / 2, right: width / 2, top: 120, bottom: 120 }} onClose={() => setCtxCard(null)}
        onReschedule={doReschedule} onCancel={doCancel} onOpen={openEdit} onRetorno={doRetorno} />}
      {quick && <QuickCreatePopover ctx={quick.ctx} anchorRect={quick.rect} onClose={() => { setQuick(null); setDraft(null); }} onMore={ctx => openBooking(ctx)} onSave={onQuickSave} onDraft={onDraft} />}
      {compact && bookingHost}
      {cancel && <CancelModal a={cancel.a} onClose={() => setCancel(null)} onConfirm={confirmCancel} />}
      {blockPick && <BlockChooser blocks={blockPick} onClose={() => setBlockPick(null)} onPick={b => { setBlockPick(null); openBlockEdit(b); }} />}
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
      {ruleBlock && <CenterModal title={ruleBlock.title} icon="lock" iconTone="danger" width={430} onClose={() => setRuleBlock(null)}
        footer={<><span style={{ flex: 1 }} /><WButton variant="primary" label="Entendi" onClick={() => setRuleBlock(null)} /></>}>
        <div style={{ fontSize: 14, color: WT.fg2, lineHeight: 1.55 }}>{ruleBlock.text}</div>
      </CenterModal>}
      <WToast toast={toast} />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Versão" />
        <TweakRadio label="Edição do produto" value={tw.edition}
          options={[{ value: 'final', label: 'Final' }, { value: 'mvp', label: 'MVP' }]}
          onChange={v => setTweak('edition', v)} />
        <TweakSection label="Demonstração" />
        <TweakRadio label="Idioma / Language" value={tw.lang}
          options={[{ value: 'pt', label: 'PT' }, { value: 'en', label: 'EN' }, { value: 'es', label: 'ES' }, { value: 'it', label: 'IT' }]}
          onChange={v => setTweak('lang', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
