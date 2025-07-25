<template>
  <PageLayout>
    <PageTitle
      :title="$t('locations.title')"
      :subtitle="$t('locations.manage')"
      icon="place"
    />

    <!-- Summary Cards -->
    <div class="row q-gutter-md q-mb-lg">
      <div class="col-12 col-md-3">
        <BaseCard
          variant="stats"
          :value="locations.length"
          :label="$t('locations.allLocations')"
          icon="place"
          icon-color="primary"
        />
      </div>

      <div class="col-12 col-md-3">
        <BaseCard
          variant="stats"
          :value="mainLocationsCount"
          :label="$t('locations.mainLocations')"
          icon="star"
          icon-color="warning"
        />
      </div>
    </div>

    <!-- Coming Soon Banner -->
    <q-banner rounded class="bg-info text-white q-mb-lg">
      <template v-slot:avatar>
        <q-icon name="info" color="white" />
      </template>
      <div class="text-subtitle1">{{ $t('locations.title') }}</div>
      <div class="text-body2 q-mt-xs">
        {{ $t('locations.comingSoonDescription') }}
      </div>
    </q-banner>

    <!-- Search and Actions -->
    <div class="row q-gutter-md items-center q-mb-lg">
      <div class="col-12 col-md-4">
        <q-input
          v-model="searchQuery"
          :placeholder="$t('locations.search')"
          outlined
          dense
          clearable
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <div class="col-auto">
        <q-btn
          :label="$t('locations.add')"
          icon="add"
          color="primary"
          @click="showComingSoon"
        />
      </div>
    </div>

    <!-- Locations Table -->
    <q-table
      :rows="filteredLocations"
      :columns="columns"
      :loading="loading"
      row-key="id"
      flat
      bordered
      :rows-per-page-options="[10, 25, 50]"
      :no-data-label="$t('locations.noLocations')"
    >
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn icon="edit" size="sm" flat dense @click="showComingSoon" />
          <q-btn
            icon="delete"
            size="sm"
            flat
            dense
            color="negative"
            @click="showComingSoon"
          />
        </q-td>
      </template>
    </q-table>
  </PageLayout>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useQuasar } from 'quasar';
  import PageTitle from '@/components/PageTitle.vue';
  import PageLayout from '@/components/PageLayout.vue';
  import BaseCard from 'src/components/base/BaseCard.vue';
  import { useAuthStore } from 'src/stores/auth';

  const { t } = useI18n();
  const $q = useQuasar();

  // State
  const authStore = useAuthStore();
  const isUnmounted = ref(false);

  // Data
  const loading = ref(false);
  const searchQuery = ref('');

  // Sample data for demonstration
  const locations = ref([
    {
      id: 1,
      name: t('locations.sampleData.mainWarehouse.name'),
      type: t('locations.sampleData.mainWarehouse.type'),
      description: t('locations.sampleData.mainWarehouse.description'),
      capacity: t('locations.capacityItems', { count: 1000 }),
      isMain: true,
    },
    {
      id: 2,
      name: t('locations.sampleData.pharmacy.name'),
      type: t('locations.sampleData.pharmacy.type'),
      description: t('locations.sampleData.pharmacy.description'),
      capacity: t('locations.capacityItems', { count: 500 }),
      isMain: false,
    },
    {
      id: 3,
      name: t('locations.sampleData.treatmentRoom.name'),
      type: t('locations.sampleData.treatmentRoom.type'),
      description: t('locations.sampleData.treatmentRoom.description'),
      capacity: t('locations.capacityItems', { count: 50 }),
      isMain: false,
    },
  ]);

  // Computed
  const filteredLocations = computed(() => {
    if (!searchQuery.value) return locations.value;

    const query = searchQuery.value.toLowerCase();
    return locations.value.filter(
      location =>
        location.name.toLowerCase().includes(query) ||
        location.type.toLowerCase().includes(query) ||
        location.description.toLowerCase().includes(query)
    );
  });

  const mainLocationsCount = computed(() => {
    return locations.value.filter(loc => loc.isMain).length;
  });

  const columns = computed(() => [
    {
      name: 'name',
      label: t('locations.name'),
      field: 'name',
      align: 'left' as const,
      sortable: true,
    },
    {
      name: 'type',
      label: t('locations.type'),
      field: 'type',
      align: 'left' as const,
      sortable: true,
    },
    {
      name: 'description',
      label: t('locations.description'),
      field: 'description',
      align: 'left' as const,
      sortable: false,
    },
    {
      name: 'capacity',
      label: t('locations.capacity'),
      field: 'capacity',
      align: 'left' as const,
      sortable: false,
    },
    {
      name: 'actions',
      label: t('common.actions'),
      field: 'actions',
      align: 'center' as const,
      sortable: false,
    },
  ]);

  // Methods
  const showComingSoon = () => {
    $q.notify({
      type: 'info',
      message: t('locations.comingSoonDescription'),
      position: 'top',
    });
  };

  // Lifecycle
  onMounted(() => {
    // Future: Load actual locations from API
  });

  onBeforeUnmount(() => {
    isUnmounted.value = true;
  });
</script>

<style scoped>
  .locations-content {
    padding: 24px;
  }

  .coming-soon-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    text-align: center;
  }
</style>
