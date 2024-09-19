module.exports = {
  "query": {
    "query": {
      "bool": {
        "must": [
          {
            "match_phrase": {
              "customer_conversation": {
                "query": "shop around",
                "slop": 3
              }
            }
          },
          {
            "match_phrase": {
              "agent_conversation": {
                "query": "look other option",
                "slop": 3
              }
            }
          },
          {
            "match_phrase": {
              "customer_conversation": {
                "query": "check price today",
                "slop": 2
              }
            }
          },
          {
            "match_phrase": {
              "agent_conversation": {
                "query": "gave think about",
                "slop": 4
              }
            }
          },
          {
            "match_phrase": {
              "customer_conversation": {
                "query": "explore my options",
                "slop": 3
              }
            }
          }
        ],
        "must_not": [
          {
            "match_phrase": {
              "customer_conversation": {
                "query": "refund"
              }
            }
          },
          {
            "match_phrase": {
              "agent_conversation": {
                "query": "fix issue"
              }
            }
          }
        ],
        "filter": [
          {
            "term": {
              "interaction_type": "speech"
            }
          },
          {
            "range": {
              "interaction_date": {
                "gte": "2023-01-01",
                "lte": "2023-12-31"
              }
            }
          }
        ]
      }
    }
  }
};

