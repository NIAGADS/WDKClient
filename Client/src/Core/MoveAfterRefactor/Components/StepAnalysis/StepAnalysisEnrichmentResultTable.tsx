import { Component, Fragment } from 'react';

import Mesa, { MesaState, Utils as MesaUtils } from '../../../../Components/Mesa';
import { RealTimeSearchBox } from '../../../../Components';
import React from 'react';
import { htmlStringValue, numericValue } from '../../../../Components/Mesa/Utils/Utils';
import { compose } from 'lodash/fp';

const simpleFilterPredicateFactory = (searchQuery: string) => (row: Record<string, string>) =>
  Object.values(row).some(entry => `${entry}`.toLowerCase().includes(searchQuery.toLowerCase()));

interface StepAnalysisEnrichmentResultTableProps {
  emptyResultMessage: string;
  rows: Record<string, any>[];
  columns: ColumnSettings[];
  initialSearchQuery?: string;
  initialSortColumnKey?: string;
}

export interface ColumnSettings {
  key: string;
  name: string;
  helpText: string;
  sortable: boolean;
  renderCell?: React.SFC;
  sortType?: 'text' | 'number' | 'htmlText' | 'htmlNumber';
}

export class StepAnalysisEnrichmentResultTable extends Component<StepAnalysisEnrichmentResultTableProps, any> {
  constructor(props: StepAnalysisEnrichmentResultTableProps) {
    super(props);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleSort = this.handleSort.bind(this);

    this.state = MesaState.create({
      rows: this.props.rows,
      columns: this.props.columns,
      options: {
        showCount: true,
        toolbar: true,
        useStickyHeader: true,
        tableBodyMaxHeight: '80vh'
      },
      uiState: {
        searchQuery: this.props.initialSearchQuery || '',
        sort: {
          columnKey: this.props.initialSortColumnKey || null,
          direction: 'asc'
        }
      },
      eventHandlers: {
        onSort: ({ key }: any, direction: any) => this.handleSort(key, direction)
      }
    });
  }

  handleSearch(searchQuery: string) {
    const updatedTableState = MesaState.setSearchQuery(this.state, searchQuery);

    this.setState(updatedTableState)
  }

  handleSort(sortByKey: string, sortDirection: 'asc' | 'desc') {
    const { setSortDirection, setSortColumnKey } = MesaState;
    const updatedTableState = setSortDirection(setSortColumnKey(this.state, sortByKey), sortDirection);

    this.setState(updatedTableState);
  }

  render() {
    const { getColumns, getFilteredRows, getUiState, setFilteredRows, setUiState } = MesaState;
    const { searchQuery, sort: { columnKey: sortColumnKey, direction: sortDirection } } = getUiState(this.state);

    const filteredState = searchQuery
      ? MesaState.filterRows(this.state, simpleFilterPredicateFactory(searchQuery))
      : this.state;

    const filterCountedState = setUiState(
      filteredState,
      {
        ...MesaState.getUiState(filteredState),
        filteredRowCount: MesaState.getRows(filteredState).length - MesaState.getFilteredRows(filteredState).length
      }
    );

    const { sortType = 'text' } = getColumns(filterCountedState).find(({ key }) => key === sortColumnKey) || {};
    const sortMethod = sortTypes[sortType] || sortTypes['text'];
    
    const unsortedRows = getFilteredRows(filterCountedState);
    const sortedRows = sortColumnKey === null
      ? unsortedRows
      : sortMethod(unsortedRows, sortColumnKey, sortDirection === 'asc');

    const sortedState = setFilteredRows(
      filterCountedState,
      sortedRows
    );

    return (
      <Fragment>
        {
          this.props.rows.length
            ? (
              <Mesa state={sortedState}>
                <RealTimeSearchBox
                  className="enrichment-search-field"
                  autoFocus={false}
                  searchTerm={searchQuery}
                  onSearchTermChange={this.handleSearch}
                  placeholderText={''}
                  helpText={'The entire table will be searched'}
                />
              </Mesa>
            )
            : (
              <div className="enrich-empty-results">
                {this.props.emptyResultMessage}
              </div>
            )
        }
      </Fragment>
    );
  }
}

const sortTypes: Record<string, ((rows: any[], key: string, ascending: boolean) => any[])> = {
  'number': MesaUtils.numberSort,
  'text': MesaUtils.textSort,
  'htmlText': MesaUtils.customSortFactory(htmlStringValue),
  'htmlNumber': MesaUtils.customSortFactory(compose(
    numericValue,
    htmlStringValue
  ))
};