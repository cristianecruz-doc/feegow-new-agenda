/* ============================================================================
   Feegow — New Agenda · FullCalendar grid  (Watson edition, /watson)
   Same engine and config as production (DocPlanner/docplanner
   verticals/booking/extensions/pms/core/embed/modules/booking-calendar):
     · FullCalendar 6.1 + resource-timegrid + scrollgrid (premium) + interaction
     · Dia / Equipamentos / Salas → resourceTimeGridDay (1 column per resource)
     · Semana                    → timeGridWeek (1 column per date, agendas side by side)
     · slotDuration 30 min, hourly labels HH:mm, snapDuration 5 min
     · 60 px per 30-min row at 100% zoom (= 2 px/min), zoom 50–150 %
     · slotEventOverlap false (side by side), no eventMaxStack ("+N")
     · eventStartEditable on, eventDurationEditable off (no resize)
     · eventOverlap / selectOverlap refuse only blocks
     · blocks, breaks, working-hours bands = background events
     · nowIndicator on, allDaySlot off
   The prototype's own functions (hover ghost, fit-in gutter, free-slot mode,
   grade bands, trim/expand early hours) are rebuilt on top of FC hooks.
   ============================================================================ */

const FC_LICENSE = 'CC-Attribution-NonCommercial-NoDerivatives'; // same key production uses today
const FC_GUTTER = 16; // 1rem right gutter beside cards (production useSlotHoverPlaceholder)

const isoDate = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const minOf = d => d.getHours() * 60 + d.getMinutes();
const fcTime = m => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}:00`;
const fcDT = (iso, m) => `${iso}T${fcTime(m)}`;

// ---- React-in-FullCalendar node cache --------------------------------------
// FC asks for content on every render; we hand back the same DOM node so the
// React tree inside keeps its state (hover, open status menu).
function useNodeCache() {
  const ref = React.useRef(new Map());
  const get = key => {
    let n = ref.current.get(key);
    if (!n) { const el = document.createElement('div'); el.className = 'na-fc-node'; n = { el, root: ReactDOM.createRoot(el) }; ref.current.set(key, n); }
    return n;
  };
  const prune = keep => {
    ref.current.forEach((n, k) => { if (!keep.has(k)) { ref.current.delete(k); setTimeout(() => n.root.unmount(), 0); } });
  };
  React.useEffect(() => () => { ref.current.forEach(n => setTimeout(() => n.root.unmount(), 0)); ref.current.clear(); }, []);
  return { get, prune };
}

// ---- per-column rules (same logic as the prototype's ColumnTrack) -----------
function columnRules(c, slotMin) {
  const gradeBlocks = c.grades || [];
  const gf = window.__gradeFilter;
  const gradeAllowed = g => !gf || ((!gf.conv.length || gf.conv.some(cv => gradeAccepts(g, { conv: cv }))) && (!gf.proc.length || gf.proc.some(id => gradeAccepts(g, { procId: id }))));
  const activeGrades = gradeBlocks.filter(gradeAllowed);
  const coverRanges = c.coverage != null ? c.coverage : activeGrades.map(g => [toMin(g.start), toMin(g.end)]);
  const hasCoverage = coverRanges.length > 0;
  const intervals = gradeBlocks.flatMap(g => (g.intervals || []).map(iv => ({ ...iv, color: g.color })));
  const blocks = c.blocks || [];
  const rxCond = window.__rxCond;
  const gradeAcceptsRx = g => !rxCond || (((!rxCond.conv || rxCond.conv === 'Particular') || !g.convenios || g.convenios.includes(rxCond.conv)) && (rxCond.procIds || []).every(pid => !g.procs || g.procs.includes(pid)));
  const inGrade = m => !hasCoverage || coverRanges.some(([s, e]) => m >= s && m < e);
  const inInterval = m => intervals.some(iv => m >= toMin(iv.start) && m < toMin(iv.end));
  const inBlock = m => blocks.some(b => m >= toMin(b.start) && m < toMin(b.end));
  const rangeBlocked = (start, dur) => { for (let m = start; m < start + dur; m += 5) { if (inInterval(m) || inBlock(m)) return true; } return false; };
  const occupied = m => (c.appts || []).some(a => { const s = toMin(a.start), e = s + a.dur; return m >= s && m < e; }) || inBlock(m) || inInterval(m);
  const slotDefaultAt = m => { const g = gradeBlocks.find(g => m >= toMin(g.start) && m < toMin(g.end)); return (g && g.slotMin) || slotMin; };
  const rxOkAt = m => { if (!rxCond) return true; const g = gradeBlocks.find(g => m >= toMin(g.start) && m < toMin(g.end)); return !!g && gradeAcceptsRx(g); };
  const conflictAt = a => { const s = toMin(a.start), e = s + a.dur; return blocks.some(b => { const bs = toMin(b.start), be = toMin(b.end); return s < be && e > bs; }); };
  const canHover = m => inGrade(m) && !inInterval(m) && !inBlock(m) && rxOkAt(m);
  return { gradeBlocks, activeGrades, coverRanges, hasCoverage, intervals, blocks, rxCond, gradeAcceptsRx, rangeBlocked, occupied, slotDefaultAt, canHover, conflictAt };
}

// ---- the grid ---------------------------------------------------------------
function FCGrid({ mode = 'resource', columns, startMin, endMin, slotMin, pxPerMin, zoom = 1, cardStyle, freeOnly, dateForToday, showPro,
  onSlotClick, onCardOpen, onBlockOpen, onBlockPick, draft, drag, colMinWidth = 200, headerRender }) {
  const host = React.useRef(null);
  const wrap = React.useRef(null);
  const cal = React.useRef(null);
  const nodes = useNodeCache();
  const live = React.useRef({});          // latest props for FC callbacks (FC keeps the first closure)
  const dragging = React.useRef(false);
  const dropped = React.useRef(false);
  const hoverRef = React.useRef(null);
  const [ghost, setGhost] = React.useState(null);
  const [expanded, setExpanded] = React.useState(false);

  // trim empty early hours (prototype function) → FC slotMinTime
  const firstContent = React.useMemo(() => {
    let m = null; const c1 = v => { if (v != null && (m == null || v < m)) m = v; };
    columns.forEach(c => { (c.appts || []).forEach(a => { if (a.status !== 'cancelado' && a.start) c1(toMin(a.start)); }); (c.grades || []).forEach(g => c1(toMin(g.start))); (c.blocks || []).forEach(b => c1(toMin(b.start))); });
    return m;
  }, [columns]);
  const trimFull = firstContent == null ? startMin : Math.max(startMin, Math.min(Math.floor(firstContent / 60) * 60, endMin - 120));
  const trimStart = expanded ? startMin : trimFull;
  const scrollKey = columns.map(c => c.id + (c.date || '')).join('|');
  React.useEffect(() => { setExpanded(false); }, [scrollKey]);
  // back to the first visible hour when the set of columns changes (prototype: scrollTop = 0)
  React.useEffect(() => { const c = cal.current; if (c) setTimeout(() => c.scrollToTime(fcTime(live.current.trimStart)), 0); }, [scrollKey, trimStart]);

  const rowPx = Math.max(15, Math.round(30 * pxPerMin));      // px per 30-min slot
  const pxm = rowPx / 30;                                      // effective px per minute
  const colW = Math.round(colMinWidth * Math.max(0.7, Math.min(1.2, zoom)));
  const rules = React.useMemo(() => { const r = {}; columns.forEach(c => { r[c.id] = columnRules(c, slotMin); }); return r; }, [columns, slotMin]);
  const byKey = React.useMemo(() => { const r = {}; columns.forEach(c => { r[mode === 'week' ? 'd' + c.date : c.id] = c; }); return r; }, [columns, mode]);

  live.current = { columns, rules, byKey, onSlotClick, onCardOpen, onBlockOpen, onBlockPick, drag, mode, trimStart, endMin, pxm, slotMin, freeOnly, showPro, cardStyle };

  const colKeyOf = (resource, date) => (mode === 'week' ? 'd' + isoDate(date) : (resource ? resource.id : null));
  const permOk = occ => window.__rxCond || (occ ? permOf('fitin') : (permOf('book') || permOf('fitin')));

  // ---------- events ----------
  const buildEvents = () => {
    const L = live.current; const out = [];
    L.columns.forEach(c => {
      const R = L.rules[c.id]; const date = c.date;
      const base = mode === 'week' ? {} : { resourceId: c.id };
      const ev = (id, s, e, ext, extra = {}) => out.push({ id, start: fcDT(date, s), end: fcDT(date, Math.min(e, 24 * 60 - 1)), ...base, extendedProps: { col: c.id, ...ext }, ...extra });
      // working-hours bands (grade) — background, transparent with left bar + label tab
      R.activeGrades.forEach((g, i) => ev(`g:${c.id}:${i}`, toMin(g.start), toMin(g.end), { kind: 'grade', g }, { display: 'background', classNames: ['na-bg-grade'] }));
      // breaks (intervalos da grade) hidden under blocks
      R.intervals.forEach((iv, i) => subtractRanges([toMin(iv.start), toMin(iv.end)], R.blocks.map(b => [toMin(b.start), toMin(b.end)])).forEach(([s, e], j) =>
        ev(`iv:${c.id}:${i}:${j}`, s, e, { kind: 'interval', iv, s, e }, { display: 'background', classNames: ['na-bg-interval'] })));
      // blocks (overlapping ones merge → chooser)
      groupOverlapBlocks(R.blocks).forEach((gr, gi) => ev(`b:${c.id}:${gi}`, gr.s, gr.e, { kind: gr.blocks.length === 1 ? 'block' : 'blockGroup', group: gr }, { display: 'background', classNames: ['na-bg-block'] }));
      // free-slot mode
      const bookable = c.bookable !== false;
      if (L.freeOnly && bookable) {
        const gaps = R.gradeBlocks.length
          ? R.activeGrades.filter(R.gradeAcceptsRx).flatMap(g => freeGaps(c.appts, R.blocks.concat(R.intervals), toMin(g.start), toMin(g.end)))
          : (R.rxCond ? [] : (R.hasCoverage ? R.coverRanges.flatMap(([cs, ce]) => freeGaps(c.appts, R.blocks.concat(R.intervals), cs, ce)) : freeGaps(c.appts, R.blocks.concat(R.intervals), L.trimStart, L.endMin)));
        gaps.forEach(([s, e], i) => ev(`f:${c.id}:${i}`, s, e, { kind: 'free', s, e }, { display: 'background', classNames: ['na-bg-free'] }));
      }
      if (L.freeOnly && !bookable) ev(`x:${c.id}`, L.trimStart, L.endMin, { kind: 'offFilter' }, { display: 'background', classNames: ['na-bg-off'] });
      // appointments (foreground, side by side)
      (c.appts || []).forEach(a => {
        const s = toMin(a.start);
        const locked = a.status === 'cancelado' || (window.ruleNoDrag && ruleNoDrag(a));
        ev(`a:${a.id}`, s, s + (a.dur || 30), { kind: 'appt', a, conflict: R.conflictAt(a), showPro: c.showPro != null ? c.showPro : L.showPro, bookable }, { startEditable: !locked, durationEditable: false, classNames: ['na-ev-appt'] });
      });
    });
    // draft placeholder (production renders it as an event too)
    if (draft) {
      const c = live.current.columns.find(x => x.id === draft.colId);
      if (c) { const s = toMin(draft.time); out.push({ id: '__draft', start: fcDT(c.date, s), end: fcDT(c.date, s + (draft.dur || slotMin)), ...(mode === 'week' ? {} : { resourceId: c.id }), editable: false, extendedProps: { kind: 'draft', col: c.id, draft }, classNames: ['na-ev-draft'] }); }
    }
    return out;
  };

  // business hours: per resource (Day) or per weekday (Week) — gray outside the grade
  const resourcesOf = () => live.current.columns.map((c, i) => {
    const R = live.current.rules[c.id];
    const r = { id: c.id, title: (c.entity && (c.entity.short || c.entity.name || c.entity.label)) || c.id, order: i };
    if (R.hasCoverage) r.businessHours = R.coverRanges.map(([s, e]) => ({ daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: fcTime(s), endTime: fcTime(e) }));
    return r;
  });
  const weekBusinessHours = () => {
    const out = []; let any = false;
    live.current.columns.forEach(c => {
      const R = live.current.rules[c.id]; const dow = parseISO(c.date).getDay();
      if (R.hasCoverage) { any = true; R.coverRanges.forEach(([s, e]) => out.push({ daysOfWeek: [dow], startTime: fcTime(s), endTime: fcTime(e) })); }
      else out.push({ daysOfWeek: [dow], startTime: fcTime(0), endTime: fcTime(24 * 60 - 1) });
    });
    return any ? out : false;
  };

  // ---------- content renderers ----------
  const renderEvent = arg => {
    const p = arg.event.extendedProps; const L = live.current;
    const key = (arg.isMirror ? 'm:' : '') + arg.event.id;
    const n = arg.isMirror ? { el: document.createElement('div') } : nodes.get(key);
    const mins = (arg.event.end - arg.event.start) / 60000;
    const h = mins * L.pxm;
    let ui = null;
    if (p.kind === 'appt') {
      ui = <AppointmentCard fill ev={{ a: p.a }} height={h - 2} widthPct={100} cardStyle={L.cardStyle} showPro={p.showPro} conflict={p.conflict}
        dimmed={L.freeOnly && p.bookable} dragging={arg.isMirror} onOpen={(a, rect) => L.onCardOpen(a, rect)} />;
    } else if (p.kind === 'grade') {
      ui = <GradeBand g={p.g} />;
    } else if (p.kind === 'interval') {
      ui = <IntervalCard fill height={h - 2} label={p.iv.label} start={fmtMin(p.s)} end={fmtMin(p.e)} />;
    } else if (p.kind === 'block') {
      ui = <BlockCard fill block={p.group.blocks[0]} height={h - 2} onOpen={b => L.onBlockOpen && L.onBlockOpen(b)} />;
    } else if (p.kind === 'blockGroup') {
      ui = <BlockGroupCard fill group={p.group} height={h - 2} onOpen={() => (L.onBlockPick ? L.onBlockPick(p.group.blocks) : L.onBlockOpen(p.group.blocks[0]))} />;
    } else if (p.kind === 'free') {
      ui = <FreeSlot fill height={h - 3} s={p.s} e={p.e} onClick={rect => L.onSlotClick(p.col, p.s, rect)} />;
    } else if (p.kind === 'offFilter') {
      ui = <div className="na-bg-click-none" style={{ height: '100%', background: 'repeating-linear-gradient(135deg,#ffffff00,#ffffff00 10px,#e8eaea99 10px,#e8eaea99 20px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 24 }}>
        <span style={{ position: 'sticky', top: 8, fontSize: 12, fontWeight: WT.wEmph, color: WT.muted, background: '#ffffff', border: `1px solid ${WT.border}`, borderRadius: WT.pill, padding: '4px 8px' }}>Fora do filtro</span></div>;
    } else if (p.kind === 'draft') {
      const d = p.draft; const dm = toMin(d.time); const tall = h > 34;
      ui = <div style={{ height: '100%', borderRadius: WT.rM, background: WT.accentSoft, border: `1px dashed ${WT.borderAccent}`, boxShadow: WT.shPopout, display: 'flex', flexDirection: tall ? 'column' : 'row', alignItems: tall ? 'flex-start' : 'center', gap: tall ? 0 : 8, padding: tall ? '4px 8px' : '0 8px', overflow: 'hidden', fontFamily: WT.font }}>
        <span style={{ fontSize: 12, fontWeight: WT.wHead, color: WT.accent, whiteSpace: 'nowrap' }}>Novo agendamento</span>
        <span style={{ fontSize: 12, color: WT.accent, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{d.time}–{fmtMin(dm + (d.dur || slotMin))} · {d.dur || slotMin} min</span></div>;
    }
    if (arg.isMirror) { ReactDOM.createRoot(n.el).render(ui); return { domNodes: [n.el] }; }
    n.root.render(ui);
    return { domNodes: [n.el] };
  };

  const renderResourceHeader = arg => {
    const c = live.current.columns.find(x => x.id === arg.resource.id); if (!c) return null;
    const n = nodes.get('hdr:' + c.id);
    n.root.render(<div style={{ opacity: (live.current.freeOnly && c.bookable === false) ? 0.55 : 1, textAlign: 'left' }}>
      {headerRender ? headerRender(c) : <ColHeader entity={c.entity} sub={c.sub} subParts={c.subParts} occupancy={c.occupancy} date={c.date} />}</div>);
    return { domNodes: [n.el] };
  };
  const renderDayHeader = arg => {
    const iso = isoDate(arg.date); const c = live.current.byKey['d' + iso]; if (!c) return null;
    const n = nodes.get('dh:' + iso);
    n.root.render(<div style={{ opacity: (live.current.freeOnly && c.bookable === false) ? 0.55 : 1 }}>{headerRender ? headerRender(c) : c.entity.label}</div>);
    return { domNodes: [n.el] };
  };

  // ---------- create / destroy ----------
  React.useEffect(() => {
    const L = live.current;
    const first = columns[0] ? columns[0].date : TODAY;
    const opts = {
      schedulerLicenseKey: FC_LICENSE,
      locale: 'pt-br',
      initialView: mode === 'week' ? 'timeGridWeek' : 'resourceTimeGridDay',
      initialDate: first,
      headerToolbar: false,
      slotMinTime: fcTime(L.trimStart),
      slotMaxTime: fcTime(Math.min(L.endMin, 24 * 60)),
      scrollTime: fcTime(L.trimStart),
      scrollTimeReset: false,
      height: '100%',
      allDaySlot: false,
      nowIndicator: true,
      slotDuration: '00:30:00',
      slotLabelInterval: '01:00',
      slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
      snapDuration: '00:05:00',
      slotEventOverlap: false,
      eventMinHeight: 15,
      expandRows: false,
      resourceOrder: 'order',
      stickyHeaderDates: true,
      dayMinWidth: colW,
      firstDay: mode === 'week' ? parseISO(first).getDay() : 1,
      dayHeaderFormat: { weekday: 'short', day: 'numeric' },
      editable: true,
      eventStartEditable: true,
      eventDurationEditable: false,
      eventResizableFromStart: false,
      selectable: true,
      selectMirror: false,
      unselectAuto: true,
      eventOverlap: (still) => !(still.extendedProps.kind === 'block' || still.extendedProps.kind === 'blockGroup'),
      selectOverlap: (ev) => !(ev.extendedProps.kind === 'block' || ev.extendedProps.kind === 'blockGroup' || ev.extendedProps.kind === 'interval'),
      eventContent: renderEvent,
      resourceLabelContent: renderResourceHeader,
      dayHeaderContent: mode === 'week' ? renderDayHeader : undefined,
      slotLabelContent: arg => ({ html: `<span class="na-slot-label">${pad2(arg.date.getHours())}:${pad2(arg.date.getMinutes())}</span>` }),
      // drop rules (same as prototype: refuse over breaks / blocks)
      eventAllow: (span, ev) => {
        const p = ev.extendedProps; if (p.kind !== 'appt') return false;
        const L2 = live.current; const key = colKeyOf(span.resource, span.start); const c = L2.byKey[key]; if (!c) return false;
        const R = L2.rules[c.id]; return !R.rangeBlocked(minOf(span.start), p.a.dur || L2.slotMin);
      },
      eventDragStart: info => {
        const p = info.event.extendedProps; if (p.kind !== 'appt') return;
        dragging.current = true; dropped.current = false; setGhost(null);
        live.current.drag.start(p.a);
      },
      eventDragStop: () => {
        setTimeout(() => { dragging.current = false; if (!dropped.current) live.current.drag.end(); }, 0);
      },
      eventDrop: info => {
        dropped.current = true;
        const p = info.event.extendedProps; const L2 = live.current;
        const key = colKeyOf(info.newResource || (mode === 'week' ? null : { id: p.col }), info.event.start);
        const c = L2.byKey[key]; const min = minOf(info.event.start);
        info.revert();                       // React state is the source of truth
        if (c) L2.drag.onDrop(c.id, min); else L2.drag.end();
      },
      selectAllow: span => {
        const L2 = live.current; const key = colKeyOf(span.resource, span.start); const c = L2.byKey[key]; if (!c) return false;
        const R = L2.rules[c.id]; const s = minOf(span.start), e = minOf(span.end) || 24 * 60;
        for (let m = s; m < e; m += 5) { if (!R.canHover(m)) return false; }
        return !!permOk(R.occupied(s));
      },
      select: info => {
        const L2 = live.current; const key = colKeyOf(info.resource, info.start); const c = L2.byKey[key];
        cal.current && cal.current.unselect();
        if (!c) return;
        const hv = hoverRef.current;
        const min = hv && hv.colId === c.id ? hv.min : minOf(info.start);
        const je = info.jsEvent || {}; const x = je.clientX || 0, y = je.clientY || 0;
        setGhost(null);
        L2.onSlotClick(c.id, min, { left: x, top: y, right: x, bottom: y });
      },
    };
    const calendar = new FullCalendar.Calendar(host.current, opts);
    cal.current = calendar;
    calendar.render();
    return () => { calendar.destroy(); cal.current = null; };
  }, [mode]);

  // ---------- push data on every render (never mid-drag) ----------
  React.useEffect(() => {
    const calendar = cal.current; if (!calendar || dragging.current) return;
    const first = columns[0] ? columns[0].date : TODAY;
    const keep = new Set();
    calendar.batchRendering(() => {
      calendar.setOption('slotMinTime', fcTime(trimStart));
      calendar.setOption('slotMaxTime', fcTime(Math.min(endMin, 24 * 60)));
      calendar.setOption('dayMinWidth', colW);
      if (mode === 'week') {
        const shown = new Set(columns.map(c => parseISO(c.date).getDay()));
        calendar.setOption('firstDay', parseISO(first).getDay());
        calendar.setOption('hiddenDays', [0, 1, 2, 3, 4, 5, 6].filter(d => !shown.has(d)));
        calendar.setOption('businessHours', weekBusinessHours());
      } else {
        calendar.setOption('businessHours', false);
        calendar.getResources().forEach(r => r.remove());
        resourcesOf().forEach(r => calendar.addResource(r));
      }
      calendar.gotoDate(first);
      if (mode === 'week') calendar.setOption('dayHeaderContent', arg => renderDayHeader(arg));
      calendar.removeAllEventSources();
      const evs = buildEvents();
      evs.forEach(e => keep.add(e.id));
      calendar.addEventSource(evs);
    });
    columns.forEach(c => { keep.add('hdr:' + c.id); keep.add('dh:' + c.date); });
    nodes.prune(keep);
  });

  // row height (production forces it with CSS; zoom 50–150 %)
  React.useEffect(() => { if (wrap.current) wrap.current.style.setProperty('--na-row', rowPx + 'px'); }, [rowPx]);
  React.useEffect(() => { const c = cal.current; if (c) setTimeout(() => c.updateSize(), 0); }, [rowPx, colW]);

  // ---------- hover ghost ("+ Novo") + fit-in gutter ----------
  const onMove = e => {
    if (dragging.current) return;
    const L = live.current;
    if (e.target.closest('.na-ev-appt, .na-bg-block, .na-bg-free, .na-ev-draft, .na-bg-off')) { hoverRef.current = null; setGhost(null); return; }
    const colEl = e.target.closest('.fc-timegrid-col'); const frame = colEl && colEl.querySelector('.fc-timegrid-col-frame');
    if (!frame || !colEl.dataset.date) { hoverRef.current = null; setGhost(null); return; }
    const key = mode === 'week' ? 'd' + colEl.dataset.date : colEl.dataset.resourceId;
    const c = L.byKey[key]; if (!c) { setGhost(null); return; }
    const R = L.rules[c.id]; const fr = frame.getBoundingClientRect(); const wr = wrap.current.getBoundingClientRect();
    let m = L.trimStart + Math.round(((e.clientY - fr.top) / L.pxm) / 5) * 5;
    m = Math.max(L.trimStart, Math.min(L.endMin - 5, m));
    const occ = R.occupied(m);
    if (!R.canHover(m) || !permOk(occ)) { hoverRef.current = null; setGhost(null); return; }
    const dur = R.slotDefaultAt(m);
    hoverRef.current = { colId: c.id, min: m };
    const top = fr.top - wr.top + (m - L.trimStart) * L.pxm;
    setGhost(occ
      ? { parallel: true, top, left: fr.right - wr.left - FC_GUTTER, width: FC_GUTTER - 2, height: dur * L.pxm - 2 }
      : { parallel: false, top, left: fr.left - wr.left + 2, width: fr.width - FC_GUTTER - 4, height: dur * L.pxm - 2, label: `${fmtMin(m)}–${fmtMin(m + dur)} · ${dur} min` });
  };
  const onLeave = () => { hoverRef.current = null; setGhost(null); };

  return (
    <div ref={wrap} className="na-fc" onMouseMove={onMove} onMouseLeave={onLeave}
      onWheel={() => ghost && setGhost(null)}
      style={{ position: 'relative', height: '100%', background: WT.raised }}>
      <div ref={host} style={{ height: '100%' }} />
      {/* trim / expand early hours (prototype function) — sits on the empty axis header cell */}
      {(expanded || firstContent != null) && trimFull > startMin && (
        <button onClick={() => setExpanded(v => !v)} title={expanded ? `Ocultar horários vazios (${fmtMin(startMin)}–${fmtMin(trimFull)})` : `Mostrar horários anteriores (${fmtMin(startMin)}–${fmtMin(trimFull)})`}
          style={{ position: 'absolute', left: 4, top: 8, zIndex: WT.zSticky + 1, display: 'inline-flex', alignItems: 'center', gap: 4, height: 24, padding: '0 4px', borderRadius: WT.pill, border: `1px solid ${WT.border}`, background: '#ffffff', color: WT.fg2, fontFamily: WT.font, fontSize: 12, cursor: 'pointer', fontVariantNumeric: 'tabular-nums' }}
          onMouseEnter={e => e.currentTarget.style.background = WT.inset} onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}>
          <WIcon name={expanded ? 'chevron-down' : 'chevron-up'} size={12} color={WT.fg2} />{expanded ? fmtMin(trimFull) : fmtMin(startMin)}
        </button>
      )}
      {ghost && (ghost.parallel
        ? <div title="Criar agendamento no mesmo horário (paralelo)" style={{ position: 'absolute', top: ghost.top, left: ghost.left, width: ghost.width, height: ghost.height, borderRadius: WT.rS, background: WT.accentSoft, border: `1px dashed ${WT.borderAccent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 5 }}>
            <WIcon name="plus" size={12} color={WT.accent} /></div>
        : <div style={{ position: 'absolute', top: ghost.top, left: ghost.left, width: ghost.width, height: ghost.height, borderRadius: WT.rM, background: WT.accentSoft, border: `1px dashed ${WT.borderAccent}`, display: 'flex', flexDirection: ghost.height >= 34 ? 'column' : 'row', alignItems: ghost.height >= 34 ? 'flex-start' : 'center', gap: ghost.height >= 34 ? 0 : 8, padding: ghost.height >= 34 ? '4px 8px' : '0 8px', overflow: 'hidden', pointerEvents: 'none', zIndex: 5, fontFamily: WT.font }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: WT.wHead, color: WT.accent, whiteSpace: 'nowrap' }}><WIcon name="plus" size={12} color={WT.accent} />Novo</span>
            <span style={{ fontSize: 12, color: WT.accent, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{ghost.label}</span>
          </div>)}
    </div>
  );
}

// working-hours band: transparent fill, 3px left bar + 2px top line in the grade colour,
// label tab above the start line (production: "working-hours band", display:'background')
function GradeBand({ g }) {
  const ref = React.useRef(null);
  const [wide, setWide] = React.useState(false);
  React.useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const check = () => setWide(el.clientWidth >= 260);
    check(); let ro; if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(check); ro.observe(el); }
    return () => ro && ro.disconnect();
  }, []);
  const name = g.label ? `${g.label}${g.room ? ' · ' + roomShort(g.room) : ''}` : (g.room ? `${g.room} · Unidade Centro` : 'Unidade Centro');
  const showTab = g.label || g.room || g.doctoralia;
  return (
    <div ref={ref} title={`${g.label || 'Disponível'} · ${g.start}–${g.end}${g.room ? ' · ' + g.room : ''} · intervalo ${g.slotMin} min`}
      style={{ position: 'absolute', inset: 0, borderLeft: `3px solid ${g.color}`, borderTop: `2px solid ${g.color}` }}>
      {showTab && (
        <div style={{ position: 'absolute', top: -26, left: -3, right: 0, height: 24, display: 'flex', alignItems: 'flex-end', gap: 4, pointerEvents: 'none' }}>
          <span title={`Grade: ${name} · ${g.start}–${g.end}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, maxWidth: g.doctoralia ? '72%' : '100%', height: 24, padding: '0 8px', background: g.color, borderRadius: `${WT.rS} ${WT.rS} 0 0`, pointerEvents: 'auto' }}>
            <WIcon name="calendar-check" size={12} color="#ffffff" style={{ flex: 'none' }} />
            <span style={{ fontSize: 12, fontWeight: WT.wHead, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
          </span>
          <span style={{ flex: 1 }} />
          {g.doctoralia && (
            <span title="Disponível em Doctoralia" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flex: 'none', height: 24, cursor: 'help', pointerEvents: 'auto', paddingRight: 4 }}>
              {wide && <span style={{ fontSize: 12, fontWeight: WT.wHead, color: WT.accent, whiteSpace: 'nowrap' }}>Disponível em Doctoralia</span>}
              <img src={(window.__resources && window.__resources.doctoIcon) || 'assets/icon-doctoralia.png'} alt="" style={{ width: 16, height: 16, display: 'block' }} />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { FCGrid, GradeBand, FC_LICENSE });
