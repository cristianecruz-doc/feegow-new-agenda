/* ============================================================================
   Feegow — New Agenda · Abas do paciente no agendamento (Ficha / Histórico / Conta)
   Paridade com divAgendamento.asp (ver SPEC-Abas-Paciente-Agendamento.md).
   Renderizadas dentro do BookingHost; o drawer se alarga fora de "Agendamento".
   ============================================================================ */

// ícone Doctoralia (canal online) reutilizado em vários pontos
function DoctoMark({ size = 14, title }) {
  return <img src={(window.__resources && window.__resources.doctoIcon) || "assets/icon-doctoralia.png"} alt="Doctoralia" title={title} style={{ width: size, height: size, display: 'inline-block', flex: 'none', cursor: title ? 'help' : 'default' }} />;
}
function _pseed(str) { let h = 0; for (let i = 0; i < String(str).length; i++) h = (h * 31 + String(str).charCodeAt(i)) >>> 0; return h; }
const initialsOf = name => (name || '?').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();

// =============================================================================
//  FICHA — resumo + contatos editáveis (propagam ao agendamento ao salvar)
// =============================================================================
function FichaTab({ patient, pending, perms, onFlash }) {
  const canEdit = perms.editFicha;
  const name = (patient && patient.name) || (pending && pending.patientName) || 'Paciente';
  const [tel, setTel] = React.useState(patient ? (patient.phone || '') : '');
  const [cel, setCel] = React.useState(patient ? (patient.phone || '') : '');
  const [email, setEmail] = React.useState(patient ? (patient.email || `${name.split(' ')[0].toLowerCase()}@email.com`) : '');
  const [tabela, setTabela] = React.useState('Tabela Padrão');
  const [extra, setExtra] = React.useState(() => ({
    cep: patient ? '13050-023' : '', endereco: patient ? 'Rua Abel Luís Ferreira' : '', numero: patient ? '777' : '', compl: patient ? 'Apto 204' : '',
    bairro: patient ? 'Jardim do Lago' : '', cidade: patient ? 'Campinas' : '', estado: patient ? 'SP' : '', pais: 'Brasil',
    profissao: '', escolaridade: '', naturalidade: '', estadoCivil: '', nacionalidade: 'Brasileira', rg: '',
    tel2: '', cel2: '', email2: '', origem: '', indicacao: '', religiao: '', cns: '', corPele: '',
    obs: patient ? 'Paciente de exemplo.' : '', avisos: '',
  }));
  const setEx = (k, v) => setExtra(s => ({ ...s, [k]: v }));
  const [convs, setConvs] = React.useState(() => (patient && patient.conv && patient.conv !== 'Particular') ? [{ conv: patient.conv, plano: 'Plano Pleno', matricula: '123123123', token: '0', validade: '24/12/2026', titular: '' }] : []);
  const updConv = (i, k, v) => setConvs(s => s.map((r, j) => j === i ? { ...r, [k]: v } : r));
  const seed = _pseed((patient && patient.id) || name);
  const pront = patient ? 10000 + (seed % 90000) : '—';
  const prio = patient && patient.priority && PRIORITIES[patient.priority] ? PRIORITIES[patient.priority] : null;
  // "serviços em aberto" (contratados x executados) — mock determinístico
  const openServices = patient ? Array.from({ length: 3 + (seed % 4) }, (_, i) => {
    const total = 1 + ((seed >> i) % 6); const done = (seed >> (i + 2)) % (total + 1);
    return { done, total };
  }) : [];
  const Field = ({ label, value, onChange, icon, type, options }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
      <span style={{ fontSize: 12.5, fontWeight: WT.wEmph, color: WT.fg2 }}>{label}</span>
      {options
        ? <WSelect value={value} onChange={onChange} options={options} size="l" />
        : <WInput value={value} onChange={onChange} suffixIcon={icon} size="l" />}
    </div>
  );
  const save = () => { if (patient) { patient.phone = cel || tel; patient.email = email; } onFlash && onFlash(`Ficha de ${name.split(' ')[0]} salva · contatos atualizados no agendamento`); };
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 20, background: WT.bg, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* topo: avatar + nome + ir para ficha completa */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 'none' }}>
          <WAvatar initials={initialsOf(name)} size={64} bg={WT.accentSoft} color={WT.accent} ring={WT.borderAccent} />
          <button title="Trocar foto" disabled={!canEdit} style={{ position: 'absolute', right: -2, bottom: -2, width: 24, height: 24, borderRadius: '50%', border: `2px solid ${WT.raised}`, background: WT.accentFill, cursor: canEdit ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><WIcon name="camera" size={12} color="#fff" /></button>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 18, fontWeight: WT.wHead, color: WT.fg }}>{name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12.5, color: WT.muted }}>Prontuário <strong style={{ color: WT.fg2, fontWeight: WT.wEmph }}>nº {pront}</strong></span>
            {prio && <WBadge type="warning" icon={prio.icon}>{prio.label}</WBadge>}
            {pending && pending.isNew && <WBadge type="accent" icon="sparkles">Novo cadastro</WBadge>}
          </div>
        </div>
        <WButton variant="default" leadingIcon="external-link" label="Ir para ficha completa" onClick={() => onFlash && onFlash('Abriria a ficha completa do paciente (Fase 2)')} />
      </div>

      {/* serviços em aberto */}
      {openServices.length > 0 && (
        <div style={{ border: `1px solid ${WT.warningSoft === undefined ? WT.border : '#e8d27a'}`, borderRadius: WT.rL, background: '#fffaf0', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: WT.wEmph, color: '#865200' }}>
            <WIcon name="alert-triangle" size={15} color="#865200" />Existem serviços em aberto para este paciente
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {openServices.map((s, i) => (
              <span key={i} style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: WT.pill, background: '#fff', border: `1px solid ${s.done >= s.total ? '#a9d68f' : '#e8d27a'}`, color: s.done >= s.total ? WT.success : '#865200', fontWeight: WT.wEmph, whiteSpace: 'nowrap' }}>{s.done} de {s.total} executados</span>
            ))}
          </div>
        </div>
      )}

      {/* contatos editáveis (propagam ao agendamento) */}
      <div style={{ border: `1px solid ${WT.border}`, borderRadius: WT.rL, background: WT.raised, padding: 16, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: WT.shEmphasis }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottom: `1px solid ${WT.borderSub}` }}>
          <WIcon name="contact" size={16} color={WT.accent} />
          <span style={{ fontSize: 14, fontWeight: WT.wHead, color: WT.fg }}>Contato & convênio</span>
          {!canEdit && <span style={{ marginLeft: 'auto', fontSize: 11.5, color: WT.muted, display: 'inline-flex', alignItems: 'center', gap: 4 }}><WIcon name="lock" size={12} />Somente leitura</span>}
        </div>
        <fieldset disabled={!canEdit} style={{ border: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, opacity: canEdit ? 1 : 0.65 }}>
          <Field label="Telefone" value={tel} onChange={setTel} icon="phone" />
          <Field label="Celular" value={cel} onChange={setCel} icon="smartphone" />
          <Field label="E-mail" value={email} onChange={setEmail} icon="mail" />
          <Field label="Tabela particular" value={tabela} onChange={setTabela} options={['Tabela Padrão', 'Tabela Promocional', 'Tabela Convênio']} />
        </fieldset>
        <div style={{ fontSize: 12, color: WT.muted, display: 'inline-flex', alignItems: 'center', gap: 5 }}><WIcon name="info" size={12} color={WT.accent} />Alterações de contato refletem no agendamento.</div>
      </div>

      {/* endereço + dados complementares */}
      <div style={{ border: `1px solid ${WT.border}`, borderRadius: WT.rL, background: WT.raised, padding: 16, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: WT.shEmphasis }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottom: `1px solid ${WT.borderSub}` }}>
          <WIcon name="map-pin" size={16} color={WT.accent} />
          <span style={{ fontSize: 14, fontWeight: WT.wHead, color: WT.fg }}>Endereço e dados complementares</span>
        </div>
        <fieldset disabled={!canEdit} style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, opacity: canEdit ? 1 : 0.65 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
            {[
              ['CEP', 'cep'], ['Endereço', 'endereco'], ['Número', 'numero'], ['Compl.', 'compl'],
              ['Bairro', 'bairro'], ['Cidade', 'cidade'], ['Estado', 'estado', ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'Outro']], ['País', 'pais'],
              ['Profissão', 'profissao'], ['Escolaridade', 'escolaridade', ['Fundamental', 'Médio completo', 'Superior', 'Pós-graduação']], ['Naturalidade', 'naturalidade'], ['Estado civil', 'estadoCivil', ['Solteiro', 'Casado', 'Divorciado', 'Viúvo', 'União estável']],
              ['Nacionalidade', 'nacionalidade'], ['RG', 'rg'], ['Telefone 2', 'tel2'], ['Celular 2', 'cel2'],
              ['E-mail 2', 'email2'], ['Origem', 'origem', ['Indicação', 'Google', 'Instagram', 'Convênio', 'Retorno']], ['Indicação', 'indicacao'], ['Religião', 'religiao'],
              ['CNS', 'cns'], ['Cor da pele', 'corPele', ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena']],
            ].map(([label, key, opts]) => <Field key={key} label={label} value={extra[key]} onChange={v => setEx(key, v)} options={opts} />)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <WTextarea label="Observações" value={extra.obs} onChange={v => setEx('obs', v)} rows={2} />
            <WTextarea label="Avisos e pendências" value={extra.avisos} onChange={v => setEx('avisos', v)} rows={2} />
          </div>
        </fieldset>
      </div>

      {/* convênios do paciente */}
      <div style={{ border: `1px solid ${WT.border}`, borderRadius: WT.rL, background: WT.raised, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, boxShadow: WT.shEmphasis }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottom: `1px solid ${WT.borderSub}` }}>
          <WIcon name="shield-check" size={16} color={WT.accent} />
          <span style={{ fontSize: 14, fontWeight: WT.wHead, color: WT.fg }}>Convênios do paciente</span>
          <span style={{ flex: 1 }} />
          {canEdit && <button onClick={() => setConvs(s => [...s, { conv: CONVENIOS[1] || 'Unimed', plano: '', matricula: '', token: '', validade: '', titular: '' }])} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, padding: '0 10px', borderRadius: WT.rM, border: `1px dashed ${WT.borderHover}`, background: 'transparent', cursor: 'pointer', fontFamily: WT.font, fontSize: 13, fontWeight: WT.wEmph, color: WT.accent }}><WIcon name="plus" size={14} color={WT.accent} />Adicionar</button>}
        </div>
        <fieldset disabled={!canEdit} style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, opacity: canEdit ? 1 : 0.65 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .9fr 1.2fr .7fr 1fr 1fr', gap: 8, fontSize: 11.5, fontWeight: WT.wHead, color: WT.fg2, textTransform: 'uppercase', letterSpacing: '.03em' }}>
            <span>Convênio</span><span>Plano</span><span>Matrícula / Carteirinha</span><span>Token</span><span>Validade</span><span>Titular</span>
          </div>
          {convs.length === 0 && <div style={{ fontSize: 13, color: WT.muted, padding: '4px 0' }}>Nenhum convênio cadastrado.</div>}
          {convs.map((c, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr .9fr 1.2fr .7fr 1fr 1fr', gap: 8, alignItems: 'center' }}>
              <WSelect value={c.conv} onChange={v => updConv(i, 'conv', v)} options={CONVENIOS} />
              <WInput value={c.plano} onChange={v => updConv(i, 'plano', v)} placeholder="Plano" />
              <WInput value={c.matricula} onChange={v => updConv(i, 'matricula', v)} placeholder="Nº carteirinha" />
              <WInput value={c.token} onChange={v => updConv(i, 'token', v)} placeholder="0" />
              <WInput value={c.validade} onChange={v => updConv(i, 'validade', v)} suffixIcon="calendar" placeholder="dd/mm/aaaa" />
              <WInput value={c.titular} onChange={v => updConv(i, 'titular', v)} placeholder="Titular" />
            </div>
          ))}
        </fieldset>
      </div>
      </div>
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: 14, borderTop: `1px solid ${WT.border}`, background: WT.raised }}>
        <span style={{ fontSize: 12, color: WT.muted }}>{canEdit ? 'Edição habilitada' : 'Somente leitura — sem permissão'}</span>
        <span style={{ flex: 1 }} />
        <WButton variant="primary" leadingIcon="check" label="Salvar ficha" disabled={!canEdit} onClick={save} />
      </div>
    </div>
  );
}

// =============================================================================
//  HISTÓRICO — lista de agendamentos do paciente
// =============================================================================
function HistRow({ a, online }) {
  const [open, setOpen] = React.useState(false);
  const st = STATUS[a.status] || STATUS.marcado;
  const pro = PROS.find(p => p.id === a.pro) || {};
  const equip = a.equip ? (EQUIP.find(e => e.id === a.equip) || {}).initials : null;
  const isRetorno = (a.procs && a.procs.length ? a.procs : [a.proc]).includes('retorno');
  const valor = a.plano ? a.conv : (a.price ? brl(a.price) : 'Particular');
  const dt = dateUtil.parseISO(a.date);
  const dataStr = `${pad2(dt.getDate())}/${pad2(dt.getMonth() + 1)}/${dt.getFullYear()} · ${a.start}`;
  const cell = { padding: '9px 10px', fontSize: 13, color: WT.fg, verticalAlign: 'middle', borderTop: `1px solid ${WT.borderSub}` };
  return (
    <>
      <tr>
        <td style={cell}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ flex: 'none', width: 9, height: 9, borderRadius: '50%', background: st.dot, boxShadow: `0 0 0 2px ${st.dot}26` }} /><span style={{ color: st.fg, fontWeight: WT.wEmph, fontSize: 12 }}>{st.short}</span></span></td>
        <td style={{ ...cell, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{dataStr}{online && <DoctoMark size={13} title="Agendado pela Doctoralia (online)" />}{isRetorno && <WIcon name="rotate-ccw" size={12} color={WT.accent} title="Retorno" />}</span></td>
        <td style={cell}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><span style={{ width: 20, height: 20, borderRadius: '50%', flex: 'none', background: pro.color || WT.muted, color: '#fff', fontSize: 9, fontWeight: WT.wHead, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{pro.initials || '—'}</span>{pro.short || pro.name || '—'}</span></td>
        <td style={{ ...cell, color: WT.fg2 }}>{pro.spec || '—'}</td>
        <td style={cell}>{apptProcLabel(a)}{equip ? <span style={{ color: WT.muted }}> · {equip}</span> : ''}</td>
        <td style={{ ...cell, whiteSpace: 'nowrap' }}>{valor}</td>
        <td style={{ ...cell, textAlign: 'right' }}><button onClick={() => setOpen(o => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 28, padding: '0 10px', borderRadius: WT.rM, border: `1px solid ${WT.border}`, background: open ? WT.accentSoft : '#fff', cursor: 'pointer', fontFamily: WT.font, fontSize: 12.5, fontWeight: WT.wEmph, color: open ? WT.accent : WT.fg2 }}><WIcon name={open ? 'chevron-up' : 'list'} size={13} color={open ? WT.accent : WT.muted} />Detalhes</button></td>
      </tr>
      {open && (
        <tr>
          <td colSpan={7} style={{ padding: '0 10px 12px', background: WT.inset }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10, padding: '12px 12px', border: `1px solid ${WT.borderSub}`, borderRadius: WT.rM, background: WT.raised }}>
              {[['Horário', `${a.start}–${fmtMin(toMin(a.start) + (a.dur || 30))} · ${a.dur || 30} min`], ['Profissional', pro.name || '—'], ['Local / sala', effectiveRoom(a) || '—'], ['Canal', a.channel || 'Telefone'], ['Pagamento', a.plano ? a.conv : (a.price ? brl(a.price) : 'Sem cobrança')], ['Observações', a.note || '—']].map(([k, v]) => (
                <div key={k} style={{ minWidth: 0 }}><div style={{ fontSize: 11, color: WT.muted, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>{k}</div><div style={{ fontSize: 13, color: WT.fg }}>{v}</div></div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
function HistoricoTab({ patient, appts }) {
  const pid = patient && patient.id;
  const [de, setDe] = React.useState('');
  const [ate, setAte] = React.useState('');
  const [page, setPage] = React.useState(0);
  const PAGE = 10;
  React.useEffect(() => { setPage(0); }, [de, ate, pid]);
  let list = (appts || []).filter(a => a.pt === pid && !a.deleted);
  if (de) list = list.filter(a => a.date >= de);
  if (ate) list = list.filter(a => a.date <= ate);
  list = list.sort((x, y) => (y.date + y.start).localeCompare(x.date + x.start)).slice(0, 50);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const slice = list.slice(cur * PAGE, cur * PAGE + PAGE);
  const th = { textAlign: 'left', padding: '11px 10px', fontSize: 11.5, fontWeight: WT.wHead, color: '#fff', textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap' };
  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 20, background: WT.bg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <WIcon name="calendar-days" size={17} color={WT.accent} />
        <span style={{ fontSize: 15, fontWeight: WT.wHead, color: WT.fg }}>Histórico de agendamentos</span>
        <WBadge type="neutral">{list.length}</WBadge>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12.5, color: WT.fg2, fontWeight: WT.wEmph }}>De</span>
        <WInput type="date" value={de} onChange={setDe} style={{ width: 150 }} />
        <span style={{ fontSize: 12.5, color: WT.fg2, fontWeight: WT.wEmph }}>Até</span>
        <WInput type="date" value={ate} onChange={setAte} style={{ width: 150 }} />
        {(de || ate) && <WIconButton name="x" dim={28} title="Limpar período" onClick={() => { setDe(''); setAte(''); }} />}
      </div>
      {list.length === 0
        ? <div style={{ padding: '40px 0', textAlign: 'center', color: WT.muted, fontSize: 13 }}>Nenhum agendamento no período.</div>
        : <>
            <div style={{ marginTop: 6, border: `1px solid ${WT.border}`, borderRadius: WT.rL, overflow: 'hidden', background: WT.raised, boxShadow: WT.shEmphasis }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: WT.font }}>
                <thead><tr style={{ background: WT.accentFill }}>
                  <th style={th}>Status</th><th style={th}>Data/Hora</th><th style={th}>Profissional</th><th style={th}>Especialidade</th><th style={th}>Procedimento</th><th style={th}>Valor/Convênio</th><th style={{ ...th, textAlign: 'right' }}></th>
                </tr></thead>
                <tbody>{slice.map(a => <HistRow key={a.id} a={a} online={_pseed(a.id) % 4 === 0} />)}</tbody>
              </table>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <span style={{ fontSize: 12.5, color: WT.muted }}>{cur * PAGE + 1}–{Math.min(cur * PAGE + PAGE, list.length)} de {list.length}{list.length === 50 ? ' (50 mais recentes)' : ''}</span>
              <span style={{ flex: 1 }} />
              <WIconButton name="chevron-left" dim={30} title="Anterior" onClick={() => setPage(p => Math.max(0, p - 1))} />
              <span style={{ fontSize: 13, fontWeight: WT.wEmph, color: WT.fg2, fontVariantNumeric: 'tabular-nums' }}>{cur + 1} / {pages}</span>
              <WIconButton name="chevron-right" dim={30} title="Próxima" onClick={() => setPage(p => Math.min(pages - 1, p + 1))} />
            </div>
          </>}
    </div>
  );
}

// =============================================================================
//  CONTA — financeiro (faturados / não faturados / extrato) — paridade visual
// =============================================================================
function patientLedger(pid) {
  const seed = _pseed(pid || 'x');
  const saldo = ((seed % 3) === 0) ? -(2000 + (seed % 9000)) : (seed % 1500);
  const formas = ['Particular', 'Unimed', 'SUS', 'Bradesco Saúde'];
  const rows = Array.from({ length: 4 + (seed % 3) }, (_, i) => {
    const m = ((seed >> i) % 12); const y = 2026; const d = 1 + ((seed >> (i + 1)) % 27);
    const forma = formas[(seed >> i) % formas.length];
    const valor = [0, 200, 210, 400, 90, 350][(seed >> i) % 6];
    const exec = (seed >> (i + 3)) % 3 === 0 ? null : { who: ['Cristiane Maia', 'Luiz Cruz', 'B. Tavares'][(seed >> i) % 3], date: `${pad2(d)}/${pad2(m + 1)}/${y}` };
    return { id: i, date: `${pad2(d)}/${pad2(m + 1)}/${y}`, desc: ['Consulta', '1 item', '2 itens', 'Procedimento 200 reais', 'Guia Consulta'][(seed >> i) % 5], forma, valor, exec, guia: forma !== 'Particular' ? 17390000 + (seed % 9999) : null };
  });
  return { saldo, rows };
}
function ContaTab({ patient, perms, onFlash }) {
  const [sub, setSub] = React.useState('faturados');
  const { saldo, rows } = patientLedger(patient && patient.id);
  const Fase2 = ({ icon, label }) => (
    <button title="Disponível na Fase 2" disabled style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 11px', borderRadius: WT.rM, border: `1px solid ${WT.border}`, background: WT.inset, color: WT.muted, cursor: 'not-allowed', fontFamily: WT.font, fontSize: 13, fontWeight: WT.wEmph, whiteSpace: 'nowrap' }}>
      <WIcon name={icon} size={14} color={WT.muted} />{label}<span style={{ fontSize: 9.5, fontWeight: WT.wHead, padding: '1px 4px', borderRadius: 4, background: WT.neutral, color: WT.fg2 }}>Fase 2</span>
    </button>
  );
  const SubTab = ({ id, icon, label }) => (
    <button onClick={() => setSub(id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: WT.font, fontSize: 13.5, fontWeight: sub === id ? WT.wHead : WT.wEmph, color: sub === id ? WT.accent : WT.fg2, borderBottom: `2px solid ${sub === id ? WT.accentFill : 'transparent'}`, marginBottom: -1 }}>
      <WIcon name={icon} size={14} color={sub === id ? WT.accent : WT.muted} />{label}
    </button>
  );
  const th = { textAlign: 'left', padding: '0 10px 8px', fontSize: 11.5, fontWeight: WT.wHead, color: WT.fg2, textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap' };
  const cell = { padding: '9px 10px', fontSize: 13, color: WT.fg, borderTop: `1px solid ${WT.borderSub}`, verticalAlign: 'middle' };
  const formaBadge = f => f === 'Particular' ? <WBadge type="success">Particular</WBadge> : f === 'SUS' ? <WBadge type="info">SUS</WBadge> : <WBadge type="neutral">{f}</WBadge>;
  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 20, background: WT.bg, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* sub-abas + saldo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderBottom: `1px solid ${WT.border}`, flexWrap: 'wrap' }}>
        <SubTab id="faturados" icon="receipt" label="Faturados" />
        <SubTab id="naofaturados" icon="circle-alert" label="Não faturados" />
        <SubTab id="extrato" icon="arrow-left-right" label="Extrato" />
        <span style={{ flex: 1 }} />
        <span style={{ marginBottom: 6, fontSize: 13, fontWeight: WT.wHead, padding: '4px 10px', borderRadius: WT.pill, background: saldo < 0 ? WT.dangerSoft : WT.successSoft, color: saldo < 0 ? WT.danger : WT.success }}>
          Saldo {saldo < 0 ? 'negativo' : ''} de {brl(saldo)}
        </span>
      </div>

      {/* toolbar de lançamento (Fase 2) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12.5, color: WT.muted, fontWeight: WT.wEmph }}>Lançar:</span>
        <Fase2 icon="banknote" label="Particular" />
        <Fase2 icon="file-text" label="Guia Consulta" />
        <Fase2 icon="file-text" label="Guia SP/SADT" />
        <Fase2 icon="stethoscope" label="Atendimento" />
      </div>

      {sub === 'faturados' && (
        <div style={{ border: `1px solid ${WT.border}`, borderRadius: WT.rL, overflow: 'hidden', background: WT.raised }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: WT.font }}>
            <thead><tr style={{ background: WT.inset }}><th style={th}>Data</th><th style={th}>Descrição</th><th style={th}>Executado</th><th style={th}>Forma</th><th style={{ ...th, textAlign: 'right' }}>Valor</th><th style={th}>Pendências</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td style={{ ...cell, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{r.date}</td>
                  <td style={cell}>{r.desc}</td>
                  <td style={{ ...cell, color: WT.fg2 }}>{r.exec ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><WIcon name="check" size={13} color={WT.success} />{r.exec.who} · {r.exec.date}</span> : <span style={{ color: WT.muted }}>Não executado</span>}</td>
                  <td style={cell}>{formaBadge(r.forma)}</td>
                  <td style={{ ...cell, textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', fontWeight: WT.wEmph }}>{brl(r.valor)}</td>
                  <td style={cell}>{r.guia ? <span style={{ fontSize: 12, color: WT.muted }}>Guia: {r.guia}</span> : <span style={{ color: WT.muted }}>—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {sub === 'naofaturados' && (
        <div style={{ border: `1px solid ${WT.border}`, borderRadius: WT.rL, background: WT.raised, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, color: WT.fg2 }}>Procedimentos realizados ainda sem fatura.</div>
          {rows.filter(r => !r.exec).slice(0, 3).map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: `1px solid ${WT.borderSub}` }}>
              <WIcon name="circle-alert" size={15} color={WT.warning} />
              <span style={{ flex: 1, fontSize: 13, color: WT.fg }}>{r.desc} · {r.date}</span>
              <span style={{ fontSize: 13, fontWeight: WT.wEmph, fontVariantNumeric: 'tabular-nums' }}>{brl(r.valor)}</span>
              <button disabled title="Disponível na Fase 2" style={{ height: 28, padding: '0 10px', borderRadius: WT.rM, border: `1px solid ${WT.border}`, background: WT.inset, color: WT.muted, cursor: 'not-allowed', fontFamily: WT.font, fontSize: 12.5, fontWeight: WT.wEmph }}>Gerar fatura</button>
            </div>
          ))}
        </div>
      )}
      {sub === 'extrato' && (
        <div style={{ border: `1px solid ${WT.border}`, borderRadius: WT.rL, background: WT.raised, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, padding: '7px 0', borderBottom: `1px solid ${WT.borderSub}` }}>
              <span style={{ color: WT.muted, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{r.date}</span>
              <span style={{ flex: 1, color: WT.fg }}>{r.desc}</span>
              <span style={{ fontWeight: WT.wEmph, color: r.exec ? WT.success : WT.fg, fontVariantNumeric: 'tabular-nums' }}>{r.exec ? '+' : ''}{brl(r.valor)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { FichaTab, HistoricoTab, ContaTab, DoctoMark });
