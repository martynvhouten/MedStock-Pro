<template>
  <PageLayout>
    <template #header>
      <PageTitle
        :title="$t('settings.title')"
        :subtitle="$t('settings.manageSettingsSubtitle')"
        icon="tune"
        :meta="[
          { icon: 'person', text: userProfile?.full_name || 'User' },
          { icon: 'domain', text: clinicName },
        ]"
      >
        <template #actions>
          <q-btn
            color="primary"
            icon="save"
            :label="$t('settings.saveSettings')"
            @click="saveSettings"
            :loading="saving"
            unelevated
            no-caps
            class="btn-modern"
          />
        </template>
      </PageTitle>
    </template>

    <!-- Settings Grid -->
    <div class="settings-grid animate-slide-up">
      <!-- User Profile Settings -->
      <div class="settings-section">
        <BaseCard
          variant="elevated"
          :title="$t('settings.profile')"
          :subtitle="$t('settings.profileSubtitle')"
          icon="person"
          header-color="primary"
        >
          <div class="form-grid" role="group" aria-labelledby="profile-title">
            <q-input
              v-model="userSettings.fullName"
              :label="$t('auth.fullName')"
              outlined
              readonly
              class="input-modern"
              :aria-label="`${$t('auth.fullName')}: ${userSettings.fullName}`"
            >
              <template v-slot:prepend>
                <q-icon name="person" aria-hidden="true" />
              </template>
            </q-input>

            <q-input
              v-model="userSettings.email"
              :label="$t('auth.email')"
              outlined
              readonly
              class="input-modern"
              :aria-label="`${$t('auth.email')}: ${userSettings.email}`"
            >
              <template v-slot:prepend>
                <q-icon name="email" aria-hidden="true" />
              </template>
            </q-input>

            <q-input
              v-model="userSettings.role"
              :label="$t('settings.role')"
              outlined
              readonly
              class="input-modern"
              :aria-label="`${$t('settings.role')}: ${userSettings.role}`"
            >
              <template v-slot:prepend>
                <q-icon name="badge" aria-hidden="true" />
              </template>
            </q-input>
          </div>
        </BaseCard>
      </div>

      <!-- Appearance Settings -->
      <div class="settings-section">
        <BaseCard
          variant="elevated"
          :title="$t('settings.appearanceTitle')"
          :subtitle="$t('settings.appearanceSubtitle')"
          icon="palette"
          header-color="secondary"
        >
          <div
            class="settings-items"
            role="group"
            aria-labelledby="appearance-title"
          >
            <!-- Dark Mode Toggle -->
            <BaseCard variant="glass-modern" class="setting-item">
              <div class="setting-info">
                <div class="setting-label" id="dark-mode-label">
                  {{ $t('settings.darkMode') }}
                </div>
                <div class="setting-description">
                  {{ $t('settings.darkModeDescription') }}
                </div>
              </div>
              <div class="setting-control">
                <q-toggle
                  v-model="isDarkMode"
                  @update:model-value="toggleDarkMode"
                  color="primary"
                  size="lg"
                  class="toggle-modern"
                  :aria-labelledby="'dark-mode-label'"
                  :aria-describedby="'dark-mode-description'"
                />
                <div id="dark-mode-description" class="sr-only">
                  {{
                    isDarkMode
                      ? $t('settings.darkModeEnabled')
                      : $t('settings.lightModeEnabled')
                  }}
                </div>
              </div>
            </BaseCard>

            <!-- Language Setting -->
            <BaseCard variant="glass-modern" class="setting-item">
              <div class="setting-info">
                <div class="setting-label" id="language-label">
                  {{ $t('settings.language') }}
                </div>
                <div class="setting-description">
                  {{ $t('settings.selectLanguage') }}
                </div>
              </div>
              <div class="setting-control">
                <q-select
                  v-model="selectedLanguage"
                  :options="languageOptions"
                  @update:model-value="changeLanguage"
                  option-value="value"
                  option-label="label"
                  emit-value
                  map-options
                  outlined
                  dense
                  class="select-modern"
                  style="width: 150px"
                  :aria-labelledby="'language-label'"
                />
              </div>
            </div>

            <!-- Theme Setting -->
            <BaseCard variant="glass-modern" class="setting-item">
              <div class="setting-info">
                <div class="setting-label" id="theme-label">
                  {{ $t('settings.colorSchemeTitle') }}
                </div>
                <div class="setting-description">
                  {{ $t('settings.colorSchemeDescription') }}
                </div>
              </div>
              <div class="setting-control">
                <q-select
                  v-model="selectedTheme"
                  :options="themeOptions"
                  @update:model-value="changeTheme"
                  option-value="value"
                  option-label="label"
                  emit-value
                  map-options
                  outlined
                  dense
                  class="select-modern"
                  style="width: 150px"
                  :aria-labelledby="'theme-label'"
                />
              </div>
            </BaseCard>
          </div>
        </BaseCard>
      </div>

      <!-- Clinic Information -->
      <div class="settings-section full-width">
        <BaseCard
          variant="elevated"
          :title="$t('settings.clinic')"
          :subtitle="$t('settings.clinicInfoSubtitle')"
          icon="business"
          icon-color="info"
          header-color="info"
        >
            <div
              class="clinic-form-grid"
              role="group"
              aria-labelledby="clinic-title"
            >
              <q-input
                v-model="clinicSettings.name"
                :label="$t('settings.clinicName')"
                outlined
                readonly
                class="input-modern"
                :aria-label="`${$t('settings.clinicName')}: ${
                  clinicSettings.name
                }`"
              >
                <template v-slot:prepend>
                  <q-icon name="business" aria-hidden="true" />
                </template>
              </q-input>

              <q-input
                v-model="clinicSettings.contactEmail"
                :label="$t('settings.contactEmail')"
                outlined
                readonly
                class="input-modern"
                :aria-label="`${$t('settings.contactEmail')}: ${
                  clinicSettings.contactEmail
                }`"
              >
                <template v-slot:prepend>
                  <q-icon name="email" aria-hidden="true" />
                </template>
              </q-input>

              <q-input
                v-model="clinicSettings.contactPhone"
                :label="$t('settings.phoneNumber')"
                outlined
                readonly
                class="input-modern"
                :aria-label="`${$t('settings.phoneNumber')}: ${
                  clinicSettings.contactPhone
                }`"
              >
                <template v-slot:prepend>
                  <q-icon name="phone" aria-hidden="true" />
                </template>
              </q-input>

              <q-input
                v-model="clinicSettings.address"
                :label="$t('settings.address')"
                outlined
                readonly
                class="input-modern"
                :aria-label="`${$t('settings.address')}: ${
                  clinicSettings.address
                }`"
              >
                <template v-slot:prepend>
                  <q-icon name="location_on" aria-hidden="true" />
                </template>
              </q-input>
            </div>

            <div class="clinic-notice">
              <q-banner class="notice-banner glass-card-modern" rounded>
                <template v-slot:avatar>
                  <q-icon name="info" color="info" />
                </template>
                <div class="notice-text">
                  {{ $t('settings.contactSettingsNotice') }}
                </div>
              </q-banner>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Notification Settings -->
      <div class="settings-section">
        <BaseCard
          variant="elevated"
          :title="$t('settings.notifications')"
          :subtitle="$t('settings.notificationSettingsSubtitle')"
          icon="notifications"
          icon-color="warning"
          header-color="warning"
        >
            <div class="settings-items">
              <!-- Low Stock Alerts -->
              <BaseCard variant="glass-modern" class="setting-item">
                <div class="setting-info">
                  <div class="setting-label">
                    {{ $t('settings.stockAlertsLabel') }}
                  </div>
                  <div class="setting-description">
                    {{ $t('settings.stockAlertsDescription') }}
                  </div>
                </div>
                <div class="setting-control">
                  <q-toggle
                    v-model="notificationSettings.lowStockAlerts"
                    color="primary"
                    class="toggle-modern"
                  />
                </div>
              </BaseCard>

              <!-- Email Notifications -->
              <BaseCard variant="glass-modern" class="setting-item">
                <div class="setting-info">
                  <div class="setting-label">
                    {{ $t('settings.emailNotificationsLabel') }}
                  </div>
                  <div class="setting-description">
                    {{ $t('settings.emailNotificationsDescription') }}
                  </div>
                </div>
                <div class="setting-control">
                  <q-toggle
                    v-model="notificationSettings.emailNotifications"
                    color="primary"
                    class="toggle-modern"
                  />
                </div>
              </BaseCard>

              <!-- Browser Notifications -->
              <BaseCard variant="glass-modern" class="setting-item">
                <div class="setting-info">
                  <div class="setting-label">
                    {{ $t('settings.browserNotificationsLabel') }}
                  </div>
                  <div class="setting-description">
                    {{ $t('settings.browserNotificationsDescription') }}
                  </div>
                </div>
                <div class="setting-control">
                  <q-toggle
                    v-model="notificationSettings.browserNotifications"
                    color="primary"
                    class="toggle-modern"
                  />
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- System Information -->
      <div class="settings-section">
        <BaseCard
          variant="elevated"
          :title="$t('settings.systemInfoTitle')"
          :subtitle="$t('settings.systemInfoSubtitle')"
          icon="info"
          icon-color="accent"
          header-color="accent"
        >
            <div class="system-info">
              <div class="info-item">
                <div class="info-label">{{ $t('settings.versionLabel') }}</div>
                <div class="info-value">1.0.0</div>
              </div>

              <div class="info-item">
                <div class="info-label">
                  {{ $t('settings.lastUpdateLabel') }}
                </div>
                <div class="info-value">
                  {{ new Date().toLocaleDateString('nl-NL') }}
                </div>
              </div>

              <div class="info-item">
                <div class="info-label">{{ $t('settings.supportLabel') }}</div>
                <div class="info-value">
                  <a
                    href="mailto:support@remcura.com"
                    class="support-link"
                  >
                    support@remcura.com
                  </a>
                </div>
              </BaseCard>
            </div>
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
  import { useClinicStore } from 'src/stores/clinic';
  import { useThemeManager } from 'src/composables/themeManager';
  import {
    setI18nLanguage,
    getCurrentLocale,
    type SupportedLocale,
  } from 'src/i18n';
  import PageLayout from 'src/components/PageLayout.vue';
  import PageTitle from 'src/components/PageTitle.vue';
  import BaseCard from 'src/components/base/BaseCard.vue';

  const $q = useQuasar();
  const { t } = useI18n();
  const authStore = useAuthStore();
  const clinicStore = useClinicStore();
  const { themeOptions, currentTheme, applyTheme, getCurrentThemeName } =
    useThemeManager();

  // State
  const saving = ref(false);
  const isDarkMode = ref($q.dark.isActive);
  const selectedLanguage = ref(getCurrentLocale());
  const selectedTheme = ref(getCurrentThemeName());

  // Computed properties
  const userProfile = computed(() => authStore.userProfile);
  const clinicName = computed(() => clinicStore.clinic?.name || 'Kliniek');

  // Form data
  const userSettings = ref({
    fullName: userProfile.value?.full_name || '',
    email: authStore.userEmail || '',
    role: 'Administrator', // This would come from your role system
  });

  const clinicSettings = ref({
    name: clinicName.value,
    contactEmail: 'contact@example.com',
    contactPhone: '+31 20 123 4567',
    address: 'Voorbeeldstraat 123, Amsterdam',
  });

  const notificationSettings = ref({
    lowStockAlerts: true,
    emailNotifications: true,
    browserNotifications: false,
  });

  const languageOptions = [
    { label: 'Nederlands', value: 'nl' },
    { label: 'English', value: 'en' },
    { label: 'Español', value: 'es' },
  ];

  // Methods
  const toggleDarkMode = (value: boolean) => {
    $q.dark.set(value);

    $q.notify({
      type: 'positive',
      message: value
        ? t('settings.darkModeEnabled')
        : t('settings.lightModeEnabled'),
      position: 'top-right',
      timeout: 2000,
    });
  };

  const changeTheme = (themeName: string) => {
    selectedTheme.value = themeName;
    applyTheme(themeName);

    const themeLabel =
      themeOptions.value.find(option => option.value === themeName)?.label ||
      themeName;
    $q.notify({
      type: 'positive',
      message: `Kleurenschema "${themeLabel}" toegepast`,
      position: 'top-right',
      timeout: 2000,
    });
  };

  const changeLanguage = (locale: SupportedLocale) => {
    selectedLanguage.value = locale;
    setI18nLanguage(locale);

    const languageLabel =
      languageOptions.find(option => option.value === locale)?.label || locale;
    $q.notify({
      type: 'positive',
      message: t('settings.languageChanged', { language: languageLabel }),
      position: 'top-right',
      timeout: 2000,
    });
  };

  const saveSettings = async () => {
    saving.value = true;

    try {
      // Here you would save the settings to your backend/store
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      $q.notify({
        type: 'positive',
        message: t('settings.settingsSaved'),
        position: 'top-right',
        timeout: 3000,
      });
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: t('settings.settingsSaveError'),
        position: 'top-right',
        timeout: 3000,
      });
    } finally {
      saving.value = false;
    }
  };

  // Initialize data
  onMounted(() => {
    // Load settings from store/localStorage if available
    const savedDarkMode = $q.localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      const darkModeValue = savedDarkMode === 'true';
      isDarkMode.value = darkModeValue;
      $q.dark.set(darkModeValue);
    }
  });
</script>

<style lang="scss" scoped>
  // Settings grid
  .settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: var(--space-6);

    .settings-section {
      &.full-width {
        grid-column: 1 / -1;
      }
    }
  }

  // Form grids
  .form-grid {
    display: grid;
    gap: var(--space-4);
  }

  .clinic-form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--space-4);
    margin-bottom: var(--space-6);
  }

  .clinic-notice {
    .notice-banner {
      background: var(--glass-bg);
      backdrop-filter: var(--glass-backdrop);
      border: 1px solid var(--glass-border);

      .notice-text {
        font-size: var(--text-sm);
        color: var(--neutral-700);
      }
    }
  }

  // Settings items
  .settings-items {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4);
    border-radius: var(--radius-lg);
    border: 1px solid var(--neutral-200);
    transition: all var(--transition-base);

    &:hover {
      border-color: var(--neutral-300);
      box-shadow: var(--shadow-sm);
    }

    .setting-info {
      flex: 1;

      .setting-label {
        font-size: var(--text-base);
        font-weight: var(--font-weight-medium);
        color: var(--neutral-900);
        margin-bottom: var(--space-1);
      }

      .setting-description {
        font-size: var(--text-sm);
        color: var(--neutral-600);
        margin: 0;
      }
    }

    .setting-control {
      margin-left: var(--space-4);
    }
  }

  // Input styling
  .input-modern {
    .q-field__control {
      border-radius: var(--radius-lg);
      transition: all var(--transition-base);

      &:hover {
        box-shadow: var(--shadow-sm);
      }
    }
  }

  .select-modern {
    border-radius: var(--radius-lg);
  }

  .toggle-modern {
    .q-toggle__track {
      border-radius: var(--radius-full);
    }

    .q-toggle__thumb {
      border-radius: var(--radius-full);
    }
  }

  // Card header styling
  .card-header {
    .card-header-content {
      display: flex;
      align-items: center;
      gap: var(--space-4);

      .card-title-section {
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);

        .q-icon {
          margin-top: 2px; // Align icon with first line of title text
          flex-shrink: 0;
        }

        .card-title {
          font-size: var(--text-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--neutral-900);
          margin: 0;
        }

        .card-subtitle {
          font-size: var(--text-sm);
          color: var(--neutral-600);
          margin: 0;
          margin-top: var(--space-1);
        }
      }
    }
  }

  // Card content
  .card-content {
    padding: var(--space-6);
  }

  // System info
  .system-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3) 0;
      border-bottom: 1px solid var(--neutral-200);

      &:last-child {
        border-bottom: none;
      }

      .info-label {
        font-weight: var(--font-weight-medium);
        color: var(--neutral-700);
      }

      .info-value {
        color: var(--neutral-900);

        .support-link {
          color: var(--brand-primary);
          text-decoration: none;
          transition: color var(--transition-base);

          &:hover {
            color: var(--brand-primary-dark);
          }
        }
      }
    }
  }

  // Responsive design
  @media (max-width: 768px) {
    .settings-grid {
      grid-template-columns: 1fr;
      gap: var(--space-4);
    }

    .clinic-form-grid {
      grid-template-columns: 1fr;
    }

    .setting-item {
      flex-direction: column;
      align-items: stretch;
      gap: var(--space-3);

      .setting-control {
        margin-left: 0;
        align-self: flex-end;
      }
    }
  }

  // Dark mode adjustments
  body.body--dark {
    .setting-item {
      border-color: var(--neutral-300);

      &:hover {
        border-color: var(--neutral-400);
      }

      .setting-label {
        color: var(--neutral-900);
      }

      .setting-description {
        color: var(--neutral-600);
      }
    }

    .clinic-notice .notice-banner .notice-text {
      color: var(--neutral-600);
    }

    .card-title {
      color: var(--neutral-900);
    }

    .card-subtitle {
      color: var(--neutral-600);
    }
  }

  // Screen reader only content
  .sr-only {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }

  // Focus styles for interactive elements
  .toggle-modern:focus {
    outline: 2px solid var(--brand-primary);
    outline-offset: 2px;
  }

  .select-modern:focus-within {
    outline: 2px solid var(--brand-primary);
    outline-offset: 2px;
  }
</style>
