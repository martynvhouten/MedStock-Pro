<template>
  <BaseCard 
    variant="elevated"
    :class="widgetClasses"
    class="dashboard-widget"
    :title="widget.title"
    :subtitle="widget.subtitle"
    :icon="widget.icon"
    icon-color="primary"
    v-bind="$attrs"
  >
    <template #header-actions>
      <q-btn
        v-if="widget.type === 'chart'"
        flat
        round
        dense
        icon="more_vert"
        size="sm"
      >
        <q-menu>
          <q-list dense>
            <q-item clickable v-close-popup>
              <q-item-section>Vernieuwen</q-item-section>
            </q-item>
            <q-item clickable v-close-popup>
              <q-item-section>Exporteren</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </template>
      <!-- Metric Widget -->
      <div v-if="widget.type === 'metric'" class="metric-widget">
        <MetricWidget :data="widget.data" />
      </div>

      <!-- Chart Widget -->
      <div v-else-if="widget.type === 'chart'" class="chart-widget">
        <ChartWidget :data="widget.data" :chart-type="chartType" />
      </div>

      <!-- List Widget -->
      <div v-else-if="widget.type === 'list'" class="list-widget">
        <ListWidget :data="widget.data" :widget-id="widget.id" />
      </div>

      <!-- Alert Widget -->
      <div v-else-if="widget.type === 'alert'" class="alert-widget">
        <AlertWidget :data="widget.data" />
      </div>

      <!-- Quick Action Widget -->
      <div v-else-if="widget.type === 'quickAction'" class="quick-action-widget">
        <QuickActionWidget :data="widget.data" />
      </div>

      <!-- Fallback -->
      <div v-else class="fallback-widget">
        <q-icon name="widgets" size="3rem" color="grey-5" />
        <p class="text-grey-6 q-mt-md">Widget type niet ondersteund</p>
      </div>

    <!-- Loading Overlay -->
    <q-inner-loading :showing="loading">
      <q-spinner-dots size="40px" color="primary" />
    </q-inner-loading>
  </BaseCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseCard from 'src/components/base/BaseCard.vue';
import type { DashboardWidget } from '@/services/dashboard';
import MetricWidget from './widgets/MetricWidget.vue';
import ChartWidget from './widgets/ChartWidget.vue';
import ListWidget from './widgets/ListWidget.vue';
import AlertWidget from './widgets/AlertWidget.vue';
import QuickActionWidget from './widgets/QuickActionWidget.vue';

interface Props {
  widget: DashboardWidget;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
});

const widgetClasses = computed(() => [
  `widget-size-${props.widget.size}`,
  `widget-type-${props.widget.type}`,
  {
    'widget-loading': props.loading
  }
]);

const chartType = computed(() => {
  // Determine chart type based on widget data or configuration
  if (props.widget.id.includes('analytics')) return 'line';
  if (props.widget.id.includes('cost')) return 'pie';
  return 'bar';
});
</script>

<style lang="scss" scoped>
.dashboard-widget {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
  background: var(--surface);
  border: 1px solid var(--border-color);
  overflow: hidden;
  
  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
  
  &.widget-clickable {
    cursor: pointer;
    
    &:hover {
      border-color: var(--primary);
    }
  }
}

// Widget Header
.widget-header {
  background: var(--surface-variant);
  border-bottom: 1px solid var(--border-color);
  padding: var(--space-4);
  
  .widget-title {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
  }
  
  .widget-actions {
    display: flex;
    gap: var(--space-2);
  }
}

// Widget Content
.widget-content {
  padding: var(--space-4);
  
  &.widget-content-padded {
    padding: var(--space-6);
  }
  
  &.widget-content-compact {
    padding: var(--space-3);
  }
}

// Loading State
.widget-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  color: var(--text-muted);
  
  .loading-text {
    margin-left: var(--space-3);
    font-size: var(--text-sm);
  }
}

// Error State
.widget-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  text-align: center;
  color: var(--negative);
  
  h6 {
    margin: var(--space-2) 0;
    color: var(--negative);
  }
  
  p {
    margin: 0 0 var(--space-4) 0;
    color: var(--text-muted);
    font-size: var(--text-sm);
  }
}

// Quick Action Widget Specific
.dashboard-widget.widget-quick-action {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  
  .widget-header {
    background: transparent;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    
    .widget-title {
      color: white;
    }
  }
  
  .widget-content {
    background: transparent;
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }
}

// Alert Widget Specific
.dashboard-widget.widget-alert {
  border-left: 4px solid var(--warning);
  
  &.widget-alert-error {
    border-left-color: var(--negative);
  }
  
  &.widget-alert-success {
    border-left-color: var(--positive);
  }
  
  &.widget-alert-info {
    border-left-color: var(--info);
  }
}

// Metric Widget Specific
.dashboard-widget.widget-metric {
  .widget-content {
    text-align: center;
    padding: var(--space-6);
  }
}

// Chart Widget Specific
.dashboard-widget.widget-chart {
  .widget-content {
    padding: var(--space-2);
  }
}

// List Widget Specific  
.dashboard-widget.widget-list {
  .widget-content {
    padding: 0;
  }
}

// Size variations
.dashboard-widget {
  &.widget-size-small {
    min-height: 140px;
  }
  
  &.widget-size-medium {
    min-height: 200px;
  }
  
  &.widget-size-large {
    min-height: 300px;
  }
}

// Dark Mode
body.body--dark {
  .dashboard-widget {
    background: var(--surface-dark);
    border-color: var(--border-color-dark);
    
    .widget-header {
      background: var(--surface-variant-dark);
      border-bottom-color: var(--border-color-dark);
      
      .widget-title {
        color: var(--text-primary-dark);
      }
    }
    
    &:hover {
      border-color: var(--primary-light);
    }
  }
  
  .widget-loading {
    color: var(--text-muted-dark);
  }
  
  .widget-error {
    h6 {
      color: var(--negative-light);
    }
    
    p {
      color: var(--text-muted-dark);
    }
  }
}

// Mobile Responsive
@media (max-width: 768px) {
  .dashboard-widget {
    &:hover {
      transform: none;
    }
    
    .widget-header {
      padding: var(--space-3);
      
      .widget-title {
        font-size: var(--text-base);
      }
    }
    
    .widget-content {
      padding: var(--space-3);
      
      &.widget-content-padded {
        padding: var(--space-4);
      }
    }
  }
  
  .dashboard-widget.widget-quick-action {
    &:hover {
      transform: translateY(-2px);
    }
  }
}

// Accessibility
.dashboard-widget {
  &:focus-within {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
}

// Animation for content changes
.widget-content-enter-active,
.widget-content-leave-active {
  transition: all 0.3s ease;
}

.widget-content-enter-from,
.widget-content-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style> 