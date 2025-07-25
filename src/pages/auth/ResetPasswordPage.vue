<template>
  <div class="reset-password-page">
    <div class="reset-container">
      <div class="reset-content">
        <!-- Header -->
        <div class="reset-header">
          <div class="brand-logo">
            <q-icon name="lock_reset" size="2.5rem" color="primary" />
          </div>
          <h1 class="reset-title">{{ $t('auth.resetPassword') }}</h1>
          <p class="reset-subtitle">{{ $t('auth.chooseNewPassword') }}</p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <q-spinner-dots size="xl" color="primary" />
          <p class="loading-text">{{ $t('auth.verifyingResetLink') }}</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-state">
          <q-icon name="error" size="4rem" color="negative" />
          <h3>{{ $t('auth.invalidResetLink') }}</h3>
          <p>{{ error }}</p>
          <q-btn
            color="primary"
            :label="$t('auth.backToLogin')"
            @click="goToLogin"
            unelevated
            no-caps
          />
        </div>

        <!-- Reset Form -->
        <div v-else-if="!passwordUpdated" class="reset-form">
          <q-form @submit.prevent="handlePasswordReset" novalidate>
            <q-input
              v-model="newPassword.value.value"
              :type="showPassword ? 'text' : 'password'"
              :label="$t('auth.newPassword')"
              outlined
              :error="!!newPassword.error.value"
              :error-message="newPassword.error.value"
              class="q-mb-md"
              autocomplete="new-password"
              required
            >
              <template #prepend>
                <q-icon name="lock" />
              </template>
              <template #append>
                <q-btn
                  flat
                  round
                  dense
                  :icon="showPassword ? 'visibility_off' : 'visibility'"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>

            <q-input
              v-model="confirmPassword.value.value"
              :type="showConfirmPassword ? 'text' : 'password'"
              :label="$t('auth.confirmPassword')"
              outlined
              :error="!!confirmPassword.error.value"
              :error-message="confirmPassword.error.value"
              class="q-mb-md"
              autocomplete="new-password"
              required
            >
              <template #prepend>
                <q-icon name="lock" />
              </template>
              <template #append>
                <q-btn
                  flat
                  round
                  dense
                  :icon="showConfirmPassword ? 'visibility_off' : 'visibility'"
                  @click="showConfirmPassword = !showConfirmPassword"
                />
              </template>
            </q-input>

            <!-- Password strength indicator -->
            <div class="password-strength q-mb-lg">
              <div class="strength-label text-caption q-mb-xs">
                {{ $t('auth.passwordStrength') }}
              </div>
              <q-linear-progress
                :value="passwordStrength.score / 4"
                :color="passwordStrength.color"
                size="12px"
                rounded
              />
              <div class="strength-text text-caption q-mt-xs" :class="`text-${passwordStrength.color}`">
                {{ passwordStrength.text }}
              </div>
              <div v-if="passwordStrength.feedback.length > 0" class="strength-feedback q-mt-xs">
                <div v-for="feedback in passwordStrength.feedback" :key="feedback" class="text-caption text-grey-6">
                  • {{ feedback }}
                </div>
              </div>
            </div>

            <q-btn
              type="submit"
              color="primary"
              :label="$t('auth.updatePassword')"
              :loading="updating"
              unelevated
              no-caps
              class="full-width q-mb-md"
              :disable="passwordStrength.score < 2"
              size="lg"
            />
          </q-form>

          <div class="reset-footer">
            <q-btn
              flat
              :label="$t('auth.backToLogin')"
              @click="goToLogin"
              color="grey-6"
              no-caps
            />
          </div>
        </div>

        <!-- Success State -->
        <div v-else class="success-state">
          <q-icon name="check_circle" size="4rem" color="positive" />
          <h3>{{ $t('auth.passwordUpdated') }}</h3>
          <p>{{ $t('auth.passwordUpdatedSuccess') }}</p>
          <q-btn
            color="primary"
            :label="$t('auth.proceedToLogin')"
            @click="goToLogin"
            unelevated
            no-caps
            size="lg"
          />
        </div>
      </div>
    </div>

    <!-- Background decoration -->
    <div class="reset-background">
      <div class="bg-shape bg-shape-1"></div>
      <div class="bg-shape bg-shape-2"></div>
      <div class="bg-shape bg-shape-3"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useRouter, useRoute } from 'vue-router';
import { supabase } from 'src/boot/supabase';
import { useFormValidation } from 'src/composables/useFormValidation';

// Composables
const { t } = useI18n();
const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const { rules, createField, validateForm } = useFormValidation();

// State
const loading = ref(true);
const updating = ref(false);
const error = ref('');
const passwordUpdated = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// Form fields
const newPassword = createField('', [rules.required, rules.minLength(8)]);
const confirmPassword = createField('', [
  rules.required,
  (val: string) => val === newPassword.value.value || t('auth.passwordsDoNotMatch')
]);

// Computed
const passwordStrength = computed(() => {
  const password = newPassword.value.value;
  if (!password) return { score: 0, color: 'grey', text: '', feedback: [] };

  let score = 0;
  let feedback = [];

  // Length check
  if (password.length >= 8) score++;
  else feedback.push(t('auth.passwordTooShort'));

  // Contains lowercase
  if (/[a-z]/.test(password)) score++;
  else feedback.push(t('auth.passwordNeedsLowercase'));

  // Contains uppercase
  if (/[A-Z]/.test(password)) score++;
  else feedback.push(t('auth.passwordNeedsUppercase'));

  // Contains number
  if (/\d/.test(password)) score++;
  else feedback.push(t('auth.passwordNeedsNumber'));

  // Contains special character
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  let color, text;
  switch (score) {
    case 0:
    case 1:
      color = 'negative';
      text = t('auth.passwordWeak');
      break;
    case 2:
      color = 'warning';
      text = t('auth.passwordFair');
      break;
    case 3:
      color = 'info';
      text = t('auth.passwordGood');
      break;
    case 4:
    case 5:
      color = 'positive';
      text = t('auth.passwordStrong');
      break;
    default:
      color = 'grey';
      text = '';
  }

  return { score, color, text, feedback };
});

// Methods
const handlePasswordReset = async () => {
  if (!validateForm([newPassword, confirmPassword])) return;

  if (passwordStrength.value.score < 2) {
    $q.notify({
      type: 'warning',
      message: t('auth.passwordTooWeak'),
      caption: t('auth.improvPasswordStrength'),
    });
    return;
  }

  try {
    updating.value = true;

    const { error } = await supabase.auth.updateUser({
      password: newPassword.value.value,
    });

    if (error) throw error;

    passwordUpdated.value = true;

    $q.notify({
      type: 'positive',
      message: t('auth.passwordUpdated'),
      caption: t('auth.passwordUpdatedSuccess'),
    });

  } catch (error: any) {
    console.error('Password update error:', error);
    $q.notify({
      type: 'negative',
      message: t('auth.passwordUpdateError'),
      caption: error.message || t('common.tryAgain'),
    });
  } finally {
    updating.value = false;
  }
};

const goToLogin = () => {
  router.push('/auth/login');
};

const verifyResetToken = async () => {
  try {
    // Check if user is authenticated via reset token
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    if (!session) {
      throw new Error(t('auth.sessionExpired'));
    }

    // Check if this is a password recovery session
    if (!session.user.recovery_sent_at) {
      throw new Error(t('auth.invalidResetSession'));
    }

    loading.value = false;

  } catch (err: any) {
    console.error('Reset token verification error:', err);
    error.value = err.message || t('auth.invalidResetLink');
    loading.value = false;
  }
};

// Lifecycle
onMounted(async () => {
  // Small delay for better UX
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await verifyResetToken();
});
</script>

<style lang="scss" scoped>
.reset-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--secondary-50) 100%);
  position: relative;
  overflow: hidden;
  padding: var(--space-4);
}

.reset-container {
  width: 100%;
  max-width: 480px;
  position: relative;
  z-index: 2;
}

.reset-content {
  background: white;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  padding: var(--space-8);
  border: 1px solid var(--neutral-200);
}

.reset-header {
  text-align: center;
  margin-bottom: var(--space-8);

  .brand-logo {
    margin-bottom: var(--space-4);
  }

  .reset-title {
    font-size: var(--text-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    margin: 0 0 var(--space-2) 0;
  }

  .reset-subtitle {
    font-size: var(--text-base);
    color: var(--text-muted);
    margin: 0;
  }
}

.loading-state,
.error-state,
.success-state {
  text-align: center;
  padding: var(--space-8) 0;

  h3 {
    margin: var(--space-4) 0 var(--space-2) 0;
    color: var(--text-primary);
  }

  p {
    margin: 0 0 var(--space-6) 0;
    color: var(--text-muted);
  }

  .loading-text {
    color: var(--text-muted);
    margin-top: var(--space-4);
  }
}

.reset-form {
  .password-strength {
    .strength-label {
      color: var(--text-muted);
      font-weight: var(--font-weight-medium);
    }

    .strength-text {
      font-weight: var(--font-weight-medium);
    }

    .strength-feedback {
      max-height: 100px;
      overflow-y: auto;
    }
  }
}

.reset-footer {
  text-align: center;
  margin-top: var(--space-6);
  padding-top: var(--space-6);
  border-top: 1px solid var(--neutral-200);
}

// Background decoration
.reset-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  overflow: hidden;

  .bg-shape {
    position: absolute;
    border-radius: 50%;
    background: linear-gradient(45deg, rgba(var(--primary-rgb), 0.1), rgba(var(--secondary-rgb), 0.1));

    &.bg-shape-1 {
      width: 200px;
      height: 200px;
      top: -100px;
      right: -100px;
      animation: float 6s ease-in-out infinite;
    }

    &.bg-shape-2 {
      width: 150px;
      height: 150px;
      bottom: -75px;
      left: -75px;
      animation: float 8s ease-in-out infinite reverse;
    }

    &.bg-shape-3 {
      width: 100px;
      height: 100px;
      top: 50%;
      left: -50px;
      animation: float 7s ease-in-out infinite;
    }
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

// Dark mode support
body.body--dark {
  .reset-content {
    background: var(--neutral-800);
    border-color: var(--neutral-700);
  }

  .reset-header {
    .reset-title {
      color: var(--text-primary-dark);
    }

    .reset-subtitle {
      color: var(--text-muted-dark);
    }
  }

  .loading-state,
  .error-state,
  .success-state {
    h3 {
      color: var(--text-primary-dark);
    }

    p,
    .loading-text {
      color: var(--text-muted-dark);
    }
  }

  .reset-footer {
    border-color: var(--neutral-600);
  }
}

// Mobile optimizations
@media (max-width: 768px) {
  .reset-password-page {
    padding: var(--space-3);
  }

  .reset-content {
    padding: var(--space-6);
  }

  .reset-header {
    margin-bottom: var(--space-6);

    .reset-title {
      font-size: var(--text-2xl);
    }

    .reset-subtitle {
      font-size: var(--text-sm);
    }
  }

  .loading-state,
  .error-state,
  .success-state {
    padding: var(--space-6) 0;
  }
}
</style>