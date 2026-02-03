dmx.config({
  "index": {
    "localStorage": [
      {
        "type": "text",
        "name": "id"
      }
    ],
    "redirecionamento": {
      "meta": {},
      "local": [
        {
          "name": "",
          "type": "boolean",
          "metaData": {
            "condition": {}
          }
        }
      ]
    }
  },
  "backoffice": {
    "localStorage": [
      {
        "type": "text",
        "name": "id"
      }
    ]
  },
  "departamentos": {
    "repeat_departamentos": {
      "meta": [
        {
          "type": "text",
          "name": "dep_id"
        },
        {
          "type": "datetime",
          "name": "created_at"
        },
        {
          "type": "number",
          "name": "empresa_dep_ref"
        },
        {
          "type": "text",
          "name": "nome_departamento"
        },
        {
          "type": "text",
          "name": "descricao_departamento"
        }
      ],
      "outputType": "array"
    },
    "data_departamento": {
      "meta": [
        {
          "type": "text",
          "name": "dep_id"
        },
        {
          "type": "datetime",
          "name": "created_at"
        },
        {
          "type": "number",
          "name": "empresa_dep_ref"
        },
        {
          "type": "text",
          "name": "nome_departamento"
        },
        {
          "type": "text",
          "name": "descricao_departamento"
        }
      ],
      "outputType": "array"
    }
  }
});
