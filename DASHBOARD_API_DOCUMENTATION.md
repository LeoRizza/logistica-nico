# Dashboard API - Documentación Completa

## Resumen

Este documento describe la implementación del módulo Dashboard que proporciona reportes gerenciales y análisis financiero, incluyendo el endpoint **Profit & Loss (P&L)** para el Estado de Resultados de la empresa.

---

## 1. Archivos Implementados

### 1.1 Servicios
- **`src/services/dashboardService.ts`**: Contiene toda la lógica de cálculo para reportes financieros
  - Clase `DashboardService` que extiende `BaseService`
  - Método principal: `getProfitAndLossReport(startDate, endDate)`
  - Métodos privados:
    - `getOperatingIncome()`: Calcula ingresos de viajes
    - `getIndirectCosts()`: Calcula costos generales

### 1.2 Controladores
- **`src/controllers/dashboardController.ts`**: Maneja las solicitudes HTTP
  - Clase `DashboardController` que extiende `BaseController`
  - Método: `getProfitAndLoss(req, res)`
  - Valida parámetros y coordina con el servicio

### 1.3 Rutas
- **`src/routes/dashboardRoutes.ts`**: Define los endpoints disponibles
  - Ruta: `GET /api/v1/dashboard/pnl`

### 1.4 Actualización de Rutas Principales
- **`src/routes/index.ts`**: Importa y monta dashboardRoutes con middleware de autenticación

---

## 2. Endpoint: GET /api/v1/dashboard/pnl

### 2.1 Descripción
Retorna el Estado de Resultados (Profit and Loss) de la empresa para un período específico, mostrando:
- Ingresos operativos (de viajes)
- Costos de viajes
- Costos indirectos (gastos generales)
- Ganancia neta
- Margen de ganancia

### 2.2 URL
```
GET /api/v1/dashboard/pnl?startDate=2024-01-01&endDate=2024-01-31
```

### 2.3 Parámetros de Query (Requeridos)
| Parámetro | Tipo | Descripción | Formato |
|-----------|------|-------------|---------|
| `startDate` | string | Fecha inicial del período | ISO 8601 (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss) |
| `endDate` | string | Fecha final del período | ISO 8601 (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss) |

### 2.4 Headers Requeridos
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### 2.5 Validaciones
- `startDate` es requerido y debe ser un string válido en formato ISO 8601
- `endDate` es requerido y debe ser un string válido en formato ISO 8601
- `startDate` debe ser menor que `endDate`
- El usuario debe estar autenticado (token JWT válido)

### 2.6 Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "message": "Profit and Loss report retrieved successfully",
  "data": {
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    },
    "operatingIncome": {
      "totalTrips": 15,
      "grossRevenue": 45000.00,
      "tripCosts": {
        "totalAmountToPay": 12000.00,
        "totalPerDiemsDelivered": 3500.00,
        "totalUnforeseeExpenses": 2100.00,
        "totalFuelCosts": 4200.00
      },
      "netIncome": 23200.00
    },
    "indirectCosts": {
      "total": 8500.00,
      "byCategory": {
        "SALARIES": 5000.00,
        "RENT": 2000.00,
        "INSURANCE": 1500.00
      }
    },
    "netProfitCompany": 14700.00,
    "summary": {
      "margin": 32.67,
      "marginPercentage": "32.67%"
    }
  },
  "timestamp": "2024-01-31T10:30:00.000Z",
  "path": "/api/v1/dashboard/pnl"
}
```

### 2.7 Respuestas de Error

#### Error 400 - Bad Request (Parámetros inválidos)
```json
{
  "success": false,
  "message": "Start date is required and must be a valid date string",
  "statusCode": 400,
  "timestamp": "2024-01-31T10:30:00.000Z",
  "path": "/api/v1/dashboard/pnl"
}
```

#### Error 401 - Unauthorized (Sin autenticación)
```json
{
  "success": false,
  "message": "Unauthorized: User not authenticated",
  "statusCode": 401,
  "timestamp": "2024-01-31T10:30:00.000Z",
  "path": "/api/v1/dashboard/pnl"
}
```

#### Error 500 - Internal Server Error
```json
{
  "success": false,
  "message": "Failed to retrieve P&L report: [error details]",
  "statusCode": 500,
  "timestamp": "2024-01-31T10:30:00.000Z",
  "path": "/api/v1/dashboard/pnl"
}
```

---

## 3. Lógica de Cálculos

### 3.1 Ingresos Operativos (Operating Income)

#### Pasos:
1. **Obtener viajes completados** dentro del período (scheduled_date entre startDate y endDate, status = "COMPLETED")
2. **Calcular Ingresos Brutos (Gross Revenue)**:
   ```
   Gross Revenue = Σ(net_weight_kg × rate_per_kg) para cada viaje
   ```

3. **Calcular Costos de Viajes**:
   - `totalAmountToPay`: Suma de `trip.actual_cost` de todos los viajes
   - `totalPerDiemsDelivered`: Suma de `trip.per_diems_delivered` de todos los viajes
   - `totalUnforeseeExpenses`: Suma de `tripExpense.amount` agrupados por viaje
   - `totalFuelCosts`: Suma de `fuelLog.total_cost` agrupados por viaje

4. **Calcular Ingreso Neto (Net Income)**:
   ```
   Net Income = Gross Revenue - (totalAmountToPay + totalPerDiemsDelivered + totalUnforeseeExpenses + totalFuelCosts)
   ```

### 3.2 Costos Indirectos (Indirect Costs)

#### Pasos:
1. **Obtener gastos generales** dentro del período (expense_date entre startDate y endDate)
2. **Calcular Total de Costos**:
   ```
   Total = Σ(companyExpense.amount) para cada gasto
   ```
3. **Agrupar por Categoría**:
   - Se retorna un objeto con la suma de costos por cada categoría

### 3.3 Ganancia Neta de la Empresa (Net Profit)

```
Net Profit = Operating Income (Net Income) - Indirect Costs (Total)
```

### 3.4 Margen de Ganancia (Profit Margin)

```
Margin (%) = (Net Profit / Gross Revenue) × 100
```

---

## 4. Ejemplos de Uso

### 4.1 Usando cURL

```bash
# Obtener P&L para enero de 2024
curl -X GET "http://localhost:3000/api/v1/dashboard/pnl?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Con fecha y hora específicas
curl -X GET "http://localhost:3000/api/v1/dashboard/pnl?startDate=2024-01-01T00:00:00&endDate=2024-01-31T23:59:59" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 4.2 Usando JavaScript/Axios

```javascript
import axios from 'axios';

const token = 'YOUR_JWT_TOKEN';
const apiURL = 'http://localhost:3000/api/v1/dashboard/pnl';

const params = {
  startDate: '2024-01-01',
  endDate: '2024-01-31'
};

try {
  const response = await axios.get(apiURL, {
    params,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  console.log('P&L Report:', response.data.data);
  console.log('Net Profit:', response.data.data.netProfitCompany);
  console.log('Margin:', response.data.data.summary.marginPercentage);
} catch (error) {
  console.error('Error:', error.response?.data);
}
```

### 4.3 Usando Fetch API

```javascript
const token = 'YOUR_JWT_TOKEN';
const apiURL = 'http://localhost:3000/api/v1/dashboard/pnl';

const params = new URLSearchParams({
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});

fetch(`${apiURL}?${params}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => {
    console.log('P&L Report:', data.data);
    console.log('Net Profit:', data.data.netProfitCompany);
  })
  .catch(error => console.error('Error:', error));
```

### 4.4 Usando Postman

1. **Método**: GET
2. **URL**: `http://localhost:3000/api/v1/dashboard/pnl`
3. **Query Params**:
   - Key: `startDate` | Value: `2024-01-01`
   - Key: `endDate` | Value: `2024-01-31`
4. **Headers**:
   - Key: `Authorization` | Value: `Bearer YOUR_JWT_TOKEN`
   - Key: `Content-Type` | Value: `application/json`
5. **Send**

---

## 5. Estructura de Datos

### 5.1 PNLReport Interface

```typescript
interface PNLReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  operatingIncome: {
    totalTrips: number;
    grossRevenue: number;
    tripCosts: {
      totalAmountToPay: number;
      totalPerDiemsDelivered: number;
      totalUnforeseeExpenses: number;
      totalFuelCosts: number;
    };
    netIncome: number;
  };
  indirectCosts: {
    total: number;
    byCategory: Record<string, number>;
  };
  netProfitCompany: number;
  summary: {
    margin: number;
    marginPercentage: string;
  };
}
```

---

## 6. Flujo de Datos

```
GET Request
    ↓
DashboardController.getProfitAndLoss()
    ├─ Valida parámetros y autenticación
    ├─ Convierte strings a objetos Date
    └─ Llama a DashboardService.getProfitAndLossReport()
         ↓
    DashboardService.getProfitAndLossReport()
        ├─ Valida fechas
        ├─ getOperatingIncome()
        │   ├─ Obtiene viajes COMPLETED
        │   ├─ Calcula ingresos brutos
        │   ├─ Suma costos (actual_cost, per_diems_delivered, fuel, expenses)
        │   └─ Retorna netIncome
        │
        ├─ getIndirectCosts()
        │   ├─ Obtiene CompanyExpenses
        │   └─ Suma y agrupa por categoría
        │
        ├─ Calcula netProfitCompany
        ├─ Calcula margin
        └─ Retorna PNLReport
            ↓
    DashboardController devuelve Response 200
```

---

## 7. CompanyExpense CRUD

El modelo CompanyExpense ya tiene un CRUD completo implementado en:
- **Servicio**: `src/services/expenseService.ts`
- **Controlador**: `src/controllers/expenseController.ts`
- **Rutas**: `src/routes/expenseRoutes.ts`

### 7.1 Endpoints de CompanyExpense

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/expenses/company` | Crear gasto |
| GET | `/api/v1/expenses/company` | Listar gastos (paginado) |
| GET | `/api/v1/expenses/company/:id` | Obtener gasto por ID |
| GET | `/api/v1/expenses/company/category/:category` | Gastos por categoría |
| GET | `/api/v1/expenses/company/recurring` | Gastos recurrentes |
| GET | `/api/v1/expenses/company/report` | Reporte de período |
| PUT | `/api/v1/expenses/company/:id` | Actualizar gasto |
| PATCH | `/api/v1/expenses/company/:id/pay` | Marcar como pagado |
| DELETE | `/api/v1/expenses/company/:id` | Eliminar gasto (soft delete) |

### 7.2 Ejemplo: Crear CompanyExpense

```bash
curl -X POST "http://localhost:3000/api/v1/expenses/company" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pago de Alquiler",
    "category": "RENT",
    "amount": 5000,
    "currency": "USD",
    "expense_date": "2024-01-15",
    "due_date": "2024-02-15",
    "notes": "Alquiler de oficina enero"
  }'
```

**Respuesta**:
```json
{
  "success": true,
  "message": "Company expense created successfully",
  "data": {
    "id": "cq7k9m2p1l0w0x0y0z0a0b0c",
    "name": "Pago de Alquiler",
    "category": "RENT",
    "amount": 5000,
    "currency": "USD",
    "expense_date": "2024-01-15T00:00:00.000Z",
    "due_date": "2024-02-15T00:00:00.000Z",
    "is_recurring": false,
    "payment_status": "PENDING",
    "notes": "Alquiler de oficina enero",
    "created_by_id": "user_id",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "deleted_at": null
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/v1/expenses/company"
}
```

### 7.3 Ejemplo: Listar CompanyExpenses

```bash
curl -X GET "http://localhost:3000/api/v1/expenses/company?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 8. Testing

### 8.1 Test Scenario 1: Período sin datos

```bash
curl -X GET "http://localhost:3000/api/v1/dashboard/pnl?startDate=2024-12-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Resultado esperado**:
- operatingIncome.totalTrips: 0
- operatingIncome.grossRevenue: 0
- indirectCosts.total: 0
- netProfitCompany: 0

### 8.2 Test Scenario 2: Período con gastos pero sin viajes

Crear CompanyExpenses pero asegurarse de que no hay viajes.

**Resultado esperado**:
- operatingIncome.grossRevenue: 0
- indirectCosts.total: > 0
- netProfitCompany: negativo

### 8.3 Test Scenario 3: Período con viajes y gastos

Crear viajes completos con net_weight_kg y rate_per_kg, y CompanyExpenses.

**Resultado esperado**:
- operatingIncome.grossRevenue: > 0
- indirectCosts.total: > 0
- netProfitCompany: calculado correctamente

### 8.4 Test Scenario 4: Validaciones de entrada

```bash
# Sin startDate
curl -X GET "http://localhost:3000/api/v1/dashboard/pnl?endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Resultado esperado: Error 400

# Fecha inválida
curl -X GET "http://localhost:3000/api/v1/dashboard/pnl?startDate=invalid&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Resultado esperado: Error 400

# startDate > endDate
curl -X GET "http://localhost:3000/api/v1/dashboard/pnl?startDate=2024-01-31&endDate=2024-01-01" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Resultado esperado: Error 400

# Sin autenticación
curl -X GET "http://localhost:3000/api/v1/dashboard/pnl?startDate=2024-01-01&endDate=2024-01-31"
# Resultado esperado: Error 401
```

---

## 9. Notas Importantes

1. **Soft Delete**: CompanyExpense usa soft delete (deleted_at), por lo que se excluyen automáticamente los gastos eliminados en los reportes.

2. **Viajes Completados**: Solo se consideran viajes con status = "COMPLETED" en el cálculo de ingresos operativos.

3. **Precisión Decimal**: Todos los cálculos monetarios se redondean a 2 decimales usando `toFixed(2)` y `parseFloat()`.

4. **Timezone**: Las fechas se tratan como UTC. Asegúrate de enviar fechas en formato ISO 8601.

5. **Autenticación**: Todos los endpoints requieren un token JWT válido en el header `Authorization: Bearer <token>`.

6. **Paginación**: El CRUD de CompanyExpense soporta paginación con parámetros `page` y `limit`.

---

## 10. Integración Futura

El dashboard puede ser extendido con:
- Endpoint para comparación período anterior
- Gráficos de tendencias
- Proyecciones y forecasting
- Alertas por umbral de ganancia
- Exportación a PDF/Excel
- Análisis por categoría de gasto
- Comparativas por conductor/vehículo

---

## 11. Información de Contacto / Soporte

Para reportar bugs o sugerir mejoras, contacta al equipo de desarrollo.

---

**Última actualización**: Enero 2024
**Versión**: 1.0.0
**Autor**: Backend Development Team
