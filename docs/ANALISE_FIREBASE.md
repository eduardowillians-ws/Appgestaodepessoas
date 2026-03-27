# Documento de Análise — Integração Firebase

## ETAPA 1 — ANÁLISE DO SISTEMA ATUAL

---

### 1.1 STATUS DE TAREFAS

O sistema usa 4 statuses definidos em `lib/types.ts:2`:

```typescript
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
```

**Funcionamento:**

| Status | Descrição | Gatilho |
|--------|-----------|----------|
| `pending` | Nova tarefa, não iniciada | Criação automática |
| `in_progress` |	Tarefa em execução |	Manual via menu |
| `completed` |	Tarefa finalizada |	Manual via menu |
| `overdue` |	Atrasada (automático) |	Data de vencimento < data atual |

**Lógica de overdue** (`store.tsx:154-182`):
- Verificação a cada 60 segundos
- Se `dueDate < now` e status não é `completed` → muda para `overdue`
- Aplica penalidade: -0.5 no `performanceScore` do usuário atribuído

**Interface visual** (`tasks/page.tsx:83-108`):
- `pending`: Círculo cinza
- `in_progress`: Refresh amarelo
- `completed`: Check verde
- `overdue`: Alerta vermelho

---

### 1.2 MÉTRICAS DO SISTEMA

#### Dashboard (page.tsx)

| Métrica | Cálculo | Local |
|---------|---------|-------|
| **Tarefas Concluídas** | `filteredTasks.filter(t => t.status === 'completed').length` | 68-70 |
| **Tarefas Atrasadas** | `filteredTasks.filter(t => t.status === 'overdue').length` | 72-74 |
| **Score Médio** | `completedTasks.reduce(...) / completedTasksFiltered.length` | 79-86 |
| **Top Performer** | `users.sort((a,b) => b.performanceScore - a.performanceScore)[0]` | 88-91 |
| **Crescimento de Membros** | `((totalNow - membersAtStart) / membersAtStart) * 100` | 122-137 |
| **% Andamento** | `(inProgressTasks / totalTasks) * 100` | 102-106 |
| **% Concluídas** | `(completedTasks / totalTasks) * 100` | 107 |

#### Equipe (team/page.tsx:59-96)

| Métrica | Cálculo |
|---------|---------|
| **Avg Score** | `users.reduce((acc, u) => acc + u.performanceScore, 0) / users.length` |
| **Produtividade** | `((tarefasMesAtual - tarefasMesAnterior) / tarefasMesAnterior) * 100` |
| **Qualidade** | Média de `performanceScore` dos usuários |
| **Percentual** | `quality * 10` (máximo 100) |

#### Matriz de Competências (matrix/page.tsx:18-33)

| Métrica | Cálculo |
|---------|---------|
| **Team Health** | `(pontosAtuais / pontosMáximos) * 100` onde níveis são: not_trained=0, in_training=1, competent=2, expert=3 |
| **At-Risk Skills** | `< 1 expert E < 2 competent` = skill em risco |

---

### 1.3 CÁLCULO DE XP E LEVEL

**Estrutura do usuário** (`lib/types.ts:12-25`):

```typescript
export interface User {
  points: number;        // XP total acumulado
  level: number;        // Nível atual
  xpToNextLevel: number; // XP necessário para próximo nível
}
```

**Lógica de ganhos de XP** (`store.tsx:216-232`):

```typescript
const addUserPoints = (userId: string, pointsToAdd: number) => {
  const newPoints = u.points + pointsToAdd;
  const xpNeeded = 100 * u.level;
  const newXp = u.xpToNextLevel - pointsToAdd;
  
  if (newXp <= 0) {
    // Level UP!
    level: u.level + 1,
    xpToNextLevel: 100 * (u.level + 1) - Math.abs(newXp),
  }
};
```

**Ganhos de XP por ação:**

| Ação | XP | Local |
|------|-----|-------|
| Completar tarefa | +1.0 | `store.tsx:312` |
| Tornar-se expert em skill | +5.0 | `store.tsx:267` |
| Tarefa atrasada | -0.5 | `store.tsx:316` |

**Fórmula de level up:**
- XP necessário para nível N = `100 * N`
- Exemplo: para nível 2 = 200 XP, nível 3 = 300 XP

---

### 1.4 HABILIDADES (SKILLS)

**Estrutura** (`lib/types.ts:27-40`):

```typescript
export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  level: SkillLevel;
  lastUpdated: string;
}

export type SkillLevel = 'not_trained' | 'in_training' | 'competent' | 'expert';
```

**Níveis** (`matrix/page.tsx:9-16`):

| Level | Peso | Label | Badge |
|-------|------|-------|-------|
| `not_trained` | 0 | N/A | Cinza tracejado |
| `in_training` | 1 | Treinando | Amarelo |
| `competent` | 2 | Competente | Azul |
| `expert` | 3 | Especialista | Verde |

**Usos das habilidades:**

1. **Matriz de Competências** — Clique na célula para ciclar níveis
2. **Requisitos de tarefa** — `Task.requiredSkills: string[]`
3. **Sugestão de membros** — Skills necessárias para filtrar quem pode executar
4. **Team Health** — Média ponderada de todos os níveis

**Integração com XP:**
- Ao atingir nível `expert`: +5.0 XP (`store.tsx:266-268`)

---

### 1.5 ESTRUTURA DE MEMBROS

**Interface User** (`lib/types.ts:12-25`):

```typescript
export interface User {
  id: string;
  name: string;
  role: string;           // String (não ID de Role)
  status: UserStatus;     // 'active' | 'inactive' | 'busy'
  performanceScore: number; // 0-10
  tags: string[];
  notes: string;
  createdAt: string;
  avatar: string;
  // Gamificação
  points: number;
  level: number;
  xpToNextLevel: number;
}
```

**Status de membro** (`lib/types.ts:4`):

```typescript
export type UserStatus = 'active' | 'inactive' | 'busy';
```

- `active`: Verde
- `busy`: Amarelo
- `inactive`: Cinza

**Relacionamentos:**

- `User` → `Role` (many-to-one, por string role)
- `UserSkill` → `User` (many-to-one)
- `Task` → `User` (many-to-one, opcional via assignedUserId)
- `Goal` → `User` (many-to-one, opcional via targetMemberId)

---

## ETAPA 2 — MODELAGEM DE DADOS FIREBASE

### 2.1 ESTRUTURA DE COLEÇÕES

Proposta baseada na análise das interfaces existentes:

```
firestore/
├── users/ (collection)
│   └── {userId} (document)
│       ├── id: string
│       ├── name: string
│       ├── role: string
│       ├── status: "active" | "inactive" | "busy"
│       ├── performanceScore: number
│       ├── tags: string[]
│       ├── notes: string
│       ├── createdAt: timestamp
│       ├── avatar: string
│       ├── points: number
│       ├── level: number
│       └── xpToNextLevel: number
│
├── roles/ (collection)
│   └── {roleId} (document)
│       ├── id: string
│       ├── name: string
│       └── createdAt: timestamp
│
├── skills/ (collection)
│   └── {skillId} (document)
│       ├── id: string
│       ├── name: string
│       ├── description: string
│       └── category: string
│
├── userSkills/ (collection)
│   └── {userSkillId} (document)
│       ├── id: string
│       ├── userId: string (ref)
│       ├── skillId: string (ref)
│       ├── level: "not_trained" | "in_training" | "competent" | "expert"
│       └── lastUpdated: timestamp
│
├── tasks/ (collection)
│   └── {taskId} (document)
│       ├── id: string
│       ├── title: string
│       ├── description: string
│       ├── assignedUserId: string | null
│       ├── requiredSkills: string[]
│       ├── status: "pending" | "in_progress" | "completed" | "overdue"
│       ├── priority: "low" | "medium" | "high"
│       ├── dueDate: timestamp
│       ├── createdAt: timestamp
│       ├── completedAt: timestamp | null
│       ├── rating: number | null
│       ├── archived: boolean
│       └── archivedAt: timestamp | null
│
├── trainings/ (collection)
│   └── {trainingId} (document)
│       ├── id: string
│       ├── title: string
│       ├── description: string
│       ├── instructor: string
│       ├── date: timestamp
│       ├── duration: number
│       ├── type: "technical" | "soft" | "workshop"
│       └── category: string | null
│
└── goals/ (collection)
    └── {goalId} (document)
        ├── id: string
        ├── name: string
        ├── type: "task" | "skill" | "general"
        ├── scope: "team" | "individual"
        ├── targetMemberId: string | null
        ├── targetMembers: string[] | null
        ├── criteria: "complete_tasks" | "gain_skill" | "points"
        ├── targetValue: number
        ├── createdAt: timestamp
        ├── archived: boolean
        ├── archivedAt: timestamp | null
        └── archivedProgress: number | null
```

### 2.2 OBSERVAÇÕES IMPORTANTES

1. **Role é string** — O sistema atual armazena `role` como string diretamente no User. Recomenda-se normalizar para usar roleId, mas isso requer refatoração.

2. **Timestamps** — Todos os campos de data devem ser convertidos de ISO string para Timestamp do Firebase.

3. **Índices recomendados:**
   - `tasks` → `status`, `assignedUserId`
   - `userSkills` → `userId`, `skillId` (composto único)
   - `tasks` → `createdAt` para ordenação

---

## ETAPA 3 — MAPEAMENTO FRONT → FIREBASE

### 3.1 LEITURA DE DADOS

| Dado | Origem Atual | Destino Firebase | Estratégia |
|------|-------------|------------------|-------------|
| Usuários | `store.users` (localStorage) | `users/` collection | Carregar todos no init |
| Roles | `store.roles` | `roles/` collection | Carregar todos |
| Skills | `store.skills` | `skills/` collection | Carregar todos |
| UserSkills | `store.userSkills` | `userSkills/` collection | Carregar todos |
| Tarefas | `store.tasks` | `tasks/` collection | Query por status + data |
| Treinamentos | `store.trainings` | `trainings/` collection | Carregar todos |
| Metas | `store.goals` | `goals/` collection | Carregar todos |

### 3.2 ESCRITA DE DADOS

| Ação | Função Store | Operação Firebase |
|------|--------------|-------------------|
| Criar usuário | `addUser()` | `add(doc(users))` |
| Atualizar usuário | `updateUser()` | `update(doc(users, id))` |
| Deletar usuário | `deleteUser()` | `delete(doc(users, id))` |
| Adicionar XP | `addUserPoints()` | `update(doc(users, id))` |
| Criar tarefa | `addTask()` | `add(doc(tasks))` |
| Atualizar status | `updateTaskStatus()` | `update(doc(tasks, id))` |
| Atualizar skill | `updateUserSkill()` | `upsert userSkills` |
| Criar skill | `addSkill()` | `add(doc(skills))` |

### 3.3 CONVERSSÃO DE DADOS

```typescript
// ISO String → Firebase Timestamp
const toTimestamp = (iso: string) => firebase.firestore.Timestamp.fromDate(new Date(iso));

// Firebase Timestamp → ISO String
const toISO = (ts: Timestamp) => ts.toDate().toISOString();
```

---

## ETAPA 4 — PLANO DE INTEGRAÇÃO

### FASE 1: Conexão e Leitura Básica
**Objetivo:** Conectar Firebase sem quebrar funcionalidades existentes

1. Configurar Firebase SDK no projeto
2. Criar hook `useFirebase` com:
   - `initialize()`
   - `subscribeCollection(collection, callback)`
3. Modificar store para ter modo "demo" (localStorage) vs "production" (Firebase)
4. Ler dados do Firebase mas usar localStorage como fonte de verdade
5. Validar estrutura de dados

**Critério de sucesso:** App carrega dados do Firebase sem erros

---

### FASE 2: Escrita de Membros
**Objetivo:** CRUD completo de usuários

1. Implementar `addUser` → Firebase
2. Implementar `updateUser` → Firebase
3. Implementar `deleteUser` → Firebase
4. Sincronizar bidirecional (Firebase → localStorage para mudanças de outros dispositivos)

**Critério de sucesso:** Criar/editar/deletar membros refletido no Firebase

---

### FASE 3: Escrita de Tarefas
**Objetivo:** CRUD completo de tarefas

1. Implementar `addTask` → Firebase
2. Implementar `updateTask`, `updateTaskStatus` → Firebase
3. Implementar `deleteTask`, `archiveTask` → Firebase
4. Lógica de overdue deve ser feita no servidor (Cloud Function) ou cliente

**Critério de sucesso:** Tarefas sincronizadas em tempo real

---

### FASE 4: Integração de Skills
**Objetivo:** Matriz de competências funcional

1. CRUD de skills → Firebase
2. CRUD de userSkills → Firebase
3. Recalcular Team Health baseado em dados Firebase

**Critério de sucesso:** Matriz atualiza em tempo real

---

### FASE 5: Dashboard em Tempo Real
**Objetivo:** Métricas calculadas a partir do Firebase

1. Queries agregadas no Firebase ou client
2. Métricas reativas a mudanças
3. Top performers, team health atualizados

**Critério de sucesso:** Dashboard reflete dados em tempo real

---

### FASE 6: Relatórios e Trainings
**Objetivo:** Funcionalidades restantes

1. Trainings → Firebase
2. Goals → Firebase
3. Relatórios (Nexus/PDF) → Usar dados Firebase
4. Calendário → Usar dados Firebase

**Critério de sucesso:** Todas as funcionalidades integradas

---

## ETAPA 5 — IDENTIFICAÇÃO DE RISCOS

### 5.1 RISCOS CRÍTICOS

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| **Perda de dados na migração** | Alto | Fazer backup do localStorage antes; migrar dados manualmente |
| **Latência em queries grandes** | Alto | Usar paginação + limit (50-100 docs) |
| **Conflicts de escrita** | Alto | Usar transações para operações atômicas |
| **Estrutura de role como string** | Médio | Refatorar para usar roleId ( Breaking Change) |

### 5.2 RISCOS MÉDIOS

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| **Custos do Firebase** | Médio | Configurar limites de billing; usar Spark (free) tier |
| **Offline-first** | Médio | Implementar Firebase offline persistence |
| **性能 de dashboard** | Médio | Cachear métricas calculadas |

### 5.3 PONTOS DE DEPENDÊNCIA

```
Dashboard → Tasks → Users → Skills → UserSkills
                ↓
           Goals, Trainings, Reports
```

Ordem de dependência para integração:
1. Users (base)
2. Skills (base)
3. Tasks (depende de Users + Skills)
4. Trainings (independente)
5. Goals (depende de Users)
6. Reports (depende de tudo)

### 5.4 PARTES CRÍTICAS

1. **Dashboard** — Mais complexo, depende de agregações
2. **Store** — Toda lógica de negócio concentrada aqui
3. **Matriz de Competências** — MUITAS queries (user × skill)
4. **Tarefas com overdue** — Requer verificação em tempo real

---

## RECOMENDAÇÕES FINAIS

1. **Não remover localStorage** — Manter como fallback/offline cache
2. **Usar Firebase Auth** — Se não houver, considerar Anonymous Auth para identificar dispositivos
3. **Cloud Functions** — Paraoverdue automático e agregações complexas
4. **Firestore Emulator** — Testar integração localmente antes de production
5. **Migrations** — Criar script de migração único para dados existentes

---

*Documento gerado automaticamente pela análise do código fonte em 26/03/2026*
