// Catalogo de marcas/modelos para el registro de taxis: solo carros (sedanes, compactos,
// hatchbacks) aptos para taxi - sin pickups, SUVs ni deportivos.
export const VEHICLE_CATALOG = [
  { brand: 'Nissan', models: ['Versa', 'Sentra', 'March', 'Note', 'Tsuru', 'V-Drive'] },
  { brand: 'Chevrolet', models: ['Aveo', 'Spark', 'Beat', 'Onix', 'Sonic'] },
  { brand: 'Kia', models: ['Rio', 'Rio Hatchback', 'Forte', 'K3'] },
  { brand: 'Volkswagen', models: ['Jetta', 'Vento', 'Virtus', 'Gol', 'Polo'] },
  { brand: 'Toyota', models: ['Yaris', 'Corolla'] },
  { brand: 'Honda', models: ['City', 'Civic', 'Fit'] },
  { brand: 'Hyundai', models: ['Accent', 'Elantra', 'Grand i10'] },
  { brand: 'Mazda', models: ['Mazda2', 'Mazda3'] },
  { brand: 'Suzuki', models: ['Swift', 'Dzire'] },
  { brand: 'SEAT', models: ['Ibiza', 'Toledo'] },
  { brand: 'Renault', models: ['Logan', 'Sandero'] },
  { brand: 'Mitsubishi', models: ['Mirage', 'Attrage'] },
  { brand: 'Ford', models: ['Figo'] },
]

// Valor usado para la opcion "Otra marca" / "Otro modelo", que revela un campo de texto libre
// en vez de bloquear el registro de un vehiculo que no esta en el catalogo.
export const OTHER_OPTION = '__OTHER__'

export function modelsForBrand(brand) {
  return VEHICLE_CATALOG.find((b) => b.brand === brand)?.models || []
}
