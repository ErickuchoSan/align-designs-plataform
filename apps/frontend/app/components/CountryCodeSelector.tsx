'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { Country } from '../utils/countries';

interface CountryCodeSelectorProps {
  value: string;
  onChange: (dialCode: string) => void;
  className?: string;
}

// Popular countries to show first (prioritized list)
const POPULAR_COUNTRY_CODES = ['MX', 'US', 'CA', 'ES', 'AR', 'CO', 'CL', 'PE', 'VE'];

// Cache for lazy-loaded countries data (18KB)
let countriesCache: Country[] | null = null;

export default function CountryCodeSelector({ value, onChange, className = '' }: CountryCodeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Lazy load countries data on mount
  useEffect(() => {
    async function loadCountries() {
      if (countriesCache) {
        setCountries(countriesCache);
        setSelectedCountry(countriesCache.find(c => c.dialCode === value) || countriesCache[0]);
      } else {
        const module = await import('../utils/countries');
        countriesCache = module.countries;
        setCountries(module.countries);
        setSelectedCountry(module.countries.find(c => c.dialCode === value) || module.countries[0]);
      }
    }
    loadCountries();
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Intelligent search with prioritization
  const filteredCountries = useMemo(() => {
    if (!searchTerm.trim()) {
      // No search: show popular countries first, then the rest
      const popularCountries = countries.filter(c => POPULAR_COUNTRY_CODES.includes(c.code));
      const otherCountries = countries.filter(c => !POPULAR_COUNTRY_CODES.includes(c.code));
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

    // Sort matches by relevance
    return matches.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      // Exact name match first
      if (aName === search) return -1;
      if (bName === search) return 1;

      // Name starts with search term
      if (aName.startsWith(search) && !bName.startsWith(search)) return -1;
      if (bName.startsWith(search) && !aName.startsWith(search)) return 1;

      // Exact dial code match
      if (a.dialCode === searchWithPlus && b.dialCode !== searchWithPlus) return -1;
      if (b.dialCode === searchWithPlus && a.dialCode !== searchWithPlus) return 1;

      // Popular countries get priority
      const aPopular = POPULAR_COUNTRY_CODES.indexOf(a.code);
      const bPopular = POPULAR_COUNTRY_CODES.indexOf(b.code);
      if (aPopular !== -1 && bPopular === -1) return -1;
      if (bPopular !== -1 && aPopular === -1) return 1;
      if (aPopular !== -1 && bPopular !== -1) return aPopular - bPopular;

      // Alphabetical fallback
      return aName.localeCompare(bName);
    });
  }, [searchTerm]);

  const handleSelect = (country: Country) => {
    setSelectedCountry(country);
    onChange(country.dialCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  const popularCountries = countries.filter(c => POPULAR_COUNTRY_CODES.includes(c.code));
  const showingPopular = !searchTerm.trim() && popularCountries.length > 0;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, openUpward: false });

  // Calculate dropdown position when opened with smart direction detection
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 400; // Estimated max height of dropdown
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Open upward if not enough space below and more space above
      const shouldOpenUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setDropdownPosition({
        top: shouldOpenUpward
          ? rect.top + window.scrollY - dropdownHeight - 8
          : rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
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
        className={`flex items-center justify-between gap-2 px-4 py-3 border border-stone-300 rounded-lg bg-white hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all ${className}`}
      >
        <div className="flex items-center gap-2">
          {selectedCountry ? (
            <>
              <span className="text-xl">{selectedCountry.flag}</span>
              <span className="text-sm font-semibold text-navy-900">{selectedCountry.dialCode}</span>
            </>
          ) : (
            <span className="text-sm text-gray-400">Loading...</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-navy-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`fixed z-[9999] w-96 bg-white border border-stone-300 rounded-lg shadow-2xl overflow-hidden transition-opacity duration-200 ${
            dropdownPosition.openUpward ? 'animate-slide-up' : 'animate-slide-down'
          }`}
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            minWidth: `${dropdownPosition.width}px`,
          }}
        >
          {/* Search Input */}
          <div className="p-3 border-b border-stone-200 bg-stone-50">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search country or dial code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-sm text-navy-900 placeholder:text-stone-500"
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchTerm && searchTerm.match(/^\d/) && (
              <p className="mt-2 text-xs text-stone-600">
                💡 Tip: Searching for <span className="font-semibold">+{searchTerm}</span>
              </p>
            )}
          </div>

          {/* Popular Countries Header */}
          {showingPopular && (
            <div className="px-4 py-2 bg-gold-50 border-b border-gold-100">
              <p className="text-xs font-semibold text-gold-900">Popular Countries</p>
            </div>
          )}

          {/* Countries List */}
          <div className="max-h-80 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="p-6 text-center">
                <svg className="mx-auto w-12 h-12 text-stone-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-sm font-medium text-stone-600">No countries found</p>
                <p className="text-xs text-stone-500 mt-1">Try searching with a different term</p>
              </div>
            ) : (
              <>
                {filteredCountries.map((country, index) => {
                  const isPopular = POPULAR_COUNTRY_CODES.includes(country.code);
                  const showDivider = showingPopular && index === popularCountries.length;

                  return (
                    <div key={country.code}>
                      {showDivider && (
                        <div className="border-t-2 border-stone-200 my-1">
                          <p className="px-4 py-2 text-xs font-semibold text-stone-500 bg-stone-50">All Countries</p>
                        </div>
                      )}
                      <button
                        onClick={() => handleSelect(country)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gold-50 transition-colors text-left border-b border-stone-100 last:border-b-0 ${
                          selectedCountry?.code === country.code ? 'bg-gold-50' : ''
                        }`}
                      >
                        <span className="text-2xl">{country.flag}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-navy-900 truncate">{country.name}</p>
                            {isPopular && !searchTerm && (
                              <span className="flex-shrink-0 px-1.5 py-0.5 text-xs font-medium text-gold-700 bg-gold-100 rounded">
                                Popular
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-600 mt-0.5">{country.dialCode}</p>
                        </div>
                        <span className="text-xs font-mono text-stone-500 uppercase">{country.code}</span>
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
