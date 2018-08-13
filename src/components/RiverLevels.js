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
    }

    this.api = new EnvironmentAPI({parameter: 'level', _sorted: true});

    this.riverSelected = this.riverSelected.bind(this);
  }

  componentDidMount() {
    this.api.stations({_sorted: false}).then((stations) => {
        const filteredStations = stations.items.filter(s => s.riverName != undefined);
        const riverNames = new Set(filteredStations.map(s => s.riverName).sort());

        this.setState({isLoaded: true, ukStations: stations, riverNames: [...riverNames]});
      })
  }

  riverSelected(e) {
    const { ukStations } = this.state;
    const riverStations = ukStations.items.filter(s => s.riverName == e.target.value);

    this.api.stationReadings({items: riverStations}, {since: subDays(Date.now(), 7).toISOString(), _sorted: true})
      .then(riverReadings => this.setState({riverReadings}));

    this.setState({selectedRiver: e.target.value});
  }

  render() {
    const { isLoaded, riverReadings } = this.state;

    if (isLoaded) {
      return (
        <Fragment>
          <div>
            <select value={this.state.selectedRiver} onChange={this.riverSelected}>
              { this.state.riverNames.map((river) => <option key={river} value={river}>{river}</option>)}
            </select>
          </div>
          {riverReadings.length > 0 && <Graph width="1250" height="600" stations={riverReadings} />}
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
