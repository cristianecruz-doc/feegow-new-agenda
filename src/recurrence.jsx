/* ============================================================================
   Feegow — New Agenda · Agendamentos recorrentes (benchmark: Google Calendar)
   Regra → ocorrências · seletor "Não se repete / …" · recorrência personalizada
   · escopo (esta / esta e seguintes / todas) ao editar ou cancelar.
   Ocorrências são agendamentos comuns com { series: id, seq } — o card ganha o ícone.
   ============================================================================ */

const RC_DOW_LONG = ['domingo', 'terça… ', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
RC_DOW_LONG[1] = 'segunda';
const rcOrdinal = n => ['primeira', 'segunda', 'terceira', 'quarta', 'última'][n - 1] || `${n}ª`;
const rcWeekOfMonth = d => Math.ceil(d.getDate() / 7);

// presets no estilo Google, calculados a partir da data-base
function rcPresets(iso) {
  const d = parseISO(iso), dow = d.getDay();
  const wd = RC_DOW_LONG[dow].replace('… ', '');
  return [
    { id: 'none',    label: 'Não se repete' },
    { id: 'daily',   label: 'Todos os dias',                          rule: { freq: 'day', every: 1 } },
    { id: 'weekly',  label: `Semanal: cada ${wd}-feira`.replace('sábado-feira', 'sábado').replace('domingo-feira', 'domingo'), rule: { freq: 'week', every: 1, dow: [dow] } },
    { id: 'biweek',  label: `A cada 2 semanas: ${wd}`,                rule: { freq: 'week', every: 2, dow: [dow] } },
    { id: 'monthly', label: `Mensal na(o) ${rcOrdinal(rcWeekOfMonth(d))} ${wd}-feira`.replace('sábado-feira', 'sábado').replace('domingo-feira', 'domingo'), rule: { freq: 'month', every: 1, nth: rcWeekOfMonth(d), dow } },
    { id: 'weekday', label: 'Todos os dias da semana (segunda a sexta)', rule: { freq: 'week', every: 1, dow: [1, 2, 3, 4, 5] } },
    { id: 'custom',  label: 'Personalizar…' },
  ];
}
// texto humano da regra (aparece no card de contexto e no seletor)
function rcLabel(rule) {
  if (!rule) return 'Não se repete';
  const dows = (Array.isArray(rule.dow) ? rule.dow : []).slice().sort();
  const dowTxt = dows.map(i => DOW_ABBR[i]).join(', ');
  let base;
  if (rule.freq === 'day') base = rule.every > 1 ? `A cada ${rule.every} dias` : 'Todos os dias';
  else if (rule.freq === 'week') {
    if (dows.length === 5 && dows.join() === '1,2,3,4,5') base = 'Segunda a sexta';
    else base = (rule.every > 1 ? `A cada ${rule.every} semanas` : 'Semanal') + (dowTxt ? `: ${dowTxt}` : '');
  } else if (rule.freq === 'month') base = (rule.every > 1 ? `A cada ${rule.every} meses` : 'Mensal') + (rule.nth ? ` na ${rcOrdinal(rule.nth)} ${RC_DOW_LONG[rule.dow]}` : '');
  else base = 'Recorrente';
  if (rule.end && rule.end.type === 'until') base += ` · até ${dateUtil.fmtShortDate(rule.end.date)}`;
  else if (rule.end && rule.end.type === 'count') base += ` · ${rule.end.count} vezes`;
  return base;
}
// gera as datas (ISO) da série a partir da data-base — limite duro de 52 ocorrências
function rcDates(iso, rule, max = 52) {
  if (!rule) return [iso];
  const out = [];
  const until = rule.end && rule.end.type === 'until' ? rule.end.date : null;
  const count = rule.end && rule.end.type === 'count' ? rule.end.count : max;
  const push = d => { if (until && d > until) return false; out.push(d); return out.length < Math.min(count, max); };
  const start = parseISO(iso);
  if (rule.freq === 'day') {
    for (let i = 0; i < 400 && out.length < max; i++) { const d = dateUtil.addDays(iso, i * rule.every); if (!push(d)) break; }
  } else if (rule.freq === 'week') {
    const dows = (rule.dow && rule.dow.length ? rule.dow : [start.getDay()]).slice().sort();
    const weekStart = dateUtil.startOfWeek(iso);
    for (let w = 0; w < 120 && out.length < max; w += rule.every) {
      let stop = false;
      for (const dw of dows) {
        const d = dateUtil.addDays(weekStart, w * 7 + ((dw + 6) % 7));
        if (d < iso) continue;
        if (!push(d)) { stop = true; break; }
      }
      if (stop) break;
    }
  } else if (rule.freq === 'month') {
    for (let m = 0; m < 60 && out.length < max; m += rule.every) {
      const first = new Date(start.getFullYear(), start.getMonth() + m, 1);
      const off = (rule.dow - first.getDay() + 7) % 7;
      let day = 1 + off + (rule.nth - 1) * 7;
      const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      if (day > last) day -= 7; // "última" cai na anterior
      const d = dateUtil.isoOf(new Date(first.getFullYear(), first.getMonth(), day));
      if (d < iso) continue;
      if (!push(d)) break;
    }
  }
  return out.length ? out : [iso];
}

// ---- Seletor compacto (link "Não se repete" + ícone → menu de opções, sem sair do card) ----
function RecurrenceSelect({ date, value, onChange, bare }) {
  const presets = rcPresets(date);
  const [custom, setCustom] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const cur = !value ? 'none' : (presets.find(p => p.rule && JSON.stringify(p.rule) === JSON.stringify(value)) || {}).id || 'custom';
  const label = value ? rcLabel(value) : 'Não se repete';
  const pick = p => { setOpen(false); if (p.id === 'custom') { setCustom(true); return; } onChange(p.rule || null); };
  return (
    <>
      <button ref={ref} type="button" onClick={() => setOpen(o => !o)} title="Repetição"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 32, padding: '0 4px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: WT.font, alignSelf: 'flex-start', maxWidth: '100%' }}
        onMouseEnter={e => e.currentTarget.style.background = WT.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        {!bare && <span style={{ width: 28, height: 28, borderRadius: WT.rM, background: value ? WT.accentSoft : WT.inset, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><WIcon name="repeat" size={15} color={value ? WT.accent : WT.fg2} /></span>}
        <span style={{ fontSize: 13.5, fontWeight: WT.wEmph, color: WT.accent, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
        <WIcon name="chevron-down" size={14} color={WT.muted} style={{ flex: 'none' }} />
      </button>
      {open && ref.current && (
        <WPopover anchorRect={ref.current.getBoundingClientRect()} onClose={() => setOpen(false)} width={280} placement="below">
          <div style={{ padding: 6, display: 'flex', flexDirection: 'column' }}>
            {presets.map(p => { const on = p.id === cur; return (
              <button key={p.id} onClick={() => pick(p)} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36, padding: '0 10px', borderRadius: WT.rM, border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: WT.font, fontSize: 13.5, background: on ? WT.accentSoft : 'transparent', color: on ? WT.accent : WT.fg, fontWeight: on ? WT.wEmph : WT.wBody }}
                onMouseEnter={e => { if (!on) e.currentTarget.style.background = WT.hover; }} onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
                <span style={{ flex: 1 }}>{p.id === 'custom' && cur === 'custom' && value ? `Personalizado: ${rcLabel(value)}` : p.label}</span>
                {on && <WIcon name="check" size={14} color={WT.accent} />}
              </button>
            ); })}
          </div>
        </WPopover>
      )}
      {custom && <RecurrenceCustomModal date={date} value={value} onClose={() => setCustom(false)} onConfirm={r => { onChange(r); setCustom(false); }} />}
    </>
  );
}

// ---- Recorrência personalizada (Google: repetir a cada N · termina em) ------
function RecurrenceCustomModal({ date, value, onClose, onConfirm }) {
  const d = parseISO(date);
  const [every, setEvery] = React.useState((value && value.every) || 1);
  const [freq, setFreq] = React.useState((value && value.freq) || 'week');
  const [dow, setDow] = React.useState((value && value.dow && Array.isArray(value.dow)) ? value.dow : [d.getDay()]);
  const [endType, setEndType] = React.useState((value && value.end && value.end.type) || 'never');
  const [until, setUntil] = React.useState((value && value.end && value.end.date) || dateUtil.addDays(date, 90));
  const [count, setCount] = React.useState((value && value.end && value.end.count) || 12);
  const rule = {
    freq, every: Math.max(1, Number(every) || 1),
    ...(freq === 'week' ? { dow: dow.length ? dow : [d.getDay()] } : {}),
    ...(freq === 'month' ? { nth: rcWeekOfMonth(d), dow: d.getDay() } : {}),
    end: endType === 'until' ? { type: 'until', date: until } : endType === 'count' ? { type: 'count', count: Math.max(1, Number(count) || 1) } : null,
  };
  const n = rcDates(date, rule).length;
  const radio = (v, label, extra) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 36, cursor: 'pointer' }}>
      <input type="radio" checked={endType === v} onChange={() => setEndType(v)} style={{ accentColor: WT.accentFill, width: 16, height: 16, margin: 0 }} />
      <span style={{ fontSize: 14, color: WT.fg, width: 56 }}>{label}</span>{extra}
    </label>
  );
  return (
    <CenterModal title="Recorrência personalizada" icon="repeat" width={420} onClose={onClose}
      footer={<><span style={{ fontSize: 12, color: WT.muted }}>{n} ocorrência{n > 1 ? 's' : ''}{n >= 52 ? ' (limite)' : ''}</span><span style={{ flex: 1 }} /><WButton variant="default" label="Cancelar" onClick={onClose} /><WButton variant="primary" label="Concluir" onClick={() => onConfirm(rule)} /></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, color: WT.fg, whiteSpace: 'nowrap' }}>Repetir a cada</span>
          <WInput type="number" value={String(every)} onChange={setEvery} style={{ width: 70 }} />
          <WSelect value={freq} onChange={setFreq} placeholder="" style={{ width: 130 }}
            options={[{ value: 'day', label: every > 1 ? 'dias' : 'dia' }, { value: 'week', label: every > 1 ? 'semanas' : 'semana' }, { value: 'month', label: every > 1 ? 'meses' : 'mês' }]} />
        </div>
        {freq === 'week' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <WLabel>Repetir em</WLabel>
            <div style={{ display: 'flex', gap: 5 }}>
              {DOW_ABBR.map((l, i) => { const on = dow.includes(i); return (
                <button key={i} onClick={() => setDow(on ? dow.filter(x => x !== i) : [...dow, i])} title={l}
                  style={{ width: 34, height: 34, borderRadius: '50%', border: `1.5px solid ${on ? WT.borderAccent : WT.border}`, background: on ? WT.accentFill : '#fff', color: on ? '#fff' : WT.fg2, cursor: 'pointer', fontFamily: WT.font, fontSize: 12, fontWeight: WT.wEmph, textTransform: 'uppercase' }}>{l[0]}</button>
              ); })}
            </div>
          </div>
        )}
        {freq === 'month' && <span style={{ fontSize: 12.5, color: WT.fg2 }}>Na {rcOrdinal(rcWeekOfMonth(d))} {RC_DOW_LONG[d.getDay()]} de cada mês.</span>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <WLabel>Termina em</WLabel>
          {radio('never', 'Nunca')}
          {radio('until', 'Em', <WInput type="date" value={until} onChange={v => { setUntil(v); setEndType('until'); }} style={{ width: 170, opacity: endType === 'until' ? 1 : 0.55 }} />)}
          {radio('count', 'Após', <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: endType === 'count' ? 1 : 0.55 }}><WInput type="number" value={String(count)} onChange={v => { setCount(v); setEndType('count'); }} style={{ width: 80 }} /><span style={{ fontSize: 13, color: WT.fg2 }}>ocorrências</span></div>)}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: WT.rM, background: WT.inset, fontSize: 12, color: WT.fg2, lineHeight: 1.45 }}>
          <WIcon name="info" size={14} color={WT.accent} style={{ flex: 'none', marginTop: 1 }} />Ocorrências que caírem em horário ocupado, bloqueio ou dia sem grade do profissional são puladas e listadas antes de salvar.
        </div>
      </div>
    </CenterModal>
  );
}

// ---- Escopo da ação numa série (Google: este / este e seguintes / todos) ----
function RecurrenceScopeModal({ verb = 'Editar', a, total, onClose, onConfirm, danger }) {
  const [scope, setScope] = React.useState('one');
  const pt = patientById(a.pt) || { name: a.pt };
  const opts = [['one', 'Este agendamento'], ['following', 'Este e os seguintes'], ['all', 'Todos os agendamentos da série']];
  return (
    <CenterModal title={`${verb} agendamento recorrente`} icon="repeat" iconTone={danger ? 'danger' : undefined} width={420} onClose={onClose}
      footer={<><WButton variant="default" label="Cancelar" onClick={onClose} /><span style={{ flex: 1 }} /><WButton variant={danger ? 'danger' : 'primary'} label="OK" onClick={() => onConfirm(scope)} /></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 13.5, color: WT.fg2 }}><strong style={{ color: WT.fg, fontWeight: WT.wEmph }}>{pt.name}</strong> · {apptProcName(a)} · {rcLabel(a.seriesRule)}{total ? ` · ${total} na série` : ''}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {opts.map(([v, l]) => (
            <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 38, cursor: 'pointer' }}>
              <input type="radio" checked={scope === v} onChange={() => setScope(v)} style={{ accentColor: WT.accentFill, width: 16, height: 16, margin: 0 }} />
              <span style={{ fontSize: 14, color: WT.fg }}>{l}</span>
            </label>
          ))}
        </div>
      </div>
    </CenterModal>
  );
}

// ---- Confirmação de conflitos ao criar a série ------------------------------
function RecurrenceConflictsModal({ ok, skipped, onClose, onConfirm }) {
  return (
    <CenterModal title="Criar agendamentos recorrentes" icon="repeat" width={460} onClose={onClose}
      footer={<><WButton variant="default" label="Voltar" onClick={onClose} /><span style={{ flex: 1 }} /><WButton variant="primary" leadingIcon="check" label={`Criar ${ok.length}`} onClick={onConfirm} disabled={!ok.length} /></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 13.5, color: WT.fg }}><strong style={{ fontWeight: WT.wEmph }}>{ok.length}</strong> ocorrência{ok.length !== 1 ? 's' : ''} ser{ok.length !== 1 ? 'ão' : 'á'} criada{ok.length !== 1 ? 's' : ''}{skipped.length ? `, ${skipped.length} pulada${skipped.length > 1 ? 's' : ''}:` : '.'}</div>
        {skipped.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflow: 'auto', padding: '8px 10px', borderRadius: WT.rM, background: '#fff6ba', border: '1px solid #e8d27a' }}>
            {skipped.map((s, i) => <span key={i} style={{ fontSize: 12.5, color: '#865200', display: 'flex', gap: 8 }}><span style={{ fontVariantNumeric: 'tabular-nums', minWidth: 52 }}>{dateUtil.fmtShortDate(s.date)}</span>{s.why}</span>)}
          </div>
        )}
      </div>
    </CenterModal>
  );
}

Object.assign(window, { rcPresets, rcLabel, rcDates, RecurrenceSelect, RecurrenceCustomModal, RecurrenceScopeModal, RecurrenceConflictsModal });
