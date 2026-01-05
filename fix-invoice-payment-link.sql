-- Script para vincular el pago existente con el invoice INV-2026-01-03-009
-- Ejecutar este script en la base de datos PostgreSQL

-- Paso 1: Obtener el ID del invoice y del payment
-- (Reemplaza con los IDs reales de tu base de datos)

-- Primero, encuentra el invoice ID:
SELECT id, "invoiceNumber", "totalAmount", "amountPaid", status
FROM "Invoice"
WHERE "invoiceNumber" = 'INV-2026-01-03-009';

-- Luego, encuentra el payment ID:
SELECT id, amount, "paymentDate", type, status, "invoiceId"
FROM "Payment"
WHERE type = 'INITIAL_PAYMENT'
  AND status = 'CONFIRMED'
  AND "invoiceId" IS NULL
ORDER BY "paymentDate" DESC;

-- Paso 2: Vincular el payment con el invoice
-- Reemplaza 'INVOICE_ID_AQUI' con el ID real del invoice
-- Reemplaza 'PAYMENT_ID_AQUI' con el ID real del payment

UPDATE "Payment"
SET "invoiceId" = 'INVOICE_ID_AQUI'
WHERE id = 'PAYMENT_ID_AQUI';

-- Paso 3: Actualizar el amountPaid y status del invoice
UPDATE "Invoice"
SET "amountPaid" = 15000.00,
    status = 'PAID'
WHERE id = 'INVOICE_ID_AQUI';

-- Verificación: Confirmar que los cambios se aplicaron correctamente
SELECT
    i.id as invoice_id,
    i."invoiceNumber",
    i."totalAmount",
    i."amountPaid",
    i.status as invoice_status,
    p.id as payment_id,
    p.amount as payment_amount,
    p."paymentDate",
    p.status as payment_status
FROM "Invoice" i
LEFT JOIN "Payment" p ON p."invoiceId" = i.id
WHERE i."invoiceNumber" = 'INV-2026-01-03-009';
