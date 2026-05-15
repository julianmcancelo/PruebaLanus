import { db, getAllTitles, updateTitle, getAllHabilitaciones, updateHabilitacion } from '../services/dbService';

export async function runMaintenanceCleanup() {
  console.log('Starting maintenance cleanup...');
  
  // 1. Clean Titles (marca/tipo)
  const titles = await getAllTitles();
  let titlesCleaned = 0;
  for (const t of titles) {
    let changed = false;
    const newData = { ...t };
    
    const clean = (val: string) => {
      if (!val) return val;
      if (val.includes('-')) {
        const parts = val.split('-');
        return parts.slice(1).join('-').trim();
      }
      return val.trim();
    };

    const newMarca = clean(t.marca);
    const newTipo = clean(t.tipo);

    if (newMarca !== t.marca) { newData.marca = newMarca; changed = true; }
    if (newTipo !== t.tipo) { newData.tipo = newTipo; changed = true; }

    if (changed) {
      await updateTitle(t.id, newData);
      titlesCleaned++;
    }
  }
  console.log(`Cleaned ${titlesCleaned} titles.`);

  // 2. Clean Habilitaciones (nroExpediente)
  const habs = await getAllHabilitaciones();
  let habsCleaned = 0;
  for (const h of habs) {
    let changed = false;
    const newData = { ...h };
    
    let currentExp = h.nroExpediente || '';
    let cleanExp = currentExp.replace(/\./g, '');

    // Match Long Format: 1000-958499-R-2026-0
    const matchLong = cleanExp.match(/(\d+)-(\d+)-([A-Z])-(\d{4})-\d+/i);
    // Match Short Format: A-106766/2026
    const matchShort = cleanExp.match(/([A-Z])[-/]?(\d+)[-/]?(\d{4})/i);

    if (matchLong) {
      cleanExp = `${matchLong[3].toUpperCase()}-${matchLong[2]}/${matchLong[4]}`;
    } else if (matchShort) {
      cleanExp = `${matchShort[1].toUpperCase()}-${matchShort[2]}/${matchShort[3]}`;
    }

    if (cleanExp !== currentExp) {
      newData.nroExpediente = cleanExp;
      changed = true;
    }

    if (changed) {
      await updateHabilitacion(h.id, newData);
      habsCleaned++;
    }
  }
  console.log(`Cleaned ${habsCleaned} habilitaciones.`);
  
  return { titlesCleaned, habsCleaned };
}
