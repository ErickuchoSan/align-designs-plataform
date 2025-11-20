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
}: FileFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <input
        type="text"
        placeholder="Search by name..."
        value={nameFilter}
        onChange={(e) => setNameFilter(e.target.value)}
        className="px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent text-navy-900 placeholder:text-stone-700"
      />
      <select
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
        className="px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent text-navy-900"
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
