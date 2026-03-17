import { cn, INPUT_BASE, INPUT_VARIANTS } from '@/lib/styles';

interface FileFiltersProps {
  nameFilter: string;
  setNameFilter: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  availableTypes: string[];
}

export default function FileFilters({
  nameFilter,
  setNameFilter,
  typeFilter,
  setTypeFilter,
  availableTypes,
}: Readonly<FileFiltersProps>) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <input
        type="text"
        placeholder="Search by name..."
        value={nameFilter}
        onChange={(e) => setNameFilter(e.target.value)}
        className={cn(INPUT_BASE, INPUT_VARIANTS.default, 'text-navy-900 placeholder:text-stone-700')}
      />
      <select
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
        className={cn(INPUT_BASE, INPUT_VARIANTS.default, 'text-navy-900')}
      >
        <option value="all">All types</option>
        <option value="comments">Comments only</option>
        {availableTypes.map(type => (
          <option key={type} value={type}>{type.toUpperCase()}</option>
        ))}
      </select>
    </div>
  );
}
