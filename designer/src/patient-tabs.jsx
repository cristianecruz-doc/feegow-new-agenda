/* ============================================================================
   Feegow — New Agenda · Sub-telas do paciente (Ficha / Histórico / Conta)
   Paridade com divAgendamento.asp (ver SPEC-Abas-Paciente-Agendamento.md).
   Empilhadas dentro do painel lateral (BookingHost) sobre o formulário da visita:
   coluna única, medidas pensadas para os 330px do painel.
   ============================================================================ */

// ícone Doctoralia (canal online) reutilizado em vários pontos
function DoctoMark({ size = 14, title }) {
  return <img src={(window.__resources && window.__resources.doctoIcon) || "assets/icon-doctoralia.png"} alt="Doctoralia" title={title} style={{ width: size, height: size, display: 'inline-block', flex: 'none', cursor: title ? 'help' : 'default' }} />;
}
function _pseed(str) { let h = 0; for (let i = 0; i < String(str).length; i++) h = (h * 31 + String(str).charCodeAt(i)) >>> 0; return h; }
const initialsOf = name => (name || '?').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();

// cartão padrão das sub-telas (o fundo do painel é cinza, os blocos são brancos)
function PCard({ children, style = {} }) {
  return <div style={{ border: `1px solid ${WT.border}`, borderRadius: WT.rL, background: WT.raised, padding: 14, display: 'flex', flexDirection: 'column', gap: 12, boxShadow: WT.shEmphasis, ...style }}>{children}</div>;
}
function PCardHead({ icon, children, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottom: `1px solid ${WT.borderSub}` }}>
      <WIcon name={icon} size={16} color={WT.accent} />
      <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: WT.wHead, color: WT.fg }}>{children}</span>
      {right}
    </div>
  );
}

// =============================================================================
//  FICHA — resumo + contatos editáveis (propagam ao agendamento ao salvar)
// =============================================================================
// escopo de módulo de propósito: declarado dentro do FichaTab, cada tecla digitada
// criaria um tipo de componente novo, remontando o input e perdendo o foco
function FichaField({ label, value, onChange, icon, options, span }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0, gridColumn: span ? '1 / -1' : undefined }}>
      <span style={{ fontSize: 12.5, fontWeight: WT.wEmph, color: WT.fg2 }}>{label}</span>
      {options
        ? <WSelect value={value} onChange={onChange} options={options} />
        : <WInput value={value} onChange={onChange} suffixIcon={icon} />}
    </div>
  );
}

function FichaTab({ patient, pending, perms, onFlash, onSaved }) {
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
  // salvar propaga os contatos de volta ao formulário do agendamento
  const save = () => {
    if (patient) { patient.phone = cel || tel; patient.email = email; }
    onSaved && onSaved({ Cel1: cel || tel, Email1: email });
    onFlash && onFlash(`Ficha de ${name.split(' ')[0]} salva · contatos atualizados no agendamento`);
  };
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 14, background: WT.bg, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* identidade */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', flex: 'none' }}>
              <WAvatar initials={initialsOf(name)} size={48} bg={WT.accentSoft} color={WT.accent} ring={WT.borderAccent} />
              <button title="Trocar foto" disabled={!canEdit} style={{ position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: '50%', border: `2px solid ${WT.bg}`, background: WT.accentFill, cursor: canEdit ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><WIcon name="camera" size={11} color="#fff" /></button>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: WT.wHead, color: WT.fg, lineHeight: 1.3 }}>{name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12.5, color: WT.muted }}>Prontuário <strong style={{ color: WT.fg2, fontWeight: WT.wEmph }}>nº {pront}</strong></span>
                {prio && <WBadge type="warning" icon={prio.icon}>{prio.label}</WBadge>}
                {pending && pending.isNew && <WBadge type="accent" icon="sparkles">Novo cadastro</WBadge>}
              </div>
            </div>
          </div>
          <WButton variant="default" fullWidth leadingIcon="external-link" label="Ir para ficha completa" onClick={() => onFlash && onFlash('Abriria a ficha completa do paciente (Fase 2)')} />
        </div>

        {/* serviços em aberto */}
        {openServices.length > 0 && (
          <div style={{ border: '1px solid #e8d27a', borderRadius: WT.rL, background: '#fffaf0', padding: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 13, fontWeight: WT.wEmph, color: '#865200', lineHeight: 1.35 }}>
              <WIcon name="alert-triangle" size={15} color="#865200" style={{ flex: 'none', marginTop: 1 }} />Existem serviços em aberto para este paciente
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {openServices.map((s, i) => (
                <span key={i} style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: WT.pill, background: '#fff', border: `1px solid ${s.done >= s.total ? '#a9d68f' : '#e8d27a'}`, color: s.done >= s.total ? WT.success : '#865200', fontWeight: WT.wEmph, whiteSpace: 'nowrap' }}>{s.done} de {s.total} executados</span>
              ))}
            </div>
          </div>
        )}

        {/* contatos editáveis (propagam ao agendamento) */}
        <PCard>
          <PCardHead icon="contact" right={!canEdit && <span style={{ flex: 'none', fontSize: 11.5, color: WT.muted, display: 'inline-flex', alignItems: 'center', gap: 4 }}><WIcon name="lock" size={12} />Somente leitura</span>}>
            Contato &amp; convênio
          </PCardHead>
          <fieldset disabled={!canEdit} style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, opacity: canEdit ? 1 : 0.65 }}>
            <FichaField label="Telefone" value={tel} onChange={setTel} icon="phone" />
            <FichaField label="Celular" value={cel} onChange={setCel} icon="smartphone" />
            <FichaField label="E-mail" value={email} onChange={setEmail} icon="mail" />
            <FichaField label="Tabela particular" value={tabela} onChange={setTabela} options={['Tabela Padrão', 'Tabela Promocional', 'Tabela Convênio']} />
          </fieldset>
          <div style={{ fontSize: 12, color: WT.muted, display: 'flex', alignItems: 'flex-start', gap: 5, lineHeight: 1.4 }}><WIcon name="info" size={12} color={WT.accent} style={{ flex: 'none', marginTop: 2 }} />Alterações de contato refletem no agendamento.</div>
        </PCard>

        {/* endereço + dados complementares */}
        <PCard>
          <PCardHead icon="map-pin">Endereço e dados complementares</PCardHead>
          <fieldset disabled={!canEdit} style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, opacity: canEdit ? 1 : 0.65 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(118px,1fr))', gap: 12 }}>
              {/* `span` ocupa a linha toda: campos longos não cabem em meia coluna de 156px */}
              {[
                ['CEP', 'cep'], ['Número', 'numero'], ['Endereço', 'endereco', null, true], ['Compl.', 'compl'],
                ['Bairro', 'bairro'], ['Cidade', 'cidade'], ['Estado', 'estado', ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'Outro']], ['País', 'pais'],
                ['Profissão', 'profissao'], ['Escolaridade', 'escolaridade', ['Fundamental', 'Médio completo', 'Superior', 'Pós-graduação']], ['Naturalidade', 'naturalidade'], ['Estado civil', 'estadoCivil', ['Solteiro', 'Casado', 'Divorciado', 'Viúvo', 'União estável']],
                ['Nacionalidade', 'nacionalidade'], ['RG', 'rg'], ['Telefone 2', 'tel2'], ['Celular 2', 'cel2'],
                ['E-mail 2', 'email2', null, true], ['Origem', 'origem', ['Indicação', 'Google', 'Instagram', 'Convênio', 'Retorno']], ['Indicação', 'indicacao'], ['Religião', 'religiao'],
                ['CNS', 'cns'], ['Cor da pele', 'corPele', ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena']],
              ].map(([label, key, opts, span]) => <FichaField key={key} label={label} value={extra[key]} onChange={v => setEx(key, v)} options={opts} span={span} />)}
            </div>
            <WTextarea label="Observações" value={extra.obs} onChange={v => setEx('obs', v)} rows={2} />
            <WTextarea label="Avisos e pendências" value={extra.avisos} onChange={v => setEx('avisos', v)} rows={2} />
          </fieldset>
        </PCard>

        {/* convênios do paciente — um cartão por convênio (a tabela de 6 colunas não cabe) */}
        <PCard>
          <PCardHead icon="shield-check" right={canEdit && <button onClick={() => setConvs(s => [...s, { conv: CONVENIOS[1] || 'Unimed', plano: '', matricula: '', token: '', validade: '', titular: '' }])} style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, height: 28, padding: '0 9px', borderRadius: WT.rM, border: `1px dashed ${WT.borderHover}`, background: 'transparent', cursor: 'pointer', fontFamily: WT.font, fontSize: 12.5, fontWeight: WT.wEmph, color: WT.accent }}><WIcon name="plus" size={13} color={WT.accent} />Adicionar</button>}>
            Convênios do paciente
          </PCardHead>
          <fieldset disabled={!canEdit} style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, opacity: canEdit ? 1 : 0.65 }}>
            {convs.length === 0 && <div style={{ fontSize: 13, color: WT.muted }}>Nenhum convênio cadastrado.</div>}
            {convs.map((c, i) => (
              <div key={i} style={{ border: `1px solid ${WT.borderSub}`, borderRadius: WT.rM, background: WT.inset, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <FichaField label="Convênio" value={c.conv} onChange={v => updConv(i, 'conv', v)} options={CONVENIOS} />
                <FichaField label="Plano" value={c.plano} onChange={v => updConv(i, 'plano', v)} />
                <FichaField label="Matrícula / carteirinha" value={c.matricula} onChange={v => updConv(i, 'matricula', v)} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 10 }}>
                  <FichaField label="Token" value={c.token} onChange={v => updConv(i, 'token', v)} />
                  <FichaField label="Validade" value={c.validade} onChange={v => updConv(i, 'validade', v)} icon="calendar" />
                </div>
                <FichaField label="Titular" value={c.titular} onChange={v => updConv(i, 'titular', v)} />
              </div>
            ))}
          </fieldset>
        </PCard>
      </div>
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: 14, borderTop: `1px solid ${WT.border}`, background: WT.raised }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: WT.muted }}>{canEdit ? 'Edição habilitada' : 'Somente leitura — sem permissão'}</span>
        <WButton variant="primary" leadingIcon="check" label="Salvar ficha" disabled={!canEdit} onClick={save} />
      </div>
    </div>
  );
}

// =============================================================================
//  HISTÓRICO — lista de agendamentos do paciente (um cartão por visita)
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
  return (
    <div style={{ border: `1px solid ${WT.border}`, borderRadius: WT.rL, background: WT.raised, boxShadow: WT.shEmphasis, padding: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ flex: 'none', width: 9, height: 9, borderRadius: '50%', background: st.dot, boxShadow: `0 0 0 2px ${st.dot}26` }} />
        <span style={{ flex: 1, minWidth: 0, color: st.fg, fontWeight: WT.wEmph, fontSize: 12 }}>{st.short}</span>
        {online && <DoctoMark size={13} title="Agendado pela Doctoralia (online)" />}
        {isRetorno && <WIcon name="rotate-ccw" size={12} color={WT.accent} title="Retorno" />}
        <span style={{ flex: 'none', fontSize: 12.5, color: WT.fg2, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{dataStr}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
        <span style={{ width: 20, height: 20, borderRadius: '50%', flex: 'none', background: pro.color || WT.muted, color: '#fff', fontSize: 9, fontWeight: WT.wHead, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{pro.initials || '—'}</span>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: WT.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pro.short || pro.name || '—'}<span style={{ color: WT.muted }}> · {pro.spec || '—'}</span></span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: WT.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{apptProcLabel(a)}{equip ? <span style={{ color: WT.muted }}> · {equip}</span> : ''}</span>
        <span style={{ flex: 'none', fontSize: 13, fontWeight: WT.wEmph, color: WT.fg, whiteSpace: 'nowrap' }}>{valor}</span>
      </div>
      <button onClick={() => setOpen(o => !o)} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 5, height: 28, padding: '0 10px', borderRadius: WT.rM, border: `1px solid ${WT.border}`, background: open ? WT.accentSoft : '#fff', cursor: 'pointer', fontFamily: WT.font, fontSize: 12.5, fontWeight: WT.wEmph, color: open ? WT.accent : WT.fg2 }}>
        <WIcon name={open ? 'chevron-up' : 'list'} size={13} color={open ? WT.accent : WT.muted} />Detalhes
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: 12, border: `1px solid ${WT.borderSub}`, borderRadius: WT.rM, background: WT.inset }}>
          {[['Horário', `${a.start}–${fmtMin(toMin(a.start) + (a.dur || 30))} · ${a.dur || 30} min`], ['Profissional', pro.name || '—'], ['Local / sala', effectiveRoom(a) || '—'], ['Canal', a.channel || 'Telefone'], ['Pagamento', a.plano ? a.conv : (a.price ? brl(a.price) : 'Sem cobrança')], ['Observações', a.note || '—']].map(([k, v]) => (
            <div key={k} style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: WT.muted, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>{k}</div>
              <div style={{ fontSize: 13, color: WT.fg }}>{v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
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
  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 14, background: WT.bg, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <WIcon name="calendar-days" size={17} color={WT.accent} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: WT.wHead, color: WT.fg }}>Agendamentos</span>
        <WBadge type="neutral">{list.length}</WBadge>
        {(de || ate) && <WIconButton name="x" dim={28} title="Limpar período" onClick={() => { setDe(''); setAte(''); }} />}
      </div>
      {/* minWidth:0 nas colunas: o campo de data tem largura mínima própria e sem isso
          a dupla estoura o painel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <WInput label="De" type="date" value={de} onChange={setDe} style={{ minWidth: 0 }} />
        <WInput label="Até" type="date" value={ate} onChange={setAte} style={{ minWidth: 0 }} />
      </div>
      {list.length === 0
        ? <div style={{ padding: '32px 0', textAlign: 'center', color: WT.muted, fontSize: 13 }}>Nenhum agendamento no período.</div>
        : <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {slice.map(a => <HistRow key={a.id} a={a} online={_pseed(a.id) % 4 === 0} />)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: WT.muted }}>{cur * PAGE + 1}–{Math.min(cur * PAGE + PAGE, list.length)} de {list.length}{list.length === 50 ? ' (50 mais recentes)' : ''}</span>
              <WIconButton name="chevron-left" dim={30} title="Anterior" onClick={() => setPage(p => Math.max(0, p - 1))} />
              <span style={{ fontSize: 13, fontWeight: WT.wEmph, color: WT.fg2, fontVariantNumeric: 'tabular-nums' }}>{cur + 1} / {pages}</span>
              <WIconButton name="chevron-right" dim={30} title="Próxima" onClick={() => setPage(p => Math.min(pages - 1, p + 1))} />
            </div>
          </>}
    </div>
  );
}

// =============================================================================
//  CONTA — financeiro (faturados / não faturados / extrato)
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
    <button title="Disponível na Fase 2" disabled style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 10px', borderRadius: WT.rM, border: `1px solid ${WT.border}`, background: WT.inset, color: WT.muted, cursor: 'not-allowed', fontFamily: WT.font, fontSize: 12.5, fontWeight: WT.wEmph, whiteSpace: 'nowrap' }}>
      <WIcon name={icon} size={13} color={WT.muted} />{label}
    </button>
  );
  // sem ícone: as três abas só cabem lado a lado no painel pelo texto, e o texto já diz tudo
  const SubTab = ({ id, label }) => (
    <button onClick={() => setSub(id)} style={{ display: 'inline-flex', alignItems: 'center', height: 34, padding: '0 8px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: WT.font, fontSize: 13, fontWeight: sub === id ? WT.wHead : WT.wEmph, color: sub === id ? WT.accent : WT.fg2, borderBottom: `2px solid ${sub === id ? WT.accentFill : 'transparent'}`, marginBottom: -1, whiteSpace: 'nowrap' }}>
      {label}
    </button>
  );
  const formaBadge = f => f === 'Particular' ? <WBadge type="success">Particular</WBadge> : f === 'SUS' ? <WBadge type="info">SUS</WBadge> : <WBadge type="neutral">{f}</WBadge>;
  const row = { border: `1px solid ${WT.border}`, borderRadius: WT.rL, background: WT.raised, boxShadow: WT.shEmphasis, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 };
  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 14, background: WT.bg, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* saldo em destaque, sub-abas abaixo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: WT.wHead, color: WT.fg }}>Conta do paciente</span>
        <span style={{ flex: 'none', fontSize: 13, fontWeight: WT.wHead, padding: '4px 10px', borderRadius: WT.pill, background: saldo < 0 ? WT.dangerSoft : WT.successSoft, color: saldo < 0 ? WT.danger : WT.success, whiteSpace: 'nowrap' }}>
          Saldo {brl(saldo)}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, borderBottom: `1px solid ${WT.border}` }}>
        <SubTab id="faturados" label="Faturados" />
        <SubTab id="naofaturados" label="Não faturados" />
        <SubTab id="extrato" label="Extrato" />
      </div>

      {/* lançamento (Fase 2) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12.5, color: WT.muted, fontWeight: WT.wEmph }}>Lançar:</span>
        <Fase2 icon="banknote" label="Particular" />
        <Fase2 icon="file-text" label="Guia Consulta" />
        <Fase2 icon="file-text" label="Guia SP/SADT" />
        <Fase2 icon="stethoscope" label="Atendimento" />
        <span style={{ fontSize: 11.5, color: WT.muted }}>Disponível na Fase 2</span>
      </div>

      {sub === 'faturados' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map(r => (
            <div key={r.id} style={row}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: WT.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.desc}</span>
                <span style={{ flex: 'none', fontSize: 13, fontWeight: WT.wEmph, color: WT.fg, fontVariantNumeric: 'tabular-nums' }}>{brl(r.valor)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12.5, color: WT.muted, fontVariantNumeric: 'tabular-nums' }}>{r.date}</span>
                {formaBadge(r.forma)}
              </div>
              <div style={{ fontSize: 12.5, color: WT.fg2 }}>
                {r.exec
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><WIcon name="check" size={13} color={WT.success} />{r.exec.who} · {r.exec.date}</span>
                  : <span style={{ color: WT.muted }}>Não executado</span>}
              </div>
              {r.guia && <div style={{ fontSize: 12, color: WT.muted }}>Guia: {r.guia}</div>}
            </div>
          ))}
        </div>
      )}
      {sub === 'naofaturados' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, color: WT.fg2 }}>Procedimentos realizados ainda sem fatura.</div>
          {rows.filter(r => !r.exec).length === 0 && <div style={{ padding: '24px 0', textAlign: 'center', color: WT.muted, fontSize: 13 }}>Nada pendente de faturamento.</div>}
          {rows.filter(r => !r.exec).slice(0, 3).map(r => (
            <div key={r.id} style={row}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <WIcon name="circle-alert" size={14} color={WT.warning} style={{ flex: 'none' }} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: WT.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.desc}</span>
                <span style={{ flex: 'none', fontSize: 13, fontWeight: WT.wEmph, fontVariantNumeric: 'tabular-nums' }}>{brl(r.valor)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: WT.muted, fontVariantNumeric: 'tabular-nums' }}>{r.date}</span>
                <button disabled title="Disponível na Fase 2" style={{ height: 28, padding: '0 10px', borderRadius: WT.rM, border: `1px solid ${WT.border}`, background: WT.inset, color: WT.muted, cursor: 'not-allowed', fontFamily: WT.font, fontSize: 12.5, fontWeight: WT.wEmph }}>Gerar fatura</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {sub === 'extrato' && (
        <PCard style={{ gap: 0 }}>
          {rows.map((r, i) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '8px 0', borderTop: i ? `1px solid ${WT.borderSub}` : 'none' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: WT.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.desc}</div>
                <div style={{ fontSize: 11.5, color: WT.muted, fontVariantNumeric: 'tabular-nums' }}>{r.date}</div>
              </div>
              <span style={{ flex: 'none', fontSize: 13, fontWeight: WT.wEmph, color: r.exec ? WT.success : WT.fg, fontVariantNumeric: 'tabular-nums' }}>{r.exec ? '+' : ''}{brl(r.valor)}</span>
            </div>
          ))}
        </PCard>
      )}
    </div>
  );
}

Object.assign(window, { FichaTab, HistoricoTab, ContaTab, DoctoMark, FichaField, PCard, PCardHead });
