import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { generatePaintRecipe } from '@/utils/paintMixer';

interface RecipeGeneratorProps {
  color: string;
  lab: {
    l: number;
    a: number;
    b: number;
  };
}

export const RecipeGenerator: React.FC<RecipeGeneratorProps> = ({ color, lab }) => {
  const [loading, setLoading] = useState(true);
  const [recipe, setRecipe] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!lab || typeof lab.l !== 'number' || typeof lab.a !== 'number' || typeof lab.b !== 'number') {
      setError('Invalid color values provided');
      setLoading(false);
      return;
    }

    try {
      const result = generatePaintRecipe(lab, {
        maxPaints: 4,
        preferCostEffective: true,
        allowColorCorrection: true
      });
      
      setRecipe(result);
      setLoading(false);
    } catch (err) {
      setError('Failed to generate paint recipe');
      setLoading(false);
    }
  }, [lab]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A84FF" />
        <Text style={styles.loadingText}>Calculating optimal paint mix...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Paint Recipe</Text>
      <Text style={styles.subtitle}>
        Mix the following paints to create this color:
        {recipe.requiresColorCorrection && ' (Color correction applied)'}
      </Text>
      
      {recipe.paints.map((item: any, index: number) => (
        <View key={index} style={styles.recipeItem}>
          <View 
            style={[
              styles.colorSwatch,
              { backgroundColor: item.paint.hex }
            ]} 
          />
          <View style={styles.paintInfo}>
            <Text style={styles.paintName}>{item.paint.name}</Text>
            <Text style={styles.paintPercentage}>
              {item.percentage}%
            </Text>
          </View>
          <View 
            style={[
              styles.percentageBar,
              { width: `${item.percentage}%` }
            ]} 
          />
        </View>
      ))}
      
      <View style={styles.accuracyContainer}>
        <Text style={styles.accuracyLabel}>Color Match Accuracy</Text>
        <Text style={styles.accuracyValue}>
          ΔE: {recipe.deltaE.toFixed(2)}
          {recipe.deltaE < 1 ? ' (Excellent)' :
           recipe.deltaE < 2 ? ' (Good)' :
           recipe.deltaE < 3 ? ' (Fair)' : ' (Approximate)'}
        </Text>
      </View>
      
      <Text style={styles.disclaimer}>
        Note: Results may vary based on paint brand and type. Adjust as needed for desired outcome.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFE5E5',
    borderRadius: 12,
    marginHorizontal: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
  },
  recipeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  paintInfo: {
    flex: 1,
    zIndex: 1,
  },
  paintName: {
    fontSize: 16,
    fontWeight: '500',
  },
  paintPercentage: {
    fontSize: 14,
    color: '#8E8E93',
  },
  percentageBar: {
    position: 'absolute',
    height: '100%',
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    borderRadius: 4,
    left: 0,
    zIndex: 0,
  },
  accuracyContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  accuracyLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  accuracyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  disclaimer: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 8,
  },
});