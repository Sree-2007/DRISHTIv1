import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import api from '../api';
import { colors } from '../theme';

const TYPES = ['ACCIDENT', 'WATERLOGGING', 'BLOCKAGE', 'RALLY'];

export default function Report({ navigation }) {
  const [type, setType] = useState('WATERLOGGING');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const res = await ImagePicker.launchCameraAsync({ quality: 0.4, base64: true });
    if (!res.canceled) setImage(res.assets[0]);
  };

  const submit = async () => {
    if (description.length < 5) return Alert.alert('Add a description');
    setBusy(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Location permission required');
      const pos = await Location.getCurrentPositionAsync({});

      const payload = {
        type, description,
        imageBase64: image?.base64,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };
      const { data } = await api.post('/reports', payload);
      Alert.alert('✅ Submitted', `Status: ${data.status}. Trust score updated on verification.`);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Failed', e.response?.data?.error || e.message);
    } finally { setBusy(false); }
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.label}>Hazard Type</Text>
      <View style={styles.types}>
        {TYPES.map(t => (
          <TouchableOpacity key={t} onPress={() => setType(t)} style={[styles.type, type === t && styles.typeActive]}>
            <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Description</Text>
      <TextInput
        multiline numberOfLines={4}
        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
        placeholder="What's happening?" placeholderTextColor={colors.subtext}
        value={description} onChangeText={setDescription}
      />

      <Text style={styles.label}>Photo</Text>
      {image && <Image source={{ uri: image.uri }} style={{ width: '100%', height: 180, borderRadius: 12, marginBottom: 12 }} />}
      <TouchableOpacity style={styles.photoBtn} onPress={pick}>
        <Text style={{ color: colors.accent, fontWeight: '600' }}>{image ? '🔄 Retake' : '📸 Capture Photo'}</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>📍 GPS auto-captured on submit</Text>

      <TouchableOpacity style={styles.btn} onPress={submit} disabled={busy}>
        <Text style={styles.btnText}>{busy ? 'Submitting...' : 'Submit Report'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  label: { color: colors.subtext, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 14 },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  type: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  typeActive: { borderColor: colors.accent, backgroundColor: 'rgba(59,130,246,0.15)' },
  typeText: { color: colors.subtext, fontSize: 12 },
  typeTextActive: { color: colors.accent, fontWeight: '600' },
  input: { backgroundColor: colors.card, color: colors.text, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: colors.border },
  photoBtn: { padding: 16, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.accent, alignItems: 'center', marginBottom: 12 },
  hint: { color: colors.subtext, fontSize: 11, marginBottom: 12 },
  btn: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 }
});
