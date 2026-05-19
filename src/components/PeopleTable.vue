<script setup lang="ts">
import { Trash2, ExternalLink, User, CreditCard, Calendar, MapPin, Users, Building2 } from 'lucide-vue-next';

defineProps<{
  people: any[]
}>();

defineEmits(['delete', 'view']);
</script>

<template>
  <div class="table-container glass-card">
    <table v-if="people.length > 0">
      <thead>
        <tr>
          <th>Persona</th>
          <th>DNI / CUIT</th>
          <th>Nacimiento / IGJ</th>
          <th>Ubicación</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="person in people" :key="person.idNumber" class="person-row">
          <td>
            <div class="person-info">
              <div class="person-avatar" v-if="!person.photo" :style="person.tipoPersona === 'juridica' ? 'background: rgba(124, 58, 237, 0.1); color: #7c3aed;' : ''">
                <Building2 v-if="person.tipoPersona === 'juridica'" :size="16" />
                <User v-else :size="16" />
              </div>
              <img v-else :src="`data:image/jpeg;base64,${person.photo}`" class="person-thumb" />
              <div>
                <div class="name">
                  <span v-if="person.tipoPersona === 'juridica'">[{{ person.tipoSocietario || 'S.A./S.R.L.' }}] {{ person.surname }}</span>
                  <span v-else>{{ person.surname }}, {{ person.names }}</span>
                </div>
                <div class="gender">
                  <span v-if="person.tipoPersona === 'juridica'">Representante: {{ person.repNombre || 'No asignado' }}</span>
                  <span v-else>{{ person.gender || 'No especificado' }}</span>
                </div>
              </div>
            </div>
          </td>
          <td>
            <div class="document-badges">
              <div class="id-badge" :style="person.tipoPersona === 'juridica' ? 'background: #f5f3ff; border-color: #ddd6fe; color: #7c3aed;' : ''">
                <CreditCard :size="14" />
                {{ person.tipoPersona === 'juridica' ? 'CUIT ' : '' }}{{ person.idNumber }}
              </div>
              <div class="tramite-badge" v-if="person.processNumber && person.tipoPersona !== 'juridica'">
                T: {{ person.processNumber }}
              </div>
              <div class="tramite-badge" v-else-if="person.tipoPersona === 'juridica' && person.nroIgj" style="color: #7c3aed; font-weight: 600;">
                Reg. IGJ: {{ person.nroIgj }}
              </div>
            </div>
          </td>
          <td>
            <div class="date-info">
              <Calendar :size="14" />
              {{ person.tipoPersona === 'juridica' ? (person.fechaInscripcionIgj || 'Sin fecha') : (person.birthDate || '---') }}
            </div>
          </td>
          <td>
            <div class="address-group">
              <div class="address-info" :title="person.address">
                <MapPin :size="14" />
                {{ person.address || 'Sin dirección' }}
              </div>
              <div class="city-province" v-if="person.city || person.province">
                {{ person.city }}<span v-if="person.city && person.province">, </span>{{ person.province }}
              </div>
            </div>
          </td>
          <td>
            <div class="actions">
              <button class="action-btn view" title="Ver detalles" @click="$emit('view', person)">
                <ExternalLink :size="18" />
              </button>
              <button class="action-btn delete" @click="$emit('delete', person.id)" title="Eliminar">
                <Trash2 :size="18" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else class="empty-state">
      <Users :size="48" class="empty-icon" />
      <h3>No hay registros</h3>
      <p>Escanea un DNI para comenzar a registrar personas.</p>
    </div>
  </div>
</template>

<style scoped>
.table-container {
  width: 100%;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

th {
  padding: 16px 24px;
  background: #f8fafc;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-light);
}

td {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-light);
  vertical-align: middle;
}

.person-row {
  transition: all 0.2s;
}

.person-row:hover {
  background: #f1f5f9;
}

.person-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

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

.person-thumb {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  object-fit: cover;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.name {
  font-weight: 700;
  color: var(--text-main);
  font-size: 15px;
}

.gender {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.id-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  color: var(--text-main);
  padding: 6px 12px;
  border-radius: 8px;
  font-family: monospace;
  font-weight: 700;
  border: 1px solid var(--border-light);
}

.document-badges {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tramite-badge {
  font-size: 11px;
  color: var(--text-muted);
  font-family: monospace;
  padding-left: 4px;
}

.address-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.city-province {
  font-size: 12px;
  color: var(--text-muted);
  padding-left: 20px;
}

.date-info, .address-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-size: 14px;
  font-weight: 500;
}

.address-info {
  line-height: 1.4;
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: white;
  border: 1px solid var(--border-light);
  padding: 8px;
  border-radius: 10px;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.action-btn.view:hover {
  background: rgba(79, 70, 229, 0.05);
  color: var(--primary);
  border-color: var(--primary);
}

.action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.05);
  color: var(--danger);
  border-color: var(--danger);
}

.empty-state {
  padding: 80px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: var(--text-muted);
}

.empty-state h3 {
  color: var(--text-main);
  font-size: 18px;
  margin-top: 8px;
}

.empty-icon {
  opacity: 0.15;
}
</style>
