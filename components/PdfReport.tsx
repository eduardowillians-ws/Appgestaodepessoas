'use client';

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { ReportData } from '@/lib/report-utils';

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#FFFFFF', fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottomWidth: 2, borderBottomColor: '#6366f1', paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 4 },
  section: { marginVertical: 15 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#6366f1', paddingLeft: 8 },
  
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  card: { padding: 15, backgroundColor: '#f8fafc', borderRadius: 8, width: '30%', borderWidth: 1, borderColor: '#e2e8f0' },
  cardLabel: { fontSize: 10, color: '#64748b', textTransform: 'uppercase' },
  cardValue: { fontSize: 18, fontWeight: 'bold', color: '#6366f1', marginTop: 4 },
  
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 8, alignItems: 'center' },
  tableHeader: { backgroundColor: '#f1f5f9', fontWeight: 'bold' },
  col1: { width: '40%', fontSize: 10 },
  col2: { width: '20%', fontSize: 10, textAlign: 'center' },
  col3: { width: '20%', fontSize: 10, textAlign: 'center' },
  col4: { width: '20%', fontSize: 10, textAlign: 'right' },
  
  goalItem: { fontSize: 10, marginBottom: 4, color: '#475569' },
  goalComplete: { color: '#16a34a' },
  goalProgress: { color: '#6366f1' },
  
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 9, color: '#94a3b8' },
  
  skillRow: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  skillName: { width: '50%', fontSize: 10 },
  skillStats: { width: '50%', fontSize: 10, textAlign: 'right', color: '#64748b' },
});

interface PdfReportProps {
  data: ReportData;
}

export const PdfReport = ({ data }: PdfReportProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Relatório de Performance Nexus</Text>
        <Text style={styles.subtitle}>
          Período: {new Date(data.dateRange.start).toLocaleDateString('pt-BR')} - {new Date(data.dateRange.end).toLocaleDateString('pt-BR')}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Taxa de Conclusão</Text>
          <Text style={styles.cardValue}>{data.metrics.completionRate}%</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Total XP</Text>
          <Text style={styles.cardValue}>{data.metrics.totalPoints} pts</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Score Médio</Text>
          <Text style={styles.cardValue}>{data.metrics.avgScore}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Destaques do Período (Ranking)</Text>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.col1}>Membro</Text>
          <Text style={styles.col2}>Pontos</Text>
          <Text style={styles.col3}>Nível</Text>
          <Text style={styles.col4}>Tasks</Text>
        </View>
        {data.members.sort((a, b) => b.points - a.points).slice(0, 5).map((member, index) => (
          <View key={member.id} style={styles.tableRow}>
            <Text style={styles.col1}>{index === 0 ? '⭐ ' : ''}{member.name}</Text>
            <Text style={styles.col2}>{member.points}</Text>
            <Text style={styles.col3}>Nv. {member.level}</Text>
            <Text style={styles.col4}>{member.tasksCompleted}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Metas da Equipe</Text>
        {data.goals.team.map(goal => (
          <Text key={goal.id} style={[styles.goalItem, goal.progress >= 100 ? styles.goalComplete : styles.goalProgress]}>
            {goal.progress >= 100 ? '✓' : '○'} {goal.name}: {goal.progress}%
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Metas Individuais</Text>
        {data.goals.individual.map(goal => (
          <Text key={goal.id} style={[styles.goalItem, goal.progress >= 100 ? styles.goalComplete : styles.goalProgress]}>
            {goal.progress >= 100 ? '✓' : '○'} {goal.name} ({goal.memberName}): {goal.progress}%
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills com Maior Evolução</Text>
        {data.skills.slice(0, 5).map(skill => (
          <View key={skill.id} style={styles.skillRow}>
            <Text style={styles.skillName}>{skill.name}</Text>
            <Text style={styles.skillStats}>{skill.expertsCount} experts • {skill.totalTrained} treinados</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Nexus SaaS - Gestão de Equipe</Text>
        <Text style={styles.footerText}>Gerado em {new Date(data.generatedAt).toLocaleString('pt-BR')}</Text>
      </View>
    </Page>
  </Document>
);

interface PdfDownloadButtonProps {
  data: ReportData;
  className?: string;
}

export const PdfDownloadButton = ({ data, className = '' }: PdfDownloadButtonProps) => {
  if (typeof window === 'undefined') return null;
  
  const { PDFDownloadLink } = require('@react-pdf/renderer');
  
  return (
    <PDFDownloadLink
      document={<PdfReport data={data} />}
      fileName={`Relatorio_Nexus_${new Date().toISOString().split('T')[0]}.pdf`}
      className={className || 'bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 w-fit'}
    >
      {({ loading }: { loading: boolean }) => (loading ? 'Preparando Relatório...' : '📄 Baixar Relatório PDF')}
    </PDFDownloadLink>
  );
};
