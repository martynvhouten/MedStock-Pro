<template>
  <PageLayout>
    <template #header>
      <div class="products-header">
        <div class="header-content">
          <div class="title-section">
            <PageTitle
              :title="$t('productsPage.title')"
              :subtitle="$t('productsPage.subtitle')"
              icon="inventory_2"
            />
          </div>
          <div class="header-actions">
            <q-btn
              flat
              icon="refresh"
              :label="$t('common.refresh')"
              @click="refreshData"
              :loading="loading"
              class="q-mr-sm"
            />
            <q-btn
              color="primary"
              icon="add_shopping_cart"
              :label="$t('productsPage.viewCart')"
              @click="showCartDialog = true"
              :disable="cartItemsCount === 0"
            >
              <q-badge
                v-if="cartItemsCount > 0"
                color="red"
                floating
                :label="cartItemsCount"
              />
            </q-btn>
          </div>
        </div>
      </div>
    </template>

    <div class="products-page">
      <!-- Filters Section -->
      <div class="filters-section">
        <div class="filters-toolbar">
          <div class="search-section">
            <q-input
              v-model="localSearch"
              :placeholder="$t('productsPage.searchPlaceholder')"
              outlined
              dense
              clearable
              @update:model-value="updateSearchFilter"
              class="search-input"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <div class="filter-controls">
            <q-btn
              flat
              icon="tune"
              :label="$t('productsPage.filters.title')"
              @click="showFilters = !showFilters"
              :color="hasActiveFilters ? 'primary' : 'grey-7'"
              class="filter-toggle"
            >
              <q-badge
                v-if="activeFiltersCount > 0"
                color="primary"
                floating
                :label="activeFiltersCount"
              />
            </q-btn>

            <q-btn
              v-if="hasActiveFilters"
              flat
              icon="clear"
              :label="$t('productsPage.clearFilters')"
              @click="clearAllFilters"
              color="grey-7"
              size="sm"
            />
          </div>
        </div>

        <!-- Expandable Filters -->
        <q-slide-transition>
          <div v-show="showFilters" class="filters-panel">
            <div class="filters-grid">
              <div class="filter-group">
                <label class="filter-label">{{
                  $t('productsPage.filters.category')
                }}</label>
                <q-select
                  v-model="filters.category"
                  :options="categoryOptions"
                  emit-value
                  map-options
                  clearable
                  outlined
                  dense
                  :placeholder="$t('productsPage.filters.selectCategory')"
                  @update:model-value="updateFilters({ category: $event })"
                />
              </div>

              <div class="filter-group">
                <label class="filter-label">{{
                  $t('productsPage.filters.stockStatus')
                }}</label>
                <q-select
                  v-model="filters.stock_status"
                  :options="stockStatusOptions"
                  emit-value
                  map-options
                  clearable
                  outlined
                  dense
                  :placeholder="$t('productsPage.filters.selectStockStatus')"
                  @update:model-value="updateFilters({ stock_status: $event })"
                />
              </div>

              <div class="filter-group">
                <label class="filter-label">{{
                  $t('productsPage.filters.supplier')
                }}</label>
                <q-select
                  v-model="filters.supplier"
                  :options="supplierOptions"
                  emit-value
                  map-options
                  clearable
                  outlined
                  dense
                  :placeholder="$t('productsPage.filters.selectSupplier')"
                  @update:model-value="updateFilters({ supplier: $event })"
                />
              </div>

              <div class="filter-group">
                <label class="filter-label">{{
                  $t('productsPage.filters.priceRange')
                }}</label>
                <div class="price-range">
                  <q-input
                    v-model.number="localPriceMin"
                    type="number"
                    outlined
                    dense
                    :placeholder="$t('productsPage.filters.minPrice')"
                    @update:model-value="handlePriceMinChange"
                    class="price-input"
                  />
                  <span class="price-separator">-</span>
                  <q-input
                    v-model.number="localPriceMax"
                    type="number"
                    outlined
                    dense
                    :placeholder="$t('productsPage.filters.maxPrice')"
                    @update:model-value="handlePriceMaxChange"
                    class="price-input"
                  />
                </div>
              </div>
            </div>
          </div>
        </q-slide-transition>
      </div>

      <!-- Products - Responsive Layout -->
      <div class="products-table-container">
        <!-- Desktop Table View -->
        <q-table
          v-if="!$q.screen.lt.md"
          :rows="filteredProducts"
          :columns="tableColumns"
          :loading="loading"
          :pagination="pagination"
          :rows-per-page-options="[25, 50, 100]"
          row-key="id"
          flat
          bordered
          class="products-table desktop-only"
          @update:pagination="
            value =>
              (pagination = { ...value, rowsNumber: value.rowsNumber ?? 0 })
          "
        >
          <!-- Loading -->
          <template #loading>
            <q-inner-loading showing color="primary" />
          </template>

          <!-- No Data -->
          <template #no-data>
            <div class="full-width row flex-center q-gutter-sm">
              <q-icon size="2em" name="sentiment_dissatisfied" />
              <span>{{ $t('productsPage.noProductsFound') }}</span>
            </div>
          </template>

          <!-- Product Name Cell -->
          <template #body-cell-name="props">
            <q-td :props="props" class="product-name-cell">
              <div class="product-info">
                <div class="product-name">{{ props.row.name }}</div>
                <div v-if="props.row.brand" class="product-brand">
                  {{ props.row.brand }}
                </div>
              </div>
            </q-td>
          </template>

          <!-- SKU Cell -->
          <template #body-cell-sku="props">
            <q-td :props="props">
              <code class="sku-code">{{ props.row.sku || '-' }}</code>
            </q-td>
          </template>

          <!-- Stock Status Cell -->
          <template #body-cell-stock_status="props">
            <q-td :props="props">
              <div class="stock-info">
                <q-chip
                  :color="getStockStatusColor(props.row.stock_status)"
                  :text-color="getStockStatusTextColor(props.row.stock_status)"
                  :label="
                    $t(`productsPage.stockStatus.${props.row.stock_status}`)
                  "
                  size="sm"
                  dense
                />
                <div class="stock-quantity">
                  {{ props.row.total_stock }} {{ props.row.unit || '' }}
                </div>
              </div>
            </q-td>
          </template>

          <!-- Price Cell -->
          <template #body-cell-price="props">
            <q-td :props="props">
              <div v-if="getBestPrice(props.row)" class="price-info">
                <div class="price-value">
                  {{ formatPrice(getBestPrice(props.row)!) }}
                </div>
                <div
                  v-if="props.row.supplier_products?.length > 1"
                  class="price-note"
                >
                  {{ $t('productsPage.bestPrice') }}
                </div>
              </div>
              <span v-else class="text-grey-6">-</span>
            </q-td>
          </template>

          <!-- Batch Status Cell -->
          <template #body-cell-batch_status="props">
            <q-td :props="props">
              <div v-if="props.row.requires_batch_tracking">
                <div v-if="props.row.batches?.length > 0" class="batch-info">
                  <q-chip
                    :color="getBatchStatusColor(props.row)"
                    :text-color="getBatchStatusTextColor(props.row)"
                    :label="getBatchStatusLabel(props.row)"
                    size="sm"
                    dense
                  />
                  <div class="batch-count">
                    {{ props.row.batches.length }}
                    {{ $t('productsPage.batches') }}
                  </div>
                </div>
                <span v-else class="text-grey-6">{{
                  $t('productsPage.noBatches')
                }}</span>
              </div>
              <div v-else class="manual-stock-indicator">
                <q-chip
                  color="info"
                  text-color="white"
                  :label="$t('productsPage.manualStock')"
                  size="sm"
                  dense
                />
              </div>
            </q-td>
          </template>

          <!-- Actions Cell -->
          <template #body-cell-actions="props">
            <q-td :props="props">
              <div class="action-buttons">
                <q-btn
                  flat
                  dense
                  round
                  icon="visibility"
                  color="primary"
                  size="sm"
                  :title="$t('productsPage.viewDetails')"
                  @click="showProductDetails(props.row)"
                />

                <q-btn
                  flat
                  dense
                  round
                  icon="add_shopping_cart"
                  color="positive"
                  size="sm"
                  :disable="props.row.stock_status === 'out_of_stock'"
                  :title="$t('productsPage.addToCart')"
                  @click="handleAddToCart(props.row)"
                />

                <q-btn
                  flat
                  dense
                  round
                  icon="playlist_add"
                  color="secondary"
                  size="sm"
                  :title="$t('productsPage.addToOrderList')"
                  @click="handleAddToOrderList(props.row)"
                />

                <q-btn
                  flat
                  dense
                  round
                  icon="expand_more"
                  color="grey-7"
                  size="sm"
                  :title="$t('productsPage.expandDetails')"
                  @click="toggleRowExpansion(props.row.id)"
                />
              </div>
            </q-td>
          </template>

          <!-- Expanded Row -->
          <template #body-cell-expand="props">
            <q-td colspan="100%" v-if="expandedRows.includes(props.row.id)">
              <div class="expanded-content">
                <div class="expanded-grid">
                  <div class="detail-section">
                    <h6 class="section-title">
                      {{ $t('productsPage.productDetails') }}
                    </h6>
                    <div class="detail-items">
                      <div class="detail-item">
                        <span class="detail-label"
                          >{{ $t('productsPage.description') }}:</span
                        >
                        <span class="detail-value">{{
                          props.row.description || '-'
                        }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label"
                          >{{ $t('productsPage.category') }}:</span
                        >
                        <span class="detail-value">{{
                          props.row.category || '-'
                        }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label"
                          >{{ $t('productsPage.unit') }}:</span
                        >
                        <span class="detail-value">{{
                          props.row.unit || '-'
                        }}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    v-if="props.row.supplier_products?.length > 0"
                    class="detail-section"
                  >
                    <h6 class="section-title">
                      {{ $t('productsPage.suppliers') }}
                    </h6>
                    <div class="supplier-list">
                      <div
                        v-for="supplier in props.row.supplier_products"
                        :key="supplier.supplier_id"
                        class="supplier-item"
                      >
                        <span class="supplier-name">{{
                          supplier.supplier_name
                        }}</span>
                        <span class="supplier-price">{{
                          formatPrice(supplier.unit_price)
                        }}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    v-if="props.row.stock_levels?.length > 0"
                    class="detail-section"
                  >
                    <h6 class="section-title">
                      {{ $t('productsPage.stockLevels') }}
                    </h6>
                    <div class="stock-list">
                      <div
                        v-for="stock in props.row.stock_levels"
                        :key="stock.location_id"
                        class="stock-item"
                      >
                        <span class="location-name">{{
                          stock.location_name || stock.location_id
                        }}</span>
                        <span class="stock-amount"
                          >{{ stock.quantity }} {{ props.row.unit }}</span
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </q-td>
          </template>
        </q-table>

        <!-- Mobile Card View -->
        <div v-else class="mobile-products-cards">
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            class="product-card mobile-only"
            @click="viewProductDetails(product)"
          >
            <div class="product-card-header">
              <div class="product-info">
                <div class="product-name">{{ product.name }}</div>
                <div v-if="product.brand" class="product-brand">{{ product.brand }}</div>
                <div class="product-sku">{{ product.sku || '-' }}</div>
              </div>
              <q-chip
                :color="getStockStatusColor(product.stock_status)"
                :text-color="getStockStatusTextColor(product.stock_status)"
                :label="$t(`productsPage.stockStatus.${product.stock_status}`)"
                size="sm"
              />
            </div>

            <div class="product-card-body">
              <div class="product-details-grid">
                <div class="detail-item">
                  <div class="detail-label">Categorie</div>
                  <div class="detail-value">{{ product.category || 'Onbekend' }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Voorraad</div>
                  <div class="detail-value">{{ product.total_stock || 0 }} {{ product.unit || 'st' }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Prijs</div>
                  <div class="detail-value">
                    <span v-if="getBestPrice(product)">
                      {{ formatPrice(getBestPrice(product)!) }}
                    </span>
                    <span v-else class="text-grey-6">Niet beschikbaar</span>
                  </div>
                </div>
              </div>

              <div v-if="product.description" class="product-description">
                {{ product.description }}
              </div>
            </div>

            <div class="product-card-actions">
              <q-btn
                icon="info"
                label="Details"
                flat
                color="primary"
                size="md"
                class="mobile-action-btn"
                @click.stop="viewProductDetails(product)"
              />
              <q-btn
                icon="add_shopping_cart"
                label="Bestellen"
                flat
                color="positive"
                size="md"
                class="mobile-action-btn"
                @click.stop="handleAddToCart(product, 1)"
                :disable="product.stock_status === 'out_of_stock'"
              />
              <q-btn
                icon="playlist_add"
                flat
                color="blue-6"
                size="md"
                class="mobile-action-btn-icon"
                @click.stop="handleAddToOrderList(product)"
                :title="'Toevoegen aan orderlijst'"
              />
            </div>
          </div>

          <!-- Mobile Loading State -->
          <div v-if="loading" class="mobile-loading">
            <q-spinner-dots size="xl" color="primary" />
            <div class="loading-text">{{ $t('productsPage.loading') }}</div>
          </div>

          <!-- Mobile Empty State -->
          <div v-else-if="filteredProducts.length === 0" class="mobile-empty">
            <q-icon name="inventory_2" size="4rem" color="grey-5" />
            <div class="empty-title">Geen producten gevonden</div>
            <div class="empty-subtitle">Probeer je zoekopdracht aan te passen</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Details Dialog -->
    <ProductDetailsDialog
      v-model="showDetailsDialog"
      :product="selectedProduct"
      @add-to-cart="handleAddToCart"
      @add-to-order-list="handleAddToOrderList"
    />

    <!-- Shopping Cart Dialog -->
    <ShoppingCartDialog
      v-model="showCartDialog"
      :cart-items="cart"
      :cart-total="cartTotal"
      @update-quantity="updateCartItemQuantity"
      @remove-item="removeFromCart"
      @clear-cart="clearCart"
      @checkout="handleCheckout"
    />

    <!-- Order List Dialog -->
    <OrderListDialog
      v-model="showOrderListDialog"
      :order-lists="orderLists"
      :selected-product="selectedProduct"
      @create-order-list="handleCreateOrderList"
      @add-to-existing="handleAddToExistingOrderList"
    />
  </PageLayout>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useQuasar } from 'quasar';
  import { useProductsStore } from 'src/stores/products';
  import { useOrderListsStore } from 'src/stores/orderLists';
  import { useAuthStore } from 'src/stores/auth';
  import PageLayout from 'src/components/PageLayout.vue';
  import PageTitle from 'src/components/PageTitle.vue';
  import ProductDetailsDialog from 'src/components/products/ProductDetailsDialog.vue';
  import ShoppingCartDialog from 'src/components/products/ShoppingCartDialog.vue';
  import OrderListDialog from 'src/components/products/OrderListDialog.vue';
  import type {
    ProductWithStock,
    ProductBatchSummary,
  } from 'src/types/inventory';

  const { t, locale } = useI18n();
  const $q = useQuasar();
  const productsStore = useProductsStore();
  const orderListsStore = useOrderListsStore();
  const authStore = useAuthStore();

  // Reactive data
  const selectedProduct = ref<ProductWithStock | null>(null);
  const showDetailsDialog = ref(false);
  const showCartDialog = ref(false);
  const showOrderListDialog = ref(false);
  const showFilters = ref(false);
  const localSearch = ref('');
  const expandedRows = ref<string[]>([]);
  const localPriceMin = ref<number | null>(null);
  const localPriceMax = ref<number | null>(null);

  const pagination = ref({
    sortBy: null as string | null,
    descending: false,
    page: 1,
    rowsPerPage: 25,
    rowsNumber: 0,
  });

  // Store getters
  const {
    products,
    filteredProducts,
    loading,
    cart,
    cartItemsCount,
    cartTotal,
    orderLists,
    filters,
    availableCategories,
    availableSuppliers,
    productStats,
  } = productsStore;

  // Table columns configuration
  const tableColumns = computed(() => [
    {
      name: 'name',
      label: t('productsPage.table.name'),
      field: 'name',
      align: 'left' as const,
      sortable: true,
      style: 'width: 250px',
    },
    {
      name: 'sku',
      label: t('productsPage.table.sku'),
      field: 'sku',
      align: 'left' as const,
      sortable: true,
      style: 'width: 120px',
    },
    {
      name: 'stock_status',
      label: t('productsPage.table.stockStatus'),
      field: 'stock_status',
      align: 'center' as const,
      sortable: true,
      style: 'width: 150px',
    },
    {
      name: 'price',
      label: t('productsPage.table.price'),
      field: 'lowest_price',
      align: 'right' as const,
      sortable: true,
      style: 'width: 120px',
    },
    {
      name: 'batch_status',
      label: t('productsPage.table.stockType'),
      field: 'batch_status',
      align: 'center' as const,
      sortable: false,
      style: 'width: 140px',
    },
    {
      name: 'actions',
      label: t('productsPage.table.actions'),
      field: '',
      align: 'center' as const,
      sortable: false,
      style: 'width: 180px',
    },
  ]);

  // Filter options
  const categoryOptions = computed(
    () =>
      availableCategories?.map((cat: string) => ({ label: cat, value: cat })) ??
      []
  );

  const supplierOptions = computed(() => [
    { label: t('productsPage.filters.remka'), value: 'remka' },
    { label: t('productsPage.filters.external'), value: 'external' },
  ]);

  const stockStatusOptions = computed(() => [
    { label: t('productsPage.stockStatus.in_stock'), value: 'in_stock' },
    { label: t('productsPage.stockStatus.low_stock'), value: 'low_stock' },
    {
      label: t('productsPage.stockStatus.out_of_stock'),
      value: 'out_of_stock',
    },
  ]);

  // Filter state
  const hasActiveFilters = computed(() => {
    return !!(
      filters.category ||
      filters.stock_status ||
      filters.supplier ||
      localPriceMin.value ||
      localPriceMax.value ||
      filters.search
    );
  });

  const activeFiltersCount = computed(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.stock_status) count++;
    if (filters.supplier) count++;
    if (localPriceMin.value || localPriceMax.value) count++;
    if (filters.search) count++;
    return count;
  });

  // Statistics cards
  const statsCards = computed(() => ({
    total: {
      value: productStats?.total ?? 0,
      label: t('productsPage.stats.totalProducts'),
    },
    inStock: {
      value: productStats?.inStock ?? 0,
      label: t('productsPage.stats.inStockProducts'),
    },
    lowStock: {
      value: productStats?.lowStock ?? 0,
      label: t('productsPage.stats.lowStockProducts'),
    },
    outOfStock: {
      value: productStats?.outOfStock ?? 0,
      label: t('productsPage.stats.outOfStockProducts'),
    },
  }));

  // Helper functions
  const getStockStatusColor = (status: string): string => {
    switch (status) {
      case 'in_stock':
        return 'positive';
      case 'low_stock':
        return 'warning';
      case 'out_of_stock':
        return 'negative';
      default:
        return 'grey';
    }
  };

  const getStockStatusTextColor = (status: string): string => {
    switch (status) {
      case 'in_stock':
        return 'white';
      case 'low_stock':
        return 'black';
      case 'out_of_stock':
        return 'white';
      default:
        return 'black';
    }
  };

  const getBatchStatusColor = (product: ProductWithStock): string => {
    if (!product.batches?.length) return 'grey';

    const hasExpiring = product.batches.some(
      (b: ProductBatchSummary) =>
        b.urgency === 'warning' || b.urgency === 'critical'
    );
    const hasExpired = product.batches.some(
      (b: ProductBatchSummary) => b.urgency === 'expired'
    );

    if (hasExpired) return 'negative';
    if (hasExpiring) return 'warning';
    return 'positive';
  };

  const getBatchStatusTextColor = (product: ProductWithStock): string => {
    const color = getBatchStatusColor(product);
    return color === 'warning' ? 'black' : 'white';
  };

  const getBatchStatusLabel = (product: ProductWithStock): string => {
    if (!product.batches?.length) return t('productsPage.noBatches');

    const hasExpired = product.batches.some(
      (b: ProductBatchSummary) => b.urgency === 'expired'
    );
    const hasExpiring = product.batches.some(
      (b: ProductBatchSummary) =>
        b.urgency === 'warning' || b.urgency === 'critical'
    );

    if (hasExpired) return t('productsPage.batchStatus.expired');
    if (hasExpiring) return t('productsPage.batchStatus.expiring');
    return t('productsPage.batchStatus.good');
  };

  const getBestPrice = (product: ProductWithStock): number | null => {
    if (!product.supplier_products?.length) return null;

    const prices = product.supplier_products
      .filter(sp => sp.unit_price && sp.unit_price > 0)
      .map(sp => sp.unit_price)
      .sort((a, b) => a - b);

    return prices[0] || null;
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat(locale.value, {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  // Event handlers
  const updateSearchFilter = (searchValue: string | number | null) => {
    const searchString = searchValue?.toString() || '';
    updateFilters({ search: searchString });
  };

  const clearAllFilters = () => {
    localSearch.value = '';
    localPriceMin.value = null;
    localPriceMax.value = null;
    productsStore.clearFilters();
    showFilters.value = false;
  };

  const handlePriceMinChange = (value: string | number | null) => {
    localPriceMin.value =
      typeof value === 'string' ? parseFloat(value) || null : value;
    // Implement price filtering logic here if needed
  };

  const handlePriceMaxChange = (value: string | number | null) => {
    localPriceMax.value =
      typeof value === 'string' ? parseFloat(value) || null : value;
    // Implement price filtering logic here if needed
  };

  const toggleRowExpansion = (productId: string) => {
    const index = expandedRows.value.indexOf(productId);
    if (index > -1) {
      expandedRows.value.splice(index, 1);
    } else {
      expandedRows.value.push(productId);
    }
  };

  const showProductDetails = (product: ProductWithStock) => {
    selectedProduct.value = product;
    showDetailsDialog.value = true;
  };

  const handleAddToCart = (product: ProductWithStock) => {
    try {
      productsStore.addToCart(product, 1);
      $q.notify({
        type: 'positive',
        message: t('productsPage.addedToCart', { productName: product.name }),
        position: 'top',
      });
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: t('productsPage.cartAddError'),
        position: 'top',
      });
    }
  };

  const handleAddToOrderList = (product: ProductWithStock) => {
    selectedProduct.value = product;
    showOrderListDialog.value = true;
  };

  const refreshData = async () => {
    try {
      const practiceId = authStore.clinicId;
      if (!practiceId) return;

      await productsStore.refreshData(practiceId);
      $q.notify({
        type: 'positive',
        message: t('productsPage.dataRefreshed'),
      });
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: t('productsPage.productLoadError'),
      });
    }
  };

  // Store actions
  const { updateFilters } = productsStore;
  const { updateCartItemQuantity, removeFromCart, clearCart } = productsStore;
  const handleCreateOrderList = orderListsStore.createOrderList;
  const handleAddToExistingOrderList = orderListsStore.addOrderListItem;

  const handleCheckout = () => {
    $q.notify({
      type: 'info',
      message: t('common.comingSoon'),
    });
  };

  // Watch for search changes
  watch(localSearch, newValue => {
    updateSearchFilter(newValue);
  });

  // Lifecycle
  onMounted(async () => {
    const practiceId = authStore.clinicId;
    if (practiceId) {
      await productsStore.fetchProducts(practiceId);
    }
  });
</script>

<style lang="scss" scoped>
  .products-page {
    .products-header {
      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;

        .title-section {
          flex: 1;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
      }
    }

    .filters-section {
      margin-bottom: 1.5rem;

      .filters-toolbar {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;

        .search-section {
          flex: 1;
          max-width: 400px;

          .search-input {
            width: 100%;
          }
        }

        .filter-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;

          .filter-toggle {
            position: relative;
          }
        }
      }

      .filters-panel {
        background: rgba(255, 255, 255, 0.8);
        border-radius: 8px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        padding: 1.5rem;

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;

          .filter-group {
            .filter-label {
              display: block;
              font-size: 0.875rem;
              font-weight: 500;
              margin-bottom: 0.5rem;
              color: rgba(0, 0, 0, 0.8);
            }

            .price-range {
              display: flex;
              align-items: center;
              gap: 0.5rem;

              .price-input {
                flex: 1;
              }

              .price-separator {
                color: rgba(0, 0, 0, 0.6);
                font-weight: 500;
              }
            }
          }
        }
      }
    }

    .products-table-container {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgba(0, 0, 0, 0.08);

      .products-table {
        .product-name-cell {
          .product-info {
            .product-name {
              font-weight: 500;
              line-height: 1.3;
            }

            .product-brand {
              font-size: 0.75rem;
              color: rgba(0, 0, 0, 0.6);
              margin-top: 0.25rem;
            }
          }
        }

        .sku-code {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.85rem;
          background: rgba(0, 0, 0, 0.05);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .stock-info,
        .batch-info,
        .price-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;

          .stock-quantity,
          .batch-count {
            font-size: 0.75rem;
            color: rgba(0, 0, 0, 0.6);
          }

          .price-note {
            font-size: 0.65rem;
            color: rgba(0, 0, 0, 0.5);
            font-style: italic;
          }
        }

        .price-info {
          align-items: flex-end;

          .price-value {
            font-weight: 600;
            color: var(--q-primary);
          }
        }

        .action-buttons {
          display: flex;
          gap: 0.25rem;
          justify-content: center;
        }

        .expanded-content {
          padding: 1rem;
          background: rgba(0, 0, 0, 0.02);
          border-top: 1px solid rgba(0, 0, 0, 0.08);

          .expanded-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;

            .detail-section {
              .section-title {
                font-size: 0.875rem;
                font-weight: 600;
                margin: 0 0 0.75rem 0;
                color: rgba(0, 0, 0, 0.8);
              }

              .detail-items {
                .detail-item {
                  display: flex;
                  margin-bottom: 0.5rem;

                  .detail-label {
                    font-weight: 500;
                    margin-right: 0.5rem;
                    min-width: 80px;
                    font-size: 0.8rem;
                    color: rgba(0, 0, 0, 0.7);
                  }

                  .detail-value {
                    font-size: 0.8rem;
                    color: rgba(0, 0, 0, 0.8);
                  }
                }
              }

              .supplier-list,
              .stock-list {
                .supplier-item,
                .stock-item {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 0.5rem;
                  background: white;
                  border-radius: 4px;
                  margin-bottom: 0.5rem;
                  border: 1px solid rgba(0, 0, 0, 0.08);

                  .supplier-name,
                  .location-name {
                    font-size: 0.8rem;
                    font-weight: 500;
                  }

                  .supplier-price,
                  .stock-amount {
                    font-size: 0.8rem;
                    color: var(--q-primary);
                    font-weight: 600;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // Mobile responsiveness
  @media (max-width: 768px) {
    .products-page {
      .products-header {
        .header-content {
          flex-direction: column;
          gap: 1rem;

          .header-actions {
            align-self: stretch;
            justify-content: center;
          }
        }
      }

      .filters-section {
        .filters-toolbar {
          flex-direction: column;
          align-items: stretch;

          .search-section {
            max-width: none;
          }

          .filter-controls {
            justify-content: center;
          }
        }

        .filters-panel {
          .filters-grid {
            grid-template-columns: 1fr;
          }
        }
      }
    }
  }

  // Mobile Product Cards
  .mobile-products-cards {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-4);

    .product-card {
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--neutral-200);
      overflow: hidden;
      transition: all 0.2s ease;
      cursor: pointer;

      &:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-1px);
      }

      &:active {
        transform: translateY(0);
        box-shadow: var(--shadow-sm);
      }

      .product-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: var(--space-4) var(--space-4) var(--space-3) var(--space-4);
        border-bottom: 1px solid var(--neutral-100);

        .product-info {
          flex: 1;

          .product-name {
            font-size: var(--text-base);
            font-weight: var(--font-weight-semibold);
            color: var(--text-primary);
            margin-bottom: var(--space-1);
            line-height: 1.4;
          }

          .product-brand {
            font-size: var(--text-sm);
            color: var(--text-muted);
            margin-bottom: var(--space-1);
          }

          .product-sku {
            font-size: var(--text-xs);
            color: var(--text-muted);
            font-family: monospace;
            background: var(--neutral-100);
            padding: 2px 6px;
            border-radius: var(--radius-sm);
            display: inline-block;
          }
        }
      }

      .product-card-body {
        padding: var(--space-4);

        .product-details-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-3);
          margin-bottom: var(--space-3);

          .detail-item {
            text-align: center;
            padding: var(--space-2);
            border: 1px solid var(--neutral-200);
            border-radius: var(--radius-sm);

            .detail-label {
              font-size: var(--text-xs);
              color: var(--text-muted);
              display: block;
              margin-bottom: var(--space-1);
            }

            .detail-value {
              font-size: var(--text-sm);
              font-weight: var(--font-weight-semibold);
              color: var(--text-primary);
            }
          }
        }

        .product-description {
          font-size: var(--text-sm);
          color: var(--text-muted);
          line-height: 1.4;
          background: var(--neutral-50);
          padding: var(--space-3);
          border-radius: var(--radius-md);
          border-left: 3px solid var(--primary);
        }
      }

      .product-card-actions {
        display: flex;
        gap: var(--space-2);
        padding: var(--space-3) var(--space-4);
        background: var(--neutral-50);
        border-top: 1px solid var(--neutral-100);

        .mobile-action-btn {
          flex: 1;
          min-height: 44px;
          font-weight: var(--font-weight-medium);
          border-radius: var(--radius-md);
          border: 1px solid currentColor;
          transition: all 0.2s ease;

          &:hover {
            background: rgba(currentColor, 0.1);
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }

        .mobile-action-btn-icon {
          min-width: 44px;
          min-height: 44px;
          border-radius: var(--radius-md);
          border: 1px solid currentColor;
          transition: all 0.2s ease;

          &:hover {
            background: rgba(currentColor, 0.1);
          }
        }
      }
    }

    .mobile-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-12);
      gap: var(--space-4);

      .loading-text {
        color: var(--text-muted);
        font-size: var(--text-base);
      }
    }

    .mobile-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-12);
      text-align: center;

      .empty-title {
        font-size: var(--text-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
        margin: var(--space-4) 0 var(--space-2) 0;
      }

      .empty-subtitle {
        font-size: var(--text-sm);
        color: var(--text-muted);
        max-width: 300px;
      }
    }
  }

  // Dark mode support
  body.body--dark {
    .mobile-products-cards {
      .product-card {
        background: var(--neutral-800);
        border-color: var(--neutral-700);

        .product-card-header {
          border-color: var(--neutral-700);

          .product-name {
            color: var(--text-primary-dark);
          }

          .product-brand,
          .product-sku {
            color: var(--text-muted-dark);
          }

          .product-sku {
            background: var(--neutral-700);
          }
        }

        .product-card-body {
          .product-details-grid .detail-item {
            border-color: var(--neutral-600);
            background: var(--neutral-750);
          }

          .product-description {
            background: var(--neutral-700);
            border-color: var(--primary);
          }
        }

        .product-card-actions {
          background: var(--neutral-700);
          border-color: var(--neutral-600);
        }
      }
    }
  }

  @media (max-width: 480px) {
    // Additional mobile styles can be added here when needed
    .mobile-products-cards {
      padding: var(--space-3);
      gap: var(--space-3);

      .product-card {
        .product-details-grid {
          grid-template-columns: 1fr 1fr;
          gap: var(--space-2);

          .detail-item:nth-child(3) {
            grid-column: span 2;
          }
        }

        .product-card-actions {
          flex-direction: column;
          gap: var(--space-2);

          .mobile-action-btn,
          .mobile-action-btn-icon {
            min-height: 40px;
          }
        }
      }
    }
  }
</style>
