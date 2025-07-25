<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    maximized
    class="product-details-dialog"
  >
    <BaseCard 
      variant="elevated" 
      class="column no-wrap full-height"
      title="Product Details" 
      subtitle="View and manage product information"
      icon="info"
      icon-color="primary"
      header-color="primary"
    >
      <template #header-actions>
        <q-btn
          icon="close"
          flat
          round
          dense
          v-close-popup
          :title="$t('common.close')"
        />
      </template>

      <!-- Content -->
      <q-card-section class="col scroll">
        <div v-if="product" class="q-gutter-lg">
          <!-- Product Image -->
          <div v-if="product.image_url" class="text-center">
            <q-img
              :src="product.image_url"
              :alt="product.name"
              style="max-width: 300px; max-height: 200px"
              class="rounded-borders"
              fit="contain"
            >
              <template #error>
                <div class="absolute-full flex flex-center bg-grey-3">
                  <q-icon name="image" size="3rem" color="grey-5" />
                  <div class="q-ml-sm text-grey-6">
                    {{ $t('productsPage.details.noImage') }}
                  </div>
                </div>
              </template>
            </q-img>
          </div>

          <!-- Basic Information Card -->
          <BaseCard>
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon name="info" class="q-mr-sm" />
                {{ $t('productsPage.details.basicInfo') }}
              </div>

              <div class="row q-gutter-md">
                <div class="col-12 col-md-6">
                  <q-list dense>
                    <q-item>
                      <q-item-section>
                        <q-item-label class="text-caption text-grey-6">
                          {{ $t('productsPage.details.name') }}
                        </q-item-label>
                        <q-item-label class="text-weight-medium">
                          {{ product.name }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item>
                      <q-item-section>
                        <q-item-label class="text-caption text-grey-6">
                          {{ $t('productsPage.details.sku') }}
                        </q-item-label>
                        <q-item-label class="text-weight-medium">
                          {{ product.sku || $t('common.noSku') }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item>
                      <q-item-section>
                        <q-item-label class="text-caption text-grey-6">
                          {{ $t('productsPage.details.category') }}
                        </q-item-label>
                        <q-item-label class="text-weight-medium">
                          <q-chip
                            v-if="product.category"
                            :label="product.category"
                            size="sm"
                            color="grey-3"
                            text-color="grey-8"
                            icon="category"
                          />
                          <span v-else class="text-grey-6">-</span>
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>

                <div class="col-12 col-md-6">
                  <q-list dense>
                    <q-item v-if="product.brand">
                      <q-item-section>
                        <q-item-label class="text-caption text-grey-6">
                          {{ $t('productsPage.details.brand') }}
                        </q-item-label>
                        <q-item-label class="text-weight-medium">
                          {{ product.brand }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item v-if="product.unit">
                      <q-item-section>
                        <q-item-label class="text-caption text-grey-6">
                          {{ $t('productsPage.details.unit') }}
                        </q-item-label>
                        <q-item-label class="text-weight-medium">
                          {{ product.unit }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item>
                      <q-item-section>
                        <q-item-label class="text-caption text-grey-6">
                          {{ $t('productsPage.details.price') }}
                        </q-item-label>
                        <q-item-label class="text-weight-medium">
                          <span v-if="bestPrice" class="text-h6 text-primary">
                            {{ formatPrice(bestPrice.price) }}
                          </span>
                          <span v-else class="text-grey-6">
                            {{ $t('productsPage.details.priceNotAvailable') }}
                          </span>
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>
              </div>

              <!-- Description -->
              <div class="q-mt-md">
                <q-item-label class="text-caption text-grey-6 q-mb-xs">
                  {{ $t('productsPage.details.description') }}
                </q-item-label>
                <div class="text-body2">
                  {{
                    product.description ||
                    $t('productsPage.details.noDescription')
                  }}
                </div>
              </div>
            </q-card-section>
          </BaseCard>

          <!-- Stock Information Card -->
          <BaseCard>
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon name="inventory_2" class="q-mr-sm" />
                {{ $t('productsPage.details.stockInfo') }}
              </div>

              <div class="row q-gutter-md">
                <div class="col-12 col-md-6">
                  <q-item>
                    <q-item-section>
                      <q-item-label class="text-caption text-grey-6">
                        {{ $t('productsPage.details.currentStock') }}
                      </q-item-label>
                      <q-item-label class="text-h6">
                        {{ product.total_stock }} {{ product.unit || '' }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-icon
                        :name="stockStatusIcon"
                        :color="stockStatusColor"
                        size="1.5rem"
                      />
                    </q-item-section>
                  </q-item>
                </div>

                <div class="col-12 col-md-6">
                  <q-item>
                    <q-item-section>
                      <q-item-label class="text-caption text-grey-6">
                        {{ $t('productsPage.table.stockStatus') }}
                      </q-item-label>
                      <q-item-label>
                        <q-badge
                          :color="stockStatusColor"
                          :label="
                            $t(
                              `productsPage.stockStatus.${product.stock_status}`
                            )
                          "
                        />
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </div>
              </div>
            </q-card-section>
          </BaseCard>
        </div>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions class="bg-grey-1 q-pa-md">
        <q-btn
          :label="$t('productsPage.addToCart')"
          icon="add_shopping_cart"
          color="primary"
          class="q-mr-sm"
          :disable="product?.stock_status === 'out_of_stock'"
          @click="$emit('addToCart', product)"
        />
        <q-btn
          :label="$t('productsPage.addToOrderList')"
          icon="playlist_add"
          color="secondary"
          outline
          @click="$emit('addToOrderList', product)"
        />
        <q-space />
        <q-btn :label="$t('common.close')" color="grey-7" flat v-close-popup />
      </template>
    </BaseCard>
  </q-dialog>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import BaseCard from 'src/components/base/BaseCard.vue';
  import { useFormatting } from 'src/composables/useFormatting';
  import type { ProductWithStock } from 'src/types/inventory';

  interface Props {
    modelValue: boolean;
    product?: ProductWithStock | null;
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void;
    (e: 'addToCart', product: ProductWithStock): void;
    (e: 'addToOrderList', product: ProductWithStock): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();
  const { t, locale } = useI18n();
  const { formatPrice } = useFormatting();

  const isOpen = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value),
  });

  const stockStatusColor = computed(() => {
    if (!props.product) return 'grey';

    switch (props.product.stock_status) {
      case 'in_stock':
        return 'positive';
      case 'low_stock':
        return 'warning';
      case 'out_of_stock':
        return 'negative';
      default:
        return 'grey';
    }
  });

  const stockStatusIcon = computed(() => {
    if (!props.product) return 'help';

    switch (props.product.stock_status) {
      case 'in_stock':
        return 'check_circle';
      case 'low_stock':
        return 'warning';
      case 'out_of_stock':
        return 'cancel';
      default:
        return 'help';
    }
  });

  const bestPrice = computed(() => {
    if (!props.product?.supplier_products?.length) return null;

    const pricesWithSupplier = props.product.supplier_products
      .filter(sp => sp.price && sp.price > 0)
      .map(sp => ({
        price: sp.price,
        supplier: sp.supplier_name || sp.supplier_id,
      }))
      .sort((a, b) => a.price - b.price);

    return pricesWithSupplier[0] || null;
  });
</script>

<style lang="scss" scoped>
  .product-details-dialog {
    .q-dialog__inner {
      padding: 0;
    }
  }
</style>
