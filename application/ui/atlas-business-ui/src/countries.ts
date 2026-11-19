//every country and territory with its own calling code, and the country a full international number starts with.
//The same list as atlas-of-us-ui's country code picker, so a number logs in the same way on both sites

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

export const COUNTRIES = RAW_COUNTRIES.map((c) => ({ ...c, areaCodes: NANP_AREA_CODES[c.iso] })).sort((a, b) => a.name.localeCompare(b.name));

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
export function findCountry(digits: string, current?: string): Country | undefined {
  const matches = COUNTRIES.filter((c) => digits.startsWith(c.code));
  const longest = Math.max(0, ...matches.map((c) => c.code.length));
  const best = matches.filter((c) => c.code.length === longest);
  return byAreaCode(digits) ?? best.find((c) => c.iso === current) ?? best.find((c) => PRIMARY_ISO[c.code] === c.iso) ?? best[0];
}

//the national digits and country a phone input's new value means. A full international number (typed with a + or
//00, pasted, or autofilled) picks its country from its calling code. One autofilled or pasted with its country code
//but no + (14403849524 with +1 picked) loses the code: a +1 number never starts with 1, so a leading 1 there is
//always the code, and elsewhere it's the code when it arrives all at once with enough digits after it to be a whole
//number
export function typedPhone(iso: string, before: string, raw: string): { iso: string; number: string } {
  const digits = raw.replace(/\D/g, '');
  const international = raw.trim().startsWith('+') ? digits : raw.trim().startsWith('00') ? digits.slice(2) : '';
  if (international) {
    const country = findCountry(international, iso);
    if (country) return { iso: country.iso, number: formatNational(country.code, international.slice(country.code.length)) };
  }
  const code = COUNTRIES.find((c) => c.iso === iso)?.code ?? '1';
  if (code === '1') return { iso, number: formatNational(code, digits.replace(/^1/, '')) };
  const filled = digits.length - before.replace(/\D/g, '').length > 1;
  return { iso, number: formatNational(code, filled && digits.startsWith(code) && digits.length - code.length >= 8 ? digits.slice(code.length) : digits) };
}

//the number as it's shown while typing: 555-123-4567 for +1, dashed groups of 3 everywhere else (with a lone digit
//at the end joining the group before it), as on atlas-of-us.com
function formatNational(code: string, digits: string) {
  const kept = digits.slice(0, 15 - code.length); //E.164 allows at most 15 digits in total
  if (code === '1') return [kept.slice(0, 3), kept.slice(3, 6), kept.slice(6, 10)].filter(Boolean).join('-');
  const groups = kept.match(/.{1,3}/g) ?? [];
  if (groups.length > 1 && groups.at(-1)!.length === 1) groups.splice(-2, 2, groups.at(-2)! + groups.at(-1));
  return groups.join('-');
}
