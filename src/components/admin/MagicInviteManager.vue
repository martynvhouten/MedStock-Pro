<template>
  <div class="magic-invite-manager">
    <!-- Simple Header -->
    <div class="header-section">
      <h3 class="section-title">
        <q-icon name="auto_awesome" class="q-mr-sm" />
        {{ $t('magicInvite.simpleTitle') }}
      </h3>
      <p class="section-description">{{ $t('magicInvite.simpleDescription') }}</p>
    </div>

    <!-- How it Works -->
    <BaseCard 
      variant="premium" 
      class="how-it-works-card q-mb-lg"
      title="How it Works"
      subtitle="Simple 3-step process"
      icon="auto_awesome"
      icon-color="secondary"
      header-color="secondary"
    >

        <div class="steps-grid">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <div class="step-title">{{ $t('magicInvite.stepCreate') }}</div>
              <div class="step-description">{{ $t('magicInvite.stepCreateDetail') }}</div>
            </div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <div class="step-title">{{ $t('magicInvite.stepShare') }}</div>
              <div class="step-description">{{ $t('magicInvite.stepShareDetail') }}</div>
            </div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <div class="step-title">{{ $t('magicInvite.stepJoin') }}</div>
              <div class="step-description">{{ $t('magicInvite.stepJoinDetail') }}</div>
            </div>
          </div>
        </div>
    </BaseCard>

    <!-- Quick Invite -->
    <BaseCard 
      variant="gradient"
      class="invite-card q-mb-lg"
      title="Create Magic Invite"
      subtitle="Generate secure invite links"
      icon="link"
      icon-color="primary"
      header-color="primary"
    >

        
        <div class="invite-form">
          <div class="row q-gutter-md">
            <div class="col-md-6 col-12">
              <q-select
                v-model="newInvite.role"
                :options="roleOptions"
                :label="$t('magicInvite.whoAreYouInviting')"
                outlined
                emit-value
                map-options
              />
            </div>
            <div class="col-md-6 col-12">
              <q-input
                v-model="newInvite.department"
                :label="$t('magicInvite.department')"
                :placeholder="$t('magicInvite.departmentPlaceholder')"
                outlined
              />
            </div>
          </div>

          <div class="generate-section q-mt-lg">
            <q-btn
              :label="$t('magicInvite.generateInviteCode')"
              color="primary"
              size="lg"
              icon="auto_awesome"
              unelevated
              @click="generateInvite"
              :loading="generating"
              class="generate-btn"
            />
          </div>
        </div>
    </BaseCard>

    <!-- Generated Invite -->
    <BaseCard 
      v-if="generatedInvite" 
      variant="glass-modern"
      class="generated-invite-card q-mb-lg"
      title="Invite Ready!"
      subtitle="Share this magic code"
      icon="check_circle"
      icon-color="positive"
      header-color="positive"
    >

        
        <div class="invite-display">
          <!-- The Magic Code -->
          <div class="magic-code-display">
            <div class="code-label">{{ $t('magicInvite.shareThisCode') }}</div>
            <div class="magic-code">{{ generatedInvite.magic_code }}</div>
            <q-btn 
              icon="content_copy" 
              flat 
              round 
              @click="copyCode"
              :tooltip="$t('common.copy')"
            />
          </div>

          <!-- Share Instructions -->
          <div class="share-instructions">
            <div class="instruction-title">{{ $t('magicInvite.tellThem') }}</div>
            <div class="instruction-text">
              "{{ $t('magicInvite.shareMessage', { code: generatedInvite.magic_code }) }}"
            </div>
          </div>

          <!-- Share Buttons -->
          <div class="share-buttons">
            <q-btn
              :label="$t('magicInvite.shareWhatsApp')"
              color="positive"
              icon="message"
              @click="shareViaWhatsApp"
              unelevated
            />
            <q-btn
              :label="$t('magicInvite.showQR')"
              color="primary"
              icon="qr_code"
              @click="showQRCode"
              unelevated
            />
            <q-btn
              :label="$t('magicInvite.shareEmail')"
              color="secondary"
              icon="email"
              @click="shareViaEmail"
              unelevated
            />
          </div>
        </div>
    </BaseCard>

    <!-- Active Invites (Simplified) -->
    <BaseCard 
      v-if="activeInvites.length > 0" 
      variant="neumorph"
      class="active-invites-card"
      title="Active Invites"
      subtitle="Manage pending invitations"
      icon="group_add"
      icon-color="info"
      header-color="info"
    >
        <template #header-actions>
          <q-chip :label="activeInvites.length" color="primary" />
        </template>
        
        <div class="invites-list">
          <div v-for="invite in activeInvites" :key="invite.id" class="invite-item">
            <div class="invite-info">
              <div class="invite-code">{{ invite.magic_code }}</div>
              <div class="invite-details">
                {{ invite.department || invite.target_role }} • 
                {{ $t('magicInvite.created') }} {{ formatDate(invite.created_at) }}
              </div>
            </div>
            <div class="invite-actions">
              <q-btn 
                icon="share" 
                flat 
                round 
                @click="shareInvite(invite)"
                :tooltip="$t('common.share')"
              />
              <q-btn 
                icon="delete" 
                flat 
                round 
                color="negative"
                @click="deleteInvite(invite)"
                :tooltip="$t('common.delete')"
              />
            </div>
          </div>
        </div>
    </BaseCard>

    <!-- QR Code Dialog -->
    <q-dialog v-model="showQRDialog">
      <q-card style="width: 300px;">
        <q-card-section class="text-center">
          <div class="text-h6 q-mb-md">{{ $t('magicInvite.qrCode') }}</div>
          <div class="qr-code-container">
            <q-img 
              :src="qrCodeUrl" 
              width="200px" 
              height="200px"
              class="qr-image"
            />
          </div>
          <div class="qr-instructions q-mt-md">
            {{ $t('magicInvite.qrInstructions') }}
          </div>
        </q-card-section>
        <q-card-actions align="center">
          <q-btn flat :label="$t('common.close')" @click="showQRDialog = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth';
import BaseCard from 'src/components/base/BaseCard.vue';

// Types
interface MagicInvite {
  id: string;
  magic_code: string;
  target_role: string;
  department: string;
  created_at: string;
}

// Composables
const { t } = useI18n();
const $q = useQuasar();
const authStore = useAuthStore();

// State
const generating = ref(false);
const showQRDialog = ref(false);
const activeInvites = ref<MagicInvite[]>([]);
const generatedInvite = ref<MagicInvite | null>(null);

// Form
const newInvite = ref({
  role: 'member',
  department: ''
});

// Options
const roleOptions = [
  { label: t('magicInvite.doctorNurse'), value: 'member' },
  { label: t('magicInvite.assistant'), value: 'assistant' },
  { label: t('magicInvite.admin'), value: 'admin' },
  { label: t('magicInvite.temporary'), value: 'guest' }
];

// Computed
const qrCodeUrl = computed(() => {
  if (!generatedInvite.value) return '';
  const joinUrl = `${window.location.origin}/join/${generatedInvite.value.magic_code}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinUrl)}`;
});

// Methods
const generateInvite = async () => {
  generating.value = true;
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate a simple, readable code
    const practice = authStore.selectedPractice?.name || 'KLINIEK';
    const cleanPractice = practice.replace(/[^A-Z]/gi, '').toUpperCase().substring(0, 8);
    const year = new Date().getFullYear();
    const emoji = newInvite.value.role === 'member' ? '🏥' : 
                  newInvite.value.role === 'admin' ? '👩‍⚕️' : '💊';
    
    generatedInvite.value = {
      id: Date.now().toString(),
      magic_code: `${emoji}${cleanPractice}✨${year}`,
      target_role: newInvite.value.role,
      department: newInvite.value.department,
      created_at: new Date().toISOString()
    };

    // Add to active invites
    activeInvites.value.unshift({ ...generatedInvite.value });

    $q.notify({
      type: 'positive',
      message: t('magicInvite.inviteCreated'),
      position: 'top-right'
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('magicInvite.createError'),
      position: 'top-right'
    });
  } finally {
    generating.value = false;
  }
};

const copyCode = () => {
  if (!generatedInvite.value) {
    return;
  }
  navigator.clipboard.writeText(generatedInvite.value.magic_code);
  $q.notify({
    type: 'positive',
    message: t('magicInvite.codeCopied'),
    position: 'top-right'
  });
};

const shareViaWhatsApp = () => {
  if (!generatedInvite.value) {
    return;
  }
  const code = generatedInvite.value.magic_code;
  const message = t('magicInvite.whatsappMessage', { 
    code,
    url: `${window.location.origin}/join`
  });
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};

const shareViaEmail = () => {
  if (!generatedInvite.value) {
    return;
  }
  const code = generatedInvite.value.magic_code;
  const subject = t('magicInvite.emailSubject');
  const body = t('magicInvite.emailMessage', { 
    code,
    url: `${window.location.origin}/join`
  });
  
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoUrl);
};

const showQRCode = () => {
  showQRDialog.value = true;
};

const shareInvite = (invite: MagicInvite) => {
  generatedInvite.value = invite;
  shareViaWhatsApp();
};

const deleteInvite = (invite: MagicInvite) => {
  $q.dialog({
    title: t('magicInvite.deleteInvite'),
    message: t('magicInvite.deleteConfirm', { code: invite.magic_code }),
    cancel: true,
    persistent: true
  }).onOk(() => {
    activeInvites.value = activeInvites.value.filter((i: MagicInvite) => i.id !== invite.id);
    $q.notify({
      type: 'positive',
      message: t('magicInvite.inviteDeleted')
    });
  });
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

onMounted(() => {
  // Load existing invites
  // This would normally be an API call
});
</script>

<style scoped lang="scss">
.magic-invite-manager {
  .header-section {
    text-align: center;
    margin-bottom: 2rem;

    .section-title {
      margin: 0 0 0.5rem;
      color: #1976D2;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .section-description {
      color: #666;
      margin: 0;
      font-size: 1.1rem;
    }
  }

  .how-it-works-card {
    border-radius: 12px;
    
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;

      .step {
        text-align: center;
        
        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #1976D2;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1.2rem;
          margin: 0 auto 1rem;
        }

        .step-title {
          font-weight: 600;
          color: #1976D2;
          margin-bottom: 0.5rem;
        }

        .step-description {
          color: #666;
          font-size: 0.9rem;
          line-height: 1.4;
        }
      }
    }
  }

  .invite-card {
    border-radius: 12px;

    .invite-form {
      .generate-section {
        text-align: center;
        
        .generate-btn {
          padding: 1rem 2rem;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 12px;
        }
      }
    }
  }

  .generated-invite-card {
    border-radius: 12px;
    border: 2px solid #4CAF50;
    
    .invite-display {
      .magic-code-display {
        text-align: center;
        padding: 1.5rem;
        background: #f8f9fa;
        border-radius: 12px;
        margin-bottom: 1.5rem;
        position: relative;

        .code-label {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .magic-code {
          font-size: 2rem;
          font-weight: 600;
          color: #1976D2;
          margin-bottom: 0.5rem;
          font-family: monospace;
        }
      }

      .share-instructions {
        text-align: center;
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: #e3f2fd;
        border-radius: 8px;

        .instruction-title {
          font-weight: 600;
          color: #1976D2;
          margin-bottom: 0.5rem;
        }

        .instruction-text {
          font-style: italic;
          color: #666;
        }
      }

      .share-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
      }
    }
  }

  .active-invites-card {
    border-radius: 12px;

    .invites-list {
      .invite-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        border: 1px solid #eee;
        border-radius: 8px;
        margin-bottom: 0.5rem;

        .invite-info {
          flex: 1;

          .invite-code {
            font-weight: 600;
            color: #1976D2;
            font-family: monospace;
          }

          .invite-details {
            color: #666;
            font-size: 0.9rem;
            margin-top: 0.25rem;
          }
        }

        .invite-actions {
          display: flex;
          gap: 0.5rem;
        }
      }
    }
  }

  .qr-code-container {
    display: flex;
    justify-content: center;
    
    .qr-image {
      border: 2px solid #eee;
      border-radius: 8px;
    }
  }

  .qr-instructions {
    color: #666;
    font-size: 0.9rem;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .magic-invite-manager {
    .steps-grid {
      grid-template-columns: 1fr !important;
    }

    .share-buttons {
      flex-direction: column !important;
    }
  }
}
</style> 