'use client';

import { Combobox, Transition } from '@headlessui/react';
import { Fragment, useState, useMemo, memo } from 'react';
import { cn, FORM_LABEL } from '@/lib/styles';
import { CheckIcon, ChevronUpDownIcon } from '@/components/ui/icons';

interface Option {
  id: string;
  name: string;
  description?: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  id = 'combobox',
  required = false,
  disabled = false,
  className = '',
}: Readonly<SearchableSelectProps>) {
  const [query, setQuery] = useState('');

  const selectedOption = useMemo(() => options.find((opt) => opt.id === value) || null, [options, value]);

  const filteredOptions = useMemo(() => {
    if (query === '') return options;

    const normalizedQuery = query.toLowerCase().replace(/\s+/g, '');
    return options.filter((option) => option.name.toLowerCase().replace(/\s+/g, '').includes(normalizedQuery));
  }, [query, options]);

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className={FORM_LABEL}>
          {label} {required && '*'}
        </label>
      )}
      <Combobox value={selectedOption} onChange={(opt) => onChange(opt ? opt.id : '')} disabled={disabled}>
        <div className="relative mt-1">
          <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-stone-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-gold-300 sm:text-sm">
            <Combobox.Input
              className="w-full border-none py-2.5 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
              displayValue={(option: Option) => (option ? option.name : '')}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              id={id}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon size="lg" className="text-gray-400" />
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50">
              {filteredOptions.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none px-4 py-2 text-gray-700">Nothing found.</div>
              ) : (
                filteredOptions.map((option) => (
                  <Combobox.Option
                    key={option.id}
                    className={({ active }) =>
                      cn(
                        'relative cursor-default select-none py-2 pl-10 pr-4',
                        active ? 'bg-gold-500 text-white' : 'text-gray-900',
                        option.disabled && 'opacity-50 cursor-not-allowed'
                      )
                    }
                    value={option}
                    disabled={option.disabled}
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={cn('block truncate', selected ? 'font-medium' : 'font-normal')}>
                          {option.name}{' '}
                          {option.description && (
                            <span className={cn('text-xs', active ? 'text-white' : 'text-gray-500')}>
                              ({option.description})
                            </span>
                          )}
                        </span>
                        {selected && (
                          <span
                            className={cn(
                              'absolute inset-y-0 left-0 flex items-center pl-3',
                              active ? 'text-white' : 'text-navy-900'
                            )}
                          >
                            <CheckIcon size="lg" />
                          </span>
                        )}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    </div>
  );
}

export default memo(SearchableSelect);
