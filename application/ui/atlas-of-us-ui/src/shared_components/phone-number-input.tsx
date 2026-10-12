import { useRef, useState, type CSSProperties } from 'react';

import { CountryCodePicker, findCountry, type Country } from './country-code-picker';

interface PhoneNumberInputProps {
  value: string; //E.164, e.g. +15551234567, or '' when there's no number yet
  onChange: (value: string) => void;
  labelId: string; //id of the visible label, since this is a group of controls rather than one input
}

interface Phone {
  iso: string;
  code: string; //country calling code, without the +
  number: string; //the rest of the number, as shown in the input
}

//a country code picker next to the number, which is formatted as it's typed. Defaults to +1
export function PhoneNumberInput({ value, onChange, labelId }: PhoneNumberInputProps) {
  const [phone, setPhone] = useState(() => fromE164(value));
  const numberRef = useRef<HTMLInputElement>(null);

  const update = (next: Phone) => {
    setPhone(next);
    const digits = next.number.replace(/\D/g, '');
    onChange(digits ? `+${next.code}${digits}` : '');
  };
  const pick = (country: Country) => {
    update({ iso: country.iso, code: country.code, number: formatNational(country.code, phone.number) });
    numberRef.current?.focus(); //straight on to typing the number
  };

  return (
    <div role="group" aria-labelledby={labelId} style={styles.row}>
      <CountryCodePicker value={phone} onPick={pick} />
      <input
        ref={numberRef}
        style={styles.number}
        type="tel"
        autoComplete="tel" //a full autofilled number also picks the country, see typed
        aria-labelledby={labelId}
        required
        value={phone.number}
        onChange={(e) => update(typed(phone, e.target.value))}
      />
    </div>
  );
}

//the phone a starting value means, or +1 with no number
function fromE164(value: string): Phone {
  const digits = value.replace(/\D/g, '');
  const country = digits ? findCountry(digits) : undefined;
  if (!country) return { iso: 'US', code: '1', number: '' };
  return { iso: country.iso, code: country.code, number: formatNational(country.code, digits.slice(country.code.length)) };
}

//the next phone after the number input changes. A full international number (typed with a +, pasted,
//or autofilled) also picks the country from its calling code
function typed(phone: Phone, raw: string): Phone {
  if (raw.trim().startsWith('+')) {
    const digits = raw.replace(/\D/g, '');
    const country = findCountry(digits, phone.iso);
    if (country) return { iso: country.iso, code: country.code, number: formatNational(country.code, digits.slice(country.code.length)) };
  }
  return { ...phone, number: formatNational(phone.code, raw) };
}

//formats the number as it's typed: 555-123-4567 for +1, dashed groups of 3 everywhere else
//(with a lone digit at the end joining the group before it, so 791-112-3456 not 791-112-345-6)
function formatNational(code: string, raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 15 - code.length); //E.164 allows at most 15 digits in total
  if (code === '1') return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)].filter(Boolean).join('-');
  const groups = digits.match(/.{1,3}/g) ?? [];
  if (groups.length > 1 && groups.at(-1)!.length === 1) groups.splice(-2, 2, groups.at(-2)! + groups.at(-1));
  return groups.join('-');
}

/* ---------------------------------------------------------------------------------------------
 * styles
 * ------------------------------------------------------------------------------------------- */

const gunmetal = 'var(--gunmetal-black)';
const brownRed = 'var(--brown-red)';
const ivory = 'var(--ivory-white)';
const rounded = '14px 8px 16px 10px / 8px 16px 10px 14px';

const box: CSSProperties = {
  background: ivory,
  color: gunmetal,
  border: `3px solid ${gunmetal}`,
  borderRadius: rounded,
  outlineColor: brownRed,
};

const styles: Record<string, CSSProperties> = {
  row: {
    display: 'flex',
    gap: 8,
  },
  number: {
    ...box,
    flex: 1,
    width: '100%',
    minWidth: 0, //lets it shrink beside the picker on narrow screens
    padding: '8px 12px',
    fontSize: 20,
  },
};
