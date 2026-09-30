# Cierre Backend - Farmacia INACAP

Este paquete completa los bloques pendientes antes del frontend.

## Incluye

### Clínico
- Pacientes
- Médicos
- Recetas
- Saldo de receta
- Recetas retenidas
- Dispensación desde venta
- Registro de medicamentos controlados

### Convenios
- Isapre
- Seguros
- Cenabast
- Convenios institucionales
- Planes
- Beneficios
- Afiliación/cobertura de pacientes
- Preview de descuento
- Registro de cobertura aplicada en ventas

### Reportes y administración
- Dashboard
- Reporte de ventas
- Reporte de inventario
- Reporte de compras
- Reporte de caja
- Reporte de controlados
- Exportación ventas XLSX
- Exportación inventario XLSX
- Exportación ventas PDF
- Auditoría automática de mutaciones
- Configuración general

## Instalación
Descomprimir dentro de backend y ejecutar:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\instalar_backend_final.ps1
```

Luego:

```powershell
npm run dev
```

En otra PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\probar_backend_final.ps1
```
