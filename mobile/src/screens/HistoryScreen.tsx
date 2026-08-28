import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  Image, 
  Modal, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHistory } from '../context/HistoryContext';
import { useAuth } from '../context/AuthContext';
import { ScoreBadge } from '../components/ScoreBadge';
import { ForensicSignals } from '../components/ForensicSignals';
import { VerificationResult } from '../types';

export const HistoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { history, removeScan, clearAll, refreshHistory } = useHistory();
  const { currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'TEXT' | 'IMAGE' | 'REAL' | 'FAKE'>('ALL');
  const [selectedScan, setSelectedScan] = useState<VerificationResult | null>(null);

  const filteredHistory = history.filter((item) => {
    if (filter === 'TEXT' && item.type !== 'TEXT') return false;
    if (filter === 'IMAGE' && item.type !== 'IMAGE') return false;
    if (filter === 'REAL' && item.verdict !== 'REAL') return false;
    if (filter === 'FAKE' && item.verdict !== 'FAKE') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.preview?.toLowerCase().includes(q) ||
        item.explanation?.toLowerCase().includes(q) ||
        item.verdict.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDelete = (id: string) => {
    Alert.alert('Delete Record', 'Are you sure you want to delete this scan?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeScan(id) },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert('Clear History', 'Are you sure you want to clear your entire verification history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: () => clearAll() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Scan History</Text>
            <Text style={styles.subTitle}>
              Saved records for <Text style={styles.emailHighlight}>{currentUser?.name || 'Puneeth'}</Text>
            </Text>
          </View>

          {history.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
              <Ionicons name="trash-outline" size={16} color="#f43f5e" />
            </TouchableOpacity>
          )}
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search scans..."
            placeholderTextColor="#475569"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filter Pills */}
        <View style={styles.filtersRow}>
          {(['ALL', 'TEXT', 'IMAGE', 'REAL', 'FAKE'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="time-outline" size={48} color="#334155" />
              <Text style={styles.emptyTitle}>No Scans Found</Text>
              <Text style={styles.emptySub}>
                {search || filter !== 'ALL'
                  ? 'No scans match your active filters.'
                  : 'You have not performed any verifications yet.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isImage = item.type === 'IMAGE';
            const isReal = item.verdict === 'REAL';

            return (
              <TouchableOpacity
                style={styles.itemCard}
                onPress={() => setSelectedScan(item)}
                activeOpacity={0.8}
              >
                <View style={styles.itemTop}>
                  <View style={styles.itemTypeRow}>
                    <Ionicons
                      name={isImage ? 'image' : 'document-text'}
                      size={14}
                      color={isImage ? '#818cf8' : '#06b6d4'}
                    />
                    <Text style={[styles.itemTypeText, { color: isImage ? '#818cf8' : '#06b6d4' }]}>
                      {item.type}
                    </Text>
                    <Text style={styles.itemTime}>• {item.formattedDate}</Text>
                  </View>

                  <ScoreBadge score={item.score} verdict={item.verdict} size="sm" />
                </View>

                <View style={styles.itemBody}>
                  {isImage && item.imageUrl && (
                    <Image source={{ uri: item.imageUrl }} style={styles.itemThumb} />
                  )}
                  <View style={styles.itemContent}>
                    <Text style={styles.itemPreview} numberOfLines={2}>{item.preview}</Text>
                    <Text style={styles.itemExplanation} numberOfLines={1}>{item.explanation}</Text>
                  </View>
                </View>

                <View style={styles.itemFooter}>
                  <Text style={styles.confidenceText}>Confidence: {item.confidence}%</Text>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="trash-outline" size={14} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {/* Modal for inspection */}
        {selectedScan && (
          <Modal visible={true} transparent={true} animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedScan.type} Archive</Text>
                  <TouchableOpacity onPress={() => setSelectedScan(null)}>
                    <Ionicons name="close" size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                  <ScoreBadge score={selectedScan.score} verdict={selectedScan.verdict} size="md" />

                  <Text style={styles.modalSubHeader}>Forensic Reasoning</Text>
                  <Text style={styles.modalReasoning}>{selectedScan.explanation}</Text>

                  <Text style={styles.modalSubHeader}>Neural Signals</Text>
                  <ForensicSignals signals={selectedScan.signals} />
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  subTitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  emailHighlight: {
    color: '#06b6d4',
    fontWeight: '700',
  },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#0F1626',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1626',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#0F1626',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  filterPillActive: {
    backgroundColor: '#06b6d4',
    borderColor: '#06b6d4',
  },
  filterText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
  },
  filterTextActive: {
    color: '#090D16',
  },
  listContent: {
    paddingBottom: 24,
    gap: 10,
  },
  itemCard: {
    backgroundColor: '#0F1626',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTypeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  itemTime: {
    fontSize: 10,
    color: '#64748b',
  },
  itemBody: {
    flexDirection: 'row',
    gap: 10,
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  itemContent: {
    flex: 1,
  },
  itemPreview: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 18,
    marginBottom: 2,
  },
  itemExplanation: {
    fontSize: 11,
    color: '#94a3b8',
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 8,
    marginTop: 8,
  },
  confidenceText: {
    fontSize: 10,
    color: '#64748b',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0F1626',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  modalScroll: {
    paddingBottom: 20,
    gap: 12,
  },
  modalSubHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38bdf8',
    textTransform: 'uppercase',
    marginTop: 6,
  },
  modalReasoning: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
  },
});
