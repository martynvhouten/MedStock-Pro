<template>
  <PageLayout>
    <template #header>
      <PageTitle
        :title="$t('counting.title')"
        :subtitle="$t('counting.overview')"
        icon="checklist"
      >
        <template #actions>
          <div class="header-actions">
            <!-- Status Filter -->
            <q-select
              v-model="selectedStatus"
              :options="statusOptions"
              :label="$t('counting.sessionStatus')"
              emit-value
              map-options
              outlined
              dense
              clearable
              class="status-filter"
            >
              <template v-slot:prepend>
                <q-icon name="filter_list" />
              </template>
            </q-select>

            <!-- Refresh Button -->
            <q-btn
              color="primary"
              icon="refresh"
              :label="$t('common.refresh')"
              @click="refreshData"
              :loading="countingStore.loading"
              unelevated
            />

            <!-- Start New Session Button -->
            <q-btn
              color="secondary"
              icon="add"
              :label="$t('counting.startSession')"
              @click="showStartSessionDialog"
              unelevated
            />
          </div>
        </template>
      </PageTitle>
    </template>

    <!-- Main Content -->
    <div class="counting-content">
      <!-- Active Session Alert -->
      <BaseCard
        v-if="activeSession"
        variant="modern"
        header-color="info"
        class="active-session-card"
      >
        <template #header>
          <q-card-section class="active-session-header">
            <div class="flex items-center gap-3">
              <q-icon name="play_circle" size="md" color="info" />
              <div>
                <div class="text-h6">{{ $t('counting.activeSession') }}</div>
                <div class="text-subtitle2">{{ activeSession.name }}</div>
              </div>
            </div>
          </q-card-section>
        </template>

        <q-card-section class="active-session-content">
          <div class="session-stats">
            <div class="stat-item progress-item">
              <div class="stat-label">{{ $t('counting.progress') }}</div>
              <div class="stat-value">
                {{ countingStore.countingStats.counted_products }}/{{
                  countingStore.countingStats.total_products
                }}
                <span class="progress-percentage">
                  ({{ Math.round(countingStore.countingStats.progress_percentage) }}%)
                </span>
              </div>
              <q-linear-progress
                :value="countingStore.countingStats.progress_percentage / 100"
                color="info"
                size="12px"
                class="progress-bar"
                rounded
              />
              <div class="remaining-text">
                {{ countingStore.countingStats.remaining_products }} producten te gaan
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-label">{{ $t('counting.discrepancies') }}</div>
              <div class="stat-value" :class="{ 'discrepancies': countingStore.countingStats.discrepancies > 0 }">
                {{ countingStore.countingStats.discrepancies }}
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-label">{{ $t('common.startedAt') }}</div>
              <div class="stat-value">
                {{ formatDateTime(activeSession.started_at) }}
              </div>
            </div>

            <div class="stat-item autosave-status">
              <div class="stat-label">
                <q-icon 
                  :name="countingStore.pendingChanges ? 'sync' : 'check_circle'" 
                  :class="{ 'text-warning': countingStore.pendingChanges, 'text-positive': !countingStore.pendingChanges }"
                  size="sm"
                />
                Autosave Status
              </div>
              <div class="stat-value">
                <span v-if="countingStore.pendingChanges" class="text-warning">
                  Opslaan...
                </span>
                <span v-else-if="countingStore.lastSaveTime" class="text-positive">
                  Opgeslagen {{ formatTime(countingStore.lastSaveTime.toISOString()) }}
                </span>
                <span v-else class="text-grey-6">
                  Geen wijzigingen
                </span>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            color="info"
            :label="$t('counting.continueSession')"
            @click="continueSession(activeSession)"
          />
          <q-btn
            flat
            color="warning"
            :label="$t('counting.completeSession')"
            @click="completeSession(activeSession)"
            :disable="activeSession.products_counted === 0"
          />
        </q-card-actions>
      </BaseCard>

      <!-- Sessions Overview -->
      <BaseCard variant="modern" class="sessions-overview">
        <template #header>
          <q-card-section class="sessions-header">
            <div class="text-h6">{{ $t('counting.sessionsOverview') }}</div>
          </q-card-section>
        </template>

        <!-- Loading State -->
        <div v-if="countingStore.loading" class="loading-container">
          <q-spinner-dots size="xl" color="primary" />
          <p class="loading-text">{{ $t('counting.loadingSessions') }}</p>
        </div>

        <!-- Sessions Table -->
        <q-table
          v-else
          :rows="filteredSessions"
          :columns="columns"
          row-key="id"
          :pagination="pagination"
          :no-data-label="$t('counting.noSessionsFound')"
          class="sessions-table"
          flat
        >
          <!-- Session Name Column -->
          <template v-slot:body-cell-name="props">
            <q-td :props="props">
              <div class="session-info">
                <div class="session-name">{{ props.value }}</div>
                <div class="session-type">
                  {{ formatSessionType(props.row.session_type) }}
                </div>
              </div>
            </q-td>
          </template>

          <!-- Status Column -->
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-chip
                :color="statusColor(props.value)"
                :icon="statusIcon(props.value)"
                text-color="white"
                :label="formatStatus(props.value)"
                size="sm"
              />
            </q-td>
          </template>

          <!-- Progress Column -->
          <template v-slot:body-cell-progress="props">
            <q-td :props="props">
              <div class="progress-info">
                <div class="progress-text">
                  {{ props.row.products_counted }}/{{
                    props.row.total_products_to_count
                  }}
                </div>
                <q-linear-progress
                  :value="
                    props.row.products_counted /
                    props.row.total_products_to_count
                  "
                  :color="progressColor(props.row.status)"
                  size="4px"
                  class="mini-progress"
                />
              </div>
            </q-td>
          </template>

          <!-- Date Column -->
          <template v-slot:body-cell-started_at="props">
            <q-td :props="props">
              <div class="date-info">
                <div class="date">{{ formatDate(props.value) }}</div>
                <div class="time">{{ formatTime(props.value) }}</div>
              </div>
            </q-td>
          </template>

          <!-- Actions Column -->
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <div class="action-buttons">
                <q-btn
                  v-if="props.row.status === 'active'"
                  flat
                  round
                  icon="play_arrow"
                  size="sm"
                  color="primary"
                  @click="continueSession(props.row)"
                  :title="$t('counting.continueSession')"
                />
                <q-btn
                  flat
                  round
                  icon="visibility"
                  size="sm"
                  color="info"
                  @click="viewSession(props.row)"
                  :title="$t('common.view')"
                />
                <q-btn
                  v-if="props.row.status === 'active'"
                  flat
                  round
                  icon="check"
                  size="sm"
                  color="positive"
                  @click="completeSession(props.row)"
                  :title="$t('counting.completeSession')"
                />
              </div>
            </q-td>
          </template>
        </q-table>
      </BaseCard>
    </div>

    <!-- Start Session Dialog -->
    <CountingSessionDialog
      v-model="showStartDialog"
      :locations="availableLocations"
      @session-created="onSessionCreated"
    />
  </PageLayout>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount, defineAsyncComponent } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useQuasar } from 'quasar';
  import { useRouter } from 'vue-router';
  import { useAuthStore } from 'src/stores/auth';
  import { useCountingStore } from 'src/stores/counting';
  import { useClinicStore } from 'src/stores/clinic';
  import type { CountingSession, PracticeLocation } from 'src/types/inventory';
  import PageLayout from 'src/components/PageLayout.vue';
  import PageTitle from 'src/components/PageTitle.vue';
  import BaseCard from 'src/components/base/BaseCard.vue';

  // Lazy loaded dialogs
  const CountingSessionDialog = defineAsyncComponent(
    () => import('src/components/inventory/CountingSessionDialog.vue')
  );

  // Composables
  const { t } = useI18n();
  const $q = useQuasar();
  const router = useRouter();
  const authStore = useAuthStore();
  const countingStore = useCountingStore();
  const clinicStore = useClinicStore();

  // Reactive state
  const selectedStatus = ref<string | null>(null);
  const showStartDialog = ref(false);

  // Pagination
  const pagination = ref({
    sortBy: 'started_at',
    descending: true,
    page: 1,
    rowsPerPage: 25,
  });

  // Computed properties
  const practiceId = computed(() => authStore.userProfile?.clinic_id || '');

  const statusOptions = computed(() => [
    { label: t('counting.status.active'), value: 'active' },
    { label: t('counting.status.completed'), value: 'completed' },
    { label: t('counting.status.cancelled'), value: 'cancelled' },
    { label: t('counting.status.approved'), value: 'approved' },
  ]);

  const availableLocations = computed<PracticeLocation[]>(() => {
    return clinicStore.activeLocations;
  });

  const activeSession = computed(() => {
    return (
      countingStore.sessions.find(session => session.status === 'active') ||
      null
    );
  });

  const filteredSessions = computed(() => {
    let sessions = [...countingStore.sessions];

    if (selectedStatus.value) {
      sessions = sessions.filter(
        session => session.status === selectedStatus.value
      );
    }

    return sessions;
  });

  const columns = computed(() => [
    {
      name: 'name',
      label: t('counting.sessionName'),
      field: 'name',
      sortable: true,
      align: 'left' as const,
      style: 'width: 200px',
    },
    {
      name: 'status',
      label: t('counting.status'),
      field: 'status',
      sortable: true,
      align: 'left' as const,
      style: 'width: 120px',
    },
    {
      name: 'progress',
      label: t('counting.progress'),
      field: 'progress',
      align: 'center' as const,
      sortable: false,
    },
    {
      name: 'started_at',
      label: t('common.startedAt'),
      field: 'started_at',
      align: 'left' as const,
      sortable: true,
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
  const refreshData = async () => {
    if (!practiceId.value) return;

    try {
      await countingStore.fetchSessions(practiceId.value);
      $q.notify({
        type: 'positive',
        message: t('common.dataRefreshed'),
        position: 'top',
      });
    } catch (error) {
      console.error('Error refreshing sessions:', error);
      $q.notify({
        type: 'negative',
        message: t('common.refreshFailed'),
        position: 'top',
      });
    }
  };

  const showStartSessionDialog = () => {
    showStartDialog.value = true;
  };

  const continueSession = (session: CountingSession) => {
    router.push(`/inventory/counting/${session.id}`);
  };

  const viewSession = (session: CountingSession) => {
    router.push(`/inventory/counting/${session.id}`);
  };

  const completeSession = async (session: CountingSession) => {
    $q.dialog({
      title: t('counting.completeSession'),
      message: t('counting.confirmComplete'),
      cancel: true,
      persistent: true,
    }).onOk(async () => {
      try {
        await countingStore.updateSession(session.id, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: authStore.user?.id || '',
        });

        $q.notify({
          type: 'positive',
          message: t('counting.sessionCompleted'),
          position: 'top',
        });

        await refreshData();
      } catch (error) {
        console.error('Error completing session:', error);
        $q.notify({
          type: 'negative',
          message: t('counting.completeFailed'),
          position: 'top',
        });
      }
    });
  };

  const onSessionCreated = (sessionId: string) => {
    router.push(`/inventory/counting/${sessionId}`);
  };

  // Formatting helpers
  const formatSessionType = (type: string): string => {
    return t(`counting.${type}`, type);
  };

  const formatStatus = (status: string): string => {
    return t(`counting.status.${status}`, status);
  };

  const statusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'primary';
      case 'completed':
        return 'positive';
      case 'cancelled':
        return 'negative';
      case 'approved':
        return 'info';
      default:
        return 'grey';
    }
  };

  const statusIcon = (status: string): string => {
    switch (status) {
      case 'active':
        return 'play_circle';
      case 'completed':
        return 'check_circle';
      case 'cancelled':
        return 'cancel';
      case 'approved':
        return 'verified';
      default:
        return 'help';
    }
  };

  const progressColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'primary';
      case 'completed':
        return 'positive';
      default:
        return 'grey';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const formatTime = (dateString: string): string => {
    return new Intl.DateTimeFormat('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const formatDateTime = (dateString: string): string => {
    return new Intl.DateTimeFormat('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  // Lifecycle
  onMounted(async () => {
    if (practiceId.value) {
      await clinicStore.fetchLocations(practiceId.value);
      
      // Try to restore active session first
      const activeSession = await countingStore.loadActiveSession(practiceId.value);
      if (activeSession) {
        $q.notify({
          type: 'info',
          message: `Actieve telsessie hersteld: ${activeSession.name}`,
          caption: 'Je kunt verder gaan waar je was gebleven',
          timeout: 5000,
          icon: 'restore',
          actions: [
            {
              label: 'Ga verder',
              color: 'white',
              handler: () => {
                router.push(`/inventory/counting/${activeSession.id}`);
              }
            }
          ]
        });
      }
      
      await refreshData();
    }
  });

  onBeforeUnmount(() => {
    // Cleanup to prevent async operations after unmount
  });
</script>

<style lang="scss" scoped>
  .counting-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-4);

    .status-filter {
      min-width: 150px;
    }

    @media (max-width: 768px) {
      flex-direction: column;
      gap: var(--space-3);

      .status-filter {
        min-width: 100%;
      }
    }
  }

  .active-session-card {
    border-left: 4px solid var(--info);
  }

  .active-session-content {
    .session-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: var(--space-6);

      .stat-item {
        .stat-label {
          font-size: var(--text-sm);
          color: var(--text-muted);
          margin-bottom: var(--space-1);
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }

        .stat-value {
          font-size: var(--text-lg);
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);

          &.discrepancies {
            color: var(--warning);
          }

          .progress-percentage {
            font-size: var(--text-sm);
            color: var(--text-muted);
            font-weight: var(--font-weight-normal);
          }
        }

        .progress-bar {
          margin-top: var(--space-2);
        }

        .remaining-text {
          font-size: var(--text-xs);
          color: var(--text-muted);
          margin-top: var(--space-1);
        }

        &.progress-item {
          grid-column: span 2;
          
          @media (max-width: 768px) {
            grid-column: span 1;
          }
        }

        &.autosave-status {
          .stat-value {
            font-size: var(--text-sm);
          }
        }
      }

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: var(--space-4);
      }
    }
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-12);
    gap: var(--space-4);

    .loading-text {
      color: var(--text-muted);
      font-size: var(--text-base);
      margin: 0;
    }
  }

  .session-info {
    .session-name {
      font-weight: var(--font-weight-medium);
      color: var(--text-primary);
    }

    .session-type {
      font-size: var(--text-sm);
      color: var(--text-muted);
    }
  }

  .progress-info {
    .progress-text {
      font-size: var(--text-sm);
      color: var(--text-primary);
      margin-bottom: var(--space-1);
    }

    .mini-progress {
      width: 100px;
    }
  }

  .date-info {
    .date {
      font-weight: var(--font-weight-medium);
      color: var(--text-primary);
    }

    .time {
      font-size: var(--text-sm);
      color: var(--text-muted);
    }
  }

  .action-buttons {
    display: flex;
    gap: var(--space-1);
  }
</style>
