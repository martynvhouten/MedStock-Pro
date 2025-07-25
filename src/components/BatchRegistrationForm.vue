<template>
  <BaseCard 
    variant="premium" 
    class="batch-registration-card"
    title="Register New Batch"
    subtitle="Add a new product batch to inventory"
    icon="add_box"
    icon-color="primary"
    header-color="primary"
  >
    <template #header-actions>
      <q-btn
        v-if="!embedded"
        icon="close"
        flat
        round
        dense
        @click="$emit('close')"
      />
    </template>
      <q-form @submit="onSubmit" class="q-gutter-md">
        <!-- Product Selection -->
        <div class="row q-gutter-md">
          <div class="col-12 col-md-6">
            <q-select
              v-model="form.product_id"
              :options="productOptions"
              option-value="id"
              option-label="name"
              :label="$t('product.product')"
              use-input
              hide-selected
              fill-input
              input-debounce="0"
              :loading="loadingProducts"
              @filter="filterProducts"
              :rules="[rules.required]"
              emit-value
              map-options
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.name }}</q-item-label>
                    <q-item-label caption>{{ scope.opt.sku }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <!-- Location Selection -->
          <div class="col-12 col-md-6">
            <q-select
              v-model="form.location_id"
              :options="locationOptions"
              option-value="id"
              option-label="name"
              :label="$t('location.location')"
              :rules="[rules.required]"
              emit-value
              map-options
            />
          </div>
        </div>

        <!-- Batch Information -->
        <div class="row q-gutter-md">
          <div class="col-12 col-md-6">
            <q-input
              v-model="form.batch_number"
              :label="$t('batch.batchNumber')"
              :rules="[
                val => !!val || $t('validation.required'),
                val =>
                  val.length >= 3 || $t('validation.minLength', { min: 3 }),
              ]"
              counter
              maxlength="100"
            >
              <template v-slot:prepend>
                <q-icon name="qr_code_scanner" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-6">
            <q-input
              v-model="form.supplier_batch_number"
              :label="$t('batch.supplierBatchNumber')"
              counter
              maxlength="100"
            >
              <template v-slot:prepend>
                <q-icon name="business" />
              </template>
            </q-input>
          </div>
        </div>

        <!-- Dates -->
        <div class="row q-gutter-md">
          <div class="col-12 col-md-6">
            <q-input
              v-model="form.expiry_date"
              :label="$t('batch.expiryDate')"
              type="date"
              :rules="[
                val => !!val || $t('validation.required'),
                val => validateExpiryDate(val),
              ]"
            >
              <template v-slot:prepend>
                <q-icon name="event" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-6">
            <q-input
              v-model="form.received_date"
              :label="$t('batch.receivedDate')"
              type="date"
              :rules="[rules.required]"
            >
              <template v-slot:prepend>
                <q-icon name="inbox" />
              </template>
            </q-input>
          </div>
        </div>

        <!-- Quantities -->
        <div class="row q-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model.number="form.initial_quantity"
              :label="$t('batch.initialQuantity')"
              type="number"
              step="0.001"
              min="0"
              :rules="[
                val =>
                  (val !== null && val !== undefined) ||
                  $t('validation.required'),
                rules.positive,
              ]"
            >
              <template v-slot:prepend>
                <q-icon name="inventory" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-4">
            <q-input
              v-model.number="form.unit_cost"
              :label="$t('batch.unitCost')"
              type="number"
              step="0.01"
              min="0"
              :suffix="form.currency"
            >
              <template v-slot:prepend>
                <q-icon name="euro" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-4">
            <q-select
              v-model="form.currency"
              :options="currencyOptions"
              :label="$t('batch.currency')"
              emit-value
              map-options
            />
          </div>
        </div>

        <!-- Form Actions -->
        <div class="row q-gutter-sm q-mt-lg">
          <q-btn
            :label="$t('common.cancel')"
            color="grey"
            flat
            @click="resetForm"
            :disable="loading"
          />
          <q-space />
          <q-btn
            :label="$t('batch.registerBatch')"
            color="primary"
            type="submit"
            :loading="loading"
            icon="add_circle"
          />
        </div>
      </q-form>
  </BaseCard>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useQuasar } from 'quasar';
  import BaseCard from 'src/components/base/BaseCard.vue';
  import { useBatchStore } from 'src/stores/batch';
  import { useAuthStore } from 'src/stores/auth';
  import { useFormValidation } from 'src/composables/useFormValidation';
  import type { CreateBatchRequest } from 'src/types/inventory';

  // Props & Emits
  interface Props {
    embedded?: boolean;
    prefilledProductId?: string;
    prefilledLocationId?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    embedded: false,
  });

  const emit = defineEmits<{
    close: [];
    success: [batch: any];
  }>();

  // Composables
  const { t } = useI18n();
  const $q = useQuasar();
  const batchStore = useBatchStore();
  const authStore = useAuthStore();
  const { rules, patterns } = useFormValidation();

  // State
  const loading = ref(false);
  const loadingProducts = ref(false);
  const productOptions = ref<any[]>([]);

  // Form data - using a form type that's compatible with CreateBatchRequest
  interface BatchFormData {
    practice_id: string;
    product_id: string;
    location_id: string;
    batch_number: string;
    supplier_batch_number: string;
    expiry_date: string;
    received_date: string;
    initial_quantity: number;
    unit_cost: number;
    currency: string;
    purchase_order_number: string;
    invoice_number: string;
    quality_check_passed: boolean;
    quality_notes: string;
  }

  const form = ref<BatchFormData>({
    practice_id: 'demo-practice',
    product_id: (props.prefilledProductId ?? '') as string,
    location_id: (props.prefilledLocationId ?? '') as string,
    batch_number: '',
    supplier_batch_number: '',
    expiry_date: '',
          received_date: new Date().toISOString().substring(0, 10),
    initial_quantity: 0,
    unit_cost: 0,
    currency: 'EUR',
    purchase_order_number: '',
    invoice_number: '',
    quality_check_passed: true,
    quality_notes: '',
  });

  // Computed
  const locationOptions = computed(() => [
    { id: '1', name: t('location.sampleData.mainWarehouse.name') },
    { id: '2', name: t('location.samples.emergencyStock') },
    { id: '3', name: t('location.sampleData.treatmentRoom.name') },
  ]);

  const currencyOptions = computed(() => [
    { label: 'EUR (€)', value: 'EUR' },
    { label: 'USD ($)', value: 'USD' },
    { label: 'GBP (£)', value: 'GBP' },
  ]);

  // Methods
  const validateExpiryDate = (value: string) => {
    if (!value) return t('validation.required');

    const expiryDate = new Date(value);
    const today = new Date();

    if (expiryDate < today) {
      return t('batch.validation.expiryDateInPast');
    }

    return true;
  };

  const filterProducts = (val: string, update: Function) => {
    // Product filtering logic
    update(() => {
      productOptions.value = [];
    });
  };

    const resetForm = () => {
    form.value = {
      practice_id: 'demo-practice',
      product_id: (props.prefilledProductId ?? '') as string,
      location_id: (props.prefilledLocationId ?? '') as string,
      batch_number: '',
      supplier_batch_number: '',
      expiry_date: '',
      received_date: new Date().toISOString().substring(0, 10),
      initial_quantity: 0,
      unit_cost: 0,
      currency: 'EUR',
      purchase_order_number: '',
      invoice_number: '',
      quality_check_passed: true,
      quality_notes: '',
    };
  };

  const onSubmit = async () => {
    try {
      loading.value = true;

      const batchData: CreateBatchRequest = {
        practice_id: form.value.practice_id,
        product_id: form.value.product_id,
        location_id: form.value.location_id,
        batch_number: form.value.batch_number,
        expiry_date: form.value.expiry_date,
        initial_quantity: form.value.initial_quantity,
        ...(form.value.supplier_batch_number && { supplier_batch_number: form.value.supplier_batch_number }),
        ...(form.value.received_date && { received_date: form.value.received_date }),
        ...(form.value.unit_cost !== undefined && { unit_cost: form.value.unit_cost }),
        ...(form.value.currency && { currency: form.value.currency }),
        ...(form.value.purchase_order_number && { purchase_order_number: form.value.purchase_order_number }),
        ...(form.value.invoice_number && { invoice_number: form.value.invoice_number }),
        ...(form.value.quality_check_passed !== undefined && { quality_check_passed: form.value.quality_check_passed }),
        ...(form.value.quality_notes && { quality_notes: form.value.quality_notes }),
      };

      const newBatch = await batchStore.createBatch(batchData);

      $q.notify({
        type: 'positive',
        message: t('batch.batchRegisteredSuccessfully'),
      });

      emit('success', newBatch);

      if (!props.embedded) {
        emit('close');
      } else {
        resetForm();
      }
    } catch (error) {
      console.error(t('errors.failedToRegisterBatch'), error);
      $q.notify({
        type: 'negative',
        message: t('errors.failedToRegisterBatch'),
      });
    } finally {
      loading.value = false;
    }
  };

  // Lifecycle
  onMounted(async () => {
    // Load initial data
  });
</script>

<style scoped>
  .batch-registration-card {
    min-width: 600px;
    max-width: 900px;
  }

  @media (max-width: 768px) {
    .batch-registration-card {
      min-width: 100%;
    }
  }
</style>
