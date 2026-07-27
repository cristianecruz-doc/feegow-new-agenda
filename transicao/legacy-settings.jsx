/* ============================================================================
   Feegow — Fase de transição · Tela "Configurações de Agenda" (agenda legada)
   Mesma tela da Nova Agenda, acrescida das configurações que só existem no
   produto atual (marcadas com o selo "Legado").
   ============================================================================ */

const WTOK = {
  fg: '#242727', fg2: '#565f5f', muted: '#888f8f', bg: '#f7f8f8', raised: '#fff', inset: '#f3f5f5',
  border: '#d8dada', borderSub: '#e8eaea', accent: '#006a59', accentFill: '#007c68',
  accentSoft: '#dff9f2', borderAccent: '#00a085', warnFg: '#865200', warnBg: '#fff6ba', warnBd: '#e8d27a',
  font: LT.font, wBody: 450, wEmph: 550, wHead: 600,
};

const LCFG_LS = 'feegow.legacyAgendaCfg';
const LCFG_DEFAULTS = {
  ocultarStatus: [], colorirProcedimento: false, ocultarRetorno: false, progressoOcupacao: true,
  filtroProcMultipla: true, filtroConvMultipla: true, filtroEquipMultipla: true, listarTodasMultipla: false,
  permitirCarteirinhaVencida: true, cpfNaBusca: false, faltasPagtoPrevio: 0, perguntarParentesco: false, todosProcedimentos: false,
  remarcarSemGrade: true, bloquearRetornoFaltoso: false, statusAutomatico: false, statusAutomaticoPara: 'faltou',
  contaPagarCancelamento: false, liberarHorarioRemarcacao: false, pedirObservacaoStatus: true,
  intervaloMinGrade: 1, cancelarOnlineNaoPago: true, enviarFimDeSemana: true,
};
const LSTATUS = [
  { id: 'agendado', label: 'Agendado', fg: '#565f5f', bg: '#eef0f0', icon: 'circle' },
  { id: 'confirmado', label: 'Confirmado', fg: '#1f6fb0', bg: '#e8f1f9', icon: 'check' },
  { id: 'aguardando', label: 'Aguardando', fg: '#9a6700', bg: '#fdf3da', icon: 'armchair' },
  { id: 'em_atendimento', label: 'Em atendimento', fg: '#7a3ba8', bg: '#f4edfa', icon: 'stethoscope' },
  { id: 'atendido', label: 'Atendido', fg: '#0a5c4a', bg: '#e6f4ef', icon: 'check-check' },
  { id: 'faltou', label: 'Faltou', fg: '#c02a1b', bg: '#fbeae8', icon: 'user-x' },
  { id: 'desmarcado', label: 'Desmarcado', fg: '#888f8f', bg: '#f3f5f5', icon: 'x' },
  { id: 'remarcado', label: 'Remarcado', fg: '#1c1f1f', bg: '#ebeded', icon: 'calendar-clock' },
];

function lcfgLoad() {
  try { return { ...LCFG_DEFAULTS, ...JSON.parse(localStorage.getItem(LCFG_LS) || '{}') }; }
  catch (e) { return { ...LCFG_DEFAULTS }; }
}
const lcfgSave = c => { try { localStorage.setItem(LCFG_LS, JSON.stringify(c)); } catch (e) {} };
const lcfgSame = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---- controles --------------------------------------------------------------
function LToggle({ checked, onChange }) {
  return (
    <span onClick={() => onChange(!checked)} style={{ width: 38, height: 22, borderRadius: 999, background: checked ? WTOK.accentFill : WTOK.muted, position: 'relative', flex: 'none', cursor: 'pointer', transition: 'background .15s', boxShadow: 'inset 0 -1px 0 0 #00000014' }}>
      <span style={{ position: 'absolute', top: 2, left: checked ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px #00000033', transition: 'left .15s' }} />
    </span>
  );
}
function LStepper({ value, onChange, min = 0, max = 60, suffix, offLabel }) {
  const v = Number(value) || 0;
  const btn = (icon, next) => (
    <button onClick={() => onChange(next)} style={{ width: 30, height: 30, border: 'none', background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <LIcon name={icon} size={14} color={WTOK.fg2} />
    </button>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
      <span style={{ fontSize: 12.5, color: WTOK.muted, whiteSpace: 'nowrap' }}>{v === 0 && offLabel ? offLabel : `${v} ${suffix}`}</span>
      <div style={{ display: 'inline-flex', alignItems: 'center', background: '#fff', border: `1px solid ${WTOK.border}`, borderRadius: 8 }}>
        {btn('minus', Math.max(min, v - 1))}
        <span style={{ minWidth: 28, textAlign: 'center', fontSize: 14, fontWeight: WTOK.wHead, color: WTOK.fg, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
        {btn('plus', Math.min(max, v + 1))}
      </div>
    </div>
  );
}
function LStatusChips({ value, onChange }) {
  const sel = value || [];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
      {LSTATUS.map(st => {
        const on = sel.includes(st.id);
        return (
          <button key={st.id} onClick={() => onChange(on ? sel.filter(k => k !== st.id) : [...sel, st.id])}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 28, padding: '0 10px', borderRadius: 999, cursor: 'pointer', fontFamily: WTOK.font, fontSize: 12.5, fontWeight: on ? WTOK.wHead : WTOK.wBody, background: on ? st.bg : '#fff', color: on ? st.fg : WTOK.fg2, border: `1px solid ${on ? st.fg + '55' : WTOK.border}` }}>
            <LIcon name={on ? 'eye-off' : st.icon} size={12} color={on ? st.fg : WTOK.muted} strokeWidth={2.2} />{st.label}
          </button>
        );
      })}
    </div>
  );
}
function LSelect({ label, value, onChange, options, width = 210 }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, width }}>
      {label && <span style={{ fontSize: 13, fontWeight: WTOK.wEmph, color: WTOK.fg }}>{label}</span>}
      <span style={{ position: 'relative', height: 32, borderRadius: 8, border: `1px solid ${WTOK.border}`, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 10px' }}>
        <select value={value} onChange={e => onChange(e.target.value)} style={{ appearance: 'none', WebkitAppearance: 'none', border: 'none', outline: 'none', background: 'transparent', font: `${WTOK.wBody} 14px ${WTOK.font}`, color: WTOK.fg, flex: 1, cursor: 'pointer', paddingRight: 18 }}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <LIcon name="chevron-down" size={15} style={{ position: 'absolute', right: 8, pointerEvents: 'none' }} />
      </span>
    </label>
  );
}
function LBadge({ tone = 'neutral', children, icon }) {
  const map = { neutral: ['#e8eaea', '#565f5f', '#c4c9c9'], legado: [WTOK.warnBg, WTOK.warnFg, WTOK.warnBd], info: ['#e2e9ff', '#1b5ea9', '#aec6ee'] };
  const [bg, fg, bd] = map[tone] || map.neutral;
  return (
    <span style={{ height: 20, padding: '0 8px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: WTOK.wEmph, background: bg, color: fg, border: `1px solid ${bd}`, whiteSpace: 'nowrap' }}>
      {icon && <LIcon name={icon} size={11} color={fg} />}{children}
    </span>
  );
}

// ---- seções e configurações -------------------------------------------------
const LSECTIONS = [
  { id: 's1', n: 1, icon: 'calendar-days', title: 'Visualização da agenda', desc: 'O que aparece na grade e como cada agendamento é desenhado.' },
  { id: 's2', n: 2, icon: 'columns-3', title: 'Agenda Múltipla', desc: 'Filtros e abertura da visão de várias agendas ao mesmo tempo.' },
  { id: 's3', n: 3, icon: 'calendar-plus', title: 'Marcação de agendamento', desc: 'Regras aplicadas no momento de agendar.' },
  { id: 's4', n: 4, icon: 'calendar-clock', title: 'Remarcação, status e cancelamento', desc: 'O que acontece depois que o agendamento já existe.' },
  { id: 's5', n: 5, icon: 'globe', title: 'Grade e agendamento online', desc: 'Criação de grade, reservas online e envio de avisos.' },
];

const T = (v, set) => <LToggle checked={!!v} onChange={set} />;

function lcfgSettings(cfg, setCfg) {
  return [
    { sec: 's1', key: 'ocultarStatus', title: 'Ocultar status na agenda', desc: 'Os agendamentos com os status escolhidos deixam de aparecer nas visões da agenda.', control: (v, set) => <LStatusChips value={v} onChange={set} /> },
    { sec: 's1', key: 'colorirProcedimento', title: 'Colorir agendamentos pela cor do procedimento', desc: 'Cada agendamento usa a cor do procedimento, para identificar o tipo de atendimento num relance.', control: T },
    { sec: 's1', key: 'ocultarRetorno', title: 'Ocultar botão de Retorno', desc: 'Remove a ação de marcar retorno, para clínicas que não trabalham com retornos.', control: T },
    { sec: 's1', key: 'progressoOcupacao', legado: true, title: 'Mostrar progresso de ocupação das agendas', desc: 'Exibe quanto da agenda do dia de cada profissional já está preenchida.', control: T },

    { sec: 's2', key: 'filtroProcMultipla', legado: true, title: 'Filtro de Procedimento na Agenda Múltipla', desc: 'Permite filtrar a visão de várias agendas por procedimento.', control: T },
    { sec: 's2', key: 'filtroConvMultipla', legado: true, title: 'Filtro de Convênios na Agenda Múltipla', desc: 'Permite filtrar a visão de várias agendas por convênio.', control: T },
    { sec: 's2', key: 'filtroEquipMultipla', legado: true, title: 'Filtro de Equipamentos na Agenda Múltipla', desc: 'Permite incluir aparelhos e salas na visão de várias agendas.', control: T },
    { sec: 's2', key: 'listarTodasMultipla', legado: true, title: 'Listar todas as agendas ao abrir a Agenda Múltipla', desc: 'Ao abrir, todos os profissionais do dia já aparecem, sem precisar filtrar.', control: T },

    { sec: 's3', key: 'permitirCarteirinhaVencida', title: 'Permitir agendar com carteirinha do convênio vencida', desc: 'Quando ativado, pacientes com a validade do convênio vencida ainda podem ser agendados.', control: T },
    { sec: 's3', key: 'cpfNaBusca', title: 'Mostrar CPF na busca de pacientes', desc: 'Exibe o CPF nos resultados da busca, para não confundir pacientes com nomes parecidos.', control: T },
    { sec: 's3', key: 'faltasPagtoPrevio', title: 'Exigir pagamento antecipado após faltas', desc: 'Pacientes que faltaram este número de vezes só agendam de novo mediante pagamento antecipado.', control: (v, set) => <LStepper value={v} onChange={set} max={10} suffix="faltas" offLabel="Desligado" /> },
    { sec: 's3', key: 'perguntarParentesco', title: 'Perguntar parentesco ao agendar', desc: 'Adiciona o campo Parentesco/Responsável no formulário de agendamento.', control: T },
    { sec: 's3', key: 'todosProcedimentos', legado: true, title: 'Mostrar todos os procedimentos na marcação', desc: 'Exibe a lista completa de procedimentos contratados, e não só os vinculados ao profissional.', control: T },

    { sec: 's4', key: 'remarcarSemGrade', title: 'Permitir remarcar em dia sem agenda aberta', desc: 'Permite remarcar um paciente para um dia em que o profissional não tem grade de horários.', control: T },
    { sec: 's4', key: 'bloquearRetornoFaltoso', title: 'Bloquear remarcação de retorno após falta', desc: 'Pacientes que faltaram não conseguem remarcar o retorno gratuito.', control: T },
    {
      sec: 's4', key: 'statusAutomatico', title: 'Atualizar status automaticamente no fim do dia',
      desc: 'No fim do dia, agendamentos que ficaram pendentes mudam de status sozinhos.', control: T,
      extra: () => cfg.statusAutomatico ? (
        <div style={{ marginTop: 10, padding: 12, borderRadius: 8, background: WTOK.inset, border: `1px solid ${WTOK.borderSub}`, width: 'fit-content' }}>
          <LSelect label="Mudar pendentes para:" value={cfg.statusAutomaticoPara} onChange={v => setCfg({ statusAutomaticoPara: v })}
            options={[{ value: 'faltou', label: 'Faltou' }, { value: 'atendido', label: 'Atendido' }, { value: 'desmarcado', label: 'Desmarcado' }]} />
        </div>
      ) : null,
    },
    { sec: 's4', key: 'contaPagarCancelamento', title: 'Gerar conta a pagar ao cancelar agendamento pago', desc: 'Ao cancelar um atendimento já pago, uma pendência de devolução é criada automaticamente no financeiro.', control: T },
    { sec: 's4', key: 'liberarHorarioRemarcacao', legado: true, title: 'Liberar horário ao remarcar', desc: 'Quando um paciente é remarcado, o horário antigo volta a ficar disponível para outro paciente.', control: T },
    { sec: 's4', key: 'pedirObservacaoStatus', legado: true, title: 'Pedir observação ao alterar status', desc: 'Ao mudar o status de um agendamento, o sistema pede uma observação do motivo.', control: T },

    { sec: 's5', key: 'intervaloMinGrade', legado: true, title: 'Intervalo mínimo entre horários da grade', desc: 'Define o intervalo mínimo entre horários ao criar a grade do profissional.', control: (v, set) => <LStepper value={v} onChange={set} min={1} max={60} suffix="min" /> },
    { sec: 's5', key: 'cancelarOnlineNaoPago', legado: true, title: 'Cancelar automaticamente agendamento online não pago', desc: 'Reservas feitas online que não forem pagas são canceladas sozinhas, liberando o horário.', control: T },
    { sec: 's5', key: 'enviarFimDeSemana', legado: true, title: 'Enviar SMS e e-mail no fim de semana', desc: 'Confirmações e lembretes também são enviados aos sábados e domingos.', control: T },
  ];
}

function LCfgRow({ s, cfg, setCfg }) {
  const v = cfg[s.key];
  const custom = !lcfgSame(v === undefined ? LCFG_DEFAULTS[s.key] : v, LCFG_DEFAULTS[s.key]);
  return (
    <div style={{ padding: '16px 0 0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: '1 1 300px', maxWidth: '58ch' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: WTOK.wEmph, color: WTOK.fg }}>{s.title}</span>
            {s.legado && <LBadge tone="legado" icon="history">Legado</LBadge>}
            {custom && <LBadge>personalizado</LBadge>}
          </div>
          <span style={{ fontSize: 13, color: WTOK.fg2, lineHeight: 1.45, textWrap: 'pretty' }}>{s.desc}</span>
        </div>
        <div style={{ flex: '0 1 auto', maxWidth: 420, display: 'flex', justifyContent: 'flex-end' }}>{s.control(v, nv => setCfg({ [s.key]: nv }))}</div>
      </div>
      {s.extra && s.extra()}
    </div>
  );
}

function LegacyConfigPage({ cfg, setCfg, resetSection, onBack }) {
  const [q, setQ] = React.useState('');
  const ql = q.trim().toLowerCase();
  const all = lcfgSettings(cfg, setCfg);
  const match = s => !ql || (s.title + ' ' + s.desc).toLowerCase().includes(ql);
  const nLegado = all.filter(s => s.legado).length;
  const anything = LSECTIONS.some(sec => all.some(s => s.sec === sec.id && match(s)));
  return (
    <div style={{ flex: 1, minWidth: 0, overflow: 'auto', background: WTOK.bg, fontFamily: WTOK.font }}>
      <div style={{ maxWidth: 940, margin: '0 auto', padding: '24px 24px 64px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button onClick={onBack} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 5, border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px 4px 2px 0', fontFamily: WTOK.font, fontSize: 13, fontWeight: WTOK.wEmph, color: WTOK.accent }}>
            <LIcon name="chevron-left" size={15} color={WTOK.accent} />Voltar para a agenda
          </button>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: WTOK.wHead, color: WTOK.fg, letterSpacing: '-.01em' }}>Configurações de Agenda</h1>
          <p style={{ margin: 0, fontSize: 13.5, color: WTOK.fg2, lineHeight: 1.5, maxWidth: '62ch' }}>Tudo o que muda o comportamento da sua agenda, em um só lugar.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 12, background: WTOK.warnBg, border: `1px solid ${WTOK.warnBd}` }}>
          <LIcon name="history" size={16} color={WTOK.warnFg} style={{ marginTop: 1 }} />
          <span style={{ fontSize: 13, color: WTOK.warnFg, lineHeight: 1.5 }}>
            <strong style={{ fontWeight: WTOK.wHead }}>Fase de transição.</strong> As {nLegado} configurações marcadas com <strong style={{ fontWeight: WTOK.wHead }}>Legado</strong> atendem à agenda atual e deixam de existir quando sua clínica migrar para a Nova Agenda — o comportamento delas passa a ser padrão do produto.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ flex: 1, minWidth: 240, maxWidth: 380, display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 12px', borderRadius: 8, border: `1px solid ${WTOK.border}`, background: '#fff' }}>
            <LIcon name="search" size={16} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar configuração…"
              style={{ border: 'none', outline: 'none', font: `${WTOK.wBody} 14px ${WTOK.font}`, flex: 1, background: 'transparent', color: WTOK.fg, minWidth: 0 }} />
          </span>
          <span style={{ fontSize: 12.5, color: WTOK.muted }}>{all.length} configurações · {nLegado} exclusivas da agenda atual</span>
        </div>

        {LSECTIONS.map(sec => {
          const rows = all.filter(s => s.sec === sec.id && match(s));
          if (!rows.length) return null;
          const allLegado = rows.every(r => r.legado);
          return (
            <section key={sec.id} style={{ background: WTOK.raised, border: `1px solid ${WTOK.border}`, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: WTOK.inset, borderBottom: `1px solid ${WTOK.border}` }}>
                <span style={{ width: 32, height: 32, borderRadius: 8, flex: 'none', background: WTOK.accentSoft, border: `1px solid ${WTOK.borderAccent}44`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LIcon name={sec.icon} size={17} color={WTOK.accent} />
                </span>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: WTOK.wHead, color: WTOK.fg, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span><span style={{ color: WTOK.accent, fontVariantNumeric: 'tabular-nums' }}>{sec.n}.</span> {sec.title}</span>
                    {allLegado && <LBadge tone="legado" icon="history">Só na agenda atual</LBadge>}
                  </h2>
                  <p style={{ margin: 0, fontSize: 12.5, color: WTOK.fg2, lineHeight: 1.45 }}>{sec.desc}</p>
                </div>
                <button onClick={() => resetSection(rows.map(r => r.key))}
                  style={{ flex: 'none', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: WTOK.font, fontSize: 12.5, fontWeight: WTOK.wEmph, color: WTOK.accent }}>Restaurar padrão</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', padding: '0 20px 20px' }}>
                {rows.map((s, i) => (
                  <div key={s.key} style={{ borderTop: i === 0 ? 'none' : `1px solid ${WTOK.borderSub}`, marginTop: i === 0 ? 0 : 16 }}>
                    <LCfgRow s={s} cfg={cfg} setCfg={setCfg} />
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {!anything && <div style={{ padding: '40px 0', textAlign: 'center', color: WTOK.muted, fontSize: 13.5 }}>Nenhuma configuração encontrada para "{q}".</div>}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: WTOK.muted }}>
          <LIcon name="check-check" size={14} />Cada alteração é salva automaticamente e vale para todos os usuários desta unidade.
        </div>
      </div>
    </div>
  );
}

function LToast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: '#3d4343', color: '#fff', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, fontFamily: WTOK.font, fontSize: 14, fontWeight: WTOK.wEmph, boxShadow: '0 8px 24px #00000026' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />{msg}
    </div>
  );
}

Object.assign(window, { WTOK, LCFG_DEFAULTS, lcfgLoad, lcfgSave, LegacyConfigPage, LToast });
