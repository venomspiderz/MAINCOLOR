import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, Dimensions, ScrollView, Share, Platform } from 'react-native';
import { X, Share2, Plus } from 'lucide-react-native';
import { RecipeGenerator } from './RecipeGenerator';
import { PaletteSelector } from './PaletteSelector';
import { rgbToLab, labToRgb, needsColorCorrection, hexToRgb } from '@/utils/colorConversion';
import { findClosestColorName } from '@/utils/colorDatabase';
import { colorStorage } from '@/services/colorStorage';

interface ColorAnalyzerProps {
  color: string;
  visible: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export const ColorAnalyzer: React.FC<ColorAnalyzerProps> = ({ color, visible, onClose }) => {
  const [showRecipe, setShowRecipe] = useState(false);
  const [showPaletteSelector, setShowPaletteSelector] = useState(false);
  const [colorName, setColorName] = useState('Loading...');
  const [needsCorrection, setNeedsCorrection] = useState(false);
  const [palettes, setPalettes] = useState<Array<{ id: string; name: string; colors: string[] }>>([]);
  const isMounted = useRef(true);
  const hasInitialized = useRef(false);
  
  const rgb = color ? hexToRgb(color) : null;
  const lab = rgb ? rgbToLab(rgb.r, rgb.g, rgb.b) : null;

  useEffect(() => {
    if (!visible || !color || !lab || hasInitialized.current) return;

    const initializeColor = async () => {
      try {
        const name = findClosestColorName(lab);
        await colorStorage.saveColor({
          id: Date.now().toString(),
          hex: color,
          name,
          createdAt: new Date().toISOString(),
          lab
        });
        
        if (isMounted.current) {
          setColorName(name);
          const requiresCorrection = needsColorCorrection(1.8);
          setNeedsCorrection(requiresCorrection);
          
          const storedPalettes = await colorStorage.getAllPalettes();
          setPalettes(storedPalettes);
          
          hasInitialized.current = true;
        }
      } catch (error) {
        console.error('Error initializing color:', error);
      }
    };

    initializeColor();
  }, [visible, color, lab]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      hasInitialized.current = false;
    };
  }, []);
  
  const handleShare = async () => {
    try {
      const message = `Check out this color!\n\nName: ${colorName}\nHex: ${color}\nRGB: ${rgb?.r}, ${rgb?.g}, ${rgb?.b}`;
      
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(message);
        alert('Color information copied to clipboard!');
      } else {
        await Share.share({
          message,
          title: 'Share Color',
        });
      }
    } catch (error) {
      console.error('Error sharing color:', error);
    }
  };
  
  const handleAddToPalette = () => {
    setShowPaletteSelector(true);
  };

  const handleSelectPalette = async (paletteId: string, isNew: boolean, name?: string) => {
    try {
      if (isNew && name) {
        const newPalette = {
          id: Date.now().toString(),
          name,
          colors: [color],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await colorStorage.savePalette(newPalette);
      } else {
        await colorStorage.addColorToPalette(paletteId, color);
      }
      
      const updatedPalettes = await colorStorage.getAllPalettes();
      setPalettes(updatedPalettes);
      
      setShowPaletteSelector(false);
    } catch (error) {
      console.error('Error adding color to palette:', error);
    }
  };

  const handleClose = () => {
    hasInitialized.current = false;
    onClose();
  };

  if (!rgb || !lab) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Color Analysis</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X size={24} color="#000000" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollContent}>
            <View style={styles.colorPreviewContainer}>
              <View style={[styles.colorPreview, { backgroundColor: color }]} />
              <Text style={styles.colorName}>{colorName}</Text>
              <Text style={styles.colorHex}>{color}</Text>
              {needsCorrection && (
                <View style={styles.correctionBadge}>
                  <Text style={styles.correctionText}>Color Correction Recommended</Text>
                </View>
              )}
            </View>
            
            <View style={styles.colorDataContainer}>
              <View style={styles.dataRow}>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>RGB</Text>
                  <Text style={styles.dataValue}>
                    {`${rgb.r}, ${rgb.g}, ${rgb.b}`}
                  </Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>LAB</Text>
                  <Text style={styles.dataValue}>
                    {`${Math.round(lab.l)}, ${Math.round(lab.a)}, ${Math.round(lab.b)}`}
                  </Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.recipeButton}
              onPress={() => setShowRecipe(!showRecipe)}
            >
              <Text style={styles.recipeButtonText}>
                {showRecipe ? 'Hide Recipe' : 'Generate Paint Recipe'}
              </Text>
            </TouchableOpacity>
            
            {showRecipe && (
              <RecipeGenerator color={color} lab={lab} />
            )}
          </ScrollView>
          
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleAddToPalette}
            >
              <Plus size={24} color="#0A84FF" />
              <Text style={styles.actionText}>Add to Palette</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
            >
              <Share2 size={24} color="#0A84FF" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <PaletteSelector
        visible={showPaletteSelector}
        onClose={() => setShowPaletteSelector(false)}
        onSelectPalette={handleSelectPalette}
        palettes={palettes}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  scrollContent: {
    flexGrow: 0,
  },
  colorPreviewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  colorPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  colorName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  colorHex: {
    fontSize: 16,
    color: '#666',
  },
  correctionBadge: {
    backgroundColor: '#FFE58F',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: 10,
  },
  correctionText: {
    color: '#D48806',
    fontSize: 14,
  },
  colorDataContainer: {
    marginBottom: 20,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dataItem: {
    flex: 1,
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  dataValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  recipeButton: {
    backgroundColor: '#0A84FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  recipeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  actionButton: {
    alignItems: 'center',
    padding: 10,
  },
  actionText: {
    color: '#0A84FF',
    marginTop: 5,
    fontSize: 14,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
});