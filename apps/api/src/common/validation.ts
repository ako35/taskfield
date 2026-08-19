import { BadRequestException } from '@nestjs/common';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requireText(
  value: unknown,
  label: string,
  min: number,
  max: number,
): string {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${label} zorunludur.`);
  }
  const text = value.trim();
  if (text.length < min || text.length > max) {
    throw new BadRequestException(
      `${label} ${min}-${max} karakter olmalıdır.`,
    );
  }
  return text;
}

export function optionalText(
  value: unknown,
  label: string,
  max: number,
): string | null {
  if (value === undefined || value === null || value === '') return null;
  return requireText(value, label, 1, max);
}

export function requireUuid(value: unknown, label: string): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw new BadRequestException(`Geçerli bir ${label} seçin.`);
  }
  return value;
}
