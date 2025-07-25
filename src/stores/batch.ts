import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from 'src/boot/supabase';
import {
  type ProductBatch,
  type ProductBatchWithDetails,
  type CreateBatchRequest,
  type UpdateBatchRequest,
  type ExpiringBatch,
  type FifoBatch,
  type BatchMovement,
} from 'src/types/inventory';
import { ServiceErrorHandler } from 'src/utils/service-error-handler';

export const useBatchStore = defineStore('batch', () => {
  // State
  const batches = ref<ProductBatchWithDetails[]>([]);
  const expiringBatches = ref<ExpiringBatch[]>([]);
  const fifoBatches = ref<FifoBatch[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const batchesByProduct = computed(() => (productId: string) => {
    return batches.value.filter(batch => batch.product_id === productId);
  });

  const batchesByLocation = computed(() => (locationId: string) => {
    return batches.value.filter(batch => batch.location_id === locationId);
  });

  const expiredBatches = computed(() => {
    return batches.value.filter(batch => 
      new Date(batch.expiry_date) < new Date()
    );
  });

  const expiringBatchesCount = computed(() => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    return batches.value.filter(batch => {
      const expiryDate = new Date(batch.expiry_date);
      return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
    }).length;
  });

  const lowStockBatches = computed(() => {
    return batches.value.filter(batch => batch.current_quantity <= 10);
  });

  const totalValue = computed(() => {
    return batches.value.reduce((total, batch) => {
      const unitCost = batch.unit_cost || 0;
      return total + (batch.current_quantity * unitCost);
    }, 0);
  });

  // Actions
  const fetchBatches = async (filters?: {
    practiceId?: string;
    productId?: string;
    locationId?: string;
    includeExpired?: boolean;
  }) => {
    try {
      loading.value = true;
      error.value = null;

      let query = supabase
        .from('product_batches')
        .select(`
          *,
          product:products!inner(id, name, sku, category, brand, unit),
          location:practice_locations!inner(id, name, code, location_type),
          supplier:suppliers(id, name, code)
        `);

      if (filters?.practiceId) {
        query = query.eq('practice_id', filters.practiceId);
      }

      if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
      }

      if (filters?.locationId) {
        query = query.eq('location_id', filters.locationId);
      }

      if (!filters?.includeExpired) {
        query = query.gte('expiry_date', new Date().toISOString());
      }

      query = query.eq('status', 'active').order('expiry_date', { ascending: true });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform data to match expected interface
      batches.value = (data || []).map(batch => ({
        ...batch,
        days_until_expiry: Math.ceil((new Date(batch.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        urgency_level: (() => {
          const daysUntilExpiry = Math.ceil((new Date(batch.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntilExpiry <= 7) return 'critical';
          if (daysUntilExpiry <= 14) return 'high';
          if (daysUntilExpiry <= 30) return 'warning';
          return 'normal';
        })()
      }));

    } catch (err) {
      const handledError = ServiceErrorHandler.handle(err, {
        service: 'BatchStore',
        operation: 'fetchBatches'
      });
      error.value = handledError.message;
      throw handledError;
    } finally {
      loading.value = false;
    }
  };

  const fetchExpiringBatches = async (practiceId: string, daysAhead: number = 30) => {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: fetchError } = await supabase
        .rpc('get_expiring_batches', {
          p_practice_id: practiceId,
          p_days_ahead: daysAhead
        });

      if (fetchError) throw fetchError;

      expiringBatches.value = data || [];
      return expiringBatches.value;
    } catch (err) {
      const handledError = ServiceErrorHandler.handle(err, {
        service: 'BatchStore',
        operation: 'fetchExpiringBatches'
      });
      error.value = handledError.message;
      throw handledError;
    } finally {
      loading.value = false;
    }
  };

  const fetchFifoBatches = async (productId: string, locationId: string, quantity: number) => {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: fetchError } = await supabase
        .rpc('get_fifo_batches', {
          p_product_id: productId,
          p_location_id: locationId,
          p_quantity_needed: quantity
        });

      if (fetchError) throw fetchError;

      fifoBatches.value = data || [];
      return fifoBatches.value;
    } catch (err) {
      const handledError = ServiceErrorHandler.handle(err, {
        service: 'BatchStore',
        operation: 'fetchFifoBatches'
      });
      error.value = handledError.message;
      throw handledError;
    } finally {
      loading.value = false;
    }
  };

  const createBatch = async (request: CreateBatchRequest) => {
    try {
      loading.value = true;
      error.value = null;

      const batchData = {
        practice_id: request.practice_id,
        product_id: request.product_id,
        location_id: request.location_id,
        batch_number: request.batch_number,
        expiry_date: request.expiry_date,
        received_date: request.received_date || new Date().toISOString().substring(0, 10),
        initial_quantity: request.initial_quantity,
        current_quantity: request.initial_quantity,
        reserved_quantity: 0,
        unit_cost: request.unit_cost,
        currency: request.currency || 'EUR',
        status: 'active',
        quality_check_passed: request.quality_check_passed || true,
        ...(request.supplier_batch_number && { supplier_batch_number: request.supplier_batch_number }),
        ...(request.supplier_id && { supplier_id: request.supplier_id }),
        ...(request.purchase_order_number && { purchase_order_number: request.purchase_order_number }),
        ...(request.invoice_number && { invoice_number: request.invoice_number }),
        ...(request.quality_notes && { quality_notes: request.quality_notes }),
      };

      const { data, error: insertError } = await supabase
        .from('product_batches')
        .insert(batchData)
        .select()
        .single();

      if (insertError) throw insertError;

      return data;
    } catch (err) {
      const handledError = ServiceErrorHandler.handle(err, {
        service: 'BatchStore',
        operation: 'createBatch'
      });
      error.value = handledError.message;
      throw handledError;
    } finally {
      loading.value = false;
    }
  };

  const updateBatch = async (id: string, updates: UpdateBatchRequest) => {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: updateError } = await supabase
        .from('product_batches')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      const index = batches.value.findIndex(b => b.id === id);
      if (index !== -1) {
        batches.value[index] = { ...batches.value[index], ...data };
      }

      return data;
    } catch (err) {
      const handledError = ServiceErrorHandler.handle(err, {
        service: 'BatchStore',
        operation: 'updateBatch'
      });
      error.value = handledError.message;
      throw handledError;
    } finally {
      loading.value = false;
    }
  };

  const useBatch = async (movements: BatchMovement[]) => {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: rpcError } = await supabase
        .rpc('process_batch_stock_movement', {
          p_movements: JSON.stringify(movements)
        });

      if (rpcError) throw rpcError;

      return data;
    } catch (err) {
      const handledError = ServiceErrorHandler.handle(err, {
        service: 'BatchStore',
        operation: 'useBatch'
      });
      error.value = handledError.message;
      throw handledError;
    } finally {
      loading.value = false;
    }
  };

  const deleteBatch = async (id: string) => {
    try {
      loading.value = true;
      error.value = null;

      const { error: deleteError } = await supabase
        .from('product_batches')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Update local state
      const index = batches.value.findIndex(b => b.id === id);
      if (index !== -1) {
        batches.value.splice(index, 1);
      }

      return { success: true };
    } catch (err) {
      const handledError = ServiceErrorHandler.handle(err, {
        service: 'BatchStore',
        operation: 'deleteBatch'
      });
      error.value = handledError.message;
      throw handledError;
    } finally {
      loading.value = false;
    }
  };

  const getBatch = async (id: string) => {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: fetchError } = await supabase
        .from('product_batches')
        .select(`
          *,
          product:products!inner(id, name, sku, category, brand, unit),
          location:practice_locations!inner(id, name, code, location_type),
          supplier:suppliers(id, name, code)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      return data;
    } catch (err) {
      const handledError = ServiceErrorHandler.handle(err, {
        service: 'BatchStore',
        operation: 'getBatch'
      });
      error.value = handledError.message;
      throw handledError;
    } finally {
      loading.value = false;
    }
  };

  return {
    // State
    batches,
    expiringBatches,
    fifoBatches,
    loading,
    error,

    // Getters
    batchesByProduct,
    batchesByLocation,
    expiredBatches,
    expiringBatchesCount,
    lowStockBatches,
    totalValue,

    // Actions
    fetchBatches,
    fetchExpiringBatches,
    fetchFifoBatches,
    createBatch,
    updateBatch,
    useBatch,
    deleteBatch,
    getBatch,
  };
});
