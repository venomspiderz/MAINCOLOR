import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { ColorAnalyzer } from './ColorAnalyzer';

interface ColorHistoryItemProps {
  item: {
    id: string;
    color: string;
    name: string;
    date: string;
    location?: string;
  };
  onUpdate: () => void;
}

export const ColorHistoryItem: React.FC<ColorHistoryItemProps> = ({ item, onUpdate }) => {
  const [showAnalyzer, setShowAnalyzer] = useState(false);

  return (
    <>
      <TouchableOpacity 
        style={styles.container}
        onPress={() => setShowAnalyzer(true)}
      >
        <View style={[styles.colorSwatch, { backgroundColor: item.color }]} />
        
        <View style={styles.infoContainer}>
          <Text style={styles.colorName}>{item.name}</Text>
          <Text style={styles.colorInfo}>
            {item.location ? `${item.location} • ` : ''}{item.date}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.addButton}>
          <Plus size={20} color="#0A84FF" />
        </TouchableOpacity>
      </TouchableOpacity>

      <ColorAnalyzer
        color={item.color}
        visible={showAnalyzer}
        onClose={() => setShowAnalyzer(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  infoContainer: {
    flex: 1,
  },
  colorName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  colorInfo: {
    fontSize: 14,
    color: '#8E8E93',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
});