import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type RefObject } from 'react';

//a button showing the picked flag and code, which opens a search box over a list of every country
interface CountryCodePickerProps {
  value: { iso: string; code: string }; //iso is '' for a code the user typed in themselves
  onPick: (country: Country) => void;
}

export function CountryCodePicker({ value, onPick }: CountryCodePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0); //index into matches of the highlighted option
  const matches = useMemo(() => searchCountries(query), [query]);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const optionId = (i: number) => `${id}-option-${i}`;

  const current = COUNTRIES.find((c) => c.iso === value.iso);
  const label = current ? `${current.name} +${current.code}` : `+${value.code}`;

  const show = () => {
    setQuery('');
    setActive(Math.max(0, COUNTRIES.findIndex((c) => c.iso === value.iso))); //start on the current country
    setOpen(true);
  };
  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };
  const choose = (country: Country | undefined) => {
    if (!country) return;
    setOpen(false);
    onPick(country);
  };

  useDismiss(rootRef, open, () => setOpen(false)); //click anywhere else to close

  //keep the highlighted option in view while arrowing through the list
  useEffect(() => {
    if (open) document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [id, open, active, matches]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const last = matches.length - 1;
    const keys: Record<string, () => void> = {
      ArrowDown: () => setActive((i) => Math.min(last, i + 1)),
      ArrowUp: () => setActive((i) => Math.max(0, i - 1)),
      PageDown: () => setActive((i) => Math.min(last, i + 8)),
      PageUp: () => setActive((i) => Math.max(0, i - 8)),
      Enter: () => choose(matches[active]), //and don't submit the form
      Escape: () => close(true),
    };
    if (e.key === 'Tab') return setOpen(false); //let focus move on as normal
    if (!keys[e.key]) return;
    e.preventDefault();
    e.stopPropagation(); //an Escape here shouldn't also close anything around the form
    keys[e.key]();
  };

  return (
    <div ref={rootRef} style={styles.picker}>
      <button
        ref={triggerRef}
        type="button"
        style={styles.trigger}
        aria-label={`Country code: ${label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close(false) : show())}
      >
        <Flag iso={value.iso} />
        <span>+{value.code || '?'}</span>
        <span style={styles.caret} aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div style={styles.popover}>
          <input
            autoFocus
            style={styles.search}
            role="combobox"
            aria-label="Search countries"
            aria-expanded
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-activedescendant={matches.length ? optionId(active) : undefined}
            placeholder="Search a country or +code"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
          />
          <ul id={`${id}-list`} role="listbox" aria-label="Countries" style={styles.list}>
            {matches.map((c, i) => {
              const selected = c.iso === value.iso && c.code === value.code;
              return (
                <li
                  key={c.iso || `custom-${c.code}`}
                  id={optionId(i)}
                  role="option"
                  aria-selected={selected}
                  style={{ ...styles.option, ...(i === active ? styles.active : undefined) }}
                  onPointerMove={() => i !== active && setActive(i)}
                  onPointerDown={(e) => e.preventDefault()} //keep focus in the search box
                  onClick={() => choose(c)}
                >
                  <Flag iso={c.iso} />
                  <span style={styles.name}>{c.name}</span>
                  <span style={styles.code}>+{c.code}</span>
                  <span style={styles.check} aria-hidden>
                    {selected ? '✓' : ''}
                  </span>
                </li>
              );
            })}
            {!matches.length && <li style={styles.empty}>No country matches “{query}”</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

//every flag-icons svg as its own file, keyed by file name. only the flags actually shown get downloaded,
//instead of flag-icons' stylesheet, which is 430KB of css pointing at every flag in two shapes
const FLAG_URLS = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>('../../node_modules/flag-icons/flags/4x3/*.svg', { query: '?no-inline', import: 'default', eager: true }),
  ).map(([path, url]) => [path.split('/').pop()!.replace('.svg', ''), url]),
);

//ascension and tristan da cunha are filed under st. helena in flag-icons
const FLAG_FILES: Record<string, string> = { AC: 'sh-ac', TA: 'sh-ta' };

//a flag from flag-icons. A drawn globe for a code the user typed in themselves, or one flag-icons doesn't have
function Flag({ iso }: { iso: string }) {
  const url = iso && FLAG_URLS[FLAG_FILES[iso] ?? iso.toLowerCase()];
  if (!url)
    return (
      <svg style={styles.flagImage} viewBox="0 0 29 22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <circle cx="14.5" cy="11" r="9" />
        <ellipse cx="14.5" cy="11" rx="4" ry="9" />
        <path d="M5.5 11h18" />
      </svg>
    );
  return <img src={url} alt="" loading="lazy" style={styles.flagImage} />;
}

//calls onDismiss for a pointer down anywhere outside ref while open
function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, onDismiss: () => void) {
  const dismiss = useRef(onDismiss);
  useEffect(() => {
    dismiss.current = onDismiss;
  });
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) dismiss.current();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [ref, open]);
}

/* ---------------------------------------------------------------------------------------------
 * countries
 * ------------------------------------------------------------------------------------------- */

export interface Country {
  iso: string; //ISO 3166 alpha-2, also used for the flag. Empty for a code the user typed in themselves
  name: string;
  code: string; //country calling code, without the +
  aliases?: string[]; //other names people search by
  areaCodes?: string[]; //for countries sharing +1, the area codes that are theirs
}

//every country and territory with its own calling code. Countries sharing a code (e.g. the +1 NANP ones)
//are listed separately so people can find their own; PRIMARY_ISO says which one a bare code means
const RAW_COUNTRIES: Country[] = [
  { iso: 'AF', name: 'Afghanistan', code: '93' },
  { iso: 'AX', name: 'Åland Islands', code: '358' },
  { iso: 'AL', name: 'Albania', code: '355' },
  { iso: 'DZ', name: 'Algeria', code: '213' },
  { iso: 'AS', name: 'American Samoa', code: '1' },
  { iso: 'AD', name: 'Andorra', code: '376' },
  { iso: 'AO', name: 'Angola', code: '244' },
  { iso: 'AI', name: 'Anguilla', code: '1' },
  { iso: 'AQ', name: 'Antarctica', code: '672' },
  { iso: 'AG', name: 'Antigua and Barbuda', code: '1' },
  { iso: 'AR', name: 'Argentina', code: '54' },
  { iso: 'AM', name: 'Armenia', code: '374' },
  { iso: 'AW', name: 'Aruba', code: '297' },
  { iso: 'AC', name: 'Ascension Island', code: '247' },
  { iso: 'AU', name: 'Australia', code: '61' },
  { iso: 'AT', name: 'Austria', code: '43', aliases: ['Österreich'] },
  { iso: 'AZ', name: 'Azerbaijan', code: '994' },
  { iso: 'BS', name: 'Bahamas', code: '1' },
  { iso: 'BH', name: 'Bahrain', code: '973' },
  { iso: 'BD', name: 'Bangladesh', code: '880' },
  { iso: 'BB', name: 'Barbados', code: '1' },
  { iso: 'BY', name: 'Belarus', code: '375' },
  { iso: 'BE', name: 'Belgium', code: '32', aliases: ['België', 'Belgique'] },
  { iso: 'BZ', name: 'Belize', code: '501' },
  { iso: 'BJ', name: 'Benin', code: '229' },
  { iso: 'BM', name: 'Bermuda', code: '1' },
  { iso: 'BT', name: 'Bhutan', code: '975' },
  { iso: 'BO', name: 'Bolivia', code: '591' },
  { iso: 'BA', name: 'Bosnia and Herzegovina', code: '387' },
  { iso: 'BW', name: 'Botswana', code: '267' },
  { iso: 'BR', name: 'Brazil', code: '55', aliases: ['Brasil'] },
  { iso: 'IO', name: 'British Indian Ocean Territory', code: '246', aliases: ['Diego Garcia'] },
  { iso: 'VG', name: 'British Virgin Islands', code: '1' },
  { iso: 'BN', name: 'Brunei', code: '673' },
  { iso: 'BG', name: 'Bulgaria', code: '359' },
  { iso: 'BF', name: 'Burkina Faso', code: '226' },
  { iso: 'BI', name: 'Burundi', code: '257' },
  { iso: 'KH', name: 'Cambodia', code: '855' },
  { iso: 'CM', name: 'Cameroon', code: '237' },
  { iso: 'CA', name: 'Canada', code: '1' },
  { iso: 'CV', name: 'Cape Verde', code: '238', aliases: ['Cabo Verde'] },
  { iso: 'BQ', name: 'Caribbean Netherlands', code: '599', aliases: ['Bonaire', 'Sint Eustatius', 'Saba'] },
  { iso: 'KY', name: 'Cayman Islands', code: '1' },
  { iso: 'CF', name: 'Central African Republic', code: '236' },
  { iso: 'TD', name: 'Chad', code: '235' },
  { iso: 'CL', name: 'Chile', code: '56' },
  { iso: 'CN', name: 'China', code: '86', aliases: ['Zhongguo'] },
  { iso: 'CX', name: 'Christmas Island', code: '61' },
  { iso: 'CC', name: 'Cocos (Keeling) Islands', code: '61' },
  { iso: 'CO', name: 'Colombia', code: '57' },
  { iso: 'KM', name: 'Comoros', code: '269' },
  { iso: 'CG', name: 'Congo - Brazzaville', code: '242', aliases: ['Republic of the Congo'] },
  { iso: 'CD', name: 'Congo - Kinshasa', code: '243', aliases: ['Democratic Republic of the Congo', 'DRC', 'Zaire'] },
  { iso: 'CK', name: 'Cook Islands', code: '682' },
  { iso: 'CR', name: 'Costa Rica', code: '506' },
  { iso: 'CI', name: "Côte d'Ivoire", code: '225', aliases: ['Ivory Coast'] },
  { iso: 'HR', name: 'Croatia', code: '385', aliases: ['Hrvatska'] },
  { iso: 'CU', name: 'Cuba', code: '53' },
  { iso: 'CW', name: 'Curaçao', code: '599' },
  { iso: 'CY', name: 'Cyprus', code: '357' },
  { iso: 'CZ', name: 'Czechia', code: '420', aliases: ['Czech Republic'] },
  { iso: 'DK', name: 'Denmark', code: '45', aliases: ['Danmark'] },
  { iso: 'DJ', name: 'Djibouti', code: '253' },
  { iso: 'DM', name: 'Dominica', code: '1' },
  { iso: 'DO', name: 'Dominican Republic', code: '1' },
  { iso: 'EC', name: 'Ecuador', code: '593' },
  { iso: 'EG', name: 'Egypt', code: '20' },
  { iso: 'SV', name: 'El Salvador', code: '503' },
  { iso: 'GQ', name: 'Equatorial Guinea', code: '240' },
  { iso: 'ER', name: 'Eritrea', code: '291' },
  { iso: 'EE', name: 'Estonia', code: '372', aliases: ['Eesti'] },
  { iso: 'SZ', name: 'Eswatini', code: '268', aliases: ['Swaziland'] },
  { iso: 'ET', name: 'Ethiopia', code: '251' },
  { iso: 'FK', name: 'Falkland Islands', code: '500', aliases: ['Malvinas'] },
  { iso: 'FO', name: 'Faroe Islands', code: '298' },
  { iso: 'FJ', name: 'Fiji', code: '679' },
  { iso: 'FI', name: 'Finland', code: '358', aliases: ['Suomi'] },
  { iso: 'FR', name: 'France', code: '33' },
  { iso: 'GF', name: 'French Guiana', code: '594' },
  { iso: 'PF', name: 'French Polynesia', code: '689', aliases: ['Tahiti'] },
  { iso: 'GA', name: 'Gabon', code: '241' },
  { iso: 'GM', name: 'Gambia', code: '220' },
  { iso: 'GE', name: 'Georgia', code: '995', aliases: ['Sakartvelo'] },
  { iso: 'DE', name: 'Germany', code: '49', aliases: ['Deutschland'] },
  { iso: 'GH', name: 'Ghana', code: '233' },
  { iso: 'GI', name: 'Gibraltar', code: '350' },
  { iso: 'GR', name: 'Greece', code: '30', aliases: ['Hellas', 'Ellada'] },
  { iso: 'GL', name: 'Greenland', code: '299', aliases: ['Kalaallit Nunaat'] },
  { iso: 'GD', name: 'Grenada', code: '1' },
  { iso: 'GP', name: 'Guadeloupe', code: '590' },
  { iso: 'GU', name: 'Guam', code: '1' },
  { iso: 'GT', name: 'Guatemala', code: '502' },
  { iso: 'GG', name: 'Guernsey', code: '44' },
  { iso: 'GN', name: 'Guinea', code: '224' },
  { iso: 'GW', name: 'Guinea-Bissau', code: '245' },
  { iso: 'GY', name: 'Guyana', code: '592' },
  { iso: 'HT', name: 'Haiti', code: '509' },
  { iso: 'HN', name: 'Honduras', code: '504' },
  { iso: 'HK', name: 'Hong Kong', code: '852' },
  { iso: 'HU', name: 'Hungary', code: '36', aliases: ['Magyarország'] },
  { iso: 'IS', name: 'Iceland', code: '354', aliases: ['Ísland'] },
  { iso: 'IN', name: 'India', code: '91', aliases: ['Bharat'] },
  { iso: 'ID', name: 'Indonesia', code: '62' },
  { iso: 'IR', name: 'Iran', code: '98', aliases: ['Persia'] },
  { iso: 'IQ', name: 'Iraq', code: '964' },
  { iso: 'IE', name: 'Ireland', code: '353', aliases: ['Éire'] },
  { iso: 'IM', name: 'Isle of Man', code: '44' },
  { iso: 'IL', name: 'Israel', code: '972' },
  { iso: 'IT', name: 'Italy', code: '39', aliases: ['Italia'] },
  { iso: 'JM', name: 'Jamaica', code: '1' },
  { iso: 'JP', name: 'Japan', code: '81', aliases: ['Nippon', 'Nihon'] },
  { iso: 'JE', name: 'Jersey', code: '44' },
  { iso: 'JO', name: 'Jordan', code: '962' },
  { iso: 'KZ', name: 'Kazakhstan', code: '7' },
  { iso: 'KE', name: 'Kenya', code: '254' },
  { iso: 'KI', name: 'Kiribati', code: '686' },
  { iso: 'XK', name: 'Kosovo', code: '383' },
  { iso: 'KW', name: 'Kuwait', code: '965' },
  { iso: 'KG', name: 'Kyrgyzstan', code: '996' },
  { iso: 'LA', name: 'Laos', code: '856', aliases: ['Lao'] },
  { iso: 'LV', name: 'Latvia', code: '371', aliases: ['Latvija'] },
  { iso: 'LB', name: 'Lebanon', code: '961' },
  { iso: 'LS', name: 'Lesotho', code: '266' },
  { iso: 'LR', name: 'Liberia', code: '231' },
  { iso: 'LY', name: 'Libya', code: '218' },
  { iso: 'LI', name: 'Liechtenstein', code: '423' },
  { iso: 'LT', name: 'Lithuania', code: '370', aliases: ['Lietuva'] },
  { iso: 'LU', name: 'Luxembourg', code: '352' },
  { iso: 'MO', name: 'Macao', code: '853', aliases: ['Macau'] },
  { iso: 'MG', name: 'Madagascar', code: '261' },
  { iso: 'MW', name: 'Malawi', code: '265' },
  { iso: 'MY', name: 'Malaysia', code: '60' },
  { iso: 'MV', name: 'Maldives', code: '960' },
  { iso: 'ML', name: 'Mali', code: '223' },
  { iso: 'MT', name: 'Malta', code: '356' },
  { iso: 'MH', name: 'Marshall Islands', code: '692' },
  { iso: 'MQ', name: 'Martinique', code: '596' },
  { iso: 'MR', name: 'Mauritania', code: '222' },
  { iso: 'MU', name: 'Mauritius', code: '230' },
  { iso: 'YT', name: 'Mayotte', code: '262' },
  { iso: 'MX', name: 'Mexico', code: '52', aliases: ['México'] },
  { iso: 'FM', name: 'Micronesia', code: '691' },
  { iso: 'MD', name: 'Moldova', code: '373' },
  { iso: 'MC', name: 'Monaco', code: '377' },
  { iso: 'MN', name: 'Mongolia', code: '976' },
  { iso: 'ME', name: 'Montenegro', code: '382', aliases: ['Crna Gora'] },
  { iso: 'MS', name: 'Montserrat', code: '1' },
  { iso: 'MA', name: 'Morocco', code: '212' },
  { iso: 'MZ', name: 'Mozambique', code: '258' },
  { iso: 'MM', name: 'Myanmar', code: '95', aliases: ['Burma'] },
  { iso: 'NA', name: 'Namibia', code: '264' },
  { iso: 'NR', name: 'Nauru', code: '674' },
  { iso: 'NP', name: 'Nepal', code: '977' },
  { iso: 'NL', name: 'Netherlands', code: '31', aliases: ['Holland', 'Nederland'] },
  { iso: 'NC', name: 'New Caledonia', code: '687' },
  { iso: 'NZ', name: 'New Zealand', code: '64', aliases: ['Aotearoa'] },
  { iso: 'NI', name: 'Nicaragua', code: '505' },
  { iso: 'NE', name: 'Niger', code: '227' },
  { iso: 'NG', name: 'Nigeria', code: '234' },
  { iso: 'NU', name: 'Niue', code: '683' },
  { iso: 'NF', name: 'Norfolk Island', code: '672' },
  { iso: 'KP', name: 'North Korea', code: '850', aliases: ['Korea', 'DPRK'] },
  { iso: 'MK', name: 'North Macedonia', code: '389', aliases: ['Macedonia'] },
  { iso: 'MP', name: 'Northern Mariana Islands', code: '1', aliases: ['Saipan'] },
  { iso: 'NO', name: 'Norway', code: '47', aliases: ['Norge'] },
  { iso: 'OM', name: 'Oman', code: '968' },
  { iso: 'PK', name: 'Pakistan', code: '92' },
  { iso: 'PW', name: 'Palau', code: '680' },
  { iso: 'PS', name: 'Palestine', code: '970' },
  { iso: 'PA', name: 'Panama', code: '507' },
  { iso: 'PG', name: 'Papua New Guinea', code: '675' },
  { iso: 'PY', name: 'Paraguay', code: '595' },
  { iso: 'PE', name: 'Peru', code: '51' },
  { iso: 'PH', name: 'Philippines', code: '63', aliases: ['Pilipinas'] },
  { iso: 'PN', name: 'Pitcairn Islands', code: '64' },
  { iso: 'PL', name: 'Poland', code: '48', aliases: ['Polska'] },
  { iso: 'PT', name: 'Portugal', code: '351' },
  { iso: 'PR', name: 'Puerto Rico', code: '1' },
  { iso: 'QA', name: 'Qatar', code: '974' },
  { iso: 'RE', name: 'Réunion', code: '262' },
  { iso: 'RO', name: 'Romania', code: '40', aliases: ['România'] },
  { iso: 'RU', name: 'Russia', code: '7', aliases: ['Russian Federation', 'Rossiya'] },
  { iso: 'RW', name: 'Rwanda', code: '250' },
  { iso: 'WS', name: 'Samoa', code: '685' },
  { iso: 'SM', name: 'San Marino', code: '378' },
  { iso: 'ST', name: 'São Tomé and Príncipe', code: '239' },
  { iso: 'SA', name: 'Saudi Arabia', code: '966', aliases: ['KSA'] },
  { iso: 'SN', name: 'Senegal', code: '221' },
  { iso: 'RS', name: 'Serbia', code: '381', aliases: ['Srbija'] },
  { iso: 'SC', name: 'Seychelles', code: '248' },
  { iso: 'SL', name: 'Sierra Leone', code: '232' },
  { iso: 'SG', name: 'Singapore', code: '65' },
  { iso: 'SX', name: 'Sint Maarten', code: '1' },
  { iso: 'SK', name: 'Slovakia', code: '421', aliases: ['Slovensko'] },
  { iso: 'SI', name: 'Slovenia', code: '386', aliases: ['Slovenija'] },
  { iso: 'SB', name: 'Solomon Islands', code: '677' },
  { iso: 'SO', name: 'Somalia', code: '252' },
  { iso: 'ZA', name: 'South Africa', code: '27', aliases: ['RSA'] },
  { iso: 'KR', name: 'South Korea', code: '82', aliases: ['Korea', 'Republic of Korea'] },
  { iso: 'SS', name: 'South Sudan', code: '211' },
  { iso: 'ES', name: 'Spain', code: '34', aliases: ['España'] },
  { iso: 'LK', name: 'Sri Lanka', code: '94' },
  { iso: 'BL', name: 'St. Barthélemy', code: '590', aliases: ['St. Barts'] },
  { iso: 'SH', name: 'St. Helena', code: '290' },
  { iso: 'KN', name: 'St. Kitts and Nevis', code: '1' },
  { iso: 'LC', name: 'St. Lucia', code: '1' },
  { iso: 'MF', name: 'St. Martin', code: '590' },
  { iso: 'PM', name: 'St. Pierre and Miquelon', code: '508' },
  { iso: 'VC', name: 'St. Vincent and the Grenadines', code: '1' },
  { iso: 'SD', name: 'Sudan', code: '249' },
  { iso: 'SR', name: 'Suriname', code: '597' },
  { iso: 'SJ', name: 'Svalbard and Jan Mayen', code: '47' },
  { iso: 'SE', name: 'Sweden', code: '46', aliases: ['Sverige'] },
  { iso: 'CH', name: 'Switzerland', code: '41', aliases: ['Schweiz', 'Suisse', 'Svizzera'] },
  { iso: 'SY', name: 'Syria', code: '963' },
  { iso: 'TW', name: 'Taiwan', code: '886' },
  { iso: 'TJ', name: 'Tajikistan', code: '992' },
  { iso: 'TZ', name: 'Tanzania', code: '255', aliases: ['Zanzibar'] },
  { iso: 'TH', name: 'Thailand', code: '66' },
  { iso: 'TL', name: 'Timor-Leste', code: '670', aliases: ['East Timor'] },
  { iso: 'TG', name: 'Togo', code: '228' },
  { iso: 'TK', name: 'Tokelau', code: '690' },
  { iso: 'TO', name: 'Tonga', code: '676' },
  { iso: 'TT', name: 'Trinidad and Tobago', code: '1' },
  { iso: 'TA', name: 'Tristan da Cunha', code: '290' },
  { iso: 'TN', name: 'Tunisia', code: '216' },
  { iso: 'TR', name: 'Türkiye', code: '90', aliases: ['Turkey'] },
  { iso: 'TM', name: 'Turkmenistan', code: '993' },
  { iso: 'TC', name: 'Turks and Caicos Islands', code: '1' },
  { iso: 'TV', name: 'Tuvalu', code: '688' },
  { iso: 'VI', name: 'U.S. Virgin Islands', code: '1', aliases: ['US Virgin Islands'] },
  { iso: 'UG', name: 'Uganda', code: '256' },
  { iso: 'UA', name: 'Ukraine', code: '380', aliases: ['Ukraina'] },
  { iso: 'AE', name: 'United Arab Emirates', code: '971', aliases: ['UAE', 'Emirates', 'Dubai', 'Abu Dhabi'] },
  { iso: 'GB', name: 'United Kingdom', code: '44', aliases: ['UK', 'Great Britain', 'Britain', 'England', 'Scotland', 'Wales', 'Northern Ireland'] },
  { iso: 'US', name: 'United States', code: '1', aliases: ['USA', 'America', 'United States of America'] },
  { iso: 'UY', name: 'Uruguay', code: '598' },
  { iso: 'UZ', name: 'Uzbekistan', code: '998' },
  { iso: 'VU', name: 'Vanuatu', code: '678' },
  { iso: 'VA', name: 'Vatican City', code: '39', aliases: ['Holy See'] },
  { iso: 'VE', name: 'Venezuela', code: '58' },
  { iso: 'VN', name: 'Vietnam', code: '84', aliases: ['Viet Nam'] },
  { iso: 'WF', name: 'Wallis and Futuna', code: '681' },
  { iso: 'EH', name: 'Western Sahara', code: '212' },
  { iso: 'YE', name: 'Yemen', code: '967' },
  { iso: 'ZM', name: 'Zambia', code: '260' },
  { iso: 'ZW', name: 'Zimbabwe', code: '263' },
];

//the +1 countries other than the US and Canada each have their own area codes, so +1 242 is the Bahamas
const NANP_AREA_CODES: Record<string, string[]> = {
  AG: ['268'],
  AI: ['264'],
  AS: ['684'],
  BB: ['246'],
  BM: ['441'],
  BS: ['242'],
  DM: ['767'],
  DO: ['809', '829', '849'],
  GD: ['473'],
  GU: ['671'],
  JM: ['876', '658'],
  KN: ['869'],
  KY: ['345'],
  LC: ['758'],
  MP: ['670'],
  MS: ['664'],
  PR: ['787', '939'],
  SX: ['721'],
  TC: ['649'],
  TT: ['868'],
  VC: ['784'],
  VG: ['284'],
  VI: ['340'],
};

const COUNTRIES = RAW_COUNTRIES.map((c) => ({ ...c, areaCodes: NANP_AREA_CODES[c.iso] })).sort((a, b) => a.name.localeCompare(b.name));

//the country whose area code starts these digits (which include the calling code), if any
const byAreaCode = (digits: string) => COUNTRIES.find((c) => c.areaCodes?.some((area) => digits.startsWith(c.code + area)));

//which country a shared calling code means when we have nothing else to go on
const PRIMARY_ISO: Record<string, string> = {
  '1': 'US',
  '7': 'RU',
  '39': 'IT',
  '44': 'GB',
  '47': 'NO',
  '61': 'AU',
  '64': 'NZ',
  '212': 'MA',
  '262': 'RE',
  '290': 'SH',
  '358': 'FI',
  '590': 'GP',
  '599': 'CW',
  '672': 'NF',
};

/* ---------------------------------------------------------------------------------------------
 * search
 * ------------------------------------------------------------------------------------------- */

//the country a full international number's digits start with, e.g. 447911123456 is the UK. An area code
//that belongs to one country wins (+1 242 is the Bahamas), then current if it fits (a Canadian pasting a +1
//number stays Canadian), then the main country for that code
// eslint-disable-next-line react-refresh/only-export-components -- a lookup the phone number input shares
export function findCountry(digits: string, current?: string): Country | undefined {
  const matches = COUNTRIES.filter((c) => digits.startsWith(c.code));
  const longest = Math.max(0, ...matches.map((c) => c.code.length));
  const best = matches.filter((c) => c.code.length === longest);
  return byAreaCode(digits) ?? best.find((c) => c.iso === current) ?? best.find((c) => PRIMARY_ISO[c.code] === c.iso) ?? best[0];
}

//lowercase, no accents or punctuation, so "cote divoire" finds Côte d'Ivoire and "st kitts" finds St. Kitts
const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

//every name each country can be found by, normalized once up front. St. places can also be found as Saint
const SEARCH_TERMS = new Map(
  COUNTRIES.map((c) => {
    const names = [c.name, ...(c.aliases ?? [])].map(normalize);
    return [c.iso, [...names, ...names.filter((n) => n.startsWith('st ')).map((n) => `saint ${n.slice(3)}`)]];
  }),
);

//countries matching what's typed: a name, alias, ISO code, or calling code (with or without the +).
//Best matches first, alphabetical within each
function searchCountries(query: string): Country[] {
  const q = normalize(query);
  if (!q) return COUNTRIES;

  //a calling code, or the start of a whole number
  if (/^\+?[\d\s-]+$/.test(query.trim())) {
    const digits = q.replace(/\D/g, '');
    const area = byAreaCode(digits);
    const rank = (c: Country) =>
      c === area ? 0
      : c.code === digits ? (PRIMARY_ISO[c.code] === c.iso ? 1 : 2)
      : digits.startsWith(c.code) ? 3
      : c.code.startsWith(digits) ? 4
      : -1;
    const found = rankBy(COUNTRIES, rank);
    //a code we don't know, e.g. a brand new one, can still be used as is
    return found.length || digits.length > 3 ? found : [{ iso: '', name: 'Use this code', code: digits }];
  }

  const rank = (c: Country) => {
    const terms = SEARCH_TERMS.get(c.iso)!;
    if (c.iso.toLowerCase() === q || terms.includes(q)) return 0;
    if (terms.some((t) => t.startsWith(q))) return 1;
    if (terms.some((t) => t.split(' ').some((word) => word.startsWith(q)))) return 2;
    if (terms.some((t) => t.includes(q))) return 3;
    return -1;
  };
  return rankBy(COUNTRIES, rank);
}

//keeps the countries ranked 0 or higher, lowest rank first. sort is stable so each rank stays alphabetical
function rankBy(countries: Country[], rank: (c: Country) => number) {
  return countries
    .map((c) => ({ c, r: rank(c) }))
    .filter(({ r }) => r >= 0)
    .sort((a, b) => a.r - b.r)
    .map(({ c }) => c);
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
  picker: {
    position: 'relative',
    flexShrink: 0,
  },
  trigger: {
    ...box,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    fontSize: 20,
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  flagImage: {
    width: 29, //flag-icons' 4:3 at the old 22px font size
    height: 22,
    flexShrink: 0,
    objectFit: 'contain',
  },
  caret: {
    fontSize: 14,
    opacity: 0.7,
  },
  popover: {
    ...box,
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    zIndex: 20,
    width: 'min(340px, calc(100vw - 48px))',
    padding: 8,
    background: '#fff',
    boxShadow: `4px 5px 0 ${gunmetal}`,
  },
  search: {
    ...box,
    width: '100%',
    padding: '6px 10px',
    fontSize: 18,
  },
  list: {
    listStyle: 'none',
    margin: '8px 0 0',
    padding: 0,
    maxHeight: 264,
    overflowY: 'auto',
    overscrollBehavior: 'contain',
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 8px',
    borderRadius: 8,
    fontSize: 18,
    cursor: 'pointer',
  },
  active: {
    background: 'var(--pale-blue)',
  },
  name: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  code: {
    opacity: 0.65,
    fontVariantNumeric: 'tabular-nums',
  },
  check: {
    width: 14,
    color: brownRed,
  },
  empty: {
    padding: '10px 8px',
    fontSize: 17,
    opacity: 0.65,
  },
};
