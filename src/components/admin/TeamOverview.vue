<template>
  <BaseCard 
    variant="neumorph" 
    class="team-overview-card"
    title="Team Overview"
    subtitle="Manage your team members and permissions"
    icon="group"
    icon-color="primary"
    header-color="primary"
  >
    <template #header-actions>
      <div class="header-stats">
        <div class="stat">
          <div class="stat-number">{{ totalMembers }}</div>
          <div class="stat-label">{{ $t('admin.totalMembers') }}</div>
        </div>
        <div class="stat">
          <div class="stat-number">{{ onlineMembers }}</div>
          <div class="stat-label">{{ $t('admin.onlineNow') }}</div>
        </div>
      </div>
    </template>

      <div v-if="loading" class="loading-state">
        <q-spinner-dots size="2rem" color="primary" />
        <p>{{ $t('admin.loadingTeam') }}</p>
      </div>

      <div v-else-if="teamMembers.length === 0" class="empty-state">
        <q-icon name="group_off" size="4rem" color="grey-5" />
        <h4>{{ $t('admin.noTeamMembers') }}</h4>
        <p>{{ $t('admin.noTeamMembersDescription') }}</p>
      </div>

      <div v-else class="members-grid">
        <BaseCard 
          v-for="member in teamMembers" 
          :key="member.id"
          variant="glass-modern"
          class="member-card"
          :class="{ 
            'online': member.isOnline,
            'offline': !member.isOnline 
          }"
        >
          <!-- Member Header -->
          <div class="member-header">
            <div class="member-avatar">
              <q-avatar size="48px" :color="member.avatarColor" text-color="white">
                <span v-if="!member.avatar_url">{{ member.initials }}</span>
                <img v-else :src="member.avatar_url" />
              </q-avatar>
              <div class="status-indicator" :class="{ 'online': member.isOnline }"></div>
            </div>
            <div class="member-info">
              <h4 class="member-name">{{ member.full_name }}</h4>
              <div class="member-role">
                <q-chip 
                  :color="getRoleColor(member.role)" 
                  text-color="white" 
                  size="sm"
                >
                  {{ $t(`roles.${member.role}`) }}
                </q-chip>
              </div>
              <div v-if="member.department" class="member-department">
                <q-icon name="apartment" size="sm" />
                <span>{{ member.department }}</span>
              </div>
            </div>
            <div class="member-actions">
              <q-btn-dropdown
                flat
                round
                icon="more_vert"
                size="sm"
                :disable="member.role === 'owner'"
              >
                <q-list>
                  <q-item clickable @click="viewMember(member)">
                    <q-item-section avatar>
                      <q-icon name="visibility" />
                    </q-item-section>
                    <q-item-section>{{ $t('admin.viewProfile') }}</q-item-section>
                  </q-item>
                  <q-item clickable @click="editMember(member)">
                    <q-item-section avatar>
                      <q-icon name="edit" />
                    </q-item-section>
                    <q-item-section>{{ $t('admin.editMember') }}</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item 
                    clickable 
                    @click="toggleMemberStatus(member)"
                    :class="{ 'text-negative': member.is_active, 'text-positive': !member.is_active }"
                  >
                    <q-item-section avatar>
                      <q-icon :name="member.is_active ? 'person_off' : 'person'" />
                    </q-item-section>
                    <q-item-section>
                      {{ member.is_active ? $t('admin.deactivate') : $t('admin.activate') }}
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
            </div>
          </q-card-section>

          <!-- Login Methods -->
          <q-card-section class="login-methods">
            <div class="methods-header">
              <q-icon name="login" size="sm" />
              <span>{{ $t('admin.loginMethods') }}</span>
            </div>
            <div class="methods-list">
              <!-- Magic Code Method -->
              <div 
                v-if="member.magic_code_enabled" 
                class="method-item magic-code"
                @click="showPersonalCode(member)"
              >
                <div class="method-icon">
                  <q-icon name="auto_awesome" color="primary" />
                </div>
                <div class="method-info">
                  <div class="method-name">{{ $t('admin.magicCode') }}</div>
                  <div class="method-detail">{{ member.personal_magic_code || '🏥LOADING...' }}</div>
                </div>
                <q-btn 
                  flat 
                  round 
                  icon="content_copy" 
                  size="sm"
                  @click.stop="copyMagicCode(member)"
                  :disable="!member.personal_magic_code"
                />
              </div>

              <!-- Email/Password Method -->
              <div v-if="member.email_login_enabled" class="method-item email-login">
                <div class="method-icon">
                  <q-icon name="email" color="secondary" />
                </div>
                <div class="method-info">
                  <div class="method-name">{{ $t('admin.emailPassword') }}</div>
                  <div class="method-detail">{{ member.email }}</div>
                </div>
                <q-btn 
                  flat 
                  round 
                  icon="lock_reset" 
                  size="sm"
                  @click="resetPassword(member)"
                />
              </div>

              <!-- Device Remember Method -->
              <div v-if="member.device_remember_enabled" class="method-item device-remember">
                <div class="method-icon">
                  <q-icon name="devices" color="accent" />
                </div>
                <div class="method-info">
                  <div class="method-name">{{ $t('admin.deviceRemember') }}</div>
                  <div class="method-detail">
                    {{ $t('admin.trustedDevices', { count: member.device_tokens?.length || 0 }) }}
                  </div>
                </div>
                <q-btn 
                  flat 
                  round 
                  icon="manage_accounts" 
                  size="sm"
                  @click="manageDevices(member)"
                />
              </div>
            </div>
          </q-card-section>

          <!-- Activity Information -->
          <q-card-section class="member-activity">
            <div class="activity-grid">
              <div class="activity-stat">
                <q-icon name="schedule" size="sm" />
                <div>
                  <div class="stat-label">{{ $t('admin.lastLogin') }}</div>
                  <div class="stat-value">{{ formatLastLogin(member.last_login_at || undefined) }}</div>
                </div>
              </div>
              <div class="activity-stat">
                <q-icon name="trending_up" size="sm" />
                <div>
                  <div class="stat-label">{{ $t('admin.loginCount') }}</div>
                  <div class="stat-value">{{ member.login_count || 0 }}</div>
                </div>
              </div>
              <div class="activity-stat">
                <q-icon name="favorite_border" size="sm" />
                <div>
                  <div class="stat-label">{{ $t('admin.preferredMethod') }}</div>
                  <div class="stat-value">{{ $t(`admin.${member.preferred_login_method}`) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="member-quick-actions">
            <q-btn 
              flat 
              :label="$t('admin.sendMessage')" 
              icon="message"
              size="sm"
              @click="sendMessage(member)"
            />
            <q-btn 
              flat 
              :label="$t('admin.viewSessions')" 
              icon="history"
              size="sm"
              @click="viewSessions(member)"
            />
          </div>
        </BaseCard>
      </div>

    <!-- Personal Code Dialog -->
    <q-dialog v-model="showCodeDialog">
      <BaseCard variant="elevated" style="min-width: 350px">
        <template #header>
          <div class="text-h6">{{ $t('admin.personalMagicCode') }}</div>
          <div class="text-subtitle2">{{ selectedMember?.full_name }}</div>
        </template>
          <div class="magic-code-display">
            <div class="code-text">{{ selectedMember?.personal_magic_code }}</div>
            <q-btn 
              flat 
              icon="content_copy" 
              :label="$t('common.copy')"
              @click="copyMagicCode(selectedMember)"
            />
          </div>
          <p class="code-explanation">
            {{ $t('admin.magicCodeExplanation') }}
          </p>
        <template #actions>
          <q-btn flat :label="$t('common.close')" v-close-popup />
        </template>
      </BaseCard>
    </q-dialog>
  </BaseCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import BaseCard from 'src/components/base/BaseCard.vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { PermanentUserService, type EnhancedPermanentUser } from 'src/services/permanentUsers';

// Composables
const { t } = useI18n();
const $q = useQuasar();

// State
const loading = ref(true);
const teamMembers = ref<any[]>([]);
const showCodeDialog = ref(false);
const selectedMember = ref<any>(null);

// Computed
const totalMembers = computed(() => teamMembers.value.length);
const onlineMembers = computed(() => teamMembers.value.filter(m => m.isOnline).length);

// Methods
const loadTeamMembers = async () => {
  loading.value = true;
  try {
    // Mock practice ID - in real app, get from auth store
    const practiceId = 'mock-practice-id';
    const members = await PermanentUserService.getPracticeTeam(practiceId);
    
    // Enhance members with additional UI data
          teamMembers.value = members.map((member: any) => ({
        ...member,
        initials: getInitials(member.full_name || ''),
        avatarColor: getAvatarColor(member.full_name || ''),
        isOnline: isRecentlyActive(member.last_login_at)
      }));
  } catch (error) {
    console.error('Error loading team members:', error);
    $q.notify({
      type: 'negative',
      message: t('admin.loadTeamError'),
      position: 'top-right'
    });
  } finally {
    loading.value = false;
  }
};

const getInitials = (fullName: string): string => {
  return fullName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const getAvatarColor = (fullName: string): string => {
  const colors = ['primary', 'secondary', 'accent', 'positive', 'negative', 'info', 'warning'];
  const index = fullName.charCodeAt(0) % colors.length;
  return colors[index] || 'primary';
};

const isRecentlyActive = (lastLogin?: string): boolean => {
  if (!lastLogin) {
    return false;
  }
  const lastLoginDate = new Date(lastLogin);
  const now = new Date();
  const diffInMinutes = (now.getTime() - lastLoginDate.getTime()) / (1000 * 60);
  return diffInMinutes < 30; // Online if active in last 30 minutes
};

const getRoleColor = (role: string): string => {
  const roleColors: Record<string, string> = {
    owner: 'red',
    admin: 'purple',
    manager: 'indigo',
    assistant: 'blue',
    member: 'teal'
  };
  return roleColors[role] || 'grey';
};

const formatLastLogin = (lastLogin?: string): string => {
  if (!lastLogin) return t('admin.never');
  
  const date = new Date(lastLogin);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    const minutes = Math.floor(diffInHours * 60);
    return t('admin.minutesAgo', { count: minutes });
  } else if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    return t('admin.hoursAgo', { count: hours });
  } else {
    const days = Math.floor(diffInHours / 24);
    return t('admin.daysAgo', { count: days });
  }
};

// Actions
const viewMember = (member: EnhancedPermanentUser) => {
  console.log('View member:', member);
  // TODO: Implement member profile view
};

const editMember = (member: EnhancedPermanentUser) => {
  console.log('Edit member:', member);
  // TODO: Implement member editing
};

const toggleMemberStatus = async (member: EnhancedPermanentUser) => {
  try {
    const action = member.is_active ? 'deactivate' : 'activate';
    const confirmed = await new Promise((resolve) => {
      $q.dialog({
        title: t(`admin.confirm${action.charAt(0).toUpperCase() + action.slice(1)}`),
        message: t(`admin.confirm${action.charAt(0).toUpperCase() + action.slice(1)}Message`, { name: member.full_name }),
        cancel: true,
        persistent: true
      }).onOk(() => resolve(true)).onCancel(() => resolve(false));
    });

    if (confirmed) {
      // TODO: Implement status toggle
      member.is_active = !member.is_active;
      $q.notify({
        type: 'positive',
        message: t(`admin.${action}Success`, { name: member.full_name }),
        position: 'top-right'
      });
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('admin.statusChangeError'),
      position: 'top-right'
    });
  }
};

const showPersonalCode = (member: EnhancedPermanentUser) => {
  selectedMember.value = member;
  showCodeDialog.value = true;
};

const copyMagicCode = async (member: EnhancedPermanentUser | null) => {
  if (!member?.personal_magic_code) return;
  
  try {
    await navigator.clipboard.writeText(member.personal_magic_code);
    $q.notify({
      type: 'positive',
      message: t('admin.codeCopied'),
      position: 'top-right'
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('admin.copyError'),
      position: 'top-right'
    });
  }
};

const resetPassword = (member: EnhancedPermanentUser) => {
  console.log('Reset password for:', member);
  // TODO: Implement password reset
};

const manageDevices = (member: EnhancedPermanentUser) => {
  console.log('Manage devices for:', member);
  // TODO: Implement device management
};

const sendMessage = (member: EnhancedPermanentUser) => {
  console.log('Send message to:', member);
  // TODO: Implement messaging
};

const viewSessions = (member: EnhancedPermanentUser) => {
  console.log('View sessions for:', member);
  // TODO: Implement session history
};

onMounted(() => {
  loadTeamMembers();
});
</script>

<style scoped lang="scss">
.team-overview-card {
  .team-header {
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .title-section {
        display: flex;
        align-items: center;
        gap: 1rem;
        
        .section-title {
          margin: 0;
          color: #1976D2;
          font-size: 1.5rem;
        }
        
        .section-subtitle {
          margin: 0;
          color: #666;
        }
      }
      
      .header-stats {
        display: flex;
        gap: 2rem;
        
        .stat {
          text-align: center;
          
          .stat-number {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1976D2;
          }
          
          .stat-label {
            font-size: 0.9rem;
            color: #666;
          }
        }
      }
    }
  }
  
  .team-list {
    .loading-state,
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #666;
      
      h4 {
        margin: 1rem 0 0.5rem;
      }
      
      p {
        margin: 0;
      }
    }
    
    .members-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.5rem;
      
      .member-card {
        border-radius: 12px;
        border: 2px solid transparent;
        transition: all 0.3s ease;
        
        &.online {
          border-color: #4CAF50;
          box-shadow: 0 2px 12px rgba(76, 175, 80, 0.15);
        }
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        
        .member-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          
          .member-avatar {
            position: relative;
            
            .status-indicator {
              position: absolute;
              bottom: 0;
              right: 0;
              width: 12px;
              height: 12px;
              border-radius: 50%;
              background: #ccc;
              border: 2px solid white;
              
              &.online {
                background: #4CAF50;
              }
            }
          }
          
          .member-info {
            flex: 1;
            
            .member-name {
              margin: 0 0 0.25rem;
              font-size: 1.1rem;
              color: #1976D2;
            }
            
            .member-role {
              margin-bottom: 0.25rem;
            }
            
            .member-department {
              display: flex;
              align-items: center;
              gap: 0.25rem;
              color: #666;
              font-size: 0.9rem;
            }
          }
        }
        
        .login-methods {
          padding: 0 1rem 1rem;
          
          .methods-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.75rem;
            color: #666;
            font-weight: 500;
            font-size: 0.9rem;
          }
          
          .methods-list {
            .method-item {
              display: flex;
              align-items: center;
              gap: 0.75rem;
              padding: 0.5rem;
              border-radius: 8px;
              margin-bottom: 0.5rem;
              cursor: pointer;
              transition: background-color 0.2s;
              
              &:hover {
                background: #f5f5f5;
              }
              
              .method-icon {
                width: 32px;
                display: flex;
                justify-content: center;
              }
              
              .method-info {
                flex: 1;
                
                .method-name {
                  font-weight: 500;
                  font-size: 0.9rem;
                }
                
                .method-detail {
                  color: #666;
                  font-size: 0.8rem;
                  font-family: monospace;
                }
              }
            }
          }
        }
        
        .member-activity {
          padding: 0 1rem 1rem;
          
          .activity-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            
            .activity-stat {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              
              .stat-label {
                font-size: 0.8rem;
                color: #666;
              }
              
              .stat-value {
                font-size: 0.9rem;
                font-weight: 500;
              }
            }
          }
        }
        
        .member-quick-actions {
          padding: 0.5rem 1rem 1rem;
          justify-content: space-between;
        }
      }
    }
  }
  
  .magic-code-display {
    background: #f5f5f5;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
    
    .code-text {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1976D2;
      font-family: monospace;
      margin-bottom: 0.5rem;
    }
  }
  
  .code-explanation {
    color: #666;
    font-size: 0.9rem;
    line-height: 1.4;
  }
}

@media (max-width: 768px) {
  .team-overview-card {
    .team-header .header-content {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }
    
    .members-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style> 