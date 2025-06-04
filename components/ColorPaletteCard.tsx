import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MoveHorizontal as MoreHorizontal } from 'lucide-react-native';
import { ColorAnalyzer } from './ColorAnalyzer';
import { useState } from 'react';

interface PaletteProps {
  id: string;
  name: string;
  colors: string[];
  date: string;
}

interface ColorPaletteCardProps {
  palette: PaletteProps;
  onUpdate: () => void;
}

export const ColorPaletteCard: React.FC<ColorPaletteCardProps> = ({ palette, onUpdate }) => {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [colorAnalyzerVisible, setColorAnalyzerVisible] = useState(false);

  const handleColorPress = (color: string) => {
    setSelectedColor(color);
    setColorAnalyzerVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{palette.name}</Text>
        <TouchableOpacity style={styles.menuButton}>
          <MoreHorizontal size={20} color="#8E8E93" />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.colorsContainer}
      >
        {palette.colors.map((color, index) => (
          <TouchableOpacity 
            key={index}
            onPress={() => handleColorPress(color)}
            style={styles.colorTouchable}
          >
            <View 
              style={[
                styles.colorSwatch, 
                { backgroundColor: color }
              ]} 
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <Text style={styles.dateText}>{palette.date}</Text>

      {selectedColor && (
        <ColorAnalyzer
          color={selectedColor}
          visible={colorAnalyzerVisible}
          onClose={() => setColorAnalyzerVisible(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  menuButton: {
    padding: 4,
  },
  colorsContainer: {
    flexDirection: 'row',
    paddingBottom: 4,
    gap: 8,
  },
  colorTouchable: {
    width: 60,
    aspectRatio: 1,
  },
  colorSwatch: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  dateText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 12,
  },
});