/* ============================================================================
   Feegow — New Agenda · "Configurações da Agenda"
   Consolida as configurações do módulo (hoje espalhadas pelo produto legado)
   numa única tela. Cada chave mapeia 1:1 para a chave legada do inventário.
   As extras da versão Final levam o selo "Final".
   Saíram da tela porque viraram padrão do produto: a cor do card (cor do tipo
   de procedimento, sobrescrita pela cor do cadastro do procedimento) e o CPF na
   busca de pacientes (CFG_FIXED).
   Campos adicionais do agendamento: a clínica escolhe o que exibir e o que é
   obrigatório (contrato legado: obrigacampos, Tipo 'Agendamento', Exibir/Obrigar).
   ============================================================================ */

const CFG_DEFAULTS = {
  NaoExibirNaAgendaOsStatus: [],
  OcultarBotaoRetorno: false,
  validadeconveniovencido: false,
  CamposAdicionaisAgendamento: { exibir: [], obrigar: ['Cel1'] },
  QuantidadeFaltasPagtoPrevio: 0,
  ExibirParentescoPacienteAgendar: false,
  PermitirRemarcarSemGrade: true,
  bloqueioretornofaltoso: false,
  AlterarStatusAgendamento: false,
  AlterarStatusAgendamentoPara: 'faltou',
  ContasAPagarCancelamento: false,
  RetornoPadrao: RET_PADRAO_DEFAULT,
  RetornoRegras: RET_RULES_DEFAULT,
};
// Configurações que existem já no MVP / V0.1; Expansion soma a carteirinha de convênio; as demais só valem na Final
const CFG_MVP = ['NaoExibirNaAgendaOsStatus', 'OcultarBotaoRetorno', 'CamposAdicionaisAgendamento', 'PermitirRemarcarSemGrade'];
// Comportamentos que deixaram de ser configuração e valem para todas as clínicas
const CFG_FIXED = { CPFBuscaPaciente: true };
const CFG_EXPANSION = [...CFG_MVP, 'validadeconveniovencido'];
const cfgAllowed = key => { const ed = window.__ed; if (!ed || ed.final) return true; return (ed.id === 'expansion' ? CFG_EXPANSION : CFG_MVP).includes(key); };
const CFG_LS = 'feegow.agendaCfg';

// Leitura efetiva: no MVP as configurações exclusivas da Final não têm efeito algum.
function cfgGet(key) {
  if (key in CFG_FIXED) return CFG_FIXED[key];
  const d = CFG_DEFAULTS[key];
  if (!cfgAllowed(key)) return d;
  const c = window.__cfg || {};
  return c[key] === undefined ? d : c[key];
}
function cfgLoad() {
  try { return { ...CFG_DEFAULTS, ...JSON.parse(localStorage.getItem(CFG_LS) || '{}') }; }
  catch (e) { return { ...CFG_DEFAULTS }; }
}
function cfgSave(c) { try { localStorage.setItem(CFG_LS, JSON.stringify(c)); } catch (e) {} }
const cfgSame = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// cor efetiva do agendamento: cada tipo de procedimento tem uma cor básica; a cor que a
// clínica escolheu no cadastro do procedimento, quando existe, sobrescreve a cor do tipo.
// Vale sempre: a configuração antiga "colorir pela cor do procedimento" deixou de existir.
function apptColors(a) {
  const t = TYPES[apptType(a)] || TYPES.consulta;
  const c = (PROCS[a.proc] || {}).color;
  return c ? { ...t, bar: c, tint: c + '2e', fg: c } : t;
}
const cfgHiddenStatuses = () => (cfgGet('NaoExibirNaAgendaOsStatus') || []).filter(s => CFG_HIDEABLE_STATUS.includes(s));

// Status que a clínica pode ocultar da agenda (os demais são parte do fluxo e sempre aparecem)
const CFG_HIDEABLE_STATUS = ['remarcado', 'cancelado'];

// ---- controles --------------------------------------------------------------
function CfgStatusChips({ value, onChange }) {
  const sel = value || [];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
      {CFG_HIDEABLE_STATUS.map(key => {
        const st = STATUS[key]; const on = sel.includes(key);
        return (
          <button key={key} onClick={() => onChange(on ? sel.filter(k => k !== key) : [...sel, key])}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 32, padding: '0 8px', borderRadius: WT.pill, cursor: 'pointer', fontFamily: WT.font, fontSize: 12, fontWeight: on ? WT.wHead : WT.wBody, background: on ? st.bg : '#ffffff', color: on ? st.fg : WT.fg2, border: `1px solid ${on ? st.dot : WT.border}` }}>
            <WIcon name={on ? 'eye-off' : st.icon} size={12} color={on ? st.fg : WT.muted} strokeWidth={2.2} />{st.label}
          </button>
        );
      })}
    </div>
  );
}
function CfgStepper({ value, onChange, min = 0, max = 10 }) {
  const v = Number(value) || 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
      <span style={{ fontSize: 12, color: WT.muted, whiteSpace: 'nowrap' }}>{v === 0 ? 'Desligado' : `${v} falta${v > 1 ? 's' : ''}`}</span>
      <div style={{ display: 'inline-flex', alignItems: 'center', background: '#ffffff', border: `1px solid ${WT.border}`, borderRadius: WT.rM, boxShadow: WT.shEmphasis }}>
        <WIconButton name="minus" dim={30} onClick={() => onChange(Math.max(min, v - 1))} />
        <span style={{ minWidth: 28, textAlign: 'center', fontSize: 14, fontWeight: WT.wHead, color: WT.fg, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
        <WIconButton name="plus" dim={30} onClick={() => onChange(Math.min(max, v + 1))} />
      </div>
    </div>
  );
}

// ---- mini-previews (efeito visual da configuração) --------------------------
function PrevCard({ color, label, ghost }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 20, padding: '0 8px', borderRadius: 4, background: ghost ? 'transparent' : (color + '2e'), borderLeft: `3px solid ${ghost ? WT.border : color}`, border: ghost ? `1px dashed ${WT.border}` : undefined, fontSize: 12, fontWeight: WT.wEmph, color: ghost ? WT.placeholder : color, whiteSpace: 'nowrap' }}>{label}</span>
  );
}
function CfgPreview({ children }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '8px 8px', borderRadius: WT.rM, background: WT.inset, border: `1px solid ${WT.borderSub}`, width: 'fit-content' }}>{children}</div>;
}

// ---- campos adicionais do agendamento ----------------------------------------
// Catálogo fixo (o mesmo do legado, sem a matrícula, que já vem com o convênio).
const CAMPOS_BASE = ['Cel1', 'Email1']; // já fazem parte do formulário padrão: sempre aparecem
const CAMPOS_CATALOGO = [
  { group: 'Identificação do paciente', keys: ['CPF', 'Nascimento', 'Sexo', 'NomeSocial', 'Documento', 'Profissao'] },
  { group: 'Contato', keys: ['Cel1', 'Tel1', 'Email1'] },
  { group: 'Origem e indicação', keys: ['Origem', 'IndicadoPor', 'IndicadoPorSelecao'] },
  { group: 'Atendimento', keys: ['Prioridade', 'Pendencias', 'Tabela'] },
];
const CAMPOS_ORDEM = CAMPOS_CATALOGO.flatMap(g => g.keys);
const CAMPOS_HINT = {
  IndicadoPorSelecao: 'Profissional da clínica ou externo que pediu o atendimento. Fica salvo no agendamento.',
  Tabela: 'Aparece em Pagamento, só em agendamento particular.',
};
const camposSort = list => CAMPOS_ORDEM.filter(k => (list || []).includes(k));
// obrigatório implica exibido; os campos do formulário padrão não entram na lista "exibir"
function camposNorm(v) {
  const obrigar = camposSort((v || {}).obrigar);
  const exibir = camposSort([...((v || {}).exibir || []), ...obrigar]).filter(k => !CAMPOS_BASE.includes(k));
  return { exibir, obrigar };
}
const camposShown = c => camposSort([...CAMPOS_BASE, ...c.exibir, ...c.obrigar]);
// leitura efetiva para o formulário de agendamento
function camposCfg() { const c = camposNorm(cfgGet('CamposAdicionaisAgendamento')); return { exibir: camposShown(c), obrigar: c.obrigar }; }

function CfgCamposAdicionais({ value, onChange }) {
  const c = camposNorm(value);
  const isShown = k => CAMPOS_BASE.includes(k) || c.exibir.includes(k);
  const setShown = (k, on) => onChange(camposNorm({ exibir: on ? [...c.exibir, k] : c.exibir.filter(x => x !== k), obrigar: on ? c.obrigar : c.obrigar.filter(x => x !== k) }));
  const setReq = (k, on) => onChange(camposNorm({ exibir: c.exibir, obrigar: on ? [...c.obrigar, k] : c.obrigar.filter(x => x !== k) }));
  const cols = 'minmax(0,1fr) 88px 112px';
  const head = { fontSize: 12, fontWeight: WT.wEmph, color: WT.fg2 };
  const shown = camposShown(c);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
      <div style={{ border: `1px solid ${WT.border}`, borderRadius: WT.rM, overflow: 'hidden', background: '#ffffff' }}>
        <div style={{ display: 'grid', gridTemplateColumns: cols, alignItems: 'center', gap: 12, padding: '8px 16px', background: WT.inset, borderBottom: `1px solid ${WT.border}` }}>
          <span style={head}>Campo</span><span style={head}>Exibir</span><span style={head}>Obrigatório</span>
        </div>
        {CAMPOS_CATALOGO.map(g => (
          <div key={g.group}>
            <div style={{ padding: '8px 16px 4px', fontSize: 12, fontWeight: WT.wHead, color: WT.muted, borderTop: `1px solid ${WT.borderSub}` }}>{g.group}</div>
            {g.keys.map(k => {
              const base = CAMPOS_BASE.includes(k); const on = isShown(k); const req = c.obrigar.includes(k);
              return (
                <div key={k} data-campo={k} style={{ display: 'grid', gridTemplateColumns: cols, alignItems: 'center', gap: 12, minHeight: 40, padding: '4px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: 14, color: WT.fg, fontWeight: on ? WT.wEmph : WT.wBody }}>{PATIENT_FIELDS[k] || k}</span>
                    {CAMPOS_HINT[k] && <span style={{ fontSize: 12, color: WT.muted, lineHeight: 1.4 }}>{CAMPOS_HINT[k]}</span>}
                  </div>
                  {base
                    ? <span style={{ fontSize: 12, color: WT.muted }} title="Faz parte do formulário padrão">Sempre</span>
                    : <WToggle checked={on} onChange={v => setShown(k, v)} />}
                  <WCheckbox checked={req} disabled={!on} onChange={v => setReq(k, v)} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: 8, borderRadius: WT.rM, background: WT.inset, border: `1px solid ${WT.borderSub}` }}>
        <span style={{ fontSize: 12, color: WT.muted }}>No agendamento:</span>
        {shown.map(k => (
          <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 24, padding: '0 8px', borderRadius: WT.pill, background: '#ffffff', border: `1px solid ${WT.border}`, fontSize: 12, color: WT.fg2, whiteSpace: 'nowrap' }}>
            {PATIENT_FIELDS[k] || k}{c.obrigar.includes(k) && <span style={{ color: WT.danger, fontWeight: WT.wHead }}>*</span>}
          </span>
        ))}
        <span style={{ fontSize: 12, color: WT.muted }}><span style={{ color: WT.danger, fontWeight: WT.wHead }}>*</span> obrigatório</span>
      </div>
      <span style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: WT.fg2, lineHeight: 1.45 }}>
        <WIcon name="info" size={13} color={WT.accent} style={{ marginTop: 2, flex: 'none' }} />
        <span>O que a recepção preenche é salvo na ficha do paciente. Dado que o paciente já tem no cadastro vem preenchido.{window.__ed && window.__ed.conv ? ' A matrícula da carteirinha já é pedida em todo agendamento por convênio.' : ''}</span>
      </span>
    </div>
  );
}

// ---- as configurações ----------------------------------------------------
const CFG_SECTIONS = [
  { id: 's1', n: 1, icon: 'calendar-days', title: 'Visualização da agenda', desc: 'O que aparece na grade e como cada agendamento é desenhado.' },
  { id: 's2', n: 2, icon: 'calendar-plus', title: 'Marcação de agendamento', desc: 'Regras aplicadas no momento de agendar.' },
  { id: 's3', n: 3, icon: 'calendar-clock', title: 'Remarcação, status e cancelamento', desc: 'O que acontece depois que o agendamento já existe.' },
  { id: 's4', n: 4, icon: 'rotate-ccw', title: 'Retorno', desc: 'Período de retorno, procedimento de retorno e o que acontece quando o paciente falta.' },
];

function cfgSettings() {
  return [
    {
      sec: 's1', key: 'NaoExibirNaAgendaOsStatus', title: 'Ocultar status na agenda',
      desc: 'Os agendamentos remarcados e/ou cancelados deixam de aparecer nas visões da agenda. Os demais status fazem parte do fluxo de atendimento e sempre aparecem.',
      control: (v, set) => <CfgStatusChips value={v} onChange={set} />,
      preview: v => (v || []).length ? <CfgPreview><PrevCard color="#1b5ea9" label="Marcado" /><PrevCard ghost label={`${v.length} status oculto${v.length > 1 ? 's' : ''}`} /></CfgPreview> : null,
    },
    {
      sec: 's4', key: 'OcultarBotaoRetorno', title: 'Usar controle de retorno',
      desc: 'Ao escolher o paciente, a agenda avisa se ele está em período de retorno e sugere o retorno com o mesmo profissional. O cartão da consulta atendida ganha o botão Agendar retorno. Desligue se a clínica não trabalha com retornos.',
      control: (v, set) => <WToggle checked={!v} onChange={nv => set(!nv)} />,
      preview: v => <CfgPreview>
        <span style={{ fontSize: 12, color: WT.muted }}>Ações do card:</span>
        <PrevCard color={WT.fg2} label="Remarcar" />
        {v ? <PrevCard ghost label="Agendar retorno" /> : <PrevCard color={WT.accent} label="Agendar retorno" />}
      </CfgPreview>,
    },
    {
      sec: 's4', key: 'RetornoPadrao', final: true, title: 'Padrão de retorno da clínica',
      desc: 'Vale para os procedimentos sem dias ou sem procedimento de retorno próprios. O período conta do dia da consulta (dia 0) até o último dia.',
      control: (v, set) => <RetPadraoControl value={v} onChange={set} />,
    },
    {
      sec: 's4', key: 'RetornoRegras', final: true, title: 'Retorno por procedimento e por convênio',
      desc: 'Quais procedimentos oferecem retorno, com quantos dias e qual procedimento de retorno é agendado. Os dias do convênio vencem os do procedimento.',
      control: () => null,
      extra: (cfg, setCfg) => <RetRegrasTable value={cfg.RetornoRegras} onChange={v => setCfg({ RetornoRegras: v })} />,
    },
    {
      sec: 's2', key: 'validadeconveniovencido', final: true, title: 'Exigir carteirinha do convênio válida',
      desc: 'Quando ativado, pacientes com carteirinha vencida não podem ser agendados por convênio.',
      control: (v, set) => <WToggle checked={!!v} onChange={set} />,
    },
    {
      sec: 's2', key: 'CamposAdicionaisAgendamento', title: 'Campos adicionais do agendamento',
      desc: 'Escolha quais dados a recepção vê ao agendar, além do formulário padrão, e quais deles são obrigatórios. Sem um campo obrigatório preenchido, o agendamento não é salvo.',
      keywords: CAMPOS_ORDEM.map(k => PATIENT_FIELDS[k]).join(' '),
      control: v => { const c = camposNorm(v); const n = camposShown(c).length; return <span style={{ fontSize: 12, color: WT.muted, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{n} exibido{n === 1 ? '' : 's'} · {c.obrigar.length} obrigatório{c.obrigar.length === 1 ? '' : 's'}</span>; },
      extra: (cfg, setCfg) => <CfgCamposAdicionais value={cfg.CamposAdicionaisAgendamento} onChange={v => setCfg({ CamposAdicionaisAgendamento: v })} />,
    },
    {
      sec: 's2', key: 'QuantidadeFaltasPagtoPrevio', final: true, title: 'Exigir pagamento antecipado após faltas',
      desc: 'Pacientes que faltaram este número de vezes só agendam de novo mediante pagamento antecipado.',
      control: (v, set) => <CfgStepper value={v} onChange={set} />,
    },
    {
      sec: 's2', key: 'ExibirParentescoPacienteAgendar', final: true, title: 'Perguntar parentesco ao agendar',
      desc: 'Adiciona o campo Parentesco/Responsável no formulário de agendamento.',
      control: (v, set) => <WToggle checked={!!v} onChange={set} />,
    },
    {
      sec: 's3', key: 'PermitirRemarcarSemGrade', title: 'Permitir remarcar em dia sem agenda aberta',
      desc: 'Ativado por padrão. Desative para impedir remarcações fora da grade do profissional.',
      warn: 'Ativado por padrão. Desative para impedir remarcações fora da grade do profissional.',
      control: (v, set) => <WToggle checked={!!v} onChange={set} />,
    },
    {
      sec: 's4', key: 'bloqueioretornofaltoso', final: true, title: 'Não liberar novo retorno após falta',
      desc: 'Se o paciente faltar ao retorno, a consulta de origem não libera outro retorno. A recepção agenda uma consulta normal.',
      control: (v, set) => <WToggle checked={!!v} onChange={set} />,
    },
    {
      sec: 's3', key: 'AlterarStatusAgendamento', final: true, title: 'Atualizar status automaticamente no fim do dia',
      desc: 'No fim do dia, agendamentos que ficaram pendentes mudam de status sozinhos.',
      control: (v, set) => <WToggle checked={!!v} onChange={set} />,
      extra: (cfg, setCfg, api) => cfg.AlterarStatusAgendamento ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12, marginTop: 10, padding: 12, borderRadius: WT.rM, background: WT.inset, border: `1px solid ${WT.borderSub}` }}>
          <WSelect label="Mudar status pendentes para:" value={cfg.AlterarStatusAgendamentoPara} placeholder=""
            onChange={v => setCfg({ AlterarStatusAgendamentoPara: v })} style={{ width: 200 }}
            options={[{ value: 'faltou', label: 'Faltou' }, { value: 'finalizado', label: 'Atendido' }, { value: 'cancelado', label: 'Desmarcado' }]} />
          <WButton variant="default" leadingIcon="clock-fading" label="Simular virada do dia" onClick={() => api.onSimulateDayEnd(cfg.AlterarStatusAgendamentoPara)} />
        </div>
      ) : null,
    },
    {
      sec: 's3', key: 'ContasAPagarCancelamento', final: true, title: 'Gerar pendência financeira ao cancelar agendamento pago',
      desc: 'Cancelou um atendimento já pago? Uma pendência de devolução é criada automaticamente no financeiro.',
      control: (v, set) => <WToggle checked={!!v} onChange={set} />,
    },
  ];
}

// ---- linha ------------------------------------------------------------------
function CfgRow({ s, cfg, setCfg, api, last }) {
  const v = cfg[s.key];
  const custom = !cfgSame(v === undefined ? CFG_DEFAULTS[s.key] : v, CFG_DEFAULTS[s.key]);
  const isWarn = s.warn && !!v;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 0 0', borderTop: last ? 'none' : undefined }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: '1 1 300px', maxWidth: '58ch' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: WT.wEmph, color: WT.fg }}>{s.title}</span>
            {s.final && <WBadge type="info">Final</WBadge>}
            {custom && <WBadge type="neutral" dot>personalizado</WBadge>}
          </div>
          <span style={{ fontSize: 14, color: WT.fg2, lineHeight: 1.45, textWrap: 'pretty' }}>{s.desc}</span>
          {isWarn && (
            <span style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 8, marginTop: 4, fontSize: 12, color: '#865200', background: '#fff6ba', border: '1px solid #e2aa00', borderRadius: WT.rM, padding: '4px 8px', lineHeight: 1.4 }}>
              <WIcon name="info" size={13} color="#865200" style={{ marginTop: 1 }} />Ativado por padrão. Desative para impedir remarcações fora da grade do profissional.
            </span>
          )}
        </div>
        <div style={{ flex: '0 1 auto', maxWidth: 420, display: 'flex', justifyContent: 'flex-end' }}>{s.control(v, nv => setCfg({ [s.key]: nv }))}</div>
      </div>
      {s.preview && s.preview(v)}
      {s.extra && s.extra(cfg, setCfg, api)}
    </div>
  );
}

// ---- página -----------------------------------------------------------------
function AgendaConfigPage({ cfg, setCfg, resetSection, onBack, onSimulateDayEnd }) {
  const mvp = !!window.__mvp;
  const [q, setQ] = React.useState('');
  const ql = q.trim().toLowerCase();
  const all = cfgSettings().filter(s => cfgAllowed(s.key));
  const match = s => !ql || (s.title + ' ' + s.desc + ' ' + (s.keywords || '')).toLowerCase().includes(ql);
  const nFinal = all.filter(s => s.final).length;
  const api = { onSimulateDayEnd };

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', background: WT.bg }}>
      <div style={{ maxWidth: 940, margin: '0 auto', padding: '24px 24px 64px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button onClick={onBack} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px 4px 4px 0', fontFamily: WT.font, fontSize: 14, fontWeight: WT.wEmph, color: WT.accent }}>
            <WIcon name="chevron-left" size={15} color={WT.accent} />Voltar para a agenda
          </button>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: WT.wHead, color: WT.fg, letterSpacing: '-.01em' }}>Configurações da Agenda</h1>
          <p style={{ margin: 0, fontSize: 14, color: WT.fg2, lineHeight: 1.5, maxWidth: '62ch' }}>Tudo o que muda o comportamento da sua agenda, em um só lugar.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240, maxWidth: 380 }}>
            <WInput value={q} onChange={setQ} placeholder="Buscar configuração…" prefixIcon="search" size="l" />
          </div>
          <span style={{ fontSize: 12, color: WT.muted }}>
            {window.__ed && window.__ed.id === 'mvp' ? `${all.length} configurações nesta versão (MVP · V0.1)` : window.__ed && window.__ed.id === 'expansion' ? `${all.length} configurações nesta versão (Expansion · V0.2)` : `${all.length} configurações · ${nFinal} chegam na versão Final`}
          </span>
        </div>

        {CFG_SECTIONS.map(sec => {
          const rows = all.filter(s => s.sec === sec.id && match(s));
          if (!rows.length) return null;
          return (
            <section key={sec.id} style={{ background: WT.raised, border: `1px solid ${WT.border}`, borderRadius: WT.rL, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px', background: WT.inset, borderBottom: `1px solid ${WT.border}` }}>
                <span style={{ width: 32, height: 32, borderRadius: WT.rM, flex: 'none', background: WT.accentSoft, border: `1px solid ${WT.borderAccent}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <WIcon name={sec.icon} size={17} color={WT.accent} />
                </span>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: WT.wHead, color: WT.fg, letterSpacing: '-.005em' }}>
                    <span style={{ color: WT.accent, fontVariantNumeric: 'tabular-nums' }}>{sec.n}.</span> {sec.title}
                  </h2>
                  <p style={{ margin: 0, fontSize: 12, color: WT.fg2, lineHeight: 1.45 }}>{sec.desc}</p>
                </div>
                <button onClick={() => resetSection(rows.map(r => r.key))}
                  style={{ flex: 'none', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: WT.font, fontSize: 12, fontWeight: WT.wEmph, color: WT.accent, padding: '4px 0' }}>Restaurar padrão</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', padding: '0 24px 24px' }}>
                {rows.map((s, i) => (
                  <div key={s.key} style={{ borderTop: i === 0 ? 'none' : `1px solid ${WT.borderSub}`, marginTop: i === 0 ? 0 : 16 }}>
                    <CfgRow s={s} cfg={cfg} setCfg={setCfg} api={api} />
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {!CFG_SECTIONS.some(sec => all.some(s => s.sec === sec.id && match(s))) && (
          <div style={{ padding: '32px 0', textAlign: 'center', color: WT.muted, fontSize: 14 }}>Nenhuma configuração encontrada para "{q}".</div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: WT.muted }}>
          <WIcon name="check-check" size={14} color={WT.muted} />Cada alteração é salva automaticamente e vale para todos os usuários desta unidade.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  CFG_DEFAULTS, CFG_MVP, CFG_HIDEABLE_STATUS, cfgGet, cfgLoad, cfgSave, cfgSame, apptColors, cfgHiddenStatuses,
  CfgStatusChips, CfgStepper, AgendaConfigPage, CAMPOS_BASE, CAMPOS_ORDEM, camposCfg,
});
