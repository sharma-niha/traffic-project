export const intersections = [
  { id: 1, name: "NH-8 / Ring Road",     state: "green",  wait: 28, queue: 12 },
  { id: 2, name: "Sector-5 Crossing",    state: "red",    wait: 45, queue: 21 },
  { id: 3, name: "Airport Flyover",      state: "yellow", wait: 19, queue:  7 },
  { id: 4, name: "City Centre Square",   state: "green",  wait: 42, queue: 16 },
];

const cycle = ["green", "yellow", "red"];

export function nextState(state) {
  const i = cycle.indexOf(state);
  return cycle[(i + 1) % cycle.length];
}

export function simulateTick(data, density) {
  return data.map((x, i) => ({
    ...x,
    state:  i % 3 === 0 ? nextState(x.state) : x.state,
    wait:   Math.round(15 + density * 3 + Math.random() * 10),
    queue:  Math.round(5  + density * 2 + Math.random() * 5),
  }));
}

export function generateVolume(density) {
  return Math.round(100 + density * 8 + Math.random() * 20);
}