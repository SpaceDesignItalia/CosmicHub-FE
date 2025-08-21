# Configurazione API Meteo

Per avere dati meteo reali nella dashboard, è necessario configurare una API key gratuita.

## Opzione 1: OpenWeatherMap (Consigliata)

### 1. Registrazione
- Vai su: https://openweathermap.org/api
- Clicca su "Sign Up" e crea un account gratuito
- Conferma l'email di registrazione

### 2. Ottieni la API Key
- Accedi al tuo account
- Vai nella sezione "API Keys"
- Copia la tua API key (esempio: `abc123def456ghi789`)

### 3. Configurazione nel progetto
- Crea un file `.env.local` nella root del progetto
- Aggiungi la riga:
```
VITE_OPENWEATHER_API_KEY=la_tua_api_key_qui
```

### 4. Riavvia il server
```bash
npm run dev
```

## Piano Gratuito OpenWeatherMap
- ✅ 1.000 chiamate al giorno
- ✅ Dati meteo attuali
- ✅ 60 chiamate al minuto
- ✅ Nessun costo

## Alternative Gratuite

### WeatherAPI
- Sito: https://www.weatherapi.com/
- Piano gratuito: 1 milione di chiamate/mese
- Variabile: `VITE_WEATHERAPI_KEY=your_key`

### AccuWeather
- Sito: https://developer.accuweather.com/
- Piano gratuito: 50 chiamate/giorno
- Variabile: `VITE_ACCUWEATHER_API_KEY=your_key`

## Funzionalità con API Reale

Una volta configurata l'API, avrai:
- 🌡️ **Temperature reali** per ogni città
- 🌤️ **Condizioni meteo accurate** (sole, pioggia, neve, ecc.)
- 💨 **Velocità del vento reale**
- 💧 **Umidità effettiva**
- 🏙️ **Dati aggiornati** ogni 10 minuti (con cache)
- 📍 **Geolocalizzazione automatica** al primo accesso

## Senza API Key

Se non configuri l'API key:
- Il sistema userà dati simulati (come ora)
- Funziona comunque ma con dati fake
- Appare "Dati non disponibili" in caso di errori

## Debug

Per verificare se l'API funziona:
1. Apri la Console del browser (F12)
2. Cerca messaggi di errore relativi al meteo
3. Controlla che la variabile d'ambiente sia caricata

## Sicurezza

- ✅ Le API key sono gratuite
- ✅ Non serve carta di credito per il piano gratuito
- ✅ Le chiavi sono lato client (pubbliche)
- ✅ Limite di chiamate automatico per sicurezza
