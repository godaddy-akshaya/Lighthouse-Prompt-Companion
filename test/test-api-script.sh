# Put your SSO token in an env var once ⬇︎
export JWT_TOKEN=""

# ──────────────── GET endpoints ─────────────────

# 1. table-listing
curl -H "Authorization: sso-jwt $JWT_TOKEN" \
     https://4f4y1xez75.execute-api.us-west-2.amazonaws.com/dev

# 2. view-status
curl -H "Authorization: sso-jwt $JWT_TOKEN" \
     https://ys6kxhlx6f.execute-api.us-west-2.amazonaws.com/dev

# 3. table-filters  (add table_name query-param)
curl -H "Authorization: sso-jwt $JWT_TOKEN" \
     "https://o3un8ndnb8.execute-api.us-west-2.amazonaws.com/dev?table_name=sample_table"

# 4. view-results   (run_id query-param)
curl -H "Authorization: sso-jwt $JWT_TOKEN" \
     "https://9kj0a6h69a.execute-api.us-west-2.amazonaws.com/dev?run_id=demo"

# 5. view-summary   (run_id query-param)
curl -H "Authorization: sso-jwt $JWT_TOKEN" \
     "https://6n03hx5990.execute-api.us-west-2.amazonaws.com/dev?run_id=demo"

# 6. gdlh_get_interaction_ids
curl -H "Authorization: sso-jwt $JWT_TOKEN" \
     https://km6yahk783.execute-api.us-west-2.amazonaws.com/dev

# 7. dynamic-model-list
curl -H "Authorization: sso-jwt $JWT_TOKEN" \
     https://2yw3f4076j.execute-api.us-west-2.amazonaws.com/default/get_gdlh_model_list


# ──────────────── POST endpoints ────────────────
# (all send Content-Type: application/json)

# 8. row-count
curl -X POST -H "Authorization: sso-jwt $JWT_TOKEN" -H "Content-Type: application/json" \
     -d '{"table_name":"sample_table","filterOptions":[]}' \
     https://4qyj0h6rz2.execute-api.us-west-2.amazonaws.com/dev

# 9. row-count-2 (dev alias that hits gddeploy stage)
curl -X POST -H "Authorization: sso-jwt $JWT_TOKEN" -H "Content-Type: application/json" \
     -d '{"table_name":"sample_table","filterOptions":[]}' \
     https://0nc6ejrszd.execute-api.us-west-2.amazonaws.com/gddeploy

# 10. submit-job
curl -X POST -H "Authorization: sso-jwt $JWT_TOKEN" -H "Content-Type: application/json" \
     -d '{"table_name":"sample","user_id":"tester","run_id":"abc","model":"gpt","provider":"openai","prompt":"hello","count":1,"evaluation":false,"filterOptions":[]}' \
     https://eest1tmtp4.execute-api.us-west-2.amazonaws.com/dev

# 11. cancel-job
curl -X POST -H "Authorization: sso-jwt $JWT_TOKEN" -H "Content-Type: application/json" \
     -d '{"run_id":"abc","user_id":"tester"}' \
     https://hhlm0qg1c9.execute-api.us-west-2.amazonaws.com/dev

# 12. submit-summary-job
curl -X POST -H "Authorization: sso-jwt $JWT_TOKEN" -H "Content-Type: application/json" \
     -d '{"user_id":"tester","prompt":"summarize","model":"gpt","provider":"openai","table_name":"sample","filterOptions":[]}' \
     https://sfg8vqwjoj.execute-api.us-west-2.amazonaws.com/dev

# 13. gdlh_save_interaction_ids
curl -X POST -H "Authorization: sso-jwt $JWT_TOKEN" -H "Content-Type: application/json" \
     -d '{"user_id":"tester","interaction_ids":["foo","bar"]}' \
     https://byq18tmxu0.execute-api.us-west-2.amazonaws.com/dev

# 14. validate-lexical-query
curl -X POST -H "Authorization: sso-jwt $JWT_TOKEN" -H "Content-Type: application/json" \
     -d '{"action":"validate","query":"select *"}' \
     https://vhaj1p1m78.execute-api.us-west-2.amazonaws.com/dev

# 15. submit-lexical-query
curl -X POST -H "Authorization: sso-jwt $JWT_TOKEN" -H "Content-Type: application/json" \
     -d '{"action":"insert_query","query":"select *","query_name":"myQuery"}' \
     https://vhaj1p1m78.execute-api.us-west-2.amazonaws.com/dev

# 16. get-all-lexical-queries
curl -X POST -H "Authorization: sso-jwt $JWT_TOKEN" -H "Content-Type: application/json" \
     -d '{"action":"get_all"}' \
     https://vhaj1p1m78.execute-api.us-west-2.amazonaws.com/dev

# 17. delete-lexical-query
curl -X POST -H "Authorization: sso-jwt $JWT_TOKEN" -H "Content-Type: application/json" \
     -d '{"action":"delete_query","query_name":"myQuery"}' \
     https://vhaj1p1m78.execute-api.us-west-2.amazonaws.com/dev

# 18. get-lexical-query-hits  (uses gddeploy stage even in dev)
curl -X POST -H "Authorization: sso-jwt $JWT_TOKEN" -H "Content-Type: application/json" \
     -d '{"query":"select *"}' \
     https://fo4s1ll5eg.execute-api.us-west-2.amazonaws.com/gddeploy


# ──────────────────────────────── GETs ────────────────────────────────
curl -H "Authorization: sso-jwt $JWT_TOKEN" \
     https://lojoo506re.execute-api.us-west-2.amazonaws.com/gddeploy       # table-listing

curl -H "Authorization: sso-jwt $JWT_TOKEN" \
     https://x2x9swo6x5.execute-api.us-west-2.amazonaws.com/gddeploy       # view-status

curl -H "Authorization: sso-jwt $JWT_TOKEN" \
     "https://xk89vym7gd.execute-api.us-west-2.amazonaws.com/gddeploy?table_name=sample_table"  # table-filters

curl -H "Authorization: sso-jwt $JWT_TOKEN" \
     "https://nk7y0uidib.execute-api.us-west-2.amazonaws.com/gddeploy?run_id=demo"              # view-results

curl -H "Authorization: sso-jwt $JWT_TOKEN" \
     "https://jkb6iltdd7.execute-api.us-west-2.amazonaws.com/gddeploy?run_id=demo"              # view-summary

curl -H "Authorization: sso-jwt $JWT_TOKEN" \
     https://nnb0qzh6nc.execute-api.us-west-2.amazonaws.com/gddeploy       # gdlh_get_interaction_ids

curl -H "Authorization: sso-jwt $JWT_TOKEN" \
     https://r1edo1uwvc.execute-api.us-west-2.amazonaws.com/gddeploy       # dynamic-model-list

# ─────────────────────────────── POSTs ────────────────────────────────
curl -X POST -H "Authorization: sso-jwt $JWT_TOKEN" -H "Content-Type: application/json" \
     -d '{"table_name":"sample_table","filterOptions":[]}' \
     https://0nc6ejrszd.execute-api.us-west-2.amazonaws.com/gddeploy       # row-count

curl -X POST -H "Authorization: sso-jwt $JWT_TOKEN" -H "Content-Type: application/json" \
     -d '{"table_name":"sample","user_id":"tester","run_id":"abc","model":"gpt","provider":"openai","prompt":"hello","count":1,"evaluation":false,"filterOptions":[]}' \
     https://70bwwwm445.execute-api.us-west-2.amazonaws.com/gddeploy       # submit-job

curl -X POST -H "Authorization: sso-jwt $JWT_TOKEN" -H "Content-Type: application/json" \
     -d '{"run_id":"abc","user_id":"tester"}' \
     https://7y9v81tazb.execute-api.us-west-2.amazonaws.com/gddeploy       # cancel-job

curl -X POST -H "Authorization: sso-jwt $JWT_TOKEN" -H "Content-Type: application/json" \
     -d '{"user_id":"tester","prompt":"sum","model":"gpt","provider":"openai","table_name":"sample","filterOptions":[]}' \
     https://o4aj4d6r36.execute-api.us-west-2.amazonaws.com/gddeploy       # submit-summary-job

curl -X POST -H "Authorization: sso-jwt $JWT_TOKEN" -H "Content-Type: application/json" \
     -d '{"user_id":"tester","interaction_ids":["foo"]}' \
     https://shmuxe5fik.execute-api.us-west-2.amazonaws.com/gddeploy       # gdlh_save_interaction_ids

curl -X POST -H "Authorization: sso-jwt $JWT_TOKEN" -H "Content-Type: application/json" \
     -d '{"action":"validate","query":"select *"}' \
     https://4qwaataj57.execute-api.us-west-2.amazonaws.com/gddeploy       # validate-lexical-query

curl -X POST -H "Authorization: sso-jwt $JWT_TOKEN" -H "Content-Type: application/json" \
     -d '{"action":"insert_query","query":"select *","query_name":"myQuery"}' \
     https://ttgaka6m0f.execute-api.us-west-2.amazonaws.com/gddeploy       # submit-lexical-query

curl -X POST -H "Authorization: sso-jwt $JWT_TOKEN" -H "Content-Type: application/json" \
     -d '{"action":"get_all"}' \
     https://ttgaka6m0f.execute-api.us-west-2.amazonaws.com/gddeploy       # get-all-lexical-queries

curl -X POST -H "Authorization: sso-jwt $JWT_TOKEN" -H "Content-Type: application/json" \
     -d '{"action":"delete_query","query_name":"myQuery"}' \
     https://ttgaka6m0f.execute-api.us-west-2.amazonaws.com/gddeploy       # delete-lexical-query

curl -X POST -H "Authorization: sso-jwt $JWT_TOKEN" -H "Content-Type: application/json" \
     -d '{"query":"select *"}' \
     https://fo4s1ll5eg.execute-api.us-west-2.amazonaws.com/gddeploy       # get-lexical-query-hits
