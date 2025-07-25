<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card class="password-reset-card" style="min-width: 400px; max-width: 500px;">
      <q-card-section class="password-reset-header">
        <div class="text-h6">
          <q-icon name="lock_reset" class="q-mr-sm" />
          {{ $t('auth.resetPassword') }}
        </div>
        <q-btn
          flat
          round
          dense
          icon="close"
          @click="closeDialog"
          class="absolute-top-right q-ma-sm"
        />
      </q-card-section>

      <q-card-section>
        <!-- Step 1: Request Reset -->
        <div v-if="step === 'request'" class="reset-request-step">
          <p class="text-body1 q-mb-md">
            {{ $t('auth.resetPasswordInstructions') }}
          </p>

          <q-form @submit.prevent="handleRequestReset" novalidate>
            <q-input
              v-model="email.value.value"
              type="email"
              :label="$t('auth.email')"
              outlined
              :error="!!email.error.value"
              :error-message="email.error.value"
              class="q-mb-md"
              autocomplete="email"
              required
            >
              <template #prepend>
                <q-icon name="email" />
              </template>
            </q-input>

            <div class="form-actions">
              <q-btn
                type="submit"
                color="primary"
                :label="$t('auth.sendResetLink')"
                :loading="loading"
                unelevated
                no-caps
                class="full-width"
              />
            </div>
          </q-form>
        </div>

        <!-- Step 2: Email Sent Confirmation -->
        <div v-else-if="step === 'sent'" class="reset-sent-step">
          <div class="text-center q-mb-md">
            <q-icon name="mark_email_read" size="4rem" color="positive" />
          </div>
          
          <div class="text-center">
            <h6 class="q-mb-sm">{{ $t('auth.resetEmailSent') }}</h6>
            <p class="text-body2 text-grey-6 q-mb-md">
              {{ $t('auth.resetEmailSentInstructions', { email: email.value.value }) }}
            </p>
            
            <q-btn
              flat
              color="primary"
              :label="$t('auth.resendEmail')"
              @click="handleRequestReset"
              :loading="loading"
              :disable="resendCooldown > 0"
              class="q-mb-sm"
            />
            
            <div v-if="resendCooldown > 0" class="text-caption text-grey-6">
              {{ $t('auth.resendCooldown', { seconds: resendCooldown }) }}
            </div>
          </div>
        </div>

        <!-- Step 3: Password Update (for reset token page) -->
        <div v-else-if="step === 'update'" class="reset-update-step">
          <p class="text-body1 q-mb-md">
            {{ $t('auth.enterNewPassword') }}
          </p>

          <q-form @submit.prevent="handleUpdatePassword" novalidate>
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
            <div class="password-strength q-mb-md">
              <div class="strength-label text-caption q-mb-xs">
                {{ $t('auth.passwordStrength') }}
              </div>
              <q-linear-progress
                :value="passwordStrength.score / 4"
                :color="passwordStrength.color"
                size="8px"
                rounded
              />
              <div class="strength-text text-caption q-mt-xs" :class="`text-${passwordStrength.color}`">
                {{ passwordStrength.text }}
              </div>
            </div>

            <div class="form-actions">
              <q-btn
                type="submit"
                color="primary"
                :label="$t('auth.updatePassword')"
                :loading="loading"
                unelevated
                no-caps
                class="full-width"
                :disable="passwordStrength.score < 2"
              />
            </div>
          </q-form>
        </div>
      </q-card-section>

      <q-card-actions align="right" v-if="step === 'request'">
        <q-btn
          flat
          :label="$t('common.cancel')"
          @click="closeDialog"
        />
      </q-card-actions>

      <q-card-actions align="center" v-if="step === 'sent'">
        <q-btn
          flat
          :label="$t('auth.backToLogin')"
          @click="closeDialog"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { supabase } from 'src/boot/supabase';
import { useFormValidation } from 'src/composables/useFormValidation';

// Props & Emits
interface Props {
  modelValue: boolean;
  initialStep?: 'request' | 'sent' | 'update';
  resetToken?: string;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'password-updated'): void;
  (e: 'back-to-login'): void;
}

const props = withDefaults(defineProps<Props>(), {
  initialStep: 'request',
});

const emit = defineEmits<Emits>();

// Composables
const { t } = useI18n();
const $q = useQuasar();
const { rules, createField, validateForm } = useFormValidation();

// State
const step = ref(props.initialStep);
const loading = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const resendCooldown = ref(0);

// Form fields
const email = createField('', [rules.required, rules.email]);
const newPassword = createField('', [rules.required, rules.minLength(8)]);
const confirmPassword = createField('', [
  rules.required,
  (val: string) => val === newPassword.value.value || t('auth.passwordsDoNotMatch')
]);

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const passwordStrength = computed(() => {
  const password = newPassword.value.value;
  if (!password) return { score: 0, color: 'grey', text: '' };

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

// Watchers
watch(() => props.initialStep, (newStep) => {
  step.value = newStep;
});

// Cooldown timer
let cooldownInterval: NodeJS.Timeout | null = null;

const startResendCooldown = () => {
  resendCooldown.value = 60;
  cooldownInterval = setInterval(() => {
    resendCooldown.value--;
    if (resendCooldown.value <= 0) {
      clearInterval(cooldownInterval!);
      cooldownInterval = null;
    }
  }, 1000);
};

// Methods
const handleRequestReset = async () => {
  if (!validateForm([email])) return;

  try {
    loading.value = true;

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.value.value,
      {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      }
    );

    if (error) {
      if (error.message.includes('rate_limit')) {
        $q.notify({
          type: 'warning',
          message: t('auth.rateLimitExceeded'),
          caption: t('auth.tryAgainLater'),
        });
      } else {
        throw error;
      }
      return;
    }

    step.value = 'sent';
    startResendCooldown();

    $q.notify({
      type: 'positive',
      message: t('auth.resetEmailSent'),
      caption: t('auth.checkYourEmail'),
    });

  } catch (error: any) {
    console.error('Password reset error:', error);
    $q.notify({
      type: 'negative',
      message: t('auth.resetPasswordError'),
      caption: error.message || t('common.tryAgain'),
    });
  } finally {
    loading.value = false;
  }
};

const handleUpdatePassword = async () => {
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
    loading.value = true;

    const { error } = await supabase.auth.updateUser({
      password: newPassword.value.value,
    });

    if (error) throw error;

    $q.notify({
      type: 'positive',
      message: t('auth.passwordUpdated'),
      caption: t('auth.passwordUpdatedSuccess'),
    });

    emit('password-updated');
    closeDialog();

  } catch (error: any) {
    console.error('Password update error:', error);
    $q.notify({
      type: 'negative',
      message: t('auth.passwordUpdateError'),
      caption: error.message || t('common.tryAgain'),
    });
  } finally {
    loading.value = false;
  }
};

const closeDialog = () => {
  isOpen.value = false;
  
  if (step.value === 'sent') {
    emit('back-to-login');
  }
  
  // Reset form after a delay
  setTimeout(() => {
    step.value = 'request';
    email.value.value = '';
    newPassword.value.value = '';
    confirmPassword.value.value = '';
    email.error.value = '';
    newPassword.error.value = '';
    confirmPassword.error.value = '';
  }, 300);
};

// Cleanup
onUnmounted(() => {
  if (cooldownInterval) {
    clearInterval(cooldownInterval);
  }
});
</script>

<style lang="scss" scoped>
.password-reset-card {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
}

.password-reset-header {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-600) 100%);
  color: white;
  position: relative;

  .text-h6 {
    display: flex;
    align-items: center;
  }
}

.reset-request-step,
.reset-sent-step,
.reset-update-step {
  .form-actions {
    margin-top: var(--space-4);
  }
}

.reset-sent-step {
  text-align: center;
  
  h6 {
    margin: 0;
    color: var(--text-primary);
  }
}

.password-strength {
  .strength-label {
    color: var(--text-muted);
    font-weight: var(--font-weight-medium);
  }

  .strength-text {
    font-weight: var(--font-weight-medium);
  }
}

// Dark mode support
body.body--dark {
  .password-reset-header {
    background: linear-gradient(135deg, var(--primary-700) 0%, var(--primary-800) 100%);
  }

  .reset-sent-step h6 {
    color: var(--text-primary-dark);
  }
}

// Mobile optimizations
@media (max-width: 768px) {
  .password-reset-card {
    margin: var(--space-4);
    min-width: calc(100vw - 32px);
    max-width: calc(100vw - 32px);
  }
}
</style>