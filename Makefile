REMOTE = git@github.com:st-1989/needs2.git
BRANCH = main

# 初回だけ実行：ブランチ名変更 → origin 登録 → 初回 push
init:
	git branch -M $(BRANCH)
	@if ! git remote | grep -q origin; then git remote add origin $(REMOTE); fi
	git push -u origin $(BRANCH)

# 日常運用：変更をコミット（make commit m="メッセージ"）
commit:
	git add .
	git commit -m "$(m)"

# 日常運用：push だけ
push:
	git push origin $(BRANCH)

PYTHON := python
SCRIPT := src/randomized_network_LSCC/randomize_parallel.py
INPUT_DIR := data/processed/randomized_network_LSCC/edge_list_G_subs
OUT_DIR := results/randomized_network_LSCC

.PHONY: init commit push