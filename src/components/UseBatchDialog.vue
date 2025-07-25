<template>
  <BaseCard 
    variant="elevated" 
    class="use-batch-dialog"
    title="Use Batch"
    subtitle="Process batch usage"
    icon="remove_circle"
    icon-color="primary"
    header-color="primary"
  >
    <template #header-actions>
      <q-btn icon="close" flat round dense @click="$emit('close')" />
    </template>
      <!-- Batch Information -->
      <div class="batch-info q-mb-lg">
        <BaseCard variant="neumorph" class="q-pa-md">
          <div class="text-subtitle2 text-grey q-mb-sm">
            {{ $t('batch.batchInformation') }}
          </div>
          <div class="row q-gutter-md">
            <div class="col-12 col-md-6">
              <div class="text-caption text-grey">
                {{ $t('batch.batchNumber') }}
              </div>
              <div class="text-weight-medium">{{ batch.batchNumber }}</div>
            </div>
            <div class="col-12 col-md-6">
              <div class="text-caption text-grey">
                {{ $t('product.product') }}
              </div>
              <div class="text-weight-medium">{{ batch.productName }}</div>
            </div>
            <div class="col-12 col-md-6">
              <div class="text-caption text-grey">
                {{ $t('batch.availableQuantity') }}
              </div>
              <div class="text-weight-medium text-green">
                {{ formatQuantity(batch.availableQuantity) }}
              </div>
            </div>
            <div class="col-12 col-md-6">
              <div class="text-caption text-grey">
                {{ $t('batch.expiryDate') }}
              </div>
              <div class="text-weight-medium">
                {{ formatDate(batch.expiryDate) }}
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Usage Form -->
      <q-form @submit="onSubmit" class="q-gutter-md">
        <div class="row q-gutter-md">
          <div class="col-12 col-md-6">
            <q-input
              v-model.number="form.quantity"
              :label="$t('batch.quantityToUse')"
              type="number"
              step="0.001"
              min="0"
              :max="batch.availableQuantity"
              :rules="[
                val => val > 0 || $t('validation.mustBePositive'),
                val =>
                  val <= batch.availableQuantity ||
                  $t('batch.validation.exceededAvailable'),
              ]"
            >
              <template v-slot:prepend>
                <q-icon name="remove_circle" />
              </template>
              <template v-slot:append>
                <q-btn
                  flat
                  dense
                  icon="select_all"
                  @click="form.quantity = batch.availableQuantity"
                  size="sm"
                >
                  <q-tooltip>{{ $t('batch.useAll') }}</q-tooltip>
                </q-btn>
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-6">
            <q-select
              v-model="form.reason"
              :options="reasonOptions"
              :label="$t('batch.usageReason')"
              :rules="[val => !!val || $t('validation.required')]"
              emit-value
              map-options
            />
          </div>
        </div>

        <q-input
          v-model="form.notes"
          :label="$t('batch.usageNotes')"
          type="textarea"
          rows="3"
          :hint="$t('batch.usageNotesHint')"
        />

        <!-- Usage Summary -->
        <BaseCard variant="glass-modern" class="q-pa-md" v-if="form.quantity > 0">
          <div class="text-subtitle2 text-grey q-mb-sm">
            {{ $t('batch.usageSummary') }}
          </div>
          <div class="row q-gutter-md">
            <div class="col-6">
              <div class="text-caption text-grey">
                {{ $t('batch.quantityUsed') }}
              </div>
              <div class="text-h6 text-red">
                -{{ formatQuantity(form.quantity) }}
              </div>
            </div>
            <div class="col-6">
              <div class="text-caption text-grey">
                {{ $t('batch.remainingQuantity') }}
              </div>
              <div class="text-h6 text-green">
                {{ formatQuantity(batch.availableQuantity - form.quantity) }}
              </div>
            </div>
            <div class="col-6">
              <div class="text-caption text-grey">
                {{ $t('batch.costImpact') }}
              </div>
              <div class="text-h6">
                {{ formatCurrency(form.quantity * batch.unitCost || 0) }}
              </div>
            </div>
            <div class="col-6">
              <div class="text-caption text-grey">
                {{ $t('batch.newStatus') }}
              </div>
              <div class="text-h6">
                <q-chip
                  :color="getNewStatusColor()"
                  text-color="white"
                  size="sm"
                >
                  {{ getNewStatusText() }}
                </q-chip>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- Form Actions -->
        <div class="row q-gutter-sm q-mt-lg">
          <q-btn
            :label="$t('common.cancel')"
            color="grey"
            flat
            @click="$emit('close')"
            :disable="loading"
          />
          <q-space />
          <q-btn
            :label="$t('batch.confirmUsage')"
            color="primary"
            type="submit"
            :loading="loading"
            icon="check"
          />
        </div>
      </q-form>
  </BaseCard>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import BaseCard from 'src/components/base/BaseCard.vue';
  import { useQuasar, date } from 'quasar';
  import { useBatchStore } from 'src/stores/batch';
  import type { ProductBatchWithDetails } from 'src/types/inventory';

  interface Props {
    batch: ProductBatchWithDetails;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    close: [];
    used: [batch: ProductBatchWithDetails, quantity: number];
  }>();

  const { t } = useI18n();
  const $q = useQuasar();
  const batchStore = useBatchStore();

  // State
  const loading = ref(false);

  const form = ref({
    quantity: 0,
    reason: '',
    notes: '',
  });

  // Computed
  const reasonOptions = computed(() => [
    { label: t('batch.usage.consumption'), value: 'consumption' },
    { label: t('batch.usage.expired'), value: 'expired' },
    { label: t('batch.usage.damaged'), value: 'damaged' },
    { label: t('batch.usage.transfer'), value: 'transfer' },
    { label: t('batch.usage.adjustment'), value: 'adjustment' },
    { label: t('batch.usage.other'), value: 'other' },
  ]);

  // Methods
  const formatDate = (dateStr: string) => {
    return date.formatDate(dateStr, 'DD/MM/YYYY');
  };

  const formatQuantity = (quantity: number) => {
    return quantity.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: props.batch.currency || 'EUR',
    }).format(amount);
  };

  const getNewStatusColor = () => {
    const remaining = props.batch.availableQuantity - form.value.quantity;
    if (remaining <= 0) return 'grey';
    return 'green';
  };

  const getNewStatusText = () => {
    const remaining = props.batch.availableQuantity - form.value.quantity;
    if (remaining <= 0) return t('batch.status.depleted');
    return t('batch.status.active');
  };

  const onSubmit = async () => {
    try {
      loading.value = true;

      // Create stock movement record
      const stockMovement = {
        productId: props.batch.productId,
        locationId: props.batch.locationId,
        batchId: props.batch.id,
        movementType: 'consumption',
        quantityChange: -form.value.quantity,
        quantityBefore: props.batch.currentQuantity,
        quantityAfter: props.batch.currentQuantity - form.value.quantity,
        referenceType: 'manual_usage',
        notes: form.value.notes,
        reason: form.value.reason,
      };

      // Process the batch usage
      await batchStore.processStockMovement(stockMovement);

      $q.notify({
        type: 'positive',
        message: t('batch.batchUsedSuccessfully'),
        actions: [
          {
            label: t('common.dismiss'),
            color: 'white',
          },
        ],
      });

      emit('used', props.batch, form.value.quantity);
    } catch (error) {
      console.error('Failed to use batch:', error);
      $q.notify({
        type: 'negative',
        message: t('errors.failedToUseBatch'),
      });
    } finally {
      loading.value = false;
    }
  };
</script>

<style scoped>
  .use-batch-dialog {
    min-width: 600px;
    max-width: 800px;
  }

  @media (max-width: 768px) {
    .use-batch-dialog {
      min-width: 100%;
    }
  }

  .batch-info {
    background: rgba(0, 0, 0, 0.02);
    border-radius: 8px;
  }
</style>
