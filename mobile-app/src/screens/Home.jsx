import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { io } from 'socket.io-client';
import api, { BASE_URL } from '../api';
import { colors, hazardColors } from '../theme';

const emoji = { ACCIDENT: '🚗', WATERLOGGING: '💧', RALLY: '📢', BLOCKAGE: '🚧' };

export default function Home({ navigation, user }) {
  const mapRef = useRef(null);
  const [loc, setLoc] = useState(null);
  const [reports, setReports] = useState([]);
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permission needed', 'Location is required');
      const pos = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = pos.coords;
      setLoc({ latitude, longitude });
      loadNearby(latitude, longitude);
    })();
  }, []);

  const loadNearby = async (lat, lng) => {
    try {
      const { data } = await api.get(`/reports/nearby?lat=${lat}&lng=${lng}&radius=5`);
      setReports(data);
    } catch (e) { console.warn(e.message); }
  };

  useEffect(() => {
    const socket = io(`${BASE_URL}/driver`, { transports: ['websocket'] });
    socket.on('hazard:reported', (r) => {
      setReports(prev => [r, ...prev]);
      Speech.speak(`New ${r.type.toLowerCase()} reported nearby`);
    });
    socket.on('hazard:verified', (r) => {
      setReports(prev => prev.map(x => x.id === r.id ? r : x));
      if (r.status === 'VERIFIED') {
        Speech.speak(`Verified ${r.type.toLowerCase()} ahead. Reroute advised.`);
      }
    });
    socket.on('prediction:alert', (p) => {
      setPrediction(p);
      Speech.speak(`Warning. Possible ${p.predictedType.toLowerCase()} predicted in ${p.zone.name}.`);
    });
    return () => socket.disconnect();
  }, []);

  const report = reports.find(r => r.status === 'VERIFIED' && r.lat && r.lng);

  return (
    <View style={styles.wrap}>
      {prediction && (
        <TouchableOpacity onPress={() => setPrediction(null)} style={styles.predBanner}>
          <Text style={styles.predText}>⚠️ Risk Ahead: {prediction.predictedType} in {prediction.zone.name}</Text>
        </TouchableOpacity>
      )}

      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation
        initialRegion={loc ? { latitude: loc.latitude, longitude: loc.longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 } : undefined}
        customMapStyle={darkMapStyle}
      >
        {reports.map(r => (
          <Marker
            key={r.id}
            coordinate={{ latitude: r.lat, longitude: r.lng }}
            title={r.type}
            description={r.description}
            pinColor={hazardColors[r.type]}
          />
        ))}
        {report && (
          <Circle center={{ latitude: report.lat, longitude: report.lng }} radius={500}
            strokeColor={hazardColors[report.type]} fillColor={`${hazardColors[report.type]}33`} />
        )}
      </MapView>

      <View style={styles.hud}>
        <View style={styles.pill}><Text style={styles.pillText}>📍 {reports.length} hazards nearby</Text></View>
        <View style={styles.pill}><Text style={styles.pillText}>⭐ Trust {user.trustScore}</Text></View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.action, { backgroundColor: colors.bad }]} onPress={() => navigation.navigate('Report')}>
          <Text style={styles.actionText}>📸 Report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.action, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]} onPress={() => navigation.navigate('Profile')}>
          <Text style={[styles.actionText, { color: colors.text }]}>👤 Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0a0e1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0e1a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0a0e1a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f1a2e' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#131826' }] }
];

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  map: { flex: 1 },
  hud: { position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  pill: { backgroundColor: 'rgba(19,24,38,0.9)', borderColor: colors.border, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  pillText: { color: colors.text, fontSize: 12 },
  predBanner: { backgroundColor: colors.warn, padding: 12, marginTop: 8 },
  predText: { color: '#000', fontWeight: '700', textAlign: 'center', fontSize: 13 },
  actions: { position: 'absolute', bottom: 24, left: 16, right: 16, flexDirection: 'row', gap: 10 },
  action: { flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 15 }
});
