<template>
  <PageLayout>
    <PageTitle
      :title="$t('notificationsPage.title')"
      :subtitle="$t('notificationsPage.subtitle')"
      icon="campaign"
    />

    <div class="row q-gutter-md">
      <!-- Filters and Stats -->
      <div class="col-12">
        <BaseCard variant="glass-modern">
            <div class="row items-center justify-between">
              <div class="col-auto">
                <div class="text-h6">
                  {{ $t('notificationsPage.notificationStatistics') }}
                </div>
              </div>
              <div class="col-auto">
                <q-btn-group flat>
                  <q-btn
                    flat
                    :color="filter === 'all' ? 'primary' : 'grey-6'"
                    :label="`${$t('notificationsPage.all')} (${
                      mockNotifications.length
                    })`"
                    @click="filter = 'all'"
                  />
                  <q-btn
                    flat
                    :color="filter === 'unread' ? 'primary' : 'grey-6'"
                    :label="`${$t(
                      'notificationsPage.unread'
                    )} (${unreadCount})`"
                    @click="filter = 'unread'"
                  />
                </q-btn-group>
              </div>
            </div>

            <div class="row q-gutter-md q-mt-sm">
              <div class="col">
                <div class="text-center">
                  <div class="text-h4 text-primary">{{ unreadCount }}</div>
                  <div class="text-caption">
                    {{ $t('notificationsPage.unreadCount') }}
                  </div>
                </div>
              </div>
              <div class="col">
                <div class="text-center">
                  <div class="text-h4">{{ mockNotifications.length }}</div>
                  <div class="text-caption">
                    {{ $t('notificationsPage.total') }}
                  </div>
                </div>
              </div>
            </div>
        </BaseCard>
      </div>

      <!-- Quick Actions -->
      <div class="col-12">
        <BaseCard
          variant="elevated"
          :title="$t('notificationsPage.quickActions')"
          icon="flash_on"
          header-color="warning"
        >
          <div class="row q-gutter-sm">
            <q-btn
              v-bind="markAllReadBtn"
              @click="markAllAsRead"
              :disable="unreadCount === 0"
            />
            <q-btn
              v-bind="testStockAlertBtn"
              @click="createTestNotification('stock_alert')"
            />
            <q-btn
              v-bind="testOrderUpdateBtn"
              @click="createTestNotification('order_update')"
            />
            <q-btn v-bind="clearAllBtn" @click="confirmClearAll" />
          </div>
        </BaseCard>
      </div>

      <!-- Notifications List -->
      <div class="col-12">
        <BaseCard
          variant="elevated"
          icon="notifications"
          header-color="info"
          :title="`${
            filter === 'all'
              ? $t('notificationsPage.all')
              : $t('notificationsPage.unread')
          } ${$t('notificationsPage.title')}`"
        >
          <template #header-actions>
            <q-select
              v-model="categoryFilter"
              :options="categoryOptions"
              :label="$t('notificationsPage.filterByCategory')"
              emit-value
              map-options
              clearable
              style="min-width: 200px"
              dense
              outlined
              dark
            />
          </template>

          <div
            v-if="filteredNotifications.length === 0"
            class="text-center q-py-xl"
          >
            <q-icon name="notifications_none" size="64px" color="grey-4" />
            <div class="text-h6 text-grey-6 q-mt-md">
              {{ $t('notificationsPage.noNotifications') }}
            </div>
            <div class="text-body2 text-grey-5">
              {{ $t('notificationsPage.allCaughtUp') }}
            </div>
          </div>

          <q-list v-else separator>
            <q-item
              v-for="notification in filteredNotifications"
              :key="notification.id"
              clickable
              v-ripple
              :class="{ 'bg-blue-1': !notification.is_read }"
            >
              <q-item-section avatar>
                <q-avatar
                  :color="getCategoryColor(notification.category)"
                  text-color="white"
                >
                  <q-icon :name="getCategoryIcon(notification.category)" />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-medium">{{
                  notification.title
                }}</q-item-label>
                <q-item-label caption lines="2">{{
                  notification.message
                }}</q-item-label>
                <q-item-label caption>
                  <q-chip
                    :color="getCategoryColor(notification.category)"
                    text-color="white"
                    size="sm"
                  >
                    {{ $t(`notificationsPage.types.${notification.category}`) }}
                  </q-chip>
                  <span class="q-ml-sm text-grey-6">
                    {{ formatDate(notification.created_at) }}
                  </span>
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <div class="row items-center">
                  <q-btn
                    v-if="!notification.is_read"
                    flat
                    round
                    dense
                    icon="mark_email_read"
                    :tooltip="$t('notificationsPage.markAsReadTooltip')"
                    @click.stop="markAsRead(notification.id)"
                  />
                  <q-btn
                    flat
                    round
                    dense
                    icon="delete"
                    color="negative"
                    :tooltip="$t('notificationsPage.deleteTooltip')"
                    @click.stop="deleteNotification(notification.id)"
                  />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </BaseCard>
      </div>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useQuasar } from 'quasar';
  import { useI18n } from 'vue-i18n';
  import { useAuthStore } from 'src/stores/auth';
  import { monitoringService } from 'src/services/monitoring';
  import { useButtons } from 'src/composables/useButtons';
  import PageLayout from 'src/components/PageLayout.vue';
  import PageTitle from 'src/components/PageTitle.vue';
  import BaseCard from 'src/components/base/BaseCard.vue';

  const $q = useQuasar();
  const { t } = useI18n();
  const authStore = useAuthStore();
  const { quickActions, getThemeConfig } = useButtons();

  // State
  const loading = ref(false);
  const filter = ref<'all' | 'unread'>('all');
  const categoryFilter = ref<string | null>(null);

  // Button configurations
  const markAllReadBtn = computed(() =>
    quickActions.markAllRead({
      label: t('notificationsPage.markAllRead'),
    })
  );

  const testStockAlertBtn = computed(() =>
    getThemeConfig('warning', {
      icon: 'warning',
      label: t('notificationsPage.testStockAlert'),
    })
  );

  const testOrderUpdateBtn = computed(() =>
    getThemeConfig('info', {
      icon: 'shopping_cart',
      label: t('notificationsPage.testOrderUpdate'),
    })
  );

  const clearAllBtn = computed(() =>
    quickActions.clearAll({
      label: t('notificationsPage.clearAllNotifications'),
    })
  );

  // Mock notifications data since we don't have a notifications table
  const mockNotifications = ref([
    {
      id: '1',
      title: t('sampleNotifications.lowStockWarning'),
      message: 'Spuiten 10ml zijn bijna op (2 stuks resterend)',
      category: 'stock_alert',
      is_read: false,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    },
    {
      id: '2',
      title: t('sampleNotifications.orderConfirmed'),
      message: 'Bestelling #ORD-2024-003 is bevestigd door leverancier',
      category: 'order_update',
      is_read: false,
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    },
    {
      id: '3',
      title: t('sampleNotifications.stockUpdated'),
      message: 'Handschoenen latex voorraad is bijgewerkt naar 150 stuks',
      category: 'stock_alert',
      is_read: true,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    },
    {
      id: '4',
      title: t('sampleNotifications.systemMaintenance'),
      message: 'Gepland onderhoud op zondag 3:00-5:00 AM',
      category: 'system_notification',
      is_read: true,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    },
  ]);

  // Computed properties
  const unreadCount = computed(
    () => mockNotifications.value.filter(n => !n.is_read).length
  );

  const filteredNotifications = computed(() => {
    let filtered = mockNotifications.value;

    if (filter.value === 'unread') {
      filtered = filtered.filter(n => !n.is_read);
    }

    if (categoryFilter.value) {
      filtered = filtered.filter(n => n.category === categoryFilter.value);
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });

  const categoryOptions = computed(() => [
    {
      label: t('notificationsPage.categories.stockAlert'),
      value: 'stock_alert',
    },
    {
      label: t('notificationsPage.categories.orderUpdate'),
      value: 'order_update',
    },
    {
      label: t('notificationsPage.categories.systemNotification'),
      value: 'system_notification',
    },
    { label: t('notificationsPage.categories.reminder'), value: 'reminder' },
  ]);

  // Methods
  const loadNotifications = async () => {
    loading.value = true;
    try {
      // In a real implementation, this would fetch from Supabase
      // For now, we use mock data
      await monitoringService.trackEvent('notifications_viewed', {
        total: mockNotifications.value.length,
        unread: unreadCount.value,
      });
    } catch (error) {
      console.error('Error loading notifications:', error);
      $q.notify({
        type: 'negative',
        message: t('notificationsPage.loadNotificationsError'),
      });
    } finally {
      loading.value = false;
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const notification = mockNotifications.value.find(
        n => n.id === notificationId
      );
      if (notification) {
        notification.is_read = true;
      }

      await monitoringService.trackEvent('notification_marked_read', {
        notification_id: notificationId,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = mockNotifications.value
        .filter(n => !n.is_read)
        .map(n => n.id);

      if (unreadIds.length === 0) return;

      mockNotifications.value.forEach(n => {
        if (unreadIds.includes(n.id)) {
          n.is_read = true;
        }
      });

      $q.notify({
        type: 'positive',
        message: t('notificationsPage.allMarkedAsRead'),
      });

      await monitoringService.trackEvent('notifications_mark_all_read', {
        count: unreadIds.length,
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      mockNotifications.value = mockNotifications.value.filter(
        n => n.id !== notificationId
      );

      $q.notify({
        type: 'positive',
        message: t('notificationsPage.notificationDeleted'),
      });

      await monitoringService.trackEvent('notification_deleted', {
        notification_id: notificationId,
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const confirmClearAll = () => {
    $q.dialog({
      title: t('notificationsPage.clearAllConfirm'),
      message: t('notificationsPage.clearAllConfirmMessage'),
      cancel: true,
      persistent: true,
    }).onOk(async () => {
      try {
        mockNotifications.value = [];

        $q.notify({
          type: 'positive',
          message: t('notificationsPage.allNotificationsCleared'),
        });

        await monitoringService.trackEvent('notifications_cleared_all');
      } catch (error) {
        console.error('Error clearing all notifications:', error);
      }
    });
  };

  const createTestNotification = async (
    type: 'stock_alert' | 'order_update'
  ) => {
    try {
      const testMessages = {
        stock_alert: {
          title: t('notificationsPage.testMessages.stockAlert.title'),
          message: t('notificationsPage.testMessages.stockAlert.message'),
        },
        order_update: {
          title: t('notificationsPage.testMessages.orderUpdate.title'),
          message: t('notificationsPage.testMessages.orderUpdate.message'),
        },
      };

      const newNotification = {
        id: Date.now().toString(),
        title: testMessages[type].title,
        message: testMessages[type].message,
        category: type,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      mockNotifications.value.unshift(newNotification);

      const successMessage =
        type === 'stock_alert'
          ? t('notificationsPage.testStockAlertCreated')
          : t('notificationsPage.testOrderUpdateCreated');

      $q.notify({
        type: 'positive',
        message: successMessage,
      });

      await monitoringService.trackEvent('test_notification_created', {
        type,
      });
    } catch (error) {
      console.error('Error creating test notification:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      stock_alert: 'warning',
      order_update: 'shopping_cart',
      system_notification: 'info',
      reminder: 'schedule',
    };
    return icons[category as keyof typeof icons] || 'notifications';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      stock_alert: 'warning',
      order_update: 'primary',
      system_notification: 'info',
      reminder: 'accent',
    };
    return colors[category as keyof typeof colors] || 'grey';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} dag${diffDays > 1 ? 'en' : ''} geleden`;
    } else if (diffHours > 0) {
      return `${diffHours} uur geleden`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minuten geleden`;
    }
  };

  // Lifecycle
  onMounted(() => {
    loadNotifications();
  });
</script>

<style scoped>
  .glass-card {
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .body--dark .glass-card {
    background: rgba(30, 30, 30, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
</style>
