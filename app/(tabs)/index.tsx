import { useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, Image, Dimensions } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { WebView } from 'react-native-webview';
import { Camera, FlipVertical2, RefreshCw, Image as ImageIcon } from 'lucide-react-native';
import { ColorAnalyzer } from '@/components/ColorAnalyzer';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [colorAnalyzerVisible, setColorAnalyzerVisible] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<{
    uri: string;
    width: number;
    height: number;
    base64?: string;
  } | null>(null);
  const cameraRef = useRef(null);
  const webViewRef = useRef(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to use the camera
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: true,
        exif: false,
      });

      setCapturedPhoto({
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
        base64: photo.base64,
      });
    } catch (error) {
      console.error('Error capturing photo:', error);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.images,
        quality: 1,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setCapturedPhoto({
          uri: asset.uri,
          width: asset.width || 0,
          height: asset.height || 0,
          base64: asset.base64,
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'color') {
        setSelectedColor(data.hex);
        setColorAnalyzerVisible(true);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setSelectedColor(null);
    setColorAnalyzerVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {capturedPhoto ? (
        <View style={styles.imageContainer}>
          {Platform.OS === 'web' ? (
            <Image
              source={{ uri: capturedPhoto.uri }}
              style={styles.capturedImage}
              resizeMode="contain"
            />
          ) : (
            <WebView
              ref={webViewRef}
              source={require('../../assets/image_pixel_extractor.html')}
              style={styles.capturedImage}
              onMessage={handleWebViewMessage}
              onLoad={() => {
                if (capturedPhoto?.base64 && webViewRef.current) {
                  webViewRef.current.postMessage(JSON.stringify({
                    type: 'image',
                    base64: capturedPhoto.base64,
                    width: capturedPhoto.width,
                    height: capturedPhoto.height
                  }));
                }
              }}
              scrollEnabled={false}
              bounces={false}
              javaScriptEnabled={true}
              originWhitelist={['*']}
            />
          )}
          <Text style={styles.tapInstructions}>
            Tap anywhere on the image to analyze the color
          </Text>
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={handleRetake}>
            <RefreshCw size={24} color="white" />
            <Text style={styles.retakeButtonText}>Retake</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}>
            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.flipButton}
                onPress={toggleCameraFacing}>
                <FlipVertical2 color="white" size={24} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCapture}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.flipButton}
                onPress={handlePickImage}>
                <ImageIcon color="white" size={24} />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      )}
      
      {colorAnalyzerVisible && selectedColor && (
        <ColorAnalyzer
          color={selectedColor}
          visible={colorAnalyzerVisible}
          onClose={() => setColorAnalyzerVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  flipButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
  },
  message: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginHorizontal: 30,
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#0A84FF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  capturedImage: {
    flex: 1,
    width: SCREEN_WIDTH,
    backgroundColor: '#000',
  },
  tapInstructions: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    fontSize: 14,
  },
  retakeButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  retakeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});