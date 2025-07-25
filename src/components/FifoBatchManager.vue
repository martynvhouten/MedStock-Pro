<template>
  <div class="fifo-batch-manager">
    <div class="row q-gutter-md">
      <!-- FIFO Suggestion Form -->
      <div class="col-12 col-md-6">
        <BaseCard 
          variant="neumorph"
          title="FIFO Suggestion" 
          subtitle="Generate batch usage recommendations"
          icon="trending_up"
          icon-color="info"
          header-color="info"
        >

            <q-form @submit="generateSuggestion" class="q-gutter-md">
              <q-select
                v-model="form.productId"
                :options="productOptions"
                option-value="id"
                option-label="name"
                :label="$t('product.product')"
                :rules="[val => !!val || $t('validation.required')]"
                emit-value
                map-options
              />

              <q-select
                v-model="form.locationId"
                :options="locationOptions"
                option-value="id"
                option-label="name"
                :label="$t('location.location')"
                :rules="[val => !!val || $t('validation.required')]"
                emit-value
                map-options
              />

              <q-input
                v-model.number="form.requestedQuantity"
                :label="$t('batch.requestedQuantity')"
                type="number"
                step="0.001"
                min="0"
                :rules="[val => val > 0 || $t('validation.mustBePositive')]"
              />

              <q-btn
                type="submit"
                color="primary"
                :label="$t('batch.generateFifoSuggestion')"
                :loading="loading"
                icon="trending_up"
              />
            </q-form>
        </BaseCard>
      </div>

      <!-- FIFO Results -->
      <div class="col-12 col-md-6">
        <BaseCard 
          variant="glass-modern"
          title="FIFO Results" 
          subtitle="Recommended batch usage order"
          icon="list_alt"
          icon-color="positive"
          header-color="positive"
        >

            <div
              v-if="!fifoResults.length"
              class="text-center text-grey q-py-lg"
            >
              <q-icon name="trending_up" size="48px" class="q-mb-md" />
              <div>{{ $t('batch.noFifoResults') }}</div>
            </div>

            <q-list v-else>
              <q-item
                v-for="(result, index) in fifoResults"
                :key="index"
                class="fifo-result-item"
              >
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white">
                    {{ index + 1 }}
                  </q-avatar>
                </q-item-section>

                <q-item-section>
                  <q-item-label>{{ result.batchNumber }}</q-item-label>
                  <q-item-label caption>
                    {{ $t('batch.useQuantity') }}: {{ result.useQuantity }}
                  </q-item-label>
                  <q-item-label caption>
                    {{ $t('batch.expiryDate') }}:
                    {{ formatDate(result.expiryDate) }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <q-chip
                    :color="getExpiryColor(result.daysUntilExpiry)"
                    text-color="white"
                    size="sm"
                  >
                    {{ result.daysUntilExpiry }}d
                  </q-chip>
                </q-item-section>
              </q-item>
            </q-list>

            <div v-if="fifoResults.length" class="q-mt-md">
              <q-btn
                color="green"
                :label="$t('batch.applyFifoSuggestion')"
                @click="applySuggestion"
                icon="check"
                class="full-width"
              />
            </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useQuasar, date } from 'quasar';
  import BaseCard from 'src/components/base/BaseCard.vue';
  import { useBatchStore } from 'src/stores/batch';

  const emit = defineEmits<{
    'suggestion-generated': [results: any[]];
  }>();

  const { t } = useI18n();
  const $q = useQuasar();
  const batchStore = useBatchStore();

  // State
  const loading = ref(false);
  const fifoResults = ref<any[]>([]);

  const form = ref({
    productId: '',
    locationId: '',
    requestedQuantity: 0,
  });

  // Mock options for now
  const productOptions = ref([
    { id: '1', name: t('product.samples.syringeBD') },
    { id: '2', name: t('product.samples.needleBD') },
  ]);

  const locationOptions = ref([
    { id: '1', name: t('location.sampleData.mainWarehouse.name') },
    { id: '2', name: t('location.samples.emergencyStock') },
  ]);

  // Methods
  const formatDate = (dateStr: string) => {
    return date.formatDate(dateStr, 'DD/MM/YYYY');
  };

  const getExpiryColor = (days: number) => {
    if (days < 0) return 'red';
    if (days <= 7) return 'deep-orange';
    if (days <= 30) return 'amber';
    return 'green';
  };

  const generateSuggestion = async () => {
    try {
      loading.value = true;

      // Call the FIFO function from our batch store
      const results = await batchStore.getFifoBatches(
        form.value.productId,
        form.value.locationId,
        form.value.requestedQuantity
      );

      fifoResults.value = results.map((result, index) => ({
        ...result,
        daysUntilExpiry: Math.ceil(
          (new Date(result.expiryDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        ),
      }));

      emit('suggestion-generated', fifoResults.value);

      $q.notify({
        type: 'positive',
        message: t('batch.fifoSuggestionGenerated'),
      });
    } catch (error) {
      console.error(t('errors.failedToGenerateSuggestion'), error);
      $q.notify({
        type: 'negative',
        message: t('errors.failedToGenerateSuggestion'),
      });
    } finally {
      loading.value = false;
    }
  };

  const applySuggestion = () => {
    $q.dialog({
      title: t('batch.confirmFifoApplication'),
      message: t('batch.confirmFifoMessage'),
      cancel: true,
      persistent: true,
    }).onOk(() => {
      // Apply the FIFO suggestion
      // This would typically create stock movements for each batch
      $q.notify({
        type: 'positive',
        message: t('batch.fifoAppliedSuccessfully'),
      });

      // Reset form
      form.value = {
        productId: '',
        locationId: '',
        requestedQuantity: 0,
      };
      fifoResults.value = [];
    });
  };
</script>

<style scoped>
  .fifo-batch-manager {
    padding: 16px;
  }

  .fifo-result-item {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    margin-bottom: 8px;
  }
</style>
