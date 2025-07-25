import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from 'src/boot/supabase';
import { useAuthStore } from './auth';
import type {
  CountingSession,
  CountingEntry,
  CountingProduct,
  CountingStats,
  StartCountingSessionRequest,
} from 'src/types/inventory';

export const useCountingStore = defineStore('counting', () => {
  // State
  const currentSession = ref<CountingSession | null>(null);
  const countingEntries = ref<CountingEntry[]>([]);
  const availableProducts = ref<CountingProduct[]>([]);
  const sessions = ref<CountingSession[]>([]);
  const loading = ref(false);
  const isCountingMode = ref(false);
  const autosaveEnabled = ref(true);
  const lastSaveTime = ref<Date | null>(null);
  const pendingChanges = ref(false);

  // Auth store
  const authStore = useAuthStore();

  // Getters
  const countingStats = computed((): CountingStats => {
    if (!currentSession.value) {
      return {
        total_products: 0,
        counted_products: 0,
        remaining_products: 0,
        discrepancies: 0,
        progress_percentage: 0,
      };
    }

    const totalProducts = currentSession.value.total_products_to_count || availableProducts.value.length;
    const countedProducts = countingEntries.value.length;
    const discrepancies = countingEntries.value.filter(entry => Math.abs(entry.variance) > 0).length;

    return {
      total_products: totalProducts,
      counted_products: countedProducts,
      remaining_products: totalProducts - countedProducts,
      discrepancies,
      progress_percentage:
        totalProducts > 0 ? (countedProducts / totalProducts) * 100 : 0,
    };
  });

  const entriesWithVariance = computed(() =>
    countingEntries.value.filter(entry => Math.abs(entry.variance) > 0)
  );

  const entriesPendingVerification = computed(() =>
    countingEntries.value.filter(
      entry => entry.status === 'pending' || entry.status === 'discrepancy'
    )
  );

  const nextProductToCount = computed(() => {
    if (!availableProducts.value.length) return null;

    const countedProductIds = countingEntries.value.map(
      entry => entry.product_id
    );
    return (
      availableProducts.value.find(
        product => !countedProductIds.includes(product.id)
      ) || null
    );
  });

  // Autosave functionality
  let autosaveTimeout: NodeJS.Timeout | null = null;

  const scheduleAutosave = () => {
    if (!autosaveEnabled.value || !currentSession.value) return;

    if (autosaveTimeout) {
      clearTimeout(autosaveTimeout);
    }

    autosaveTimeout = setTimeout(async () => {
      await saveCurrentSession();
    }, 2000); // Debounce for 2 seconds
  };

  const saveCurrentSession = async () => {
    if (!currentSession.value || !pendingChanges.value) return;

    try {
      // Update session with current progress
      const stats = countingStats.value;
      await updateSession(currentSession.value.id, {
        products_counted: stats.counted_products,
        discrepancies_found: stats.discrepancies,
        total_products_to_count: stats.total_products,
        updated_at: new Date().toISOString(),
      });

      lastSaveTime.value = new Date();
      pendingChanges.value = false;
      
      console.log('✅ Session autosaved at', lastSaveTime.value);
    } catch (error) {
      console.error('❌ Autosave failed:', error);
    }
  };

  // Load active session on page reload
  const loadActiveSession = async (practiceId: string) => {
    try {
      const { data: activeSession, error } = await supabase
        .from('counting_sessions')
        .select('*')
        .eq('practice_id', practiceId)
        .eq('status', 'in_progress')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (activeSession) {
        currentSession.value = activeSession;
        isCountingMode.value = true;
        
        // Load related data
        await Promise.all([
          fetchProductsForSession(activeSession.id),
          fetchCountingEntries(activeSession.id)
        ]);

        console.log('✅ Active session restored:', activeSession.name);
        return activeSession;
      }
    } catch (error) {
      console.error('Error loading active session:', error);
    }
    return null;
  };

  // Actions
  const startCountingSession = async (request: StartCountingSessionRequest) => {
    try {
      loading.value = true;

      const { data: session, error: sessionError } = await supabase
        .from('counting_sessions')
        .insert([
          {
            ...request,
            status: 'in_progress',
            started_at: new Date().toISOString(),
            started_by: authStore.user?.id,
          },
        ])
        .select()
        .single();

      if (sessionError) throw sessionError;

      currentSession.value = session;
      isCountingMode.value = true;
      pendingChanges.value = true;

      // Fetch products to count
      await fetchProductsForSession(session.id);

      // Schedule first autosave
      scheduleAutosave();

      return session;
    } catch (error) {
      console.error('Error starting counting session:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const fetchProductsForSession = async (sessionId: string) => {
    try {
      const session =
        currentSession.value || sessions.value.find(s => s.id === sessionId);
      if (!session) throw new Error('Session not found');

      // Build query to get products for counting
      let query = supabase
        .from('stock_levels')
        .select(
          `
          product_id,
          location_id,
          current_quantity,
          last_counted_at,
          location:practice_locations(name),
          product:products(id, name, sku, category, brand, unit, image_url, barcode)
        `
        )
        .eq('practice_id', session.practice_id);

      // Apply location filter if specified
      if (session.location_ids && session.location_ids.length > 0) {
        query = query.in('location_id', session.location_ids);
      }

      // Apply product filter if specified
      if (session.product_ids && session.product_ids.length > 0) {
        query = query.in('product_id', session.product_ids);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform to CountingProduct format
      availableProducts.value = (data || []).map((item: any) => ({
        id: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        category: item.product.category,
        brand: item.product.brand,
        unit: item.product.unit,
        barcode: item.product.barcode,
        current_system_quantity: item.current_quantity,
        last_counted_at: item.last_counted_at,
        location_name: item.location?.name || 'Unknown',
        location_id: item.location_id,
        image_url: item.product.image_url,
      }));

      // Update session with product count if this is the current session
      if (currentSession.value?.id === sessionId) {
        await updateSession(session.id, {
          total_products_to_count: availableProducts.value.length,
        });
        pendingChanges.value = true;
        scheduleAutosave();
      }
    } catch (error) {
      console.error('Error fetching products for session:', error);
      throw error;
    }
  };

  const countProduct = async (
    productId: string,
    locationId: string,
    countedQuantity: number,
    options: {
      countMethod?: 'manual' | 'barcode' | 'rfid';
      confidenceLevel?: 'low' | 'medium' | 'high';
      batchNumber?: string;
      expiryDate?: string;
      notes?: string;
      photos?: string[];
    } = {}
  ) => {
    try {
      if (!currentSession.value) throw new Error('No active counting session');

      // Get current system quantity
      const { data: stockLevel, error: stockError } = await supabase
        .from('stock_levels')
        .select('current_quantity')
        .eq('practice_id', currentSession.value.practice_id)
        .eq('location_id', locationId)
        .eq('product_id', productId)
        .single();

      if (stockError) throw stockError;

      const systemQuantity = stockLevel?.current_quantity || 0;
      const variance = countedQuantity - systemQuantity;

      // Create counting entry
      const { data: entry, error: entryError } = await supabase
        .from('counting_entries')
        .upsert([
          {
            counting_session_id: currentSession.value.id,
            product_id: productId,
            system_quantity: systemQuantity,
            counted_quantity: countedQuantity,
            variance_quantity: variance,
            count_method: options.countMethod || 'manual',
            confidence_level: options.confidenceLevel || 'high',
            batch_number: options.batchNumber,
            expiry_date: options.expiryDate,
            counted_by: authStore.user?.id,
            counted_at: new Date().toISOString(),
            notes: options.notes,
            requires_approval: Math.abs(variance) > 0,
          },
        ], { onConflict: 'counting_session_id,product_id' })
        .select()
        .single();

      if (entryError) throw entryError;

      // Update local state
      const existingIndex = countingEntries.value.findIndex(
        e => e.product_id === productId
      );
      
      if (existingIndex >= 0) {
        countingEntries.value[existingIndex] = entry;
      } else {
        countingEntries.value.push(entry);
      }

      // Mark for autosave
      pendingChanges.value = true;
      scheduleAutosave();

      return entry;
    } catch (error) {
      console.error('Error counting product:', error);
      throw error;
    }
  };

  const updateCountingEntry = async (
    entryId: string,
    updates: Partial<CountingEntry>
  ) => {
    try {
      const { data, error } = await supabase
        .from('counting_entries')
        .update(updates)
        .eq('id', entryId)
        .select()
        .single();

      if (error) throw error;

      const index = countingEntries.value.findIndex(
        entry => entry.id === entryId
      );
      if (index >= 0) {
        countingEntries.value[index] = data;
      }

      // Mark for autosave
      pendingChanges.value = true;
      scheduleAutosave();

      return data;
    } catch (error) {
      console.error('Error updating counting entry:', error);
      throw error;
    }
  };

  const completeCountingSession = async () => {
    try {
      if (!currentSession.value) throw new Error('No active counting session');

      // Final save before completing
      await saveCurrentSession();

      await updateSession(currentSession.value.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: authStore.user?.id,
      });

      isCountingMode.value = false;
      pendingChanges.value = false;
      
      // Clear autosave
      if (autosaveTimeout) {
        clearTimeout(autosaveTimeout);
        autosaveTimeout = null;
      }

      return true;
    } catch (error) {
      console.error('Error completing counting session:', error);
      throw error;
    }
  };

  const approveCountingSession = async (sessionId: string) => {
    try {
      await updateSession(sessionId, {
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: authStore.user?.id,
      });

      // If auto_adjust_stock is enabled, apply all count adjustments
      const session = sessions.value.find(s => s.id === sessionId);
      if (session?.auto_adjust_stock) {
        await applyCountAdjustments(sessionId);
      }

      return true;
    } catch (error) {
      console.error('Error approving counting session:', error);
      throw error;
    }
  };

  const applyCountAdjustments = async (sessionId: string) => {
    try {
      const session = sessions.value.find(s => s.id === sessionId);
      if (!session) throw new Error('Session not found');

      // Get all entries with variances
      const { data: entries, error } = await supabase
        .from('counting_entries')
        .select('*')
        .eq('counting_session_id', sessionId)
        .neq('variance_quantity', 0);

      if (error) throw error;

      // Apply each adjustment using the stock update function
      for (const entry of entries || []) {
        await supabase.rpc('update_stock_level', {
          p_practice_id: session.practice_id,
          p_location_id: entry.location_id,
          p_product_id: entry.product_id,
          p_quantity_change: entry.variance_quantity,
          p_movement_type: 'count',
          p_performed_by: authStore.user?.id,
          p_reference_type: 'counting_session',
          p_reference_id: sessionId,
          p_reason: `Count adjustment from session: ${session.name}`,
        });
      }

      return true;
    } catch (error) {
      console.error('Error applying count adjustments:', error);
      throw error;
    }
  };

  const updateSession = async (
    sessionId: string,
    updates: Partial<CountingSession>
  ) => {
    try {
      const { data, error } = await supabase
        .from('counting_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;

      if (currentSession.value?.id === sessionId) {
        currentSession.value = data;
      }

      const index = sessions.value.findIndex(s => s.id === sessionId);
      if (index >= 0) {
        sessions.value[index] = data;
      }

      return data;
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  };

  const fetchSessions = async (practiceId: string) => {
    try {
      const { data, error } = await supabase
        .from('counting_sessions')
        .select('*')
        .eq('practice_id', practiceId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      sessions.value = data || [];
    } catch (error) {
      console.error('Error fetching counting sessions:', error);
      throw error;
    }
  };

  const fetchCountingEntries = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('counting_entries')
        .select(
          `
          *,
          product:products(name, sku, barcode, image_url)
        `
        )
        .eq('counting_session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      countingEntries.value = data || [];
    } catch (error) {
      console.error('Error fetching counting entries:', error);
      throw error;
    }
  };

  const cancelCountingSession = async () => {
    try {
      if (!currentSession.value) throw new Error('No active counting session');

      await updateSession(currentSession.value.id, {
        status: 'cancelled',
      });

      currentSession.value = null;
      isCountingMode.value = false;
      countingEntries.value = [];
      availableProducts.value = [];
      pendingChanges.value = false;

      // Clear autosave
      if (autosaveTimeout) {
        clearTimeout(autosaveTimeout);
        autosaveTimeout = null;
      }

      return true;
    } catch (error) {
      console.error('Error canceling counting session:', error);
      throw error;
    }
  };

  return {
    // State
    currentSession,
    countingEntries,
    availableProducts,
    sessions,
    loading,
    isCountingMode,
    autosaveEnabled,
    lastSaveTime,
    pendingChanges,

    // Getters
    countingStats,
    entriesWithVariance,
    entriesPendingVerification,
    nextProductToCount,

    // Actions
    startCountingSession,
    fetchProductsForSession,
    countProduct,
    updateCountingEntry,
    completeCountingSession,
    approveCountingSession,
    applyCountAdjustments,
    updateSession,
    fetchSessions,
    fetchCountingEntries,
    cancelCountingSession,
    loadActiveSession,
    saveCurrentSession,
    scheduleAutosave,
  };
});
