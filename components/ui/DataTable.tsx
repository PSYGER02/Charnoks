import React from 'react';

interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'currency' | 'date' | 'badge' | 'action' | 'progress' | 'avatar';
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  formatter?: (value: any, row: any) => React.ReactNode;
  aggregator?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

interface DataTableProps {
  data: any[];
  columns: TableColumn[];
  searchable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  selectable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  showStats?: boolean;
  virtualScrolling?: boolean;
  exportable?: boolean;
  className?: string;
  onRowClick?: (row: any, index: number) => void;
  onSelectionChange?: (selectedRows: any[]) => void;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  searchable = true,
  sortable = true,
  filterable = true,
  selectable = false,
  pagination = true,
  pageSize = 10,
  showStats = true,
  virtualScrolling = false,
  exportable = true,
  className = '',
  onRowClick,
  onSelectionChange
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortConfig, setSortConfig] = React.useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [filters, setFilters] = React.useState<Record<string, string>>({});
  const [selectedRows, setSelectedRows] = React.useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = React.useState(1);
  const [hoveredRow, setHoveredRow] = React.useState<number | null>(null);

  // Filter and search data
  const filteredData = React.useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(row =>
        columns.some(col => {
          const value = row[col.key];
          if (value == null) return false;
          return String(value).toLowerCase().includes(query);
        })
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(row => {
          const rowValue = row[key];
          if (rowValue == null) return false;
          return String(rowValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        
        if (sortConfig.direction === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    return result;
  }, [data, searchQuery, filters, sortConfig, columns]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = pagination 
    ? filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredData;

  // Handle sorting
  const handleSort = (columnKey: string) => {
    if (!sortable) return;
    
    setSortConfig(prev => {
      if (prev?.key === columnKey) {
        if (prev.direction === 'asc') {
          return { key: columnKey, direction: 'desc' };
        } else {
          return null; // Remove sort
        }
      }
      return { key: columnKey, direction: 'asc' };
    });
  };

  // Handle selection
  const handleRowSelection = (index: number, checked: boolean) => {
    const newSelection = new Set(selectedRows);
    if (checked) {
      newSelection.add(index);
    } else {
      newSelection.delete(index);
    }
    setSelectedRows(newSelection);
    
    if (onSelectionChange) {
      const selectedData = Array.from(newSelection).map(i => filteredData[i]);
      onSelectionChange(selectedData);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIndices = new Set(filteredData.map((_, i) => i));
      setSelectedRows(allIndices);
      if (onSelectionChange) {
        onSelectionChange(filteredData);
      }
    } else {
      setSelectedRows(new Set());
      if (onSelectionChange) {
        onSelectionChange([]);
      }
    }
  };

  // Format cell value
  const formatCellValue = (value: any, column: TableColumn, row: any) => {
    if (column.formatter) {
      return column.formatter(value, row);
    }

    if (value == null) return '-';

    switch (column.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(Number(value) || 0);
      
      case 'number':
        return new Intl.NumberFormat('en-US').format(Number(value) || 0);
      
      case 'date':
        return new Date(value).toLocaleDateString();
      
      case 'badge':
        return (
          <span className={`
            inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
            ${value === 'active' || value === 'completed' || value === 'success'
              ? 'bg-success/20 border border-success/40 text-success'
              : value === 'pending' || value === 'warning'
              ? 'bg-warning/20 border border-warning/40 text-warning'
              : value === 'inactive' || value === 'failed' || value === 'error'
              ? 'bg-error/20 border border-error/40 text-error'
              : 'bg-glass-light/20 border border-glass-border/40 text-text-secondary'
            }
          `}>
            {String(value)}
          </span>
        );
      
      case 'progress':
        const percentage = Math.min(100, Math.max(0, Number(value) || 0));
        return (
          <div className="w-full">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>{percentage}%</span>
            </div>
            <div className="w-full bg-glass-light/20 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      
      case 'avatar':
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {String(value).charAt(0).toUpperCase()}
            </span>
          </div>
        );
      
      default:
        return String(value);
    }
  };

  // Calculate aggregations
  const getColumnAggregation = (column: TableColumn) => {
    if (!column.aggregator || !showStats) return null;

    const values = filteredData.map(row => Number(row[column.key]) || 0).filter(v => !isNaN(v));
    
    switch (column.aggregator) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      case 'count':
        return values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      default:
        return null;
    }
  };

  // Export functionality
  const handleExport = () => {
    const csvContent = [
      columns.map(col => col.label).join(','),
      ...filteredData.map(row =>
        columns.map(col => {
          const value = row[col.key];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : String(value || '');
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`revolutionary-datatable ${className}`}>
      {/* Header Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-text-primary">
              Data Table
            </h3>
            {showStats && (
              <div className="text-sm text-text-secondary">
                {filteredData.length} of {data.length} records
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {exportable && (
              <button
                onClick={handleExport}
                className="glass-card px-4 py-2 rounded-xl bg-glass-light/30 border border-glass-border/40 text-text-primary hover:bg-glass-light/50 transition-all duration-300"
              >
                📤 Export
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        {(searchable || filterable) && (
          <div className="flex items-center gap-4">
            {searchable && (
              <div className="relative flex-1 max-w-md">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <span className="text-text-secondary/60">🔍</span>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search all columns..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass-card bg-glass-light/30 border border-glass-border/50 text-text-primary placeholder:text-text-secondary/60 outline-none transition-all duration-300 focus:border-primary focus:shadow-glass-2"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="glass-card-premium border border-glass-border/40 rounded-2xl overflow-hidden bg-gradient-to-br from-glass-light/40 via-glass-light/30 to-glass-light/20 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header */}
            <thead>
              <tr className="border-b border-glass-border/30">
                {selectable && (
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === filteredData.length && filteredData.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-2 border-glass-border/50 bg-glass-light/30"
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`p-4 text-${column.align || 'left'} ${column.width || ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => column.sortable !== false && handleSort(column.key)}
                        className={`
                          font-semibold text-text-primary transition-all duration-200
                          ${column.sortable !== false ? 'hover:text-primary cursor-pointer' : ''}
                        `}
                      >
                        {column.label}
                      </button>
                      
                      {sortable && column.sortable !== false && (
                        <span className="text-text-secondary/60">
                          {sortConfig?.key === column.key ? (
                            sortConfig.direction === 'asc' ? '↑' : '↓'
                          ) : '↕'}
                        </span>
                      )}
                    </div>
                    
                    {/* Column Filter */}
                    {filterable && column.filterable !== false && (
                      <input
                        type="text"
                        value={filters[column.key] || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, [column.key]: e.target.value }))}
                        placeholder={`Filter ${column.label.toLowerCase()}...`}
                        className="mt-2 w-full px-2 py-1 text-xs rounded-lg glass-card bg-glass-light/20 border border-glass-border/30 text-text-primary placeholder:text-text-secondary/60 outline-none focus:border-primary"
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {paginatedData.map((row, index) => {
                const actualIndex = (currentPage - 1) * pageSize + index;
                const isSelected = selectedRows.has(actualIndex);
                const isHovered = hoveredRow === actualIndex;
                
                return (
                  <tr
                    key={actualIndex}
                    onClick={() => onRowClick?.(row, actualIndex)}
                    onMouseEnter={() => setHoveredRow(actualIndex)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className={`
                      border-b border-glass-border/20 transition-all duration-300
                      ${onRowClick ? 'cursor-pointer' : ''}
                      ${isSelected ? 'bg-primary/10 border-primary/30' : ''}
                      ${isHovered && !isSelected ? 'bg-glass-light/30' : ''}
                      hover:scale-101 hover:shadow-glass-1
                    `}
                  >
                    {selectable && (
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleRowSelection(actualIndex, e.target.checked)}
                          className="w-4 h-4 rounded border-2 border-glass-border/50 bg-glass-light/30"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`p-4 text-${column.align || 'left'} text-text-primary`}
                      >
                        {formatCellValue(row[column.key], column, row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>

            {/* Footer with Aggregations */}
            {showStats && (
              <tfoot>
                <tr className="border-t border-glass-border/30 bg-gradient-to-r from-glass-light/20 to-glass-light/10">
                  {selectable && <td className="p-4"></td>}
                  {columns.map((column) => {
                    const aggregation = getColumnAggregation(column);
                    return (
                      <td
                        key={column.key}
                        className={`p-4 text-${column.align || 'left'} font-semibold text-text-secondary`}
                      >
                        {aggregation !== null ? (
                          column.type === 'currency' ? 
                            new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(aggregation) :
                            new Intl.NumberFormat('en-US').format(aggregation)
                        ) : ''}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination */}
        {pagination && totalPages > 1 && (
          <div className="p-4 border-t border-glass-border/30 flex items-center justify-between">
            <div className="text-sm text-text-secondary">
              Page {currentPage} of {totalPages}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg glass-card bg-glass-light/30 border border-glass-border/40 flex items-center justify-center text-text-primary disabled:opacity-50 hover:bg-glass-light/50 transition-all duration-300"
              >
                ◀
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + Math.max(1, currentPage - 2);
                if (page > totalPages) return null;
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`
                      w-8 h-8 rounded-lg glass-card border border-glass-border/40 flex items-center justify-center text-sm transition-all duration-300
                      ${page === currentPage 
                        ? 'bg-primary/30 border-primary/50 text-primary font-semibold' 
                        : 'bg-glass-light/30 text-text-primary hover:bg-glass-light/50'
                      }
                    `}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg glass-card bg-glass-light/30 border border-glass-border/40 flex items-center justify-center text-text-primary disabled:opacity-50 hover:bg-glass-light/50 transition-all duration-300"
              >
                ▶
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;