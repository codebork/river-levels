export default class EnvironmentAPI {

  constructor(defaultParams = {}) {
    this.defaultParams = defaultParams;
    this.apiUrl = '//environment.data.gov.uk/flood-monitoring';
  }

  get(endpoint, params = {}) {
    const reqParams = Object.assign({}, this.defaultParams);
    Object.assign(reqParams, params);
    return fetch(`${this.apiUrl}${endpoint}${this.paramsToQueryString(reqParams)}`).then((res) => res.json());
  }

  stations(params) {
    return this.get('/id/stations', params);
  }

  station(stationRef) {
    return this.get(`/id/stations/${stationRef}`);
  }

  measures(params) {
    return this.get('/id/measures', params);
  }

  measure(measureRef) {
    return this.get(`/id/measures/${measureRef}`);
  }

  readings(params) {
    return this.get('/data/readings', params);
  }

  // TODO: Make this use get method so it includes default params
  measureReadings(measures, params) {
    const readingReqs = measures.map((measure) => {
      return fetch(`${measure['@id'].replace(/http:/, '')}/readings${this.paramsToQueryString(params)}`)
        .then((res) => res.json())
        .then((readings) => {
          return {measureRef: measure['@id'], readings: readings.items.length > 0 ? readings.items : false};
        });
    });

    return Promise.all(readingReqs);
  }

  stationReadings(stations, params) {
    const stationsWithReadings = stations.items.map((station) => {
      return this.measureReadings(station.measures, params)
        .then((measureReadings) => {
          const measuresWithReadings = measureReadings.filter(measure => measure.readings.length > 0);
          return {
            stationRef: station.stationReference,
            label: station.label,
            catchmentName: station.catchmentName,
            riverName: station.riverName,
            town: station.town,
            measures: measuresWithReadings
          }
        });
    });

    return Promise.all(stationsWithReadings);
  }

  paramsToQueryString(params) {
    if(!params) { return ''; }

    const flagParams = [
      '_sorted',
      'latest',
      'today'
    ];

    const checkParam = ([key, val]) => {
      if(flagParams.includes(key)) {
        if(val) {
          return key;
        }
      } else {
        return `${key}=${encodeURIComponent(val)}`
      }
    };

    return '?' + Object.entries(params).map(checkParam).join('&');
  }
}
