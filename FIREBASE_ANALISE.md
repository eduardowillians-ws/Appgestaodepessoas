# Análise e Planejamento para Integração com Firebase

## 1. STATUS DE TAREFAS

### Estados Atuais (TaskStatus)
```
pending    → Tarefa criada, aguardando início
in_progress → Tarefa em execução
completed  → Tarefa finalizada
overdue    → Atrasada (atualizado automaticamente)
```

### Lógica de Transição (store.tsx:301-333)
- **pending → in_progress**:手动变更
- **in_progress → completed**:手动变更，触发 +1 XP
- **completed → pending**:手动变更
- **auto overdue**: 每分钟检查，如果 `dueDate < now` 且状态非 completed/overdue，自动转为 overdue 并 -0.5 XP (store.tsx:154-182)

---

## 2. MÉTRICAS CALCULADAS

### Dashboard (app/page.tsx)

| Métrica | Fórmula |
|---------|---------|
| **completedTasks** | `filteredTasks.filter(t => t.status === 'completed').length` |
| **overdueTasks** | `filteredTasks.filter(t => t.status === 'overdue').length` |
| **avgScore** | Soma dos `performanceScore` dos usuários com tarefas concluídas no período / número de tarefas |
| **inProgressPercent** | `(inProgressTasks / totalTasks) * 100` |
| **completedPercent** | `(completedTasks / totalTasks) * 100` |
| **memberGrowth** | `((totalNow - membersAtStart) / membersAtStart) * 100` |

### Team Page (app/team/page.tsx:63-96)

| Métrica | Fórmula |
|---------|---------|
| **quality** | `users.reduce((acc, u) => acc + u.performanceScore, 0) / users.length` |
| **productivity** | `((currentMonthTasks - lastMonthTasks) / lastMonthTasks) * 100` |
| **percentage** | `Math.min(100, Math.round(quality * 10))` |

---

## 3. SISTEMA DE XP (Gamificação)

### Estrutura do Usuário
```typescript
interface User {
  points: number;        // Pontos acumulados totais
  level: number;        // Nível atual (1, 2, 3...)
  xpToNextLevel: number; // XP restante para o próximo nível
}
```

### Cálculo de XP (store.tsx:216-232)
```
XP necessário por nível = 100 * level
- Nível 1 → 2: 100 XP
- Nível 2 → 3: 200 XP
- Nível 3 → 4: 300 XP
```

### Ganho de XP
| Ação | Pontos |
|------|--------|
| Completar tarefa | +1.0 XP |
| Tornar-se expert em skill | +5.0 XP |
| Tarefa atrasada | -0.5 XP |

### Evolução de Nível (store.tsx:219-230)
```javascript
const xpNeeded = 100 * u.level;
const newXp = u.xpToNextLevel - pointsToAdd;
if (newXp <= 0) {
  // Passa de nível
  level: u.level + 1,
  xpToNextLevel: 100 * (u.level + 1) - Math.abs(newXp)
}
```

---

## 4. HABILIDADES (SKILLS)

### Estruturas
```typescript
interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;  // Frontend, Backend, Design, Gestão, DevOps
}

interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  level: SkillLevel;  // not_trained | in_training | competent | expert
  lastUpdated: string;
}

type SkillLevel = 'not_trained' | 'in_training' | 'competent' | 'expert';
```

### Uso das Skills
1. **Requisitos de tarefa**: `Task.requiredSkills: string[]` - Skills necessárias para completar a tarefa
2. **Atribuição de skill**: Usuário pode ter cada skill em um nível específico
3. **Gamificação**: +5 XP ao atingir nível 'expert' (store.tsx:266-268)

### Componentes Relacionados
- SkillModal: Criar/editar skills
- MatrixPage (app/matrix/page.tsx): Matriz de habilidades (usuário vs skill)
- TrainingModal: Agendar treinamentos para desenvolver skills

---

## 5. ESTRUTURA DE MEMBROS

### User (types.ts:12-25)
```typescript
interface User {
  id: string;
  name: string;
  role: string;              // Cargo (string, não roleId)
  status: UserStatus;        // active | inactive | busy
  performanceScore: number; // 0-10
  tags: string[];            // Tags: ["Liderança", "Ágil"]
  notes: string;             // Notas sobre o membro
  createdAt: string;         // Data de criação
  avatar: string;            // URL da imagem
  points: number;            // Pontos XP
  level: number;             // Nível
  xpToNextLevel: number;     // XP para próximo nível
}

type UserStatus = 'active' | 'inactive' | 'busy';
```

### Role (types.ts:6-10)
```typescript
interface Role {
  id: string;
  name: string;
  createdAt: string;
}
```

### Observação Importante
- O campo `role` em User é uma **string** (não `roleId`)
- Ex: `role: 'Gestora de Projetos'`
- Roles são armazenadas em coleção separada, mas a referência em User é por nome

---

## 6. MODELAGEM DE DADOS FIREBASE (Proposta)

### Estrutura de Coleções Proposta

```
/roles/{roleId}
  - name: string
  - createdAt: timestamp

/members/{memberId}
  - name: string
  - role: string (nome do cargo)
  - status: 'active' | 'inactive' | 'busy'
  - performanceScore: number
  - tags: string[]
  - notes: string
  - createdAt: timestamp
  - avatar: string
  - points: number
  - level: number
  - xpToNextLevel: number

/skills/{skillId}
  - name: string
  - description: string
  - category: string

/member_skills/{memberSkillId}
  - memberId: string (ref)
  - skillId: string (ref)
  - level: 'not_trained' | 'in_training' | 'competent' | 'expert'
  - lastUpdated: timestamp

/tasks/{taskId}
  - title: string
  - description: string
  - assignedMemberId: string | null (ref)
  - requiredSkills: string[] (skillIds)
  - status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  - priority: 'low' | 'medium' | 'high'
  - dueDate: timestamp
  - createdAt: timestamp
  - completedAt: timestamp | null
  - rating: number | null
  - archived: boolean
  - archivedAt: timestamp | null

/trainings/{trainingId}
  - title: string
  - description: string
  - instructor: string
  - date: timestamp
  - duration: number
  - type: 'technical' | 'soft' | 'workshop'
  - category: string | null

/goals/{goalId}
  - name: string
  - type: 'task' | 'skill' | 'general'
  - scope: 'team' | 'individual'
  - targetMemberId: string | null
  - targetMembers: string[] | null
  - criteria: 'complete_tasks' | 'gain_skill' | 'points'
  - targetValue: number
  - createdAt: timestamp
  - archived: boolean
  - archivedAt: timestamp | null
  - archivedProgress: number | null
```

### Ajustes Recomendados no Modelo Atual

1. **Roles**: Manter como estão (Role.id → roleId em User)
2. **User → member**: Renomear para consistência Firebase
3. **timestamps**: Converter de ISO string para Firebase Timestamp
4. **Referências**: Substituir strings por referências de documento

---

## 7. MAPEAMENTO FRONT → FIREBASE

### Fase de Leitura (Mock/Local → Firebase)

| Dado Hoje | Fonte | Firebase Destino | Como Ler |
|-----------|-------|------------------|-----------|
| Members | localStorage `nexus_users` | `/members/{id}` | `onSnapshot` ou `getDocs` |
| Roles | localStorage `nexus_roles` | `/roles/{id}` | `getDocs` |
| Skills | localStorage `nexus_skills` | `/skills/{id}` | `getDocs` |
| UserSkills | localStorage `nexus_userSkills` | `/member_skills/{id}` | `query(where('memberId', '==', id))` |
| Tasks | localStorage `nexus_tasks` | `/tasks/{id}` | `query(where('assignedMemberId', '==', id))` |
| Trainings | localStorage `nexus_trainings` | `/trainings/{id}` | `getDocs` |
| Goals | localStorage `nexus_goals` | `/goals/{id}` | `query(where('scope', '==', 'team'))` |

### Fase de Escrita

| Ação | Função Atual | Firebase Operação | Onde Salvar |
|------|-------------|-------------------|-------------|
| Criar membro | `addUser()` | `addDoc(collection('members'), data)` | `/members` |
| Atualizar membro | `updateUser()` | `updateDoc(doc('members', id), data)` | `/members/{id}` |
| Deletar membro | `deleteUser()` | `deleteDoc(doc('members', id))` | `/members/{id}` |
| Criar tarefa | `addTask()` | `addDoc(collection('tasks'), data)` | `/tasks` |
| Atualizar status | `updateTaskStatus()` | `updateDoc(doc('tasks', id), {status, completedAt})` | `/tasks/{id}` |
| Atribuir skill | `updateUserSkill()` | `setDoc(doc('member_skills', id), data)` ou `deleteDoc` | `/member_skills` |
|Completar meta | `archiveGoal()` | `updateDoc(doc('goals', id), {archived, archivedAt})` | `/goals/{id}` |

### Sincronização LocalStorage → Firebase
1. Na inicialização, verificar se há dados no Firebase
2. Se Firebase tem dados, usar eles (carregar para local state)
3. Se Firebase está vazio, fazer migration dos dados locais
4. Após migration, usar Firebase como source of truth

---

## 8. PLANO DE INTEGRAÇÃO (PASSO A PASSO)

### FASE 1: Configuração Firebase
- [ ] Criar projeto Firebase
- [ ] Habilitar Firestore
- [ ] Configurar Firebase SDK no Next.js
- [ ] Criar arquivo `lib/firebase.ts` com config e funções utilitárias

### FASE 2: Leitura de Dados (Read-Only)
- [ ] Criar hook `useMembers()`, `useTasks()`, `useSkills()`, etc.
- [ ] Modificar store para buscar do Firebase
- [ ] Implementar fallback para localStorage se offline
- **Meta**: App funcionando com dados do Firebase, sem escrever

### FASE 3: Escrita de Membros
- [ ] Implementar `createMember()` no Firebase
- [ ] Implementar `updateMember()` no Firebase
- [ ] Implementar `deleteMember()` no Firebase
- [ ] Testar CRUD completo de membros

### FASE 4: Escrita de Tarefas
- [ ] Implementar `createTask()` no Firebase
- [ ] Implementar `updateTaskStatus()` com triggers
- [ ] Implementar `deleteTask()` e `archiveTask()`
- [ ] Sincronizar lógica de XP com Cloud Functions (recomendado)

### FASE 5: Integração de Skills
- [ ] Implementar `useSkills()` e `useMemberSkills()`
- [ ] Mapear UserSkill para `/member_skills`
- [ ] Implementar `updateUserSkill()` com lógica de XP

### FASE 6: Dashboard e Métricas
- [ ] Atualizar cálculos de métricas para usar dados Firebase
- [ ] Implementar queries agregadas se necessário
- [ ] Adicionar listeners em tempo real

### FASE 7: Relatórios
- [ ] Atualizar NexusReport
- [ ] Migrar lógica de relatórios
- [ ] Implementar exportação PDF

---

## 9. IDENTIFICAÇÃO DE RISCOS

### Pontos Críticos

| Risco | Impacto | Mitigação |
|-------|--------|-----------|
| **Latência de leitura** | Dados podem demorar para carregar | Usar `onSnapshot` para tempo real + loading states |
| **Conflito de escrita** | Dois usuários editando simultaneamente | Implementar optimistic updates + conflict resolution |
| **Mudança de estrutura** | Dados locais incompatíveis | Migration script ao iniciar app |
| **Offline mode** | Sem conexão | Fallback para localStorage + queue de sincronização |
| **Performance com muitos dados** | Queries lentas | Paginação + índices compostos no Firestore |

### Dependências Entre Módulos

```
Dashboard
  ├── requer: Members, Tasks, Skills
  └── impacto: Alto (métricas principais)

Team
  ├── requer: Members, Roles, Tasks, UserSkills
  └── impacto: Alto (gestão principal)

Tasks
  ├── requer: Members, Skills
  └── impacto: Alto (funcionalidade core)

Matrix
  ├── requer: Members, Skills, UserSkills
  └── impacto: Médio

Goals
  ├── requer: Members, Tasks
  └── impacto: Médio

Reports
  ├── requer: Tasks, Members
  └── impacto: Médio
```

### Partes Mais Críticas

1. **Dashboard** - Visible a todos, mostra métricas globais
2. **Tasks** - Core do app, interação frequente
3. **Team/Members** - Dados mais sensíveis

### Recomendações de Segurança

- Configurar Firestore Security Rules
- Implementar Authentication antes de expor dados
- Validar permissões por usuário/role

---

## 10. PRÓXIMOS PASSOS

1. **Confirmar modelo de dados**: Revisar estrutura proposta acima
2. **Decidir estratégia de autenticação**: Firebase Auth vs outra
3. **Iniciar Fase 1**: Configurar projeto Firebase
4. **Criar migration script**: Converter dados locais para Firebase

---

*Documento gerado em Thu Mar 26 2026*
