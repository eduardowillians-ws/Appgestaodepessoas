# Análise do Sistema - Nexus People Management

## 1. STATUS DE TAREFAS

### Tipos Definidos (lib/types.ts:2)
```typescript
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue'
```

### Como Funciona
- **Pendente (pending)**: Tarefa criada, aguardando início
- **Em Andamento (in_progress)**: Tarefa foi iniciada
- **Concluída (completed)**: Tarefa finalizada
- **Atrasada (overdue)**: Automático quando `dueDate < now` e status não é completed

### Lógica de Auto-Atraso (lib/store.tsx:154-182)
```typescript
// Verificação a cada 60 segundos
if (t.status !== 'completed' && t.status !== 'overdue' && t.dueDate < now) {
  // -0.5 de performanceScore ao usuário
  t.status = 'overdue'
}
```

---

## 2. MÉTRICAS

### Dashboard (app/page.tsx)

| Métrica | Cálculo |
|---------|---------|
| **Membros Ativos** | `users.length` (crescimento vs período anterior) |
| **Tarefas Concluídas** | `filteredTasks.filter(t => t.status === 'completed').length` |
| **Tarefas Atrasadas** | `filteredTasks.filter(t => t.status === 'overdue').length` |
| **Score Médio** | `totalScore / completedTasksFiltered.length` onde `user.performanceScore` |
| **% Andamento** | `(inProgressTasks / totalTasks) * 100` |
| **% Concluídas** | `(completedTasks / totalTasks) * 100` |

### Team Page (app/team/page.tsx:59-96)
```typescript
// Qualidade (performance score médio)
quality = users.reduce((acc, u) => acc + u.performanceScore, 0) / users.length

// Produtividade (crescimento de tarefas concluídas no mês)
productivity = ((currentMonthTasks - lastMonthTasks) / lastMonthTasks) * 100
```

---

## 3. XP E NÍVEL

### Estrutura do Usuário (lib/types.ts:22-24)
```typescript
points: number       // XP total acumulado
level: number        // Nível atual
xpToNextLevel: number // XP necessário para próximo nível
```

### Cálculo de XP (lib/store.tsx:216-232)

**Ganho de XP:**
- Tarefa concluída: **+1.0 XP**
- Tornar-se expert em skill: **+5.0 XP**
- Tarefa atrasada: **-0.5 XP**

**Progressão de Nível:**
```typescript
xpNeeded = 100 * level
// Exemplo: Nível 1 → 2 = 100 XP
//          Nível 2 → 3 = 200 XP
```

### Fórmula de Progressão
```typescript
if (newXp <= 0) {
  level: u.level + 1
  xpToNextLevel: 100 * (u.level + 1) - Math.abs(newXp)
}
```

---

## 4. HABILIDADES (SKILLS)

### Estruturas (lib/types.ts:27-40)

**Skill (global):**
```typescript
{ id, name, description, category }
```

**UserSkill (relação usuário-skill):**
```typescript
{ id, userId, skillId, level, lastUpdated }
```

### Níveis de Skill (lib/types.ts:1)
```typescript
type SkillLevel = 'not_trained' | 'in_training' | 'competent' | 'expert'
```

### Lógica de Atualização (lib/store.tsx:260-284)
```typescript
// Ao definir level como 'expert' (se antes não era): +5.0 XP
if (isNowExpert && wasNotExpert) {
  addUserPoints(userId, 5.0)
}

// Se level = 'not_trained' → remove a relação
// Caso contrário → atualiza level e lastUpdated
```

---

## 5. MEMBROS (USERS)

### Estrutura (lib/types.ts:12-25)
```typescript
interface User {
  id: string
  name: string
  role: string              // Texto livre (ex: "Desenvolvedor")
  status: 'active' | 'inactive' | 'busy'
  performanceScore: number  // 0-10 (decimal)
  tags: string[]           // Array de strings
  notes: string
  createdAt: string         // ISO date
  avatar: string            // URL
  points: number
  level: number
  xpToNextLevel: number
}
```

### Status de Membro
- **active**: Verde - disponível
- **busy**: Amarelo - ocupado
- **inactive**: Cinza - inativo

---

## 6. ESTRUTURA FIREBASE PROPOSTA

### Coleções Necesárias

| Coleção | Estrutura | Observações |
|---------|-----------|-------------|
| `members` | `{id, name, roleId, status, avatar}` | roleId referência |
| `roles` | `{id, name}` | Cargos únicos |
| `skills` | `{id, name, category, description}` | Skills globais |
| `tasks` | `{id, title, userId, status, dueDate, createdAt}` | userId referência |
| `userSkills` | `{id, userId, skillId, level}` | Relação N:N |
| `goals` | `{id, title, description, teamId, progress}` | teamId opcional |
| `trainings` | `{id, title, date, instructor}` | Treinamentos |

### Diferenças Atual vs Firebase

| Dado | Hoje (localStorage) | Firebase |
|------|-------------------|----------|
| Usuários | `User` completo | `members` (simplificado) |
| Roles | Em `User.role` (texto) | Coleção separada |
| Tasks | `Task` completo | Simplificado |
| XP/Level | No `User` | Precisará migrar |

---

## 7. MAPEAMENTO FRONT → FIREBASE

### FASE 1: Leitura (sem salvar)
- [ ] Criar camada Firebase (hooks/service)
- [ ] Fetch dados para contexto
- [ ] Fallback para localStorage se offline

### FASE 2: Membros
- `app/team/page.tsx` → `members` collection
- `UserModal` → `addUser`, `updateUser`

### FASE 3: Tarefas
- `app/tasks/page.tsx` → `tasks` collection
- `TaskModal` → `addTask`, `updateTask`

### FASE 4: Skills
- `app/matrix/page.tsx` → `skills` + `userSkills`
- `SkillModal` → CRUD skills

### FASE 5: Dashboard
- `app/page.tsx` → aggregation queries
- Métricas calculadas no client

### FASE 6: Relatórios
- `app/reports/page.tsx`
- `NexusReport.tsx` → dados do Firebase

---

## 8. RISCOS IDENTIFICADOS

### Críticos
1. **Quebra de gamificação**: XP/Level estão no `User` local - migrar para coleção separada
2. **Performance dashboard**: Queries complexas no client podem lentificar
3. **Sincronização offline**: localStorage + Firebase podem dessincronizar

### Dependências
- Tasks → Users (assignedUserId)
- UserSkills → Users + Skills
- Goals → Users (targetMemberId)
- Training → Users (instructor)

### Partes Críticas
1. **Dashboard** (app/page.tsx) - várias métricas agregadas
2. **Tarefas** (app/tasks/page.tsx) - filtros e status
3. **Membros** (app/team/page.tsx) - performance e stats
4. **Relatórios** (NexusReport.tsx) - dados agregados

---

## 9. RECOMENDAÇÕES DE IMPLEMENTAÇÃO

### Ordem Sugerida
1. Config Firebase SDK
2. Criar serviço de leitura (hooks/useFirebase.ts)
3. Migrar members/roles
4. Migrar tasks
5. Migrar skills/userSkills
6. Migrar trainings
7. Adicionar escrita (CRUD completo)
8. Adicionar sync (offline support)
9. Migrar dashboard + relatórios

### Considerações
- Manter localStorage como cache offline
- Implementar retry logic para escritas
- Adicionar timestamps (createdAt, updatedAt) em todas coleções
- Usar Firebase Auth se necessário para multi-tenancy
