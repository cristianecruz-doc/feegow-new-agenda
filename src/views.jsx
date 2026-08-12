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

// ---- Filtros de agenda ------------------------------------------------------
// Quatro categorias de restrição ("este recurso atende X?"), usadas pelo seletor
// de agendas da barra lateral. OR dentro da categoria, AND entre categorias.
// Cada categoria só vale para os tipos de recurso que têm o atributo: onde não se
// aplica ela é OMITIDA, nunca zera a seção. Equipamento não casa com nenhuma —
// seu "spec" ("Sala de Ultrassom") é outro vocabulário, não especialidade médica.
const AGENDA_FILTERS = [
  { key: 'proc', label: 'Serviços', icon: 'stethoscope',
    values: () => PROC_LIST.map(p => ({ value: p.id, label: p.name })),
    match: { pro: (p, v, d) => !d || dayAcceptsCond(p.id, d, { procId: v }) } },
  { key: 'spec', label: 'Especialidade', icon: 'user-round',
    values: () => [...new Set(PROS.flatMap(p => specsOf(p)))].map(s => ({ value: s, label: s })),
    match: { pro: (p, v) => proHasSpec(p, v), room: (r, v) => r.spec === v } },
  { key: 'unit', label: 'Unidade', icon: 'building-2',
    values: () => UNITS.map(u => ({ value: u, label: u })),
    match: { pro: (p, v) => p.unit === v, room: (r, v) => r.unit === v } },
  { key: 'conv', label: 'Convênio', icon: 'shield-check', mvpHidden: true,
    values: () => CONVENIOS.map(c => ({ value: c, label: c })),
    match: { pro: (p, v, d) => !d || dayAcceptsCond(p.id, d, { conv: v }) } },
];
const agendaFilterCats = () => AGENDA_FILTERS.filter(c => !(c.mvpHidden && window.__mvp));
const emptyFilters = () => ({ proc: [], spec: [], unit: [], conv: [] });
const hasAgendaFilters = f => AGENDA_FILTERS.some(c => (f[c.key] || []).length);
// o recurso satisfaz todos os filtros ativos? categoria sem valor OU inaplicável passa
function fitsFilters(kind, meta, filters, date) {
  return AGENDA_FILTERS.every(cat => {
    const vals = filters[cat.key] || [], m = cat.match[kind];
    return !vals.length || !m || vals.some(v => m(meta, v, date));
  });
}
// busca sem acento/caixa: o usuário digita "saude", o dado é "Bradesco Saúde"
const normq = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// agendamentos visíveis: os filtros recortam AGENDAS (colunas), não agendamentos —
// esconder consultas dentro de uma coluna que o usuário escolheu ver só confunde
function filterAppts(appts) {
  return appts.filter(a => !a.deleted);
}
// recorte de profissionais para Mês / Programação (views sem seletor de agendas):
// só as categorias independentes de data — convênio/serviço variam por dia (grade)
function visiblePros(filters) {
  const specs = filters.spec || [], units = filters.unit || [];
  return PROS.filter(p => (!specs.length || specs.some(s => proHasSpec(p, s))) && (!units.length || units.includes(p.unit)));
}
function occupancyOf(appts, startMin, endMin, blocks) {
  const blocked = (blocks || []).reduce((s, b) => s + (toMin(b.end) - toMin(b.start)), 0);
  const avail = (endMin - startMin) - blocked;
  const booked = appts.filter(a => a.status !== 'cancelado').reduce((s, a) => s + a.dur, 0);
  return avail > 0 ? Math.min(100, Math.round((booked / avail) * 100)) : 0;
}

// ---- Column header ----------------------------------------------------------
function ColHeader({ entity, sub, subParts, occupancy, onPick }) {
  const icon = entity.kindIcon || 'user-round';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', minWidth: 0 }}>
      <WProfileAvatar src={entity.photo} size={30} icon={icon} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: WT.wEmph, color: WT.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entity.short || entity.name || entity.label}</span>
          {entity.doctoralia && <img src={(window.__resources && window.__resources.doctoIcon) || "assets/icon-doctoralia.png"} alt="" title="Profissional integrado à Doctoralia" style={{ width: 14, height: 14, flex: 'none' }} />}
        </div>
        {subParts && subParts.length
          ? <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              {subParts.filter(p => p.text).map((p, i) => (
                <span key={i} title={p.text} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, minWidth: 0, fontSize: 11, color: WT.muted }}>
                  <WIcon name={p.icon} size={11} color={WT.muted} style={{ flex: 'none' }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.text}</span>
                </span>
              ))}
            </div>
          : sub && <div style={{ fontSize: 11, color: WT.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
      </div>
      {occupancy != null && !window.__mvp && <OccupancyRing pct={occupancy} />}
    </div>
  );
}

// ---- Ocupação do dia: anel de progresso (quão cheio o dia está) -------------
function OccupancyRing({ pct, size = 26 }) {
  const c = pct >= 80 ? WT.danger : pct >= 50 ? '#c98a00' : WT.successFill;
  const r = (size - 4) / 2, C = 2 * Math.PI * r;
  return (
    <span title={`Dia ${pct}% ocupado`} style={{ flex: 'none', position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'help' }}>
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={WT.borderSub} strokeWidth={3.5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeWidth={3.5} strokeLinecap="round" strokeDasharray={`${C * pct / 100} ${C}`} />
      </svg>
      <span style={{ fontSize: 8.5, fontWeight: WT.wXbold, color: c, fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em' }}>{pct}</span>
    </span>
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
// cabeçalho da faixa de grade — aba sólida na cor da grade, ancorada acima do 1º slot
function GradeBandHeader({ g, HEADER_H }) {
  const name = g.label ? `${g.label}${g.room ? ' · ' + roomShort(g.room) : ''}` : (g.room ? `${g.room} · Unidade Centro` : 'Unidade Centro');
  const doctoTitle = g.doctoralia ? ' · disponível em Doctoralia' : '';
  return (
    <div style={{ position: 'absolute', top: -HEADER_H, left: 0, right: 0, height: HEADER_H, display: 'flex', alignItems: 'flex-end', gap: 4, zIndex: 2, pointerEvents: 'none' }}>
      <span title={`Grade: ${name} · ${g.start}–${g.end}${doctoTitle}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, maxWidth: '100%', height: HEADER_H, padding: '0 8px', background: g.color, borderRadius: `${WT.rS} ${WT.rS} 0 0`, pointerEvents: 'auto' }}>
        <span style={{ fontSize: 11.5, fontWeight: WT.wXbold, color: '#fff', letterSpacing: '.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
        {/* selo da Doctoralia no fim do próprio rótulo da grade — a faixa já diz
            de qual disponibilidade se trata, não precisa repetir isso em texto */}
        {/* só existe o PNG colorido — o filtro o achata em branco sobre a faixa */}
        {g.doctoralia && <img src={(window.__resources && window.__resources.doctoIcon) || "assets/icon-doctoralia.png"} alt="" style={{ width: 14, height: 14, flex: 'none', display: 'block', filter: 'brightness(0) invert(1)' }} />}
      </span>
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
  // filtro de procedimento/convênio: blocos de grade que não permitem ficam indisponíveis
  const gf = window.__gradeFilter;
  const gradeAllowed = g => !gf || ((!gf.conv.length || gf.conv.some(c => gradeAccepts(g, { conv: c }))) && (!gf.proc.length || gf.proc.some(id => gradeAccepts(g, { procId: id }))));
  const activeGrades = gradeBlocks.filter(gradeAllowed);
  // faixas apagadas PELO FILTRO: precisam se explicar onde o usuário está olhando,
  // senão viram "sem grade" e o buraco na agenda fica inexplicável
  const hiddenByFilter = gf ? gradeBlocks.filter(g => !gradeAllowed(g)) : [];
  const filterWhy = gf ? [...gf.conv, ...gf.proc.map(id => (PROCS[id] || {}).name || id)].join(' / ') : '';
  // coverage = ranges where booking is allowed. From this column's grades, or an explicit
  // merged coverage (Week multi-resource). Empty array given explicitly = book anywhere.
  const coverRanges = coverage != null ? coverage : activeGrades.map(g => [toMin(g.start), toMin(g.end)]);
  const hasCoverage = coverRanges.length > 0;
  const intervals = gradeBlocks.flatMap(g => (g.intervals || []).map(iv => ({ ...iv, color: g.color })));
  const inGrade = m => !hasCoverage || coverRanges.some(([s, e]) => m >= s && m < e);
  // duração padrão do slot no horário (intervalo da grade ativa); fallback ao slotMin do grid
  const slotDefaultAt = m => { const g = gradeBlocks.find(g => m >= toMin(g.start) && m < toMin(g.end)); return (g && g.slotMin) || slotMin; };
  // remarcação: só destaca livre onde o médico atende convênio + todos os procedimentos
  const rxCond = window.__rxCond;
  const gradeAcceptsRx = g => !rxCond || (((!rxCond.conv || rxCond.conv === 'Particular') || !g.convenios || g.convenios.includes(rxCond.conv)) && (rxCond.procIds || []).every(pid => !g.procs || g.procs.includes(pid)));
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

  // durante remarcação, o horário só é "escolhível" se a grade ativa atende convênio + procedimentos
  const rxOkAt = m => { if (!rxCond) return true; const g = gradeBlocks.find(g => m >= toMin(g.start) && m < toMin(g.end)); return !!g && gradeAcceptsRx(g); };
  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, minWidth: 0, height: (endMin - startMin) * pxPerMin }}
      onMouseMove={e => { if (!drag.appt) { const m = minFromY(e.clientY); setHoverMin((!inGrade(m) || inInterval(m) || inBlock(m) || !rxOkAt(m)) ? null : m); } }}
      onMouseLeave={() => setHoverMin(null)}
      onClick={e => { if ((e.target === ref.current || e.currentTarget === e.target) && hoverMin != null) onSlotClick(colId, hoverMin, { left: e.clientX, top: e.clientY, right: e.clientX, bottom: e.clientY }); }}
      onDragOver={e => { if (drag.appt) { e.preventDefault(); drag.setMin(colId, minFromY(e.clientY)); } }}
      onDrop={e => { if (drag.appt) { e.preventDefault(); const m = minFromY(e.clientY); if (rangeBlocked(m, drag.appt.dur || slotMin)) { drag.end(); return; } drag.onDrop(colId, m); } }}
    >
      {/* fora da grade do profissional = sem disponibilidade (fundo cinza sólido) */}
      {hasCoverage && rangeGaps(coverRanges, startMin, endMin).map(([s, e], i) => (
        <div key={'ng' + i} title="Sem grade — fora da disponibilidade do profissional" style={{ position: 'absolute', left: 0, right: 0, top: (s - startMin) * pxPerMin, height: (e - s) * pxPerMin, background: '#eef0f0', zIndex: 0 }} />
      ))}
      {/* faixas apagadas pelo filtro — dizem POR QUE estão apagadas */}
      {hiddenByFilter.map((g, i) => {
        const gh = (toMin(g.end) - toMin(g.start)) * pxPerMin;
        return (
          <div key={'fo' + i} title={`Não atende ${filterWhy} nesta faixa${g.label ? ' (' + g.label + ')' : ''} · ${g.start}–${g.end}`}
            style={{ position: 'absolute', left: 0, right: 0, top: (toMin(g.start) - startMin) * pxPerMin, height: gh, background: '#eef0f0', zIndex: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 6, overflow: 'hidden' }}>
            {gh >= 36 && <span style={{ fontSize: 11, color: WT.muted, textAlign: 'center', padding: '0 6px' }}>Não atende {filterWhy}</span>}
          </div>
        );
      })}
      {/* faixas com grade — fundo branco + tint da cor da grade e barra lateral */}
      {activeGrades.map((g, i) => {
        const gh = (toMin(g.end) - toMin(g.start)) * pxPerMin;
        return (
          <div key={'g' + i} title={`${g.label || 'Disponível'} · ${g.start}–${g.end}${g.room ? ' · ' + g.room : ''} · intervalo ${g.slotMin} min`} style={{ position: 'absolute', left: 0, right: 0, top: (toMin(g.start) - startMin) * pxPerMin, height: gh, background: '#fff', borderLeft: `3px solid ${g.color}`, borderTop: `2px solid ${g.color}`, zIndex: 0 }} />
        );
      })}
      {/* rótulos das grades — fora da faixa para ficarem SEMPRE acima de bloqueios/intervalos */}
      {activeGrades.filter(g => g.label || g.room || g.doctoralia).map((g, i) => (
        <div key={'gh' + i} style={{ position: 'absolute', left: 0, right: 0, top: (toMin(g.start) - startMin) * pxPerMin, height: 0, zIndex: 7 }}>
          <GradeBandHeader g={g} HEADER_H={HEADER_H} />
        </div>
      ))}
      {/* intervalos da grade (mandatórios) — ocultos sob um bloqueio; reaparecem ao excluí-lo */}
      {intervals.flatMap((iv, i) => subtractRanges([toMin(iv.start), toMin(iv.end)], (blocks || []).map(b => [toMin(b.start), toMin(b.end)])).map(([s, e], j) => (
        <IntervalCard key={'iv' + i + '_' + j} top={(s - startMin) * pxPerMin} height={(e - s) * pxPerMin - 2} label={iv.label} start={fmtMin(s)} end={fmtMin(e)} />
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
      {freeOnly && bookable && (gradeBlocks.length
        ? activeGrades.filter(gradeAcceptsRx).flatMap(g => freeGaps(appts, (blocks || []).concat(intervals), toMin(g.start), toMin(g.end)))
        : (rxCond ? [] : (hasCoverage
            ? coverRanges.flatMap(([cs, ce]) => freeGaps(appts, (blocks || []).concat(intervals), cs, ce))
            : freeGaps(appts, (blocks || []).concat(intervals), startMin, endMin)))
      ).map(([s, e], i) => (
        <FreeSlot key={'free' + i} top={(s - startMin) * pxPerMin} height={(e - s) * pxPerMin - 3} s={s} e={e}
          onClick={rect => onSlotClick(colId, s, rect)} />
      ))}

      {/* column not bookable for the current filter — muted, no clicks */}
      {freeOnly && !bookable && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 7, background: 'repeating-linear-gradient(135deg,#f1f3f300,#f1f3f300 10px,#e8eaea66 10px,#e8eaea66 20px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 24 }}>
          <span style={{ fontSize: 11, fontWeight: WT.wEmph, color: WT.muted, background: '#fff', border: `1px solid ${WT.border}`, borderRadius: WT.pill, padding: '3px 10px' }}>Fora do filtro</span>
        </div>
      )}

      {/* draft placeholder — pré-visualização ao vivo do formulário, com cara de card/bloqueio */}
      {draft && draft.colId === colId && (() => {
        const dm = toMin(draft.time); const dur = draft.dur || slotMin;
        const top = (dm - startMin) * pxPerMin;
        const dh = Math.max(dur * pxPerMin - 2, 18);
        const shadow = '0 12px 32px #25282845, 0 3px 10px #25282826';
        if (draft.kind === 'bloqueio') {
          const tall = dh > 34;
          return (
            <div style={{ position: 'absolute', left: 2, right: 2, top, height: dh, zIndex: 8, borderRadius: WT.rS, border: `1px solid ${WT.border}`, background: 'repeating-linear-gradient(135deg,#fafbfb,#fafbfb 7px,#f0f2f2 7px,#f0f2f2 14px)', boxShadow: shadow, display: 'flex', flexDirection: tall ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: tall ? 1 : 6, padding: tall ? '4px 8px' : '0 8px', overflow: 'hidden', pointerEvents: 'none' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, maxWidth: '100%' }}>
                <WIcon name="lock" size={11} color={WT.fg2} style={{ flex: 'none' }} />
                <span style={{ fontSize: 11.5, fontWeight: WT.wEmph, color: WT.fg2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{draft.titulo || 'Bloqueio'}</span>
              </span>
              <span style={{ fontSize: 11, color: WT.muted, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{draft.allDay ? 'Dia inteiro' : `${draft.time}–${fmtMin(dm + dur)}`}</span>
            </div>
          );
        }
        // aparência de card de agendamento (paleta do 1º procedimento, sombra grande)
        const procId = draft.procIds && draft.procIds[0];
        const t = procId ? apptColors({ proc: procId, procs: draft.procIds }) : null;
        const svc = t ? t.bar : WT.accentFill;
        const strong = t ? t.fg : WT.accent;
        const soft = t ? `color-mix(in srgb, ${t.fg} 90%, #fff)` : WT.accent;
        const tiny = dh < 34;
        const procName = procId ? `${(PROCS[procId] || {}).name}${draft.procIds.length > 1 ? ` +${draft.procIds.length - 1}` : ''}` : null;
        return (
          <div style={{ position: 'absolute', top, height: dh, zIndex: 8, left: `calc((100% - ${GUTTER}px) * 0 + 7px)`, width: `calc((100% - ${GUTTER}px) * 1 - 9px)`, borderRadius: WT.rM, background: `color-mix(in srgb, ${svc} 20%, #fff)`, border: `1px solid color-mix(in srgb, ${svc} 42%, #fff)`, outline: draft.kind === 'encaixe' ? `1.5px dashed ${WT.warning}` : 'none', outlineOffset: -2, boxShadow: shadow, display: 'flex', flexDirection: tiny ? 'row' : 'column', alignItems: tiny ? 'center' : 'stretch', gap: tiny ? 5 : 3, padding: tiny ? '0 9px' : '5px 9px', overflow: 'hidden', pointerEvents: 'none', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
              <span style={{ fontSize: tiny ? 11 : 12.5, fontWeight: WT.wHead, color: strong, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{draft.patientName || (draft.kind === 'encaixe' ? 'Novo encaixe' : 'Novo agendamento')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <span style={{ fontSize: 11, color: soft, fontWeight: WT.wEmph, whiteSpace: 'nowrap', flex: 'none', fontVariantNumeric: 'tabular-nums' }}>{draft.time} – {fmtMin(dm + dur)}</span>
              {procName && !tiny && <span style={{ fontSize: 11, color: soft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{procName}</span>}
            </div>
          </div>
        );
      })()}

      {/* hover ghost / drop indicator */}
      {hoverMin != null && !drag.appt && (
        <GhostSlot top={(hoverMin - startMin) * pxPerMin} height={slotDefaultAt(hoverMin) * pxPerMin - 2} gutter={GUTTER} parallel={occupied(hoverMin)}
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
function ColumnGrid({ columns, startMin, endMin, slotMin, pxPerMin, zoom = 1, cardStyle, freeOnly, dateForToday, showPro,
  onSlotClick, onCardOpen, onBlockOpen, onBlockPick, draft, drag, colMinWidth = 200, headerRender }) {
  const gutterW = 56;
  const colW = Math.round(colMinWidth * Math.max(0.7, Math.min(1.2, zoom)));
  const scroller = React.useRef(null);
  const [expanded, setExpanded] = React.useState(false);
  // recorte automático: o dia começa no primeiro horário com conteúdo (grade/agendamento),
  // eliminando o espaço vazio no topo
  const firstContent = React.useMemo(() => {
    let m = null; const c1 = v => { if (v != null && (m == null || v < m)) m = v; };
    columns.forEach(c => { (c.appts || []).forEach(a => { if (a.status !== 'cancelado' && a.start) c1(toMin(a.start)); }); (c.grades || []).forEach(g => c1(toMin(g.start))); (c.blocks || []).forEach(b => c1(toMin(b.start))); });
    return m;
  }, [columns]);
  const trimFull = firstContent == null ? startMin
    : Math.max(startMin, Math.min(Math.floor(firstContent / 60) * 60, endMin - 120));
  const trimStart = expanded ? startMin : trimFull;
  const scrollKey = columns.map(c => c.id + (c.date || '')).join('|');
  React.useEffect(() => { setExpanded(false); if (scroller.current) scroller.current.scrollTop = 0; }, [scrollKey]);
  const hours = []; for (let h = trimStart; h <= endMin; h += 60) hours.push(h);
  return (
    <div ref={scroller} style={{ height: '100%', overflow: 'auto', background: WT.raised }}>
      <div style={{ minWidth: gutterW + columns.length * colW, display: 'flex', flexDirection: 'column' }}>
        {/* sticky header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', background: WT.raised, borderBottom: `1px solid ${WT.border}` }}>
          <div style={{ width: gutterW, flex: 'none', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 4 }}>
            {(expanded || firstContent != null) && trimFull > startMin && (
              <button onClick={() => setExpanded(v => !v)} title={expanded ? `Ocultar horários vazios (${fmtMin(startMin)}–${fmtMin(trimFull)})` : `Mostrar horários anteriores (${fmtMin(startMin)}–${fmtMin(trimFull)})`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 3, height: 20, padding: '0 6px', borderRadius: WT.pill, border: `1px solid ${WT.border}`, background: '#fff', color: WT.muted, fontFamily: WT.font, fontSize: 10.5, cursor: 'pointer', fontVariantNumeric: 'tabular-nums' }}
                onMouseEnter={e => e.currentTarget.style.background = WT.hover} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                <WIcon name={expanded ? 'chevron-down' : 'chevron-up'} size={11} color={WT.muted} />{expanded ? fmtMin(trimFull) : fmtMin(startMin)}
              </button>
            )}
          </div>
          {columns.map((c, i) => (
            <div key={c.id} style={{ flex: 1, minWidth: colW, borderLeft: i ? `1px solid ${WT.borderSub}` : 'none', opacity: (freeOnly && c.bookable === false) ? 0.55 : 1 }}>
              {headerRender ? headerRender(c) : <ColHeader entity={c.entity} sub={c.sub} subParts={c.subParts} occupancy={c.occupancy} />}
            </div>
          ))}
        </div>
        {/* body — 24px reservados no topo para as abas de nome de grade (ancoradas acima do 1º slot) */}
        <div style={{ display: 'flex', paddingTop: 24 }}>
          {/* time gutter */}
          <div style={{ width: gutterW, flex: 'none', position: 'relative', height: (endMin - trimStart) * pxPerMin }}>
            {hours.map(h => (
              <div key={h} style={{ position: 'absolute', top: (h - trimStart) * pxPerMin - 7, right: 8, fontSize: 11, color: WT.muted, fontVariantNumeric: 'tabular-nums' }}>{fmtMin(h)}</div>
            ))}
          </div>
          {columns.map((c, i) => (
            <div key={c.id} style={{ flex: 1, minWidth: colW, borderLeft: i ? `1px solid ${WT.borderSub}` : `1px solid ${WT.borderSub}` }}>
              <ColumnTrack colId={c.id} appts={c.appts} blocks={c.blocks} startMin={trimStart} endMin={endMin}
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
// densidade automática: adapta a altura da hora à altura útil da janela
// (telas 1366×768 / Windows a 125% caem em "compact")
function autoDensity() {
  const h = (typeof window !== 'undefined' && window.innerHeight) || 900;
  return h < 660 ? 'compact' : h < 860 ? 'normal' : 'comfortable';
}
function getGridConf(state) {
  const startMin = toMin(state.timeStart || '07:00');
  const endMin = toMin(state.timeEnd || '20:00');
  const d = (!state.density || state.density === 'auto') ? autoDensity() : state.density;
  const zoom = state.zoom || 1;
  const pxPerMin = { compact: 2.1, normal: 2.6, comfortable: 3.15 }[d] * zoom;
  return { startMin, endMin, slotMin: 5, pxPerMin, zoom };
}

// coluna "reservável" sob os filtros ativos — o que não casa aparece hachurado
function colBookable(col, f, date) { return fitsFilters(col.kind, col.entity, f, date); }

// ---- Seleção de agendas (Dia + Semana) --------------------------------------
// state.sel = { pros, off, extra }
//   pros  null = padrão (todos os que atendem na data) · array = seleção fixada à mão
//   off   médicos desmarcados enquanto há filtros; o override morre quando o médico
//         deixa de casar com os filtros (só edição de filtro poda, troca de data não)
//   extra equipamentos/salas escolhidos à mão — nunca automáticos, sempre lembrados
//         (quando param de casar ficam suspensos: somem da lista, voltam marcados)
// Sem nenhum filtro, sel.pros volta a valer sozinho: é o "estado antes dos filtros".
const selOf = state => state.sel || { pros: null, off: [], extra: [] };
// filtro implícito e não removível: no Dia, quem atende naquele dia; na Semana,
// quem atende em algum dia da semana visível
function worksInContext(proId, state) {
  const days = state.view === 'semana'
    ? dateUtil.weekDaysOf(state.date, state.weekHideWeekend ? 5 : 6)
    : [state.date];
  return days.some(d => gradesFor(proId, d).length > 0);
}
function agendaSections(state) {
  const f = state.filters, d = state.date;
  return [
    { kind: 'pro',   title: 'Médicos',      items: PROS.filter(p => worksInContext(p.id, state) && fitsFilters('pro', p, f, d)) },
    { kind: 'equip', title: 'Equipamentos', items: EQUIP.filter(e => fitsFilters('equip', e, f, d)) },
    { kind: 'room',  title: 'Salas',        items: ROOMS.filter(r => fitsFilters('room', r, f, d)) },
  ];
}
// overrides só sobrevivem enquanto o médico continua casando com os filtros
function prunedOff(off, filters, date) {
  if (!hasAgendaFilters(filters)) return [];
  return (off || []).filter(id => { const p = PROS.find(x => x.id === id); return p && fitsFilters('pro', p, filters, date); });
}

function agendaSelection(state, set) {
  const sections = agendaSections(state);
  const sel = selOf(state);
  const filtered = hasAgendaFilters(state.filters);
  const listedPros = sections[0].items.map(p => p.id);
  // com filtro: tudo que casa, menos os overrides · sem filtro: a seleção fixada
  const proIds = filtered
    ? listedPros.filter(id => !(sel.off || []).includes(id))
    : (sel.pros == null ? listedPros : listedPros.filter(id => sel.pros.includes(id)));
  const isListed = res => sections.some(s => s.kind === res.kind && s.items.some(it => it.id === res.id));
  const extra = (sel.extra || []).filter(r => r.kind !== 'pro' && isListed(r));
  const selected = [...proIds.map(id => ({ kind: 'pro', id })), ...extra];
  const isOn = res => selected.some(r => r.kind === res.kind && r.id === res.id);

  const toggle = res => set(s => {
    const cur = selOf(s);
    if (res.kind !== 'pro') {
      const on = (cur.extra || []).some(r => r.kind === res.kind && r.id === res.id);
      return { sel: { ...cur, extra: on ? cur.extra.filter(r => !(r.kind === res.kind && r.id === res.id)) : [...(cur.extra || []), res] } };
    }
    if (hasAgendaFilters(s.filters)) {   // modo filtrado → a edição vira override
      const off = cur.off || [];
      return { sel: { ...cur, off: off.includes(res.id) ? off.filter(id => id !== res.id) : [...off, res.id] } };
    }
    const base = cur.pros == null ? listedPros : cur.pros;  // editar fixa a seleção
    return { sel: { ...cur, pros: base.includes(res.id) ? base.filter(id => id !== res.id) : [...base, res.id] } };
  });

  const setFilters = next => set(s => ({ filters: next, sel: { ...selOf(s), off: prunedOff(selOf(s).off, next, s.date) } }));
  const filterApi = {
    toggleValue: (key, value) => {
      const cur = state.filters[key] || [];
      setFilters({ ...state.filters, [key]: cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value] });
    },
    clearKey: key => setFilters({ ...state.filters, [key]: [] }),
    clearAll: () => set(s => ({ filters: emptyFilters(), sel: { ...selOf(s), off: [] } })),
  };

  const add = res => { if (!isOn(res)) toggle(res); };
  const remove = res => { if (isOn(res)) toggle(res); };
  return { selected, sections, isOn, toggle, add, remove, filtered, filters: state.filters, filterApi, date: state.date };
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
          ? <EmptyState icon="layout-grid" title="Nenhuma agenda selecionada" hint="Marque profissionais, equipamentos ou salas em “Agendas”, na barra lateral." />
          : <ColumnGrid columns={columns} {...conf} cardStyle={state.cardStyle} freeOnly={hf} dateForToday={state.date === TODAY ? state.date : null}
              onSlotClick={onSlotClick} onCardOpen={onCardOpen} onBlockOpen={onBlockOpen} onBlockPick={onBlockPick} draft={draft} drag={drag} colMinWidth={columns.length <= 2 ? 340 : 210} />}
      </div>
    </div>
  );
}

function WeekView({ state, set, appts, blocks, drag, onSlotClick, onCardOpen, onBlockOpen, onBlockPick, draft }) {
  const conf = getGridConf(state);
  // mesma seleção do Dia (agendaSelection) — aqui só muda o eixo das colunas
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
  return { id: `${res.kind}:${res.id}`, date, appts: ca, blocks: cb, entity: { ...meta, kindIcon: res.kind === 'pro' ? 'user-round' : res.kind === 'equip' ? 'activity' : 'door-open' }, sub: kindLabel ? `${kindLabel} · ${meta.spec}` : `${specLabel(meta)} · ${roomSub}`,
    subParts: kindLabel
      ? [{ icon: res.kind === 'equip' ? 'activity' : 'door-open', text: kindLabel }, { icon: 'stethoscope', text: meta.spec }]
      : [{ icon: 'stethoscope', text: specLabel(meta) }, { icon: 'door-open', text: roomSub }],
    kind: res.kind, showPro: res.kind !== 'pro',
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
          <WProfileAvatar src={it.photo} size={24} icon={kind === 'pro' ? 'user-round' : kind === 'equip' ? 'activity' : 'door-open'} />
          <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontSize: 13, color: WT.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.short || it.name}</span><span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: WT.muted, minWidth: 0 }}><WIcon name={kind === 'pro' ? 'stethoscope' : 'tag'} size={10} color={WT.muted} style={{ flex: 'none' }} /><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</span></span></span>
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

// ---- Menu de filtros do seletor de agendas ---------------------------------
// Segue o dropdown do design: popover branco, busca sem moldura + divisória,
// itens de 32px com raio 8 e realce neutro no hover. Nada de cor de destaque:
// o menu é uma lista, não um estado.
const FMENU_W = 228;

function FilterSearch({ value, onChange, placeholder }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 8px', margin: 8, flex: 'none' }}>
        <WIcon name="search" size={16} color={WT.muted} />
        <input autoFocus value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ border: 'none', outline: 'none', font: `${WT.wBody} 14px ${WT.font}`, flex: 1, background: 'transparent', color: WT.fg, minWidth: 0 }} />
      </div>
      <div style={{ height: 1, background: WT.borderSub, flex: 'none' }} />
    </>
  );
}

// linha do menu (categoria ou valor) — item de dropdown do design system
function FilterMenuRow({ icon, label, trailing, lead, on, onClick, onHover }) {
  return (
    <button onClick={onClick} onMouseEnter={e => { e.currentTarget.style.background = WT.hover; if (onHover) onHover(e); }}
      onMouseLeave={e => { e.currentTarget.style.background = on ? WT.hover : 'transparent'; }}
      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', height: 32, padding: '0 8px', borderRadius: WT.rM,
        border: 'none', background: on ? WT.hover : 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: WT.font, fontSize: 14, fontWeight: WT.wBody, color: WT.fg }}>
      {lead}
      {icon && <WIcon name={icon} size={16} color={WT.muted} />}
      <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      {trailing}
    </button>
  );
}

// valores de uma categoria: marcados com um check à esquerda (não checkbox —
// aqui é menu, a caixa fica na lista de agendas, onde a seleção é o assunto)
function FilterValueList({ cat, selected, api }) {
  const [q, setQ] = React.useState('');
  const ql = normq(q.trim());
  const opts = cat.values().filter(o => !ql || normq(o.label).includes(ql));
  return (
    <>
      <FilterSearch value={q} onChange={setQ} placeholder={`Filtrar ${cat.label.toLowerCase()}`} />
      <div style={{ maxHeight: 288, overflow: 'auto', padding: 8 }}>
        {opts.length === 0
          ? <div style={{ padding: '12px 8px', fontSize: 13, color: WT.muted }}>Nada encontrado.</div>
          : opts.map(o => (
              <FilterMenuRow key={o.value} label={o.label} onClick={() => api.toggleValue(cat.key, o.value)}
                lead={<span style={{ width: 16, flex: 'none', display: 'inline-flex', justifyContent: 'center' }}>
                  {selected.includes(o.value) && <WIcon name="check" size={14} color={WT.fg2} />}
                </span>} />
            ))}
      </div>
    </>
  );
}

// menu raiz: categorias (submenu abre no HOVER, sobrepondo 8px) ou, ao buscar,
// os VALORES que casam agrupados por categoria
function AgendaFilterMenu({ anchorRect, onClose, filters, api }) {
  const cats = agendaFilterCats();
  const [q, setQ] = React.useState('');
  const [sub, setSub] = React.useState(null);   // { key, rect }
  const ql = normq(q.trim());
  const groups = ql
    ? cats.map(c => ({ cat: c, items: c.values().filter(o => normq(o.label).includes(ql)) })).filter(g => g.items.length)
    : [];
  const subCat = sub && cats.find(c => c.key === sub.key);
  return (
    <WPopover anchorRect={anchorRect} onClose={onClose} width={FMENU_W}>
      <FilterSearch value={q} onChange={v => { setQ(v); setSub(null); }} placeholder="Filtrar" />
      <div style={{ maxHeight: 320, overflow: 'auto', padding: 8 }}>
        {ql
          ? (groups.length === 0
              ? <div style={{ padding: '12px 8px', fontSize: 13, color: WT.muted }}>Nada encontrado para “{q}”.</div>
              : groups.map(g => (
                  <div key={g.cat.key}>
                    <div style={{ padding: '8px 8px 4px', fontSize: 11, fontWeight: WT.wEmph, color: WT.muted, textTransform: 'uppercase', letterSpacing: '.05em' }}>{g.cat.label}</div>
                    {g.items.map(o => (
                      <FilterMenuRow key={o.value} label={o.label} onClick={() => api.toggleValue(g.cat.key, o.value)}
                        lead={<span style={{ width: 16, flex: 'none', display: 'inline-flex', justifyContent: 'center' }}>
                          {(filters[g.cat.key] || []).includes(o.value) && <WIcon name="check" size={14} color={WT.fg2} />}
                        </span>} />
                    ))}
                  </div>
                )))
          : cats.map(c => (
              <FilterMenuRow key={c.key} icon={c.icon} label={c.label} on={sub && sub.key === c.key}
                trailing={<WIcon name="chevron-right" size={12} color={WT.muted} />}
                onHover={e => setSub({ key: c.key, rect: e.currentTarget.getBoundingClientRect() })}
                onClick={e => setSub({ key: c.key, rect: e.currentTarget.getBoundingClientRect() })} />
            ))}
      </div>
      {/* submenu dentro do popover raiz (clique nele não fecha o pai) · offset 0
          encosta na borda interna → os dois se sobrepõem 8px, como no design */}
      {subCat && (
        <WPopover anchorRect={sub.rect} onClose={() => setSub(null)} width={FMENU_W} offset={0}>
          <FilterValueList cat={subCat} selected={filters[subCat.key] || []} api={api} />
        </WPopover>
      )}
    </WPopover>
  );
}

// chips dos filtros ativos — "Convênio: Unimed ×" · clique edita, × limpa
function AgendaFilterChips({ filters, api, onEdit }) {
  const cats = agendaFilterCats().filter(c => (filters[c.key] || []).length);
  if (!cats.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {cats.map(c => {
        const vals = filters[c.key];
        const one = vals.length === 1 ? (c.values().find(o => o.value === vals[0]) || {}).label : null;
        return (
          <span key={c.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, maxWidth: '100%', height: 24, padding: '0 8px', borderRadius: WT.rM, border: `1px solid ${WT.border}`, background: '#fff' }}>
            <button onClick={e => onEdit(c.key, e.currentTarget.getBoundingClientRect())} title="Editar filtro"
              style={{ display: 'block', minWidth: 0, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: WT.font, fontSize: 12, fontWeight: WT.wBody, color: WT.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {c.label}: <span style={{ fontWeight: WT.wEmph }}>{one || `${vals.length} selecionados`}</span>
            </button>
            <button onClick={() => api.clearKey(c.key)} title={`Remover filtro de ${c.label.toLowerCase()}`}
              style={{ flex: 'none', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'inline-flex' }}>
              <WIcon name="x" size={12} color={WT.fg2} />
            </button>
          </span>
        );
      })}
    </div>
  );
}

// seletor de agendas da barra lateral: filtros + seções por tipo de recurso
function AgendaSidebarPanel({ sel }) {
  const { sections, isOn, toggle, filters, filterApi, filtered } = sel;
  const [menu, setMenu] = React.useState(null);   // popover raiz (botão de filtro)
  const [catPop, setCatPop] = React.useState(null); // popover de UMA categoria (chip)
  const [shut, setShut] = React.useState({});     // seções recolhidas
  const cats = agendaFilterCats();
  const catPopCat = catPop && cats.find(c => c.key === catPop.key);
  // sem médico não há agenda: equipamento e sala sozinhos não têm o que mostrar
  const noPros = sections[0].items.length === 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 0 0 4px' }}>
        <span style={{ flex: 1, fontSize: 11, fontWeight: WT.wEmph, color: WT.fg2, textTransform: 'uppercase', letterSpacing: '.05em' }}>Agendas</span>
        <WIconButton name="list-filter" title="Filtrar agendas" dim={28} size={16} active={!!menu}
          onClick={e => setMenu({ rect: e.currentTarget.getBoundingClientRect() })} />
      </div>

      <AgendaFilterChips filters={filters} api={filterApi} onEdit={(key, rect) => setCatPop({ key, rect })} />

      {noPros
        ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, padding: '2px 4px 4px' }}>
            <span style={{ fontSize: 12.5, color: WT.muted }}>
              {filtered ? 'Nenhuma agenda corresponde aos filtros.' : 'Ninguém atende nesta data.'}
            </span>
            {filtered && <WButton variant="default" size="s" leadingIcon="filter-x" label="Limpar filtros" onClick={filterApi.clearAll} />}
          </div>
        : sections.filter(sec => sec.items.length || filtered).map((sec, i) => {
            const closed = !!shut[sec.kind];
            return (
              // 24 + o gap 8 do container = 32px entre seções: tipos de recurso
              // diferentes precisam ler como blocos separados, não como uma lista só
              <div key={sec.kind} style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: i ? 24 : 0 }}>
                <button onClick={() => setShut(s => ({ ...s, [sec.kind]: !s[sec.kind] }))}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '3px 4px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: WT.font, borderRadius: WT.rS }}
                  onMouseEnter={e => e.currentTarget.style.background = WT.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ flex: 1, textAlign: 'left', fontSize: 12, fontWeight: WT.wEmph, color: WT.fg2 }}>{sec.title}</span>
                  <WIcon name={closed ? 'chevron-down' : 'chevron-up'} size={14} color={WT.muted} />
                </button>
                {!closed && (sec.items.length
                  ? sec.items.map(it => {
                      const res = { kind: sec.kind, id: it.id }; const on = isOn(res);
                      return (
                        <button key={it.id} onClick={() => toggle(res)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '5px 6px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: WT.font, fontSize: 13, color: WT.fg, borderRadius: WT.rS }}
                          onMouseEnter={e => e.currentTarget.style.background = WT.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <span style={{ width: 15, height: 15, borderRadius: WT.rS, flex: 'none', border: `1.5px solid ${on ? WT.accentFill : WT.borderHover}`, background: on ? WT.accentFill : '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            {on && <WIcon name="check" size={11} color="#fff" strokeWidth={3} />}
                          </span>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', flex: 'none', background: it.color || WT.muted }} />
                          <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.short || it.name}</span>
                        </button>
                      );
                    })
                  : <span style={{ padding: '3px 6px 6px', fontSize: 12, color: WT.muted }}>Nenhum resultado.</span>)}
              </div>
            );
          })}

      {menu && <AgendaFilterMenu anchorRect={menu.rect} filters={filters} api={filterApi} onClose={() => setMenu(null)} />}
      {catPopCat && (
        <WPopover anchorRect={catPop.rect} onClose={() => setCatPop(null)} width={FMENU_W}>
          <FilterValueList cat={catPopCat} selected={filters[catPopCat.key] || []} api={filterApi} />
        </WPopover>
      )}
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
    return { id: e.id, date: state.date, appts: ca, blocks: cb, entity: { ...e, kindIcon: 'activity' }, sub: e.spec, subParts: [{ icon: 'activity', text: 'Equipamento' }, { icon: 'stethoscope', text: e.spec }], showPro: true, bookable: colBookable({ kind: 'equip', entity: e }, state.filters), occupancy: occupancyOf(ca, conf.startMin, conf.endMin, cb) };
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
  const units = state.filters.unit || [];
  const rooms = ROOMS.filter(r => !units.length || units.includes(r.unit));
  const columns = rooms.map(r => {
    const ca = appts.filter(a => a.date === state.date && effectiveRoom(a) === r.name);
    // bloqueios da clínica inteira (feriado) valem para todas as salas
    const cb = blocks.filter(b => blockOnDate(b, state.date) && b.scope === 'clinica');
    return { id: `room:${r.id}`, date: state.date, appts: ca, blocks: cb, entity: { ...r, kindIcon: 'door-open' }, sub: `Sala · ${r.spec}`, subParts: [{ icon: 'door-open', text: 'Sala' }, { icon: 'stethoscope', text: r.spec }], showPro: true,
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
      <StatusSmartTag a={a} size="s" />
      <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14, color: WT.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 'none', maxWidth: '55%' }}>
          <span style={{ color: WT.fg2 }}>{pro.short || pro.name || '—'}</span> · <strong style={{ fontWeight: WT.wEmph }}>{pt.name}</strong>
        </span>
        <ProcTag a={a} />
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
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: WT.fg2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{ flex: 'none', fontVariantNumeric: 'tabular-nums' }}>{a.start}</span>
                        <span style={{ flex: 'none', fontWeight: WT.wEmph, color: WT.fg }}>{(pt.name || '').split(' ')[0]}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', height: 15, background: t.tint, borderLeft: `3px solid ${t.bar}`, borderRadius: '2px 4px 4px 2px', padding: '0 5px 0 4px', color: t.fg, fontWeight: WT.wEmph, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{apptProcName(a)}</span>
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

Object.assign(window, { NOW_MIN, filterAppts, visiblePros, occupancyOf, OccupancyRing, ColumnGrid, ColumnTrack, ColHeader, EmptyState, getGridConf, DayView, WeekView, MultipleView, EquipmentView, RoomView, ProgramacaoView, MonthView, ResourceBar, ResourcePicker, resourceMeta, agendaSelection, AgendaSidebarPanel, AGENDA_FILTERS, agendaFilterCats, emptyFilters, hasAgendaFilters, fitsFilters });
