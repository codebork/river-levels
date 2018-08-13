import React, { Component, Fragment } from 'react';
import Graph from './Graph';
import EnvironmentAPI from '../helpers/api';
import { subDays } from 'date-fns';

export default class RiverLevels extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoaded: false,
      riverReadings: [],
      selectedRiver: '',
      selectedTown: ''
    }

    this.api = new EnvironmentAPI({parameter: 'level', _sorted: true});

    this.riverSelected = this.riverSelected.bind(this);
    this.townSelected = this.townSelected.bind(this);
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

  riverSelected(e) {
    const { stations } = this.state;
    const riverStations = stations.items.filter(s => s.riverName == e.target.value);

    this.api.stationReadings({items: riverStations}, {since: subDays(Date.now(), 7).toISOString(), _sorted: true})
      .then(riverReadings => this.setState({riverReadings}));

    this.setState({selectedRiver: e.target.value});
  }

  townSelected(e) {
    const { stations } = this.state;
    const riverStations = stations.items.filter(s => s.town == e.target.value);

    this.api.stationReadings({items: riverStations}, {since: subDays(Date.now(), 7).toISOString(), _sorted: true})
      .then(riverReadings => this.setState({riverReadings}));

    this.setState({selectedTown: e.target.value});
  }

  renderDropdownOptions(options) {
    return options.map((option) => <option key={option} value={option}>{option}</option>)
  }

  render() {
    const { isLoaded, riverReadings, riverNames, townNames } = this.state;

    if (isLoaded) {
      return (
        <Fragment>
          <div>
            <select value={this.state.selectedTown} onChange={this.townSelected}>
              <option key='no-value' value='' disabled={true}>Please select a town...</option>
              { this.renderDropdownOptions(townNames) }
            </select>
            <select value={this.state.selectedRiver} onChange={this.riverSelected}>
              <option key='no-value' value='' disabled={true}>Please select a river...</option>
              { this.renderDropdownOptions(riverNames) }
            </select>
          </div>
          <Graph width="1250" height="600" stations={riverReadings} />
        </Fragment>
      )
    } else {
      return (
        <Fragment>
          <h1>Loading...</h1>
        </Fragment>
      )
    }
  }
}
