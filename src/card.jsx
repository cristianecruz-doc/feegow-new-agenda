/* ============================================================================
   Feegow — New Agenda · Appointment cards, blocks, ghost slots, context card
   Card styles: typebar (default) · filled · statusbar  (driven by Tweaks)
   ============================================================================ */

// ---- Overlap lane layout (handles fit-ins / double-booking) -----------------
function laneLayout(items) {
  const evs = items.map(a => ({ a, s: toMin(a.start), e: toMin(a.start) + a.dur }))
    .sort((x, y) => x.s - y.s || x.e - y.e);
  let cluster = [], clusterEnd = -1; const result = [];
  const flush = () => {
    const laneEnds = [];
    cluster.forEach(ev => {
      let lane = laneEnds.findIndex(end => end <= ev.s);
      if (lane === -1) { lane = laneEnds.length; laneEnds.push(ev.e); } else laneEnds[lane] = ev.e;
      ev.lane = lane;
    });
    const lanes = laneEnds.length;
    cluster.forEach(ev => result.push({ ...ev, lanes }));
    cluster = [];
  };
  evs.forEach(ev => {
    if (cluster.length && ev.s >= clusterEnd) { flush(); clusterEnd = -1; }
    cluster.push(ev); clusterEnd = Math.max(clusterEnd, ev.e);
  });
  if (cluster.length) flush();
  return result;
}

const apptType = a => (PROCS[a.proc] || {}).type || 'consulta';
const apptProcName = a => apptProcLabel(a);

// ---- Sinalizadores (1ª vez / encaixe / prioridade) -------------------------
const FLAG_VIOLET = '#7c3aed';
function FlagPill({ icon, label, color, compact }) {
  return (
    <span title={label} style={{
      display: 'inline-flex', alignItems: 'center', gap: 3, flex: 'none',
      height: 15, padding: compact ? '0 4px' : '0 6px', borderRadius: WT.pill,
      background: '#fff', color, fontSize: 10, fontWeight: WT.wHead,
      border: `1px solid ${color}`, lineHeight: 1, whiteSpace: 'nowrap',
    }}>
      <WIcon name={icon} size={10} color={color} strokeWidth={2.5} />{!compact && label}
    </span>
  );
}
function apptFlags(a, pt) {
  const prefs = window.__cardFlags || {};
  const out = [];
  if (prefs.newPatient !== false && pt && pt.firstVisit) out.push({ key: 'fv', icon: 'sparkles', label: '1ª vez', color: WT.accent });
  if (a.fitIn) out.push({ key: 'fit', icon: 'git-merge', label: 'Encaixe', color: WT.warning });
  if (a.paid) out.push({ key: 'paid', icon: 'banknote', label: 'Pago', color: WT.success });
  if (prefs.priority !== false && pt && pt.priority && PRIORITIES[pt.priority]) {
    const p = PRIORITIES[pt.priority];
    out.push({ key: 'pr', icon: p.icon, label: p.label, color: FLAG_VIOLET });
  }
  return out;
}

// ---- Smart status tag (clicável — troca o status pelo próprio card) --------
function StatusSmartTag({ a, size = 'm', onOpenMenu }) {
  const st = STATUS[a.status] || STATUS.marcado;
  const ref = React.useRef(null);
  const [open, setOpen] = React.useState(false);
  const [rect, setRect] = React.useState(null);
  const toggle = e => {
    e.stopPropagation(); e.preventDefault();
    if (ref.current) setRect(ref.current.getBoundingClientRect());
    setOpen(o => !o);
  };
  const choose = (e, key) => { e.stopPropagation(); e.preventDefault(); setOpen(false); if (window.__onSetStatus) window.__onSetStatus(a, key); };
  const h = size === 's' ? 17 : 21;
  return (
    <span ref={ref} role="button" tabIndex={0} onClick={toggle} title={`Status: ${st.label} · clique para alterar`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 1, flex: 'none', height: h, padding: size === 's' ? '0 3px 0 4px' : '0 4px 0 6px', borderRadius: WT.pill, background: st.bg, color: st.fg, border: `1px solid ${st.fg}2e`, lineHeight: 1, whiteSpace: 'nowrap', cursor: 'pointer' }}>
      <WIcon name={st.icon} size={size === 's' ? 12 : 14} color={st.fg} strokeWidth={2.2} style={{ flex: 'none' }} />
      <WIcon name="chevron-down" size={size === 's' ? 10 : 12} color={st.fg} style={{ flex: 'none', opacity: 0.85 }} />
      {open && ReactDOM.createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 4000 }} onMouseDown={e => { e.stopPropagation(); setOpen(false); }} onClick={e => e.stopPropagation()}>
          <div onMouseDown={e => e.stopPropagation()} style={{ position: 'fixed', top: Math.min((rect ? rect.bottom : 0) + 5, window.innerHeight - 320), left: Math.min(rect ? rect.left : 0, window.innerWidth - 210), width: 196, maxHeight: 316, overflow: 'auto', background: WT.raised, border: `1px solid ${WT.border}`, borderRadius: WT.rM, boxShadow: WT.shPopout, padding: 5, fontFamily: WT.font }}>
            <div style={{ fontSize: 10.5, fontWeight: WT.wHead, color: WT.muted, textTransform: 'uppercase', letterSpacing: '.04em', padding: '4px 8px 6px' }}>Alterar status</div>
            {STATUS_ORDER.map(key => {
              const s = STATUS[key]; const active = key === a.status;
              return (
                <button key={key} onClick={e => choose(e, key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '7px 8px', border: 'none', borderRadius: WT.rS, background: active ? WT.hover : 'transparent', cursor: 'pointer', fontFamily: WT.font }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = WT.hover; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                  <WIcon name={s.icon} size={14} color={s.fg} strokeWidth={2.2} style={{ flex: 'none' }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: active ? WT.wHead : WT.wBody, color: WT.fg }}>{s.label}</span>
                  {active && <WIcon name="check" size={14} color={WT.accent} style={{ flex: 'none' }} />}
                </button>
              );
            })}
          </div>
        </div>, document.body)}
    </span>
  );
}

// pequena etiqueta do procedimento — barrinha colorida à esquerda + nome
function ProcTag({ a, compact }) {
  const t = apptColors(a);
  return (
    <span title={apptProcName(a)} style={{ display: 'inline-flex', alignItems: 'center', maxWidth: '100%', height: compact ? 16 : 19, background: t.tint, borderLeft: `3px solid ${t.bar}`, borderRadius: '3px 4px 4px 3px', paddingLeft: 6, paddingRight: 7, overflow: 'hidden' }}>
      <span style={{ fontSize: compact ? 10.5 : 11.5, fontWeight: WT.wEmph, color: t.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{apptProcName(a)}</span>
    </span>
  );
}

// ---- Appointment card -------------------------------------------------------
function AppointmentCard({ ev, top, height, leftPct, widthPct, gutter = 0, cardStyle, showPro, conflict, onOpen, onDragStart, onDragEnd, dragging, dimmed }) {
  const { a } = ev;
  const t = apptColors(a); const st = STATUS[a.status];
  const pt = patientById(a.pt) || { name: a.pt };
  const pro = PROS.find(p => p.id === a.pro);
  const proBadge = showPro && pro ? (
    <span title={pro.name} style={{ width: 17, height: 17, borderRadius: '50%', flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8.5, fontWeight: WT.wHead, background: pro.color, color: '#fff', letterSpacing: '.02em' }}>{pro.initials}</span>
  ) : null;
  const cancelled = a.status === 'cancelado';
  const flags = apptFlags(a, pt);
  const ref = React.useRef(null);
  const [hover, setHover] = React.useState(false);

  const bg = cardStyle === 'filled' ? (t.tint) : '#fff';
  const border = conflict ? WT.borderDanger : (a.fitIn ? 'transparent' : WT.border);
  const nameColor = conflict ? WT.danger : WT.fg;
  const narrow = widthPct != null && widthPct < 99; // dividindo a coluna com agendamentos paralelos

  const tiny = height < 34;                 // uma linha (bem curto)
  const mid = !tiny && height < 66;         // duas linhas — ainda com os 5 campos
  const start = toMin(a.start);
  const timeRange = `${fmtMin(start)} – ${fmtMin(start + a.dur)}`;
  const room = roomShort(effectiveRoom(a));
  const showConv = !window.__mvp;
  const conv = a.plano ? a.conv : (a.price ? 'Particular' : 'Particular');
  const convTag = showConv ? (
    <span title={`Convênio · ${conv}`} style={{ flex: 'none', maxWidth: '46%', fontSize: 10.5, fontWeight: WT.wEmph, color: WT.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv}</span>
  ) : null;
  const open = () => onOpen(a, ref.current.getBoundingClientRect());

  return (
    <button
      ref={ref}
      draggable={!cancelled}
      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; onDragStart(a); }}
      onDragEnd={onDragEnd}
      onClick={open}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'absolute', top, height: Math.max(height, 20),
        left: `calc((100% - ${gutter}px) * ${leftPct / 100} + 7px)`, width: `calc((100% - ${gutter}px) * ${widthPct / 100} - 9px)`,
        textAlign: 'left', padding: tiny ? '3px 8px' : '5px 9px', boxSizing: 'border-box',
        background: (dragging || conflict) ? '#fff' : bg, opacity: dimmed ? 0.4 : (dragging ? 0.5 : 1),
        zIndex: conflict ? 9 : 4,
        border: `1px solid ${border}`,
        borderRadius: WT.rM, cursor: 'grab', overflow: 'hidden',
        boxShadow: conflict ? `0 0 0 2px ${WT.borderDanger}66, ${WT.shPopout}` : (hover ? WT.shPopout : WT.shEmphasis), transition: 'box-shadow .12s, opacity .12s',
        outline: a.fitIn ? `1.5px dashed ${WT.warning}` : 'none', outlineOffset: -2,
        display: 'flex', flexDirection: 'column', gap: tiny ? 0 : 3, justifyContent: 'flex-start', fontFamily: WT.font,
      }}>
      {tiny ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, height: '100%', minWidth: 0 }}>
          {conflict ? <WIcon name="alert-triangle" size={12} color={WT.danger} style={{ flex: 'none' }} /> : <><StatusSmartTag a={a} size="s" />{proBadge}</>}
          <span style={{ fontSize: 11, fontWeight: WT.wEmph, color: nameColor, flex: 'none', fontVariantNumeric: 'tabular-nums' }}>{fmtMin(start)}</span>
          <span style={{ fontSize: 11, fontWeight: WT.wEmph, color: nameColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 'none', maxWidth: '48%', textDecoration: cancelled ? 'line-through' : 'none' }}>{pt.name}</span>
          <span style={{ fontSize: 11, color: WT.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>· {apptProcName(a)}{showConv ? ` · ${conv}` : ''}</span>
          {flags.map(f => <FlagPill key={f.key} icon={f.icon} label={f.label} color={f.color} compact />)}
        </div>
      ) : mid ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, flex: 'none' }}>
            <StatusSmartTag a={a} size="s" />
            {proBadge}
            {conflict && <WIcon name="alert-triangle" size={12} color={WT.danger} style={{ flex: 'none' }} />}
            <span style={{ fontSize: 12, fontWeight: WT.wHead, color: nameColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0, textDecoration: cancelled ? 'line-through' : 'none' }}>{pt.name}</span>
            {flags.map(f => <FlagPill key={f.key} icon={f.icon} label={f.label} color={f.color} compact />)}
            {showConv && <span style={{ fontSize: 10.5, fontWeight: WT.wEmph, color: WT.muted, whiteSpace: 'nowrap', flex: 'none', maxWidth: '40%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 'none' }}>
            <span style={{ fontSize: 11, color: WT.fg2, fontWeight: WT.wEmph, whiteSpace: 'nowrap', flex: 'none', fontVariantNumeric: 'tabular-nums' }}>{timeRange}</span>
            <div style={{ minWidth: 0, flex: 1, display: 'flex' }}><ProcTag a={a} compact /></div>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 'none' }}>
            <StatusSmartTag a={a} size={height >= 78 ? 'm' : 's'} />
            <span style={{ flex: 1 }} />
            {conflict && <WIcon name="alert-triangle" size={13} color={WT.danger} style={{ flex: 'none' }} />}
            {convTag}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, flex: 'none' }}>
            {proBadge}
            <span style={{ fontSize: 12.5, fontWeight: WT.wHead, color: nameColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0, textDecoration: cancelled ? 'line-through' : 'none' }}>{pt.name}</span>
            {flags.map(f => <FlagPill key={f.key} icon={f.icon} label={f.label} color={f.color} compact={flags.length > 1} />)}
            {a.note && <WIcon name="sticky-note" size={11} color={WT.warning} style={{ flex: 'none' }} />}
          </div>
          {narrow ? (
            <>
              <div style={{ fontSize: 11, color: WT.fg2, fontWeight: WT.wEmph, whiteSpace: 'nowrap', flex: 'none', fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis' }}>{timeRange}</div>
              <div style={{ display: 'flex', minWidth: 0, flex: 'none' }}><ProcTag a={a} compact /></div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 'none' }}>
              <span style={{ fontSize: 11, color: WT.fg2, fontWeight: WT.wEmph, whiteSpace: 'nowrap', flex: 'none', fontVariantNumeric: 'tabular-nums' }}>{timeRange}</span>
              <div style={{ minWidth: 0, flex: 1, display: 'flex' }}><ProcTag a={a} compact /></div>
            </div>
          )}
        </>
      )}
    </button>
  );
}

// ---- Block (out-of-office — red hatch, prohibit icon) -----------------------
function BlockCard({ block, top, height, onOpen }) {
  const rec = recurLabel(block);
  const tall = height > 30;
  return (
    <button onClick={() => onOpen && onOpen(block)} title={`Bloqueio · ${block.titulo || ''} ${block.start}–${block.end}${rec ? ' · ' + rec : ''}`} style={{
      position: 'absolute', top, height: Math.max(height, 16), left: 2, right: 2, textAlign: 'left',
      border: 'none', borderLeft: '3px solid #c0392b', borderRadius: WT.rM, cursor: 'pointer', overflow: 'hidden', zIndex: 3,
      background: '#f6dcd7',
      display: 'flex', flexDirection: tall ? 'column' : 'row', alignItems: tall ? 'flex-start' : 'center', justifyContent: 'center', gap: tall ? 1 : 6, padding: tall ? '4px 8px' : '0 8px', fontFamily: WT.font,
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, maxWidth: '100%' }}>
        <WIcon name="ban" size={13} color="#a4271c" style={{ flex: 'none' }} />
        <span style={{ fontSize: 12, fontWeight: WT.wEmph, color: '#a4271c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{block.titulo || 'Bloqueio'}</span>
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#a4271ccc', whiteSpace: 'nowrap' }}>
        {block.allDay ? 'Dia inteiro' : `${block.start}–${block.end}`}
        {rec && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '0 5px', height: 14, borderRadius: WT.pill, background: '#c0392b22', color: '#a4271c', fontWeight: WT.wEmph, fontSize: 10 }}><WIcon name="repeat" size={9} color="#a4271c" />{rec}</span>}
      </span>
    </button>
  );
}

// ---- Grouped blocks (semanal multi-recurso): vários bloqueios sobrepostos → um bloco ----
function BlockGroupCard({ group, top, height, onOpen }) {
  const tall = height > 34;
  const n = group.blocks.length;
  return (
    <button onClick={onOpen} title={`${n} bloqueios neste horário — clique para escolher qual editar`} style={{
      position: 'absolute', top, height: Math.max(height, 16), left: 2, right: 2, textAlign: 'left',
      border: 'none', borderLeft: '3px solid #c0392b', borderRadius: WT.rM, cursor: 'pointer', overflow: 'hidden', zIndex: 3,
      background: '#f6dcd7',
      display: 'flex', flexDirection: tall ? 'column' : 'row', alignItems: tall ? 'flex-start' : 'center', justifyContent: 'center', gap: tall ? 2 : 6, padding: tall ? '5px 8px' : '0 8px', fontFamily: WT.font,
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, maxWidth: '100%' }}>
        <WIcon name="layers" size={13} color="#a4271c" style={{ flex: 'none' }} />
        <span style={{ fontSize: 12, fontWeight: WT.wHead, color: '#a4271c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n} bloqueios</span>
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#a4271ccc', whiteSpace: 'nowrap' }}>
        {fmtMin(group.s)}–{fmtMin(group.e)}
      </span>
    </button>
  );
}

// ---- Interval (grade break — mandatory, same concept as block, orange) ------
function IntervalCard({ top, height }) {
  return (
    <div title="Intervalo (mandatório)" style={{
      position: 'absolute', top, height: Math.max(height, 16), left: 2, right: 2,
      border: 'none', borderLeft: '3px solid #d99a2e', borderRadius: WT.rM, cursor: 'not-allowed', overflow: 'hidden',
      background: '#fbe6c4',
      display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', fontFamily: WT.font,
    }}>
      <WIcon name="coffee" size={13} color="#a9701a" />
      {height > 16 && <span style={{ fontSize: 12, fontWeight: WT.wEmph, color: '#8a5a14', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Intervalo</span>}
    </div>
  );
}

// ---- Free-slot highlight ("somente horários livres") -----------------------
function FreeSlot({ top, height, s, e, onClick }) {
  const [hover, setHover] = React.useState(false);
  const ref = React.useRef(null);
  const tall = height >= 40;
  return (
    <button ref={ref} onClick={() => onClick(ref.current.getBoundingClientRect())}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'absolute', top, height: Math.max(height, 16), left: 3, right: 3, zIndex: 3, textAlign: 'left',
        background: hover ? WT.accentSoftHover : WT.accentSoft, border: `1.5px solid ${WT.borderAccent}`,
        borderRadius: WT.rM, cursor: 'pointer', overflow: 'hidden', padding: tall ? '6px 9px' : '0 9px',
        display: 'flex', flexDirection: tall ? 'column' : 'row', alignItems: tall ? 'flex-start' : 'center', gap: tall ? 2 : 6,
        boxShadow: '0 1px 3px #006a5922', fontFamily: WT.font,
      }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: WT.wHead, color: WT.accent }}>
        <WIcon name="plus" size={13} color={WT.accent} /> Livre
      </span>
      <span style={{ fontSize: 11, color: WT.accent, opacity: 0.85, fontVariantNumeric: 'tabular-nums' }}>{fmtMin(s)}–{fmtMin(e)} · {e - s} min</span>
    </button>
  );
}

// ---- Ghost (empty) slot -----------------------------------------------------
function GhostSlot({ top, height, onClick, dropping, parallel, gutter = 0 }) {
  const [hover, setHover] = React.useState(false);
  if (parallel) {
    // slot já ocupado — oferece criar em paralelo (mesmo horário) ocupando toda a linha livre.
    // zIndex baixo: os cards existentes (z4) cobrem onde estão; o realce aparece no espaço livre.
    return (
      <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        title="Criar agendamento no mesmo horário (paralelo)"
        style={{
          position: 'absolute', top, height, right: 2, width: Math.max(gutter, 20), borderRadius: WT.rM, cursor: 'pointer', zIndex: 5,
          background: hover ? WT.accentSoftHover : WT.accentSoft, border: `1px dashed ${WT.borderAccent}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .1s',
        }}>
        <WIcon name="plus" size={14} color={WT.accent} />
      </div>
    );
  }
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'absolute', top, height, left: 2, right: gutter + 2, borderRadius: WT.rM, cursor: 'pointer',
        background: dropping ? WT.accentSoft : (hover ? WT.accentSoft : 'transparent'),
        border: dropping ? `1.5px dashed ${WT.borderAccent}` : (hover ? `1px dashed ${WT.borderAccent}` : '1px solid transparent'),
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .1s',
      }}>
      {(hover || dropping) && <WIcon name="plus" size={15} color={WT.accent} />}
    </div>
  );
}

// ---- Context card (M6) ------------------------------------------------------
function ContextCard({ a, onClose, anchorRect, onCheckin, onReschedule, onCancel, onOpen, onRetorno }) {
  const pt = patientById(a.pt) || { name: a.pt };
  const t = apptColors(a); const st = STATUS[a.status];
  const showRetorno = !cfgGet('OcultarBotaoRetorno');
  const pro = PROS.find(p => p.id === a.pro) || EQUIP.find(e => e.id === a.pro) || {};
  const end = fmtMin(toMin(a.start) + a.dur);
  const Row = ({ icon, children }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: WT.fg }}>
      <WIcon name={icon} size={15} color={WT.muted} style={{ flex: 'none' }} />
      <span style={{ flex: 1, minWidth: 0 }}>{children}</span>
    </div>
  );
  return (
    <WPopover anchorRect={anchorRect} onClose={onClose} width={320}>
      <div style={{ height: 4, background: t.bar, flex: 'none' }} />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 0, overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <WAvatar initials={pt.name.split(' ').map(w => w[0]).slice(0, 2).join('')} size={40} bg={pro.color || WT.accent} color="#fff" ring={pro.color || WT.borderAccent} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 15, fontWeight: WT.wHead, color: WT.fg }}>{pt.name}</span>
              {pt.firstVisit && <WBadge type="accent">1ª vez</WBadge>}
            </div>
            <div style={{ fontSize: 12, color: WT.muted, marginTop: 2 }}>{pt.phone}</div>
          </div>
          <WIconButton name="x" dim={28} onClick={onClose} />
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <WBadge type={st.badge} icon={st.icon}>{st.label}</WBadge>
          <WBadge type="neutral" icon="circle" style={{ color: t.fg }}><span style={{ color: t.fg }}>{t.label}</span></WBadge>
          {a.fitIn && <WBadge type="warning" icon="git-merge">Encaixe</WBadge>}
          {a.paid && <WBadge type="success" icon="banknote">Pago</WBadge>}
          {pt.priority && PRIORITIES[pt.priority] && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 22, padding: '0 9px', borderRadius: WT.pill, background: '#fff', border: `1px solid ${FLAG_VIOLET}`, color: FLAG_VIOLET, fontSize: 12, fontWeight: WT.wHead }}>
              <WIcon name={PRIORITIES[pt.priority].icon} size={13} color={FLAG_VIOLET} strokeWidth={2.5} />{PRIORITIES[pt.priority].label}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 0', borderTop: `1px solid ${WT.borderSub}`, borderBottom: `1px solid ${WT.borderSub}` }}>
          {(() => { const list = apptProcList(a); return list.length <= 1
            ? <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><WIcon name="clipboard-list" size={15} color={WT.muted} style={{ flex: 'none' }} /><span style={{ display: 'inline-flex', alignItems: 'center', height: 22, background: t.tint, borderLeft: `3px solid ${t.bar}`, borderRadius: '3px 6px 6px 3px', padding: '0 10px 0 8px', fontSize: 13, fontWeight: WT.wEmph, color: t.fg }}>{(list[0] || {}).name || apptProcName(a)}</span></div>
            : <div style={{ display: 'flex', gap: 10 }}><WIcon name="clipboard-list" size={15} color={WT.muted} style={{ marginTop: 2, flex: 'none' }} /><div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: WT.fg }}><span style={{ fontWeight: WT.wEmph }}>{list.length} procedimentos</span>{list.map((p, i) => <span key={i} style={{ display: 'inline-flex', alignItems: 'center', height: 20, background: t.tint, borderLeft: `3px solid ${t.bar}`, borderRadius: '3px 6px 6px 3px', padding: '0 9px 0 7px', color: t.fg }}>{p.name} · {p.dur} min</span>)}</div></div>;
          })()}
          <Row icon="clock">{fmtMin(toMin(a.start))}–{end} · {a.dur} min</Row>
          <Row icon="user-round">{pro.name}{pro.spec ? ` · ${pro.spec}` : ''}</Row>
          {!window.__mvp && <Row icon="shield-check">{a.conv}{a.plano ? '' : ' (particular)'}</Row>}
          <Row icon="banknote"><strong style={{ fontWeight: WT.wHead }}>{a.price ? brl(a.price) : 'Sem cobrança'}</strong></Row>
          {a.note && <Row icon="sticky-note"><span style={{ color: WT.fg2 }}>{a.note}</span></Row>}
          {a.reason && a.status === 'cancelado' && <Row icon="info"><span style={{ color: WT.danger }}>{a.reason}</span></Row>}
          {a.reason && a.status === 'remarcado' && <Row icon="calendar-clock"><span style={{ color: STATUS.remarcado.fg }}>{a.reason}</span></Row>}
          {(() => {
            const ns = notifSummary(a);
            if (!ns.total) return null;
            const ok = ns.received > 0;
            const color = ns.failed && !ok ? WT.danger : (ok ? WT.success : WT.muted);
            const icon = ns.failed && !ok ? 'bell-off' : (ok ? 'bell-ring' : 'bell');
            const text = ok
              ? `${ns.received} notificaç${ns.received > 1 ? 'ões recebidas' : 'ão recebida'}`
              : (ns.sent > 0 ? 'Enviada(s), sem confirmação de recebimento' : `${ns.scheduled} notificação${ns.scheduled > 1 ? 's' : ''} agendada${ns.scheduled > 1 ? 's' : ''}`);
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                <WIcon name={icon} size={15} color={color} style={{ flex: 'none' }} />
                <span style={{ flex: 1, minWidth: 0, color: WT.fg }}>{text}{ns.confirmed ? ' · presença confirmada' : ''}</span>
                {ok && ns.scheduled > 0 && <span style={{ fontSize: 11, color: WT.muted, whiteSpace: 'nowrap' }}>+{ns.scheduled} agendada{ns.scheduled > 1 ? 's' : ''}</span>}
              </div>
            );
          })()}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <WButton variant="default" leadingIcon="calendar-clock" label="Remarcar" onClick={() => onReschedule(a)} />
          <WButton variant="default" leadingIcon="x-circle" label="Cancelar" onClick={() => onCancel(a)} />
          {showRetorno && <WButton variant="default" leadingIcon="rotate-ccw" label="Retorno" onClick={() => onRetorno && onRetorno(a)} />}
          <WButton variant="primary" leadingIcon="external-link" label="Abrir" onClick={() => onOpen(a)} style={showRetorno ? undefined : { gridColumn: 'span 2' }} />
        </div>
      </div>
    </WPopover>
  );
}

Object.assign(window, { laneLayout, apptType, apptProcName, StatusSmartTag, ProcTag, AppointmentCard, BlockCard, BlockGroupCard, IntervalCard, FreeSlot, GhostSlot, ContextCard });
