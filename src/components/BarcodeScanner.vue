<template>
  <q-dialog v-model="isOpen" persistent>
    <BaseCard 
      variant="glass-modern" 
      class="scanner-card" 
      style="min-width: 500px; max-width: 600px;"
      title="Scan Barcode"
      icon="qr_code_scanner"
      icon-color="primary"
      header-color="primary"
    >
      <template #header-actions>
        <q-btn-group>
          <q-btn
            :icon="scanMode === 'manual' ? 'keyboard' : 'qr_code_scanner'"
            :color="scanMode === 'manual' ? 'primary' : 'grey'"
            dense
            flat
            @click="toggleScanMode"
          />
          <q-btn
            v-if="cameraSupported"
            :icon="scanMode === 'camera' ? 'videocam' : 'videocam_off'"
            :color="scanMode === 'camera' ? 'primary' : 'grey'"
            dense
            flat
            @click="toggleCamera"
          />
        </q-btn-group>
        <q-btn icon="close" flat round dense v-close-popup />
      </template>
        <!-- Camera Mode -->
        <div v-if="scanMode === 'camera'" class="camera-section">
          <div class="camera-container">
            <video
              ref="videoElement"
              class="camera-video"
              autoplay
              playsinline
            ></video>
            <div class="camera-overlay">
              <div class="scan-frame"></div>
            </div>
            <div class="camera-controls">
              <q-btn
                v-if="torchSupported"
                :icon="torchEnabled ? 'flash_on' : 'flash_off'"
                round
                :color="torchEnabled ? 'amber' : 'grey'"
                @click="toggleTorch"
              />
              <q-btn
                icon="camera_alt"
                round
                color="primary"
                @click="focusCamera"
              />
              <q-btn
                v-if="availableCameras.length > 1"
                icon="flip_camera_android"
                round
                color="primary"
                @click="switchCamera"
              />
            </div>
          </div>

          <q-linear-progress
            v-if="cameraLoading"
            indeterminate
            color="primary"
            class="q-mt-md"
          />

          <div v-if="cameraError" class="text-negative q-mt-md">
            {{ cameraError }}
          </div>
        </div>

        <!-- Manual Mode -->
        <div v-else class="manual-section">
          <q-input
            ref="manualInput"
            v-model="manualBarcode"
            :label="$t('bestellijsten.scanner.manualInput')"
            outlined
            autofocus
            @keyup.enter="handleManualScan"
            @input="onManualInput"
          >
            <template v-slot:prepend>
              <q-icon name="qr_code" />
            </template>
            <template v-slot:append>
              <q-btn
                icon="send"
                flat
                round
                dense
                :disable="!manualBarcode.trim()"
                @click="handleManualScan"
              />
            </template>
          </q-input>
        </div>

        <!-- Recent Scans -->
        <div v-if="recentScans.length > 0" class="q-mt-md">
          <div class="text-subtitle2 q-mb-sm">
            {{ $t('bestellijsten.scanner.recentScans') }}
          </div>
          <q-list dense>
            <q-item
              v-for="scan in recentScans.slice(0, 5)"
              :key="scan.code + scan.timestamp"
              clickable
              @click="selectRecentScan(scan)"
            >
              <q-item-section>
                <q-item-label>{{ scan.code }}</q-item-label>
                <q-item-label caption>
                  {{ formatTimestamp(scan.timestamp) }}
                  {{ scan.format ? `(${scan.format})` : '' }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-chip
                  v-if="scan.confidence"
                  :color="scan.confidence > 0.8 ? 'positive' : 'warning'"
                  text-color="white"
                  size="sm"
                >
                  {{ Math.round(scan.confidence * 100) }}%
                </q-chip>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- Help Text -->
        <div class="text-caption text-grey-6 q-mt-md">
          {{ $t('bestellijsten.scanner.help') }}
        </div>

      <template #actions>
        <q-btn flat :label="$t('common.cancel')" v-close-popup />
        <q-btn
          v-if="recentScans.length > 0"
          flat
          color="negative"
          :label="$t('bestellijsten.scanner.clearHistory')"
          @click="clearScanHistory"
        />
      </template>
    </BaseCard>
  </q-dialog>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import BaseCard from 'src/components/base/BaseCard.vue';
  import {
    cameraScannerService,
    type ScanResult,
    type CameraDevice,
  } from '@/services/cameraScanner';
  import { notificationService } from '@/services/notifications';

  // Props & Emits
  interface Props {
    modelValue: boolean;
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void;
    (e: 'scan', code: string): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  // Composables
  const { t } = useI18n();

  // Refs
  const videoElement = ref<HTMLVideoElement>();
  const manualInput = ref();
  const manualBarcode = ref('');
  const scanMode = ref<'manual' | 'camera'>('manual');
  const cameraLoading = ref(false);
  const cameraError = ref('');
  const torchEnabled = ref(false);
  const torchSupported = ref(false);
  const availableCameras = ref<CameraDevice[]>([]);
  const currentCameraIndex = ref(0);
  const recentScans = ref<ScanResult[]>([]);

  // Computed
  const isOpen = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value),
  });

  const cameraSupported = computed(() =>
    cameraScannerService.isCameraSupported()
  );

  // Methods
  const toggleScanMode = () => {
    if (scanMode.value === 'manual') {
      scanMode.value = 'camera';
      if (cameraSupported.value) {
        startCamera();
      }
    } else {
      scanMode.value = 'manual';
      stopCamera();
      nextTick(() => {
        manualInput.value?.focus();
      });
    }
  };

  const toggleCamera = () => {
    if (scanMode.value === 'camera') {
      scanMode.value = 'manual';
      stopCamera();
    } else {
      scanMode.value = 'camera';
      startCamera();
    }
  };

  const startCamera = async () => {
    if (!videoElement.value || !cameraSupported.value) return;

    try {
      cameraLoading.value = true;
      cameraError.value = '';

      // Get available cameras
      availableCameras.value = await cameraScannerService.getAvailableDevices();

      // Set scan result callback
      cameraScannerService.setOnScanResult(handleCameraScan);

      // Start scanning with current camera
      const currentCamera = availableCameras.value[currentCameraIndex.value];
      const scannerOptions: any = {
        facingMode: 'environment',
      };

      // Only add deviceId if it exists
      if (currentCamera?.deviceId) {
        scannerOptions.deviceId = currentCamera.deviceId;
      }

      await cameraScannerService.startScanning(
        videoElement.value,
        scannerOptions
      );

      // Check torch support
      const capabilities = cameraScannerService.getCameraCapabilities();
      torchSupported.value = capabilities ? 'torch' in capabilities : false;
    } catch (error) {
      console.error('Failed to start camera:', error);
      cameraError.value =
        error instanceof Error ? error.message : t('camera.errors.cameraError');

      // Show notification
      notificationService.sendSystemNotification(
        t('camera.errors.cameraError'),
        'Failed to start camera. Please check permissions.'
      );
    } finally {
      cameraLoading.value = false;
    }
  };

  const stopCamera = () => {
    cameraScannerService.stopScanning();
    torchEnabled.value = false;
  };

  const switchCamera = async () => {
    if (availableCameras.value.length <= 1) return;

    currentCameraIndex.value =
      (currentCameraIndex.value + 1) % availableCameras.value.length;

    if (scanMode.value === 'camera' && videoElement.value) {
      const currentCamera = availableCameras.value[currentCameraIndex.value];
      if (currentCamera && currentCamera.deviceId) {
        await cameraScannerService.switchCamera(currentCamera.deviceId);
      }
    }
  };

  const toggleTorch = async () => {
    if (!torchSupported.value) return;

    try {
      const newState = await cameraScannerService.toggleTorch();
      torchEnabled.value = newState;
    } catch (error) {
      console.error('Failed to toggle torch:', error);
    }
  };

  const focusCamera = async () => {
    try {
      await cameraScannerService.focusCamera();
    } catch (error) {
      console.error('Failed to focus camera:', error);
    }
  };

  const handleCameraScan = (result: ScanResult) => {
    handleScanResult(result.code, result.format);
  };

  const handleManualScan = () => {
    if (!manualBarcode.value.trim()) return;

    handleScanResult(manualBarcode.value.trim());
    manualBarcode.value = '';
  };

  const onManualInput = () => {
    // Auto-scan when barcode looks complete (common barcode lengths)
    const code = manualBarcode.value.trim();
    if (
      code.length === 8 ||
      code.length === 12 ||
      code.length === 13 ||
      code.length === 14
    ) {
      // Small delay to allow for more input
      setTimeout(() => {
        if (manualBarcode.value.trim() === code) {
          handleManualScan();
        }
      }, 500);
    }
  };

  const handleScanResult = (code: string, format?: string) => {
    // Create scan result
    const scanResult: ScanResult = {
      code,
      format: format || 'Manual',
      timestamp: new Date(),
      confidence: format ? 0.95 : 1.0,
    };

    // Add to recent scans
    recentScans.value = [
      scanResult,
      ...recentScans.value.filter(s => s.code !== code).slice(0, 9),
    ];

    // Save to camera scanner service
    if (format) {
      // This was a camera scan, the service will handle saving
    } else {
      // Manual scan, save to localStorage
      saveScanHistory();
    }

    // Emit scan event
    emit('scan', code);

    // Close dialog
    isOpen.value = false;

    // Show success notification
    notificationService.showInAppNotification({
      title: t('camera.scanning.scanSuccessful'),
      body: `Scanned: ${code}`,
      type: 'system_notification',
      icon: '/icons/success.png',
    });
  };

  const selectRecentScan = (scan: ScanResult) => {
    handleScanResult(scan.code, scan.format);
  };

  const clearScanHistory = () => {
    recentScans.value = [];
    cameraScannerService.clearScanHistory();
    saveScanHistory();
  };

  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();

    if (diff < 60000) {
      // Less than 1 minute
      return t('camera.scanning.justNow');
    } else if (diff < 3600000) {
      // Less than 1 hour
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) {
      // Less than 1 day
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  const saveScanHistory = () => {
    try {
      localStorage.setItem(
        'manual_scan_history',
        JSON.stringify(recentScans.value)
      );
    } catch (error) {
      console.error('Failed to save scan history:', error);
    }
  };

  const loadScanHistory = () => {
    try {
      const saved = localStorage.getItem('manual_scan_history');
      if (saved) {
        const history = JSON.parse(saved);
        recentScans.value = history.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
      }

      // Merge with camera scan history
      const cameraHistory = cameraScannerService.getScanHistory();
      const allScans = [...recentScans.value, ...cameraHistory]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 20); // Keep only recent 20

      recentScans.value = allScans;
    } catch (error) {
      console.error('Failed to load scan history:', error);
    }
  };

  // Watch for dialog open/close
  watch(isOpen, newValue => {
    if (newValue) {
      loadScanHistory();
      if (scanMode.value === 'manual') {
        nextTick(() => {
          manualInput.value?.focus();
        });
      }
    } else {
      stopCamera();
      manualBarcode.value = '';
    }
  });

  // Lifecycle
  onMounted(() => {
    loadScanHistory();
  });

  onUnmounted(() => {
    stopCamera();
  });
</script>

<style scoped>
  .scanner-card {
    margin: 0 auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    border-radius: 12px;
  }

  .camera-section {
    position: relative;
  }

  .camera-container {
    position: relative;
    background: #000;
    border-radius: 8px;
    overflow: hidden;
    aspect-ratio: 4/3;
  }

  .camera-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .camera-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .scan-frame {
    width: 200px;
    height: 200px;
    border: 2px solid #fff;
    border-radius: 8px;
    box-shadow: 0 0 0 2000px rgba(0, 0, 0, 0.5);
    position: relative;
  }

  .scan-frame::before,
  .scan-frame::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border: 3px solid #4caf50;
  }

  .scan-frame::before {
    top: -3px;
    left: -3px;
    border-right: none;
    border-bottom: none;
  }

  .scan-frame::after {
    bottom: -3px;
    right: -3px;
    border-left: none;
    border-top: none;
  }

  .camera-controls {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 16px;
    z-index: 1;
  }

  .manual-section {
    min-height: 120px;
  }
</style>
