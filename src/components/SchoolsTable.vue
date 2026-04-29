<script setup lang="ts">
import { Trash2, FolderOpen, School, User, Car, Hash } from 'lucide-vue-next';

const props = defineProps<{
  schools: any[],
  habilitaciones?: any[]
}>();

defineEmits(['delete', 'view']);

const getHabilitacionesForSchool = (schoolId: number) => {
  if (!props.habilitaciones) return [];
  return props.habilitaciones.filter(h => h.idColegios?.includes(schoolId));
};
</script>

<template>
  <div class="glass-card table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th>Colegio</th>
          <th>Transportistas Vinculados</th>
          <th>Unidades (Dominios)</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="school in schools" :key="school.id" class="person-row">
          <td>
            <div class="person-info">
              <div class="person-avatar"><School :size="16" /></div>
              <div>
                <div class="name">{{ school.nombre }}</div>
                <div class="gender">{{ school.domicilio || 'Sin dirección' }}</div>
              </div>
            </div>
          </td>
          <td>
            <div class="linked-group">
              <div v-if="getHabilitacionesForSchool(school.id).length === 0" class="empty-badge">
                Ninguno
              </div>
              <div v-for="hab in getHabilitacionesForSchool(school.id)" :key="hab.id" class="hab-badge">
                <User :size="12" /> {{ hab.titular }}
              </div>
            </div>
          </td>
          <td>
            <div class="domain-group">
              <div v-for="hab in getHabilitacionesForSchool(school.id)" :key="hab.id" class="domain-badge">
                <Car :size="12" /> {{ hab.dominio }}
              </div>
            </div>
          </td>
          <td>
            <div class="actions">
              <button class="action-btn view" title="Abrir Legajo" @click="$emit('view', school)">
                <FolderOpen :size="18" />
                <span>Legajo</span>
              </button>
              <button class="action-btn delete" @click="$emit('delete', school.id)" title="Eliminar">
                <Trash2 :size="18" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-container { overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; text-align: left; }
.data-table th { 
  padding: 16px 24px; 
  font-size: 12px; 
  font-weight: 700; 
  text-transform: uppercase; 
  letter-spacing: 0.05em; 
  color: var(--text-muted); 
  background: #f8fafc;
  border-bottom: 1px solid var(--border-light); 
}
.person-row { 
  border-bottom: 1px solid var(--border-light); 
  transition: all 0.2s; 
}
.person-row:hover { 
  background: #f1f5f9; 
}
.data-table td { 
  padding: 16px 24px; 
  vertical-align: middle; 
}
.person-info { display: flex; align-items: center; gap: 12px; }
.person-avatar { 
  width: 40px; 
  height: 40px; 
  background: rgba(79, 70, 229, 0.1); 
  color: var(--primary); 
  border-radius: 10px; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
}
.name { 
  font-weight: 700; 
  color: var(--text-main); 
  margin-bottom: 2px; 
  font-size: 15px;
}
.gender { font-size: 12px; color: var(--text-muted); font-weight: 500; }

.linked-group, .domain-group { display: flex; flex-wrap: wrap; gap: 6px; }
.hab-badge, .domain-badge { 
  display: flex; 
  align-items: center; 
  gap: 4px; 
  padding: 4px 10px; 
  background: #f8fafc; 
  border: 1px solid var(--border-light); 
  border-radius: 6px; 
  font-size: 11px; 
  color: #475569; 
  font-weight: 600;
}
.domain-badge { color: var(--primary); background: rgba(79, 70, 229, 0.05); border-color: rgba(79, 70, 229, 0.1); }
.empty-badge { font-size: 11px; color: var(--text-muted); font-style: italic; }

.actions { display: flex; gap: 8px; }
.action-btn { 
  background: white; 
  border: 1px solid var(--border-light); 
  color: var(--text-muted); 
  padding: 8px 12px; 
  border-radius: 10px; 
  cursor: pointer; 
  transition: all 0.2s; 
  display: flex; 
  align-items: center; 
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.action-btn:hover { color: var(--text-main); background: #f8fafc; }
.action-btn.delete:hover { color: var(--danger); background: rgba(239, 68, 68, 0.05); border-color: var(--danger); }
.action-btn.view:hover { 
  color: var(--primary); 
  background: rgba(79, 70, 229, 0.05); 
  border-color: var(--primary);
}
</style>
