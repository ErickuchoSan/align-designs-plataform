'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { countries as allCountries, type Country } from '../../../app/utils/countries';
import { cn, INPUT_BASE, INPUT_VARIANTS } from '@/lib/styles';
import { ChevronDownIcon, CloseIcon, SearchIcon, SpinnerIcon } from '@/components/ui/icons';
import { useClickOutside } from '@/hooks';

interface CountryCodeSelectorProps {
  value: string;
  onChange: (dialCode: string) => void;
  className?: string;
}

// American continent countries only (North, Central, South America, and Caribbean)
const AMERICAN_COUNTRIES = new Set([
  'US', 'CA', 'MX', // North America
  'GT', 'BZ', 'SV', 'HN', 'NI', 'CR', 'PA', // Central America
  'AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'GY', 'PY', 'PE', 'SR', 'UY', 'VE', // South America
  'CU', 'DO', 'HT', 'JM', 'TT', 'BB', 'BS', 'AG', 'DM', 'GD', 'KN', 'LC', 'VC', // Caribbean
]);

// Popular countries within Americas to show first (US first for US-based clients)
const POPULAR_COUNTRY_CODES = new Set(['US', 'CA', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'BR']);
const POPULAR_COUNTRY_CODES_ARRAY = ['US', 'CA', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'BR'];

export default function CountryCodeSelector({ value, onChange, className = '' }: Readonly<CountryCodeSelectorProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter countries statically
  const countries = useMemo(() =>
    allCountries.filter(c => AMERICAN_COUNTRIES.has(c.code)),
    []);

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Set initial selection
  useEffect(() => {
    setSelectedCountry(countries.find(c => c.dialCode === value) || countries[0]);
  }, [value, countries]);

  // Close dropdown on click outside
  const handleClickOutside = useCallback(() => {
    setIsOpen(false);
    setSearchTerm('');
  }, []);

  useClickOutside(dropdownRef, handleClickOutside, isOpen);

  // Intelligent search with prioritization
  const filteredCountries = useMemo(() => {
    // Return empty if countries haven't loaded yet
    if (countries.length === 0) return [];

    if (!searchTerm.trim()) {
      // No search: show popular countries first, then the rest
      const popularCountries = countries.filter(c => POPULAR_COUNTRY_CODES.has(c.code));
      const otherCountries = countries.filter(c => !POPULAR_COUNTRY_CODES.has(c.code));
      return [...popularCountries, ...otherCountries];
    }

    const search = searchTerm.toLowerCase().trim();

    // Auto-add + to numeric searches
    const searchWithPlus = search.match(/^\d/) ? `+${search}` : search;

    const matches = countries.filter(country => {
      const nameMatch = country.name.toLowerCase().includes(search);
      const codeMatch = country.code.toLowerCase().includes(search);
      const dialCodeMatch = country.dialCode.includes(search) || country.dialCode.includes(searchWithPlus);

      return nameMatch || codeMatch || dialCodeMatch;
    });

    // Sort matches by relevance using a scoring function
    const getScore = (country: Country): number => {
      const name = country.name.toLowerCase();
      const popularIdx = POPULAR_COUNTRY_CODES_ARRAY.indexOf(country.code);

      if (name === search) return 100;
      if (country.dialCode === searchWithPlus) return 90;
      if (name.startsWith(search)) return 80;
      if (popularIdx !== -1) return 70 - popularIdx;
      return 0;
    };

    return matches.sort((a, b) => {
      const scoreA = getScore(a);
      const scoreB = getScore(b);
      if (scoreA !== scoreB) return scoreB - scoreA;
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
  }, [searchTerm, countries]);

  const handleSelect = (country: Country) => {
    setSelectedCountry(country);
    onChange(country.dialCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  const popularCountries = countries.filter(c => POPULAR_COUNTRY_CODES.has(c.code));
  const showingPopular = !searchTerm.trim() && popularCountries.length > 0;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, openUpward: false });

  // Calculate dropdown position when opened with smart direction detection
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 400; // Estimated max height of dropdown
      const spaceBelow = globalThis.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Open upward if not enough space below and more space above
      const shouldOpenUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setDropdownPosition({
        top: shouldOpenUpward
          ? rect.top + globalThis.scrollY - dropdownHeight - 4 // Reduced gap from 8 to 4
          : rect.bottom + globalThis.scrollY + 4, // Reduced gap from 8 to 4
        left: rect.left + globalThis.scrollX,
        width: rect.width,
        openUpward: shouldOpenUpward,
      });
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(INPUT_BASE, INPUT_VARIANTS.default, 'flex items-center justify-between gap-2 bg-white hover:bg-[#F5F4F0]', className)}
      >
        <div className="flex items-center gap-2">
          {selectedCountry ? (
            <>
              <span className="text-xl">{selectedCountry.flag}</span>
              <span className="text-sm font-semibold text-[#1B1C1A]">{selectedCountry.dialCode}</span>
            </>
          ) : (
            <span className="text-sm text-gray-400">Loading...</span>
          )}
        </div>
        <ChevronDownIcon className={cn('text-[#1B1C1A] transition-transform', isOpen && 'rotate-180')} size="md" />
      </button>

      {isOpen && (
        <div
          className={`fixed z-[9999] w-96 bg-white border border-[#D0C5B2]/20 rounded-lg shadow-sm overflow-hidden transition-opacity duration-200 ${dropdownPosition.openUpward ? 'animate-slide-up' : 'animate-slide-down'
            }`}
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            minWidth: `${dropdownPosition.width}px`,
          }}
        >
          {/* Search Input */}
          <div className="p-3 border-b border-[#D0C5B2]/20 bg-[#F5F4F0]">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6A65]" size="md" />
              <input
                type="text"
                placeholder="Search country or dial code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(INPUT_BASE, INPUT_VARIANTS.default, 'pl-10 pr-3 py-2.5 text-sm text-[#1B1C1A] placeholder:text-[#6B6A65]')}
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6A65] hover:text-[#1B1C1A]"
                >
                  <CloseIcon size="md" />
                </button>
              )}
            </div>
            {searchTerm?.match(/^\d/) && (
              <p className="mt-2 text-xs text-[#6B6A65]">
                💡 Tip: Searching for <span className="font-semibold">+{searchTerm}</span>
              </p>
            )}
          </div>

          {/* Popular Countries Header */}
          {showingPopular && filteredCountries.length > 0 && (
            <div className="px-4 py-2 bg-[#C9A84C]/20 border-b border-[#C9A84C]/20">
              <p className="text-xs font-semibold text-[#755B00]">Popular American Countries</p>
            </div>
          )}

          {/* Countries List */}
          <div className="max-h-80 overflow-y-auto">
            {countries.length === 0 && (
              <div className="p-6 text-center">
                <div className="mx-auto w-12 h-12 mb-3 flex items-center justify-center">
                  <SpinnerIcon className="w-8 h-8 text-[#C9A84C]" />
                </div>
                <p className="text-sm font-medium text-[#6B6A65]">Loading countries...</p>
              </div>
            )}
            {countries.length > 0 && filteredCountries.length === 0 && (
              <div className="p-6 text-center">
                <SearchIcon className="mx-auto w-12 h-12 text-[#6B6A65] mb-3" />
                <p className="text-sm font-medium text-[#6B6A65]">No countries found</p>
                <p className="text-xs text-[#6B6A65] mt-1">Try searching with a different term</p>
              </div>
            )}
            {filteredCountries.length > 0 && filteredCountries.map((country, index) => {
              const isPopular = POPULAR_COUNTRY_CODES.has(country.code);
              const showDivider = showingPopular && index === popularCountries.length;

              return (
                <div key={country.code}>
                  {showDivider && (
                    <div className="border-t-2 border-[#D0C5B2]/20 my-1">
                      <p className="px-4 py-2 text-xs font-semibold text-[#6B6A65] bg-[#F5F4F0]">All American Countries</p>
                    </div>
                  )}
                  <button
                    onClick={() => handleSelect(country)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F5F4F0] transition-colors text-left border-b border-[#D0C5B2]/15 last:border-b-0 ${selectedCountry?.code === country.code ? 'bg-[#C9A84C]/10' : ''
                      }`}
                  >
                    <span className="text-2xl">{country.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-[#1B1C1A] truncate">{country.name}</p>
                        {isPopular && !searchTerm && (
                          <span className="flex-shrink-0 px-1.5 py-0.5 text-xs font-medium text-[#755B00] bg-[#C9A84C]/20 rounded">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B6A65] mt-0.5">{country.dialCode}</p>
                    </div>
                    <span className="text-xs font-mono text-[#6B6A65] uppercase">{country.code}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
