/* Regras de agendamento: datas passadas, transições de status, status finais */
const ST_CODE = { marcado: 1, confirmado: 7, aguardando: 4, em_atendimento: 2, finalizado: 3, faltou: 6, remarcado: 15, cancelado: 22 };
const ST_FUTURE_OK = ['marcado', 'confirmado', 'cancelado'];
const ST_FINAL_LOCK = ['cancelado', 'remarcado'];
const ST_AGESTAFIN = ['em_atendimento', 'finalizado', 'aguardando', 'faltou'];
const ruleUser = () => window.__user || { admin: false, agestafin: true };
const isPastDate = iso => !!iso && iso < TODAY;
const isFutureDate = iso => !!iso && iso > TODAY;
const _stl = k => (STATUS[k] || {}).label || k;
const _fd = iso => dateUtil.fmtShortDate(iso);

function apptLockedWhy(a) {
  if (!a) return null;
  if (a.deleted) return 'Agendamentos excluídos não podem ser alterados.';
  if (ST_FINAL_LOCK.includes(a.status)) return `“${_stl(a.status)}” é um status final: o agendamento não aceita troca de status nem edição. Para atender o paciente novamente, crie um novo agendamento vinculado a este.`;
  return null;
}
// datas passadas: só Admin, com confirmação. Checa data original e de destino.
function rulePast(dates, verb) {
  const past = [...new Set(dates.filter(isPastDate))];
  if (!past.length) return { ok: true };
  const when = past.map(_fd).join(' e ');
  if (!ruleUser().admin) return { title: 'Data passada', block: `Somente administradores podem ${verb} agendamentos em datas passadas (${when}).` };
  return { title: 'Alteração em data passada', confirm: `Você vai ${verb} um agendamento em data passada (${when}). Como administrador, confirme para salvar.` };
}
function ruleEdit(a, targetDate, verb = 'editar') {
  const l = apptLockedWhy(a);
  if (l) return { title: 'Agendamento encerrado', block: l };
  return rulePast([a.date, targetDate || a.date], verb);
}
function ruleStatus(a, to) {
  const from = a.status;
  if (from === to) return { ok: true };
  const l = apptLockedWhy(a);
  if (l) return { title: 'Agendamento encerrado', block: l };
  if (to === 'remarcado') return { title: 'Use “Remarcar”', block: 'O status Remarcado é aplicado ao escolher um novo horário pela ação Remarcar.' };
  if (isFutureDate(a.date) && !ST_FUTURE_OK.includes(to)) return { title: 'Status indisponível', block: `Agendamentos em datas futuras aceitam apenas Marcado, Confirmado ou Cancelado. “${_stl(to)}” fica disponível no dia do atendimento.` };
  if (from === 'finalizado' && !['aguardando', 'em_atendimento'].includes(to)) return { title: 'Status indisponível', block: 'Um atendimento finalizado só pode voltar para Aguardando ou Em atendimento.' };
  if (from === 'em_atendimento' && ['cancelado', 'faltou'].includes(to)) return { title: 'Status indisponível', block: 'Um paciente em atendimento não pode ser marcado como Cancelado ou Faltou.' };
  if (from === 'faltou' && to === 'finalizado' && a.date !== TODAY) return { title: 'Status indisponível', block: 'Faltou → Finalizado só é permitido no mesmo dia do atendimento.' };
  if ((ST_AGESTAFIN.includes(from) || ST_AGESTAFIN.includes(to)) && !ruleUser().agestafin) return { title: 'Sem permissão', block: 'Você não tem permissão para alterar status de ou para Aguardando, Em atendimento, Finalizado ou Faltou.' };
  return rulePast([a.date], 'alterar o status de');
}
const ruleStatusWhy = (a, to) => { const r = ruleStatus(a, to); return r.block || null; };
const ruleNoDrag = a => !!(apptLockedWhy(a) || (isPastDate(a.date) && !ruleUser().admin));

Object.assign(window, { ST_CODE, ruleUser, isPastDate, isFutureDate, apptLockedWhy, rulePast, ruleEdit, ruleStatus, ruleStatusWhy, ruleNoDrag });
