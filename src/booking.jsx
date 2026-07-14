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
      <WLabel required={required}>{label}{hint ? <span style={{ fontWeight: WT.wBody, color: WT.muted }}> · {hint}</span> : null}</WLabel>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 10px', borderRadius: WT.rM, border: `1px solid ${error ? WT.borderDanger : WT.border}`, background: '#fff' }}>
            <WIcon name="search" size={16} />
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
function PatientAutocomplete({ value, onSelect, onNew, error, autoFocus }) {
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const sel = value ? (patientById(value.patientId) || { name: value.patientName }) : null;
  const matches = q ? PATIENTS.filter(p => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : [];
  if (sel && !open) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <WLabel required>Paciente</WLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, padding: '6px 8px 6px 10px', borderRadius: WT.rM, border: `1px solid ${WT.border}`, background: '#fff' }}>
          <WAvatar initials={(sel.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('')} size={28} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: WT.wEmph, color: WT.fg }}>{sel.name}</span>
              {value.isNew && <WBadge type="accent">novo</WBadge>}
              {sel.firstVisit && <WBadge type="accent" icon="sparkles">1ª vez</WBadge>}
              {sel.priority && PRIORITIES[sel.priority] && <WBadge type="warning" icon={PRIORITIES[sel.priority].icon}>{PRIORITIES[sel.priority].label}</WBadge>}
            </div>
            {sel.phone && <div style={{ fontSize: 12, color: WT.muted }}>{sel.phone}</div>}
          </div>
          <WIconButton name="x" dim={28} onClick={() => { onSelect(null); setQ(''); setOpen(true); }} />
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, position: 'relative' }}>
      <WLabel required>Paciente</WLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 10px', borderRadius: WT.rM, border: `1px solid ${error ? WT.borderDanger : WT.border}`, background: '#fff' }}>
        <WIcon name="search" size={16} />
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
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, color: WT.fg }}>{p.name}</div><div style={{ fontSize: 12, color: WT.muted }}>{p.phone} · {p.conv}</div></div>
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
  const pro = PROS.find(p => p.id === ctx.proId) || PROS[0];
  const [patient, setPatient] = React.useState(null);
  const [procIds, setProcIds] = React.useState([]);
  const [time, setTime] = React.useState(ctx.time);
  const [pay, setPay] = React.useState('particular'); // 'particular' | 'convenio'
  const [conv, setConv] = React.useState('');
  const [tel, setTel] = React.useState('');
  const [err, setErr] = React.useState({});
  const totalDur = procIds.reduce((s, id) => s + ((PROCS[id] || {}).dur || 0), 0);
  const totalPrice = procIds.reduce((s, id) => s + ((PROCS[id] || {}).price || 0), 0);
  const grade = gradeAt(ctx.proId, ctx.date, time);
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
  React.useEffect(() => { onDraft && onDraft({ time, dur: totalDur || gradeSlotAt(ctx.proId, ctx.date, time) || 30 }); }, [time, totalDur]);
  const save = () => {
    const e = {};
    if (!patient) e.patient = 'Selecione um paciente';
    if (!tel.trim()) e.tel = 'Telefone é obrigatório para agendar';
    if (!procIds.length) e.proc = 'Selecione ao menos um procedimento';
    if (pay === 'convenio' && !conv) e.conv = 'Selecione o convênio';
    if (pay === 'convenio' && conv && grade && grade.convenios && !grade.convenios.includes(conv)) e.conv = 'Convênio não atendido nesta grade';
    if (Object.keys(e).length) { setErr(e); return; }
    onSave({ ...ctx, patient, procIds, time, payPlano: pay === 'convenio', payConv: pay === 'convenio' ? conv : 'Particular' });
  };
  return (
    <WPopover anchorRect={anchorRect} onClose={onClose} width={340}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 8px 10px 14px', borderBottom: `1px solid ${WT.borderSub}`, flex: 'none' }}>
        <span style={{ flex: 1, fontSize: 15, fontWeight: WT.wHead, color: WT.fg }}>Novo agendamento</span>
        <WIconButton name="x" dim={28} onClick={onClose} />
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 0, overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: WT.fg2 }}>
          <WIcon name="user-round" size={14} color={pro.color} /> {pro.name}
          <span style={{ flex: 1 }} />
          <WIcon name="calendar" size={14} /> {fmtShortDate(ctx.date)}
        </div>
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
        <div style={{ display: 'flex', gap: 10 }}>
          <WInput label="Horário" value={time} onChange={setTime} suffixIcon="clock" size="l" style={{ width: 110 }} />
          {procIds.length > 0 && <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}><WLabel>Resumo</WLabel><div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: WT.fg2 }}><WBadge type="neutral"><span style={{ color: WT.fg2 }}>{totalDur} min</span></WBadge>{pay === 'particular' ? (totalPrice ? brl(totalPrice) : 'Sem cobrança') : <span style={{ color: WT.muted }}>Coberto pelo convênio</span>}</div></div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <WLabel required>Pagamento</WLabel>
          <WSegmented options={[{ value: 'particular', label: 'Particular' }, { value: 'convenio', label: 'Convênio' }]} value={pay} onChange={v => { setPay(v); setErr(s => ({ ...s, conv: undefined })); }} />
          {pay === 'convenio' && <WSelect value={conv} onChange={v => { setConv(v); setErr(s => ({ ...s, conv: undefined })); }} options={CONVENIOS.filter(c => c !== 'Particular')} placeholder="Selecione o convênio" error={err.conv} size="l" />}
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
function PatientField({ name, value, onChange, required, error }) {
  const label = PATIENT_FIELDS[name] || name;
  if (name === 'Nascimento') return <WInput label={label} required={required} type="date" value={value || ''} onChange={onChange} error={error} size="l" />;
  if (name === 'Sexo') return <WSelect label={label} required={required} value={value || ''} onChange={onChange} options={SEXO_OPTS} error={error} size="l" />;
  if (name === 'Origem') return <WSelect label={label} required={required} value={value || ''} onChange={onChange} options={ORIGEM_OPTS} error={error} size="l" />;
  if (name === 'Tabela') return <WSelect label={label} required={required} value={value || ''} onChange={onChange} options={TABELA_OPTS} error={error} size="l" />;
  if (name === 'IndicadoPorSelecao') return <WSelect label={label} required={required} value={value || ''} onChange={onChange} options={PROS.map(p => p.name)} error={error} size="l" />;
  const ph = name === 'Email1' ? 'nome@email.com' : name === 'CPF' ? '000.000.000-00' : (name === 'Cel1' || name === 'Tel1') ? '(11) 90000-0000' : '';
  return <WInput label={label} required={required} value={value || ''} onChange={onChange} error={error} placeholder={ph} size="l" />;
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

// ---- Full booking form (Tier 2) --------------------------------------------
function BookingForm({ init, config, perms, onCancel, onSave, onDraft, onPatientChange, embedded }) {
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
  React.useEffect(() => { onDraft && onDraft({ time: form.time, dur: totalDur || 30 }); }, [form.time, totalDur]);
  React.useEffect(() => { onPatientChange && onPatientChange(form.patient); }, [form.patient]);
  const reqEquipId = form.procIds.map(id => (PROCS[id] || {}).reqEquip).find(Boolean) || null;
  const [showEquip, setShowEquip] = React.useState(!!init.equip);
  React.useEffect(() => { if (reqEquipId && form.equip !== reqEquipId) upd({ equip: reqEquipId }); }, [reqEquipId]);

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

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '16px 16px 28px', display: 'flex', flexDirection: 'column', gap: 14, background: WT.bg }}>
        {errCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: WT.rM, background: WT.dangerSoft, border: `1px solid ${WT.borderDanger}`, color: WT.danger, fontSize: 13, fontWeight: WT.wEmph }}>
            <WIcon name="alert-triangle" size={16} color={WT.danger} />
            {errCount} campo(s) precisam de atenção — seus dados foram mantidos.
          </div>
        )}

        <Section icon="user-round" title="Paciente">
          <PatientAutocomplete value={form.patient} onSelect={p => upd({ patient: p })} onNew={name => upd({ patient: { patientName: name, isNew: true } })} error={errors.patient} />
          {form.patient && form.patient.isNew && (
            <div style={{ fontSize: 12, color: WT.fg2, display: 'flex', alignItems: 'center', gap: 6, marginTop: -4 }}><WIcon name="info" size={13} color={WT.accent} />Novo cadastro — preencha os dados exigidos pela clínica.</div>
          )}
          {errors._contact && <div style={{ fontSize: 12, color: WT.danger, display: 'flex', alignItems: 'center', gap: 4 }}><WIcon name="alert-circle" size={12} color={WT.danger} />{errors._contact}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {patientFieldsToRender.map(f => (
              <PatientField key={f} name={f} value={form.paciente[f]} onChange={v => updPac(f, v)} required={requiredSet.has(f)} error={errors['pac_' + f]} />
            ))}
          </div>
        </Section>

        <Section icon="clipboard-list" title="Atendimento">
          <WSelect label="Profissional" value={form.proId} onChange={v => upd({ proId: v, local: PROS.find(p => p.id === v)?.room })} options={PROS.map(p => ({ value: p.id, label: `${p.name} · ${p.spec}` }))} size="l" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <WInput label="Data" required type="date" value={form.date} onChange={v => upd({ date: v })} error={errors.date} size="l" />
            <WInput label="Horário" required value={form.time} onChange={v => upd({ time: v })} suffixIcon="clock" error={errors.time} size="l" />
          </div>
          <ProcMultiSelect label="Procedimentos" required value={form.procIds} onChange={setProcs} error={errors.procIds} options={PROC_LIST} />
          {form.procIds.length > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: -2 }}><WIcon name="clock" size={13} color={WT.muted} /><span style={{ fontSize: 12, color: WT.muted }}>Duração total {totalDur} min · cor pelo 1º procedimento</span></div>}
          <WSelect label="Local / unidade" required value={form.local} onChange={v => upd({ local: v })} options={ROOMS.map(r => r.name)} error={errors.local} size="l" />
          {(showEquip || form.equip || reqEquipId)
            ? <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <WSelect label={reqEquipId ? 'Equipamento (exigido pelo procedimento)' : 'Equipamento'} required={!!reqEquipId} value={form.equip} onChange={v => upd({ equip: v })} options={[{ value: '', label: 'Nenhum' }, ...EQUIP.map(e => ({ value: e.id, label: e.name }))]} placeholder="Vincular equipamento…" size="l" />
                {reqEquipId
                  ? <span style={{ fontSize: 12, color: WT.fg2, display: 'flex', alignItems: 'center', gap: 5 }}><WIcon name="info" size={12} color={WT.accent} />Equipamento exigido pelo procedimento selecionado.</span>
                  : <button type="button" onClick={() => { upd({ equip: '' }); setShowEquip(false); }} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: WT.muted, fontSize: 12, cursor: 'pointer', fontFamily: WT.font, padding: 0 }}>Remover equipamento</button>}
              </div>
            : <button type="button" onClick={() => setShowEquip(true)} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px', borderRadius: WT.rM, border: `1px dashed ${WT.borderHover}`, background: 'transparent', cursor: 'pointer', fontFamily: WT.font, fontSize: 14, fontWeight: WT.wEmph, color: WT.accent }}><WIcon name="plus" size={15} color={WT.accent} />Adicionar equipamento</button>}
        </Section>

        <Section icon="banknote" title="Pagamento">
          <WToggle checked={form.plano} onChange={v => upd({ plano: v })} label="É plano / convênio?" />
          <div style={{ display: 'grid', gridTemplateColumns: form.plano ? '1fr' : (showTabela ? '1fr 1fr' : '1fr'), gap: 12 }}>
            {form.plano && <WSelect label="Convênio" required value={form.convenio} onChange={v => upd({ convenio: v })} options={CONVENIOS.filter(c => c !== 'Particular')} error={errors.convenio} size="l" />}
            {!form.plano && showTabela && <WSelect label="Tabela particular" required={reqTabela} value={form.tabela} onChange={v => upd({ tabela: v })} options={TABELA_OPTS} error={errors.tabela} size="l" />}
            {!form.plano && <WInput label="Valor" required value={form.valor} onChange={v => upd({ valor: v })} prefixIcon="banknote" error={errors.valor} size="l" />}
          </div>
          {form.plano && <WInput label="Carteirinha / matrícula" value={form.paciente.Matricula1 || ''} onChange={v => updPac('Matricula1', v)} required={requiredSet.has('Matricula1')} error={errors.pac_Matricula1} size="l" />}
        </Section>

        <Section icon="git-branch" title="Origem & observações">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <WSelect label="Canal de origem" value={form.canal} onChange={v => upd({ canal: v })} options={CHANNELS} size="l" />
          </div>
          <WTextarea label="Observações" value={form.notas} onChange={v => upd({ notas: v })} placeholder="Notas internas, preparo, etc." />
        </Section>

        {init.appt && <NotificationsSection appt={init.appt} />}
      </div>

      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: 14, borderTop: `1px solid ${WT.border}`, background: WT.raised }}>
        <WButton variant="default" label="Cancelar" onClick={onCancel} />
        <span style={{ flex: 1 }} />
        <WButton variant="secondary" leadingIcon="user-check" label="Salvar e check-in" onClick={() => submit(true)} />
        <WButton variant="primary" leadingIcon="check" label="Salvar" onClick={() => submit(false)} />
      </div>
    </div>
  );
}

// ---- Patient tab bar (Agendamento · Ficha · Histórico · Conta) --------------
function PatientTabBar({ tab, setTab, hasPatient, isNewPt, perms }) {
  const tabs = [
    { id: 'agendamento', label: 'Agendamento', icon: 'calendar-days' },
    { id: 'ficha',       label: 'Ficha',       icon: 'user-round' },
    { id: 'historico',   label: 'Histórico',   icon: 'list', disabled: !hasPatient || isNewPt, hint: 'Disponível após selecionar/salvar o paciente' },
    { id: 'conta',       label: 'Conta',       icon: 'wallet', disabled: !perms.verConta || !hasPatient || isNewPt, hint: !perms.verConta ? 'Você não tem permissão para ver a conta' : 'Disponível após selecionar/salvar o paciente' },
  ];
  return (
    <div role="tablist" style={{ display: 'flex', gap: 2, padding: '0 12px', borderBottom: `1px solid ${WT.border}`, background: WT.raised, flex: 'none', overflowX: 'auto' }}>
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <button key={t.id} role="tab" aria-selected={active} disabled={t.disabled} title={t.disabled ? t.hint : undefined}
            onClick={() => { if (!t.disabled) setTab(t.id); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, height: 44, padding: '0 12px', border: 'none', background: 'transparent',
              cursor: t.disabled ? 'not-allowed' : 'pointer', fontFamily: WT.font, fontSize: 14, fontWeight: active ? WT.wHead : WT.wEmph, whiteSpace: 'nowrap',
              color: t.disabled ? WT.placeholder : (active ? WT.accent : WT.fg2), borderBottom: `2px solid ${active ? WT.accentFill : 'transparent'}`, marginBottom: -1,
            }}>
            <WIcon name={t.icon} size={16} color={t.disabled ? WT.placeholder : (active ? WT.accent : WT.muted)} />{t.label}
          </button>
        );
      })}
    </div>
  );
}

// ---- Booking host (drawer / modal / sheet) ----------------------------------
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

function BookingHost({ init, config, flow, compact, perms, appts, flash, onCancel, onSave, onDraft }) {
  const [tab, setTab] = React.useState('agendamento');
  const [showAudit, setShowAudit] = React.useState(false);
  const [patient, setPatient] = React.useState(init.patient || null);
  const pid = patient && patient.patientId;
  const pObj = pid ? patientById(pid) : null;
  const isNewPt = !pid || !!(patient && patient.isNew);
  const hasPatient = !!pObj;
  const _perms = perms || { editFicha: true, verConta: true };
  const title = init.fitIn ? 'Novo encaixe' : (init.editing ? 'Editar agendamento' : 'Novo agendamento');
  const ptName = pObj ? pObj.name : (patient && patient.patientName);

  const editing = !!init.editing && !!init.appt;
  const Header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: `1px solid ${WT.borderSub}`, flex: 'none' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: WT.wHead, color: WT.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ptName || title}</div>
        <div style={{ fontSize: 12, color: WT.muted }}>{ptName ? title + ' · ' : ''}{fmtLongDate(init.date || TODAY)}{init.time ? ` · ${init.time}` : ''}</div>
      </div>
      {editing && <WButton variant="default" size="s" leadingIcon="history" label="Alterações" onClick={() => setShowAudit(true)} />}
      <WIconButton name="x" onClick={onCancel} />
    </div>
  );

  let body;
  if (tab === 'ficha') body = <FichaTab patient={pObj} pending={patient} perms={_perms} onFlash={flash} />;
  else if (tab === 'historico') body = <HistoricoTab patient={pObj} appts={appts} />;
  else if (tab === 'conta') body = <ContaTab patient={pObj} perms={_perms} onFlash={flash} />;
  else body = <BookingForm init={init} config={config} perms={_perms} onCancel={onCancel} onSave={onSave} onDraft={onDraft} onPatientChange={setPatient} />;

  const useSheet = compact;
  const useModal = !compact && flow === 'modal';
  const wide = tab !== 'agendamento';
  const vw = window.innerWidth;
  // Tamanho fixo: a ficha é a prioridade de dimensionamento, então a drawer
  // mantém a mesma largura em ambas as abas (não encolhe no agendamento).
  const width = useSheet ? '100%' : Math.min(880, vw - 48);
  return (
    <div onMouseDown={onCancel} style={{ position: 'fixed', inset: 0, background: WT.backdrop || '#25282880', zIndex: 1100, display: 'flex', justifyContent: useModal ? 'center' : (useSheet ? 'center' : 'flex-end'), alignItems: useSheet ? 'flex-end' : (useModal ? 'center' : 'stretch'), padding: useModal ? 24 : 0 }}>
      <div onMouseDown={e => e.stopPropagation()} style={{
        background: WT.raised, display: 'flex', flexDirection: 'column', boxShadow: WT.shDialog,
        width, height: (useModal && !wide) ? 'auto' : '100%', maxHeight: useSheet ? '94%' : (useModal ? '92vh' : '100%'),
        maxWidth: '100%', borderRadius: useSheet ? '16px 16px 0 0' : (useModal ? 16 : 0),
        animation: useSheet ? 'sheetUp .22s ease' : 'drawerIn .2s ease', transition: 'width .2s ease', overflow: 'hidden',
      }}>
        {Header}
        <PatientTabBar tab={tab} setTab={setTab} hasPatient={hasPatient} isNewPt={isNewPt} perms={_perms} />
        {body}
      </div>
      {showAudit && editing && <AuditTrailDrawer appt={init.appt} compact={compact} onClose={() => setShowAudit(false)} />}
    </div>
  );
}

Object.assign(window, { PatientAutocomplete, QuickCreatePopover, PatientField, BookingForm, BookingHost, AuditTrailDrawer });
