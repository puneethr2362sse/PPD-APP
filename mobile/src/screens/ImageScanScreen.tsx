import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Image, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useHistory } from '../context/HistoryContext';
import { api } from '../services/api';

const SAMPLE_IMAGES = [
  {
    name: 'deepfake_paris_floods.jpg',
    label: 'Deepfake Sample',
    type: 'FAKE' as const,
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80',
    description: 'AI diffusion render with shadow discordance.',
  },
  {
    name: 'authentic_telescope_photo.jpg',
    label: 'Authentic Photo Sample',
    type: 'REAL' as const,
    url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=800&auto=format&fit=crop&q=80',
    description: 'Genuine camera sensor exposure.',
  }
];

export const ImageScanScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [selectedImage, setSelectedImage] = useState<{
    uri: string;
    name: string;
    isSampleFake?: boolean;
    isSampleReal?: boolean;
  } | null>(null);
  const [scanning, setScanning] = useState(false);

  const { currentUser } = useAuth();
  const { addScan } = useHistory();

  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll permissions are required to select photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedImage({
        uri: asset.uri,
        name: asset.fileName || 'photo_upload.jpg',
      });
    }
  };

  const takePhotoWithCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permissions are required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedImage({
        uri: asset.uri,
        name: 'camera_capture.jpg',
      });
    }
  };

  const handleSelectSample = (sample: typeof SAMPLE_IMAGES[0]) => {
    setSelectedImage({
      uri: sample.url,
      name: sample.name,
      isSampleFake: sample.type === 'FAKE',
      isSampleReal: sample.type === 'REAL',
    });
  };

  const handleScan = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please pick or take a photo first.');
      return;
    }

    setScanning(true);

    try {
      const res = await api.post('/verify/image', {
        name: selectedImage.name,
        dataUrl: selectedImage.uri,
        isSampleFake: selectedImage.isSampleFake,
        isSampleReal: selectedImage.isSampleReal,
        email: currentUser?.email || 'demo@example.com',
      });

      setScanning(false);

      if (res.success && res.result) {
        addScan(res.result);
        navigation.navigate('Result', { result: res.result });
      } else {
        Alert.alert('Scan Failed', res.error || 'Could not verify image.');
      }
    } catch (err: any) {
      setScanning(false);
      Alert.alert('Error', 'Could not reach image verification server.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Image Forensics</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Upload / Preview Card */}
        <View style={styles.card}>
          {!selectedImage ? (
            <View style={styles.pickerBox}>
              <View style={styles.pickerIconCircle}>
                <Ionicons name="scan" size={32} color="#818cf8" />
              </View>

              <Text style={styles.pickerTitle}>Select Image to Investigate</Text>
              <Text style={styles.pickerSub}>
                Upload or capture photos to run AI artifact & error level analysis.
              </Text>

              <View style={styles.pickerActions}>
                <TouchableOpacity style={styles.galleryBtn} onPress={pickImageFromGallery}>
                  <Ionicons name="images" size={18} color="#FFFFFF" />
                  <Text style={styles.galleryText}>Photo Library</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cameraBtn} onPress={takePhotoWithCamera}>
                  <Ionicons name="camera" size={18} color="#090D16" />
                  <Text style={styles.cameraText}>Take Photo</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.previewBox}>
              <View style={styles.imageWrapper}>
                <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} resizeMode="contain" />
                <TouchableOpacity style={styles.removeBtn} onPress={() => setSelectedImage(null)}>
                  <Ionicons name="close-circle" size={24} color="#f43f5e" />
                </TouchableOpacity>
              </View>

              <View style={styles.previewMeta}>
                <Ionicons name="image-outline" size={14} color="#818cf8" />
                <Text style={styles.metaText} numberOfLines={1}>{selectedImage.name}</Text>
              </View>

              <View style={styles.previewActions}>
                <TouchableOpacity style={styles.changeBtn} onPress={pickImageFromGallery}>
                  <Text style={styles.changeText}>Change Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.scanBtn, scanning && styles.btnDisabled]}
                  onPress={handleScan}
                  disabled={scanning}
                >
                  {scanning ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="search" size={16} color="#FFFFFF" />
                      <Text style={styles.scanBtnText}>Verify Image</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Demo Test Images */}
        <Text style={styles.sampleHeader}>Demo Test Samples (Tap to load):</Text>

        <View style={styles.samplesList}>
          {SAMPLE_IMAGES.map((sample, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.sampleCard}
              onPress={() => handleSelectSample(sample)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: sample.url }} style={styles.sampleThumb} />
              <View style={styles.sampleInfo}>
                <View style={styles.sampleTopRow}>
                  <Text
                    style={[
                      styles.sampleBadgeText,
                      { color: sample.type === 'REAL' ? '#34d399' : '#fb7185' },
                    ]}
                  >
                    {sample.label}
                  </Text>
                  <Text style={styles.loadText}>Load ↗</Text>
                </View>
                <Text style={styles.sampleDesc} numberOfLines={1}>{sample.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#0F1626',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  pickerBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  pickerIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  pickerSub: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
    lineHeight: 16,
  },
  pickerActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  galleryBtn: {
    flex: 1,
    height: 46,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  galleryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cameraBtn: {
    flex: 1,
    height: 46,
    backgroundColor: '#818cf8',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cameraText: {
    color: '#090D16',
    fontSize: 13,
    fontWeight: '800',
  },
  previewBox: {
    gap: 12,
  },
  imageWrapper: {
    position: 'relative',
    height: 220,
    backgroundColor: '#090D16',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#090D16',
    borderRadius: 14,
  },
  previewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: '#cbd5e1',
    flex: 1,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 10,
  },
  changeBtn: {
    flex: 1,
    height: 46,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  scanBtn: {
    flex: 1.5,
    height: 46,
    backgroundColor: '#818cf8',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  scanBtnText: {
    color: '#090D16',
    fontSize: 13,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  sampleHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 10,
  },
  samplesList: {
    gap: 10,
  },
  sampleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1626',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  sampleThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  sampleInfo: {
    flex: 1,
  },
  sampleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sampleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  loadText: {
    fontSize: 11,
    color: '#818cf8',
    fontWeight: '700',
  },
  sampleDesc: {
    fontSize: 11,
    color: '#94a3b8',
  },
});
