import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { ColorPaletteCard } from '@/components/ColorPaletteCard';
import { useState, useEffect } from 'react';
import { colorStorage } from '@/services/colorStorage';

export default function PalettesScreen() {
  const [palettes, setPalettes] = useState<Array<{
    id: string;
    name: string;
    colors: string[];
    date: string;
  }>>([]);

  useEffect(() => {
    loadPalettes();
    
    // Subscribe to palette changes
    const unsubscribe = colorStorage.onPalettesChange(loadPalettes);
    
    return () => unsubscribe();
  }, []);

  const loadPalettes = async () => {
    try {
      const storedPalettes = await colorStorage.getAllPalettes();
      setPalettes(storedPalettes.map(palette => ({
        ...palette,
        date: new Date(palette.updatedAt).toLocaleDateString()
      })));
    } catch (error) {
      console.error('Error loading palettes:', error);
    }
  };

  const renderPalette = ({ item }) => (
    <ColorPaletteCard palette={item} onUpdate={loadPalettes} />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Palettes</Text>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={24} color="#0A84FF" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={palettes}
        renderItem={renderPalette}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
});