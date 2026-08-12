/* ============================================================================
   Feegow — New Agenda · Booking (Google-Calendar-style two-tier)
   QuickCreatePopover → BookingForm (config-driven, no-data-wipe) in
   drawer / modal / sheet (Tweak: bookingFlow).  Spec §6.6 + §10.
   ============================================================================ */

const CONTACT_FIELDS = ['Tel1', 'Cel1', 'Email1'];
const SEXO_OPTS = ['Feminino', 'Masculino', 'Outro'];
const ORIGEM_OPTS = ['Indicação', 'Google', 'Instagram', 'Convênio', 'Retorno', 'Passagem'];
const TABELA_OPTS = ['Tabela Padrão', 'Tabela Promocional', 'Tabela Convênio'];

// ---- Multi-procedure picker (chips + add dropdown + running total) ----------
function ProcMultiSelect({ value, onChange, options, error, label, required, hint }) {
  const sel = value || [];
  const avail = options.filter(p => !sel.includes(p.id));
  const totalDur = sel.reduce((s, id) => s + ((PROCS[id] || {}).dur || 0), 0);
  const totalPrice = sel.reduce((s, id) => s + ((PROCS[id] || {}).price || 0), 0);
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const matches = (q ? avail.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || (TYPES[p.type] || {}).label.toLowerCase().includes(q.toLowerCase())) : avail).slice(0, 8);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <WLabel required={required}>{label}{hint ? <span style={{ fontWeight: WT.wBody, color: WT.muted }}> · {hint}</span> : null}</WLabel>}
      {sel.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {sel.map(id => { const p = PROCS[id]; if (!p) return null; const tc = TYPES[p.type]; return (
            <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 6px 5px 10px', borderRadius: 999, background: tc.bg || WT.inset, border: `1px solid ${WT.border}`, fontSize: 12.5, color: WT.fg }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: tc.fg, flex: 'none' }} />
              {p.name}<span style={{ color: WT.muted }}>· {p.dur}min</span>
              <button onClick={() => onChange(sel.filter(x => x !== id))} style={{ display: 'inline-flex', border: 'none', background: 'transparent', cursor: 'pointer', padding: 2, borderRadius: '50%', color: WT.muted }} onMouseEnter={e => e.currentTarget.style.background = WT.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><WIcon name="x" size={13} /></button>
            </span>
          ); })}
        </div>
      )}
      {avail.length > 0 && (
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 10px', borderRadius: WT.rM, border: `1px solid ${error ? WT.borderDanger : WT.border}`, background: '#fff' }}>
            <WIcon name="search" size={15} />
            <input value={q} placeholder={sel.length ? 'Buscar e adicionar procedimento…' : 'Digite para buscar o procedimento…'}
              onChange={e => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 140)}
              style={{ border: 'none', outline: 'none', font: `${WT.wBody} 14px ${WT.font}`, flex: 1, background: 'transparent', color: WT.fg, minWidth: 0 }} />
            <WIcon name="chevron-down" size={15} />
          </div>
          {error && <span style={{ fontSize: 12, color: WT.danger }}>{error}</span>}
          {open && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 50, background: '#fff', border: `1px solid ${WT.border}`, borderRadius: WT.rM, boxShadow: WT.shPopout, overflow: 'hidden', maxHeight: 260, overflowY: 'auto' }}>
              {matches.length === 0 && <div style={{ padding: 12, fontSize: 13, color: WT.muted }}>Nenhum procedimento encontrado.</div>}
              {matches.map(p => { const tc = TYPES[p.type]; return (
                <button key={p.id} onMouseDown={() => { onChange([...sel, p.id]); setQ(''); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 10px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: WT.font }} onMouseEnter={e => e.currentTarget.style.background = WT.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: tc.fg, flex: 'none' }} />
                  <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontSize: 14, color: WT.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span><span style={{ display: 'block', fontSize: 12, color: WT.muted }}>{tc.label} · {p.dur} min{p.price ? ` · ${brl(p.price)}` : ''}</span></span>
                  <WIcon name="plus" size={15} color={WT.accent} />
                </button>
              ); })}
              {q && avail.length > matches.length && <div style={{ padding: '6px 10px', fontSize: 11, color: WT.muted, borderTop: `1px solid ${WT.borderSub}` }}>Refine a busca para ver mais resultados</div>}
            </div>
          )}
        </div>
      )}
      {sel.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: WT.fg2, padding: '2px 2px 0' }}>
          <WIcon name="layers" size={13} color={WT.accent} />
          <strong style={{ fontWeight: WT.wEmph, color: WT.fg }}>{sel.length} procedimentos</strong> · {totalDur} min{totalPrice ? ` · ${brl(totalPrice)}` : ''}
        </div>
      )}
    </div>
  );
}

// ---- Patient autocomplete ---------------------------------------------------
function PatientAutocomplete({ value, onSelect, onNew, error, autoFocus, noLabel }) {
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const sel = value ? (patientById(value.patientId) || { name: value.patientName }) : null;
  const matches = q ? PATIENTS.filter(p => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : [];
  if (sel && !open) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {!noLabel && <WLabel required>Paciente</WLabel>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 40, padding: '4px 6px 4px 8px', borderRadius: WT.rM, border: `1px solid ${WT.border}`, background: '#fff' }}>
          <WAvatar initials={(sel.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('')} size={24} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: WT.wEmph, color: WT.fg }}>{sel.name}</span>
              {value.isNew && <WBadge type="accent">novo</WBadge>}
              {sel.firstVisit && <WBadge type="accent" icon="sparkles">1ª vez</WBadge>}
              {sel.priority && PRIORITIES[sel.priority] && <WBadge type="warning" icon={PRIORITIES[sel.priority].icon}>{PRIORITIES[sel.priority].label}</WBadge>}
            </div>
            {sel.phone && <div style={{ fontSize: 12, color: WT.muted }}>{sel.phone}{cfgGet('CPFBuscaPaciente') && sel.id ? ` · CPF ${cpfOf(sel)}` : ''}</div>}
          </div>
          <WIconButton name="x" dim={28} onClick={() => { onSelect(null); setQ(''); setOpen(true); }} />
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, position: 'relative' }}>
      {!noLabel && <WLabel required>Paciente</WLabel>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: noLabel ? 32 : 44, padding: '0 10px', borderRadius: WT.rM, border: `1px solid ${error ? WT.borderDanger : WT.border}`, background: '#fff' }}>
        <WIcon name="search" size={15} />
        <input autoFocus={autoFocus} value={q} placeholder="Buscar paciente…"
          onChange={e => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
          style={{ border: 'none', outline: 'none', font: `${WT.wBody} 14px ${WT.font}`, flex: 1, background: 'transparent', color: WT.fg, minWidth: 0 }} />
      </div>
      {error && <span style={{ fontSize: 12, color: WT.danger }}>{error}</span>}
      {open && q && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 50, background: '#fff', border: `1px solid ${WT.border}`, borderRadius: WT.rM, boxShadow: WT.shPopout, overflow: 'hidden' }}>
          {matches.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: 13, color: WT.muted }}>Nenhum paciente encontrado.</div>
          )}
          {matches.map(p => (
            <button key={p.id} onMouseDown={() => { onSelect({ patientId: p.id, patientName: p.name, isNew: false }); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 10px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: WT.font }} onMouseEnter={e => e.currentTarget.style.background = WT.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <WAvatar initials={p.name.split(' ').map(w => w[0]).slice(0, 2).join('')} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, color: WT.fg }}>{p.name}</div><div style={{ fontSize: 12, color: WT.muted }}>{p.phone} · {p.conv}</div>{cfgGet('CPFBuscaPaciente') && <div style={{ fontSize: 12, color: WT.muted, fontVariantNumeric: 'tabular-nums' }}>CPF {cpfOf(p)}</div>}</div>
              {p.firstVisit && <WBadge type="accent">1ª vez</WBadge>}
            </button>
          ))}
          {q && (
            <button onMouseDown={() => { onNew(q); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px', border: 'none', borderTop: `1px solid ${WT.borderSub}`, background: WT.inset, cursor: 'pointer', textAlign: 'left', fontFamily: WT.font }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: WT.accentSoft, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><WIcon name="user-plus" size={15} color={WT.accent} /></span>
              <span style={{ fontSize: 14, fontWeight: WT.wEmph, color: WT.accent }}>Novo paciente: "{q}"</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Quick-create popover (Tier 1) ------------------------------------------
function QuickCreatePopover({ ctx, anchorRect, onClose, onMore, onSave, onDraft }) {
  const [proId, setProId] = React.useState(ctx.proId);
  const pro = PROS.find(p => p.id === proId) || PROS[0];
  const proOptions = ctx.proOptions && ctx.proOptions.length ? ctx.proOptions : PROS.map(p => p.id);
  const [patient, setPatient] = React.useState(null);
  const [procIds, setProcIds] = React.useState([]);
  const [time, setTime] = React.useState(ctx.time);
  const [pay, setPay] = React.useState('particular'); // 'particular' | 'convenio'
  const [conv, setConv] = React.useState('');
  const [tel, setTel] = React.useState('');
  const [parentesco, setParentesco] = React.useState('Próprio paciente');
  const [prepaid, setPrepaid] = React.useState(false);
  const [err, setErr] = React.useState({});
  // regras vindas das Configurações da Agenda
  const ptRec = patient && patient.patientId ? patientById(patient.patientId) : null;
  const cardExpired = !!(ptRec && ptRec.cardExp) && pay === 'convenio';
  const requireValidCard = cfgGet('validadeconveniovencido');
  const faltasTh = cfgGet('QuantidadeFaltasPagtoPrevio');
  const noShows = (ptRec && ptRec.noShows) || 0;
  const needPrepay = faltasTh > 0 && noShows >= faltasTh;
  const askParentesco = cfgGet('ExibirParentescoPacienteAgendar');
  const totalDur = procIds.reduce((s, id) => s + ((PROCS[id] || {}).dur || 0), 0);
  const totalPrice = procIds.reduce((s, id) => s + ((PROCS[id] || {}).price || 0), 0);
  const grade = gradeAt(proId, ctx.date, time);
  // procedimentos permitidos pela grade do médico nesse horário
  const allowedProcs = grade && grade.procs ? PROC_LIST.filter(p => grade.procs.includes(p.id)) : PROC_LIST;
  // pre-fill payment from the selected patient's default convênio
  React.useEffect(() => {
    const p = patient && patient.patientId ? patientById(patient.patientId) : null;
    if (p) { if (p.conv && p.conv !== 'Particular') { setPay('convenio'); setConv(p.conv); } else setPay('particular'); setTel(p.phone || ''); }
    else setTel('');
  }, [patient && patient.patientId]);
  // clear incompatible procedures when the grade changes
  React.useEffect(() => { if (grade && grade.procs) setProcIds(ids => ids.filter(id => grade.procs.includes(id))); }, [time]);
  // mantém o placeholder no grid sincronizado com horário + duração em criação
  React.useEffect(() => { onDraft && onDraft({ time, dur: totalDur || gradeSlotAt(proId, ctx.date, time) || 30 }); }, [time, totalDur]);
  const save = () => {
    const e = {};
    if (!patient) e.patient = 'Selecione um paciente';
    if (!tel.trim()) e.tel = 'Telefone é obrigatório para agendar';
    if (!procIds.length) e.proc = 'Selecione ao menos um procedimento';
    if (pay === 'convenio' && !conv) e.conv = 'Selecione o convênio';
    if (pay === 'convenio' && conv && grade && grade.convenios && !grade.convenios.includes(conv)) e.conv = 'Convênio não atendido nesta grade';
    if (cardExpired && requireValidCard) e.conv = `Carteirinha vencida em ${ptRec.cardExp} — atualize o cadastro para agendar por convênio`;
    if (needPrepay && !prepaid) e.prepay = 'Confirme o pagamento antecipado para agendar';
    if (Object.keys(e).length) { setErr(e); return; }
    onSave({ ...ctx, proId, patient, procIds, time, payPlano: pay === 'convenio', payConv: pay === 'convenio' ? conv : 'Particular' });
  };
  return (
    <WPopover anchorRect={anchorRect} onClose={onClose} width={340}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 8px 10px 14px', borderBottom: `1px solid ${WT.borderSub}`, flex: 'none' }}>
        <span style={{ flex: 1, fontSize: 15, fontWeight: WT.wHead, color: WT.fg }}>Novo agendamento</span>
        <WIconButton name="x" dim={28} onClick={onClose} />
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 0, overflow: 'auto' }}>
        {ctx.pickPro ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <WSelect value={proId} onChange={setProId} size="l"
                options={proOptions.map(id => { const p = PROS.find(x => x.id === id); const free = !!gradeAt(id, ctx.date, time); return { value: id, label: `${p.name}${free ? '' : ' — sem grade neste horário'}` }; })} />
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: WT.fg2, whiteSpace: 'nowrap' }}><WIcon name="calendar" size={14} /> {fmtShortDate(ctx.date)}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: WT.fg2 }}>
            <WIcon name="user-round" size={14} color={pro.color} /> {pro.name}
            <span style={{ flex: 1 }} />
            <WIcon name="calendar" size={14} /> {fmtShortDate(ctx.date)}
          </div>
        )}
        {grade && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: WT.rM, background: grade.color + '14', borderLeft: `3px solid ${grade.color}` }}>
            <span style={{ fontSize: 12, fontWeight: WT.wHead, color: grade.color }}>{grade.label || 'Disponível'}</span>
            <span style={{ fontSize: 12, color: WT.fg2 }}>{grade.start}–{grade.end} · intervalo {grade.slotMin} min</span>
          </div>
        )}
        <PatientAutocomplete value={patient} onSelect={setPatient} onNew={name => { setPatient({ patientName: name, isNew: true }); }} error={err.patient} autoFocus />
        <WInput label="Telefone" required value={tel} onChange={v => { setTel(v); setErr(s => ({ ...s, tel: undefined })); }} placeholder="(11) 90000-0000" suffixIcon="phone" error={err.tel} size="l" />
        <ProcMultiSelect label="Procedimentos" required value={procIds} onChange={setProcIds} error={err.proc}
          hint={grade && grade.procs ? 'limitado pela grade' : null} options={allowedProcs} />
        {needPrepay && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, padding: '10px 12px', borderRadius: WT.rM, background: '#fff6ba', border: `1px solid ${err.prepay ? WT.borderDanger : '#e8d27a'}` }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: WT.wHead, color: '#865200' }}>
              <WIcon name="credit-card" size={14} color="#865200" />Pagamento antecipado obrigatório
            </span>
            <span style={{ fontSize: 12, color: '#865200', lineHeight: 1.45 }}>{noShows} faltas registradas — a clínica exige pagamento antecipado a partir de {faltasTh}.</span>
            <WCheckbox checked={prepaid} onChange={v => { setPrepaid(v); setErr(s => ({ ...s, prepay: undefined })); }} label="Pagamento antecipado recebido" />
            {err.prepay && <span style={{ fontSize: 12, color: WT.danger }}>{err.prepay}</span>}
          </div>
        )}
        {askParentesco && (
          <WSelect label="Parentesco / responsável" value={parentesco} onChange={setParentesco} placeholder="" size="l"
            options={['Próprio paciente', 'Mãe/Pai', 'Responsável legal', 'Outro']} />
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <WInput label="Horário" value={time} onChange={setTime} suffixIcon="clock" size="l" style={{ width: 110 }} />
          {procIds.length > 0 && <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}><WLabel>Resumo</WLabel><div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: WT.fg2 }}><WBadge type="neutral"><span style={{ color: WT.fg2 }}>{totalDur} min</span></WBadge>{pay === 'particular' ? (totalPrice ? brl(totalPrice) : 'Sem cobrança') : <span style={{ color: WT.muted }}>Coberto pelo convênio</span>}</div></div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...(window.__mvp ? { display: 'none' } : null) }}>
          <WLabel required>Pagamento</WLabel>
          <WSegmented options={[{ value: 'particular', label: 'Particular' }, { value: 'convenio', label: 'Convênio' }]} value={pay} onChange={v => { setPay(v); setErr(s => ({ ...s, conv: undefined })); }} />
          {pay === 'convenio' && <WSelect value={conv} onChange={v => { setConv(v); setErr(s => ({ ...s, conv: undefined })); }} options={CONVENIOS.filter(c => c !== 'Particular')} placeholder="Selecione o convênio" error={err.conv} size="l" />}
          {cardExpired && !requireValidCard && (
            <span style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: '#865200', background: '#fff6ba', border: '1px solid #e8d27a', borderRadius: WT.pill, padding: '4px 10px', width: 'fit-content' }}>
              <WIcon name="alert-triangle" size={13} color="#865200" />Carteirinha vencida em {ptRec.cardExp} — agendamento permitido
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, borderTop: `1px solid ${WT.borderSub}`, background: WT.inset, flex: 'none' }}>
        <WButton variant="plain" leadingIcon="settings-2" label="Mais opções" onClick={() => onMore({ ...ctx, patient, procIds, time })} />
        <span style={{ flex: 1 }} />
        <WButton variant="primary" leadingIcon="check" label="Salvar" onClick={save} />
      </div>
    </WPopover>
  );
}

// ---- Configurable patient field -------------------------------------------
// noLabel: estilo do painel lateral (Figma) — o nome do campo vira placeholder
function PatientField({ name, value, onChange, required, error, noLabel, size = 'l' }) {
  const label = PATIENT_FIELDS[name] || name;
  const lbl = noLabel ? undefined : label;
  if (name === 'Nascimento') return <WInput label={lbl} required={required} type="date" value={value || ''} onChange={onChange} error={error} size={size} />;
  if (name === 'Sexo') return <WSelect label={lbl} placeholder={noLabel ? label : undefined} required={required} value={value || ''} onChange={onChange} options={SEXO_OPTS} error={error} size={size} />;
  if (name === 'Origem') return <WSelect label={lbl} placeholder={noLabel ? label : undefined} required={required} value={value || ''} onChange={onChange} options={ORIGEM_OPTS} error={error} size={size} />;
  if (name === 'Tabela') return <WSelect label={lbl} placeholder={noLabel ? label : undefined} required={required} value={value || ''} onChange={onChange} options={TABELA_OPTS} error={error} size={size} />;
  if (name === 'IndicadoPorSelecao') return <WSelect label={lbl} placeholder={noLabel ? label : undefined} required={required} value={value || ''} onChange={onChange} options={PROS.map(p => p.name)} error={error} size={size} />;
  const ph = name === 'Email1' ? 'nome@email.com' : name === 'CPF' ? '000.000.000-00' : (name === 'Cel1' || name === 'Tel1') ? '(11) 90000-0000' : '';
  return <WInput label={lbl} required={required} value={value || ''} onChange={onChange} error={error} placeholder={noLabel ? label : ph} size={size} />;
}

// stable section header (module scope so the form subtree never remounts)
function Section({ icon, title, children }) {
  return (
    <div style={{ border: `1px solid ${WT.border}`, borderRadius: WT.rL, background: WT.raised, display: 'flex', flexDirection: 'column', gap: 14, padding: 16, boxShadow: WT.shEmphasis }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottom: `1px solid ${WT.borderSub}` }}>
        <WIcon name={icon} size={16} color={WT.accent} />
        <span style={{ fontSize: 14, fontWeight: WT.wHead, color: WT.fg }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

// ---- Notificações ao paciente (bloco final da drawer) ----------------------
function NotifRow({ n }) {
  const ch = NOTIF_CHANNELS[n.channel] || NOTIF_CHANNELS.whatsapp;
  const st = NOTIF_STATUS[n.status] || {};
  let when;
  if (n.status === 'agendada') when = `Agendada para ${fmtNotifWhen(n.scheduledFor)}`;
  else if (n.status === 'falhou') when = `Tentativa em ${fmtNotifWhen(n.scheduledFor)}`;
  else if (n.status === 'respondida') when = `Respondida · ${fmtNotifWhen(n.at)}`;
  else when = `${st.label} · ${fmtNotifWhen(n.at)}`;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: `1px solid ${WT.borderSub}` }}>
      <span style={{ width: 30, height: 30, borderRadius: '50%', flex: 'none', background: ch.color + '1a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <WIcon name={ch.icon} size={15} color={ch.color} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: WT.wEmph, color: WT.fg }}>{n.label}</div>
        <div style={{ fontSize: 12, color: WT.muted }}>{ch.label} · {when}</div>
      </div>
      <WBadge type={st.badge} icon={st.icon}>{st.label}</WBadge>
    </div>
  );
}
function NotificationsSection({ appt }) {
  const list = apptNotifications(appt);
  const ns = notifSummary(appt);
  return (
    <Section icon="bell-ring" title="Notificações ao paciente">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13, color: WT.fg2, marginTop: -2 }}>
        <WIcon name={ns.received ? 'check-check' : 'clock'} size={15} color={ns.received ? WT.success : WT.muted} />
        <span><strong style={{ fontWeight: WT.wHead, color: WT.fg }}>{ns.received}</strong> recebida{ns.received !== 1 ? 's' : ''} de {ns.sent} enviada{ns.sent !== 1 ? 's' : ''}</span>
        {ns.scheduled > 0 && <span>· {ns.scheduled} agendada{ns.scheduled > 1 ? 's' : ''}</span>}
        {ns.failed > 0 && <span style={{ color: WT.danger }}>· {ns.failed} com falha</span>}
        {ns.confirmed && <WBadge type="success" icon="user-check">Presença confirmada</WBadge>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {list.length === 0
          ? <div style={{ fontSize: 13, color: WT.muted, padding: '8px 0' }}>Nenhuma notificação para este agendamento.</div>
          : list.map((n, i) => <NotifRow key={n.key + i} n={n} />)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: WT.muted }}>
        <WIcon name="info" size={12} color={WT.muted} />Enviadas por WhatsApp, SMS e e-mail conforme as preferências do paciente.
      </div>
    </Section>
  );
}

// linha do formulário: calha de ícone (20px) + 16px de vão + campo — métricas do Figma
function FRow({ icon, top = 7, children }) {
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <span style={{ width: 20, flex: 'none', display: 'flex', justifyContent: 'center', marginTop: top }}>
        {icon && <WIcon name={icon} size={18} color={WT.muted} />}
      </span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  );
}
function FHead({ children }) {
  return <div style={{ fontSize: 14, fontWeight: WT.wHead, color: WT.fg, lineHeight: '20px', paddingBottom: 4 }}>{children}</div>;
}
function FDivider() {
  return <WDivider style={{ margin: '16px 0', flex: 'none' }} />;
}

// ---- Full booking form (Tier 2) --------------------------------------------
function BookingForm({ init, config, perms, slotPick, active, onCancel, onSave, onDraft, onPatientChange, embedded }) {
  const [form, setForm] = React.useState(() => {
    const f = {
      patient: init.patient || null, procIds: init.procIds || (init.procId ? [init.procId] : []), proId: init.proId || PROS[0].id,
      date: init.date || TODAY, time: init.time || '08:00', local: PROS.find(p => p.id === (init.proId || PROS[0].id))?.room || UNITS[0],
      plano: false, convenio: '', tabela: '', valor: '', canal: 'Telefone', notas: '', paciente: {}, equip: init.equip || '',
    };
    const sumPrice = f.procIds.reduce((s, id) => s + ((PROCS[id] || {}).price || 0), 0);
    f.valor = f.procIds.length ? String(sumPrice.toFixed(2)) : '';
    return f;
  });
  const [errors, setErrors] = React.useState({});
  const upd = patch => setForm(s => ({ ...s, ...patch }));
  const updPac = (k, v) => setForm(s => ({ ...s, paciente: { ...s.paciente, [k]: v } }));
  const totalDur = form.procIds.reduce((s, id) => s + ((PROCS[id] || {}).dur || 0), 0);
  // pré-visualização ao vivo no grid: o placeholder acompanha tudo que é digitado
  React.useEffect(() => {
    if (!onDraft || active === false) return;
    const ptRec = form.patient && form.patient.patientId ? patientById(form.patient.patientId) : null;
    onDraft({
      time: form.time, dur: totalDur || 30, proId: form.proId, date: form.date,
      patientName: form.patient ? ((ptRec && ptRec.name) || form.patient.patientName) : null,
      procIds: form.procIds,
    });
  }, [form.time, totalDur, form.proId, form.date, form.patient, form.procIds, active]);
  React.useEffect(() => { onPatientChange && onPatientChange(form.patient); }, [form.patient]);
  const reqEquipId = form.procIds.map(id => (PROCS[id] || {}).reqEquip).find(Boolean) || null;
  const [showEquip, setShowEquip] = React.useState(!!init.equip);
  React.useEffect(() => { if (reqEquipId && form.equip !== reqEquipId) upd({ equip: reqEquipId }); }, [reqEquipId]);

  // clique num horário vago do grid com o painel aberto → atualiza data/horário/profissional
  React.useEffect(() => {
    if (!slotPick) return;
    const patch = { date: slotPick.date, time: slotPick.time };
    if (slotPick.proId) { patch.proId = slotPick.proId; patch.local = PROS.find(p => p.id === slotPick.proId)?.room || form.local; }
    if (slotPick.equip) patch.equip = slotPick.equip;
    if (slotPick.room) patch.local = slotPick.room;
    upd(patch);
  }, [slotPick && slotPick.seq]);

  // when procedures change, auto-recompute the particular value (sum of prices)
  const setProcs = ids => { const sum = ids.reduce((s, id) => s + ((PROCS[id] || {}).price || 0), 0); upd({ procIds: ids, valor: ids.length ? String(sum.toFixed(2)) : form.valor }); };

  // assemble configurable patient fields to render
  const pacObrig = (config.paciente.obrigar || []);
  const pacExib = (config.paciente.exibir || []);
  const agObrig = (config.agendamento.obrigar || []);
  const agExib = (config.agendamento.exibir || []);
  const patientFieldsToRender = Array.from(new Set(['Cel1', 'Email1', ...pacObrig, ...pacExib, ...agObrig, ...agExib]
    .filter(f => PATIENT_FIELDS[f])));
  const requiredSet = new Set([...pacObrig, ...agObrig]);
  const showTabela = requiredSet.has('Tabela') || pacExib.includes('Tabela') || agExib.includes('Tabela');
  const reqTabela = requiredSet.has('Tabela');

  // prefill known data for existing patient so required fields are satisfied
  React.useEffect(() => {
    if (form.patient && form.patient.patientId) {
      const p = patientById(form.patient.patientId) || {};
      setForm(s => ({ ...s, paciente: { ...s.paciente, Nascimento: s.paciente.Nascimento || p.birth, Cel1: s.paciente.Cel1 || p.phone } }));
    }
  }, [form.patient && form.patient.patientId]);

  function validate() {
    const e = {};
    if (!form.patient) e.patient = 'Selecione ou cadastre o paciente';
    if (!form.procIds.length) e.procIds = 'Selecione ao menos um procedimento';
    if (!form.date) e.date = 'Obrigatório';
    if (!form.time) e.time = 'Obrigatório';
    if (!form.local) e.local = 'Obrigatório';
    if (!form.plano && !form.valor && form.valor !== '0') e.valor = 'Informe o valor';
    if (form.plano && !form.convenio) e.convenio = 'Selecione o convênio';
    if (!form.plano && showTabela && reqTabela && !form.tabela) e.tabela = 'Selecione a tabela particular';
    // contact: at least one of Tel1/Cel1/Email1
    const hasContact = CONTACT_FIELDS.some(f => (form.paciente[f] || '').trim());
    if (!hasContact) e._contact = 'Informe ao menos um contato (telefone ou e-mail)';
    // configured required patient fields
    requiredSet.forEach(f => { if (PATIENT_FIELDS[f] && !(form.paciente[f] || '').toString().trim()) e['pac_' + f] = 'Obrigatório'; });
    return e;
  }

  function submit(checkin) {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; } // NO DATA WIPE — form state untouched
    onSave({ form, checkin });
  }

  const errCount = Object.keys(errors).length;
  const hasEquipRow = showEquip || form.equip || reqEquipId;

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '16px 16px 28px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {errCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: WT.rM, background: WT.dangerSoft, border: `1px solid ${WT.borderDanger}`, color: WT.danger, fontSize: 13, fontWeight: WT.wEmph, marginBottom: 8 }}>
            <WIcon name="alert-triangle" size={16} color={WT.danger} />
            {errCount} campo(s) precisam de atenção — seus dados foram mantidos.
          </div>
        )}

        <FHead>Paciente</FHead>
        <FRow icon="user-round">
          <PatientAutocomplete noLabel value={form.patient} onSelect={p => upd({ patient: p })} onNew={name => upd({ patient: { patientName: name, isNew: true } })} error={errors.patient} />
          {form.patient && form.patient.isNew && (
            <div style={{ fontSize: 12, color: WT.fg2, display: 'flex', alignItems: 'center', gap: 6 }}><WIcon name="info" size={13} color={WT.accent} />Novo cadastro — preencha os dados exigidos pela clínica.</div>
          )}
          {form.patient && errors._contact && <div style={{ fontSize: 12, color: WT.danger, display: 'flex', alignItems: 'center', gap: 4 }}><WIcon name="alert-circle" size={12} color={WT.danger} />{errors._contact}</div>}
          {form.patient && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 8 }}>
              {patientFieldsToRender.map(f => (
                <PatientField key={f} name={f} noLabel size="m" value={form.paciente[f]} onChange={v => updPac(f, v)} required={requiredSet.has(f)} error={errors['pac_' + f]} />
              ))}
            </div>
          )}
        </FRow>

        <FDivider />
        <FHead>Detalhes da visita</FHead>
        <FRow icon="contact-round">
          <WSelect value={form.proId} onChange={v => upd({ proId: v, local: PROS.find(p => p.id === v)?.room })} options={PROS.map(p => ({ value: p.id, label: `${p.name} · ${p.spec}` }))} placeholder={null} />
        </FRow>
        <FRow icon="calendar">
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.53fr) minmax(0,1fr)', gap: 8 }}>
            <WInput type="date" value={form.date} onChange={v => upd({ date: v })} error={errors.date} />
            <WInput value={form.time} onChange={v => upd({ time: v })} placeholder="Horário" suffixIcon="clock" error={errors.time} />
          </div>
        </FRow>
        <FRow icon="door-open">
          <WSelect value={form.local} onChange={v => upd({ local: v })} options={ROOMS.map(r => r.name)} placeholder="Local / unidade" error={errors.local} />
        </FRow>
        <FRow icon="stethoscope">
          <ProcMultiSelect value={form.procIds} onChange={setProcs} error={errors.procIds} options={PROC_LIST} />
          {form.procIds.length > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: -2 }}><WIcon name="clock" size={13} color={WT.muted} /><span style={{ fontSize: 12, color: WT.muted }}>Duração total {totalDur} min · cor pelo 1º procedimento</span></div>}
        </FRow>
        {!window.__mvp && (
          <FRow icon="wrench" top={hasEquipRow ? 7 : 4}>
            {hasEquipRow
              ? <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <WSelect value={form.equip} onChange={v => upd({ equip: v })} options={[{ value: '', label: 'Nenhum' }, ...EQUIP.map(e => ({ value: e.id, label: e.name }))]} placeholder="Vincular equipamento…" />
                  {reqEquipId
                    ? <span style={{ fontSize: 12, color: WT.fg2, display: 'flex', alignItems: 'center', gap: 5 }}><WIcon name="info" size={12} color={WT.accent} />Equipamento exigido pelo procedimento selecionado.</span>
                    : <button type="button" onClick={() => { upd({ equip: '' }); setShowEquip(false); }} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: WT.muted, fontSize: 12, cursor: 'pointer', fontFamily: WT.font, padding: 0 }}>Remover equipamento</button>}
                </div>
              : <button type="button" onClick={() => setShowEquip(true)} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, height: 26, padding: '0 10px', borderRadius: WT.rM, border: `1px dashed ${WT.borderHover}`, background: 'transparent', cursor: 'pointer', fontFamily: WT.font, fontSize: 13, fontWeight: WT.wEmph, color: WT.accent }}><WIcon name="plus" size={14} color={WT.accent} />Adicionar equipamento</button>}
          </FRow>
        )}

        <FDivider />
        <FHead>Pagamento</FHead>
        {!window.__mvp && (
          <WSegmented fullWidth options={[{ value: 'convenio', label: 'Convênio' }, { value: 'particular', label: 'Particular' }]}
            value={form.plano ? 'convenio' : 'particular'} onChange={v => upd({ plano: v === 'convenio' })} />
        )}
        {!window.__mvp && form.plano && (
          <>
            <FRow icon="globe">
              <WSelect value={form.convenio} onChange={v => upd({ convenio: v })} options={CONVENIOS.filter(c => c !== 'Particular')} placeholder="Convênio" error={errors.convenio} />
            </FRow>
            <FRow icon="credit-card">
              <WInput value={form.paciente.Matricula1 || ''} onChange={v => updPac('Matricula1', v)} placeholder="Carteirinha / matrícula" required={requiredSet.has('Matricula1')} error={errors.pac_Matricula1} />
            </FRow>
          </>
        )}
        {(window.__mvp || !form.plano) && (
          <>
            <FRow icon="banknote">
              <WInput value={form.valor} onChange={v => upd({ valor: v })} placeholder="Valor (R$)" error={errors.valor} />
            </FRow>
            {showTabela && (
              <FRow>
                <WSelect value={form.tabela} onChange={v => upd({ tabela: v })} options={TABELA_OPTS} placeholder="Tabela particular" error={errors.tabela} />
              </FRow>
            )}
          </>
        )}

        <FDivider />
        <FHead>Origem e observações</FHead>
        <FRow icon="megaphone">
          <WSelect value={form.canal} onChange={v => upd({ canal: v })} options={CHANNELS} />
        </FRow>
        <FRow icon="text">
          <WTextarea value={form.notas} onChange={v => upd({ notas: v })} placeholder="Notas internas, preparo, etc." rows={4} />
        </FRow>

        {init.appt && <><FDivider /><NotificationsSection appt={init.appt} /></>}
      </div>

      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: 14, borderTop: `1px solid ${WT.border}`, background: WT.raised }}>
        <WButton variant="default" label="Cancelar" onClick={onCancel} />
        <span style={{ flex: 1 }} />
        <WButton variant="primary" leadingIcon="check" label="Salvar" onClick={() => submit(false)} />
      </div>
    </div>
  );
}

// ---- Booking host (painel lateral acoplado / sheet no compacto) --------------
// ---- Trilha de alterações do agendamento (drawer sobreposta) ----------------
function AuditTrailDrawer({ appt, compact, onClose }) {
  const log = apptAuditLog(appt);
  const useSheet = compact;
  const width = useSheet ? '100%' : Math.min(460, window.innerWidth - 48);
  const fmtWhen = w => (typeof fmtNotifWhen === 'function' ? fmtNotifWhen(w) : w.toLocaleString('pt-BR'));
  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, background: WT.backdrop || '#25282880', zIndex: 1200, display: 'flex', justifyContent: useSheet ? 'center' : 'flex-end', alignItems: useSheet ? 'flex-end' : 'stretch' }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ background: WT.raised, display: 'flex', flexDirection: 'column', boxShadow: WT.shDialog, width, height: useSheet ? '88%' : '100%', maxWidth: '100%', borderRadius: useSheet ? '16px 16px 0 0' : 0, animation: useSheet ? 'sheetUp .22s ease' : 'drawerIn .2s ease', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: `1px solid ${WT.borderSub}`, flex: 'none' }}>
          <WIcon name="history" size={18} color={WT.accent} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: WT.wHead, color: WT.fg }}>Histórico de alterações</div>
            <div style={{ fontSize: 12, color: WT.muted }}>{log.length} registro{log.length !== 1 ? 's' : ''} · {fmtLongDate(appt.date)}{appt.start ? ` · ${appt.start}` : ''}</div>
          </div>
          <WIconButton name="x" onClick={onClose} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 28px' }}>
          {log.length === 0
            ? <div style={{ fontSize: 13, color: WT.muted }}>Nenhuma alteração registrada.</div>
            : (
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'absolute', left: 14, top: 6, bottom: 6, width: 2, background: WT.borderSub }} />
                {log.map((e, i) => (
                  <div key={i} style={{ position: 'relative', display: 'flex', gap: 14, paddingBottom: i === log.length - 1 ? 0 : 18 }}>
                    <span style={{ width: 30, height: 30, borderRadius: '50%', flex: 'none', background: e.color + '1a', border: `2px solid ${WT.raised}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                      <WIcon name={e.icon} size={15} color={e.color} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                      <div style={{ fontSize: 13.5, fontWeight: WT.wEmph, color: WT.fg }}>{e.title}</div>
                      {e.detail && <div style={{ fontSize: 12.5, color: WT.fg2, marginTop: 1 }}>{e.detail}</div>}
                      <div style={{ fontSize: 11.5, color: WT.muted, marginTop: 3, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                        <WIcon name="user" size={11} color={WT.muted} />{e.actor}<span style={{ opacity: .5 }}>·</span>{fmtWhen(e.when)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

function BookingHost({ init, kind: kindProp, config, compact, perms, appts, flash, slotPick, onCancel, onSave, onDraft, onBlockConfirm, onBlockDelete }) {
  const editing = !!init.editing && !!init.appt;
  const editingBlock = !!init.block;
  const isEdit = editing || editingBlock;
  // Tipo de criação (Agendamento · Bloqueio · Encaixe). Na edição o tipo é fixo —
  // não há conversão entre tipos, então o seletor não aparece.
  const [kind, setKind] = React.useState(kindProp || (editingBlock ? 'bloqueio' : (init.fitIn ? 'encaixe' : 'agendamento')));
  // troca de tipo → o placeholder no grid muda de aparência na hora
  React.useEffect(() => { onDraft && onDraft({ kind }); }, [kind]);
  const [showAudit, setShowAudit] = React.useState(false);
  const [patient, setPatient] = React.useState(init.patient || null);
  const pObj = patient && patient.patientId ? patientById(patient.patientId) : null;
  const ptName = kind === 'bloqueio' ? null : (pObj ? pObj.name : (patient && patient.patientName));
  const _perms = perms || { editFicha: true, verConta: true };
  const TITLES = {
    agendamento: editing ? 'Editar agendamento' : 'Novo agendamento',
    encaixe: 'Novo encaixe',
    bloqueio: editingBlock ? 'Bloqueio' : 'Novo bloqueio',
  };
  const title = TITLES[kind] || TITLES.agendamento;

  const inner = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: `1px solid ${WT.borderSub}`, flex: 'none' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: WT.wHead, color: WT.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ptName || title}</div>
          <div style={{ fontSize: 12, color: WT.muted }}>{ptName ? title + ' · ' : ''}{fmtLongDate(init.date || TODAY)}{init.time ? ` · ${init.time}` : ''}</div>
        </div>
        {editing && <WButton variant="default" size="s" leadingIcon="history" label="Alterações" onClick={() => setShowAudit(true)} />}
        <WIconButton name="x" onClick={onCancel} />
      </div>
      {!isEdit && (
        <div style={{ padding: '12px 16px 0', flex: 'none' }}>
          <WSegmented fullWidth value={kind} onChange={setKind}
            options={[{ value: 'agendamento', label: 'Agendamento' }, { value: 'bloqueio', label: 'Bloqueio' }, { value: 'encaixe', label: 'Encaixe' }]} />
        </div>
      )}
      {/* Ambos os formulários ficam montados na criação (troca de tipo não perde dados). */}
      {!editingBlock && (
        <div style={{ display: kind !== 'bloqueio' ? 'flex' : 'none', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <BookingForm init={init} config={config} perms={_perms} slotPick={slotPick} onCancel={onCancel}
            active={kind !== 'bloqueio'}
            onSave={({ form, checkin }) => onSave({ form, checkin, fitIn: kind === 'encaixe' })}
            onDraft={patch => onDraft && onDraft({ ...patch, kind })} onPatientChange={setPatient} />
        </div>
      )}
      {!editing && (
        <div style={{ display: kind === 'bloqueio' ? 'flex' : 'none', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <BlockForm ctx={{ proId: init.proId, date: init.date, time: init.time }} block={init.block} appts={appts}
            slotPick={slotPick} active={kind === 'bloqueio'} onDraft={onDraft}
            onCancel={onCancel} onConfirm={onBlockConfirm} onDelete={onBlockDelete} />
        </div>
      )}
    </>
  );

  if (!compact) {
    return (
      <aside style={{ width: 380, flex: 'none', minWidth: 0, borderLeft: `1px solid ${WT.border}`, background: WT.raised, display: 'flex', flexDirection: 'column' }}>
        {inner}
        {showAudit && editing && <AuditTrailDrawer appt={init.appt} compact={compact} onClose={() => setShowAudit(false)} />}
      </aside>
    );
  }
  return (
    <div onMouseDown={onCancel} style={{ position: 'fixed', inset: 0, background: WT.backdrop || '#25282880', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
      <div onMouseDown={e => e.stopPropagation()} style={{
        background: WT.raised, display: 'flex', flexDirection: 'column', boxShadow: WT.shDialog,
        width: '100%', height: '100%', maxHeight: '94%', maxWidth: '100%',
        borderRadius: '16px 16px 0 0', animation: 'sheetUp .22s ease', overflow: 'hidden',
      }}>
        {inner}
      </div>
      {showAudit && editing && <AuditTrailDrawer appt={init.appt} compact={compact} onClose={() => setShowAudit(false)} />}
    </div>
  );
}

Object.assign(window, { PatientAutocomplete, QuickCreatePopover, PatientField, BookingForm, BookingHost, AuditTrailDrawer, FRow, FHead, FDivider });
