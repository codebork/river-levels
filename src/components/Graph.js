import React, { Component } from 'react';
import * as d3 from 'd3';

export default class Graph extends Component {
  constructor(props) {
    super(props);

    this.root = React.createRef();

    this.setContext = this.setContext.bind(this);
    this.drawMeasures = this.drawMeasures.bind(this);
    this.drawLabels = this.drawLabels.bind(this);
  }

  render() {
    return (
      <svg width={this.props.width} height={this.props.height} ref={this.root} />
    );
  }

  componentDidMount() {
    this.graph = this.setContext();
    this.initAxes();

    if (this.props.stations && this.props.stations.length) {
      this.setAxes();
      this.drawStations();
      this.drawAxes();
    }
  }

  componentDidUpdate() {
    this.setAxes();
    this.drawStations();
    this.drawAxes();
  }

  setContext() {
    const root = d3.select(this.root.current),
      margin = { top: 20, right: 350, bottom: 30, left: 50 };

    this.graphWidth = +root.attr('width') - margin.left - margin.right,
    this.graphHeight = +root.attr('height') - margin.top - margin.bottom;

    const graph = root.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    return graph;
  }

  initAxes() {
    this.graph.append('g')
      .attr('transform', `translate(0, ${this.graphHeight})`)
      .attr('class', 'x axis')

    this.graph.append('g').attr('class', 'y axis');
  }

  setAxes() {
    const { stations } = this.props;

    // Gets the latest and earliest dates and use them as x domain
    this.x = d3.scaleTime().rangeRound([0, this.graphWidth]).domain([
      d3.min(stations, (river) => d3.min(river.measures, (m) => d3.min(m.readings, (r) => new Date(r.dateTime)))),
      d3.max(stations, (river) => d3.max(river.measures, (m) => d3.max(m.readings, (r) => new Date(r.dateTime))))
    ]);

    // Get highest and lowest reading for selected stations and use them as y domain
    this.y = d3.scaleLinear().rangeRound([this.graphHeight, 0]).domain([
      d3.min(stations, (river) => d3.min(river.measures, (m) => d3.min(m.readings, (r) => r.value))) - 0.05,
      d3.max(stations, (river) => d3.max(river.measures, (m) => d3.max(m.readings, (r) => r.value))) + 0.05
    ]).nice();

    // Set specific colour for each station
    this.colours = d3.scaleOrdinal(d3.schemeSet3).domain(stations.map(s => s.stationRef));
  }

  drawAxes() {
    // Draw the axes on the graph
    const xAxis = this.graph.select('.x.axis');

    xAxis.transition()
      .call(d3.axisBottom(this.x));

    const yAxis = this.graph.select('.y.axis');

    yAxis.transition()
      .call(d3.axisLeft(this.y));
  }

  drawMeasures(station) {
    const line = d3.line()
            .x((d) => this.x(new Date(d.dateTime)))
            .y((d) => this.y(d.value));

    const getColour = (ref) => this.colours(ref);

    // Plot the measures for each station
    station.each(function(station) {
      const riverPlot = d3.select(this).selectAll('.riverPlot')
        .data(station.measures)

      riverPlot.transition().attr('d', (d) => line(d.readings))

      riverPlot.enter().append('path')
        .attr('class', 'riverPlot')
        .attr('d', (d) => line(d.readings))
        .attr('stroke', getColour(station.stationRef))
        .attr('stroke-width', '2')
        .attr('fill', 'none')

      riverPlot.exit().remove()
    });
  }

  drawLabels(station) {
    const line = d3.line()
            .x((d) => this.x(new Date(d.dateTime)))
            .y((d) => this.y(d.value));

    const getPosition = (r) => `${this.x(new Date(r.dateTime))},${this.y(r.value)}`;

    // Add a label to each plotted measure
    station.each(function(station) {
      const riverLabel = d3.select(this).selectAll('.riverLabel')
        .data(station.measures);

      riverLabel.transition()
        .attr('transform', d => `translate(${getPosition(d.readings[0])})`)
        .text(d => `${station.town}, ${station.stationRef}`);

      riverLabel.enter().append('text')
        .attr('class', 'riverLabel')
        .attr('transform', d => `translate(${getPosition(d.readings[0])})`)
        .attr('x', 3)
        .attr('stroke', 'none')
        .text(d => `${station.town}, ${station.stationRef}`);

      riverLabel.exit().remove();
    });

  }

  drawStations() {
    const { stations } = this.props
    const station = this.graph.selectAll('.station')
      .data(stations)

    station
      .call(this.drawMeasures)
      .call(this.drawLabels);

    station.enter().append('g')
      .attr('class', 'station')
      .call(this.drawMeasures)
      .call(this.drawLabels);

    station.exit().remove();
  }
}
