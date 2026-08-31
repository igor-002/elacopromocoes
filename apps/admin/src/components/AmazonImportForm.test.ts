import { describe, expect, it } from 'vitest';
import { amazonImportSummary } from './AmazonImportForm';

describe('resumo da importação Amazon', () => {
  it('distingue ofertas criadas e duplicadas', () => {
    expect(amazonImportSummary(3, 2)).toBe('3 ofertas importadas. 2 itens já estavam no catálogo e foram ignorados.');
    expect(amazonImportSummary(1, 1)).toBe('1 oferta importada. 1 item já estava no catálogo e foi ignorado.');
  });

  it('orienta quando a busca não retorna itens válidos', () => {
    expect(amazonImportSummary(0, 0)).toBe('A Amazon não retornou produtos válidos para essa busca.');
  });
});
