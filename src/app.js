const d3 = require('d3');
const topojson = require('topojson');
const versor = require('versor').default;
const Vue = require('vue');
const urls = require('./urls.js');
const categories = require('./legendCategories.js');

require('./background.js');

let curMatrix = { x: 0, y: 0, k: 1 };
let airportId = 42;
let vm;
let v0; // Mouse position in Cartesian coordinates at start of drag gesture.
let r0; // Projection rotation as Euler angles at start.
let q0; // Projection rotation as versor at start.
let land;
let locations;
let airportMarks;
let popularAirports;
let popularRoutes;
let autorotate;

const width = window.innerWidth;
const height = window.innerHeight;
const speed = -1e-2;
const start = Date.now();
const size = 0.875 * Math.min(width, height);
const grid = d3.geoGraticule();
const circle = d3.geoCircle();

const dragFn = d3
  .drag()
  .on('start', dragstarted)
  .on('drag', dragged)
  .on('end', dragended);

const zoomFn = d3
  .zoom()
  .scaleExtent([1, 5])
  .on('zoom', zoom);

const projection = d3
  .geoOrthographic()
  .scale(size / 2.1)
  .clipAngle(90)
  .translate([(width - 420) / 2, height / 2]);

const canvas = d3
  .select('canvas')
  .attr('width', width)
  .attr('height', height)
  .call(dragFn)
  .call(zoomFn)
  .on('click', clickBg)
  .on('mousemove', mousemove);

const context = canvas.node().getContext('2d');

const pathFn = d3
  .geoPath()
  .projection(projection)
  .context(context);
const colors = Object.values(categories).map(d => d.color);

const arc = d3
  .arc()
  .outerRadius(20)
  .innerRadius(12)
  .context(context);

const pie = d3.pie().sort(null);

function dragstarted() {
  const { x, y, k } = curMatrix;
  const t = d3.zoomIdentity.translate(x, y).scale(k);
  v0 = versor.cartesian(projection.invert(t.invert(d3.mouse(this))));
  r0 = projection.rotate();
  q0 = versor(r0);
  autorotate.stop();
}
function dragged() {
  const { x, y, k } = curMatrix;
  const t = d3.zoomIdentity.translate(x, y).scale(k);
  const v1 = versor.cartesian(
    projection.rotate(r0).invert(t.invert(d3.mouse(this)))
  );
  const q1 = versor.multiply(q0, versor.delta(v0, v1));
  const r1 = versor.rotation(q1);
  projection.rotate(r1);
  render();
}

function dragended() {
  render();
}

function zoom() {
  render();
}

function clickBg() {
  const { x, y, k } = curMatrix;
  const t = d3.zoomIdentity.translate(x, y).scale(k);
  const mouse = projection.invert(t.invert(d3.mouse(this)));
  let stop = false;
  const stream = projection.stream({
    point() {
      stop = true;
    }
  });
  stream.point(...mouse);
  if (!stop) {
    autorotate.restart(() => render(true));
  }
}

function mousemove() {
  if (!airportMarks) return;
  const { x, y, k } = curMatrix;
  const t = d3.zoomIdentity.translate(x, y).scale(k);
  const mouse = projection.invert(t.invert(d3.mouse(this)));
  const airportIndex = airportMarks.findIndex(p =>
    p.coordinates.find(c1 => inPolygon(c1, mouse))
  );
  if (airportIndex > -1 && airportId !== airportIndex) {
    vm.$data.airportId = airportIndex;
    airportId = airportIndex;
    render();
  }
}

function inPolygon(polygon, [px, py]) {
  const n = polygon.length;
  let [x0, y0] = polygon[n - 1];
  let inside = false;
  for (let i = 0; i < n; ++i) {
    const [x1, y1] = polygon[i];
    if (y1 > py !== y0 > py && px < (x0 - x1) * (py - y1) / (y0 - y1) + x1)
      inside = !inside;
    x0 = x1;
    y0 = y1;
  }
  return inside;
}

function getArcsForAirport(selectedAirPort) {
  return Object.values(popularRoutes).reduce((arr, r) => {
    if (r.from !== selectedAirPort) return arr;
    const from = popularAirports.find(d => d.iata === r.from);
    const to = popularAirports.find(d => d.iata === r.to);
    if (from && to) {
      arr.push([
        [+from.longitude, +from.latitude],
        [+to.longitude, +to.latitude]
      ]);
    }
    return arr;
  }, []);
}

function addPies(locations) {
  const stream = projection.stream({
    point(x, y) {
      const data = Object.values(vm.selectedAirportStats).map(d => d.pct);
      const arcs = pie(data);
      context.save();
      context.translate(x, y);

      arcs.forEach((d, i) => {
        context.beginPath();
        arc(d);
        context.fillStyle = colors[i];
        context.fill();
      });

      context.beginPath();
      arcs.forEach(arc);
      context.strokeStyle = '#fff';
      context.stroke();
      context.restore();
    }
  });

  locations.forEach(airportLoc => {
    stream.point(...airportLoc);
  });
}

function addPath(pathFn, data, lineWidth, strokeStyle, fillStyle) {
  context.beginPath();
  context.lineWidth = lineWidth;
  context.strokeStyle = strokeStyle;
  pathFn(data);
  context.stroke();
  if (fillStyle) {
    context.fillStyle = fillStyle;
    context.fill();
  }
}

function render(isSpinning) {
  const { x, y, k } = (d3.event || {}).transform || curMatrix;
  curMatrix = { x, y, k };

  context.clearRect(0, 0, width, height);
  context.save();
  context.translate(x, y);
  context.scale(k, k);

  const gridData = grid();

  const selectedAirPort = popularAirports[airportId].iata;
  const arcs = getArcsForAirport(selectedAirPort);
  const sphere = { type: 'Sphere' };
  const arcsData = { type: 'MultiLineString', coordinates: arcs };
  const airportMarkData = {
    type: 'GeometryCollection',
    geometries: airportMarks
  };

  addPath(pathFn, sphere, 2 / k, '#000', '#a9ccfb');
  addPath(pathFn, gridData, 1 / k, 'rgba(119,119,119,.5)');
  addPath(pathFn, land, 1 / k, '#000', '#ebe8df');
  addPath(pathFn, arcsData, 2 / k, 'rgba(0,100,0,.7)');
  addPath(pathFn, airportMarkData, 0.5 / k, '#f3f3f3', 'rgba(0,100,0,0.5)');
  addPies(locations);
  context.restore();

  if (isSpinning) {
    projection.rotate([speed * (Date.now() - start), -15]);
  }
}

d3
  .queue(4)
  .defer(d3.json, urls.world)
  .defer(d3.json, urls.bigairports)
  .defer(d3.csv, urls.airports)
  .defer(d3.csv, urls.routes)
  .await(ready);

function ready(error, ...data) {
  const [topo, bigAirports, airports, routes] = data;
  popularAirports = airports.filter(d => bigAirports.includes(d.iata));
  popularRoutes = routes
    .filter(
      r =>
        bigAirports.includes(r.destairport) &&
        bigAirports.includes(r.sourceairport)
    )
    .reduce((prev, cur) => {
      const key = `${cur.sourceairport}->${cur.destairport}`;
      if (!prev[key]) {
        prev[key] = { from: cur.sourceairport, to: cur.destairport };
      }
      return prev;
    }, []);
  locations = popularAirports.map(d => [+d.longitude, +d.latitude]);
  airportMarks = locations.map(loc => circle.radius(1).center(loc)());
  land = topojson.feature(topo, topo.objects.land);
  autorotate = d3.timer(() => render(true));

  // eslint-disable-next-line
  vm = new Vue({
    el: '#drawer',
    data: { airportId, categories },
    computed: {
      selectedAirportStats() {
        const r1 = Math.floor(10 * Math.random() + this.airportId / 50);
        const r2 = Math.floor(20 * Math.random() + this.airportId / 50);
        const r3 = Math.floor(30 * Math.random() + this.airportId / 50);
        return {
          delayedAc: { pct: r1 },
          delayedFalse: { pct: r2 },
          onTimeAc: { pct: r3 },
          onTimeFalse: {
            pct: 100 - r1 - r2 - r3
          }
        };
      },
      selectedAirport() {
        return popularAirports[this.airportId];
      },
      airportDelayList() {
        return bigAirports.map(d => ({
          iata: d,
          delaynum: Math.floor(100 * Math.random())
        }));
      },
      delayScale() {
        const max = Math.max(...this.airportDelayList.map(d => d.delaynum));
        return 300 / max;
      }
    }
  });
}
