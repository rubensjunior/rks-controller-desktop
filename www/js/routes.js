if (!dmx.routing) dmx.routing = {};
dmx.routing.router = 'hash';
dmx.routing.routes = [
  {
    "path": "/",
    "url": "./home.html"
  },
  {
    "path": "/interno/backoffice",
    "url": "../interno/backoffice.html",
    "name": "Backoffice"
  },
  {
    "path": "/interno/home",
    "url": "../interno/home.html",
    "name": "Dashboard"
  },
  {
    "path": "/interno/departamentos",
    "url": "../interno/departamentos.html",
    "name": "Departamentos"
  },
  {
    "path": "/interno/fornecedores",
    "url": "../interno/fornecedores.html",
    "name": "Fornecedores"
  },
  {
    "path": "/interno/fontes-financiamento",
    "url": "../interno/fontes-financiamento.html",
    "name": "Fontes de financiamento"
  },
  {
    "path": "/interno/usuarios-acessos",
    "url": "../interno/usuarios-acessos.html",
    "name": "Usuários e acessos"
  },
  {
    "path": "/interno/perfil-empresa",
    "url": "../interno/perfil-empresa.html",
    "name": "Perfil da empresa"
  }
]