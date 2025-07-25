<template>
  <q-dialog 
    v-model="showDialog" 
    persistent 
    maximized 
    transition-show="slide-up" 
    transition-hide="slide-down"
    class="upgrade-dialog"
  >
    <BaseCard variant="premium" class="upgrade-card">
      <!-- Header -->
      <q-card-section class="upgrade-header text-center">
        <div class="celebration-icon">
          <q-icon name="celebration" size="4rem" color="primary" />
        </div>
        <h2 class="upgrade-title">{{ $t('upgrade.welcomeToTeam') }}</h2>
        <p class="upgrade-subtitle">
          {{ $t('upgrade.subtitle', { role: invite.target_role, practice: practice.name }) }}
        </p>
        <div class="upgrade-benefits">
          <div class="benefit">
            <q-icon name="check_circle" color="positive" />
            <span>{{ $t('upgrade.benefit1') }}</span>
          </div>
          <div class="benefit">
            <q-icon name="check_circle" color="positive" />
            <span>{{ $t('upgrade.benefit2') }}</span>
          </div>
          <div class="benefit">
            <q-icon name="check_circle" color="positive" />
            <span>{{ $t('upgrade.benefit3') }}</span>
          </div>
        </div>
      </q-card-section>

      <!-- Options -->
      <q-card-section class="upgrade-options">
        <div class="options-grid">
          <!-- Option 1: Personal Magic Code -->
          <BaseCard 
            variant="gradient"
            class="option-card magic-code-option"
            :class="{ 'selected': selectedOption === 'magic_code' }"
            @click="selectOption('magic_code')"
            style="cursor: pointer;"
          >
            <q-card-section class="text-center">
              <div class="option-icon">
                <q-icon name="auto_awesome" size="3rem" color="primary" />
              </div>
              <h3 class="option-title">{{ $t('upgrade.magicCodeTitle') }}</h3>
              <p class="option-description">{{ $t('upgrade.magicCodeDescription') }}</p>
              
              <!-- Preview -->
              <div class="code-preview">
                <div class="preview-label">{{ $t('upgrade.yourPersonalCode') }}</div>
                <div class="preview-code">{{ previewMagicCode }}</div>
              </div>
              
              <!-- Benefits -->
              <div class="option-benefits">
                <div class="mini-benefit">
                  <q-icon name="flash_on" size="sm" color="orange" />
                  <span>{{ $t('upgrade.magicBenefit1') }}</span>
                </div>
                <div class="mini-benefit">
                  <q-icon name="memory" size="sm" color="blue" />
                  <span>{{ $t('upgrade.magicBenefit2') }}</span>
                </div>
                <div class="mini-benefit">
                  <q-icon name="devices" size="sm" color="green" />
                  <span>{{ $t('upgrade.magicBenefit3') }}</span>
                </div>
              </div>
            </q-card-section>
            <q-card-section class="option-footer">
              <q-btn 
                :label="$t('upgrade.chooseThis')"
                color="primary"
                unelevated
                class="full-width"
                :class="{ 'selected-btn': selectedOption === 'magic_code' }"
              />
            </BaseCard>

          <!-- Option 2: Email + Password -->
          <BaseCard 
            variant="gradient"
            class="option-card email-option"
            :class="{ 'selected': selectedOption === 'email_password' }"
            @click="selectOption('email_password')"
            style="cursor: pointer;"
          >
            <q-card-section class="text-center">
              <div class="option-icon">
                <q-icon name="email" size="3rem" color="secondary" />
              </div>
              <h3 class="option-title">{{ $t('upgrade.emailTitle') }}</h3>
              <p class="option-description">{{ $t('upgrade.emailDescription') }}</p>
              
              <!-- Form Preview -->
              <div class="form-preview" v-if="selectedOption === 'email_password'">
                <q-input
                  v-model="emailForm.email"
                  :label="$t('upgrade.yourEmail')"
                  outlined
                  dense
                  class="q-mb-sm"
                />
                <q-input
                  v-model="emailForm.password"
                  :label="$t('upgrade.choosePassword')"
                  type="password"
                  outlined
                  dense
                />
              </div>
              
              <!-- Benefits -->
              <div class="option-benefits">
                <div class="mini-benefit">
                  <q-icon name="security" size="sm" color="green" />
                  <span>{{ $t('upgrade.emailBenefit1') }}</span>
                </div>
                <div class="mini-benefit">
                  <q-icon name="familiar" size="sm" color="blue" />
                  <span>{{ $t('upgrade.emailBenefit2') }}</span>
                </div>
                <div class="mini-benefit">
                  <q-icon name="sync" size="sm" color="purple" />
                  <span>{{ $t('upgrade.emailBenefit3') }}</span>
                </div>
              </div>
            </q-card-section>
            <q-card-section class="option-footer">
              <q-btn 
                :label="$t('upgrade.chooseThis')"
                color="secondary"
                unelevated
                class="full-width"
                :class="{ 'selected-btn': selectedOption === 'email_password' }"
              />
            </BaseCard>

          <!-- Option 3: Device Remember -->
          <BaseCard 
            variant="gradient"
            class="option-card device-option"
            :class="{ 'selected': selectedOption === 'device_remember' }"
            @click="selectOption('device_remember')"
            style="cursor: pointer;"
          >
            <q-card-section class="text-center">
              <div class="option-icon">
                <q-icon name="devices" size="3rem" color="accent" />
              </div>
              <h3 class="option-title">{{ $t('upgrade.deviceTitle') }}</h3>
              <p class="option-description">{{ $t('upgrade.deviceDescription') }}</p>
              
              <!-- Device Info -->
              <div class="device-info">
                <div class="device-name">{{ deviceInfo.name }}</div>
                <div class="device-type">{{ deviceInfo.type }}</div>
              </div>
              
              <!-- Benefits -->
              <div class="option-benefits">
                <div class="mini-benefit">
                  <q-icon name="bolt" size="sm" color="orange" />
                  <span>{{ $t('upgrade.deviceBenefit1') }}</span>
                </div>
                <div class="mini-benefit">
                  <q-icon name="lock" size="sm" color="green" />
                  <span>{{ $t('upgrade.deviceBenefit2') }}</span>
                </div>
                <div class="mini-benefit">
                  <q-icon name="refresh" size="sm" color="blue" />
                  <span>{{ $t('upgrade.deviceBenefit3') }}</span>
                </div>
              </div>
            </q-card-section>
            <q-card-section class="option-footer">
              <q-btn 
                :label="$t('upgrade.chooseThis')"
                color="accent"
                unelevated
                class="full-width"
                :class="{ 'selected-btn': selectedOption === 'device_remember' }"
              />
            </BaseCard>
        </div>
      </q-card-section>

      <!-- Name Input (Always Required) -->
      <q-card-section class="name-section">
        <div class="name-input-container">
          <q-input
            v-model="userName"
            :label="$t('upgrade.yourFullName')"
            outlined
            size="lg"
            class="name-input"
            :rules="[val => !!val || $t('upgrade.nameRequired')]"
          >
            <template v-slot:prepend>
              <q-icon name="person" />
            </template>
          </q-input>
        </div>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions class="upgrade-actions">
        <div class="actions-container">
          <q-btn
            :label="$t('upgrade.createAccount')"
            color="primary"
            size="lg"
            unelevated
            :loading="creating"
            :disable="!canCreate"
            @click="createPermanentAccount"
            class="create-btn"
          />
          <q-btn
            :label="$t('upgrade.stayGuest')"
            flat
            color="grey-7"
            @click="continueAsGuest"
            class="guest-btn"
          />
        </div>
      </q-card-actions>
    </BaseCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import BaseCard from 'src/components/base/BaseCard.vue';

// Props & Emits
interface Props {
  modelValue: boolean;
  invite: any;
  practice: any;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'upgrade-completed': [result: any];
  'continue-as-guest': [];
}>();

// Composables
const { t } = useI18n();
const $q = useQuasar();

// State
const showDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const selectedOption = ref('magic_code'); // Default to magic code
const userName = ref('');
const creating = ref(false);

// Email form data
const emailForm = ref({
  email: '',
  password: ''
});

// Device info
const deviceInfo = ref({
  name: 'This device',
  type: 'Unknown'
});

// Computed
const previewMagicCode = computed(() => {
  if (!userName.value) return '🏥JOUW-NAAM2024';
  const cleanName = userName.value.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '');
  return `🏥${cleanName}2024`;
});

const canCreate = computed(() => {
  if (!userName.value) return false;
  
  if (selectedOption.value === 'email_password') {
    return emailForm.value.email && emailForm.value.password.length >= 6;
  }
  
  return true;
});

// Methods
const selectOption = (option: string) => {
  selectedOption.value = option;
};

const createPermanentAccount = async () => {
  creating.value = true;
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const accountData = {
      name: userName.value,
      method: selectedOption.value,
      personalCode: selectedOption.value === 'magic_code' ? previewMagicCode.value : null,
      email: selectedOption.value === 'email_password' ? emailForm.value.email : null
    };
    
    emit('upgrade-completed', accountData);
    showDialog.value = false;
    
    $q.notify({
      type: 'positive',
      message: t('upgrade.accountCreated'),
      position: 'top-right',
      timeout: 5000
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('upgrade.createError'),
      position: 'top-right'
    });
  } finally {
    creating.value = false;
  }
};

const continueAsGuest = () => {
  emit('continue-as-guest');
  showDialog.value = false;
};

const detectDevice = () => {
  const userAgent = navigator.userAgent;
  let deviceName = 'Deze browser';
  let deviceType = 'Desktop';
  
  if (/iPhone|iPad|iPod/.test(userAgent)) {
    deviceType = 'iOS';
    deviceName = /iPad/.test(userAgent) ? 'iPad' : 'iPhone';
  } else if (/Android/.test(userAgent)) {
    deviceType = 'Android';
    deviceName = 'Android apparaat';
  } else if (/Mac/.test(userAgent)) {
    deviceName = 'Mac';
  } else if (/Windows/.test(userAgent)) {
    deviceName = 'Windows PC';
  }
  
  deviceInfo.value = { name: deviceName, type: deviceType };
};

onMounted(() => {
  detectDevice();
});
</script>

<style scoped lang="scss">
.upgrade-dialog {
  .upgrade-card {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    
    .upgrade-header {
      background: linear-gradient(135deg, #1976D2, #42A5F5);
      color: white;
      padding: 3rem 2rem;
      
      .celebration-icon {
        margin-bottom: 1rem;
      }
      
      .upgrade-title {
        margin: 0 0 1rem;
        font-size: 2.5rem;
        font-weight: 700;
      }
      
      .upgrade-subtitle {
        font-size: 1.2rem;
        margin: 0 0 2rem;
        opacity: 0.9;
      }
      
      .upgrade-benefits {
        display: flex;
        justify-content: center;
        gap: 2rem;
        flex-wrap: wrap;
        
        .benefit {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
        }
      }
    }
    
    .upgrade-options {
      padding: 3rem 2rem;
      
      .options-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 2rem;
        max-width: 1000px;
        margin: 0 auto;
        
        .option-card {
          border: 2px solid transparent;
          transition: all 0.3s ease;
          cursor: pointer;
          min-height: 400px;
          display: flex;
          flex-direction: column;
          
          &:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
          }
          
          &.selected {
            border-color: #1976D2;
            transform: translateY(-4px);
            box-shadow: 0 8px 25px rgba(25, 118, 210, 0.3);
          }
          
          .option-icon {
            margin-bottom: 1rem;
          }
          
          .option-title {
            margin: 0 0 1rem;
            color: #1976D2;
            font-size: 1.3rem;
          }
          
          .option-description {
            color: #666;
            margin: 0 0 1.5rem;
            line-height: 1.5;
          }
          
          .code-preview {
            background: #f5f5f5;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1.5rem;
            
            .preview-label {
              font-size: 0.9rem;
              color: #666;
              margin-bottom: 0.5rem;
            }
            
            .preview-code {
              font-size: 1.5rem;
              font-weight: 600;
              color: #1976D2;
              font-family: monospace;
            }
          }
          
          .form-preview {
            margin-bottom: 1.5rem;
          }
          
          .device-info {
            background: #f5f5f5;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1.5rem;
            
            .device-name {
              font-weight: 600;
              color: #1976D2;
            }
            
            .device-type {
              font-size: 0.9rem;
              color: #666;
            }
          }
          
          .option-benefits {
            .mini-benefit {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              margin-bottom: 0.5rem;
              font-size: 0.9rem;
              color: #666;
            }
          }
          
          .option-footer {
            margin-top: auto;
            
            .selected-btn {
              background: #1976D2 !important;
              color: white !important;
            }
          }
        }
      }
    }
    
    .name-section {
      background: #f8f9fa;
      padding: 2rem;
      
      .name-input-container {
        max-width: 400px;
        margin: 0 auto;
        
        .name-input {
          :deep(.q-field__control) {
            height: 60px;
            font-size: 1.1rem;
          }
        }
      }
    }
    
    .upgrade-actions {
      padding: 2rem;
      background: white;
      
      .actions-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-width: 400px;
        margin: 0 auto;
        
        .create-btn {
          height: 60px;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 12px;
        }
        
        .guest-btn {
          padding: 1rem;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .upgrade-dialog {
    .upgrade-card {
      .upgrade-header {
        padding: 2rem 1rem;
        
        .upgrade-title {
          font-size: 2rem;
        }
        
        .upgrade-benefits {
          flex-direction: column;
          gap: 1rem;
        }
      }
      
      .upgrade-options {
        padding: 2rem 1rem;
        
        .options-grid {
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
      }
    }
  }
}
</style> 