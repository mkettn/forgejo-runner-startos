import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '13.2.0:3',
  releaseNotes: {
    en_US:
      'Forgejo Runner no longer depends on the Forgejo package, so it can serve any Forgejo instance. After updating, run Configure and enter your Forgejo URL, then restart.',
    es_ES:
      'Forgejo Runner ya no depende del paquete Forgejo, por lo que puede atender a cualquier instancia de Forgejo. Tras actualizar, ejecute Configurar, introduzca la URL de su Forgejo y reinicie.',
    de_DE:
      'Forgejo Runner hängt nicht mehr vom Forgejo-Paket ab und kann daher jede Forgejo-Instanz bedienen. Führen Sie nach dem Update „Konfigurieren“ aus, geben Sie Ihre Forgejo-URL ein und starten Sie neu.',
    pl_PL:
      'Forgejo Runner nie zależy już od pakietu Forgejo, więc może obsługiwać dowolną instancję Forgejo. Po aktualizacji uruchom Konfiguruj, wpisz adres URL swojego Forgejo i uruchom usługę ponownie.',
    fr_FR:
      "Forgejo Runner ne dépend plus du paquet Forgejo et peut donc servir n'importe quelle instance Forgejo. Après la mise à jour, exécutez Configurer, saisissez l'URL de votre Forgejo, puis redémarrez.",
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
