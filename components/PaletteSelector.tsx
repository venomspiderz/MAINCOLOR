import { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  FlatList, 
  Modal, 
  KeyboardAvoidingView, 
  Platform
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Plus } from 'lucide-react-native';

interface PaletteSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectPalette: (paletteId: string, isNew: boolean, name?: string) => void;
  palettes: Array<{
    id: string;
    name: string;
    colors: string[];
  }>;
}

export function PaletteSelector({ visible, onClose, onSelectPalette, palettes }: PaletteSelectorProps) {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPaletteName, setNewPaletteName] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible && isCreatingNew) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible, isCreatingNew]);

  const handleCreateNew = () => {
    if (newPaletteName.trim()) {
      onSelectPalette('', true, newPaletteName.trim());
      setNewPaletteName('');
      setIsCreatingNew(false);
    }
  };

  const handleCancel = () => {
    setIsCreatingNew(false);
    setNewPaletteName('');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Add to Palette</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          {isCreatingNew ? (
            <View style={styles.createNewContainer}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Enter palette name"
                value={newPaletteName}
                onChangeText={setNewPaletteName}
                placeholderTextColor="#8E8E93"
                returnKeyType="done"
                onSubmitEditing={handleCreateNew}
              />
              <View style={styles.createNewButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.createButton,
                    !newPaletteName.trim() && styles.createButtonDisabled
                  ]}
                  onPress={handleCreateNew}
                  disabled={!newPaletteName.trim()}
                >
                  <Text style={styles.createButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.createNewButton}
              onPress={() => setIsCreatingNew(true)}
            >
              <Plus size={24} color="#0A84FF" />
              <Text style={styles.createNewText}>Create New Palette</Text>
            </TouchableOpacity>
          )}

          <FlatList
            data={palettes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.paletteItem}
                onPress={() => onSelectPalette(item.id, false)}
              >
                <View style={styles.paletteInfo}>
                  <Text style={styles.paletteName}>{item.name}</Text>
                  <Text style={styles.paletteCount}>
                    {item.colors.length} colors
                  </Text>
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.palettePreview}
                >
                  {item.colors.map((color, index) => (
                    <View
                      key={index}
                      style={[styles.colorPreview, { backgroundColor: color }]}
                    />
                  ))}
                </ScrollView>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F2F2F7',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  createNewText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#0A84FF',
    fontWeight: '500',
  },
  createNewContainer: {
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: '#000000',
  },
  createNewButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    marginRight: 12,
    padding: 8,
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#0A84FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  paletteItem: {
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  paletteInfo: {
    marginBottom: 8,
  },
  paletteName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  paletteCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  palettePreview: {
    flexDirection: 'row',
  },
  colorPreview: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
});