<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    @hide="onDialogHide"
    persistent
    :style="{ maxWidth: '95vw', maxHeight: '95vh' }"
  >
    <q-card class="column" style="min-height: 600px; max-height: 85vh; width: 90vw; max-width: 1200px;">
      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>
          {{
            isEditing
              ? $t('orderLists.editDialog')
              : $t('orderLists.createDialog')
          }}
        </q-toolbar-title>
        <q-btn flat round dense icon="close" @click="closeDialog" />
      </q-toolbar>

      <q-card-section class="col q-pa-none">
        <div class="row no-wrap full-height">
          <!-- Left Panel - Order List Details -->
          <div class="col-12 col-md-4 q-pa-md bg-grey-1">
            <div class="text-h6 q-mb-md">{{ $t('orderLists.details') }}</div>

            <q-form @submit="saveOrderList" class="q-gutter-md">
              <q-input
                v-model="form.name"
                :label="$t('orderLists.name')"
                :rules="[
                  val => !!val || $t('orderLists.nameRequired'),
                  val => val.length >= 3 || $t('orderLists.nameMinLength'),
                ]"
                outlined
                dense
                ref="nameInput"
              />

              <q-input
                v-model="form.description"
                :label="$t('orderLists.description')"
                type="textarea"
                rows="3"
                outlined
                dense
              />

              <q-select
                v-model="form.supplier_id"
                :options="supplierOptions"
                :label="$t('orderLists.supplier')"
                :rules="[val => !!val || $t('orderLists.supplierRequired')]"
                outlined
                dense
                emit-value
                map-options
              />

              <q-input
                v-model="form.notes"
                :label="$t('orderLists.notes')"
                type="textarea"
                rows="2"
                outlined
                dense
              />

              <div class="row q-gutter-sm">
                <q-checkbox
                  v-model="form.auto_suggest_quantities"
                  :label="$t('orderLists.autoFill')"
                />
                <q-checkbox
                  v-model="form.urgent_order"
                  :label="$t('orderLists.urgent')"
                  color="orange"
                />
              </div>

              <!-- Summary -->
              <q-separator class="q-my-md" />

              <div class="text-subtitle2 q-mb-sm">
                {{ $t('orderLists.summary') }}
              </div>
              <div class="row q-gutter-sm text-body2">
                <div class="col-6">
                  <div class="text-grey-6">
                    {{ $t('orderLists.totalItems') }}
                  </div>
                  <div class="text-weight-bold">{{ totalItems }}</div>
                </div>
                <div class="col-6">
                  <div class="text-grey-6">
                    {{ $t('orderLists.totalAmount') }}
                  </div>
                  <div class="text-weight-bold">
                    €{{ totalAmount.toFixed(2) }}
                  </div>
                </div>
              </div>
            </q-form>
          </div>

          <!-- Right Panel - Products -->
          <div class="col-12 col-md-8 q-pa-md">
            <div class="row items-center q-mb-md">
              <div class="col">
                <div class="text-h6">{{ $t('orderLists.products') }}</div>
              </div>
              <div class="col-auto">
                <q-btn
                  :label="$t('orderLists.addProduct')"
                  color="primary"
                  icon="add"
                  @click="showAddProductDialog = true"
                  :disable="!form.supplier_id"
                />
              </div>
            </div>

            <!-- Products List -->
            <div v-if="orderListItems.length > 0" class="q-gutter-sm">
              <q-card
                v-for="(item, index) in orderListItems"
                :key="item.id || index"
                class="q-pa-md"
                bordered
              >
                <div class="row items-center q-gutter-md">
                  <div class="col">
                    <div class="text-subtitle1 text-weight-bold">
                      {{ getProductName(item.product_id) }}
                    </div>
                    <div class="text-body2 text-grey-6">
                      SKU: {{ getProductSku(item.product_id) }}
                    </div>
                    <div
                      v-if="item.notes"
                      class="text-body2 text-grey-6 q-mt-xs"
                    >
                      {{ item.notes }}
                    </div>
                  </div>

                  <div class="col-auto">
                    <q-input
                      v-model.number="item.requested_quantity"
                      type="number"
                      min="1"
                      :label="$t('orderLists.quantity')"
                      outlined
                      dense
                      style="width: 100px"
                      @update:model-value="updateItemTotal(item)"
                    />
                  </div>

                  <div class="col-auto text-right">
                    <div class="text-body2 text-grey-6">
                      {{ $t('orderLists.unitPrice') }}
                    </div>
                    <div class="text-subtitle2">
                      €{{ item.unit_price.toFixed(2) }}
                    </div>
                  </div>

                  <div class="col-auto text-right">
                    <div class="text-body2 text-grey-6">
                      {{ $t('orderLists.totalPrice') }}
                    </div>
                    <div class="text-subtitle1 text-weight-bold">
                      €{{ item.total_price.toFixed(2) }}
                    </div>
                  </div>

                  <div class="col-auto">
                    <q-btn
                      flat
                      round
                      color="negative"
                      icon="delete"
                      @click="removeItem(index)"
                      size="sm"
                    />
                  </div>
                </div>
              </q-card>
            </div>

            <!-- Empty State -->
            <BaseCard v-else class="text-center q-pa-xl">
              <q-icon
                name="shopping_cart"
                size="3rem"
                color="grey-4"
                class="q-mb-md"
              />
              <div class="text-body1 text-grey-6">
                {{ $t('orderLists.noProducts') }}
              </div>
              <q-btn
                v-if="form.supplier_id"
                :label="$t('orderLists.addProduct')"
                color="primary"
                class="q-mt-md"
                @click="showAddProductDialog = true"
              />
            </BaseCard>
          </div>
        </div>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions align="right" class="q-pa-md bg-grey-1">
        <q-btn :label="$t('common.cancel')" flat @click="closeDialog" />
        <q-btn
          :label="$t('common.save')"
          color="primary"
          @click="saveOrderList"
          :loading="orderListsStore.saving"
          :disable="!isFormValid"
        />
      </q-card-actions>
    </q-card>

    <!-- Add Product Dialog -->
    <q-dialog v-model="showAddProductDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">{{ $t('orderLists.addProduct') }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-select
            v-model="selectedProduct"
            :options="availableProducts"
            :label="$t('orderLists.selectProduct')"
            outlined
            option-label="name"
            option-value="id"
            emit-value
            map-options
            use-input
            hide-selected
            fill-input
            input-debounce="300"
            @filter="filterProducts"
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.name }}</q-item-label>
                  <q-item-label caption>{{ scope.opt.sku }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label caption
                    >€{{ scope.opt.price?.toFixed(2) || '0.00' }}</q-item-label
                  >
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-input
            v-model.number="newItemQuantity"
            :label="$t('orderLists.quantity')"
            type="number"
            min="1"
            outlined
            class="q-mt-md"
          />

          <q-input
            v-model="newItemNotes"
            :label="$t('orderLists.notes')"
            type="textarea"
            rows="2"
            outlined
            class="q-mt-md"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn :label="$t('common.cancel')" flat @click="cancelAddProduct" />
          <q-btn
            :label="$t('common.add')"
            color="primary"
            @click="addProduct"
            :disable="!selectedProduct || !newItemQuantity"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup lang="ts">
  import { ref, computed, watch, nextTick, onMounted } from 'vue';
  import { useQuasar } from 'quasar';
  import { useI18n } from 'vue-i18n';
  import { useOrderListsStore } from 'src/stores/orderLists';
  import { useSuppliersStore } from 'src/stores/suppliers';
  import { useProductsStore } from 'src/stores/products';
  import { useAuthStore } from 'src/stores/auth';
  import BaseCard from 'src/components/base/BaseCard.vue';
  import type {
    OrderListWithItems,
    CreateOrderListRequest,
    UpdateOrderListRequest,
    AddOrderListItemRequest,
  } from 'src/stores/orderLists';
  import type { OrderListItem, ProductWithStock } from 'src/types/inventory';

  interface Props {
    modelValue: boolean;
    orderList?: OrderListWithItems | null;
  }

  const props = withDefaults(defineProps<Props>(), {
    orderList: null,
  });

  const emit = defineEmits<{
    'update:modelValue': [value: boolean];
    saved: [];
  }>();

  const $q = useQuasar();
  const { t } = useI18n();

  // Stores
  const orderListsStore = useOrderListsStore();
  const suppliersStore = useSuppliersStore();
  const productsStore = useProductsStore();
  const authStore = useAuthStore();

  // Refs
  const nameInput = ref();

  // State
  const form = ref({
    name: '',
    description: '',
    supplier_id: '',
    notes: '',
    auto_suggest_quantities: false,
    urgent_order: false,
  });

  const orderListItems = ref<OrderListItem[]>([]);
  const showAddProductDialog = ref(false);
  const selectedProduct = ref('');
  const newItemQuantity = ref(1);
  const newItemNotes = ref('');
  const availableProducts = ref<ProductWithStock[]>([]);

  // Computed
  const isEditing = computed(() => !!props.orderList);

  const supplierOptions = computed(() =>
    suppliersStore.suppliers.map(supplier => ({
      label: supplier.name,
      value: supplier.id,
    }))
  );

  const isFormValid = computed(() => {
    return form.value.name.length >= 3 && form.value.supplier_id;
  });

  const totalItems = computed(() => {
    return orderListItems.value.reduce(
      (sum, item) => sum + item.requested_quantity,
      0
    );
  });

  const totalAmount = computed(() => {
    return orderListItems.value.reduce(
      (sum, item) => sum + item.total_price,
      0
    );
  });

  const filteredProducts = computed(() => {
    if (!form.value.supplier_id) return [];

    return productsStore.products.filter(product => {
      const hasSupplierProduct = product.supplier_products?.some(
        sp => sp.supplier_id === form.value.supplier_id
      );
      const notAlreadyAdded = !orderListItems.value.some(
        item => item.product_id === product.id
      );
      return hasSupplierProduct && notAlreadyAdded;
    });
  });

  // Methods
  const resetForm = () => {
    form.value = {
      name: '',
      description: '',
      supplier_id: '',
      notes: '',
      auto_suggest_quantities: false,
      urgent_order: false,
    };
    orderListItems.value = [];
    selectedProduct.value = '';
    newItemQuantity.value = 1;
    newItemNotes.value = '';
  };

  const populateForm = () => {
    if (props.orderList) {
      form.value = {
        name: props.orderList.name,
        description: props.orderList.description || '',
        supplier_id: props.orderList.supplier_id,
        notes: props.orderList.notes || '',
        auto_suggest_quantities:
          props.orderList.auto_suggest_quantities || false,
        urgent_order: props.orderList.urgent_order || false,
      };
      orderListItems.value = [...(props.orderList.items || [])];
    }
  };

  const getProductName = (productId: string) => {
    const product = productsStore.getProductById(productId);
    return product?.name || t('common.unknownProduct');
  };

  const getProductSku = (productId: string) => {
    const product = productsStore.getProductById(productId);
    return product?.sku || t('common.noSku');
  };

  const updateItemTotal = (item: OrderListItem) => {
    item.total_price = item.unit_price * item.requested_quantity;
  };

  const removeItem = (index: number) => {
    orderListItems.value.splice(index, 1);
  };

  const filterProducts = (val: string, update: any) => {
    update(() => {
      if (val === '') {
        availableProducts.value = filteredProducts.value;
      } else {
        const needle = val.toLowerCase();
        availableProducts.value = filteredProducts.value.filter(
          product =>
            product.name.toLowerCase().includes(needle) ||
            product.sku.toLowerCase().includes(needle)
        );
      }
    });
  };

  const addProduct = () => {
    if (!selectedProduct.value || !newItemQuantity.value) return;

    const product = productsStore.getProductById(selectedProduct.value);
    if (!product) return;

    const supplierProduct = product.supplier_products?.find(
      sp => sp.supplier_id === form.value.supplier_id
    );
    if (!supplierProduct) return;

    const newItem: OrderListItem = {
      id: `temp_${Date.now()}`,
      order_list_id: props.orderList?.id || '',
      practice_id: authStore.clinicId || '',
      product_id: product.id,
      supplier_product_id: supplierProduct.id,
      requested_quantity: newItemQuantity.value,
      unit_price: supplierProduct.unit_price,
      total_price: supplierProduct.unit_price * newItemQuantity.value,
      currency: supplierProduct.currency,
      suggestion_source: 'manual',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (newItemNotes.value) {
      newItem.notes = newItemNotes.value;
    }

    orderListItems.value.push(newItem);
    cancelAddProduct();
  };

  const cancelAddProduct = () => {
    showAddProductDialog.value = false;
    selectedProduct.value = '';
    newItemQuantity.value = 1;
    newItemNotes.value = '';
  };

  const saveOrderList = async () => {
    try {
      if (!isFormValid.value) return;

      const practiceId = authStore.clinicId;
      if (!practiceId) {
        throw new Error('No practice selected');
      }

      if (isEditing.value && props.orderList) {
        // Update existing order list
        const updateRequest: UpdateOrderListRequest = {
          id: props.orderList.id,
          name: form.value.name,
          description: form.value.description,
          supplier_id: form.value.supplier_id,
          auto_suggest_quantities: form.value.auto_suggest_quantities,
          urgent_order: form.value.urgent_order,
        };

        if (form.value.notes) {
          updateRequest.notes = form.value.notes;
        }

        await orderListsStore.updateOrderList(updateRequest);

        $q.notify({
          type: 'positive',
          message: t('orderLists.updated'),
        });
      } else {
        // Create new order list
        const createRequest: CreateOrderListRequest = {
          practice_id: practiceId,
          supplier_id: form.value.supplier_id,
          name: form.value.name,
          description: form.value.description,
          auto_suggest_quantities: form.value.auto_suggest_quantities,
          urgent_order: form.value.urgent_order,
        };

        if (form.value.notes) {
          createRequest.notes = form.value.notes;
        }

        const newOrderList = await orderListsStore.createOrderList(
          createRequest
        );

        // Add items to the new order list
        for (const item of orderListItems.value) {
          const addItemRequest: AddOrderListItemRequest = {
            order_list_id: newOrderList.id,
            product_id: item.product_id,
            supplier_product_id: item.supplier_product_id,
            requested_quantity: item.requested_quantity,
          };

          if (item.notes) {
            addItemRequest.notes = item.notes;
          }

          await orderListsStore.addOrderListItem(addItemRequest);
        }

        $q.notify({
          type: 'positive',
          message: t('orderLists.created'),
        });
      }

      emit('saved');
      closeDialog();
    } catch (error) {
      console.error('Error saving order list:', error);
      $q.notify({
        type: 'negative',
        message: t('orderLists.saveError'),
      });
    }
  };

  const closeDialog = () => {
    emit('update:modelValue', false);
  };

  const onDialogHide = () => {
    resetForm();
  };

  // Watchers
  watch(
    () => props.modelValue,
    newVal => {
      if (newVal) {
        populateForm();
        nextTick(() => {
          nameInput.value?.focus();
        });
      }
    }
  );

  watch(
    () => form.value.supplier_id,
    () => {
      availableProducts.value = filteredProducts.value;
    }
  );

  // Lifecycle
  onMounted(() => {
    availableProducts.value = filteredProducts.value;
  });
</script>

<style scoped>
  .q-card {
    max-height: none;
  }
</style>
