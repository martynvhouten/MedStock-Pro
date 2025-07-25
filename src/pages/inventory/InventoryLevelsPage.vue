<template>
  <PageLayout>
    <template #header>
      <PageTitle
        :title="$t('inventory.stockLevels')"
        :subtitle="$t('inventory.overview')"
        icon="inventory_2"
      />
    </template>

    <template #actions>
      <div class="row q-gutter-sm items-center">
        <!-- Location Filter -->
        <q-select
          v-model="selectedLocation"
          :options="locationOptions"
          :label="$t('inventory.currentLocation')"
          outlined
          dense
          emit-value
          map-options
          style="min-width: 200px"
          @update:model-value="loadStockLevels"
        />

        <!-- Refresh Button -->
        <q-btn
          icon="refresh"
          :loading="loading"
          round
          flat
          @click="refreshData"
          :title="$t('common.refresh')"
        />
      </div>
    </template>

    <!-- Quick Stats Overview -->
    <div class="row q-mb-lg stats-cards-container">
      <div class="col-12 col-sm-6 col-lg-3 stats-card-col">
        <BaseCard
          variant="stats"
          :value="stockLevels.length"
          :label="$t('inventory.totalProducts')"
          icon="inventory_2"
          icon-color="primary"
        />
      </div>

      <div class="col-12 col-sm-6 col-lg-3 stats-card-col">
        <BaseCard
          variant="stats"
          :value="clinicStore.locations.length"
          :label="$t('inventory.stockLocations')"
          icon="location_on"
          icon-color="info"
        />
      </div>

      <div class="col-12 col-sm-6 col-lg-3 stats-card-col">
        <BaseCard
          variant="stats"
          :value="loading ? '...' : inventoryStore.realtimeConnected ? '🔄' : '✓'"
          :label="$t('inventory.dataLoaded')"
          icon="check_circle"
          icon-color="positive"
        />
      </div>

      <div class="col-12 col-sm-6 col-lg-3 stats-card-col">
        <BaseCard
          variant="stats"
          :value="`${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`"
          :label="$t('inventory.lastUpdated')"
          icon="refresh"
          icon-color="secondary"
        />
      </div>
    </div>

    <!-- Filter Bar -->
    <BaseCard class="q-mb-lg">
      <q-card-section>
        <div class="row q-gutter-md items-end">
          <!-- Search -->
          <div class="col-12 col-md-4">
            <q-input
              v-model="filters.search"
              :placeholder="$t('inventory.searchProducts')"
              outlined
              dense
              clearable
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <!-- Stock Status Filter -->
          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.stockStatus"
              :options="stockStatusOptions"
              :label="$t('inventory.stockStatus')"
              outlined
              dense
              emit-value
              map-options
              clearable
            />
          </div>

          <!-- Category Filter -->
          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.category"
              :options="categoryOptions"
              :label="$t('inventory.category')"
              outlined
              dense
              emit-value
              map-options
              clearable
            />
          </div>

          <!-- Barcode Scanner -->
          <div class="col-12 col-md-2">
            <q-btn
              :label="$t('inventory.scanBarcode')"
              icon="qr_code_scanner"
              color="primary"
              flat
              @click="showBarcodeScanner = true"
            />
          </div>

          <!-- Clear Filters -->
          <div class="col-12 col-md-2">
            <q-btn
              :label="$t('common.clearFilters')"
              icon="clear"
              color="grey-7"
              flat
              @click="clearFilters"
            />
          </div>
        </div>
      </q-card-section>
    </BaseCard>

    <!-- Stock Levels Table -->
    <BaseCard>
      <q-table
        :rows="filteredStockLevels"
        :columns="columns"
        :loading="loading"
        row-key="id"
        :pagination="{ rowsPerPage: 25 }"
        class="stock-levels-table"
      >
        <template v-slot:body-cell-product="props">
          <q-td :props="props">
            <div class="product-info">
              <div class="product-name">{{ props.row.products?.name || 'Unknown Product' }}</div>
              <div class="product-sku text-caption text-grey-6">
                {{ props.row.products?.sku || 'N/A' }} • {{ props.row.products?.brand || 'N/A' }}
              </div>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-stock_status="props">
          <q-td :props="props">
            <q-chip
              :color="getStockStatusColor(props.row)"
              text-color="white"
              size="sm"
              :icon="getStockStatusIcon(props.row)"
            >
              {{ getStockStatusText(props.row) }}
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-current_quantity="props">
          <q-td :props="props">
            <div class="stock-quantity">
              <span class="current-stock">{{
                props.row.current_quantity
              }}</span>
              <span class="stock-unit text-caption text-grey-6">{{
                props.row.products?.unit || 'st'
              }}</span>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-levels="props">
          <q-td :props="props">
            <div class="stock-levels">
              <div class="level-item">
                <span class="level-label">Min:</span>
                <span class="level-value">{{ props.row.minimum_stock }}</span>
              </div>
              <div class="level-item">
                <span class="level-label">Max:</span>
                <span class="level-value">{{ props.row.maximum_stock }}</span>
              </div>
              <div class="level-item">
                <span class="level-label">Bestel:</span>
                <span class="level-value">{{ props.row.reorder_point }}</span>
              </div>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn-group dense>
              <q-btn
                icon="edit"
                size="sm"
                flat
                color="primary"
                @click="editStockLevel(props.row)"
                :title="$t('inventory.adjustStock')"
              />
              <q-btn
                icon="swap_horiz"
                size="sm"
                flat
                color="blue-6"
                @click="transferStock(props.row)"
                :title="$t('inventory.stockTransfer')"
              />
              <q-btn
                icon="history"
                size="sm"
                flat
                color="grey-6"
                @click="viewMovements(props.row)"
                :title="$t('inventory.viewMovements')"
              />
            </q-btn-group>
          </q-td>
        </template>
      </q-table>
    </BaseCard>

    <!-- Quick Stock Adjustment Dialog -->
    <QuickAdjustmentDialog
      v-model="showAdjustmentDialog"
      :selected-product="selectedProductForAdjustment"
      :selected-location="selectedLocationObject"
      @stock-updated="handleStockUpdated"
    />

    <!-- Barcode Scanner -->
    <BarcodeScanner
      v-model="showBarcodeScanner"
      @scan="handleBarcodeScan"
    />

    <!-- Stock Transfer Dialog -->
    <StockTransferDialog
      v-model="showTransferDialog"
      :selected-product="selectedProductForTransfer"
      :current-location="selectedLocationObject"
      @transfer-completed="handleTransferCompleted"
    />
  </PageLayout>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useQuasar } from 'quasar';
  import { useAuthStore } from 'src/stores/auth';
  import { useClinicStore } from 'src/stores/clinic';
  import { useInventoryStore } from 'src/stores/inventory';
  import { supabase } from 'src/boot/supabase';
  import PageLayout from 'src/components/PageLayout.vue';
  import PageTitle from 'src/components/PageTitle.vue';
  import BaseCard from 'src/components/base/BaseCard.vue';
  import BarcodeScanner from 'src/components/BarcodeScanner.vue';
  import QuickAdjustmentDialog from 'src/components/inventory/QuickAdjustmentDialog.vue';
  import StockTransferDialog from 'src/components/inventory/StockTransferDialog.vue';

  // Composables
  const { t } = useI18n();
  const $q = useQuasar();
  const authStore = useAuthStore();
  const clinicStore = useClinicStore();
  const inventoryStore = useInventoryStore();

  // State
  const loading = ref(false);
  const stockLevels = ref<any[]>([]); // Properly typed to allow clinic_products data
  const selectedLocation = ref('all');
  const isUnmounted = ref(false);
  
  // Barcode scanner state
  const showBarcodeScanner = ref(false);
  const filters = ref({
    search: '',
    stockStatus: '',
    category: '',
  });
  
  // Dialog state
  const showAdjustmentDialog = ref(false);
  const showTransferDialog = ref(false);
  const selectedProductForAdjustment = ref<any>(null);
  const selectedProductForTransfer = ref<any>(null);

  // Computed
  const locationOptions = computed(() => [
    { label: t('inventory.allLocations'), value: 'all' },
    ...clinicStore.locations.map(loc => ({
      label: loc.name,
      value: loc.id,
    })),
  ]);

  const selectedLocationName = computed(() => {
    if (selectedLocation.value === 'all') return t('inventory.allLocations');
    const location = clinicStore.locations.find(
      loc => loc.id === selectedLocation.value
    );
    return location?.name || t('inventory.allLocations');
  });

  const selectedLocationObject = computed(() => {
    if (selectedLocation.value === 'all') {
      // When "all locations" is selected, use the first available location as fallback
      return clinicStore.locations.length > 0 ? clinicStore.locations[0] : null;
    }
    return clinicStore.locations.find(
      loc => loc.id === selectedLocation.value
    ) || null;
  });

  const categoryOptions = computed(() => {
    const categories = new Set();
    stockLevels.value.forEach(item => {
      if (item.products?.category) {
        categories.add(item.products.category);
      }
    });
    return Array.from(categories).map(cat => ({
      label: cat,
      value: cat,
    }));
  });

  const stockStatusOptions = computed(() => [
    { label: t('inventory.inStock'), value: 'in_stock' },
    { label: t('inventory.lowStock'), value: 'low_stock' },
    { label: t('inventory.outOfStock'), value: 'out_of_stock' },
  ]);

  const filteredStockLevels = computed(() => {
    let result = [...stockLevels.value];

    // Apply search filter
    if (filters.value.search) {
      const searchTerm = filters.value.search.toLowerCase();
      result = result.filter(
        item =>
          item.products?.name?.toLowerCase().includes(searchTerm) ||
          item.products?.sku?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply stock status filter
    if (filters.value.stockStatus) {
      const status = filters.value.stockStatus;
      result = result.filter(item => {
        const current = item.current_quantity || 0;
        const minimum = item.minimum_quantity || 0;
        
        if (status === 'out_of_stock') return current === 0;
        if (status === 'low_stock') return current > 0 && current <= minimum;
        if (status === 'in_stock') return current > minimum;
        
        return true;
      });
    }

    // Apply category filter
    if (filters.value.category) {
      result = result.filter(
        item => item.products?.category === filters.value.category
      );
    }

    return result;
  });

  const statsCards = computed(() => {
    const stats = {
      total: stockLevels.value.length,
      inStock: stockLevels.value.filter(
        item => (item.current_quantity || 0) > (item.minimum_quantity || 0)
      ).length,
      lowStock: stockLevels.value.filter(
        item => {
          const current = item.current_quantity || 0;
          const minimum = item.minimum_quantity || 0;
          return current > 0 && current <= minimum;
        }
      ).length,
      outOfStock: stockLevels.value.filter(
        item => (item.current_quantity || 0) === 0
      ).length,
    };

    return [
      {
        label: t('inventory.totalProducts'),
        value: stats.total,
        icon: 'inventory_2',
        iconColor: 'primary',
      },
      {
        label: t('inventory.inStock'),
        value: stats.inStock,
        icon: 'check_circle',
        iconColor: 'positive',
      },
      {
        label: t('inventory.lowStock'),
        value: stats.lowStock,
        icon: 'warning',
        iconColor: 'warning',
      },
      {
        label: t('inventory.outOfStock'),
        value: stats.outOfStock,
        icon: 'cancel',
        iconColor: 'negative',
      },
    ];
  });

  const columns = computed(() => [
    {
      name: 'product',
      label: t('inventory.product'),
      align: 'left' as const,
      field: (row: any) => row.products?.name || '',
      sortable: true,
    },
    {
      name: 'current_quantity',
      label: t('inventory.currentStock'),
      align: 'center' as const,
      field: 'current_quantity',
      sortable: true,
    },
    {
      name: 'stock_status',
      label: t('inventory.status'),
      align: 'center' as const,
      field: (row: any) => {
        const current = row.current_quantity || 0;
        const minimum = row.minimum_quantity || 0;
        
        if (current === 0) return 'out_of_stock';
        if (current <= minimum) return 'low_stock';
        return 'in_stock';
      },
      sortable: true,
    },
    {
      name: 'levels',
      label: t('inventory.stockLevels'),
      align: 'center' as const,
      field: 'levels',
      sortable: false,
    },
    {
      name: 'actions',
      label: t('common.actions'),
      align: 'center' as const,
      field: 'actions',
      sortable: false,
    },
  ]);

  // Functions
  const loadStockLevels = async () => {
    if (isUnmounted.value) return;
    
    loading.value = true;
    try {
      const practiceId = '550e8400-e29b-41d4-a716-446655440000'; // Demo practice ID
      
      if (!practiceId) {
        stockLevels.value = [];
        return;
      }

      let query = supabase
        .from('stock_levels')
        .select(`
          *,
          products (
            id,
            name,
            sku,
            barcode,
            category,
            brand,
            unit,
            price
          ),
          practice_locations (
            id,
            name,
            code
          )
        `)
        .eq('practice_id', practiceId);

      if (selectedLocation.value !== 'all') {
        query = query.eq('location_id', selectedLocation.value);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      if (isUnmounted.value) return; // Check again after async operation

      stockLevels.value = data || [];
      
    } catch (error) {
      if (!isUnmounted.value) {
        console.error('Error loading stock levels:', error);
        $q.notify({
          type: 'negative',
          message: t('errors.failedToLoadData'),
        });
      }
    } finally {
      if (!isUnmounted.value) {
        loading.value = false;
      }
    }
  };

  const determineStockStatus = (current: number, minimum: number): string => {
    if (current <= 0) return 'out_of_stock';
    if (current <= minimum) return 'low_stock';
    return 'in_stock';
  };

  const getStockStatusColor = (stockLevel: any): string => {
    const current = stockLevel.current_quantity || 0;
    const minimum = stockLevel.minimum_quantity || 0;
    
    if (current === 0) return 'negative';
    if (current <= minimum) return 'warning';
    return 'positive';
  };

  const getStockStatusIcon = (stockLevel: any): string => {
    const current = stockLevel.current_quantity || 0;
    const minimum = stockLevel.minimum_quantity || 0;
    
    if (current === 0) return 'error';
    if (current <= minimum) return 'warning';
    return 'check_circle';
  };

  const getStockStatusText = (stockLevel: any): string => {
    const current = stockLevel.current_quantity || 0;
    const minimum = stockLevel.minimum_quantity || 0;
    
    if (current === 0) return t('inventory.outOfStock');
    if (current <= minimum) return t('inventory.lowStock');
    return t('inventory.inStock');
  };

  const refreshData = async () => {
    await Promise.all([
      clinicStore.fetchLocations('550e8400-e29b-41d4-a716-446655440000'),
      loadStockLevels(),
    ]);
    $q.notify({
      type: 'positive',
      message: t('inventory.dataRefreshed'),
    });
  };

  const clearFilters = () => {
    filters.value = {
      search: '',
      stockStatus: '',
      category: '',
    };
  };

  // Barcode scanning
  const handleBarcodeScan = async (barcode: string) => {
    try {
      // Search for products matching the barcode
      const matchingProduct = stockLevels.value.find(level => {
        const product = level.products;
        if (!product) return false;
        
        return product.sku === barcode || 
               product.barcode === barcode ||
               product.name?.toLowerCase().includes(barcode.toLowerCase());
      });

      if (matchingProduct) {
        // Focus on the found product by filtering
        filters.value.search = matchingProduct.products.name;
        
        $q.notify({
          type: 'positive',
          message: t('inventory.barcodeFound', { 
            product: matchingProduct.products.name 
          }),
          icon: 'qr_code_scanner'
        });
      } else {
        $q.notify({
          type: 'warning',
          message: t('inventory.barcodeNotFound', { barcode }),
          icon: 'search_off'
        });
      }
    } catch (error) {
      console.error('Error processing barcode:', error);
      $q.notify({
        type: 'negative',
        message: t('errors.processingError'),
        icon: 'error'
      });
    }
  };

  const editStockLevel = (stockLevel: any) => {
    selectedProductForAdjustment.value = stockLevel;
    showAdjustmentDialog.value = true;
  };

  const handleStockUpdated = async (product: any) => {
    // Refresh the stock levels after an update
    await loadStockLevels();
    $q.notify({
      type: 'positive', 
      message: t('inventory.dataRefreshed'),
    });
  };

  const transferStock = (stockLevel: any) => {
    selectedProductForTransfer.value = stockLevel;
    showTransferDialog.value = true;
  };

  const handleTransferCompleted = async (transfer: any) => {
    // Refresh the stock levels after a transfer
    await loadStockLevels();
    showTransferDialog.value = false;
  };

  const viewMovements = (_stockLevel: any) => {
    $q.notify({
      type: 'info',
      message: t('common.comingSoon'),
    });
  };

  // Lifecycle
  onMounted(async () => {
    // First ensure we have the demo practice ID set correctly
    const demoPracticeId = '550e8400-e29b-41d4-a716-446655440000';
    
    try {
      // Load locations and stock levels in parallel
      await Promise.all([
        clinicStore.fetchLocations(demoPracticeId),
        loadStockLevels(),
      ]);

      // 🔄 NEW: Initialize real-time updates
      inventoryStore.initializeRealtime();
      
      console.log('📡 Real-time inventory subscriptions initialized');
    } catch (error) {
      console.error('Error loading inventory data:', error);
      $q.notify({
        type: 'negative',
        message: t('errors.failedToLoadData'),
      });
    }
  });

  onBeforeUnmount(() => {
    isUnmounted.value = true;
    loading.value = false;
  });
</script>

<style lang="scss" scoped>
  .stock-levels-table {
    .product-info {
      .product-name {
        font-weight: 500;
        margin-bottom: 2px;
      }
    }

    .stock-quantity {
      display: flex;
      align-items: center;
      gap: 4px;

      .current-stock {
        font-weight: 600;
        font-size: 1.1em;
      }
    }

    .stock-levels {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .level-item {
        display: flex;
        justify-content: space-between;
        min-width: 80px;

        .level-label {
          font-size: 0.75rem;
          color: var(--q-grey-6);
        }

        .level-value {
          font-weight: 500;
          font-size: 0.8rem;
        }
      }
    }
  }

  // Stats cards styling
  .stats-cards-container {
    gap: 0;

    .stats-card-col {
      padding: 8px;

      @media (max-width: 640px) {
        padding: 6px;
      }
    }
  }
</style>
