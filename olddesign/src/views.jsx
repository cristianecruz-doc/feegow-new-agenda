/* ============================================================================
   Feegow — New Agenda · Views
   ColumnGrid (shared timeline) → Day · Week(pros|days) · Multiple · Equipment
   + Month grid + Waiting-list panel + occupancy helpers
   ============================================================================ */

const NOW_MIN = (() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); })(); // "agora" real

// merged free gaps within working hours (for the "somente livres" highlight)
function freeGaps(appts, blocks, startMin, endMin) {
  const occ = [
    ...appts.filter(a => a.status !== 'cancelado').map(a => [toMin(a.start), toMin(a.start) + a.dur]),
    ...(blocks || []).map(b => [toMin(b.start), toMin(b.end)]),
  ].sort((x, y) => x[0] - y[0]);
  const merged = [];
  occ.forEach(iv => { const last = merged[merged.length - 1]; if (last && iv[0] <= last[1]) last[1] = Math.max(last[1], iv[1]); else merged.push([iv[0], iv[1]]); });
  const gaps = []; let cur = startMin;
  merged.forEach(([s, e]) => { if (s > cur) gaps.push([cur, Math.min(s, endMin)]); cur = Math.max(cur, e); });
  if (cur < endMin) gaps.push([cur, endMin]);
  return gaps.filter(g => g[1] - g[0] >= 15);
}

// free gaps restricted to the doctor's availability grade blocks
function freeWithinGrades(appts, blocks, grades, startMin, endMin) {
  if (!grades || !grades.length) return freeGaps(appts, blocks, startMin, endMin);
  let out = [];
  grades.forEach(g => { out = out.concat(freeGaps(appts, blocks, toMin(g.start), toMin(g.end))); });
  return out;
}
// remove covered sub-ranges from [s,e]; returns the visible remainder segments
function subtractRanges(range, covers) {
  let segs = [range];
  covers.forEach(([cs, ce]) => {
    segs = segs.flatMap(([s, e]) => {
      if (ce <= s || cs >= e) return [[s, e]];           // no overlap
      const out = [];
      if (cs > s) out.push([s, Math.min(cs, e)]);         // left remainder
      if (ce < e) out.push([Math.max(ce, s), e]);         // right remainder
      return out;
    });
  });
  return segs.filter(([s, e]) => e - s >= 5);             // drop slivers
}
// intervals NOT covered by any grade block, within [startMin,endMin]
function coverageGaps(grades, startMin, endMin) {
  return rangeGaps(grades.map(g => [toMin(g.start), toMin(g.end)]), startMin, endMin);
}
// gaps not covered by any [s,e] numeric range
function rangeGaps(ranges, startMin, endMin) {
  const cov = ranges.slice().sort((a, b) => a[0] - b[0]);
  const gaps = []; let cur = startMin;
  cov.forEach(([s, e]) => { if (s > cur) gaps.push([cur, s]); cur = Math.max(cur, e); });
  if (cur < endMin) gaps.push([cur, endMin]);
  return gaps;
}

// filter appts by global filters (conv / spec / unidade / sala) + drop deleted
function filterAppts(appts, filters) {
  const specs = filters.spec || [], units = filters.unit || [], rooms = filters.room || [];
  return appts.filter(a => {
    if (a.deleted) return false;
    // convênio filtra AGENDAS (colunas dos médicos que atendem), não agendamentos —
    // mostra todos os agendamentos existentes nas agendas dos médicos elegíveis
    if (specs.length) { const pro = PROS.find(p => p.id === a.pro); if (!pro || !specs.some(s => proHasSpec(pro, s))) return false; }
    if (units.length) { const pro = PROS.find(p => p.id === a.pro); if (!pro || !units.includes(pro.unit)) return false; }
    if (rooms.length) { const pro = PROS.find(p => p.id === a.pro); if (!pro || !rooms.includes(pro.room)) return false; }
    return true;
  });
}
function visiblePros(filters) {
  let pros = PROS;
  const specs = filters.spec || [], units = filters.unit || [], rooms = filters.room || [];
  if (specs.length) pros = pros.filter(p => specs.some(s => proHasSpec(p, s)));
  if (units.length) pros = pros.filter(p => units.includes(p.unit));
  if (rooms.length) pros = pros.filter(p => rooms.includes(p.room));
  if (filters.pros && filters.pros.length) pros = pros.filter(p => filters.pros.includes(p.id));
  return pros;
}
function occupancyOf(appts, startMin, endMin, blocks) {
  const blocked = (blocks || []).reduce((s, b) => s + (toMin(b.end) - toMin(b.start)), 0);
  const avail = (endMin - startMin) - blocked;
  const booked = appts.filter(a => a.status !== 'cancelado').reduce((s, a) => s + a.dur, 0);
  return avail > 0 ? Math.min(100, Math.round((booked / avail) * 100)) : 0;
}

// ---- Column header ----------------------------------------------------------
function ColHeader({ entity, sub, occupancy, onPick }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', minWidth: 0 }}>
      {entity.initials && <WAvatar initials={entity.initials} size={30} bg={entity.color || WT.accent} color="#fff" ring="transparent" />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: WT.wEmph, color: WT.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entity.short || entity.name || entity.label}</span>
          {entity.doctoralia && <img src={(window.__resources && window.__resources.doctoIcon) || "assets/icon-doctoralia.png"} alt="" title="Profissional integrado à Doctoralia" style={{ width: 14, height: 14, flex: 'none' }} />}
        </div>
        {sub && <div style={{ fontSize: 11, color: WT.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
      </div>
      {occupancy != null && (
        <WBadge type={occupancy >= 80 ? 'danger' : occupancy >= 50 ? 'warning' : 'success'} style={{ flex: 'none' }}>{occupancy}%</WBadge>
      )}
    </div>
  );
}

// ---- One column's track (cards + blocks + free-slot interaction) ------------
// agrupa bloqueios sobrepostos (semanal multi-recurso) num único cluster
function groupOverlapBlocks(blocks) {
  const seen = new Set(); const uniq = [];
  (blocks || []).forEach(b => { if (!seen.has(b.id)) { seen.add(b.id); uniq.push(b); } });
  const items = uniq.map(b => ({ b, s: toMin(b.start), e: toMin(b.end) })).sort((x, y) => x.s - y.s || x.e - y.e);
  const groups = []; let cur = null;
  items.forEach(it => {
    if (cur && it.s < cur.e) { cur.blocks.push(it.b); cur.e = Math.max(cur.e, it.e); }
    else { cur = { blocks: [it.b], s: it.s, e: it.e }; groups.push(cur); }
  });
  return groups;
}
// cabeçalho da faixa de grade — mostra "Disponível em Doctoralia" quando há espaço; senão só o ícone
function GradeBandHeader({ g, HEADER_H }) {
  const ref = React.useRef(null);
  const [wide, setWide] = React.useState(false);
  React.useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const check = () => setWide(el.clientWidth >= 240);
    check();
    let ro; if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(check); ro.observe(el); }
    return () => ro && ro.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ position: 'absolute', top: -HEADER_H, left: 0, right: 0, height: HEADER_H, background: `color-mix(in srgb, ${g.color} 15%, #fff)`, border: `1px solid ${g.color}3d`, borderLeft: `3px solid ${g.color}`, borderRadius: `${WT.rS} ${WT.rS} 0 0`, display: 'flex', alignItems: 'center', gap: 5, padding: '0 6px 0 8px', zIndex: 2 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: g.color, flex: 'none' }} />
      <span style={{ fontSize: 12, fontWeight: WT.wXbold, color: g.color, letterSpacing: '.01em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.label ? `${g.label}${g.room ? ' · ' + roomShort(g.room) : ''}` : (g.room ? `${g.room} · Unidade Centro` : 'Unidade Centro')}</span>
      <span style={{ flex: 1 }} />
      {g.doctoralia && (
        <span title="Disponível em Doctoralia" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flex: 'none', cursor: 'help' }}>
          {wide && <span style={{ fontSize: 11, fontWeight: WT.wXbold, color: '#00847e', whiteSpace: 'nowrap' }}>Disponível em Doctoralia</span>}
          <img src={(window.__resources && window.__resources.doctoIcon) || "assets/icon-doctoralia.png"} alt="" style={{ width: 15, height: 15, display: 'block' }} />
        </span>
      )}
    </div>
  );
}

function ColumnTrack({ colId, appts, blocks, startMin, endMin, slotMin, pxPerMin, cardStyle, freeOnly, bookable = true, showPro, grades, coverage,
  onSlotClick, onCardOpen, onBlockOpen, onBlockPick, draft, drag, isToday }) {
  const ref = React.useRef(null);
  const [hoverMin, setHoverMin] = React.useState(null);
  const GUTTER = 24; // faixa clicável à direita p/ criar agendamento paralelo (mesmo horário), estilo Google
  const layout = laneLayout(appts);
  const gradeBlocks = grades || [];
  const HEADER_H = 24; // faixa do título da grade, ancorada ACIMA do primeiro horário (nunca sobre um slot)
  // coverage = ranges where booking is allowed. From this column's grades, or an explicit
  // merged coverage (Week multi-resource). Empty array given explicitly = book anywhere.
  const coverRanges = coverage != null ? coverage : gradeBlocks.map(g => [toMin(g.start), toMin(g.end)]);
  const hasCoverage = coverRanges.length > 0;
  const intervals = gradeBlocks.flatMap(g => (g.intervals || []).map(iv => ({ ...iv, color: g.color })));
  const inGrade = m => !hasCoverage || coverRanges.some(([s, e]) => m >= s && m < e);
  const inInterval = m => intervals.some(iv => m >= toMin(iv.start) && m < toMin(iv.end));
  const inBlock = m => (blocks || []).some(b => { const s = toMin(b.start), e = toMin(b.end); return m >= s && m < e; });
  // intervalo OU bloqueio cobrindo qualquer minuto da faixa [start, start+dur)
  const rangeBlocked = (start, dur) => { for (let m = start; m < start + dur; m += 5) { if (inInterval(m) || inBlock(m)) return true; } return false; };
  // um agendamento conflita se cai sobre um bloqueio (deve ser remarcado)
  const conflictAt = a => { const s = toMin(a.start), e = s + a.dur; return (blocks || []).some(b => { const bs = toMin(b.start), be = toMin(b.end); return s < be && e > bs; }); };
  const occupied = m => appts.some(a => { const s = toMin(a.start), e = s + a.dur; return m >= s && m < e; })
    || inBlock(m)
    || inInterval(m);
  const minFromY = clientY => {
    const r = ref.current.getBoundingClientRect();
    let m = startMin + Math.round(((clientY - r.top) / pxPerMin) / slotMin) * slotMin;
    return Math.max(startMin, Math.min(endMin - slotMin, m));
  };
  const dropMin = drag.appt && drag.colId === colId ? drag.min : null;

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, minWidth: 0, height: (endMin - startMin) * pxPerMin }}
      onMouseMove={e => { if (!drag.appt) { const m = minFromY(e.clientY); setHoverMin((!inGrade(m) || inInterval(m) || inBlock(m)) ? null : m); } }}
      onMouseLeave={() => setHoverMin(null)}
      onClick={e => { if ((e.target === ref.current || e.currentTarget === e.target) && hoverMin != null) onSlotClick(colId, hoverMin, { left: e.clientX, top: e.clientY, right: e.clientX, bottom: e.clientY }); }}
      onDragOver={e => { if (drag.appt) { e.preventDefault(); drag.setMin(colId, minFromY(e.clientY)); } }}
      onDrop={e => { if (drag.appt) { e.preventDefault(); const m = minFromY(e.clientY); if (rangeBlocked(m, drag.appt.dur || slotMin)) { drag.end(); return; } drag.onDrop(colId, m); } }}
    >
      {/* outside the doctor's availability grade = indisponível (subtle hatch) */}
      {hasCoverage && rangeGaps(coverRanges, startMin, endMin).map(([s, e], i) => (
        <div key={'ng' + i} title="Sem disponibilidade para agendamento" style={{ position: 'absolute', left: 0, right: 0, top: (s - startMin) * pxPerMin, height: (e - s) * pxPerMin, background: 'repeating-linear-gradient(135deg,#fafbfb,#fafbfb 7px,#f0f2f2 7px,#f0f2f2 14px)', zIndex: 0 }} />
      ))}
      {/* availability grade bands (doctor's color) — só barrinha lateral, sem fundo */}
      {gradeBlocks.map((g, i) => {
        const gh = (toMin(g.end) - toMin(g.start)) * pxPerMin;
        return (
          <div key={'g' + i} title={`${g.label || 'Disponível'} · ${g.start}–${g.end}${g.room ? ' · ' + g.room : ''} · intervalo ${g.slotMin} min`} style={{ position: 'absolute', left: 0, right: 0, top: (toMin(g.start) - startMin) * pxPerMin, height: gh, borderLeft: `3px solid ${g.color}`, zIndex: 0 }}>
            {(g.label || g.room || g.doctoralia) && <GradeBandHeader g={g} HEADER_H={HEADER_H} />}
          </div>
        );
      })}
      {/* intervalos da grade (mandatórios) — ocultos sob um bloqueio; reaparecem ao excluí-lo */}
      {intervals.flatMap((iv, i) => subtractRanges([toMin(iv.start), toMin(iv.end)], (blocks || []).map(b => [toMin(b.start), toMin(b.end)])).map(([s, e], j) => (
        <IntervalCard key={'iv' + i + '_' + j} top={(s - startMin) * pxPerMin} height={(e - s) * pxPerMin - 2} />
      )))}

      {/* hour gridlines */}
      {Array.from({ length: Math.ceil((endMin - startMin) / 60) + 1 }, (_, i) => (
        <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: i * 60 * pxPerMin, borderTop: `1px solid ${WT.borderSub}` }} />
      ))}
      {/* half-hour ticks */}
      {Array.from({ length: Math.ceil((endMin - startMin) / 60) }, (_, i) => (
        <div key={'h' + i} style={{ position: 'absolute', left: 0, right: 0, top: (i * 60 + 30) * pxPerMin, borderTop: `1px dashed ${WT.borderSub}`, opacity: 0.5 }} />
      ))}

      {/* blocks (overlapping multi-resource blocks merge into one group → chooser) */}
      {groupOverlapBlocks(blocks).map((g, gi) => g.blocks.length === 1
        ? <BlockCard key={g.blocks[0].id} block={g.blocks[0]} top={(g.s - startMin) * pxPerMin} height={(g.e - g.s) * pxPerMin - 2} onOpen={onBlockOpen} />
        : <BlockGroupCard key={'bg' + gi} group={g} top={(g.s - startMin) * pxPerMin} height={(g.e - g.s) * pxPerMin - 2} onOpen={() => (onBlockPick ? onBlockPick(g.blocks) : onBlockOpen(g.blocks[0]))} />
      )}

      {/* free-slot highlight — only within the doctor's grade & where the filter allows */}
      {freeOnly && bookable && freeWithinGrades(appts, (blocks || []).concat(intervals), gradeBlocks, startMin, endMin).map(([s, e], i) => (
        <FreeSlot key={'free' + i} top={(s - startMin) * pxPerMin} height={(e - s) * pxPerMin - 3} s={s} e={e}
          onClick={rect => onSlotClick(colId, s, rect)} />
      ))}

      {/* column not bookable for the current filter — muted, no clicks */}
      {freeOnly && !bookable && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 7, background: 'repeating-linear-gradient(135deg,#f1f3f300,#f1f3f300 10px,#e8eaea66 10px,#e8eaea66 20px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 24 }}>
          <span style={{ fontSize: 11, fontWeight: WT.wEmph, color: WT.muted, background: '#fff', border: `1px solid ${WT.border}`, borderRadius: WT.pill, padding: '3px 10px' }}>Fora do filtro</span>
        </div>
      )}

      {/* draft placeholder — agendamento em criação (estilo Google) */}
      {draft && draft.colId === colId && (() => {
        const dm = toMin(draft.time); const dh = (draft.dur || slotMin) * pxPerMin;
        return (
          <div style={{ position: 'absolute', left: 2, right: 2, top: (dm - startMin) * pxPerMin, height: Math.max(dh - 2, 18), zIndex: 8, borderRadius: WT.rM, background: WT.accentSoft, border: `1.5px dashed ${WT.borderAccent}`, boxShadow: '0 1px 4px #006a5926', display: 'flex', flexDirection: dh > 34 ? 'column' : 'row', alignItems: dh > 34 ? 'flex-start' : 'center', gap: dh > 34 ? 1 : 6, padding: dh > 34 ? '5px 9px' : '0 9px', overflow: 'hidden', pointerEvents: 'none' }}>
            <span style={{ fontSize: 12, fontWeight: WT.wHead, color: WT.accent, whiteSpace: 'nowrap' }}>Novo agendamento</span>
            <span style={{ fontSize: 11, color: WT.accent, opacity: 0.85, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{draft.time}–{fmtMin(dm + (draft.dur || slotMin))} · {draft.dur || slotMin} min</span>
          </div>
        );
      })()}

      {/* hover ghost / drop indicator */}
      {hoverMin != null && !drag.appt && (
        <GhostSlot top={(hoverMin - startMin) * pxPerMin} height={slotMin * pxPerMin - 2} gutter={GUTTER} parallel={occupied(hoverMin)}
          onClick={() => onSlotClick(colId, hoverMin, ref.current.getBoundingClientRect())} />
      )}
      {dropMin != null && (() => {
        const invalid = rangeBlocked(dropMin, drag.appt.dur || slotMin);
        return (
          <div style={{ position: 'absolute', left: 2, right: 2, top: (dropMin - startMin) * pxPerMin, height: (drag.appt.dur || slotMin) * pxPerMin - 2, borderRadius: WT.rM, background: invalid ? WT.dangerSoft : WT.accentSoft, border: `1.5px dashed ${invalid ? WT.borderDanger : WT.borderAccent}`, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            {invalid && <WIcon name="ban" size={12} color={WT.danger} />}
            <span style={{ fontSize: 11, fontWeight: WT.wEmph, color: invalid ? WT.danger : WT.accent }}>{invalid ? 'Indisponível' : fmtMin(dropMin)}</span>
          </div>
        );
      })()}

      {/* now indicator */}
      {isToday && NOW_MIN >= startMin && NOW_MIN <= endMin && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: (NOW_MIN - startMin) * pxPerMin, height: 2, background: WT.danger, zIndex: 6 }}>
          <span style={{ position: 'absolute', left: -4, top: -3, width: 8, height: 8, borderRadius: '50%', background: WT.danger }} />
        </div>
      )}

      {/* appointment cards — títulos de grade flutuam ACIMA do primeiro slot, então nada de nudge */}
      {layout.map(ev => {
        const GAP = 4; // margem mínima entre cards (Google-style)
        return (
          <AppointmentCard key={ev.a.id} ev={ev}
            top={(ev.s - startMin) * pxPerMin + GAP / 2} height={ev.a.dur * pxPerMin - GAP}
            leftPct={(ev.lane / ev.lanes) * 100} widthPct={(1 / ev.lanes) * 100} gutter={GUTTER}
            cardStyle={cardStyle} dimmed={freeOnly && bookable} showPro={showPro} conflict={conflictAt(ev.a)}
            onOpen={onCardOpen}
            onDragStart={a => drag.start(a)} onDragEnd={drag.end} dragging={drag.appt && drag.appt.id === ev.a.id} />
        );
      })}
    </div>
  );
}

// ---- Shared column grid -----------------------------------------------------
function ColumnGrid({ columns, startMin, endMin, slotMin, pxPerMin, cardStyle, freeOnly, dateForToday, showPro,
  onSlotClick, onCardOpen, onBlockOpen, onBlockPick, draft, drag, colMinWidth = 200, headerRender }) {
  const gutterW = 56;
  const hours = []; for (let h = startMin; h <= endMin; h += 60) hours.push(h);
  return (
    <div style={{ height: '100%', overflow: 'auto', background: WT.raised }}>
      <div style={{ minWidth: gutterW + columns.length * colMinWidth, display: 'flex', flexDirection: 'column' }}>
        {/* sticky header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', background: WT.raised, borderBottom: `1px solid ${WT.border}` }}>
          <div style={{ width: gutterW, flex: 'none' }} />
          {columns.map((c, i) => (
            <div key={c.id} style={{ flex: 1, minWidth: colMinWidth, borderLeft: i ? `1px solid ${WT.borderSub}` : 'none', opacity: (freeOnly && c.bookable === false) ? 0.55 : 1 }}>
              {headerRender ? headerRender(c) : <ColHeader entity={c.entity} sub={c.sub} occupancy={c.occupancy} />}
            </div>
          ))}
        </div>
        {/* body */}
        <div style={{ display: 'flex' }}>
          {/* time gutter */}
          <div style={{ width: gutterW, flex: 'none', position: 'relative', height: (endMin - startMin) * pxPerMin }}>
            {hours.map(h => (
              <div key={h} style={{ position: 'absolute', top: (h - startMin) * pxPerMin - 7, right: 8, fontSize: 11, color: WT.muted, fontVariantNumeric: 'tabular-nums' }}>{fmtMin(h)}</div>
            ))}
          </div>
          {columns.map((c, i) => (
            <div key={c.id} style={{ flex: 1, minWidth: colMinWidth, borderLeft: i ? `1px solid ${WT.borderSub}` : `1px solid ${WT.borderSub}` }}>
              <ColumnTrack colId={c.id} appts={c.appts} blocks={c.blocks} startMin={startMin} endMin={endMin}
                slotMin={slotMin} pxPerMin={pxPerMin} cardStyle={cardStyle} freeOnly={freeOnly} bookable={c.bookable !== false} showPro={c.showPro != null ? c.showPro : showPro} grades={c.grades} coverage={c.coverage}
                onSlotClick={onSlotClick} onCardOpen={onCardOpen} onBlockOpen={onBlockOpen} onBlockPick={onBlockPick} draft={draft} drag={drag} isToday={c.date === dateForToday} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Empty state ------------------------------------------------------------
function EmptyState({ icon, title, hint }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: WT.muted }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: WT.inset, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><WIcon name={icon} size={26} color={WT.muted} /></div>
      <div style={{ fontSize: 15, fontWeight: WT.wEmph, color: WT.fg2 }}>{title}</div>
      {hint && <div style={{ fontSize: 13 }}>{hint}</div>}
    </div>
  );
}

// ============================================================================
//  VIEW WRAPPERS
// ============================================================================
function getGridConf(state) {
  const startMin = toMin(state.timeStart || '07:00');
  const endMin = toMin(state.timeEnd || '20:00');
  const pxPerMin = { compact: 1.0, normal: 1.25, comfortable: 1.55 }[state.density || 'normal'];
  return { startMin, endMin, slotMin: 15, pxPerMin };
}

// is a column bookable under the current especialidade / sala filter?
function bookingFilterActive(f) { return !!((f.spec || []).length || (f.unit || []).length || (f.room || []).length || (f.conv || []).length); }
function colBookable(col, f, date) {
  const roomName = col.kind === 'room' ? col.entity.name : (col.entity.room || null);
  const unitName = col.entity.unit || null;
  const specs = f.spec || [], units = f.unit || [], rooms = f.room || [], convs = f.conv || [];
  if (specs.length && col.kind === 'pro' && !specs.some(s => proHasSpec(col.entity, s))) return false;
  if (specs.length && col.kind !== 'pro' && !specs.includes(col.entity.spec)) return false;
  if (units.length && !units.includes(unitName)) return false;
  if (rooms.length && !rooms.includes(roomName)) return false;
  // convênio filter must be accepted by at least one of the pro's grades that day
  if (convs.length && col.kind === 'pro' && date && !convs.some(c => dayAcceptsCond(col.entity.id, date, { conv: c }))) return false;
  return true;
}

// shared agenda selection (Dia + Semana): profissionais (filters.pros) + extraResources
function agendaSelection(state, set) {
  const allPros = PROS.map(p => p.id);
  // pros: null = todas as agendas; array (mesmo vazio) = seleção explícita (permite "nenhuma")
  const proSel = state.filters.pros;
  const proIds = proSel == null ? allPros : proSel;
  const selected = [...proIds.map(id => ({ kind: 'pro', id })), ...(state.extraResources || [])];
  const add = res => res.kind === 'pro'
    ? set(s => ({ filters: { ...s.filters, pros: [...(s.filters.pros == null ? allPros : s.filters.pros), res.id] } }))
    : set(s => ({ extraResources: [...(s.extraResources || []), res] }));
  const remove = res => res.kind === 'pro'
    ? set(s => ({ filters: { ...s.filters, pros: (s.filters.pros == null ? allPros : s.filters.pros).filter(id => id !== res.id) } }))
    : set(s => ({ extraResources: (s.extraResources || []).filter(r => !(r.kind === res.kind && r.id === res.id)) }));
  return { selected, add, remove, allPros, proIds, date: state.date };
}

// Dia = multi-resource view (profissionais + equipamentos + salas em colunas)
function DayView({ state, set, appts, blocks, drag, onSlotClick, onCardOpen, onBlockOpen, onBlockPick, draft }) {
  const conf = getGridConf(state);
  const { selected, add, remove } = agendaSelection(state, set);
  const hf = state.freeOnly; // realce de horários livres só quando "Somente horários livres" estiver ativo
  const columns = selected.map(res => {
    const col = buildResourceColumn(res, appts, blocks, state.date, conf);
    if (col) col.bookable = colBookable(col, state.filters, state.date);
    return col;
  }).filter(Boolean);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {state.agendasPlacement !== 'sidebar' && <ResourceBar selected={selected} onAdd={add} onRemove={remove} date={state.date} />}
      <div style={{ flex: 1, minHeight: 0 }}>
        {columns.length === 0
          ? <EmptyState icon="layout-grid" title="Nenhuma agenda selecionada" hint="Use “Adicionar agenda” para incluir profissionais, equipamentos ou salas." />
          : <ColumnGrid columns={columns} {...conf} cardStyle={state.cardStyle} freeOnly={hf} dateForToday={state.date === TODAY ? state.date : null}
              onSlotClick={onSlotClick} onCardOpen={onCardOpen} onBlockOpen={onBlockOpen} onBlockPick={onBlockPick} draft={draft} drag={drag} colMinWidth={columns.length <= 2 ? 340 : 210} />}
      </div>
    </div>
  );
}

function WeekView({ state, set, appts, blocks, drag, onSlotClick, onCardOpen, onBlockOpen, onBlockPick, draft }) {
  const conf = getGridConf(state);
  // SAME selection source & UX as Dia: filters.pros + extraResources, ResourceBar
  const { selected, add, remove } = agendaSelection(state, set);

  const days = dateUtil.weekDaysOf(state.date, state.weekHideWeekend ? 5 : 6);
  const hf = state.freeOnly; // realce de horários livres só quando "Somente horários livres" estiver ativo
  const onlyPros = selected.filter(r => r.kind === 'pro');
  const single = selected.length === 1;          // single resource → show its grade bands
  const showPro = selected.length > 1;           // multiple → pro initials on cards
  const proObjs = onlyPros.map(r => PROS.find(p => p.id === r.id)).filter(Boolean);

  const columns = days.map(d => {
    const merged = mergeResourceColumns(selected, appts, blocks, d, conf);
    const pb = proObjs.length ? proObjs.some(p => colBookable({ kind: 'pro', entity: p }, state.filters, d)) : true;
    // union of grade coverage across all selected professionals → hatch where nobody is available
    const coverage = onlyPros.length
      ? onlyPros.flatMap(r => gradesFor(r.id, d).map(g => [toMin(g.start), toMin(g.end)]))
      : null; // equip/room only → no grade concept, book anywhere
    const dt = parseISO(d);
    return { id: 'd' + d, date: d, appts: merged.appts, blocks: merged.blocks, bookable: pb,
      grades: single && selected[0].kind === 'pro' ? gradesFor(selected[0].id, d) : null,
      coverage: single && selected[0].kind === 'pro' ? null : coverage,
      entity: { label: WEEKDAYS[dt.getDay()] + ' ' + dt.getDate() }, sub: MONTHS_SHORT[dt.getMonth()] };
  });
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {state.agendasPlacement === 'sidebar'
        ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '8px 16px', borderBottom: `1px solid ${WT.borderSub}`, background: WT.raised, flex: 'none' }}>
            <WToggle checked={!!state.weekHideWeekend} onChange={v => set({ weekHideWeekend: v })} label="Ocultar fim de semana" />
          </div>
        : <ResourceBar selected={selected} onAdd={add} onRemove={remove} date={state.date} trailing={
            <WToggle checked={!!state.weekHideWeekend} onChange={v => set({ weekHideWeekend: v })} label="Ocultar fim de semana" />
          } />}
      {columns.length === 0
        ? <EmptyState icon="layout-grid" title="Nenhuma agenda selecionada" hint="Use “Adicionar agenda” para incluir profissionais, equipamentos ou salas." />
        : <div style={{ flex: 1, minHeight: 0 }}>
            <ColumnGrid columns={columns} {...conf} cardStyle={state.cardStyle} freeOnly={hf} dateForToday={TODAY} showPro={showPro}
              onSlotClick={onSlotClick} onCardOpen={onCardOpen} onBlockOpen={onBlockOpen} onBlockPick={onBlockPick} draft={draft} drag={drag} colMinWidth={state.weekHideWeekend ? 170 : 150}
              headerRender={c => <div style={{ padding: '10px', textAlign: 'center', textTransform: 'capitalize' }}><div style={{ fontSize: 13, fontWeight: WT.wEmph, color: c.date === TODAY ? WT.accent : WT.fg }}>{c.entity.label}</div><div style={{ fontSize: 11, color: WT.muted }}>{c.sub}</div></div>} />
          </div>}
    </div>
  );
}

// ---- Resource helpers (mixed pro / equip / room columns) --------------------
function resourceMeta(res) {
  if (res.kind === 'pro') return PROS.find(p => p.id === res.id);
  if (res.kind === 'equip') return EQUIP.find(e => e.id === res.id);
  if (res.kind === 'room') return ROOMS.find(r => r.id === res.id);
}
function buildResourceColumn(res, appts, blocks, date, conf) {
  const meta = resourceMeta(res); if (!meta) return null;
  let ca = [], cb = [];
  if (res.kind === 'pro') { ca = appts.filter(a => a.date === date && a.pro === res.id); cb = blocks.filter(b => blockOnDate(b, date) && blockCoversPro(b, res.id)); }
  else if (res.kind === 'equip') { ca = appts.filter(a => a.date === date && a.equip === res.id); cb = blocks.filter(b => blockOnDate(b, date) && (b.equips || []).includes(res.id)); }
  else if (res.kind === 'room') ca = appts.filter(a => a.date === date && effectiveRoom(a) === meta.name);
  const kindLabel = res.kind === 'pro' ? null : res.kind === 'equip' ? 'Equipamento' : 'Sala';
  const proRooms = res.kind === 'pro' ? proRoomsOn(res.id, date) : [];
  const roomSub = proRooms.length ? proRooms.map(roomShort).join(' / ') : (meta.room || '');
  return { id: `${res.kind}:${res.id}`, date, appts: ca, blocks: cb, entity: meta, sub: kindLabel ? `${kindLabel} · ${meta.spec}` : `${specLabel(meta)} · ${roomSub}`, kind: res.kind, showPro: res.kind !== 'pro',
    grades: res.kind === 'pro' ? gradesFor(res.id, date) : null,
    occupancy: occupancyOf(ca, conf.startMin, conf.endMin, cb) };
}

function ResourcePicker({ selected, onToggle, onClose, anchorRect, only, date }) {
  const forDate = date || TODAY;
  const has = (kind, id) => selected.some(r => r.kind === kind && r.id === id);
  const showPros = !only || only.includes('pro');
  const showEquip = !only || only.includes('equip');
  const showRooms = !only || only.includes('room');
  const searchPlaceholder = (only && only.length === 1 && only[0] === 'equip') ? 'Buscar equipamento…'
    : (only && only.length === 1 && only[0] === 'room') ? 'Buscar sala / consultório…'
    : 'Buscar profissional, sala, especialidade, procedimento…';
  const [q, setQ] = React.useState('');
  const ql = q.trim().toLowerCase();
  // procedimentos que cada profissional oferece (pela grade) → permite buscar por procedimento
  const procNamesForPro = pro => {
    const ids = new Set();
    GRADES.filter(g => g.pro === pro.id).forEach(g => (g.procs || []).forEach(id => ids.add(id)));
    return [...ids].map(id => (PROCS[id] || {}).name).filter(Boolean);
  };
  const matchPro = p => !ql || [p.name, p.short, ...specsOf(p), ...procNamesForPro(p)].some(s => s && s.toLowerCase().includes(ql));
  const fPros = showPros ? PROS.filter(matchPro) : [];
  const fEquip = showEquip ? EQUIP.filter(e => !ql || [e.name, e.spec].some(s => s && s.toLowerCase().includes(ql))) : [];
  const fRooms = showRooms ? ROOMS.filter(r => !ql || [r.name, r.spec].some(s => s && s.toLowerCase().includes(ql))) : [];
  // Unidades: adicionar todos os profissionais que trabalham naquela unidade NAQUELE DIA (pelas grades)
  const prosWorkingInUnit = unit => PROS.filter(p => {
    const gs = gradesFor(p.id, forDate);
    if (!gs.length) return false;
    return gs.some(g => { const ru = g.room ? (ROOMS.find(r => r.name === g.room) || {}).unit : null; return (ru || p.unit) === unit; });
  });
  const fUnits = showPros ? UNITS.map(u => ({ id: u, name: u, pros: prosWorkingInUnit(u) }))
    .filter(u => u.pros.length > 0 && (!ql || u.name.toLowerCase().includes(ql))) : [];
  const found = [...fPros.map(p => ({ kind: 'pro', id: p.id })), ...fEquip.map(e => ({ kind: 'equip', id: e.id })), ...fRooms.map(r => ({ kind: 'room', id: r.id }))];
  const toAdd = found.filter(r => !has(r.kind, r.id));
  const total = fPros.length + fEquip.length + fRooms.length;

  const Group = ({ title, items, kind }) => {
    if (items.length === 0) return null;
    const allOn = items.every(it => has(kind, it.id));
    const toggleAll = () => items.forEach(it => { if (has(kind, it.id) === allOn) onToggle({ kind, id: it.id }); });
    return (
    <div style={{ padding: '6px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px' }}>
        <span style={{ flex: 1, fontSize: 11, fontWeight: WT.wEmph, color: WT.muted, textTransform: 'uppercase', letterSpacing: '.05em' }}>{title}</span>
        <button onClick={toggleAll} style={{ background: 'none', border: 'none', color: WT.accent, fontSize: 12, fontWeight: WT.wEmph, cursor: 'pointer', fontFamily: WT.font, padding: 0 }}>{allOn ? 'Limpar' : 'Selecionar todos'}</button>
      </div>
      {items.map(it => { const on = has(kind, it.id); const subtitle = kind === 'pro' ? specLabel(it) : it.spec; return (
        <button key={it.id} onClick={() => onToggle({ kind, id: it.id })} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '7px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: WT.font }}
          onMouseEnter={e => e.currentTarget.style.background = WT.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <span style={{ width: 16, height: 16, borderRadius: WT.rS, flex: 'none', border: `1.5px solid ${on ? WT.accentFill : WT.borderHover}`, background: on ? WT.accentFill : '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{on && <WIcon name="check" size={12} color="#fff" strokeWidth={3} />}</span>
          <WAvatar initials={it.initials} size={24} bg={(it.color || WT.accent) + '22'} color={it.color || WT.accent} ring="transparent" />
          <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontSize: 13, color: WT.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.short || it.name}</span><span style={{ display: 'block', fontSize: 11, color: WT.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</span></span>
        </button>
      ); })}
    </div>
  );
  };
  return (
    <WPopover anchorRect={anchorRect} onClose={onClose} width={300}>
      <div style={{ padding: 10, borderBottom: `1px solid ${WT.borderSub}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 10px', borderRadius: WT.rM, border: `1px solid ${WT.border}`, background: '#fff' }}>
          <WIcon name="search" size={16} />
          <input autoFocus value={q} placeholder={searchPlaceholder}
            onChange={e => setQ(e.target.value)}
            style={{ border: 'none', outline: 'none', font: `${WT.wBody} 13px ${WT.font}`, flex: 1, background: 'transparent', color: WT.fg, minWidth: 0 }} />
          {q && <button onClick={() => setQ('')} style={{ display: 'inline-flex', border: 'none', background: 'transparent', cursor: 'pointer', padding: 2, color: WT.muted }}><WIcon name="x" size={14} /></button>}
        </div>
        {ql && toAdd.length > 0 && (
          <button onClick={() => toAdd.forEach(r => onToggle(r))} style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', height: 34, borderRadius: WT.rM, border: `1px solid ${WT.borderAccent}`, background: WT.accentSoft, cursor: 'pointer', fontFamily: WT.font, fontSize: 13, fontWeight: WT.wEmph, color: WT.accent }}>
            <WIcon name="check-check" size={15} color={WT.accent} />Marcar todos os encontrados ({toAdd.length})
          </button>
        )}
      </div>
      <div style={{ maxHeight: 380, overflow: 'auto' }}>
        {total === 0 && fUnits.length === 0
          ? <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: WT.muted }}>Nenhuma agenda encontrada para “{q}”.</div>
          : <>
              {fUnits.length > 0 && (
                <div style={{ padding: '6px 0' }}>
                  <div style={{ padding: '4px 12px' }}>
                    <span style={{ fontSize: 11, fontWeight: WT.wEmph, color: WT.muted, textTransform: 'uppercase', letterSpacing: '.05em' }}>Unidades</span>
                  </div>
                  {fUnits.map(u => {
                    const ids = u.pros.map(p => p.id);
                    const allOn = ids.every(id => has('pro', id));
                    const someOn = ids.some(id => has('pro', id));
                    const toggleUnit = () => u.pros.forEach(p => { const on = has('pro', p.id); if (allOn ? on : !on) onToggle({ kind: 'pro', id: p.id }); });
                    return (
                      <button key={u.id} onClick={toggleUnit} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '7px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: WT.font }}
                        onMouseEnter={e => e.currentTarget.style.background = WT.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <span style={{ width: 16, height: 16, borderRadius: WT.rS, flex: 'none', border: `1.5px solid ${allOn || someOn ? WT.accentFill : WT.borderHover}`, background: allOn ? WT.accentFill : (someOn ? WT.accentSoft : '#fff'), display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{allOn ? <WIcon name="check" size={12} color="#fff" strokeWidth={3} /> : someOn ? <span style={{ width: 8, height: 2, borderRadius: 1, background: WT.accentFill }} /> : null}</span>
                        <span style={{ width: 24, height: 24, borderRadius: WT.rS, flex: 'none', background: WT.accentSoft, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><WIcon name="building-2" size={14} color={WT.accent} /></span>
                        <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontSize: 13, color: WT.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</span><span style={{ display: 'block', fontSize: 11, color: WT.muted }}>{u.pros.length} profissional(is) hoje</span></span>
                      </button>
                    );
                  })}
                  {(fPros.length > 0 || fEquip.length > 0 || fRooms.length > 0) && <WDivider />}
                </div>
              )}
              <Group title="Profissionais" items={fPros} kind="pro" />
              {fEquip.length > 0 && <WDivider />}
              <Group title="Equipamentos" items={fEquip} kind="equip" />
              {fRooms.length > 0 && <WDivider />}
              <Group title="Salas / consultórios" items={fRooms} kind="room" />
            </>}
      </div>
    </WPopover>
  );
}

function ResourceBar({ selected, onAdd, onRemove, trailing, only, addLabel, date }) {
  const [pick, setPick] = React.useState(null);
  const onlyEquip = only && only.length === 1 && only[0] === 'equip';
  const addText = addLabel || (onlyEquip ? 'Adicionar equipamento' : 'Adicionar agenda');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderBottom: `1px solid ${WT.borderSub}`, background: WT.raised, flex: 'none', flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, fontWeight: WT.wEmph, color: WT.fg2, marginRight: 2 }}>Agendas:</span>
      {selected.map(res => { const m = resourceMeta(res); if (!m) return null; const icon = res.kind === 'pro' ? 'user-round' : res.kind === 'equip' ? 'activity' : 'door-open'; return (
        <span key={res.kind + res.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 6px 0 10px', borderRadius: WT.pill, border: `1px solid ${WT.border}`, background: '#fff', fontSize: 13, color: WT.fg }}>
          <WIcon name={icon} size={13} color={m.color || WT.muted} />
          {m.short || m.name}
          <button onClick={() => onRemove(res)} title="Remover" style={{ width: 18, height: 18, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={e => e.currentTarget.style.background = WT.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><WIcon name="x" size={12} color={WT.muted} /></button>
        </span>
      ); })}
      <button onClick={e => setPick(e.currentTarget.getBoundingClientRect())} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 12px', borderRadius: WT.pill, border: `1px dashed ${WT.borderHover}`, background: 'transparent', cursor: 'pointer', fontFamily: WT.font, fontSize: 13, fontWeight: WT.wEmph, color: WT.accent }}>
        <WIcon name="plus" size={14} color={WT.accent} /> {addText}
      </button>
      {pick && <ResourcePicker selected={selected} anchorRect={pick} only={only} date={date} onClose={() => setPick(null)} onToggle={res => (selected.some(r => r.kind === res.kind && r.id === res.id) ? onRemove(res) : onAdd(res))} />}
      {trailing && <><span style={{ flex: 1 }} />{trailing}</>}
    </div>
  );
}

// vertical agenda selector for the sidebar (mesma seleção do ResourceBar, layout empilhado)
function AgendaSidebarPanel({ selected, onAdd, onRemove, date }) {
  const [pick, setPick] = React.useState(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px' }}>
        <span style={{ flex: 1, fontSize: 11, fontWeight: WT.wEmph, color: WT.fg2, textTransform: 'uppercase', letterSpacing: '.05em' }}>Agendas</span>
        {selected.length > 0 && <WBadge type="neutral">{selected.length}</WBadge>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 216, overflow: 'auto', margin: '0 -2px', padding: '0 2px' }}>
        {selected.map(res => { const m = resourceMeta(res); if (!m) return null; const icon = res.kind === 'pro' ? 'user-round' : res.kind === 'equip' ? 'activity' : 'door-open'; return (
          <div key={res.kind + res.id} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 4px 0 10px', borderRadius: WT.rM, border: `1px solid ${WT.border}`, background: '#fff', fontSize: 13, color: WT.fg }}>
            <WIcon name={icon} size={14} color={m.color || WT.muted} />
            <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.short || m.name}</span>
            <button onClick={() => onRemove(res)} title="Remover" style={{ width: 22, height: 22, borderRadius: WT.rS, border: 'none', background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }} onMouseEnter={e => e.currentTarget.style.background = WT.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><WIcon name="x" size={13} color={WT.muted} /></button>
          </div>
        ); })}
      </div>
      <button onClick={e => setPick(e.currentTarget.getBoundingClientRect())} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', height: 34, borderRadius: WT.rM, border: `1px dashed ${WT.borderHover}`, background: 'transparent', cursor: 'pointer', fontFamily: WT.font, fontSize: 13, fontWeight: WT.wEmph, color: WT.accent }}>
        <WIcon name="plus" size={14} color={WT.accent} /> Adicionar agenda
      </button>
      {pick && <ResourcePicker selected={selected} anchorRect={pick} date={date} onClose={() => setPick(null)} onToggle={res => (selected.some(r => r.kind === res.kind && r.id === res.id) ? onRemove(res) : onAdd(res))} />}
    </div>
  );
}

// merge appts/blocks of several resources for a single date (Week view)
function mergeResourceColumns(resources, appts, blocks, date, conf) {
  const seen = new Set(); const outA = []; const outB = [];
  resources.forEach(res => {
    const col = buildResourceColumn(res, appts, blocks, date, conf);
    if (!col) return;
    col.appts.forEach(a => { if (!seen.has(a.id)) { seen.add(a.id); outA.push(a); } });
    (col.blocks || []).forEach(b => outB.push(b));
  });
  return { appts: outA, blocks: outB };
}

function MultipleView({ state, set, appts, blocks, drag, onSlotClick, onCardOpen }) {
  const conf = getGridConf(state);
  const DEF = PROS.map(p => ({ kind: 'pro', id: p.id }));
  const selected = state.multiResources && state.multiResources.length ? state.multiResources : DEF;
  const columns = selected.map(res => buildResourceColumn(res, appts, blocks, state.date, conf)).filter(Boolean);
  const add = res => set(s => ({ multiResources: [...(s.multiResources && s.multiResources.length ? s.multiResources : DEF), res] }));
  const remove = res => set(s => ({ multiResources: (s.multiResources && s.multiResources.length ? s.multiResources : DEF).filter(r => !(r.kind === res.kind && r.id === res.id)) }));
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ResourceBar selected={selected} onAdd={add} onRemove={remove} date={state.date} />
      <div style={{ flex: 1, minHeight: 0 }}>
        {columns.length === 0
          ? <EmptyState icon="layout-grid" title="Nenhuma agenda selecionada" hint="Use “Adicionar agenda” para incluir profissionais, equipamentos ou salas." />
          : <ColumnGrid columns={columns} {...conf} cardStyle={state.cardStyle} freeOnly={state.freeOnly} dateForToday={state.date === TODAY ? state.date : null}
              onSlotClick={onSlotClick} onCardOpen={onCardOpen} drag={drag} colMinWidth={210} />}
      </div>
    </div>
  );
}

function EquipmentView({ state, set, appts, blocks, drag, onSlotClick, onCardOpen, onBlockOpen, onBlockPick, draft }) {
  const conf = getGridConf(state);
  const hf = state.freeOnly; // realce de horários livres só quando "Somente horários livres" estiver ativo
  const DEF = EQUIP.map(e => ({ kind: 'equip', id: e.id }));
  const selected = (state.equipResources && state.equipResources.length) ? state.equipResources : DEF;
  const add = res => set(s => ({ equipResources: [...((s.equipResources && s.equipResources.length) ? s.equipResources : DEF), res] }));
  const remove = res => set(s => ({ equipResources: ((s.equipResources && s.equipResources.length) ? s.equipResources : DEF).filter(r => !(r.kind === res.kind && r.id === res.id)) }));
  const columns = selected.map(res => {
    const e = EQUIP.find(x => x.id === res.id); if (!e) return null;
    const ca = appts.filter(a => a.date === state.date && a.equip === e.id);
    const cb = blocks.filter(b => blockOnDate(b, state.date) && (b.equips || []).includes(e.id));
    return { id: e.id, date: state.date, appts: ca, blocks: cb, entity: e, sub: e.spec, showPro: true, bookable: colBookable({ kind: 'equip', entity: e }, state.filters), occupancy: occupancyOf(ca, conf.startMin, conf.endMin, cb) };
  }).filter(Boolean);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ResourceBar selected={selected} onAdd={add} onRemove={remove} only={['equip']} />
      <div style={{ flex: 1, minHeight: 0 }}>
        {columns.length === 0
          ? <EmptyState icon="activity" title="Nenhum equipamento selecionado" hint="Use “Adicionar equipamento” para incluir aparelhos na visualização." />
          : <ColumnGrid columns={columns} {...conf} cardStyle={state.cardStyle} freeOnly={hf} dateForToday={state.date === TODAY ? state.date : null}
              onSlotClick={onSlotClick} onCardOpen={onCardOpen} onBlockOpen={onBlockOpen} onBlockPick={onBlockPick} draft={draft} drag={drag} colMinWidth={240} />}
      </div>
    </div>
  );
}

// ---- Salas / consultórios view (recursos = salas em colunas) ----------------
// Cada coluna é uma sala; os agendamentos caem na sala efetiva (grade > sala-base).
// Útil para ver, p.ex., que o Bem-te-vi recebe a Dra. Renata à tarde e o Dr. Bruno de dia.
function RoomView({ state, appts, blocks, drag, onSlotClick, onCardOpen, onBlockOpen, onBlockPick, draft }) {
  const conf = getGridConf(state);
  const hf = state.freeOnly; // realce de horários livres só quando "Somente horários livres" estiver ativo
  const units = state.filters.unit || [], roomsF = state.filters.room || [];
  const rooms = ROOMS.filter(r => (!units.length || units.includes(r.unit)) && (!roomsF.length || roomsF.includes(r.name)));
  const columns = rooms.map(r => {
    const ca = appts.filter(a => a.date === state.date && effectiveRoom(a) === r.name);
    // bloqueios da clínica inteira (feriado) valem para todas as salas
    const cb = blocks.filter(b => blockOnDate(b, state.date) && b.scope === 'clinica');
    return { id: `room:${r.id}`, date: state.date, appts: ca, blocks: cb, entity: r, sub: `Sala · ${r.spec}`, showPro: true,
      occupancy: occupancyOf(ca, conf.startMin, conf.endMin, cb) };
  });
  return (
    <div style={{ height: '100%', minHeight: 0 }}>
      {columns.length === 0
        ? <EmptyState icon="door-open" title="Nenhuma sala" hint="Ajuste o filtro de salas para ver consultórios." />
        : <ColumnGrid columns={columns} {...conf} cardStyle={state.cardStyle} freeOnly={hf} dateForToday={state.date === TODAY ? state.date : null}
            onSlotClick={onSlotClick} onCardOpen={onCardOpen} onBlockOpen={onBlockOpen} onBlockPick={onBlockPick} draft={draft} drag={drag} colMinWidth={240} />}
    </div>
  );
}

// ---- Programação (lista por dia, estilo "agenda/schedule" do Google) --------
function ProgRow({ a }) {
  const st = STATUS[a.status] || STATUS.marcado;
  const pro = PROS.find(p => p.id === a.pro) || {};
  const pt = patientById(a.pt) || { name: a._patientName || 'Paciente' };
  const isRet = (a.procs && a.procs.length ? a.procs : [a.proc]).includes('retorno');
  const online = _pseed ? false : false;
  const valor = a.plano ? a.conv : (a.price ? brl(a.price) : 'Particular');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 0', minWidth: 0 }}>
      <span style={{ width: 116, flex: 'none', fontSize: 13, color: WT.fg2, fontVariantNumeric: 'tabular-nums' }}>{a.start}–{fmtMin(toMin(a.start) + (a.dur || 30))}</span>
      <span style={{ width: 9, height: 9, borderRadius: '50%', flex: 'none', background: pro.color || st.dot }} />
      <span title={st.label} style={{ width: 9, height: 9, borderRadius: '50%', flex: 'none', background: st.dot, boxShadow: `0 0 0 2px ${st.dot}26` }} />
      <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: WT.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <span style={{ color: WT.fg2 }}>{pro.short || pro.name || '—'}</span> · <strong style={{ fontWeight: WT.wEmph }}>{pt.name}</strong> · {apptProcLabel(a)}{isRet ? ' · retorno' : ''}
      </span>
      <span style={{ flex: 'none', fontSize: 12.5, color: WT.muted, whiteSpace: 'nowrap' }}>{valor}</span>
    </div>
  );
}
function ProgDay({ d, items }) {
  const dt = parseISO(d);
  const isToday = d === TODAY;
  return (
    <div style={{ display: 'flex', gap: 16, padding: '14px 0', borderTop: `1px solid ${WT.borderSub}` }}>
      <div style={{ width: 60, flex: 'none' }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: WT.wHead, fontVariantNumeric: 'tabular-nums', background: isToday ? WT.calSelBg : 'transparent', color: isToday ? WT.calSelFg : WT.fg }}>{dt.getDate()}</div>
        <div style={{ fontSize: 11, color: WT.muted, textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 3, textAlign: 'center' }}>{WEEKDAYS[dt.getDay()]}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {items.map(a => <ProgRow key={a.id} a={a} />)}
      </div>
    </div>
  );
}
function ProgramacaoView({ state, set, appts }) {
  const start = state.date;
  const proSet = new Set(visiblePros(state.filters).map(p => p.id));
  const days = Array.from({ length: 21 }, (_, i) => dateUtil.addDays(start, i));
  const byDay = days.map(d => ({ d, items: (appts || []).filter(a => a.date === d && a.status !== 'cancelado' && !a.deleted && proSet.has(a.pro)).sort((x, y) => toMin(x.start) - toMin(y.start)) })).filter(g => g.items.length);
  const total = byDay.reduce((s, g) => s + g.items.length, 0);
  return (
    <div style={{ height: '100%', overflow: 'auto', background: WT.raised }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderBottom: `1px solid ${WT.borderSub}`, position: 'sticky', top: 0, background: WT.raised, zIndex: 2 }}>
        <WIcon name="list" size={18} color={WT.accent} />
        <span style={{ fontSize: 15, fontWeight: WT.wHead, color: WT.fg }}>Programação</span>
        <span style={{ fontSize: 13, color: WT.muted }}>a partir de {fmtLongDate(start)} · {total} agendamentos</span>
        <span style={{ flex: 1 }} />
        <WButton variant="default" leadingIcon="printer" label="Imprimir" onClick={() => window.print()} />
      </div>
      <div data-print-area style={{ padding: '0 20px 40px' }}>
        <div data-print-only style={{ display: 'none', padding: '12px 0', fontSize: 18, fontWeight: WT.wHead }}>Programação — {fmtLongDate(start)}</div>
        {byDay.length === 0
          ? <EmptyState icon="calendar-days" title="Sem agendamentos no período" hint="Avance a data para ver outros dias." />
          : byDay.map(g => <ProgDay key={g.d} d={g.d} items={g.items} />)}
      </div>
    </div>
  );
}

// ---- Month view -------------------------------------------------------------
function MonthView({ state, set, appts, blocks }) {
  const d = parseISO(state.date); const y = d.getFullYear(), m = d.getMonth();
  const first = new Date(y, m, 1); const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let dd = 1; dd <= daysInMonth; dd++) cells.push(dd);
  while (cells.length % 7) cells.push(null);
  const startMin = toMin(state.timeStart || '07:00'), endMin = toMin(state.timeEnd || '20:00');
  const proSet = new Set(visiblePros(state.filters).map(p => p.id));
  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 16, background: WT.bg }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: WT.border, border: `1px solid ${WT.border}`, borderRadius: WT.rL, overflow: 'hidden' }}>
        {WEEKDAYS.map((w, i) => <div key={i} style={{ background: WT.raised, padding: '8px 10px', fontSize: 12, fontWeight: WT.wEmph, color: WT.fg2, textAlign: 'center', textTransform: 'capitalize' }}>{w}</div>)}
        {cells.map((dd, i) => {
          if (dd == null) return <div key={i} style={{ background: WT.inset, minHeight: 104 }} />;
          const iso = `${y}-${pad2(m + 1)}-${pad2(dd)}`;
          const dayAppts = appts.filter(a => a.date === iso && a.status !== 'cancelado' && proSet.has(a.pro));
          const isToday = iso === TODAY;
          const allPros = visiblePros(state.filters);
          const occ = allPros.length ? Math.round(allPros.reduce((s, p) => s + occupancyOf(dayAppts.filter(a => a.pro === p.id), startMin, endMin, blocks.filter(b => blockOnDate(b, iso) && blockCoversPro(b, p.id))), 0) / allPros.length) : 0;
          return (
            <button key={i} onClick={() => set({ date: iso, view: 'dia' })} style={{
              background: WT.raised, minHeight: 104, border: 'none', cursor: 'pointer', textAlign: 'left', padding: 8,
              display: 'flex', flexDirection: 'column', gap: 6, fontFamily: WT.font,
            }} onMouseEnter={e => e.currentTarget.style.background = WT.hover} onMouseLeave={e => e.currentTarget.style.background = WT.raised}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: WT.wEmph, fontVariantNumeric: 'tabular-nums', background: isToday ? WT.calSelBg : 'transparent', color: isToday ? WT.calSelFg : WT.fg }}>{dd}</span>
                <span style={{ flex: 1 }} />
                {dayAppts.length > 0 && <span style={{ fontSize: 11, color: WT.muted, fontWeight: WT.wEmph }}>{dayAppts.length}</span>}
              </div>
              {dayAppts.length > 0 && (
                <>
                  <div style={{ height: 6, borderRadius: WT.pill, background: WT.inset, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${occ}%`, background: occ >= 80 ? WT.danger : occ >= 50 ? WT.warning : WT.successFill, borderRadius: WT.pill }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
                    {dayAppts.slice(0, 2).map(a => { const t = TYPES[apptType(a)]; const pt = patientById(a.pt) || {}; return (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: WT.fg2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.bar, flex: 'none' }} />{a.start} {(pt.name || '').split(' ')[0]}
                      </div>
                    ); })}
                    {dayAppts.length > 2 && <div style={{ fontSize: 11, color: WT.muted }}>+{dayAppts.length - 2} mais</div>}
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { NOW_MIN, filterAppts, visiblePros, occupancyOf, ColumnGrid, ColumnTrack, ColHeader, EmptyState, getGridConf, DayView, WeekView, MultipleView, EquipmentView, RoomView, ProgramacaoView, MonthView, ResourceBar, ResourcePicker, resourceMeta, agendaSelection, AgendaSidebarPanel });
