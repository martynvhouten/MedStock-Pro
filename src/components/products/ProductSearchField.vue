<template>
  <div class="product-search-field">
    <q-input
      v-model="searchQuery"
      :placeholder="placeholder || $t('products.searchPlaceholder')"
      outlined
      dense
      clearable
      @update:model-value="onSearchInput"
      @keyup.enter="performSearch"
      :loading="loading"
      class="search-input"
    >
      <template #prepend>
        <q-icon name="search" />
      </template>
      
      <template #append>
        <q-btn
          flat
          round
          dense
          icon="qr_code_scanner"
          @click="openBarcodeScanner"
          :title="$t('products.scanBarcode')"
          color="primary"
          class="scan-btn"
        />
      </template>
    </q-input>

    <!-- Search Results Dropdown -->
    <q-menu
      v-model="showResults"
      fit
      class="search-results-menu"
      :offset="[0, 8]"
      max-height="300px"
    >
      <q-list dense>
        <q-item
          v-for="product in searchResults"
          :key="product.id"
          clickable
          @click="selectProduct(product)"
          class="search-result-item"
        >
          <q-item-section avatar v-if="product.image_url">
            <q-avatar size="40px" square>
              <img :src="product.image_url" :alt="product.name" />
            </q-avatar>
          </q-item-section>
          
          <q-item-section>
            <q-item-label>{{ product.name }}</q-item-label>
            <q-item-label caption>
              {{ product.sku }} • {{ product.brand || 'No brand' }}
            </q-item-label>
          </q-item-section>

          <q-item-section side v-if="product.barcode">
            <q-chip size="sm" color="grey-3" text-color="grey-8">
              <q-icon name="qr_code" size="xs" class="q-mr-xs" />
              {{ product.barcode }}
            </q-chip>
          </q-item-section>
        </q-item>

        <q-item v-if="searchResults.length === 0 && searchQuery.length > 2">
          <q-item-section>
            <q-item-label class="text-grey-6">
              {{ $t('products.noProductsFound') }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>

    <!-- Barcode Scanner -->
    <BarcodeScanner
      v-model="showBarcodeScanner"
      @scan="handleBarcodeScan"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { supabase } from 'src/boot/supabase';
import { useAuthStore } from 'src/stores/auth';
import BarcodeScanner from 'src/components/BarcodeScanner.vue';

// Props & Emits
interface Props {
  placeholder?: string;
  modelValue?: any;
  includeStock?: boolean;
  practiceId?: string;
}

interface Emits {
  (e: 'update:modelValue', value: any): void;
  (e: 'product-selected', product: any): void;
  (e: 'search', query: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  includeStock: false,
});

const emit = defineEmits<Emits>();

// Composables
const { t } = useI18n();
const $q = useQuasar();
const authStore = useAuthStore();

// State
const searchQuery = ref('');
const searchResults = ref<any[]>([]);
const loading = ref(false);
const showResults = ref(false);
const showBarcodeScanner = ref(false);

// Debounce timer for search
let searchTimeout: NodeJS.Timeout | null = null;

// Computed
const currentPracticeId = computed(() => 
  props.practiceId || authStore.userProfile?.clinic_id || ''
);

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue !== searchQuery.value) {
    searchQuery.value = newValue || '';
  }
});

// Methods
const onSearchInput = (value: string) => {
  emit('update:modelValue', value);
  emit('search', value);
  
  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  // Set new timeout for debounced search
  if (value.length >= 2) {
    searchTimeout = setTimeout(() => {
      performSearch();
    }, 300);
  } else {
    searchResults.value = [];
    showResults.value = false;
  }
};

const performSearch = async () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = [];
    showResults.value = false;
    return;
  }

  try {
    loading.value = true;
    
    // Build search query
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        brand,
        category,
        unit,
        barcode,
        image_url,
        active
      `)
      .eq('active', true);

    // Add practice filter if needed
    if (currentPracticeId.value) {
      query = query.eq('practice_id', currentPracticeId.value);
    }

    // Search by name, sku, or barcode
    const searchTerm = `%${searchQuery.value}%`;
    query = query.or(`name.ilike.${searchTerm},sku.ilike.${searchTerm},barcode.ilike.${searchTerm}`);

    // Add stock information if requested
    if (props.includeStock) {
      query = query.select(`
        *,
        stock_levels(current_quantity, minimum_quantity, maximum_quantity)
      `);
    }

    const { data, error } = await query.limit(10);

    if (error) throw error;

    searchResults.value = data || [];
    showResults.value = searchResults.value.length > 0 || searchQuery.value.length > 2;

  } catch (error) {
    console.error('Error searching products:', error);
    $q.notify({
      type: 'negative',
      message: t('products.searchError'),
      caption: 'Please try again',
    });
  } finally {
    loading.value = false;
  }
};

const selectProduct = (product: any) => {
  searchQuery.value = product.name;
  emit('update:modelValue', product.name);
  emit('product-selected', product);
  showResults.value = false;

  $q.notify({
    type: 'positive',
    message: t('products.productSelected', { name: product.name }),
    timeout: 2000,
  });
};

const openBarcodeScanner = () => {
  showBarcodeScanner.value = true;
};

const handleBarcodeScan = async (barcode: string) => {
  try {
    loading.value = true;
    
    // Search for product by barcode
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        brand,
        category,
        unit,
        barcode,
        image_url,
        active
      `)
      .eq('barcode', barcode)
      .eq('active', true)
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      const product = data[0];
      selectProduct(product);
      
      $q.notify({
        type: 'positive',
        message: t('products.barcodeFound', { product: product.name }),
        icon: 'qr_code_scanner',
        timeout: 3000,
      });
    } else {
      // Product not found - offer to create or search manually
      searchQuery.value = barcode;
      emit('update:modelValue', barcode);
      
      $q.notify({
        type: 'warning',
        message: t('products.barcodeNotFound', { barcode }),
        caption: 'Barcode added to search field',
        icon: 'search_off',
        timeout: 4000,
        actions: [
          {
            label: 'Search manually',
            color: 'white',
            handler: () => {
              performSearch();
            }
          }
        ]
      });
    }

  } catch (error) {
    console.error('Error processing barcode:', error);
    $q.notify({
      type: 'negative',
      message: t('products.barcodeError'),
      caption: 'Please try again',
    });
  } finally {
    loading.value = false;
  }
};

// Expose methods for parent components
defineExpose({
  search: performSearch,
  openScanner: openBarcodeScanner,
  clearSearch: () => {
    searchQuery.value = '';
    searchResults.value = [];
    showResults.value = false;
    emit('update:modelValue', '');
  }
});
</script>

<style lang="scss" scoped>
.product-search-field {
  position: relative;
  width: 100%;

  .search-input {
    :deep(.q-field__control) {
      border-radius: var(--radius-md);
      transition: all 0.2s ease;
      
      &:hover {
        box-shadow: 0 0 0 1px var(--primary-300);
      }
    }

    :deep(.q-field--focused .q-field__control) {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1);
    }
  }

  .scan-btn {
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(var(--primary-rgb), 0.1);
      transform: scale(1.05);
    }
  }
}

.search-results-menu {
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  
  .search-result-item {
    transition: background-color 0.2s ease;
    
    &:hover {
      background: var(--primary-50);
    }
    
    :deep(.q-item__section--avatar) {
      .q-avatar {
        border-radius: var(--radius-sm);
        overflow: hidden;
        border: 1px solid var(--neutral-200);
      }
    }
  }
}

// Dark mode support
body.body--dark {
  .search-results-menu {
    .search-result-item:hover {
      background: var(--neutral-700);
    }
  }
}

// Mobile optimizations
@media (max-width: 768px) {
  .product-search-field {
    .search-input {
      :deep(.q-field__control) {
        min-height: 48px;
      }
    }
    
    .scan-btn {
      min-width: 44px;
      min-height: 44px;
    }
  }
  
  .search-results-menu {
    max-height: 250px;
  }
}
</style>