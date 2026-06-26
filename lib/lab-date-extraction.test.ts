import { describe, expect, test } from 'vitest';
import { inferLabResultDate } from './lab-date-extraction';

describe('lab date extraction', () => {
  test('prefers collected date from LabCorp text over reported or received dates', () => {
    const text = [
      'Date of Birth Sex Fasting 1969-10-03 M',
      'Date/Time Collected Date Entered Date/Time Reported 2026-04-23 06:39:00 PDT 2026-04-23 21:00:00 PDT 2026-04-26 04:36:00 PDT',
      'Received on 04/26/2026',
    ].join(' ');

    expect(inferLabResultDate(text)).toBe('2026-04-23');
  });

  test('falls back to reported/resulted dates when collected date is absent', () => {
    expect(inferLabResultDate('Reported Date 04/26/2026 FINAL')).toBe('2026-04-26');
    expect(inferLabResultDate('Resulted Date 2026-05-02')).toBe('2026-05-02');
  });

  test('does not use uncontextualized dates such as date of birth', () => {
    expect(inferLabResultDate('Date of Birth 1969-10-03 Patient Name Example')).toBeUndefined();
  });
});
