if (!dmx.routing) dmx.routing = {};
dmx.routing.router = 'hash';
dmx.routing.routes = [
  {
    "path": "/",
    "url": "./home.html"
  },
  {
    "path": "/interno/backoffice",
    "url": "./interno/backoffice.html"
  },
  {
    "path": "/interno/home",
    "url": "../interno/home.html"
  },
  {
    "path": "/interno/departamentos",
    "url": "../interno/departamentos.html"
  }
]