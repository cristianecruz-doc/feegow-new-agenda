/* ============================================================================
   Simulador de permissões do usuário — as 5 permissões da Nova Agenda
   (modelo fechado em 05/10/2026). Só para demonstração: troca o que o usuário
   logado pode fazer e a agenda reage na hora. Admin da clínica sempre tem as 5.
   ============================================================================ */

const PERM_DEFS = [
  { id: 'view',  label: 'Ver a agenda', keys: 'agenda:read',
    off: 'A agenda não abre: mostra a tela "sem acesso". No Feegow o item Agenda nem aparece no menu.' },
  { id: 'book',  label: 'Agendar', keys: 'agenda:create',
    off: 'Sai "Agendamento" do Criar, o horário livre não reage ao clique e o botão Retorno some.' },
  { id: 'edit',  label: 'Editar', keys: 'agenda:update',
    off: 'Agendamento abre só para leitura: sem trocar status, remarcar, arrastar ou cancelar.' },
  { id: 'fitin', label: 'Encaixe', keys: 'agendamentoencaixe:create',
    off: 'Sai "Encaixe" do Criar e do painel; horário ocupado não aceita agendamento em paralelo.' },
  { id: 'block', label: 'Bloqueios', keys: 'bloqueioagenda:create/update/delete',
    off: 'Sai "Bloqueio" do Criar; bloqueios existentes abrem só para leitura.' },
];
const PERM_ALL = { view: true, book: true, edit: true, fitin: true, block: true };
const PERM_PRESETS = [
  { id: 'all',  label: 'Todas',      perms: PERM_ALL },
  { id: 'read', label: 'Só ver',     perms: { view: true, book: false, edit: false, fitin: false, block: false } },
  { id: 'none', label: 'Sem acesso', perms: { view: false, book: false, edit: false, fitin: false, block: false } },
];
const PERM_LS = 'na-perms-v1';
function permsLoad() { try { const v = JSON.parse(localStorage.getItem(PERM_LS)); if (v) return { ...PERM_ALL, ...v }; } catch (e) {} return { ...PERM_ALL }; }
function permsSave(p) { try { localStorage.setItem(PERM_LS, JSON.stringify(p)); } catch (e) {} }

// ---- Seletor na barra superior (ao lado da edição do produto) ---------------
function PermsMenu({ perms, setPerms, admin, setAdmin }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const eff = admin ? PERM_ALL : perms;
  const on = PERM_DEFS.filter(d => eff[d.id]).length;
  const restricted = on < PERM_DEFS.length;
  const preset = PERM_PRESETS.find(p => PERM_DEFS.every(d => !!p.perms[d.id] === !!perms[d.id]));
  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button onClick={() => setOpen(o => !o)} title="Simular permissões do usuário" style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, padding: '0 8px 0 9px', borderRadius: WT.pill,
        border: `1px solid ${restricted ? '#e8d27a' : WT.border}`, background: open ? WT.hover : (restricted ? '#fff6ba' : WT.inset), cursor: 'pointer', fontFamily: WT.font,
        fontSize: 12.5, fontWeight: WT.wEmph, color: restricted ? '#865200' : WT.fg2,
      }}>
        <WIcon name={admin ? 'shield-check' : 'shield'} size={14} color={restricted ? '#865200' : WT.accent} />
        {admin ? 'Admin' : `Permissões ${on}/${PERM_DEFS.length}`}
        <WIcon name={open ? 'chevron-up' : 'chevron-down'} size={14} color={WT.muted} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 36, right: 0, width: 360, background: WT.raised, borderRadius: WT.rL, border: `1px solid ${WT.border}`, boxShadow: WT.shDialog, zIndex: 60, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 110px)', overflow: 'auto' }}>
          <div style={{ padding: '12px 14px 10px', borderBottom: `1px solid ${WT.borderSub}` }}>
            <div style={{ fontSize: 10.5, fontWeight: WT.wEmph, color: WT.muted, textTransform: 'uppercase', letterSpacing: '.05em' }}>Simular permissões do usuário</div>
            <div style={{ fontSize: 12.5, color: WT.fg2, marginTop: 4, lineHeight: 1.45 }}>Desligue uma permissão e veja como a agenda se comporta. Vale só para este navegador.</div>
            <div style={{ marginTop: 10 }}>
              <WSegmented size="m" value={admin ? 'admin' : 'user'} onChange={v => setAdmin(v === 'admin')}
                options={[{ value: 'user', label: 'Usuário', icon: 'user-round' }, { value: 'admin', label: 'Admin da clínica', icon: 'shield-check' }]} />
            </div>
          </div>
          {admin && (
            <div style={{ margin: '10px 14px 0', padding: '8px 10px', borderRadius: WT.rM, background: WT.accentSoft, fontSize: 12.5, color: WT.accent, lineHeight: 1.45, display: 'flex', gap: 8 }}>
              <WIcon name="info" size={14} color={WT.accent} style={{ flex: 'none', marginTop: 2 }} />
              <span>O Admin da clínica sempre tem as 5 permissões e é o único que altera dias passados.</span>
            </div>
          )}
          <div style={{ padding: '6px 6px 4px', opacity: admin ? 0.5 : 1, pointerEvents: admin ? 'none' : 'auto' }}>
            {PERM_DEFS.map(d => {
              const v = !!eff[d.id];
              const disabledByView = d.id !== 'view' && !eff.view;
              return (
                <div key={d.id} style={{ display: 'flex', gap: 10, padding: '9px 8px', borderRadius: WT.rM, alignItems: 'flex-start' }}>
                  <span style={{ flex: 'none', marginTop: 1 }}><WToggle checked={v} onChange={nv => setPerms({ ...perms, [d.id]: nv })} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13.5, fontWeight: WT.wEmph, color: WT.fg }}>{d.label}</span>
                      <code style={{ fontSize: 11, color: WT.muted, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{d.keys}</code>
                    </div>
                    {!v && <div style={{ fontSize: 12, color: WT.fg2, marginTop: 3, lineHeight: 1.45 }}>{d.off}</div>}
                    {v && disabledByView && <div style={{ fontSize: 12, color: WT.muted, marginTop: 3, lineHeight: 1.45 }}>Sem efeito enquanto "Ver a agenda" estiver desligada.</div>}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px 12px', borderTop: `1px solid ${WT.borderSub}`, opacity: admin ? 0.5 : 1, pointerEvents: admin ? 'none' : 'auto' }}>
            <span style={{ fontSize: 12, color: WT.muted, marginRight: 2 }}>Atalhos</span>
            {PERM_PRESETS.map(p => {
              const cur = preset && preset.id === p.id;
              return (
                <button key={p.id} onClick={() => setPerms({ ...p.perms })} style={{
                  height: 26, padding: '0 10px', borderRadius: WT.pill, cursor: 'pointer', fontFamily: WT.font, fontSize: 12, fontWeight: WT.wEmph,
                  border: `1px solid ${cur ? WT.borderAccent : WT.border}`, background: cur ? WT.accentSoft : '#fff', color: cur ? WT.accent : WT.fg2,
                }}>{p.label}</button>
              );
            })}
          </div>
        </div>
      )}
    </span>
  );
}

// ---- Tela quando o usuário não tem "Ver a agenda" ---------------------------
function NoAgendaAccess() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: WT.bg }}>
      <div style={{ maxWidth: 440, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 60, height: 60, borderRadius: '50%', background: WT.inset, border: `1px solid ${WT.border}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <WIcon name="lock" size={26} color={WT.fg2} />
        </span>
        <div style={{ fontSize: 18, fontWeight: WT.wHead, color: WT.fg, marginTop: 4 }}>Você não tem acesso à agenda</div>
        <div style={{ fontSize: 14, color: WT.fg2, lineHeight: 1.55 }}>
          Seu usuário não tem a permissão <strong style={{ color: WT.fg, fontWeight: WT.wEmph }}>Ver a agenda</strong>. Peça ao administrador da clínica para liberar no seu perfil.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PERM_DEFS, PERM_ALL, PERM_PRESETS, permsLoad, permsSave, PermsMenu, NoAgendaAccess });
