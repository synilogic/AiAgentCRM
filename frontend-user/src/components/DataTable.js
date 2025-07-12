import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Checkbox,
  TableSortLabel,
  TextField,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Typography,
  Button,
  Tooltip,
  Switch,
  FormControlLabel,
  InputAdornment,
  Collapse,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  ViewColumn as ViewColumnIcon,
  MoreVert as MoreVertIcon,
  GetApp as GetAppIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: 12,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  '& .MuiTable-root': {
    minWidth: 650,
  },
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  '& .MuiTableCell-head': {
    fontWeight: 600,
    fontSize: '0.875rem',
    borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    padding: theme.spacing(2),
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    transform: 'translateY(-1px)',
  },
  '&.Mui-selected': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.12),
    },
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

const TableToolbar = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  backgroundColor: alpha(theme.palette.background.default, 0.5),
}));

const FilterContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  backgroundColor: alpha(theme.palette.grey[50], 0.5),
}));

const BulkActionBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 2),
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
}));

const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  title = '',
  searchable = true,
  filterable = true,
  sortable = true,
  selectable = true,
  pagination = true,
  pageSize = 10,
  onRowClick,
  onSelectionChange,
  onRefresh,
  onExport,
  bulkActions = [],
  emptyMessage = 'No data available',
  stickyHeader = false,
  dense = false,
  showRowNumbers = false,
  customToolbar,
  filters = [],
  onFilterChange,
  ...props
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(
    columns.reduce((acc, col) => ({ ...acc, [col.id]: true }), {})
  );
  const [filterValues, setFilterValues] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm && searchable) {
      filtered = filtered.filter(row =>
        columns.some(column => {
          const value = row[column.id];
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply column filters
    Object.entries(filterValues).forEach(([columnId, filterValue]) => {
      if (filterValue && filterValue !== '') {
        filtered = filtered.filter(row => {
          const value = row[columnId];
          if (typeof filterValue === 'string') {
            return value && value.toString().toLowerCase().includes(filterValue.toLowerCase());
          }
          return value === filterValue;
        });
      }
    });

    // Apply sorting
    if (orderBy && sortable) {
      filtered.sort((a, b) => {
        const aValue = a[orderBy];
        const bValue = b[orderBy];
        
        if (aValue < bValue) return order === 'asc' ? -1 : 1;
        if (aValue > bValue) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, filterValues, orderBy, order, columns, searchable, sortable]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (!pagination) return processedData;
    const start = page * rowsPerPage;
    return processedData.slice(start, start + rowsPerPage);
  }, [processedData, page, rowsPerPage, pagination]);

  // Handlers
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = paginatedData.map(row => row.id);
      setSelected(newSelected);
      onSelectionChange?.(newSelected);
    } else {
      setSelected([]);
      onSelectionChange?.([]);
    }
  };

  const handleRowSelect = (event, id) => {
    event.stopPropagation();
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
    onSelectionChange?.(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (columnId, value) => {
    setFilterValues(prev => ({
      ...prev,
      [columnId]: value
    }));
    onFilterChange?.(columnId, value);
  };

  const clearFilters = () => {
    setFilterValues({});
    setSearchTerm('');
  };

  const toggleColumnVisibility = (columnId) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const visibleColumnsArray = columns.filter(col => visibleColumns[col.id]);

  return (
    <StyledTableContainer {...props}>
      {/* Loading Bar */}
      {loading && <LinearProgress />}

      {/* Toolbar */}
      <TableToolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {title && (
            <Typography variant="h6" fontWeight="bold">
              {title}
            </Typography>
          )}
          <Chip
            label={`${processedData.length} items`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {searchable && (
            <TextField
              size="small"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ width: 250 }}
            />
          )}

          {filterable && (
            <Tooltip title="Toggle Filters">
              <IconButton
                onClick={() => setShowFilters(!showFilters)}
                color={showFilters ? 'primary' : 'default'}
              >
                <FilterListIcon />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Column Visibility">
            <IconButton onClick={(e) => setColumnMenuAnchor(e.currentTarget)}>
              <ViewColumnIcon />
            </IconButton>
          </Tooltip>

          {onRefresh && (
            <Tooltip title="Refresh">
              <IconButton onClick={onRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}

          {onExport && (
            <Tooltip title="Export">
              <IconButton onClick={onExport}>
                <GetAppIcon />
              </IconButton>
            </Tooltip>
          )}

          {customToolbar}
        </Box>
      </TableToolbar>

      {/* Filters */}
      <Collapse in={showFilters}>
        <FilterContainer>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            {filters.map((filter) => (
              <Box key={filter.id} sx={{ minWidth: 200 }}>
                <TextField
                  size="small"
                  label={filter.label}
                  value={filterValues[filter.id] || ''}
                  onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                  select={filter.options ? true : false}
                  sx={{ width: '100%' }}
                >
                  {filter.options?.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            ))}
            <Button
              size="small"
              onClick={clearFilters}
              startIcon={<ClearIcon />}
              color="primary"
            >
              Clear Filters
            </Button>
          </Box>
        </FilterContainer>
      </Collapse>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <BulkActionBar>
              <Typography variant="body2" fontWeight="bold">
                {selected.length} item{selected.length > 1 ? 's' : ''} selected
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {bulkActions.map((action) => (
                  <Button
                    key={action.id}
                    size="small"
                    variant="outlined"
                    startIcon={action.icon}
                    onClick={() => action.onClick(selected)}
                  >
                    {action.label}
                  </Button>
                ))}
              </Box>
            </BulkActionBar>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <Table stickyHeader={stickyHeader} size={dense ? 'small' : 'medium'}>
        <StyledTableHead>
          <TableRow>
            {selectable && (
              <StyledTableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  indeterminate={selected.length > 0 && selected.length < paginatedData.length}
                  checked={paginatedData.length > 0 && selected.length === paginatedData.length}
                  onChange={handleSelectAllClick}
                />
              </StyledTableCell>
            )}
            {showRowNumbers && (
              <StyledTableCell>#</StyledTableCell>
            )}
            {visibleColumnsArray.map((column) => (
              <StyledTableCell
                key={column.id}
                align={column.align || 'left'}
                style={{ minWidth: column.minWidth }}
              >
                {sortable ? (
                  <TableSortLabel
                    active={orderBy === column.id}
                    direction={orderBy === column.id ? order : 'asc'}
                    onClick={() => handleRequestSort(column.id)}
                  >
                    {column.label}
                  </TableSortLabel>
                ) : (
                  column.label
                )}
              </StyledTableCell>
            ))}
          </TableRow>
        </StyledTableHead>
        <TableBody>
          {paginatedData.length === 0 ? (
            <TableRow>
              <StyledTableCell
                colSpan={visibleColumnsArray.length + (selectable ? 1 : 0) + (showRowNumbers ? 1 : 0)}
                align="center"
                sx={{ py: 8 }}
              >
                <Typography variant="body2" color="text.secondary">
                  {emptyMessage}
                </Typography>
              </StyledTableCell>
            </TableRow>
          ) : (
            paginatedData.map((row, index) => {
              const isItemSelected = isSelected(row.id);
              const labelId = `enhanced-table-checkbox-${index}`;

              return (
                <StyledTableRow
                  hover
                  key={row.id}
                  onClick={(event) => onRowClick?.(event, row)}
                  className={isItemSelected ? 'Mui-selected' : ''}
                >
                  {selectable && (
                    <StyledTableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        onChange={(event) => handleRowSelect(event, row.id)}
                        inputProps={{
                          'aria-labelledby': labelId,
                        }}
                      />
                    </StyledTableCell>
                  )}
                  {showRowNumbers && (
                    <StyledTableCell>
                      {page * rowsPerPage + index + 1}
                    </StyledTableCell>
                  )}
                  {visibleColumnsArray.map((column) => {
                    const value = row[column.id];
                    return (
                      <StyledTableCell
                        key={column.id}
                        align={column.align || 'left'}
                      >
                        {column.render ? column.render(value, row) : value}
                      </StyledTableCell>
                    );
                  })}
                </StyledTableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {pagination && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          component="div"
          count={processedData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Rows per page:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
          }
        />
      )}

      {/* Column Visibility Menu */}
      <Menu
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor)}
        onClose={() => setColumnMenuAnchor(null)}
      >
        {columns.map((column) => (
          <MenuItem key={column.id} onClick={() => toggleColumnVisibility(column.id)}>
            <FormControlLabel
              control={
                <Switch
                  checked={visibleColumns[column.id]}
                  size="small"
                />
              }
              label={column.label}
            />
          </MenuItem>
        ))}
      </Menu>
    </StyledTableContainer>
  );
};

export default DataTable; 