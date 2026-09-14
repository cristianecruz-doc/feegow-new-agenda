/* ============================================================================
   Feegow — New Agenda · Lista de espera (pré-agendamento)
   Gaveta inferior + entrada/edição + encaixe (modal de horários compatíveis)
   Não confundir com "Sala de espera" (check-in do dia, em ops.jsx).
   ============================================================================ */

const WL_TURNS = { qualquer: 'Qualquer turno', manha: 'Manhã', tarde: 'Tarde' };
const WL_URG = {
  normal: { label: 'Normal', color: WT.muted, badge: 'neutral' },
  alta: { label: 'Alta', color: '#865200', badge: 'warning' },
  urgente: { label: 'Urgente', color: WT.dangerFill, badge: 'danger' },
};

// entradas de exemplo — datas relativas a hoje
const _wlD = n => dateUtil.addDays(TODAY, n);
const WL_SEED = [
  { id: 'w1', pt: 'pt1', proc: 'derm', pro: 'p1', anyPro: true, turn: 'manha', dow: [1, 2, 3], urg: 'alta', until: _wlD(9), conv: 'Unimed', unit: 'Unidade Centro', phone: '(11) 98472-1130', note: 'Paciente pediu para avisar por WhatsApp, atende à tarde.', by: 'Juliana (recepção)', at: _wlD(-6) },
  { id: 'w2', pt: 'pt4', proc: 'mapa', pro: 'p1', anyPro: false, turn: 'tarde', dow: [2, 4], urg: 'urgente', until: _wlD(4), conv: 'Particular', unit: 'Unidade Centro', phone: '(11) 97741-2093', note: 'Encaminhamento com suspeita — priorizar.', by: 'Marcos (recepção)', at: _wlD(-2) },
  { id: 'w3', pt: 'pt7', proc: 'retorno', pro: 'p1', anyPro: true, turn: 'qualquer', dow: [], urg: 'normal', until: null, conv: 'Unimed', unit: 'Unidade Centro', phone: '(11) 99120-4471', note: '', by: 'Juliana (recepção)', at: _wlD(-11) },
  { id: 'w4', pt: 'pt2', proc: 'usg', pro: null, anyPro: true, turn: 'tarde', dow: [3, 5], urg: 'normal', until: _wlD(20), conv: 'Particular', unit: 'Unidade Centro', phone: '(11) 99641-8820', note: 'Aceita qualquer profissional.', by: 'Juliana (recepção)', at: _wlD(-3) },
  { id: 'w5', pt: 'pt5', proc: 'cardio', pro: 'p3', anyPro: false, turn: 'manha', dow: [1, 3, 5], urg: 'alta', until: _wlD(7), conv: 'Bradesco Saúde', unit: 'Unidade Zona Sul', phone: '(11) 98330-7712', note: '', by: 'Marcos (recepção)', at: _wlD(-5) },
  { id: 'w6', pt: 'pt9', proc: 'orto', pro: 'p2', anyPro: true, turn: 'qualquer', dow: [], urg: 'normal', until: null, conv: 'SulAmérica', unit: 'Unidade Centro', phone: '(11) 98812-3390', note: 'Dor no joelho, pode ser encaixe de última hora.', by: 'Juliana (recepção)', at: _wlD(-1) },
];

const wlProc = e => PROCS[e.proc] || { name: e.proc, dur: 30 };
const wlPatient = e => patientById(e.pt) || { name: e.pt };
const wlDur = e => wlProc(e).dur || 30;
// médicos aptos: têm grade com o procedimento (só procedimento decide compatibilidade)
function wlAblePros(e) {
  const able = PROS.filter(p => GRADES.some(g => g.pro === p.id && (g.procs || []).includes(e.proc)));
  if (!e.anyPro && e.pro) return able.filter(p => p.id === e.pro);
  if (e.pro) return [...able.filter(p => p.id === e.pro), ...able.filter(p => p.id !== e.pro)];
  return able;
}
const wlDays = e => (e.dow && e.dow.length ? e.dow.map(d => DOW_ABBR[d]).join(', ') : null);
const wlWaitingDays = e => Math.max(0, Math.round((parseISO(TODAY) - parseISO(e.at)) / 864e5));
const wlLate = e => !!e.until && e.until < TODAY;

// horários compatíveis: grade com o procedimento, livre de agendamentos/intervalos/bloqueios
function wlSlots(e, appts, blocks, fromISO, nDays = 14, onlyProId) {
  const dur = wlDur(e), out = [];
  const pros = (onlyProId ? PROS.filter(p => p.id === onlyProId) : wlAblePros(e));
  for (let i = 0; i < nDays && out.length < 60; i++) {
    const iso = dateUtil.addDays(fromISO, i);
    if (e.until && iso > e.until) break;
    pros.forEach(p => {
      gradesFor(p.id, iso).filter(g => (g.procs || []).includes(e.proc)).forEach(g => {
        const busy = (appts || []).filter(a => a.pro === p.id && a.date === iso && a.status !== 'cancelado' && !a.deleted).map(a => [toMin(a.start), toMin(a.start) + (a.dur || 30)]);
        const ivs = (g.intervals || []).map(iv => [toMin(iv.start), toMin(iv.end)]);
        const bls = (blocks || []).filter(b => blockOnDate(b, iso) && blockCoversPro(b, p.id)).map(b => [toMin(b.start), toMin(b.end)]);
        const taken = busy.concat(ivs, bls);
        const step = g.slotMin || 15;
        for (let m = toMin(g.start); m + dur <= toMin(g.end); m += step) {
          if (iso === TODAY && m < NOW_MIN) continue;
          if (taken.some(([s, t]) => m < t && m + dur > s)) continue;
          out.push({ date: iso, min: m, time: fmtMin(m), pro: p, grade: g, dur });
          break; // um horário por grade/dia mantém a lista curta e legível
        }
      });
    });
  }
  const score = s => (e.turn === 'manha' ? (s.min < 720 ? 0 : 1) : e.turn === 'tarde' ? (s.min >= 720 ? 0 : 1) : 0)
    + (e.dow && e.dow.length ? (e.dow.includes(parseISO(s.date).getDay()) ? 0 : 1) : 0) * 2
    + (e.pro && s.pro.id === e.pro ? 0 : 1) * 0.5;
  return out.sort((a, b) => (score(a) - score(b)) || (a.date < b.date ? -1 : a.date > b.date ? 1 : a.min - b.min));
}
// quantas entradas esperam por esta agenda (procedimento na grade do dia)
function wlForPro(entries, proId, iso) {
  return (entries || []).filter(e => gradesFor(proId, iso).some(g => (g.procs || []).includes(e.proc)) && (!e.until || e.until >= iso) && (e.anyPro || e.pro === proId || !e.pro));
}

// ---- Gaveta inferior --------------------------------------------------------
function WaitlistDrawer({ entries, appts, blocks, date, open, setOpen, onFit, onAdd, onEdit, onRemove }) {
  const [q, setQ] = React.useState('');
  const [sort, setSort] = React.useState('urg');
  const compat = React.useMemo(() => {
    const m = {}; (entries || []).forEach(e => { m[e.id] = wlSlots(e, appts, blocks, date, 14).length; }); return m;
  }, [entries, appts, blocks, date]);
  const todayFits = (entries || []).filter(e => wlSlots(e, appts, blocks, date, 1).length).length;
  const list = (entries || [])
    .filter(e => !q || wlPatient(e).name.toLowerCase().includes(q.toLowerCase()) || wlProc(e).name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => sort === 'urg'
      ? (['urgente', 'alta', 'normal'].indexOf(a.urg) - ['urgente', 'alta', 'normal'].indexOf(b.urg)) || (a.at < b.at ? -1 : 1)
      : sort === 'until' ? ((a.until || '9999') < (b.until || '9999') ? -1 : 1)
      : (a.at < b.at ? -1 : 1));
  const H = open ? Math.max(150, Math.min(292, Math.round((window.innerHeight || 900) * 0.4))) : 40;
  return (
    <div style={{ flex: 'none', height: H, borderTop: `1px solid ${WT.border}`, background: WT.raised, display: 'flex', flexDirection: 'column', transition: 'height 140ms' }}>
      {/* barra recolhida / cabeçalho */}
      <button onClick={() => setOpen(!open)} style={{ flex: 'none', height: 40, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', border: 'none', background: open ? WT.inset : 'transparent', borderBottom: open ? `1px solid ${WT.borderSub}` : 'none', cursor: 'pointer', fontFamily: WT.font, textAlign: 'left' }}>
        <WIcon name="clipboard-list" size={16} color={WT.accent} />
        <span style={{ fontSize: 13, fontWeight: WT.wHead, color: WT.fg }}>Lista de espera</span>
        <WBadge type="neutral">{(entries || []).length}</WBadge>
        {todayFits > 0 && <WBadge type="success" icon="sparkles">{todayFits} com encaixe hoje</WBadge>}
        {(entries || []).some(wlLate) && <WBadge type="danger" icon="alert-triangle">{(entries || []).filter(wlLate).length} fora do prazo</WBadge>}
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: WT.muted }}>{open ? 'Recolher' : 'Expandir'}</span>
        <WIcon name={open ? 'chevron-down' : 'chevron-up'} size={15} color={WT.fg2} />
      </button>
      {open && (
        <>
          <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: `1px solid ${WT.borderSub}` }}>
            <WInput size="s" value={q} onChange={setQ} placeholder="Buscar paciente ou procedimento…" prefixIcon="search" style={{ width: 250 }} />
            <WSelect size="s" value={sort} onChange={setSort} placeholder="" style={{ width: 190 }}
              options={[{ value: 'urg', label: 'Ordenar: prioridade' }, { value: 'until', label: 'Ordenar: data limite' }, { value: 'at', label: 'Ordenar: entrada na lista' }]} />
            <span style={{ flex: 1 }} />
            <WButton variant="primary" size="s" leadingIcon="user-plus" label="Adicionar à lista" onClick={onAdd} />
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {list.length === 0 && <div style={{ padding: 28, textAlign: 'center', color: WT.muted, fontSize: 13 }}>Nenhum paciente na lista de espera.</div>}
            {list.map(e => <WaitlistRow key={e.id} e={e} fits={compat[e.id] || 0} onFit={() => onFit(e)} onEdit={() => onEdit(e)} onRemove={() => onRemove(e)} />)}
          </div>
        </>
      )}
    </div>
  );
}

function WaitlistRow({ e, fits, onFit, onEdit, onRemove }) {
  const [hover, setHover] = React.useState(false);
  const pt = wlPatient(e), proc = wlProc(e);
  const pro = e.pro ? PROS.find(p => p.id === e.pro) : null;
  const urg = WL_URG[e.urg] || WL_URG.normal;
  const meta = [
    { icon: 'stethoscope', text: `${proc.name} · ${wlDur(e)}min` },
    { icon: 'user-round', text: pro ? (e.anyPro ? `${pro.short} (aceita outros)` : pro.short) : 'Qualquer médico apto' },
    { icon: 'sun', text: WL_TURNS[e.turn] + (wlDays(e) ? ` · ${wlDays(e)}` : '') },
    { icon: 'shield-check', text: e.conv },
    { icon: 'building-2', text: e.unit },
  ];
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 12px', padding: '9px 12px 9px 10px', borderRadius: WT.rM, border: `1px solid ${hover ? WT.borderHover : WT.border}`, background: '#fff', borderLeft: `3px solid ${urg.color}` }}>
      <WAvatar initials={(pt.name || '?').split(' ').map(s => s[0]).slice(0, 2).join('')} size={32} />
      <div style={{ flex: '1 1 170px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13.5, fontWeight: WT.wHead, color: WT.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pt.name}</span>
          {e.urg !== 'normal' && <WBadge type={urg.badge}>{urg.label}</WBadge>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: WT.accent, fontWeight: WT.wEmph }}>
          <WIcon name="phone" size={11} color={WT.accent} />{e.phone}
        </div>
      </div>
      {/* segunda linha: preferências e observação — quebram livremente, nada fica escondido */}
      <div style={{ order: 2, flex: '1 1 100%', minWidth: 0, display: 'flex', flexWrap: 'wrap', gap: '2px 12px', lineHeight: '17px', paddingLeft: 44 }}>
        {meta.map((m, i) => (
          <span key={i} title={m.text} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: WT.fg2, minWidth: 0 }}>
            <WIcon name={m.icon} size={11} color={WT.muted} style={{ flex: 'none' }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.text}</span>
          </span>
        ))}
        {e.note && <span title={e.note} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: WT.muted, minWidth: 0, maxWidth: 420 }}>
          <WIcon name="message-square" size={11} color={WT.muted} style={{ flex: 'none' }} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.note}</span>
        </span>}
      </div>
      <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <span title={`Na lista desde ${dateUtil.fmtShortDate(e.at)} · ${e.by}`} style={{ fontSize: 11.5, color: WT.muted, fontVariantNumeric: 'tabular-nums' }}>há {wlWaitingDays(e)} {wlWaitingDays(e) === 1 ? 'dia' : 'dias'} na lista</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {e.until && <span title="Data limite" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11.5, fontWeight: WT.wEmph, color: wlLate(e) ? WT.dangerFill : WT.fg2 }}><WIcon name="calendar-x" size={11} color={wlLate(e) ? WT.dangerFill : WT.muted} />até {dateUtil.fmtShortDate(e.until)}</span>}
        </div>
      </div>
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
        <WButton variant={fits ? 'primary' : 'default'} size="s" leadingIcon="calendar-plus" disabled={!fits}
          label={fits ? `Marcar · ${fits}` : 'Sem horário'} onClick={onFit} />
        <WIconButton name="pencil" dim={28} title="Editar entrada" onClick={onEdit} />
        <WIconButton name="trash-2" dim={28} title="Remover da lista" onClick={onRemove} />
      </div>
    </div>
  );
}

// ---- Entrada / edição -------------------------------------------------------
function WaitlistEntryModal({ e, onClose, onSave }) {
  const ed = !!(e && e.id);
  const [f, setF] = React.useState(() => ({
    pt: '', proc: 'derm', pro: '', anyPro: true, turn: 'qualquer', dow: [], urg: 'normal',
    until: '', conv: 'Particular', unit: UNITS[0], phone: '', note: '', ...(e || {}),
  }));
  const up = patch => setF(s => ({ ...s, ...patch }));
  const [err, setErr] = React.useState({});
  const ablePros = PROS.filter(p => GRADES.some(g => g.pro === p.id && (g.procs || []).includes(f.proc)));
  function pickPatient(id) {
    const p = patientById(id) || {};
    up({ pt: id, phone: f.phone || p.phone || '', conv: p.conv || f.conv });
  }
  function save() {
    const x = {};
    if (!f.pt) x.pt = 'Selecione o paciente';
    if (!f.proc) x.proc = 'Selecione o procedimento';
    if (!f.phone) x.phone = 'Informe um telefone de contato';
    setErr(x);
    if (Object.keys(x).length) return;
    onSave({ ...f, pro: f.pro || null, until: f.until || null, id: f.id || 'w' + Date.now(), at: f.at || TODAY, by: f.by || 'Você (recepção)' });
  }
  return (
    <CenterModal title={ed ? 'Editar entrada da lista de espera' : 'Adicionar à lista de espera'} icon="clipboard-list" onClose={onClose} width={620}
      footer={<><WButton variant="default" label="Cancelar" onClick={onClose} /><span style={{ flex: 1 }} />
        <WButton variant="primary" leadingIcon="check" label={ed ? 'Salvar' : 'Adicionar à lista'} onClick={save} /></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 10 }}>
          <WSelect label="Paciente" required value={f.pt} onChange={pickPatient} error={err.pt}
            options={PATIENTS.map(p => ({ value: p.id, label: p.name }))} />
          <WInput label="Telefone / WhatsApp" required value={f.phone} onChange={v => up({ phone: v })} prefixIcon="phone" error={err.phone} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 10 }}>
          <WSelect label="Procedimento" required value={f.proc} onChange={v => up({ proc: v, pro: '' })} error={err.proc}
            options={PROC_LIST.map(p => ({ value: p.id, label: `${p.name} · ${p.dur}min` }))} />
          <WSelect label="Convênio" value={f.conv} onChange={v => up({ conv: v })} options={CONVENIOS.map(c => ({ value: c, label: c }))} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <WSelect label="Médico preferido" value={f.pro} onChange={v => up({ pro: v })} placeholder="Sem preferência — qualquer médico apto"
            options={ablePros.map(p => ({ value: p.id, label: `${p.name} · ${p.spec}` }))} />
          {f.pro && <WCheckbox checked={f.anyPro} onChange={v => up({ anyPro: v })} label="Aceita outro médico apto se liberar um horário antes" />}
          {!ablePros.length && <span style={{ fontSize: 12, color: WT.warning, display: 'inline-flex', alignItems: 'center', gap: 5 }}><WIcon name="alert-triangle" size={12} color={WT.warning} />Nenhuma grade oferece esse procedimento hoje.</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <WLabel>Turno preferido</WLabel>
            <WSegmented value={f.turn} onChange={v => up({ turn: v })} options={[{ value: 'qualquer', label: 'Qualquer' }, { value: 'manha', label: 'Manhã' }, { value: 'tarde', label: 'Tarde' }]} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <WLabel>Prioridade</WLabel>
            <WSegmented value={f.urg} onChange={v => up({ urg: v })} options={[{ value: 'normal', label: 'Normal' }, { value: 'alta', label: 'Alta' }, { value: 'urgente', label: 'Urgente' }]} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <WLabel>Dias da semana que o paciente prefere <span style={{ fontWeight: WT.wBody, color: WT.muted }}>· opcional</span></WLabel>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {DOW_ABBR.map((d, i) => {
              const on = (f.dow || []).includes(i);
              return <button key={i} onClick={() => up({ dow: on ? f.dow.filter(x => x !== i) : [...(f.dow || []), i] })}
                style={{ width: 42, height: 32, borderRadius: WT.rM, cursor: 'pointer', fontFamily: WT.font, fontSize: 12, fontWeight: WT.wEmph, textTransform: 'capitalize', border: `1.5px solid ${on ? WT.borderAccent : WT.border}`, background: on ? WT.accentSoft : '#fff', color: on ? WT.accent : WT.fg2 }}>{d}</button>;
            })}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 10 }}>
          <WInput label="Data limite" type="date" value={f.until} onChange={v => up({ until: v })} hint="Precisa ser atendido até esta data" />
          <WSelect label="Unidade preferida" value={f.unit} onChange={v => up({ unit: v })} options={UNITS.map(u => ({ value: u, label: u }))} />
        </div>
        <WTextarea label="Observação" value={f.note} onChange={v => up({ note: v })} rows={2} placeholder="Ex.: só pode de manhã cedo, avisar pelo WhatsApp da mãe…" />
        {ed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 10, borderTop: `1px solid ${WT.borderSub}` }}>
            <span style={{ fontSize: 12, color: WT.muted }}>Criado por {f.by} em {dateUtil.fmtShortDate(f.at)}.</span>
          </div>
        )}
      </div>
    </CenterModal>
  );
}

// ---- Sinalização na coluna do médico ---------------------------------------
function WaitlistColPill({ proId, date }) {
  const h = window.__waitHints; if (!h || !proId) return null;
  const n = wlForPro(h.entries, proId, date || TODAY).length;
  if (!n) return null;
  return (
    <button onClick={ev => { ev.stopPropagation(); h.onOpenPro(proId); }} title="Pacientes na lista de espera compatíveis com esta agenda"
      style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, height: 22, padding: '0 8px', borderRadius: WT.pill, border: `1px solid ${WT.borderAccent}`, background: WT.accentSoft, color: WT.accent, fontFamily: WT.font, fontSize: 11, fontWeight: WT.wEmph, cursor: 'pointer', whiteSpace: 'nowrap' }}>
      <WIcon name="clipboard-list" size={11} color={WT.accent} />{n} na espera
    </button>
  );
}

Object.assign(window, {
  WL_SEED, WL_TURNS, WL_URG, wlProc, wlPatient, wlDur, wlAblePros, wlSlots, wlForPro, wlLate,
  WaitlistDrawer, WaitlistRow, WaitlistEntryModal, WaitlistColPill,
});
