import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import api from '../api';
import { colors } from '../theme';

export default function Profile({ user, onLogout }) {
  const [myReports, setMyReports] = useState([]);
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    api.get('/reports/nearby?lat=19.076&lng=72.8777&radius=100').then(r => {
      setMyReports(r.data.filter(x => x.reporterId === user.id));
    }).catch(() => {});
  }, []);

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.header}>
        <Text style={styles.avatar}>👤</Text>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.trustWrap}>
          <Text style={styles.trustLabel}>Trust Score</Text>
          <Text style={styles.trust}>{user.trustScore}/100</Text>
        </View>
        <View style={styles.bar}><View style={[styles.fill, { width: `${user.trustScore}%` }]} /></View>
      </View>

      <Text style={styles.section}>My Recent Reports</Text>
      {myReports.length === 0 && <Text style={styles.empty}>No reports yet. Report a hazard to earn +10 trust!</Text>}
      {myReports.map(r => (
        <View key={r.id} style={styles.item}>
          <Text style={styles.itemTitle}>{r.type}</Text>
          <Text style={styles.itemDesc} numberOfLines={1}>{r.description}</Text>
          <Text style={[styles.badge, { color: r.status === 'VERIFIED' ? colors.good : r.status === 'REJECTED' ? colors.bad : colors.warn }]}>
            {r.status}
          </Text>
        </View>
      ))}

      <TouchableOpacity style={styles.logout} onPress={onLogout}>
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: { alignItems: 'center', marginBottom: 24 },
  avatar: { fontSize: 60 },
  name: { color: colors.text, fontSize: 22, fontWeight: '700', marginTop: 8 },
  email: { color: colors.subtext, fontSize: 12, marginTop: 2 },
  trustWrap: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 20 },
  trustLabel: { color: colors.subtext, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  trust: { color: colors.accent, fontWeight: '700', fontSize: 16 },
  bar: { height: 8, backgroundColor: colors.border, borderRadius: 4, marginTop: 8, overflow: 'hidden', width: '100%' },
  fill: { height: '100%', backgroundColor: colors.accent },
  section: { color: colors.subtext, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  empty: { color: colors.subtext, fontStyle: 'italic', marginBottom: 20 },
  item: { backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 8 },
  itemTitle: { color: colors.accent, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  itemDesc: { color: colors.text, fontSize: 13, marginTop: 2 },
  badge: { fontSize: 10, marginTop: 6, fontWeight: '700' },
  logout: { marginTop: 30, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.bad, alignItems: 'center' },
  logoutText: { color: colors.bad, fontWeight: '700' }
});
