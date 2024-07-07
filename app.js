document.addEventListener('DOMContentLoaded', function() {
  const url = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json';

  fetch(url)
    .then(response => response.json())
    .then(data => {
      const baseTemperature = data.baseTemperature;
      const monthlyVariance = data.monthlyVariance;
      
      const margin = { top: 50, right: 20, bottom: 100, left: 100 };
      const width = 1200 - margin.left - margin.right;
      const height = 500 - margin.top - margin.bottom;

      const svg = d3.select('#heatmap')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const xScale = d3.scaleBand()
        .domain(monthlyVariance.map(d => d.year))
        .range([0, width])
        .padding(0.05);

      const yScale = d3.scaleBand()
        .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
        .range([0, height])
        .padding(0.05);

      const xAxis = d3.axisBottom(xScale).tickValues(xScale.domain().filter(year => year % 10 === 0));
      const yAxis = d3.axisLeft(yScale)
        .tickFormat(month => {
          const date = new Date(0);
          date.setUTCMonth(month);
          return d3.timeFormat('%B')(date);
        });

      svg.append('g')
        .attr('id', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis);

      svg.append('g')
        .attr('id', 'y-axis')
        .call(yAxis);

      const colorScale = d3.scaleQuantile()
        .domain([d3.min(monthlyVariance, d => baseTemperature + d.variance), d3.max(monthlyVariance, d => baseTemperature + d.variance)])
        .range(['#4575b4', '#91bfdb', '#fee090', '#fc8d59', '#d73027']);

      svg.selectAll('.cell')
        .data(monthlyVariance)
        .enter().append('rect')
        .attr('class', 'cell')
        .attr('data-month', d => d.month - 1)
        .attr('data-year', d => d.year)
        .attr('data-temp', d => baseTemperature + d.variance)
        .attr('x', d => xScale(d.year))
        .attr('y', d => yScale(d.month - 1))
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('fill', d => colorScale(baseTemperature + d.variance))
        .on('mouseover', (event, d) => {
          const tooltip = document.getElementById('tooltip');
          tooltip.innerHTML = `Year: ${d.year}<br>Month: ${new Date(0, d.month - 1).toLocaleString('default', { month: 'long' })}<br>Temperature: ${(baseTemperature + d.variance).toFixed(2)}℃<br>Variance: ${d.variance.toFixed(2)}℃`;
          tooltip.setAttribute('data-year', d.year);
          tooltip.style.display = 'block';
          tooltip.style.left = `${event.pageX + 10}px`;
          tooltip.style.top = `${event.pageY - 28}px`;
        })
        .on('mouseout', () => {
          document.getElementById('tooltip').style.display = 'none';
        });

      const legendWidth = 300;
      const legendHeight = 20;
      const legendColors = colorScale.range();
      const legendThreshold = d3.scaleThreshold()
        .domain([0, 1, 2, 3, 4].map(d => d * (d3.max(monthlyVariance, d => baseTemperature + d.variance) / 4)))
        .range(legendColors);

      const legend = d3.select('#legend')
        .append('svg')
        .attr('width', legendWidth)
        .attr('height', legendHeight);

      legend.selectAll('rect')
        .data(legendThreshold.range().map(color => {
          const d = legendThreshold.invertExtent(color);
          if (!d[0]) d[0] = legendThreshold.domain()[0];
          if (!d[1]) d[1] = legendThreshold.domain()[1];
          return d;
        }))
        .enter().append('rect')
        .attr('height', legendHeight)
        .attr('x', d => legendThreshold(d[0]))
        .attr('width', d => legendThreshold(d[1]) - legendThreshold(d[0]))
        .attr('fill', d => legendThreshold(d[0]));

      legend.append('text')
        .attr('class', 'caption')
        .attr('x', legendWidth / 2)
        .attr('y', -6)
        .attr('text-anchor', 'middle')
        .attr('fill', '#000')
        .text('Temperature (℃)');
    });
});
