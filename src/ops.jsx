/* ============================================================================
   Feegow — New Agenda · Operations
   Cancel (clinic vs patient + reason) · Block · Reschedule (pick-a-slot)
   · Sala de Espera (waiting list)
   ============================================================================ */

function CenterModal({ title, icon, iconTone, width = 440, onClose, children, footer }) {
  React.useEffect(() => { const k = e => e.key === 'Escape' && onClose(); document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, [onClose]);
  const tone = iconTone === 'danger' ? WT.danger : WT.accent;
  const toneBg = iconTone === 'danger' ? WT.dangerSoft : WT.accentSoft;
  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, background: '#25282880', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ width, maxWidth: '100%', maxHeight: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', background: WT.raised, borderRadius: WT.rL, boxShadow: WT.shDialog, overflow: 'hidden', animation: 'modalIn .18s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 12px', flex: 'none' }}>
          {icon && <span style={{ width: 36, height: 36, borderRadius: WT.rM, background: toneBg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><WIcon name={icon} size={18} color={tone} /></span>}
          <h2 style={{ flex: 1, margin: 0, fontSize: 16, fontWeight: WT.wHead, color: WT.fg }}>{title}</h2>
          <WIconButton name="x" onClick={onClose} />
        </div>
        <div style={{ padding: '0 16px 16px', overflow: 'auto', flex: 1 }}>{children}</div>
        {footer && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 14, borderTop: `1px solid ${WT.border}`, background: WT.inset, flex: 'none' }}>{footer}</div>}
      </div>
    </div>
  );
}

const CANCEL_REASONS = {
  clinica: ['Profissional indisponível', 'Reagendamento interno', 'Equipamento em manutenção', 'Erro de marcação', 'Outro'],
  paciente: ['Paciente desmarcou', 'Paciente faltou', 'Imprevisto pessoal', 'Convênio não autorizado', 'Outro'],
};

function CancelModal({ a, onClose, onConfirm }) {
  const pt = patientById(a.pt) || { name: a.pt };
  const [by, setBy] = React.useState('paciente');
  const [reason, setReason] = React.useState('');
  const [err, setErr] = React.useState(false);
  const confirm = () => { if (!reason) { setErr(true); return; } onConfirm({ by, reason, label: `Cancelado pela ${by === 'clinica' ? 'clínica' : 'paciente'}: ${reason}` }); };
  return (
    <CenterModal title="Cancelar agendamento" icon="x-circle" iconTone="danger" onClose={onClose}
      footer={<><WButton variant="default" label="Voltar" onClick={onClose} /><span style={{ flex: 1 }} /><WButton variant="danger" leadingIcon="x-circle" label="Confirmar cancelamento" onClick={confirm} /></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 14, color: WT.fg2 }}><strong style={{ color: WT.fg, fontWeight: WT.wEmph }}>{pt.name}</strong> · {apptProcName(a)} · {a.start}</div>
        <div>
          <WLabel>Motivo do cancelamento</WLabel>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {[['paciente', 'Por paciente', 'user-round'], ['clinica', 'Pela clínica', 'building-2']].map(([v, l, ic]) => (
              <button key={v} onClick={() => { setBy(v); setReason(''); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 40, borderRadius: WT.rM, cursor: 'pointer', fontFamily: WT.font, fontSize: 14, fontWeight: WT.wEmph, border: `1.5px solid ${by === v ? WT.borderAccent : WT.border}`, background: by === v ? WT.accentSoft : '#fff', color: by === v ? WT.accent : WT.fg }}>
                <WIcon name={ic} size={16} color={by === v ? WT.accent : WT.muted} />{l}
              </button>
            ))}
          </div>
        </div>
        <WSelect label="Justificativa" required value={reason} onChange={v => { setReason(v); setErr(false); }} options={CANCEL_REASONS[by]} error={err ? 'Selecione uma justificativa' : null} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: WT.rM, background: WT.inset, fontSize: 12, color: WT.fg2 }}>
          <WIcon name="info" size={14} /> O motivo fica registrado no histórico e o horário é liberado.
        </div>
      </div>
    </CenterModal>
  );
}

function BlockModal({ ctx, block, appts, onClose, onConfirm, onDelete }) {
  const editing = !!block;
  const perms = block ? blockEditable(block) : { edit: true, del: false };
  const readOnly = editing && !perms.edit;
  const [resources, setResources] = React.useState(() => {
    if (!block) return ctx.proId ? [{ kind: 'pro', id: ctx.proId }] : [];
    if (block.scope === 'clinica') return [];
    return [...(block.pros || (block.scope === 'pro' && block.pro ? [block.pro] : [])).map(id => ({ kind: 'pro', id })), ...((block.equips || []).map(id => ({ kind: 'equip', id })))];
  });
  const [clinica, setClinica] = React.useState(block ? block.scope === 'clinica' : false);
  const proIds = resources.filter(r => r.kind === 'pro').map(r => r.id);
  const equipIds = resources.filter(r => r.kind === 'equip').map(r => r.id);
  const [units, setUnits] = React.useState(block && block.units && block.units.length ? block.units : [UNITS[0]]);
  const [date, setDate] = React.useState(block ? block.date : (ctx.date || TODAY));
  const [dateEnd, setDateEnd] = React.useState(block ? (block.dateEnd || block.date) : (ctx.date || TODAY));
  const [allDay, setAllDay] = React.useState(block ? !!block.allDay : false);
  const [start, setStart] = React.useState(block ? block.start : (ctx.time || '12:00'));
  const [end, setEnd] = React.useState(block ? block.end : fmtMin(toMin(ctx.time || '12:00') + 60));
  const [dias, setDias] = React.useState(block && block.diasSemana ? block.diasSemana : []);
  const recurOn = dias.length > 0;
  const [titulo, setTitulo] = React.useState(block ? (block.titulo || '') : '');
  const [descricao, setDescricao] = React.useState(block ? (block.descricao || '') : '');
  const [errors, setErrors] = React.useState({});
  const [confirmFeriado, setConfirmFeriado] = React.useState(false);

  const isRange = date !== dateEnd;
  const sd = allDay ? '00:00' : start, ed = allDay ? '23:59' : end;

  // agendamentos dentro da janela do bloqueio (aviso, não exclui)
  const affected = React.useMemo(() => {
    if (!appts) return [];
    return appts.filter(a => {
      if (a.status === 'cancelado') return false;
      if (!clinica && !(proIds.includes(a.pro) || equipIds.includes(a.equip))) return false;
      if (!blockOnDate({ date, dateEnd: isRange ? dateEnd : null, diasSemana: recurOn ? dias : null }, a.date)) return false;
      const s = toMin(a.start), e = s + a.dur, bs = toMin(sd), be = toMin(ed);
      return s < be && e > bs;
    });
  }, [clinica, resources, date, dateEnd, allDay, start, end, recurOn, dias, appts]);

  function validate() {
    const e = {};
    if (!allDay && toMin(ed) <= toMin(sd)) e.hora = 'A hora fim deve ser maior que a início';
    if (dateEnd < date) e.data = 'A data fim deve ser ≥ início';
    if (!units.length) e.units = 'Selecione ao menos 1 unidade';
    if (!clinica && !resources.length) e.resources = 'Selecione ao menos 1 agenda (profissional ou equipamento)';
    return e;
  }
  function submit() {
    if (readOnly) { onClose(); return; }
    const e = validate(); if (Object.keys(e).length) { setErrors(e); return; }
    if (perms.confirm && !confirmFeriado) { setConfirmFeriado(true); return; }
    onConfirm({
      id: block ? block.id : undefined,
      scope: clinica ? 'clinica' : ((proIds.length === 1 && equipIds.length === 0) ? 'pro' : 'multi'),
      pro: clinica ? 0 : ((proIds.length === 1 && equipIds.length === 0) ? proIds[0] : 0),
      pros: (!clinica && !(proIds.length === 1 && equipIds.length === 0)) ? proIds : undefined,
      equips: equipIds.length ? equipIds : undefined,
      units, date, dateEnd: (isRange || recurOn) ? dateEnd : undefined, allDay, start: sd, end: ed,
      diasSemana: recurOn ? dias : undefined, titulo: titulo || 'Bloqueio', descricao,
      tipo: block ? block.tipo : 'manual',
    });
  }
  const toggleDay = d => setDias(s => s.includes(d) ? s.filter(x => x !== d) : [...s, d].sort());
  const toggleUnit = u => setUnits(s => s.includes(u) ? s.filter(x => x !== u) : [...s, u]);

  const footer = readOnly
    ? <><span style={{ flex: 1 }} /><WButton variant="default" label="Fechar" onClick={onClose} /></>
    : <>
        {editing && perms.del && <WButton variant="default" leadingIcon="trash-2" label="Excluir" onClick={() => onDelete(block)} style={{ color: WT.danger }} />}
        <span style={{ flex: 1 }} />
        <WButton variant="default" label="Cancelar" onClick={onClose} />
        <WButton variant="primary" label={editing ? (perms.confirm && confirmFeriado ? 'Confirmar edição' : 'Salvar') : 'Bloquear'} onClick={submit} />
      </>;

  return (
    <CenterModal title={editing ? 'Bloqueio' : 'Novo bloqueio'} icon="ban" iconTone="danger" width={520} onClose={onClose} footer={footer}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {perms.note && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: WT.rM, background: readOnly ? WT.inset : WT.warningSoft, border: `1px solid ${readOnly ? WT.border : '#e8d27a'}`, fontSize: 12, color: readOnly ? WT.fg2 : WT.warning }}>
            <WIcon name={readOnly ? 'lock' : 'info'} size={14} color={readOnly ? WT.muted : WT.warning} />{perms.note}
          </div>
        )}

        {/* Recursos do bloqueio (profissionais + equipamentos juntos) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: readOnly ? 0.6 : 1, pointerEvents: readOnly ? 'none' : 'auto' }}>
          <WLabel required>Aplica-se a</WLabel>
          <WToggle checked={clinica} onChange={setClinica} label="Clínica inteira (todas as agendas)" />
          {!clinica && !readOnly && (
            <div style={{ border: `1px solid ${WT.border}`, borderRadius: WT.rM, overflow: 'hidden' }}>
              <ResourceBar selected={resources} date={date} onAdd={r => setResources(s => [...s, r])} onRemove={r => setResources(s => s.filter(x => !(x.kind === r.kind && x.id === r.id)))} />
            </div>
          )}
          {!clinica && readOnly && (
            <div style={{ fontSize: 13, color: WT.fg2 }}>{resources.map(r => { const m = resourceMeta(r); return m ? (m.short || m.name) : null; }).filter(Boolean).join(' · ') || '—'}</div>
          )}
          {errors.resources && <span style={{ fontSize: 12, color: WT.danger }}>{errors.resources}</span>}
        </div>

        {/* Datas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, opacity: readOnly ? 0.6 : 1, pointerEvents: readOnly ? 'none' : 'auto' }}>
          <WInput label="Data início" type="date" value={date} onChange={v => { setDate(v); if (dateEnd < v) setDateEnd(v); }} />
          <WInput label="Data fim" type="date" value={dateEnd} onChange={setDateEnd} error={errors.data} />
        </div>

        {/* Horário + dia inteiro */}
        <div style={{ opacity: readOnly ? 0.6 : 1, pointerEvents: readOnly ? 'none' : 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <WLabel>Horário</WLabel>
            <WToggle checked={allDay} onChange={setAllDay} label="Dia inteiro" />
          </div>
          {!allDay && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <WInput label="Início" value={start} onChange={setStart} suffixIcon="clock" />
              <WInput label="Fim" value={end} onChange={setEnd} suffixIcon="clock" error={errors.hora} />
            </div>
          )}
          {errors.hora && allDay && <span style={{ fontSize: 12, color: WT.danger }}>{errors.hora}</span>}
        </div>

        {/* Recorrência por dia da semana (dentro do período De–Até) */}
        {!readOnly && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <WLabel>Recorrência <span style={{ fontWeight: WT.wBody, color: WT.muted }}>· dias da semana, dentro do período</span></WLabel>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {DOW_ABBR.map((d, i) => <button key={i} onClick={() => toggleDay(i)} style={{ width: 40, height: 32, borderRadius: WT.rM, cursor: 'pointer', fontFamily: WT.font, fontSize: 12, fontWeight: WT.wEmph, textTransform: 'capitalize', border: `1.5px solid ${dias.includes(i) ? WT.borderAccent : WT.border}`, background: dias.includes(i) ? WT.accentSoft : '#fff', color: dias.includes(i) ? WT.accent : WT.fg2 }}>{d}</button>)}
            </div>
            {recurOn && !isRange && <span style={{ fontSize: 12, color: WT.warning, display: 'flex', alignItems: 'center', gap: 5 }}><WIcon name="info" size={12} color={WT.warning} />Defina a data fim para repetir ao longo das semanas.</span>}
            {recurOn && <button onClick={() => setDias([])} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: WT.muted, fontSize: 12, cursor: 'pointer', fontFamily: WT.font, padding: 0 }}>Limpar recorrência</button>}
          </div>
        )}

        {/* Unidades */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: readOnly ? 0.6 : 1, pointerEvents: readOnly ? 'none' : 'auto' }}>
          <WLabel required>Unidades</WLabel>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {UNITS.map(u => <WChip key={u} on={units.includes(u)} label={u} icon="building-2" onClick={() => toggleUnit(u)} />)}
          </div>
          {errors.units && <span style={{ fontSize: 12, color: WT.danger }}>{errors.units}</span>}
        </div>

        {/* Motivo / descrição */}
        {readOnly
          ? <div style={{ fontSize: 14, color: WT.fg }}><strong style={{ fontWeight: WT.wEmph }}>{titulo}</strong>{descricao ? ` — ${descricao}` : ''}</div>
          : <>
              <WInput label="Motivo / título" value={titulo} onChange={setTitulo} placeholder="Ex.: Almoço, reunião, cirurgia, férias" />
              <WTextarea label="Observação (opcional)" value={descricao} onChange={setDescricao} rows={2} />
            </>}

        {/* Aviso de agendamentos na janela */}
        {affected.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: WT.rM, background: WT.warningSoft, border: `1px solid #e8d27a`, fontSize: 12, color: WT.warning }}>
            <WIcon name="alert-triangle" size={15} color={WT.warning} style={{ flex: 'none', marginTop: 1 }} />
            <span><strong style={{ fontWeight: WT.wHead }}>{affected.length} agendamento(s)</strong> dentro desta janela serão mantidos — o bloqueio coexiste com eles. Lembretes (SMS/e-mail) pendentes desses horários serão removidos da fila.</span>
          </div>
        )}
        {perms.confirm && confirmFeriado && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: WT.rM, background: WT.dangerSoft, border: `1px solid ${WT.borderDanger}`, fontSize: 12, color: WT.danger }}>
            <WIcon name="alert-triangle" size={15} color={WT.danger} />Você está editando um bloqueio gerado a partir de um feriado. Confirme para aplicar.
          </div>
        )}
      </div>
    </CenterModal>
  );
}

// chip toggle for multi-select (pros / units)
function WChip({ on, label, color, icon, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 10px', borderRadius: WT.pill, cursor: 'pointer', fontFamily: WT.font, fontSize: 13, fontWeight: on ? WT.wEmph : WT.wBody, border: `1.5px solid ${on ? WT.borderAccent : WT.border}`, background: on ? WT.accentSoft : '#fff', color: on ? WT.accent : WT.fg }}>
      {color ? <span style={{ width: 9, height: 9, borderRadius: '50%', background: color }} /> : icon ? <WIcon name={icon} size={13} color={on ? WT.accent : WT.muted} /> : null}
      {label}
      {on && <WIcon name="check" size={13} color={WT.accent} />}
    </button>
  );
}

function RescheduleModal({ a, onClose, onConfirm }) {
  const pt = patientById(a.pt) || { name: a.pt };
  const [pro, setPro] = React.useState(a.pro);
  const [date, setDate] = React.useState(a.date);
  const [time, setTime] = React.useState(a.start);
  return (
    <CenterModal title="Remarcar agendamento" icon="calendar-clock" onClose={onClose}
      footer={<><WButton variant="default" label="Voltar" onClick={onClose} /><span style={{ flex: 1 }} /><WButton variant="primary" leadingIcon="check" label="Confirmar" onClick={() => onConfirm({ pro, date, time })} /></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 14, color: WT.fg2 }}><strong style={{ color: WT.fg, fontWeight: WT.wEmph }}>{pt.name}</strong> · {apptProcName(a)} ({a.dur}min)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: WT.rM, background: WT.accentSoft, fontSize: 12, color: WT.accent }}>
          <WIcon name="mouse-pointer-2" size={14} color={WT.accent} /> Dica: você também pode arrastar o card direto para o novo horário.
        </div>
        <WSelect label="Profissional" value={pro} onChange={setPro} options={PROS.map(p => ({ value: p.id, label: `${p.name} · ${p.spec}` }))} />
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10 }}>
          <WInput label="Data" type="date" value={date} onChange={setDate} />
          <WInput label="Novo horário" value={time} onChange={setTime} suffixIcon="clock" />
        </div>
      </div>
    </CenterModal>
  );
}

// ---- Sala de Espera (waiting list panel) ------------------------------------
function WaitingPanel({ appts, onClose, onCall, onFinish, onOpen }) {
  const waiting = appts.filter(a => a.date === TODAY && ['aguardando', 'em_atendimento'].includes(a.status))
    .sort((x, y) => toMin(x.start) - toMin(y.start));
  return (
    <aside style={{ width: 300, flex: 'none', background: WT.raised, borderLeft: `1px solid ${WT.border}`, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: `1px solid ${WT.border}` }}>
        <WIcon name="armchair" size={16} color={WT.accent} />
        <span style={{ flex: 1, fontSize: 14, fontWeight: WT.wHead, color: WT.fg }}>Sala de espera</span>
        <WBadge type="warning">{waiting.length}</WBadge>
        <WIconButton name="panel-right-close" dim={28} onClick={onClose} />
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {waiting.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: WT.muted, fontSize: 13 }}>Ninguém aguardando no momento.</div>}
        {waiting.map(a => {
          const pt = patientById(a.pt) || { name: a.pt };
          const pro = PROS.find(p => p.id === a.pro) || {};
          const elapsed = Math.max(0, NOW_MIN - toMin(a.start));
          const st = STATUS[a.status];
          return (
            <div key={a.id} style={{ border: `1px solid ${WT.border}`, borderRadius: WT.rM, padding: 10, display: 'flex', flexDirection: 'column', gap: 8, background: a.status === 'em_atendimento' ? WT.accentSoft : '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <WAvatar initials={pt.name.split(' ').map(w => w[0]).slice(0, 2).join('')} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: WT.wEmph, color: WT.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pt.name}</div>
                  <div style={{ fontSize: 11, color: WT.muted }}>{a.start} · {pro.short}</div>
                </div>
                <WBadge type={st.badge} icon={st.icon}>{st.short}</WBadge>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <WIcon name="clock" size={13} color={a.status === 'aguardando' && elapsed > 20 ? WT.danger : WT.muted} />
                <span style={{ fontSize: 12, color: a.status === 'aguardando' && elapsed > 20 ? WT.danger : WT.fg2, fontWeight: WT.wEmph }}>{a.status === 'em_atendimento' ? `em atendimento · ${elapsed} min` : `${elapsed} min de espera`}</span>
                <span style={{ flex: 1 }} />
                {a.status === 'aguardando'
                  ? <WButton variant="secondary" size="s" leadingIcon="bell" label="Chamar" onClick={() => onCall(a)} />
                  : <WButton variant="default" size="s" leadingIcon="check" label="Finalizar" onClick={() => onFinish(a)} />}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

// ---- Block chooser (semanal: vários bloqueios sobrepostos → escolher qual editar) ----
const blockTargetLabel = b => {
  if (b.scope === 'clinica') return 'Clínica inteira';
  const parts = [];
  const pros = b.scope === 'multi' ? (b.pros || []) : (b.pro ? [b.pro] : []);
  if (pros.length) parts.push(pros.length === 1 ? ((PROS.find(p => p.id === pros[0]) || {}).name || 'Profissional') : `${pros.length} profissionais`);
  if ((b.equips || []).length) parts.push(b.equips.length === 1 ? ((EQUIP.find(e => e.id === b.equips[0]) || {}).name || 'Equipamento') : `${b.equips.length} equipamentos`);
  return parts.join(' · ') || 'Profissional';
};
function BlockChooser({ blocks, onClose, onPick }) {
  return (
    <CenterModal title="Bloqueios neste horário" icon="layers" iconTone="danger" width={460} onClose={onClose}
      footer={<><span style={{ flex: 1 }} /><WButton variant="default" label="Fechar" onClick={onClose} /></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 13, color: WT.fg2 }}>{blocks.length} bloqueios se sobrepõem neste horário. Escolha qual deseja editar:</div>
        {blocks.map(b => (
          <button key={b.id} onClick={() => onPick(b)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: WT.rM, border: `1px solid ${WT.border}`, background: '#fff', cursor: 'pointer', textAlign: 'left', fontFamily: WT.font }}
            onMouseEnter={e => e.currentTarget.style.background = WT.hover} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
            <span style={{ width: 32, height: 32, borderRadius: WT.rM, background: WT.dangerSoft, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><WIcon name="ban" size={16} color={WT.danger} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: WT.wEmph, color: WT.fg }}>{b.titulo || 'Bloqueio'}</div>
              <div style={{ fontSize: 12, color: WT.muted }}>{blockTargetLabel(b)} · {b.allDay ? 'Dia inteiro' : `${b.start}–${b.end}`}{recurLabel(b) ? ' · ' + recurLabel(b) : ''}</div>
            </div>
            <WIcon name="chevron-right" size={16} color={WT.muted} />
          </button>
        ))}
      </div>
    </CenterModal>
  );
}

Object.assign(window, { CenterModal, CancelModal, BlockModal, BlockChooser, WChip, RescheduleModal, WaitingPanel, CANCEL_REASONS });
