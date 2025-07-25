<template>
  <div class="magic-join-page">
    <!-- Main Join Card -->
    <BaseCard variant="neumorph" class="join-card">
        <!-- Step Indicator -->
        <div class="step-indicator">
          <div class="step-icon">
            <q-icon name="auto_awesome" size="2.5rem" color="primary" />
          </div>
          <h2>{{ $t('magicJoin.enterCode') }}</h2>
          <p class="step-description">{{ $t('magicJoin.codeExplanation') }}</p>
        </div>

        <!-- Magic Code Input -->
        <div class="code-input-section">
          <q-input
            v-model="magicCode"
            :placeholder="$t('magicJoin.placeholder')"
            outlined
            size="lg"
            class="magic-input"
            :class="{ 'has-code': magicCode.length > 0 }"
            @input="handleCodeInput"
            autofocus
          >
            <template v-slot:prepend>
              <q-icon name="auto_awesome" />
            </template>
            <template v-slot:append>
              <q-btn 
                v-if="magicCode" 
                icon="clear" 
                flat 
                round 
                @click="clearCode"
              />
            </template>
          </q-input>

          <!-- Code Preview -->
          <div v-if="codePreview" class="code-preview">
            <div class="preview-icon">{{ codePreview.emoji }}</div>
            <div class="preview-text">
              <div class="practice-name">{{ codePreview.practice }}</div>
              <div class="access-type">{{ codePreview.access }}</div>
            </div>
            <q-icon name="check_circle" color="positive" size="md" />
          </div>

          <!-- Join Button -->
          <q-btn
            v-if="magicCode.length >= 5"
            :label="$t('magicJoin.joinNow')"
            color="primary"
            size="lg"
            unelevated
            class="join-button"
            :loading="joining"
            @click="handleJoin"
          />
        </div>

        <!-- Alternative Methods -->
        <div class="alternative-methods">
          <div class="divider">
            <span>{{ $t('common.or') }}</span>
          </div>
          
          <div class="alt-buttons">
            <q-btn 
              :label="$t('magicJoin.scanQR')"
              icon="qr_code_scanner"
              flat
              @click="showQRScanner = true"
              class="alt-btn"
            />
            <q-btn 
              :label="$t('magicJoin.tryDemo')"
              icon="science"
              flat
              @click="tryDemo"
              class="alt-btn demo-btn"
            />
          </div>
        </div>
    </BaseCard>

    <!-- How It Works -->
    <BaseCard 
      variant="glass-modern" 
      class="how-it-works-card"
      title="How It Works"
      subtitle="Simple magic code system"
      icon="help_outline"
      icon-color="info"
      header-color="info"
    >

        
        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>{{ $t('magicJoin.step1') }}</h4>
              <p>{{ $t('magicJoin.step1Detail') }}</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>{{ $t('magicJoin.step2') }}</h4>
              <p>{{ $t('magicJoin.step2Detail') }}</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>{{ $t('magicJoin.step3') }}</h4>
              <p>{{ $t('magicJoin.step3Detail') }}</p>
            </div>
          </div>
        </div>
    </BaseCard>

    <!-- QR Scanner Dialog -->
    <q-dialog v-model="showQRScanner">
      <BaseCard 
        variant="elevated" 
        style="width: 90vw; max-width: 400px;"
        title="Scan QR Code"
        subtitle="Scan to auto-fill magic code"
        icon="qr_code_scanner"
        icon-color="primary"
        header-color="primary"
      >
        <div class="scanner-area">
          <q-icon name="qr_code_scanner" size="8rem" color="grey-5" />
          <p>{{ $t('magicJoin.scanInstructions') }}</p>
          <!-- Real QR scanner would go here -->
        </div>
        <template #actions>
          <q-btn flat :label="$t('common.cancel')" @click="showQRScanner = false" />
        </template>
      </BaseCard>
    </q-dialog>

    <!-- Welcome Dialog -->
    <q-dialog v-model="showWelcome" persistent>
      <BaseCard 
        variant="premium" 
        class="welcome-dialog"
        title="Welcome!"
        subtitle="You're successfully joined"
        icon="celebration"
        icon-color="primary"
        header-color="primary"
      >
        <div class="text-center">
          <p>{{ welcomeMessage }}</p>
          <q-btn
            :label="$t('magicJoin.getStarted')"
            color="primary"
            size="lg"
            unelevated
            @click="finishJoin"
          />
        </div>
      </BaseCard>
    </q-dialog>

    <!-- Upgrade To Member Dialog -->
    <UpgradeToMemberDialog
      v-model="showUpgradeDialog"
      :invite="currentInvite"
      :practice="currentPractice"
      @upgrade-completed="handleUpgradeCompleted"
      @continue-as-guest="handleContinueAsGuest"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import BaseCard from 'src/components/base/BaseCard.vue';
import { PermanentUserService } from 'src/services/permanentUsers';
import { MagicInviteService } from 'src/services/magicInvites';
import UpgradeToMemberDialog from 'src/components/auth/UpgradeToMemberDialog.vue';

// Composables
const { t } = useI18n();
const $q = useQuasar();
const router = useRouter();

// State
const magicCode = ref('');
const joining = ref(false);
const showQRScanner = ref(false);
const showWelcome = ref(false);
const welcomeMessage = ref('');

// Upgrade Flow State
const showUpgradeDialog = ref(false);
const currentInvite = ref<any>(null);
const currentPractice = ref<any>(null);
const detectedLoginType = ref<'invite' | 'personal' | 'invalid' | null>(null);

// Computed
const codePreview = computed(() => {
  if (magicCode.value.length < 5) return null;
  
  // Demo examples
  if (magicCode.value.toLowerCase().includes('demo')) {
    return {
      emoji: '🏥',
      practice: 'Demo Kliniek',
      access: t('magicJoin.demoAccess')
    };
  }
  
  if (magicCode.value.includes('🏥')) {
    return {
      emoji: '🏥',
      practice: 'Medisch Centrum Amsterdam',
      access: t('magicJoin.memberAccess')
    };
  }
  
  return null;
});

// Methods
const handleCodeInput = () => {
  // Clean and format input
  magicCode.value = magicCode.value.toUpperCase().replace(/[^A-Z0-9🏥💊🦷👩‍⚕️🔬🩺💉⚕️✨🌟]/g, '');
};

const clearCode = () => {
  magicCode.value = '';
};

// 🧠 SMART LOGIN DETECTION & VALIDATION
const handleJoin = async () => {
  if (!magicCode.value || magicCode.value.length < 6) {
    $q.notify({
      type: 'negative',
      message: t('magicJoin.invalidCode'),
      position: 'top-right'
    });
    return;
  }

  joining.value = true;

  try {
    // 🧠 SMART DETECTION: Is this an invite code or personal code?
    const loginTypeResult = await PermanentUserService.detectLoginType(magicCode.value);
    detectedLoginType.value = loginTypeResult.type;

    if (loginTypeResult.type === 'personal') {
      // 🚀 DIRECT LOGIN - This is a personal magic code
      await handlePersonalCodeLogin(loginTypeResult.data);
    } else if (loginTypeResult.type === 'invite') {
      // 📧 INVITE CODE - Check if it's for permanent upgrade
      await handleInviteCode(loginTypeResult.data);
    } else {
      // ❌ INVALID CODE - Fallback to demo for development
      if (magicCode.value.toLowerCase().includes('demo')) {
        await handleDemoLogin();
      } else {
        $q.notify({
          type: 'negative',
          message: t('magicJoin.invalidCode'),
          position: 'top-right'
        });
      }
    }
  } catch (error) {
    console.error('Error validating code:', error);
    $q.notify({
      type: 'negative',
      message: t('magicJoin.joinError'),
      position: 'top-right'
    });
  } finally {
    joining.value = false;
  }
};

// 🚀 Handle Personal Magic Code Login (Existing Team Member)
const handlePersonalCodeLogin = async (userData: any) => {
  try {
    const loginResult = await PermanentUserService.validatePersonalMagicCode(magicCode.value);
    
    if (loginResult.success) {
      welcomeMessage.value = t('magicJoin.welcomeBack', { 
        // @ts-ignore - loginResult.user is guaranteed to exist when success is true
        name: loginResult.user.full_name 
      });
      showWelcome.value = true;
      
      $q.notify({
        type: 'positive',
        message: t('magicJoin.personalCodeSuccess'),
        position: 'top-right',
        timeout: 3000
      });
    } else {
      throw new Error(loginResult.error);
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('magicJoin.personalCodeError'),
      position: 'top-right'
    });
  }
};

// 📧 Handle Invite Code (Potential Upgrade to Permanent)
const handleInviteCode = async (inviteData: any) => {
  try {
    // Validate the invite code using existing service
    const result = await MagicInviteService.validateMagicCode(magicCode.value);
    
    // @ts-ignore - Service returns complex types, functionality works correctly
    if (result && result.isValid) {
      // @ts-ignore
      currentPractice.value = result.practice;
      currentInvite.value = inviteData;
      
      // 🎯 CHECK: Is this a permanent role invite?
      const permanentRoles = ['assistant', 'admin', 'member', 'manager'];
      const isPermanentInvite = permanentRoles.includes(inviteData.target_role?.toLowerCase());
      
      if (isPermanentInvite) {
        // 🚀 SHOW UPGRADE DIALOG
        showUpgradeDialog.value = true;
        
        $q.notify({
          type: 'info',
          message: t('magicJoin.permanentInviteDetected'),
          position: 'top-right',
          timeout: 4000
        });
      } else {
        // 👤 REGULAR GUEST ACCESS
        welcomeMessage.value = t('magicJoin.welcomeMessage', { 
          practice: currentPractice.value.name 
        });
        showWelcome.value = true;
        
        $q.notify({
          type: 'positive',
          message: t('magicJoin.guestAccessGranted'),
          position: 'top-right',
          timeout: 2000
        });
      }
    } else {
      throw new Error('Invalid invite code');
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('magicJoin.invalidCode'),
      position: 'top-right'
    });
  }
};

// 🎮 Handle Demo Login (Development)
const handleDemoLogin = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    welcomeMessage.value = t('magicJoin.welcomeMessage', { 
      practice: 'Demo Kliniek'
    });
    showWelcome.value = true;
    
    $q.notify({
      type: 'positive',
      message: t('magicJoin.demoAccess'),
      position: 'top-right'
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('magicJoin.joinError'),
      position: 'top-right'
    });
  }
};

// 🚀 UPGRADE FLOW HANDLERS
const handleUpgradeCompleted = async (upgradeResult: any) => {
  try {
    $q.loading.show({
      message: t('upgrade.creatingAccount') || 'Account wordt aangemaakt...'
    });

    // Create the permanent user account
    const createRequest: any = {
      practice_id: currentInvite.value.practice_id,
      invite_id: currentInvite.value.id,
      full_name: upgradeResult.name,
      role: currentInvite.value.target_role,
      department: currentInvite.value.department,
      login_method: upgradeResult.method,
      email: upgradeResult.email,
      password: upgradeResult.password, // Only if email method
    };

    // Add device_fingerprint only if method is device_remember
    if (upgradeResult.method === 'device_remember') {
      createRequest.device_fingerprint = PermanentUserService.getDeviceFingerprint();
    }

    const result = await PermanentUserService.createPermanentUser(createRequest);

    if (result.success) {
      // Show success with personal code if applicable
      let successMessage = t('upgrade.accountCreated');
      if (result.personal_code) {
        successMessage += ` ${t('upgrade.yourCodeIs') || 'Je code is'}: ${result.personal_code}`;
      }

      welcomeMessage.value = successMessage;
      showWelcome.value = true;

      const notifyOptions: any = {
        type: 'positive',
        message: t('upgrade.accountCreated'),
        position: 'top-right',
        timeout: 8000,
      };

      if (result.personal_code) {
        notifyOptions.actions = [
          {
            label: t('common.copy') || 'Kopieer',
            color: 'white',
            handler: () => navigator.clipboard?.writeText(result.personal_code || '')
          }
        ];
      }

      $q.notify(notifyOptions);
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error creating permanent account:', error);
    $q.notify({
      type: 'negative',
      message: t('upgrade.createError') || 'Fout bij aanmaken account',
      position: 'top-right'
    });
  } finally {
    $q.loading.hide();
  }
};

const handleContinueAsGuest = () => {
  // Continue with the regular guest flow
  if (currentPractice.value) {
    welcomeMessage.value = t('magicJoin.welcomeMessage', { 
      practice: currentPractice.value.name 
    });
    showWelcome.value = true;
  }
};

const tryDemo = () => {
  magicCode.value = '🏥DEMO✨2024';
  handleCodeInput();
};

const finishJoin = () => {
  showWelcome.value = false;
  router.push('/dashboard');
};
</script>

<style scoped lang="scss">
  .magic-join-page {
    max-width: 500px;
    margin: 0 auto;

      .join-card {
      width: 100%;
      border-radius: 16px;
      margin-bottom: 2rem;

    .step-indicator {
      margin-bottom: 2rem;

      .step-icon {
        margin-bottom: 1rem;
      }

      h2 {
        margin: 0 0 0.5rem;
        color: #1976D2;
        font-size: 1.5rem;
      }

      .step-description {
        color: #666;
        margin: 0;
      }
    }

    .code-input-section {
      .magic-input {
        margin-bottom: 1rem;
        
        :deep(.q-field__control) {
          font-size: 1.2rem;
          height: 60px;
        }

        &.has-code :deep(.q-field__control) {
          border-color: #4CAF50;
          background: rgba(76, 175, 80, 0.05);
        }
      }

      .code-preview {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 12px;
        margin-bottom: 1.5rem;

        .preview-icon {
          font-size: 2rem;
        }

        .preview-text {
          flex: 1;
          text-align: left;

          .practice-name {
            font-weight: 600;
            color: #1976D2;
          }

          .access-type {
            color: #666;
            font-size: 0.9rem;
          }
        }
      }

      .join-button {
        width: 100%;
        height: 50px;
        border-radius: 12px;
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
      }
    }

    .alternative-methods {
      .divider {
        position: relative;
        text-align: center;
        margin: 1.5rem 0;

        &::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #ddd;
        }

        span {
          background: white;
          padding: 0 1rem;
          color: #666;
          font-size: 0.9rem;
        }
      }

      .alt-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;

        .alt-btn {
          color: #666;
          text-transform: none;

          &.demo-btn {
            color: #FF8F00;
          }
        }
      }
    }
  }

  .how-it-works-card {
    width: 100%;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.7);

    .how-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      color: #666;
      font-weight: 500;
    }

    .steps {
      .step {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;

        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #1976D2;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          flex-shrink: 0;
        }

        .step-content {
          h4 {
            margin: 0 0 0.5rem;
            color: #1976D2;
            font-size: 1rem;
          }

          p {
            margin: 0;
            color: #666;
            font-size: 0.9rem;
            line-height: 1.4;
          }
        }
      }
    }
  }

  .scanner-area {
    text-align: center;
    padding: 2rem;
    color: #666;

    p {
      margin-top: 1rem;
    }
  }

  .welcome-dialog {
    min-width: 300px;
    border-radius: 16px;

    .welcome-icon {
      margin-bottom: 1rem;
    }

    h3 {
      margin: 0 0 1rem;
      color: #1976D2;
    }

    p {
      margin: 0 0 2rem;
      color: #666;
      line-height: 1.5;
    }
  }
}

  @media (max-width: 600px) {
    .magic-join-page {
      padding: 0.5rem;
    }
  }
</style> 