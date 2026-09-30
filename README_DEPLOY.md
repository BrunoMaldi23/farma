# FarmaGestion Deploy

Este repo contiene frontend y backend.

## Frontend en Vercel

- Root directory: `.`
- Build command: `npm run build`
- Output directory: `dist`
- Variable requerida:
  - `VITE_API_URL=https://TU-BACKEND-RAILWAY.up.railway.app/api`

## Backend en Railway

- Root directory: `backend`
- Railway usa `backend/railway.json`
- Variables requeridas:
  - `DATABASE_URL`
  - `NODE_ENV=production`
  - `JWT_ACCESS_SECRET`
  - `CORS_ORIGIN=https://farma-jet.vercel.app,http://localhost:5173`
  - `ADMIN_USERNAME=admin`
  - `ADMIN_PASSWORD=administrador`

Despues del primer deploy y con la base creada, ejecutar una vez:

```bash
npm run db:seed
```
