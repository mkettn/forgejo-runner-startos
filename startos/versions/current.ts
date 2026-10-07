import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '13.2.0:3',
  releaseNotes: {
    en_US:
      'Forgejo Runner no longer depends on the Forgejo package, so it can serve any Forgejo instance. It connects to the Forgejo package on this device by default; to use another instance, enter its URL in Configure and restart.',
    es_ES:
      'Forgejo Runner ya no depende del paquete Forgejo, por lo que puede atender a cualquier instancia de Forgejo. De forma predeterminada se conecta al paquete Forgejo de este dispositivo; para usar otra instancia, introduzca su URL en Configurar y reinicie.',
    de_DE:
      'Forgejo Runner hängt nicht mehr vom Forgejo-Paket ab und kann daher jede Forgejo-Instanz bedienen. Standardmäßig verbindet er sich mit dem Forgejo-Paket auf diesem Gerät; für eine andere Instanz geben Sie deren URL unter „Konfigurieren“ ein und starten Sie neu.',
    pl_PL:
      'Forgejo Runner nie zależy już od pakietu Forgejo, więc może obsługiwać dowolną instancję Forgejo. Domyślnie łączy się z pakietem Forgejo na tym urządzeniu; aby użyć innej instancji, wpisz jej adres URL w Konfiguruj i uruchom usługę ponownie.',
    fr_FR:
      "Forgejo Runner ne dépend plus du paquet Forgejo et peut donc servir n'importe quelle instance Forgejo. Par défaut, il se connecte au paquet Forgejo de cet appareil ; pour une autre instance, saisissez son URL dans Configurer, puis redémarrez.",
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
