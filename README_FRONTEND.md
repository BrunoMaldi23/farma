# Frontend Base Responsive - Farmacia INACAP

Base React + TypeScript + Vite conectada al backend.

## Incluye

- Login JWT + refresh token
- Rutas protegidas
- Permisos RBAC
- Sidebar responsive
- Sidebar contraíble en escritorio
- Drawer móvil
- Topbar
- Dashboard conectado
- Usuarios
- Productos
- Inventario
- Compras
- Ventas
- Caja
- Pacientes
- Médicos
- Recetas
- Controlados
- Convenios
- Reportes
- Configuración
- POS base
- Exportación Excel/PDF desde frontend
- Responsive desktop/tablet/móvil

## Instalar

Descomprimir en:

`C:\Bruno\Proyectos\farmacia-inacap\frontend`

Luego:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\instalar_frontend_base.ps1
```

Con backend en puerto 3000:

```powershell
npm run dev
```

Abrir:

`http://localhost:5173`

Usuario demo:

- usuario: `admin`
- contraseña: `Admin12345!`
