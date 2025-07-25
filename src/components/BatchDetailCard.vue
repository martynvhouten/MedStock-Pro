<template>
  <q-card class="batch-detail-card glass-card-modern">
    <q-card-section class="row items-center q-pb-none">
      <div class="text-h6">{{ $t('batch.batchDetails') }}</div>
      <q-space />
      <q-btn icon="close" flat round dense @click="$emit('close')" />
    </q-card-section>

    <q-card-section>
      <!-- Batch Header Info -->
      <div class="row q-gutter-md q-mb-lg">
        <div class="col-12 col-md-6">
          <q-card flat class="info-card">
            <div class="text-subtitle2 text-grey q-mb-sm">
              {{ $t('batch.batchInformation') }}
            </div>
            <div class="row q-gutter-sm">
              <div class="col-12">
                <q-chip
                  icon="qr_code"
                  color="primary"
                  text-color="white"
                  size="md"
                >
                  {{ batch.batchNumber }}
                </q-chip>
                <q-chip
                  v-if="batch.supplierBatchNumber"
                  icon="business"
                  color="grey"
                  text-color="white"
                  size="sm"
                  class="q-ml-sm"
                >
                  {{ batch.supplierBatchNumber }}
                </q-chip>
              </div>
              <div class="col-12">
                <div class="text-weight-medium">{{ batch.productName }}</div>
                <div class="text-caption text-grey">{{ batch.productSku }}</div>
              </div>
              <div class="col-12">
                <q-chip
                  :color="getLocationColor(batch.locationType)"
                  text-color="white"
                  icon="location_on"
                  size="sm"
                >
                  {{ batch.locationName }}
                </q-chip>
              </div>
            </div>
          </q-card>
        </div>

        <div class="col-12 col-md-6">
          <q-card flat class="info-card neumorph-card">
            <div class="text-subtitle2 text-grey q-mb-sm">
              {{ $t('batch.quantityStatus') }}
            </div>
            <div class="row q-gutter-sm">
              <div class="col-6">
                <div class="text-caption text-grey">
                  {{ $t('batch.initialQuantity') }}
                </div>
                <div class="text-h6">
                  {{ formatQuantity(batch.initialQuantity) }}
                </div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey">
                  {{ $t('batch.currentQuantity') }}
                </div>
                <div class="text-h6">
                  {{ formatQuantity(batch.currentQuantity) }}
                </div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey">
                  {{ $t('batch.availableQuantity') }}
                </div>
                <div class="text-h6 text-green">
                  {{ formatQuantity(batch.availableQuantity) }}
                </div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey">
                  {{ $t('batch.reservedQuantity') }}
                </div>
                <div class="text-h6 text-orange">
                  {{ formatQuantity(batch.reservedQuantity || 0) }}
                </div>
              </div>
              <div class="col-12">
                <q-linear-progress
                  :value="batch.currentQuantity / batch.initialQuantity"
                  size="8px"
                  :color="
                    getQuantityColor(
                      batch.currentQuantity / batch.initialQuantity
                    )
                  "
                  class="q-mt-sm"
                />
              </div>
            </div>
          </q-card>
        </div>
      </div>

      <!-- Expiry and Status -->
      <div class="row q-gutter-md q-mb-lg">
        <div class="col-12 col-md-6">
          <q-card flat class="info-card">
            <div class="text-subtitle2 text-grey q-mb-sm">
              {{ $t('batch.expiryInformation') }}
            </div>
            <div class="row items-center q-gutter-sm">
              <q-icon
                :name="getExpiryIcon(batch.urgencyLevel)"
                :color="getExpiryColor(batch.urgencyLevel)"
                size="24px"
              />
              <div>
                <div class="text-weight-medium">
                  {{ formatDate(batch.expiryDate) }}
                </div>
                <div
                  class="text-caption"
                  :class="getExpiryTextClass(batch.urgencyLevel)"
                >
                  {{ getExpiryText(batch.daysUntilExpiry, batch.urgencyLevel) }}
                </div>
              </div>
            </div>
            <div class="q-mt-sm">
              <div class="text-caption text-grey">
                {{ $t('batch.receivedDate') }}
              </div>
              <div>{{ formatDate(batch.receivedDate) }}</div>
            </div>
          </q-card>
        </div>

        <div class="col-12 col-md-6">
          <q-card flat class="info-card">
            <div class="text-subtitle2 text-grey q-mb-sm">
              {{ $t('batch.statusInformation') }}
            </div>
            <div class="row items-center q-gutter-sm q-mb-sm">
              <q-chip
                :color="getStatusColor(batch.status)"
                text-color="white"
                size="md"
              >
                {{ $t(`batch.status.${batch.status}`) }}
              </q-chip>
              <q-chip
                v-if="batch.qualityCheckPassed"
                color="green"
                text-color="white"
                icon="verified"
                size="sm"
              >
                {{ $t('batch.qualityApproved') }}
              </q-chip>
            </div>
            <div v-if="batch.quarantineUntil" class="q-mt-sm">
              <div class="text-caption text-grey">
                {{ $t('batch.quarantineUntil') }}
              </div>
              <div class="text-orange">
                {{ formatDate(batch.quarantineUntil) }}
              </div>
            </div>
          </q-card>
        </div>
      </div>

      <!-- Cost Information -->
      <div class="row q-gutter-md q-mb-lg" v-if="batch.unitCost">
        <div class="col-12">
          <q-card flat class="info-card">
            <div class="text-subtitle2 text-grey q-mb-sm">
              {{ $t('batch.costInformation') }}
            </div>
            <div class="row q-gutter-md">
              <div class="col-4">
                <div class="text-caption text-grey">
                  {{ $t('batch.unitCost') }}
                </div>
                <div class="text-h6">
                  {{ formatCurrency(batch.unitCost, batch.currency) }}
                </div>
              </div>
              <div class="col-4">
                <div class="text-caption text-grey">
                  {{ $t('batch.totalCost') }}
                </div>
                <div class="text-h6">
                  {{ formatCurrency(batch.totalCost, batch.currency) }}
                </div>
              </div>
              <div class="col-4">
                <div class="text-caption text-grey">
                  {{ $t('batch.currentValue') }}
                </div>
                <div class="text-h6">
                  {{
                    formatCurrency(
                      batch.currentQuantity * batch.unitCost,
                      batch.currency
                    )
                  }}
                </div>
              </div>
            </div>
          </q-card>
        </div>
      </div>

      <!-- Purchase Information -->
      <div
        class="row q-gutter-md q-mb-lg"
        v-if="batch.purchaseOrderNumber || batch.invoiceNumber"
      >
        <div class="col-12">
          <q-card flat class="info-card">
            <div class="text-subtitle2 text-grey q-mb-sm">
              {{ $t('batch.purchaseInformation') }}
            </div>
            <div class="row q-gutter-md">
              <div class="col-6" v-if="batch.purchaseOrderNumber">
                <div class="text-caption text-grey">
                  {{ $t('batch.purchaseOrderNumber') }}
                </div>
                <div>{{ batch.purchaseOrderNumber }}</div>
              </div>
              <div class="col-6" v-if="batch.invoiceNumber">
                <div class="text-caption text-grey">
                  {{ $t('batch.invoiceNumber') }}
                </div>
                <div>{{ batch.invoiceNumber }}</div>
              </div>
            </div>
          </q-card>
        </div>
      </div>

      <!-- Quality Notes -->
      <div class="row q-gutter-md q-mb-lg" v-if="batch.qualityNotes">
        <div class="col-12">
          <q-card flat class="info-card">
            <div class="text-subtitle2 text-grey q-mb-sm">
              {{ $t('batch.qualityNotes') }}
            </div>
            <div class="text-body2">{{ batch.qualityNotes }}</div>
          </q-card>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="row q-gutter-sm">
        <q-btn
          v-if="batch.status === 'active' && batch.availableQuantity > 0"
          color="green"
          icon="move_down"
          :label="$t('batch.useBatch')"
          @click="$emit('use-batch', batch)"
        />

        <q-btn
          v-if="batch.status === 'active'"
          color="orange"
          icon="block"
          :label="$t('batch.quarantine')"
          @click="quarantineBatch"
        />

        <q-btn
          color="primary"
          icon="edit"
          :label="$t('common.edit')"
          @click="editMode = !editMode"
        />

        <q-space />

        <q-btn
          color="grey"
          flat
          :label="$t('common.close')"
          @click="$emit('close')"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useQuasar, date } from 'quasar';
  import { useBatchStore } from 'src/stores/batch';
  import { useFormatting } from 'src/composables/useFormatting';
  import type { ProductBatchWithDetails } from 'src/types/inventory';

  // Props & Emits
  interface Props {
    batch: ProductBatchWithDetails;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    close: [];
    updated: [];
    'use-batch': [batch: ProductBatchWithDetails];
  }>();

  // Composables
  const { t } = useI18n();
  const $q = useQuasar();
  const batchStore = useBatchStore();
  const { formatDate, formatCurrency, formatQuantity } = useFormatting();

  // State
  const editMode = ref(false);

  // Methods
  const getLocationColor = (type: string) => {
    const colors = {
      storage: 'blue',
      emergency: 'red',
      treatment: 'green',
      default: 'grey',
    };
    return colors[type] || colors.default;
  };

  const getQuantityColor = (ratio: number) => {
    if (ratio > 0.5) return 'green';
    if (ratio > 0.2) return 'orange';
    return 'red';
  };

  const getExpiryIcon = (urgency: string) => {
    const icons = {
      expired: 'error',
      critical: 'warning',
      warning: 'schedule',
      normal: 'check_circle',
    };
    return icons[urgency] || 'check_circle';
  };

  const getExpiryColor = (urgency: string) => {
    const colors = {
      expired: 'red',
      critical: 'deep-orange',
      warning: 'amber',
      normal: 'green',
    };
    return colors[urgency] || 'green';
  };

  const getExpiryTextClass = (urgency: string) => {
    const classes = {
      expired: 'text-red',
      critical: 'text-deep-orange',
      warning: 'text-amber-8',
      normal: 'text-green',
    };
    return classes[urgency] || 'text-green';
  };

  const getExpiryText = (days: number, urgency: string) => {
    if (urgency === 'expired') {
      return t('batch.expiredDaysAgo', { days: Math.abs(days) });
    } else if (days === 0) {
      return t('batch.expiresToday');
    } else if (days === 1) {
      return t('batch.expiresTomorrow');
    } else {
      return t('batch.expiresInDays', { days });
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'green',
      expired: 'red',
      depleted: 'grey',
      recalled: 'deep-orange',
      quarantine: 'amber',
    };
    return colors[status] || 'grey';
  };

  const quarantineBatch = async () => {
    try {
      await batchStore.updateBatch(props.batch.id, { status: 'quarantine' });
      $q.notify({
        type: 'positive',
        message: t('batch.quarantineSuccess'),
      });
      emit('updated');
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: t('errors.failed'),
      });
    }
  };
</script>

<style scoped>
  .batch-detail-card {
    min-width: 600px;
    max-width: 800px;
    border-radius: var(--radius-xl);
    overflow: hidden;
  }

  .info-card {
    padding: var(--space-5);
    border-radius: var(--radius-lg);
    transition: all var(--transition-base);
    border: 1px solid rgba(0, 0, 0, 0.05);
    background: linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.98) 0%,
      rgba(248, 250, 252, 0.95) 100%
    );
    box-shadow: 
      0 4px 16px rgba(0, 0, 0, 0.06),
      0 2px 8px rgba(0, 0, 0, 0.04),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 
        0 8px 24px rgba(0, 0, 0, 0.1),
        0 4px 12px rgba(0, 0, 0, 0.06),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
      border-color: rgba(0, 0, 0, 0.08);
    }

    // Dark mode support
    .body--dark & {
      background: linear-gradient(
        145deg,
        rgba(30, 30, 30, 0.98) 0%,
        rgba(45, 45, 45, 0.95) 100%
      );
      border-color: rgba(255, 255, 255, 0.1);
      box-shadow: 
        0 4px 16px rgba(0, 0, 0, 0.2),
        0 2px 8px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);

      &:hover {
        box-shadow: 
          0 8px 24px rgba(0, 0, 0, 0.3),
          0 4px 12px rgba(0, 0, 0, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.15);
      }
    }
  }

  .neumorph-card {
    background: var(--bg-primary);
    border: none;
    box-shadow: 
      12px 12px 24px rgba(0, 0, 0, 0.08),
      -12px -12px 24px rgba(255, 255, 255, 0.9),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);

    &:hover {
      box-shadow: 
        6px 6px 16px rgba(0, 0, 0, 0.12),
        -6px -6px 16px rgba(255, 255, 255, 0.95),
        inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }

    // Dark mode support
    .body--dark & {
      background: var(--bg-secondary);
      box-shadow: 
        12px 12px 24px rgba(0, 0, 0, 0.3),
        -12px -12px 24px rgba(255, 255, 255, 0.02),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);

      &:hover {
        box-shadow: 
          6px 6px 16px rgba(0, 0, 0, 0.4),
          -6px -6px 16px rgba(255, 255, 255, 0.03),
          inset 0 1px 0 rgba(255, 255, 255, 0.15);
      }
    }
  }

  // Enhanced chip styling
  .q-chip {
    border-radius: var(--radius-lg);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all var(--transition-base);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }

  // Enhanced progress bar styling
  .q-linear-progress {
    border-radius: var(--radius-full);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
    background: rgba(0, 0, 0, 0.05);

    .body--dark & {
      background: rgba(255, 255, 255, 0.05);
    }
  }

  // Enhanced button styling
  .q-btn {
    border-radius: var(--radius-lg);
    font-weight: var(--font-weight-semibold);
    transition: all var(--transition-base);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    &:active {
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    .batch-detail-card {
      min-width: 100%;
    }

    .info-card {
      padding: var(--space-4);
    }
  }
</style>
