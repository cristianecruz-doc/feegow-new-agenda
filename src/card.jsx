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
  if (prefs.priority !== false && pt && pt.priority && PRIORITIES[pt.priority]) {
    const p = PRIORITIES[pt.priority];
    out.push({ key: 'pr', icon: p.icon, label: p.label, color: FLAG_VIOLET });
  }
  return out;
}

// ---- Appointment card -------------------------------------------------------
function AppointmentCard({ ev, top, height, leftPct, widthPct, gutter = 0, cardStyle, showPro, conflict, onOpen, onDragStart, onDragEnd, dragging, dimmed }) {
  const { a } = ev;
  const t = TYPES[apptType(a)]; const st = STATUS[a.status];
  const pt = patientById(a.pt) || { name: a.pt };
  const pro = PROS.find(p => p.id === a.pro);
  const proBadge = showPro && pro ? (
    <span title={pro.name} style={{ width: 16, height: 16, borderRadius: '50%', flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: WT.wHead, background: pro.color, color: '#fff', letterSpacing: '.02em' }}>{pro.initials}</span>
  ) : null;
  const cancelled = a.status === 'cancelado';
  const single = height < 34; // só cabe uma linha
  const flags = apptFlags(a, pt);
  const ref = React.useRef(null);
  const [hover, setHover] = React.useState(false);

  // chrome: FUNDO segue o PROFISSIONAL (identifica o profissional nas agendas com vários);
  // STATUS fica na barra lateral + ícone (distingue o status ao bater o olho)
  const sc = st.dot; // status color
  const sIcon = st.icon;
  const pc = (pro && pro.color) || t.bar; // cor do profissional
  let bg = '#fff', leftBar = null, nameColor = WT.fg, metaColor = WT.muted, border = WT.border;
  if (cardStyle === 'filled') {
    bg = pc + '20'; nameColor = WT.fg; metaColor = WT.fg2; border = pc + '4d'; leftBar = pc;
  } else { // 'barra' (typebar) — apenas barra lateral na cor do médico
    leftBar = pc;
  }
  // status indicator: a small colored dot (less visual noise than per-status icons)
  const statusDot = <span title={st.label} style={{ flex: 'none', width: 9, height: 9, borderRadius: '50%', background: sc, boxShadow: `0 0 0 2px ${sc}26` }} />;

  const fmt = m => fmtMin(toMin(a.start));
  const procName = apptProcName(a);
  const payStr = a.plano ? a.conv : (a.price ? brl(a.price) : 'Particular');
  const metaStr = `${showPro && pro ? pro.short + ' · ' : ''}${procName} · ${payStr}`;
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
        textAlign: 'left', padding: '3px 8px', boxSizing: 'border-box',
        background: (dragging || conflict) ? '#fff' : bg, opacity: dimmed ? 0.4 : (dragging ? 0.5 : 1),
        zIndex: conflict ? 9 : 4,
        borderTop: `1px solid ${conflict ? WT.borderDanger : (a.fitIn ? 'transparent' : border)}`,
        borderRight: `1px solid ${conflict ? WT.borderDanger : (a.fitIn ? 'transparent' : border)}`,
        borderBottom: `1px solid ${conflict ? WT.borderDanger : (a.fitIn ? 'transparent' : border)}`,
        borderLeft: leftBar ? `3px solid ${leftBar}` : `1px solid ${conflict ? WT.borderDanger : (a.fitIn ? 'transparent' : border)}`,
        borderRadius: WT.rM, cursor: 'grab', overflow: 'hidden',
        boxShadow: conflict ? `0 0 0 2px ${WT.borderDanger}66, ${WT.shPopout}` : (hover ? WT.shPopout : WT.shEmphasis), transition: 'box-shadow .12s, opacity .12s',
        outline: a.fitIn ? `1.5px dashed ${WT.warning}` : 'none', outlineOffset: -2,
        display: 'flex', flexDirection: 'column', gap: 1, justifyContent: 'flex-start', fontFamily: WT.font,
        textDecoration: cancelled ? 'line-through' : 'none',
      }}>
      {single ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, height: '100%', minWidth: 0 }}>
          {conflict ? <WIcon name="alert-triangle" size={12} color={WT.danger} style={{ flex: 'none' }} /> : <>{statusDot}{proBadge}</>}
          <span style={{ fontSize: 11, fontWeight: WT.wEmph, color: conflict ? WT.danger : nameColor, flex: 'none', fontVariantNumeric: 'tabular-nums' }}>{fmt()}</span>
          <span style={{ fontSize: 11, fontWeight: WT.wEmph, color: conflict ? WT.danger : nameColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 'none', maxWidth: '52%' }}>{pt.name}</span>
          <span style={{ fontSize: 11, color: metaColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>· {metaStr}</span>
          {flags.map(f => <FlagPill key={f.key} icon={f.icon} label={f.label} color={f.color} compact />)}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, flex: 'none' }}>
            {statusDot}{proBadge}
            <span style={{ fontSize: 11, fontWeight: WT.wEmph, color: conflict ? WT.danger : nameColor, fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{fmt()}</span>
            <span style={{ fontSize: 12, fontWeight: WT.wEmph, color: conflict ? WT.danger : nameColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>{pt.name}</span>
            {flags.map(f => <FlagPill key={f.key} icon={f.icon} label={f.label} color={f.color} compact={flags.length > 1} />)}
            {conflict && <WIcon name="alert-triangle" size={13} color={WT.danger} style={{ flex: 'none' }} />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, flex: 'none' }}>
            <span style={{ fontSize: 11, color: metaColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>{metaStr}</span>
            {a.note && <WIcon name="sticky-note" size={11} color={WT.warning} style={{ flex: 'none' }} />}
          </div>
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
      border: '1px solid #d99b91', borderLeft: '3px solid #c0392b', borderRadius: WT.rM, cursor: 'pointer', overflow: 'hidden', zIndex: 3,
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
      border: '1px solid #d99b91', borderLeft: '3px solid #c0392b', borderRadius: WT.rM, cursor: 'pointer', overflow: 'hidden', zIndex: 3,
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
      border: `1px solid #e6b35c`, borderLeft: '3px solid #d99a2e', borderRadius: WT.rM, cursor: 'not-allowed', overflow: 'hidden',
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
function ContextCard({ a, onClose, anchorRect, onCheckin, onReschedule, onCancel, onOpen }) {
  const pt = patientById(a.pt) || { name: a.pt };
  const t = TYPES[apptType(a)]; const st = STATUS[a.status];
  const pro = PROS.find(p => p.id === a.pro) || EQUIP.find(e => e.id === a.pro) || {};
  const end = fmtMin(toMin(a.start) + a.dur);
  const Row = ({ icon, children }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: WT.fg }}>
      <WIcon name={icon} size={15} color={WT.muted} style={{ flex: 'none' }} />
      <span style={{ flex: 1, minWidth: 0 }}>{children}</span>
    </div>
  );
  const canCheckin = ['marcado', 'confirmado'].includes(a.status);
  return (
    <WPopover anchorRect={anchorRect} onClose={onClose} width={320}>
      <div style={{ height: 4, background: pro.color || t.bar, flex: 'none' }} />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 0, overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <WAvatar initials={pt.name.split(' ').map(w => w[0]).slice(0, 2).join('')} size={40} bg={(pro.color || WT.accent) + '20'} color={pro.color || WT.accent} ring={pro.color || WT.borderAccent} />
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
          {pt.priority && PRIORITIES[pt.priority] && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 22, padding: '0 9px', borderRadius: WT.pill, background: '#fff', border: `1px solid ${FLAG_VIOLET}`, color: FLAG_VIOLET, fontSize: 12, fontWeight: WT.wHead }}>
              <WIcon name={PRIORITIES[pt.priority].icon} size={13} color={FLAG_VIOLET} strokeWidth={2.5} />{PRIORITIES[pt.priority].label}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 0', borderTop: `1px solid ${WT.borderSub}`, borderBottom: `1px solid ${WT.borderSub}` }}>
          {(() => { const list = apptProcList(a); return list.length <= 1
            ? <Row icon="clipboard-list">{(list[0] || {}).name || apptProcName(a)}</Row>
            : <div style={{ display: 'flex', gap: 10 }}><WIcon name="clipboard-list" size={15} color={WT.muted} style={{ marginTop: 2, flex: 'none' }} /><div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13, color: WT.fg }}><span style={{ fontWeight: WT.wEmph }}>{list.length} procedimentos</span>{list.map((p, i) => <span key={i} style={{ color: WT.fg2 }}>• {p.name} · {p.dur} min</span>)}</div></div>;
          })()}
          <Row icon="clock">{fmtMin(toMin(a.start))}–{end} · {a.dur} min</Row>
          <Row icon="user-round">{pro.name}{pro.spec ? ` · ${pro.spec}` : ''}</Row>
          <Row icon="shield-check">{a.conv}{a.plano ? '' : ' (particular)'}</Row>
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
          {canCheckin && <WButton variant="secondary" leadingIcon="user-check" label="Check-in" onClick={() => onCheckin(a)} />}
          <WButton variant="default" leadingIcon="calendar-clock" label="Remarcar" onClick={() => onReschedule(a)} />
          <WButton variant="default" leadingIcon="x-circle" label="Cancelar" onClick={() => onCancel(a)} />
          <WButton variant="primary" leadingIcon="external-link" label="Abrir" onClick={() => onOpen(a)} style={{ gridColumn: canCheckin ? 'auto' : 'span 2' }} />
        </div>
      </div>
    </WPopover>
  );
}

Object.assign(window, { laneLayout, apptType, apptProcName, AppointmentCard, BlockCard, BlockGroupCard, IntervalCard, FreeSlot, GhostSlot, ContextCard });
