BRANCH = main

# 日常運用：変更をコミット（make commit m="メッセージ"）
commit:
	git add .
	git commit -m "$(m)"

# 日常運用：push だけ
push:
	git push origin $(BRANCH)

.PHONY: init commit push