# Backend API Requirements - Aggiornamento Quantità Prodotti

## Endpoint Richiesto

### PUT `/Product/PUT/UpdateProductQuantity/{product_id}`

**Descrizione**: Aggiorna solo la quantità (stock_unit) di un prodotto specifico.

**Parametri URL**:
- `product_id` (string): ID univoco del prodotto

**Body della Richiesta**:
```json
{
  "stock_unit": "25"
}
```

**Risposta di Successo** (200):
```json
{
  "success": true,
  "message": "Quantità aggiornata con successo",
  "product_id": "12345",
  "new_quantity": 25
}
```

**Risposte di Errore**:

- **404 Not Found**: Prodotto non trovato
```json
{
  "error": "Product not found",
  "product_id": "12345"
}
```

- **400 Bad Request**: Dati non validi
```json
{
  "error": "Invalid data",
  "message": "stock_unit must be a positive integer"
}
```

## Endpoint Alternativo (se il primo non è disponibile)

### PUT `/Product/PUT/UpdateProduct/{product_id}`

**Descrizione**: Aggiorna un prodotto esistente (endpoint generico).

**Parametri URL**:
- `product_id` (string): ID univoco del prodotto

**Body della Richiesta**:
```json
{
  "stock_unit": "25"
}
```

**Note**:
- Il campo `stock_unit` nel database rappresenta la quantità disponibile del prodotto
- Il frontend convertirà automaticamente il valore in stringa come richiesto dal backend
- L'aggiornamento deve essere atomico e aggiornare solo il campo `stock_unit`
- Dopo l'aggiornamento, il frontend ricalcolerà automaticamente lo stato del prodotto (Disponibile/Bassa giacenza/Esaurito)

## Implementazione Attuale

Il frontend attualmente usa un interceptor axios che simula la risposta dell'API. Una volta implementato l'endpoint reale, rimuovere il file `src/utils/apiInterceptors.ts` e l'import corrispondente in `src/main.tsx`.

## Test

Per testare l'endpoint:

1. Creare un prodotto con quantità iniziale
2. Fare doppio click sulla quantità nella tabella prodotti
3. Modificare il valore e premere Invio
4. Verificare che il valore sia aggiornato nel database
5. Ricaricare la pagina per confermare la persistenza 