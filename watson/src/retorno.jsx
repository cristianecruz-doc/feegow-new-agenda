/* ============================================================================
   Feegow — New Agenda · Retorno (follow-up)
   Regra única (decisões aprovadas em 18/11/2026, doc RETORNO-FOLLOW-UP-INVENTARIO-
   FEEGOW-GIPO-CC-2026-11-18.md §4–5):
   - todo retorno é um procedimento do tipo Retorno, ligado à consulta de origem
     (retornoDe = RetornoID);
   - janela: convênio da origem > procedimento da origem > padrão da clínica,
     contando do dia 0 (mesmo dia) ao dia N;
   - origem válida: Atendida, não é retorno, o procedimento oferece retorno e
     não tem outro retorno ativo ligado a ela;
   - "Não liberar novo retorno após falta": o retorno com falta passa a gastar a origem.
   ============================================================================ */

const isRetProc = id => (PROCS[id] || {}).type === 'retorno';
const apptIsRet = a => apptProcIds(a).some(isRetProc);
const retProcList = () => PROC_LIST.filter(p => p.type === 'retorno');
// controle de retorno ligado? (fora do MVP e sem "Usar controle de retorno" desligado)
const retEnabled = () => !window.__mvp && !cfgGet('OcultarBotaoRetorno');

const retRules = () => cfgGet('RetornoRegras') || RET_RULES_DEFAULT;
const retPadrao = () => cfgGet('RetornoPadrao') || RET_PADRAO_DEFAULT;
const retProcRule = procId => ((retRules().procs || {})[procId]) || null;
const retConvDays = conv => (conv && conv !== 'Particular') ? (Number((retRules().convs || {})[conv]) || 0) : 0;

const retAddDays = (iso, n) => { const d = parseISO_(iso); d.setDate(d.getDate() + n); return _isoOf(d); };
const retDaysBetween = (a, b) => Math.round((parseISO_(b) - parseISO_(a)) / 86400000);
const retFmt = iso => { const [, m, d] = iso.split('-'); return `${d}/${m}`; };

// janela de retorno de uma origem: convênio > procedimento > padrão da clínica
function retWindow(o) {
  const cd = o.plano ? retConvDays(o.conv) : 0;
  if (cd) return { dias: cd, fonte: `convênio ${o.conv}` };
  const pr = retProcRule(o.proc);
  if (pr && Number(pr.dias)) return { dias: Number(pr.dias), fonte: 'procedimento' };
  return { dias: Number(retPadrao().dias) || 30, fonte: 'padrão da clínica' };
}
// procedimento de retorno a agendar para essa origem
function retProcFor(o) {
  const pr = retProcRule(o.proc);
  const id = (pr && pr.ret) || retPadrao().proc;
  return PROCS[id] && isRetProc(id) ? id : 'retorno';
}
// retornos ligados a uma origem que "gastam" a origem
function retLinked(o, appts, exceptId) {
  const ignore = cfgGet('bloqueioretornofaltoso') ? ['cancelado', 'remarcado'] : ['cancelado', 'remarcado', 'faltou'];
  return (appts || []).filter(x => x.retornoDe === o.id && x.id !== exceptId && !x.deleted && !ignore.includes(x.status));
}
// a consulta "o" gera retorno? retorna o estado na data de referência, ou null
// state: 'valido' | 'vencido' | 'usado' | 'faltou'
function retOriginInfo(o, refDate, appts, exceptId) {
  if (!o || o.deleted || o.status !== 'finalizado' || apptIsRet(o)) return null;
  const pr = retProcRule(o.proc);
  if (!pr || !pr.on) return null;
  const w = retWindow(o);
  const gap = retDaysBetween(o.date, refDate);
  if (gap < 0) return null;
  const until = retAddDays(o.date, w.dias);
  const used = retLinked(o, appts || window.__appts || [], exceptId);
  const missed = used.find(x => x.status === 'faltou');
  const state = used.length ? (missed ? 'faltou' : 'usado') : (gap <= w.dias ? 'valido' : 'vencido');
  return { o, dias: w.dias, fonte: w.fonte, until, gap, state, used: used[0] || null, retProc: retProcFor(o) };
}
// origens do paciente (mais recente primeiro). Vencidas só até 30 dias depois do fim.
function retOrigins(ptId, refDate, appts, exceptId) {
  appts = appts || window.__appts || [];
  return appts
    .filter(o => o.pt === ptId && !o._filler)
    .map(o => retOriginInfo(o, refDate, appts, exceptId))
    .filter(i => i && !(i.state === 'vencido' && i.gap > i.dias + 30))
    .sort((a, b) => b.o.date.localeCompare(a.o.date));
}
// próximos horários livres do profissional para o procedimento, entre duas datas
function retNextSlots(proId, fromIso, untilIso, procId, appts, n = 4) {
  appts = appts || window.__appts || [];
  const out = [];
  let d = fromIso < TODAY ? TODAY : fromIso;
  const dur = (PROCS[procId] || {}).dur || 15;
  for (let i = 0; i < 62 && d <= untilIso && out.length < n; i++, d = retAddDays(d, 1)) {
    const busy = appts.filter(a => a.pro === proId && a.date === d && !a.deleted && !['cancelado', 'remarcado'].includes(a.status));
    _slotsForDay(proId, d).forEach(sl => {
      if (out.length >= n) return;
      if (sl.g.procs && !sl.g.procs.includes(procId)) return;
      if (d === TODAY && sl.s <= NOW_MIN_D) return;
      if (busy.some(a => sl.s < toMin(a.start) + (a.dur || 0) && sl.s + dur > toMin(a.start))) return;
      out.push({ date: d, time: sl.hhmm });
    });
  }
  return out;
}
const proName = id => (PROS.find(p => p.id === id) || {}).name || 'profissional';
const proShortName = id => (PROS.find(p => p.id === id) || {}).short || proName(id);
const procName = id => (PROCS[id] || {}).name || 'Procedimento';
// rótulo do retorno no cartão / histórico
function retLabel(a, appts) {
  if (!a || !a.retornoDe) return a && a.retMotivo ? `Retorno sem consulta de origem · ${a.retMotivo}` : null;
  const o = (appts || window.__appts || []).find(x => x.id === a.retornoDe);
  if (!o) return 'Retorno';
  return `Retorno · ${procName(o.proc)} de ${retFmt(o.date)}${o.pro !== a.pro ? ` com ${proShortName(o.pro)}` : ''}`;
}

const RET_MOTIVOS = ['Consulta de origem há mais tempo que o período', 'Consulta feita em outra clínica', 'Status da consulta não foi atualizado', 'Outro motivo'];
const RET_AMBER = { bg: '#fff6ba', border: '#e2aa00', fg: '#865200' };

// ---- Aviso "Paciente em período de retorno" (ao escolher o paciente) --------
// compact = popover rápido (só a primeira origem válida + "Agendar retorno")
function RetornoBanner({ origins, selectedId, onPick, onConsult, compact }) {
  const valid = origins.filter(i => i.state === 'valido');
  const others = origins.filter(i => i.state !== 'valido' && i.state !== 'usado');
  if (!valid.length && !others.length) return null;
  const Row = ({ i }) => {
    const sel = selectedId === i.o.id;
    const proN = proName(i.o.pro);
    const first = proN.split(' ').slice(0, 2).join(' ');
    const line2 = i.state === 'valido'
      ? `Retorno até ${retFmt(i.until)} · ${i.dias} dias (${i.fonte})`
      : i.state === 'vencido' ? `Período de retorno encerrado em ${retFmt(i.until)}`
      : `Paciente faltou ao retorno de ${retFmt(i.used.date)}. A clínica não libera outro retorno.`;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0', borderTop: `1px solid ${RET_AMBER.border}40` }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: WT.wEmph, color: WT.fg }}>{procName(i.o.proc)} em {retFmt(i.o.date)} · {proN}</span>
          <span style={{ fontSize: 12, color: i.state === 'valido' ? WT.fg2 : RET_AMBER.fg }}>{line2}</span>
        </div>
        {sel
          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: WT.wEmph, color: WT.accent }}><WIcon name="check" size={13} color={WT.accent} />Retorno selecionado</span>
          : i.state === 'valido'
            ? <div><WButton variant="primary" size="s" leadingIcon="rotate-ccw" label={`Agendar retorno com ${first}`} onClick={() => onPick(i)} /></div>
            : onConsult && <div><WButton variant="default" size="s" leadingIcon="calendar-plus" label={`Agendar consulta com ${first}`} onClick={() => onConsult(i)} /></div>}
      </div>
    );
  };
  const head = valid.length
    ? (valid.length > 1 ? `Paciente em período de retorno de ${valid.length} consultas` : `Paciente em período de retorno até ${retFmt(valid[0].until)}`)
    : 'Período de retorno encerrado';
  const list = compact ? (valid.length ? valid.slice(0, 1) : others.slice(0, 1)) : [...valid, ...others];
  return (
    <div role="status" style={{ display: 'flex', flexDirection: 'column', padding: '8px 12px 4px', borderRadius: WT.rM, background: RET_AMBER.bg, border: `1px solid ${RET_AMBER.border}` }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: WT.wHead, color: RET_AMBER.fg, paddingBottom: 8 }}>
        <WIcon name="rotate-ccw" size={15} color={RET_AMBER.fg} />{head}
      </span>
      {list.map(i => <Row key={i.o.id} i={i} />)}
      {compact && (valid.length + others.length) > 1 && <span style={{ fontSize: 12, color: RET_AMBER.fg, padding: '4px 0 4px' }}>Mais opções mostra todas as consultas.</span>}
    </div>
  );
}

// ---- Origem do retorno no formulário completo ------------------------------
// aparece quando há um procedimento do tipo Retorno na lista
function RetornoOrigemField({ form, upd, origins, error }) {
  const valid = origins.filter(i => i.state === 'valido');
  const sel = form.retornoDe ? (window.__appts || []).find(x => x.id === form.retornoDe) : null;
  const selInfo = sel ? retOriginInfo(sel, form.date, window.__appts, form._editId) : null;
  if (sel) {
    const pro = PROS.find(p => p.id === form.proId);
    const oPro = PROS.find(p => p.id === sel.pro);
    const otherPro = pro && oPro && pro.id !== oPro.id;
    const slots = selInfo ? retNextSlots(sel.pro, TODAY, selInfo.until, form.procIds.find(isRetProc), window.__appts, 4) : [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px 8px 12px', borderRadius: WT.rM, background: WT.accentSoft, border: `1px solid ${WT.borderAccent}` }}>
          <WIcon name="link" size={14} color={WT.accent} />
          <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: WT.fg }}>
            <strong style={{ fontWeight: WT.wHead }}>Retorno de {procName(sel.proc)} em {retFmt(sel.date)}</strong> · {oPro ? oPro.name : ''}
            {selInfo && <span style={{ display: 'block', color: WT.fg2 }}>Período até {retFmt(selInfo.until)} · {selInfo.dias} dias ({selInfo.fonte})</span>}
          </span>
          <WIconButton name="x" dim={26} title="Trocar a consulta de origem" onClick={() => upd({ retornoDe: null })} />
        </div>
        {otherPro && <span style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: WT.fg2 }}><WIcon name="info" size={13} color={WT.accent} style={{ marginTop: 1 }} />A consulta de origem foi com {oPro.name}. Outro profissional só pode fazer o retorno se for da mesma especialidade ({specsOf(oPro).join(', ')}).</span>}
        {slots.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: WT.muted }}>Próximos horários de {oPro.short} no período:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {slots.map(s => {
                const on = form.date === s.date && form.time === s.time && form.proId === sel.pro;
                return (
                  <button key={s.date + s.time} type="button" onClick={() => upd({ date: s.date, time: s.time, proId: sel.pro, local: oPro.room })}
                    style={{ height: 28, padding: '0 8px', borderRadius: WT.pill, cursor: 'pointer', fontFamily: WT.font, fontSize: 12, fontWeight: WT.wEmph, fontVariantNumeric: 'tabular-nums', border: `1px solid ${on ? WT.borderAccent : WT.border}`, background: on ? WT.accentSoft : '#ffffff', color: on ? WT.accent : WT.fg }}>
                    {s.date === TODAY ? 'Hoje' : retFmt(s.date)} · {s.time}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {error && <span style={{ fontSize: 12, color: WT.danger }}>{error}</span>}
      </div>
    );
  }
  // sem origem escolhida: pede a origem (ou o motivo)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 26, padding: '8px 12px', borderRadius: WT.rM, background: WT.inset, border: `1px solid ${error ? WT.borderDanger : WT.border}` }}>
      <span style={{ fontSize: 14, fontWeight: WT.wHead, color: WT.fg }}>De qual consulta é este retorno?</span>
      {valid.length > 0 ? valid.map(i => (
        <button key={i.o.id} type="button" onClick={() => upd({ retornoDe: i.o.id, retMotivo: '', proId: i.o.pro, local: (PROS.find(p => p.id === i.o.pro) || {}).room })}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px', borderRadius: WT.rM, border: `1px solid ${WT.border}`, background: '#ffffff', cursor: 'pointer', textAlign: 'left', fontFamily: WT.font }}>
          <WIcon name="rotate-ccw" size={14} color={WT.accent} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 14, color: WT.fg }}>{procName(i.o.proc)} em {retFmt(i.o.date)} · {proName(i.o.pro)}</span>
            <span style={{ display: 'block', fontSize: 12, color: WT.muted }}>Retorno até {retFmt(i.until)} · {i.dias} dias ({i.fonte})</span>
          </span>
        </button>
      )) : <span style={{ fontSize: 12, color: WT.fg2 }}>Nenhuma consulta atendida deste paciente está no período de retorno.</span>}
      <span style={{ fontSize: 12, color: WT.fg2, marginTop: 4 }}>Sem consulta de origem? Informe o motivo para agendar mesmo assim.</span>
      <WSelect value={form.retMotivo || ''} onChange={v => upd({ retMotivo: v })} options={RET_MOTIVOS} placeholder="Motivo do retorno sem origem" error={error} />
    </div>
  );
}

// ---- Configuração: padrão da clínica ----------------------------------------
function RetPadraoControl({ value, onChange }) {
  const v = value || RET_PADRAO_DEFAULT;
  const dias = Number(v.dias) || 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', background: '#ffffff', border: `1px solid ${WT.border}`, borderRadius: WT.rM, boxShadow: WT.shEmphasis }}>
        <WIconButton name="minus" dim={30} onClick={() => onChange({ ...v, dias: Math.max(1, dias - 5) })} />
        <span style={{ minWidth: 56, textAlign: 'center', fontSize: 14, fontWeight: WT.wHead, color: WT.fg, fontVariantNumeric: 'tabular-nums' }}>{dias} dias</span>
        <WIconButton name="plus" dim={30} onClick={() => onChange({ ...v, dias: Math.min(180, dias + 5) })} />
      </div>
      <WSelect value={v.proc} onChange={p => onChange({ ...v, proc: p })} placeholder="" style={{ width: 200 }}
        options={retProcList().map(p => ({ value: p.id, label: p.name }))} />
    </div>
  );
}

// ---- Configuração: regras por procedimento e por convênio --------------------
function RetRegrasTable({ value, onChange }) {
  const r = value || RET_RULES_DEFAULT;
  const setProc = (id, patch) => onChange({ ...r, procs: { ...r.procs, [id]: { ...(r.procs[id] || { on: false, dias: 0, ret: '' }), ...patch } } });
  const setConv = (c, d) => onChange({ ...r, convs: { ...r.convs, [c]: d } });
  const origemProcs = PROC_LIST.filter(p => p.type !== 'retorno');
  const th = { fontSize: 12, fontWeight: WT.wHead, color: WT.fg2, textAlign: 'left', padding: '8px 8px', borderBottom: `1px solid ${WT.border}`, whiteSpace: 'nowrap' };
  const td = { fontSize: 14, color: WT.fg, padding: '4px 8px', borderBottom: `1px solid ${WT.borderSub}`, verticalAlign: 'middle' };
  const numInput = (val, set, disabled) => (
    <input type="number" min={0} max={365} value={val || ''} placeholder="padrão" disabled={disabled}
      onChange={e => set(Math.max(0, Math.min(365, Number(e.target.value) || 0)))}
      style={{ width: 80, height: 32, padding: '0 8px', borderRadius: WT.rM, border: `1px solid ${WT.border}`, font: `${WT.wBody} 14px ${WT.font}`, color: WT.fg, background: disabled ? WT.inset : '#ffffff' }} />
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
      <div style={{ overflowX: 'auto', border: `1px solid ${WT.border}`, borderRadius: WT.rM }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
          <thead><tr><th style={th}>Procedimento de origem</th><th style={th}>Oferece retorno</th><th style={th}>Dias</th><th style={th}>Procedimento de retorno</th></tr></thead>
          <tbody>
            {origemProcs.map(p => {
              const pr = r.procs[p.id] || { on: false, dias: 0, ret: '' };
              return (
                <tr key={p.id}>
                  <td style={td}>{p.name}</td>
                  <td style={td}><WToggle checked={!!pr.on} onChange={v => setProc(p.id, { on: v })} /></td>
                  <td style={td}>{numInput(pr.dias, v => setProc(p.id, { dias: v }), !pr.on)}</td>
                  <td style={td}>
                    {pr.on
                      ? <WSelect value={pr.ret || ''} onChange={v => setProc(p.id, { ret: v })} placeholder="" style={{ width: 220 }}
                          options={[{ value: '', label: `Padrão da clínica (${procName(retPadrao().proc)})` }, ...retProcList().map(x => ({ value: x.id, label: x.name }))]} />
                      : <span style={{ fontSize: 12, color: WT.muted }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ overflowX: 'auto', border: `1px solid ${WT.border}`, borderRadius: WT.rM }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
          <thead><tr><th style={th}>Convênio</th><th style={th}>Dias de retorno (vence o procedimento)</th></tr></thead>
          <tbody>
            {CONVENIOS.filter(c => c !== 'Particular').map(c => (
              <tr key={c}><td style={td}>{c}</td><td style={td}>{numInput(r.convs[c], v => setConv(c, v))}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <span style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: WT.muted }}>
        <WIcon name="info" size={13} color={WT.muted} style={{ marginTop: 1 }} />No produto, estes campos ficam no cadastro do procedimento e do convênio. Aqui estão juntos para o teste. Dias vazios usam o padrão da clínica.
      </span>
    </div>
  );
}

Object.assign(window, {
  isRetProc, apptIsRet, retProcList, retEnabled, retRules, retPadrao, retProcRule, retConvDays, retWindow, retProcFor,
  retOriginInfo, retOrigins, retNextSlots, retLabel, retFmt, retAddDays, RET_MOTIVOS,
  RetornoBanner, RetornoOrigemField, RetPadraoControl, RetRegrasTable,
});
