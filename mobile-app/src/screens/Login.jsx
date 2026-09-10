import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import { colors } from '../theme';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('driver@drishti.io');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [role, setRole] = useState('DRIVER');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login' ? { email, password } : { name, email, password, role };
      const { data } = await api.post(endpoint, payload);
      await AsyncStorage.setItem('drishti_token', data.accessToken);
      await AsyncStorage.setItem('drishti_refresh', data.refreshToken);
      await AsyncStorage.setItem('drishti_user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Request failed');
    } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.logo}>👁️</Text>
        <Text style={styles.title}>DRISHTI</Text>
        <Text style={styles.subtitle}>Smart Urban Traffic Companion</Text>

        <View style={styles.tabs}>
          <TouchableOpacity onPress={() => setMode('login')} style={[styles.tab, mode === 'login' && styles.tabActive]}>
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('register')} style={[styles.tab, mode === 'register' && styles.tabActive]}>
            <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>Register</Text>
          </TouchableOpacity>
        </View>

        {mode === 'register' && (
          <TextInput placeholder="Full name" placeholderTextColor={colors.subtext} style={styles.input} value={name} onChangeText={setName} />
        )}
        <TextInput placeholder="Email" placeholderTextColor={colors.subtext} style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput placeholder="Password" placeholderTextColor={colors.subtext} style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

        {mode === 'register' && (
          <View style={styles.roles}>
            {['DRIVER', 'CITIZEN'].map(r => (
              <TouchableOpacity key={r} onPress={() => setRole(r)} style={[styles.role, role === r && styles.roleActive]}>
                <Text style={[styles.roleText, role === r && styles.roleTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.btn} onPress={submit} disabled={busy}>
          <Text style={styles.btnText}>{busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>Demo: driver@drishti.io / password123</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.border },
  logo: { fontSize: 44, textAlign: 'center' },
  title: { color: colors.text, fontSize: 26, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  subtitle: { color: colors.subtext, textAlign: 'center', marginBottom: 20, fontSize: 12 },
  tabs: { flexDirection: 'row', backgroundColor: '#0a0e1a', borderRadius: 10, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: colors.accent },
  tabText: { color: colors.subtext, fontSize: 13 },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  input: { backgroundColor: '#0a0e1a', color: colors.text, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  roles: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  role: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  roleActive: { borderColor: colors.accent, backgroundColor: 'rgba(59,130,246,0.15)' },
  roleText: { color: colors.subtext, fontSize: 12 },
  roleTextActive: { color: colors.accent, fontWeight: '600' },
  btn: { backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  hint: { color: colors.subtext, fontSize: 11, textAlign: 'center', marginTop: 16 }
});
