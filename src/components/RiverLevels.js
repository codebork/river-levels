import React, { Component, Fragment } from 'react';
import Graph from './Graph';
import EnvironmentAPI from '../helpers/api';
import { subDays } from 'date-fns';

export default class RiverLevels extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoaded: false,
      currentSearch: {},
      stationsToPlot: [],
      relatedRiverNames: [],
      searchResults: []
    }

    this.api = new EnvironmentAPI({parameter: 'level', _sorted: true});

    this.searchTown = this.searchTown.bind(this);
    this.searchRiver = this.searchRiver.bind(this);
    this.clearSearch = this.clearSearch.bind(this);
  }

  componentDidMount() {
    this.api.stations({_sorted: false}).then((stations) => {
      const stationsWithRiverNames = stations.items.filter(s => s.riverName != undefined);
      const stationsWithTowns = stations.items.filter(s => s.town != undefined);
      const riverNames = new Set(stationsWithRiverNames.map(s => s.riverName).sort());
      const townNames = new Set(stationsWithTowns.map(s => s.town).sort());

      this.setState({isLoaded: true, stations, riverNames: [...riverNames], townNames: [...townNames]});
    })
  }

  searchTown(e) {
    const { stations, currentSearch } = this.state;
    const { value } = e.target;
    const stationsToSearch = stations.items.filter((s) => s.town == value);
    const relatedRiverNames = new Set(stationsToSearch.map(s => s.riverName).sort());
    const newSearch = Object.assign({}, currentSearch, {town: value});

    delete newSearch.riverName;

    let newState = {relatedRiverNames: [...relatedRiverNames], currentSearch: newSearch, searchResults: stationsToSearch};

    if(relatedRiverNames.size == 1) {
      newState.currentSearch.riverName = [...relatedRiverNames][0];
    }
    this.setState(newState);

    this.api.stationReadings({items: stationsToSearch}, {since: subDays(Date.now(), 7).toISOString(), _sorted: true})
      .then(stationsToPlot => this.setState({stationsToPlot}));
  }

  searchRiver(e) {
    const { stations, currentSearch, searchResults } = this.state;
    const { value } = e.target;
    let stationsToSearch = [];
    const newSearch = Object.assign({}, currentSearch, {riverName: value});

    if(!value) {
      delete newSearch.riverName;
      stationsToSearch = searchResults;
    } else if(searchResults.length) {
      stationsToSearch = searchResults.filter((s) => s.riverName == value)
    } else {
      stationsToSearch = stations.items.filter((s) => s.riverName == value);
    }

    this.setState({currentSearch: newSearch});

    this.api.stationReadings({items: stationsToSearch}, {since: subDays(Date.now(), 7).toISOString(), _sorted: true})
      .then(stationsToPlot => this.setState({stationsToPlot}));

  }

  clearSearch() {
    this.setState({stationsToPlot: [], currentSearch: {}, relatedRiverNames: []});
  }

  renderDropdownOptions(options) {
    return options.map((option) => <option key={option} value={option}>{option}</option>)
  }

  render() {
    const { isLoaded, riverNames, townNames, stationsToPlot, relatedRiverNames, relatedTownNames } = this.state;
    const { riverName = '', town = '' } = this.state.currentSearch;

    if (isLoaded) {
      return (
        <Fragment>
          <div>
            <select name='town' value={town} onChange={this.searchTown}>
              <option key='no-value' value=''>Please select a town...</option>
              { this.renderDropdownOptions(townNames) }
            </select>
            <select name='riverName' value={riverName} onChange={this.searchRiver} disabled={relatedRiverNames.length == 1}>
              <option key='no-value' value=''>Please select a river...</option>
              { this.renderDropdownOptions(town && relatedRiverNames.length ? relatedRiverNames : riverNames) }
            </select>
            <button onClick={this.clearSearch}>Clear search</button>
          </div>
          <Graph width="1250" height="600" stations={stationsToPlot} />
        </Fragment>
      )
    } else {
      return (
        <h1>Loading...</h1>
      )
    }
  }
}
