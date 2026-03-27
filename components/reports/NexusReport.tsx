'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, PDFDownloadLink, Svg, Circle, Rect, G, Path } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { 
    padding: 45, 
    backgroundColor: '#FFFFFF', 
    fontFamily: 'Helvetica',
    flexDirection: 'column'
  },
  page2: { 
    padding: 45, 
    backgroundColor: '#FFFFFF', 
    fontFamily: 'Helvetica',
    flexDirection: 'column'
  },
  
  // Header Section
  header: { 
    alignItems: 'center', 
    marginBottom: 30,
    paddingBottom: 18,
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1'
  },
  logoText: { 
    fontSize: 28, 
    fontWeight: 800, 
    color: '#6366f1', 
    letterSpacing: 3,
    marginBottom: 6
  },
  titleText: { 
    fontSize: 20, 
    fontWeight: 700, 
    color: '#1e293b', 
    textAlign: 'center',
    marginBottom: 4
  },
  periodText: { 
    fontSize: 10, 
    color: '#64748b', 
    textAlign: 'center' 
  },
  
  // AI Insights Card
  insightsCard: {
    backgroundColor: '#f0f4ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#6366f1',
    padding: 14,
    marginBottom: 22,
    flexDirection: 'column'
  },
  insightsTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#6366f1',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5
  },
  insightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8
  },
  insightText: {
    fontSize: 9,
    color: '#334155',
    flex: 1
  },
  
  // Stats Grid
  statsGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 22 
  },
  card: { 
    padding: 14, 
    backgroundColor: '#f8fafc', 
    borderRadius: 10, 
    width: '31%', 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    alignItems: 'center'
  },
  cardLabel: { 
    fontSize: 8, 
    color: '#64748b', 
    textTransform: 'uppercase', 
    marginBottom: 3,
    textAlign: 'center',
    fontWeight: 600
  },
  cardValue: { 
    fontSize: 22, 
    fontWeight: 800, 
    color: '#6366f1',
    marginBottom: 1
  },
  cardSubValue: {
    fontSize: 7,
    color: '#94a3b8'
  },
  
  // Section Titles
  section: { 
    marginTop: 8, 
    marginBottom: 12 
  },
  sectionTitle: { 
    fontSize: 12, 
    fontWeight: 700, 
    color: '#1e293b', 
    marginBottom: 10, 
    paddingLeft: 8, 
    borderLeftWidth: 3, 
    borderLeftColor: '#6366f1' 
  },
  
  // Donut Chart Section
  donutSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    padding: 18,
    backgroundColor: '#fafbfc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  donutContainer: {
    width: 120,
    height: 120,
    marginRight: 20,
    position: 'relative'
  },
  donutLegend: {
    flex: 1
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10
  },
  legendText: {
    fontSize: 9,
    color: '#334155',
    flex: 1
  },
  legendValue: {
    fontSize: 11,
    fontWeight: 700,
    color: '#1e293b'
  },
  totalTasks: {
    fontSize: 11,
    fontWeight: 700,
    color: '#1e293b',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0'
  },
  
  // Skills Matrix (Member x Skill)
  skillsMatrixContainer: {
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    overflow: 'hidden'
  },
  matrixHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 10
  },
  matrixHeaderCell: {
    fontSize: 8,
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase'
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  matrixMemberCell: {
    width: '25%',
    fontSize: 9,
    color: '#1e293b',
    fontWeight: 600
  },
  matrixSkillCells: {
    width: '75%',
    flexDirection: 'row',
    gap: 6
  },
  proficiencyBadge: {
    width: 22,
    height: 22,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  proficiencyText: {
    fontSize: 8,
    fontWeight: 700,
    color: '#fff'
  },
  
  // Leaderboard Table
  leaderboardTable: {
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    overflow: 'hidden'
  },
  leaderboardHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 10
  },
  leaderboardHeaderCell: {
    fontSize: 8,
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase'
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  leaderboardRowFirst: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#fbbf24',
    backgroundColor: '#fefce8'
  },
  rankCell: {
    width: '10%',
    fontSize: 10,
    fontWeight: 700,
    color: '#64748b'
  },
  rankCellFirst: {
    width: '10%',
    fontSize: 12,
    fontWeight: 800,
    color: '#d97706'
  },
  avatarCell: {
    width: '15%',
    alignItems: 'center'
  },
  avatarPlaceholder: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarInitial: {
    fontSize: 9,
    fontWeight: 700,
    color: '#6366f1'
  },
  nameCell: {
    width: '35%',
    fontSize: 9,
    color: '#1e293b'
  },
  nameCellFirst: {
    width: '35%',
    fontSize: 10,
    fontWeight: 700,
    color: '#92400e'
  },
  xpCell: {
    width: '20%',
    fontSize: 9,
    color: '#334155',
    textAlign: 'center'
  },
  xpCellFirst: {
    width: '20%',
    fontSize: 10,
    fontWeight: 700,
    color: '#d97706',
    textAlign: 'center'
  },
  levelCell: {
    width: '20%',
    fontSize: 9,
    color: '#64748b',
    textAlign: 'center'
  },
  levelCellFirst: {
    width: '20%',
    fontSize: 10,
    fontWeight: 700,
    color: '#d97706',
    textAlign: 'center'
  },
  
  // Analysis Notes Section
  analysisSection: {
    marginBottom: 15,
    padding: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  analysisTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#334155',
    marginBottom: 8
  },
  analysisItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6
  },
  analysisBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#6366f1',
    marginRight: 8,
    marginTop: 3
  },
  analysisText: {
    fontSize: 8,
    color: '#475569',
    flex: 1,
    lineHeight: 1.5
  },
  
  // Footer
  footer: { 
    marginTop: 'auto',
    borderTopWidth: 1, 
    borderTopColor: '#e2e8f0', 
    paddingTop: 10,
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  footerText: { 
    fontSize: 7, 
    color: '#94a3b8' 
  },
  footerTimestamp: { 
    fontSize: 7, 
    color: '#64748b',
    fontWeight: 600
  },

  // Page 2 Styles
  page2Header: {
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1'
  },
  page2Title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4
  },
  page2Subtitle: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center'
  },
  
  skillsFocusSection: {
    marginBottom: 22
  },
  skillsFocusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  skillFocusCard: {
    width: '31%',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center'
  },
  skillFocusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  skillFocusName: {
    fontSize: 10,
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: 2
  },
  skillFocusCategory: {
    fontSize: 7,
    color: '#64748b'
  },
  skillFocusLevel: {
    fontSize: 7,
    fontWeight: 600,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  
  timelineSection: {
    marginBottom: 22
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start'
  },
  timelineWeek: {
    width: 60,
    fontSize: 9,
    fontWeight: 700,
    color: '#6366f1'
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#e2e8f0'
  },
  timelineTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: 3
  },
  timelineDesc: {
    fontSize: 8,
    color: '#64748b',
    lineHeight: 1.4
  },
  
  recommendationsSection: {
    padding: 14,
    backgroundColor: '#f0f4ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#6366f1'
  },
  recommendationsTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#6366f1',
    marginBottom: 8
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6
  },
  recBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#6366f1',
    marginRight: 8,
    marginTop: 3
  },
  recText: {
    fontSize: 8,
    color: '#334155',
    flex: 1,
    lineHeight: 1.4
  }
});

const DonutChartSVG = ({ completed, inProgress, total }: { completed: number; inProgress: number; total: number }) => {
  const radius = 38;
  const center = 60;
  const completedPercent = total > 0 ? (completed / total) * 100 : 0;
  const inProgressPercent = total > 0 ? (inProgress / total) * 100 : 0;
  
  const completedArc = (completedPercent / 100) * 360;
  const inProgressArc = (inProgressPercent / 100) * 360;
  
  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = (angle - 90) * Math.PI / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad)
    };
  };
  
  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };
  
  return (
    <Svg width="120" height="120" viewBox="0 0 120 120">
      <Circle cx={center} cy={center} r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="14" />
      
      {completedArc > 0 && (
        <Path
          d={describeArc(center, center, radius, 0, completedArc)}
          stroke="#22c55e"
          strokeWidth="14"
          fill="transparent"
        />
      )}
      
      {inProgressArc > 0 && (
        <Path
          d={describeArc(center, center, radius, completedArc, completedArc + inProgressArc)}
          stroke="#f59e0b"
          strokeWidth="14"
          fill="transparent"
        />
      )}
      
      <Text style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', textAnchor: 'middle' }} x={center} y={center + 4}>
        {total}
      </Text>
    </Svg>
  );
};

const ProficiencyBadge = ({ level }: { level: string }) => {
  const config: Record<string, { bg: string; text: string }> = {
    expert: { bg: '#22c55e', text: 'E' },
    trained: { bg: '#f59e0b', text: 'T' },
    competent: { bg: '#6366f1', text: 'C' },
    not_trained: { bg: '#e2e8f0', text: '-' }
  };
  
  const { bg, text } = config[level] || config.not_trained;
  
  return (
    <View style={[styles.proficiencyBadge, { backgroundColor: bg }]}>
      <Text style={styles.proficiencyText}>{text}</Text>
    </View>
  );
};

const NexusReportDocument = ({ data }: { data: any }) => {
  const now = new Date();
  const timestamp = now.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const currentMonth = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const { 
    completionRate = 0, 
    inProgressRate = 0, 
    totalXP = 0, 
    averageScore = 0, 
    members = [],
    skillsMatrix = [],
    taskStatus = { completed: 0, inProgress: 0, overdue: 0, total: 0 },
    aiInsights = {},
    analysisNotes = [],
    dateRange = {}
  } = data || {};

  const topSkills = skillsMatrix.slice(0, 6);

  const trainingSchedule = [
    { week: 'Sem 1', title: 'React Avançado', desc: 'Hooks, Context API e performance' },
    { week: 'Sem 2', title: 'Node.js & APIs', desc: 'RESTful services e autenticação' },
    { week: 'Sem 3', title: 'UI/UX Design', desc: 'Figma avançado e design systems' },
    { week: 'Sem 4', title: 'Soft Skills', desc: 'Comunicação e liderança técnica' }
  ];

  return (
    <Document>
      {/* Page 1 */}
      <Page size="A4" style={styles.page}>
        
        <View style={styles.header}>
          <Text style={styles.logoText}>NEXUS.</Text>
          <Text style={styles.titleText}>Relatório de Performance</Text>
          <Text style={styles.periodText}>
            {dateRange?.start || '-'} até {dateRange?.end || '-'}
          </Text>
        </View>

        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>Insights de IA</Text>
          <View style={styles.insightRow}>
            <Rect x="0" y="0" width="6" height="6" rx="3" fill="#6366f1" />
            <Text style={styles.insightText}>
              {aiInsights?.topPerformer || 'Nenhum dado disponível'}
            </Text>
          </View>
          <View style={styles.insightRow}>
            <Rect x="0" y="0" width="6" height="6" rx="3" fill={completionRate >= 70 ? '#22c55e' : '#f59e0b'} />
            <Text style={styles.insightText}>
              {aiInsights?.efficiency || `Eficiência da equipe em ${completionRate}%`}
            </Text>
          </View>
          <View style={styles.insightRow}>
            <Rect x="0" y="0" width="6" height="6" rx="3" fill="#8b5cf6" />
            <Text style={styles.insightText}>
              {aiInsights?.skillInsight || 'Nenhuma skill registrada'}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Taxa Conclusão</Text>
            <Text style={styles.cardValue}>{completionRate}%</Text>
            <Text style={styles.cardSubValue}>{taskStatus?.completed || 0} concluídas</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>XP Total</Text>
            <Text style={styles.cardValue}>{totalXP}</Text>
            <Text style={styles.cardSubValue}>pontos distribuídos</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Score Médio</Text>
            <Text style={styles.cardValue}>{averageScore}</Text>
            <Text style={styles.cardSubValue}>média da equipe</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status das Tarefas</Text>
        </View>
        <View style={styles.donutSection}>
          <View style={styles.donutContainer}>
            <DonutChartSVG 
              completed={taskStatus?.completed || 0} 
              inProgress={taskStatus?.inProgress || 0} 
              total={taskStatus?.total || 0} 
            />
          </View>
          <View style={styles.donutLegend}>
            <View style={styles.legendItem}>
              <Rect x="0" y="0" width="12" height="12" rx="6" fill="#22c55e" />
              <Text style={styles.legendText}>Concluídas</Text>
              <Text style={styles.legendValue}>{completionRate}%</Text>
            </View>
            <View style={styles.legendItem}>
              <Rect x="0" y="0" width="12" height="12" rx="6" fill="#f59e0b" />
              <Text style={styles.legendText}>Em Andamento</Text>
              <Text style={styles.legendValue}>{inProgressRate}%</Text>
            </View>
            <View style={styles.totalTasks}>
              <Text style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>
                Total: {taskStatus?.total || 0} tarefas
              </Text>
            </View>
          </View>
        </View>

        {members && members.length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Matriz de Competências</Text>
            </View>
            <View style={styles.skillsMatrixContainer}>
              <View style={styles.matrixHeader}>
                <Text style={[styles.matrixHeaderCell, { width: '25%' }]}>Membro</Text>
                <Text style={[styles.matrixHeaderCell, { width: '75%' }]}>Skills</Text>
              </View>
              {members.slice(0, 6).map((member: any, idx: number) => (
                <View key={idx} style={styles.matrixRow}>
                  <Text style={styles.matrixMemberCell}>{member.name}</Text>
                  <View style={styles.matrixSkillCells}>
                    {member.skillProficiencies?.slice(0, 6).map((skill: any, sIdx: number) => (
                      <ProficiencyBadge key={sIdx} level={skill.level} />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leaderboard</Text>
        </View>
        <View style={styles.leaderboardTable}>
          <View style={styles.leaderboardHeader}>
            <Text style={[styles.leaderboardHeaderCell, { width: '10%' }]}>#</Text>
            <Text style={[styles.leaderboardHeaderCell, { width: '15%' }]}>Avatar</Text>
            <Text style={[styles.leaderboardHeaderCell, { width: '35%' }]}>Membro</Text>
            <Text style={[styles.leaderboardHeaderCell, { width: '20%' }]}>XP Total</Text>
            <Text style={[styles.leaderboardHeaderCell, { width: '20%' }]}>Nível</Text>
          </View>
          {members.slice(0, 5).map((member: any, idx: number) => (
            <View 
              key={idx} 
              style={idx === 0 ? styles.leaderboardRowFirst : styles.leaderboardRow}
            >
              <Text style={idx === 0 ? styles.rankCellFirst : styles.rankCell}>
                {idx + 1}º
              </Text>
              <View style={styles.avatarCell}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {member.name?.charAt(0) || '?'}
                  </Text>
                </View>
              </View>
              <Text style={idx === 0 ? styles.nameCellFirst : styles.nameCell}>
                {member.name}
              </Text>
              <Text style={idx === 0 ? styles.xpCellFirst : styles.xpCell}>
                {member.points} XP
              </Text>
              <Text style={idx === 0 ? styles.levelCellFirst : styles.levelCell}>
                Nível {member.level}
              </Text>
            </View>
          ))}
        </View>

        {analysisNotes && analysisNotes.length > 0 && (
          <View style={styles.analysisSection}>
            <Text style={styles.analysisTitle}>Observações e Análise</Text>
            {analysisNotes.map((note: string, idx: number) => (
              <View key={idx} style={styles.analysisItem}>
                <Rect x="0" y="3" width="5" height="5" rx="2.5" fill="#6366f1" />
                <Text style={styles.analysisText}>{note}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerTimestamp}>Relatório gerado em: {timestamp}</Text>
          <Text style={styles.footerText}>Página 1 de 2 • NEXUS Performance</Text>
        </View>

      </Page>

      {/* Page 2 - Training Plan */}
      <Page size="A4" style={styles.page2}>
        
        <View style={styles.page2Header}>
          <Text style={styles.logoText}>NEXUS.</Text>
          <Text style={styles.page2Title}>Plano de Treinamento & Ferramentas</Text>
          <Text style={styles.page2Subtitle}>{currentMonth}</Text>
        </View>

        <View style={styles.skillsFocusSection}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills em Foco</Text>
          </View>
          <View style={styles.skillsFocusGrid}>
            {topSkills.slice(0, 6).map((skill: any, idx: number) => {
              const needsTraining = skill.experts < 2;
              return (
                <View key={idx} style={styles.skillFocusCard}>
                  <View style={[styles.skillFocusIcon, { backgroundColor: needsTraining ? '#fef3c7' : '#dbeafe' }]}>
                    <Text style={{ fontSize: 14, color: needsTraining ? '#d97706' : '#6366f1' }}>🎯</Text>
                  </View>
                  <Text style={styles.skillFocusName}>{skill.name}</Text>
                  <Text style={styles.skillFocusCategory}>{skill.category}</Text>
                  <Text style={[styles.skillFocusLevel, { backgroundColor: needsTraining ? '#fef3c7' : '#d1fae5', color: needsTraining ? '#92400e' : '#065f46' }]}>
                    {skill.experts} especialistas
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.timelineSection}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cronograma Sugerido</Text>
          </View>
          {trainingSchedule.map((item, idx) => (
            <View key={idx} style={styles.timelineItem}>
              <Text style={styles.timelineWeek}>{item.week}</Text>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>{item.title}</Text>
                <Text style={styles.timelineDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.recommendationsSection}>
          <Text style={styles.recommendationsTitle}>Recomendações da IA</Text>
          <View style={styles.recommendationItem}>
            <Rect x="0" y="3" width="5" height="5" rx="2.5" fill="#6366f1" />
            <Text style={styles.recText}>
              Priorize treinamentos em React e Node.js para aumentar a produtividade geral da equipe.
            </Text>
          </View>
          <View style={styles.recommendationItem}>
            <Rect x="0" y="3" width="5" height="5" rx="2.5" fill="#22c55e" />
            <Text style={styles.recText}>
              Utilize a metodologia de pairing para acelerar o aprendizado dos membros júnior.
            </Text>
          </View>
          <View style={styles.recommendationItem}>
            <Rect x="0" y="3" width="5" height="5" rx="2.5" fill="#f59e0b" />
            <Text style={styles.recText}>
              Agende sessões quinzenais de code review para manter a qualidade do código.
            </Text>
          </View>
          <View style={styles.recommendationItem}>
            <Rect x="0" y="3" width="5" height="5" rx="2.5" fill="#8b5cf6" />
            <Text style={styles.recText}>
              Considere ferramentas de automação para reduzir tarefas repetitivas.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTimestamp}>Relatório gerado em: {timestamp}</Text>
          <Text style={styles.footerText}>Página 2 de 2 • NEXUS Performance</Text>
        </View>

      </Page>
    </Document>
  );
};

interface PDFDownloadButtonProps {
  data: any;
}

export const PDFDownloadButton = ({ data }: PDFDownloadButtonProps) => (
  <PDFDownloadLink
    document={<NexusReportDocument data={data} />}
    fileName={`Relatorio_Nexus_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`}
    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors"
  >
    {({ loading }: { loading: boolean }) => (loading ? 'Gerando...' : '📄 Baixar Relatório PDF')}
  </PDFDownloadLink>
);
