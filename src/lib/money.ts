import { Prisma } from "@prisma/client";
export const money = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value).toDecimalPlaces(2);
export const formatSAR = (value: Prisma.Decimal.Value) => new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", minimumFractionDigits: 2 }).format(Number(value));
