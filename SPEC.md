# SPEC.md — Nova Agenda Feegow (protótipo)

> **Documento mestre** do que foi construído neste projeto + as **regras originais** que orientaram o trabalho.
> Protótipo clicável da Nova Agenda do **Feegow**, no design system **Watson** (DocPlanner).
> Arquivo principal: **`New Agenda.html`** · código em `src/*.jsx` (React via Babel, sem build).

---

## Índice
1. [Visão geral & objetivo](#1-visão-geral--objetivo)
2. [Regras originais (briefs fornecidos)](#2-regras-originais-briefs-fornecidos)
3. [Arquitetura do protótipo](#3-arquitetura-do-protótipo)
4. [Design system aplicado (Watson)](#4-design-system-aplicado-watson)
5. [Modelo de dados (mock)](#5-modelo-de-dados-mock)
6. [Funcionalidades construídas](#6-funcionalidades-construídas)
7. [Mapeamento Must (M1–M7) → implementação](#7-mapeamento-must-m1m7--implementação)
8. [Critérios de aceite → status](#8-critérios-de-aceite--status)
9. [Tweaks (variações ajustáveis)](#9-tweaks-variações-ajustáveis)
10. [Pendências & próximos passos](#10-pendências--próximos-passos)

---

## 1. Visão geral & objetivo

A Agenda é a superfície de maior tráfego do Feegow e a principal dor de usabilidade do back-office. O protótipo valida a **Fase 1 (Views + Paridade)** com foco em tornar a operação **rápida, legível e confiável**, reduzindo o **Booking Abandon Rate (meta 20% → 10%)** sem regressão de volume.

- **Persona primária:** operador de recepção / back-office.
- **Inspiração de UX:** Google Calendar para *views*, *troca de view* e *criação de agendamento* — mas com a estética calma e teal do Watson.
- **Não-negociável:** o formulário de agendamento **nunca apaga campos preenchidos** em erro de validação (AC-1).
- **Natureza:** protótipo de validação client-side (sem backend), dados brasileiros realistas.

---

## 2. Regras originais (briefs fornecidos)

Esta seção preserva as regras que orientaram o build. Vêm de dois documentos anexados:
`uploads/Spec.md` (brief da Nova Agenda) e `uploads/SPEC-Bloqueio-Agenda.md` (regras de bloqueio).

### 2.1 Escopo (do brief Spec.md)

**IN scope:**
- **M1** — Visão **Diária** redesenhada (clareza & densidade).
- **M2** — Visão **Semanal multi-profissional** (colunas por profissional) — mata o workaround de impressão.
- **M3** — **Cores automáticas + blocos dimensionados por duração** (retorno de 15min ≠ procedimento de 1h).
- **M4** — **Status do paciente na timeline** (aguardando / em atendimento / finalizado).
- **M5** — **Navegação de data visual** (mini-calendário estilo Google/Apple + ‹ Hoje ›).
- **M6** — **Card de contexto** (hover/clique: paciente, procedimento, preço real, profissional, status — sem abrir o registro completo).
- **M7** — **Troca rápida de view** Dia / Semana / Mês, com as mesmas ações em todas.
- **Operações de paridade:** novo agendamento, remarcar (pick-a-slot **e** arrastar), **encaixe**, bloqueio, cancelar/excluir **com motivo (clínica vs paciente)**, check-in, views **Múltipla** e **Equipamentos**, filtros ricos (profissional, especialidade, convênio, sala/unidade).
- **Drawer de agendamento** (criar/editar) com validação **sem perda de dados**.

**OUT of scope:** app mobile nativo, sync com Google Calendar, módulo cirúrgico, telas de *criação* de grade/Working-Hours, billing/EHR. (No máximo como affordances desabilitadas / "Fase 2".)

### 2.2 Regras-chave do brief

- **Velocidade primeiro:** UI otimista, ações instantâneas, mínimo de modais, navegável por teclado.
- **Cor de tipo ≠ status:** o **tipo de agendamento** (M3) é uma dimensão automática (barra lateral/tint), separada do **status** (chip/ícone). Devem ser visualmente distintos.
- **Free vs ocupado óbvio:** slots vazios são linhas clicáveis ("+").
- **Responsivo obrigatório:** funciona de desktop a telefone; validar em 375 / 768 / 1280px; alvos de toque ≥44px; nada crítico só em hover.
- **Produto é "Feegow"** — nunca "FIGO".
- **Português brasileiro** em toda a UI; sentence case; sem emoji.

### 2.3 Modelo de dados de agendamento (brief §10)

**Mínimo sempre obrigatório para criar:** paciente, procedimento (define duração+cor+valor), data, horário, local/unidade, valor, base de pagamento (`plano` bool → se sim, convênio; se não, particular/tabela) e **contato** (telefone **ou** e-mail). **CPF não é obrigatório por padrão.**

**Campos obrigatórios configuráveis (Outras Configurações → Campos Obrigatórios):** a clínica define por grupo (**Paciente** e **Agendamento**) quais campos são **obrigatórios** (`Obrigar`) e quais **extras** são **exibidos** (`Exibir`). O formulário lê um objeto `requiredFieldsConfig` e renderiza/exige dinamicamente. Campos de paciente disponíveis: Nascimento, Sexo, Profissão, Documento(RG), Origem, Email1, CPF, Pendências, IndicadoPor, IndicadoPorSelecao, Matricula1, NomeSocial, Cel1, Tel1, Tabela.

### 2.4 Mapeamento de status (canônico, brief §4.1)

| Status (PT) | Label | Significado | Cor |
|---|---|---|---|
| `marcado` | Marcado | Reservado, não confirmado | neutro `#565f5f` |
| `confirmado` | Confirmado | Paciente confirmou | info/azul `#1f6fb0` |
| `aguardando` | Aguardando | Check-in feito, sala de espera | âmbar `#9a6700` |
| `em_atendimento` | Em atendimento | Sendo atendido | teal `#006a59` |
| `finalizado` | Finalizado | Encontro encerrado | sucesso `#176d00` |
| `faltou` | Faltou | Não compareceu | danger `#b42318` |
| `cancelado` | Cancelado | Cancelado (clínica/paciente) | muted, tachado `#888f8f` |

### 2.5 Regras de Bloqueio (do brief SPEC-Bloqueio-Agenda.md)

Um **bloqueio** reserva um período onde **não se pode agendar** (almoço, férias, cirurgia, reunião, feriado). Não é agendamento de paciente.

**Tipos & editabilidade:**
| Tipo | Nasce de | Editável/Removível? |
|---|---|---|
| **Manual** | Usuário cria na agenda | Sim |
| **Intervalo de grade** | Grade/Working Hours | **Não** (gerencia-se na grade) |
| **Feriado** | Feriado com `BloquearAgenda` | Edita **com confirmação** |
| **Herdado da matriz** | Multi-licença | **Não** (read-only na filial) |

**Escopo:** profissional único · multi/clínica · equipamento (ProfissionalID negativo).

**Campos:** DataDe/DataA, HoraDe/HoraA, dia inteiro, recorrência por dia da semana (só dentro do range), título/motivo, descrição, unidades.

**Criação — obrigatórios:** datas, horas e **≥1 unidade**. **Validações:** `HoraDe < HoraA`, `DataDe ≤ DataA`.

**Regra-chave de conflito:** criar bloqueio **não apaga agendamentos** existentes na janela — eles coexistem; só remove SMS/e-mail pendentes da fila.

**Edição/Remoção:** não dá para editar uma **ocorrência** de recorrente (edita série inteira); remoção é hard delete; ao remover, horários voltam a ficar disponíveis.

**Bug conhecido a resolver na Nova Agenda:** "+1 minuto" — contagem usa `HoraA - 00:01`, podendo gerar slot livre de 1 min ao fim do bloqueio.

---

## 3. Arquitetura do protótipo

`New Agenda.html` carrega React 18 + Babel standalone + Lucide (ícones, substituindo `@docplanner/iconography`) e em seguida os módulos JSX na ordem:

| Arquivo | Responsabilidade |
|---|---|
| `src/tokens.jsx` | Tokens Watson (`WT`), `STATUS`, `TYPES`, helpers de tempo/moeda, nomes PT de dias/meses. |
| `src/data.jsx` | Mock: profissionais, equipamentos, salas, **grades de disponibilidade**, procedimentos, pacientes, agendamentos, bloqueios, configs de campos obrigatórios. |
| `src/primitives.jsx` | Componentes Watson (`WButton`, `WBadge`, `WSelect`, `WInput`, `WToggle`, `WPopover`, `WAvatar`, `WIcon`, `WSegmented`, `MiniCalendar`…). |
| `src/shell.jsx` | Navbar, Sidebar, utilidades de data (`dateUtil`). |
| `src/toolbar.jsx` | SubNavbar: toggle de view, navegação de data + mini-calendário, filtros, + Novo. |
| `src/card.jsx` | Card de agendamento (3 estilos), bloco, intervalo de grade, free-slot, ghost-slot, **card de contexto (M6)**. |
| `src/views.jsx` | Grade de colunas compartilhada → Dia · Semana · Múltipla · Equipamentos · Mês; ocupação; lógica de grade/livre. |
| `src/booking.jsx` | Fluxo Google-Calendar de 2 níveis: quick-create → formulário completo (config-driven, sem perda de dados). |
| `src/ops.jsx` | Cancelar, Bloqueio, Remarcar, Sala de espera. |
| `src/tweaks-panel.jsx` | Painel de Tweaks (variações ajustáveis). |
| `src/app.jsx` | Máquina de estado + wiring de tudo. |

Estado central em `App` (`src/app.jsx`): view ativa, data, recursos selecionados, filtros, e overlays (context-card, quick-create, booking, cancel, block, reschedule, toast). Largura < 860px ativa o modo **compact** (toggle vira dropdown, drawer vira sheet).

**"Hoje" fixo do protótipo:** quinta, 18 jun 2026; "agora" fixo às 10:42.

---

## 4. Design system aplicado (Watson)

Tema `customer / web / light`. Tokens inlinados em `src/tokens.jsx` (objeto `WT`):

- **Accent teal:** fg `#006a59`, fill `#007c68`, soft `#dff9f2`, borda/foco `#00a085`.
- **Neutros:** página `#f7f8f8`, cards `#ffffff`, inset `#f3f5f5`, texto `#242727`/`#565f5f`/`#888f8f`.
- **Tipografia:** InterVariable; pesos 450/550/600/700; corpo 14px.
- **Raio:** 4/8/16/24/pill. **Espaço:** 4/8/16/32/64. **Alturas de controle:** 32 desktop / 44 touch.
- **Sombras:** três stacks em camadas (emphasis / popout / dialog).
- **Marca Feegow:** logo primário no navbar; sem gradientes na UI (gradiente reservado à marca/AI).
- **TYPE colors (M3):** Consulta=azul, Retorno=teal, Exame=roxo, Procedimento=magenta, Telemedicina=ciano.

---

## 5. Modelo de dados (mock)

- **5 profissionais** com especialidade, sala e cor própria (R. Alves/Dermato, B. Tavares/Orto, C. Souza/Cardio, F. Moreira/Clínico, P. Lima/Pediatria).
- **3 equipamentos** (Ultrassom, ECG, Sala de Procedimentos) e **7 salas/consultórios** — todos selecionáveis como colunas de primeira classe.
- **Grades de disponibilidade** (`GRADES`): por dia da semana, com turnos coloridos, intervalo padrão (→ duração default), intervalos (almoço) e limites de procedimentos/convênios por bloco. Slots fora da grade aparecem hachurados (indisponíveis).
- **12 procedimentos** que dirigem duração, cor de tipo e preço base.
- **16 pacientes** brasileiros, alguns com `firstVisit` (1ª vez) e `priority` (cardíaco, criança de colo, idoso…).
- **~40+ agendamentos** num dia realista: todos os status, durações 10/15/20/30/40/45/60min, encaixes, **multi-procedimento num só agendamento**, bookings de equipamento.
- **5 bloqueios** seed cobrindo os tipos do spec: manual, recorrente (ter/qui), e feriado (clínica inteira, dia inteiro).
- **3 presets de campos obrigatórios** (Clínica Padrão, Exigente, Operadora/Convênio).

---

## 6. Funcionalidades construídas

### Shell & navegação
- Navbar (logo Feegow, seletor de unidade, busca, notificações, avatar) + Sidebar (Agenda ativa) + SubNavbar.
- Toggle de view **Dia · Semana · Mês · Equipamentos** (segmented no desktop, dropdown no compact).
- Navegação ‹ Hoje › + setas + **mini-calendário** com tokens de calendário Watson (ring de hoje, selecionado).
- Filtros: profissional (multi), especialidade, convênio, sala/unidade + toggle "Somente horários livres".

### Views
- **Dia** — multi-recurso: profissionais + equipamentos + salas em colunas, via `ResourceBar` (Adicionar recurso). Cards dimensionados por duração, gridlines de hora/meia-hora, indicador de "agora", faixas de grade coloridas, intervalos e bloqueios.
- **Semana** — mesma seleção de recursos do Dia, colunas = dias; mostra grade do profissional (1 recurso) ou cobertura unificada (vários); ocultar fim de semana.
- **Mês** — grid com contagem + barra de ocupação por dia; clique navega para o Dia.
- **Equipamentos** — equipamentos como colunas de primeira classe.
- (`MultipleView` também existe no código como visão multi-recurso lado a lado.)

### Cards & contexto
- **3 estilos de card** (Tweak): `typebar` (barra de status), `filled` (fundo do profissional), `statusbar` (barra superior de status). Fundo identifica o profissional; status via barra lateral + ícone.
- Sinalizadores: 1ª vez, encaixe, prioridade do paciente.
- Cards de conflito (sobre bloqueio) destacados em vermelho.
- **Card de contexto (M6):** popover com paciente, status, tipo, procedimentos, horário/duração, profissional, convênio, preço real, observação, motivo de cancelamento + ações rápidas (Check-in · Remarcar · Cancelar · Abrir).

### Criação de agendamento (Google-Calendar, 2 níveis)
- **Tier 1 — Quick-create popover:** clica slot → popover ancorado, pré-preenchido com profissional/data/hora; paciente (autocomplete + novo), multi-procedimento limitado pela grade, pagamento particular/convênio, "Mais opções".
- **Tier 2 — Formulário completo:** drawer (desktop) / sheet (mobile) / modal (Tweak). Seções Paciente / Atendimento / Pagamento / Origem & observações.
- **Campos obrigatórios dinâmicos:** lê o preset da clínica e renderiza/exige campos de paciente + exibe extras.
- **AC-1 — sem perda de dados:** erro de validação mostra banner + erros inline e **mantém todos os campos**.
- Salvar · Salvar e check-in.

### Operações
- **Remarcar:** por **arrastar** o card (com indicador de drop válido/inválido e "Desfazer") **e** por modal pick-a-slot.
- **Encaixe:** cria card sobreposto com marcador tracejado.
- **Bloqueio:** modal completo conforme o spec — escopo (profissional/vários/clínica/equipamento), datas, dia inteiro, recorrência por dia da semana, unidades, motivo. Respeita editabilidade por tipo (grade/herdado read-only, feriado com confirmação), avisa sobre agendamentos na janela (sem apagar), valida hora/data/unidade.
- **Cancelar:** modal clínica vs paciente + justificativa obrigatória; card fica tachado/muted e libera o horário.
- **Check-in:** marcado/confirmado → aguardando.
- **Sala de espera:** painel com tempo de espera decorrido (componente em `ops.jsx`).

### Feedback
- Toast com ações (ex.: Desfazer remarcação).

---

## 7. Mapeamento Must (M1–M7) → implementação

| Must | Onde |
|---|---|
| **M1** Diária redesenhada | `DayView` + `ColumnGrid`/`ColumnTrack` (`views.jsx`), cards em `card.jsx` |
| **M2** Semanal multi-pro | `WeekView` (`views.jsx`) com `ResourceBar` |
| **M3** Cor automática + duração | `TYPES` (`tokens.jsx`); altura ∝ duração e barra de tipo em `AppointmentCard` |
| **M4** Status na timeline | `STATUS` + ícone/cor de status no card |
| **M5** Navegação visual de data | `MiniCalendar` + toolbar (`toolbar.jsx`) |
| **M6** Card de contexto | `ContextCard` (`card.jsx`) |
| **M7** Troca rápida de view | `WSegmented` na toolbar; mesmas ações em todas as views |

---

## 8. Critérios de aceite → status

| AC | Descrição | Status |
|---|---|---|
| AC-1 | Booking nunca limpa dados em erro de validação | ✅ |
| AC-2 | Todas as views com mesma linguagem de card e mesmas ações | ✅ |
| AC-3 | Cards visivelmente por duração + cor de tipo + chip de status distintos | ✅ |
| AC-4 | Status legível na timeline sem abrir o agendamento | ✅ |
| AC-5 | Navegação por mini-calendário + Hoje atualiza a view | ✅ |
| AC-6 | Remarcar por arrastar E pick-a-slot; cancelar captura clínica-vs-paciente + motivo | ✅ |
| AC-7 | Semana legível com ocupação % por profissional | ✅ (ocupação por coluna nos headers) |
| AC-8 | Visual alinhado aos tokens Watson | ✅ |
| AC-9 | Responsivo 375/768/1280, toggle→dropdown, drawer→sheet | ✅ (modo compact < 860px) |
| AC-10 | Mínimo obrigatório + `requiredFieldsConfig` por clínica | ✅ (3 presets) |

> Observação: **swipe** lateral para trocar dia/semana e bottom-sheets de filtro no mobile (brief §11) estão parcialmente cobertos — ver pendências.

---

## 9. Tweaks (variações ajustáveis)

Painel "Ajustes do protótipo" (`app.jsx` + `tweaks-panel.jsx`):

| Tweak | Opções |
|---|---|
| **Estilo do card** | Barra (typebar) · Preench. (filled) · Status (statusbar) |
| **Densidade** | Compacto · Normal · Amplo |
| **Faixa horária** | 07–20 · 08–18 |
| **Cor de destaque** | Teal · Azul · Violeta |
| **Fluxo de criação** | Rápido → formulário · Drawer direto · Modal central |
| **Campos obrigatórios** | Clínica Padrão · Exigente · Operadora/Convênio |

---

## 10. Pendências & próximos passos

- **Mobile gestures:** swipe esquerda/direita para trocar dia/semana; filtros em bottom-sheet; mini-calendário como faixa de mês deslizável.
- **Bug "+1 minuto" de bloqueio:** garantir comportamento previsível idêntico entre Feegow e Doctoralia (resolver na Nova Agenda).
- **Decisão de métrica de sucesso:** North-Star Abandon Rate (20→10) vs View-to-Booking Conversion.
- **Edição de bloqueio recorrente por ocorrência:** hoje edita a série inteira (igual ao legado) — avaliar UX de "esta ocorrência / toda a série".
- **Itens de Fase 6 (fora deste protótipo):** controles de autonomia/consentimento, sync bidirecional, status configuráveis.

---

*Fontes das regras: `uploads/Spec.md` e `uploads/SPEC-Bloqueio-Agenda.md`. Implementação: `New Agenda.html` + `src/*.jsx`.*
