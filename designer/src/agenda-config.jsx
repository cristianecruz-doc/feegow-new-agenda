/* ============================================================================
   Feegow — New Agenda · "Configurações da Agenda"
   Consolida as 11 configurações do módulo (hoje espalhadas pelo produto legado)
   numa única tela. Cada chave mapeia 1:1 para a chave legada do inventário.
   MVP: 5 configurações · Final: 11 (as extras marcadas com o selo "Final").
   ============================================================================ */

const CFG_DEFAULTS = {
  NaoExibirNaAgendaOsStatus: [],
  ColorirLinhaAgendamento: false,
  OcultarBotaoRetorno: false,
  validadeconveniovencido: false,
  CPFBuscaPaciente: false,
  QuantidadeFaltasPagtoPrevio: 0,
  ExibirParentescoPacienteAgendar: false,
  PermitirRemarcarSemGrade: true,
  bloqueioretornofaltoso: false,
  AlterarStatusAgendamento: false,
  AlterarStatusAgendamentoPara: 'faltou',
  ContasAPagarCancelamento: false,
};
// Configurações que existem já no MVP / V0.1 (as demais só valem na versão Final)
const CFG_MVP = ['NaoExibirNaAgendaOsStatus', 'ColorirLinhaAgendamento', 'OcultarBotaoRetorno', 'CPFBuscaPaciente', 'PermitirRemarcarSemGrade'];
const CFG_LS = 'feegow.agendaCfg';

// Leitura efetiva: no MVP as configurações exclusivas da Final não têm efeito algum.
function cfgGet(key) {
  const d = CFG_DEFAULTS[key];
  if (window.__mvp && !CFG_MVP.includes(key)) return d;
  const c = window.__cfg || {};
  return c[key] === undefined ? d : c[key];
}
function cfgLoad() {
  try { return { ...CFG_DEFAULTS, ...JSON.parse(localStorage.getItem(CFG_LS) || '{}') }; }
  catch (e) { return { ...CFG_DEFAULTS }; }
}
function cfgSave(c) { try { localStorage.setItem(CFG_LS, JSON.stringify(c)); } catch (e) {} }
const cfgSame = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// cor efetiva do agendamento (tipo do procedimento OU cor do procedimento)
function apptColors(a) {
  const t = TYPES[apptType(a)] || TYPES.consulta;
  if (!cfgGet('ColorirLinhaAgendamento')) return t;
  const c = (PROCS[a.proc] || {}).color;
  return c ? { ...t, bar: c, tint: c + '1f', fg: c } : t;
}
const cfgHiddenStatuses = () => (cfgGet('NaoExibirNaAgendaOsStatus') || []).filter(s => CFG_HIDEABLE_STATUS.includes(s));

// Status que a clínica pode ocultar da agenda (os demais são parte do fluxo e sempre aparecem)
const CFG_HIDEABLE_STATUS = ['remarcado', 'cancelado'];

// ---- controles --------------------------------------------------------------
function CfgStatusChips({ value, onChange }) {
  const sel = value || [];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
      {CFG_HIDEABLE_STATUS.map(key => {
        const st = STATUS[key]; const on = sel.includes(key);
        return (
          <button key={key} onClick={() => onChange(on ? sel.filter(k => k !== key) : [...sel, key])}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 28, padding: '0 10px', borderRadius: WT.pill, cursor: 'pointer', fontFamily: WT.font, fontSize: 12.5, fontWeight: on ? WT.wHead : WT.wBody, background: on ? st.bg : '#fff', color: on ? st.fg : WT.fg2, border: `1px solid ${on ? st.fg + '55' : WT.border}` }}>
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
      <span style={{ fontSize: 12.5, color: WT.muted, whiteSpace: 'nowrap' }}>{v === 0 ? 'Desligado' : `${v} falta${v > 1 ? 's' : ''}`}</span>
      <div style={{ display: 'inline-flex', alignItems: 'center', background: '#fff', border: `1px solid ${WT.border}`, borderRadius: WT.rM, boxShadow: WT.shEmphasis }}>
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
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 20, padding: '0 7px', borderRadius: 4, background: ghost ? 'transparent' : (color + '1f'), borderLeft: `3px solid ${ghost ? WT.border : color}`, border: ghost ? `1px dashed ${WT.border}` : undefined, fontSize: 10.5, fontWeight: WT.wEmph, color: ghost ? WT.placeholder : color, whiteSpace: 'nowrap' }}>{label}</span>
  );
}
function CfgPreview({ children }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '6px 8px', borderRadius: WT.rM, background: WT.inset, border: `1px solid ${WT.borderSub}`, width: 'fit-content' }}>{children}</div>;
}

// ---- as 11 configurações ----------------------------------------------------
const CFG_SECTIONS = [
  { id: 's1', n: 1, icon: 'calendar-days', title: 'Visualização da agenda', desc: 'O que aparece na grade e como cada agendamento é desenhado.' },
  { id: 's2', n: 2, icon: 'calendar-plus', title: 'Marcação de agendamento', desc: 'Regras aplicadas no momento de agendar.' },
  { id: 's3', n: 3, icon: 'calendar-clock', title: 'Remarcação, status e cancelamento', desc: 'O que acontece depois que o agendamento já existe.' },
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
      sec: 's1', key: 'ColorirLinhaAgendamento', title: 'Colorir agendamentos pela cor do procedimento',
      desc: 'Cada agendamento usa a cor do procedimento, para identificar o tipo de atendimento num relance.',
      control: (v, set) => <WToggle checked={!!v} onChange={set} />,
      preview: v => <CfgPreview>
        <PrevCard color={v ? (PROCS.derm.color) : TYPES.consulta.bar} label="Dermatologia" />
        <PrevCard color={v ? (PROCS.cardio.color) : TYPES.consulta.bar} label="Cardiologia" />
        <PrevCard color={v ? (PROCS.vacina.color) : TYPES.procedimento.bar} label="Vacinação" />
      </CfgPreview>,
    },
    {
      sec: 's1', key: 'OcultarBotaoRetorno', title: 'Ocultar botão de Retorno',
      desc: 'Remove a ação de marcar retorno, para clínicas que não trabalham com retornos.',
      control: (v, set) => <WToggle checked={!!v} onChange={set} />,
      preview: v => <CfgPreview>
        <span style={{ fontSize: 10.5, color: WT.muted }}>Ações do card:</span>
        <PrevCard color={WT.fg2} label="Remarcar" /><PrevCard color={WT.fg2} label="Cancelar" />
        {v ? <PrevCard ghost label="Retorno" /> : <PrevCard color={WT.accent} label="Retorno" />}
      </CfgPreview>,
    },
    {
      sec: 's2', key: 'validadeconveniovencido', final: true, title: 'Exigir carteirinha do convênio válida',
      desc: 'Quando ativado, pacientes com carteirinha vencida não podem ser agendados por convênio.',
      control: (v, set) => <WToggle checked={!!v} onChange={set} />,
    },
    {
      sec: 's2', key: 'CPFBuscaPaciente', title: 'Mostrar CPF na busca de pacientes',
      desc: 'Exibe o CPF nos resultados da busca, para não confundir pacientes com nomes parecidos.',
      control: (v, set) => <WToggle checked={!!v} onChange={set} />,
      preview: v => <CfgPreview>
        <span style={{ fontSize: 10.5, color: WT.fg2, fontWeight: WT.wEmph }}>Maria Silva Santos</span>
        {v ? <span style={{ fontSize: 10.5, color: WT.muted, fontVariantNumeric: 'tabular-nums' }}>CPF 342.118.907-55</span> : <span style={{ fontSize: 10.5, color: WT.placeholder }}>sem CPF</span>}
      </CfgPreview>,
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
      sec: 's3', key: 'bloqueioretornofaltoso', final: true, title: 'Bloquear remarcação de retorno após falta',
      desc: 'Pacientes que faltaram não conseguem remarcar o retorno gratuito.',
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: '1 1 300px', maxWidth: '58ch' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: WT.wEmph, color: WT.fg }}>{s.title}</span>
            {s.final && <WBadge type="info">Final</WBadge>}
            {custom && <WBadge type="neutral" dot>personalizado</WBadge>}
          </div>
          <span style={{ fontSize: 13, color: WT.fg2, lineHeight: 1.45, textWrap: 'pretty' }}>{s.desc}</span>
          {isWarn && (
            <span style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 6, marginTop: 4, fontSize: 12, color: '#865200', background: '#fff6ba', border: '1px solid #e8d27a', borderRadius: WT.rM, padding: '5px 8px', lineHeight: 1.4 }}>
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
  const all = cfgSettings().filter(s => !(mvp && s.final));
  const match = s => !ql || (s.title + ' ' + s.desc).toLowerCase().includes(ql);
  const api = { onSimulateDayEnd };

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', background: WT.bg }}>
      <div style={{ maxWidth: 940, margin: '0 auto', padding: '24px 24px 64px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button onClick={onBack} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 5, border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px 4px 2px 0', fontFamily: WT.font, fontSize: 13, fontWeight: WT.wEmph, color: WT.accent }}>
            <WIcon name="chevron-left" size={15} color={WT.accent} />Voltar para a agenda
          </button>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: WT.wHead, color: WT.fg, letterSpacing: '-.01em' }}>Configurações da Agenda</h1>
          <p style={{ margin: 0, fontSize: 13.5, color: WT.fg2, lineHeight: 1.5, maxWidth: '62ch' }}>Tudo o que muda o comportamento da sua agenda, em um só lugar.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240, maxWidth: 380 }}>
            <WInput value={q} onChange={setQ} placeholder="Buscar configuração…" prefixIcon="search" size="l" />
          </div>
          <span style={{ fontSize: 12.5, color: WT.muted }}>
            {mvp ? '5 configurações nesta versão (MVP · V0.1)' : '11 configurações · 6 chegam na versão Final'}
          </span>
        </div>

        {CFG_SECTIONS.map(sec => {
          const rows = all.filter(s => s.sec === sec.id && match(s));
          if (!rows.length) return null;
          return (
            <section key={sec.id} style={{ background: WT.raised, border: `1px solid ${WT.border}`, borderRadius: WT.rL, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: WT.inset, borderBottom: `1px solid ${WT.border}` }}>
                <span style={{ width: 32, height: 32, borderRadius: WT.rM, flex: 'none', background: WT.accentSoft, border: `1px solid ${WT.borderAccent}44`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <WIcon name={sec.icon} size={17} color={WT.accent} />
                </span>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: WT.wHead, color: WT.fg, letterSpacing: '-.005em' }}>
                    <span style={{ color: WT.accent, fontVariantNumeric: 'tabular-nums' }}>{sec.n}.</span> {sec.title}
                  </h2>
                  <p style={{ margin: 0, fontSize: 12.5, color: WT.fg2, lineHeight: 1.45 }}>{sec.desc}</p>
                </div>
                <button onClick={() => resetSection(rows.map(r => r.key))}
                  style={{ flex: 'none', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: WT.font, fontSize: 12.5, fontWeight: WT.wEmph, color: WT.accent, padding: '2px 0' }}>Restaurar padrão</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', padding: '0 20px 20px' }}>
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
          <div style={{ padding: '40px 0', textAlign: 'center', color: WT.muted, fontSize: 13.5 }}>Nenhuma configuração encontrada para "{q}".</div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: WT.muted }}>
          <WIcon name="check-check" size={14} color={WT.muted} />Cada alteração é salva automaticamente e vale para todos os usuários desta unidade.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  CFG_DEFAULTS, CFG_MVP, CFG_HIDEABLE_STATUS, cfgGet, cfgLoad, cfgSave, cfgSame, apptColors, cfgHiddenStatuses,
  CfgStatusChips, CfgStepper, AgendaConfigPage,
});
